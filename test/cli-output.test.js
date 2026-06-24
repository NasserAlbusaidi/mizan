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
  assert.match(result.stdout, /Next:/);
  assert.match(result.stdout, /mizan --demo/);
  assert.match(result.stdout, /mizan --setup/);
  assert.match(result.stdout, /mizan --set-transcripts personal=\/path work=\/path/);
  assert.doesNotMatch(result.stdout + result.stderr, /http:\/\/127\.0\.0\.1/);
});

test("--setup-kit prints recurring workflow commands without starting the dashboard", () => {
  const result = spawnSync(process.execPath, [bin, "--setup-kit"], {
    encoding: "utf8",
    timeout: 5000,
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^# Mizan Setup Kit/m);
  assert.match(result.stdout, /mizan --doctor --check/);
  assert.match(result.stdout, /mizan --report --window 7/);
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
  assert.match(body, /mizan --report --window 7/);
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
  assert.match(body, /Do not attach raw transcripts/);
});
