/**
 * The program record keeps each part's reader state while another shows, and a link that opens
 * another part hands focus to the page (DSC-4). The record has no tab strip: the side nav's work
 * scope reaches its parts, at a desktop width and from the menu on a phone, and each part's h1
 * says where the reader is. Reads only.
 */
import { expect as playwrightExpect } from "playwright/test";

const expect = playwrightExpect.configure({ timeout: 30000 });
const sideNav = (page) => page.getByRole("navigation", { name: "Side navigation", exact: true });
const h1 = (page) => page.getByRole("heading", { level: 1 });

/**
 * @param {import("playwright").Page} page a signed-in page
 * @param {{ origin: string; programId: string; term: string; log?: (line: string) => void }} options
 *   `term` is typed into the program's Evidence search.
 */
export async function checkRetainedTabs(page, { origin, programId, term, log = console.log }) {
  await page.goto(`${origin}/programs/${programId}?tab=Evidence`);
  await expect(h1(page)).toHaveText("Evidence");
  await expect(page.getByRole("tablist", { name: "Program work", exact: true })).toHaveCount(0);
  const search = page.getByRole("searchbox", { name: "Find evidence", exact: true });
  await search.fill(term);
  await sideNav(page).getByRole("link", { name: "Overview", exact: true }).click();
  await expect(h1(page)).not.toHaveText("Evidence");
  await sideNav(page).getByRole("link", { name: "Evidence", exact: true }).click();
  await expect(h1(page)).toHaveText("Evidence");
  await expect(page.getByRole("searchbox", { name: "Find evidence", exact: true })).toHaveValue(
    term,
  );
  // Back returns to the part before, as it returned to the tab before.
  await page.goBack();
  await expect(h1(page)).not.toHaveText("Evidence");
  await page.goForward();
  await expect(h1(page)).toHaveText("Evidence");
  log("PASS a retained program part keeps its search while another part shows");

  await sideNav(page).getByRole("link", { name: "Overview", exact: true }).click();
  // The Overview's open risks tray: its heading is the count and the words, and opens Risks.
  const tile = page.getByRole("link", { name: /^[\d,]+ open risks$/ });
  await tile.focus();
  await page.keyboard.press("Enter");
  await expect(h1(page)).toHaveText("Risks");
  await expect(sideNav(page).locator('[aria-current="page"]')).toHaveText("Risks");
  await expect(page.locator('[data-shell-area="main"]')).toBeFocused();
  log("PASS an Overview tray heading that opens a part moves focus to the page");

  // On a phone the parts are reached from the side nav behind the menu, and the h1 says which.
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/programs/${programId}`);
  await expect(h1(page)).not.toHaveText("Requirements");
  await page
    .getByRole("button", { name: /side navigation/i })
    .first()
    .click();
  await sideNav(page).getByRole("link", { name: "Requirements", exact: true }).click();
  await expect(h1(page)).toHaveText("Requirements");
  await expect(h1(page)).toBeInViewport();
  await expect(page.locator('[data-shell-area="main"]')).toBeFocused();
  if (viewport) await page.setViewportSize(viewport);
  log("PASS on a phone a part is chosen from the menu and its h1 says where the reader is");
}
