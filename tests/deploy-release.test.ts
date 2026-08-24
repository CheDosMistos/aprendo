import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, readlinkSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const activateScript = resolve('ops/activate-release.sh');
const backupHelper = resolve('ops/backup-sqlite.py');

function createRelease(root: string, name: string, healthy: boolean, mutateDb = false): string {
  const release = join(root, 'releases', name);
  mkdirSync(join(release, 'server'), { recursive: true });
  writeFileSync(join(release, 'server', 'entry.mjs'), '// fixture\n');
  writeFileSync(join(release, 'package.json'), '{}\n');
  writeFileSync(join(release, 'package-lock.json'), '{"lockfileVersion":3}\n');
  if (healthy) writeFileSync(join(release, 'healthy'), 'yes\n');
  if (mutateDb) writeFileSync(join(release, 'mutate-db'), 'yes\n');
  return release;
}

function createWrappers(root: string, dbPath: string): { systemctl: string; health: string } {
  const state = join(root, 'service-state');
  writeFileSync(state, 'active\n');
  const systemctl = join(root, 'fake-systemctl.sh');
  writeFileSync(systemctl, `#!/usr/bin/env bash\nset -euo pipefail\ncmd="$1"\nstate=${JSON.stringify(state)}\nruntime=${JSON.stringify(join(root, 'runtime'))}\ndb=${JSON.stringify(dbPath)}\ncase "$cmd" in\n  stop) printf 'inactive\\n' > "$state" ;;\n  start)\n    printf 'active\\n' > "$state"\n    target="$(readlink -f "$runtime" 2>/dev/null || true)"\n    if [ -n "$target" ] && [ -f "$target/mutate-db" ]; then\n      python3 - "$db" <<'PY'\nimport sqlite3, sys\ndb = sqlite3.connect(sys.argv[1])\ndb.execute("UPDATE proof SET value = 'migrated'")\ndb.commit()\ndb.close()\nPY\n    fi\n    ;;\n  is-active) grep -q '^active$' "$state" ;;\n  *) exit 2 ;;\nesac\n`);
  chmodSync(systemctl, 0o755);

  const health = join(root, 'fake-health.sh');
  writeFileSync(health, `#!/usr/bin/env bash\nset -euo pipefail\ntarget="$(readlink -f ${JSON.stringify(join(root, 'runtime'))} 2>/dev/null || true)"\ntest -n "$target"\ntest -f "$target/healthy"\n`);
  chmodSync(health, 0o755);
  return { systemctl, health };
}

function baseEnv(root: string, dbPath: string, wrappers: { systemctl: string; health: string }): NodeJS.ProcessEnv {
  return {
    ...process.env,
    APRENDO_ROOT: root,
    APRENDO_DATA_DIR: join(root, 'data'),
    APRENDO_DB_PATH: dbPath,
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

test('release activation converts the legacy runtime directory to an atomic symlink', () => {
  const root = mkdtempSync(join(tmpdir(), 'aprendo-deploy-success-'));
  const runtime = join(root, 'runtime');
  mkdirSync(join(runtime, 'server'), { recursive: true });
  writeFileSync(join(runtime, 'server', 'entry.mjs'), '// old\n');
  writeFileSync(join(runtime, 'healthy'), 'yes\n');
  const next = createRelease(root, 'release-ok', true);
  const dbPath = join(root, 'data', 'aprendo.sqlite');
  createDatabase(dbPath, 'old');
  const wrappers = createWrappers(root, dbPath);

  execFileSync('bash', [activateScript, 'release-ok'], {
    env: baseEnv(root, dbPath, wrappers),
    stdio: 'pipe',
  });

  assert.equal(resolve(readlinkSync(runtime)), next);
  assert.equal(readDatabase(dbPath), 'old');
});

test('failed release health rolls code and SQLite back together', () => {
  const root = mkdtempSync(join(tmpdir(), 'aprendo-deploy-rollback-'));
  const oldRelease = createRelease(root, 'release-old', true);
  const runtime = join(root, 'runtime');
  execFileSync('ln', ['-s', oldRelease, runtime]);
  createRelease(root, 'release-bad', false, true);
  const dbPath = join(root, 'data', 'aprendo.sqlite');
  createDatabase(dbPath, 'old');
  const wrappers = createWrappers(root, dbPath);

  const result = spawnSync('bash', [activateScript, 'release-bad'], {
    env: baseEnv(root, dbPath, wrappers),
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.equal(resolve(readlinkSync(runtime)), oldRelease);
  assert.equal(readDatabase(dbPath), 'old');
});
