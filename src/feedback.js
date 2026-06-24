export const FEEDBACK_ISSUE_URL = "https://github.com/NasserAlbusaidi/mizan/issues/new/choose";

export function formatFeedbackGuide() {
  return `# Mizan Feedback

Open an issue:

${FEEDBACK_ISSUE_URL}

Before posting:

1. Run \`mizan --support-bundle --output mizan-support.md\`.
2. Review \`mizan-support.md\` and paste only the relevant redacted sections.
3. Include the command you ran, what you expected, what happened, and how you installed Mizan.

Privacy:

- Do not attach raw transcripts.
- Do not paste private project names, client names, API keys, or full home paths.
- The support bundle is designed for issues: it includes setup diagnostics, not raw transcript lines.
`;
}
