import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const bin = path.resolve("bin/mizan.js");

test("--report --check prints the report and exits nonzero when the report fails", () => {
  const result = spawnSync(process.execPath, [bin, "--report", "--check", "--demo", "--window", "7"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 2);
  assert.match(result.stdout, /^# Mizan Spend Report/m);
  assert.doesNotMatch(result.stdout, /^Mizan summary/m);
});

test("--report --output writes a redacted report file and keeps check exit status", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-report-output-"));
  const output = path.join(dir, "nested", "weekly.md");
  const result = spawnSync(
    process.execPath,
    [bin, "--report", "--check", "--demo", "--window", "7", "--output", output],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 2);
  assert.match(result.stdout, new RegExp(`Wrote report to ${escapeRegExp(output)}`));
  const report = fs.readFileSync(output, "utf8");
  assert.match(report, /^# Mizan Spend Report/m);
  assert.match(report, /Paths are redacted/);
  assert.doesNotMatch(report, new RegExp(escapeRegExp(os.homedir())));
});

test("--weekly prints a redacted seven-day report", () => {
  const result = spawnSync(process.execPath, [bin, "--weekly", "--demo"], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^# Mizan Spend Report/m);
  assert.match(result.stdout, /Window: last 7d/);
  assert.match(result.stdout, /Reviewable wrong-account spend: \$37\.98/);
  assert.match(result.stdout, /## Next Steps/);
  assert.match(result.stdout, /npm install -g github:NasserAlbusaidi\/mizan#v0\.1\.46/);
  assert.match(result.stdout, /mizan --setup/);
  assert.doesNotMatch(result.stdout, /^Mizan summary/m);
});

test("--weekly --output writes the seven-day report", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-weekly-output-"));
  const output = path.join(dir, "weekly.md");
  const result = spawnSync(process.execPath, [bin, "--weekly", "--demo", "--output", output], {
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`Wrote report to ${escapeRegExp(output)}`));
  const report = fs.readFileSync(output, "utf8");
  assert.match(report, /^# Mizan Spend Report/m);
  assert.match(report, /Window: last 7d/);
  assert.match(report, /Reviewable wrong-account spend: \$37\.98/);
  assert.match(report, /## Next Steps/);
  assert.match(report, /mizan --weekly --output "\$HOME\/Documents\/Mizan\/mizan-weekly-\$\(date \+%F\)\.md"/);
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
