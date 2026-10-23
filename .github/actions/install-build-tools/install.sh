#!/usr/bin/env bash
# Required tools are verified on every path; repository/brand gates stay separate.
set -Eeuo pipefail
export LC_ALL=C
phase=inventory
trap 'status=$?; echo "::error title=Build tool setup::phase=$phase elapsed=${SECONDS}s exit=$status" >&2; exit "$status"' ERR
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
    sudo apt-get "${apt_options[@]}" -o APT::Update::Error-Mode=any update
  fi
  phase=apt-install
  echo "::notice title=Build tool setup::phase=$phase packages=${missing[*]} elapsed=${SECONDS}s"
  sudo apt-get "${apt_options[@]}" install -y --no-install-recommends "${missing[@]}"
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
