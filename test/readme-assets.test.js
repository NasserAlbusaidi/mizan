import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("README references the packaged dashboard screenshot", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

  assert.match(readme, /!\[Mizan dashboard demo\]\(assets\/mizan-dashboard-demo\.png\)/);
  assert.ok(fs.existsSync("assets/mizan-dashboard-demo.png"));
  assert.ok(pkg.files.includes("assets"));
});
