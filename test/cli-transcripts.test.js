import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const bin = path.resolve("bin/mizan.js");

test("--set-transcripts writes persistent transcript directories and exits", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-cli-transcripts-"));
  const configPath = path.join(home, "config.json");
  const result = spawnSync(
    process.execPath,
    [bin, "--set-transcripts", `personal=${path.join(home, "personal")}`, `work=${path.join(home, "work")}`],
    {
      env: { ...process.env, MIZAN_CONFIG: configPath },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Saved transcript folders/);
  assert.match(result.stdout, /personal/);
  assert.match(result.stdout, /work/);
  assert.match(result.stdout, /Next:/);
  assert.match(result.stdout, /mizan --doctor --check/);
  assert.match(result.stdout, /mizan/);

  const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(saved.personalDir, path.join(home, "personal"));
  assert.equal(saved.workDir, path.join(home, "work"));
  assert.equal(saved.host, "127.0.0.1");
});
