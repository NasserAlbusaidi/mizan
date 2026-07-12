import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Point the resolved account/codex dirs at a throwaway tree BEFORE importing the
// scanner, since config.js reads these once at module load.
const root = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-scan-"));
const personal = path.join(root, "personal");
fs.mkdirSync(personal, { recursive: true });
fs.mkdirSync(path.join(root, "work"), { recursive: true });
fs.mkdirSync(path.join(root, "codex"), { recursive: true });
process.env.MIZAN_PERSONAL_DIR = personal;
process.env.MIZAN_WORK_DIR = path.join(root, "work");
process.env.MIZAN_CODEX_DIR = path.join(root, "codex");
process.env.MIZAN_CONFIG = path.join(root, "config.json");

const usageLine = JSON.stringify({
  timestamp: "2026-07-01T00:00:00.000Z",
  cwd: `${personal}/proj`,
  sessionId: "s1",
  requestId: "r1",
  message: { id: "m1", model: "claude-opus-4-8", usage: { input_tokens: 100, output_tokens: 10 } },
});
fs.writeFileSync(path.join(personal, "a.jsonl"), usageLine + "\n");

const { scan } = await import("../src/scanner.js");

test("scan flags changed=true on first parse and changed=false on an unchanged re-scan", () => {
  const first = scan({ files: {} }, 0);
  assert.equal(first.changed, true, "first scan parses the new file");
  assert.equal(first.stats.parsed, 1);

  const second = scan(first.cache, 0);
  assert.equal(second.changed, false, "re-scan with identical files must not force a cache write");
  assert.equal(second.stats.parsed, 0);
  assert.equal(second.stats.cached, 1);
});

test("scan flags changed=true when a cached file is evicted", () => {
  const warm = scan({ files: {} }, 0);
  // Prior cache references a file that no longer exists on disk -> eviction.
  const stale = { files: { ...warm.cache.files, [path.join(personal, "gone.jsonl")]: { mtimeMs: 1, recs: [] } } };
  const rescan = scan(stale, 0);
  assert.equal(rescan.changed, true, "dropping a vanished cache entry counts as a change");
});
