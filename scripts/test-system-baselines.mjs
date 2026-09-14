/** Exercise baseline adoption/tailoring/inheritance only in a disposable local workspace. */
import assert from "node:assert/strict";
import { chromium } from "playwright";
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
page.on("dialog", (dialog) => dialog.accept());
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
async function baselineUrl(programId, systemId) {
  await page.goto(`${origin}/programs/${programId}/systems/${systemId}`);
  await page.getByRole("tab", { name: "Baseline", exact: true }).click();
  await page.getByRole("heading", { name: "Control baseline", exact: true }).waitFor();
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
  await page.getByRole("tab", { name: "Baseline", exact: true }).click();
  await page.getByRole("button", { name: "Change baseline", exact: true }).click();
  await select("Published profile", `${profile.title} · ${profile.version}`);
  await page.getByRole("button", { name: "Save baseline", exact: true }).click();
  await page.getByRole("dialog", { name: "Change control baseline" }).waitFor({ state: "hidden" });
  assert.equal(
    (await data(client.from("systems").select().eq("id", root.id).single()))
      .adopted_profile_resolution_id,
    resolution.id,
  );
  await baselineUrl(program.id, child.id);
  await page.getByText("Inherited", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Change baseline", exact: true }).click();
  const checkbox = page.getByRole("checkbox").first();
  const code = (await checkbox.getAttribute("aria-label")).replace("Include ", "");
  await checkbox.uncheck();
  await page
    .getByLabel("Tailoring rationale", { exact: true })
    .fill("Remove this control because the child does not perform that function.");
  await page.getByRole("button", { name: "Save baseline", exact: true }).click();
  await page.getByRole("dialog", { name: "Change control baseline" }).waitFor({ state: "hidden" });
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
  await page.getByText("Draft tailored profile", { exact: true }).waitFor();
  await page.screenshot({ path: "/tmp/system-baseline-tailoring.png", fullPage: true });
  await page.getByRole("button", { name: "Change baseline", exact: true }).click();
  assert.ok(
    (
      await page.getByRole("combobox", { name: "Published profile", exact: true }).innerText()
    ).includes(profile.title),
  );
  assert.equal(
    await page.getByRole("checkbox", { name: `Include ${code}`, exact: true }).isChecked(),
    false,
    "Reopening retains the earlier removal",
  );
  assert.equal(
    await page.getByLabel("Tailoring rationale", { exact: true }).inputValue(),
    "Remove this control because the child does not perform that function.",
  );
  const second = page.getByRole("checkbox").nth(1);
  const secondCode = (await second.getAttribute("aria-label")).replace("Include ", "");
  await second.uncheck();
  await page.screenshot({ path: "/tmp/system-baseline-dialog.png", fullPage: true });
  await page.getByRole("button", { name: "Save baseline", exact: true }).click();
  await page.getByRole("dialog", { name: "Change control baseline" }).waitFor({ state: "hidden" });
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
  await page.getByRole("button", { name: "Change baseline", exact: true }).click();
  await select("Baseline source", "Use inherited or boundary baseline");
  await page.getByRole("button", { name: "Use inherited baseline", exact: true }).click();
  await page.getByRole("dialog", { name: "Change control baseline" }).waitFor({ state: "hidden" });
  assert.equal(
    (await data(client.from("systems").select().eq("id", child.id).single()))
      .adopted_profile_resolution_id,
    null,
  );
  await page.getByText("Inherited", { exact: true }).waitFor();
  const before = (
    await data(client.from("system_baseline_requests").select().eq("tenant_id", tenantId))
  ).length;
  await page.getByRole("button", { name: "Change baseline", exact: true }).click();
  await page.getByRole("checkbox").first().uncheck();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(
    (await data(client.from("system_baseline_requests").select().eq("tenant_id", tenantId))).length,
    before,
  );
  await page.getByRole("button", { name: "Change baseline", exact: true }).click();
  await page.getByRole("checkbox").first().uncheck();
  await page
    .getByLabel("Tailoring rationale", { exact: true })
    .fill("Retain this choice if another session edits the system.");
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
  await page.getByRole("button", { name: "Save baseline", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "changed in another session" }).waitFor();
  assert.equal(
    await page.getByLabel("Tailoring rationale", { exact: true }).inputValue(),
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
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
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
