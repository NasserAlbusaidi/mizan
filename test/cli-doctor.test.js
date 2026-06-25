import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const bin = path.resolve("bin/mizan.js");

test("--doctor --check exits nonzero when no transcript folders are usable", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-check-missing-"));
  const result = spawnSync(process.execPath, [bin, "--doctor", "--check"], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      MIZAN_CONFIG: path.join(home, ".mizan", "config.json"),
    },
  });

  assert.equal(result.status, 2);
  assert.match(result.stdout, /^Mizan doctor/m);
  assert.match(result.stdout, /No transcript folders were found/);
  assert.match(result.stdout, /Run Claude Code once/);
  assert.match(result.stdout, /mizan --setup --fix/);
  assert.match(result.stdout, /mizan --weekly --demo --output "\$HOME\/Documents\/Mizan\/mizan-demo-weekly\.md"/);
});

test("--doctor --check exits zero when transcript setup is usable", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-check-ok-"));
  const personal = path.join(root, "personal-projects", "project-a");
  const work = path.join(root, "work-projects", "project-b");
  fs.mkdirSync(personal, { recursive: true });
  fs.mkdirSync(work, { recursive: true });
  fs.writeFileSync(path.join(personal, "a.jsonl"), `${usageLine("personal-a")}\n`);
  fs.writeFileSync(path.join(work, "b.jsonl"), `${usageLine("work-b")}\n`);

  const result = spawnSync(process.execPath, [bin, "--doctor", "--check"], {
    encoding: "utf8",
    env: {
      ...process.env,
      MIZAN_CONFIG: path.join(root, ".mizan", "config.json"),
      MIZAN_PERSONAL_DIR: path.join(root, "personal-projects"),
      MIZAN_WORK_DIR: path.join(root, "work-projects"),
    },
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Setup looks usable/);
  assert.match(result.stdout, /1 usage record/);
});

test("--doctor --check exits nonzero when transcript files have no parseable usage", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-check-empty-"));
  const personal = path.join(root, "personal-projects", "project-a");
  fs.mkdirSync(personal, { recursive: true });
  fs.writeFileSync(path.join(personal, "empty.jsonl"), "{}\n");

  const result = spawnSync(process.execPath, [bin, "--doctor", "--check"], {
    encoding: "utf8",
    env: {
      ...process.env,
      MIZAN_CONFIG: path.join(root, ".mizan", "config.json"),
      MIZAN_PERSONAL_DIR: path.join(root, "personal-projects"),
      MIZAN_WORK_DIR: path.join(root, "work-projects"),
    },
  });

  assert.equal(result.status, 2);
  assert.match(result.stdout, /1 transcript, 0 usage records/);
  assert.match(result.stdout, /no parseable usage records/i);
});

test("--doctor suggests a discovered default transcript folder when saved paths are wrong", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-suggest-cli-"));
  const personal = path.join(home, ".claude", "projects", "project-a");
  fs.mkdirSync(personal, { recursive: true });
  fs.writeFileSync(path.join(personal, "usage.jsonl"), `${usageLine("suggest-cli")}\n`);

  const result = spawnSync(process.execPath, [bin, "--doctor"], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      MIZAN_CONFIG: path.join(home, ".mizan", "config.json"),
      MIZAN_PERSONAL_DIR: path.join(home, "wrong-personal"),
      MIZAN_WORK_DIR: path.join(home, "wrong-work"),
    },
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Found parseable personal usage records/);
  assert.match(result.stdout, /mizan --set-transcripts personal='/);
  assert.match(result.stdout, new RegExp(escapeRegExp(path.join(home, ".claude", "projects"))));
});

test("--doctor --fix saves discovered transcript folders and rechecks setup", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-fix-cli-"));
  const configPath = path.join(home, ".mizan", "config.json");
  const personal = path.join(home, ".claude", "projects", "project-a");
  const work = path.join(home, ".claude-work", "projects", "project-b");
  fs.mkdirSync(personal, { recursive: true });
  fs.mkdirSync(work, { recursive: true });
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(path.join(personal, "usage.jsonl"), `${usageLine("fix-personal")}\n`);
  fs.writeFileSync(path.join(work, "usage.jsonl"), `${usageLine("fix-work")}\n`);
  fs.writeFileSync(
    configPath,
    `${JSON.stringify(
      {
        personalDir: path.join(home, "wrong-personal"),
        workDir: path.join(home, "wrong-work"),
        workMarkers: ["/Clients/"],
        dailyBudget: 12,
        monthlyBudget: 120,
        port: 7777,
        host: "127.0.0.1",
      },
      null,
      2,
    )}\n`,
  );

  const result = spawnSync(process.execPath, [bin, "--doctor", "--fix", "--check"], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      MIZAN_CONFIG: configPath,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`Saved discovered transcript folders to ${escapeRegExp(configPath)}`));
  assert.match(result.stdout, /Setup looks usable/);
  assert.match(result.stdout, /personal\s+1 transcript/);
  assert.match(result.stdout, /work\s+1 transcript/);

  const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(saved.personalDir, path.join(home, ".claude", "projects"));
  assert.equal(saved.workDir, path.join(home, ".claude-work", "projects"));
  assert.equal(saved.dailyBudget, 12);
  assert.deepEqual(saved.workMarkers, ["/Clients/"]);
});

