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
