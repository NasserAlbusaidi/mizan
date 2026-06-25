import { spawnSync } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";

test("install helper dry-runs the versioned GitHub release tarball install", () => {
  const result = spawnSync("bash", ["scripts/install.sh"], {
    encoding: "utf8",
    env: {
      ...process.env,
      MIZAN_INSTALL_DRY_RUN: "1",
      MIZAN_INSTALL_VERSION: "0.1.68",
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Mizan installer/);
  assert.match(
    result.stdout,
    /npm install -g https:\/\/github\.com\/NasserAlbusaidi\/mizan\/releases\/download\/v0\.1\.68\/nasseralbusaidi-mizan-0\.1\.68\.tgz/,
  );
  assert.match(result.stdout, /Dry run only/);
});
