/** Real saved-view, source-search and attention workflows in a disposable workspace. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
import { setTimeout as wait } from "node:timers/promises";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL ?? "http://localhost:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("workspace-capabilities-browser");
const { client, tenantId } = workspace;
let browser;
let page;
async function data(query) {
  const response = await query;
  assert.ifError(response.error);
  return response.data;
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
  const until = Date.now() + 30000;
  while (Date.now() < until) {
    if (await check()) return;
    await wait(100);
  }
  assert.fail(message);
}
async function contained(label) {
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    `${label} stays within the viewport`,
  );
}
async function openSavedViews() {
  await page.getByRole("button", { name: "Saved views", exact: true }).click();
}
async function setCompact(desired) {
  await page.getByRole("button", { name: "Table settings", exact: true }).click();
  const item = page.getByRole("menuitemcheckbox", { name: "Compact rows", exact: true });
  if ((await item.getAttribute("aria-checked")) === String(desired))
    await page.keyboard.press("Escape");
  else {
    await item.click();
    await page.keyboard.press("Escape");
  }
}
async function openSearch(query) {
  await page
    .getByRole("button", { name: "Search records, views, and actions", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Search and actions", exact: true });
  await dialog.getByPlaceholder("Search records, views, or actions…", { exact: true }).fill(query);
  return dialog;
}
try {
  const program = await insert("programs", {
    code: "CAP-ALPHA",
    name: "Capability Alpha",
    status: "active",
  });
  await insert("programs", { code: "CAP-BETA", name: "Capability Beta", status: "planned" });
  const requirement = await insert("engineering_requirements", {
    program_id: program.id,
    code: "REQ-CAPABILITY",
  });
  const statement = `Preserve the searchable assurance clause ${workspace.run}.`;
  await insert("requirement_revisions", {
    engineering_requirement_id: requirement.id,
    version_number: 1,
    title: "Assurance retention rule",
    statement,
    acceptance_criteria: "A traceable source exists.",
    requirement_type: "security",
  });
  const artifact = await insert("evidence_artifacts", {
    program_id: program.id,
    title: "Capability evidence",
    artifact_kind: "document",
    source_uri: "https://example.test/capability.pdf",
  });
  const version = await insert("evidence_versions", {
    artifact_id: artifact.id,
    version_number: 1,
    sha256: "d".repeat(64),
    state: "draft",
  });
  const target = { kind: "requirement", recordId: requirement.id };
  const passage = `Unique cited retention passage ${workspace.run}.`;
  const citation = await data(
    client.rpc("command_assurance_review", {
      p_tenant_id: tenantId,
      p_request_id: randomUUID(),
      p_command: {
        operation: "create-citation",
        target,
        evidenceVersionId: version.id,
        expectedEvidenceRevision: version.revision,
        passage,
        page: 7,
      },
    }),
  );
  const subject = "Review the new assurance basis";
  const thread = await data(
    client.rpc("command_assurance_review", {
      p_tenant_id: tenantId,
      p_request_id: randomUUID(),
      p_command: { operation: "create-thread", target, subject, body: "Check the cited source." },
    }),
  );

  browser = await chromium.launch({ headless: true });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/programs`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const find = page.getByRole("searchbox", { name: "Find programs", exact: true });
  await find.waitFor();
  await page.getByRole("link", { name: "Capability Alpha", exact: true }).waitFor();
  await find.fill("Alpha");
  await eventually(
    async () => !(await page.getByRole("link", { name: "Capability Beta", exact: true }).count()),
    "Program query must filter rows",
  );
  await setCompact(true);
  await openSavedViews();
  await page.getByRole("menuitem", { name: "Save current view…", exact: true }).click();
  let dialog = page.getByRole("dialog", { name: "Save current view", exact: true });
  await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("Alpha compact review");
  let lost = false;
  await page.route("**/rest/v1/rpc/save_assurance_view", async (route) => {
    if (!lost) {
      lost = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await dialog.getByRole("button", { name: "Save current view", exact: true }).click();
  await dialog.getByRole("alert").waitFor();
  assert.equal(
    await dialog.getByRole("textbox", { name: "Name", exact: true }).inputValue(),
    "Alpha compact review",
  );
  await dialog.getByRole("button", { name: "Save current view", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page.unroute("**/rest/v1/rpc/save_assurance_view");
  const saved = await data(client.from("assurance_saved_views").select().eq("tenant_id", tenantId));
  assert.equal(saved.length, 1, "Save response loss must not duplicate views");
  assert.equal(saved[0].visibility, "private");
  assert.equal(saved[0].definition.layout.density, "compact");
  assert.ok(saved[0].definition.question.serialized.includes("Alpha"));
  await find.fill("");
  await setCompact(false);
  await page.reload();
  await find.waitFor();
  await openSavedViews();
  await page.getByRole("menuitem", { name: "Alpha compact review", exact: true }).click();
  await eventually(
    async () => (await find.inputValue()) === "Alpha",
    "Saved query must restore after reload",
  );
  await eventually(
    async () => (await page.locator('[data-density="compact"]').count()) > 0,
    "Saved density must restore",
  );
  await contained("Desktop saved views");
  await page.screenshot({
    path: "/private/tmp/workspace-capabilities-programs-desktop.png",
    animations: "disabled",
  });

  dialog = await openSearch("searchable assurance clause");
  await dialog.getByRole("option").filter({ hasText: "Assurance retention rule" }).click();
  await page.waitForURL(`**/programs/${program.id}/requirements/${requirement.id}`);
  await page.getByText(statement, { exact: true }).first().waitFor();
  dialog = await openSearch("Unique cited retention passage");
  await dialog.getByRole("option").filter({ hasText: passage }).click();
  await eventually(async () => {
    const current = new URL(page.url());
    return (
      current.pathname === "/evidence" &&
      current.searchParams.get("artifact") === artifact.id &&
      current.searchParams.get("version") === version.id &&
      current.searchParams.get("citation") === citation.citationId
    );
  }, "Search must open exact cited artifact, version and citation");
  const evidenceDialog = page.getByRole("dialog", {
    name: "Capability evidence · Version 1",
    exact: true,
  });
  await evidenceDialog.getByText(passage, { exact: true }).waitFor();
  assert.equal(
    await evidenceDialog
      .getByRole("link", { name: /^Open cited source location/ })
      .getAttribute("href"),
    `${artifact.source_uri}#page=7`,
  );

  await page.goto(`${origin}/work?view=attention`);
  const inbox = page.getByRole("table", { name: "Attention inbox", exact: true });
  await inbox.waitFor();
  const reviewRow = () =>
    inbox
      .getByRole("row")
      .filter({ has: page.getByRole("button", { name: subject, exact: true }) });
  async function chooseDone() {
    await reviewRow()
      .getByRole("button", { name: /actions/i })
      .click();
    await page.getByRole("menuitem", { name: "Done", exact: true }).click();
  }
  async function markDone() {
    await chooseDone();
    await page.getByRole("button", { name: "Undo", exact: true }).waitFor();
  }
  const readReviewAck = async () => {
    const items = await data(
      client.rpc("read_assurance_attention", { p_tenant_id: tenantId, p_state: "all" }),
    );
    return items.rows.find((row) => row.item_key === `review:${thread.threadId}`);
  };
  const attentionRequests = [];
  await page.route("**/rest/v1/rpc/command_assurance_attention", async (route) => {
    attentionRequests.push(route.request().postDataJSON());
    if (attentionRequests.length === 1) {
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await chooseDone();
  await page.getByRole("button", { name: "Retry", exact: true }).waitFor();
  const committedDone = await readReviewAck();
  assert.equal(committedDone.state, "done");
  const otherTabRestore = await data(
    client.rpc("command_assurance_attention", {
      p_tenant_id: tenantId,
      p_request_id: randomUUID(),
      p_command: {
        itemKey: committedDone.item_key,
        sourceRevision: committedDone.source_revision,
        expectedVersion: committedDone.ack_version,
        operation: "set-state",
        state: null,
      },
    }),
  );
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).waitFor();
  assert.deepEqual(
    attentionRequests[0],
    attentionRequests[1],
    "Retry retains the exact acknowledgment request and base version",
  );
  await page.unroute("**/rest/v1/rpc/command_assurance_attention");
  await reviewRow().getByText("Unread", { exact: true }).waitFor();
  assert.equal(
    (await readReviewAck()).ack_version,
    otherTabRestore.version,
    "Retry cannot overwrite the newer tab",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Reload attention", exact: true }).waitFor();
  assert.equal(
    (await readReviewAck()).ack_version,
    otherTabRestore.version,
    "Stale Undo must leave the newer acknowledgment unchanged",
  );
  await page.getByRole("button", { name: "Reload attention", exact: true }).click();
  await page
    .getByRole("button", { name: "Reload attention", exact: true })
    .waitFor({ state: "hidden" });
  await markDone();
  await eventually(
    async () => (await reviewRow().count()) === 0,
    "Done hides the current review revision",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await reviewRow().waitFor();
  await markDone();
  await page.getByRole("combobox", { name: "Show attention", exact: true }).click();
  await page.getByRole("option", { name: "Done", exact: true }).click();
  await reviewRow().getByRole("button", { name: subject, exact: true }).click();
  const doneDialog = page.getByRole("dialog", { name: subject, exact: true });
  await doneDialog.waitFor();
  await page.keyboard.press("Escape");
  await doneDialog.waitFor({ state: "hidden" });
  assert.equal((await readReviewAck()).state, "done", "Opening a Done item must keep it completed");
  await page.getByRole("combobox", { name: "Show attention", exact: true }).click();
  await page.getByRole("option", { name: "Open", exact: true }).click();
  await data(
    client.rpc("command_assurance_review", {
      p_tenant_id: tenantId,
      p_request_id: randomUUID(),
      p_command: {
        operation: "reply",
        threadId: thread.threadId,
        body: "Updated evidence basis requires attention again.",
      },
    }),
  );
  await page.reload();
  await reviewRow().waitFor();
  await reviewRow().getByText("Unread", { exact: true }).waitFor();
  const acknowledgments = await data(
    client.from("assurance_attention_acknowledgments").select().eq("tenant_id", tenantId),
  );
  assert.ok(
    acknowledgments.some(
      (row) =>
        row.item_key === `review:${thread.threadId}` &&
        row.source_revision === "1" &&
        row.state === "done",
    ),
  );
  assert.ok(
    !acknowledgments.some(
      (row) => row.item_key === `review:${thread.threadId}` && row.source_revision === "2",
    ),
  );
  await contained("Desktop attention");
  await page.screenshot({
    path: "/private/tmp/workspace-capabilities-attention-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await contained("390px attention");
  await page.screenshot({
    path: "/private/tmp/workspace-capabilities-attention-mobile.png",
    animations: "disabled",
  });
  await page.goto(`${origin}/programs`);
  await find.waitFor();
  await openSavedViews();
  await page.getByRole("menuitem", { name: "Alpha compact review", exact: true }).click();
  await contained("390px saved view");
  dialog = await openSearch("Unique cited retention passage");
  await dialog.getByRole("option").filter({ hasText: passage }).waitFor();
  await contained("390px source search");
  await page.screenshot({
    path: "/private/tmp/workspace-capabilities-search-mobile.png",
    animations: "disabled",
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: saved query/density after reload, exact retry after lost save response, requirement statement and citation/version source navigation, personal attention retained-receipt Retry, stale Undo Reload, Done/Undo, opening Done, and new-revision reappearance, desktop and 390px containment.",
  );
} catch (error) {
  if (page) {
    const details = page.getByText("Technical details", { exact: true });
    if (await details.count()) await details.click().catch(() => {});
    console.error("Page error:", error.message);
    await page
      .screenshot({
        path: "/private/tmp/workspace-capabilities-failure.png",
        animations: "disabled",
      })
      .catch(() => {});
    console.error("Failed URL:", page.url());
    console.error((await page.locator("body").innerText()).slice(0, 10000));
  }
  throw error;
} finally {
  if (browser) await browser.close();
  await workspace.cleanup();
}
