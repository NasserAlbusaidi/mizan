import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("repo has public support and security docs", () => {
  const support = fs.readFileSync("SUPPORT.md", "utf8");
  const security = fs.readFileSync("SECURITY.md", "utf8");
  const contributing = fs.readFileSync("CONTRIBUTING.md", "utf8");
  const changelog = fs.readFileSync("CHANGELOG.md", "utf8");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  assert.match(support, /mizan --doctor/);
  assert.match(support, /mizan --version/);
  assert.match(support, /mizan --feedback/);
  assert.match(support, /mizan --support-bundle/);
  assert.match(support, /Do not paste raw transcript lines/);
  assert.match(security, /local-first/);
  assert.match(security, /Do not include raw transcripts/);
  assert.match(contributing, /npm run release:check/);
  assert.match(contributing, /local-first/);
  assert.match(contributing, /Do not commit raw transcripts/);
  assert.match(changelog, /0\.1\.0/);
  assert.match(changelog, /Local Claude Code spend dashboard/);
  assert.ok(pkg.files.includes("CHANGELOG.md"));
  assert.ok(pkg.files.includes("CONTRIBUTING.md"));
  assert.ok(pkg.files.includes("SUPPORT.md"));
  assert.ok(pkg.files.includes("SECURITY.md"));
  assert.ok(pkg.files.includes("scripts/install.sh"));
});

test("package metadata points npm users to the public GitHub repo", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  assert.deepEqual(pkg.repository, {
    type: "git",
    url: "git+https://github.com/NasserAlbusaidi/mizan.git",
  });
  assert.equal(pkg.homepage, "https://github.com/NasserAlbusaidi/mizan#readme");
  assert.deepEqual(pkg.bugs, {
    url: "https://github.com/NasserAlbusaidi/mizan/issues",
  });
});

test("README documents the quick daily check", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /mizan --today/);
  assert.match(readme, /mizan --summary --window 1/);
});

test("README documents the weekly report shortcut", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /mizan --weekly/);
  assert.match(readme, /redacted 7-day Markdown report/);
  assert.match(readme, /Demo reports include next steps/);
  assert.match(readme, /reviewable wrong-account spend/);
  assert.match(readme, /sample report command/);
  assert.match(readme, /current GitHub install command/);
  assert.match(readme, /versioned tarball fallback/);
  assert.match(readme, /mizan --weekly --output/);
  assert.match(readme, /mizan --csv --window 7/);
  assert.match(readme, /reimbursement\s+spreadsheets/);
  assert.match(readme, /Save CSV \/ CSV export/);
  assert.match(readme, /project\/account breakdown/);
  assert.match(readme, /costliest sessions/);
});

test("README documents the support bundle command", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /mizan --support-bundle/);
  assert.match(readme, /mizan --feedback/);
  assert.match(readme, /mizan --share/);
  assert.match(readme, /mizan --update-check/);
  assert.match(readme, /redacted support bundle/);
  assert.match(readme, /privacy checklist/);
  assert.match(readme, /safe public launch copy/);
  assert.match(readme, /latest GitHub release/i);
});

test("README pricing section names current source date and estimate limits", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const pricing = section(readme, "## Pricing", "## Configuration");

  assert.match(pricing, /checked on\s+2026-06-25/);
  assert.match(pricing, /Haiku 3\.5/);
  assert.match(pricing, /\$0\.80/);
  assert.match(pricing, /standard global Claude API rates/);
  assert.match(pricing, /does not apply fast mode, batch,\s+partner cloud, or data residency multipliers/);
});

test("README shows public trust signals before install", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const quickStartIndex = readme.indexOf("## Try it in 30 seconds");

  assert.ok(quickStartIndex > 0, "README should include the quick start section");
  assert.ok(readme.indexOf("actions/workflows/ci.yml/badge.svg") < quickStartIndex);
  assert.ok(readme.indexOf("releases/latest") < quickStartIndex);
  assert.ok(readme.indexOf("license-MIT") < quickStartIndex);
  assert.match(readme.slice(0, quickStartIndex), /No account/);
  assert.match(readme.slice(0, quickStartIndex), /No upload/);
  assert.match(readme.slice(0, quickStartIndex), /Local-only by default/);
});

