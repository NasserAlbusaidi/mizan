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

test("README documents the guided setup command", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /mizan --setup/);
  assert.match(readme, /creates .*config/i);
  assert.match(readme, /exits with code `2`/);
});

test("README documents running from the public GitHub source", () => {
  const readme = fs.readFileSync("README.md", "utf8");

  assert.match(readme, /git clone https:\/\/github\.com\/NasserAlbusaidi\/mizan\.git/);
  assert.match(readme, /cd mizan/);
  assert.match(readme, /node bin\/mizan\.js --setup/);
  assert.match(readme, /npm start/);
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
