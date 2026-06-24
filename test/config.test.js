import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  budgetIssues,
  defaultConfig,
  loadUserConfig,
  resolveAccounts,
  resolveBudgets,
  resolveHost,
  resolvePort,
  resolveWorkMarkers,
  writeBudgetConfig,
  writeDefaultConfig,
  writeTranscriptConfig,
  writeWorkMarkerConfig,
} from "../src/config.js";

test("resolveAccounts uses common Claude Code defaults", () => {
  const accounts = resolveAccounts({}, "/home/alex");
  assert.equal(accounts.personal, "/home/alex/.claude/projects");
  assert.equal(accounts.work, "/home/alex/.claude-work/projects");
});

test("resolveAccounts honors CLAUDE_CONFIG_DIR and explicit transcript directories", () => {
  const accounts = resolveAccounts(
    {
      CLAUDE_CONFIG_DIR: "/tmp/claude-alt",
      MIZAN_PERSONAL_DIR: "/vault/personal-projects",
      MIZAN_WORK_DIR: "/vault/work-projects",
    },
    "/home/alex",
  );
  assert.equal(accounts.personal, "/vault/personal-projects");
  assert.equal(accounts.work, "/vault/work-projects");

  const withConfigDir = resolveAccounts({ CLAUDE_CONFIG_DIR: "/tmp/claude-alt" }, "/home/alex");
  assert.equal(withConfigDir.personal, "/tmp/claude-alt/projects");
  assert.equal(withConfigDir.work, "/home/alex/.claude-work/projects");
});

test("resolveAccounts reads config file values and lets env override them", () => {
  const config = {
    personalDir: "/cfg/personal",
    workDir: "/cfg/work",
  };
  assert.deepEqual(resolveAccounts({}, "/home/alex", config), {
    personal: "/cfg/personal",
    work: "/cfg/work",
  });
  assert.deepEqual(resolveAccounts({ MIZAN_WORK_DIR: "/env/work" }, "/home/alex", config), {
    personal: "/cfg/personal",
    work: "/env/work",
  });
});

test("resolveBudgets accepts positive numeric daily and monthly limits", () => {
  assert.deepEqual(resolveBudgets({ MIZAN_DAILY_BUDGET: "25", MIZAN_MONTHLY_BUDGET: "300" }), {
    daily: 25,
    monthly: 300,
  });
  assert.deepEqual(resolveBudgets({}, {}), { daily: null, monthly: null });
  assert.deepEqual(resolveBudgets({}, { dailyBudget: 12, monthlyBudget: 200 }), {
    daily: 12,
    monthly: 200,
  });
});

test("budgetIssues flags invalid budget environment values", () => {
  assert.deepEqual(budgetIssues({ MIZAN_DAILY_BUDGET: "0", MIZAN_MONTHLY_BUDGET: "coffee" }), [
    'MIZAN_DAILY_BUDGET/dailyBudget must be a positive number of USD; received "0".',
    'MIZAN_MONTHLY_BUDGET/monthlyBudget must be a positive number of USD; received "coffee".',
  ]);
});

test("config helpers load, write, and resolve persistent config files", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-config-"));
  const env = { MIZAN_CONFIG: path.join(home, "custom-config.json") };
  assert.equal(loadUserConfig({ env, home }).exists, false);

  const written = writeDefaultConfig({ env, home });
  assert.equal(written.created, true);
  assert.equal(loadUserConfig({ env, home }).exists, true);
  const saved = JSON.parse(fs.readFileSync(env.MIZAN_CONFIG, "utf8"));
  assert.deepEqual(saved, defaultConfig(home));

  saved.workMarkers = ["/Clients/"];
  saved.dailyBudget = 15;
  saved.port = 7788;
  fs.writeFileSync(env.MIZAN_CONFIG, `${JSON.stringify(saved, null, 2)}\n`);
  const loaded = loadUserConfig({ env, home }).config;
  assert.deepEqual(resolveWorkMarkers(env, loaded), ["/Clients/"]);
  assert.deepEqual(resolveBudgets(env, loaded), { daily: 15, monthly: null });
  assert.equal(resolvePort(env, loaded), 7788);
  assert.equal(resolveHost(env, loaded), "127.0.0.1");

  loaded.host = "0.0.0.0";
  assert.equal(resolveHost(env, loaded), "0.0.0.0");
  assert.equal(resolveHost({ MIZAN_HOST: "localhost" }, loaded), "localhost");
  assert.equal(resolveHost({ MIZAN_HOST: "bad/host" }, loaded), "127.0.0.1");

  const second = writeDefaultConfig({ env, home });
  assert.equal(second.created, false);
});

