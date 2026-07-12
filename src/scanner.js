// Walk both account transcript directories, parse usage records, and build per-file
// "units" — reusing the disk cache for any file whose mtime is unchanged.
//
// A unit aggregates one transcript file:
//   { account, mtimeMs, agentFile, cwd, session, branch, recs }
// where each rec is a compact tuple:
//   [key, t, model, input, cc5, cc1, cr, output, sidechain]

import fs from "node:fs";
import path from "node:path";
import { ACCOUNTS, CODEX_DIR, expectedAccount } from "./config.js";
import { parseCodexUsageLine, parseUsageLine } from "./parser.js";

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

function parseClaudeFile(absPath, account, mtimeMs) {
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
  return { provider: "claude", account, mtimeMs, agentFile, cwd, session, branch, recs };
}

function parseCodexFile(absPath, mtimeMs) {
  let text;
  try {
    text = fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
  const state = { file: absPath };
  const recs = [];
  let cwd = null;
  let session = null;
  let branch = null;
  for (const line of text.split("\n")) {
    if (line.indexOf("token_count") === -1 && line.indexOf("session_meta") === -1) continue;
    const r = parseCodexUsageLine(line, state);
    if (cwd === null && state.cwd) cwd = state.cwd;
    if (session === null && state.session) session = state.session;
    if (branch === null && state.branch) branch = state.branch;
    if (!r) continue;
    if (cwd === null && r.cwd) cwd = r.cwd;
    if (session === null && r.session) session = r.session;
    if (branch === null && r.branch) branch = r.branch;
    recs.push([r.key, r.t, r.model, r.input, r.cc5, r.cc1, r.cr, r.output, r.sidechain ? 1 : 0, r.provider]);
  }
  return {
    provider: "codex",
    account: expectedAccount(cwd),
    mtimeMs,
    agentFile: state.agent === true,
    cwd,
    session,
    branch,
    recs,
  };
}

// Returns { units, cache, stats, changed }. `cutoffMs` of 0 means all-time (no
// mtime skip). `changed` is false when the file set and every mtime matched the
// prior cache, so callers can skip rewriting the cache to disk.
export function scan(cache, cutoffMs = 0) {
  const nextCache = { files: {} };
  const units = [];
  const stats = {
    files: 0,
    parsed: 0,
    cached: 0,
    skipped: 0,
    records: 0,
    providers: {
      claude: { provider: "claude", label: "Claude Code", exists: false, files: 0, parsed: 0, cached: 0, skipped: 0, records: 0 },
      codex: {
        provider: "codex",
        label: "Codex",
        dir: CODEX_DIR,
        exists: fs.existsSync(CODEX_DIR),
        files: 0,
        parsed: 0,
        cached: 0,
        skipped: 0,
        records: 0,
      },
    },
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
    const providerStats = stats.providers.claude;
    providerStats.exists ||= fs.existsSync(base);
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
      providerStats.files += 1;
      if (mtimeFloor && mtimeMs < mtimeFloor) {
        stats.skipped += 1;
        accountStats.skipped += 1;
        providerStats.skipped += 1;
        continue;
      }
      const cached = cache.files[abs];
      let unit;
      if (cached && cached.mtimeMs === mtimeMs) {
        unit = { ...cached, provider: "claude", account };
        stats.cached += 1;
        accountStats.cached += 1;
        providerStats.cached += 1;
      } else {
        unit = parseClaudeFile(abs, account, mtimeMs);
        if (!unit) continue;
        stats.parsed += 1;
        accountStats.parsed += 1;
        providerStats.parsed += 1;
      }
      nextCache.files[abs] = unit;
      units.push(unit);
      stats.records += unit.recs.length;
      accountStats.records += unit.recs.length;
      providerStats.records += unit.recs.length;
    }
  }

  const codexStats = stats.providers.codex;
  for (const rel of listTranscripts(CODEX_DIR)) {
    const abs = path.join(CODEX_DIR, rel);
    let mtimeMs;
    try {
      mtimeMs = fs.statSync(abs).mtimeMs;
    } catch {
      continue;
    }
    stats.files += 1;
    codexStats.files += 1;
    if (mtimeFloor && mtimeMs < mtimeFloor) {
      stats.skipped += 1;
      codexStats.skipped += 1;
      continue;
    }
    const cached = cache.files[abs];
    let unit;
    if (cached && cached.mtimeMs === mtimeMs) {
      unit = { ...cached, provider: "codex", account: expectedAccount(cached.cwd) };
      stats.cached += 1;
      codexStats.cached += 1;
    } else {
      unit = parseCodexFile(abs, mtimeMs);
      if (!unit) continue;
      stats.parsed += 1;
      codexStats.parsed += 1;
    }
    nextCache.files[abs] = unit;
    units.push(unit);
    stats.records += unit.recs.length;
    codexStats.records += unit.recs.length;
  }
  // Changed if any file was (re)parsed, or if the retained file set differs from
  // the prior cache (a new file added, or an old one evicted/deleted). A new file
  // is always parsed, so parsed > 0 already covers additions; the count check
  // catches evictions where nothing was parsed.
  const changed =
    stats.parsed > 0 || Object.keys(nextCache.files).length !== Object.keys(cache.files || {}).length;
  return { units, cache: nextCache, stats, changed };
}
