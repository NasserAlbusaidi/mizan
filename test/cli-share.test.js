import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const bin = path.resolve("bin/mizan.js");

test("--share prints safe public launch copy without reading transcripts", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-share-home-"));
  const result = spawnSync(process.execPath, [bin, "--share"], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      MIZAN_CONFIG: path.join(home, ".mizan", "config.json"),
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^# Share Mizan/m);
  assert.match(result.stdout, /private Claude Code spend dashboard/i);
  assert.match(result.stdout, /npm exec --yes --package github:NasserAlbusaidi\/mizan#v0\.1\.22 -- mizan --try/);
  assert.match(result.stdout, /npm install -g github:NasserAlbusaidi\/mizan#v0\.1\.22/);
  assert.match(result.stdout, /No account\. No upload\. Local-only by default\./);
  assert.match(result.stdout, /mizan --feedback/);
  assert.doesNotMatch(result.stdout, new RegExp(escapeRegExp(home)));
});

test("--share --output writes the public launch copy", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-share-output-home-"));
  const output = path.join(home, "launch", "share.md");
  const result = spawnSync(process.execPath, [bin, "--share", "--output", output], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      MIZAN_CONFIG: path.join(home, ".mizan", "config.json"),
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`Wrote share guide to ${escapeRegExp(output)}`));
  const markdown = fs.readFileSync(output, "utf8");
  assert.match(markdown, /^# Share Mizan/m);
  assert.match(markdown, /github:NasserAlbusaidi\/mizan#v0\.1\.22/);
  assert.doesNotMatch(markdown, new RegExp(escapeRegExp(home)));
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
