/** Persistent review/citation workflows in a disposable local workspace. */
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { setTimeout as wait } from "node:timers/promises";
import { localWorkspace } from "./tests/local-workspace.mjs";
const origin = process.env.APP_TEST_URL ?? "http://localhost:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("assurance-review-browser");
const { client, tenantId } = workspace;
let browser;
let page;
const storedPaths = [];
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
async function eventually(check, message) {
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    if (await check()) return;
    await wait(100);
  }
  assert.fail(message);
}
try {
  const program = await insert("programs", {
    code: "CITATIONS",
    name: "Citation browser validation",
  });
  const req = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-CITE",
  });
  const reqVersion = await insert("requirement_revisions", {
    engineering_requirement_id: req.id,
    version_number: 1,
    title: "Retain audit events",
    statement: "Retain the events.",
    acceptance_criteria: "Verify retention.",
    requirement_type: "security",
  });
  const artifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Signed retention report",
    artifact_kind: "document",
    source_uri: "https://example.test/retention.pdf?edition=1",
  });
  const version = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    sha256: "c".repeat(64),
    state: "draft",
    media_type: "application/pdf",
  });
  const selected = await data(
    client.from("selected_controls").select("control_id").is("tenant_id", null).limit(1).single(),
  );
  const mapping = await insert("requirement_control_links", {
    requirement_revision_id: reqVersion.id,
    control_id: selected.control_id,
    relationship_type: "derived_from",
    rationale: "Cited basis",
  });
  const storedArtifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Uploaded retention report",
    artifact_kind: "document",
  });
  const storedId = randomUUID();
  const storedPath = `${tenantId}/${storedArtifact.id}/${storedId}/retention.txt`;
  const storedBytes = Buffer.from("Stored report: retention is verified for 365 days.");
  const storedHash = createHash("sha256").update(storedBytes).digest("hex");
  await insert("evidence_versions", {
    id: storedId,
    artifact_id: storedArtifact.id,
    version_number: 1,
    state: "draft",
    storage_object_name: storedPath,
  });
  const uploaded = await data(
    client.storage.from("evidence").upload(storedPath, storedBytes, { contentType: "text/plain" }),
  );
  storedPaths.push(storedPath);
  await data(
    client
      .from("evidence_versions")
      .update({ storage_object_id: uploaded.id, sha256: storedHash, revision: 2 })
      .eq("id", storedId),
  );
  // The first exact version must remain reachable beyond the initial 25 choices.
  await data(
    client.from("evidence_versions").insert(
      Array.from({ length: 26 }, (_, index) => ({
        tenant_id: tenantId,
        artifact_id: artifact.id,
        version_number: index + 2,
        state: "draft",
        sha256: "d".repeat(64),
      })),
    ),
  );
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const url = `${origin}/programs/${program.id}/requirements/${req.id}`;
  await page.goto(url);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const composer = page.getByRole("textbox", { name: "Start a review discussion", exact: true });
  await composer.waitFor();
  console.log("Requirement loaded; checking exact retry and discussion history.");
  const body = "Confirm the retention passage against this requirement.";
  await composer.fill(body);
  let lost = false;
  await page.route("**/rest/v1/rpc/command_assurance_review", async (route) => {
    if (!lost && route.request().postDataJSON()?.p_command?.operation === "create-thread") {
      lost = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: "Start discussion", exact: true }).click();
  await page
    .locator('[data-slot="composer-error"]')
    .filter({ hasText: "Retry will not post it twice" })
    .waitFor();
  assert.equal(await composer.inputValue(), body, "Failed response preserves draft");
  await page.getByRole("button", { name: "Start discussion", exact: true }).click();
  await page.getByRole("button", { name: body, exact: true }).waitFor();
  await page.unroute("**/rest/v1/rpc/command_assurance_review");
  const threads = await data(
    client.from("assurance_review_threads").select().eq("tenant_id", tenantId),
  );
  assert.equal(threads.length, 1, "Lost response retry creates one discussion");
  assert.equal(threads[0].created_by, workspace.userId);
  await page.getByRole("button", { name: body, exact: true }).click();
  let dialog = page.getByRole("dialog", { name: body, exact: true });
  await dialog.waitFor();
  await dialog
    .getByRole("button", { name: `Reply to ${threads[0].author_name}`, exact: true })
    .click();
  await dialog
    .getByRole("textbox", { name: "Reply to this discussion", exact: true })
    .fill("Confirmed against the signed report.");
  await dialog.getByRole("button", { name: "Reply", exact: true }).click();
  await dialog.getByText("Confirmed against the signed report.", { exact: true }).waitFor();
  await dialog.getByRole("button", { name: "Resolve discussion", exact: true }).click();
  await dialog.getByRole("button", { name: "Reopen discussion", exact: true }).waitFor();
  await dialog.getByRole("button", { name: "Reopen discussion", exact: true }).click();
  await dialog.getByText("Reopened this discussion.", { exact: true }).waitFor();
  const messages = await data(
    client.from("assurance_review_messages").select().eq("thread_id", threads[0].id),
  );
  assert.equal(messages.length, 4);
  assert.ok(
    messages.find((message) => message.body === "Confirmed against the signed report.").parent_id,
  );
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  console.log("Discussion checks passed; checking paged exact version citation.");
  await page.getByRole("button", { name: "Cite evidence passage", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Cite evidence passage", exact: true });
  await dialog.waitFor();
  await dialog
    .getByRole("textbox", { name: "Find evidence", exact: true })
    .fill("Signed retention report");
  await dialog.getByRole("button", { name: "Next evidence versions", exact: true }).click();
  await dialog.getByText("Versions page 2 of 2", { exact: true }).waitFor();
  await dialog.getByRole("combobox", { name: "Evidence version", exact: true }).click();
  await page
    .getByRole("option", { name: "Signed retention report · Version 1", exact: true })
    .click();
  const quote = "Audit events are retained for 365 days.";
  await dialog.getByRole("textbox", { name: "Exact quoted passage", exact: true }).fill(quote);
  await dialog.getByRole("textbox", { name: "Page number", exact: true }).fill("3");
  await dialog
    .getByRole("textbox", { name: "Page rectangle (optional)", exact: true })
    .fill("0.9, 0.2, 0.5, 0.1");
  await dialog.getByRole("button", { name: "Save citation", exact: true }).click();
  await dialog
    .locator('[data-slot="field-error"]')
    .filter({ hasText: "rectangle must fit the page" })
    .waitFor();
  await dialog
    .getByRole("textbox", { name: "Page rectangle (optional)", exact: true })
    .fill("0.1, 0.2, 0.5, 0.1");
  await dialog.getByRole("button", { name: "Save citation", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByText(quote, { exact: true }).waitFor();
  assert.equal(
    await page.getByRole("link", { name: /^Open cited source location/ }).getAttribute("href"),
    `${artifact.source_uri}#page=3`,
  );
  const citations = await data(
    client.from("assurance_citations").select().eq("tenant_id", tenantId),
  );
  assert.equal(citations.length, 1);
  assert.equal(citations[0].evidence_version_id, version.id);
  assert.equal(citations[0].evidence_sha256, "c".repeat(64));
  assert.equal(
    await page
      .getByRole("link", { name: "Signed retention report · Version 1", exact: true })
      .getAttribute("href"),
    `/evidence?version=${version.id}&citation=${citations[0].id}&reader=true`,
  );
  // Citation names now deep-link to the PDF reader. Its real attached-PDF navigation is
  // covered by test-evidence-reader-browser; this external source opens its version record.
  await page.goto(`${origin}/evidence?version=${version.id}`);
  const versionDialog = page.getByRole("dialog", {
    name: "Signed retention report · Version 1",
    exact: true,
  });
  await versionDialog.waitFor();
  await versionDialog.getByText(quote, { exact: true }).waitFor();
  assert.equal(
    await versionDialog
      .getByRole("link", { name: "Open requirement", exact: true })
      .getAttribute("href"),
    `/programs/${program.id}/requirements/${req.id}`,
  );
  const versionReview = versionDialog.locator('[data-slot="section"]').filter({
    has: page.getByRole("heading", { name: "Review discussions", exact: true }),
  });
  await versionReview
    .getByRole("textbox", { name: "Start a review discussion", exact: true })
    .fill("Version-specific provenance review.");
  await versionReview.getByRole("button", { name: "Start discussion", exact: true }).click();
  await versionDialog
    .getByRole("button", { name: "Version-specific provenance review.", exact: true })
    .waitFor();
  await eventually(async () => {
    const rows = await data(
      client.from("assurance_review_threads").select().eq("tenant_id", tenantId),
    );
    return rows.some((row) => row.target.kind === "evidence" && row.target.recordId === version.id);
  }, "Evidence review target was not persisted");
  console.log("External citation and version backlink passed; checking mapping and private file.");
  await page.goto(`${origin}/records/requirement_control_links/${mapping.id}`);
  await page
    .getByRole("textbox", { name: "Start a review discussion", exact: true })
    .fill("Mapping scope needs review.");
  await page.getByRole("button", { name: "Start discussion", exact: true }).click();
  await page.getByRole("button", { name: "Mapping scope needs review.", exact: true }).waitFor();
  await page.getByRole("button", { name: "Cite evidence passage", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Cite evidence passage", exact: true });
  await dialog
    .getByRole("textbox", { name: "Find evidence", exact: true })
    .fill("Uploaded retention report");
  await dialog.getByRole("combobox", { name: "Evidence version", exact: true }).click();
  await page
    .getByRole("option", { name: "Uploaded retention report · Version 1", exact: true })
    .click();
  await dialog
    .getByRole("textbox", { name: "Exact quoted passage", exact: true })
    .fill(storedBytes.toString());
  await dialog.getByRole("textbox", { name: "Page number", exact: true }).fill("1");
  await dialog.getByRole("button", { name: "Save citation", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download cited file", exact: true }).click();
  const download = await downloaded;
  assert.equal(download.suggestedFilename(), "retention.txt");
  assert.deepEqual(await readFile(await download.path()), storedBytes);
  const mappingCitations = await data(
    client
      .from("assurance_citations")
      .select()
      .eq("target", JSON.stringify({ kind: "mapping", recordId: mapping.id })),
  );
  assert.equal(mappingCitations.length, 1);
  assert.equal(mappingCitations[0].source_storage_object_id, uploaded.id);
  assert.equal(mappingCitations[0].evidence_sha256, storedHash);
  assert.equal(
    await page
      .getByRole("link", { name: "Uploaded retention report · Version 1", exact: true })
      .getAttribute("href"),
    `/evidence?version=${storedId}&citation=${mappingCitations[0].id}&reader=true`,
  );
  await page.goto(`${origin}/evidence?version=${storedId}`);
  const storedDialog = page.getByRole("dialog", {
    name: "Uploaded retention report · Version 1",
    exact: true,
  });
  await storedDialog.waitFor();
  assert.equal(
    await storedDialog
      .getByRole("link", { name: "Open control mapping", exact: true })
      .getAttribute("href"),
    `/records/requirement_control_links/${mapping.id}`,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(url);
  await page.getByText(quote, { exact: true }).waitFor();
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    "390px references and discussions stay contained",
  );
  await page.getByRole("button", { name: body, exact: true }).click();
  dialog = page.getByRole("dialog", { name: body, exact: true });
  await dialog.getByText("Confirmed against the signed report.", { exact: true }).waitFor();
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    "390px review dialog stays contained",
  );
  const dialogBounds = await dialog.boundingBox();
  for (const replyButton of await dialog.getByRole("button", { name: /^Reply to / }).all()) {
    assert.equal(await replyButton.innerText(), "Reply");
    const bounds = await replyButton.boundingBox();
    assert.ok(
      bounds.x >= dialogBounds.x && bounds.x + bounds.width <= dialogBounds.x + dialogBounds.width,
      "Long author names do not overflow reply actions",
    );
  }
  await page.screenshot({
    path: "/private/tmp/assurance-review-mobile.png",
    animations: "disabled",
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: lost-response exact retry, authored replies/resolve/reopen, exact version/hash/page/rectangle citation, evidence backlink/deep link, mapping discussions and backlinks, hash-verified private file downloads, persistence and 390px layout.",
  );
} catch (error) {
  if (page)
    await page
      .screenshot({ path: "/private/tmp/assurance-review-failure.png", fullPage: true })
      .catch(() => {});
  throw error;
} finally {
  if (browser) await browser.close();
  await workspace.cleanup();
  if (storedPaths.length) await data(workspace.admin.storage.from("evidence").remove(storedPaths));
}
