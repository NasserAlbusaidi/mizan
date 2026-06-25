#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const expectedVersion = `${packageJson.name} ${packageJson.version}`;
const releaseTag = `v${packageJson.version}`;
const releaseTarballUrl = `https://github.com/NasserAlbusaidi/mizan/releases/download/${releaseTag}/nasseralbusaidi-mizan-${packageJson.version}.tgz`;
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mizan-install-"));
const realNpmEnv = { ...process.env, npm_config_dry_run: "false" };
let tarballPath = null;

try {
  const pack = run("npm", ["pack", "--json"], { cwd: repoRoot, env: realNpmEnv });
  const [packed] = JSON.parse(pack.stdout);
  tarballPath = path.join(repoRoot, packed.filename);

  fs.writeFileSync(path.join(tempRoot, "package.json"), '{"private":true}\n');
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarballPath], {
    cwd: tempRoot,
    env: realNpmEnv,
  });

  const installedRoot = path.join(tempRoot, "node_modules", "@nasseralbusaidi", "mizan");
  const dashboardHtml = fs.readFileSync(path.join(installedRoot, "public", "index.html"), "utf8");
  const dashboardApp = fs.readFileSync(path.join(installedRoot, "public", "app.js"), "utf8");
  assertIncludes(dashboardHtml, "panel-project-changes", "packaged dashboard should include project movers panel");
  assertIncludes(dashboardHtml, "download-csv", "packaged dashboard should include CSV download control");
  assertIncludes(dashboardApp, "renderProjectChanges", "packaged dashboard should render project movers");
  assertIncludes(dashboardApp, "downloadCsv", "packaged dashboard should wire CSV download");

  const bin = path.join(tempRoot, "node_modules", ".bin", process.platform === "win32" ? "mizan.cmd" : "mizan");

  const help = run(bin, ["--help"]).stdout;
  assertIncludes(help, "mizan --demo", "--help should document demo mode");
  assertIncludes(help, "mizan --try", "--help should document first-run try mode");
  assertIncludes(help, "mizan --setup", "--help should document guided setup");
  assertIncludes(help, "mizan --today", "--help should document the daily summary shortcut");
  assertIncludes(help, "mizan --weekly", "--help should document the weekly report shortcut");
  assertIncludes(help, "mizan --csv", "--help should document CSV export");
  assertIncludes(help, "mizan --host 0.0.0.0", "--help should document explicit network binding");
  assertIncludes(help, "mizan --set-budget daily=20 monthly=250", "--help should document budget setup");
  assertIncludes(help, "mizan --add-work-marker /Clients/", "--help should document work marker setup");
  assertIncludes(help, "mizan --set-transcripts", "--help should document transcript setup");
  assertIncludes(help, "mizan --setup-kit", "--help should document setup kit output");
  assertIncludes(help, "mizan --support-bundle", "--help should document support bundles");
  assertIncludes(help, "mizan --feedback", "--help should document feedback guidance");
  assertIncludes(help, "mizan --share", "--help should document public sharing copy");
  assertIncludes(help, "mizan --update-check", "--help should document update checks");

  const version = run(bin, ["--version"]).stdout.trim();
  if (version !== expectedVersion) {
    throw new Error(`installed --version printed ${JSON.stringify(version)}`);
  }

  const tryOutput = run(bin, ["--try"]).stdout;
  assertIncludes(tryOutput, "Mizan try mode", "--try should identify try mode");
  assertIncludes(tryOutput, "Demo data only", "--try should explain demo data");
  assertIncludes(tryOutput, "No local transcripts are read", "--try should explain privacy");
  assertIncludes(tryOutput, "sample intentionally includes wrong-account leaks", "--try should explain intentional leaks");
  assertIncludes(tryOutput, "Mizan sample findings (demo)", "--try should print a guided demo preview");
  assertIncludes(
    tryOutput,
    "Preview only. Real `mizan --check` still exits nonzero when leaks are present.",
    "--try should clarify that strict checks still fail on leaks",
  );
  assertIncludes(tryOutput, "Sample findings:", "--try should label intentional demo leaks as sample findings");
  assertIncludes(tryOutput, "Reviewable wrong-account spend: $37.98", "--try should print the reviewable spend value");
  assertIncludes(tryOutput, "Next:", "--try should print next steps");
  assertIncludes(
    tryOutput,
    `Save a sample report now: npm exec --yes --package ${releaseTarballUrl} -- mizan --weekly --demo --output "$HOME/Documents/Mizan/mizan-demo-weekly.md"`,
    "--try should point to the versioned no-global sample report artifact",
  );
  assertIncludes(
    tryOutput,
    `Open the sample dashboard without install: npm exec --yes --package ${releaseTarballUrl} -- mizan --demo`,
    "--try should point to the versioned no-global dashboard preview",
  );
  assertIncludes(
    tryOutput,
    `Fallback GitHub tag demo: npm exec --yes --package github:NasserAlbusaidi/mizan#${releaseTag} -- mizan --try`,
    "--try should print the GitHub tag demo fallback",
  );
  assertIncludes(
    tryOutput,
    `Install Mizan: npm install -g ${releaseTarballUrl}`,
    "--try should print the current versioned tarball install command",
  );
  assertIncludes(
    tryOutput,
    `Fallback GitHub tag install: npm install -g github:NasserAlbusaidi/mizan#${releaseTag}`,
    "--try should print the current tagged install fallback",
  );
  assertIncludes(tryOutput, "mizan --setup", "--try should point to setup");

  const setupKit = run(bin, ["--setup-kit"]).stdout;
  assertIncludes(setupKit, "# Mizan Setup Kit", "--setup-kit should print Markdown");
  assertIncludes(setupKit, "mizan --doctor --check", "--setup-kit should include setup checks");
  assertIncludes(setupKit, "parseable Claude usage record", "--setup-kit should explain the setup check");
  assertIncludes(
    setupKit,
    'mizan --weekly --demo --output "$HOME/Documents/Mizan/mizan-demo-weekly.md"',
    "--setup-kit should include the sample report proof step",
  );
  assertIncludes(
    setupKit,
    "Prove the report flow before connecting real transcripts",
    "--setup-kit should explain why to run the sample report first",
  );
  assertIncludes(setupKit, "saved-report command", "--setup-kit should document the setup success handoff");
  assertIncludes(setupKit, "mizan --csv --window 7", "--setup-kit should include CSV export guidance");
  assertIncludes(setupKit, "cron", "--setup-kit should include cron guidance");
  assertIncludes(setupKit, "launchd", "--setup-kit should include launchd guidance");
  assertIncludes(setupKit, "Do not attach raw transcripts", "--setup-kit should include privacy guidance");

  const setupKitPath = path.join(tempRoot, "reports", "setup-kit.md");
  const setupKitOutput = run(bin, ["--setup-kit", "--output", setupKitPath]).stdout;
  assertIncludes(setupKitOutput, `Wrote setup kit to ${setupKitPath}`, "--setup-kit --output should print the saved path");
  const savedSetupKit = fs.readFileSync(setupKitPath, "utf8");
  assertIncludes(savedSetupKit, "# Mizan Setup Kit", "--setup-kit --output should write Markdown");
  assertIncludes(
    savedSetupKit,
    'mizan --weekly --demo --output "$HOME/Documents/Mizan/mizan-demo-weekly.md"',
    "--setup-kit --output should include the sample report command",
  );
  assertIncludes(
    savedSetupKit,
    'mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly-$(date +%F).md"',
    "--setup-kit --output should include the saved weekly report command",
  );

  const shareGuide = run(bin, ["--share"]).stdout;
  assertIncludes(shareGuide, "# Share Mizan", "--share should print Markdown");
  assertIncludes(
    shareGuide,
    `npm exec --yes --package ${releaseTarballUrl} -- mizan --try`,
    "--share should include the versioned no-global demo path",
  );
  assertIncludes(
    shareGuide,
    `npm exec --yes --package ${releaseTarballUrl} -- mizan --weekly --demo --output "$HOME/Documents/Mizan/mizan-demo-weekly.md"`,
    "--share should include the versioned no-global sample report path",
  );
  assertIncludes(
    shareGuide,
    `npm exec --yes --package github:NasserAlbusaidi/mizan#${releaseTag} -- mizan --try`,
    "--share should include the GitHub tag demo fallback",
  );
  assertIncludes(
    shareGuide,
    `MIZAN_INSTALL_VERSION=${packageJson.version} bash -c "$(curl -fsSL https://raw.githubusercontent.com/NasserAlbusaidi/mizan/${releaseTag}/scripts/install.sh)"`,
    "--share should include the versioned installer helper path",
  );
  assertIncludes(
    shareGuide,
    `npm install -g ${releaseTarballUrl}`,
    "--share should include the versioned tarball install path",
  );
  assertIncludes(shareGuide, `github:NasserAlbusaidi/mizan#${releaseTag}`, "--share should include the tagged install fallback");
  assertIncludes(shareGuide, "No account. No upload.", "--share should include the privacy claim");

  const updateCheck = run(bin, ["--update-check"], {
    env: {
      ...process.env,
      MIZAN_RELEASES_URL: "data:application/json,%7B%22tag_name%22%3A%22v0.1.69%22%7D",
    },
  }).stdout;
  assertIncludes(updateCheck, "Mizan update check", "--update-check should print its heading");
  assertIncludes(updateCheck, "Current: 0.1.68", "--update-check should print the installed version");
  assertIncludes(updateCheck, "Latest: 0.1.69", "--update-check should print the latest release version");
  assertIncludes(updateCheck, "Status: update available", "--update-check should flag newer releases");
  assertIncludes(
    updateCheck,
    "npm install -g https://github.com/NasserAlbusaidi/mizan/releases/download/v0.1.69/nasseralbusaidi-mizan-0.1.69.tgz",
    "--update-check should print the next versioned tarball install command",
  );

  const pricing = JSON.parse(run(bin, ["--pricing", "--json"]).stdout);
  if (!pricing.rows.some((row) => row.family === "mythos")) {
    throw new Error("installed --pricing output did not include Mythos pricing");
  }

  const summary = JSON.parse(run(bin, ["--summary", "--demo", "--json", "--window", "7"]).stdout);
  if (summary.status !== "fail" || !summary.issues.some((issue) => issue.type === "leak")) {
    throw new Error("installed --summary --demo did not report the expected demo leak failure");
  }
  if (!summary.comparison || summary.comparison.previous.reqs <= 0) {
    throw new Error("installed --summary --demo did not include previous-window comparison");
  }

  const today = run(bin, ["--today", "--demo"]).stdout;
  assertIncludes(today, "Window: last 1d", "--today should print a one-day summary");

  const weekly = run(bin, ["--weekly", "--demo"]).stdout;
  assertIncludes(weekly, "# Mizan Spend Report", "--weekly should print a Markdown report");
  assertIncludes(weekly, "Window: last 7d", "--weekly should use the seven-day report window");
  assertIncludes(weekly, "## Next Steps", "--weekly --demo should include next steps inside the artifact");
  assertIncludes(
    weekly,
    `Install Mizan: npm install -g ${releaseTarballUrl}`,
    "--weekly --demo should include the current versioned tarball install command",
  );
  assertIncludes(
    weekly,
    `Fallback GitHub tag install: npm install -g github:NasserAlbusaidi/mizan#${releaseTag}`,
    "--weekly --demo should include the current tagged install fallback",
  );
  assertIncludes(
    weekly,
    'Save your first real weekly report: mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly-$(date +%F).md"',
    "--weekly --demo should point to the real saved report command",
  );

  const csv = run(bin, ["--csv", "--demo", "--window", "7"]).stdout;
  assertIncludes(csv, "row_type,project,account,spend_usd", "--csv should print a header row");
  assertIncludes(csv, "project,~/Desktop/Personal/Rihla,personal", "--csv should include redacted project rows");
  assertIncludes(csv, "session,~/Desktop/Personal/starfield,work", "--csv should include redacted session rows");
  if (csv.includes(process.env.HOME || "__never__")) {
    throw new Error("installed --csv exposed the absolute home path");
  }

  const emptyPersonalDir = path.join(tempRoot, "empty-personal-projects");
  const emptyWorkDir = path.join(tempRoot, "empty-work-projects");
  fs.mkdirSync(emptyPersonalDir, { recursive: true });
  fs.mkdirSync(emptyWorkDir, { recursive: true });
  const emptySummary = run(bin, ["--summary", "--window", "7"], {
    env: {
      ...process.env,
      MIZAN_PERSONAL_DIR: emptyPersonalDir,
      MIZAN_WORK_DIR: emptyWorkDir,
      MIZAN_CONFIG: path.join(tempRoot, "empty-config.json"),
    },
  }).stdout;
  assertIncludes(emptySummary, "Mizan summary [WARN]", "empty transcript folders should warn");
  assertIncludes(emptySummary, "No Claude Code usage records", "empty transcript folders should explain next steps");

  const emptyDoctorCheck = run(bin, ["--doctor", "--check"], {
    expectCode: 2,
    env: {
      ...process.env,
      MIZAN_PERSONAL_DIR: emptyPersonalDir,
      MIZAN_WORK_DIR: emptyWorkDir,
      MIZAN_CONFIG: path.join(tempRoot, "empty-config.json"),
    },
  });
  assertIncludes(emptyDoctorCheck.stdout, "Mizan doctor", "--doctor --check should print diagnostics before failing");
  assertIncludes(emptyDoctorCheck.stdout, "Claude Code CLI:", "--doctor --check should report Claude CLI availability");
  assertIncludes(
    emptyDoctorCheck.stdout,
    'mizan --weekly --demo --output "$HOME/Documents/Mizan/mizan-demo-weekly.md"',
    "--doctor --check should point empty setups to the sample report artifact",
  );

  const emptySetupConfig = path.join(tempRoot, "empty-setup-config.json");
  const emptySetup = run(bin, ["--setup"], {
    expectCode: 2,
    env: {
      ...process.env,
      MIZAN_PERSONAL_DIR: emptyPersonalDir,
      MIZAN_WORK_DIR: emptyWorkDir,
      MIZAN_CONFIG: emptySetupConfig,
    },
  });
  assertIncludes(emptySetup.stdout, `Created ${emptySetupConfig}`, "--setup should create config before diagnostics");
  assertIncludes(emptySetup.stdout, "Mizan doctor", "--setup should print diagnostics");
  assertIncludes(emptySetup.stdout, "Claude Code CLI:", "--setup should report Claude CLI availability");
  assertIncludes(
    emptySetup.stdout,
    'mizan --weekly --demo --output "$HOME/Documents/Mizan/mizan-demo-weekly.md"',
    "--setup should point empty setups to the sample report artifact",
  );
  if (!fs.existsSync(emptySetupConfig)) {
    throw new Error("--setup did not create the requested config file for empty setup");
  }

  const suggestedHome = path.join(tempRoot, "suggested-home");
  const suggestedPersonal = path.join(suggestedHome, ".claude", "projects", "project-a");
  fs.mkdirSync(suggestedPersonal, { recursive: true });
  fs.writeFileSync(path.join(suggestedPersonal, "usage.jsonl"), `${usageLine("suggested-personal")}\n`);
  const suggestedDoctor = run(bin, ["--doctor"], {
    env: {
      ...process.env,
      HOME: suggestedHome,
      MIZAN_CONFIG: path.join(suggestedHome, ".mizan", "config.json"),
      MIZAN_PERSONAL_DIR: path.join(suggestedHome, "wrong-personal"),
      MIZAN_WORK_DIR: path.join(suggestedHome, "wrong-work"),
    },
  });
  assertIncludes(
    suggestedDoctor.stdout,
    "Found parseable personal usage records",
    "--doctor should suggest discovered default transcript folders",
  );
  assertIncludes(
    suggestedDoctor.stdout,
    `mizan --set-transcripts personal='${path.join(suggestedHome, ".claude", "projects")}'`,
    "--doctor should print a copyable set-transcripts command",
  );

  const oneAccountHome = path.join(tempRoot, "one-account-home");
  const oneAccountPersonal = path.join(oneAccountHome, ".claude", "projects", "project-a");
  fs.mkdirSync(oneAccountPersonal, { recursive: true });
  fs.writeFileSync(path.join(oneAccountPersonal, "usage.jsonl"), `${usageLine("one-account")}\n`);
  const oneAccountDoctor = run(bin, ["--doctor", "--check"], {
    env: {
      ...process.env,
      HOME: oneAccountHome,
      MIZAN_CONFIG: path.join(oneAccountHome, ".mizan", "config.json"),
    },
  });
  assertIncludes(oneAccountDoctor.stdout, "Setup looks usable", "--doctor should pass one-account setup");
  assertIncludes(oneAccountDoctor.stdout, "1 usage record", "--doctor should count parseable usage records");
  assertIncludes(oneAccountDoctor.stdout, "Optional: add a work transcript folder", "--doctor should make the second account optional");

  const report = run(bin, ["--report", "--demo", "--window", "7"]).stdout;
  assertIncludes(report, "# Mizan Spend Report", "--report should print Markdown");
  assertIncludes(report, "Previous 7d", "--report should include previous-window comparison");
  assertIncludes(report, "Project Changes", "--report should include project-level spend movers");
  assertIncludes(report, "Paths are redacted", "--report should document redaction");
  if (report.includes(process.env.HOME || "__never__")) {
    throw new Error("installed --report exposed the absolute home path");
  }

  const reportPath = path.join(tempRoot, "reports", "weekly.md");
  const reportOutput = run(bin, ["--report", "--demo", "--window", "7", "--output", reportPath]).stdout;
  assertIncludes(reportOutput, `Wrote report to ${reportPath}`, "--report --output should print the saved path");
  const savedReport = fs.readFileSync(reportPath, "utf8");
  assertIncludes(savedReport, "# Mizan Spend Report", "--report --output should write Markdown");

  const csvPath = path.join(tempRoot, "reports", "weekly.csv");
  const csvOutput = run(bin, ["--csv", "--demo", "--window", "7", "--output", csvPath]).stdout;
  assertIncludes(csvOutput, `Wrote CSV export to ${csvPath}`, "--csv --output should print the saved path");
  const savedCsv = fs.readFileSync(csvPath, "utf8");
  assertIncludes(savedCsv, "row_type,project,account,spend_usd", "--csv --output should write CSV");

  const invalidOutput = run(bin, ["--demo", "--output", path.join(tempRoot, "ignored.md")], { expectCode: 1 });
  assertIncludes(invalidOutput.stderr, "--output requires", "--output without a one-shot mode should fail clearly");

  const reportJson = JSON.parse(run(bin, ["--report", "--demo", "--json", "--window", "7"]).stdout);
  if (reportJson.status !== "fail" || reportJson.privacy?.redacted !== true) {
    throw new Error("installed --report --json did not expose the expected redacted report");
  }

  const reportCheck = run(bin, ["--report", "--check", "--demo", "--window", "7"], { expectCode: 2 });
  assertIncludes(reportCheck.stdout, "# Mizan Spend Report", "--report --check should keep report output");

  const supportBundle = run(bin, ["--support-bundle"]).stdout;
  assertIncludes(supportBundle, "# Mizan Support Bundle", "--support-bundle should print Markdown");
  assertIncludes(supportBundle, "No raw transcript lines are included", "--support-bundle should explain privacy");
  if (supportBundle.includes(process.env.HOME || "__never__")) {
    throw new Error("installed --support-bundle exposed the absolute home path");
  }

  const feedback = run(bin, ["--feedback"]).stdout;
  assertIncludes(feedback, "# Mizan Feedback", "--feedback should print Markdown");
  assertIncludes(feedback, "https://github.com/NasserAlbusaidi/mizan/issues/new/choose", "--feedback should include the issue chooser");
  assertIncludes(feedback, "mizan --support-bundle --output mizan-support.md", "--feedback should point to the redacted bundle command");
  assertIncludes(feedback, "Do not attach raw transcripts", "--feedback should include privacy guidance");

  const check = run(bin, ["--check", "--demo", "--window", "7"], { expectCode: 2 });
  assertIncludes(check.stdout, "Mizan summary [FAIL]", "--check should print a failing summary");

  const configPath = path.join(tempRoot, "mizan-config.json");
  run(bin, ["--init-config"], { env: { ...process.env, MIZAN_CONFIG: configPath } });
  if (!fs.existsSync(configPath)) {
    throw new Error("--init-config did not create the requested config file");
  }
  run(bin, ["--set-budget", "daily=20", "monthly=250"], { env: { ...process.env, MIZAN_CONFIG: configPath } });
  const savedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (savedConfig.dailyBudget !== 20 || savedConfig.monthlyBudget !== 250) {
    throw new Error("--set-budget did not persist the requested daily/monthly budgets");
  }
  run(bin, ["--add-work-marker", "/Clients/", "/Company/"], { env: { ...process.env, MIZAN_CONFIG: configPath } });
  const markerConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!markerConfig.workMarkers.includes("/Clients/") || !markerConfig.workMarkers.includes("/Company/")) {
    throw new Error("--add-work-marker did not persist the requested work markers");
  }
  const personalDir = path.join(tempRoot, "personal-projects");
  const workDir = path.join(tempRoot, "work-projects");
  fs.mkdirSync(path.join(personalDir, "project-a"), { recursive: true });
  fs.writeFileSync(path.join(personalDir, "project-a", "usage.jsonl"), `${usageLine("personal")}\n`);
  fs.mkdirSync(path.join(workDir, "project-b"), { recursive: true });
  fs.writeFileSync(path.join(workDir, "project-b", "usage.jsonl"), `${usageLine("work")}\n`);
  run(bin, ["--set-transcripts", `personal=${personalDir}`, `work=${workDir}`], {
    env: { ...process.env, MIZAN_CONFIG: configPath },
  });
  const transcriptConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (transcriptConfig.personalDir !== personalDir || transcriptConfig.workDir !== workDir) {
    throw new Error("--set-transcripts did not persist the requested transcript directories");
  }
  const usableDoctorCheck = run(bin, ["--doctor", "--check"], {
    env: { ...process.env, MIZAN_CONFIG: configPath },
  });
  assertIncludes(usableDoctorCheck.stdout, "Setup looks usable", "--doctor --check should pass usable setup");

  const usableSetup = run(bin, ["--setup"], {
    env: { ...process.env, MIZAN_CONFIG: configPath },
  });
  assertIncludes(usableSetup.stdout, `Config already exists at ${configPath}`, "--setup should preserve existing config");
  assertIncludes(usableSetup.stdout, "Setup looks usable", "--setup should pass usable setup");

  console.log(`install check passed in ${tempRoot}`);
} finally {
  if (tarballPath) {
    try {
      fs.unlinkSync(tarballPath);
    } catch {
      // Non-fatal; npm pack dry-runs remain clean even if this cleanup races.
    }
  }
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    cwd: options.cwd || repoRoot,
    env: options.env || process.env,
    encoding: "utf8",
  });
  const expected = options.expectCode ?? 0;
  if (result.status !== expected) {
    throw new Error(
      [
        `Command failed: ${cmd} ${args.join(" ")}`,
        `expected exit ${expected}, got ${result.status}`,
        result.stdout ? `stdout:\n${result.stdout}` : "",
        result.stderr ? `stderr:\n${result.stderr}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  return result;
}

function assertIncludes(text, needle, message) {
  if (!text.includes(needle)) {
    throw new Error(`${message}\nExpected to find: ${needle}\nOutput:\n${text}`);
  }
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
