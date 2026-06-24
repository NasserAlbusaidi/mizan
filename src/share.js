export function formatShareGuide({ packageVersion }) {
  const tag = `v${packageVersion}`;
  const releaseUrl = `https://github.com/NasserAlbusaidi/mizan/releases/tag/${tag}`;
  const tryCommand = `npm exec --yes --package github:NasserAlbusaidi/mizan#${tag} -- mizan --try`;
  const installCommand = `npm install -g github:NasserAlbusaidi/mizan#${tag}`;
  const tarballCommand =
    `npm install -g https://github.com/NasserAlbusaidi/mizan/releases/download/${tag}/` +
    `nasseralbusaidi-mizan-${packageVersion}.tgz`;

  return `# Share Mizan

Mizan is a private Claude Code spend dashboard that reads the JSONL transcripts
already on your machine and shows spend, burn rate, project movers, cache
savings, and wrong-account leaks.

No account. No upload. Local-only by default.

## Try It

\`\`\`bash
${tryCommand}
\`\`\`

## Install

\`\`\`bash
${installCommand}
\`\`\`

Fallback release tarball:

\`\`\`bash
${tarballCommand}
\`\`\`

## Good Fit

- Solo builders and consultants using Claude Code daily.
- Developers who split personal and work Claude configs.
- Anyone who wants a redacted weekly usage note without uploading transcripts.

## Safe Feedback

If setup looks wrong, run:

\`\`\`bash
mizan --feedback
mizan --support-bundle
\`\`\`

Release: ${releaseUrl}
`;
}
