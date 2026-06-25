import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildDoctorReport, formatDoctorReport } from "../src/doctor.js";

test("doctor reports missing transcript folders with actionable guidance", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-missing-"));
  const report = buildDoctorReport({ home, env: { PATH: "" } });
  const text = formatDoctorReport(report);
  assert.equal(report.ok, false);
  assert.equal(report.claudeCli.found, false);
  assert.equal(report.accounts[0].exists, false);
  assert.match(text, /Claude Code CLI: not found/);
  assert.match(report.recommendations.join("\n"), /mizan --try/);
  assert.match(report.recommendations.join("\n"), /Claude Code CLI was not found on PATH/);
  assert.match(report.recommendations.join("\n"), /Run Claude Code once/);
  assert.match(report.recommendations.join("\n"), /mizan --setup --fix/);
  assert.match(report.recommendations.join("\n"), /mizan --set-transcripts/);
  assert.doesNotMatch(report.recommendations.join("\n"), /MIZAN_PERSONAL_DIR/);
});

test("doctor reports Claude Code CLI version when available", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-claude-cli-"));
  const binDir = path.join(home, "bin");
  fs.mkdirSync(binDir, { recursive: true });
  writeFakeClaude(binDir, "Claude Code 1.2.3");

  const report = buildDoctorReport({ home, env: { PATH: binDir } });
  const text = formatDoctorReport(report);

  assert.equal(report.claudeCli.found, true);
  assert.equal(report.claudeCli.command, "claude");
  assert.equal(report.claudeCli.version, "Claude Code 1.2.3");
  assert.match(text, /Claude Code CLI: found \(Claude Code 1\.2\.3\)/);
  assert.doesNotMatch(report.recommendations.join("\n"), /not found on PATH/);
});

test("doctor distinguishes a failing Claude Code CLI from a missing command", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-claude-cli-error-"));
  const binDir = path.join(home, "bin");
  fs.mkdirSync(binDir, { recursive: true });
  writeFakeClaude(binDir, "claude: login required", { exitCode: 1, stream: "stderr" });

  const report = buildDoctorReport({ home, env: { PATH: binDir } });
  const text = formatDoctorReport(report);

  assert.equal(report.claudeCli.found, true);
  assert.equal(report.claudeCli.version, null);
  assert.equal(report.claudeCli.error, "claude: login required");
  assert.match(text, /Claude Code CLI: found, but version check failed \(claude: login required\)/);
  assert.match(report.recommendations.join("\n"), /Claude Code CLI was found, but `claude --version` failed/);
  assert.doesNotMatch(report.recommendations.join("\n"), /not found on PATH/);
});

test("doctor counts transcripts from explicit personal and work dirs", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-dirs-"));
  const personal = path.join(root, "personal");
  const work = path.join(root, "work");
  fs.mkdirSync(path.join(personal, "project-a"), { recursive: true });
  fs.mkdirSync(path.join(work, "project-b", "nested"), { recursive: true });
  fs.writeFileSync(path.join(personal, "project-a", "a.jsonl"), `${usageLine("personal-a")}\n`);
  fs.writeFileSync(path.join(work, "project-b", "nested", "b.jsonl"), `${usageLine("work-b")}\n`);
  fs.writeFileSync(path.join(work, "project-b", "notes.txt"), "ignore me\n");

  const report = buildDoctorReport({
    home: root,
    env: {
      MIZAN_PERSONAL_DIR: personal,
      MIZAN_WORK_DIR: work,
      MIZAN_WORK_MARKERS: "/Clients/,/Company/",
      MIZAN_DAILY_BUDGET: "20",
      MIZAN_MONTHLY_BUDGET: "250",
      MIZAN_HOST: "0.0.0.0",
    },
  });

  assert.equal(report.ok, true);
  assert.deepEqual(
    report.accounts.map((item) => [item.account, item.transcripts, item.usageRecords]),
    [
      ["personal", 1, 1],
      ["work", 1, 1],
    ],
  );
  assert.deepEqual(report.workMarkers, ["/Clients/", "/Company/"]);
  assert.deepEqual(report.budgets, { daily: 20, monthly: 250 });
  assert.equal(report.host, "0.0.0.0");
  assert.equal(report.localOnly, false);
  assert.match(formatDoctorReport(report), /Setup looks usable/);
  assert.match(formatDoctorReport(report), /mizan --weekly/);
  assert.match(formatDoctorReport(report), /mizan --weekly --output "\$HOME\/Documents\/Mizan\/mizan-weekly-\$\(date \+%F\)\.md"/);
  assert.match(formatDoctorReport(report), /Host: 0\.0\.0\.0 \(network-accessible\)/);
  assert.match(formatDoctorReport(report), /daily \$20, monthly \$250/);
});

