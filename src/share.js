export function formatShareGuide({ packageVersion }) {
  const tag = `v${packageVersion}`;
  const releaseUrl = `https://github.com/NasserAlbusaidi/mizan/releases/tag/${tag}`;
  const tarballUrl = `https://github.com/NasserAlbusaidi/mizan/releases/download/${tag}/nasseralbusaidi-mizan-${packageVersion}.tgz`;
  const tryCommand = `npm exec --yes --package ${tarballUrl} -- mizan --try`;
  const sampleReportCommand = `npm exec --yes --package ${tarballUrl} -- mizan --weekly --demo --output "$HOME/Documents/Mizan/mizan-demo-weekly.md"`;
  const demoDashboardCommand = `npm exec --yes --package ${tarballUrl} -- mizan --demo`;
  const fallbackTryCommand = `npm exec --yes --package github:NasserAlbusaidi/mizan#${tag} -- mizan --try`;
  const installerCommand = `MIZAN_INSTALL_VERSION=${packageVersion} bash -c "$(curl -fsSL https://raw.githubusercontent.com/NasserAlbusaidi/mizan/${tag}/scripts/install.sh)"`;
  const installCommand = `npm install -g ${tarballUrl}`;
  const fallbackInstallCommand = `npm install -g github:NasserAlbusaidi/mizan#${tag}`;

  return `# Share Mizan

Mizan is a private Claude Code spend dashboard that reads the JSONL transcripts
already on your machine and shows spend, burn rate, project movers, cache
savings, and wrong-account leaks.

No account. No upload. Local-only by default.

## Try It

\`\`\`bash
${tryCommand}
${sampleReportCommand}
${demoDashboardCommand}
\`\`\`

GitHub tag fallback:

\`\`\`bash
${fallbackTryCommand}
\`\`\`

## Install

\`\`\`bash
${installerCommand}
${installCommand}
\`\`\`

GitHub tag fallback:

\`\`\`bash
${fallbackInstallCommand}
\`\`\`

## Good Fit

- Solo builders and consultants using Claude Code daily.
- Developers who split personal and work Claude configs.
- Anyone who wants a redacted weekly usage note without uploading transcripts.

## Short Post

I built Mizan: a local Claude Code spend dashboard that reads the JSONL
transcripts already on your machine.

It shows daily spend, burn rate, model mix, cache efficiency, top projects, and
the expensive mistake I actually needed to catch: work quota spent on personal
projects, or personal quota spent on work.

No account. No upload. Local-only dashboard.

Release: ${releaseUrl}

## Longer Post

I kept losing track of Claude Code spend across personal and work configs, so I
built Mizan.

It is a local-first CLI/dashboard for Claude Code usage:

- Reads local JSONL transcripts
- Estimates spend with visible pricing assumptions
- Separates personal vs work usage
- Shows which projects drove spend changes
- Flags wrong-account leaks
- Produces redacted weekly Markdown reports
- Runs without runtime dependencies or uploads

The current version is a GitHub release while npm publish waits on auth:
${releaseUrl}

If you run separate Claude configs or need a weekly usage note, try it. If
anything is confusing, \`mizan --feedback\` prints the issue link and the
redacted support-bundle command.

## Show HN Draft

Title:

\`\`\`text
Show HN: Mizan - local Claude Code spend and account-leak dashboard
\`\`\`

Body:

\`\`\`text
I built Mizan after realizing I had no quick local answer to "what did Claude
Code cost this week?" across personal and work configs.

It reads Claude Code JSONL transcripts already on your machine and shows spend,
burn rate, model mix, top projects, cache efficiency, and wrong-account leaks
such as work quota spent on personal projects.

It is intentionally local: no account, no upload, no hosted dashboard. The
report output redacts home paths for weekly notes or reimbursement logs.

The current release is on GitHub while npm publishing waits on auth:
${releaseUrl}
\`\`\`

## What Not To Claim

- Do not claim \`npx @nasseralbusaidi/mizan\` works before npm publish.
- Do not claim provider-billing accuracy; say estimates and link the pricing
  assumptions.
- Do not imply transcript upload, team sync, or cloud history exists.
- Do not show raw transcript lines, private project names, client names, or full
  home paths in launch media.

## Safe Feedback

If setup looks wrong, run:

\`\`\`bash
mizan --feedback
mizan --support-bundle
\`\`\`

Release: ${releaseUrl}
`;
}
