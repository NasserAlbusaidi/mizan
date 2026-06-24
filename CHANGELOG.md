# Changelog

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
