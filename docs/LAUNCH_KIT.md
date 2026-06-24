# Mizan Launch Kit

Use this when you want to put Mizan in front of real Claude Code users without
overstating what is ready.

## 60-second demo

Record a terminal plus browser demo in this order:

```bash
mizan --setup
mizan --demo
mizan --weekly --demo
mizan --report --demo --window 7
mizan --share
```

Show these beats:

1. `mizan --setup` finds transcript folders or gives the next setup command.
2. `mizan --demo` opens the local dashboard without reading real transcripts.
3. The KPI row shows whether spend and requests are up or down versus the
   previous matching window.
4. Project changes shows which projects moved spend versus the prior window.
5. The action queue shows the few things worth checking first.
6. Leak detection explains wrong-account usage in plain language.
7. `mizan --weekly --demo` shows the recurring report command in one short line.
8. Copy report turns the dashboard into a redacted weekly note.
9. `mizan --share` prints safe launch copy and current install commands.

Keep the recording tight. The promise is not "analytics platform"; it is
"private Claude Code spend and leak visibility in one local command."

## Install copy

No-global-install terminal demo:

```bash
npm exec --yes --package github:NasserAlbusaidi/mizan#v0.1.26 -- mizan --try
```

Current pinned install path before npm publish:

```bash
npm install -g github:NasserAlbusaidi/mizan#v0.1.26
mizan --demo
mizan --setup
mizan
mizan --feedback
```

Stable latest tarball fallback:

```bash
npm install -g https://github.com/NasserAlbusaidi/mizan/releases/latest/download/mizan-latest.tgz
```

The npm package is prepared but not published yet. The no-global demo uses a
pinned GitHub tag because npm can cache package URLs by URL; do not claim `npx
@nasseralbusaidi/mizan` works from the npm registry until `npm view
@nasseralbusaidi/mizan version` returns `0.1.26`.
The latest tarball URL should always point at the newest GitHub release asset
named `mizan-latest.tgz`.
Do not use the stable latest tarball URL for `npm exec`; use it for install
fallbacks only.

## Short post

I built Mizan: a local Claude Code spend dashboard that reads the JSONL
transcripts already on your machine.

It shows daily spend, burn rate, model mix, cache efficiency, top projects, and
the expensive mistake I actually needed to catch: work quota spent on personal
projects, or personal quota spent on work.

No account. No upload. Local-only dashboard.

Release: https://github.com/NasserAlbusaidi/mizan/releases/tag/v0.1.26

## Longer post

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

The first version is a GitHub release while npm publish waits on auth:
https://github.com/NasserAlbusaidi/mizan/releases/tag/v0.1.26

If you run separate Claude configs or need a weekly usage note, try it. If
anything is confusing, `mizan --feedback` prints the issue link and the redacted
support-bundle command.

## Show HN draft

Title:

```text
Show HN: Mizan - local Claude Code spend and account-leak dashboard
```

Body:

```text
I built Mizan after realizing I had no quick local answer to "what did Claude
Code cost this week?" across personal and work configs.

It reads Claude Code JSONL transcripts already on your machine and shows spend,
burn rate, model mix, top projects, cache efficiency, and wrong-account leaks
such as work quota spent on personal projects.

It is intentionally local: no account, no upload, no hosted dashboard. The report
output redacts home paths for weekly notes or reimbursement logs.

The first release is on GitHub while npm publishing waits on auth:
https://github.com/NasserAlbusaidi/mizan/releases/tag/v0.1.26
```

Do not post to Show HN until the README, screenshot, release asset, and install
command have been rechecked that day.

## What not to claim

- Do not claim `npx @nasseralbusaidi/mizan` works before npm publish. The
  GitHub-tag `npm exec --package github:...` demo path is okay after rechecking
  it that day. Do not use the stable latest tarball URL for `npm exec`; npm can
  reuse an older cached tarball for the same URL.
- Do not claim provider-billing accuracy; say estimates and link the pricing
  assumptions.
- Do not imply transcript upload, team sync, or cloud history exists.
- Do not show raw transcript lines, private project names, client names, or full
  home paths in launch media.
