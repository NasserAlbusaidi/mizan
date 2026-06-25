import { priceFor } from "./pricing.js";

export function buildSummary(data) {
  const budgets = data.config?.budgets || {};
  const issues = [];
  const warnings = [];
  const unpricedModels = findUnpricedModels(data.models || []);
  const comparison = normalizeComparison(data.comparison);
  const leakTotal =
    (data.leaks?.totals?.work_pays_personal || 0) +
    (data.leaks?.totals?.personal_pays_work || 0);

  if ((data.totals?.reqs || 0) === 0) {
    warnings.push({
      type: "no_usage",
      message:
        "No Claude Code usage records were found in this window. Run mizan --doctor, try mizan --demo, or persist transcript folders with mizan --set-transcripts personal=/path work=/path.",
    });
  }

  if ((data.leaks?.count || 0) > 0) {
    issues.push({
      type: "leak",
      message: `${data.leaks.count} cross-account leak${data.leaks.count === 1 ? "" : "s"} totaling ${money(leakTotal)}. Switch the session to the right Claude account. If a flagged path is really work, run mizan --add-work-marker /Clients/ with a path fragment from that repo.`,
    });
  }

  if (budgets.daily && data.burn.today >= budgets.daily) {
    issues.push({
      type: "daily_budget",
      message: `Today is ${money(data.burn.today)} against a ${money(budgets.daily)} daily budget.`,
    });
  } else if (budgets.daily && data.burn.today >= budgets.daily * 0.8) {
    warnings.push({
      type: "daily_budget",
      message: `Today is ${money(data.burn.today)} against a ${money(budgets.daily)} daily budget.`,
    });
  }

  if (budgets.monthly && data.burn.projected30d >= budgets.monthly) {
    issues.push({
      type: "monthly_budget",
      message: `30-day projection is ${money(data.burn.projected30d)} against a ${money(budgets.monthly)} monthly budget.`,
    });
  } else if (budgets.monthly && data.burn.projected30d >= budgets.monthly * 0.8) {
    warnings.push({
      type: "monthly_budget",
      message: `30-day projection is ${money(data.burn.projected30d)} against a ${money(budgets.monthly)} monthly budget.`,
    });
  } else if (!budgets.monthly && data.burn.projected30d >= 100) {
    warnings.push({
      type: "monthly_burn",
      message: `30-day projection is ${money(data.burn.projected30d)}. Run mizan --set-budget monthly=${Math.ceil(data.burn.projected30d)} to track this explicitly.`,
    });
  }

  if (unpricedModels.length) {
    const names = unpricedModels.map((item) => `${item.model} (${item.requests} reqs)`).join(", ");
    warnings.push({
      type: "unpriced_model",
      message: `Unpriced model usage detected for ${names}. Totals may be understated until pricing is added.`,
    });
  }

  return {
    status: issues.length ? "fail" : warnings.length ? "warn" : "ok",
    generatedAt: data.generatedAt,
    window: data.window,
    demo: !!data.config?.demo,
    spend: data.totals.cost,
    today: data.burn.today,
    burnPerDay: data.burn.perDay,
    projected30d: data.burn.projected30d,
    requests: data.totals.reqs,
    budgets: { daily: budgets.daily || null, monthly: budgets.monthly || null },
    comparison,
    leaks: {
      count: data.leaks.count,
      total: round(leakTotal),
      workPaysPersonal: data.leaks.totals.work_pays_personal,
      personalPaysWork: data.leaks.totals.personal_pays_work,
    },
    topProjects: data.projects.slice(0, 5).map((project) => ({
      account: project.account,
      project: project.display,
      cost: project.cost,
      requests: project.reqs,
    })),
    unpricedModels,
    issues,
    warnings,
  };
}

