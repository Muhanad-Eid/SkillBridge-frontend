import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const frontendUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173";
const apiUrl = process.env.E2E_API_URL ?? "http://127.0.0.1:8081";
const backendDirectory =
  process.env.SKILLBRIDGE_BACKEND_DIR ?? path.resolve(process.cwd(), "../SkillBridge");

const apiHostname = new URL(apiUrl).hostname;
if (
  apiHostname !== "127.0.0.1" &&
  apiHostname !== "localhost" &&
  process.env.E2E_ALLOW_REMOTE_API !== "1"
) {
  throw new Error(
    `Refusing to run mutating E2E tests against remote API ${apiUrl}. ` +
      "Set E2E_ALLOW_REMOTE_API=1 only for an isolated test environment.",
  );
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: frontendUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  expect: {
    timeout: 10_000,
  },
  projects: [
    {
      name: "desktop-chromium",
      grepInvert: /@mobile/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      grep: /@mobile/,
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: process.env.E2E_EXTERNAL_SERVERS
    ? undefined
    : [
        {
          command:
            "dotnet run --no-build --project SkillBridge.API --launch-profile http",
          cwd: backendDirectory,
          env: {
            ...process.env,
            ASPNETCORE_ENVIRONMENT: "Development",
            RateLimiting__AuthPermitLimit: "1000",
          },
          url: `${apiUrl}/health/ready`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
        {
          command:
            "npm run dev:client -- --host 127.0.0.1 --port 4173 --strictPort",
          env: {
            ...process.env,
            VITE_API_URL: "",
          },
          url: frontendUrl,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ],
});