test("writeBudgetConfig creates config and preserves unrelated settings", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-budget-config-"));
  const env = { MIZAN_CONFIG: path.join(home, "mizan.json") };

  const first = writeBudgetConfig({ daily: 20, monthly: 250 }, { env, home });
  assert.equal(first.created, true);
  assert.equal(first.path, env.MIZAN_CONFIG);
  assert.deepEqual(first.budgets, { daily: 20, monthly: 250 });

  const saved = JSON.parse(fs.readFileSync(env.MIZAN_CONFIG, "utf8"));
  saved.workMarkers = ["/Clients/"];
  fs.writeFileSync(env.MIZAN_CONFIG, `${JSON.stringify(saved, null, 2)}\n`);

  const second = writeBudgetConfig({ daily: null }, { env, home });
  const updated = JSON.parse(fs.readFileSync(env.MIZAN_CONFIG, "utf8"));
  assert.equal(second.created, false);
  assert.equal(updated.dailyBudget, null);
  assert.equal(updated.monthlyBudget, 250);
  assert.deepEqual(updated.workMarkers, ["/Clients/"]);
});

test("writeWorkMarkerConfig appends unique markers and preserves unrelated settings", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-marker-config-"));
  const env = { MIZAN_CONFIG: path.join(home, "mizan.json") };

  const first = writeWorkMarkerConfig(["/Clients/", "/Company/"], { env, home });
  assert.equal(first.created, true);
  assert.deepEqual(first.workMarkers, ["/Desktop/Work/", "/Work-stuff/", "/Clients/", "/Company/"]);

  const saved = JSON.parse(fs.readFileSync(env.MIZAN_CONFIG, "utf8"));
  saved.dailyBudget = 20;
  fs.writeFileSync(env.MIZAN_CONFIG, `${JSON.stringify(saved, null, 2)}\n`);

  const second = writeWorkMarkerConfig(["/Clients/", "/Agency/"], { env, home });
  const updated = JSON.parse(fs.readFileSync(env.MIZAN_CONFIG, "utf8"));
  assert.equal(second.created, false);
  assert.equal(updated.dailyBudget, 20);
  assert.deepEqual(updated.workMarkers, [
    "/Desktop/Work/",
    "/Work-stuff/",
    "/Clients/",
    "/Company/",
    "/Agency/",
  ]);
});

test("writeTranscriptConfig creates config and preserves unrelated settings", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-transcript-config-"));
  const env = { MIZAN_CONFIG: path.join(home, "mizan.json") };

  const first = writeTranscriptConfig({ personal: "/vault/personal", work: "/vault/work" }, { env, home });
  assert.equal(first.created, true);
  assert.deepEqual(first.accounts, { personal: "/vault/personal", work: "/vault/work" });

  const saved = JSON.parse(fs.readFileSync(env.MIZAN_CONFIG, "utf8"));
  saved.dailyBudget = 20;
  fs.writeFileSync(env.MIZAN_CONFIG, `${JSON.stringify(saved, null, 2)}\n`);

  const second = writeTranscriptConfig({ work: "/new/work" }, { env, home });
  const updated = JSON.parse(fs.readFileSync(env.MIZAN_CONFIG, "utf8"));
  assert.equal(second.created, false);
  assert.equal(updated.personalDir, "/vault/personal");
  assert.equal(updated.workDir, "/new/work");
  assert.equal(updated.dailyBudget, 20);
});
