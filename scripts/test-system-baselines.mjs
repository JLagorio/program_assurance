/** Exercise baseline adoption/tailoring/inheritance only in a disposable local workspace. */
import assert from "node:assert/strict";
import { chromium, expect } from "playwright/test";
import { localWorkspace } from "./tests/local-workspace.mjs";
const origin = process.env.APP_TEST_URL || "http://127.0.0.1:8080";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const workspace = await localWorkspace("system-baseline");
const { client, tenantId } = workspace;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1050 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("dialog", (dialog) => {
  errors.push(`Unexpected native ${dialog.type()}: ${dialog.message()}`);
  void dialog.dismiss();
});
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
async function select(label, name) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name, exact: true }).click();
}
// The trigger, the dialog title and the adopt primary all say Change control baseline.
const operation = "Change control baseline";
const dialog = () => page.getByRole("dialog", { name: operation, exact: true });
const trigger = () => page.getByRole("main").getByRole("button", { name: operation, exact: true });
const primary = (name = operation) => dialog().getByRole("button", { name, exact: true });
const adoptSource = () =>
  dialog().getByRole("radio", { name: "Adopt a profile and tailor its controls", exact: true });
const inheritSource = () =>
  dialog().getByRole("radio", { name: "Use the inherited or boundary baseline", exact: true });
/** The catalog controls to tailor; each row's checkbox is named "Select <code>". */
const controlBoxes = () =>
  dialog()
    .getByRole("table", { name: "Controls to tailor", exact: true })
    .locator("tbody tr[data-row-id]")
    .getByRole("checkbox");
const controlCode = async (box) => (await box.getAttribute("aria-label")).replace(/^Select /, "");
// A required label's asterisk is hidden from assistive technology: find the field by its name.
const tailoringRationale = () =>
  dialog().getByRole("textbox", { name: "Tailoring rationale", exact: true });
