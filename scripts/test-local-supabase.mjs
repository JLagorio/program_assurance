#!/usr/bin/env node
/**
 * Exercise normalized records through real Auth sessions and PostgREST.
 * Creates disposable test accounts and records; removes only those records in finally.
 * Run after starting Supabase and generating .env.local:
 *   node scripts/test-local-supabase.mjs
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const projectDir = fileURLToPath(new URL("../", import.meta.url));
const envPath = new URL("../.env.local", import.meta.url);
let appEnv;
try {
  appEnv = { ...parseEnv(readFileSync(envPath, "utf8")), ...process.env };
} catch {
  throw new Error("Generate .env.local for the local Supabase app before running this check.");
}

function localUrl(value, label) {
  const url = new URL(value);
  assert.equal(url.protocol, "http:", `${label} must use local HTTP.`);
  assert.ok(
    ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname),
    `${label} must point to a loopback address; this test does not run against hosted projects.`,
  );
  assert.equal(url.username + url.password, "", `${label} must not contain credentials.`);
  return url;
}

const apiUrl = localUrl(appEnv.VITE_SUPABASE_URL, "VITE_SUPABASE_URL");
const dockerHost = `unix://${join(homedir(), ".colima", "program-assurance", "docker.sock")}`;
const dockerEnv = { ...process.env, DOCKER_HOST: dockerHost };
delete dockerEnv.DOCKER_CONTEXT;
delete dockerEnv.DOCKER_TLS_VERIFY;
delete dockerEnv.DOCKER_CERT_PATH;
let status;
try {
  // Capture keys without printing CLI output or adding the service key to an env file.
  status = JSON.parse(
    execFileSync("supabase", ["status", "--output", "json"], {
      cwd: projectDir,
      env: dockerEnv,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    }),
  );
} catch {
  throw new Error(
    "Cannot read local Supabase status. Start this project's stack and check Docker/Colima.",
  );
}
const statusUrl = localUrl(status.API_URL, "Supabase status API_URL");
assert.equal(
  apiUrl.port,
  statusUrl.port,
  "The app and CLI must use the same local Supabase API port.",
);
const anonKey =
  appEnv.VITE_SUPABASE_ANON_KEY ?? appEnv.VITE_SUPABASE_PUBLISHABLE_KEY ?? status.ANON_KEY;
const serviceKey = status.SERVICE_ROLE_KEY;
assert.ok(anonKey && serviceKey, "Local Supabase status must provide API and service-role keys.");

const created = [];
const runId = randomUUID();
let testTenantId;
const headersFor = (token = anonKey, key = anonKey) => ({
  apikey: key,
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});
async function request(path, { token, key, method = "GET", body, headers } = {}) {
  const response = await fetch(new URL(path, apiUrl), {
    method,
    headers: { ...headersFor(token, key), ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { ok: response.ok, status: response.status, data };
}
function succeeded(result, label) {
  const message = result.data?.msg ?? result.data?.message ?? result.data?.error_description;
  assert.ok(
    result.ok,
    `${label} failed: HTTP ${result.status}${result.data?.code ? ` (${result.data.code})` : ""}.${typeof message === "string" ? ` ${message}` : ""}`,
  );
  return result.data;
}
async function signIn(account) {
  const data = succeeded(
    await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email: account.email, password: account.password },
    }),
    "Temporary account sign-in",
  );
  assert.ok(data.access_token, "Sign-in must return a session.");
  return data.access_token;
}
async function createAccount(suffix) {
  const account = {
    email: `schema-integration-${runId}-${suffix}@example.test`,
    password: `Aa1!${randomUUID()}`,
  };
  const data = succeeded(
    await request("/auth/v1/admin/users", {
      method: "POST",
      key: serviceKey,
      token: serviceKey,
      body: { ...account, email_confirm: true },
    }),
    "Temporary account creation",
  );
  assert.ok(data.id);
  account.id = data.id;
  created.push(account);
  account.token = await signIn(account);
  return account;
}
const rest = (table, query = "") => `/rest/v1/${table}${query ? `?${query}` : ""}`;
const change = (table, token, method, body, query = "") =>
  request(rest(table, query), {
    method,
    token,
    body,
    headers: { Prefer: "return=representation" },
  });
const select = async (table, token, query = "") =>
  succeeded(await request(rest(table, query), { token }), `${table} read`);

async function verify() {
  const owner = await createAccount("owner");
  const outsider = await createAccount("outsider");
  const viewer = await createAccount("viewer");
  testTenantId = succeeded(
    await request("/rest/v1/rpc/ensure_personal_tenant", {
      token: owner.token,
      method: "POST",
      body: {},
    }),
    "Create actual identity workspace",
  );
  assert.match(testTenantId, /^[0-9a-f-]{36}$/);
  const again = succeeded(
    await request("/rest/v1/rpc/ensure_personal_tenant", {
      token: owner.token,
      method: "POST",
      body: {},
    }),
    "Reuse identity workspace",
  );
  assert.equal(again, testTenantId);
  assert.deepEqual(await select("programs", owner.token, `tenant_id=eq.${testTenantId}`), []);
  const identity = await select(
    "parties",
    owner.token,
    `tenant_id=eq.${testTenantId}&auth_user_id=eq.${owner.id}`,
  );
  assert.equal(identity.length, 1);
  assert.equal(identity[0].email, owner.email);
  console.log(
    "PASS: new workspaces have only the authenticated identity and no fictional programs.",
  );

  const metadata = succeeded(
    await request("/rest/v1/rpc/app_schema", { token: owner.token, method: "POST", body: {} }),
    "Database schema metadata",
  );
  assert.ok(Array.isArray(metadata));
  assert.ok(metadata.length >= 100, "The complete normalized schema must be exposed.");
  const programMetadata = metadata.find((row) => row.name === "programs");
  assert.deepEqual(
    programMetadata.columns.find((column) => column.name === "status").choices.toSorted(),
    ["active", "closed", "planned", "suspended"],
  );
  const modelMetadata = metadata
    .find((row) => row.name === "oscal_documents")
    .columns.find((column) => column.name === "model");
  assert.ok(modelMetadata.choices.includes("assessment-results"));
  assert.ok(!metadata.some((row) => row.name === "workspace_snapshots"));
  console.log("PASS: forms receive actual database constraints, enumerations and foreign keys.");

  const initial = succeeded(
    await change("programs", owner.token, "POST", {
      tenant_id: testTenantId,
      code: `INTEGRATION-${runId}`,
      name: `Disposable database integration record ${runId}`,
      status: "planned",
      description: "Temporary record created by the local database integration test.",
    }),
    "Program creation",
  )[0];
  assert.equal(initial.revision, 1);
  assert.equal(initial.created_by, owner.id);
  const programId = initial.id;
  const programQuery = `id=eq.${programId}`;
  const freshToken = await signIn(owner);
  assert.deepEqual(await select("programs", freshToken, programQuery), [initial]);
  const invalidStatus = await change(
    "programs",
    freshToken,
    "PATCH",
    { status: "invented-value", revision: 2 },
    `${programQuery}&revision=eq.1`,
  );
  assert.equal(invalidStatus.ok, false);
  assert.equal(invalidStatus.data?.code, "23514");
  const saved = succeeded(
    await change(
      "programs",
      freshToken,
      "PATCH",
      { status: "active", revision: 2 },
      `${programQuery}&revision=eq.1`,
    ),
    "Program status update",
  )[0];
  assert.equal(saved.revision, 2);
  assert.equal(saved.status, "active");
  const stale = succeeded(
    await change(
      "programs",
      freshToken,
      "PATCH",
      { status: "suspended", revision: 2 },
      `${programQuery}&revision=eq.1`,
    ),
    "Filtered stale write",
  );
  assert.deepEqual(stale, [], "A stale filter must never update an existing row.");
  const staleBody = await change(
    "programs",
    freshToken,
    "PATCH",
    { status: "suspended", revision: 2 },
    programQuery,
  );
  assert.equal(staleBody.status, 409);
  assert.equal(staleBody.data?.code, "PT409");
  const attempts = await Promise.all(
    ["suspended", "closed"].map((status) =>
      change(
        "programs",
        freshToken,
        "PATCH",
        { status, revision: 3 },
        `${programQuery}&revision=eq.2`,
      ),
    ),
  );
  const writes = attempts.map((attempt) => succeeded(attempt, "Concurrent program update"));
  assert.equal(writes.filter((rows) => rows.length === 1).length, 1);
  assert.equal(writes.filter((rows) => rows.length === 0).length, 1);
  const final = (await select("programs", freshToken, programQuery))[0];
  assert.equal(final.revision, 3);
  console.log(
    "PASS: persisted records survive a fresh session; invalid values, stale edits and concurrent overwrites are rejected.",
  );

  assert.deepEqual(await select("programs", outsider.token, programQuery), []);
  assert.deepEqual(
    succeeded(
      await change(
        "programs",
        outsider.token,
        "PATCH",
        { name: "forbidden", revision: 4 },
        programQuery,
      ),
      "Outsider filtered write",
    ),
    [],
  );
  const outsiderInsert = await change("programs", outsider.token, "POST", {
    tenant_id: testTenantId,
    code: `FORBIDDEN-${runId}`,
    name: "forbidden",
  });
  assert.equal(outsiderInsert.ok, false);
  assert.equal(outsiderInsert.data?.code, "42501");
  succeeded(
    await change("tenant_memberships", owner.token, "POST", {
      tenant_id: testTenantId,
      user_id: viewer.id,
      role: "viewer",
    }),
    "Viewer membership creation",
  );
  assert.deepEqual(await select("programs", viewer.token, programQuery), [final]);
  assert.deepEqual(
    succeeded(
      await change(
        "programs",
        viewer.token,
        "PATCH",
        { name: "forbidden", revision: 4 },
        programQuery,
      ),
      "Viewer filtered write",
    ),
    [],
  );
  const viewerInsert = await change("programs", viewer.token, "POST", {
    tenant_id: testTenantId,
    code: `FORBIDDEN-VIEWER-${runId}`,
    name: "forbidden",
  });
  assert.equal(viewerInsert.ok, false);
  assert.equal(viewerInsert.data?.code, "42501");
  await change(
    "tenant_memberships",
    viewer.token,
    "PATCH",
    { role: "owner" },
    `tenant_id=eq.${testTenantId}&user_id=eq.${viewer.id}`,
  );
  assert.equal(
    (
      await select(
        "tenant_memberships",
        owner.token,
        `tenant_id=eq.${testTenantId}&user_id=eq.${viewer.id}`,
      )
    )[0].role,
    "viewer",
  );
  assert.deepEqual(await select("programs", owner.token, programQuery), [final]);
  console.log(
    "PASS: tenant isolation and viewer permissions prevent reads, writes and role escalation outside authorization.",
  );

  const orphan = await change("systems", owner.token, "POST", {
    tenant_id: testTenantId,
    program_id: randomUUID(),
    code: `ORPHAN-${runId}`,
    name: "Temporary invalid FK assertion",
    system_type: "information_system",
  });
  assert.equal(orphan.ok, false);
  assert.equal(orphan.data?.code, "23503");
  const controls = await select(
    "controls",
    owner.token,
    "select=id,code,title,revision,tenant_id&limit=1",
  );
  assert.equal(controls.length, 1, "Run npm run seed:reference first.");
  assert.equal(controls[0].tenant_id, null);
  const controlQuery = `id=eq.${controls[0].id}&select=id,code,title,revision,tenant_id`;
  await change(
    "controls",
    owner.token,
    "PATCH",
    { title: "forbidden", revision: controls[0].revision + 1 },
    controlQuery,
  );
  assert.deepEqual(await select("controls", owner.token, controlQuery), controls);
  const refInsert = await change("ref_sources", owner.token, "POST", {
    tenant_id: null,
    code: `FORBIDDEN-${runId}`,
    title: "forbidden",
    authority: "forbidden",
    source_uri: "https://example.test",
    authoritative: false,
  });
  assert.equal(refInsert.ok, false);
  assert.equal(refInsert.data?.code, "42501");
  const anonymousRead = await request(rest("programs"));
  assert.equal(anonymousRead.ok, false);
  assert.ok([401, 403].includes(anonymousRead.status));
  const anonymousWrite = await change("programs", undefined, "POST", {
    tenant_id: testTenantId,
    code: `ANON-${runId}`,
    name: "forbidden",
  });
  assert.equal(anonymousWrite.ok, false);
  assert.ok([401, 403].includes(anonymousWrite.status));
  const retired = await request("/rest/v1/rpc/save_workspace_snapshot", {
    token: owner.token,
    method: "POST",
    body: { expected_revision: 0, snapshot: {} },
  });
  assert.equal(retired.ok, false);
  console.log(
    "PASS: foreign keys, shared reference protections, anonymous denial and snapshot retirement are enforced over HTTP.",
  );
}

try {
  await verify();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Local Supabase verification failed.");
  process.exitCode = 1;
} finally {
  if (testTenantId) {
    try {
      // Exact generated tenant ID only. Delete temporary dependent records before
      // the tenant, then Auth accounts; no existing user workspace is touched.
      const remaining = execFileSync(
        "docker",
        [
          "exec",
          "-i",
          "supabase_db_program-assurance",
          "psql",
          "-X",
          "-q",
          "-t",
          "-A",
          "-v",
          "ON_ERROR_STOP=1",
          "-v",
          `tenant_id=${testTenantId}`,
          "-U",
          "postgres",
          "-d",
          "postgres",
        ],
        {
          env: dockerEnv,
          encoding: "utf8",
          timeout: 30_000,
          stdio: ["pipe", "pipe", "pipe"],
          input:
            "begin; delete from public.programs where tenant_id = :'tenant_id'::uuid; delete from public.tenants where id = :'tenant_id'::uuid; commit; select count(*) from public.tenants where id = :'tenant_id'::uuid;\n",
        },
      );
      assert.equal(remaining.trim(), "0");
    } catch (error) {
      console.error(`Temporary tenant cleanup failed for ${testTenantId}: ${error.message}`);
      process.exitCode = 1;
    }
  }
  for (const account of created) {
    try {
      succeeded(
        await request(`/auth/v1/admin/users/${account.id}`, {
          method: "DELETE",
          key: serviceKey,
          token: serviceKey,
        }),
        "Temporary account cleanup",
      );
      const remaining = await request(`/auth/v1/admin/users/${account.id}`, {
        key: serviceKey,
        token: serviceKey,
      });
      assert.equal(remaining.status, 404);
    } catch {
      console.error(`Temporary account cleanup failed for ${account.id} (${account.email}).`);
      process.exitCode = 1;
    }
  }
  if (!process.exitCode)
    console.log(
      "PASS: all disposable test records, tenant memberships and Auth accounts were removed.",
    );
}
