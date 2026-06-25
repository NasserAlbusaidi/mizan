import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CACHE_FILE,
  budgetIssues,
  defaultConfig,
  loadUserConfig,
  resolveAccounts,
  resolveBudgets,
  resolveHost,
  resolveWorkMarkers,
  isLocalHost,
} from "./config.js";
import { parseUsageLine } from "./parser.js";
import { PRICING_METADATA } from "./pricing.js";

const USAGE_SCAN_LIMIT = 50;

export function buildDoctorReport({ env = process.env, home = os.homedir() } = {}) {
  const user = loadUserConfig({ env, home });
  const accounts = resolveAccounts(env, home, user.config);
  const accountReports = Object.entries(accounts).map(([account, dir]) => {
    const exists = fs.existsSync(dir);
    const transcriptScan = exists ? inspectTranscripts(dir) : { transcripts: 0, sampled: 0, usageRecords: 0 };
    return { account, dir, exists, ...transcriptScan };
  });

  const totalTranscripts = accountReports.reduce((sum, item) => sum + item.transcripts, 0);
  const totalUsageRecords = accountReports.reduce((sum, item) => sum + item.usageRecords, 0);
  const hasAnyTranscripts = accountReports.some((item) => item.transcripts > 0);
  const hasAnyUsageRecords = accountReports.some((item) => item.usageRecords > 0);
  const suggestedTranscriptFolders = suggestTranscriptFolders(accountReports, { env, home });
  const recommendations = [];

  if (!accountReports.some((item) => item.exists)) {
    recommendations.push(
      `No transcript folders were found. Try \`mizan --try\`, save a sample report with \`${demoWeeklyReportCommand()}\`, then run \`mizan --set-transcripts personal=/path/to/personal/projects work=/path/to/work/projects\`.`,
    );
  } else if (totalTranscripts === 0) {
    recommendations.push(
      `Transcript folders exist, but no .jsonl files were found. Run Claude Code once, save a sample report with \`${demoWeeklyReportCommand()}\`, or update the saved folders with \`mizan --set-transcripts personal=/path work=/path\`.`,
    );
  } else if (totalUsageRecords === 0) {
    const sampleCount = accountReports.reduce((sum, item) => sum + item.sampled, 0);
    recommendations.push(
      `Transcript files were found, but no parseable usage records were found in the newest ${sampleCount} transcript file${sampleCount === 1 ? "" : "s"}. Run Claude Code once, then run \`mizan --doctor\` again. If this seems wrong, run \`mizan --support-bundle\` and open an issue.`,
    );
  } else {
    recommendations.push(
      `Setup looks usable. Run \`mizan\` for the dashboard, \`${weeklyReportCommand()}\` to save a weekly report, or \`mizan --json --window 7\` for a scriptable snapshot.`,
    );
  }

  for (const item of accountReports) {
    if (item.account === "personal" && !item.exists) {
      recommendations.push(
        hasAnyTranscripts
          ? "Optional: add a personal transcript folder with `mizan --set-transcripts personal=/path/to/projects` if you use a second Claude config."
          : "Personal transcripts are missing. Persist the folder with `mizan --set-transcripts personal=/path/to/projects`.",
      );
    }
    if (item.account === "work" && !item.exists) {
      recommendations.push(
        hasAnyTranscripts
          ? "Optional: add a work transcript folder with `mizan --set-transcripts work=/path/to/projects` if you use a second Claude config."
          : "Work transcripts are missing. This is fine for one-account users; otherwise persist it with `mizan --set-transcripts work=/path/to/projects`.",
      );
    }
  }

  const workMarkers = resolveWorkMarkers(env, user.config);
  if (workMarkers.length === 0) {
    recommendations.push("No work markers are configured, so leak detection will treat every project as personal.");
  }

  const budgets = resolveBudgets(env, user.config);
  const host = resolveHost(env, user.config);
  const budgetProblems = budgetIssues(env, user.config);
  for (const issue of budgetProblems) recommendations.push(issue);
  if (user.error) {
    recommendations.push(`Config file could not be read: ${user.error}`);
  }
  if (suggestedTranscriptFolders.length > 1) {
    recommendations.push(
      `Save discovered transcript folders with \`${formatSetTranscriptsCommand(suggestedTranscriptFolders)}\`.`,
    );
  }
  for (const suggestion of suggestedTranscriptFolders) {
    recommendations.push(
      `Found parseable ${suggestion.account} usage records at ${suggestion.dir}. Save it with \`${formatSetTranscriptCommand(suggestion.account, suggestion.dir)}\`.`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      `Setup looks usable. Run \`mizan\` for the dashboard, \`${weeklyReportCommand()}\` to save a weekly report, or \`mizan --json --window 7\` for a scriptable snapshot.`,
    );
  }

  return {
    ok: hasAnyUsageRecords,
    accounts: accountReports,
    suggestedTranscriptFolders,
    configFile: { path: user.path, exists: user.exists, error: user.error },
    cacheFile: CACHE_FILE,
    workMarkers,
    budgets,
    host,
    localOnly: isLocalHost(host),
    budgetIssues: budgetProblems,
    pricing: PRICING_METADATA,
    recommendations,
  };
}