/** The dialog opens where the element is: adopting itself, or inheriting. */
async function openBaseline(mode) {
  await trigger().click();
  await expect(dialog()).toBeVisible();
  await expect(mode === "adopt" ? adoptSource() : inheritSource()).toBeChecked();
}
/** The baseline lives on the record's Controls tab. */
async function baselineUrl(programId, systemId) {
  await page.goto(`${origin}/programs/${programId}/systems/${systemId}`);
  await page.getByRole("tab", { name: "Controls", exact: true }).click();
  await expect(trigger()).toBeEnabled({ timeout: 30000 });
}
async function baselineDetails() {
  const trigger = page.getByRole("button", { name: "Baseline details", exact: true });
  if ((await trigger.getAttribute("aria-expanded")) !== "true") await trigger.click();
}
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
  // The stable profile record carries the short name the product shows for every revision.
  const record = await data(client.from("profiles").select().eq("id", profile.profile_id).single());
  const resolution = await data(
    client
      .from("profile_resolutions")
      .select()
      .eq("profile_revision_id", profile.id)
      .eq("state", "published")
      .single(),
  );
  const program = await insert("programs", { code: "BASELINE", name: "Baseline test program" });
  const root = await insert("systems", {
    program_id: program.id,
    code: "ROOT",
    name: "Boundary system",
    system_type: "information_system",
  });
  const child = await insert("systems", {
    program_id: program.id,
    parent_system_id: root.id,
    is_authorization_boundary: false,
    code: "CHILD",
    name: "Child system",
    system_type: "hardware",
  });
  await page.goto(`${origin}/programs/${program.id}/systems/${root.id}`);
  await page.getByLabel("Email", { exact: true }).fill(workspace.email);
  await page.getByLabel("Password", { exact: true }).fill(workspace.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("tab", { name: "Controls", exact: true }).click();
  // A system with no baseline yet opens on adoption.
  await openBaseline("adopt");
  await select("Base profile", `${record.title} · ${profile.version}`);
  await primary().click();
  await dialog().waitFor({ state: "hidden" });
  assert.equal(
    (await data(client.from("systems").select().eq("id", root.id).single()))
      .adopted_profile_resolution_id,
    resolution.id,
  );
  await baselineUrl(program.id, child.id);
  assert.equal(
    await page
      .getByRole("button", { name: "Baseline details", exact: true })
      .getAttribute("aria-expanded"),
    "false",
    "Baseline provenance is available without introducing the controls table",
  );
  await page.screenshot({
    path: "/tmp/system-baseline-controls-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/system-baseline-controls-mobile.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1500, height: 1050 });
  await baselineDetails();
  await page
    .getByText(/^Inherited from /)
    .first()
    .waitFor();
  // The child inherits, so the dialog opens on the inherited source; adopting shows the inherited profile.
  await openBaseline("inherit");
  await expect(primary("Use inherited baseline")).toBeVisible();
  await adoptSource().click();
  await expect(primary()).toBeVisible();
  assert.ok(
    (
      await dialog().getByRole("combobox", { name: "Base profile", exact: true }).innerText()
    ).includes(record.title),
    "Adopting starts from the inherited profile",
  );
  const checkbox = controlBoxes().first();
  const code = await controlCode(checkbox);
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await tailoringRationale().fill(
    "Remove this control because the child does not perform that function.",
  );
  await primary().click();
  await dialog().waitFor({ state: "hidden" });
  const adopted = await data(client.from("systems").select().eq("id", child.id).single());
  assert.notEqual(adopted.adopted_profile_resolution_id, resolution.id);
  assert.ok(adopted.adopted_profile_resolution_id);
  const removed = await data(client.from("controls").select().eq("code", code).limit(1).single());
  assert.equal(
    (
      await data(
        client
          .from("selected_controls")
          .select()
          .eq("profile_resolution_id", adopted.adopted_profile_resolution_id)
          .eq("control_id", removed.id),
      )
    ).length,
    0,
  );
  // Since program setup v2 the tailored profile is published at creation and layered on its base.
  await baselineDetails();
  await expect(
    page
      .getByRole("region", { name: "Baseline details", exact: true })
      .locator('[data-slot="key-value"]')
      .filter({ has: page.locator("dt").getByText("Layered on", { exact: true }) })
      .locator("dd"),
  ).toHaveText(record.title);
  await page.screenshot({ path: "/tmp/system-baseline-tailoring.png", fullPage: true });
  // The child now adopts its own tailored profile, so the dialog opens on adoption.
  await openBaseline("adopt");
  assert.ok(
    (
      await dialog().getByRole("combobox", { name: "Base profile", exact: true }).innerText()
    ).includes(record.title),
  );
  assert.equal(
    await dialog()
      .getByRole("checkbox", { name: `Select ${code}`, exact: true })
      .isChecked(),
    false,
    "Reopening retains the earlier removal",
  );
  assert.equal(
    await tailoringRationale().inputValue(),
    "Remove this control because the child does not perform that function.",
  );
  const second = controlBoxes().nth(1);
  const secondCode = await controlCode(second);
  assert.notEqual(secondCode, code);
  await second.uncheck();
  await page.screenshot({ path: "/tmp/system-baseline-dialog.png", fullPage: true });
  await primary().click();
  await dialog().waitFor({ state: "hidden" });
  const updated = await data(client.from("systems").select().eq("id", child.id).single());
  const secondControl = await data(
    client.from("controls").select().eq("code", secondCode).limit(1).single(),
  );
  assert.equal(
    (
      await data(
        client
          .from("selected_controls")
          .select()
          .eq("profile_resolution_id", updated.adopted_profile_resolution_id)
          .in("control_id", [removed.id, secondControl.id]),
      )
    ).length,
    0,
    "Re-tailoring preserves earlier choices and adds the new removal",
  );
  await openBaseline("adopt");
  await inheritSource().click();
  await primary("Use inherited baseline").click();
  await dialog().waitFor({ state: "hidden" });
  assert.equal(
    (await data(client.from("systems").select().eq("id", child.id).single()))
      .adopted_profile_resolution_id,
    null,
  );
  await page
    .getByText(/^Inherited from /)
    .first()
    .waitFor();
  const before = (
    await data(client.from("system_baseline_requests").select().eq("tenant_id", tenantId))
  ).length;
  await openBaseline("inherit");
  await adoptSource().click();
  await controlBoxes().first().uncheck();
  await dialog().getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("alertdialog", { name: "Discard changes?", exact: true })
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  await dialog().waitFor({ state: "hidden" });
  assert.equal(
    (await data(client.from("system_baseline_requests").select().eq("tenant_id", tenantId))).length,
    before,
  );
  await openBaseline("inherit");
  await adoptSource().click();
  await controlBoxes().first().uncheck();
  await tailoringRationale().fill("Retain this choice if another session edits the system.");
  const current = await data(client.from("systems").select().eq("id", child.id).single());
  await data(
    client
      .from("systems")
      .update({ name: "Changed in another session", revision: current.revision + 1 })
      .eq("id", child.id)
      .eq("revision", current.revision)
      .select()
      .single(),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await page.getByText("Changed in another session", { exact: true }).first().waitFor();
  await primary().click();
  await dialog().getByRole("alert").filter({ hasText: "changed in another session" }).waitFor();
  assert.equal(
    await tailoringRationale().inputValue(),
    "Retain this choice if another session edits the system.",
  );
  assert.equal(
    (await data(client.from("system_baseline_requests").select().eq("tenant_id", tenantId))).length,
    before,
  );
  assert.equal(
    (await data(client.from("systems").select().eq("id", child.id).single()))
      .adopted_profile_resolution_id,
    null,
  );
  await dialog().getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("alertdialog", { name: "Discard changes?", exact: true })
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  await dialog().waitFor({ state: "hidden" });
  assert.deepEqual(errors, []);
  console.log(
    "Baseline browser passed: published adoption, child inheritance, tailored draft persistence, restore inheritance, discard without writes, conflict retains draft.",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/system-baseline-failure.png", fullPage: true });
  console.error((await page.locator("body").innerText()).slice(-5000));
  throw error;
} finally {
  await browser.close();
  await workspace.cleanup();
}
