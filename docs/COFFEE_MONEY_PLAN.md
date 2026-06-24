# Coffee Money Plan

Mizan's simplest path to passive coffee money is not a SaaS. Keep the product
local, inspectable, and boringly trustworthy; use the free CLI as the trust
builder; monetize the saved-money moment.

## Positioning

One-liner:

> A private Claude Code spend dashboard that catches wrong-account usage before
> it quietly eats your budget.

Primary buyer:

- Solo builders and consultants using Claude Code daily
- Developers with separate personal/work Claude configs
- Small agencies that need redacted weekly usage notes for clients or internal
  reimbursement

Promise:

- Find the expensive sessions.
- Catch personal/work account leaks.
- Produce a redacted report without uploading transcripts.

## Coffee-Money Model

Start with one lightweight ask:

- Free npm package.
- README/support link: "If Mizan saved you more than a coffee, sponsor it."
- Suggested tiers: `$3`, `$5`, `$10` monthly, plus one-time support.

The free package includes a starter setup kit. Add a paid artifact only if the
free package gets real users:

- `$9` one-time advanced kit: team policy examples, client-ready report
  templates, and a tighter reimbursement workflow.

Avoid a hosted dashboard at this stage. Hosting makes privacy, auth, billing,
and support much heavier, and it weakens the product's best trust signal: no
uploads.

## Launch Checklist

1. Publish `@nasseralbusaidi/mizan` publicly on npm.
2. Add repository, homepage, and support/sponsor links to `package.json` once the
   public repo and support page exist.
3. Record a 60-second demo:
   - `mizan --doctor`
   - `mizan --demo`
   - action queue, leak detection, copy report
4. Post in places where Claude Code power users already are:
   - personal X/LinkedIn
   - relevant Discord/Slack groups where self-promotion is allowed
   - Hacker News "Show HN" only after the README has a screenshot or GIF
5. Track only public signals at first:
   - npm downloads
   - GitHub stars
   - support clicks/sponsors
   - issues from users who are not you

## What To Build Next

Highest-leverage polish before launch:

- Add `repository`, `homepage`, `bugs`, and `funding` fields after the public
  repo/support links exist.

Do not build accounts, cloud sync, payments, or teams until strangers are using
the free local version.
