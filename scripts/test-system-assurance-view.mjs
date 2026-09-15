/** Systems workspace projection and categorization, only in a disposable local workspace. */
import assert from "node:assert/strict";
import { chromium, expect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("system-assurance-view");
const { client, tenantId } = workspace;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1050 } });
page.setDefaultTimeout(30000);
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
const row = (system) => table().locator(`tr[data-row-id="${system.id}"]`);
const impact = (system, dimension) =>
  row(system).getByRole("button", {
    name: `View ${dimension} impact for ${system.code}`,
    exact: true,
  });
const panel = () => page.locator('[data-shell-area="panel"]');
async function choose(dialog, label, value) {
  await dialog.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}
async function publishedProfile(level) {
  const profile = await data(
    client
      .from("profile_revisions")
      .select()
      .eq("state", "published")
      .ilike("title", `%${level}%`)
      .limit(1)
      .single(),
  );
  const resolution = await data(
    client
      .from("profile_resolutions")
      .select()
      .eq("profile_revision_id", profile.id)
      .eq("state", "published")
      .single(),
  );
  const count = await client
    .from("selected_controls")
    .select("control_id", { count: "exact", head: true })
    .eq("profile_resolution_id", resolution.id);
  assert.ifError(count.error);
  assert.ok(count.count > 0);
  return { profile, resolution, count: count.count };
}
async function frameSize() {
  return table().evaluate((grid) => {
    const frame = grid.closest("[data-fill]");
    if (!frame) return null;
    const bounds = frame.getBoundingClientRect();
    let ancestor = grid.parentElement;
    while (ancestor && ancestor !== frame.parentElement) {
      if (
        /auto|scroll/.test(getComputedStyle(ancestor).overflowY) &&
        ancestor.scrollHeight > ancestor.clientHeight + 1
      ) {
        return {
          height: bounds.height,
          bottom: bounds.bottom,
          viewport: innerHeight,
          scrollHeight: ancestor.scrollHeight,
          clientHeight: ancestor.clientHeight,
        };
      }
      ancestor = ancestor.parentElement;
    }
    return {
      height: bounds.height,
      bottom: bounds.bottom,
      viewport: innerHeight,
      scrollHeight: 0,
      clientHeight: 0,
    };
  });
}

