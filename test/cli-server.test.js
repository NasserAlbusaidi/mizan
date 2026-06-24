import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const bin = path.resolve("bin/mizan.js");

test("dashboard binds and advertises localhost by default", async () => {
  const port = await freePort();
  const child = spawn(process.execPath, [bin, "--demo", "--no-open", "--no-warm", "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    const stdout = await waitForOutput(child, /http:\/\/127\.0\.0\.1:\d+/);
    assert.match(stdout, new RegExp(`http://127\\.0\\.0\\.1:${port}`));
    assert.match(stdout, /local-only/i);
  } finally {
    child.kill("SIGTERM");
  }
});

test("dashboard port conflict suggests the --port flag", async () => {
  const port = await freePort();
  const blocker = net.createServer();
  await new Promise((resolve) => blocker.listen(port, "127.0.0.1", resolve));

  const child = spawn(process.execPath, [bin, "--demo", "--no-open", "--no-warm", "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    const output = await waitForExit(child);
    assert.equal(output.code, 1);
    assert.match(output.text, new RegExp(`Port ${port} is in use`));
    assert.match(output.text, /mizan --port 7788/);
    assert.doesNotMatch(output.text, /Set MIZAN_PORT/);
  } finally {
    await new Promise((resolve) => blocker.close(resolve));
  }
});

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function waitForOutput(child, pattern) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      reject(new Error(`timed out waiting for ${pattern}; output was:\n${output}`));
    }, 5000);

    const onData = (chunk) => {
      output += chunk;
      if (pattern.test(output)) {
        clearTimeout(timer);
        resolve(output);
      }
    };

    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`mizan exited before startup with code ${code}; output was:\n${output}`));
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    let text = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`timed out waiting for exit; output was:\n${text}`));
    }, 5000);

    const onData = (chunk) => {
      text += chunk;
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code, text });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
