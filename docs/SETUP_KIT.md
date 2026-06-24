# Mizan Setup Kit

Use this kit to turn Mizan from a dashboard you open once into a weekly habit.
It keeps the workflow local and avoids raw transcript sharing.

You can print this workflow from an installed CLI with:

```bash
mizan --setup-kit
```

## One-Time Setup

Create a local config and check what Mizan can see:

```bash
mizan --setup
mizan --doctor --check
```

`mizan --setup` creates `~/.mizan/config.json` if it is missing, prints the same
diagnostics as `mizan --doctor`, and exits with code `2` when Mizan still cannot
see at least one transcript file.

When setup looks usable, the diagnostics point you to the dashboard, the weekly
report command, and the scriptable JSON path.
Use `mizan --doctor --check` in scripts when you want setup to fail fast unless
Mizan can see at least one transcript file.

Save transcript folders if the defaults are wrong:

```bash
mizan --set-transcripts \
  personal="$HOME/.claude/projects" \
  work="$HOME/.claude-work/projects"
```

Add a work marker if your work repos do not live under the default paths:

```bash
mizan --add-work-marker /Clients/
```

Set budgets if you want the dashboard and checks to flag spend:

```bash
mizan --set-budget daily=20 monthly=250
```

## Weekly Review

Run this on Friday or before sending a client/internal note:

```bash
mizan --doctor --check
mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly-$(date +%F).md"
mizan --weekly --check
```

Read the report before sharing it. The report redacts home paths, but you still
own the final privacy check. It also compares the selected window with the
previous matching window, so a 7-day report shows whether spend and request
count moved up or down from the prior 7 days and which projects drove the
change.

Use `mizan --weekly --check` when you want the command to fail if Mizan finds
account leaks or budget overruns.

## Cron Example

Create a weekly local report every Friday at 4 PM:

```cron
0 16 * * 5 /usr/bin/env bash -lc 'mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly-$(date +\%F).md"'
```

Cron has a minimal environment. If it cannot find `mizan`, replace `mizan` with
the absolute path from:

```bash
command -v mizan
```

## launchd Example

On macOS, save this as `~/Library/LaunchAgents/dev.mizan.weekly-report.plist`.
Replace `/opt/homebrew/bin/mizan` with the output of `command -v mizan`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>dev.mizan.weekly-report</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>/opt/homebrew/bin/mizan --weekly --output "$HOME/Documents/Mizan/mizan-weekly-$(date +%F).md"</string>
  </array>

  <key>StartCalendarInterval</key>
  <dict>
    <key>Weekday</key>
    <integer>5</integer>
    <key>Hour</key>
    <integer>16</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>

  <key>StandardOutPath</key>
  <string>/tmp/mizan-weekly-report.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/mizan-weekly-report.err</string>
</dict>
</plist>
```

Load it:

```bash
launchctl load "$HOME/Library/LaunchAgents/dev.mizan.weekly-report.plist"
```

Run it once:

```bash
launchctl start dev.mizan.weekly-report
```

## Reimbursement note

Use this when you need a short internal or client note:

```markdown
Subject: Claude Code usage summary - week ending YYYY-MM-DD

Window: last 7 days
Estimated spend: $__
Personal/work account leaks: none / see notes
Budget status: within budget / over budget by $__

Notes:
- Source: `mizan --weekly`
- Paths are redacted.
- Authoritative billing remains the provider billing console.

Attached:
- Redacted Mizan report
```

Do not attach raw transcripts. Do not include API keys, auth tokens, full home
paths, client names, or private project names unless the recipient already has
permission to see them.

## Client note

Use this when a client only needs the summary:

```markdown
Claude Code usage was reviewed for the last 7 days. Estimated spend was $__.
No cross-account leaks were found. The attached report is redacted and omits
local filesystem paths. Provider billing remains the source of truth.
```

If Mizan finds a leak, fix the account/session setup first, then send the note.

## Privacy Checklist

- Use `mizan --weekly`, not raw JSONL transcript files.
- Read the report before forwarding it.
- Remove client names, private project names, and full local paths.
- Do not attach raw transcripts.
- Treat `--host 0.0.0.0` as LAN exposure. Keep the default local-only server
  unless you intentionally need network access.
