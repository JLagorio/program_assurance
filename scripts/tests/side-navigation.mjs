import assert from "node:assert/strict";
import { expect as playwrightExpect } from "playwright/test";
import { expectCenteredIcon } from "./action-layout.mjs";

const expect = playwrightExpect.configure({ timeout: 30000 });

/** The application's desktop icon rail keeps the same destinations and mobile overlay. */
export async function expectIconSideNavigation(page, { screenshot }) {
  const returnTo = page.url();
  const nav = page.getByRole("navigation", { name: "Side navigation", exact: true });
  const toggle = page.locator('[data-slot="shell-sidenav-toggle"]');
  const start = page.locator('[data-slot="shell-topnav-start"]');
  const logo = start.locator('[data-slot="shell-app-logo"]');
  const mark = logo.locator('[data-slot="shell-mark"]');
  const title = logo.getByText("Program Assurance", { exact: true });
  const tooltip = page.locator('[data-slot="tooltip-content"][data-open]');
  const items = nav.locator('[data-slot="shell-sidenav-item"]');
  const link = (name) => nav.getByRole("link", { name, exact: true });
  const noOverflow = async () => {
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), {
        message: "Navigation does not cause horizontal document overflow",
      })
      .toBe(true);
  };
  const rail = async () => {
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute("data-collapsed", "icons");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect
      .poll(async () => (await nav.boundingBox())?.width, {
        message: "Collapsed navigation uses a compact, visible icon rail",
      })
      .toBeLessThanOrEqual(80);
    await noOverflow();
  };

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator('[data-collapsed-sidenav="icons"]')).toHaveCount(1);
  await expect(nav).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const expandedWidth = (await nav.boundingBox()).width;
  const expandedMark = await mark.boundingBox();
  const expandedTitle = await title.boundingBox();
  const brandAligned = async () => {
    await expect
      .poll(
        async () => {
          const actualMark = await mark.boundingBox();
          const actualTitle = await title.boundingBox();
          return (
            actualMark !== null &&
            actualTitle !== null &&
            ["x", "y", "width", "height"].every(
              (key) => Math.abs(actualMark[key] - expandedMark[key]) <= 1,
            ) &&
            ["x", "y"].every((key) => Math.abs(actualTitle[key] - expandedTitle[key]) <= 1)
          );
        },
        { message: "The app mark and title stay in place when navigation collapses or reloads" },
      )
      .toBe(true);
  };
  const toggleOverMark = async () => {
    await expect(start).toHaveAttribute("data-collapsed", "icons");
    await expect
      .poll(
        async () => {
          const control = await toggle.boundingBox();
          const brand = await mark.boundingBox();
          return (
            control !== null &&
            brand !== null &&
            ["x", "y", "width", "height"].every((key) => Math.abs(control[key] - brand[key]) <= 1)
          );
        },
        { message: "The expansion control occupies the app mark without adding a separate slot" },
      )
      .toBe(true);
    await expectCenteredIcon(toggle);
    await brandAligned();
  };
  const restingBrand = async () => {
    await page.locator('[data-shell-area="main"]').focus();
    await page.mouse.move(1000, 500);
    await expect(toggle).toHaveCSS("opacity", "0");
    await expect(mark).toHaveCSS("opacity", "1");
    await toggleOverMark();
  };
  const destinations = await items.evaluateAll((elements) =>
    elements.map((element) => ({
      name: element.textContent.trim(),
      href: element.getAttribute("href"),
    })),
  );
  assert.ok(destinations.length > 10, "The full application navigation is present");
  await expect(link("Programs")).toHaveAttribute("aria-current", "page");
  await screenshot("navigation-expanded-1440");

  await toggle.click();
  await rail();
  await restingBrand();
  await screenshot("navigation-mark-resting-1440");
  await toggle.hover();
  await expect(toggle).toHaveCSS("opacity", "1");
  await expect(mark).toHaveCSS("opacity", "0");
  await toggleOverMark();
  await screenshot("navigation-mark-hover-1440");
  await page.mouse.move(1000, 500);
  await logo.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveCSS("opacity", "1");
  await expect(mark).toHaveCSS("opacity", "0");
  await toggleOverMark();
  await screenshot("navigation-mark-focused-1440");
  await restingBrand();
  assert.ok((await nav.boundingBox()).width < expandedWidth / 2);
  await expect(items).toHaveCount(destinations.length);
  await expect
    .poll(() =>
      nav.locator('[data-slot="shell-sidenav-heading"]').evaluateAll((elements) =>
        elements.every((element) => {
          const bounds = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return bounds.width <= 1 && bounds.height <= 1 && style.overflow === "hidden";
        }),
      ),
    )
    .toBe(true);
  for (const destination of destinations) {
    const item = link(destination.name);
    await expect(item).toHaveAttribute("href", destination.href);
    await item.scrollIntoViewIfNeeded();
    await expect(item).toBeInViewport();
    await expect(item.locator("svg")).toBeVisible();
    await expectCenteredIcon(item);
  }
  await expect(link("Programs")).toHaveAttribute("aria-current", "page");
  await screenshot("navigation-icons-1440");

  await link("Programs").hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText("Programs");
  await screenshot("navigation-tooltip-1440");
  await page.mouse.move(1000, 500);
  await expect(tooltip).toHaveCount(0);
  await link("Programs").focus();
  await page.keyboard.press("Tab");
  await expect(link("Assessment campaigns")).toBeFocused();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveText("Assessment campaigns");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/campaigns$/);
  await expect(link("Assessment campaigns")).toHaveAttribute("aria-current", "page");
  await expect(link("Programs")).not.toHaveAttribute("aria-current");
  await rail();

  await page.reload();
  await rail();
  await restingBrand();
  await expect(link("Assessment campaigns")).toHaveAttribute("aria-current", "page");
  await expect(items).toHaveCount(destinations.length);
  await screenshot("navigation-icons-reloaded-1440");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(mark).toHaveCSS("opacity", "1");
  await brandAligned();
  await expect(nav).not.toHaveAttribute("data-collapsed");
  await expect
    .poll(async () => Math.abs((await nav.boundingBox()).width - expandedWidth))
    .toBeLessThanOrEqual(1);
  for (const destination of destinations) {
    const label = link(destination.name).locator('[data-slot="shell-sidenav-label"]');
    await expect(label).toBeVisible();
    assert.ok((await label.boundingBox()).width > 10, `${destination.name} label is restored`);
  }
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await brandAligned();
  await expect(nav).not.toHaveAttribute("data-collapsed");
  await toggle.click();
  await rail();

  await page.setViewportSize({ width: 390, height: 1000 });
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(start).not.toHaveAttribute("data-collapsed");
  await expect(toggle).toHaveCSS("opacity", "1");
  await expect(mark).toHaveCSS("opacity", "1");
  const mobileToggle = await toggle.boundingBox();
  const mobileMark = await mark.boundingBox();
  assert.ok(
    mobileToggle.x + mobileToggle.width <= mobileMark.x + 1 ||
      mobileMark.x + mobileMark.width <= mobileToggle.x + 1,
    "Mobile keeps a separate, visible navigation toggle and app mark",
  );
  await noOverflow();
  await screenshot("navigation-closed-390");
  await toggle.click();
  await expect(nav).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(nav).not.toHaveAttribute("data-collapsed");
  await expect
    .poll(() =>
      nav.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.width > 80 && bounds.left >= -1 && bounds.right <= innerWidth + 1;
      }),
    )
    .toBe(true);
  const mobileLabel = link("Evidence").locator('[data-slot="shell-sidenav-label"]');
  await expect(mobileLabel).toBeVisible();
  assert.ok((await mobileLabel.boundingBox()).width > 10, "Mobile overlay shows full labels");
  await noOverflow();
  await screenshot("navigation-overlay-390");
  await link("Evidence").click();
  await expect(page).toHaveURL(/\/evidence$/);
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await noOverflow();
  await toggle.click();
  await expect(nav).toBeVisible();
  await expect(link("Evidence")).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(toggle).toBeFocused();

  await page.setViewportSize({ width: 1440, height: 1000 });
  await rail();
  await expect(link("Evidence")).toHaveAttribute("aria-current", "page");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(nav).not.toHaveAttribute("data-collapsed");
  await page.goto(returnTo);
  await brandAligned();
  await expect(link("Programs")).toHaveAttribute("aria-current", "page");
  await noOverflow();
  await screenshot("navigation-restored-1440");
}
