export function formatSetupKit() {
  return `# Mizan Setup Kit

Use this after installing Mizan to turn it into a weekly local habit.

## One-Time Setup

\`\`\`bash
mizan --setup
mizan --doctor --check
\`\`\`

If the defaults miss your transcript folders, save them once:

\`\`\`bash
mizan --set-transcripts personal="$HOME/.claude/projects" work="$HOME/.claude-work/projects"
\`\`\`

If work projects live outside the default paths, add a marker that appears in
their paths:

\`\`\`bash
mizan --add-work-marker /Clients/
\`\`\`

Set budgets when you want checks to fail on spend thresholds:

\`\`\`bash
mizan --set-budget daily=20 monthly=250
\`\`\`

## Weekly Review

\`\`\`bash
mizan --doctor --check
mizan --report --window 7 --output "$HOME/Documents/Mizan/mizan-weekly-$(date +%F).md"
mizan --report --check --window 7
\`\`\`

Read the report before sharing it. Paths are redacted, but you own the final
privacy check.

## Cron Example

\`\`\`cron
0 16 * * 5 /usr/bin/env bash -lc 'mizan --report --window 7 --output "$HOME/Documents/Mizan/mizan-weekly-$(date +\\%F).md"'
\`\`\`

If cron cannot find Mizan, replace \`mizan\` with the absolute path from:

\`\`\`bash
command -v mizan
\`\`\`

## launchd Example

On macOS, save this as \`~/Library/LaunchAgents/dev.mizan.weekly-report.plist\`.
Replace \`/opt/homebrew/bin/mizan\` with the output of \`command -v mizan\`.

\`\`\`xml
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
    <string>/opt/homebrew/bin/mizan --report --window 7 --output "$HOME/Documents/Mizan/mizan-weekly-$(date +%F).md"</string>
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
\`\`\`

Load it:

\`\`\`bash
launchctl load "$HOME/Library/LaunchAgents/dev.mizan.weekly-report.plist"
launchctl start dev.mizan.weekly-report
\`\`\`

## Privacy Checklist

- Read generated reports before forwarding them.
- Do not attach raw transcripts.
- Do not include API keys, auth tokens, or private project names.
- Keep the default local-only dashboard unless you intentionally need LAN access.
`;
}
