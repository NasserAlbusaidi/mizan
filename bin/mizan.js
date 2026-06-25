#!/usr/bin/env node
// Mizan entry point: warm the cache, start the server, open the browser.

import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createServer } from "../src/server.js";
import { compute } from "../src/engine.js";
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  isLocalHost,
  writeBudgetConfig,
  writeDefaultConfig,
  writeTranscriptConfig,
  writeWorkMarkerConfig,
} from "../src/config.js";
import { helpText, parseCliArgs } from "../src/cli-options.js";
import { buildDoctorReport, formatDoctorReport } from "../src/doctor.js";
import { formatPricingReport, pricingRows, PRICING_METADATA } from "../src/pricing.js";
import { buildSummary, formatSummary } from "../src/summary.js";
import { buildReport, formatCsvReport, formatMarkdownReport } from "../src/report.js";
import { buildSupportBundle, formatSupportBundle } from "../src/support-bundle.js";
import { formatSetupKit } from "../src/setup-kit.js";
import { formatFeedbackGuide } from "../src/feedback.js";
import { formatShareGuide } from "../src/share.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

let options;
try {
  options = parseCliArgs(process.argv.slice(2), { port: DEFAULT_PORT, host: DEFAULT_HOST });
} catch (err) {
  console.error(`mizan: ${err.message}`);
  process.exit(1);
}

if (options.help) {
  console.log(helpText(DEFAULT_PORT));
  process.exit(0);
}

if (options.version) {
  console.log(`${packageJson.name} ${packageJson.version}`);
  process.exit(0);
}

const port = options.port;
const host = options.host;

