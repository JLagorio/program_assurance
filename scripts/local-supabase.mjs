#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const profile = "program-assurance";
const network = "program-assurance-local";
const developerEmail = "developer@program-assurance.local";
const developerPassword = "local-program-assurance";

// Target this VM regardless of the user's active Docker context.
const dockerEnv = {
  ...process.env,
  DOCKER_HOST: `unix://${join(homedir(), ".colima", profile, "docker.sock")}`,
  SUPABASE_SERVICES_HOSTNAME: "127.0.0.1",
};
delete dockerEnv.DOCKER_CONTEXT;
delete dockerEnv.DOCKER_TLS_VERIFY;
delete dockerEnv.DOCKER_CERT_PATH;

function run(command, args, { capture = false, quiet = false, env = dockerEnv } = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env,
      stdio: ["inherit", capture ? "pipe" : quiet ? "ignore" : "inherit", "inherit"],
    });
    let output = "";
    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", (error) => {
      reject(
        new Error(
          error.code === "ENOENT"
            ? `${command} is not installed. See the local development prerequisites in README.md.`
            : `Could not run ${command}: ${error.message}`,
        ),
      );
    });
    child.on("close", (code, signal) => {
      if (code === 0) resolveRun(output);
      else reject(new Error(`${command} ${args.join(" ")} failed (${signal ?? code}).`));
    });
  });
}

function supabase(args, options) {
  return run("supabase", [...args, "--workdir", projectRoot, "--network-id", network], options);
}

async function ensureLocalNetwork() {
  const existing = await run(
    "docker",
    ["network", "ls", "--filter", `name=^${network}$`, "--format", "{{.Name}}"],
    { capture: true },
  );
  if (!existing.trim()) {
    await run(
      "docker",
      [
        "network",
        "create",
        "--driver",
        "bridge",
        "--opt",
        "com.docker.network.bridge.host_binding_ipv4=127.0.0.1",
        network,
      ],
      { quiet: true },
    );
  }
  const configuration = JSON.parse(
    await run("docker", ["network", "inspect", network], { capture: true }),
  )[0];
  if (
    configuration?.Driver !== "bridge" ||
    configuration?.Options?.["com.docker.network.bridge.host_binding_ipv4"] !== "127.0.0.1"
  ) {
    throw new Error(
      `${network} must be a bridge with host_binding_ipv4=127.0.0.1. Check its Docker network settings before starting.`,
    );
  }
}

async function verifyLocalBindings() {
  const names = await run(
    "docker",
    ["ps", "--filter", `network=${network}`, "--format", "{{.Names}}"],
    { capture: true },
  );
  const containers = names.trim().split(/\r?\n/).filter(Boolean);
  if (
    !containers.includes(`supabase_kong_${profile}`) ||
    !containers.includes(`supabase_db_${profile}`)
  ) {
    throw new Error(
      "The running stack uses a different Docker network. Run npm run local:stop, then npm run local:start to apply loopback binding; data is retained.",
    );
  }
  for (const container of containers) {
    const ports = JSON.parse(
      await run("docker", ["inspect", container, "--format", "{{json .NetworkSettings.Ports}}"], {
        capture: true,
      }),
    );
    if (
      Object.values(ports ?? {})
        .flat()
        .some((binding) => binding && !["127.0.0.1", "::1"].includes(binding.HostIp))
    ) {
      throw new Error(
        `${container} has a published port outside loopback. Stop this stack and check its Docker network configuration.`,
      );
    }
  }
}

async function localStatus() {
  const output = await supabase(["status", "-o", "env"], { capture: true });
  const values = {};
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    values[key] = raw.startsWith('"') ? JSON.parse(raw) : raw.replace(/^'|'$/g, "");
  }
  const apiUrl = values.API_URL ?? values.SUPABASE_URL;
  const publicKey = values.ANON_KEY ?? values.PUBLISHABLE_KEY;
  const adminKey = values.SERVICE_ROLE_KEY ?? values.SECRET_KEY;
  if (!apiUrl || !publicKey || !adminKey) {
    // Never include status output in this error: it contains server credentials.
    throw new Error(
      "Supabase status did not return API_URL and public/admin keys. Use the CLI version documented in README.md.",
    );
  }
  const url = new URL(apiUrl);
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.port !== "54321" ||
    url.username ||
    url.password
  ) {
    throw new Error(
      "Refusing to provision an account outside the local Supabase API on port 54321.",
    );
  }
  return { apiUrl: url.origin, publicKey, adminKey };
}

