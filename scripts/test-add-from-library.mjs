/** Add from library, the Library, Evidence and Requirements tabs, update review and the program roll-up, in a disposable local workspace. */
import assert from "node:assert/strict";
import { chromium, expect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("add-from-library");
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
const update = (table, record, values) =>
  data(
    client
      .from(table)
      .update({ ...values, revision: record.revision + 1 })
      .eq("id", record.id)
      .eq("revision", record.revision)
      .select()
      .single(),
  );
const rows = (table, filters = {}) => {
  let query = client.from(table).select().eq("tenant_id", tenantId);
  for (const [field, value] of Object.entries(filters)) query = query.eq(field, value);
  return data(query.order("id"));
};
const tabs = () => page.getByRole("tablist", { name: "Element sections", exact: true });
const sheet = () => page.getByRole("dialog");

try {
  const profile = await data(
    client
      .from("profile_revisions")
      .select()
      .eq("state", "published")
      .ilike("title", "%Low%")
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
  const selected = await data(
    client.from("selected_controls").select().eq("profile_resolution_id", resolution.id).limit(3),
  );
  const controls = await data(
    client
      .from("controls")
      .select()
      .in(
        "id",
        selected.map((item) => item.control_id),
      ),
  );
  const [controlA, controlB] = controls;

  const program = await insert("programs", { code: "LIBUI", name: "Library reuse in the browser" });
  const root = await insert("systems", {
    program_id: program.id,
    code: "SYS-ROOT",
    name: "Recorded boundary",
    system_type: "information_system",
  });
  const child = await insert("systems", {
    program_id: program.id,
    parent_system_id: root.id,
    is_authorization_boundary: false,
    code: "SYS-CHILD",
    name: "Ground segment",
    system_type: "subsystem",
  });
  await insert("ssp_revisions", {
    system_id: root.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  const definition = await insert("component_definitions", {
    code: "corp-audit",
    name: "Corporate audit policy",
    category: "organizational_baseline",
  });
  const v1 = await insert("component_definition_revisions", {
    component_definition_id: definition.id,
    version_number: 1,
  });
  const policy = await insert("defined_components", {
    component_definition_revision_id: v1.id,
    name: "Audit policy",
    component_type: "policy",
  });
  const claimA = await insert("defined_component_implementations", {
    component_definition_revision_id: v1.id,
    defined_component_id: policy.id,
    control_id: controlA.id,
    description: "The corporate policy assigns audit responsibilities.",
    implementation_status: "implemented",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v1.id,
    defined_component_id: policy.id,
    control_id: controlB.id,
    description: "Audit events are defined by the corporate event list.",
    implementation_status: "implemented",
  });
  const artifact = await insert("evidence_artifacts", {
    title: "Corporate audit policy, signed",
    artifact_kind: "document",
  });
  const artifactVersion = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    state: "published",
    external_uri: "https://example.test/policies/audit-v3.pdf",
  });
  await insert("defined_component_evidence", {
    component_definition_revision_id: v1.id,
    implementation_id: claimA.id,
    evidence_version_id: artifactVersion.id,
    claim: "The signed policy.",
  });
  await update("component_definition_revisions", v1, { state: "published" });
  const requirementDefinition = await insert("requirement_definitions", {
    code: "RQD-RETAIN",
    title: "Audit record retention",
  });
  const requirementV1 = await insert("requirement_definition_revisions", {
    requirement_definition_id: requirementDefinition.id,
    version_number: 1,
    statement: "The system shall retain audit records for one year.",
    acceptance_criteria: "Records older than one year are present in the archive.",
    requirement_type: "security",
  });
  await update("requirement_definition_revisions", requirementV1, { state: "published" });
  const existingRequirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-LOCAL",
  });
  await insert("requirement_revisions", {
    engineering_requirement_id: existingRequirement.id,
    version_number: 1,
    title: "Local logging",
    statement: "The ground segment shall log integrity failures.",
    acceptance_criteria: "A failed check produces a log entry.",
    requirement_type: "functional",
  });

  // Sign in on the element's Library tab.
  await page.goto(`${origin}/programs/${program.id}/systems/${child.id}?tab=Library`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(tabs().getByRole("tab")).toHaveText([
    "Overview",
    "Controls",
    "Requirements",
    "Library",
    "Evidence",
    "Inventory",
  ]);
  const libraryTable = page.getByRole("table", { name: "Applied from the library", exact: true });
  await expect(libraryTable).toContainText("Inherited from SYS-ROOT");
  await expect(libraryTable).not.toContainText("Corporate audit policy");

  // Add from library: choose the component, confirm the matrix, apply.
  await page
    .getByRole("main")
    .getByRole("button", { name: "Add from library", exact: true })
    .first()
    .click();
  await expect(sheet().getByRole("heading", { name: "Add from library" })).toBeVisible();
  await sheet().getByRole("row").filter({ hasText: "corp-audit" }).first().click();
  await sheet().getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    sheet().getByRole("heading", { name: /Apply Corporate audit policy/ }),
  ).toBeVisible();
  await expect(sheet().getByRole("table", { name: "What will be written" })).toContainText(
    controlA.code,
  );
  await expect(
    sheet().getByRole("checkbox", { name: `Seed ${controlA.code} on SYS-CHILD` }),
  ).toBeChecked();
  // This pass pins the instance on the element itself; the child-element path is exercised below.
  await sheet()
    .getByRole("checkbox", { name: /Create as a child element/ })
    .uncheck();
  await sheet()
    .getByLabel("Rationale", { exact: true })
    .fill("The ground segment is operated from Sierra Vista.");
  await sheet()
    .getByRole("button", { name: /^Apply to 1$/ })
    .click();
  await expect(sheet()).toHaveCount(0);
  await expect(libraryTable).toContainText("Corporate audit policy");
  await expect(libraryTable).toContainText("Audit policy");
  const components = await rows("system_components", { system_id: root.id });
  assert.equal(components.length, 1);
  assert.equal(components[0].system_element_id, child.id);
  assert.equal(
    components[0].applied_rationale,
    "The ground segment is operated from Sierra Vista.",
  );
  const contributions = await rows("component_contributions", {
    system_component_id: components[0].id,
  });
  assert.equal(contributions.length, 2);

  // Controls tab shows the seeded implementation.
  await tabs().getByRole("tab", { name: "Controls", exact: true }).click();
  const controlsTable = page.getByRole("table", { name: "Controls", exact: true });
  await page.getByPlaceholder("Find a control").fill(controlA.code);
  // Seeding creates the control-level SSP implementation as planned; the contribution under it is implemented.
  await expect(controlsTable.locator("tr[data-row-id]").first()).toContainText("Planned");

  // Evidence tab: the proposed use, decided.
  await tabs().getByRole("tab", { name: "Evidence", exact: true }).click();
  const evidenceTable = page.getByRole("table", { name: "Evidence at this element", exact: true });
  await expect(evidenceTable).toContainText("Corporate audit policy, signed");
  await expect(evidenceTable).toContainText("Pending");
  await evidenceTable
    .locator("tr[data-row-id]")
    .first()
    .getByRole("button", { name: /Row actions|Actions/ })
    .click();
  await page.getByRole("menuitem", { name: "Decide…" }).click();
  await page
    .getByRole("dialog", { name: "Decide on library evidence" })
    .getByRole("button", { name: "Accept", exact: true })
    .click();
  await expect(evidenceTable).toContainText("Accepted");
  const support = await rows("implementation_evidence", {
    evidence_version_id: artifactVersion.id,
  });
  assert.equal(support.length, 1);

  // Requirements tab: adopt from the library, then allocate an existing requirement.
  await tabs().getByRole("tab", { name: "Requirements", exact: true }).click();
  await page
    .getByRole("tabpanel")
    .getByRole("button", { name: "Add from library", exact: true })
    .click();
  await sheet().getByRole("row").filter({ hasText: "RQD-RETAIN" }).first().click();
  await sheet().getByRole("button", { name: "Continue", exact: true }).click();
  await sheet()
    .getByRole("button", { name: /Adopt and allocate to 1/ })
    .click();
  await expect(sheet()).toHaveCount(0);
  const requirementsTable = page.getByRole("table", {
    name: "Allocated requirements",
    exact: true,
  });
  await expect(requirementsTable).toContainText("RQD-RETAIN");
  await page.getByRole("button", { name: "Allocate…", exact: true }).click();
  await expect(sheet().getByRole("heading", { name: "Allocate requirements" })).toBeVisible();
  await sheet()
    .getByRole("checkbox", { name: /REQ-LOCAL|Select row/ })
    .first()
    .check();
  await sheet()
    .getByRole("button", { name: /Allocate 1 to SYS-CHILD/ })
    .click();
  await expect(sheet()).toHaveCount(0);
  await expect(requirementsTable).toContainText("REQ-LOCAL");
  const adopted = await rows("engineering_requirements", { program_id: program.id });
  assert.equal(adopted.length, 2);
  assert.ok(adopted.some((row) => row.definition_revision_id === requirementV1.id));

  // Version 2 in the library: the Library tab offers the review and takes it.
  const v2 = await insert("component_definition_revisions", {
    component_definition_id: definition.id,
    version_number: 2,
  });
  const policyV2 = await insert("defined_components", {
    component_definition_revision_id: v2.id,
    name: "Audit policy",
    component_type: "policy",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v2.id,
    defined_component_id: policyV2.id,
    control_id: controlA.id,
    description: "The corporate policy assigns audit responsibilities and names the reviewer role.",
    implementation_status: "implemented",
  });
  await insert("defined_component_implementations", {
    component_definition_revision_id: v2.id,
    defined_component_id: policyV2.id,
    control_id: controlB.id,
    description: "Audit events are defined by the corporate event list.",
    implementation_status: "implemented",
  });
  await update("component_definition_revisions", v2, { state: "published" });
  await page.reload();
  await tabs().getByRole("tab", { name: "Library", exact: true }).click();
  await expect(libraryTable).toContainText("v2 available");
  await libraryTable
    .locator("tr[data-row-id]")
    .filter({ hasText: "Corporate audit policy" })
    .click();
  await page
    .locator('[data-shell-area="panel"]')
    .getByRole("button", { name: "Review version 2" })
    .click();
  const review = page.getByRole("dialog", { name: "Take version 2" });
  await expect(review.getByRole("table", { name: "Changes by control" })).toContainText(
    "Will take the new narrative",
  );
  await review.getByLabel("Why this update is taken").fill("Version 2 names the reviewer role.");
  await review.getByRole("button", { name: "Take version 2", exact: true }).click();
  await expect(review).toHaveCount(0);
  await expect(
    libraryTable.locator("tr[data-row-id]").filter({ hasText: "Corporate audit policy" }),
  ).toContainText("2");
  await expect(libraryTable).not.toContainText("v2 available");
  const repinned = await rows("system_components", { system_id: root.id });
  assert.equal(repinned[0].defined_component_id, policyV2.id);

  // Add from library on the leaf, as a child element carrying the component.
  await page.goto(`${origin}/programs/${program.id}/systems/${child.id}?tab=Library`);
  await page
    .getByRole("main")
    .getByRole("button", { name: "Add from library", exact: true })
    .first()
    .click();
  await sheet().getByRole("row").filter({ hasText: "corp-audit" }).first().click();
  await sheet().getByRole("button", { name: "Continue", exact: true }).click();
  await expect(sheet().getByRole("checkbox", { name: /Create as a child element/ })).toBeChecked();
  await sheet().getByLabel("Element code under SYS-CHILD", { exact: true }).fill("ELEM-AUDIT");
  await sheet()
    .getByLabel("Element name under SYS-CHILD", { exact: true })
    .fill("Audit policy element");
  await sheet()
    .getByLabel("Rationale", { exact: true })
    .fill("The ground segment carries the audit policy as its own element.");
  await sheet()
    .getByRole("button", { name: /^Apply to 1$/ })
    .click();
  await expect(sheet()).toHaveCount(0);
  const created = await rows("systems", { parent_system_id: child.id });
  assert.equal(created.length, 1);
  assert.equal(created[0].code, "ELEM-AUDIT");
  assert.equal(created[0].system_type, "other");
  const createdComponents = await rows("system_components", { system_element_id: created[0].id });
  assert.equal(createdComponents.length, 1);
  assert.equal(createdComponents[0].defined_component_id, policyV2.id);
  await page.goto(`${origin}/programs/${program.id}?tab=System`);
  await expect(
    page.getByRole("treegrid").first().locator(`tr[data-row-id="${created[0].id}"]`),
  ).toContainText("Library");

  // The program's Library tab rolls it up once, with the element.
  await page.goto(`${origin}/programs/${program.id}?tab=Library`);
  const rollup = page.getByRole("table", { name: "Library items in this program", exact: true });
  await expect(rollup).toContainText("Corporate audit policy");
  // Two elements carry it: the new element is named, the child is folded into the count.
  await expect(rollup).toContainText("ELEM-AUDIT");
  await expect(rollup).toContainText("+1");

  // The requirements library lists the definition and who adopted it.
  await page.goto(`${origin}/library/requirements`);
  await expect(
    page.getByRole("table", { name: "Reusable requirements library", exact: true }),
  ).toContainText("RQD-RETAIN");
  await page.getByRole("row").filter({ hasText: "RQD-RETAIN" }).first().click();
  await expect(page.getByRole("main")).toContainText("Library reuse in the browser");
  assert.deepEqual(errors, []);
  console.log(
    "PASS add from library: component applied through the matrix, seeded controls, evidence use accepted, requirement adopted and allocated, existing requirement allocated, update review taken, program roll-up, requirements library",
  );
} catch (failure) {
  await page
    .screenshot({ path: "/tmp/add-from-library-failure.png", animations: "disabled" })
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
