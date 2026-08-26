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

if ! /usr/bin/python3 - "$db_path" <<'PY'
import sqlite3
import sys

path = sys.argv[1]
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
finally:
    connection.close()

if not row or not row[0] or not row[1] or not str(row[1]).startswith('scrypt$'):
    raise SystemExit(1)
PY
then
  fail "default administrator has no usable credential"
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

if [ -n "$nginx_dump_file" ]; then
  nginx_dump="$(cat "$nginx_dump_file")"
else
  nginx_dump="$(sudo -n /usr/sbin/nginx -T 2>&1)" || fail "cannot read effective Nginx configuration"
fi

printf '%s\n' "$nginx_dump" | grep -Eq 'server_name[[:space:]]+[^;]*aprendo\.molacomer\.com' || fail "Nginx has no Aprendo server_name"
printf '%s\n' "$nginx_dump" | grep -Eq 'listen[[:space:]]+[^;]*443' || fail "Nginx has no HTTPS listener for the effective configuration"
printf '%s\n' "$nginx_dump" | grep -Fq 'proxy_pass http://127.0.0.1:4321;' || fail "Nginx does not proxy to the Aprendo runtime"
printf '%s\n' "$nginx_dump" | grep -Fq 'location ^~ /bateria/notation/' || fail "notation assets are not protected at the proxy boundary"
printf '%s\n' "$nginx_dump" | grep -Fq 'location ^~ /bateria/materiales/' || fail "course materials are not protected at the proxy boundary"
printf '%s\n' "$nginx_dump" | grep -Fq 'auth_request /__aprendo_private_asset_session_check;' || fail "private course assets are missing session checks"

printf 'Aprendo production contract verified for %s\n' "$current_release"
