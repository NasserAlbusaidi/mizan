// Zero-dependency HTTP server: serves the static dashboard and a single JSON API.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compute } from "./engine.js";
import { getRuntimeConfig } from "./config.js";
import { buildReport, formatCsvReport, formatMarkdownReport } from "./report.js";

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const WINDOWS = { "1": 1, "7": 7, "30": 30, "90": 90, all: null };

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendMarkdown(res, status, text) {
  res.writeHead(status, {
    "content-type": "text/markdown; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(text);
}

function sendCsv(res, status, text) {
  res.writeHead(status, {
    "content-type": "text/csv; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(text);
}

function serveStatic(res, urlPath) {
  // Restrict to files that physically resolve inside PUBLIC_DIR (no traversal).
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const abs = path.join(PUBLIC_DIR, rel);
  if (!abs.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("forbidden");
  }
  fs.readFile(abs, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("not found");
    }
    res.writeHead(200, {
      "content-type": MIME[path.extname(abs)] || "application/octet-stream",
      // Local single-user dashboard: never let the browser reuse a cached
      // asset. Without this (and with no ETag/Last-Modified to revalidate
      // against), an edited charts.js/app.js stayed stale in the open tab.
      "cache-control": "no-store",
    });
    res.end(data);
  });
}

export function createServer({ demo = false, host, port } = {}) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/data") {
      const w = url.searchParams.get("window") || "30";
      if (!(w in WINDOWS)) return sendJson(res, 400, { error: `invalid window: ${w}` });
      try {
        return sendJson(res, 200, compute(WINDOWS[w], { demo, host, port }));
      } catch (err) {
        return sendJson(res, 500, { error: String(err && err.stack ? err.stack : err) });
      }
    }
    if (url.pathname === "/api/report") {
      const w = url.searchParams.get("window") || "30";
      if (!(w in WINDOWS)) return sendJson(res, 400, { error: `invalid window: ${w}` });
      try {
        const report = buildReport(compute(WINDOWS[w], { demo, host, port }));
        if (url.searchParams.get("format") === "json") return sendJson(res, 200, report);
        if (url.searchParams.get("format") === "csv") return sendCsv(res, 200, formatCsvReport(report));
        return sendMarkdown(res, 200, formatMarkdownReport(report));
      } catch (err) {
        return sendJson(res, 500, { error: String(err && err.stack ? err.stack : err) });
      }
    }
    if (url.pathname === "/api/health") return sendJson(res, 200, { ok: true });
    if (url.pathname === "/api/status") {
      return sendJson(res, 200, { ok: true, config: getRuntimeConfig({ demo, host, port }) });
    }
    return serveStatic(res, url.pathname);
  });
}
