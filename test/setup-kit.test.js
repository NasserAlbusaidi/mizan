import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { formatSetupKit } from "../src/setup-kit.js";

test("README links to the packaged setup kit", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  assert.match(readme, /\[Setup Kit\]\(docs\/SETUP_KIT\.md\)/);
  assert.match(readme, /mizan --setup-kit/);
  assert.match(readme, /weekly review setup kit/i);
  assert.ok(pkg.files.includes("docs"));
});

test("setup kit documents recurring report workflows safely", () => {
  const kit = fs.readFileSync("docs/SETUP_KIT.md", "utf8");

  assert.match(kit, /mizan --doctor --check/);
  assert.match(kit, /mizan --setup --fix/);
  assert.match(kit, /mizan --doctor --fix/);
  assert.match(kit, /mizan --setup/);
  assert.match(kit, /mizan --weekly --demo --output "\$HOME\/Documents\/Mizan\/mizan-demo-weekly\.md"/);
  assert.match(kit, /Prove the report flow before connecting real transcripts/);
  assert.match(kit, /saved-report command/);
  assert.match(kit, /mizan --weekly/);
  assert.match(kit, /--output "\$HOME\/Documents\/Mizan\/mizan-weekly-\$\(date \+%F\)\.md"/);
  assert.match(kit, /mizan --csv --window 7/);
  assert.match(kit, /mizan-weekly-\$\(date \+%F\)\.csv/);
  assert.match(kit, /mizan --weekly --check/);
  assert.match(kit, /personal\/work account split/);
  assert.match(kit, /costliest sessions/);
  assert.match(kit, /spreadsheet-friendly/);
  assert.match(kit, /cron/);
  assert.match(kit, /launchd/);
  assert.match(kit, /Reimbursement note/);
  assert.match(kit, /Do not attach raw transcripts/);
});

test("generated setup kit matches the setup success saved-report handoff", () => {
  const kit = formatSetupKit();

  assert.match(kit, /saved-report command/);
  assert.match(kit, /mizan --weekly --demo --output "\$HOME\/Documents\/Mizan\/mizan-demo-weekly\.md"/);
  assert.match(kit, /mizan --setup --fix/);
  assert.match(kit, /mizan --doctor --fix/);
  assert.match(kit, /mizan --weekly --output "\$HOME\/Documents\/Mizan\/mizan-weekly-\$\(date \+%F\)\.md"/);
});
