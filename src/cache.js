// Disk cache for parsed transcripts. Keyed by absolute file path -> { mtimeMs, unit }.
// Parsing 25k+ JSONL files on every dashboard refresh would be slow; this lets the
// scanner skip any file whose mtime is unchanged since the last scan.

import fs from "node:fs";
import { CACHE_DIR, CACHE_FILE } from "./config.js";

export function loadCache() {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const data = JSON.parse(raw);
    return data && typeof data === "object" && data.files ? data : { files: {} };
  } catch {
    return { files: {} };
  }
}

export function saveCache(cache) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    // Atomic-ish write: tmp then rename, so a crash never leaves a half-written cache.
    const tmp = `${CACHE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(cache));
    fs.renameSync(tmp, CACHE_FILE);
  } catch {
    // A non-writable cache is non-fatal — the dashboard just re-parses next time.
  }
}
