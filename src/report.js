import { HOME } from "./config.js";
import { buildSummary } from "./summary.js";

export function buildReport(data, { packageVersion = null } = {}) {
  const summary = buildSummary(data);
  const actions = [
    ...summary.issues.map((issue) => ({ level: "issue", ...issue })),
    ...summary.warnings.map((warning) => ({ level: "warning", ...warning })),
  ];

  return {
    title: "Mizan Spend Report",
    status: summary.status,
    generatedAt: new Date(summary.generatedAt).toISOString(),
    window: summary.window,
    windowLabel: summary.window.days ? `last ${summary.window.days}d` : "all-time",
    mode: summary.demo ? "demo" : "local",
    metrics: {
      spend: summary.spend,
      today: summary.today,
      burnPerDay: summary.burnPerDay,
      projected30d: summary.projected30d,
      requests: summary.requests,
      leakCount: summary.leaks.count,
      leakTotal: summary.leaks.total,
      reviewableWrongAccountSpend: summary.leaks.total,
      budgets: summary.budgets,
    },
    comparison: redactComparison(summary.comparison),
    accounts: Object.entries(data.accounts || {}).map(([account, bucket]) => ({
      account,
      spend: bucket.cost || 0,
      requests: bucket.reqs || 0,
      outputTokens: bucket.output || 0,
    })),
    projects: (data.projects || []).map((project) => ({
      account: project.account,
      project: redactPath(project.display || project.cwd || "(unknown)"),
      spend: project.cost || 0,
      requests: project.reqs || 0,
      outputTokens: project.output || 0,
    })),
    topProjects: summary.topProjects.map((project) => ({
      ...project,
      project: redactPath(project.project),
    })),
    topLeaks: (data.leaks?.sessions || []).slice(0, 5).map((session) => ({
      account: session.account,
      project: redactPath(session.project || session.cwd || "(unknown)"),
      cost: session.cost || 0,
      durationMin: session.durationMin || 0,
    })),
    sessions: (data.sessions || []).map((session) => ({
      account: session.account,
      project: redactPath(session.project || session.cwd || "(unknown)"),
      cost: session.cost || 0,
      durationMin: session.durationMin || 0,
      requests: session.reqs || 0,
      outputTokens: session.output || 0,
      model: session.model || "unknown",
    })),
    topSessions: (data.sessions || []).slice(0, 5).map((session) => ({
      account: session.account,
      project: redactPath(session.project || session.cwd || "(unknown)"),
      cost: session.cost || 0,
      durationMin: session.durationMin || 0,
      requests: session.reqs || 0,
      model: session.model || "unknown",
    })),
    actions,
    pricing: {
      sourceName: data.pricing?.sourceName || "public pricing",
      sourceUrl: data.pricing?.sourceUrl || null,
      checkedAt: data.pricing?.checkedAt || null,
    },
    nextSteps: demoNextSteps(summary.demo, packageVersion),
    privacy: {
      redacted: true,
      note: "Paths are redacted to avoid exposing local usernames or full working directories.",
    },
  };
}

export function formatMarkdownReport(report) {
  const statusLabel = report.status.toUpperCase();
  const lines = [
    `# ${report.title}`,
    "",
    `Status: **${statusLabel}**`,
    `Window: ${report.windowLabel}`,
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    "",
    "## Snapshot",
    "",
    `- Spend: ${money(report.metrics.spend)}`,
    `- Today: ${money(report.metrics.today)}`,
    `- Burn rate: ${money(report.metrics.burnPerDay)} / day`,
    `- Projected 30d: ${money(report.metrics.projected30d)}`,
    `- Requests: ${report.metrics.requests}`,
    `- Leaks: ${report.metrics.leakCount} (${money(report.metrics.leakTotal)})`,
  ];
  if (report.metrics.reviewableWrongAccountSpend > 0) {
    lines.push(`- Reviewable wrong-account spend: ${money(report.metrics.reviewableWrongAccountSpend)}`);
  }
  lines.push(`- Budgets: daily ${budget(report.metrics.budgets.daily)}; monthly ${budget(report.metrics.budgets.monthly)}`);
  if (report.comparison) {
    lines.push(
      `- Previous ${report.comparison.windowDays}d: ${money(report.comparison.previous.cost)}; change ${signedMoney(report.comparison.delta.cost)} (${signedPct(report.comparison.delta.costPct)}), ${signedNumber(report.comparison.delta.reqs)} requests`,
    );
  }

  if (report.comparison?.projects?.length) {
    lines.push(
      "",
      "## Project Changes",
      "",
      "| Project | Account | Current | Previous | Change | Requests |",
      "|---|---:|---:|---:|---:|---:|",
    );
    for (const project of report.comparison.projects) {
      lines.push(
        `| ${cell(project.project)} | ${cell(project.account)} | ${money(project.current.cost)} | ${money(project.previous.cost)} | ${signedMoney(project.delta.cost)} (${signedPct(project.delta.costPct)}) | ${signedNumber(project.delta.reqs)} |`,
      );
    }
  }

  if (report.accounts.length) {
    lines.push(
      "",
      "## Account Split",
      "",
      "| Account | Spend | Requests | Output tokens |",
      "|---|---:|---:|---:|",
    );
    for (const account of report.accounts) {
      lines.push(
        `| ${cell(account.account)} | ${money(account.spend)} | ${account.requests} | ${tokens(account.outputTokens)} |`,
      );
    }
  }

  if (report.actions.length) {
    lines.push("", "## Action Items", "");
    for (const action of report.actions) {
      lines.push(`- **${titleCase(action.level)}:** ${action.message}`);
    }
  }

  if (report.topLeaks.length) {
    lines.push("", "## Top Leaks", "", "| Project | Account | Spend | Duration |", "|---|---:|---:|---:|");
    for (const leak of report.topLeaks) {
      lines.push(
        `| ${cell(leak.project)} | ${cell(leak.account)} | ${money(leak.cost)} | ${leak.durationMin}m |`,
      );
    }
  }

  if (report.topSessions.length) {
    lines.push(
      "",
      "## Costliest Sessions",
      "",
      "| Project | Account | Spend | Duration | Requests | Model |",
      "|---|---:|---:|---:|---:|---|",
    );
    for (const session of report.topSessions) {
      lines.push(
        `| ${cell(session.project)} | ${cell(session.account)} | ${money(session.cost)} | ${session.durationMin}m | ${session.requests} | ${cell(session.model)} |`,
      );
    }
  }

  if (report.topProjects.length) {
    lines.push("", "## Top Projects", "", "| Project | Account | Spend | Requests |", "|---|---:|---:|---:|");
    for (const project of report.topProjects) {
      lines.push(
        `| ${cell(project.project)} | ${cell(project.account)} | ${money(project.cost)} | ${project.requests} |`,
      );
    }
  }

  if (report.nextSteps?.length) {
    lines.push("", "## Next Steps", "");
    for (const step of report.nextSteps) lines.push(`- ${step}`);
  }

  lines.push(
    "",
    "## Notes",
    "",
    `- ${report.privacy.note}`,
    `- Cost is an estimate from local Claude Code transcripts using ${report.pricing.sourceName}${
      report.pricing.checkedAt ? ` checked ${report.pricing.checkedAt}` : ""
    }.`,
    "- Authoritative billing remains console.anthropic.com.",
  );

  return lines.join("\n");
}

