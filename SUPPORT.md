# Support

Mizan is a local-first CLI and dashboard. Useful bug reports are mostly about
your setup, the command you ran, and the redacted shape of the output.

## Before Opening An Issue

Run:

```bash
mizan --version
mizan --doctor
mizan --feedback
mizan --support-bundle
mizan --summary --window 7
```

If the dashboard is empty, also try:

```bash
mizan --set-transcripts personal=/path/to/personal/projects work=/path/to/work/projects
```

If leak direction looks wrong, include the work markers from `mizan --doctor`
and the marker you expected to match.

## What To Include

- Redacted setup diagnostics from `mizan --support-bundle`
- The issue-reporting checklist from `mizan --feedback`
- Mizan version from `mizan --version`
- Node version from `node --version`
- Operating system and install method
- Exact command you ran
- Redacted `mizan --report --window 7` output when spend/reporting behavior is involved

Do not paste raw transcript lines, unredacted home paths, API keys, auth tokens,
client names, or private project names. Replace sensitive values with short
labels such as `[personal-project]`, `[work-project]`, or `[home]`.

## Good First Fixes

Issues that improve setup, privacy, reporting clarity, packaging, or docs are
especially welcome. Keep the product local-first unless there is a very strong
reason to do otherwise.
