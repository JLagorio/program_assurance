#!/usr/bin/env node
/** Read-only requirements interaction check against the existing local developer workspace. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:3000";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const env = {
  ...process.env,
  DOCKER_HOST: `unix://${join(homedir(), ".colima", "program-assurance", "docker.sock")}`,
};
for (const key of ["DOCKER_CONTEXT", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"]) delete env[key];
const status = JSON.parse(
  execFileSync("supabase", ["status", "--output", "json"], {
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
assert.equal(new URL(status.API_URL).hostname, "127.0.0.1");
assert.equal(new URL(status.API_URL).port, "54321");
const client = createClient(status.API_URL, status.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = "developer@program-assurance.local";
const password = "local-program-assurance";
const auth = await client.auth.signInWithPassword({ email, password });
assert.ifError(auth.error);
const requirements = await client
  .from("engineering_requirements")
  .select("id,program_id,code")
  .order("code")
  .range(0, 999);
assert.ifError(requirements.error);
assert.ok(requirements.data.length < 1000);
const [revisions, decompositions] = await Promise.all([
  client
    .from("requirement_revisions")
    .select("id,engineering_requirement_id,version_number,title,statement")
    .range(0, 999),
  client
    .from("requirement_decompositions")
    .select("parent_requirement_revision_id,child_requirement_revision_id")
    .range(0, 999),
]);
for (const result of [revisions, decompositions]) {
  assert.ifError(result.error);
  assert.ok(result.data.length < 1000);
}
const latest = new Map();
for (const revision of revisions.data) {
  const current = latest.get(revision.engineering_requirement_id);
  if (!current || current.version_number < revision.version_number)
    latest.set(revision.engineering_requirement_id, revision);
}
const byRevision = new Map(
  [...latest.values()].map((revision) => [
    revision.id,
    requirements.data.find((row) => row.id === revision.engineering_requirement_id),
  ]),
);
const currentDecomposition = decompositions.data.find(
  (link) =>
    byRevision.has(link.parent_requirement_revision_id) &&
    byRevision.has(link.child_requirement_revision_id),
);
const missingDetails = requirements.data.find((row) => !latest.has(row.id));
const countByProgram = new Map();
for (const row of requirements.data)
  countByProgram.set(row.program_id, (countByProgram.get(row.program_id) ?? 0) + 1);
const programId = [...countByProgram].sort((a, b) => b[1] - a[1])[0]?.[0];
assert.ok(programId, "Existing requirements are needed for this read-only check");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
context.setDefaultTimeout(45000);
// This browser is disposable. Verify obsolete columns are reconciled without erasing
// the reader's valid layout preferences; presets/filters are not persisted by this table.
const viewKey = "ledger.table.live-requirements-workspace.view";
await context.addInitScript(
  ({ key, expectedOrigin }) => {
    if (location.origin !== expectedOrigin) return;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(
      key,
      JSON.stringify({
        v: 1,
        order: ["state", "code", "version", "statement", "allocatedTo", "controlSources"],
        sizing: { code: 190, state: 140, version: 100 },
        visibility: {
          state: true,
          version: true,
          owner: false,
          requirementType: false,
          allocation: false,
          controlMapping: false,
        },
        pinning: { start: ["code"], end: ["state", "version"] },
        density: "compact",
        pageSize: 25,
      }),
    );
  },
  { key: viewKey, expectedOrigin: new URL(origin).origin },
);
const page = await context.newPage();
const errors = [];
const writes = [];
context.on("page", (opened) => opened.on("pageerror", (error) => errors.push(error.message)));
page.on("pageerror", (error) => errors.push(error.message));
const bootstrap = new Set(["/rest/v1/rpc/ensure_personal_tenant", "/rest/v1/rpc/app_schema"]);
await context.route("**/rest/v1/**", async (route) => {
  const request = route.request();
  if (
    !["GET", "HEAD", "OPTIONS"].includes(request.method()) &&
    !bootstrap.has(new URL(request.url()).pathname)
  ) {
    writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
    await route.abort("blockedbyclient");
  } else await route.continue();
});
async function assertRequirementForm(surface, header, current) {
  const form = surface.getByRole("group", { name: "Requirement details", exact: true });
  await form.waitFor();
  await form.getByRole("button", { name: /^Title:/ }).waitFor();
  assert.ok(
    (await form.getByRole("button", { name: /^Title:/ }).innerText()).includes(current.title),
    "The authored title belongs to the inline form",
  );
  assert.ok(
    (await form.getByRole("button", { name: /^Statement:/ }).innerText()).includes(
      current.statement,
    ),
    "The inline form shows the exact recorded statement",
  );
  for (const label of ["Requirement type", "Owner"])
    await form.getByText(label, { exact: true }).waitFor();
  for (const label of ["Version", "Revision", "Revision status", "State", "Published"])
    assert.equal(await form.getByText(label, { exact: true }).count(), 0);
  assert.equal(
    await header.getByRole("group", { name: "Requirement details", exact: true }).count(),
    0,
  );
  assert.equal(
    await header.getByRole("combobox").count(),
    0,
    "Header slots contain actions, not metadata editors",
  );
  assert.equal(await header.getByRole("button", { name: /^Title:/ }).count(), 0);
  assert.equal(
    await surface
      .getByRole("button", {
        name: /^(?:New revision|Add first revision|Edit (?:revision|record|requirement))$/,
      })
      .count(),
    0,
  );
  assert.equal(
    await surface.getByRole("combobox", { name: "Requirement revision", exact: true }).count(),
    0,
  );
  await surface.getByRole("tab", { name: "Edit history", exact: true }).waitFor();
  assert.equal(await surface.getByRole("tab", { name: "History", exact: true }).count(), 0);
}
try {
  await page.goto(`${origin}/programs/${programId}?tab=Requirements`);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const table = page.getByRole("treegrid", { name: "Engineering requirements", exact: true });
  const recordRows = table.locator("tbody > tr[data-row-id]");
  await recordRows.first().waitFor();
  assert.equal(await recordRows.count(), 25, "The requirements table uses the kit pagination");
  assert.equal(
    await table.getByRole("columnheader", { name: /Version|Revision status/ }).count(),
    0,
  );
  await page.waitForFunction((key) => {
    const stored = JSON.parse(localStorage.getItem(key) || "null");
    return stored && !stored.order.includes("state") && !stored.order.includes("version");
  }, viewKey);
  const restoredView = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), viewKey);
  for (const removed of ["state", "version"]) {
    assert.equal(removed in restoredView.sizing, false);
    assert.equal(removed in restoredView.visibility, false);
    assert.equal(restoredView.pinning.end.includes(removed), false);
  }
  assert.equal(restoredView.sizing.code, 190, "Valid saved widths survive removed columns");
  assert.equal(restoredView.visibility.owner, false);
  assert.equal(restoredView.density, "compact");
  await page.getByRole("button", { name: "Saved views", exact: true }).click();
  await page.getByRole("menuitemradio", { name: /^All requirements/ }).waitFor();
  assert.equal(await page.getByRole("menuitemradio", { name: /Draft revisions/ }).count(), 0);
  await page.keyboard.press("Escape");
  const parent = recordRows
    .filter({ has: page.locator('button[aria-label^="Collapse "]') })
    .first();
  const treeParents = await parent.count();
  if (treeParents) {
    const firstChild = await table
      .locator('tr[data-row-id][aria-level="2"]')
      .first()
      .getAttribute("data-row-id");
    await parent.getByRole("button", { name: /^Collapse / }).click();
    if (firstChild) assert.equal(await table.locator(`tr[data-row-id="${firstChild}"]`).count(), 0);
    await parent.getByRole("button", { name: /^Expand / }).click();
  }
  const allocatedRow = recordRows
    .filter({ has: page.locator('button[aria-controls$="-detail"]') })
    .first();
  assert.equal(await allocatedRow.count(), 1, "A recorded allocation is available");
  const allocatedId = await allocatedRow.getAttribute("data-row-id");
  await allocatedRow.locator('button[aria-controls$="-detail"]').click();
  await page
    .locator(`[id="live-requirements-workspace-${allocatedId}-detail"]`)
    .getByRole("table")
    .waitFor();
  await page.screenshot({
    path: "/tmp/program-assurance-requirements-table.png",
    animations: "disabled",
  });
  await allocatedRow.locator('button[aria-controls$="-detail"]').click();

  const first = requirements.data.find((row) => row.program_id === programId);
  const search = page.getByPlaceholder("Find a requirement", { exact: true });
  const prefix = first.code.slice(0, 3);
  await search.fill(prefix);
  await recordRows.first().waitFor();
  const firstIds = await recordRows.evaluateAll((rows) =>
    rows.map((row) => row.getAttribute("data-row-id")),
  );
  assert.ok(firstIds.length > 1);
  await recordRows.first().hover();
  await recordRows.first().getByRole("button", { name: "Preview row", exact: true }).click();
  const panel = page.locator('[data-shell-area="panel"]');
  await panel.getByRole("tab", { name: "Statement", exact: true }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("requirementId"), firstIds[0]);
  const firstDetails = latest.get(firstIds[0]);
  assert.ok(firstDetails);
  await assertRequirementForm(panel, panel.locator(":scope > div.sticky"), firstDetails);
  await page.screenshot({
    path: "/tmp/program-assurance-requirement-form.png",
    animations: "disabled",
  });
  await panel.getByRole("button", { name: "Next requirement", exact: true }).click();
  await page.waitForURL((url) => url.searchParams.get("requirementId") === firstIds[1]);
  await panel.getByRole("tab", { name: "Statement", exact: true }).waitFor();
  await panel.getByRole("button", { name: "Previous requirement", exact: true }).click();
  await page.waitForURL((url) => url.searchParams.get("requirementId") === firstIds[0]);
  await panel.getByRole("tab", { name: "Evidence", exact: true }).click();
  await page.waitForURL((url) => url.searchParams.get("requirementTab") === "Evidence");
  await panel.getByPlaceholder("Find linked evidence", { exact: true }).waitFor();
  assert.equal(
    await panel.getByRole("group", { name: "Requirement details", exact: true }).count(),
    0,
  );
  await page.screenshot({
    path: "/tmp/program-assurance-requirement-preview.png",
    animations: "disabled",
  });
  const popupPromise = context.waitForEvent("page");
  await panel.getByRole("link", { name: "Open full requirement in new tab", exact: true }).click();
  const fullPage = await popupPromise;
  await fullPage.getByRole("tab", { name: "Evidence", exact: true }).waitFor();
  assert.equal(new URL(fullPage.url()).searchParams.get("tab"), "Evidence");
  assert.equal(new URL(fullPage.url()).searchParams.has("revisionId"), false);
  await fullPage.getByRole("tab", { name: "Statement", exact: true }).click();
  await assertRequirementForm(fullPage, fullPage.locator("header.page-header"), firstDetails);
  await fullPage.reload();
  await assertRequirementForm(fullPage, fullPage.locator("header.page-header"), firstDetails);
  await fullPage.getByRole("tab", { name: "Edit history", exact: true }).click();
  await fullPage.waitForURL((url) => url.searchParams.get("tab") === "Edit history");
  await fullPage.getByRole("heading", { name: "Edit history", exact: true }).waitFor();
  assert.equal(
    await fullPage.getByRole("group", { name: "Requirement details", exact: true }).count(),
    0,
  );
  // Older links still reach the current requirement; they do not select historical snapshots.
  await fullPage.goto(
    `${origin}/programs/${programId}/requirements/${firstIds[0]}?tab=History&revisionId=00000000-0000-0000-0000-000000000000`,
  );
  await fullPage.getByRole("heading", { name: "Edit history", exact: true }).waitFor();
  await fullPage.getByRole("tab", { name: "Statement", exact: true }).click();
  await assertRequirementForm(fullPage, fullPage.locator("header.page-header"), firstDetails);
  await fullPage.close();
  await panel.focus();
  await page.keyboard.press("Escape");
  await panel.waitFor({ state: "hidden" });
  assert.equal(await search.inputValue(), prefix, "Closing the preview preserves the table search");
  assert.deepEqual(
    await recordRows.evaluateAll((rows) => rows.map((row) => row.getAttribute("data-row-id"))),
    firstIds,
  );
  await recordRows.first().getByRole("link", { name: first.code, exact: true }).click();
  await page.waitForURL((url) => url.pathname.includes(`/requirements/${firstIds[0]}`));
  await page.getByRole("tab", { name: "Statement", exact: true }).waitFor();
  await assertRequirementForm(page, page.locator("header.page-header"), firstDetails);
  if (currentDecomposition) {
    const parentRecord = byRevision.get(currentDecomposition.parent_requirement_revision_id);
    const childRecord = byRevision.get(currentDecomposition.child_requirement_revision_id);
    await page.goto(`${origin}/programs/${parentRecord.program_id}?tab=Requirements`);
    const parentRow = table.locator(`tr[data-row-id="${parentRecord.id}"]`);
    const childRow = table.locator(`tr[data-row-id="${childRecord.id}"]`);
    await childRow.waitFor();
    assert.equal(await childRow.getAttribute("aria-level"), "2");
    await parentRow
      .getByRole("button", { name: `Collapse ${parentRecord.code}`, exact: true })
      .click();
    await childRow.waitFor({ state: "hidden" });
    await parentRow
      .getByRole("button", { name: `Expand ${parentRecord.code}`, exact: true })
      .click();
    await childRow.waitFor();
    await page.screenshot({
      path: "/tmp/program-assurance-requirements-hierarchy.png",
      animations: "disabled",
    });
  }
  if (missingDetails) {
    await page.goto(`${origin}/programs/${missingDetails.program_id}?tab=Requirements`);
    await search.fill(missingDetails.code);
    const row = table.locator(`tr[data-row-id="${missingDetails.id}"]`);
    await row.getByRole("link", { name: "Details not recorded", exact: true }).waitFor();
  }
  assert.deepEqual(errors, [], "No browser runtime errors");
  assert.deepEqual(writes, [], "This walkthrough has no domain writes");
  console.log(
    `PASS requirements: ${currentDecomposition ? "recorded hierarchy, " : ""}${missingDetails ? "missing details, " : ""}allocation details, inline metadata form, edit history, no revision controls, reconciled saved columns, eye preview, filtered next/previous, current full record/reload, preserved search, zero domain writes`,
  );
} catch (error) {
  await page.screenshot({
    path: "/tmp/program-assurance-requirements-failure.png",
    animations: "disabled",
  });
  throw error;
} finally {
  await browser.close();
}
