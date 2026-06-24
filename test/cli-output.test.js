import { spawnSync } from "node:child_process";
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
  assert.match(result.stdout, /^Mizan summary \[FAIL\] \(demo\)/m);
  assert.match(result.stdout, /Leaks: 2/);
  assert.match(result.stdout, /Next:/);
  assert.match(result.stdout, /mizan --demo/);
  assert.match(result.stdout, /mizan --setup/);
  assert.match(result.stdout, /mizan --set-transcripts personal=\/path work=\/path/);
  assert.doesNotMatch(result.stdout + result.stderr, /http:\/\/127\.0\.0\.1/);
});
