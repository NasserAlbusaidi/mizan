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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