test("README quick start previews value before setup", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const quickStart = section(readme, "## Try it in 30 seconds", "## First run");

  assert.match(quickStart, /npx @nasseralbusaidi\/mizan --demo/);
  assert.match(quickStart, /npx @nasseralbusaidi\/mizan --try/);
  assert.match(quickStart, /npx @nasseralbusaidi\/mizan --setup/);
  assert.ok(
    quickStart.indexOf("npx @nasseralbusaidi/mizan --demo") <
      quickStart.indexOf("npx @nasseralbusaidi/mizan --setup"),
    "demo preview should come before setup",
  );
  assert.match(quickStart, /no transcripts read/);
  assert.match(quickStart, /npm install -g @nasseralbusaidi\/mizan/);
  assert.match(quickStart, /mizan --set-transcripts personal=\/path work=\/path codex=\/path/);
});

test("README documents the guided setup command", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /mizan --setup/);
  assert.match(readme, /mizan --setup --fix/);
  assert.match(readme, /creates .*config/i);
  assert.match(readme, /exits with code `2`/);
  assert.match(readme, /saved-report command/);
  assert.match(readme, /mizan --weekly --output "\$HOME\/Documents\/Mizan\/mizan-weekly-\$\(date \+%F\)\.md"/);
  assert.match(readme, /mizan --weekly --demo --output "\$HOME\/Documents\/Mizan\/mizan-demo-weekly\.md"/);
  assert.match(readme, /parseable Claude usage or Codex token records/);
  assert.match(readme, /`claude` command is available/);
  assert.match(readme, /Run Claude Code or Codex once/);
  assert.match(readme, /mizan --setup --fix/);
  assert.match(readme, /suggests a copyable/);
  assert.match(readme, /zero records/);
  assert.match(readme, /one-account users/i);
  assert.match(readme, /second account is\s+optional/i);
  assert.match(readme, /mizan --set-transcripts personal=\/path work=\/path codex=\/path/);
});

test("README documents running from the public GitHub source", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /git clone https:\/\/github\.com\/NasserAlbusaidi\/mizan\.git/);
  assert.match(readme, /cd mizan/);
  assert.match(readme, /node bin\/mizan\.js --setup/);
  assert.match(readme, /npm start/);
});

test("README keeps registry-free install fallbacks", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const quickStart = section(readme, "## Try it in 30 seconds", "## First run");

  assert.match(quickStart, /scripts\/install\.sh/);
  assert.match(quickStart, /MIZAN_INSTALL_VERSION=\d+\.\d+\.\d+/);
  assert.match(
    quickStart,
    /npm install -g https:\/\/github\.com\/NasserAlbusaidi\/mizan\/releases\/download\/v\d+\.\d+\.\d+\/nasseralbusaidi-mizan-\d+\.\d+\.\d+\.tgz/,
  );
  assert.match(quickStart, /npm install -g github:NasserAlbusaidi\/mizan#v\d+\.\d+\.\d+/);
  assert.match(quickStart, /git clone https:\/\/github\.com\/NasserAlbusaidi\/mizan\.git/);
  assert.match(readme, /mizan --update-check/);
  assert.match(readme, /latest GitHub release/i);
});

test("release checklist lists every packaged public surface", () => {
  const release = fs.readFileSync("docs/RELEASE.md", "utf8");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  for (const entry of pkg.files) {
    const label = fs.statSync(entry).isDirectory() ? `${entry}/` : entry;
    assert.ok(release.includes(`- \`${label}\``), `${label} missing from release checklist`);
  }
  assert.match(release, /node bin\/mizan\.js --setup/);
  assert.match(release, /input_tokens/);
  assert.match(release, /parseable usage records/);
  assert.doesNotMatch(release, /touch .*usage\.jsonl/);
  assert.match(release, /npm publish --dry-run --access public/);
  assert.match(release, /node bin\/mizan\.js --update-check/);
  assert.match(release, /latest GitHub release/);
});

