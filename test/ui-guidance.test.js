import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("dashboard setup guidance prefers persistent setup commands", () => {
  const app = fs.readFileSync("public/app.js", "utf8");

  assert.match(app, /mizan --set-transcripts/);
  assert.match(app, /mizan --set-budget/);
  assert.doesNotMatch(app, /MIZAN_PERSONAL_DIR/);
  assert.doesNotMatch(app, /MIZAN_WORK_DIR/);
  assert.doesNotMatch(app, /MIZAN_MONTHLY_BUDGET/);
});

test("dashboard exposes a copyable weekly review command", () => {
  const app = fs.readFileSync("public/app.js", "utf8");
  const css = fs.readFileSync("public/styles.css", "utf8");

  assert.match(app, /mizan --report --window 7/);
  assert.match(app, /data-copy-command/);
  assert.match(app, /copyActionCommand/);
  assert.match(css, /\.action-command/);
  assert.match(css, /\.mini-copy/);
});

test("dashboard empty state gives users a copyable demo command first", () => {
  const app = fs.readFileSync("public/app.js", "utf8");

  assert.match(app, /Preview demo data first/);
  assert.match(app, /command: "mizan --demo"/);
  assert.match(app, /Run setup diagnostics/);
  assert.match(app, /command: "mizan --setup"/);
  assert.match(app, /command: "mizan --set-transcripts personal=\/path work=\/path"/);
});

test("dashboard exposes a one-day spend window tab", () => {
  const index = fs.readFileSync("public/index.html", "utf8");

  assert.match(index, /data-window="1">1d/);
  assert.match(index, /role="tablist"/);
});

test("dashboard action queue warns about unpriced model usage", () => {
  const app = fs.readFileSync("public/app.js", "utf8");

  assert.match(app, /Unpriced model usage/);
  assert.match(app, /findUnpricedModels/);
  assert.match(app, /Totals may be understated/);
});
