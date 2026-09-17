import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { localDockerEnv } from "./local-docker-env.mjs";

assert.equal(process.env.CI, "true", "This writes connection settings only in the CI checkout.");
const status = JSON.parse(
  execFileSync("supabase", ["status", "--output", "json"], {
    env: localDockerEnv(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
assert.equal(status.API_URL, "http://127.0.0.1:54321");
assert.equal(typeof status.ANON_KEY, "string");
// Only public browser configuration is written; server credentials never enter Vite's environment.
writeFileSync(
  ".env.local",
  `VITE_SUPABASE_URL=${status.API_URL}\nVITE_SUPABASE_ANON_KEY=${status.ANON_KEY}\n`,
  { flag: "wx" },
);
console.log("Prepared public local connection settings for browser checks.");
