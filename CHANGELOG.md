# Changelog

## 0.1.34

- Adds `mizan --csv`, a redacted account/project/session CSV export for
  reimbursement spreadsheets, client notes, and internal usage logs.

## 0.1.33

- Adds a Markdown report `Costliest Sessions` section with redacted project,
  account, spend, duration, request count, and model so saved weekly reports
  point to the sessions worth inspecting without exposing raw session IDs.

## 0.1.32

- Adds a Markdown report `Account Split` section with personal/work spend,
  request count, and output tokens so saved weekly reports are more useful for
  reimbursement and client/internal review.

## 0.1.31

- Adds a dashboard `Save report` control that downloads the same redacted
  Markdown report as `Copy report`, giving weekly review and reimbursement
  workflows a one-click file artifact.

## 0.1.30

- Makes `mizan --doctor` suggest discovered default Claude transcript folders
  with a copyable `mizan --set-transcripts ...` command when saved paths are
  wrong but parseable usage records exist in the common locations.

## 0.1.29

- Makes setup diagnostics verify parseable Claude usage records instead of
  counting empty `.jsonl` files as usable, so `mizan --doctor --check` fails
  earlier on empty or incompatible transcript folders.

## 0.1.28

- Keeps demo mode self-contained by ignoring saved local budgets, config paths,
  and cache paths in `mizan --try` and the sample dashboard runtime metadata.

## 0.1.27

- Adds copyable next-step guidance after `--init-config`, `--set-transcripts`,
  `--add-work-marker`, and `--set-budget` so setup commands end with the
  verification or dashboard command a new user should run next.

## 0.1.26

- Restores the pinned GitHub tag as the no-global-install demo path after
  verifying that npm can reuse cached tarballs for stable latest URLs.
- Keeps `mizan-latest.tgz` as the stable install fallback only.

## 0.1.25

- Makes the stable latest tarball URL the primary no-global-install demo path in
  README, launch kit, and `mizan --share`.

## 0.1.24

- Uses a stable `releases/latest/download/mizan-latest.tgz` fallback install URL
  in README, launch kit, and `mizan --share`.
- Documents publishing a stable `mizan-latest.tgz` GitHub release asset alongside
  each versioned tarball.

## 0.1.23

- Expands `mizan --share` with ready-to-post short, long, and Show HN launch
  copy plus a "what not to claim" checklist for safe public promotion.

## 0.1.22

- Adds clearer leak guidance in summaries, Markdown reports, and the dashboard:
  switch the Claude account for real leaks, or add a work marker when the
  flagged path is legitimately work.

## 0.1.21

- Adds `mizan --weekly`, a shorter shortcut for the redacted 7-day Markdown
  report used in recurring reviews, setup-kit automation, and reimbursement
  notes.

## 0.1.20

- Adds `mizan --share`, a safe public launch guide with versioned demo and
  install commands that can be copied without scanning local transcripts.

## 0.1.19

- Refreshes the packaged dashboard screenshot so the README and launch materials
  show the current Project changes panel.

## 0.1.18

- Adds `mizan --feedback`, a safe issue-reporting guide that points users to
  the GitHub issue chooser, redacted support bundle command, and privacy
  checklist without starting the dashboard.

## 0.1.17

- Adds a dashboard Project changes panel, so spend jumps identify the projects
  that moved directly in the local UI instead of requiring a report first.

## 0.1.16

- Adds project-level spend movers to previous-window comparisons in Markdown
  reports, so spend jumps point to the projects that actually changed.

## 0.1.15

- Lets dashboard action-card commands wrap instead of truncating, so copyable
  report and setup commands remain readable in narrow cards.

## 0.1.14

- Adds a dashboard action queue warning when spend materially jumps versus the
  previous matching window, with a copyable report command for the same window.

## 0.1.13

- Shows previous-window spend and request changes directly in the dashboard KPI
  row, making weekly trend checks visible without opening a report.

## 0.1.12

- Adds previous-window spend and request comparison to terminal summaries and
  Markdown reports.
- Scans enough local history to compare the selected window against the matching
  prior window while preserving existing burn-rate windows.

## 0.1.11

- Adds a dashboard action queue item for `mizan --setup-kit`, making the weekly
  habit workflow discoverable from the UI after users have working data.

## 0.1.10

- Adds `mizan --setup-kit`, a copyable weekly-review setup kit with first-run
  checks, report commands, cron, launchd, and privacy reminders.
- Supports `mizan --setup-kit --output path/to/setup-kit.md` for saving the
  recurring workflow beside generated reports.
- Extends packaged install verification to cover the setup-kit command.

## 0.1.9

- Treats one-account transcript setups as usable when either personal or work
  transcripts are present.
- Makes the missing second account an optional setup note instead of the primary
  doctor recommendation.
- Points missing-folder onboarding at `mizan --try`.

## 0.1.8

- Makes `mizan --try` start with a clearer demo-mode intro before the failing
  sample summary.
- Explains that the try command reads no local transcripts and intentionally
  includes sample wrong-account leaks.

## 0.1.7

- Adds `mizan --try`, a terminal-first demo summary with next setup commands.
- Leads public install copy with a lower-friction GitHub-tag `npm exec` try path.
- Extends packaged install verification to cover the first-run try command.

## 0.1.6

- Refreshes pricing metadata against Anthropic's public pricing page.
- Prices retired Haiku 3.5 transcript records separately from Haiku 4.5 so old
  local history is not overcounted.
- Clarifies that estimates use standard global Claude API rates and do not apply
  fast mode, batch, partner cloud, or data residency multipliers.

## 0.1.5

- Makes the tag-pinned GitHub install command the primary pre-npm install path.
- Keeps the versioned release tarball as a fallback for npm clients that cannot
  install from GitHub tags.

## 0.1.4

- Adds visible README trust signals for CI, latest release, license, and
  local-only-by-default operation.
- Reorders Quick Start so new users can preview demo data before configuring
  transcript folders.

## 0.1.3

- Adds browser-facing zero-record action cards with copyable commands for demo
  mode, setup diagnostics, and saved transcript folders.

## 0.1.2

- Adds first-run dashboard guidance when no usage records are found, pointing
  users to demo mode, setup diagnostics, and saved transcript folders.
- Adds a first-minute path to CLI help so new users can preview, diagnose, and
  open the local dashboard without reading the full README.

## 0.1.1

- Adds the public launch kit to the packaged docs.
- Updates the GitHub release install path so the release artifact matches the
  current public README and launch materials.

## 0.1.0

- Local Claude Code spend dashboard for personal/work usage.
- Cross-account leak detection for work quota spent on personal projects and the
  reverse.
- Redacted Markdown and JSON reports for weekly reviews, notes, and
  reimbursement workflows.
- Persistent setup commands for transcript folders, work markers, and budgets.
- Local-only dashboard binding by default.
- Demo mode, first-run setup, doctor diagnostics, pricing report, `--today`,
  summary/check modes, redacted support bundles, and install verification.
- README screenshot, support/security docs, and GitHub issue templates for a
  public npm launch.