try {
  const low = await publishedProfile("Low");
  const high = await publishedProfile("High");
  const program = await insert("programs", {
    code: "ASSURANCE",
    name: "System assurance validation",
  });
  const root = await insert("systems", {
    program_id: program.id,
    code: "SYS-ROOT",
    name: "Recorded boundary",
    system_type: "information_system",
    confidentiality_impact: "high",
    integrity_impact: "moderate",
    availability_impact: "high",
  });
  const parent = await insert("systems", {
    program_id: program.id,
    parent_system_id: root.id,
    is_authorization_boundary: false,
    code: "SYS-PARENT",
    name: "Uncategorized containing subsystem",
    system_type: "subsystem",
  });
  const scoped = await insert("systems", {
    program_id: program.id,
    parent_system_id: parent.id,
    is_authorization_boundary: false,
    code: "SYS-SCOPED",
    name: "Scoped processing system",
    system_type: "hardware",
    integrity_impact: "low",
  });
  const leaf = await insert("systems", {
    program_id: program.id,
    parent_system_id: scoped.id,
    is_authorization_boundary: false,
    code: "SYS-LEAF",
    name: "Uncategorized processing component",
    system_type: "software",
  });
  await data(
    client.from("systems").insert(
      Array.from({ length: 34 }, (_, index) => ({
        tenant_id: tenantId,
        program_id: program.id,
        parent_system_id: root.id,
        is_authorization_boundary: false,
        code: `SYS-EXTRA-${String(index + 1).padStart(2, "0")}`,
        name: `Recorded extra component ${index + 1}`,
        system_type: "software",
      })),
    ),
  );
  const assessment = await insert("scopes", {
    system_id: root.id,
    composition_node_id: scoped.id,
    code: "SCOPE-PROCESSING",
    name: "Processing assessment scope",
    confidentiality_impact: "high",
    integrity_impact: "high",
    availability_impact: "moderate",
    categorization_rationale: "This scope covers processing of the recorded data set.",
  });
  const party = await data(
    client.from("parties").select().eq("auth_user_id", workspace.userId).single(),
  );
  await insert("scope_baselines", {
    scope_id: assessment.id,
    profile_resolution_id: high.resolution.id,
    adopted_at: "2026-01-01T00:00:00Z",
    adopted_by_party_id: party.id,
  });
  await insert("ssp_revisions", {
    system_id: root.id,
    profile_resolution_id: low.resolution.id,
    version_number: 1,
  });

  await page.goto(`${origin}/programs/${program.id}?tab=System`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(table().locator("tr[data-row-id]")).toHaveCount(38);
  await expect(page.getByRole("heading", { name: "Assessment scopes", exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole("heading", { name: "Program systems", exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Systems, subsystems, and components share one hierarchy.", { exact: false }),
  ).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Rows per page", exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: /Program systems.*pagination/i })).toHaveCount(
    0,
  );
  await expect(row(scoped)).toHaveAttribute("aria-level", "3");
  await expect(impact(scoped, "confidentiality")).toContainText("High");
  await expect(impact(scoped, "confidentiality")).toContainText("Scope");
  await expect(impact(scoped, "integrity")).toContainText("Low");
  await expect(impact(scoped, "integrity")).not.toContainText("High");
  await expect(impact(root, "confidentiality")).toContainText("High");
  // A scoped descendant provides a summary; it does not categorize either ancestor or leaf.
  for (const system of [parent, leaf])
    await expect(impact(system, "confidentiality")).not.toContainText(/Low|Moderate|High/);

  const initialFrame = await frameSize();
  assert.ok(initialFrame?.height > 300, "Systems table occupies the remaining page height");
  assert.ok(initialFrame.bottom <= initialFrame.viewport + 2, "Table fits the viewport");
  assert.ok(
    initialFrame.scrollHeight > initialFrame.clientHeight,
    "System rows scroll inside the table",
  );
  await page.setViewportSize({ width: 1700, height: 1300 });
  await expect
    .poll(async () => (await frameSize())?.height ?? 0)
    .toBeGreaterThan(initialFrame.height + 200);
  await page.setViewportSize({ width: 1700, height: 1050 });

  await row(scoped)
    .getByRole("button", { name: `View scopes for ${scoped.code}`, exact: true })
    .click();
  await expect(panel().getByRole("tab", { name: "Scopes", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const scopeButton = panel().getByRole("button").filter({ hasText: assessment.name });
  await expect(scopeButton).toHaveCount(1);
  await scopeButton.click();
  const scopeDialog = page.getByRole("dialog", { name: assessment.name, exact: true });
  await expect(scopeDialog).toContainText(assessment.categorization_rationale);
  await page.keyboard.press("Escape");
  await expect(scopeDialog).toHaveCount(0);

  // Opening a descendant through an ancestor must not retarget the scope when edited.
  await row(parent)
    .getByRole("button", { name: `View scopes for ${parent.code}`, exact: true })
    .click();
  await panel().getByRole("button").filter({ hasText: assessment.name }).click();
  await scopeDialog.getByRole("button", { name: "Edit record", exact: true }).click();
  const editScope = page.getByRole("dialog", { name: "Edit scope", exact: true });
  const scopeDescription = "Scope details reviewed from the containing subsystem.";
  await editScope.getByLabel("Description", { exact: true }).fill(scopeDescription);
  await editScope.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(editScope).toHaveCount(0);
  const editedScope = await data(client.from("scopes").select().eq("id", assessment.id).single());
  assert.equal(editedScope.description, scopeDescription);
  assert.equal(editedScope.system_id, root.id, "Scope editing retains its original boundary");
  assert.equal(
    editedScope.composition_node_id,
    scoped.id,
    "Editing from an ancestor preview retains the scope's exact descendant target",
  );

  await row(scoped)
    .getByRole("button", { name: `View scopes for ${scoped.code}`, exact: true })
    .click();
  await panel().getByRole("button", { name: "Add scope", exact: true }).click();
  const createScope = page.getByRole("dialog", { name: "Create scope", exact: true });
  await createScope.getByLabel(/^Code\b/).fill("SCOPE-ADDED");
  await createScope.getByLabel(/^Name\b/).fill("Added directly from system");
  await createScope.getByRole("button", { name: "Create scope", exact: true }).click();
  await expect(createScope).toHaveCount(0);
  const added = await data(
    client.from("scopes").select().eq("system_id", root.id).eq("code", "SCOPE-ADDED").single(),
  );
  assert.equal(
    added.composition_node_id,
    scoped.id,
    "Scope authoring retains the exact subsystem target",
  );

  await row(scoped)
    .getByRole("button", { name: `View controls for ${scoped.code}`, exact: true })
    .click();
  await expect(panel().getByRole("tab", { name: "Controls", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(panel()).toContainText(low.profile.title);
  await expect(panel()).toContainText(`${low.count} controls`);
  await expect(panel()).toContainText("Inherited");
  const resolved = await data(
    client.from("system_effective_baselines").select().eq("system_id", scoped.id).single(),
  );
  assert.equal(
    resolved.profile_resolution_id,
    low.resolution.id,
    "The separate scope adoption never replaces the inherited system baseline",
  );
  assert.equal(resolved.source_system_id, root.id);
  assert.equal(resolved.inherited, true);

  await impact(scoped, "confidentiality").click();
  await panel().getByRole("button", { name: "Edit system", exact: true }).click();
  const edit = page.getByRole("dialog", { name: "Edit system", exact: true });
  await choose(edit, "Confidentiality impact", "Moderate");
  await choose(edit, "Integrity impact", "Not categorized");
  await choose(edit, "Availability impact", "Low");
  await edit
    .getByLabel("Categorization rationale (optional)", { exact: true })
    .fill("Recorded subsystem categorization reviewed separately from the assessment scope.");
  await edit.getByRole("button", { name: "Save system", exact: true }).click();
  await expect(edit).toHaveCount(0);
  const saved = await data(client.from("systems").select().eq("id", scoped.id).single());
  assert.equal(saved.confidentiality_impact, "moderate");
  assert.equal(
    saved.integrity_impact,
    null,
    "Clearing categorization stores null, not an inferred parent or scope impact",
  );
  assert.equal(saved.availability_impact, "low");
  assert.equal(
    saved.categorization_rationale,
    "Recorded subsystem categorization reviewed separately from the assessment scope.",
  );
  assert.equal(saved.parent_system_id, parent.id);
  assert.equal(saved.boundary_system_id, root.id);
  await page.reload();
  await expect(table().locator("tr[data-row-id]")).toHaveCount(38);
  await expect(impact(scoped, "confidentiality")).toContainText("Moderate");
  await expect(impact(scoped, "integrity")).toContainText("High");
  await expect(impact(scoped, "integrity")).toContainText("Scope");
  await expect(impact(scoped, "availability")).toContainText("Low");
  assert.deepEqual(errors, []);
  console.log(
    "PASS unified 38-row system table, dynamic height, exact scopes, ancestor scope editing, truthful CIA sources, baseline inheritance, scope creation and persistent CIA editing",
  );
} catch (failure) {
  await page
    .screenshot({ path: "/tmp/system-assurance-view-failure.png", animations: "disabled" })
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
}
