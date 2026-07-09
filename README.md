# Mizan (ميزان)

[![CI](https://github.com/NasserAlbusaidi/mizan/actions/workflows/ci.yml/badge.svg)](https://github.com/NasserAlbusaidi/mizan/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/NasserAlbusaidi/mizan?label=release)](https://github.com/NasserAlbusaidi/mizan/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Local Claude Code spend dashboard with cross-account leak detection.

Mizan turns the JSONL transcripts already on your machine into a private budget
dashboard: daily spend, burn rate, top projects, model mix, cache efficiency,
and the mistake that actually hurts — work quota paying for personal projects,
or the other way around.

Zero runtime dependencies. No accounts. No upload. Local-only by default.
Node >= 20.

![Mizan dashboard demo](assets/mizan-dashboard-demo.png)

## Why Mizan?

- **Leak detection.** ccusage and claude-usage tell you *what* you spent; Mizan
  also tells you *which account paid for it* — sessions billed to work quota on
  personal projects (and the reverse), reported as a reviewable dollar amount.
- **Generation-aware pricing.** Opus 4.5+ bills at $5/$25 per MTok, Opus
  4.0/4.1 at $15/$75; Mizan prices each generation separately instead of being
  3× off on half your history.
- **Local-only, zero dependencies.** No runtime deps, binds to `127.0.0.1`,
  uploads nothing, reports redacted by default.

## Quick Start

Try it without installing (terminal demo, reads no local data):

```bash
npm exec --yes --package https://github.com/NasserAlbusaidi/mizan/releases/latest/download/mizan-latest.tgz -- mizan --try
```

Install the latest release, check setup, start the dashboard:

```bash
npm install -g https://github.com/NasserAlbusaidi/mizan/releases/latest/download/mizan-latest.tgz
mizan --setup
mizan
```

First run parses every transcript; after that it is incremental. Mizan starts
`http://127.0.0.1:7777`, opens the browser, and refreshes every 15 seconds. If
the dashboard starts empty, preview with `mizan --demo` or save folders with
`mizan --set-transcripts personal=/path work=/path`.

Pinned versions, installer script, tag fallbacks, and source installs:
[docs/INSTALL.md](docs/INSTALL.md).

## CLI

Full per-flag reference with examples: [docs/CLI.md](docs/CLI.md).

| Flag | Description |
|---|---|
| `--try` | Terminal demo summary plus next-step commands; reads no local data |
| `--demo` | Use anonymized sample data instead of local transcripts |
| `--setup` | Create config if missing, run diagnostics; exit `2` when no usage records found |
| `--doctor` | Print setup diagnostics without writing config |
| `--fix` | With `--setup`/`--doctor`: save discovered transcript folders |
| `--today` | Shortcut for `--summary --window 1` |
| `--weekly` | Shortcut for `--report --window 7` (redacted Markdown) |
| `--summary` | Compact terminal report for the selected window |
| `--report` | Redacted Markdown report with previous-window comparison |
| `--csv` | Redacted account/project/session CSV for spreadsheets |
| `--check` | Report and exit `2` on leaks or exceeded budgets (also gates `--doctor`) |
| `--json` | Print the computed payload as JSON and exit |
| `--window 1\|7\|30\|90\|all` | Time window for reports and JSON (default `30`) |
| `--output <file>` | Save one-shot output to a file; parent dirs created |
| `--set-budget daily=N monthly=N` | Save persistent USD budgets; `off`/`unset` clears |
| `--add-work-marker <fragment>` | Add a path fragment that classifies projects as work |
| `--set-transcripts personal=... work=...` | Persist the transcript folders Mizan scans |
| `--init-config` | Write a `~/.mizan/config.json` template |
| `--setup-kit` | Print a weekly-review kit: checks, reports, cron, launchd |
| `--pricing` | Print the pricing table used for estimates |
| `--support-bundle` | Print redacted diagnostics for issue reports |
| `--feedback` | Print the issue link and privacy checklist |
| `--share` | Print safe public launch copy |
| `--update-check` | Compare installed version to the latest GitHub release |
| `--port <n>` | HTTP port (default `7777`) |
| `--host <host>` | Bind host (default `127.0.0.1`) |
| `--no-open` | Do not open the browser automatically |
| `--no-warm` | Skip the startup cache warm-up |
| `--version` / `--help` | Print version / usage |

## What it shows

- **Action queue** — leaks, spend jumps, budgets, and setup commands worth
  checking before reading charts.
- **Headline KPIs** — spend in window, previous-window trend, today, 7-day burn
  rate, projected monthly spend, request count.
- **Leak detection** — sessions billed to one account whose project belongs to
  the other, in both directions, with the reviewable wrong-account spend shown
  as a dollar amount; one forgotten pane on the wrong credentials can burn
  hundreds of dollars of the wrong quota overnight.
- **Account split and daily spend** — personal vs work, stacked by day.
- **Project changes** — top projects that drove spend up versus the previous
  matching window.
- **Model mix**, **top projects**, **cache efficiency**, and costliest sessions.
- **Redacted Markdown/CSV reports** — copyable weekly snapshots that omit home
  paths while keeping the account split, project movers, and costliest sessions.

## Privacy Model

Mizan serves a local dashboard and reads these folders by default:

| Account | Default folder |
|---|---|
| Personal | `~/.claude/projects` |
| Work | `~/.claude-work/projects` |

If `CLAUDE_CONFIG_DIR` is set, Mizan treats `${CLAUDE_CONFIG_DIR}/projects` as
the personal transcript folder unless `MIZAN_PERSONAL_DIR` is set.

The persistent files Mizan writes live under `~/.mizan/`: `config.json` (from setup
commands) and `cache.json` (the incremental parse cache). The dashboard binds
to `127.0.0.1` by default; use `mizan --host 0.0.0.0` only when you
intentionally want LAN access on a trusted network.

## Pricing — read this

Mizan uses Anthropic Claude API public per-MTok pricing checked on 2026-06-25:

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
Mizan uses standard global Claude API rates without fast mode, batch, partner
cloud, or data residency multipliers. Unmatched non-synthetic models are priced
at `$0` and surfaced as unpriced warnings so totals are not trusted silently.

> Note: Opus pricing changed by 3× across generations ($15/$75 for 4.0/4.1,
> $5/$25 for 4.5+), so any tool that hardcodes a single Opus rate undercounts
> old history or overstates current usage; Mizan separates the generations.
> Authoritative billing is still console.anthropic.com — this is a local
> estimate.

Pricing source: https://docs.anthropic.com/en/docs/about-claude/pricing
Claude Code cost model: https://docs.anthropic.com/en/docs/claude-code/costs

## Configuration

Mizan reads `~/.mizan/config.json` (create it with `mizan --init-config`;
override the path with `MIZAN_CONFIG`). Environment variables win over the
config file, so one-off shell overrides remain possible.

| Env var | Default | Purpose |
|---|---|---|
| `MIZAN_PORT` | `7777` | Server port |
| `MIZAN_HOST` | `127.0.0.1` | Bind host |
| `MIZAN_CONFIG` | `~/.mizan/config.json` | Config file path |
| `MIZAN_PERSONAL_DIR` | `~/.claude/projects` or `${CLAUDE_CONFIG_DIR}/projects` | Personal transcript directory |
| `MIZAN_WORK_DIR` | `~/.claude-work/projects` | Work transcript directory |
| `MIZAN_WORK_MARKERS` | `/Desktop/Work/,/Work-stuff/` | Path fragments that mark a project as "work" |
| `MIZAN_DAILY_BUDGET` | unset | Daily USD budget |
| `MIZAN_MONTHLY_BUDGET` | unset | Projected monthly USD budget |

Prefer the persistent commands over env vars: `mizan --set-transcripts`,
`mizan --add-work-marker`, `mizan --set-budget`.

## How it's verified

- **Pricing** is table-driven and unit-tested (clean / partial / zero / unknown
  cases).
- **Extraction & dedup** were differential-tested against an independent Python
  reimplementation: time-bounded to exclude the live session, both accounts
  match to the digit on request count, input, cache-creation, and cache-read
  tokens.
- `npm test` runs the full suite in CI on Node 20 and 22.

## Support

Run `mizan --feedback` first — it prints the issue link, the redacted
support-bundle command, and a privacy checklist. See [SUPPORT.md](SUPPORT.md),
[SECURITY.md](SECURITY.md), and [CONTRIBUTING.md](CONTRIBUTING.md) before
opening public issues or patches.
