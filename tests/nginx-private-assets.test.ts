import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const script = resolve('ops/configure-nginx-platform-proxy.py');

function fixture(): string {
  return `server {
    listen 80;
    server_name aprendo.molacomer.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name aprendo.molacomer.com;
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;

    location /api/ {
        proxy_pass http://127.0.0.1:4321;
    }

    location / {
        auth_request /__aprendo_session_check;
        error_page 401 = @aprendo_login_redirect;
        proxy_pass http://127.0.0.1:4321;
    }

    # BEGIN APRENDO APP AUTH
    location = /__aprendo_session_check {
        internal;
        proxy_pass http://127.0.0.1:4321/api/auth/check/;
    }
    location @aprendo_login_redirect {
        return 303 /login/;
    }
    # END APRENDO APP AUTH
}
`;
}

test('Nginx protects course notation and materials without restoring global auth_request', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aprendo-nginx-private-assets-'));
  const path = join(dir, 'site.conf');
  writeFileSync(path, fixture());

  execFileSync('python3', [script, path]);
  const once = readFileSync(path, 'utf8');

  assert.match(once, /auth_basic off;/);
  assert.doesNotMatch(once, /auth_basic_user_file/);
  assert.doesNotMatch(once, /__aprendo_session_check/);
  assert.match(once, /location \^~ \/bateria\/notation\//);
  assert.match(once, /location \^~ \/bateria\/materiales\//);
  assert.match(once, /auth_request \/__aprendo_private_asset_session_check;/);
  assert.match(once, /proxy_pass http:\/\/127\.0\.0\.1:4321\/api\/auth\/check\//);
  assert.match(once, /error_page 401 = @aprendo_private_asset_login_redirect;/);

  const root = once.match(/location \/ \{(?<body>[\s\S]*?)\n\s*\}/)?.groups?.body ?? '';
  assert.doesNotMatch(root, /auth_request/);

  execFileSync('python3', [script, path]);
  assert.equal(readFileSync(path, 'utf8'), once, 'configuration must remain idempotent');
});
