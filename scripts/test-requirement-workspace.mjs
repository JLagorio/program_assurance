/** Restored requirement preview and evidence workflows, in a disposable workspace. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:3000";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("requirement-workspace");
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
async function insert(table, values) {
  return data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...values })
      .select()
      .single(),
  );
}
async function linked(revisionId) {
  return data(
    client.from("requirement_evidence").select().eq("requirement_revision_id", revisionId),
  );
}
function picker() {
  return page.getByRole("dialog", { name: "Add evidence", exact: true });
}
async function chooseEvidence(title) {
  await picker().getByRole("searchbox", { name: "Search records", exact: true }).fill(title);
  const row = picker()
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: title, exact: true }) });
  await row.getByRole("checkbox").check();
}
try {
  const program = await insert("programs", {
    code: "RESTORE",
    name: "Requirements workspace check",
  });
  const system = await insert("systems", {
    program_id: program.id,
    code: "SYS",
    name: "Validation system",
    system_type: "information_system",
  });
  const node = await insert("composition_nodes", {
    system_id: system.id,
    code: "NODE",
    name: "Boundary service",
    node_type: "service",
  });
  const requirements = [];
  for (const [code, title, statement] of [
    [
      "REQ-01",
      "Boundary protection",
      "The service shall reject requests outside its authorized boundary.",
    ],
    ["REQ-02", "Request logging", "The service shall record each rejected request."],
    ["REQ-03", "Unversioned requirement", null],
  ]) {
    const identity = await insert("engineering_requirements", { program_id: program.id, code });
    const revision = statement
      ? await insert("requirement_revisions", {
          engineering_requirement_id: identity.id,
          version_number: 1,
          title,
          statement,
          acceptance_criteria: "The recorded verification demonstrates the statement.",
          requirement_type: "security",
        })
      : null;
    requirements.push({ ...identity, current: revision });
  }
  const [parent, child, unversioned] = requirements;
  await insert("requirement_decompositions", {
    parent_requirement_revision_id: parent.current.id,
    child_requirement_revision_id: child.current.id,
  });
  await insert("requirement_allocations", {
    requirement_revision_id: parent.current.id,
    composition_node_id: node.id,
    rationale: "The service enforces the boundary.",
  });
  const artifact = await insert("evidence_artifacts", {
    title: "Existing boundary evidence",
    artifact_kind: "document",
    program_id: program.id,
  });
  const version = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    state: "published",
    published_at: new Date().toISOString(),
    external_uri: "https://example.test/boundary",
  });
  const draftArtifact = await insert("evidence_artifacts", {
    title: "Unpublished evidence",
    artifact_kind: "document",
    program_id: program.id,
  });
  await insert("evidence_versions", { artifact_id: draftArtifact.id, version_number: 1 });

  await page.goto(`${origin}/programs/${program.id}?tab=Requirements`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("treegrid", { name: "Engineering requirements", exact: true }).waitFor();
  const table = page.getByRole("treegrid", { name: "Engineering requirements", exact: true });
  const search = page.getByRole("searchbox", { name: "Find a requirement", exact: true });
  await table
    .locator(`tr[data-row-id="${unversioned.id}"]`)
    .getByRole("link", { name: unversioned.code, exact: true })
    .first()
    .waitFor();
  assert.ok(await table.getByText("Details not recorded", { exact: true }).count());
  await search.fill("REQ-0");
  const parentRow = table
    .getByRole("row")
    .filter({ has: page.getByRole("link", { name: parent.code, exact: true }) });
  await parentRow.getByRole("button", { name: "Preview row", exact: true }).click();
  await page.getByRole("heading", { name: parent.current.title, exact: true }).waitFor();
  assert.equal(new URL(page.url()).searchParams.get("requirementId"), parent.id);
  assert.equal(await search.inputValue(), "REQ-0");
  await page.getByRole("button", { name: "Next record", exact: true }).click();
  await page.getByRole("heading", { name: child.current.title, exact: true }).waitFor();
  await page.getByRole("button", { name: "Previous record", exact: true }).click();
  await page.getByRole("heading", { name: parent.current.title, exact: true }).waitFor();
  await page.screenshot({ path: "/tmp/requirement-preview-restored.png", animations: "disabled" });
  await page.getByRole("tab", { name: "Evidence", exact: true }).last().click();
  await page.getByRole("button", { name: "Add evidence", exact: true }).first().click();
  await picker().waitFor();
  const bounds = await picker().boundingBox();
  assert.ok(bounds.width >= 1400 && bounds.height >= 950, "Evidence chooser occupies the viewport");
  assert.equal(await page.getByRole("dialog").count(), 1);
  assert.equal(
    await picker().getByText(draftArtifact.title, { exact: true }).count(),
    0,
    "Draft evidence is not eligible",
  );
  const evidenceRow = picker()
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: artifact.title, exact: true }) });
  await evidenceRow.getByRole("button", { name: "Preview row", exact: true }).click();
  await picker().getByRole("heading", { name: artifact.title, exact: true }).waitFor();
  assert.equal(
    await page.getByRole("dialog").count(),
    1,
    "Evidence preview stays inside the chooser",
  );
  await page.screenshot({ path: "/tmp/evidence-browser-restored.png", animations: "disabled" });
  await page.keyboard.press("Escape");
  assert.equal(await picker().count(), 1, "Escape dismisses the inner preview first");
  await chooseEvidence(artifact.title);
  await picker().getByRole("button", { name: "Create evidence artifact", exact: true }).click();
  const create = page.getByRole("dialog", { name: "Create evidence artifact", exact: true });
  await create.waitFor();
  assert.equal(
    await page.getByRole("dialog").count(),
    1,
    "Creation replaces the chooser without stacking dialogs",
  );
  await create.getByRole("button", { name: "Cancel", exact: true }).click();
  await picker().getByText("1 selected", { exact: true }).waitFor();
  await picker().getByRole("button", { name: "Create evidence artifact", exact: true }).click();
  await create
    .getByRole("textbox", { name: "Artifact title", exact: true })
    .fill("New linked evidence");
  await create.getByRole("combobox", { name: "Kind", exact: true }).click();
  await page.getByRole("option", { name: "Document", exact: true }).click();
  await create
    .getByLabel("External reference", { exact: true })
    .fill("https://example.test/new-evidence");
  await create.getByRole("button", { name: "Create evidence artifact", exact: true }).click();
  const prepare = page.getByRole("dialog", { name: "Prepare evidence", exact: true });
  await prepare.getByRole("button", { name: "Publish version", exact: true }).click();
  await prepare.getByText(/Version published\. Return to the browser/).waitFor();
  assert.equal(
    (await linked(parent.current.id)).length,
    0,
    "Publication alone does not link evidence",
  );
  await prepare.getByRole("button", { name: "Back to evidence browser", exact: true }).click();
  await picker().getByText("1 selected", { exact: true }).waitFor();
  await chooseEvidence("New linked evidence");
  await picker().getByText("2 selected", { exact: true }).waitFor();

  const rpc = "**/rest/v1/rpc/link_requirement_evidence";
  await page.route(rpc, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Temporary test service failure" }),
    }),
  );
  await picker().getByRole("button", { name: "Link evidence (2)", exact: true }).click();
  await picker().getByRole("alert").filter({ hasText: "Temporary test service failure" }).waitFor();
  assert.equal((await linked(parent.current.id)).length, 0);
  await picker().getByText("2 selected", { exact: true }).waitFor();
  await page.unroute(rpc);
  await picker().getByRole("button", { name: "Link evidence (2)", exact: true }).click();
  await picker().waitFor({ state: "hidden" });
  const saved = await linked(parent.current.id);
  assert.equal(saved.length, 2);
  assert.ok(saved.some((row) => row.evidence_version_id === version.id));
  assert.ok(saved.every((row) => row.claim === null && row.applicability_rationale === null));
  await page.goto(`${origin}/programs/${program.id}/requirements/${parent.id}?tab=Evidence`);
  await page.getByRole("heading", { name: parent.current.title, exact: true }).waitFor();
  await page.getByRole("cell", { name: "New linked evidence", exact: true }).waitFor();
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page.getByText(parent.current.statement, { exact: true }).waitFor();
  await page.goto(`${origin}/programs/${program.id}?tab=Requirements&requirementId=${parent.id}`);
  await page.getByRole("heading", { name: parent.current.title, exact: true }).waitFor();
  assert.equal(
    await page.getByRole("combobox", { name: "Requirement revision", exact: true }).count(),
    0,
  );
  await page.getByRole("tab", { name: "Evidence", exact: true }).last().click();
  await page.reload();
  await page.getByRole("heading", { name: parent.current.title, exact: true }).waitFor();
  await page.getByRole("cell", { name: "New linked evidence", exact: true }).waitFor();
  const fullPagePromise = context.waitForEvent("page");
  await page.getByRole("link", { name: "Open full record in new tab", exact: true }).click();
  const fullPage = await fullPagePromise;
  fullPage.on("pageerror", (error) => errors.push(error.message));
  await fullPage.getByRole("heading", { name: parent.current.title, exact: true }).waitFor();
  assert.equal(new URL(fullPage.url()).searchParams.get("revisionId"), null);
  assert.equal(new URL(fullPage.url()).searchParams.get("tab"), "Evidence");
  await fullPage.getByRole("cell", { name: "New linked evidence", exact: true }).waitFor();
  await fullPage.reload();
  await fullPage.getByRole("heading", { name: parent.current.title, exact: true }).waitFor();
  assert.equal(
    await fullPage.getByRole("combobox", { name: "Requirement revision", exact: true }).count(),
    0,
  );
  await fullPage.getByRole("cell", { name: "New linked evidence", exact: true }).waitFor();
  await fullPage.close();
  assert.equal(
    (
      await data(
        client
          .from("requirement_revisions")
          .select()
          .eq("engineering_requirement_id", unversioned.id),
      )
    ).length,
    0,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS requirements: hierarchy, preview navigation, shared full record, no revision controls, large evidence browser, internal preview, retained selections, create/publish/link, failed-save retry, exact evidence version pins.",
  );
} catch (error) {
  console.error((await page.locator("body").innerText()).slice(0, 9000));
  await page.screenshot({ path: "/tmp/requirement-workspace-failure.png", fullPage: true });
  throw error;
} finally {
  await browser.close();
  await workspace.cleanup();
}
