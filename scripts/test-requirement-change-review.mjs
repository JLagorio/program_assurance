/** Historical discussions retain their original source lines after later in-place edits. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect as browserExpect } from "playwright/test";
const expect = browserExpect.configure({ timeout: 30000 });
import { localWorkspace } from "./tests/local-workspace.mjs";
const origin = process.env.APP_TEST_URL ?? "http://localhost:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("requirement-change-review");
const { client, tenantId } = workspace;
let browser;
let page;
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
try {
  const program = await insert("programs", {
    code: "CHANGE-REVIEW",
    name: "Historical change review",
  });
  const requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-CHANGE",
  });
  const before = "Keep audit events for thirty days.\nReview access monthly.";
  const after = "Keep audit events for ninety days.\nReview access weekly.";
  const revision = await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Audit retention policy",
    statement: before,
    acceptance_criteria: "Verify the recorded retention period.",
    requirement_type: "security",
  });
  async function edit(statement, fields = {}) {
    const current = await data(
      client.from("requirement_revisions").select().eq("id", revision.id).single(),
    );
    return data(
      client.rpc("edit_requirement", {
        p_tenant_id: tenantId,
        p_request_id: randomUUID(),
        p_requirement_id: requirement.id,
        p_content_id: revision.id,
        p_expected_revision: current.revision,
        p_patch: { statement, ...fields },
      }),
    );
  }
  await edit(after);
  const events = await data(
    client.from("activity_events").select().eq("requirement_revision_id", revision.id),
  );
  const event = events.find((entry) => entry.changes?.statement?.after === after);
  assert.ok(event);
  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const url = `${origin}/programs/${program.id}/requirements/${requirement.id}?tab=Edit%20history&edit=${event.id}&field=statement&side=after&startLine=1&endLine=1`;
  await page.goto(url);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const comparison = page
    .getByRole("group", { name: "Statement, before and after this edit", exact: true })
    .filter({ hasText: "Keep audit events for thirty" })
    .filter({ hasText: "Keep audit events for ninety" });
  await expect(comparison).toBeVisible();
  await expect(comparison.locator('[data-selected="true"]')).toContainText("ninety");
  await comparison.getByRole("button", { name: "Side by side", exact: true }).click();
  await comparison
    .getByRole("button", { name: "Discuss After this edit line 1", exact: true })
    .click();
  let dialog = page.getByRole("dialog", { name: /Discuss selected (passage|change)/ });
  const subject = "Review the immutable audit change";
  await dialog
    .getByRole("textbox", { name: "Start a review discussion", exact: true })
    .fill(subject);
  await dialog.getByRole("button", { name: "Start discussion", exact: true }).click();
  dialog = page.getByRole("dialog", { name: subject, exact: true });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.locator('[data-slot="prose"]').filter({ hasText: "Captured source context" }),
  ).toContainText("ninety");
  await dialog.getByRole("button", { name: "Resolve discussion", exact: true }).click();
  await dialog.getByRole("button", { name: "Reopen discussion", exact: true }).click();
  await expect(dialog.getByText("Reopened this discussion.", { exact: true })).toBeVisible();
  const [thread] = await data(
    client.from("assurance_review_threads").select().eq("tenant_id", tenantId),
  );
  assert.deepEqual(thread.target, {
    kind: "requirement-change",
    recordId: requirement.id,
    editId: event.id,
    field: "statement",
    side: "after",
    startLine: 1,
    endLine: 1,
  });
  assert.ok(JSON.stringify(thread.target_context).includes("ninety"));
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    comparison.getByRole("button", { name: "Discuss After this edit line 1", exact: true }),
  ).toBeFocused();
  await expect(
    comparison.getByRole("button", { name: `Open discussion: ${subject}`, exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/requirement-change-review-desktop.png",
    animations: "disabled",
  });
  await edit("Keep audit events for one year.\nReview access daily.");
  await page.goto(url);
  await expect(
    comparison.getByRole("button", { name: `Open discussion: ${subject}`, exact: true }),
  ).toBeVisible();
  await comparison
    .getByRole("button", { name: `Open discussion: ${subject}`, exact: true })
    .click();
  dialog = page.getByRole("dialog", { name: subject, exact: true });
  await expect(
    dialog.locator('[data-slot="prose"]').filter({ hasText: "Captured source context" }),
  ).toContainText("ninety");
  await expect(
    dialog.locator('[data-slot="prose"]').filter({ hasText: "Captured source context" }),
  ).not.toContainText("one year");
  const retained = await data(
    client.from("assurance_review_threads").select().eq("id", thread.id).single(),
  );
  assert.deepEqual(retained.target_context, thread.target_context);
  const contents = await data(
    client.from("requirement_revisions").select().eq("engineering_requirement_id", requirement.id),
  );
  assert.equal(contents.length, 1, "Discussion does not create another requirement revision");
  await page.keyboard.press("Escape");
  await expect(
    comparison.getByRole("button", { name: `Open discussion: ${subject}`, exact: true }),
  ).toBeFocused();

  // A deep link must bring the selected source line into view, even after all context unfolds.
  const longBefore = Array.from({ length: 100 }, (_, index) =>
    index === 69 ? "Long audit period: thirty days." : `Unchanged policy paragraph ${index + 1}.`,
  ).join("\n");
  const longAfter = longBefore.replace("thirty", "ninety");
  await edit(longBefore);
  await edit(longAfter);
  const history = await data(
    client.from("activity_events").select().eq("requirement_revision_id", revision.id),
  );
  const longEvent = history.find((entry) => entry.changes?.statement?.after === longAfter);
  assert.ok(longEvent);
  const longUrl = `${origin}/programs/${program.id}/requirements/${requirement.id}?tab=Edit%20history&edit=${longEvent.id}&field=statement&side=after&startLine=70&endLine=70`;
  await page.goto(longUrl);
  const longDiff = page
    .getByRole("group", { name: "Statement, before and after this edit", exact: true })
    .filter({ hasText: "Long audit period: thirty" })
    .filter({ hasText: "Long audit period: ninety" });
  const selectedLine = longDiff.locator('[data-selected="true"]');
  await expect(selectedLine).toContainText("ninety");
  await expect
    .poll(async () =>
      selectedLine.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= window.innerHeight;
      }),
    )
    .toBe(true);
  await expect
    .poll(async () =>
      selectedLine.evaluate(
        (node) => node.closest('[data-slot="diff-change"]') === document.activeElement,
      ),
    )
    .toBe(true);
  // Stay in the mounted record while changing the anchor: invalid ranges must clear old marks.
  await page.evaluate(
    (href) => {
      history.pushState(null, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    longUrl.replace("startLine=70&endLine=70", "startLine=700&endLine=700"),
  );
  await expect(longDiff.locator('[data-selected="true"]')).toHaveCount(0);
  await page.goBack();
  await expect(selectedLine).toContainText("ninety");
  await expect
    .poll(async () =>
      selectedLine.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.top >= 0 && box.bottom <= window.innerHeight;
      }),
    )
    .toBe(true);
  await page.screenshot({
    path: "/private/tmp/requirement-change-review-long.png",
    animations: "disabled",
  });

  // Scalar edits keep readable before/after values and the same exact historical discussion anchor.
  const nextTitle = "Audited retention policy";
  await edit(longAfter, { title: nextTitle });
  const titleEvents = await data(
    client.from("activity_events").select().eq("requirement_revision_id", revision.id),
  );
  const titleEvent = titleEvents.find((entry) => entry.changes?.title?.after === nextTitle);
  assert.ok(titleEvent);
  const titleUrl = `${origin}/programs/${program.id}/requirements/${requirement.id}?tab=Edit%20history&edit=${titleEvent.id}&field=title&side=after&startLine=1&endLine=1`;
  await page.goto(titleUrl);
  const titleChange = page
    .getByRole("group", { name: "Title, before and after this edit", exact: true })
    .filter({ hasText: nextTitle });
  await expect(titleChange).toBeFocused();
  await expect(titleChange).toContainText("Audit retention policy");
  await expect(titleChange.locator('[data-slot="diff"]')).toHaveCount(0);
  await titleChange.getByRole("button", { name: "Discuss title change", exact: true }).click();
  dialog = page.getByRole("dialog", { name: "Discuss selected change", exact: true });
  await expect(dialog).toContainText(nextTitle);
  const scalarSubject = "Review the historical title";
  await dialog
    .getByRole("textbox", { name: "Start a review discussion", exact: true })
    .fill(scalarSubject);
  await dialog.getByRole("button", { name: "Start discussion", exact: true }).click();
  dialog = page.getByRole("dialog", { name: scalarSubject, exact: true });
  await expect(dialog).toBeVisible();
  const scalarThread = await data(
    client.from("assurance_review_threads").select().eq("subject", scalarSubject).single(),
  );
  assert.deepEqual(scalarThread.target, {
    kind: "requirement-change",
    recordId: requirement.id,
    editId: titleEvent.id,
    field: "title",
    side: "after",
    startLine: 1,
    endLine: 1,
  });
  assert.equal(scalarThread.target_context.selectedText, nextTitle);
  await page.keyboard.press("Escape");
  await expect(
    titleChange.getByRole("button", { name: `Open discussion: ${scalarSubject}`, exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/private/tmp/requirement-change-review-scalar.png",
    animations: "disabled",
  });
  await page.goto(titleUrl);
  await expect(titleChange).toBeFocused();
  await expect(
    titleChange.getByRole("button", { name: `Open discussion: ${scalarSubject}`, exact: true }),
  ).toBeVisible();

  await page.goto(url);
  await page.setViewportSize({ width: 390, height: 844 });
  await comparison.getByRole("button", { name: "Side by side", exact: true }).click();
  await comparison.scrollIntoViewIfNeeded();
  assert.ok(
    await comparison.evaluate((node) => node.scrollWidth <= node.clientWidth),
    "Narrow diff stays inside its frame",
  );
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "Phone page does not overflow",
  );
  await page.screenshot({
    path: "/private/tmp/requirement-change-review-phone.png",
    animations: "disabled",
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: historical discussions, retained focus, resolve/reopen, immutable context, visible line-70 deep links, invalid-anchor clearing, scalar review and 390px layout.",
  );
} catch (error) {
  if (page) {
    const details = page.getByRole("button", { name: "Technical details", exact: true });
    if (await details.count()) await details.click().catch(() => {});
    console.error((await page.locator("body").innerText()).slice(-7000));
  }
  if (page)
    await page
      .screenshot({ path: "/private/tmp/requirement-change-review-failure.png", fullPage: true })
      .catch(() => {});
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
