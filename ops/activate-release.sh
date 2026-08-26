#!/usr/bin/env bash
set -Eeuo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: activate-release.sh RELEASE_SHA" >&2
  exit 2
fi

release_sha="$1"
case "$release_sha" in
  *[!A-Za-z0-9._-]*|'') echo "invalid release identifier" >&2; exit 2 ;;
esac

runtime_dir="${APRENDO_RUNTIME_DIR:-/opt/aprendo/runtime}"
releases_dir="${APRENDO_RELEASES_DIR:-$runtime_dir/releases}"
current_link="${APRENDO_CURRENT_LINK:-$runtime_dir/current}"
server_link="${APRENDO_SERVER_LINK:-$runtime_dir/server}"
data_dir="${APRENDO_DATA_DIR:-/var/lib/aprendo}"
db_path="${APRENDO_DB_PATH:-$data_dir/aprendo.sqlite}"
avatar_dir="${APRENDO_AVATAR_DIR:-$data_dir/avatars}"
backup_dir="${APRENDO_BACKUP_DIR:-$data_dir/backups}"
backup_helper="${APRENDO_BACKUP_HELPER:-/tmp/aprendo-backup-sqlite.py}"
release="$releases_dir/$release_sha"
service_wrapper="${APRENDO_SYSTEMCTL_WRAPPER:-}"
health_wrapper="${APRENDO_HEALTHCHECK_WRAPPER:-}"
service_name="${APRENDO_SERVICE_NAME:-aprendo.service}"
health_url="${APRENDO_HEALTH_URL:-http://127.0.0.1:4321/api/health/}"
health_attempts="${APRENDO_HEALTH_ATTEMPTS:-10}"
health_sleep="${APRENDO_HEALTH_SLEEP_SECONDS:-1}"

run_systemctl() {
  if [ -n "$service_wrapper" ]; then
    "$service_wrapper" "$@"
  else
    sudo -n /usr/bin/systemctl "$@"
  fi
}

health_ok() {
  if [ -n "$health_wrapper" ]; then
    "$health_wrapper" "$health_url"
    return
  fi
  response="$(curl --fail --silent --show-error --max-time 3 "$health_url")" || return 1
  printf '%s\n' "$response" | grep -q '"status":"ok"'
}

wait_for_health() {
  local attempt
  for ((attempt = 1; attempt <= health_attempts; attempt += 1)); do
    if run_systemctl is-active --quiet "$service_name" && health_ok; then
      return 0
    fi
    sleep "$health_sleep"
  done
  return 1
}

switch_current() {
  local target="$1"
  local next_link="$runtime_dir/.current-next-$$"
  rm -f "$next_link"
  ln -s "$target" "$next_link"
  mv -Tf "$next_link" "$current_link"
}

ensure_server_link() {
  if [ -L "$server_link" ]; then
    return 0
  fi
  if [ -e "$server_link" ]; then
    echo "server path is not a symlink after legacy migration" >&2
    return 1
  fi
  ln -s current/server "$server_link"
}

mkdir -p "$runtime_dir" "$releases_dir" "$backup_dir"
test -w "$runtime_dir"
test -d "$release"
test -f "$release/server/entry.mjs"
test -f "$release/package.json"
test -f "$release/package-lock.json"

previous=""
if [ -L "$current_link" ]; then
  previous="$(readlink -f "$current_link")"
elif [ -e "$current_link" ]; then
  echo "current path exists but is not a symlink" >&2
  exit 1
fi

backup=""
avatar_backup=""
switched=0

rollback() {
  local status=$?
  trap - ERR
  set +e

  if [ "$switched" -eq 1 ] && [ -n "$previous" ] && [ -d "$previous" ]; then
    switch_current "$previous"
    if [ ! -L "$server_link" ] && [ -e "$server_link" ]; then
      rm -rf -- "$server_link"
    fi
    ensure_server_link
    run_systemctl restart "$service_name"
    wait_for_health || true
  fi

  current="$(readlink -f "$current_link" 2>/dev/null || true)"
  if [ -d "$release" ] && [ "$release" != "$current" ] && [ "$release" != "$previous" ]; then
    rm -rf -- "$release"
  fi

  exit "$status"
}
trap rollback ERR

# Snapshot persistent state while the current process remains online. SQLite's
# backup API provides a coherent database copy. Deployment migrations are
# required to remain backward-compatible so code rollback never rewrites a
# live database underneath a running process.
if [ -f "$db_path" ]; then
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup_prefix="$backup_dir/pre-deploy-${release_sha:0:12}-${stamp}"
  backup="$backup_prefix.sqlite"
  avatar_backup="$backup_prefix.avatars"
  /usr/bin/python3 "$backup_helper" "$db_path" "$backup"
  test -s "$backup"
  rm -rf -- "$avatar_backup"
  mkdir -p "$avatar_backup"
  if [ -d "$avatar_dir" ]; then
    cp -a "$avatar_dir"/. "$avatar_backup"/
  fi
  test -d "$avatar_backup"
fi

# One-time conversion of the historical mutable runtime into an immutable legacy release.
# The old Node process can keep serving from its already-open files until the
# controlled restart below.
if [ -z "$previous" ]; then
  legacy="$releases_dir/legacy-$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir "$legacy"
  shopt -s dotglob nullglob
  for item in "$runtime_dir"/*; do
    [ "$item" = "$releases_dir" ] && continue
    [ "$item" = "$current_link" ] && continue
    cp -a "$item" "$legacy/"
  done
  shopt -u dotglob nullglob
  test -f "$legacy/server/entry.mjs"
  previous="$legacy"

  shopt -s dotglob nullglob
  for item in "$runtime_dir"/*; do
    [ "$item" = "$releases_dir" ] && continue
    [ "$item" = "$current_link" ] && continue
    rm -rf -- "$item"
  done
  shopt -u dotglob nullglob
  switch_current "$previous"
  ensure_server_link
fi

switch_current "$release"
ensure_server_link
switched=1

# The VPS deploy account is intentionally allowed to restart/start/is-active,
# but not to stop the service. restart performs the required stop+start through
# systemd without widening sudo privileges, and clears all process-local state
# such as login rate-limit buckets.
run_systemctl restart "$service_name"
wait_for_health

trap - ERR

current="$(readlink -f "$current_link")"
mapfile -t candidates < <(find "$releases_dir" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -nr | awk '{print $2}')
kept=0
for candidate in "${candidates[@]}"; do
  if [ "$candidate" = "$current" ] || { [ -n "$previous" ] && [ "$candidate" = "$previous" ]; }; then
    continue
  fi
  kept=$((kept + 1))
  if [ "$kept" -gt 1 ]; then
    rm -rf -- "$candidate"
  fi
done

mapfile -t expired_backups < <(ls -1t "$backup_dir"/pre-deploy-*.sqlite 2>/dev/null | tail -n +4)
for expired in "${expired_backups[@]}"; do
  rm -f -- "$expired"
  rm -rf -- "${expired%.sqlite}.avatars"
done

echo "Activated release $release_sha"
