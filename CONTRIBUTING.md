# Contributing

Mizan is intentionally small: local-first, zero runtime dependencies, and easy
to inspect before running. Contributions should protect that shape.

## Local Setup

```bash
npm test
npm run smoke
npm run release:check
```

Use demo mode while working on UI or docs:

```bash
node bin/mizan.js --demo --no-open --port 7788
```

Then open `http://127.0.0.1:7788`.

## Product Principles

- Keep Mizan local-first. Do not require accounts, uploads, hosted storage, or
  telemetry for core features.
- Keep runtime dependencies at zero unless there is a very strong reason.
- Prefer persistent setup commands such as `mizan --set-transcripts` and
  `mizan --set-budget` over asking users to export environment variables.
- Make reports and diagnostics redacted by default.
- Preserve the default `127.0.0.1` dashboard binding.

## Privacy Rules

Do not commit raw transcripts, API keys, auth tokens, client names, private
project names, unredacted home paths, or screenshots that expose private local
work. Use `--demo` data or short placeholders such as `[work-project]`.

## Testing Expectations

Run the focused test for the behavior you changed, then run:

```bash
npm run release:check
```

That covers unit tests, smoke checks, package dry-run, and clean install
verification.

## Good Contributions

- Setup and onboarding improvements
- More accurate pricing/reporting behavior
- Privacy and redaction hardening
- Better local diagnostics
- Small dashboard clarity improvements
- Packaging checks that prevent broken npm publishes
