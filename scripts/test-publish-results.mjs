#!/usr/bin/env node
/**
 * Publish assessment results, end to end in the run's own disposable workspace: a campaign whose
 * draft results hold one finding. Its record lists the draft (Draft, 1 finding, not published),
 * and its Actions item offers to publish it. In the Review queue the results' preview publishes
 * them: a first attempt is refused inside the prompt, since the results changed after the reader
 * read them, and nothing is published; the second, confirmed, publishes them, a toast says so,
 * the row leaves the queue and the preview stays on the results, its primary in place saying why
 * it no longer runs. The campaign record then lists the results as Published by the account, and
 * its Actions item says why there is nothing more to publish; the program's Activity and the
 * Portfolio's Recent activity say who published the campaign's results, linked to the campaign.
 */
import assert from "node:assert/strict";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect as playwrightExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";
import { expectPreviewHeader } from "./tests/preview-header.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const expect = playwrightExpect.configure({ timeout: 30000 });
const workspace = await localWorkspace("publish-results");
const screenshots =
  process.env.PATTERN_ARTIFACT_DIR || (await mkdtemp(join(tmpdir(), "publish-results-")));
await mkdir(screenshots, { recursive: true });
const errors = [];
let browser;
let page;

async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
}
const panel = () => page.locator('[data-shell-area="panel"]');
const header = () => panel().locator('[data-slot="shell-panel-header"]');
const status = () => header().locator('[data-slot="preview-navigation"] [role="status"]');
const recordHeader = () => panel().locator("[data-record-preview-header]:visible");
/** The open confirmation. */
const prompt = () => page.getByRole("alertdialog", { name: "Publish assessment results?" });
/** The value of a fact of the open preview, by its label. */
const fact = (label) =>
  panel()
    .locator('[data-slot="key-value"]')
    .filter({ has: page.locator("dt").getByText(label, { exact: true }) })
    .locator("dd");
/** Escape ends the preview; a tooltip open on the focused control takes the first press. */
async function escapePreview() {
  await expect
    .poll(
      async () => {
        if (await panel().count()) await page.keyboard.press("Escape");
        return panel().count();
      },
      { intervals: [300], message: "Escape closes the whole preview" },
    )
    .toBe(0);
}

