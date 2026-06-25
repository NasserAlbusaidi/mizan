export const DEFAULT_LATEST_RELEASE_API =
  "https://api.github.com/repos/NasserAlbusaidi/mizan/releases/latest";
export const DEFAULT_LATEST_RELEASE_PAGE = "https://github.com/NasserAlbusaidi/mizan/releases/latest";

export async function buildUpdateCheck({
  currentVersion,
  releasesUrl = process.env.MIZAN_RELEASES_URL || DEFAULT_LATEST_RELEASE_API,
  fetchImpl = globalThis.fetch,
  timeoutMs = 3500,
} = {}) {
  try {
    const latestVersion = await fetchLatestVersion({ releasesUrl, fetchImpl, timeoutMs });
    const comparison = compareVersions(latestVersion, currentVersion);
    const status =
      comparison > 0 ? "update available" : comparison < 0 ? "newer than latest release" : "current";
    return {
      ok: true,
      currentVersion,
      latestVersion,
      status,
      installCommand: `npm install -g ${releaseTarballUrl(latestVersion)}`,
      fallbackCommand: `npm install -g github:NasserAlbusaidi/mizan#v${latestVersion}`,
      latestRelease: DEFAULT_LATEST_RELEASE_PAGE,
    };
  } catch (err) {
    return {
      ok: false,
      currentVersion,
      status: "could not check latest release",
      reason: err.message,
      latestRelease: DEFAULT_LATEST_RELEASE_PAGE,
    };
  }
}

export function formatUpdateCheck(check) {
  const lines = ["Mizan update check", `Current: ${check.currentVersion}`];
  if (check.ok) {
    lines.push(`Latest: ${check.latestVersion}`, `Status: ${check.status}`);
    if (check.status === "update available") {
      lines.push(`Install: ${check.installCommand}`, `Fallback: ${check.fallbackCommand}`);
    }
  } else {
    lines.push(`Status: ${check.status}`, `Reason: ${check.reason}`);
  }
  lines.push(`Latest release: ${check.latestRelease}`);
  return lines.join("\n");
}

export function releaseTarballUrl(version) {
  return `https://github.com/NasserAlbusaidi/mizan/releases/download/v${version}/nasseralbusaidi-mizan-${version}.tgz`;
}

async function fetchLatestVersion({ releasesUrl, fetchImpl, timeoutMs }) {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is not available in this Node runtime");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(releasesUrl, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "mizan-update-check",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`latest release request failed with HTTP ${response.status}`);
    }
    const body = await response.json();
    const version = parseReleaseVersion(body.tag_name || body.name);
    if (!version) {
      throw new Error("latest release response did not include a version tag");
    }
    return version;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("latest release request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function parseReleaseVersion(value) {
  const tag = String(value || "").trim();
  if (!tag) return null;
  return tag.startsWith("v") ? tag.slice(1) : tag;
}

function compareVersions(left, right) {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (leftParts[i] || 0) - (rightParts[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function versionParts(version) {
  return String(version || "")
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}
