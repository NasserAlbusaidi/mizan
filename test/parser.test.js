import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCodexUsageLine } from "../src/parser.js";

test("parseCodexUsageLine converts Codex token_count events to token-only usage records", () => {
  const state = { file: "/tmp/rollout.jsonl" };
  parseCodexUsageLine(
    JSON.stringify({
      timestamp: "2026-07-01T11:13:17.002Z",
      type: "session_meta",
      payload: {
        id: "thread-1",
        cwd: "/Users/tester/Desktop/Personal/mizan",
        thread_source: "subagent",
        git: { branch: "main" },
        model_provider: "openai",
      },
    }),
    state,
  );

  const record = parseCodexUsageLine(
    JSON.stringify({
      timestamp: "2026-07-01T11:13:35.937Z",
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          last_token_usage: {
            input_tokens: 30_014,
            cached_input_tokens: 29_568,
            output_tokens: 665,
            reasoning_output_tokens: 516,
            total_tokens: 30_679,
          },
        },
      },
    }),
    state,
  );

  assert.equal(record.provider, "codex");
  assert.equal(record.model, "codex");
  assert.equal(record.input, 446);
  assert.equal(record.cr, 29_568);
  assert.equal(record.output, 665);
  assert.equal(record.cwd, "/Users/tester/Desktop/Personal/mizan");
  assert.equal(record.session, "thread-1");
  assert.equal(record.branch, "main");
  assert.equal(record.sidechain, true);
});

test("parseCodexUsageLine deltas from the running total even after a last_token_usage event", () => {
  const state = { file: "/tmp/rollout.jsonl" };
  parseCodexUsageLine(
    JSON.stringify({
      timestamp: "2026-07-01T11:00:00.000Z",
      type: "session_meta",
      payload: { id: "thread-1", cwd: "/Users/tester/proj" },
    }),
    state,
  );

  // Event 1 carries last_token_usage (and the cumulative total_token_usage).
  const first = parseCodexUsageLine(
    JSON.stringify({
      timestamp: "2026-07-01T11:00:10.000Z",
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          last_token_usage: { input_tokens: 100, output_tokens: 10, total_tokens: 110 },
          total_token_usage: { input_tokens: 100, output_tokens: 10, total_tokens: 110 },
        },
      },
    }),
    state,
  );
  assert.equal(first.input, 100);
  assert.equal(first.output, 10);

  // Event 2 lacks last_token_usage and must fall back to a delta of the running
  // total — 250-100 input, 30-10 output — not the full cumulative 250/30.
  const second = parseCodexUsageLine(
    JSON.stringify({
      timestamp: "2026-07-01T11:00:20.000Z",
      type: "event_msg",
      payload: {
        type: "token_count",
        info: {
          total_token_usage: { input_tokens: 250, output_tokens: 30, total_tokens: 280 },
        },
      },
    }),
    state,
  );
  assert.equal(second.input, 150);
  assert.equal(second.output, 20);
});
