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
});

test("package metadata points npm users to the public GitHub repo", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  assert.equal(pkg.version, "0.1.13");
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

test("README documents the support bundle command", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /mizan --support-bundle/);
  assert.match(readme, /redacted support bundle/);
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
  const quickStartIndex = readme.indexOf("## Quick Start");

  assert.ok(quickStartIndex > 0, "README should include Quick Start");
  assert.ok(readme.indexOf("actions/workflows/ci.yml/badge.svg") < quickStartIndex);
  assert.ok(readme.indexOf("releases/latest") < quickStartIndex);
  assert.ok(readme.indexOf("license-MIT") < quickStartIndex);
  assert.match(readme.slice(0, quickStartIndex), /No account/);
  assert.match(readme.slice(0, quickStartIndex), /No upload/);
  assert.match(readme.slice(0, quickStartIndex), /Local-only by default/);
});

test("README quick start previews value before setup", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const quickStart = section(readme, "## Quick Start", "## CLI");

  assert.match(
    quickStart,
    /npm exec --yes --package github:NasserAlbusaidi\/mizan#v0\.1\.13 -- mizan --try/,
  );
  assert.ok(
    quickStart.indexOf("npm exec --yes --package github:NasserAlbusaidi/mizan#v0.1.13") <
      quickStart.indexOf("npm install -g github:NasserAlbusaidi/mizan#v0.1.13"),
  );
  assert.ok(quickStart.indexOf("mizan --demo") < quickStart.indexOf("mizan --setup"));
  assert.match(quickStart, /Try a terminal demo without installing anything globally/);
  assert.match(quickStart, /Preview the dashboard without reading local transcripts/);
  assert.match(quickStart, /Then check whether Mizan can see your transcripts/);
});

test("README documents the guided setup command", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /mizan --setup/);
  assert.match(readme, /creates .*config/i);
  assert.match(readme, /exits with code `2`/);
  assert.match(readme, /zero records/);
  assert.match(readme, /one-account users/i);
  assert.match(readme, /second account is\s+optional/i);
  assert.match(readme, /mizan --set-transcripts personal=\/path work=\/path/);
});

test("README documents running from the public GitHub source", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /git clone https:\/\/github\.com\/NasserAlbusaidi\/mizan\.git/);
  assert.match(readme, /cd mizan/);
  assert.match(readme, /node bin\/mizan\.js --setup/);
  assert.match(readme, /npm start/);
});

test("README documents the versioned GitHub install paths before npm publish", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const quickStart = section(readme, "## Quick Start", "## CLI");

  assert.match(quickStart, /npm install -g github:NasserAlbusaidi\/mizan#v0\.1\.13/);
  assert.ok(
    quickStart.indexOf("github:NasserAlbusaidi/mizan#v0.1.13") <
      quickStart.indexOf("releases/download/v0.1.13"),
  );
  assert.match(
    readme,
    /npm install -g https:\/\/github\.com\/NasserAlbusaidi\/mizan\/releases\/download\/v0\.1\.13\/nasseralbusaidi-mizan-0\.1\.13\.tgz/,
  );
  assert.match(readme, /npm package is prepared but not published yet/i);
  assert.match(readme, /npx @nasseralbusaidi\/mizan.*after npm publish/is);
});

test("release checklist lists every packaged public surface", () => {
  const release = fs.readFileSync("docs/RELEASE.md", "utf8");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  for (const entry of pkg.files) {
    const label = fs.statSync(entry).isDirectory() ? `${entry}/` : entry;
    assert.ok(release.includes(`- \`${label}\``), `${label} missing from release checklist`);
  }
  assert.match(release, /node bin\/mizan\.js --setup/);
  assert.match(release, /npm publish --dry-run --access public/);
});

test("launch kit gives a practical public launch script", () => {
  const kit = fs.readFileSync("docs/LAUNCH_KIT.md", "utf8");
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /\[Launch Kit\]\(docs\/LAUNCH_KIT\.md\)/);
  assert.match(kit, /60-second demo/);
  assert.match(kit, /mizan --setup/);
  assert.match(kit, /mizan --demo/);
  assert.match(kit, /Copy report/);
  assert.match(
    kit,
    /npm exec --yes --package github:NasserAlbusaidi\/mizan#v0\.1\.13 -- mizan --try/,
  );
  assert.match(kit, /npm install -g github:NasserAlbusaidi\/mizan#v0\.1\.13/);
  assert.match(
    kit,
    /npm install -g https:\/\/github\.com\/NasserAlbusaidi\/mizan\/releases\/download\/v0\.1\.13\/nasseralbusaidi-mizan-0\.1\.13\.tgz/,
  );
  assert.match(kit, /Show HN/);
  assert.match(kit, /npm package is prepared but not published yet/i);
  assert.match(kit, /Do not claim.*npm/i);
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
  assert.match(bug, /mizan --doctor/);
  assert.match(bug, /mizan --version/);
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
