#!/usr/bin/env bash
set -Eeuo pipefail

runtime_dir="${APRENDO_RUNTIME_DIR:-/opt/aprendo/runtime}"
current_link="${APRENDO_CURRENT_LINK:-$runtime_dir/current}"
node_bin="${APRENDO_NODE_BIN:-/opt/aprendo-node/bin/node}"
db_path="${APRENDO_DB_PATH:-/var/lib/aprendo/aprendo.sqlite}"
service_name="${APRENDO_SERVICE_NAME:-aprendo.service}"
health_url="${APRENDO_HEALTH_URL:-http://127.0.0.1:4321/api/health/}"
systemctl_bin="${APRENDO_SYSTEMCTL_BIN:-/usr/bin/systemctl}"
healthcheck_bin="${APRENDO_HEALTHCHECK_BIN:-}"
nginx_dump_file="${APRENDO_NGINX_DUMP_FILE:-}"
expected_schema_version="${APRENDO_EXPECTED_SCHEMA_VERSION:-9}"

fail() {
  printf 'production contract violation: %s\n' "$1" >&2
  exit 1
}

[ -x "$node_bin" ] || fail "Node runtime is missing or not executable: $node_bin"
[ -d "$runtime_dir" ] || fail "runtime directory is missing: $runtime_dir"
[ -L "$current_link" ] || fail "current release is not an atomic symlink: $current_link"
current_release="$(readlink -f "$current_link")"
case "$current_release" in
  "$runtime_dir"/releases/*) ;;
  *) fail "current release points outside $runtime_dir/releases" ;;
esac
[ -f "$current_release/server/entry.mjs" ] || fail "current release has no server entry"
[ -f "$current_release/package.json" ] || fail "current release has no package.json"
[ -f "$current_release/package-lock.json" ] || fail "current release has no package-lock.json"
[ -f "$db_path" ] || fail "SQLite database is missing: $db_path"

if ! /usr/bin/python3 - "$db_path" "$expected_schema_version" <<'PY'
import sqlite3
import sys

path = sys.argv[1]
expected_schema_version = int(sys.argv[2])
connection = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
try:
    row = connection.execute(
        """
        SELECT username, password_hash
        FROM app_users
        WHERE stable_key = 'default' AND role = 'admin'
        LIMIT 1
        """
    ).fetchone()
    schema = connection.execute(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations"
    ).fetchone()
finally:
    connection.close()

if not row or not row[0] or not row[1] or not str(row[1]).startswith('scrypt$'):
    raise SystemExit(1)
if not schema or int(schema[0]) < expected_schema_version:
    raise SystemExit(2)
PY
then
  fail "default administrator credential or database schema is not deployment-ready"
fi

"$systemctl_bin" is-active --quiet "$service_name" || fail "$service_name is not active"
fragment="$($systemctl_bin show --property=FragmentPath --value "$service_name")"
[ -n "$fragment" ] || fail "$service_name has no systemd unit fragment"
exec_start="$($systemctl_bin show --property=ExecStart --value "$service_name")"
printf '%s\n' "$exec_start" | grep -Fq "$node_bin" || fail "systemd ExecStart does not use the pinned Node runtime"
printf '%s\n' "$exec_start" | grep -Eq '/opt/aprendo/runtime/(server|current/server)/entry\.mjs' || fail "systemd ExecStart does not use the stable Aprendo runtime path"

if [ -n "$healthcheck_bin" ]; then
  "$healthcheck_bin" "$health_url" || fail "runtime health check failed"
else
  response="$(curl --fail --silent --show-error --max-time 3 "$health_url")" || fail "runtime health endpoint is unavailable"
  printf '%s\n' "$response" | grep -q '"status":"ok"' || fail "runtime health response is not ok"
fi

# Nginx is stable host infrastructure, not release-scoped application state.
# Unit tests can still validate its expected shape by supplying an explicit
# dump, while production verifies the observable HTTPS boundary separately.
if [ -n "$nginx_dump_file" ]; then
  nginx_dump="$(cat "$nginx_dump_file")"
  printf '%s\n' "$nginx_dump" | grep -Eq 'server_name[[:space:]]+[^;]*aprendo\.molacomer\.com' || fail "Nginx has no Aprendo server_name"
  printf '%s\n' "$nginx_dump" | grep -Eq 'listen[[:space:]]+[^;]*443' || fail "Nginx has no HTTPS listener for the effective configuration"
  printf '%s\n' "$nginx_dump" | grep -Fq 'proxy_pass http://127.0.0.1:4321;' || fail "Nginx does not proxy to the Aprendo runtime"
  printf '%s\n' "$nginx_dump" | grep -Fq 'location ^~ /bateria/notation/' || fail "notation assets are not protected at the proxy boundary"
  printf '%s\n' "$nginx_dump" | grep -Fq 'location ^~ /bateria/materiales/' || fail "course materials are not protected at the proxy boundary"
  printf '%s\n' "$nginx_dump" | grep -Fq 'auth_request /__aprendo_private_asset_session_check;' || fail "private course assets are missing session checks"
fi

printf 'Aprendo production contract verified for %s\n' "$current_release"
