import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const ids = [
  "refresh",
  "loading",
  "error",
  "dashboard",
  "brief-title",
  "brief-copy",
  "trust-grid",
  "actions",
  "kpis",
  "leak-banner",
  "account-split",
  "daily-chart",
  "model-donut",
  "model-legend",
  "cache-gauge",
  "projects",
  "sessions",
  "foot-stats",
  "pricing-note",
  "window-tabs",
  "copy-report",
  "updated",
];

function makeElement(id) {
  return {
    id,
    hidden: false,
    innerHTML: "",
    textContent: "",
    disabled: false,
    classList: {
      add() {},
      remove() {},
    },
    addEventListener() {},
    closest() {
      return null;
    },
  };
}

function dashboardData(overrides = {}) {
  return {
    generatedAt: Date.UTC(2026, 5, 24, 12),
    window: { days: 7 },
    config: {
      demo: true,
      localOnly: true,
      host: "127.0.0.1",
      accounts: [],
      workMarkers: [],
      configFile: { exists: false },
      cacheFile: "/Users/tester/.mizan/cache.json",
      budgets: { daily: null, monthly: null },
    },
    stats: {
      demo: true,
      accounts: {},
      files: 4,
      records: 8,
      parsed: 4,
      cached: 0,
      computeMs: 3,
    },
    totals: { cost: 125.5, reqs: 48, output: 120_000 },
    burn: { today: 11, perDay: 4.2, projected30d: 126 },
    comparison: {
      windowDays: 7,
      previous: { cost: 80, reqs: 40 },
      delta: { cost: 45.5, reqs: 8, costPct: 0.56875, reqsPct: 0.2 },
    },
    leaks: {
      count: 0,
      totals: { work_pays_personal: 0, personal_pays_work: 0 },
      sessions: [],
    },
    accounts: {
      personal: { cost: 125.5, output: 120_000, reqs: 48 },
      work: { cost: 0, output: 0, reqs: 0 },
    },
    models: [{ model: "claude-sonnet-4-6", cost: 125.5, input: 0, cc: 0, cr: 0, output: 120_000, reqs: 48 }],
    days: [],
    cache: { hitRatio: 0.42, readTokens: 42_000, freshInputTokens: 58_000 },
    projects: [{ account: "personal", display: "~/mizan", cost: 125.5, reqs: 48 }],
    sessions: [],
    pricing: { sourceName: "test pricing", checkedAt: "2026-06-24" },
    ...overrides,
  };
}

test("dashboard spend KPI renders previous-window comparison", async () => {
  const elements = new Map(ids.map((id) => [id, makeElement(id)]));
  const context = {
    console,
    Date,
    setInterval() {
      return 1;
    },
    clearTimeout() {},
    setTimeout() {
      return 1;
    },
    addEventListener() {},
    fetch: async () => ({
      ok: true,
      json: async () => dashboardData(),
    }),
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
      },
      querySelectorAll() {
        return [];
      },
    },
    navigator: {},
    MizanCharts: {
      drawDaily() {},
      drawDonut() {},
    },
  };
  context.window = context;

  vm.runInNewContext(fs.readFileSync("public/app.js", "utf8"), context, { filename: "public/app.js" });
  await new Promise((resolve) => setImmediate(resolve));

  const kpis = elements.get("kpis").innerHTML;
  assert.match(kpis, /Spend · last 7d/);
  assert.match(kpis, /\+\$45\.50 \(\+56\.9%\) vs previous 7d/);
  assert.match(kpis, /\+8 reqs vs previous 7d/);
});
