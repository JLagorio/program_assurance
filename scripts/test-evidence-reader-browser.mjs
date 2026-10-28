/** Exercise actual PDF rendering and selection through the private evidence route. */
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { chromium } from "playwright";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { evidenceAssessmentFixture } from "./tests/evidence-assessment-fixture.mjs";
const origin = process.env.APP_TEST_URL ?? "http://localhost:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const w = await localWorkspace("evidence-reader-browser");
const { client, tenantId } = w;
let browser, page;
const paths = [];
const data = async (q) => {
  const r = await q;
  assert.ifError(r.error);
  return r.data;
};
const insert = (table, value) =>
  data(
    client
      .from(table)
      .insert({ tenant_id: tenantId, ...value })
      .select()
      .single(),
  );
try {
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(30000);
  await page.setContent(
    '<html><body><h1>Recovery exercise</h1><p>The recovery exercise completed successfully.</p><p>Every critical service resumed within the agreed recovery window.</p><div style="break-before:page"><h1>Second page</h1><p>Independent review confirmed the restoration results.</p></div></body></html>',
  );
  const bytes = await page.pdf({ format: "A4", printBackground: true });
  const program = await insert("programs", { code: "PDF", name: "PDF reader checks" });
  const req = await insert("engineering_requirements", { program_id: program.id, code: "REQ-PDF" });
  await insert("requirement_revisions", {
    engineering_requirement_id: req.id,
    version_number: 1,
    title: "Restore critical services",
    statement: "Services shall be restored.",
    requirement_type: "security",
    acceptance_criteria: "Verify source evidence.",
  });
  const finding = await evidenceAssessmentFixture(client, tenantId, program.id);
  const artifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Recovery exercise report",
    artifact_kind: "document",
  });
  const id = randomUUID(),
    path = `${tenantId}/${artifact.id}/${id}/recovery.pdf`;
  paths.push(path);
  await insert("evidence_versions", {
    id,
    artifact_id: artifact.id,
    version_number: 1,
    state: "draft",
    storage_object_name: path,
    media_type: "application/pdf",
    byte_size: bytes.length,
  });
  const uploaded = await data(
    client.storage.from("evidence").upload(path, bytes, { contentType: "application/pdf" }),
  );
  await data(
    client
      .from("evidence_versions")
      .update({
        storage_object_id: uploaded.id,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        revision: 2,
      })
      .eq("id", id),
  );
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${origin}/evidence?version=${id}&reader=true`);
  await page.getByLabel("Email", { exact: true }).fill(w.email);
  await page.getByLabel("Password", { exact: true }).fill(w.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("document", { name: "Page 1 text" })
    .getByText("The recovery exercise completed successfully.", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Find in page", exact: true }).click();
  const find = page.getByRole("group", { name: "Find on current page", exact: true });
  const findInput = find.getByRole("textbox", { name: "Find on current page", exact: true });
  assert.equal(await findInput.evaluate((el) => el === document.activeElement), true);
  await findInput.fill("recovery");
  await find.getByText("1 of 3 matches", { exact: true }).waitFor();
  assert.equal(await page.locator('[data-document-anchor-id^="find:1:"]').count(), 3);
  await find.getByRole("button", { name: "Next match", exact: true }).click();
  await find.getByText("2 of 3 matches", { exact: true }).waitFor();
  await findInput.press("Shift+Enter");
  await find.getByText("1 of 3 matches", { exact: true }).waitFor();
  await findInput.fill(".");
  await find.getByText("1 of 2 matches", { exact: true }).waitFor();
  await findInput.fill("[");
  await find.getByText("0 of 0 matches", { exact: true }).waitFor();
  assert.equal(await page.locator('[data-document-anchor-id^="find:"]').count(), 0);
  await findInput.fill("recovery");
  await find.getByText("1 of 3 matches", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await page.waitForFunction(() =>
    document
      .querySelector('[role=document][aria-label="Page 2 text"]')
      ?.textContent.includes("Independent review confirmed the restoration results."),
  );
  await find.getByText("Page 2 only", { exact: true }).waitFor();
  await find.getByText("0 of 0 matches", { exact: true }).waitFor();
  assert.equal(await page.locator('[data-document-anchor-id^="find:1:"]').count(), 0);
  await findInput.fill("review");
  await find.getByText("1 of 1 matches", { exact: true }).waitFor();
  const match = page.getByRole("button", { name: "Find result 1 of 1: review", exact: true });
  await match.click();
  assert.equal(await match.getAttribute("aria-pressed"), "true");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await find.getByText("1 of 1 matches", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Fit page width", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await find.getByText("1 of 1 matches", { exact: true }).waitFor();
  await page.waitForFunction(() => {
    const mark = document.querySelector('[data-document-anchor-id="find:2:0:0"]');
    const bounds = mark?.getBoundingClientRect();
    return bounds && bounds.width > 0 && bounds.right <= innerWidth;
  });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: "/private/tmp/evidence-reader-find-mobile.png", fullPage: true });
  await findInput.press("Escape");
  await find.waitFor({ state: "hidden" });
  assert.equal(await page.locator('[data-document-anchor-id^="find:"]').count(), 0);
  assert.equal(
    await page
      .getByRole("button", { name: "Find in page", exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.setViewportSize({ width: 1440, height: 1100 });
  console.log(
    "PDF current-page literal find, navigation, resize, focus return and isolated match anchors passed.",
  );
  console.log("PDF page rendering and text extraction passed.");
  await page.getByRole("button", { name: "Previous page", exact: true }).click();
  const select = async () => {
    const text = page
      .getByRole("document", { name: "Page 1 text" })
      .getByText("The recovery exercise completed successfully.", { exact: true });
    await text.waitFor();
    await text.evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));
    });
    await page.getByRole("button", { name: "Cite selection", exact: true }).waitFor();
  };
  await select();
  await page.getByRole("button", { name: "Cite selection", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Cite evidence passage", exact: true });
  await dialog.waitFor();
  assert.equal(
    await dialog.getByLabel("Exact quoted passage", { exact: true }).inputValue(),
    "The recovery exercise completed successfully.",
  );
  assert.equal(await dialog.getByLabel("Page number", { exact: true }).inputValue(), "1");
  await dialog.getByRole("combobox", { name: "Supporting record", exact: true }).click();
  await page.getByRole("option", { name: "REQ-PDF", exact: true }).click();
  await dialog.getByRole("button", { name: "Save citation", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const citations = await data(
    client.from("assurance_citations").select().eq("evidence_version_id", id),
  );
  assert.equal(citations.length, 1);
  assert.ok(citations[0].rectangle.width > 0 && citations[0].rectangle.height > 0);
  await page.goto(`${origin}/evidence?citation=${citations[0].id}`);
  await page.getByRole("button", { name: /Cited passage, page 1:/ }).waitFor();
  await page.getByRole("link", { name: "Open supporting record", exact: true }).waitFor();
  await page.screenshot({ path: "/private/tmp/evidence-reader-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Close passage", exact: true }).click();
  await select();
  await page.getByRole("button", { name: "Discuss selection", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Discuss selected passage", exact: true });
  await dialog
    .getByRole("textbox", { name: "Start a review discussion", exact: true })
    .fill("Check this restoration claim.");
  await dialog.getByRole("button", { name: "Start discussion", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("textbox", { name: "Reply to this discussion", exact: true }).waitFor();
  await page
    .getByRole("textbox", { name: "Reply to this discussion", exact: true })
    .fill("Validated against the test run.");
  await page.getByRole("button", { name: "Reply", exact: true }).click();
  await page.getByText("Validated against the test run.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Resolve discussion", exact: true }).click();
  await page.getByRole("button", { name: "Reopen discussion", exact: true }).waitFor();
  const threads = await data(
    client
      .from("assurance_review_threads")
      .select()
      .eq("target->>kind", "passage")
      .eq("target->>recordId", id),
  );
  assert.equal(threads.length, 1);
  assert.equal(threads[0].target_context.passage, "The recovery exercise completed successfully.");
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileSheet = page.getByRole("dialog", {
    name: "Check this restoration claim.",
    exact: true,
  });
  await mobileSheet.waitFor();
  await mobileSheet
    .getByRole("textbox", { name: "Reply to this discussion", exact: true })
    .fill("Keep this unsent reply.");
  await mobileSheet.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  assert.equal(
    await mobileSheet
      .getByRole("textbox", { name: "Reply to this discussion", exact: true })
      .inputValue(),
    "Keep this unsent reply.",
  );
  await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  await page.screenshot({ path: "/private/tmp/evidence-reader-mobile.png", fullPage: true });
  await mobileSheet
    .getByRole("textbox", { name: "Reply to this discussion", exact: true })
    .fill("");
  await mobileSheet.getByRole("button", { name: "Close", exact: true }).click();
  await mobileSheet.waitFor({ state: "hidden" });
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    "No page overflow at390",
  );
  await page.setViewportSize({ width: 1440, height: 1100 });
  await select();
  await page.getByRole("button", { name: "Cite selection", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Cite evidence passage", exact: true });
  await dialog.getByRole("combobox", { name: "Reference from", exact: true }).click();
  await page.getByRole("option", { name: "Assessment finding", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Supporting record", exact: true }).click();
  await page.getByRole("option", { name: "Recovery restoration finding", exact: true }).click();
  await dialog.getByRole("button", { name: "Save citation", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const findingCitation = await data(
    client
      .from("assurance_citations")
      .select()
      .eq("target->>kind", "assessment-finding")
      .eq("target->>recordId", finding.id)
      .single(),
  );
  assert.equal(findingCitation.evidence_version_id, id);
  await page.goto(`${origin}/records/assessment_findings/${finding.id}`);
  await page.getByRole("link", { name: "Read cited passage", exact: true }).waitFor();
  await page.getByRole("link", { name: "Read cited passage", exact: true }).click();
  await page
    .getByRole("button", { name: /Cited passage, page 1:/ })
    .first()
    .waitFor();
  await page.getByRole("button", { name: "Close passage", exact: true }).click();
  await page.getByRole("button", { name: "Select region", exact: true }).click();
  const box = await page.locator('[data-slot="document-page"]').boundingBox();
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.3);
  await page.mouse.up();
  await page.getByRole("button", { name: "Cite selection", exact: true }).waitFor();
  await page.getByRole("button", { name: "Clear selection", exact: true }).click();
  // A later draft attachment must not change what an existing citation/discussion reads.
  const replacementPage = await browser.newPage();
  await replacementPage.setContent(
    "<html><body><h1>Replacement report</h1><p>This is a later attachment.</p></body></html>",
  );
  const replacement = await replacementPage.pdf({ format: "A4" });
  await replacementPage.close();
  const laterPath = `${tenantId}/${artifact.id}/${id}/later.pdf`;
  paths.push(laterPath);
  const versionBeforeReplacement = await data(
    client.from("evidence_versions").select("revision").eq("id", id).single(),
  );
  await data(
    client
      .from("evidence_versions")
      .update({
        storage_object_id: null,
        storage_object_name: laterPath,
        sha256: null,
        revision: versionBeforeReplacement.revision + 1,
      })
      .eq("id", id),
  );
  const laterObject = await data(
    client.storage
      .from("evidence")
      .upload(laterPath, replacement, { contentType: "application/pdf" }),
  );
  await data(
    client
      .from("evidence_versions")
      .update({
        storage_object_id: laterObject.id,
        sha256: createHash("sha256").update(replacement).digest("hex"),
        byte_size: replacement.length,
        revision: versionBeforeReplacement.revision + 2,
      })
      .eq("id", id),
  );
  await page.goto(`${origin}/evidence?citation=${citations[0].id}`);
  await page.getByText("You are reading a captured source file.", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Close passage", exact: true }).click();
  const oldText = page
    .getByRole("document", { name: "Page 1 text" })
    .getByText("The recovery exercise completed successfully.", { exact: true });
  await oldText.waitFor();
  await oldText.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));
  });
  assert.equal(await page.getByRole("button", { name: "Cite selection", exact: true }).count(), 0);
  assert.equal(
    await page.getByRole("button", { name: "Discuss selection", exact: true }).count(),
    0,
  );
  const oldHash = createHash("sha256").update(bytes).digest("hex");
  await page.goto(
    `${origin}/evidence?version=${id}&reader=true&sha256=${oldHash}&page=1&rectangle=${encodeURIComponent(JSON.stringify(citations[0].rectangle))}`,
  );
  await page
    .getByRole("document", { name: "Page 1 text" })
    .getByText("The recovery exercise completed successfully.", { exact: true })
    .waitFor();
  await page.goto(`${origin}/evidence?version=${id}&reader=true`);
  await page
    .getByRole("document", { name: "Page 1 text" })
    .getByText("This is a later attachment.", { exact: true })
    .waitFor();
  assert.equal(await page.getByRole("button", { name: /Cited passage, page 1:/ }).count(), 0);
  // Unsupported content, malformed PDF and digest mismatch never fall through to a renderer.
  for (const [name, content, hash, message] of [
    ["text.txt", Buffer.from("Plain evidence text."), null, "This attachment is not a PDF."],
    ["broken.pdf", Buffer.from("%PDF-1.4 malformed document"), null, "Invalid PDF structure."],
    ["mismatch.pdf", bytes, "0".repeat(64), "SHA-256"],
  ]) {
    const badId = randomUUID(),
      badPath = `${tenantId}/${artifact.id}/${badId}/${name}`;
    paths.push(badPath);
    await insert("evidence_versions", {
      id: badId,
      artifact_id: artifact.id,
      version_number: paths.length,
      state: "draft",
      storage_object_name: badPath,
      media_type: name.endsWith("pdf") ? "application/pdf" : "text/plain",
      byte_size: content.length,
    });
    const object = await data(
      client.storage.from("evidence").upload(badPath, content, {
        contentType: name.endsWith("pdf") ? "application/pdf" : "text/plain",
      }),
    );
    await data(
      client
        .from("evidence_versions")
        .update({
          storage_object_id: object.id,
          sha256: hash ?? createHash("sha256").update(content).digest("hex"),
          revision: 2,
        })
        .eq("id", badId),
    );
    await page.goto(`${origin}/evidence?version=${badId}&reader=true`);
    await page.getByText(message, { exact: false }).waitFor();
    assert.equal(await page.locator('[data-slot="document-page"]').count(), 0);
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real PDF pages, current-page find, literal matches, navigation/resize/focus, extracted text selection, automatic citation quote/page/region, requirement target and persistence, direct citation-only link/highlight, anchored thread/reply/resolve, assessment citations/backlinks, region selection, mobile guarded Sheet, malformed/nonPDF/hash rejection and desktop/mobile bounds.",
  );
} catch (error) {
  if (page) console.log(await page.locator("body").textContent());
  if (page)
    console.log(
      await page.locator("[role=document]").evaluateAll((nodes) =>
        nodes.map((n) => ({
          html: n.innerHTML.slice(0, 5000),
          rect: n.getBoundingClientRect().toJSON(),
          style: n.getAttribute("style"),
        })),
      ),
    );
  if (page)
    await page
      .screenshot({ path: "/private/tmp/evidence-reader-failure.png", fullPage: true })
      .catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await w.cleanup();
  if (paths.length) await data(w.admin.storage.from("evidence").remove(paths));
}
