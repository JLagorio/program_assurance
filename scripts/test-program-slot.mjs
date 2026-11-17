#!/usr/bin/env node
/**
 * The program's action slot and the acts held to its roles, end to end in the run's own disposable
 * workspace: a program with a package version submitted with no decision and draft results that
 * hold a finding. While the program records nobody in any role, its Overview keeps Edit program as
 * its primary and draws no slot. Once the account is its authorizing official, the Overview and
 * the Authorization view end their header with the sign Button in the account's name ("Signing as
 * authorizing official"), which opens Record authorization decision with the account as its
 * decision maker and a sign Button as its confirm, and Edit program sits behind More program
 * actions; the Schedule names who the
 * submitted version and the draft results wait on. Once somebody else is, the slot says Waiting on
 * them (their role and what for), the package version's Record authorization decision keeps its
 * place and says only they can record it, and the campaign's Publish assessment results says only
 * the lead assessor can publish.
 */
import assert from "node:assert/strict";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { expect as playwrightExpect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";

const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
const expect = playwrightExpect.configure({ timeout: 30000 });
const workspace = await localWorkspace("program-slot");
const screenshots =
  process.env.PATTERN_ARTIFACT_DIR || (await mkdtemp(join(tmpdir(), "program-slot-")));
await mkdir(screenshots, { recursive: true });
const errors = [];
let browser;
let page;

async function data(query) {
  const result = await query;
  assert.ifError(result.error);
  return result.data;
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
  const publish = async (table, row, more = {}) =>
    data(
      client
        .from(table)
        .update({
          state: "published",
          published_at: new Date().toISOString(),
          revision: row.revision + 1,
          ...more,
        })
        .eq("id", row.id)
        .select(),
    );

  // ——— A program whose package waits on a decision and whose draft results hold a finding ————
  const account = await data(
    client.from("parties").select("id,revision").eq("auth_user_id", workspace.userId).single(),
  );
  const signer = "Avery Signer";
  await data(
    client
      .from("parties")
      .update({ name: signer, revision: account.revision + 1 })
      .eq("id", account.id)
      .select(),
  );
  const [official, lead] = await insert("parties", [
    { party_type: "person", name: "R. Calloway" },
    { party_type: "person", name: "D. Lead" },
  ]);
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
  const [program] = await insert("programs", { code: "SLOT", name: "Slot flow program" });
  const [system] = await insert("systems", {
    program_id: program.id,
    code: "SLOT-SYS",
    name: "Slot flow system",
    system_type: "information_system",
    is_authorization_boundary: true,
  });
  const [ssp] = await insert("ssp_revisions", {
    system_id: system.id,
    profile_resolution_id: resolution.id,
    version_number: 1,
  });
  await insert("implemented_requirements", {
    ssp_revision_id: ssp.id,
    selected_control_id: selection.id,
    description: "Slot flow implementation narrative.",
  });
  await publish("ssp_revisions", ssp);
  const packageTitle = "Slot flow authorization package";
  const [pkg] = await insert("authorization_packages", {
    program_id: program.id,
    system_id: system.id,
    title: packageTitle,
  });
  const [version] = await insert("package_revisions", { package_id: pkg.id, version_number: 1 });
  await publish("package_revisions", version, { submitted_at: new Date().toISOString() });
  const campaignTitle = "Slot flow campaign";
  const [campaign] = await insert("assessment_campaigns", {
    program_id: program.id,
    title: campaignTitle,
  });
  const [plan] = await insert("assessment_plan_revisions", {
    campaign_id: campaign.id,
    ssp_revision_id: ssp.id,
    version_number: 1,
    title: "Slot flow plan",
  });
  await publish("assessment_plan_revisions", plan);
  const [results] = await insert("assessment_results_revisions", {
    assessment_plan_revision_id: plan.id,
    version_number: 1,
    title: "Slot flow interim results",
  });
  const [resultSet] = await insert("result_sets", {
    assessment_results_revision_id: results.id,
    title: "Slot flow result set",
  });
  await insert("assessment_findings", {
    assessment_results_revision_id: results.id,
    result_set_id: resultSet.id,
    target_control_part_id: part.id,
    title: "Slot flow finding",
    determination: "satisfied",
  });

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  context.setDefaultTimeout(30000);
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => {
    errors.push(`Unexpected native ${dialog.type()} dialog: ${dialog.message()}`);
    void dialog.dismiss();
  });
  const overview = `${origin}/programs/${program.id}`;
  await page.goto(overview);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const heading = page.getByRole("heading", { level: 1, name: program.name });
  const header = () => page.locator("main [data-slot=page-header]").first();
  const slot = () => header().locator("[data-slot=page-header-slot]");

  // ——— No roles recorded: today's header, Edit program its primary ——————————————————————————
  await expect(heading).toBeVisible();
  await expect(header().getByRole("button", { name: "Edit program", exact: true })).toBeVisible();
  await expect(slot()).toHaveCount(0);
  console.log("PASS a program that records no roles keeps Edit program as its primary");

  // ——— The account is the authorizing official: the slot is its signature ————————————————
  const [mine] = await insert("program_role_assignments", [
    { program_id: program.id, party_id: account.id, role: "authorizing_official" },
    { program_id: program.id, party_id: lead.id, role: "lead_assessor" },
  ]);
  const expectSign = async () => {
    await expect(slot()).toHaveAttribute("data-form", "sign");
    const sign = slot().getByRole("button", {
      name: `Record authorization decision as ${signer}`,
      exact: true,
    });
    await expect(sign).toHaveAccessibleDescription("Signing as authorizing official");
    return sign;
  };
  await page.reload();
  await expect(heading).toBeVisible();
  const sign = await expectSign();
  await expect(header().getByRole("button", { name: "Edit program", exact: true })).toHaveCount(0);
  await slot().getByRole("button", { name: "More program actions", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Edit program", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await sign.click();
  const dialog = page.getByRole("dialog", { name: "Record authorization decision" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(`${packageTitle} · version 1`);
  // The decision is the account's: its decision maker is fixed to them, said as text.
  await expect(dialog).toContainText(signer);
  // Its confirm is a signature too: the sign Button, with the signer's name.
  await expect(
    dialog.getByRole("button", { name: `Record authorization decision as ${signer}`, exact: true }),
  ).toHaveAttribute("data-button-variant", "sign");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  console.log("PASS the authorizing official's slot signs, opening the decision in their name");

  await page.goto(`${overview}/authorization`);
  await expect(page.getByRole("heading", { level: 1, name: "Authorization" })).toBeVisible();
  await expectSign();
  const path = page.getByRole("list", { name: "Authorization schedule" });
  // Each line ends with who it waits on: the words, then the person (their avatar between).
  const waitsOn = async (line, name) => {
    const item = path.getByRole("listitem").filter({ hasText: line });
    await expect(item.getByText("Waiting on", { exact: true })).not.toHaveCount(0);
    await expect(item).toContainText(name);
  };
  await waitsOn("Version 1 submitted", signer);
  await waitsOn(campaignTitle, "D. Lead");
  console.log("PASS the Schedule names who a submitted version and draft results wait on");

  // ——— Somebody else is: the slot waits on them, and each act says only they can ——————————
  await data(client.from("program_role_assignments").delete().eq("id", mine.id).select());
  await insert("program_role_assignments", {
    program_id: program.id,
    party_id: official.id,
    role: "authorizing_official",
  });
  await page.goto(overview);
  await expect(heading).toBeVisible();
  await expect(slot()).toHaveAttribute("data-form", "waiting");
  await expect(slot()).toContainText("Waiting on R. Calloway");
  await expect(slot()).toContainText("authorizing official, to decide");
  console.log("PASS anyone else's slot says who the program waits on, and for what");

  await page.goto(`${origin}/packages/${pkg.id}`);
  await page.getByRole("button", { name: "1", exact: true }).click();
  const record = page.getByRole("button", { name: "Record authorization decision", exact: true });
  await expect(record).toHaveAttribute("aria-disabled", "true");
  await expect(record).toHaveAccessibleDescription(
    "Only R. Calloway, the authorizing official, can record this decision.",
  );
  console.log("PASS the package's decision keeps its place and says who records it");

  await page.goto(`${origin}/campaigns/${campaign.id}`);
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  const publishItem = page.getByRole("menuitem", { name: "Publish assessment results" });
  await expect(publishItem).toHaveAttribute("aria-disabled", "true");
  await expect(publishItem).toHaveAccessibleDescription(
    "Only D. Lead, the lead assessor, can publish these results.",
  );
  console.log("PASS the campaign's Publish assessment results says only the lead assessor can");

  assert.deepEqual(errors, [], "Browser has no uncaught errors or native dialogs");
} catch (error) {
  if (page) {
    console.error((await page.locator("body").innerText()).slice(-4000));
    const shot = join(screenshots, "program-slot-failure.png");
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
    console.error(`Failure screenshot: ${shot}`);
  }
  throw error;
} finally {
  await browser?.close();
  await workspace.cleanup();
}
