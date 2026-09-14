#!/usr/bin/env node
/** Read-only smoke for the explicitly imported original prototype demo. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:3000";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const email = "developer@program-assurance.local";
const password = "local-program-assurance";
const manifest = JSON.parse(
  readFileSync(new URL("../supabase/demo/manifest.json", import.meta.url)),
);
const dockerEnv = {
  ...process.env,
  DOCKER_HOST: `unix://${join(homedir(), ".colima", "program-assurance", "docker.sock")}`,
};
for (const key of ["DOCKER_CONTEXT", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"])
  delete dockerEnv[key];
let status;
try {
  status = JSON.parse(
    execFileSync("supabase", ["status", "--output", "json"], {
      env: dockerEnv,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
} catch {
  throw new Error("Cannot read the dedicated local Supabase status. Start the local stack first.");
}
assert.equal(new URL(status.API_URL).hostname, "127.0.0.1");
assert.equal(new URL(status.API_URL).port, "54321");
// No administrator client, workspace provisioning, fixture writes, or cleanup.
const client = createClient(status.API_URL, status.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const signedIn = await client.auth.signInWithPassword({ email, password });
assert.ifError(signedIn.error);
assert.ok(signedIn.data.user);

async function rows(table, columns, filters = {}) {
  let query = client.from(table).select(columns);
  for (const [key, value] of Object.entries(filters)) query = query.eq(key, value);
  const result = await query.order("id").range(0, 999);
  assert.ifError(result.error);
  assert.ok(result.data.length < 1000, `${table}: narrow this smoke query before it is truncated`);
  return result.data;
}
const tenants = await rows("tenants", "id,name", {
  personal_owner_id: signedIn.data.user.id,
});
assert.equal(tenants.length, 1, "An existing local developer workspace is required");
const tenantId = tenants[0].id;
const batches = await rows("demo_import_batches", "id,dataset_id,fixture_sha256,imported_at", {
  tenant_id: tenantId,
  fixture_sha256: manifest.sha256,
});
assert.equal(batches.length, 1, "The current demo fixture must have a committed import batch");
const batchId = batches[0].id;

async function ledger(table) {
  return rows("demo_import_records", "destination_id,source_key,source_pointer", {
    tenant_id: tenantId,
    import_batch_id: batchId,
    destination_table: table,
  });
}
async function record(table, id, columns = "*") {
  const result = await client.from(table).select(columns).eq("id", id).single();
  assert.ifError(result.error);
  return result.data;
}
async function sample(table, entries) {
  assert.ok(entries.length > 0, `${table}: imported records are required`);
  return record(table, entries[0].destination_id);
}
const tables = [
  "programs",
  "engineering_requirements",
  "implemented_requirements",
  "evidence_artifacts",
  "operational_issues",
  "observations",
  "parties",
  "risks",
  "assessment_campaigns",
  "tasks",
];
const imported = Object.fromEntries(
  await Promise.all(tables.map(async (t) => [t, await ledger(t)])),
);
for (const [table, sourceCount] of [
  ["programs", manifest.counts.programs],
  ["engineering_requirements", manifest.counts.requirements],
  ["evidence_artifacts", manifest.counts.evidence],
  ["assessment_campaigns", manifest.counts.campaigns],
  ["tasks", manifest.counts.tasks],
])
  assert.equal(imported[table].length, sourceCount, `${table}: source coverage`);
const vendors = imported.parties.filter((row) => row.source_pointer?.startsWith("/vendors/"));
assert.equal(
  vendors.length,
  manifest.counts.vendors,
  "All original supplier organizations are imported",
);
const seededRequirements = await rows("engineering_requirements", "id,code,program_id", {
  tenant_id: tenantId,
});
const requirementIds = new Set(imported.engineering_requirements.map((row) => row.destination_id));
const requirement = seededRequirements.find((row) => requirementIds.has(row.id));
assert.ok(requirement, "A seeded program requirement is present");
const program = await record("programs", requirement.program_id);
assert.ok(imported.programs.some((row) => row.destination_id === program.id));
const evidence = await sample("evidence_artifacts", imported.evidence_artifacts);
const issue = await sample("operational_issues", imported.operational_issues);
const observation = await sample("observations", imported.observations);
const vendor = await sample("parties", vendors);
const risk = await sample("risks", imported.risks);
const campaign = await sample("assessment_campaigns", imported.assessment_campaigns);
const task = await sample("tasks", imported.tasks);
const implementation = await sample("implemented_requirements", imported.implemented_requirements);
const selected = await record("selected_controls", implementation.selected_control_id);
const control = await record("controls", selected.control_id);
const ssp = await record("ssp_revisions", implementation.ssp_revision_id);
const system = await record("systems", ssp.system_id);
const controlProgram = await record("programs", system.program_id);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
context.setDefaultTimeout(45000);
const page = await context.newPage();
const pageErrors = [];
const prohibitedWrites = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
// These two RPCs are the app's ordinary authenticated workspace bootstrap.
// The tenant already exists above; no domain creation or editing is permitted.
const bootstrapRpcs = new Set(["/rest/v1/rpc/ensure_personal_tenant", "/rest/v1/rpc/app_schema"]);
await context.route("**/rest/v1/**", async (route) => {
  const request = route.request();
  const pathname = new URL(request.url()).pathname;
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method()) && !bootstrapRpcs.has(pathname)) {
    prohibitedWrites.push(`${request.method()} ${pathname}`);
    await route.abort("blockedbyclient");
    return;
  }
  await route.continue();
});
const checks = [];
async function healthy() {
  assert.deepEqual(pageErrors, [], "No browser runtime errors");
  assert.deepEqual(prohibitedWrites, [], "The walkthrough must not issue domain writes");
  assert.doesNotMatch(
    await page.locator("main").innerText(),
    /Page not found|Workspace unavailable|permission denied|relation .* does not exist/i,
  );
}
async function visit(path, heading) {
  await page.goto(`${origin}${path}`);
  await page.locator("main").getByRole("heading", { name: heading, exact: true }).first().waitFor();
  await healthy();
}
async function find(search, value) {
  assert.equal(typeof value, "string");
  assert.ok(value.trim());
  await page.getByPlaceholder(search, { exact: true }).fill(value);
  await page.locator("main").getByRole("cell", { name: value, exact: true }).first().waitFor();
  await healthy();
}
async function capture(name) {
  await page.screenshot({
    path: `/tmp/program-assurance-demo-${name}.png`,
    fullPage: !name.endsWith("-unfiltered"),
    animations: "disabled",
  });
  checks.push(name);
  console.log(`PASS ${name}`);
}

try {
  await page.goto(`${origin}/programs`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.locator("main").getByRole("heading", { name: "Programs", exact: true }).waitFor();
  await find("Find programs", program.name);
  await capture("programs");
  await page.getByPlaceholder("Find programs", { exact: true }).clear();
  await page.locator("main").getByRole("row").nth(2).waitFor();
  await capture("programs-unfiltered");

  await visit(`/programs/${program.id}`, program.name);
  await page.getByRole("tab", { name: /^Requirements/ }).click();
  await page.getByPlaceholder("Find a requirement", { exact: true }).fill(requirement.code);
  await page.getByRole("link", { name: requirement.code, exact: true }).first().waitFor();
  await capture("requirements");

  await visit(`/programs/${controlProgram.id}`, controlProgram.name);
  await page.getByRole("tab", { name: "Controls", exact: true }).click();
  await find("Find implemented requirements", control.code);
  await capture("controls");

  await visit("/evidence", "Evidence");
  await find("Find evidence", evidence.title);
  await capture("evidence");
  await page.getByPlaceholder("Find evidence", { exact: true }).clear();
  await page.locator("main").getByRole("row").nth(2).waitFor();
  await capture("evidence-unfiltered");

  await visit("/findings", "Findings & assets");
  await page.getByRole("tab", { name: "Operational issues", exact: true }).click();
  await find("Search operational issues", issue.title);
  await capture("issues");
  await page.getByRole("tab", { name: "Observations", exact: true }).click();
  await find("Search observations", observation.title);
  await capture("observations");
  await page
    .locator("main")
    .getByRole("cell", { name: observation.title, exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("heading", { name: observation.title, exact: true })
    .waitFor();
  await capture("observation-detail");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });

  await visit("/vendors", "Supplier registry");
  await find("Search organizations", vendor.name);
  await capture("suppliers");

  await visit("/risks", "Risk register");
  await find("Search risks", risk.title);
  await capture("risks");

  await visit("/campaigns", "Test campaigns");
  await find("Find campaigns", campaign.title);
  await capture("campaigns");

  await visit("/work", "My work");
  await page.getByRole("button", { name: "Saved questions", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /^All tasks/ }).click();
  await find("Find tasks", task.title);
  await capture("all-tasks");
  await healthy();
  console.log(
    JSON.stringify(
      {
        checks,
        importedRecords: {
          ...Object.fromEntries(
            tables.filter((t) => t !== "parties").map((t) => [t, imported[t].length]),
          ),
          supplierOrganizations: vendors.length,
        },
        domainWrites: prohibitedWrites.length,
        screenshots: "/tmp/program-assurance-demo-*.png",
      },
      null,
      2,
    ),
  );
} catch (error) {
  await page
    .screenshot({ path: "/tmp/program-assurance-demo-failure.png", fullPage: true })
    .catch(() => {});
  throw error;
} finally {
  await context.close();
  await browser.close();
}
