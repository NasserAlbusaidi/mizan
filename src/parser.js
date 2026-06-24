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
  };
}
