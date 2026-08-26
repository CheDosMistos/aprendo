import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, readlinkSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const activateScript = resolve('ops/activate-release.sh');
const rollbackScript = resolve('ops/rollback-release.sh');
const backupHelper = resolve('ops/backup-sqlite.py');

function createRelease(runtime: string, name: string, healthy: boolean, mutateData = false): string {
  const release = join(runtime, 'releases', name);
  mkdirSync(join(release, 'server'), { recursive: true });
  writeFileSync(join(release, 'server', 'entry.mjs'), '// fixture\n');
  writeFileSync(join(release, 'package.json'), '{}\n');
  writeFileSync(join(release, 'package-lock.json'), '{"lockfileVersion":3}\n');
  if (healthy) writeFileSync(join(release, 'healthy'), 'yes\n');
  if (mutateData) writeFileSync(join(release, 'mutate-data'), 'yes\n');
  return release;
}

function createWrappers(root: string, runtime: string, dbPath: string, avatarFile: string): { systemctl: string; health: string } {
  const state = join(root, 'service-state');
  writeFileSync(state, 'active\n');
  const systemctl = join(root, 'fake-systemctl.sh');
  writeFileSync(systemctl, `#!/usr/bin/env bash\nset -euo pipefail\ncmd="$1"\nstate=${JSON.stringify(state)}\ncurrent=${JSON.stringify(join(runtime, 'current'))}\ndb=${JSON.stringify(dbPath)}\navatar=${JSON.stringify(avatarFile)}\nactivate_current() {\n  printf 'active\\n' > "$state"\n  target="$(readlink -f "$current" 2>/dev/null || true)"\n  if [ -n "$target" ] && [ -f "$target/mutate-data" ]; then\n    python3 - "$db" <<'PY'\nimport sqlite3, sys\ndb = sqlite3.connect(sys.argv[1])\ndb.execute("UPDATE proof SET value = 'migrated'")\ndb.commit()\ndb.close()\nPY\n    mkdir -p "$(dirname "$avatar")"\n    printf 'new-avatar\\n' > "$avatar"\n  fi\n}\ncase "$cmd" in\n  restart|start) activate_current ;;\n  is-active) grep -q '^active$' "$state" ;;\n  stop) echo 'stop must not be used by deploy activation' >&2; exit 77 ;;\n  *) exit 2 ;;\nesac\n`);
  chmodSync(systemctl, 0o755);

  const health = join(root, 'fake-health.sh');
  writeFileSync(health, `#!/usr/bin/env bash\nset -euo pipefail\ntarget="$(readlink -f ${JSON.stringify(join(runtime, 'current'))} 2>/dev/null || true)"\ntest -n "$target"\ntest -f "$target/healthy"\n`);
  chmodSync(health, 0o755);
  return { systemctl, health };
}

function baseEnv(runtime: string, dbPath: string, avatarDir: string, wrappers: { systemctl: string; health: string }): NodeJS.ProcessEnv {
  return {
    ...process.env,
    APRENDO_RUNTIME_DIR: runtime,
    APRENDO_DATA_DIR: resolve(dbPath, '..'),
    APRENDO_DB_PATH: dbPath,
    APRENDO_AVATAR_DIR: avatarDir,
    APRENDO_BACKUP_HELPER: backupHelper,
    APRENDO_SYSTEMCTL_WRAPPER: wrappers.systemctl,
    APRENDO_HEALTHCHECK_WRAPPER: wrappers.health,
    APRENDO_HEALTH_ATTEMPTS: '1',
    APRENDO_HEALTH_SLEEP_SECONDS: '0',
  };
}

