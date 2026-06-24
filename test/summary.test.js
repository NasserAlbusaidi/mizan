import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSummary, formatSummary } from "../src/summary.js";

const baseData = (overrides = {}) => ({
  generatedAt: Date.UTC(2026, 5, 24, 12),
  window: { days: 7 },
  config: { demo: false, budgets: { daily: null, monthly: null } },
  totals: { cost: 12.5, reqs: 10 },
  burn: { today: 2, perDay: 3, projected30d: 90 },
  leaks: { count: 0, totals: { work_pays_personal: 0, personal_pays_work: 0 } },
  models: [{ model: "claude-sonnet-4-6", cost: 12.5, input: 10, cc: 0, cr: 0, output: 5, reqs: 10 }],
  projects: [{ account: "personal", display: "~/project", cost: 12.5, reqs: 10 }],
  ...overrides,
});

test("summary is ok when there are no leaks or budget overruns", () => {
  const summary = buildSummary(baseData());
  assert.equal(summary.status, "ok");
  assert.equal(summary.spend, 12.5);
  assert.equal(summary.issues.length, 0);
  assert.match(formatSummary(summary), /Mizan summary \[OK\]/);
});

test("summary warns when no usage records are found", () => {
  const summary = buildSummary(
    baseData({
      totals: { cost: 0, reqs: 0 },
      burn: { today: 0, perDay: 0, projected30d: 0 },
      models: [],
      projects: [],
    }),
  );

  assert.equal(summary.status, "warn");
  assert.deepEqual(summary.warnings.map((warning) => warning.type), ["no_usage"]);
  assert.match(summary.warnings[0].message, /No Claude Code usage records/);
  assert.match(summary.warnings[0].message, /mizan --doctor/);
  assert.match(formatSummary(summary), /Mizan summary \[WARN\]/);
  assert.match(formatSummary(summary), /mizan --set-transcripts/);
});

test("summary fails on cross-account leaks", () => {
  const summary = buildSummary(
    baseData({
      leaks: { count: 2, totals: { work_pays_personal: 10, personal_pays_work: 2 } },
    }),
  );
  assert.equal(summary.status, "fail");
  assert.equal(summary.leaks.total, 12);
  assert.match(summary.issues[0].message, /2 cross-account leaks/);
});

test("summary fails on exceeded budgets and warns near budgets", () => {
  const fail = buildSummary(
    baseData({
      config: { demo: false, budgets: { daily: 10, monthly: 100 } },
      burn: { today: 11, perDay: 4, projected30d: 120 },
    }),
  );
  assert.equal(fail.status, "fail");
  assert.deepEqual(
    fail.issues.map((issue) => issue.type),
    ["daily_budget", "monthly_budget"],
  );

  const warn = buildSummary(
    baseData({
      config: { demo: false, budgets: { daily: 10, monthly: 100 } },
      burn: { today: 8, perDay: 3, projected30d: 80 },
    }),
  );
  assert.equal(warn.status, "warn");
  assert.deepEqual(
    warn.warnings.map((warning) => warning.type),
    ["daily_budget", "monthly_budget"],
  );
});

test("summary recommends the persistent budget command when monthly burn is high", () => {
  const warn = buildSummary(
    baseData({
      burn: { today: 9, perDay: 4, projected30d: 120 },
    }),
  );

  assert.equal(warn.status, "warn");
  assert.match(warn.warnings[0].message, /mizan --set-budget monthly=120/);
  assert.doesNotMatch(warn.warnings[0].message, /MIZAN_MONTHLY_BUDGET/);
});

test("summary warns when billable-looking usage uses an unpriced model", () => {
  const summary = buildSummary(
    baseData({
      models: [
        { model: "claude-future-9", cost: 0, input: 1000, cc: 0, cr: 0, output: 500, reqs: 3 },
        { model: "<synthetic>", cost: 0, input: 1000, cc: 0, cr: 0, output: 500, reqs: 4 },
      ],
    }),
  );

  assert.equal(summary.status, "warn");
  assert.deepEqual(summary.unpricedModels, [{ model: "claude-future-9", requests: 3 }]);
  assert.match(formatSummary(summary), /Unpriced model usage/);
  assert.doesNotMatch(formatSummary(summary), /<synthetic>/);
});
