import assert from "node:assert/strict";
import { expect as playwrightExpect } from "playwright/test";
const expect = playwrightExpect.configure({ timeout: 30000 });

/** Action labels stay on one line without escaping the popup or viewport. */
export async function expectActionMenu(page, labels) {
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem")).toHaveText(labels);
  await expect
    .poll(
      () =>
        menu.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return (
            bounds.left >= 0 &&
            bounds.right <= innerWidth + 1 &&
            bounds.top >= 0 &&
            bounds.bottom <= innerHeight + 1
          );
        }),
      { message: "The action menu stays within the viewport" },
    )
    .toBe(true);
  for (const label of labels) {
    const item = menu.getByRole("menuitem", { name: label, exact: true });
    const text = await item.evaluate((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const rectangles = [];
      while (walker.nextNode()) {
        if (!walker.currentNode.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(walker.currentNode);
        rectangles.push(
          ...[...range.getClientRects()]
            .filter((rect) => rect.width > 0)
            .map((rect) => ({ top: rect.top, left: rect.left, right: rect.right })),
        );
      }
      const bounds = element.getBoundingClientRect();
      return { rectangles, left: bounds.left, right: bounds.right };
    });
    assert.ok(text.rectangles.length > 0, `${label} has visible label text`);
    assert.ok(
      text.rectangles.every((rect) => Math.abs(rect.top - text.rectangles[0].top) < 1),
      `${label} remains on one line`,
    );
    assert.ok(
      text.rectangles.every((rect) => rect.left >= text.left - 1 && rect.right <= text.right + 1),
      `${label} fits its menu item`,
    );
  }
}

/** An icon-only button is centered by its actual rendered geometry. */
export async function expectCenteredIcon(button) {
  await expect
    .poll(
      () =>
        button.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const icon = element.querySelector("svg")?.getBoundingClientRect();
          if (!icon) return false;
          return (
            Math.abs(icon.left + icon.width / 2 - (bounds.left + bounds.width / 2)) <= 0.5 &&
            Math.abs(icon.top + icon.height / 2 - (bounds.top + bounds.height / 2)) <= 0.5
          );
        }),
      { message: "The icon is centered inside its button" },
    )
    .toBe(true);
}
