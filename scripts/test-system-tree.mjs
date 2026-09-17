/** Canonical systems and exact requirement allocation, in disposable local workspaces. */
import assert from "node:assert/strict";
import { chromium, expect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { expectPreviewHeader, minimizePreview } from "./tests/preview-header.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("system-tree");
let outsider;
const { client, tenantId } = workspace;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 } });
context.setDefaultTimeout(30000);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
const insert = (table, values) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
const table = () => page.getByRole("treegrid", { name: "Program systems", exact: true });
async function authorSystem(title, code, name, type) {
  const dialog = page.getByRole("dialog", { name: title, exact: true });
  await dialog.getByLabel("Code", { exact: true }).fill(code);
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  await dialog.getByRole("combobox", { name: "System type", exact: true }).click();
  await page.getByRole("option", { name: type, exact: true }).click();
  await dialog.getByRole("button", { name: title, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
try {
  const program = await insert("programs", { code: "TREE", name: "System tree validation" });
  const requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-TREE",
  });
  const content = await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Storage integrity",
    statement: "The system shall retain its recorded configuration.",
    acceptance_criteria: "Configuration survives the recorded restart test.",
    requirement_type: "functional",
  });
  await page.goto(`${origin}/programs/${program.id}?tab=System`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("button", { name: "Create system", exact: true }).click();
  const rootDialog = page.getByRole("dialog", { name: "Create system", exact: true });
  await expect(rootDialog.getByRole("checkbox", { name: "Authorization boundary" })).toBeChecked();
  await expect(rootDialog.getByRole("checkbox", { name: "Authorization boundary" })).toBeDisabled();
  await authorSystem("Create system", "SYS-TREE", "Validation boundary", "Information system");
  const root = await data(
    client.from("systems").select().eq("program_id", program.id).eq("code", "SYS-TREE").single(),
  );
  assert.equal(root.is_authorization_boundary, true);
  assert.equal(root.parent_system_id, null);
  assert.equal(root.boundary_system_id, root.id);
  await page
    .locator('[data-shell-area="panel"]')
    .getByRole("button", { name: "More system actions", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Create system", exact: true }).click();
  await authorSystem("Create system", "NODE-TREE", "Recorded storage component", "Hardware");
  const child = await data(
    client.from("systems").select().eq("program_id", program.id).eq("code", "NODE-TREE").single(),
  );
  assert.equal(child.parent_system_id, root.id);
  assert.equal(child.boundary_system_id, root.id);
  assert.equal(child.is_authorization_boundary, false);
  for (const field of [
    "system_owner_party_id",
    "confidentiality_impact",
    "integrity_impact",
    "availability_impact",
    "lifecycle_status",
    "authorization_status",
  ])
    assert.equal(child[field], null, `No invented ${field} on a child system`);
  await expect(table().locator(`tr[data-row-id="${child.id}"]`)).toHaveAttribute("aria-level", "2");
  const sibling = await insert("systems", {
    program_id: program.id,
    parent_system_id: root.id,
    is_authorization_boundary: false,
    code: "NODE-OTHER",
    name: "Other recorded component",
    system_type: "software",
  });
  await page
    .locator('[data-shell-area="panel"]')
    .getByRole("button", { name: "Edit system", exact: true })
    .click();
  const edit = page.getByRole("dialog", { name: "Edit system", exact: true });
  assert.equal(await edit.getByRole("checkbox", { name: "Authorization boundary" }).count(), 0);
  await edit.getByLabel("Name", { exact: true }).fill("Edited storage component");
  await edit.getByRole("button", { name: "Save system", exact: true }).click();
  await expect(edit).toHaveCount(0);
  const edited = await data(client.from("systems").select().eq("id", child.id).single());
  assert.equal(edited.name, "Edited storage component");
  assert.equal(edited.revision, child.revision + 1);
  assert.equal(edited.parent_system_id, child.parent_system_id);
  const preview = page.locator('[data-shell-area="panel"]');
  await expect(preview.getByRole("link", { name: "Open record", exact: true })).toHaveCount(0);
  for (const width of [1600, 390, 340]) {
    await page.setViewportSize({ width, height: 1000 });
    await expectPreviewHeader(page, {
      title: edited.name,
      recordActions: ["Edit system", "More system actions"],
    });
    if (width === 1600) {
      await expect
        .poll(
          async () => {
            const mainTable = await table().boundingBox();
            const panelBounds = await preview.boundingBox();
            return Boolean(
              mainTable && panelBounds && mainTable.x + mainTable.width <= panelBounds.x + 1,
            );
          },
          { message: "System tree fits beside the preview" },
        )
        .toBe(true);
    }
    await page.screenshot({ path: `/tmp/system-preview-${width}.png`, animations: "disabled" });
    if (width === 1600) {
      await minimizePreview(page);
      await expectPreviewHeader(page, {
        title: edited.name,
        recordActions: ["Edit system", "More system actions"],
      });
      await page.screenshot({ path: "/tmp/system-preview-panel-240.png", animations: "disabled" });
      await page.keyboard.press("End");
    }
  }
  await preview.getByRole("button", { name: "Close details", exact: true }).click();
  await expect(preview).toHaveCount(0);
  await expect(table()).toBeVisible();
  await expect
    .poll(
      async () => {
        const bounds = await table().boundingBox();
        return Boolean(bounds && bounds.x >= -1 && bounds.x + bounds.width <= 341);
      },
      { message: "System tree fits its narrow container" },
    )
    .toBe(true);
  const mobileRow = table().locator(`tr[data-row-id="${child.id}"]`);
  await expect(mobileRow.getByRole("link", { name: edited.name, exact: true })).toBeVisible();
  await expect(mobileRow.getByRole("button", { name: "Preview row", exact: true })).toBeVisible();
  const moreFields = mobileRow.getByRole("button", {
    name: `More fields for ${child.code}`,
    exact: true,
  });
  await moreFields.click();
  const fieldDetails = page.locator(`[id="${await moreFields.getAttribute("aria-controls")}"]`);
  await expect(fieldDetails.getByText(child.code, { exact: true })).toBeVisible();
  await expect(fieldDetails.getByText("Hardware", { exact: true })).toBeVisible();
  await expect(fieldDetails.getByText("Confidentiality", { exact: true })).toBeVisible();
  await page.screenshot({ path: "/tmp/system-tree-340.png", animations: "disabled" });
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto(`${origin}/programs/${program.id}/systems/${child.id}`);
  await page.getByRole("heading", { name: edited.name, exact: true }).waitFor();
  await page
    .locator('[data-shell-area="aside"]')
    .getByRole("link", { name: root.name, exact: true })
    .first()
    .waitFor();
  assert.equal(await page.getByRole("tab", { name: "Security plans", exact: true }).count(), 0);
  await page.goto(
    `${origin}/programs/${program.id}?tab=Requirements&requirementId=${requirement.id}&requirementTab=Allocation`,
  );
  await page.getByRole("button", { name: "Allocate requirement", exact: true }).click();
  const allocation = page.getByRole("dialog", { name: "Allocate requirement", exact: true });
  const targets = allocation.getByRole("treegrid", {
    name: "Systems available for allocation",
    exact: true,
  });
  const row = (id) => targets.locator(`tr[data-row-id="${id}"]`);
  await row(root.id).getByRole("checkbox").check();
  await expect(row(child.id).getByRole("checkbox")).not.toBeChecked();
  await expect(row(sibling.id).getByRole("checkbox")).not.toBeChecked();
  await row(child.id).getByRole("checkbox").check();
  await allocation
    .getByLabel("Rationale (optional)", { exact: true })
    .fill("These two records own the storage behavior.");
  await page.screenshot({ path: "/tmp/system-allocation-dialog.png", animations: "disabled" });
  let loseResponse = true;
  const allocationRoute = "**/rest/v1/requirement_allocations*";
  await page.route(allocationRoute, async (route) => {
    if (loseResponse && route.request().method() === "POST") {
      loseResponse = false;
      const response = await route.fetch();
      assert.ok(response.ok(), "The first allocation commits before its response is lost");
      await route.abort("failed");
    } else await route.continue();
  });
  await allocation.getByRole("button", { name: "Allocate to 2 systems", exact: true }).click();
  await allocation.getByRole("alert").waitFor();
  assert.equal(
    (
      await data(
        client.from("requirement_allocations").select().eq("requirement_revision_id", content.id),
      )
    ).length,
    1,
  );
  await expect(allocation.getByLabel("Rationale (optional)", { exact: true })).toBeDisabled();
  await allocation.getByRole("button", { name: "Retry allocation", exact: true }).click();
  await expect(allocation).toHaveCount(0);
  await page.unroute(allocationRoute);
  const allocations = await data(
    client.from("requirement_allocations").select().eq("requirement_revision_id", content.id),
  );
  assert.deepEqual(allocations.map((item) => item.system_id).sort(), [root.id, child.id].sort());
  assert.ok(
    allocations.every((item) => item.rationale === "These two records own the storage behavior."),
  );
  await page.reload();
  await page.getByRole("table", { name: "Requirement allocations", exact: true }).waitFor();
  await page.getByRole("link", { name: `${root.code} · ${root.name}`, exact: true }).waitFor();
  await page.getByRole("link", { name: `${child.code} · ${edited.name}`, exact: true }).waitFor();
  await page.getByRole("button", { name: "Allocate requirement", exact: true }).click();
  await expect(row(root.id).getByRole("checkbox")).toBeDisabled();
  await expect(row(child.id).getByRole("checkbox")).toBeDisabled();
  await allocation.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(
    (
      await data(
        client.from("requirement_allocations").select().eq("requirement_revision_id", content.id),
      )
    ).length,
    2,
  );

  outsider = await localWorkspace("system-tree-outsider");
  const foreignProgram = await data(
    outsider.client
      .from("programs")
      .insert({ tenant_id: outsider.tenantId, code: "FOREIGN", name: "Foreign tree" })
      .select()
      .single(),
  );
  const foreign = await data(
    outsider.client
      .from("systems")
      .insert({
        tenant_id: outsider.tenantId,
        program_id: foreignProgram.id,
        code: "FOREIGN-SYSTEM",
        name: "Foreign system",
        system_type: "service",
      })
      .select()
      .single(),
  );
  assert.deepEqual(await data(client.from("systems").select().eq("id", foreign.id)), []);
  const denied = await client
    .from("requirement_allocations")
    .insert({ tenant_id: tenantId, requirement_revision_id: content.id, system_id: foreign.id });
  assert.ok(denied.error, "Cross-tenant system allocation is rejected");
  await data(
    client
      .from("tenant_memberships")
      .insert({ tenant_id: tenantId, user_id: outsider.userId, role: "owner" }),
  );
  await data(
    client
      .from("tenant_memberships")
      .update({ role: "viewer" })
      .eq("tenant_id", tenantId)
      .eq("user_id", workspace.userId),
  );
  await page.reload();
  await page.getByRole("table", { name: "Requirement allocations", exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Allocate requirement", exact: true }).count(),
    0,
  );
  await page.goto(`${origin}/programs/${program.id}?tab=System`);
  await table().waitFor();
  assert.equal(await page.getByRole("button", { name: "Create system", exact: true }).count(), 0);
  assert.equal(await table().getByRole("button", { name: "Row actions", exact: true }).count(), 0);
  const viewerWrite = await client
    .from("requirement_allocations")
    .insert({ tenant_id: tenantId, requirement_revision_id: content.id, system_id: sibling.id });
  assert.ok(viewerWrite.error, "Viewer cannot allocate via the database either");
  await page.screenshot({ path: "/tmp/system-tree-foundation.png", animations: "disabled" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS root/child creation, CAS edit, boundary distinction, exact allocation, lost-response retry, reload, duplicate prevention, tenant isolation, viewer UI/RLS",
  );
} catch (failure) {
  await page
    .screenshot({ path: "/tmp/system-tree-failure.png", animations: "disabled" })
    .catch(() => {});
  console.error(
    await page
      .locator("body")
      .innerText()
      .catch(() => ""),
  );
  throw failure;
} finally {
  await browser.close();
  await workspace.cleanup();
  await outsider?.cleanup();
}
