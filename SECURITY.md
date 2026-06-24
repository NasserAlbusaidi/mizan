# Security Policy

Mizan is local-first: it reads Claude Code transcript JSONL files from your
machine, estimates usage locally, and serves a dashboard on `127.0.0.1` by
default. It has no runtime dependencies and does not upload transcript data.

## Reporting Security Issues

If you find a privacy or security issue, open a minimal report with:

- Mizan version from `mizan --version`
- Node version and operating system
- The command or browser URL involved
- A short explanation of what data could be exposed
- Redacted output only

Do not include raw transcripts, API keys, auth tokens, client names, private
project names, unredacted home paths, or screenshots that expose sensitive
workspace data.

## Local Server Exposure

The dashboard binds to `127.0.0.1` unless you explicitly set `--host` or
`MIZAN_HOST`. Treat `--host 0.0.0.0` as intentional LAN exposure and use it only
on trusted networks.

## Supported Versions

Security fixes target the latest published npm version.
