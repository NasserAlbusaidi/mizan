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
  const index = fs.readFileSync("public/index.html", "utf8");
  const app = fs.readFileSync("public/app.js", "utf8");
  const css = fs.readFileSync("public/styles.css", "utf8");

  assert.match(app, /mizan --weekly --output/);
  assert.match(app, /\$HOME\/Documents\/Mizan\/mizan-weekly-\$\(date \+%F\)\.md/);
  assert.match(app, /mizan --setup-kit/);
  assert.match(app, /Make Mizan a weekly habit/);
  assert.match(index, /id="copy-report"/);
  assert.match(index, /id="download-report"/);
  assert.match(index, /id="download-csv"/);
  assert.match(app, /downloadReport/);
  assert.match(app, /downloadCsv/);
  assert.match(app, /format=csv/);
  assert.match(app, /URL\.createObjectURL/);
  assert.match(app, /mizan-report-/);
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

test("dashboard demo mode gives no-install users an install and setup command", () => {
  const app = fs.readFileSync("public/app.js", "utf8");

  assert.match(app, /installAndSetupCommand/);
  assert.match(app, /fallbackInstallAndSetupCommand/);
  assert.match(app, /Install Mizan, then check real setup/);
  assert.match(app, /Fallback GitHub tag install/);
  assert.match(app, /github:NasserAlbusaidi\/mizan#v/);
  assert.match(app, /releases\/download\/v/);
  assert.match(app, /&& mizan --setup/);
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

test("dashboard surfaces project-level spend movers", () => {
  const index = fs.readFileSync("public/index.html", "utf8");
  const app = fs.readFileSync("public/app.js", "utf8");
  const css = fs.readFileSync("public/styles.css", "utf8");

  assert.match(index, /id="panel-project-changes"/);
  assert.match(index, /id="project-changes"/);
  assert.match(app, /renderProjectChanges\(d\)/);
  assert.match(app, /comparison\.projects/);
  assert.match(app, /Project spend is flat versus the previous window/);
  assert.match(css, /\.mover-row/);
  assert.match(css, /\.mover-change/);
});

test("dashboard action commands wrap instead of truncating", () => {
  const css = fs.readFileSync("public/styles.css", "utf8");
  const actionCommandCode = css.match(/\.action-command code\s*\{[^}]+\}/s)?.[0] || "";

  assert.match(actionCommandCode, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(actionCommandCode, /text-overflow:\s*ellipsis/);
  assert.doesNotMatch(actionCommandCode, /white-space:\s*nowrap/);
});
