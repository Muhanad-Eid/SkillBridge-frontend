import { access, constants } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

export default async function globalSetup() {
  if (process.env.E2E_SKIP_DEMO_SEED === "1") return;

  const backendDirectory =
    process.env.SKILLBRIDGE_BACKEND_DIR ?? path.resolve(process.cwd(), "../SkillBridge");

  await access(path.join(backendDirectory, "SkillBridge.API"), constants.R_OK);

  const result = spawnSync(
    process.platform === "win32" ? "dotnet.exe" : "dotnet",
    ["run", "--no-build", "--project", "SkillBridge.API", "--", "--seed-demo-data"],
    {
      cwd: backendDirectory,
      env: {
        ...process.env,
        ASPNETCORE_ENVIRONMENT: "Development",
      },
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    throw new Error("Unable to seed the SkillBridge development dataset for E2E tests.");
  }
}
