/**
 * Failed and server-side loads beyond the one Suppliers check (G4-19): a failed first load on
 * several registers, a secondary collection that fails on a record page, a picker whose choices
 * fail inside an open dialog, and a register the server searches as the reader types. Each failure
 * is one GET the flow answers itself; nothing is saved.
 */
import { expect as playwrightExpect } from "playwright/test";

const expect = playwrightExpect.configure({ timeout: 30000 });

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
 * @param {import("playwright").Page} page a signed-in page
 * @param {{
 *   origin: string;
 *   registers: { path: string; table: string; heading: string }[];
 *   program: { id: string; name: string };
 *   search: { path: string; table: string; term: string };
 *   log?: (line: string) => void;
 * }} options
 */
export async function checkFailedLoads(
  page,
  { origin, registers, program, search, log = console.log },
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
    const { message, restore } = await failGets(page, "tasks");
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
