import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const input = path.resolve(
  process.env.OPENAPI_INPUT ?? "../SkillBridge/openapi/skillbridge.openapi.json",
);
const output = path.resolve("src/shared/api/generated");

if (!existsSync(input)) {
  throw new Error(
    `OpenAPI input was not found at ${input}. Set OPENAPI_INPUT to the backend contract file.`,
  );
}

const executable = path.resolve(
  "node_modules",
  ".bin",
  process.platform === "win32" ? "openapi-ts.cmd" : "openapi-ts",
);
const result = spawnSync(
  executable,
  ["-i", input, "-o", output, "-p", "@hey-api/typescript"],
  {
  stdio: "inherit",
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!existsSync(path.join(output, "types.gen.ts"))) {
  throw new Error("OpenAPI generation finished without creating types.gen.ts.");
}
