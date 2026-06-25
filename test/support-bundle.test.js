import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSupportBundle, formatSupportBundle } from "../src/support-bundle.js";

test("support bundle formats diagnostics without exposing absolute home paths", () => {
  const bundle = buildSupportBundle({
    packageName: "@nasseralbusaidi/mizan",
    packageVersion: "0.1.0",
    generatedAt: "2026-06-24T12:00:00.000Z",
    node: "v20.0.0",
    platform: "darwin arm64",
    doctorReport: {
      ok: true,
      accounts: [
        {
          account: "personal",
          dir: "/Users/nasser/.claude/projects",
          exists: true,
          transcripts: 12,
          sampled: 12,
          usageRecords: 12,
        },
        {
          account: "work",
          dir: "/Users/nasser/.claude-work/projects",
          exists: false,
          transcripts: 0,
          sampled: 0,
          usageRecords: 0,
        },
      ],
      claudeCli: { command: "claude", found: true, version: "Claude Code 1.2.3", error: null },
      configFile: { path: "/Users/nasser/.mizan/config.json", exists: true, error: null },
      cacheFile: "/Users/nasser/.mizan/cache.json",
      workMarkers: ["/Users/nasser/Desktop/Work/", "/Clients/"],
      budgets: { daily: 20, monthly: 250 },
      host: "127.0.0.1",
      localOnly: true,
      budgetIssues: [],
      pricing: { sourceName: "Anthropic Claude API pricing", checkedAt: "2026-06-24" },
      recommendations: ["Setup looks usable. Run `mizan`."],
    },
  });

  const markdown = formatSupportBundle(bundle);

  assert.match(markdown, /^# Mizan Support Bundle/m);
  assert.match(markdown, /Mizan: @nasseralbusaidi\/mizan 0\.1\.0/);
  assert.match(markdown, /Node: v20\.0\.0/);
  assert.match(markdown, /Platform: darwin arm64/);
  assert.match(markdown, /personal\s+12 transcripts, 12 usage records\s+~\/\.claude\/projects/);
  assert.match(markdown, /Claude Code CLI: found \(Claude Code 1\.2\.3\)/);
  assert.match(markdown, /Config: ~\/\.mizan\/config\.json/);
  assert.match(markdown, /Work markers: ~\/Desktop\/Work\/, \/Clients\//);
  assert.match(markdown, /No raw transcript lines are included/);
  assert.doesNotMatch(markdown, /\/Users\/nasser/);
});