test("--setup creates a config and exits nonzero when setup is still unusable", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-setup-missing-"));
  const configPath = path.join(home, ".mizan", "config.json");
  const result = spawnSync(process.execPath, [bin, "--setup"], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      MIZAN_CONFIG: configPath,
    },
  });

  assert.equal(result.status, 2);
  assert.match(result.stdout, new RegExp(`Created ${escapeRegExp(configPath)}`));
  assert.match(result.stdout, /^Mizan doctor/m);
  assert.match(result.stdout, /No transcript folders were found/);
  assert.match(result.stdout, /Run Claude Code once/);
  assert.match(result.stdout, /mizan --setup --fix/);
  assert.match(result.stdout, /mizan --weekly --demo --output "\$HOME\/Documents\/Mizan\/mizan-demo-weekly\.md"/);

  const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(saved.personalDir, path.join(home, ".claude", "projects"));
  assert.equal(saved.workDir, path.join(home, ".claude-work", "projects"));
  assert.equal(saved.host, "127.0.0.1");
});

test("--setup keeps an existing config and exits zero when transcripts are usable", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-setup-ok-"));
  const configPath = path.join(root, ".mizan", "config.json");
  const personalDir = path.join(root, "personal-projects");
  const workDir = path.join(root, "work-projects");
  fs.mkdirSync(path.join(personalDir, "project-a"), { recursive: true });
  fs.writeFileSync(path.join(personalDir, "project-a", "usage.jsonl"), `${usageLine("setup-personal")}\n`);
  fs.mkdirSync(path.join(workDir, "project-b"), { recursive: true });
  fs.writeFileSync(path.join(workDir, "project-b", "usage.jsonl"), `${usageLine("setup-work")}\n`);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(
    configPath,
    `${JSON.stringify(
      {
        personalDir,
        workDir,
        workMarkers: ["/Clients/"],
        dailyBudget: 12,
        monthlyBudget: 120,
        port: 7777,
        host: "127.0.0.1",
      },
      null,
      2,
    )}\n`,
  );

  const result = spawnSync(process.execPath, [bin, "--setup"], {
    encoding: "utf8",
    env: {
      ...process.env,
      MIZAN_CONFIG: configPath,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`Config already exists at ${escapeRegExp(configPath)}`));
  assert.match(result.stdout, /Setup looks usable/);
  assert.match(result.stdout, /mizan --weekly --output "\$HOME\/Documents\/Mizan\/mizan-weekly-\$\(date \+%F\)\.md"/);

  const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
  assert.equal(saved.dailyBudget, 12);
  assert.deepEqual(saved.workMarkers, ["/Clients/"]);
});

test("--init-config tells the user how to verify the new config", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-init-next-"));
  const configPath = path.join(home, ".mizan", "config.json");
  const result = spawnSync(process.execPath, [bin, "--init-config"], {
    encoding: "utf8",
    env: {
      ...process.env,
      HOME: home,
      MIZAN_CONFIG: configPath,
    },
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`Created ${escapeRegExp(configPath)}`));
  assert.match(result.stdout, /Next:/);
  assert.match(result.stdout, /mizan --doctor --check/);
  assert.match(result.stdout, /mizan --set-transcripts personal=\/path work=\/path/);
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function usageLine(id) {
  return JSON.stringify({
    timestamp: "2026-06-24T12:00:00.000Z",
    cwd: "/tmp/project",
    sessionId: `session-${id}`,
    requestId: `request-${id}`,
    message: {
      id: `message-${id}`,
      model: "claude-sonnet-4-6",
      usage: {
        input_tokens: 100,
        output_tokens: 20,
      },
    },
  });
}