function createDatabase(path: string, value: string): void {
  mkdirSync(resolve(path, '..'), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('CREATE TABLE proof (value TEXT NOT NULL)');
  db.prepare('INSERT INTO proof VALUES (?)').run(value);
  db.close();
}

function readDatabase(path: string): string {
  const db = new DatabaseSync(path);
  try {
    return (db.prepare('SELECT value FROM proof').get() as { value: string }).value;
  } finally {
    db.close();
  }
}

function createAvatar(avatarDir: string, value = 'old-avatar\n'): string {
  mkdirSync(avatarDir, { recursive: true });
  const avatarFile = join(avatarDir, '1.webp');
  writeFileSync(avatarFile, value);
  return avatarFile;
}

test('release activation converts the legacy mutable runtime and snapshots SQLite with avatars', () => {
  const root = mkdtempSync(join(tmpdir(), 'aprendo-deploy-success-'));
  const runtime = join(root, 'runtime');
  mkdirSync(join(runtime, 'server'), { recursive: true });
  writeFileSync(join(runtime, 'server', 'entry.mjs'), '// old\n');
  writeFileSync(join(runtime, 'healthy'), 'yes\n');
  const next = createRelease(runtime, 'release-ok', true);
  const dataDir = join(root, 'data');
  const dbPath = join(dataDir, 'aprendo.sqlite');
  const avatarDir = join(dataDir, 'avatars');
  createDatabase(dbPath, 'old');
  const avatarFile = createAvatar(avatarDir);
  const wrappers = createWrappers(root, runtime, dbPath, avatarFile);

  execFileSync('bash', [activateScript, 'release-ok'], {
    env: baseEnv(runtime, dbPath, avatarDir, wrappers),
    stdio: 'pipe',
  });

  assert.equal(resolve(readlinkSync(join(runtime, 'current'))), next);
  assert.equal(readlinkSync(join(runtime, 'server')), 'current/server');
  assert.equal(readDatabase(dbPath), 'old');
  assert.equal(existsSync(join(runtime, '.rollback-target')), true);

  const backupDir = join(dataDir, 'backups');
  const databaseBackups = readdirSync(backupDir).filter((name) => name.endsWith('.sqlite'));
  const avatarBackups = readdirSync(backupDir).filter((name) => name.endsWith('.avatars'));
  assert.equal(databaseBackups.length, 1);
  assert.equal(avatarBackups.length, 1);
  assert.equal(readFileSync(join(backupDir, avatarBackups[0], '1.webp'), 'utf8'), 'old-avatar\n');
});

test('failed release health rolls code back, retains the pre-deploy snapshot and removes the failed release', () => {
  const root = mkdtempSync(join(tmpdir(), 'aprendo-deploy-rollback-'));
  const runtime = join(root, 'runtime');
  mkdirSync(runtime, { recursive: true });
  const oldRelease = createRelease(runtime, 'release-old', true);
  execFileSync('ln', ['-s', oldRelease, join(runtime, 'current')]);
  execFileSync('ln', ['-s', 'current/server', join(runtime, 'server')]);
  const badRelease = createRelease(runtime, 'release-bad', false, true);
  const dataDir = join(root, 'data');
  const dbPath = join(dataDir, 'aprendo.sqlite');
  const avatarDir = join(dataDir, 'avatars');
  createDatabase(dbPath, 'old');
  const avatarFile = createAvatar(avatarDir);
  const wrappers = createWrappers(root, runtime, dbPath, avatarFile);

  const result = spawnSync('bash', [activateScript, 'release-bad'], {
    env: baseEnv(runtime, dbPath, avatarDir, wrappers),
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.equal(resolve(readlinkSync(join(runtime, 'current'))), oldRelease);
  assert.equal(existsSync(badRelease), false);
  assert.equal(existsSync(join(runtime, '.rollback-target')), false);

  // A running SQLite database is never overwritten during rollback. Migrations
  // therefore must be backward-compatible with the previous release.
  assert.equal(readDatabase(dbPath), 'migrated');
  assert.equal(readFileSync(avatarFile, 'utf8'), 'new-avatar\n');

  const backupDir = join(dataDir, 'backups');
  const databaseBackup = readdirSync(backupDir).find((name) => name.endsWith('.sqlite'));
  const avatarBackup = readdirSync(backupDir).find((name) => name.endsWith('.avatars'));
  assert.ok(databaseBackup);
  assert.ok(avatarBackup);
  assert.equal(readDatabase(join(backupDir, databaseBackup)), 'old');
  assert.equal(readFileSync(join(backupDir, avatarBackup, '1.webp'), 'utf8'), 'old-avatar\n');
});

test('explicit final verification rollback restores the previous healthy release and removes the rejected release', () => {
  const root = mkdtempSync(join(tmpdir(), 'aprendo-deploy-final-rollback-'));
  const runtime = join(root, 'runtime');
  mkdirSync(runtime, { recursive: true });
  const oldRelease = createRelease(runtime, 'release-old', true);
  const nextRelease = createRelease(runtime, 'release-next', true);
  execFileSync('ln', ['-s', oldRelease, join(runtime, 'current')]);
  execFileSync('ln', ['-s', 'current/server', join(runtime, 'server')]);

  const dataDir = join(root, 'data');
  const dbPath = join(dataDir, 'aprendo.sqlite');
  const avatarDir = join(dataDir, 'avatars');
  createDatabase(dbPath, 'old');
  const avatarFile = createAvatar(avatarDir);
  const wrappers = createWrappers(root, runtime, dbPath, avatarFile);
  const env = baseEnv(runtime, dbPath, avatarDir, wrappers);

  execFileSync('bash', [activateScript, 'release-next'], { env, stdio: 'pipe' });
  assert.equal(resolve(readlinkSync(join(runtime, 'current'))), nextRelease);
  assert.equal(existsSync(join(runtime, '.rollback-target')), true);

  execFileSync('bash', [rollbackScript, 'release-next'], { env, stdio: 'pipe' });

  assert.equal(resolve(readlinkSync(join(runtime, 'current'))), oldRelease);
  assert.equal(existsSync(nextRelease), false);
  assert.equal(existsSync(join(runtime, '.rollback-target')), false);
});