import { HOME } from "./config.js";

const DAY = 86_400_000;

export function demoUnits(nowMs = Date.now()) {
  const rec = (id, daysAgo, model, input, output, extra = {}) => [
    `demo-${id}|request-${id}`,
    nowMs - daysAgo * DAY,
    model,
    input,
    extra.cc5 || 0,
    extra.cc1 || 0,
    extra.cr || 0,
    output,
    extra.agent ? 1 : 0,
    "claude",
  ];
  const codexRec = (id, daysAgo, input, cached, output, extra = {}) => [
    `demo-codex-${id}|token-${id}`,
    nowMs - daysAgo * DAY,
    "codex",
    input,
    0,
    0,
    cached,
    output,
    extra.agent ? 1 : 0,
    "codex",
  ];

  return [
    {
      account: "personal",
      provider: "claude",
      mtimeMs: nowMs,
      cwd: `${HOME}/Desktop/Personal/Rihla`,
      session: "demo-personal-rihla",
      branch: "main",
      recs: [
        rec("p1", 0.2, "claude-opus-4-8", 1_200_000, 420_000, { cr: 7_500_000, agent: true }),
        rec("p2", 0.19, "claude-sonnet-4-6", 650_000, 110_000, { cr: 2_200_000, agent: true }),
      ],
    },
    {
      account: "personal",
      provider: "claude",
      mtimeMs: nowMs,
      cwd: `${HOME}/Desktop/Personal/Rihla`,
      session: "demo-personal-rihla-followup",
      branch: "main",
      recs: [
        rec("p3", 6.2, "claude-haiku-4-5", 180_000, 44_000, { cr: 900_000 }),
        rec("p6", 6.19, "claude-sonnet-4-6", 260_000, 58_000, { cr: 1_100_000 }),
      ],
    },
    {
      account: "work",
      provider: "claude",
      mtimeMs: nowMs,
      cwd: `${HOME}/Desktop/Work/ClientPortal`,
      session: "demo-work-client",
      branch: "feature/billing",
      recs: [
        rec("w1", 0.8, "claude-sonnet-4-6", 900_000, 160_000, { cr: 4_000_000, agent: true }),
        rec("w2", 0.79, "claude-haiku-4-5", 240_000, 35_000, { cr: 1_200_000 }),
      ],
    },
    {
      account: "work",
      provider: "claude",
      mtimeMs: nowMs,
      cwd: `${HOME}/Desktop/Personal/starfield`,
      session: "demo-work-pays-personal",
      branch: "main",
      recs: [
        rec("l1", 2.2, "claude-opus-4-8", 1_500_000, 390_000, { cr: 8_000_000, agent: true }),
        rec("l2", 2.19, "claude-opus-4-8", 900_000, 220_000, { cr: 4_100_000, agent: true }),
      ],
    },
    {
      account: "personal",
      provider: "claude",
      mtimeMs: nowMs,
      cwd: `${HOME}/Desktop/Work/LaunchOps`,
      session: "demo-personal-pays-work",
      branch: "review",
      recs: [
        rec("l3", 5.1, "claude-sonnet-4-6", 500_000, 90_000, { cr: 2_500_000, agent: true }),
        rec("l4", 5.095, "claude-sonnet-4-6", 160_000, 24_000, { cr: 800_000, agent: true }),
      ],
    },
    {
      account: "personal",
      provider: "claude",
      mtimeMs: nowMs,
      cwd: `${HOME}/Desktop/Personal/invoice-ar`,
      session: "demo-invoice-ar",
      branch: "main",
      recs: [
        rec("p4", 8.7, "claude-haiku-4-5", 120_000, 28_000, { cr: 640_000 }),
        rec("p5", 8.69, "claude-sonnet-4-6", 330_000, 76_000, { cr: 1_700_000 }),
      ],
    },
    {
      account: "personal",
      provider: "codex",
      mtimeMs: nowMs,
      cwd: `${HOME}/Desktop/Personal/mizan`,
      session: "demo-codex-mizan",
      branch: "main",
      recs: [
        codexRec("c1", 0.3, 48_000, 310_000, 1_900, { agent: true }),
        codexRec("c2", 12.4, 96_000, 720_000, 4_200, { agent: true }),
        codexRec("c3", 65.2, 140_000, 1_100_000, 7_800, { agent: true }),
      ],
    },
  ];
}

export function demoStats(units, nowMs = Date.now()) {
  const accounts = {};
  const providers = {};
  for (const unit of units) {
    accounts[unit.account] ||= {
      dir: `demo://${unit.account}`,
      exists: true,
      files: 0,
      parsed: 0,
      cached: 0,
      skipped: 0,
      records: 0,
    };
    accounts[unit.account].files += 1;
    accounts[unit.account].parsed += 1;
    accounts[unit.account].records += unit.recs.length;

    const provider = unit.provider || "claude";
    providers[provider] ||= {
      provider,
      label: provider === "codex" ? "Codex" : "Claude Code",
      dir: `demo://${provider}`,
      exists: true,
      files: 0,
      parsed: 0,
      cached: 0,
      skipped: 0,
      records: 0,
    };
    providers[provider].files += 1;
    providers[provider].parsed += 1;
    providers[provider].records += unit.recs.length;
  }
  return {
    demo: true,
    files: units.length,
    parsed: units.length,
    cached: 0,
    skipped: 0,
    records: units.reduce((sum, unit) => sum + unit.recs.length, 0),
    accounts,
    providers,
    computeMs: Date.now() - nowMs,
  };
}