export function formatSummary(summary, options = {}) {
  const statusLabel =
    summary.status === "fail" ? "FAIL" : summary.status === "warn" ? "WARN" : "OK";
  const windowLabel = summary.window.days ? `last ${summary.window.days}d` : "all-time";
  const heading = options.heading || "Mizan summary";
  const statusText = options.showStatus === false ? "" : ` [${statusLabel}]`;
  const demoText = summary.demo ? " (demo)" : "";
  const lines = [
    `${heading}${statusText}${demoText}`.trim(),
  ];
  if (options.note) lines.push(options.note);
  lines.push(
    "",
    `Window: ${windowLabel}`,
    `Spend: ${money(summary.spend)} · today ${money(summary.today)} · projected 30d ${money(summary.projected30d)}`,
    `Requests: ${summary.requests}`,
    `Leaks: ${summary.leaks.count} (${money(summary.leaks.total)})`,
  );
  if (summary.leaks.total > 0) {
    lines.push(`Reviewable wrong-account spend: ${money(summary.leaks.total)}`);
  }
  if (summary.comparison) {
    lines.push(
      `Previous ${summary.comparison.windowDays}d: ${money(summary.comparison.previous.cost)} · ${summary.comparison.previous.reqs} reqs`,
      `Change: ${signedMoney(summary.comparison.delta.cost)} (${signedPct(summary.comparison.delta.costPct)}), ${signedNumber(summary.comparison.delta.reqs)} reqs`,
    );
  }

  if (summary.budgets.daily || summary.budgets.monthly) {
    lines.push(
      `Budgets: daily ${summary.budgets.daily ? money(summary.budgets.daily) : "(unset)"} · monthly ${summary.budgets.monthly ? money(summary.budgets.monthly) : "(unset)"}`,
    );
  }

  if (summary.issues.length) {
    lines.push("", `${options.issuesLabel || "Issues"}:`);
    for (const issue of summary.issues) lines.push(`  - ${issue.message}`);
  }
  if (summary.warnings.length) {
    lines.push("", "Warnings:");
    for (const warning of summary.warnings) lines.push(`  - ${warning.message}`);
  }
  if (summary.topProjects.length) {
    lines.push("", "Top projects:");
    for (const project of summary.topProjects) {
      lines.push(`  - ${project.project} (${project.account}) ${money(project.cost)} · ${project.requests} reqs`);
    }
  }
  return lines.join("\n");
}

const round = (n) => Math.round(n * 1000) / 1000;
const money = (n) => {
  const a = Math.abs(n);
  if (a >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (a >= 100) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
};

const signedMoney = (n) => (n > 0 ? `+${money(n)}` : n < 0 ? `-${money(Math.abs(n))}` : "$0.00");
const signedNumber = (n) => (n > 0 ? `+${n}` : String(n));
const signedPct = (n) => {
  if (n == null) return "new";
  const value = `${(Math.abs(n) * 100).toFixed(1)}%`;
  return n > 0 ? `+${value}` : n < 0 ? `-${value}` : "0.0%";
};

function normalizeComparison(comparison) {
  if (!comparison) return null;
  return {
    windowDays: comparison.windowDays,
    previous: {
      cost: comparison.previous?.cost || 0,
      reqs: comparison.previous?.reqs || 0,
    },
    delta: {
      cost: comparison.delta?.cost || 0,
      reqs: comparison.delta?.reqs || 0,
      costPct: comparison.delta?.costPct ?? null,
      reqsPct: comparison.delta?.reqsPct ?? null,
    },
    projects: (comparison.projects || []).map((project) => ({
      account: project.account || "unknown",
      project: project.project || "(unknown)",
      current: {
        cost: project.current?.cost || 0,
        reqs: project.current?.reqs || 0,
      },
      previous: {
        cost: project.previous?.cost || 0,
        reqs: project.previous?.reqs || 0,
      },
      delta: {
        cost: project.delta?.cost || 0,
        reqs: project.delta?.reqs || 0,
        costPct: project.delta?.costPct ?? null,
        reqsPct: project.delta?.reqsPct ?? null,
      },
    })),
  };
}

function findUnpricedModels(models) {
  return models
    .filter((entry) => {
      const model = String(entry.model || "");
      if (!model || model === "<synthetic>") return false;
      const tokens = (entry.input || 0) + (entry.cc || 0) + (entry.cr || 0) + (entry.output || 0);
      if (tokens <= 0) return false;
      const price = priceFor(model);
      return price.input === 0 && price.output === 0 && price.cacheRead === 0 && price.cacheWrite5m === 0;
    })
    .map((entry) => ({ model: entry.model, requests: entry.reqs || 0 }));
}
