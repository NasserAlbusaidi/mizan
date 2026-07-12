// Roll up parsed transcript units into the dashboard payload: account split, daily
// series, model mix, per-project and per-session breakdowns, burn rate, projections,
// cache efficiency, and cross-account leaks.
//
// Dedup is global on (message.id|requestId), matching the reference `claude-usage`
// script — the same assistant message can appear in multiple files (resumed/forked
// sessions copy prior history), so per-file sums must be de-duplicated before totals.

import { costOf } from "./pricing.js";
import { HOME } from "./config.js";
import { classifyLeak } from "./leaks.js";

const DAY = 86_400_000;

function localDateKey(t) {
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const emptyBucket = () => ({ cost: 0, input: 0, cc: 0, cr: 0, output: 0, reqs: 0 });

function addTokens(b, rec, cost) {
  b.cost += cost;
  b.input += rec.input;
  b.cc += rec.cc5 + rec.cc1;
  b.cr += rec.cr;
  b.output += rec.output;
  b.reqs += 1;
}

// `displayCutoffMs` filters the rollups (totals, accounts, models, projects, days,
// sessions). Burn/today/7d/30d always use absolute rolling windows, so callers must
// scan at least 30 days of files even when the display window is shorter.
export function aggregate(units, displayCutoffMs, nowMs) {
  const cutoffMs = displayCutoffMs;
  const seen = new Set();
  const accounts = { personal: emptyBucket(), work: emptyBucket() };
  const models = new Map();
  const projects = new Map();
  const providers = new Map();
  const previousProjects = new Map();
  const days = new Map(); // dateKey -> { personal, work }
  const sessions = new Map();
  const totals = emptyBucket();
  const previousTotals = emptyBucket();
  const windowMs = cutoffMs ? nowMs - cutoffMs : 0;
  const previousCutoffMs = windowMs > 0 ? cutoffMs - windowMs : 0;

  // rolling windows
  let spendToday = 0;
  let spend7d = 0;
  let spend30d = 0;
  const todayKey = localDateKey(nowMs);
  const since7 = nowMs - 7 * DAY;
  const since30 = nowMs - 30 * DAY;

  for (const unit of units) {
    const account = unit.account;
    const cwd = unit.cwd;
    const unitProvider = unit.provider || "claude";
    for (const rec of unit.recs) {
      const [key, t, model, input, cc5, cc1, cr, output, sc, recordProvider] = rec;
      const provider = recordProvider || unitProvider;
      const dedupKey = key === "|" ? null : `${provider}:${key}`;
      if (dedupKey && seen.has(dedupKey)) continue;
      if (dedupKey) seen.add(dedupKey);

      const cost = costOf(
        { input, output, cacheRead: cr, cacheWrite5m: cc5, cacheWrite1h: cc1 },
        model,
      );
      const r = { input, cc5, cc1, cr, output };
      const projectKey = `${provider}\x00${account}\x00${cwd || "(unknown)"}`;

      // Skip records too old for BOTH the display window and the 30-day burn
      // window (dedup above has already run, so a later duplicate cannot resurrect them).
      if (t < cutoffMs && t < since30 && (!previousCutoffMs || t < previousCutoffMs)) continue;

      // Burn windows are absolute and independent of the display window.
      if (localDateKey(t) === todayKey) spendToday += cost;
      if (t >= since7) spend7d += cost;
      if (t >= since30) spend30d += cost;

      if (previousCutoffMs && t >= previousCutoffMs && t < cutoffMs) {
        addTokens(previousTotals, r, cost);
        const pkey = projectKey;
        let pb = previousProjects.get(pkey);
        if (!pb) {
          previousProjects.set(
            pkey,
            (pb = { provider, account, cwd: cwd || "(unknown)", ...emptyBucket() }),
          );
        }
        addTokens(pb, r, cost);
        continue;
      }

      // Everything below is the display rollup, gated by the display window.
      if (t < cutoffMs) continue;

      addTokens(totals, r, cost);
      addTokens(accounts[account] || (accounts[account] = emptyBucket()), r, cost);

      let pbv = providers.get(provider);
      if (!pbv) providers.set(provider, (pbv = { provider, label: providerLabel(provider), ...emptyBucket() }));
      addTokens(pbv, r, cost);

      const modelKey = `${provider}\x00${model}`;
      let mb = models.get(modelKey);
      if (!mb) models.set(modelKey, (mb = { provider, model, ...emptyBucket() }));
      addTokens(mb, r, cost);

      const pkey = projectKey;
      let pb = projects.get(pkey);
      if (!pb) projects.set(pkey, (pb = { provider, account, cwd: cwd || "(unknown)", ...emptyBucket() }));
      addTokens(pb, r, cost);

      const dk = localDateKey(t);
      let db = days.get(dk);
      if (!db) days.set(dk, (db = { personal: 0, work: 0 }));
      db[account] = (db[account] || 0) + cost;

      const skey = unit.session ? `${provider}:${unit.session}` : `file:${pkey}`;
      let sb = sessions.get(skey);
      if (!sb) {
        sb = {
          session: skey,
          provider,
          account,
          cwd,
          branch: unit.branch || null,
          first: t,
          last: t,
          agent: false,
          modelCost: new Map(),
          ...emptyBucket(),
        };
        sessions.set(skey, sb);
      }
      addTokens(sb, r, cost);
      sb.first = Math.min(sb.first, t);
      sb.last = Math.max(sb.last, t);
      if (sc) sb.agent = true;
      sb.modelCost.set(model, (sb.modelCost.get(model) || 0) + cost);
    }
  }

  // Finalize sessions: pick dominant model, drop the working Map, classify leaks.
  const sessionList = [];
  const leaks = [];
  const leakTotals = { work_pays_personal: 0, personal_pays_work: 0 };
  for (const s of sessions.values()) {
    let topModel = "unknown";
    let topCost = -1;
    for (const [m, c] of s.modelCost) {
      if (c > topCost) {
        topCost = c;
        topModel = m;
      }
    }
    delete s.modelCost;
    s.model = topModel;
    const leak = s.provider === "claude" ? classifyLeak(s) : null;
    if (leak) {
      s.leak = leak;
      leakTotals[leak] += s.cost;
      leaks.push(s);
    }
    sessionList.push(s);
  }

  const dayList = [...days.entries()]
    .map(([date, v]) => ({
      date,
      personal: round(v.personal),
      work: round(v.work),
      total: round((v.personal || 0) + (v.work || 0)),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const modelList = [...models.values()].sort(compareUsageBuckets);
  const providerList = [...providers.values()].sort(compareUsageBuckets);
  const projectList = [...projects.values()].sort(compareUsageBuckets);
  const topSessions = [...sessionList].sort((a, b) => b.cost - a.cost).slice(0, 30);
  leaks.sort((a, b) => b.cost - a.cost);

  // Cache efficiency: share of would-be input tokens served from the (cheap) cache.
  const cacheableInput = totals.input + totals.cc + totals.cr;
  const cacheHitRatio = cacheableInput ? totals.cr / cacheableInput : 0;

  const burnPerDay = spend7d / 7;

  return {
    generatedAt: nowMs,
    window: { cutoffMs, days: cutoffMs ? Math.round((nowMs - cutoffMs) / DAY) : null },
    totals: withTokenTotal(totals),
    accounts: {
      personal: withTokenTotal(accounts.personal),
      work: withTokenTotal(accounts.work),
    },
    burn: {
      today: round(spendToday),
      last7d: round(spend7d),
      last30d: round(spend30d),
      perDay: round(burnPerDay),
      projected30d: round(burnPerDay * 30),
    },
    comparison: buildComparison(windowMs, totals, previousTotals, projects, previousProjects),
    cache: {
      hitRatio: round4(cacheHitRatio),
      readTokens: totals.cr,
      writeTokens: totals.cc,
      freshInputTokens: totals.input,
    },
    days: dayList,
    providers: providerList.map(withTokenTotal),
    models: modelList.map(withTokenTotal),
    projects: projectList.map((p) => ({ ...withTokenTotal(p), display: shorten(p.cwd) })),
    sessions: topSessions.map(finalizeSession),
    leaks: {
      totals: {
        work_pays_personal: round(leakTotals.work_pays_personal),
        personal_pays_work: round(leakTotals.personal_pays_work),
      },
      count: leaks.length,
      sessions: leaks.slice(0, 50).map(finalizeSession),
    },
  };
}

function buildComparison(windowMs, current, previous, currentProjects = new Map(), previousProjects = new Map()) {
  if (!windowMs) return null;
  const currentCost = round(current.cost);
  const previousCost = round(previous.cost);
  const costDelta = round(currentCost - previousCost);
  const reqDelta = current.reqs - previous.reqs;
  return {
    windowDays: Math.round(windowMs / DAY),
    previous: {
      cost: previousCost,
      reqs: previous.reqs,
    },
    delta: {
      cost: costDelta,
      reqs: reqDelta,
      costPct: previousCost ? round4(costDelta / previousCost) : null,
      reqsPct: previous.reqs ? round4(reqDelta / previous.reqs) : null,
    },
    projects: buildProjectComparison(currentProjects, previousProjects),
  };
}

function buildProjectComparison(currentProjects, previousProjects) {
  const keys = new Set([...currentProjects.keys(), ...previousProjects.keys()]);
  return [...keys]
    .map((key) => {
      const current = currentProjects.get(key);
      const previous = previousProjects.get(key);
      const currentCost = round(current?.cost || 0);
      const previousCost = round(previous?.cost || 0);
      const costDelta = round(currentCost - previousCost);
      const currentReqs = current?.reqs || 0;
      const previousReqs = previous?.reqs || 0;
      const reqDelta = currentReqs - previousReqs;
      return {
        account: current?.account || previous?.account || "unknown",
        provider: current?.provider || previous?.provider || "claude",
        project: shorten(current?.cwd || previous?.cwd || "(unknown)"),
        current: { cost: currentCost, reqs: currentReqs },
        previous: { cost: previousCost, reqs: previousReqs },
        delta: {
          cost: costDelta,
          reqs: reqDelta,
          costPct: previousCost ? round4(costDelta / previousCost) : null,
          reqsPct: previousReqs ? round4(reqDelta / previousReqs) : null,
        },
      };
    })
    .filter((project) => project.delta.cost > 0)
    .sort((a, b) => b.delta.cost - a.delta.cost || b.current.cost - a.current.cost)
    .slice(0, 5);
}

function finalizeSession(s) {
  return {
    session: s.session,
    provider: s.provider || "claude",
    account: s.account,
    project: shorten(s.cwd),
    cwd: s.cwd,
    branch: s.branch,
    model: s.model,
    agent: s.agent,
    leak: s.leak || null,
    cost: round(s.cost),
    output: s.output,
    input: s.input,
    cr: s.cr,
    reqs: s.reqs,
    first: s.first,
    last: s.last,
    durationMin: Math.round((s.last - s.first) / 60000),
  };
}

function shorten(cwd) {
  if (!cwd) return "(unknown)";
  return cwd.replace(HOME, "~");
}

const round = (n) => Math.round(n * 1000) / 1000;
const round4 = (n) => Math.round(n * 10000) / 10000;
function roundBucket(b) {
  return { ...b, cost: round(b.cost) };
}

function tokenTotal(b) {
  return (b.input || 0) + (b.cc || 0) + (b.cr || 0) + (b.output || 0);
}

function withTokenTotal(b) {
  return { ...roundBucket(b), tokens: tokenTotal(b) };
}

function compareUsageBuckets(a, b) {
  return b.cost - a.cost || tokenTotal(b) - tokenTotal(a) || b.reqs - a.reqs;
}

function providerLabel(provider) {
  if (provider === "claude") return "Claude Code";
  if (provider === "codex") return "Codex";
  return provider || "Unknown";
}
