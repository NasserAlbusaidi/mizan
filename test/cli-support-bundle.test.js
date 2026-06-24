import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const bin = path.resolve("bin/mizan.js");

test("--support-bundle prints redacted Markdown diagnostics", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-support-home-"));
  const personal = path.join(home, ".claude", "projects", "project-a");
  fs.mkdirSync(personal, { recursive: true });
  fs.writeFileSync(path.join(personal, "a.jsonl"), "{}\n");

  const result = spawnSync(process.execPath, [bin, "--support-bundle"], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      MIZAN_CONFIG: path.join(home, ".mizan", "config.json"),
      MIZAN_PERSONAL_DIR: path.join(home, ".claude", "projects"),
      MIZAN_WORK_DIR: path.join(home, ".claude-work", "projects"),
    },
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /^# Mizan Support Bundle/m);
  assert.match(result.stdout, /Mizan: @nasseralbusaidi\/mizan 0\.1\.5/);
  assert.match(result.stdout, /## Doctor/m);
  assert.match(result.stdout, /~\/\.claude\/projects/);
  assert.match(result.stdout, /No raw transcript lines are included/);
  assert.doesNotMatch(result.stdout, new RegExp(escapeRegExp(home)));
});

test("--support-bundle --output writes the redacted bundle", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-support-output-home-"));
  const output = path.join(home, "reports", "support.md");
  const result = spawnSync(process.execPath, [bin, "--support-bundle", "--output", output], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      MIZAN_CONFIG: path.join(home, ".mizan", "config.json"),
      MIZAN_PERSONAL_DIR: path.join(home, ".claude", "projects"),
      MIZAN_WORK_DIR: path.join(home, ".claude-work", "projects"),
    },
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, new RegExp(`Wrote support bundle to ${escapeRegExp(output)}`));
  const markdown = fs.readFileSync(output, "utf8");
  assert.match(markdown, /^# Mizan Support Bundle/m);
  assert.doesNotMatch(markdown, new RegExp(escapeRegExp(home)));
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
