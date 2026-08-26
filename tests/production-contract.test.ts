import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const verifier = resolve('ops/verify-production-contract.sh');

function fixture(privateAssets = true, adminCredential = true, schemaVersion = 9) {
  const root = mkdtempSync(join(tmpdir(), 'aprendo-production-contract-'));
  const runtime = join(root, 'runtime');
  const release = join(runtime, 'releases', 'fixture-sha');
  mkdirSync(join(release, 'server'), { recursive: true });
  writeFileSync(join(release, 'server', 'entry.mjs'), '// fixture\n');
  writeFileSync(join(release, 'package.json'), '{}\n');
  writeFileSync(join(release, 'package-lock.json'), '{"lockfileVersion":3}\n');
  symlinkSync(release, join(runtime, 'current'));

  const nodeBin = join(root, 'node');
  writeFileSync(nodeBin, '#!/usr/bin/env bash\nexit 0\n');
  chmodSync(nodeBin, 0o755);

  const dbPath = join(root, 'aprendo.sqlite');
  const database = new DatabaseSync(dbPath);
  database.exec(`
    CREATE TABLE app_users (
      stable_key TEXT NOT NULL,
      username TEXT,
      role TEXT NOT NULL,
      password_hash TEXT
    );
    CREATE TABLE schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);
  database.prepare(`
    INSERT INTO app_users (stable_key, username, role, password_hash)
    VALUES ('default', 'mallo', 'admin', ?)
  `).run(adminCredential ? 'scrypt$fixture' : null);
  database.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)')
    .run(schemaVersion, 'fixture');
  database.close();

  const systemctl = join(root, 'systemctl');
  writeFileSync(systemctl, `#!/usr/bin/env bash
set -euo pipefail
if [ "$1" = "is-active" ]; then exit 0; fi
if [ "$1" = "show" ] && [ "$2" = "--property=FragmentPath" ]; then echo /etc/systemd/system/aprendo.service; exit 0; fi
if [ "$1" = "show" ] && [ "$2" = "--property=ExecStart" ]; then echo ${nodeBin} /opt/aprendo/runtime/server/entry.mjs; exit 0; fi
exit 2
`);
  chmodSync(systemctl, 0o755);

  const health = join(root, 'health');
  writeFileSync(health, '#!/usr/bin/env bash\nexit 0\n');
  chmodSync(health, 0o755);

  const nginx = join(root, 'nginx.txt');
  writeFileSync(nginx, `server {
  listen 443 ssl;
  server_name aprendo.molacomer.com;
  location / { proxy_pass http://127.0.0.1:4321; }
  ${privateAssets ? 'location ^~ /bateria/notation/ { auth_request /__aprendo_private_asset_session_check; }\n  location ^~ /bateria/materiales/ { auth_request /__aprendo_private_asset_session_check; }' : ''}
}
`);

  return {
    env: {
      ...process.env,
      APRENDO_RUNTIME_DIR: runtime,
      APRENDO_CURRENT_LINK: join(runtime, 'current'),
      APRENDO_NODE_BIN: nodeBin,
      APRENDO_DB_PATH: dbPath,
      APRENDO_SYSTEMCTL_BIN: systemctl,
      APRENDO_HEALTHCHECK_BIN: health,
      APRENDO_NGINX_DUMP_FILE: nginx,
    },
  };
}

test('production contract verifier accepts the expected runtime, credential, schema and proxy shape', () => {
  const { env } = fixture(true, true, 9);
  const result = spawnSync('bash', [verifier], { env, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /production contract verified/i);
});

test('production contract verifier rejects a proxy that exposes private course assets', () => {
  const { env } = fixture(false, true, 9);
  const result = spawnSync('bash', [verifier], { env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /notation assets are not protected/i);
});

test('production contract verifier rejects a default admin without a usable credential', () => {
  const { env } = fixture(true, false, 9);
  const result = spawnSync('bash', [verifier], { env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /credential or database schema is not deployment-ready/i);
});

test('production contract verifier rejects a stale database schema', () => {
  const { env } = fixture(true, true, 8);
  const result = spawnSync('bash', [verifier], { env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /credential or database schema is not deployment-ready/i);
});
