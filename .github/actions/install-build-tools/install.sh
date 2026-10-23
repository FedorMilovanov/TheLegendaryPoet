#!/usr/bin/env bash
# Required tools are verified on every path; repository/brand gates stay separate.
set -Eeuo pipefail
export LC_ALL=C
phase=inventory
apt_log=$(mktemp)
trap 'rm -f -- "$apt_log"' EXIT
emit_apt_detail() {
  local level=$1 title=$2 detail
  [[ -s "$apt_log" ]] || return 0
  detail=$( { { grep -E '^(Get:|Ign:|Err:|Fetched |Need to get |E:|W:)' "$apt_log" || true; } | tail -n 6; tail -n 6 "$apt_log"; } | awk '!seen[$0]++')
  detail=$(printf '%s' "$detail" | sed -E 's#(https?://)[^/ @]+@#\1[redacted]@#g; s/([?&][^= ]+=)[^& ]+/\1[redacted]/g')
  detail=${detail//%/%25}
  detail=${detail//$'\r'/%0D}
  detail=${detail//$'\n'/%0A}
  echo "::$level title=$title::$detail" >&2
}
report_failure() {
  local status=$1
  trap - ERR
  echo "::error title=Build tool setup::phase=$phase elapsed=${SECONDS}s exit=$status" >&2
  emit_apt_detail error 'APT failure detail'
  exit "$status"
}
trap 'report_failure "$?"' ERR
run_apt() {
  local started=$SECONDS
  # An inactivity timeout is not a wall-clock bound for many package transfers.
  timeout --kill-after=10s 600s sudo apt-get "$@" 2>&1 | tee "$apt_log"
  echo "::notice title=APT phase complete::phase=$phase duration=$((SECONDS-started))s"
  if (( SECONDS-started >= 60 )); then emit_apt_detail notice 'Slow APT transfer detail'; fi
}
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
cache_identity=()
for package in "$@"; do
  if installed "$package"; then
    echo "::notice title=Build tool inventory::$package already installed"
  else
    missing+=("$package")
    candidate=$(apt-cache policy "$package" | awk '/Candidate:/ { print $2 }')
    cache_identity+=("$package=${candidate:-none}")
    echo "::notice title=Build tool inventory::$package missing; cached candidate=${candidate:-none}"
    if [[ -z "$candidate" || "$candidate" == '(none)' ]]; then refresh=true; fi
  fi
done
# Cache only package archives, never installed binaries or dpkg state. Missing
# ImageVersion (e.g. self-hosted runners) deliberately disables archive sharing.
if [[ "${BUILD_TOOL_PREPARE_CACHE:-0}" == 1 ]]; then
  if (( ${#missing[@]} )) && [[ -n "${ImageVersion:-}" ]]; then
    archive_dir="${RUNNER_TEMP:?}/tlp-build-tool-archives"
    mkdir -p "$archive_dir"
    digest=$(printf '%s\n' "${ImageOS:-}" "$ImageVersion" "$(dpkg --print-architecture)" "${cache_identity[@]}" | sha256sum)
    printf 'needed=true\nkey=tlp-apt-v1-%s\n' "${digest%% *}" >> "${GITHUB_OUTPUT:?}"
  else
    echo 'needed=false' >> "${GITHUB_OUTPUT:?}"
  fi
  exit 0
fi
# Hosted images retain apt indexes. Refreshing every configured repository even
# when the requested package is already resolvable adds an unrelated network gate.
# Fetch indexes only when needed; stale/broken downloads fail, never pass silently.
apt_options=(-o Acquire::Retries=1 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30)
if (( ${#missing[@]} )); then
  if [[ -n "${BUILD_TOOL_ARCHIVE_DIR:-}" ]]; then
    mkdir -p "$BUILD_TOOL_ARCHIVE_DIR"
    sudo install -d -o _apt -g root -m 0755 "$BUILD_TOOL_ARCHIVE_DIR/partial"
    apt_options+=(-o "Dir::Cache::archives=$BUILD_TOOL_ARCHIVE_DIR" -o APT::Keep-Downloaded-Packages=true)
  fi
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
