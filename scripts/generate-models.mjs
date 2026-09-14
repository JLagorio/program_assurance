#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
const project = fileURLToPath(new URL("../", import.meta.url));
const env = {
  ...process.env,
  DOCKER_HOST: `unix://${join(homedir(), ".colima", "program-assurance", "docker.sock")}`,
};
for (const key of ["DOCKER_CONTEXT", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"]) delete env[key];
const source = execFileSync(
  "supabase",
  [
    "gen",
    "types",
    "typescript",
    "--local",
    "--schema",
    "public",
    "--network-id",
    "program-assurance-local",
  ],
  { cwd: project, env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000 },
);
if (!source.includes("export type Database"))
  throw new Error("Supabase did not return TypeScript database models.");
const destination = join(project, "src/lib/database.types.ts");
writeFileSync(
  destination,
  await format(source, { ...(await resolveConfig(destination)), parser: "typescript" }),
);
console.log("Generated TypeScript models from the local Supabase schema.");
