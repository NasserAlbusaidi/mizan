import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CACHE_FILE,
  budgetIssues,
  loadUserConfig,
  resolveAccounts,
  resolveBudgets,
  resolveHost,
  resolveWorkMarkers,
  isLocalHost,
} from "./config.js";
import { PRICING_METADATA } from "./pricing.js";

export function buildDoctorReport({ env = process.env, home = os.homedir() } = {}) {
  const user = loadUserConfig({ env, home });
  const accounts = resolveAccounts(env, home, user.config);
  const accountReports = Object.entries(accounts).map(([account, dir]) => {
    const exists = fs.existsSync(dir);
    const transcripts = exists ? countTranscripts(dir) : 0;
    return { account, dir, exists, transcripts };
  });

  const totalTranscripts = accountReports.reduce((sum, item) => sum + item.transcripts, 0);
  const hasAnyTranscripts = accountReports.some((item) => item.transcripts > 0);
  const recommendations = [];

  if (!accountReports.some((item) => item.exists)) {
    recommendations.push(
      "No transcript folders were found. Try `mizan --try` first, then run `mizan --set-transcripts personal=/path/to/personal/projects work=/path/to/work/projects`.",
    );
  } else if (totalTranscripts === 0) {
    recommendations.push(
      "Transcript folders exist, but no .jsonl files were found. Run Claude Code once or update the saved folders with `mizan --set-transcripts personal=/path work=/path`.",
    );
  } else {
    recommendations.push(
      "Setup looks usable. Run `mizan` for the dashboard, `mizan --weekly` for a weekly report, or `mizan --json --window 7` for a scriptable snapshot.",
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

  if (recommendations.length === 0) {
    recommendations.push(
      "Setup looks usable. Run `mizan` for the dashboard, `mizan --weekly` for a weekly report, or `mizan --json --window 7` for a scriptable snapshot.",
    );
  }

  return {
    ok: hasAnyTranscripts,
    accounts: accountReports,
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
    const status = item.exists ? `${item.transcripts} transcript${item.transcripts === 1 ? "" : "s"}` : "missing";
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

function countTranscripts(dir) {
  let count = 0;
  let entries;
  try {
    entries = fs.readdirSync(dir, { recursive: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    if (typeof entry === "string" && entry.endsWith(".jsonl")) {
      const abs = path.join(dir, entry);
      try {
        if (fs.statSync(abs).isFile()) count += 1;
      } catch {
        // Ignore racing files.
      }
    }
  }
  return count;
}
