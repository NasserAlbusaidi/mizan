// Orchestrates a full computation: load cache -> incremental scan -> persist cache
// -> aggregate. A short in-memory memo absorbs the dashboard's polling so rapid
// refreshes don't re-stat the filesystem.

import { loadCache, saveCache } from "./cache.js";
import { scan } from "./scanner.js";
import { aggregate } from "./aggregate.js";
import { getRuntimeConfig } from "./config.js";
import { demoStats, demoUnits } from "./demo-data.js";
import { PRICING_METADATA } from "./pricing.js";

const MEMO_TTL_MS = 4000;
let memo = { key: null, at: 0, data: null };

// windowDays: number of days to include, or null/0 for all-time.
export function compute(windowDays, { useMemo = true, demo = false, host, port } = {}) {
  const now = Date.now();
  const DAY = 86_400_000;
  const displayCutoffMs = windowDays ? now - windowDays * DAY : 0;
  // Always scan enough history for previous-window comparison plus at least 30
  // days for burn-rate and projection metrics.
  const scanCutoffMs = windowDays ? now - Math.max(windowDays * 2, 30) * DAY : 0;
  const key = `${demo ? "demo:" : ""}${String(windowDays || "all")}:${host || ""}:${port || ""}`;

  if (useMemo && memo.key === key && now - memo.at < MEMO_TTL_MS) {
    return memo.data;
  }

  const t0 = now;
  if (demo) {
    const units = demoUnits(now);
    const data = aggregate(units, displayCutoffMs, now);
    data.stats = { ...demoStats(units, t0), computeMs: Date.now() - t0 };
    data.config = getRuntimeConfig({ demo: true, host, port });
    data.pricing = PRICING_METADATA;
    memo = { key, at: Date.now(), data };
    return data;
  }

  const cache = loadCache();
  const { units, cache: nextCache, stats } = scan(cache, scanCutoffMs);
  saveCache(nextCache);
  const data = aggregate(units, displayCutoffMs, now);
  data.stats = { ...stats, computeMs: Date.now() - t0 };
  data.config = getRuntimeConfig({ demo: false, host, port });
  data.pricing = PRICING_METADATA;

  memo = { key, at: Date.now(), data };
  return data;
}