async function authAdmin(status, path, options = {}) {
  const response = await fetch(`${status.apiUrl}/auth/v1/admin/${path}`, {
    ...options,
    headers: {
      apikey: status.adminKey,
      Authorization: `Bearer ${status.adminKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  if (!response.ok) {
    throw new Error(
      `Local Auth account provisioning failed (${response.status}). Check local Supabase Auth logs.`,
    );
  }
  return response.json();
}

async function provisionDeveloper(status) {
  // Find first; never recreate an existing account or replace its workspace.
  for (let page = 1; ; page += 1) {
    const data = await authAdmin(status, `users?page=${page}&per_page=100`);
    if (!Array.isArray(data.users)) throw new Error("Unexpected local Auth users response.");
    if (data.users.some((user) => user.email === developerEmail)) return;
    if (data.users.length < 100) break;
  }
  await authAdmin(status, "users", {
    method: "POST",
    body: JSON.stringify({
      email: developerEmail,
      password: developerPassword,
      email_confirm: true,
      user_metadata: { name: "Local developer" },
    }),
  });
}

async function writeLocalEnv(status) {
  const envPath = join(projectRoot, ".env.local");
  let existing = "";
  try {
    existing = await readFile(envPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const managed = {
    VITE_SUPABASE_URL: status.apiUrl,
    VITE_SUPABASE_ANON_KEY: status.publicKey,
  };
  const retained = existing
    .split(/\r?\n/)
    .filter((line) => {
      const key = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=/)?.[1];
      return key !== "VITE_DATA_BACKEND" && !Object.hasOwn(managed, key);
    })
    .join("\n")
    .trimEnd();
  const block = Object.entries(managed)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n");
  const temporary = `${envPath}.tmp.local`;
  await writeFile(temporary, `${retained ? `${retained}\n\n` : ""}${block}\n`, { mode: 0o600 });
  await rename(temporary, envPath);
}

function printStatus(status) {
  console.log(`Supabase API: ${status.apiUrl}`);
  console.log("Supabase Studio: http://127.0.0.1:54323");
  console.log("Local mail: http://127.0.0.1:54324");
  console.log(`Colima profile: ${profile}`);
}

async function main() {
  const [command, ...flags] = process.argv.slice(2);
  if (
    !["start", "stop", "status", "reset"].includes(command) ||
    flags.some((flag) => command !== "reset" || flag !== "--yes")
  ) {
    throw new Error("Usage: node scripts/local-supabase.mjs start|stop|status|reset [--yes]");
  }
  if (command === "reset" && !flags.includes("--yes")) {
    throw new Error(
      "Reset deletes all local users and workspaces. To deliberately reset: npm run local:reset -- --yes",
    );
  }
  if (command === "stop") {
    await supabase(["stop", "--project-id", profile], { quiet: true });
    await run("colima", ["stop", profile]);
    console.log("Local Supabase and Colima stopped. Database volumes are preserved.");
    return;
  }
  if (command === "status") {
    await run("colima", ["status", "--profile", profile]);
    printStatus(await localStatus());
    return;
  }
  if (command === "start") {
    await run("colima", [
      "start",
      profile,
      "--runtime",
      "docker",
      "--activate=false",
      "--cpus",
      "4",
      "--memory",
      "8",
      "--disk",
      "60",
      "--network-address=false",
      "--network-host-addresses=false",
    ]);
    await ensureLocalNetwork();
    console.log("Starting local Supabase; first startup downloads container images.");
    await supabase(["start", "--exclude", "vector"], { quiet: true });
    await verifyLocalBindings();
    await supabase(["migration", "up", "--local"]);
  } else {
    // Explicit --local prevents a linked cloud project from being reset.
    await supabase(["db", "reset", "--local", "--yes"]);
  }
  await run(process.execPath, [join(projectRoot, "scripts", "seed-reference.mjs")]);
  const status = await localStatus();
  await provisionDeveloper(status);
  await writeLocalEnv(status);
  printStatus(status);
  console.log(`Sign in as ${developerEmail} with password ${developerPassword}`);
  console.log(
    "Wrote public connection settings to .env.local. Start/restart the app with npm run dev.",
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
