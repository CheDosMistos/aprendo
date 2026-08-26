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

restore_database() {
  local backup="$1"
  [ -n "$backup" ] || return 0
  [ -f "$backup" ] || return 1
  rm -f "$db_path" "${db_path}-wal" "${db_path}-shm"
  /usr/bin/python3 "$backup_helper" "$backup" "$db_path"
}

restore_avatars() {
  local snapshot="$1"
  [ -n "$snapshot" ] || return 0
  [ -d "$snapshot" ] || return 1
  rm -rf -- "$avatar_dir"
  mkdir -p "$avatar_dir"
  cp -a "$snapshot"/. "$avatar_dir"/
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

recover_historical_admin_credential() {
  [ -f "$db_path" ] || return 0

  local recovery_backup="$backup_dir/pre-auth-recovery-$(date -u +%Y%m%dT%H%M%SZ).sqlite"
  /usr/bin/python3 "$backup_helper" "$db_path" "$recovery_backup"
  test -s "$recovery_backup"

  local recovery_result
  recovery_result="$(/usr/bin/python3 - "$db_path" <<'PY'
import sqlite3
import sys

DB = sys.argv[1]
CORRECT_1234_HASH = 'scrypt$16384$8$1$lnLshM-YpVOQZtoDDLl3cw$wO3EjcAiepsnIky7s-vT0HvwT0pDx4gNuCVqcsYQePm8CydACdFFLOytQxUiTBjpnzrSV2_bInlgjm2u-fGpTQ'
INCORRECT_RECOVERY_HASH = 'scrypt$16384$8$1$Em08vyMftt-9tIbHhkVWpw$a49AqttKMCMdmXMVFZROFz7t296NXt7R_FAwqAQxhGo4twWPzpMFCVDZRbo1dlRhnq39QUhEfFyzXX4vJUki_Q'
CUTOFF = '2026-08-25T00:43:24.000Z'

con = sqlite3.connect(DB, timeout=5)
try:
    con.execute('BEGIN IMMEDIATE')
    has_users = con.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'app_users'"
    ).fetchone()
    if not has_users:
        con.rollback()
        print('Authentication schema not present; historical recovery skipped.')
        raise SystemExit(0)

    row = con.execute(
        "SELECT username, role, password_hash, created_at FROM app_users WHERE stable_key = 'default' LIMIT 1"
    ).fetchone()
    if row is None:
        con.rollback()
        print('Historical default admin row not present; recovery skipped.')
        raise SystemExit(0)

    username, role, password_hash, created_at = row
    historical = (
        isinstance(username, str)
        and username.lower() == 'mallo'
        and role == 'admin'
        and isinstance(created_at, str)
        and created_at < CUTOFF
    )
    if historical and (password_hash is None or password_hash == INCORRECT_RECOVERY_HASH):
        con.execute(
            "UPDATE app_users SET password_hash = ? WHERE stable_key = 'default'",
            (CORRECT_1234_HASH,),
        )
        con.commit()
        print('Recovered historical mallo credential.')
    else:
        con.rollback()
        print('Historical mallo credential did not require recovery.')
finally:
    con.close()
PY
)"
  printf '%s\n' "$recovery_result"
  if [ "$recovery_result" != 'Recovered historical mallo credential.' ]; then
    rm -f -- "$recovery_backup"
  fi
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
service_started_new=0

rollback() {
  local status=$?
  trap - ERR
  set +e
  if [ "$service_started_new" -eq 1 ]; then
    run_systemctl stop "$service_name"
  fi
  if [ -n "$previous" ] && [ -d "$previous" ]; then
    switch_current "$previous"
    if [ ! -L "$server_link" ] && [ -e "$server_link" ]; then
      rm -rf -- "$server_link"
    fi
    ensure_server_link
  fi
  restore_database "$backup"
  restore_avatars "$avatar_backup"
  if [ -n "$previous" ] && [ -d "$previous" ]; then
    run_systemctl start "$service_name"
    wait_for_health || true
  elif [ -f "$server_link/entry.mjs" ]; then
    run_systemctl start "$service_name"
  fi
  exit "$status"
}
trap rollback ERR

# Compatibility repair is deliberately performed before systemd activation.
# It is a narrowly guarded, online SQLite update so the historical login can
# be restored even if the VPS service-control privilege is currently broken.
recover_historical_admin_credential

run_systemctl stop "$service_name"

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
run_systemctl start "$service_name"
service_started_new=1
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
  if [ "$kept" -gt 3 ]; then
    rm -rf -- "$candidate"
  fi
done

mapfile -t expired_backups < <(ls -1t "$backup_dir"/pre-deploy-*.sqlite 2>/dev/null | tail -n +6)
for expired in "${expired_backups[@]}"; do
  rm -f -- "$expired"
  rm -rf -- "${expired%.sqlite}.avatars"
done

echo "Activated release $release_sha"
