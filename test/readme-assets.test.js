import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("README references the packaged dashboard screenshot", () => {
  const readme = fs.readFileSync("README.md", "utf8");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const screenshot = fs.readFileSync("assets/mizan-dashboard-demo.png");

  assert.match(readme, /!\[Mizan dashboard[^\]]*\]\(assets\/mizan-dashboard-demo\.png\)/);
  assert.ok(fs.existsSync("assets/mizan-dashboard-demo.png"));
  assert.equal(screenshot.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.ok(screenshot.readUInt32BE(16) >= 1200);
  assert.ok(screenshot.readUInt32BE(20) >= 900);
  assert.ok(pkg.files.includes("assets"));
});
