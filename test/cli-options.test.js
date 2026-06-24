import { test } from "node:test";
import assert from "node:assert/strict";
import { helpText, parseCliArgs } from "../src/cli-options.js";

test("parseCliArgs defaults to dashboard mode", () => {
  const opts = parseCliArgs([], { port: 7777, host: "127.0.0.1" });
  assert.equal(opts.port, 7777);
  assert.equal(opts.host, "127.0.0.1");
  assert.equal(opts.window, "30");
  assert.equal(opts.windowDays, 30);
  assert.equal(opts.open, true);
  assert.equal(opts.warm, true);
  assert.equal(opts.json, false);
  assert.equal(opts.supportBundle, false);
  assert.equal(opts.feedback, false);
  assert.equal(opts.share, false);
  assert.equal(opts.setupKit, false);
  assert.equal(opts.csv, false);
});

test("parseCliArgs supports JSON snapshots and explicit windows", () => {
  const opts = parseCliArgs(
    [
      "--json",
      "--demo",
      "--doctor",
      "--pricing",
      "--summary",
      "--check",
      "--window",
      "7",
      "--port=7788",
      "--host=0.0.0.0",
    ],
    {
      port: 7777,
      host: "127.0.0.1",
    },
  );
  assert.equal(opts.json, true);
  assert.equal(opts.demo, true);
  assert.equal(opts.doctor, true);
  assert.equal(opts.pricing, true);
  assert.equal(opts.version, false);
  assert.equal(opts.initConfig, false);
  assert.equal(opts.setupKit, false);
  assert.equal(opts.summary, true);
  assert.equal(opts.report, false);
  assert.equal(opts.check, true);
  assert.equal(opts.open, false);
  assert.equal(opts.window, "7");
  assert.equal(opts.windowDays, 7);
  assert.equal(opts.port, 7788);
  assert.equal(opts.host, "0.0.0.0");
  assert.equal(opts.output, null);
});

test("parseCliArgs supports a one-day spend window", () => {
  const opts = parseCliArgs(["--summary", "--window", "1"]);
  assert.equal(opts.window, "1");
  assert.equal(opts.windowDays, 1);
  assert.equal(opts.open, false);
});

test("parseCliArgs supports a today shorthand", () => {
  const opts = parseCliArgs(["--today"]);
  assert.equal(opts.summary, true);
  assert.equal(opts.window, "1");
  assert.equal(opts.windowDays, 1);
  assert.equal(opts.open, false);
});

test("parseCliArgs supports a weekly report shorthand", () => {
  const opts = parseCliArgs(["--weekly"]);
  assert.equal(opts.report, true);
  assert.equal(opts.window, "7");
  assert.equal(opts.windowDays, 7);
  assert.equal(opts.open, false);
});

test("parseCliArgs supports CSV export mode", () => {
  const opts = parseCliArgs(["--csv", "--window", "7", "--output", "reports/week.csv"]);
  assert.equal(opts.csv, true);
  assert.equal(opts.open, false);
  assert.equal(opts.window, "7");
  assert.equal(opts.windowDays, 7);
  assert.equal(opts.output, "reports/week.csv");
});

test("parseCliArgs supports the first-run try command", () => {
  const opts = parseCliArgs(["--try"]);
  assert.equal(opts.tryDemo, true);
  assert.equal(opts.demo, true);
  assert.equal(opts.window, "7");
  assert.equal(opts.windowDays, 7);
  assert.equal(opts.open, false);
});

test("parseCliArgs supports support bundle mode", () => {
  const opts = parseCliArgs(["--support-bundle"]);
  assert.equal(opts.supportBundle, true);
  assert.equal(opts.open, false);
});

test("parseCliArgs supports feedback mode", () => {
  const opts = parseCliArgs(["--feedback"]);
  assert.equal(opts.feedback, true);
  assert.equal(opts.open, false);
});

test("parseCliArgs supports share mode", () => {
  const opts = parseCliArgs(["--share"]);
  assert.equal(opts.share, true);
  assert.equal(opts.open, false);
});

test("parseCliArgs supports setup mode", () => {
  const opts = parseCliArgs(["--setup"]);
  assert.equal(opts.setup, true);
  assert.equal(opts.open, false);
});

