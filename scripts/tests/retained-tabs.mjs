/**
 * The program workspace keeps each tab's reader state while another shows, and a link that
 * chooses a tab hands focus to it (DSC-4). Reads only.
 */
import { expect as playwrightExpect } from "playwright/test";

const expect = playwrightExpect.configure({ timeout: 30000 });
/** A tab named by its label and, when it has one, its count: "Evidence 368". */
const tab = (page, label) =>
  page.getByRole("tab", { name: new RegExp(`^${label}(\\s*\\d[\\d,]*)?$`) });

/**
 * @param {import("playwright").Page} page a signed-in page
 * @param {{ origin: string; programId: string; term: string; log?: (line: string) => void }} options
 *   `term` is typed into the program's Evidence search.
 */
export async function checkRetainedTabs(page, { origin, programId, term, log = console.log }) {
  await page.goto(`${origin}/programs/${programId}?tab=Evidence`);
  const search = page.getByRole("searchbox", { name: "Find evidence", exact: true });
  await search.fill(term);
  await tab(page, "Overview").click();
  await expect(tab(page, "Overview")).toHaveAttribute("aria-selected", "true");
  await tab(page, "Evidence").click();
  await expect(page.getByRole("searchbox", { name: "Find evidence", exact: true })).toHaveValue(
    term,
  );
  log("PASS a retained program tab keeps its search while another tab shows");

  await tab(page, "Overview").click();
  // The Overview's open risks tray: its heading is the count and the words, and opens the tab.
  const tile = page.getByRole("link", { name: /^[\d,]+ open risks$/ });
  await tile.focus();
  await page.keyboard.press("Enter");
  await expect(tab(page, "POA&M & risk")).toHaveAttribute("aria-selected", "true");
  await expect(tab(page, "POA&M & risk")).toBeFocused();
  log("PASS an Overview tray heading that chooses a tab moves focus to that tab");
}
