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
/** The cell under a named column, found by the header's sort button so reordering never hides a regression. */
async function columnIndex(header) {
  const heads = table().locator("thead th");
  const count = await heads.count();
  for (let index = 0; index < count; index += 1)
    if ((await heads.nth(index).getByRole("button", { name: header, exact: true }).count()) === 1)
      return index;
  return -1;
}
async function cell(system, header) {
  const index = await columnIndex(header);
  assert.ok(index >= 0, `The systems table has a ${header} column`);
  return row(system).locator("td").nth(index);
}
const impact = (system, dimension) =>
  cell(
    system,
    dimension === "confidentiality" ? "Conf." : dimension === "integrity" ? "Integ." : "Avail.",
  );
const panel = () => page.locator('[data-shell-area="panel"]');
const tabs = () => page.getByRole("tablist", { name: "Element sections", exact: true });
async function choose(dialog, label, value) {
  await dialog.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: value, exact: true }).click();
}
/** A published reference profile; `title` is its stable record's short name, the one the product shows. */
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
  const record = await data(client.from("profiles").select().eq("id", profile.profile_id).single());
  return { profile, resolution, count: count.count, title: record.title };
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

  const requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-SCOPED",
  });
  const revision = await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Scoped data integrity",
    statement: "The processing system shall verify the integrity of recorded data.",
    acceptance_criteria: "Integrity checks pass on every recorded data set.",
    requirement_type: "security",
  });
  await insert("requirement_allocations", {
    requirement_revision_id: revision.id,
    system_id: scoped.id,
    rationale: "The processing system records the data set.",
  });
  const leafRequirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-LEAF",
  });
  const leafRevision = await insert("requirement_revisions", {
    engineering_requirement_id: leafRequirement.id,
    version_number: 1,
    title: "Component logging",
    statement: "The processing component shall log integrity failures.",
    acceptance_criteria: "A failed check produces a log entry.",
    requirement_type: "functional",
  });
  await insert("requirement_allocations", {
    requirement_revision_id: leafRevision.id,
    system_id: leaf.id,
  });

  await page.goto(`${origin}/programs/${program.id}?tab=System`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(table().locator("tr[data-row-id]")).toHaveCount(38);
  await expect(page.getByRole("combobox", { name: "Rows per page", exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: /Program systems.*pagination/i })).toHaveCount(
    0,
  );
  // Nine columns; scopes are not one of them and no cell is a button into the preview.
  for (const header of [
    "Element",
    "Code",
    "Type",
    "Conf.",
    "Integ.",
    "Avail.",
    "Baseline",
    "Controls",
    "Requirements",
  ])
    await expect(
      table().locator("thead").getByRole("button", { name: header, exact: true }),
    ).toHaveCount(1);
  await expect(
    table().locator("thead").getByRole("button", { name: "Scopes", exact: true }),
  ).toHaveCount(0);
  await expect(
    table().getByRole("button", { name: /^View (scopes|controls|.* impact) for/ }),
  ).toHaveCount(0);
  await expect(row(scoped)).toHaveAttribute("aria-level", "3");
  await expect(await impact(scoped, "confidentiality")).toHaveText("High");
  await expect(await impact(scoped, "integrity")).toContainText("Low");
  await expect(await impact(scoped, "integrity")).not.toContainText("High");
  await expect(await impact(root, "confidentiality")).toContainText("High");
  // A scoped descendant provides a summary; it does not categorize either ancestor or leaf.
  for (const system of [parent, leaf])
    await expect(await impact(system, "confidentiality")).not.toContainText(/Low|Moderate|High/);
  // The baseline names the profile and says where it comes from; the counts are exact.
  await expect(await cell(root, "Baseline")).toContainText(low.title);
  await expect(await cell(root, "Baseline")).toContainText("From the boundary SSP");
  await expect(await cell(scoped, "Baseline")).toContainText(low.title);
  await expect(await cell(scoped, "Baseline")).toContainText(`Inherited from ${root.code}`);
  await expect(await cell(root, "Controls")).toHaveText(String(low.count));
  await expect(await cell(scoped, "Requirements")).toHaveText("1");
  await expect(await cell(leaf, "Requirements")).toHaveText("1");
  await expect(await cell(parent, "Requirements")).not.toContainText(/\d/);

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

  // One click result for the row: the preview, always on its first section.
  await (await cell(scoped, "Type")).click();
  await expect(panel()).toBeVisible();
  await expect(panel().getByRole("tab")).toHaveCount(0);
  await expect(panel().getByRole("heading", { name: scoped.name, exact: true })).toBeVisible();
  await expect(panel()).toContainText(`${root.name} / ${parent.name}`);
  await expect(panel()).toContainText("From an assessment scope");
  await expect(panel()).toContainText(low.title);
  await expect(panel()).toContainText(`${low.count} controls`);
  await expect(panel()).toContainText(`Inherited from ${root.code}`);
  await expect(panel()).toContainText("1 allocated here");
  await expect(panel()).toContainText("2 including everything inside");
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
  // Contains drills in place: the same panel, the child.
  await panel().getByRole("button", { name: leaf.name, exact: true }).click();
  await expect(panel().getByRole("heading", { name: leaf.name, exact: true })).toBeVisible();
  await expect(panel()).toContainText("Nothing inside this element.");
  await expect(panel()).toContainText("1 allocated here");

  // The eye opens the same preview; Edit lives in its header.
  await row(scoped).getByRole("button", { name: "Preview row", exact: true }).click();
  await expect(panel().getByRole("heading", { name: scoped.name, exact: true })).toBeVisible();
  await panel().getByRole("button", { name: "Edit", exact: true }).click();
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
  await expect(await impact(scoped, "confidentiality")).toContainText("Moderate");
  await expect(await impact(scoped, "integrity")).toContainText("High");
  await expect(await impact(scoped, "availability")).toContainText("Low");

  // The record: one anatomy at every level, the tab in the URL, retired tab names land.
  await page.goto(`${origin}/programs/${program.id}/systems/${scoped.id}?tab=Controls`);
  await expect(tabs().getByRole("tab")).toHaveText([
    "Overview",
    "Controls",
    "Requirements",
    "Library",
    "Evidence",
    "Inventory",
  ]);
  await expect(tabs().getByRole("tab", { name: "Controls", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  const main = page.getByRole("main");
  await expect(main).toContainText(low.title);
  await expect(main).toContainText(`Inherited from ${root.code}`);
  await expect(main).toContainText(`${low.count} controls`);
  const controls = page.getByRole("table", { name: "Controls", exact: true });
  await expect(controls.locator("tr[data-row-id]")).toHaveCount(Math.min(50, low.count));
  const rail = page.getByRole("complementary", { name: "Record properties", exact: true });
  await expect(rail).toContainText("Moderate");
  await expect(rail.getByRole("link", { name: root.name, exact: true })).toHaveCount(1);
  await expect(rail.getByRole("link", { name: parent.name, exact: true })).toHaveCount(1);
  await expect(
    page.getByRole("navigation", { name: /breadcrumb/i }).getByRole("link", { name: parent.name }),
  ).toHaveCount(1);
  await tabs().getByRole("tab", { name: "Requirements", exact: true }).click();
  await expect(page).toHaveURL(/tab=Requirements/);
  const requirements = page.getByRole("table", { name: "Allocated requirements", exact: true });
  await expect(requirements.locator("tr[data-row-id]")).toHaveCount(1);
  await expect(requirements).toContainText(requirement.code);
  await page.getByRole("checkbox", { name: "Include everything inside", exact: true }).click();
  await expect(requirements.locator("tr[data-row-id]")).toHaveCount(2);
  await expect(requirements).toContainText(leafRequirement.code);
  await page.goto(`${origin}/programs/${program.id}/systems/${scoped.id}?tab=Baseline`);
  await expect(tabs().getByRole("tab", { name: "Controls", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.goto(`${origin}/programs/${program.id}/systems/${root.id}`);
  await expect(tabs().getByRole("tab")).toHaveText([
    "Overview",
    "Controls",
    "Requirements",
    "Library",
    "Evidence",
    "Inventory",
    "SSP",
  ]);
  await expect(table().locator("tr[data-row-id]")).toHaveCount(38);

  // The old composition URL is the System tab.
  await page.goto(`${origin}/programs/${program.id}/composition`);
  await expect(page).toHaveURL(new RegExp(`/programs/${program.id}\\?tab=System$`));
  await expect(table().locator("tr[data-row-id]")).toHaveCount(38);

  // Scopes live under Assessments now.
  await page.goto(`${origin}/programs/${program.id}?tab=Assessments`);
  await page.getByRole("tab", { name: /^Scopes/ }).click();
  const scopesTable = page.getByRole("table", { name: "Assessment scopes", exact: true });
  await expect(scopesTable).toContainText(assessment.name);
  await expect(scopesTable).toContainText(scoped.name);
  assert.deepEqual(errors, []);
  console.log(
    "PASS one element anatomy: nine-column tree, row and eye previews, drill in place, truthful CIA sources, baseline inheritance, requirement counts, the record's tab set in the URL, the composition redirect and scopes under Assessments",
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
