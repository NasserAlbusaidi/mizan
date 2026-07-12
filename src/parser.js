// Parse a single Claude Code transcript line into a normalized usage record.
// Schema confirmed against live transcripts: assistant lines carry
// message.usage{input_tokens, cache_creation_input_tokens, cache_read_input_tokens,
// cache_creation{ephemeral_5m_input_tokens, ephemeral_1h_input_tokens}, output_tokens},
// message.model, message.id, plus top-level requestId, timestamp, cwd, sessionId,
// gitBranch, isSidechain.
//
// Returns null for any line that is not a billable usage record (fast path: the
// caller pre-filters on the `"usage"` substring, matching the reference script).

export function parseUsageLine(line) {
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    return null;
  }
  const msg = o.message;
  if (!msg) return null;
  const u = msg.usage;
  const ts = o.timestamp;
  if (!u || !ts) return null;

  const t = Date.parse(ts);
  if (Number.isNaN(t)) return null;

  const cc = u.cache_creation;
  let cc5 = 0;
  let cc1 = 0;
  if (cc && typeof cc === "object") {
    cc5 = cc.ephemeral_5m_input_tokens || 0;
    cc1 = cc.ephemeral_1h_input_tokens || 0;
  } else {
    // Only a single total reported — bill it at the 5-minute tier (Claude Code default).
    cc5 = u.cache_creation_input_tokens || 0;
  }

  return {
    key: `${msg.id || ""}|${o.requestId || ""}`,
    t,
    model: msg.model || "unknown",
    input: u.input_tokens || 0,
    cc5,
    cc1,
    cr: u.cache_read_input_tokens || 0,
    output: u.output_tokens || 0,
    sidechain: o.isSidechain === true,
    cwd: o.cwd || null,
    session: o.sessionId || null,
    branch: o.gitBranch || null,
    provider: "claude",
  };
}

export function parseCodexUsageLine(line, state = {}) {
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    return null;
  }

  if (o.type === "session_meta" && o.payload && typeof o.payload === "object") {
    const p = o.payload;
    state.cwd = p.cwd || state.cwd || null;
    state.session = p.id || p.session_id || state.session || null;
    state.branch = p.git?.branch || state.branch || null;
    state.agent = p.thread_source === "subagent" || !!p.source?.subagent || state.agent || false;
    state.model = p.model || p.model_slug || p.model_name || state.model || "codex";
    return null;
  }

  if (o.payload?.type !== "token_count") return null;
  const ts = o.timestamp;
  const t = Date.parse(ts);
  if (Number.isNaN(t)) return null;

  const info = o.payload.info || {};
  const total = info.total_token_usage;
  const usage = info.last_token_usage || deltaFromTotalUsage(total, state.previousTotalUsage);
  if (!usage || typeof usage !== "object") return null;
  // Advance the cumulative baseline whichever shape this event used, so a later
  // event that must fall back to total_token_usage computes a true per-turn delta
  // instead of booking the full running total as one turn.
  if (total && typeof total === "object") state.previousTotalUsage = { ...total };

  const cached = usage.cached_input_tokens || 0;
  const rawInput = usage.input_tokens || 0;
  const input = Math.max(0, rawInput - cached);
  const output = usage.output_tokens || 0;
  const totalTokens = usage.total_tokens || rawInput + output;
  if (rawInput + cached + output + totalTokens <= 0) return null;

  state.tokenIndex = (state.tokenIndex || 0) + 1;
  const session = state.session || state.file || "codex-session";
  return {
    key: `codex:${session}:${ts}:${state.tokenIndex}`,
    t,
    model: state.model || "codex",
    input,
    cc5: 0,
    cc1: 0,
    cr: cached,
    output,
    sidechain: state.agent === true,
    cwd: state.cwd || null,
    session,
    branch: state.branch || null,
    provider: "codex",
  };
}

function deltaFromTotalUsage(total, prev = {}) {
  if (!total || typeof total !== "object") return null;
  return {
    input_tokens: Math.max(0, (total.input_tokens || 0) - (prev.input_tokens || 0)),
    cached_input_tokens: Math.max(0, (total.cached_input_tokens || 0) - (prev.cached_input_tokens || 0)),
    output_tokens: Math.max(0, (total.output_tokens || 0) - (prev.output_tokens || 0)),
    reasoning_output_tokens: Math.max(
      0,
      (total.reasoning_output_tokens || 0) - (prev.reasoning_output_tokens || 0),
    ),
    total_tokens: Math.max(0, (total.total_tokens || 0) - (prev.total_tokens || 0)),
  };
}
