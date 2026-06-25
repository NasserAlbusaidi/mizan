#!/usr/bin/env bash
set -euo pipefail

repo="${MIZAN_REPO:-NasserAlbusaidi/mizan}"
version="${MIZAN_INSTALL_VERSION:-}"
dry_run="${MIZAN_INSTALL_DRY_RUN:-}"
latest_api="${MIZAN_RELEASES_URL:-https://api.github.com/repos/${repo}/releases/latest}"

echo "Mizan installer"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required. Install Node.js 20 or newer, then re-run this installer." >&2
  exit 1
fi

if [[ -z "${version}" ]]; then
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required to discover the latest release. Set MIZAN_INSTALL_VERSION to install a pinned version." >&2
    exit 1
  fi
  latest_json="$(curl -fsSL "${latest_api}")"
  version="$(printf '%s' "${latest_json}" | sed -nE 's/.*"tag_name"[[:space:]]*:[[:space:]]*"v?([^"]+)".*/\1/p' | head -n 1)"
  if [[ -z "${version}" ]]; then
    echo "Could not find tag_name in latest release response. Set MIZAN_INSTALL_VERSION to install a pinned version." >&2
    exit 1
  fi
fi

tarball_url="https://github.com/${repo}/releases/download/v${version}/nasseralbusaidi-mizan-${version}.tgz"

echo "Installing Mizan ${version} from the GitHub release tarball."
echo "Command: npm install -g ${tarball_url}"

if [[ "${dry_run}" == "1" || "${dry_run}" == "true" ]]; then
  echo "Dry run only. No changes were made."
  exit 0
fi

npm install -g "${tarball_url}"

if command -v mizan >/dev/null 2>&1; then
  mizan --version
  echo "Next: mizan --try"
else
  echo "Mizan installed, but the global npm bin directory is not on PATH." >&2
  echo "Run npm bin -g, add that directory to PATH, then run mizan --try." >&2
fi
