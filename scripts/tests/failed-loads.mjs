/**
 * Failed, slow and server-side loads beyond the one Suppliers check (G4-19): a failed first load on
 * several registers, a secondary collection that fails on a record page, a refresh that fails while
 * a nested preview frame is open, a picker whose choices fail inside an open dialog, a picker whose
 * choices are slow (in a dialog and in a PickerSheet), and a register the server searches as the
 * reader types. Each failure or delay is a GET the flow answers itself; nothing is saved.
 */
import { expect as playwrightExpect } from "playwright/test";
import { expectFocusReturned, openerOf } from "./focus-ring.mjs";

const expect = playwrightExpect.configure({ timeout: 30000 });
const discardPrompt = (page) =>
  page.getByRole("alertdialog", { name: "Discard changes?", exact: true });

/** Fails the GETs of one table with a 503 that names it, until the returned `restore` runs. */
async function failGets(page, table) {
  const message = `Injected ${table} load interruption`;
  const pattern = `**/rest/v1/${table}?*`;
  const handler = (route) =>
    route.request().method() === "GET"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ message }),
        })
      : route.fallback();
  await page.route(pattern, handler);
  return { message, restore: () => page.unroute(pattern, handler) };
}

/**
 * Holds the GETs of one table until `release` runs, so the screen shows what it shows while its
 * data is on the way. `held` counts the GETs it holds.
 */
async function holdGets(page, table) {
  const pattern = `**/rest/v1/${table}?*`;
  let open;
  const gate = new Promise((resolve) => {
    open = resolve;
  });
  const pending = new Set();
  const handler = (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    const answered = gate.then(() => route.fallback());
    pending.add(answered);
    return answered;
  };
  await page.route(pattern, handler);
  return {
    held: () => pending.size,
    release: async () => {
      open();
      await Promise.allSettled([...pending]);
      await page.unroute(pattern, handler);
    },
  };
}

/**
 * @param {import("playwright").Page} page a signed-in page
 * @param {{
 *   origin: string;
 *   registers: { path: string; table: string; heading: string }[];
 *   program: { id: string; code: string; name: string };
 *   nested: { gate: { id: string; title: string }; criterion: { id: string; title: string } };
 *   system: { id: string };
 *   library: { name: string };
 *   search: { path: string; table: string; term: string };
 *   log?: (line: string) => void;
 * }} options `program` has no workstreams; `nested` is a lifecycle gate of the program with one
 *   criterion; `system` is one of the program's systems; `library` is the workspace's one
 *   published component definition, the one row Add from library offers.
 */