test("parseCliArgs supports setup kit mode", () => {
  const opts = parseCliArgs(["--setup-kit", "--output", "setup-kit.md"]);
  assert.equal(opts.setupKit, true);
  assert.equal(opts.output, "setup-kit.md");
  assert.equal(opts.open, false);
});

test("parseCliArgs rejects unsafe ports, hosts, and unknown windows", () => {
  assert.throws(() => parseCliArgs(["--port", "70000"]), /Invalid port/);
  assert.throws(() => parseCliArgs(["--host", "bad/host"]), /Invalid host/);
  assert.throws(() => parseCliArgs(["--host", ""]), /Invalid host/);
  assert.throws(() => parseCliArgs(["--window", "3"]), /Invalid window/);
});

test("helpText documents the scriptable JSON path", () => {
  const text = helpText(7777);
  assert.match(text, /First minute:/);
  assert.match(text, /mizan --try/);
  assert.match(text, /Try Mizan in the terminal with demo data/);
  assert.match(text, /Preview the dashboard with sample data/);
  assert.match(text, /mizan --today/);
  assert.match(text, /mizan --weekly/);
  assert.match(text, /Shortcut for --report --window 7/);
  assert.match(text, /mizan --summary --window 1/);
  assert.match(text, /mizan --json --window 7/);
  assert.match(text, /mizan --csv --window 7/);
  assert.match(text, /mizan --host 0\.0\.0\.0/);
  assert.match(text, /mizan --demo/);
  assert.match(text, /mizan --doctor/);
  assert.match(text, /mizan --doctor --check/);
  assert.match(text, /mizan --setup-kit/);
  assert.match(text, /mizan --setup/);
  assert.match(text, /mizan --init-config/);
  assert.match(text, /mizan --set-budget daily=20 monthly=250/);
  assert.match(text, /mizan --add-work-marker \/Clients\//);
  assert.match(text, /mizan --set-transcripts personal=~\/\.claude\/projects/);
  assert.match(text, /mizan --support-bundle/);
  assert.match(text, /mizan --feedback/);
  assert.match(text, /safe feedback/i);
  assert.match(text, /mizan --share/);
  assert.match(text, /safe public launch copy/i);
  assert.match(text, /mizan --pricing/);
  assert.match(text, /mizan --summary/);
  assert.match(text, /mizan --report/);
  assert.match(text, /mizan --csv/);
  assert.match(text, /spreadsheets/i);
  assert.match(text, /mizan --report --output reports\/week\.md/);
  assert.match(text, /weekly review, cron, and launchd/i);
  assert.match(text, /mizan --check/);
  assert.match(text, /unusable setup with --doctor/);
  assert.match(text, /mizan --version/);
  assert.match(text, /MIZAN_PERSONAL_DIR/);
  assert.match(text, /MIZAN_CONFIG/);
  assert.match(text, /MIZAN_HOST/);
  assert.match(text, /MIZAN_WORK_MARKERS/);
  assert.match(text, /--window 1\|7\|30\|90\|all/);
  assert.match(text, /--support-bundle/);
});

test("parseCliArgs supports report mode", () => {
  const opts = parseCliArgs(["--report", "--json", "--window=90", "--output", "reports/week.md"]);
  assert.equal(opts.report, true);
  assert.equal(opts.json, true);
  assert.equal(opts.open, false);
  assert.equal(opts.window, "90");
  assert.equal(opts.windowDays, 90);
  assert.equal(opts.output, "reports/week.md");
});

test("parseCliArgs supports output for one-shot commands", () => {
  assert.equal(parseCliArgs(["--summary", "--output", "summary.txt"]).output, "summary.txt");
  assert.equal(parseCliArgs(["--today", "--output", "today.txt"]).output, "today.txt");
  assert.equal(parseCliArgs(["--weekly", "--output", "weekly.md"]).output, "weekly.md");
  assert.equal(parseCliArgs(["--csv", "--output", "weekly.csv"]).output, "weekly.csv");
  assert.equal(parseCliArgs(["--json", "--output", "data.json"]).output, "data.json");
  assert.equal(parseCliArgs(["--doctor", "--output", "doctor.txt"]).output, "doctor.txt");
  assert.equal(parseCliArgs(["--setup", "--output", "setup.txt"]).output, "setup.txt");
  assert.equal(parseCliArgs(["--setup-kit", "--output", "setup-kit.md"]).output, "setup-kit.md");
  assert.equal(parseCliArgs(["--try", "--output", "try.txt"]).output, "try.txt");
  assert.equal(parseCliArgs(["--pricing", "--output", "pricing.txt"]).output, "pricing.txt");
  assert.equal(parseCliArgs(["--support-bundle", "--output", "support.md"]).output, "support.md");
  assert.equal(parseCliArgs(["--feedback", "--output", "feedback.md"]).output, "feedback.md");
  assert.equal(parseCliArgs(["--share", "--output", "share.md"]).output, "share.md");
});

test("parseCliArgs supports init-config mode", () => {
  const opts = parseCliArgs(["--init-config"]);
  assert.equal(opts.initConfig, true);
  assert.equal(opts.open, false);
});

test("parseCliArgs supports version mode", () => {
  const opts = parseCliArgs(["--version"]);
  assert.equal(opts.version, true);
  assert.equal(opts.open, false);
});

test("parseCliArgs supports setting persistent budgets", () => {
  const opts = parseCliArgs(["--set-budget", "daily=20", "monthly=250"]);
  assert.deepEqual(opts.setBudget, { daily: 20, monthly: 250 });
  assert.equal(opts.open, false);

  const clear = parseCliArgs(["--set-budget=daily=off,monthly=unset"]);
  assert.deepEqual(clear.setBudget, { daily: null, monthly: null });
});

test("parseCliArgs supports adding persistent work markers", () => {
  const opts = parseCliArgs(["--add-work-marker", "/Clients/", "/Company/"]);
  assert.deepEqual(opts.addWorkMarkers, ["/Clients/", "/Company/"]);
  assert.equal(opts.open, false);

  const inline = parseCliArgs(["--add-work-marker=/Consulting/,/Agency/"]);
  assert.deepEqual(inline.addWorkMarkers, ["/Consulting/", "/Agency/"]);
});

test("parseCliArgs supports setting persistent transcript folders", () => {
  const opts = parseCliArgs(["--set-transcripts", "personal=/vault/personal", "work=/vault/work"]);
  assert.deepEqual(opts.setTranscripts, { personal: "/vault/personal", work: "/vault/work" });
  assert.equal(opts.open, false);

  const inline = parseCliArgs(["--set-transcripts=work=/tmp/work-projects"]);
  assert.deepEqual(inline.setTranscripts, { work: "/tmp/work-projects" });
});

test("parseCliArgs rejects invalid budget assignments", () => {
  assert.throws(() => parseCliArgs(["--set-budget"]), /budget assignment/);
  assert.throws(() => parseCliArgs(["--set-budget", "weekly=20"]), /daily= or monthly=/);
  assert.throws(() => parseCliArgs(["--set-budget", "daily=0"]), /positive USD amount/);
  assert.throws(() => parseCliArgs(["--set-budget", "daily=coffee"]), /positive USD amount/);
});

test("parseCliArgs rejects missing work markers", () => {
  assert.throws(() => parseCliArgs(["--add-work-marker"]), /work marker/);
  assert.throws(() => parseCliArgs(["--add-work-marker", "   "]), /work marker/);
});

test("parseCliArgs rejects invalid transcript assignments", () => {
  assert.throws(() => parseCliArgs(["--set-transcripts"]), /transcript assignment/);
  assert.throws(() => parseCliArgs(["--set-transcripts", "team=/tmp/work"]), /personal= or work=/);
  assert.throws(() => parseCliArgs(["--set-transcripts", "personal="]), /transcript path/);
});

test("parseCliArgs rejects missing output paths", () => {
  assert.throws(() => parseCliArgs(["--report", "--output"]), /output path/);
  assert.throws(() => parseCliArgs(["--report", "--output", ""]), /output path/);
});

test("parseCliArgs rejects output without a one-shot output mode", () => {
  assert.throws(() => parseCliArgs(["--output", "ignored.md"]), /--output requires/);
  assert.throws(() => parseCliArgs(["--demo", "--output", "ignored.md"]), /--output requires/);
  assert.throws(() => parseCliArgs(["--set-budget", "daily=20", "--output", "ignored.md"]), /--output requires/);
});
