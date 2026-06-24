// Cost computation — MONEY CODE. Table-driven, pure, and unit-tested.
//
// Public per-MTok pricing (USD), Anthropic Claude API, checked 2026-06-25:
//   Fable 5      $10 / $50
//   Mythos 5     $10 / $50
//   Opus 4.5–4.8 $5  / $25
//   Opus 4.1 / 4 $15 / $75     <- deprecated/retired, but older local transcript
//                                 records may still exist and should not be
//                                 undercounted.
//   Sonnet 4.6   $3  / $15
//   Haiku 4.5    $1  / $5
//   Haiku 3.5    $0.80 / $4     <- retired, but older transcript records may
//                                 still exist and should not be overcounted.
//
// Cache tiers are fixed multiples of the input price:
//   cache read      = 0.10x input
//   cache write 5m  = 1.25x input
//   cache write 1h  = 2.00x input
//
// `<synthetic>` and any unmatched model price at $0. Summaries/reports warn on
// unmatched non-synthetic model usage so estimates are not trusted silently.

export const PRICING_METADATA = Object.freeze({
  checkedAt: "2026-06-25",
  sourceName: "Anthropic Claude API pricing",
  sourceUrl: "https://docs.anthropic.com/en/docs/about-claude/pricing",
  claudeCodeCostsUrl: "https://docs.anthropic.com/en/docs/claude-code/costs",
  note: "Claude Code charges by API token consumption. Mizan estimates from local transcript usage records using standard global Claude API rates; authoritative billing remains Anthropic. It does not apply fast mode, batch, partner cloud, or data residency multipliers. Unmatched non-synthetic models are flagged as unpriced warnings.",
});

const PER_MTOK = [
  // [family, matcher, inputPrice, outputPrice] — first matcher wins.
  ["fable", /fable/, 10, 50],
  ["mythos", /mythos/, 10, 50],
  ["opus-4.1/4", /opus-4(?:-1\b|-1-|-\d{8}|$)/, 15, 75],
  ["opus-4.5+", /opus/, 5, 25],
  ["sonnet", /sonnet/, 3, 15],
  ["haiku-3.5", /haiku-3-5|3-5-haiku|haiku-2024|haiku-3\.5/, 0.8, 4],
  ["haiku", /haiku/, 1, 5],
];

const CACHE_READ_MULT = 0.1;
const CACHE_WRITE_5M_MULT = 1.25;
const CACHE_WRITE_1H_MULT = 2.0;

// Round to 6 decimals so derived tiers like 3 * 0.1 read as 0.3, not 0.30000000000000004.
const r6 = (n) => Math.round(n * 1e6) / 1e6;

export function priceFor(model) {
  const m = model || "";
  for (const [, matcher, input, output] of PER_MTOK) {
    if (matcher.test(m)) {
      return {
        input,
        output,
        cacheRead: r6(input * CACHE_READ_MULT),
        cacheWrite5m: r6(input * CACHE_WRITE_5M_MULT),
        cacheWrite1h: r6(input * CACHE_WRITE_1H_MULT),
      };
    }
  }
  return { input: 0, output: 0, cacheRead: 0, cacheWrite5m: 0, cacheWrite1h: 0 };
}

export function pricingRows() {
  return PER_MTOK.map(([family, , input, output]) => ({
    family,
    input,
    output,
    cacheRead: r6(input * CACHE_READ_MULT),
    cacheWrite5m: r6(input * CACHE_WRITE_5M_MULT),
    cacheWrite1h: r6(input * CACHE_WRITE_1H_MULT),
  }));
}

export function formatPricingReport() {
  const lines = [
    "Mizan pricing assumptions",
    "",
    `${PRICING_METADATA.sourceName} (checked ${PRICING_METADATA.checkedAt})`,
    PRICING_METADATA.sourceUrl,
    "",
    "Family   Input/MTok  5m write  1h write  Cache hit  Output/MTok",
  ];
  for (const row of pricingRows()) {
    lines.push(
      `${row.family.padEnd(8)} ${money(row.input).padStart(10)} ${money(row.cacheWrite5m).padStart(9)} ${money(row.cacheWrite1h).padStart(9)} ${money(row.cacheRead).padStart(10)} ${money(row.output).padStart(12)}`,
    );
  }
  lines.push("");
  lines.push(PRICING_METADATA.note);
  lines.push("Unmatched non-synthetic models price at $0 and appear as unpriced warnings in summaries and reports.");
  lines.push(`Claude Code cost docs: ${PRICING_METADATA.claudeCodeCostsUrl}`);
  return lines.join("\n");
}

function money(value) {
  return `$${value}`;
}

// Cost for a single usage record. Token fields default to 0 when absent.
// `cacheWrite5m` / `cacheWrite1h` split the cache-creation tokens by TTL; when the
// transcript only reports a single cache_creation_input_tokens total, callers pass
// it all as cacheWrite5m (the Claude Code default TTL).
export function costOf(
  { input = 0, output = 0, cacheRead = 0, cacheWrite5m = 0, cacheWrite1h = 0 },
  model,
) {
  const p = priceFor(model);
  const micros =
    input * p.input +
    output * p.output +
    cacheRead * p.cacheRead +
    cacheWrite5m * p.cacheWrite5m +
    cacheWrite1h * p.cacheWrite1h;
  return micros / 1_000_000;
}
