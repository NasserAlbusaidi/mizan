// Cross-account leak detection.
//
// A "leak" is a session billed to one account whose project belongs to the other —
// e.g. the work account running the personal Rihla project (the real incident that
// silently burned ~$978 of work quota over 14 hours from a forgotten cmux pane).
//
// Direction:
//   work_pays_personal  — work quota spent on personal work (the costly case)
//   personal_pays_work  — personal quota spent on work

import { expectedAccount } from "./config.js";

export function classifyLeak(session) {
  if (!session.cwd) return null; // no project path -> can't attribute
  const expected = expectedAccount(session.cwd);
  if (session.account === expected) return null; // correctly billed
  return session.account === "work" ? "work_pays_personal" : "personal_pays_work";
}
