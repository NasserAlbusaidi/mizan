# Mizan (ميزان)

[![CI](https://github.com/NasserAlbusaidi/mizan/actions/workflows/ci.yml/badge.svg)](https://github.com/NasserAlbusaidi/mizan/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/NasserAlbusaidi/mizan?label=release)](https://github.com/NasserAlbusaidi/mizan/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Local usage dashboard for Claude Code and Codex — and the only one that
catches usage leaking to the wrong account.**

Mizan turns the JSONL transcripts already on your machine into a private
dashboard: daily usage by account, burn rate, projected monthly, top projects,
model mix, cache efficiency — and the mistake that actually hurts: work quota
paying for personal projects, or the other way around.

Zero runtime dependencies. No accounts. No upload. Local-only by default.
Node >= 20.

![Mizan dashboard: cross-account leak detected](assets/mizan-dashboard-demo.png)

**What the dollars mean:** Mizan values usage at Anthropic API list prices.
On pay-as-you-go API billing that approximates your bill; on a Max/Pro
subscription it is the value of the quota you used, not cash out the door.
The dashboard labels it that way — authoritative billing is always the
provider's console.

## Who it's for

Mizan is for AI coding users who want a local answer to three practical
questions:

- "How much did this actually cost me this week?"
- "Which projects and models are driving it?"
- "Did I accidentally spend the wrong account's quota on the wrong project?"

It is especially useful if you split personal and work usage across separate
Claude configs, also use Codex, run long-lived panes, or need a redacted weekly
usage note for a client, employer, or reimbursement log.

## Why not just ccusage?

[ccusage](https://ccusage.com) is great at what it does: a fast CLI that tells
you what Claude Code cost. Mizan answers a different question — not "what did
I use?" but "did the right account pay for it?" If you split personal and work
across separate Claude configs, a forgotten pane can quietly burn the wrong
account's quota for hours; that exact mistake once cost ~$978 of work quota
(valued at API rates) here, and it's why Mizan exists. Mizan adds a local web
dashboard, per-session cross-account leak detection, current-generation Opus
pricing, and Codex alongside Claude — all local-only, no upload. If you just
want a usage number in your terminal, ccusage is lighter. If you've ever
wondered whether the wrong account paid for the wrong project, that's the gap
Mizan fills.

## Try it in 30 seconds

```bash
npx @nasseralbusaidi/mizan --demo      # preview the dashboard, no transcripts read
npx @nasseralbusaidi/mizan --setup     # check it can see your usage
npx @nasseralbusaidi/mizan             # open your real dashboard on :7777
```

Prefer the terminal? `npx @nasseralbusaidi/mizan --try` prints a demo summary
and exits — the fastest way to decide if it's worth installing. Install for
good with `npm install -g @nasseralbusaidi/mizan`.

> The npm listing is pending; until it appears, the release-tarball installs
> below work today and are identical bits.

If the dashboard starts with zero records, preview the product with
`mizan --demo`, diagnose folders with `mizan --setup`, or save custom transcript
folders with `mizan --set-transcripts personal=/path work=/path codex=/path`.

<details>
<summary>Install without npm registry access (tarball, installer script, source)</summary>

Run the demo straight from a GitHub release tarball:

```bash
npm exec --yes --package https://github.com/NasserAlbusaidi/mizan/releases/download/v0.2.0/nasseralbusaidi-mizan-0.2.0.tgz -- mizan --try
```

Install the current GitHub release from its versioned tarball:

```bash
MIZAN_INSTALL_VERSION=0.2.0 bash -c "$(curl -fsSL https://raw.githubusercontent.com/NasserAlbusaidi/mizan/v0.2.0/scripts/install.sh)"
```

Or with npm directly:

```bash
npm install -g https://github.com/NasserAlbusaidi/mizan/releases/download/v0.2.0/nasseralbusaidi-mizan-0.2.0.tgz
```

GitHub tag fallback:

```bash
npm install -g github:NasserAlbusaidi/mizan#v0.2.0
```

From source:

```bash
git clone https://github.com/NasserAlbusaidi/mizan.git
cd mizan
node bin/mizan.js --setup
npm start
```

Check whether your installed copy matches the latest release:

```bash
mizan --update-check
```

</details>

## First run

`mizan --setup` creates `~/.mizan/config.json` when it is missing, prints the
same diagnostics as `mizan --doctor`, and exits with code `2` when no parseable
Claude usage or Codex token records are found. The diagnostics also show whether
the `claude` command is available on `PATH`.
When setup cannot find transcripts yet, it points to the sample report artifact:

```bash
mizan --weekly --demo --output "$HOME/Documents/Mizan/mizan-demo-weekly.md"
```

If this is the first time you have used Claude Code on the machine, run:

```bash
claude
```

Run Claude Code or Codex once, then recheck with `mizan --setup --fix`.

Check without writing config:

```bash
mizan --doctor
```

From an existing local checkout:

```bash
npm start
```

First run parses every transcript; after that it is incremental. Mizan warms a
small cache, starts `http://127.0.0.1:7777`, opens the browser, and refreshes the
dashboard every 15 seconds.

If the dashboard is empty or the account split looks wrong, save the transcript
folders once:

```bash
mizan --set-transcripts \
  personal="$HOME/.claude/projects" \
  work="$HOME/.claude-work/projects" \
  codex="$HOME/.codex/sessions"
```

If your work repos live somewhere else, add a marker that appears in their paths:

```bash
mizan --add-work-marker /Clients/
```

## CLI

```bash
mizan --no-open
mizan --port 7788
mizan --host 0.0.0.0
mizan --try
mizan --today
mizan --weekly
mizan --summary --window 1
mizan --json --window 7
mizan --csv --window 7
mizan --demo
mizan --setup
mizan --setup --fix
mizan --doctor
mizan --doctor --check
mizan --doctor --fix
mizan --setup-kit
mizan --init-config
mizan --set-budget daily=20 monthly=250
mizan --add-work-marker /Clients/
mizan --set-transcripts personal="$HOME/.claude/projects" work="$HOME/.claude-work/projects" codex="$HOME/.codex/sessions"
mizan --support-bundle
mizan --feedback
mizan --share
mizan --update-check
mizan --pricing
mizan --summary
mizan --report
mizan --check
mizan --version
mizan --help
```

`mizan --try` prints a demo spend summary, a no-global sample report command,
current GitHub install command, versioned tarball fallback, and next setup
commands without opening a browser or reading local transcripts. It is the
fastest way to decide whether Mizan is worth installing. The demo intentionally
includes leaks, but `--try` labels them as sample findings. Strict check
commands such as `mizan --check --demo` still exit nonzero when leaks are
present.

`mizan --weekly` prints the same redacted 7-day Markdown report as
`mizan --report --window 7`. It is the shortest command for a recurring review
or reimbursement note. Demo reports include next steps for installing Mizan,
checking real transcript setup, and saving the first real weekly report.

`mizan --csv` prints a redacted account/project/session CSV for reimbursement
spreadsheets, client notes, or internal usage logs. It uses the same window
selection as reports, so `mizan --csv --window 7` matches the weekly report
window.

`mizan --setup` is the one-command first run. It creates the local config if
needed, prints setup diagnostics, and exits with code `2` when Mizan still
cannot see any parseable Claude usage or Codex token records. When setup is
usable, it prints the copyable saved-report command:

```bash
mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly-$(date +%F).md"
```

`mizan --doctor` is the first thing to run when the dashboard looks empty. It
prints the transcript folders Mizan can see, how many `.jsonl` files and
parseable usage records were found, whether the `claude` command is available,
the cache path, bind host, work markers, and the next setup step. If a saved or
environment-provided transcript path is wrong, it checks the common Claude Code
and Codex defaults and suggests a copyable
`mizan --set-transcripts ...` command when it finds parseable usage there.
For one-account users, one transcript folder is enough; the second account is
optional unless you split personal and work Claude configs.
Use `mizan --doctor --check` in scripts when setup should fail with exit code
`2` unless at least one transcript folder has parseable usage records.
If `mizan --doctor` finds parseable usage records in common default folders
while your saved paths are wrong, run `mizan --doctor --fix` to save those
folders and re-run diagnostics in one step.
You can use the same repair during first-run setup with `mizan --setup --fix`.

`mizan --setup-kit` prints a copyable weekly review setup kit: first-run checks,
report commands, cron, launchd, and privacy reminders. Use
`mizan --setup-kit --output "$HOME/Documents/Mizan/setup-kit.md"` if you want to
save it beside generated reports.

`mizan --init-config` creates `~/.mizan/config.json` with editable defaults.

`mizan --set-budget daily=20 monthly=250` creates or updates the persistent
config with spend limits for the dashboard action queue and `mizan --check`.
Use `daily=off` or `monthly=unset` to clear a saved budget.

`mizan --add-work-marker /Clients/` appends path fragments that should count as
work projects for leak detection. This is the command to run when your work
repos live outside the default `/Desktop/Work/` or `/Work-stuff/` paths.

`mizan --set-transcripts personal=... work=... codex=...` persists the transcript
folders Mizan scans, so you do not have to keep exporting `MIZAN_PERSONAL_DIR`,
`MIZAN_WORK_DIR`, or `MIZAN_CODEX_DIR`.

`mizan --support-bundle` prints a redacted support bundle with version, runtime,
and setup diagnostics. It is the safest thing to paste into an issue when setup
looks wrong.

`mizan --feedback` prints the GitHub issue link, the redacted support-bundle
command, and a privacy checklist for safe bug reports or adoption feedback.

`mizan --share` prints safe public launch copy with the current GitHub-tag demo
and install commands. It does not scan transcripts or start the dashboard.

`mizan --update-check` asks the latest GitHub release endpoint whether your
installed version is current. If an update is available, it prints the exact
versioned release tarball install command and the GitHub tag fallback. If the
release check is unavailable, it exits cleanly and points to the latest release
page instead of blocking local use.

`mizan --pricing` prints the static pricing table Mizan uses for estimates.

`mizan --summary` prints a compact terminal report for the selected window.
`mizan --report` prints a redacted Markdown report for weekly reviews, cron
logs, or copy/pasting into a note without exposing absolute local paths.
For finite windows, both commands compare spend and request count against the
previous matching window. Markdown reports also list project-level spend movers,
so a 7-day report shows which projects changed since the prior 7 days.
When cross-account leaks are found, summaries and reports call out the
reviewable wrong-account spend as a plain dollar amount.
`mizan --check` prints the same report and exits with code `2` when Mizan finds
cross-account leaks or spend that exceeds configured budgets.
If a summary finds zero usage records, Mizan reports `WARN` and points you to
`mizan --doctor`, `mizan --demo`, and `mizan --set-transcripts` rather than
pretending an empty setup is clean.

Examples:

```bash
mizan --today
mizan --weekly
mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly.md"
mizan --csv --window 7 --output "$HOME/Documents/Mizan/mizan-weekly.csv"
mizan --summary --window 1
mizan --summary --window 7
mizan --report --window 7
mizan --report --window 7 --output "$HOME/Documents/Mizan/mizan-weekly.md"
mizan --report --json --window 30
mizan --report --check --window 7
mizan --setup
mizan --set-budget daily=20 monthly=250
mizan --add-work-marker /Clients/
mizan --set-transcripts personal="$HOME/.claude/projects" work="$HOME/.claude-work/projects"
mizan --support-bundle --output "$HOME/Documents/Mizan/support-bundle.md"
mizan --feedback
mizan --update-check
mizan --setup-kit --output "$HOME/Documents/Mizan/setup-kit.md"
mizan --doctor --check
MIZAN_DAILY_BUDGET=20 MIZAN_MONTHLY_BUDGET=250 mizan --check
mizan --check --json --window 30
```

Use `--report --check` in scheduled jobs when you want a Markdown report in the
logs and a failing exit code whenever leaks or budget overruns need attention.
Add `--output path/to/report.md` to save one-shot output from `--report`,
`--csv`, `--summary`, `--today`, `--weekly`, `--json`, `--setup`, `--doctor`,
`--setup-kit`, `--pricing`, `--support-bundle`, `--feedback`, `--share`, or
`--update-check` without shell redirection; parent directories are created
automatically.

For recurring reviews, automation examples, and reimbursement note templates,
see the [Setup Kit](docs/SETUP_KIT.md). For demo flow and public post copy, see
the [Launch Kit](docs/LAUNCH_KIT.md).

## What it shows

- **Action queue** — leaks, spend jumps, budgets, and setup commands worth
  checking before reading charts.
- **Weekly review command** — copy `mizan --weekly` from the action queue for
  redacted recurring notes.
- **Copy or save report** — one-click redacted Markdown from the dashboard for
  notes, status updates, or reimbursements.
- **Save CSV / CSV export** — redacted account, project, and costliest-session
  rows from the dashboard or CLI for spreadsheets and internal/client usage
  logs.
- **Headline KPIs** — usage value in window (at API list price, labeled as
  such), previous-window trend, today, 7-day burn rate, projected monthly,
  request count.
- **Project changes** — top projects that drove spend up versus the previous
  matching window, shown directly in the dashboard.
- **Account split** — personal vs work, the thing that moves the bill.
- **Daily spend** — stacked area by account.
- **Leak detection** — sessions billed to one account whose project belongs to
  the other. This is the thing that silently burned ~$978 of work quota (valued
  at API rates) when a forgotten pane ran a personal project on work
  credentials for 14 hours. It also catches the reverse: personal quota spent
  on `~/Desktop/Work/` projects. Summaries and reports show the reviewable
  wrong-account quota value as a dollar amount, labeled as an API-rate
  estimate.
- **Model mix**, **top projects**, **cache efficiency**, and costliest sessions.
- **Redacted Markdown reports** — copyable weekly spend snapshots that omit full
  home paths while preserving the useful project/account breakdown,
  account split, costliest sessions, project-level movers, and previous-window
  comparison.

## Privacy Model

Mizan serves a local dashboard and reads these folders by default:

| Account | Default folder |
|---|---|
| Personal | `~/.claude/projects` |
| Work | `~/.claude-work/projects` |

If `CLAUDE_CONFIG_DIR` is set, Mizan treats `${CLAUDE_CONFIG_DIR}/projects` as
the personal transcript folder unless `MIZAN_PERSONAL_DIR` is set.

The persistent files Mizan writes live under `~/.mizan/`:

- `config.json` when you run setup commands such as `--setup`, `--set-budget`,
  `--add-work-marker`, `--set-transcripts`, or `--init-config`
- `cache.json`, the incremental parse cache

The dashboard binds to `127.0.0.1` by default, so the browser talks to a
local-only server. Use `mizan --host 0.0.0.0` or `MIZAN_HOST=0.0.0.0` only when
you intentionally want LAN access on a trusted network.

## Support

When reporting an issue, run `mizan --feedback` first. It prints the GitHub issue
link, the redacted support-bundle command, and the privacy checklist. Include
`mizan --version`, your OS, Node version, install method, the command you ran,
what you expected, and what happened.

For setup problems, run `mizan --support-bundle` to generate a redacted support
bundle without raw transcripts or full home paths.

See [SUPPORT.md](SUPPORT.md), [SECURITY.md](SECURITY.md), and
[CONTRIBUTING.md](CONTRIBUTING.md) before opening public issues or patches.

## Pricing — read this

This tool uses Anthropic Claude API public per-MTok pricing checked on
2026-06-25:

| Model | Input | Output |
|---|---|---|
| Fable 5 | $10 | $50 |
| Mythos 5 | $10 | $50 |
| Opus 4.5–4.8 | **$5** | **$25** |
| Opus 4.1 / 4.0 | $15 | $75 |
| Sonnet 4.6 | $3 | $15 |
| Haiku 4.5 | $1 | $5 |
| Haiku 3.5 | $0.80 | $4 |

Cache tiers are derived: read = 0.1× input, write-5m = 1.25×, write-1h = 2×.
Mizan uses standard global Claude API rates and does not apply fast mode, batch,
partner cloud, or data residency multipliers.
Unmatched non-synthetic models are priced at `$0` and shown as unpriced warnings
in the dashboard, summary, and report so totals are not trusted silently.

> ⚠️ Many older usage scripts hardcode every Opus request at **$15/$75**. That
> is correct for retired Opus 4.0/4.1 records, but Opus 4.5+ is **3× cheaper**
> at **$5/$25** — a 3× overcount on current usage. Mizan separates those
> generations so old history is not undercounted and current Opus usage is not
> overstated.
>
> All dollar figures are valuations at API list price. On pay-as-you-go API
> billing that approximates your bill; on a Max/Pro subscription it is quota
> value, not cash. Authoritative billing is always the provider billing
> console. Codex rows are token-only until a reliable local cost source is
> available.

Pricing source: https://docs.anthropic.com/en/docs/about-claude/pricing
Claude Code cost model: https://docs.anthropic.com/en/docs/claude-code/costs

## Configuration

Create a persistent config template:

```bash
mizan --init-config
```

Mizan reads `~/.mizan/config.json` by default. Environment variables still win,
so one-off shell overrides remain possible. Set `MIZAN_CONFIG=/path/to/config.json`
to use a different file.

Config file shape:

```json
{
  "personalDir": "/Users/you/.claude/projects",
  "workDir": "/Users/you/.claude-work/projects",
  "workMarkers": ["/Desktop/Work/", "/Work-stuff/"],
  "dailyBudget": null,
  "monthlyBudget": null,
  "port": 7777,
  "host": "127.0.0.1"
}
```

| Env var | Default | Purpose |
|---|---|---|
| `MIZAN_PORT` | `7777` | Server port |
| `MIZAN_HOST` | `127.0.0.1` | Server bind host; use `0.0.0.0` only for intentional LAN access |
| `MIZAN_CONFIG` | `~/.mizan/config.json` | Config file path |
| `MIZAN_PERSONAL_DIR` | `~/.claude/projects` or `${CLAUDE_CONFIG_DIR}/projects` | Personal transcript projects directory |
| `MIZAN_WORK_DIR` | `~/.claude-work/projects` | Work transcript projects directory |
| `MIZAN_WORK_MARKERS` | `/Desktop/Work/,/Work-stuff/` | Path fragments that mark a project as "work" (drives leak direction) |
| `MIZAN_DAILY_BUDGET` | unset | Optional daily spend budget in USD |
| `MIZAN_MONTHLY_BUDGET` | unset | Optional projected monthly spend budget in USD |

If your work checkout lives somewhere else:

```bash
mizan --add-work-marker /Clients/
```

For one-off shell overrides:

```bash
MIZAN_WORK_MARKERS="/Clients/,/Company/" mizan
```

If you want the action queue to warn against your own limits:

```bash
mizan --set-budget daily=20 monthly=250
```

For one-off budget overrides:

```bash
MIZAN_DAILY_BUDGET=20 MIZAN_MONTHLY_BUDGET=250 mizan
```

If your transcripts live somewhere else:

```bash
mizan --set-transcripts \
  personal="$HOME/.claude/projects" \
  work="$HOME/.config/claude-work/projects"
```

For one-off transcript overrides:

```bash
MIZAN_PERSONAL_DIR="$HOME/.claude/projects" \
MIZAN_WORK_DIR="$HOME/.config/claude-work/projects" \
mizan
```

## Smoke Test

From a checkout, run:

```bash
npm run smoke
```

That checks setup diagnostics and verifies the demo JSON path without opening a
browser.

Before publishing, run:

```bash
npm run release:check
```

`npm run install:check` also verifies the packed tarball in a temporary clean
npm project, which catches broken `bin` or missing packaged files before publish.

## How it's verified

- **Pricing** is table-driven and unit-tested (clean / partial / zero / unknown cases).
- **Extraction & dedup** were differential-tested against an independent Python
  reimplementation: time-bounded to exclude the live session, both accounts match to the
  digit on request count, input, cache-creation, and cache-read tokens.
- `npm test` runs the full suite.

## Layout

```
bin/mizan.js        entry — warm cache, start server, open browser
src/config.js       paths, account model, project classification
src/doctor.js       setup diagnostics for transcript folders and work markers
src/pricing.js      cost computation, pricing metadata, pricing CLI report
src/summary.js      terminal summary/check report model
src/report.js       redacted Markdown/JSON report model
src/support-bundle.js redacted support diagnostics
src/feedback.js     safe issue-reporting guide
src/parser.js       one transcript line -> usage record
src/scanner.js      walk dirs + incremental mtime cache
src/cache.js        ~/.mizan/cache.json
src/aggregate.js    rollups + burn + cache efficiency + leaks
src/leaks.js        cross-account leak classification
src/engine.js       scan -> aggregate, with a short memo
src/server.js       zero-dep HTTP + JSON API
public/             dashboard (index.html, styles.css, app.js, charts.js)
test/               pricing + aggregate/leak tests
```