test("doctor treats one-account transcript setup as usable", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-one-account-"));
  const personal = path.join(home, ".claude", "projects", "project-a");
  fs.mkdirSync(personal, { recursive: true });
  fs.writeFileSync(path.join(personal, "usage.jsonl"), `${usageLine("one-account")}\n`);

  const report = buildDoctorReport({ home, env: {} });
  const text = formatDoctorReport(report);

  assert.equal(report.ok, true);
  assert.match(text, /personal\s+1 transcript/);
  assert.match(text, /1 usage record/);
  assert.match(text, /work\s+missing/);
  assert.match(text, /Setup looks usable/);
  assert.match(text, /Optional: add a work transcript folder/);
  assert.doesNotMatch(text, /Work transcripts are missing/);
});

test("doctor does not treat empty transcript files as usable", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-empty-"));
  const personal = path.join(home, ".claude", "projects", "project-a");
  fs.mkdirSync(personal, { recursive: true });
  fs.writeFileSync(path.join(personal, "usage.jsonl"), "{}\n");

  const report = buildDoctorReport({ home, env: {} });
  const text = formatDoctorReport(report);

  assert.equal(report.ok, false);
  assert.equal(report.accounts[0].transcripts, 1);
  assert.equal(report.accounts[0].usageRecords, 0);
  assert.match(text, /1 transcript, 0 usage records/);
  assert.match(text, /no parseable usage records/i);
  assert.match(text, /mizan --support-bundle/);
});

test("doctor suggests discovered transcript folders when configured paths are wrong", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-suggest-"));
  const discovered = path.join(home, ".claude", "projects", "project-a");
  fs.mkdirSync(discovered, { recursive: true });
  fs.writeFileSync(path.join(discovered, "usage.jsonl"), `${usageLine("discovered")}\n`);

  const report = buildDoctorReport({
    home,
    env: {
      MIZAN_PERSONAL_DIR: path.join(home, "missing-personal"),
      MIZAN_WORK_DIR: path.join(home, "missing-work"),
    },
  });
  const text = formatDoctorReport(report);

  assert.equal(report.ok, false);
  assert.deepEqual(report.suggestedTranscriptFolders.map((item) => [item.account, item.usageRecords]), [
    ["personal", 1],
  ]);
  assert.match(text, /Found parseable personal usage records/);
  assert.match(text, /mizan --set-transcripts personal='/);
  assert.match(text, new RegExp(escapeRegExp(path.join(home, ".claude", "projects"))));
});

test("doctor combines discovered personal and work folders into one save command", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-combined-suggest-"));
  const personal = path.join(home, ".claude", "projects", "project-a");
  const work = path.join(home, ".claude-work", "projects", "project-b");
  fs.mkdirSync(personal, { recursive: true });
  fs.mkdirSync(work, { recursive: true });
  fs.writeFileSync(path.join(personal, "usage.jsonl"), `${usageLine("combined-personal")}\n`);
  fs.writeFileSync(path.join(work, "usage.jsonl"), `${usageLine("combined-work")}\n`);

  const report = buildDoctorReport({
    home,
    env: {
      MIZAN_PERSONAL_DIR: path.join(home, "wrong-personal"),
      MIZAN_WORK_DIR: path.join(home, "wrong-work"),
    },
  });
  const text = formatDoctorReport(report);

  assert.equal(report.ok, false);
  assert.deepEqual(report.suggestedTranscriptFolders.map((item) => item.account), ["personal", "work"]);
  const command = `Save discovered transcript folders with \`mizan --set-transcripts personal='${path.join(
    home,
    ".claude",
    "projects",
  )}' work='${path.join(home, ".claude-work", "projects")}'\`.`;
  assert.match(text, new RegExp(escapeRegExp(command)));
});

test("doctor recommends fixing invalid budget values", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-doctor-budget-"));
  const report = buildDoctorReport({
    home,
    env: {
      MIZAN_DAILY_BUDGET: "-1",
      MIZAN_MONTHLY_BUDGET: "a lot",
    },
  });
  assert.equal(report.budgets.daily, null);
  assert.equal(report.budgets.monthly, null);
  assert.equal(report.budgetIssues.length, 2);
  assert.match(report.recommendations.join("\n"), /MIZAN_MONTHLY_BUDGET/);
});

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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function writeFakeClaude(binDir, output, { exitCode = 0, stream = "stdout" } = {}) {
  const command = path.join(binDir, "claude");
  const redirect = stream === "stderr" ? " >&2" : "";
  fs.writeFileSync(command, `#!/bin/sh\nprintf '%s\\n' ${JSON.stringify(output)}${redirect}\nexit ${exitCode}\n`);
  fs.chmodSync(command, 0o755);
}
