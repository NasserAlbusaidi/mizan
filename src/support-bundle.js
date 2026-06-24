import os from "node:os";
import { formatDoctorReport } from "./doctor.js";

export function buildSupportBundle({
  packageName,
  packageVersion,
  generatedAt = new Date().toISOString(),
  node = process.version,
  platform = `${process.platform} ${process.arch}`,
  doctorReport,
  home = os.homedir(),
} = {}) {
  return {
    packageName,
    packageVersion,
    generatedAt,
    node,
    platform,
    doctorReport,
    home,
  };
}

export function formatSupportBundle(bundle) {
  const doctor = redactSupportText(formatDoctorReport(bundle.doctorReport), bundle.home);
  return [
    "# Mizan Support Bundle",
    "",
    `Generated: ${bundle.generatedAt}`,
    `Mizan: ${bundle.packageName} ${bundle.packageVersion}`,
    `Node: ${bundle.node}`,
    `Platform: ${bundle.platform}`,
    "",
    "## Doctor",
    "",
    "```text",
    doctor,
    "```",
    "",
    "## Privacy",
    "",
    "- Home paths are redacted to `~`.",
    "- No raw transcript lines are included.",
    "- Review this bundle before posting it publicly.",
  ].join("\n");
}

export function redactSupportText(value, home = os.homedir()) {
  let text = String(value == null ? "" : value);
  if (home) {
    text = text.replaceAll(home, "~");
  }
  return text
    .replace(/\/Users\/[^/\s:]+/g, "~")
    .replace(/[A-Za-z]:\\Users\\[^\\\s:]+/g, "~");
}
