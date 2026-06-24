import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const bin = path.resolve("bin/mizan.js");

test("--add-work-marker writes persistent leak-detection markers and exits", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-cli-marker-"));
  const configPath = path.join(home, "config.json");
  const result = spawnSync(
    process.execPath,
    [bin, "--add-work-marker", "/Clients/", "/Company/"],
    {
      env: { ...process.env, MIZAN_CONFIG: configPath },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Saved work markers/);
  assert.match(result.stdout, /\/Clients\//);
  assert.match(result.stdout, /\/Company\//);
  assert.match(result.stdout, /Next:/);
  assert.match(result.stdout, /mizan --summary --window 7/);
  assert.match(result.stdout, /mizan --weekly/);

  const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.deepEqual(saved.workMarkers, ["/Desktop/Work/", "/Work-stuff/", "/Clients/", "/Company/"]);
  assert.equal(saved.host, "127.0.0.1");
});
