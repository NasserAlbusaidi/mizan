import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

test("install verifier still packs a tarball when parent npm lifecycle is dry-run", () => {
  const result = spawnSync(process.execPath, ["scripts/verify-install.mjs"], {
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_dry_run: "true",
    },
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /install check passed/);
  assert.deepEqual(findTarballs(), []);
});

function findTarballs() {
  return fs.readdirSync(".").filter((entry) => entry.endsWith(".tgz"));
}