try {
  const client = workspace.client;
  const insert = async (table, values) =>
    data(
      client
        .from(table)
        .insert(
          Array.isArray(values)
            ? values.map((value) => ({ tenant_id: workspace.tenantId, ...value }))
            : { tenant_id: workspace.tenantId, ...values },
        )
        .select(),
    );
  const publish = async (table, row) =>
    data(
      client
        .from(table)
        .update({
          state: "published",
          published_at: new Date().toISOString(),
          revision: row.revision + 1,
        })
        .eq("id", row.id)
        .select(),
    );

  // ——— A campaign whose draft results hold one finding, in this run's workspace ———————————————
  // The account publishes under a name the feeds can say.
  const account = await data(
    client.from("parties").select("id,revision").eq("auth_user_id", workspace.userId).single(),
  );
  const publisher = "Priya Publisher";
  await data(
    client
      .from("parties")
      .update({ name: publisher, revision: account.revision + 1 })
      .eq("id", account.id)
      .select(),
  );
  // The reference data the results judge: a published baseline, a control it selects and a part.
  const resolution = await data(
    client
      .from("profile_resolutions")
      .select("id")
      .is("tenant_id", null)
      .eq("state", "published")
      .order("id")
      .limit(1)
      .single(),
  );
  const selection = await data(
    client
      .from("selected_controls")
      .select("id,control_id")
      .eq("profile_resolution_id", resolution.id)
      .order("ordinal")
      .limit(1)
      .single(),
  );
  const part = await data(
    client
      .from("control_parts")
      .select("id")
      .eq("control_id", selection.control_id)
      .order("id")
      .limit(1)
      .single(),
  );
  const [program] = await insert("programs", { code: "PUBLISH", name: "Publish flow program" });
  const [system] = await insert("systems", {
    program_id: program.id,
    code: "PUBLISH-SYS",
    name: "Publish flow system",
    system_type: "information_system",
  });
  const [ssp] = await insert("ssp_revisions", {
    system_id: system.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  await insert("implemented_requirements", {
    ssp_revision_id: ssp.id,
    selected_control_id: selection.id,
    description: "Publish flow implementation narrative.",
  });
  await publish("ssp_revisions", ssp);
  const campaignTitle = "Publish flow campaign";
  const [campaign] = await insert("assessment_campaigns", {
    program_id: program.id,
    title: campaignTitle,
  });
  const [plan] = await insert("assessment_plan_revisions", {
    campaign_id: campaign.id,
    ssp_revision_id: ssp.id,
    version_number: 1,
    title: "Publish flow plan",
  });
  await publish("assessment_plan_revisions", plan);
  const resultsTitle = "Publish flow interim results";
  const [results] = await insert("assessment_results_revisions", {
    assessment_plan_revision_id: plan.id,
    version_number: 1,
    title: resultsTitle,
  });
  const [resultSet] = await insert("result_sets", {
    assessment_results_revision_id: results.id,
    title: "Publish flow result set",
  });
  await insert("assessment_findings", {
    assessment_results_revision_id: results.id,
    result_set_id: resultSet.id,
    target_control_part_id: part.id,
    title: "Publish flow finding",
    determination: "satisfied",
  });
  const said = `${publisher} published assessment results of ${campaignTitle}`;
  const savedResults = () =>
    data(
      client
        .from("assessment_results_revisions")
        .select("state,revision,published_by_party_id,published_at")
        .eq("id", results.id)
        .single(),
    );
  const events = () =>
    data(
      client
        .from("activity_events")
        .select(
          "id,program_id,assessment_campaign_id,actor_party_id,event_type,description,occurred_at",
        )
        .eq("tenant_id", workspace.tenantId),
    );

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  context.setDefaultTimeout(30000);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native ${dialog.type()} dialog: ${dialog.message()}`);
    void dialog.dismiss();
  });
  await page.goto(`${origin}/campaigns/${campaign.id}`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  // ——— The campaign record lists its draft results, which its Actions item publishes ————————
  await expect(page.getByRole("heading", { level: 1, name: campaignTitle })).toBeVisible();
  const resultsTable = page.getByRole("table", { name: "Assessment results", exact: true });
  const resultsRow = resultsTable.locator(`tbody tr[data-row-id="${results.id}"]`);
  await expect(resultsRow).toHaveCount(1);
  await expect(resultsRow.locator("th")).toContainText(resultsTitle);
  await expect(resultsRow).toContainText("Draft");
  await expect(resultsRow).toContainText("Not published");
  // A results revision has no page: its name opens its preview, whose primary publishes a draft.
  await resultsRow.getByRole("button", { name: resultsTitle, exact: true }).click();
  await expectPreviewHeader(page, {
    title: resultsTitle,
    recordActions: ["Publish assessment results"],
    fullRecord: false,
  });
  await expect(fact("Findings")).toHaveText("1");
  await expect(fact("Published by")).toContainText("Not published");
  await escapePreview();
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  const menuItem = page.getByRole("menuitem", { name: "Publish assessment results" });
  await expect(menuItem).toBeVisible();
  await expect(menuItem).not.toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Escape");
  await expect(menuItem).toHaveCount(0);
  console.log("PASS the campaign record lists its draft results, which its Actions item publishes");

  // ——— The Review queue's preview: a refusal inside the prompt, then the publication ——————————
  await page.goto(`${origin}/review-queue`);
  const queue = page.getByRole("table", { name: "Review queue", exact: true });
  const queueRow = queue.locator(`tbody tr[data-row-id="${results.id}"]`);
  await expect(queueRow).toHaveCount(1);
  await expect(queueRow).toContainText("Assessment results to publish");
  await queueRow.getByRole("button", { name: resultsTitle, exact: true }).click();
  await expectPreviewHeader(page, {
    title: resultsTitle,
    recordActions: ["Publish assessment results"],
    fullRecord: false,
  });
  const publishButton = recordHeader().getByRole("button", {
    name: "Publish assessment results",
    exact: true,
  });
  // It waits while the results revision is read, for the revision the reader saw.
  await expect(publishButton).toBeEnabled();
  await publishButton.click();
  await expect(prompt()).toBeVisible();
  await expect(prompt()).toContainText(
    `${resultsTitle} holds 1 finding. Publishing freezes it: from then on the program's control statuses and traces read it, and it can no longer change.`,
  );
  // Someone edits the results while the prompt is open: the reader's revision is now behind.
  const before = await savedResults();
  await data(
    client
      .from("assessment_results_revisions")
      .update({ description: "Edited while the prompt was open.", revision: before.revision + 1 })
      .eq("id", results.id)
      .eq("revision", before.revision)
      .select(),
  );
  // The refusal reads the results again; the next attempt must start from that read.
  const readAgain = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname.endsWith("/rest/v1/assessment_results_revisions") &&
      url.searchParams.get("id") === `eq.${results.id}`
    );
  });
  await prompt().getByRole("button", { name: "Publish assessment results", exact: true }).click();
  await expect(prompt().getByRole("alert")).toContainText(
    "The assessment results were not published",
  );
  await expect(prompt().getByRole("alert")).toContainText(
    "These assessment results changed since you read them. Reload them before publishing.",
  );
  assert.equal((await savedResults()).state, "draft", "A refused publication publishes nothing");
  assert.deepEqual(await events(), [], "A refused publication records nothing");
  await readAgain;
  await prompt().getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(prompt()).toHaveCount(0);
  await expect(publishButton).toBeFocused();
  console.log(
    "PASS a publication of results changed since they were read is refused in its prompt",
  );

  await publishButton.click();
  await expect(prompt()).toContainText(`${resultsTitle} holds 1 finding.`);
  await prompt().getByRole("button", { name: "Publish assessment results", exact: true }).click();
  await expect(prompt()).toHaveCount(0);
  await expect(
    page.locator('[data-slot="toast"]').filter({ hasText: "Assessment results published" }),
  ).toContainText(resultsTitle);
  // The results leave the queue, which has nothing else waiting; the preview stays on them, its
  // primary in place, saying why it no longer runs, with focus where the reader left it.
  await expect(queueRow).toHaveCount(0);
  await expect(page.getByText("Nothing waiting on a reviewer", { exact: true })).toBeVisible();
  await expect(
    recordHeader().getByRole("heading", { level: 2, name: resultsTitle, exact: true }),
  ).toBeVisible();
  await expect(publishButton).toBeDisabled();
  await expect(publishButton).toHaveAccessibleDescription(
    "These assessment results are published.",
  );
  await expect(publishButton).toBeFocused();
  await expect(status()).toHaveText(`${resultsTitle}, outside the current results`);
  const saved = await savedResults();
  assert.equal(saved.state, "published");
  assert.equal(saved.published_by_party_id, account.id, "The account published the results");
  const recorded = await events();
  assert.equal(recorded.length, 1, "One activity event records the publication");
  assert.deepEqual(
    {
      program: recorded[0].program_id,
      campaign: recorded[0].assessment_campaign_id,
      actor: recorded[0].actor_party_id,
      type: recorded[0].event_type,
      description: recorded[0].description,
      at: new Date(recorded[0].occurred_at).getTime(),
    },
    {
      program: program.id,
      campaign: campaign.id,
      actor: account.id,
      type: "published",
      description: `published assessment results of ${campaignTitle}\n${resultsTitle}: 1 finding.`,
      at: new Date(saved.published_at).getTime(),
    },
    "The event names who published, the program and the campaign, at the publication",
  );
  await escapePreview();
  console.log("PASS the queue's preview publishes the results, which leave the queue");

  // ——— The campaign record lists them as published by the account ——————————————————————————
  await page.goto(`${origin}/campaigns/${campaign.id}`);
  await expect(resultsRow).toHaveCount(1);
  await expect(resultsRow).toContainText("Published");
  await expect(resultsRow).toContainText(publisher);
  await expect(resultsRow).not.toContainText("Not published");
  await resultsRow.getByRole("button", { name: resultsTitle, exact: true }).click();
  // Published results offer nothing more to do.
  await expectPreviewHeader(page, { title: resultsTitle, recordActions: [], fullRecord: false });
  await expect(fact("Published by")).toContainText(publisher);
  await expect(fact("State")).toHaveText("Published");
  await escapePreview();
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(menuItem).toHaveAttribute("aria-disabled", "true");
  await expect(menuItem).toHaveAccessibleDescription(
    "This campaign's assessment results are all published.",
  );
  await page.keyboard.press("Escape");
  await expect(menuItem).toHaveCount(0);
  console.log("PASS the campaign record lists the results published by the account, nothing left");

  // ——— The program's Activity and the Portfolio's Recent activity say who published ——————————
  await page.goto(`${origin}/programs/${program.id}`);
  const programActivity = page.getByRole("list", { name: "Program activity" });
  const programEntry = programActivity.getByRole("link", { name: said, exact: true });
  await programEntry.scrollIntoViewIfNeeded();
  await expect(programEntry).toHaveAttribute("href", `/campaigns/${campaign.id}`);
  await expect(programActivity).toContainText(`${resultsTitle}: 1 finding.`);
  console.log("PASS the program's Activity says who published the campaign's results");

  await page.goto(`${origin}/`);
  const feed = page.getByRole("list", { name: "Recent activity" });
  const feedEntry = feed.getByRole("link", { name: said, exact: true });
  await expect(feedEntry).toHaveAttribute("href", `/campaigns/${campaign.id}`);
  await expect(feed).toContainText(`${resultsTitle}: 1 finding.`);
  await expect(feed).toContainText(program.name);
  console.log("PASS the Portfolio's Recent activity says who published, in which program");

  assert.deepEqual(errors, [], "Browser has no uncaught errors or native dialogs");
} catch (error) {
  if (page) {
    console.error((await page.locator("body").innerText()).slice(-6000));
    const shot = join(screenshots, "publish-results-failure.png");
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    console.error(`Failure screenshot: ${shot}`);
  }
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