export async function checkFailedLoads(
  page,
  { origin, registers, program, nested, system, library, search, log = console.log },
) {
  const main = page.getByRole("main");
  const rows = page.locator("main tbody tr[data-row-id]");

  // A register whose first load fails shows why, with Retry, and never an empty collection.
  for (const { path, table, heading } of registers) {
    const { message, restore } = await failGets(page, table);
    await page.goto(`${origin}${path}`);
    await expect(page.getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();
    const alert = main.getByRole("alert").filter({ hasText: message });
    await expect(alert).toBeVisible();
    await expect(page.locator('main [data-slot="empty"]')).toHaveCount(0);
    await expect(rows).toHaveCount(0);
    await restore();
    await main.getByRole("button", { name: "Retry loading", exact: true }).first().click();
    await expect(alert).toHaveCount(0);
    // Its records, or its empty state when the workspace has none.
    await expect(rows.first().or(page.locator('main [data-slot="empty"]'))).toBeVisible();
    log(`PASS ${path}: a failed first load is not an empty register, and Retry restores it`);
  }

  // A record page keeps its header and its other sections when one collection fails.
  {
    // The Schedule tab's tasks, which the program's task register reads a page at a time.
    const { message, restore } = await failGets(page, "task_rows");
    await page.goto(`${origin}/programs/${program.id}?tab=Schedule`);
    await expect(
      page.getByRole("heading", { level: 1, name: program.name, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lifecycle gates", exact: true })).toBeVisible();
    const alert = main.getByRole("alert").filter({ hasText: message });
    await expect(alert).toBeVisible();
    await restore();
    await alert.getByRole("button", { name: "Retry loading", exact: true }).click();
    await expect(alert).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    log("PASS a record page keeps its header and sections while one collection fails and retries");
  }

  // A refresh that fails while a nested preview frame is open keeps the frame, its focus and its
  // parent frame for Back, and keeps the register's rows under one alert with Retry.
  {
    const { gate, criterion } = nested;
    const panel = page.locator('[data-shell-area="panel"]');
    await page.goto(`${origin}/programs/${program.id}?tab=Schedule`);
    const gates = main.getByRole("table", { name: "Lifecycle gates", exact: true });
    const gateRow = gates.locator(`tbody tr[data-row-id="${gate.id}"]`);
    await gateRow.getByRole("button", { name: /^Preview / }).click();
    await expect(panel.getByRole("heading", { name: gate.title, exact: true })).toBeVisible();
    const criteriaSearch = panel.getByPlaceholder("Find gate criteria", { exact: true });
    await criteriaSearch.fill(criterion.title);
    const criterionEye = panel
      .getByRole("table", { name: "Gate criteria", exact: true })
      .locator(`tbody tr[data-row-id="${criterion.id}"]`)
      .getByRole("button", { name: /^Preview / });
    await criterionEye.focus();
    await page.keyboard.press("Enter");
    const back = panel.getByRole("button", { name: "Back to previous record", exact: true });
    await expect(back).toBeVisible();
    await expect(panel).toBeFocused();
    const failures = [
      await failGets(page, "lifecycle_gates"),
      await failGets(page, "gate_criteria"),
    ];
    // A reconnect refetches every query on the page, the hidden parent frame's included.
    await page.evaluate(() => {
      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("online"));
    });
    const stale = main.getByRole("alert").filter({ hasText: "Showing the last loaded records" });
    await expect(stale.first()).toBeVisible();
    await expect(gateRow).toBeVisible();
    await expect(back).toBeVisible();
    await expect(
      panel.getByRole("link", { name: "Open full record in new tab", exact: true }),
    ).toHaveAttribute("href", `/records/gate_criteria/${criterion.id}`);
    await expect
      .poll(() => panel.evaluate((element) => element.contains(document.activeElement)), {
        message: "Focus stays in the nested frame while the refresh fails",
      })
      .toBe(true);
    for (const failure of failures) await failure.restore();
    // Back shows the parent frame as it was, and focus goes to the eye that opened the nested one.
    await back.click();
    await expect(panel.getByRole("heading", { name: gate.title, exact: true })).toBeVisible();
    await expect(back).toHaveCount(0);
    await expect(criteriaSearch).toHaveValue(criterion.title);
    await expect(criterionEye).toBeFocused();
    await panel.getByRole("button", { name: /^Close (details|.+ preview)$/ }).click();
    await expect(panel).toHaveCount(0);
    await stale.first().getByRole("button", { name: "Retry loading", exact: true }).click();
    await expect(stale).toHaveCount(0);
    await expect(gateRow).toBeVisible();
    log(
      "PASS a refresh that fails under a nested preview frame keeps the frame, Back and the rows",
    );
  }

  // A picker whose choices fail inside an open dialog says so in the dialog, keeps the form usable
  // and retries in place.
  {
    await page.goto(`${origin}/work`);
    await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeVisible();
    const opener = page.getByRole("button", { name: "Create task", exact: true }).first();
    await expect(opener).toBeVisible();
    const { restore } = await failGets(page, "parties");
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Create task", exact: true });
    await expect(dialog).toBeVisible();
    const alert = dialog.getByRole("alert").filter({ hasText: "The choices could not be loaded" });
    await expect(alert).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Title" })).toBeEditable();
    await restore();
    await alert.getByRole("button", { name: "Retry loading choices", exact: true }).click();
    await expect(alert).toHaveCount(0);
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    log("PASS a failed picker inside a dialog says so there, keeps the form and retries in place");
  }

  // A picker whose choices are slow says they are loading, never that nothing matched; the form
  // stays usable, a submission before they arrive is held with words, and the choices land.
  {
    await page.goto(`${origin}/work`);
    await expect(page.getByRole("heading", { level: 1, name: "My work" })).toBeVisible();
    const button = page.getByRole("button", { name: "Create task", exact: true }).first();
    const opener = await openerOf(button);
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Create task", exact: true });
    await expect(dialog).toBeVisible();
    const title = dialog.getByRole("textbox", { name: "Task title", exact: true });
    const workstream = dialog.getByRole("combobox", { name: "Workstream", exact: true });
    // A program's workstreams are read once the program is chosen.
    const slow = await holdGets(page, "workstreams");
    await dialog.getByRole("combobox", { name: "Program", exact: true }).click();
    await page
      .getByRole("option", { name: `${program.code} · ${program.name}`, exact: true })
      .click();
    await expect
      .poll(slow.held, { message: "The program's workstreams are asked for" })
      .toBeGreaterThan(0);
    await expect(
      dialog.getByRole("status").filter({ hasText: "Loading workspace records…" }),
    ).toBeVisible();
    await workstream.click();
    await expect(page.getByText("Loading workstreams…", { exact: true })).toBeVisible();
    await expect(page.getByText("No workstreams found.", { exact: true })).toHaveCount(0);
    // Tab leaves the list for the next field; the form takes a draft while the choices load.
    await page.keyboard.press("Tab");
    await title.fill("Slow choices draft");
    await expect(title).toHaveValue("Slow choices draft");
    await dialog.getByRole("button", { name: "Create task", exact: true }).click();
    await expect(dialog.getByRole("status").filter({ hasText: "still loading" })).toBeVisible();
    await slow.release();
    await expect(dialog.getByRole("status").filter({ hasText: /loading/i })).toHaveCount(0);
    await workstream.click();
    await expect(page.getByText("Loading workstreams…", { exact: true })).toHaveCount(0);
    await expect(
      page
        .getByRole("option")
        .or(page.getByText("No workstreams found.", { exact: true }))
        .first(),
    ).toBeVisible();
    await page.keyboard.press("Tab");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await discardPrompt(page).getByRole("button", { name: "Discard changes", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expectFocusReturned(page, opener, "Discard after slow choices on Create task");
    log("PASS a slow picker says it is loading, holds an early submission and its choices land");
  }

  // A PickerSheet whose rows are slow never counts "0 of 0" while they load: it says "0 selected",
  // and "of M" only once its rows land and M is known (Recommendation 14).
  {
    await page.goto(`${origin}/programs/${program.id}/systems/${system.id}?tab=Library`);
    const add = main.getByRole("button", { name: "Add from library", exact: true }).first();
    await expect(add).toBeVisible();
    // The tab's own collection is in, its rows or its empty and not skeleton rows, before the
    // sheet's reads are held.
    await expect(
      main
        .getByRole("table", { name: "Applied from the library", exact: true })
        .locator("tbody tr[data-row-id]")
        .or(main.getByText("Nothing from the library yet", { exact: true }))
        .first(),
    ).toBeVisible();
    const slow = [];
    for (const table of [
      "component_definition_revisions",
      "defined_components",
      "defined_component_implementations",
    ])
      slow.push(await holdGets(page, table));
    await add.click();
    const sheet = page.getByRole("dialog", { name: "Add from library", exact: true });
    await expect(sheet).toBeVisible();
    await expect
      .poll(() => slow.reduce((sum, hold) => sum + hold.held(), 0), {
        message: "The library's published versions are asked for",
      })
      .toBeGreaterThan(0);
    const count = sheet.locator('[data-slot="picker-sheet-count"]');
    await expect(count).toContainText(/\b0 selected/);
    await expect(count).not.toContainText(/ of \d/);
    await expect(sheet.locator('[aria-busy="true"]').first()).toBeAttached();
    await expect(sheet.getByText("Nothing published to apply", { exact: true })).toHaveCount(0);
    for (const hold of slow) await hold.release();
    // The workspace's one published library item lands, and the count says what there is to choose.
    const offered = sheet.locator("tbody tr[data-row-id]");
    await expect(offered).toHaveCount(1);
    await expect(offered).toContainText(library.name);
    await expect(count).toHaveText("0 of 1 selected");
    await sheet.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(sheet).toBeHidden();
    log("PASS a slow PickerSheet waits for its rows before it counts what there is to choose");
  }

  // A register the server searches: typing asks the server, and the rows follow its answer.
  {
    await page.goto(`${origin}${search.path}`);
    await expect(rows.first()).toBeVisible();
    const asked = page.waitForRequest(
      (request) =>
        request.method() === "GET" &&
        request.url().includes(`/rest/v1/${search.table}?`) &&
        decodeURIComponent(request.url()).includes(search.term),
    );
    await main.getByRole("searchbox").first().fill(search.term);
    await asked;
    await expect
      .poll(async () => {
        const texts = await rows.allInnerTexts();
        return (
          texts.length > 0 &&
          texts.every((text) => text.toLowerCase().includes(search.term.toLowerCase()))
        );
      })
      .toBe(true);
    log(`PASS ${search.path}: typing searches on the server and the rows follow`);
  }
}