test("repo can publish to npm from GitHub Actions after NPM_TOKEN is configured", () => {
  const workflow = fs.readFileSync(".github/workflows/publish-npm.yml", "utf8");
  const release = fs.readFileSync("docs/RELEASE.md", "utf8");
  const coffee = fs.readFileSync("docs/COFFEE_MONEY_PLAN.md", "utf8");

  assert.match(workflow, /name: Publish npm/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /NPM_TOKEN/);
  assert.match(workflow, /npm run release:check/);
  assert.match(workflow, /npm publish --access public/);
  assert.match(workflow, /if: env\.NPM_TOKEN != ''/);
  assert.match(workflow, /NPM_TOKEN is not configured; add the repository secret before publishing\./);
  assert.match(workflow, /exit 1/);
  assert.doesNotMatch(workflow, /skipping npm publish/i);
  assert.match(release, /GitHub Actions npm publish/);
  assert.match(release, /NPM_TOKEN/);
  assert.match(release, /Publish npm/);
  assert.match(release, /fails clearly instead of reporting a successful publish/);
  assert.match(coffee, /Publish npm/);
  assert.match(coffee, /NPM_TOKEN/);
});

test("launch kit gives a practical public launch script", () => {
  const kit = fs.readFileSync("docs/LAUNCH_KIT.md", "utf8");
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /\[Launch Kit\]\(docs\/LAUNCH_KIT\.md\)/);
  assert.match(kit, /60-second demo/);
  assert.match(kit, /mizan --setup/);
  assert.match(kit, /parseable Claude usage record/);
  assert.match(kit, /mizan --demo/);
  assert.match(kit, /mizan --weekly --demo/);
  assert.match(kit, /mizan --share/);
  assert.match(kit, /Copy report/);
  assert.match(kit, /Save report/);
  assert.match(kit, /npx @nasseralbusaidi\/mizan --demo/);
  assert.match(kit, /npm install -g @nasseralbusaidi\/mizan/);
  assert.match(kit, /npm view @nasseralbusaidi\/mizan version/);
  assert.match(kit, /mutable\s+latest tarball URL/i);
  assert.match(kit, /Show HN/);
  assert.match(kit, /valued at API rates/);
  assert.match(kit, /quota value, not cash/);
  assert.match(kit, /Do not claim/i);
});

test("git ignore protects local launch artifacts and private notes", () => {
  const ignore = fs.readFileSync(".gitignore", "utf8");

  assert.match(ignore, /\*\.tgz/);
  assert.match(ignore, /node_modules\//);
  assert.match(ignore, /\.gstack\//);
  assert.match(ignore, /journal\.md/);
  assert.match(ignore, /\.env/);
});

test("repo has actionable GitHub issue templates", () => {
  const bug = fs.readFileSync(".github/ISSUE_TEMPLATE/bug_report.yml", "utf8");
  const feature = fs.readFileSync(".github/ISSUE_TEMPLATE/feature_request.yml", "utf8");
  const config = fs.readFileSync(".github/ISSUE_TEMPLATE/config.yml", "utf8");

  assert.match(config, /blank_issues_enabled: false/);
  assert.match(bug, /mizan --support-bundle --output mizan-support\.md/);
  assert.match(bug, /Paste the relevant redacted sections from `mizan-support\.md`/);
  assert.match(bug, /raw transcript/);
  assert.match(feature, /local-first/);
});

function section(markdown, start, end) {
  const startIndex = markdown.indexOf(start);
  const endIndex = markdown.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `${start} missing`);
  assert.notEqual(endIndex, -1, `${end} missing after ${start}`);
  return markdown.slice(startIndex, endIndex);
}
