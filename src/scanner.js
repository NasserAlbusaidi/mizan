// Walk both account transcript directories, parse usage records, and build per-file
// "units" — reusing the disk cache for any file whose mtime is unchanged.
//
// A unit aggregates one transcript file:
//   { account, mtimeMs, agentFile, cwd, session, branch, recs }
// where each rec is a compact tuple:
//   [key, t, model, input, cc5, cc1, cr, output, sidechain]

import fs from "node:fs";
import path from "node:path";
import { ACCOUNTS } from "./config.js";
import { parseUsageLine } from "./parser.js";

const MTIME_BUFFER_MS = 10 * 60 * 1000; // tolerate clock skew at the window boundary

function listTranscripts(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { recursive: true });
  } catch {
    return []; // directory may not exist (e.g. no work account configured)
  }
  return entries.filter((e) => typeof e === "string" && e.endsWith(".jsonl"));
}

function parseFile(absPath, account, mtimeMs) {
  let text;
  try {
    text = fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
  const agentFile = path.basename(absPath).startsWith("agent-");
  const recs = [];
  let cwd = null;
  let session = null;
  let branch = null;
  for (const line of text.split("\n")) {
    if (line.indexOf('"usage"') === -1) continue;
    const r = parseUsageLine(line);
    if (!r) continue;
    if (cwd === null && r.cwd) cwd = r.cwd;
    if (session === null && r.session) session = r.session;
    if (branch === null && r.branch) branch = r.branch;
    recs.push([r.key, r.t, r.model, r.input, r.cc5, r.cc1, r.cr, r.output, r.sidechain ? 1 : 0]);
  }
  return { account, mtimeMs, agentFile, cwd, session, branch, recs };
}

// Returns { units, cache, stats }. `cutoffMs` of 0 means all-time (no mtime skip).
export function scan(cache, cutoffMs = 0) {
  const nextCache = { files: {} };
  const units = [];
  const stats = {
    files: 0,
    parsed: 0,
    cached: 0,
    skipped: 0,
    records: 0,
    accounts: Object.fromEntries(
      Object.entries(ACCOUNTS).map(([account, dir]) => [
        account,
        { dir, exists: fs.existsSync(dir), files: 0, parsed: 0, cached: 0, skipped: 0, records: 0 },
      ]),
    ),
  };
  const mtimeFloor = cutoffMs ? cutoffMs - MTIME_BUFFER_MS : 0;

  for (const account of Object.keys(ACCOUNTS)) {
    const base = ACCOUNTS[account];
    const accountStats = stats.accounts[account];
    for (const rel of listTranscripts(base)) {
      const abs = path.join(base, rel);
      let mtimeMs;
      try {
        mtimeMs = fs.statSync(abs).mtimeMs;
      } catch {
        continue;
      }
      stats.files += 1;
      accountStats.files += 1;
      if (mtimeFloor && mtimeMs < mtimeFloor) {
        stats.skipped += 1;
        accountStats.skipped += 1;
        continue;
      }
      const cached = cache.files[abs];
      let unit;
      if (cached && cached.mtimeMs === mtimeMs) {
        unit = cached;
        stats.cached += 1;
        accountStats.cached += 1;
      } else {
        unit = parseFile(abs, account, mtimeMs);
        if (!unit) continue;
        stats.parsed += 1;
        accountStats.parsed += 1;
      }
      nextCache.files[abs] = unit;
      units.push(unit);
      stats.records += unit.recs.length;
      accountStats.records += unit.recs.length;
    }
  }
  return { units, cache: nextCache, stats };
}
