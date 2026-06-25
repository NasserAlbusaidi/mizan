import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const bin = path.resolve("bin/mizan.js");

test("--output without a one-shot mode fails before starting the dashboard", () => {
  const result = spawnSync(process.execPath, [bin, "--demo", "--output", "ignored.md"], {
    encoding: "utf8",
    timeout: 1000,
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--output requires/);
  assert.match(result.stderr, /--report/);
  assert.match(result.stderr, /--support-bundle/);
  assert.doesNotMatch(result.stdout + result.stderr, /http:\/\/127\.0\.0\.1/);
});

test("--try prints a demo summary and next steps without starting the dashboard", () => {
  const result = spawnSync(process.execPath, [bin, "--try"], {
    encoding: "utf8",
    timeout: 5000,
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^Mizan try mode/m);
  assert.match(result.stdout, /Demo data only/);
  assert.match(result.stdout, /No local transcripts are read/);
  assert.match(result.stdout, /sample intentionally includes wrong-account leaks/);
  assert.match(result.stdout, /^Mizan summary \[FAIL\] \(demo\)/m);
  assert.match(result.stdout, /Leaks: 2/);
  assert.match(result.stdout, /Reviewable wrong-account spend: \$37\.98/);
  assert.match(result.stdout, /Next:/);
  assert.match(result.stdout, /Install Mizan: npm install -g github:NasserAlbusaidi\/mizan#v0\.1\.58/);
  assert.match(result.stdout, /Fallback install: npm install -g https:\/\/github\.com\/NasserAlbusaidi\/mizan\/releases\/download\/v0\.1\.58\/nasseralbusaidi-mizan-0\.1\.58\.tgz/);
  assert.match(result.stdout, /npm exec --yes --package github:NasserAlbusaidi\/mizan#v0\.1\.58 -- mizan --weekly --demo --output "\$HOME\/Documents\/Mizan\/mizan-demo-weekly\.md"/);
  assert.match(result.stdout, /Open the sample dashboard without install: npm exec --yes --package github:NasserAlbusaidi\/mizan#v0\.1\.58 -- mizan --demo/);
  assert.match(result.stdout, /Fallback no-install demo: npm exec --yes --package https:\/\/github\.com\/NasserAlbusaidi\/mizan\/releases\/download\/v0\.1\.58\/nasseralbusaidi-mizan-0\.1\.58\.tgz -- mizan --try/);
  assert.match(result.stdout, /mizan --weekly --demo --output "\$HOME\/Documents\/Mizan\/mizan-demo-weekly\.md"/);
  assert.match(result.stdout, /mizan --setup/);
  assert.match(result.stdout, /mizan --set-transcripts personal=\/path work=\/path/);
  assert.ok(
    result.stdout.indexOf("Save a sample report now:") <
      result.stdout.indexOf("Open the sample dashboard without install:"),
  );
  assert.ok(
    result.stdout.indexOf("Open the sample dashboard without install:") <
      result.stdout.indexOf("Fallback no-install demo:"),
  );
  assert.ok(result.stdout.indexOf("Fallback no-install demo:") < result.stdout.indexOf("Install Mizan:"));
  assert.ok(result.stdout.indexOf("Install Mizan:") < result.stdout.indexOf("Fallback install:"));
  assert.doesNotMatch(result.stdout + result.stderr, /http:\/\/127\.0\.0\.1/);
});

test("--try ignores saved local budgets so the demo stays self-contained", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-try-demo-home-"));
  const configPath = path.join(home, ".mizan", "config.json");
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(
    configPath,
    `${JSON.stringify(
      {
        personalDir: path.join(home, ".claude", "projects"),
        workDir: path.join(home, ".claude-work", "projects"),
        workMarkers: ["/Desktop/Work/", "/Work-stuff/"],
        dailyBudget: 1,
        monthlyBudget: 1,
        host: "127.0.0.1",
        port: 7777,
      },
      null,
      2,
    )}\n`,
  );

  const result = spawnSync(process.execPath, [bin, "--try"], {
    encoding: "utf8",
    timeout: 5000,
    env: {
      ...process.env,
      HOME: home,
      MIZAN_CONFIG: configPath,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Mizan summary \[FAIL\] \(demo\)/m);
  assert.match(result.stdout, /2 cross-account leaks/);
  assert.doesNotMatch(result.stdout, /Budgets:/);
  assert.doesNotMatch(result.stdout, /monthly budget/);
  assert.doesNotMatch(result.stdout, /daily budget/);
});

test("--setup-kit prints recurring workflow commands without starting the dashboard", () => {
  const result = spawnSync(process.execPath, [bin, "--setup-kit"], {
    encoding: "utf8",
    timeout: 5000,
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^# Mizan Setup Kit/m);
  assert.match(result.stdout, /mizan --doctor --check/);
  assert.match(result.stdout, /mizan --weekly/);
  assert.match(result.stdout, /mizan --csv --window 7/);
  assert.match(result.stdout, /cron/);
  assert.match(result.stdout, /launchd/);
  assert.match(result.stdout, /Do not attach raw transcripts/);
  assert.doesNotMatch(result.stdout + result.stderr, /http:\/\/127\.0\.0\.1/);
});

test("--setup-kit --output writes the recurring setup artifact", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-setup-kit-"));
  const output = path.join(dir, "nested", "setup-kit.md");
  const result = spawnSync(process.execPath, [bin, "--setup-kit", "--output", output], {
    encoding: "utf8",
    timeout: 5000,
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Wrote setup kit to/);
  const body = fs.readFileSync(output, "utf8");
  assert.match(body, /^# Mizan Setup Kit/m);
  assert.match(body, /mizan --weekly/);
  assert.match(body, /mizan --csv --window 7/);
  assert.match(body, /Do not attach raw transcripts/);
  assert.doesNotMatch(result.stdout + result.stderr, /http:\/\/127\.0\.0\.1/);
});

test("--feedback prints safe issue guidance without starting the dashboard", () => {
  const result = spawnSync(process.execPath, [bin, "--feedback"], {
    encoding: "utf8",
    timeout: 5000,
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^# Mizan Feedback/m);
  assert.match(result.stdout, /https:\/\/github\.com\/NasserAlbusaidi\/mizan\/issues\/new\/choose/);
  assert.match(result.stdout, /mizan --support-bundle --output mizan-support\.md/);
  assert.match(result.stdout, /Choose Bug report for setup, parsing, dashboard, or packaging problems/);
  assert.match(result.stdout, /Choose Feature request for workflow improvements that keep Mizan local-first/);
  assert.match(result.stdout, /Do not attach raw transcripts/);
  assert.match(result.stdout, /what you expected/i);
  assert.doesNotMatch(result.stdout + result.stderr, /http:\/\/127\.0\.0\.1/);
});

test("--feedback --output writes the safe issue guide", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-feedback-"));
  const output = path.join(dir, "feedback.md");
  const result = spawnSync(process.execPath, [bin, "--feedback", "--output", output], {
    encoding: "utf8",
    timeout: 5000,
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Wrote feedback guide to/);
  const body = fs.readFileSync(output, "utf8");
  assert.match(body, /^# Mizan Feedback/m);
  assert.match(body, /mizan --support-bundle --output mizan-support\.md/);
  assert.match(body, /Choose Bug report for setup, parsing, dashboard, or packaging problems/);
  assert.match(body, /Choose Feature request for workflow improvements that keep Mizan local-first/);
  assert.match(body, /Do not attach raw transcripts/);
});

test("--csv prints a redacted reimbursement export without starting the dashboard", () => {
  const result = spawnSync(process.execPath, [bin, "--csv", "--demo", "--window", "7"], {
    encoding: "utf8",
    timeout: 5000,
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /^row_type,project,account,spend_usd,requests,output_tokens,duration_minutes,model,note/m,
  );
  assert.match(result.stdout, /^account,,personal,31\.66,6,746000,,,account total/m);
  assert.match(result.stdout, /^project,~\/Desktop\/Personal\/Rihla,personal,26\.98,4,632000,,,project total/m);
  assert.match(
    result.stdout,
    /^session,~\/Desktop\/Personal\/starfield,work,33\.30,2,610000,14,claude-opus-4-8,costliest session/m,
  );
  assert.doesNotMatch(result.stdout, /\/Users\//);
  assert.doesNotMatch(result.stdout + result.stderr, /http:\/\/127\.0\.0\.1/);
});

test("--csv --output writes the reimbursement export", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-csv-output-"));
  const output = path.join(dir, "reports", "weekly.csv");
  const result = spawnSync(process.execPath, [bin, "--csv", "--demo", "--window", "7", "--output", output], {
    encoding: "utf8",
    timeout: 5000,
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`Wrote CSV export to ${escapeRegExp(output)}`));
  const body = fs.readFileSync(output, "utf8");
  assert.match(body, /^row_type,project,account,spend_usd,requests,output_tokens,duration_minutes,model,note/m);
  assert.match(body, /^project,~\/Desktop\/Personal\/Rihla,personal,26\.98,4,632000,,,project total/m);
  assert.doesNotMatch(body, /\/Users\//);
  assert.doesNotMatch(result.stdout + result.stderr, /http:\/\/127\.0\.0\.1/);
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
