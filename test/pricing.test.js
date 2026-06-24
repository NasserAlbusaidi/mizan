import { test } from "node:test";
import assert from "node:assert/strict";
import {
  costOf,
  formatPricingReport,
  priceFor,
  pricingRows,
  PRICING_METADATA,
} from "../src/pricing.js";

// --- priceFor: table-driven over every model family + edge cases ---
test("priceFor resolves each model family and derived cache tiers", () => {
  const cases = [
    // model string,            input, output, cacheRead, write5m, write1h
    ["claude-opus-4-8", 5, 25, 0.5, 6.25, 10],
    ["claude-opus-4-5-20251101", 5, 25, 0.5, 6.25, 10],
    ["claude-opus-4-7", 5, 25, 0.5, 6.25, 10],
    ["claude-opus-4-1-20250805", 15, 75, 1.5, 18.75, 30],
    ["claude-opus-4-20250514", 15, 75, 1.5, 18.75, 30],
    ["claude-sonnet-4-6", 3, 15, 0.3, 3.75, 6],
    ["claude-haiku-4-5-20251001", 1, 5, 0.1, 1.25, 2],
    ["claude-fable-5", 10, 50, 1, 12.5, 20],
    ["claude-mythos-5", 10, 50, 1, 12.5, 20],
    ["<synthetic>", 0, 0, 0, 0, 0], // local, never billed
    ["some-future-model", 0, 0, 0, 0, 0], // unknown -> safe zero
    ["", 0, 0, 0, 0, 0], // empty
  ];
  for (const [model, input, output, cacheRead, w5, w1] of cases) {
    const p = priceFor(model);
    assert.equal(p.input, input, `${model} input`);
    assert.equal(p.output, output, `${model} output`);
    assert.equal(p.cacheRead, cacheRead, `${model} cacheRead`);
    assert.equal(p.cacheWrite5m, w5, `${model} write5m`);
    assert.equal(p.cacheWrite1h, w1, `${model} write1h`);
  }
});

test("priceFor matches fable before opus (ordering does not misclassify)", () => {
  assert.equal(priceFor("claude-fable-5").input, 10);
});

test("pricing metadata and report expose source and checked date", () => {
  assert.equal(PRICING_METADATA.checkedAt, "2026-06-24");
  assert.match(PRICING_METADATA.sourceUrl, /anthropic\.com/);
  assert.ok(pricingRows().some((row) => row.family === "mythos"));
  assert.ok(pricingRows().some((row) => row.family === "opus-4.1/4"));
  const report = formatPricingReport();
  assert.match(report, /Mizan pricing assumptions/);
  assert.match(report, /mythos/);
  assert.match(report, /opus-4\.1\/4/);
  assert.match(report, /checked 2026-06-24/);
  assert.match(report, /unpriced warnings/);
});

// --- costOf: clean / partial / zero / unknown ---
test("costOf computes a full Opus 4.8 record correctly", () => {
  // 1M input, 1M output, 1M cache read, 1M cache write (5m): a clean round case.
  const cost = costOf(
    { input: 1_000_000, output: 1_000_000, cacheRead: 1_000_000, cacheWrite5m: 1_000_000 },
    "claude-opus-4-8",
  );
  // 5 + 25 + 0.5 + 6.25 = 36.75
  assert.equal(cost, 36.75);
});

test("costOf splits 5m vs 1h cache-write tiers", () => {
  const cost = costOf(
    { cacheWrite5m: 1_000_000, cacheWrite1h: 1_000_000 },
    "claude-sonnet-4-6",
  );
  // 3.75 + 6 = 9.75
  assert.equal(cost, 9.75);
});

test("costOf treats missing token fields as zero (no NaN)", () => {
  const cost = costOf({ output: 500_000 }, "claude-haiku-4-5");
  assert.equal(cost, 2.5);
  assert.ok(Number.isFinite(cost));
});

test("costOf returns 0 for synthetic and unknown models", () => {
  assert.equal(costOf({ input: 9e9, output: 9e9 }, "<synthetic>"), 0);
  assert.equal(costOf({ input: 9e9, output: 9e9 }, "mystery"), 0);
});

test("costOf of an all-zero record is 0", () => {
  assert.equal(costOf({}, "claude-opus-4-8"), 0);
});
