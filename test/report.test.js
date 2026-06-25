import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, formatMarkdownReport } from "../src/report.js";

const baseData = (overrides = {}) => ({
  generatedAt: Date.UTC(2026, 5, 24, 12),
  window: { days: 7 },
  config: {
    demo: false,
    localOnly: true,
    budgets: { daily: 10, monthly: 100 },
  },
  pricing: {
    sourceName: "Anthropic Claude API pricing",
    sourceUrl: "https://docs.anthropic.com/en/docs/about-claude/pricing",
    checkedAt: "2026-06-24",
  },
  totals: { cost: 125.5, reqs: 48 },
  burn: { today: 11, perDay: 4.2, projected30d: 126 },
  leaks: {
    count: 2,
    totals: { work_pays_personal: 20, personal_pays_work: 3.5 },
    sessions: [
      {
        account: "work",
        project: "/Users/nasser/Desktop/Personal/SecretApp",
        cost: 20,
        durationMin: 77,
      },
    ],
  },
  projects: [
    { account: "personal", display: "/Users/nasser/Desktop/Personal/SecretApp", cost: 80, reqs: 20 },
    { account: "work", display: "/Users/nasser/Desktop/Work/ClientPortal", cost: 45.5, reqs: 28 },
  ],
  ...overrides,
});

test("report builds a redacted automation-friendly snapshot", () => {
  const report = buildReport(baseData());

  assert.equal(report.status, "fail");
  assert.equal(report.windowLabel, "last 7d");
  assert.equal(report.metrics.spend, 125.5);
  assert.equal(report.metrics.leakTotal, 23.5);
  assert.equal(report.metrics.reviewableWrongAccountSpend, 23.5);
  assert.equal(report.privacy.redacted, true);
  assert.deepEqual(
    report.actions.map((action) => action.type),
    ["leak", "daily_budget", "monthly_budget"],
  );
  assert.equal(report.topProjects[0].project, "~/Desktop/Personal/SecretApp");
  assert.equal(report.topLeaks[0].project, "~/Desktop/Personal/SecretApp");
});

