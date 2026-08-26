#!/usr/bin/env bash
set -Eeuo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: rollback-release.sh RELEASE_SHA" >&2
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
rollback_target_file="${APRENDO_ROLLBACK_TARGET_FILE:-$runtime_dir/.rollback-target}"
service_wrapper="${APRENDO_SYSTEMCTL_WRAPPER:-}"
health_wrapper="${APRENDO_HEALTHCHECK_WRAPPER:-}"
service_name="${APRENDO_SERVICE_NAME:-aprendo.service}"
health_url="${APRENDO_HEALTH_URL:-http://127.0.0.1:4321/api/health/}"
health_attempts="${APRENDO_HEALTH_ATTEMPTS:-10}"
health_sleep="${APRENDO_HEALTH_SLEEP_SECONDS:-1}"
failed_release="$releases_dir/$release_sha"

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
    echo "server path is not a symlink" >&2
    return 1
  fi
  ln -s current/server "$server_link"
}

[ -L "$current_link" ] || { echo "current release is not a symlink" >&2; exit 1; }
[ -f "$rollback_target_file" ] || { echo "rollback target metadata is missing" >&2; exit 1; }

current="$(readlink -f "$current_link")"
[ "$current" = "$failed_release" ] || {
  echo "refusing rollback: current release is $current, expected $failed_release" >&2
  exit 1
}

target="$(cat "$rollback_target_file")"
case "$target" in
  "$releases_dir"/*) ;;
  *) echo "rollback target points outside releases directory" >&2; exit 1 ;;
esac
[ -d "$target" ] || { echo "rollback target does not exist: $target" >&2; exit 1; }
[ "$target" != "$current" ] || { echo "rollback target equals current release" >&2; exit 1; }

switch_current "$target"
ensure_server_link
run_systemctl restart "$service_name"

if ! wait_for_health; then
  echo "rollback target failed health; restoring the just-activated release" >&2
  switch_current "$failed_release"
  ensure_server_link
  run_systemctl restart "$service_name"
  wait_for_health || true
  exit 1
fi

rm -f "$rollback_target_file"
rm -rf -- "$failed_release"
echo "Rolled back release $release_sha to $(basename "$target")"
