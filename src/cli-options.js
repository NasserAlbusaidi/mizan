export const WINDOW_DAYS = Object.freeze({ "1": 1, "7": 7, "30": 30, "90": 90, all: null });
const DEFAULT_HOST = "127.0.0.1";

export function parseCliArgs(argv, defaults = {}) {
  const options = {
    help: false,
    version: false,
    tryDemo: false,
    demo: false,
    setup: false,
    fix: false,
    doctor: false,
    setupKit: false,
    pricing: false,
    initConfig: false,
    setBudget: null,
    addWorkMarkers: null,
    setTranscripts: null,
    supportBundle: false,
    feedback: false,
    share: false,
    updateCheck: false,
    summary: false,
    report: false,
    csv: false,
    check: false,
    json: false,
    output: null,
    open: true,
    warm: true,
    port: defaults.port || 7777,
    host: defaults.host || DEFAULT_HOST,
    window: "30",
    windowDays: WINDOW_DAYS["30"],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }
    if (arg === "--version") {
      options.version = true;
      options.open = false;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      options.open = false;
      continue;
    }
    if (arg === "--today") {
      options.summary = true;
      options.window = "1";
      options.windowDays = WINDOW_DAYS["1"];
      options.open = false;
      continue;
    }
    if (arg === "--weekly") {
      options.report = true;
      options.window = "7";
      options.windowDays = WINDOW_DAYS["7"];
      options.open = false;
      continue;
    }
    if (arg === "--try") {
      options.tryDemo = true;
      options.demo = true;
      options.window = "7";
      options.windowDays = WINDOW_DAYS["7"];
      options.open = false;
      continue;
    }
    if (arg === "--output" || arg.startsWith("--output=")) {
      const value = arg.includes("=") ? arg.slice("--output=".length) : argv[++i];
      options.output = parseOutputPath(value);
      options.open = false;
      continue;
    }
    if (arg === "--demo") {
      options.demo = true;
      continue;
    }
    if (arg === "--setup") {
      options.setup = true;
      options.open = false;
      continue;
    }
    if (arg === "--fix") {
      options.fix = true;
      options.open = false;
      continue;
    }
    if (arg === "--doctor") {
      options.doctor = true;
      options.open = false;
      continue;
    }
    if (arg === "--setup-kit") {
      options.setupKit = true;
      options.open = false;
      continue;
    }
    if (arg === "--pricing") {
      options.pricing = true;
      options.open = false;
      continue;
    }
    if (arg === "--init-config") {
      options.initConfig = true;
      options.open = false;
      continue;
    }
    if (arg === "--set-budget" || arg.startsWith("--set-budget=")) {
      const inline = arg.includes("=") ? arg.slice("--set-budget=".length) : null;
      const values = inline ? [inline] : [];
      if (!inline) {
        while (argv[i + 1] && !argv[i + 1].startsWith("--")) {
          values.push(argv[++i]);
        }
      }
      options.setBudget = parseBudgetAssignments(values);
      options.open = false;
      continue;
    }
    if (arg === "--add-work-marker" || arg.startsWith("--add-work-marker=")) {
      const inline = arg.includes("=") ? arg.slice("--add-work-marker=".length) : null;
      const values = inline ? [inline] : [];
      if (!inline) {
        while (argv[i + 1] && !argv[i + 1].startsWith("--")) {
          values.push(argv[++i]);
        }
      }
      options.addWorkMarkers = parseWorkMarkers(values);
      options.open = false;
      continue;
    }
    if (arg === "--set-transcripts" || arg.startsWith("--set-transcripts=")) {
      const inline = arg.includes("=") ? arg.slice("--set-transcripts=".length) : null;
      const values = inline ? [inline] : [];
      if (!inline) {
        while (argv[i + 1] && !argv[i + 1].startsWith("--")) {
          values.push(argv[++i]);
        }
      }
      options.setTranscripts = parseTranscriptAssignments(values);
      options.open = false;
      continue;
    }
    if (arg === "--support-bundle") {
      options.supportBundle = true;
      options.open = false;
      continue;
    }
    if (arg === "--feedback") {
      options.feedback = true;
      options.open = false;
      continue;
    }
    if (arg === "--share") {
      options.share = true;
      options.open = false;
      continue;
    }
    if (arg === "--update-check") {
      options.updateCheck = true;
      options.open = false;
      continue;
    }
    if (arg === "--summary") {
      options.summary = true;
      options.open = false;
      continue;
    }
    if (arg === "--report") {
      options.report = true;
      options.open = false;
      continue;
    }
    if (arg === "--csv") {
      options.csv = true;
      options.open = false;
      continue;
    }
    if (arg === "--check") {
      options.check = true;
      options.summary = true;
      options.open = false;
      continue;
    }
    if (arg === "--no-open") {
      options.open = false;
      continue;
    }
    if (arg === "--no-warm") {
      options.warm = false;
      continue;
    }
    if (arg === "--port" || arg.startsWith("--port=")) {
      const value = arg.includes("=") ? arg.split("=")[1] : argv[++i];
      options.port = parsePort(value);
      continue;
    }
    if (arg === "--host" || arg.startsWith("--host=")) {
      const value = arg.includes("=") ? arg.split("=")[1] : argv[++i];
      options.host = parseHost(value);
      continue;
    }
    if (arg === "--window" || arg.startsWith("--window=")) {
      const value = arg.includes("=") ? arg.split("=")[1] : argv[++i];
      if (!(value in WINDOW_DAYS)) {
        throw new Error(`Invalid window "${value}". Use one of: ${Object.keys(WINDOW_DAYS).join(", ")}`);
      }
      options.window = value;
      options.windowDays = WINDOW_DAYS[value];
      continue;
    }
    throw new Error(`Unknown option "${arg}". Run mizan --help for usage.`);
  }

  validateOptions(options);
  return options;
}

