import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import { aggregate } from "../src/aggregate.js";
import { classifyLeak } from "../src/leaks.js";

const HOME = os.homedir();
const NOW = Date.UTC(2026, 5, 20, 12, 0, 0); // fixed clock for deterministic windows
const today = NOW - 3600_000; // 1h ago

// rec tuple: [key, t, model, input, cc5, cc1, cr, output, sidechain]
const rec = (key, model, output, t = today, extra = {}) => [
  key,
  t,
  model,
  extra.input || 0,
  extra.cc5 || 0,
  extra.cc1 || 0,
  extra.cr || 0,
  output,
  extra.sc || 0,
];

const unit = (account, cwd, session, recs) => ({
  account,
  cwd,
  session,
  branch: null,
  recs,
});

test("dedup: a record appearing in two files is counted once", () => {
  const shared = rec("msg1|req1", "claude-opus-4-8", 1000, today, { input: 1000 });
  const units = [
    unit("personal", `${HOME}/Desktop/Personal/Rihla`, "s1", [shared]),
    unit("personal", `${HOME}/Desktop/Personal/Rihla`, "s1b", [shared]), // resumed/forked copy
  ];
  const d = aggregate(units, 0, NOW);
  assert.equal(d.totals.reqs, 1, "duplicate keys collapse to one request");
  assert.equal(d.totals.output, 1000);
});

test("leak detection flags both directions and attributes cost", () => {
  const units = [
    // correct: personal account on a personal project
    unit("personal", `${HOME}/Desktop/Personal/Rihla`, "ok1", [
      rec("a|1", "claude-opus-4-8", 1_000_000, today, { input: 1_000_000 }),
    ]),
    // LEAK: work account running a personal project (the $978 incident shape)
    unit("work", `${HOME}/Desktop/Personal/Rihla`, "leak1", [
      rec("b|2", "claude-opus-4-8", 1_000_000, today, { input: 1_000_000 }),
    ]),
    // LEAK: personal account running a work project
    unit("personal", `${HOME}/Desktop/Work/AI-RMA`, "leak2", [
      rec("c|3", "claude-haiku-4-5", 1_000_000, today, { input: 1_000_000 }),
    ]),
  ];
  const d = aggregate(units, 0, NOW);
  assert.equal(d.leaks.count, 2, "two leaking sessions");
  // work_pays_personal: opus $5/MTok in + $25/MTok out on 1M each = $30
  assert.equal(d.leaks.totals.work_pays_personal, 30);
  // personal_pays_work: haiku $1 + $5 = $6
  assert.equal(d.leaks.totals.personal_pays_work, 6);
  // the correct personal session is NOT flagged
  assert.equal(
    d.leaks.sessions.find((s) => s.session === "ok1"),
    undefined,
  );
});

test("classifyLeak: path classification", () => {
  assert.equal(
    classifyLeak({ account: "work", cwd: `${HOME}/Desktop/Personal/Rihla` }),
    "work_pays_personal",
  );
  assert.equal(
    classifyLeak({ account: "personal", cwd: `${HOME}/Desktop/Work/X` }),
    "personal_pays_work",
  );
  assert.equal(classifyLeak({ account: "personal", cwd: `${HOME}/Desktop/Personal/X` }), null);
  assert.equal(classifyLeak({ account: "work", cwd: `${HOME}/Desktop/Work/X` }), null);
  assert.equal(classifyLeak({ account: "work", cwd: null }), null); // unknown project -> no claim
});

test("burn windows are independent of the display window", () => {
  const eightDaysAgo = NOW - 8 * 86_400_000;
  const units = [
    unit("personal", `${HOME}/Desktop/Personal/Rihla`, "recent", [
      rec("r|1", "claude-opus-4-8", 1_000_000, today), // 1M opus output = $25 today
    ]),
    unit("personal", `${HOME}/Desktop/Personal/Rihla`, "old", [
      rec("o|1", "claude-opus-4-8", 1_000_000, eightDaysAgo), // $25, >7d ago
    ]),
  ];
  // Display window = 3 days (excludes the 8-day-old record from rollups)...
  const d = aggregate(units, NOW - 3 * 86_400_000, NOW);
  assert.equal(d.totals.cost, 25, "display rollup only sees the recent record");
  assert.equal(d.burn.today, 25);
  assert.equal(d.burn.last7d, 25, "7d burn excludes the 8-day-old record");
  assert.equal(d.burn.last30d, 50, "30d burn includes both");
});

test("cache hit ratio reflects cheap cache reads vs fresh input", () => {
  const units = [
    unit("personal", `${HOME}/Desktop/Personal/Rihla`, "s", [
      rec("k|1", "claude-opus-4-8", 0, today, { input: 100_000, cr: 900_000 }),
    ]),
  ];
  const d = aggregate(units, 0, NOW);
  assert.equal(d.cache.hitRatio, 0.9); // 900k read / (100k input + 900k read)
});