if (options.initConfig) {
  try {
    const result = writeDefaultConfig();
    printWithNextSteps(result.created ? `Created ${result.path}` : `Config already exists at ${result.path}`, [
      "Verify setup: mizan --doctor --check",
      "Save custom transcript folders if needed: mizan --set-transcripts personal=/path work=/path",
      "Open the dashboard: mizan",
    ]);
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (options.setBudget) {
  try {
    const result = writeBudgetConfig(options.setBudget);
    printWithNextSteps(
      `Saved budgets to ${result.path}: daily ${formatBudget(result.budgets.daily)}, monthly ${formatBudget(result.budgets.monthly)}`,
      [
        "Check thresholds now: mizan --check --window 30",
        "Generate a weekly report: mizan --weekly",
        "Open the dashboard: mizan",
      ],
    );
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (options.addWorkMarkers) {
  try {
    const result = writeWorkMarkerConfig(options.addWorkMarkers);
    printWithNextSteps(`Saved work markers to ${result.path}: ${result.workMarkers.join(", ")}`, [
      "Recheck leak status: mizan --summary --window 7",
      "Generate a weekly report: mizan --weekly",
      "Open the dashboard: mizan",
    ]);
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (options.setTranscripts) {
  try {
    const result = writeTranscriptConfig(options.setTranscripts);
    printWithNextSteps(
      `Saved transcript folders to ${result.path}: personal ${result.accounts.personal}, work ${result.accounts.work}`,
      [
        "Verify folders: mizan --doctor --check",
        "Open the dashboard: mizan",
        "Preview sample data if setup is still empty: mizan --demo",
      ],
    );
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (options.setup) {
  try {
    const config = writeDefaultConfig();
    const report = buildDoctorReport();
    const content = options.json
      ? JSON.stringify({ ok: report.ok, config, doctor: report }, null, 2)
      : formatSetupReport(config, report);
    emitOutput(content, options.output, "setup report");
    process.exit(report.ok ? 0 : 2);
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
}

if (options.doctor) {
  try {
    const report = buildDoctorReport();
    emitOutput(options.json ? JSON.stringify(report, null, 2) : formatDoctorReport(report), options.output, "doctor report");
    process.exit(options.check && !report.ok ? 2 : 0);
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
}

if (options.setupKit) {
  emitOutput(formatSetupKit(), options.output, "setup kit");
  process.exit(0);
}

if (options.supportBundle) {
  try {
    const bundle = buildSupportBundle({
      packageName: packageJson.name,
      packageVersion: packageJson.version,
      doctorReport: buildDoctorReport(),
    });
    emitOutput(formatSupportBundle(bundle), options.output, "support bundle");
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
  process.exit(0);
}

if (options.feedback) {
  emitOutput(formatFeedbackGuide(), options.output, "feedback guide");
  process.exit(0);
}

if (options.share) {
  emitOutput(formatShareGuide({ packageVersion: packageJson.version }), options.output, "share guide");
  process.exit(0);
}

if (options.pricing) {
  emitOutput(
    options.json
      ? JSON.stringify({ metadata: PRICING_METADATA, rows: pricingRows() }, null, 2)
      : formatPricingReport(),
    options.output,
    "pricing report",
  );
  process.exit(0);
}

if (options.tryDemo) {
  try {
    const data = compute(options.windowDays, { useMemo: false, demo: true, host, port });
    const summary = buildSummary(data);
    const tag = `v${packageJson.version}`;
    const next = [
      `npm install -g github:NasserAlbusaidi/mizan#${tag}`,
      "npm install -g https://github.com/NasserAlbusaidi/mizan/releases/latest/download/mizan-latest.tgz",
      "mizan --demo",
      "mizan --setup",
      "mizan --set-transcripts personal=/path work=/path",
    ];
    const content = options.json
      ? JSON.stringify({ summary, next }, null, 2)
      : formatTryReport(summary, next);
    emitOutput(content, options.output, "try report");
    process.exit(0);
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
}

if (options.csv) {
  try {
    const data = compute(options.windowDays, { useMemo: false, demo: options.demo, host, port });
    const report = buildReport(data);
    emitOutput(formatCsvReport(report), options.output, "CSV export");
    process.exit(options.check && report.status === "fail" ? 2 : 0);
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
}

if (options.report) {
  try {
    const data = compute(options.windowDays, { useMemo: false, demo: options.demo, host, port });
    const report = buildReport(data);
    emitOutput(options.json ? JSON.stringify(report, null, 2) : formatMarkdownReport(report), options.output, "report");
    process.exit(options.check && report.status === "fail" ? 2 : 0);
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
}

if (options.summary || options.check) {
  try {
    const data = compute(options.windowDays, { useMemo: false, demo: options.demo, host, port });
    const summary = buildSummary(data);
    emitOutput(options.json ? JSON.stringify(summary, null, 2) : formatSummary(summary), options.output, "summary");
    process.exit(options.check && summary.status === "fail" ? 2 : 0);
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
}

if (options.json) {
  try {
    const data = compute(options.windowDays, { useMemo: false, demo: options.demo, host, port });
    emitOutput(JSON.stringify(data, null, 2), options.output, "JSON snapshot");
  } catch (err) {
    console.error(`mizan: ${err.stack || err.message}`);
    process.exit(1);
  }
  process.exit(0);
}

console.log("⚖  Mizan — Claude Code spend & usage");
if (options.demo) {
  console.log("   demo mode: using anonymized sample data");
}
if (options.warm) {
  console.log("   warming cache (first run parses all transcripts; later runs are incremental)…");

  const t0 = Date.now();
  try {
    const warm = compute(options.windowDays, { useMemo: false, demo: options.demo, host, port });
    const s = warm.stats;
    console.log(
      `   ready in ${((Date.now() - t0) / 1000).toFixed(1)}s — ${s.files} files (${s.parsed} parsed, ${s.cached} cached), ${s.records} records`,
    );
    if (!options.demo && s.records === 0) {
      console.log("   No usage records found.");
      console.log("   Try `mizan --demo` to preview the dashboard with sample data.");
      console.log("   Run `mizan --setup` to diagnose transcript folders.");
      console.log("   Save custom folders with `mizan --set-transcripts personal=/path work=/path`.");
    }
  } catch (err) {
    console.error("   warm-up failed (server will still start):", err.message);
  }
}

const server = createServer({ demo: options.demo, host, port });
server.listen(port, host, () => {
  const actual = server.address();
  const actualPort = actual && typeof actual === "object" ? actual.port : port;
  const url = `http://${urlHost(host)}:${actualPort}`;
  const scope = isLocalHost(host) ? "local-only" : `network-accessible on ${host}`;
  console.log(`\n   ▶  ${scope}: ${url}\n`);
  if (options.open) openBrowser(url);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is in use. Run \`mizan --port 7788\` or save a different default with \`mizan --init-config\` and edit ~/.mizan/config.json.`,
    );
    process.exit(1);
  }
  throw err;
});

function openBrowser(target) {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    spawn(cmd, [target], { stdio: "ignore", detached: true }).unref();
  } catch {
    // Headless / no browser — the URL is printed above.
  }
}

function urlHost(host) {
  if (host === "0.0.0.0" || host === "::") return "127.0.0.1";
  return host.includes(":") ? `[${host}]` : host;
}

function formatBudget(value) {
  return value == null ? "(unset)" : `$${value}`;
}

function formatSetupReport(config, report) {
  const header = config.created ? `Created ${config.path}` : `Config already exists at ${config.path}`;
  return `${header}\n\n${formatDoctorReport(report)}`;
}

function formatTryReport(summary, next) {
  return `Mizan try mode
Demo data only. No local transcripts are read.
The sample intentionally includes wrong-account leaks so you can see what Mizan catches.

${formatSummary(summary)}
Next:
  - Install Mizan: ${next[0]}
  - Fallback install: ${next[1]}
  - Open the sample dashboard: ${next[2]}
  - Check real transcript setup: ${next[3]}
  - Save custom folders: ${next[4]}`;
}

function printWithNextSteps(message, steps) {
  console.log(`${message}\n\nNext:\n${steps.map((step) => `  - ${step}`).join("\n")}`);
}

function emitOutput(content, outputPath, label) {
  const text = content.endsWith("\n") ? content : `${content}\n`;
  if (!outputPath) {
    process.stdout.write(text);
    return;
  }
  const target = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
  console.log(`Wrote ${label} to ${target}`);
}
