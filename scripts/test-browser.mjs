#!/usr/bin/env node
/** Real browser CRUD/file checks using one disposable local Auth account. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const dockerEnv = {
  ...process.env,
  DOCKER_HOST: `unix://${join(homedir(), ".colima", "program-assurance", "docker.sock")}`,
};
for (const key of ["DOCKER_CONTEXT", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"])
  delete dockerEnv[key];
const status = JSON.parse(
  execFileSync("supabase", ["status", "--output", "json"], {
    env: dockerEnv,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const api = new URL(status.API_URL);
assert.equal(api.hostname, "127.0.0.1");
const origin = process.env.APP_TEST_URL || "http://127.0.0.1:3000";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const admin = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const run = randomUUID();
const email = `browser-${run}@example.test`;
const password = `Aa1!${randomUUID()}`;
const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
assert.ifError(createError);
const userId = created.user.id;
const client = createClient(status.API_URL, status.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const signIn = await client.auth.signInWithPassword({ email, password });
assert.ifError(signIn.error);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  acceptDownloads: true,
});
context.setDefaultTimeout(45000);
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
let tenantId;
const cleanupErrors = [];
const fileBytes = Buffer.from(`Recorded browser integration evidence ${run}\n`);
async function login(p) {
  await p.goto(`${origin}/schema`);
  await p.getByLabel("Email", { exact: true }).fill(email);
  await p.getByLabel("Password", { exact: true }).fill(password);
  await p.getByRole("button", { name: "Sign in", exact: true }).click();
  await p.getByRole("heading", { name: "Schema inspector" }).waitFor();
}
const nouns = {
  programs: "program",
  systems: "system",
  evidence_artifacts: "evidence artifact",
  evidence_versions: "evidence version",
};
async function action(p, name) {
  await p.getByRole("button", { name: "Actions", exact: true }).click();
  await p.getByRole("menuitem", { name, exact: true }).click();
}
async function form(collection, search = "") {
  await page.goto(`${origin}/records/${collection}/new${search}`);
  await page.getByRole("button", { name: `Create ${nouns[collection]}`, exact: true }).waitFor();
}
/**
 * A form control by its accessible name. A required label ends in an asterisk hidden from
 * assistive technology, so getByLabel (label text) would read "Code*"; the name is "Code".
 */