function validateOptions(options) {
  if (options.fix && !options.doctor && !options.setup) {
    throw new Error("--fix requires --doctor or --setup.");
  }
  if (!options.output) return;
  const writesOneShotOutput =
    options.doctor ||
    options.setup ||
    options.setupKit ||
    options.tryDemo ||
    options.pricing ||
    options.supportBundle ||
    options.feedback ||
    options.share ||
    options.updateCheck ||
    options.report ||
    options.csv ||
    options.summary ||
    options.check ||
    options.json;
  if (!writesOneShotOutput) {
    throw new Error(
      "--output requires a one-shot output mode: --report, --csv, --summary, --today, --weekly, --json, --try, --setup, --doctor, --setup-kit, --pricing, --support-bundle, --feedback, or --share.",
    );
  }
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port "${value}". Use an integer from 1 to 65535.`);
  }
  return port;
}

function parseHost(value) {
  const host = String(value || "").trim();
  if (!host || host.length > 255 || /[\s/\\]/.test(host)) {
    throw new Error(`Invalid host "${value}". Use a hostname or IP address, e.g. 127.0.0.1.`);
  }
  return host;
}

function parseOutputPath(value) {
  const output = String(value || "").trim();
  if (!output) {
    throw new Error("Missing output path. Use --output reports/week.md.");
  }
  return output;
}

function parseBudgetAssignments(values) {
  const parts = values.flatMap((value) =>
    String(value || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
  if (!parts.length) {
    throw new Error("Missing budget assignment. Use daily=20 and/or monthly=250.");
  }

  const result = {};
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) {
      throw new Error(`Invalid budget assignment "${part}". Use daily= or monthly=.`);
    }
    const key = part.slice(0, eq).trim();
    const raw = part.slice(eq + 1).trim();
    if (key !== "daily" && key !== "monthly") {
      throw new Error(`Invalid budget key "${key}". Use daily= or monthly=.`);
    }
    if (["off", "unset", "none", "null"].includes(raw.toLowerCase())) {
      result[key] = null;
      continue;
    }
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`${key} budget must be a positive USD amount; received "${raw}".`);
    }
    result[key] = amount;
  }
  return result;
}

function parseWorkMarkers(values) {
  const markers = values
    .flatMap((value) =>
      String(value || "")
        .split(",")
        .map((part) => part.trim()),
    )
    .filter(Boolean);
  if (!markers.length) {
    throw new Error("Missing work marker. Use --add-work-marker /Clients/ or /Company/.");
  }
  return [...new Set(markers)];
}

function parseTranscriptAssignments(values) {
  const parts = values.flatMap((value) =>
    String(value || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
  if (!parts.length) {
    throw new Error("Missing transcript assignment. Use personal=/path, work=/path, and/or codex=/path.");
  }

  const result = {};
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) {
      throw new Error(`Invalid transcript assignment "${part}". Use personal=, work=, or codex=.`);
    }
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key !== "personal" && key !== "work" && key !== "codex") {
      throw new Error(`Invalid transcript key "${key}". Use personal=, work=, or codex=.`);
    }
    if (!value) {
      throw new Error(`${key} transcript path cannot be empty.`);
    }
    result[key] = value;
  }
  return result;
}

export function helpText(defaultPort = 7777) {
  return `Mizan - local Claude Code spend and leak dashboard

First minute:
  mizan --try                   Try Mizan in the terminal with demo data
  mizan --demo                  Preview the dashboard with sample data
  mizan --setup                 Check transcript folders and config
  mizan --today                 Print today's spend summary
  mizan --weekly                Print a redacted 7-day Markdown report
  mizan                         Open the local dashboard

Usage:
  mizan                         Start the dashboard on port ${defaultPort}
  mizan --no-open               Start the dashboard without opening a browser
  mizan --port 7788             Start on a different port
  mizan --host 0.0.0.0          Intentionally expose the dashboard on your network
  mizan --today                 Print today's spend summary
  mizan --weekly                Print a redacted 7-day Markdown report
  mizan --summary --window 1    Print today's spend summary
  mizan --json --window 7       Print the computed payload and exit
  mizan --csv --window 7        Print a redacted reimbursement CSV and exit
  mizan --try                   Run the first-minute demo summary and next steps
  mizan --demo                  Run with realistic sample data
  mizan --setup                 Create config if needed, diagnose setup, and exit
  mizan --setup --fix           Save discovered transcript folders during setup
  mizan --doctor                Check transcript folders and setup
  mizan --doctor --check        Exit nonzero when transcript setup is unusable
  mizan --doctor --fix          Save discovered transcript folders, then re-check
  mizan --setup-kit             Print weekly review, cron, and launchd commands
  mizan --init-config           Create ~/.mizan/config.json template and exit
  mizan --set-budget daily=20 monthly=250
  mizan --add-work-marker /Clients/
  mizan --set-transcripts personal=~/.claude/projects work=~/.claude-work/projects codex=~/.codex/sessions
  mizan --support-bundle        Print a redacted Markdown support bundle
  mizan --feedback              Print safe feedback and issue-reporting steps
  mizan --share                 Print safe public launch copy
  mizan --update-check          Check the latest GitHub release and install command
  mizan --pricing               Print pricing assumptions and exit
  mizan --summary               Print a compact spend/leak summary and exit
  mizan --report                Print a redacted Markdown spend report and exit
  mizan --csv                   Print redacted account/project/session CSV and exit
  mizan --check                 Print summary and exit nonzero on leaks or exceeded budgets
  mizan --report --output reports/week.md
  mizan --version               Print package version and exit

Options:
  --window 1|7|30|90|all        Time window for dashboard warm-up or JSON output
  --today                       Shortcut for --summary --window 1
  --weekly                      Shortcut for --report --window 7
  --try                         Print a demo summary and the next setup commands
  --demo                        Use anonymized sample data instead of transcripts
  --setup                       Create config if needed, then run setup diagnostics
  --doctor                      Print setup diagnostics and exit
  --fix                         Save discovered transcript folders with --doctor/--setup
  --setup-kit                   Print a local weekly-review setup kit and exit
  --init-config                 Write a config template if one does not exist
  --set-budget daily=N monthly=N
                                Save persistent USD budgets; use off/unset to clear
  --add-work-marker <fragment>  Append a path fragment that should count as work
  --set-transcripts personal=PATH work=PATH codex=PATH
                                Save persistent Claude/Codex transcript directories
  --support-bundle              Print redacted setup diagnostics for issues
  --feedback                    Print safe feedback steps and GitHub issue link
  --share                       Print safe public launch copy and install commands
  --update-check                Check the latest GitHub release and install command
  --pricing                     Print model pricing assumptions and exit
  --summary                     Print compact summary and exit
  --report                      Print redacted Markdown report; combine with --json for structured output
  --csv                         Print redacted account/project/session rows for spreadsheets
  --check                       Exit 2 on leaks/budgets, or unusable setup with --doctor
  --output <file>               Save one-shot output from report/csv/summary/today/weekly/json/try/setup/doctor/setup-kit/pricing/support/feedback/share/update-check
  --version                     Print package version and exit
  --no-warm                     Skip the startup cache warm-up
  --no-open                     Do not open the browser automatically
  --json                        Output JSON once, then exit
  --port <number>               HTTP port (default: ${defaultPort}, env: MIZAN_PORT)
  --host <host>                 Bind host (default: 127.0.0.1, env: MIZAN_HOST)
  -h, --help                    Show this help

Environment:
  MIZAN_PORT                    Default server port
  MIZAN_HOST                    Bind host; defaults to 127.0.0.1 for local-only access
  MIZAN_PERSONAL_DIR            Personal transcript projects directory
  MIZAN_WORK_DIR                Work transcript projects directory
  MIZAN_CODEX_DIR               Codex sessions directory
  MIZAN_CONFIG                  Config file path (default: ~/.mizan/config.json)
  MIZAN_WORK_MARKERS            Comma-separated path fragments that count as work projects
`;
}