test("markdown report is copyable and does not expose absolute home paths", () => {
  const markdown = formatMarkdownReport(buildReport(baseData()));

  assert.match(markdown, /^# Mizan Spend Report/m);
  assert.match(markdown, /Status: \*\*FAIL\*\*/);
  assert.match(markdown, /Reviewable wrong-account spend: \$23\.50/);
  assert.match(markdown, /mizan --add-work-marker/);
  assert.match(markdown, /If a flagged path is really work/);
  assert.match(markdown, /\| Project \| Account \| Spend \| Requests \|/);
  assert.match(markdown, /~\/Desktop\/Personal\/SecretApp/);
  assert.doesNotMatch(markdown, /\/Users\/nasser/);
  assert.match(markdown, /Paths are redacted/);
});

test("demo markdown report includes next steps for real setup", () => {
  const markdown = formatMarkdownReport(
    buildReport(
      baseData({
        config: {
          demo: true,
          localOnly: true,
          budgets: { daily: null, monthly: null },
        },
      }),
      { packageVersion: "0.1.48" },
    ),
  );

  assert.match(markdown, /## Next Steps/);
  assert.match(markdown, /Demo data only; no local transcripts were read/);
  assert.match(markdown, /npm install -g github:NasserAlbusaidi\/mizan#v0\.1\.48/);
  assert.match(markdown, /mizan --setup/);
  assert.match(markdown, /mizan --weekly --output "\$HOME\/Documents\/Mizan\/mizan-weekly-\$\(date \+%F\)\.md"/);
  assert.ok(markdown.indexOf("## Action Items") < markdown.indexOf("## Next Steps"));
  assert.doesNotMatch(markdown, /\/Users\/nasser/);
});

test("markdown report includes account split for reimbursement review", () => {
  const markdown = formatMarkdownReport(
    buildReport(
      baseData({
        accounts: {
          personal: { cost: 80, reqs: 20, output: 100_000 },
          work: { cost: 45.5, reqs: 28, output: 120_000 },
        },
      }),
    ),
  );

  assert.match(markdown, /## Account Split/);
  assert.match(markdown, /\| Account \| Spend \| Requests \| Output tokens \|/);
  assert.match(markdown, /\| personal \| \$80\.00 \| 20 \| 100\.0k \|/);
  assert.match(markdown, /\| work \| \$45\.50 \| 28 \| 120\.0k \|/);
});

test("markdown report includes costliest sessions without session ids", () => {
  const markdown = formatMarkdownReport(
    buildReport(
      baseData({
        sessions: [
          {
            session: "secret-session-id",
            account: "personal",
            project: "/Users/nasser/Desktop/Personal/SecretApp",
            cost: 80,
            durationMin: 77,
            reqs: 20,
            model: "claude-opus-4-8",
          },
          {
            session: "other-secret-session-id",
            account: "work",
            cwd: "/Users/nasser/Desktop/Work/ClientPortal",
            cost: 45.5,
            durationMin: 12,
            reqs: 28,
            model: "claude-sonnet-4-6",
          },
        ],
      }),
    ),
  );

  assert.match(markdown, /## Costliest Sessions/);
  assert.match(markdown, /\| Project \| Account \| Spend \| Duration \| Requests \| Model \|/);
  assert.match(markdown, /\| ~\/Desktop\/Personal\/SecretApp \| personal \| \$80\.00 \| 77m \| 20 \| claude-opus-4-8 \|/);
  assert.match(markdown, /\| ~\/Desktop\/Work\/ClientPortal \| work \| \$45\.50 \| 12m \| 28 \| claude-sonnet-4-6 \|/);
  assert.doesNotMatch(markdown, /secret-session-id/);
  assert.doesNotMatch(markdown, /\/Users\/nasser/);
});

test("markdown report compares spend to the previous matching window", () => {
  const report = buildReport(
    baseData({
      comparison: {
        windowDays: 7,
        previous: { cost: 80, reqs: 40 },
        delta: { cost: 45.5, reqs: 8, costPct: 0.56875, reqsPct: 0.2 },
        projects: [
          {
            account: "personal",
            project: "/Users/nasser/Desktop/Personal/SecretApp",
            current: { cost: 80, reqs: 20 },
            previous: { cost: 40, reqs: 10 },
            delta: { cost: 40, reqs: 10, costPct: 1, reqsPct: 1 },
          },
          {
            account: "work",
            project: "/Users/nasser/Desktop/Work/ClientPortal",
            current: { cost: 45.5, reqs: 28 },
            previous: { cost: 0, reqs: 0 },
            delta: { cost: 45.5, reqs: 28, costPct: null, reqsPct: null },
          },
        ],
      },
    }),
  );
  const markdown = formatMarkdownReport(report);

  assert.deepEqual(report.comparison.previous, { cost: 80, reqs: 40 });
  assert.equal(report.comparison.projects[0].project, "~/Desktop/Personal/SecretApp");
  assert.match(markdown, /Previous 7d: \$80\.00; change \+\$45\.50 \(\+56\.9%\), \+8 requests/);
  assert.match(markdown, /## Project Changes/);
  assert.match(markdown, /\| Project \| Account \| Current \| Previous \| Change \| Requests \|/);
  assert.match(markdown, /~\/Desktop\/Work\/ClientPortal/);
  assert.match(markdown, /\+\$45\.50 \(new\)/);
  assert.doesNotMatch(markdown, /\/Users\/nasser/);
});

test("markdown report warns when no usage records are found", () => {
  const markdown = formatMarkdownReport(
    buildReport(
      baseData({
        totals: { cost: 0, reqs: 0 },
        burn: { today: 0, perDay: 0, projected30d: 0 },
        leaks: { count: 0, totals: { work_pays_personal: 0, personal_pays_work: 0 }, sessions: [] },
        models: [],
        projects: [],
      }),
    ),
  );

  assert.match(markdown, /Status: \*\*WARN\*\*/);
  assert.doesNotMatch(markdown, /Reviewable wrong-account spend/);
  assert.match(markdown, /No Claude Code usage records/);
  assert.match(markdown, /mizan --doctor/);
  assert.match(markdown, /mizan --set-transcripts/);
});

test("markdown report surfaces unpriced model warnings", () => {
  const markdown = formatMarkdownReport(
    buildReport(
      baseData({
        models: [{ model: "claude-future-9", cost: 0, input: 1000, cc: 0, cr: 0, output: 500, reqs: 3 }],
      }),
    ),
  );

  assert.match(markdown, /Unpriced model usage/);
  assert.match(markdown, /claude-future-9/);
});
