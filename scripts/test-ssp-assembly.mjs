/** SSP assembly and narrative authoring, confined to a disposable workspace. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("ssp-assembly");
const { client, tenantId } = workspace;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const data = async (query) => {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
};
const insert = (table, values) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
async function expectSspFact(label, value) {
  const trigger = page.getByRole("button", { name: "SSP details", exact: true });
  if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
  await expect(
    page
      .locator("dl")
      .filter({ has: page.getByText(label, { exact: true }) })
      .locator("dd"),
  ).toHaveText(String(value));
}
try {
  const profile = await data(
    client
      .from("profile_revisions")
      .select()
      .is("tenant_id", null)
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
    client
      .from("selected_controls")
      .select()
      .eq("profile_resolution_id", resolution.id)
      .order("ordinal")
      .range(0, 999),
  );
  assert.ok(selected.length > 2 && selected.length < 1000);
  const controlRecords = await data(
    client
      .from("controls")
      .select()
      .in(
        "id",
        selected.slice(0, 2).map((row) => row.control_id),
      ),
  );
  const implementedControl = controlRecords.find((row) => row.id === selected[0].control_id);
  const missingControl = controlRecords.find((row) => row.id === selected[1].control_id);
  const program = await insert("programs", { code: "SSP-TEST", name: "SSP assembly validation" });
  const boundary = await insert("systems", {
    program_id: program.id,
    code: "BOUNDARY",
    name: "Assembly boundary",
    system_type: "information_system",
  });
  const child = await insert("systems", {
    program_id: program.id,
    parent_system_id: boundary.id,
    is_authorization_boundary: false,
    code: "CHILD",
    name: "Contributing child",
    system_type: "hardware",
  });
  const plan = await insert("ssp_revisions", {
    system_id: boundary.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  const implementation = await insert("implemented_requirements", {
    ssp_revision_id: plan.id,
    selected_control_id: selected[0].id,
    description: "Stored control narrative",
    implementation_status: "partial",
  });
  const component = await insert("system_components", {
    system_id: boundary.id,
    system_element_id: child.id,
    code: "COMPONENT",
    name: "Actual component",
    component_type: "hardware",
  });
  const contribution = await insert("component_contributions", {
    ssp_revision_id: plan.id,
    implemented_requirement_id: implementation.id,
    system_component_id: component.id,
    description: "Stored child contribution",
    implementation_status: "planned",
  });
  const requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-SSP-1",
  });
  const content = await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Assembly requirement",
    statement: "The boundary shall retain its recorded support.",
    acceptance_criteria: "Exact evidence remains linked.",
    requirement_type: "security",
  });
  await insert("requirement_allocations", {
    requirement_revision_id: content.id,
    system_id: child.id,
  });
  await insert("requirement_implementations", {
    requirement_revision_id: content.id,
    component_contribution_id: contribution.id,
    rationale: "Authored contribution support",
  });
  const artifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Exact supporting artifact",
    artifact_kind: "document",
  });
  const evidence = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    state: "published",
    external_uri: "https://example.invalid/ssp-test-v1",
    provenance: "Disposable browser test reference",
  });
  await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 2,
    state: "published",
    external_uri: "https://example.invalid/ssp-test-v2",
  });
  await insert("requirement_evidence", {
    requirement_revision_id: content.id,
    evidence_version_id: evidence.id,
    claim: "Requirement-level support",
  });
  await insert("implementation_evidence", {
    implemented_requirement_id: implementation.id,
    evidence_version_id: evidence.id,
    claim: "Control-level support",
  });

  await page.goto(`${origin}/programs/${program.id}?tab=Controls`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expectSspFact("Selected controls", selected.length);
  await expectSspFact("Control narratives", 1);
  await expectSspFact("Linked evidence versions", 1);
  await expect(page.getByRole("combobox", { name: "SSP selection" })).toHaveText("SSP 1 · Draft");
  const search = page.getByPlaceholder("Find selected controls");
  await search.fill(implementedControl.code);
  await page
    .getByRole("table", { name: "SSP control assembly" })
    .getByRole("button", { name: "Preview row", exact: true })
    .first()
    .click();
  await expect(page.locator('[data-shell-area="panel"]')).toBeVisible();
  await expect(page.getByText("Stored control narrative", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Assembly boundary / Contributing child", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "REQ-SSP-1", exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("table", { name: "SSP supporting evidence" })
      .getByText("Exact supporting artifact", { exact: true }),
  ).toHaveCount(1);
  await expect(page.getByText("Control-level support", { exact: true })).toBeVisible();
  await expect(page.getByText("Requirement-level support", { exact: true })).toBeVisible();
  await page
    .getByRole("table", { name: "SSP supporting evidence", exact: true })
    .getByRole("button", { name: "Preview row", exact: true })
    .click();
  await expect(page.getByText("Exact evidence version 1", { exact: true })).toBeVisible();
  const evidencePanel = page.locator('[data-shell-area="panel"]');
  await expect(evidencePanel).toHaveCount(1);
  await expect(
    evidencePanel.getByRole("heading", { name: artifact.title, exact: true }),
  ).toBeVisible();
  await expect(
    evidencePanel.getByRole("link", { name: "Open full record in new tab", exact: true }),
  ).toHaveAttribute("href", `/records/evidence_versions/${evidence.id}`);

  await expect(
    page.getByRole("link", { name: "https://example.invalid/ssp-test-v1", exact: true }),
  ).toBeVisible();
  assert.equal(
    await page.getByText("https://example.invalid/ssp-test-v2", { exact: true }).count(),
    0,
  );
  await page.getByRole("button", { name: "Back to previous record", exact: true }).click();
  await page.getByRole("button", { name: "Edit control implementation", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Updated authored control narrative");
  await page.getByRole("button", { name: "Edit control implementation", exact: true }).click();
  await expect(page.getByText("Updated authored control narrative", { exact: true })).toBeVisible();
  await expect
    .poll(
      async () =>
        (
          await data(
            client.from("implemented_requirements").select().eq("id", implementation.id).single(),
          )
        ).description,
    )
    .toBe("Updated authored control narrative");
  await page
    .locator('[data-shell-area="panel"]')
    .getByRole("button", { name: "Close details", exact: true })
    .click();

  await search.fill(missingControl.code);
  await page
    .getByRole("table", { name: "SSP control assembly" })
    .getByRole("button", { name: "Preview row", exact: true })
    .first()
    .click();
  await expect(page.getByText("No implementation record", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Create control implementation", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("New recorded narrative for a selected control");
  await page.getByRole("button", { name: "Create control implementation", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page
      .locator('[data-shell-area="panel"]')
      .getByText("New recorded narrative for a selected control", { exact: true }),
  ).toBeVisible();
  const newImplementation = await data(
    client
      .from("implemented_requirements")
      .select()
      .eq("ssp_revision_id", plan.id)
      .eq("selected_control_id", selected[1].id)
      .single(),
  );
  assert.equal(newImplementation.implementation_status, "planned");
  assert.equal(
    (await data(client.from("requirement_implementations").select().eq("tenant_id", tenantId)))
      .length,
    1,
  );
  assert.equal(
    (await data(client.from("requirement_revisions").select().eq("tenant_id", tenantId))).length,
    1,
  );
  await page
    .locator('[data-shell-area="panel"]')
    .getByRole("button", { name: "Close details", exact: true })
    .click();
  await page.goto(`${origin}/programs/${program.id}/systems/${boundary.id}`);
  await page.getByRole("tab", { name: "SSP", exact: true }).click();
  await expectSspFact("Selected controls", selected.length);
  await expectSspFact("Control narratives", 2);
  await page.screenshot({ path: "/tmp/ssp-assembly.png", fullPage: true, animations: "disabled" });

  await data(
    client.from("ssp_revisions").update({ state: "published", revision: 2 }).eq("id", plan.id),
  );
  await page.reload();
  await page.getByRole("tab", { name: "SSP", exact: true }).click();
  await expectSspFact("Selected controls", selected.length);
  await page.getByPlaceholder("Find selected controls").fill(implementedControl.code);
  await page
    .getByRole("table", { name: "SSP control assembly" })
    .getByRole("button", { name: "Preview row", exact: true })
    .first()
    .click();
  assert.equal(
    await page.getByRole("button", { name: "Edit control implementation", exact: true }).count(),
    0,
  );
  await page
    .locator('[data-shell-area="panel"]')
    .getByRole("button", { name: "Close details", exact: true })
    .click();

  // A smaller current system baseline still differs from the SSP, despite having
  // no extra controls to list. The SSP keeps every original selection and claim.
  await data(
    client.rpc("adopt_system_baseline", {
      p_tenant_id: tenantId,
      p_system_id: boundary.id,
      p_expected_revision: boundary.revision,
      p_request_id: randomUUID(),
      p_selection: {
        mode: "adopt",
        catalogRevisionId: implementedControl.catalog_revision_id,
        profileResolutionId: resolution.id,
        controlIds: selected.slice(1).map((row) => row.control_id),
        rationale: "Focused regression: remove one control from the system baseline.",
      },
    }),
  );
  await page.reload();
  await page.getByRole("tab", { name: "SSP", exact: true }).click();
  await expect(
    page.getByText("System baseline differs from this SSP", { exact: true }),
  ).toBeVisible();
  await expectSspFact("Selected controls", selected.length);
  assert.equal(
    await page.getByText("System controls outside this SSP selection", { exact: true }).count(),
    0,
  );
  assert.equal(
    (await data(client.from("ssp_revisions").select().eq("id", plan.id).single()))
      .profile_resolution_id,
    resolution.id,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS SSP selected-control assembly, missing narrative creation, stable requirement/contribution paths, exact evidence preview, sequential DS editing and published read-only behavior",
  );
} catch (error) {
  await page
    .screenshot({ path: "/tmp/ssp-assembly-failure.png", fullPage: true, animations: "disabled" })
    .catch(() => {});
  throw error;
} finally {
  await browser.close();
  await workspace.cleanup();
}
