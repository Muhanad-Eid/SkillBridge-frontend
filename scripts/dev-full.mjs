import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const backendDirectory = new URL("../../SkillBridge/", import.meta.url);
const children = new Set();
let stopping = false;

function start(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    ...options,
  });

  children.add(child);
  child.once("exit", (code) => {
    children.delete(child);
    if (!stopping && code && code !== 0) shutdown(code);
  });
  return child;
}

async function waitForApi() {
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://127.0.0.1:8081/health/ready");
      if (response.ok) return;
    } catch {
      // The API is still compiling or the database is not ready yet.
    }

    await delay(500);
  }

  throw new Error("SkillBridge API did not become ready within 45 seconds.");
}

async function isApiReady() {
  try {
    const response = await fetch("http://127.0.0.1:8081/health/ready");
    return response.ok;
  } catch {
    return false;
  }
}

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;

  for (const child of children) child.kill("SIGINT");
  setTimeout(() => process.exit(exitCode), 250);
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());

try {
  if (await isApiReady()) {
    console.log("\nUsing the healthy SkillBridge API already running on port 8081.");
  } else {
    start(
      "dotnet",
      ["run", "--project", "SkillBridge.API", "--launch-profile", "http"],
      { cwd: backendDirectory },
    );
    await waitForApi();
  }

  console.log("\nSkillBridge API is ready. Starting Vite...\n");
  if (process.platform === "win32") {
    start(
      process.env.ComSpec ?? "cmd.exe",
      ["/d", "/s", "/c", "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort"],
      { cwd: process.cwd() },
    );
  } else {
    start(
      "npm",
      ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
      { cwd: process.cwd() },
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  shutdown(1);
}