export function formatCsvReport(report) {
  const rows = [["row_type", "project", "account", "spend_usd", "requests", "output_tokens", "duration_minutes", "model", "note"]];

  for (const account of report.accounts) {
    rows.push([
      "account",
      "",
      account.account,
      cents(account.spend),
      account.requests,
      account.outputTokens,
      "",
      "",
      "account total",
    ]);
  }

  for (const project of report.projects) {
    rows.push([
      "project",
      project.project,
      project.account,
      cents(project.spend),
      project.requests,
      project.outputTokens,
      "",
      "",
      "project total",
    ]);
  }

  for (const session of report.sessions) {
    rows.push([
      "session",
      session.project,
      session.account,
      cents(session.cost),
      session.requests,
      session.outputTokens,
      session.durationMin,
      session.model,
      "costliest session",
    ]);
  }

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function demoNextSteps(isDemo, packageVersion) {
  if (!isDemo) return [];
  const steps = ["Demo data only; no local transcripts were read."];
  if (packageVersion) {
    steps.push(`Install Mizan: npm install -g github:NasserAlbusaidi/mizan#v${packageVersion}`);
    steps.push(
      `Fallback install if GitHub tags fail: npm install -g https://github.com/NasserAlbusaidi/mizan/releases/download/v${packageVersion}/nasseralbusaidi-mizan-${packageVersion}.tgz`,
    );
  } else {
    steps.push("Install Mizan from the current GitHub release.");
  }
  steps.push(
    "Check real transcript setup: mizan --setup",
    'Save your first real weekly report: mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly-$(date +%F).md"',
  );
  return steps;
}

export function redactPath(value) {
  const text = String(value == null ? "" : value);
  return text
    .replaceAll(HOME, "~")
    .replace(/^\/Users\/[^/]+(?=\/|$)/, "~")
    .replace(/^[A-Za-z]:\\Users\\[^\\]+(?=\\|$)/, "~");
}

function redactComparison(comparison) {
  if (!comparison) return null;
  return {
    ...comparison,
    projects: (comparison.projects || []).map((project) => ({
      ...project,
      project: redactPath(project.project),
    })),
  };
}

function money(n) {
  const a = Math.abs(n);
  if (a >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (a >= 100) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
}

function cents(n) {
  return (n || 0).toFixed(2);
}

function budget(value) {
  return value ? money(value) : "(unset)";
}

function signedMoney(value) {
  if (value > 0) return `+${money(value)}`;
  if (value < 0) return `-${money(Math.abs(value))}`;
  return "$0.00";
}

function signedNumber(value) {
  return value > 0 ? `+${value}` : String(value);
}

function signedPct(value) {
  if (value == null) return "new";
  const label = `${(Math.abs(value) * 100).toFixed(1)}%`;
  if (value > 0) return `+${label}`;
  if (value < 0) return `-${label}`;
  return "0.0%";
}

function cell(value) {
  return String(value == null ? "" : value).replaceAll("|", "\\|");
}

function csvCell(value) {
  const text = String(value == null ? "" : value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function tokens(value) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  return String(value || 0);
}

function titleCase(value) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