function control(label, p = page) {
  const named = (role) => p.getByRole(role, { name: label, exact: true });
  return named("textbox").or(named("spinbutton")).or(named("combobox"));
}
/** A required control announces the requirement itself (aria-required). */
async function required(label, p = page) {
  const field = control(label, p);
  assert.equal(await field.getAttribute("aria-required"), "true", `${label} is required`);
  return field;
}
async function choice(label, text, { isRequired = false } = {}) {
  if (isRequired) await required(label);
  await control(label).click();
  await page.getByRole("option", { name: text, exact: true }).click();
}
async function save(collection) {
  await page.getByRole("button", { name: `Create ${nouns[collection]}`, exact: true }).click();
  await page.waitForURL(new RegExp(`/records/${collection}/[0-9a-f-]{36}$`));
  await page.getByRole("button", { name: "Actions", exact: true }).waitFor();
  assert.equal(await page.getByRole("alert").count(), 0);
  return page.url().split("/").at(-1);
}
try {
  await login(page);
  const { data: members, error: memberError } = await client
    .from("tenant_memberships")
    .select("tenant_id")
    .eq("user_id", userId);
  assert.ifError(memberError);
  assert.equal(members.length, 1);
  tenantId = members[0].tenant_id;
  for (const table of ["programs", "systems", "operational_issues", "tasks"]) {
    const result = await client
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    assert.ifError(result.error);
    assert.equal(result.count, 0, `${table} starts empty`);
  }
  await form("programs");
  await (await required("Code")).fill(`BROWSER-${run.slice(0, 8)}`);
  await (await required("Name")).fill("Browser validation program");
  await choice("Status", "Active");
  const programId = await save("programs");
  await page.goto(`${origin}/programs/${programId}`);
  await page.getByRole("heading", { name: "Browser validation program", exact: true }).waitFor();
  await action(page, "Edit program");
  await control("Description").fill(
    "Saved through the original prototype using the Supabase model.",
  );
  await page.getByRole("button", { name: "Edit program", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const prototypeSave = await client
    .from("programs")
    .select("description")
    .eq("id", programId)
    .single();
  assert.ifError(prototypeSave.error);
  assert.equal(
    prototypeSave.data.description,
    "Saved through the original prototype using the Supabase model.",
  );
  await page.screenshot({ path: "/tmp/program-assurance-prototype.png", fullPage: true });
  await page.goto(`${origin}/records/programs/${programId}`);
  await page
    .getByText("Saved through the original prototype using the Supabase model.", { exact: true })
    .waitFor();
  await form("systems", `?field=program_id&value=${programId}`);
  await (await required("Code")).fill("VALIDATION-SYSTEM");
  await (await required("Name")).fill("Browser validation system");
  await choice("System type", "Information system", { isRequired: true });
  const systemId = await save("systems");
  await form("evidence_artifacts", `?field=program_id&value=${programId}`);
  await (await required("Title")).fill("Browser validation evidence");
  await choice("Artifact kind", "Document", { isRequired: true });
  const artifactId = await save("evidence_artifacts");
  await form("evidence_versions", `?field=artifact_id&value=${artifactId}`);
  await (await required("Version number")).fill("1");
  const versionId = await save("evidence_versions");
  await page
    .locator('input[type="file"]')
    .setInputFiles({ name: "validation.txt", mimeType: "text/plain", buffer: fileBytes });
  let rejectedMetadata = false;
  const metadataRoute = async (route) => {
    const request = route.request();
    if (
      !rejectedMetadata &&
      request.method() === "PATCH" &&
      request.postDataJSON()?.storage_object_id
    ) {
      rejectedMetadata = true;
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ code: "PT409", message: "Injected metadata save interruption" }),
      });
    } else await route.continue();
  };
  await page.route("**/rest/v1/evidence_versions?*", metadataRoute);
  await page.getByRole("button", { name: "Upload file", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "This record changed in another session" })
    .waitFor();
  assert.equal(rejectedMetadata, true);
  await page.getByRole("button", { name: "Recover uploaded file", exact: true }).click();
  await page.getByRole("button", { name: /^Download / }).waitFor();
  await page.unroute("**/rest/v1/evidence_versions?*", metadataRoute);
  const version = await client.from("evidence_versions").select("*").eq("id", versionId).single();
  assert.ifError(version.error);
  assert.equal(version.data.byte_size, fileBytes.length);
  assert.equal(version.data.sha256, createHash("sha256").update(fileBytes).digest("hex"));
  assert.ok(version.data.storage_object_id);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Download / }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const downloaded = [];
  for await (const chunk of stream) downloaded.push(chunk);
  assert.deepEqual(Buffer.concat(downloaded), fileBytes);
  await page.screenshot({ path: "/tmp/program-assurance-evidence.png", fullPage: true });
  await page.goto(`${origin}/records/programs/${programId}`);
  await action(page, "Edit program");
  await (await required("Name")).fill("Unsaved stale draft");
  const freshContext = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
  const fresh = await freshContext.newPage();
  await login(fresh);
  await fresh.goto(`${origin}/records/programs/${programId}`);
  await fresh.getByRole("heading", { name: "Browser validation program", exact: true }).waitFor();
  await action(fresh, "Edit program");
  await (await required("Name", fresh)).fill("Browser validation persisted");
  await fresh.getByRole("button", { name: "Edit program", exact: true }).click();
  await fresh.getByRole("heading", { name: "Browser validation persisted", exact: true }).waitFor();
  await freshContext.close();
  await page.bringToFront();
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await page.getByRole("button", { name: "Edit program", exact: true }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "This record changed in another session" })
    .waitFor();
  assert.equal(await control("Name").inputValue(), "Unsaved stale draft");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("alertdialog", { name: "Discard changes?" })
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await page.goto(`${origin}/records/programs/${programId}`);
  await page.getByRole("heading", { name: "Browser validation persisted", exact: true }).waitFor();
  await action(page, "Delete program");
  await page
    .getByRole("alertdialog", { name: "Delete program?" })
    .getByRole("button", { name: "Delete program", exact: true })
    .click();
  await page.getByRole("alert").filter({ hasText: "Related records still reference" }).waitFor();
  await page.goto(`${origin}/records/controls`);
  await page
    .getByRole("rowheader", { name: "Access Control Policy and Procedures", exact: true })
    .or(page.getByRole("cell", { name: "Access Control Policy and Procedures", exact: true }))
    .first()
    .waitFor({ timeout: 20000 })
    .catch(async () => {
      assert.equal(await page.getByRole("alert").count(), 0);
      assert.ok((await page.getByRole("row").count()) > 1);
    });
  await page.screenshot({ path: "/tmp/program-assurance-reference.png", fullPage: true });
  for (const path of [
    "/",
    "/work",
    "/programs",
    "/campaigns",
    "/findings",
    "/register",
    "/risks",
    "/packages",
    "/briefing",
    "/catalog",
    "/profiles",
    "/library/components",
    "/vendors",
    "/schema",
  ]) {
    await page.goto(`${origin}${path}`);
    await page.locator("main h1").first().waitFor();
    assert.doesNotMatch(
      await page.locator("main").innerText(),
      /Page not found|Page unavailable|Workspace unavailable|permission denied|does not exist/,
    );
    assert.equal(await page.getByRole("alert").count(), 0, path);
  }
  assert.deepEqual(pageErrors, []);
  console.log(
    "PASS: both prototype and schema views share actual models; prototype edit verified in schema; all navigation routes render; empty tenant; browser program/system/evidence creation; real controlled dropdowns; private file upload/interruption recovery/download and SHA-256; fresh-session persistence/edit/stale-draft retention; FK-protected delete; reference browsing; no browser errors.",
  );
} catch (error) {
  console.error("Browser check failed:", error.message);
  console.error("Visible form errors:", await page.getByRole("alert").allTextContents());
  console.error((await page.locator("body").innerText()).slice(0, 5000));
  await page.screenshot({ path: "/tmp/program-assurance-browser-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
  if (!tenantId) {
    const result = await client
      .from("tenant_memberships")
      .select("tenant_id")
      .eq("user_id", userId);
    tenantId = result.data?.[0]?.tenant_id;
  }
  if (tenantId) {
    const files = await client
      .from("evidence_versions")
      .select("storage_object_name")
      .eq("tenant_id", tenantId);
    try {
      execFileSync(
        "docker",
        [
          "exec",
          "-i",
          "supabase_db_program-assurance",
          "psql",
          "-X",
          "-q",
          "-v",
          "ON_ERROR_STOP=1",
          "-v",
          `tenant_id=${tenantId}`,
          "-U",
          "postgres",
          "-d",
          "postgres",
        ],
        {
          env: dockerEnv,
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
          input:
            "begin; delete from public.evidence_versions where tenant_id = :'tenant_id'::uuid; delete from public.evidence_artifacts where tenant_id = :'tenant_id'::uuid; delete from public.systems where tenant_id = :'tenant_id'::uuid; delete from public.programs where tenant_id = :'tenant_id'::uuid; delete from public.tenants where id = :'tenant_id'::uuid; commit;",
        },
      );
    } catch (error) {
      cleanupErrors.push(error.message);
    }
    const paths = (files.data ?? []).map((item) => item.storage_object_name).filter(Boolean);
    if (paths.length) {
      const result = await admin.storage.from("evidence").remove(paths);
      if (result.error) cleanupErrors.push(result.error.message);
    }
  }
  const removed = await admin.auth.admin.deleteUser(userId);
  if (removed.error) cleanupErrors.push(removed.error.message);
  assert.deepEqual(cleanupErrors, [], "Browser test cleanup");
  console.log("PASS: browser test account, workspace, records, and uploaded file removed.");
}