export function formatDoctorReport(report) {
  const lines = ["Mizan doctor", ""];
  lines.push("Transcript folders:");
  for (const item of report.accounts) {
    const status = item.exists ? formatTranscriptStatus(item) : "missing";
    lines.push(`  ${item.account.padEnd(8)} ${status.padEnd(16)} ${item.dir}`);
  }
  lines.push("");
  lines.push(`Config: ${report.configFile.exists ? report.configFile.path : `${report.configFile.path} (not found)`}`);
  lines.push(`Cache: ${report.cacheFile}`);
  lines.push(`Host: ${report.host} (${report.localOnly ? "local-only" : "network-accessible"})`);
  lines.push(`Work markers: ${report.workMarkers.length ? report.workMarkers.join(", ") : "(none)"}`);
  lines.push(`Budgets: daily ${formatBudget(report.budgets.daily)}, monthly ${formatBudget(report.budgets.monthly)}`);
  lines.push(`Pricing: ${report.pricing.sourceName}, checked ${report.pricing.checkedAt}`);
  lines.push("");
  lines.push("Next:");
  for (const rec of report.recommendations) lines.push(`  - ${rec}`);
  return lines.join("\n");
}

function formatBudget(value) {
  return value == null ? "(unset)" : `$${value}`;
}

function formatTranscriptStatus(item) {
  const transcripts = `${item.transcripts} transcript${item.transcripts === 1 ? "" : "s"}`;
  if (!item.transcripts) return transcripts;
  const records = `${item.usageRecords} usage record${item.usageRecords === 1 ? "" : "s"}`;
  const sampled =
    item.sampled && item.sampled < item.transcripts ? ` in newest ${item.sampled}` : "";
  return `${transcripts}, ${records}${sampled}`;
}

function inspectTranscripts(dir) {
  const files = listTranscriptFiles(dir);
  let usageRecords = 0;
  for (const file of files.slice(0, USAGE_SCAN_LIMIT)) {
    usageRecords += countUsageRecords(file.path);
  }
  return {
    transcripts: files.length,
    sampled: Math.min(files.length, USAGE_SCAN_LIMIT),
    usageRecords,
  };
}

function suggestTranscriptFolders(accountReports, { env, home }) {
  const suggestions = [];
  for (const accountReport of accountReports) {
    if (accountReport.usageRecords > 0) continue;
    for (const dir of candidateTranscriptDirs(accountReport.account, { env, home, current: accountReport.dir })) {
      const scan = inspectTranscripts(dir);
      if (scan.usageRecords === 0) continue;
      suggestions.push({ account: accountReport.account, dir, ...scan });
      break;
    }
  }
  return suggestions;
}

function candidateTranscriptDirs(account, { env, home, current }) {
  const defaults = defaultConfig(home);
  const dirs = account === "personal" ? [defaults.personalDir] : [defaults.workDir];
  if (account === "personal" && env.CLAUDE_CONFIG_DIR) {
    dirs.push(path.join(env.CLAUDE_CONFIG_DIR, "projects"));
  }
  return [...new Set(dirs)].filter((dir) => dir && path.resolve(dir) !== path.resolve(current));
}

function listTranscriptFiles(dir) {
  const files = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { recursive: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (typeof entry === "string" && entry.endsWith(".jsonl")) {
      const abs = path.join(dir, entry);
      try {
        const stat = fs.statSync(abs);
        if (stat.isFile()) files.push({ path: abs, mtimeMs: stat.mtimeMs });
      } catch {
        // Ignore racing files.
      }
    }
  }
  return files.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function countUsageRecords(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return 0;
  }

  let count = 0;
  for (const line of text.split("\n")) {
    if (line.indexOf('"usage"') === -1) continue;
    if (parseUsageLine(line)) count += 1;
  }
  return count;
}

function formatSetTranscriptCommand(account, dir) {
  return `mizan --set-transcripts ${account}=${shellQuote(dir)}`;
}

function formatSetTranscriptsCommand(suggestions) {
  return `mizan --set-transcripts ${suggestions
    .map((suggestion) => `${suggestion.account}=${shellQuote(suggestion.dir)}`)
    .join(" ")}`;
}

function weeklyReportCommand() {
  return 'mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly-$(date +%F).md"';
}

function demoWeeklyReportCommand() {
  return 'mizan --weekly --demo --output "$HOME/Documents/Mizan/mizan-demo-weekly.md"';
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}
