# Mizan CLI Reference

Quick reference lives in the [README flags table](../README.md#cli). This page
is the per-flag detail. `mizan --help` prints the same surface from the
installed version.

## First minute

### `--try`

Prints a demo spend summary plus copyable next-step commands (sample report,
demo dashboard, install commands, setup) without opening a browser or reading
local transcripts. The demo intentionally includes leaks, labeled as sample
findings. Strict check commands such as `mizan --check --demo` still exit
nonzero when leaks are present.

### `--demo`

Runs any mode with anonymized sample data instead of local transcripts.
Combine with the dashboard (`mizan --demo`), reports (`mizan --weekly --demo`),
or checks.

### `--setup`

The one-command first run. Creates `~/.mizan/config.json` when missing, prints
the same diagnostics as `--doctor`, and exits with code `2` when no parseable
Claude usage records are found. When setup is usable, it prints a copyable
saved-report command. Add `--fix` to save discovered transcript folders in the
same step.

### `--doctor`

Prints setup diagnostics without writing config: the transcript folders Mizan
can see, `.jsonl` file and record counts, whether the `claude` command is on
`PATH`, cache path, bind host, work markers, and the next setup step. If saved
or environment-provided paths are wrong, it checks common Claude Code defaults
and suggests a copyable `mizan --set-transcripts ...` command.

- `--doctor --check` exits with code `2` unless at least one transcript folder
  has parseable usage records — useful in scripts.
- `--doctor --fix` saves the discovered folders and re-runs diagnostics.

### `--fix`

Only valid with `--setup` or `--doctor`; saves discovered transcript folders.

## Reports

### `--today`

Shortcut for `--summary --window 1`.

### `--weekly`

Shortcut for `--report --window 7`: the redacted 7-day Markdown report, the
shortest command for a recurring review or reimbursement note.

### `--summary`

Compact terminal report for the selected window. For finite windows it compares
spend and request count against the previous matching window. Zero usage
records produce a `WARN` pointing to `--doctor`, `--demo`, and
`--set-transcripts` rather than pretending an empty setup is clean.

### `--report`

Redacted Markdown report for weekly reviews, cron logs, or pasting into notes
without exposing absolute local paths. Includes project-level spend movers
versus the previous window. Combine with `--json` for structured output.

### `--csv`

Redacted account/project/session CSV for reimbursement spreadsheets or usage
logs. Uses the same `--window` selection as reports.

### `--check`

Prints the summary (or combines with `--report`/`--csv`) and exits with code
`2` when Mizan finds cross-account leaks or spend that exceeds configured
budgets. Use `--report --check` in scheduled jobs for a Markdown report in the
logs plus a failing exit code when something needs attention.

### `--json`

Prints the computed payload as JSON and exits. Also modifies `--report`,
`--summary`, `--setup`, `--doctor`, `--update-check`, and `--pricing` to emit
structured output.

### `--window 1|7|30|90|all`

Time window for reports, summaries, JSON output, and dashboard warm-up.
Default: `30`.

### `--output <file>`

Saves one-shot output from `--report`, `--csv`, `--summary`, `--today`,
`--weekly`, `--json`, `--try`, `--setup`, `--doctor`, `--setup-kit`,
`--pricing`, `--support-bundle`, `--feedback`, `--share`, or `--update-check`
without shell redirection. Parent directories are created automatically.

```bash
mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly-$(date +%F).md"
```

## Configuration commands

### `--init-config`

Creates `~/.mizan/config.json` with editable defaults if it does not exist.

### `--set-budget daily=20 monthly=250`

Creates or updates the persistent config with spend limits used by the
dashboard action queue and `mizan --check`. Use `daily=off` or `monthly=unset`
to clear a saved budget.

### `--add-work-marker /Clients/`

Appends path fragments that should count as work projects for leak detection.
Run this when work repos live outside the default `/Desktop/Work/` or
`/Work-stuff/` paths.

### `--set-transcripts personal=/path work=/path`

Persists the transcript project folders Mizan scans, replacing the need to
export `MIZAN_PERSONAL_DIR` or `MIZAN_WORK_DIR` every session.

## Support and maintenance

### `--setup-kit`

Prints a copyable weekly review setup kit: first-run checks, report commands,
cron, launchd, and privacy reminders.

### `--support-bundle`

Prints a redacted support bundle (version, runtime, setup diagnostics) — the
safest thing to paste into an issue.

### `--feedback`

Prints the GitHub issue link, the support-bundle command, and a privacy
checklist for safe bug reports.

### `--share`

Prints safe public launch copy with current demo and install commands. Does not
scan transcripts.

### `--update-check`

Asks the latest GitHub release endpoint whether your installed version is
current and prints the exact install command when an update exists. Exits
cleanly if the release check is unavailable.

### `--pricing`

Prints the static pricing table Mizan uses for estimates.

## Server flags

| Flag | Effect |
|---|---|
| `--port <n>` | HTTP port (default `7777`, env `MIZAN_PORT`) |
| `--host <host>` | Bind host (default `127.0.0.1`, env `MIZAN_HOST`); use `0.0.0.0` only for intentional LAN access |
| `--no-open` | Do not open the browser automatically |
| `--no-warm` | Skip the startup cache warm-up |
| `--version` | Print package version and exit |
| `-h`, `--help` | Show usage |

## Examples

```bash
mizan --today
mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly.md"
mizan --csv --window 7 --output "$HOME/Documents/Mizan/mizan-weekly.csv"
mizan --report --json --window 30
mizan --report --check --window 7
mizan --doctor --check
MIZAN_DAILY_BUDGET=20 MIZAN_MONTHLY_BUDGET=250 mizan --check
mizan --check --json --window 30
```

For recurring reviews, automation examples, and reimbursement note templates,
see the [Setup Kit](SETUP_KIT.md).
