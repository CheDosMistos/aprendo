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

root="${APRENDO_ROOT:-/opt/aprendo}"
releases_dir="${APRENDO_RELEASES_DIR:-$root/releases}"
runtime_link="${APRENDO_RUNTIME_LINK:-$root/runtime}"
data_dir="${APRENDO_DATA_DIR:-/var/lib/aprendo}"
db_path="${APRENDO_DB_PATH:-$data_dir/aprendo.sqlite}"
backup_dir="${APRENDO_BACKUP_DIR:-$data_dir/backups}"
backup_helper="${APRENDO_BACKUP_HELPER:-/tmp/aprendo-backup-sqlite.py}"
release="$releases_dir/$release_sha"
service_wrapper="${APRENDO_SYSTEMCTL_WRAPPER:-}"
health_wrapper="${APRENDO_HEALTHCHECK_WRAPPER:-}"
service_name="${APRENDO_SERVICE_NAME:-aprendo.service}"
health_url="${APRENDO_HEALTH_URL:-http://127.0.0.1:4321/api/health/}"

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
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    if run_systemctl is-active --quiet "$service_name" && health_ok; then
      return 0
    fi
    sleep 1
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

mkdir -p "$releases_dir" "$backup_dir"
test -d "$release"
test -f "$release/server/entry.mjs"
test -f "$release/package.json"
test -f "$release/package-lock.json"

previous=""
legacy=""
if [ -L "$runtime_link" ]; then
  previous="$(readlink -f "$runtime_link")"
elif [ -d "$runtime_link" ]; then
  legacy="$releases_dir/legacy-$(date -u +%Y%m%dT%H%M%SZ)"
  previous="$legacy"
elif [ -e "$runtime_link" ]; then
  echo "runtime path exists but is neither a directory nor a symlink" >&2
  exit 1
fi

backup=""
switched=0
service_stopped=0

rollback() {
  local status=$?
  trap - ERR
  set +e
  if [ "$service_stopped" -eq 0 ]; then
    run_systemctl stop "$service_name"
  fi
  if [ "$switched" -eq 1 ]; then
    rm -f "$runtime_link"
    if [ -n "$previous" ] && [ -d "$previous" ]; then
      rollback_link="$root/.runtime-rollback-$$"
      rm -f "$rollback_link"
      ln -s "$previous" "$rollback_link"
      mv -Tf "$rollback_link" "$runtime_link"
    fi
  elif [ -n "$legacy" ] && [ -d "$legacy" ] && [ ! -e "$runtime_link" ]; then
    rollback_link="$root/.runtime-rollback-$$"
    ln -s "$legacy" "$rollback_link"
    mv -Tf "$rollback_link" "$runtime_link"
  fi
  restore_database "$backup"
  if [ -e "$runtime_link" ]; then
    run_systemctl start "$service_name"
    wait_for_health || true
  fi
  exit "$status"
}
trap rollback ERR

run_systemctl stop "$service_name"
service_stopped=1

if [ -f "$db_path" ]; then
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup="$backup_dir/pre-deploy-${release_sha:0:12}-${stamp}.sqlite"
  /usr/bin/python3 "$backup_helper" "$db_path" "$backup"
  test -s "$backup"
fi

if [ -n "$legacy" ]; then
  mv "$runtime_link" "$legacy"
fi

next_link="$root/.runtime-next-$$"
rm -f "$next_link"
ln -s "$release" "$next_link"
mv -Tf "$next_link" "$runtime_link"
switched=1

run_systemctl start "$service_name"
service_stopped=0
wait_for_health

trap - ERR

# Keep the active release, the previous release and the three newest other releases.
current="$(readlink -f "$runtime_link")"
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

ls -1t "$backup_dir"/pre-deploy-*.sqlite 2>/dev/null | tail -n +6 | xargs -r rm -f

echo "Activated release $release_sha"
