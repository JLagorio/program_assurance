/**
 * The generic record form is safe to retry (Create once). Its write reaches the server and the
 * answer is lost: the form keeps the draft and focus and says trying again makes no second record,
 * and Create again finds the first try, writes nothing and closes, so one record exists. An edit
 * retried the same way finds its own write instead of calling it another session's change.
 */
import assert from "node:assert/strict";

/** Lets one write of `method` through to the server, then loses its answer the way `lose` says. */
async function loseAnswer(page, method, lose) {
  let reached;
  const done = new Promise((resolve) => {
    reached = resolve;
  });
  const pattern = "**/rest/v1/parties*";
  await page.route(pattern, async (route) => {
    if (route.request().method() !== method) return route.continue();
    const response = await route.fetch();
    reached(response.status());
    await lose(route);
  });
  return {
    reached: done,
    restore: () => page.unroute(pattern),
  };
}

export async function checkCreateOnce({ page, origin, workspace, expect }) {
  const name = `Create-once organization ${workspace.run.slice(0, 8)}`;
  const edited = `${name} edited`;
  const stored = async (value) => {
    const result = await workspace.client
      .from("parties")
      .select("id, name, revision")
      .eq("tenant_id", workspace.tenantId)
      .eq("name", value);
    assert.ifError(result.error);
    return result.data;
  };
  const dialog = (label) => page.getByRole("dialog", { name: label, exact: true });

  await page.goto(`${origin}/vendors`);
  await page
    .getByRole("button", { name: /^(Create|Add) organization$/ })
    .first()
    .click();
  const create = dialog("Create organization");
  await expect(create).toBeVisible();
  const field = create.getByRole("textbox", { name: /^Name/ });
  await field.fill(name);
  const primary = create.getByRole("button", { name: "Create organization", exact: true });

  // The insert lands; its answer never comes back.
  const lost = await loseAnswer(page, "POST", (route) => route.abort("failed"));
  await primary.click();
  assert.equal(await lost.reached, 201, "The first try's insert reached the server");
  const alert = create.getByRole("alert");
  await expect(alert).toContainText("The organization was not created");
  await expect(alert).toContainText("trying again will not make a second organization");
  await expect(field).toBeEnabled();
  await expect(field).toHaveValue(name);
  await expect(primary).toBeFocused();
  await lost.restore();
  assert.equal((await stored(name)).length, 1, "The lost answer's insert made the record");

  // Create again finds the first try, writes nothing more and closes.
  await primary.click();
  await expect(create).toBeHidden();
  const created = await stored(name);
  assert.equal(created.length, 1, "A retried create makes no second record");
  assert.equal(created[0].revision, 1, "The retry wrote nothing over the first try");

  // An edit retried after its write landed finds it, rather than another session's change.
  await page.getByRole("button", { name: `Preview ${name}`, exact: true }).click();
  await page
    .locator('[data-shell-area="panel"]')
    .getByRole("button", { name: "Edit organization", exact: true })
    .click();
  const edit = dialog("Edit organization");
  await expect(edit).toBeVisible();
  const editField = edit.getByRole("textbox", { name: /^Name/ });
  await editField.fill(edited);
  const save = edit.getByRole("button", { name: "Edit organization", exact: true });
  const failed = await loseAnswer(page, "PATCH", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Lost answer from the create-once check" }),
    }),
  );
  await save.click();
  assert.equal(await failed.reached, 200, "The first try's update reached the server");
  const editAlert = edit.getByRole("alert");
  await expect(editAlert).toContainText("The organization was not saved");
  await expect(editAlert).toContainText("Your changes are kept, so you can try again.");
  await expect(editField).toHaveValue(edited);
  await failed.restore();
  await save.click();
  await expect(edit).toBeHidden();
  const saved = await stored(edited);
  assert.equal(saved.length, 1, "The edit is saved");
  assert.equal(saved[0].id, created[0].id, "The edit changed the record it opened");
  assert.equal(saved[0].revision, 2, "A retried edit is written once");
  await page.keyboard.press("Escape");
}
