#!/usr/bin/env bash
# Required tools are verified on every path; repository/brand gates stay separate.
set -Eeuo pipefail
export LC_ALL=C
phase=inventory
apt_log=$(mktemp)
trap 'rm -f -- "$apt_log"' EXIT
report_failure() {
  local status=$1 detail
  trap - ERR
  echo "::error title=Build tool setup::phase=$phase elapsed=${SECONDS}s exit=$status" >&2
  if [[ -s "$apt_log" ]]; then
    detail=$(tail -n 12 "$apt_log" | sed -E 's#(https?://)[^/ @]+@#\1[redacted]@#g; s/([?&][^= ]+=)[^& ]+/\1[redacted]/g')
    detail=${detail//%/%25}
    detail=${detail//$'\r'/%0D}
    detail=${detail//$'\n'/%0A}
    echo "::error title=APT failure detail::$detail" >&2
  fi
  exit "$status"
}
trap 'report_failure "$?"' ERR
run_apt() { sudo apt-get "$@" 2>&1 | tee "$apt_log"; }
if (( $# == 0 )); then set -- ffmpeg; fi
for package in "$@"; do
  if [[ ! "$package" =~ ^[a-z0-9][a-z0-9+.-]*(:[a-z0-9]+)?$ ]]; then
    echo "::error title=Build tool setup::Invalid package name: $package" >&2
    exit 2
  fi
done
installed() {
  [[ "$(dpkg-query -W -f='${Status}' -- "$1" 2>/dev/null)" == 'install ok installed' ]]
}
missing=()
refresh=false
for package in "$@"; do
  if installed "$package"; then
    echo "::notice title=Build tool inventory::$package already installed"
  else
    missing+=("$package")
    candidate=$(apt-cache policy "$package" | awk '/Candidate:/ { print $2 }')
    echo "::notice title=Build tool inventory::$package missing; cached candidate=${candidate:-none}"
    if [[ -z "$candidate" || "$candidate" == '(none)' ]]; then refresh=true; fi
  fi
done
# Hosted images retain apt indexes. Refreshing every configured repository even
# when the requested package is already resolvable adds an unrelated network gate.
# Fetch indexes only when needed; stale/broken downloads fail, never pass silently.
apt_options=(-o Acquire::Retries=1 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30)
if (( ${#missing[@]} )); then
  if $refresh; then
    phase=apt-update
    echo "::notice title=Build tool setup::phase=$phase elapsed=${SECONDS}s"
    run_apt "${apt_options[@]}" -o APT::Update::Error-Mode=any update
  fi
  phase=apt-install
  echo "::notice title=Build tool setup::phase=$phase packages=${missing[*]} elapsed=${SECONDS}s"
  run_apt "${apt_options[@]}" install -y --no-install-recommends "${missing[@]}"
fi
phase=verify
for package in "$@"; do
  if ! installed "$package"; then
    echo "::error title=Build tool setup::$package is not installed after setup" >&2
    exit 1
  fi
  dpkg-query -W -f='${Package}=${Version}\n' -- "$package"
  if [[ "${package%%:*}" == ffmpeg ]]; then
    command -v ffmpeg
    # Capture before printing so an unusable binary cannot pass via a pipe/head.
    version=$(ffmpeg -version)
    printf '%s\n' "${version%%$'\n'*}"
  fi
done
echo "::notice title=Build tool setup::phase=verified elapsed=${SECONDS}s packages=$*"
