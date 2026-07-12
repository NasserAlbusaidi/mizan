# Mizan Launch Kit

Use this when you want to put Mizan in front of real Claude Code users without
overstating what is ready. Everything below assumes the npm package is live —
verify with `npm view @nasseralbusaidi/mizan version` before posting anything.

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

1. `mizan --setup` finds parseable Claude usage records or gives the next setup
   command.
2. `mizan --demo` opens the local dashboard without reading real transcripts.
3. The KPI row shows whether usage and requests are up or down versus the
   previous matching window.
4. The red cross-account leak banner with the wrong-account quota value — this
   is the money shot; linger on it.
5. The action queue shows the few things worth checking first.
6. `mizan --weekly --demo` shows the recurring report command in one short line.
7. Copy report and Save report turn the dashboard into a redacted weekly note.

Keep the recording tight. The promise is not "analytics platform"; it is
"private Claude Code usage and leak visibility in one local command."

## Install copy

Primary (post-publish):

```bash
npx @nasseralbusaidi/mizan --demo      # preview, no transcripts read
npx @nasseralbusaidi/mizan --try       # terminal demo summary
npm install -g @nasseralbusaidi/mizan  # keep it
```

Fallback for registry-averse users: the versioned GitHub release tarball
commands in the README's collapsed install section. Never use a mutable
latest tarball URL — GitHub redirects lag and npm caches package URLs.

## Show HN

Title:

```text
Show HN: Mizan – local Claude Code/Codex usage dashboard that catches wrong-account leaks
```

First comment:

```text
I split Claude Code across two configs — personal and work. One night a
forgotten terminal pane ran a personal project on my work account for 14 hours
and quietly burned ~$978 (valued at API rates) of the wrong account's quota. I
only noticed days later. Existing tools (ccusage is the good one) tell you what
you used, but not which account paid for which project — so this class of
mistake is invisible until it isn't.

Mizan reads the JSONL transcripts already on your machine and serves a local
dashboard on 127.0.0.1: daily usage by account, burn rate, projected monthly,
and the part I built it for — cross-account leak detection that flags sessions
billed to the wrong account and totals the reviewable quota value in dollars.
Dollar figures are API-list-price valuations and labeled as such (on a Max/Pro
subscription that's quota value, not cash). Zero runtime dependencies, nothing
leaves the machine, no account. It also avoids a common mispricing: Opus 4.5+
is $5/$25, not the $15/$75 older scripts hardcode. Try it without installing:
npx @nasseralbusaidi/mizan --demo. Feedback on the leak heuristic especially
welcome.
```

Do not post until the README, screenshot, npm listing, and install command have
been rechecked that day.

## r/ClaudeAI

Title:

```text
I built a local dashboard that catches when Claude Code bills the wrong account (a forgotten pane once burned ~$978 of my work quota)
```

Body:

```text
If you run Claude Code across two configs — personal and work — you've
probably had a session bill the wrong account. A forgotten pane once ran a
personal project on my work quota for 14 hours and burned ~$978 (valued at API
rates) before I noticed.

So I made Mizan: a local dashboard that reads the transcripts already on your
machine and shows daily usage by account, burn rate, projected monthly, top
projects — and flags cross-account leaks with the wrong-account quota value in
dollars, clearly labeled as an API-rate estimate. It also handles Codex, and
prices Opus 4.5+ correctly at $5/$25 (a lot of scripts still hardcode the old
$15/$75).

Zero dependencies, binds to localhost, nothing uploaded. Try it without
installing:
npx @nasseralbusaidi/mizan --demo

GitHub: github.com/NasserAlbusaidi/mizan — feedback welcome, especially on the
leak detection.
```

## What not to claim

- Do not claim `npx @nasseralbusaidi/mizan` works before
  `npm view @nasseralbusaidi/mizan version` returns the released version.
- Do not present dollar figures as cash bills. They are API-list-price
  valuations; on subscription plans they are quota value. Say "valued at API
  rates" whenever a dollar amount appears in launch copy.
- Do not claim provider-billing accuracy; say estimates and link the pricing
  assumptions.
- Do not imply transcript upload, team sync, or cloud history exists.
- Do not show raw transcript lines, private project names, client names, or
  full home paths in launch media.
