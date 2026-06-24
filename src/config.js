// Mizan configuration — paths, account model, and project classification.
// All values are derived from the environment; nothing is hardcoded per-machine
// beyond the dual-account convention this tool is built for.

import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const HOME = os.homedir();
const DEFAULT_PORT_VALUE = 7777;
const DEFAULT_HOST_VALUE = "127.0.0.1";
const DEFAULT_WORK_MARKERS = ["/Desktop/Work/", "/Work-stuff/"];

export function configPath(env = process.env, home = HOME) {
  return env.MIZAN_CONFIG || path.join(home, ".mizan", "config.json");
}

export function defaultConfig(home = HOME) {
  return {
    personalDir: path.join(home, ".claude", "projects"),
    workDir: path.join(home, ".claude-work", "projects"),
    workMarkers: DEFAULT_WORK_MARKERS,
    dailyBudget: null,
    monthlyBudget: null,
    port: DEFAULT_PORT_VALUE,
    host: DEFAULT_HOST_VALUE,
  };
}

export function loadUserConfig({ env = process.env, home = HOME } = {}) {
  const file = configPath(env, home);
  try {
    const raw = fs.readFileSync(file, "utf8");
    const data = JSON.parse(raw);
    return {
      path: file,
      exists: true,
      config: data && typeof data === "object" && !Array.isArray(data) ? data : {},
      error: null,
    };
  } catch (err) {
    if (err && err.code === "ENOENT") {
      return { path: file, exists: false, config: {}, error: null };
    }
    return { path: file, exists: false, config: {}, error: err.message || String(err) };
  }
}

