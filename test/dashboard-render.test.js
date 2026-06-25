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
  "download-report",
  "download-csv",
  "updated",
];

function makeElement(id) {
  const listeners = {};
  return {
    id,
    hidden: false,
    innerHTML: "",
    textContent: "",
    disabled: false,
    href: "",
    download: "",
    listeners,
    classList: {
      add() {},
      remove() {},
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    closest() {
      return null;
    },
    click() {},
    remove() {},
    setAttribute() {},
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
  const elements = await renderDashboard();

  const kpis = elements.get("kpis").innerHTML;
  assert.match(kpis, /Spend · last 7d/);
  assert.match(kpis, /\+\$45\.50 \(\+56\.9%\) vs previous 7d/);
  assert.match(kpis, /\+8 reqs vs previous 7d/);
});

test("dashboard action queue warns when spend jumps versus the previous window", async () => {
  const elements = await renderDashboard();

  const actions = elements.get("actions").innerHTML;
  assert.match(actions, /Spend jumped vs previous window/);
  assert.match(actions, /\+\$45\.50 \(\+56\.9%\) versus the previous 7d/);
  assert.match(actions, /mizan --report --window 7/);
  assert.match(actions, /mizan --weekly --output &quot;\$HOME\/Documents\/Mizan\/mizan-weekly-\$\(date \+%F\)\.md&quot;/);
});

test("dashboard action queue keeps budget warnings above softer habit actions", async () => {
  const elements = await renderDashboard({
    config: {
      ...dashboardData().config,
      budgets: { daily: 5, monthly: 100 },
    },
    burn: { today: 11, perDay: 4.2, projected30d: 126 },
  });

  const actions = elements.get("actions").innerHTML;
  assert.match(actions, /Daily budget crossed/);
  assert.match(actions, /\$11\.00 spent today against a \$5\.00 daily budget/);
  assert.match(actions, /Monthly projection is over budget/);
  assert.match(actions, /projects to \$126/);
});

test("dashboard monthly burn warning exposes a copyable budget command", async () => {
  const elements = await renderDashboard();

  const actions = elements.get("actions").innerHTML;
  assert.match(actions, /Monthly burn is worth watching/);
  assert.match(actions, /Track it with mizan --set-budget monthly=126/);
  assert.match(actions, /data-copy-command="mizan --set-budget monthly=126"/);
});

test("dashboard setup and scriptable snapshot guidance expose copyable commands", async () => {
  const elements = await renderDashboard({
    config: {
      ...dashboardData().config,
      demo: false,
      accounts: [{ account: "work", dir: "/missing/work", exists: false }],
    },
    totals: { cost: 12, reqs: 3, output: 1_000 },
    burn: { today: 1, perDay: 0.5, projected30d: 15 },
    comparison: null,
    projects: [],
  });

  const actions = elements.get("actions").innerHTML;
  assert.match(actions, /work account folder was not found/);
  assert.match(actions, /data-copy-command="mizan --set-transcripts work=\/path\/to\/projects"/);
  assert.match(actions, /Need a scriptable snapshot\?/);
  assert.match(actions, /data-copy-command="mizan --json --window 30"/);
});

test("dashboard leak action explains marker fixes", async () => {
  const elements = await renderDashboard({
    leaks: {
      count: 1,
      totals: { work_pays_personal: 12, personal_pays_work: 0 },
      sessions: [{ account: "work", project: "~/Clients/Acme", cost: 12 }],
    },
  });

  const actions = elements.get("actions").innerHTML;
  assert.match(actions, /Stop the account leak first/);
  assert.match(actions, /mizan --add-work-marker/);
  assert.match(actions, /data-copy-command="mizan --add-work-marker \/Clients\/"/);
  assert.match(actions, /really work/);
});

test("dashboard report download saves the redacted Markdown report", async () => {
  const downloads = [];
  const elements = await renderDashboard(
    {},
    {
      reportMarkdown: "# Mizan Spend Report\n\nPaths are redacted\n",
      downloads,
    },
  );

  await elements.get("download-report").listeners.click();

  assert.equal(downloads.length, 1);
  assert.match(downloads[0].href, /^blob:mizan-report$/);
  assert.match(downloads[0].download, /^mizan-report-30-\d{4}-\d{2}-\d{2}\.md$/);
  assert.equal(elements.get("download-report").textContent, "Saved");
});

test("dashboard CSV download saves the redacted spreadsheet export", async () => {
  const downloads = [];
  const elements = await renderDashboard(
    {},
    {
      reportCsv: "row_type,project,account,spend_usd\nproject,~/mizan,personal,12.50\n",
      downloads,
    },
  );

  await elements.get("download-csv").listeners.click();

  assert.equal(downloads.length, 1);
  assert.match(downloads[0].href, /^blob:mizan-report$/);
  assert.match(downloads[0].download, /^mizan-report-30-\d{4}-\d{2}-\d{2}\.csv$/);
  assert.equal(elements.get("download-csv").textContent, "Saved CSV");
});

async function renderDashboard(overrides = {}, options = {}) {
  const elements = new Map(ids.map((id) => [id, makeElement(id)]));
  const downloads = options.downloads || [];
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
    fetch: async (url) =>
      String(url).startsWith("/api/report")
        ? {
            ok: true,
            text: async () =>
              String(url).includes("format=csv")
                ? options.reportCsv || "row_type,project,account,spend_usd\n"
                : options.reportMarkdown || "# Mizan Spend Report\n",
          }
        : {
            ok: true,
            json: async () => dashboardData(overrides),
          },
    Blob,
    URL: {
      createObjectURL() {
        return "blob:mizan-report";
      },
      revokeObjectURL() {},
    },
    document: {
      body: {
        appendChild() {},
      },
      createElement(tag) {
        const element = makeElement(tag);
        element.click = () => {
          if (tag === "a") downloads.push({ href: element.href, download: element.download });
        };
        return element;
      },
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
  return elements;
}
