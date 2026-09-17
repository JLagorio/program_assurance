import { expect as playwrightExpect } from "playwright/test";

const expect = playwrightExpect.configure({ timeout: 30000 });

/** Product preview anatomy, independent of the record's domain and content. */
export async function expectPreviewHeader(page, { title, recordActions, nested = false } = {}) {
  const panel = page.locator('[data-shell-area="panel"]');
  const outer = panel.locator('[data-slot="shell-panel-header"]');
  const inner = panel.locator("[data-record-preview-header]:visible");
  await expect(panel).toHaveCount(1);
  await expect(outer).toHaveCount(1);
  await expect(inner).toHaveCount(1);
  await expect(outer.getByRole("heading")).toHaveCount(0);
  await expect(outer.locator('[data-slot="page-header-actions"]')).toHaveCount(0);
  await expect(outer.locator('[data-slot="preview-navigation"]')).toHaveCount(1);
  for (const name of ["Previous record", "Next record", "Close details"])
    await expect(outer.getByRole("button", { name, exact: true })).toBeVisible();
  const back = outer.getByRole("button", { name: "Back to previous record", exact: true });
  await expect(back).toHaveCount(nested ? 1 : 0);
  await expect(
    panel.getByRole("button", { name: "Back to previous record", exact: true }),
  ).toHaveCount(nested ? 1 : 0);
  // The whitelist catches any domain action moved into the global navigation bar.
  await expect(outer.getByRole("button")).toHaveCount(nested ? 4 : 3);
  await expect(outer.getByRole("link")).toHaveCount(1);
  const open = outer.getByRole("link", { name: "Open full record in new tab", exact: true });
  await expect(open).toBeVisible();
  await expect(open).toHaveAttribute("target", "_blank");
  await expect(
    panel.getByRole("link", { name: "Open full record in new tab", exact: true }),
  ).toHaveCount(1);

  const heading = title
    ? inner.getByRole("heading", { name: title, exact: true, level: 2 })
    : inner.getByRole("heading", { level: 2 });
  await expect(heading).toHaveCount(1);
  await expect(heading).toBeVisible();
  if (title) {
    await expect(outer.getByText(title, { exact: true })).toHaveCount(0);
    await expect(panel.getByRole("heading", { name: title, exact: true })).toHaveCount(1);
  }
  const actions = inner.locator('[data-slot="page-header-actions"]');
  if (recordActions) {
    await expect(actions.getByRole("button")).toHaveCount(recordActions.length);
    for (const name of recordActions)
      await expect(actions.getByRole("button", { name, exact: true })).toBeVisible();
  }
  // The main page stays mounted but is hidden while the phone panel fills the surface.
  await expect(page.locator("h1")).toHaveCount(1);
  await expect
    .poll(
      () =>
        panel.evaluate((element) => {
          const outer = element.querySelector('[data-slot="shell-panel-header"]');
          const inner = [...element.querySelectorAll("[data-record-preview-header]")].find(
            (header) => header.checkVisibility(),
          );
          const title = inner?.querySelector("h2");
          if (!outer || !inner || !title) return false;
          const bounds = element.getBoundingClientRect();
          const outerBounds = outer.getBoundingClientRect();
          const innerBounds = inner.getBoundingClientRect();
          const titleBounds = title.getBoundingClientRect();
          const fits = (item) => item.left >= bounds.left - 1 && item.right <= bounds.right + 1;
          const controls = [...outer.querySelectorAll("button, a[href]")].map((control) =>
            control.getBoundingClientRect(),
          );
          const actions = inner.querySelector('[data-slot="page-header-actions"]');
          const actionBounds = actions?.getBoundingClientRect();
          return (
            controls.length > 0 &&
            controls.every(
              (control) => fits(control) && Math.abs(control.top - controls[0].top) <= 1,
            ) &&
            fits(innerBounds) &&
            fits(titleBounds) &&
            titleBounds.width >=
              (bounds.width < 320 ? Math.min(180, innerBounds.width) : 100) - 1 &&
            title.scrollWidth <= title.clientWidth + 1 &&
            titleBounds.top >= outerBounds.bottom - 1 &&
            (!actionBounds ||
              (fits(actionBounds) &&
                (actionBounds.top >= titleBounds.bottom - 1 ||
                  actionBounds.left >= titleBounds.right - 1)))
          );
        }),
      {
        message:
          "Global controls fit one row; the inner title remains readable beside or above its actions",
      },
    )
    .toBe(true);
  return { outer, inner, heading, actions, back };
}

/** Exercise the supported desktop splitter instead of faking a narrow viewport. */
export async function minimizePreview(page) {
  const panel = page.locator('[data-shell-area="panel"]');
  const splitter = panel.getByRole("separator", { name: "Resize details", exact: true });
  await splitter.focus();
  await page.keyboard.press("Home");
  await expect(splitter).toHaveAttribute("aria-valuenow", "240");
  await expect.poll(async () => Math.round((await panel.boundingBox()).width)).toBe(240);
}