export function writeDefaultConfig({ env = process.env, home = HOME, force = false } = {}) {
  const file = configPath(env, home);
  if (!force && fs.existsSync(file)) {
    return { path: file, created: false, exists: true };
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(defaultConfig(home), null, 2)}\n`);
  return { path: file, created: true, exists: true };
}

export function writeBudgetConfig(budgets, { env = process.env, home = HOME } = {}) {
  const user = loadUserConfig({ env, home });
  const created = !user.exists;
  const next = { ...defaultConfig(home), ...user.config };
  if (Object.hasOwn(budgets, "daily")) next.dailyBudget = budgets.daily;
  if (Object.hasOwn(budgets, "monthly")) next.monthlyBudget = budgets.monthly;

  fs.mkdirSync(path.dirname(user.path), { recursive: true });
  fs.writeFileSync(user.path, `${JSON.stringify(next, null, 2)}\n`);
  return {
    path: user.path,
    created,
    budgets: { daily: next.dailyBudget ?? null, monthly: next.monthlyBudget ?? null },
  };
}

export function writeWorkMarkerConfig(markers, { env = process.env, home = HOME } = {}) {
  const user = loadUserConfig({ env, home });
  const created = !user.exists;
  const next = { ...defaultConfig(home), ...user.config };
  const current = Array.isArray(next.workMarkers) ? next.workMarkers : resolveWorkMarkers({}, next);
  next.workMarkers = [...new Set([...current, ...markers.map((marker) => String(marker).trim()).filter(Boolean)])];

  fs.mkdirSync(path.dirname(user.path), { recursive: true });
  fs.writeFileSync(user.path, `${JSON.stringify(next, null, 2)}\n`);
  return {
    path: user.path,
    created,
    workMarkers: next.workMarkers,
  };
}

export function writeTranscriptConfig(accounts, { env = process.env, home = HOME } = {}) {
  const user = loadUserConfig({ env, home });
  const created = !user.exists;
  const next = { ...defaultConfig(home), ...user.config };
  if (Object.hasOwn(accounts, "personal")) next.personalDir = accounts.personal;
  if (Object.hasOwn(accounts, "work")) next.workDir = accounts.work;

  fs.mkdirSync(path.dirname(user.path), { recursive: true });
  fs.writeFileSync(user.path, `${JSON.stringify(next, null, 2)}\n`);
  return {
    path: user.path,
    created,
    accounts: { personal: next.personalDir, work: next.workDir },
  };
}

export function resolveAccounts(env = process.env, home = HOME, userConfig = loadUserConfig({ env, home }).config) {
  const personalConfigDir = env.CLAUDE_CONFIG_DIR || path.join(home, ".claude");
  return Object.freeze({
    personal: env.MIZAN_PERSONAL_DIR || userConfig.personalDir || path.join(personalConfigDir, "projects"),
    work: env.MIZAN_WORK_DIR || userConfig.workDir || path.join(home, ".claude-work", "projects"),
  });
}

// The two Claude Code transcript directories. These default to the common
// personal/work split, but can be overridden for other machines.
export const ACCOUNTS = resolveAccounts();

export const ACCOUNT_ORDER = ["personal", "work"];

// A project (working directory) is classified as "work" if its path contains any
// of these markers; otherwise it is "personal". This drives leak detection:
// a session billed to one account whose project belongs to the other is a leak.
// Override with config.json or MIZAN_WORK_MARKERS (comma-separated path fragments).
export function resolveWorkMarkers(env = process.env, userConfig = loadUserConfig({ env }).config) {
  const markers =
    env.MIZAN_WORK_MARKERS ||
    (Array.isArray(userConfig.workMarkers) ? userConfig.workMarkers.join(",") : userConfig.workMarkers);
  return (markers ? String(markers).split(",") : DEFAULT_WORK_MARKERS)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const WORK_MARKERS = Object.freeze(resolveWorkMarkers());

export function resolveBudgets(env = process.env, userConfig = loadUserConfig({ env }).config) {
  return Object.freeze({
    daily: parseBudget(env.MIZAN_DAILY_BUDGET ?? userConfig.dailyBudget),
    monthly: parseBudget(env.MIZAN_MONTHLY_BUDGET ?? userConfig.monthlyBudget),
  });
}

export function budgetIssues(env = process.env, userConfig = loadUserConfig({ env }).config) {
  const issues = [];
  for (const [name, value] of [
    ["MIZAN_DAILY_BUDGET/dailyBudget", env.MIZAN_DAILY_BUDGET ?? userConfig.dailyBudget],
    ["MIZAN_MONTHLY_BUDGET/monthlyBudget", env.MIZAN_MONTHLY_BUDGET ?? userConfig.monthlyBudget],
  ]) {
    if (value == null || value === "") continue;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      issues.push(`${name} must be a positive number of USD; received "${value}".`);
    }
  }
  return issues;
}

function parseBudget(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export const BUDGETS = resolveBudgets();

// Which account a project's work *should* be billed to, purely from its path.
export function expectedAccount(cwd) {
  if (!cwd) return "personal";
  return WORK_MARKERS.some((m) => cwd.includes(m)) ? "work" : "personal";
}

export const CACHE_DIR = path.join(HOME, ".mizan");
export const CACHE_FILE = path.join(CACHE_DIR, "cache.json");
export const CONFIG_FILE = configPath();

export function resolvePort(env = process.env, userConfig = loadUserConfig({ env }).config) {
  const value = env.MIZAN_PORT ?? userConfig.port ?? DEFAULT_PORT_VALUE;
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_PORT_VALUE;
}

export function resolveHost(env = process.env, userConfig = loadUserConfig({ env }).config) {
  const value = env.MIZAN_HOST ?? userConfig.host ?? DEFAULT_HOST_VALUE;
  const host = String(value || "").trim();
  return isValidHost(host) ? host : DEFAULT_HOST_VALUE;
}

export function isLocalHost(host) {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

function isValidHost(host) {
  return !!host && host.length <= 255 && !/[\s/\\]/.test(host);
}

export const DEFAULT_PORT = resolvePort();
export const DEFAULT_HOST = resolveHost();

export function getRuntimeConfig({ demo = false, host = DEFAULT_HOST, port = DEFAULT_PORT } = {}) {
  if (demo) {
    return getDemoRuntimeConfig({ host, port });
  }

  const user = loadUserConfig();
  return {
    demo,
    localOnly: isLocalHost(host),
    node: process.version,
    host,
    port,
    configFile: { path: user.path, exists: user.exists, error: user.error },
    cacheFile: CACHE_FILE,
    workMarkers: WORK_MARKERS,
    budgets: BUDGETS,
    accounts: ACCOUNT_ORDER.map((account) => {
      const dir = ACCOUNTS[account];
      return { account, dir, exists: fs.existsSync(dir) };
    }),
  };
}

function getDemoRuntimeConfig({ host = DEFAULT_HOST, port = DEFAULT_PORT } = {}) {
  return {
    demo: true,
    localOnly: isLocalHost(host),
    node: process.version,
    host,
    port,
    configFile: { path: "demo://config", exists: false, error: null },
    cacheFile: "demo://cache",
    workMarkers: resolveWorkMarkers({}, {}),
    budgets: { daily: null, monthly: null },
    accounts: ACCOUNT_ORDER.map((account) => ({
      account,
      dir: `demo://${account}`,
      exists: true,
    })),
  };
}

export { HOME };
