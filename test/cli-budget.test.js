import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const bin = path.resolve("bin/mizan.js");

test("--set-budget writes a persistent config file and exits", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-cli-budget-"));
  const configPath = path.join(home, "config.json");
  const result = spawnSync(
    process.execPath,
    [bin, "--set-budget", "daily=20", "monthly=250"],
    {
      env: { ...process.env, MIZAN_CONFIG: configPath },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Saved budgets/);
  assert.match(result.stdout, /daily \$20/);
  assert.match(result.stdout, /monthly \$250/);
  assert.match(result.stdout, /Next:/);
  assert.match(result.stdout, /mizan --check --window 30/);
  assert.match(result.stdout, /mizan --weekly/);

  const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(saved.dailyBudget, 20);
  assert.equal(saved.monthlyBudget, 250);
  assert.equal(saved.host, "127.0.0.1");
});
