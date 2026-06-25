import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.js";

// Spin the real server on an ephemeral port so we exercise the actual
// request handler (not a mock). Port 0 => OS picks a free port.
let server;
let base;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

// Regression: static assets were served with no caching headers and no
// validators, so browsers heuristically cached charts.js. After an edit, the
// open tab kept running stale JS (a negative-radius donut threw arc(-6)).
// Static responses must tell the browser not to reuse a cached copy.
test("static assets are served with cache-control: no-store", async () => {
  for (const path of ["/", "/charts.js", "/app.js", "/styles.css"]) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200, `${path} should 200`);
    assert.equal(
      res.headers.get("cache-control"),
      "no-store",
      `${path} must send cache-control: no-store so edited assets never go stale`,
    );
  }
});

test("status endpoint exposes local runtime configuration without scanning transcripts", async () => {
  const res = await fetch(base + "/api/status");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.config.localOnly, true);
  assert.ok(Array.isArray(body.config.accounts));
  assert.ok(Array.isArray(body.config.workMarkers));
});

test("demo server returns sample rollups without reading local transcript state", async () => {
  const demoServer = createServer({ demo: true });
  await new Promise((resolve) => demoServer.listen(0, "127.0.0.1", resolve));
  try {
    const demoBase = `http://127.0.0.1:${demoServer.address().port}`;
    const res = await fetch(demoBase + "/api/data?window=30");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.config.demo, true);
    assert.deepEqual(body.config.budgets, { daily: null, monthly: null });
    assert.equal(body.config.configFile.path, "demo://config");
    assert.equal(body.config.cacheFile, "demo://cache");
    assert.deepEqual(
      body.config.accounts.map((account) => [account.account, account.dir, account.exists]),
      [
        ["personal", "demo://personal", true],
        ["work", "demo://work", true],
      ],
    );
    assert.equal(body.stats.demo, true);
    assert.ok(body.totals.reqs > 0);
    assert.ok(body.leaks.count > 0, "demo data should demonstrate the core leak-detection value");
  } finally {
    await new Promise((resolve) => demoServer.close(resolve));
  }
});

test("demo server accepts the one-day dashboard window", async () => {
  const demoServer = createServer({ demo: true });
  await new Promise((resolve) => demoServer.listen(0, "127.0.0.1", resolve));
  try {
    const demoBase = `http://127.0.0.1:${demoServer.address().port}`;
    const res = await fetch(demoBase + "/api/data?window=1");
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.window.days, 1);
    assert.equal(body.config.demo, true);
  } finally {
    await new Promise((resolve) => demoServer.close(resolve));
  }
});

test("report endpoint returns redacted Markdown, JSON, and CSV for the current window", async () => {
  const demoServer = createServer({ demo: true });
  await new Promise((resolve) => demoServer.listen(0, "127.0.0.1", resolve));
  try {
    const demoBase = `http://127.0.0.1:${demoServer.address().port}`;

    const markdownRes = await fetch(demoBase + "/api/report?window=7");
    assert.equal(markdownRes.status, 200);
    assert.equal(markdownRes.headers.get("content-type"), "text/markdown; charset=utf-8");
    assert.equal(markdownRes.headers.get("cache-control"), "no-store");
    const markdown = await markdownRes.text();
    assert.match(markdown, /^# Mizan Spend Report/m);
    assert.match(markdown, /Paths are redacted/);
    assert.doesNotMatch(markdown, new RegExp(process.env.HOME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

    const jsonRes = await fetch(demoBase + "/api/report?window=7&format=json");
    assert.equal(jsonRes.status, 200);
    assert.equal(jsonRes.headers.get("cache-control"), "no-store");
    const json = await jsonRes.json();
    assert.equal(json.status, "fail");
    assert.equal(json.privacy.redacted, true);
    assert.ok(json.topLeaks.length > 0);

    const csvRes = await fetch(demoBase + "/api/report?window=7&format=csv");
    assert.equal(csvRes.status, 200);
    assert.equal(csvRes.headers.get("content-type"), "text/csv; charset=utf-8");
    assert.equal(csvRes.headers.get("cache-control"), "no-store");
    const csv = await csvRes.text();
    assert.match(csv, /^row_type,project,account,spend_usd/m);
    assert.match(csv, /^project,~\/Desktop\/Personal\/Rihla,personal/m);
    assert.match(csv, /^session,~\/Desktop\/Personal\/starfield,work/m);
    assert.doesNotMatch(csv, new RegExp(process.env.HOME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } finally {
    await new Promise((resolve) => demoServer.close(resolve));
  }
});
