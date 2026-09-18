import assert from "node:assert/strict";
import { expect as playwrightExpect } from "playwright/test";

const expect = playwrightExpect.configure({ timeout: 30000 });
const near = (actual, expected) => Math.abs(actual - expected) <= 1;
const between = (value, start, end) =>
  value > Math.min(start, end) + 1 && value < Math.max(start, end) - 1;

// Click and sample in one browser evaluation: Playwright actionability waits must not consume
// the transition before its in-between frames can be observed.
async function sampleNavigation(page, reverseAt = null) {
  return page.evaluate(async (reverseAt) => {
    const nav = document.querySelector('[data-shell-area="sidenav"]');
    const toggle = document.querySelector('[data-slot="shell-sidenav-toggle"]');
    const logo = document.querySelector('[data-slot="shell-app-logo"]');
    const mark = logo.querySelector('[data-slot="shell-mark"]');
    const read = () => {
      const bounds = nav.getBoundingClientRect();
      const brand = mark.getBoundingClientRect();
      const style = getComputedStyle(nav);
      return {
        at: performance.now() - started,
        width: bounds.width,
        left: bounds.left,
        visible: style.display !== "none" && style.visibility !== "hidden",
        expanded: toggle.getAttribute("aria-expanded") === "true",
        inert: nav.inert,
        ariaHidden: nav.getAttribute("aria-hidden"),
        markX: brand.x,
        markY: brand.y,
        fits: document.documentElement.scrollWidth <= innerWidth + 1,
      };
    };
    const started = performance.now();
    const samples = [read()];
    let reversed = false;
    toggle.click();
    while (performance.now() - started < 650) {
      await new Promise(requestAnimationFrame);
      samples.push(read());
      if (reverseAt !== null && !reversed && performance.now() - started >= reverseAt) {
        toggle.click();
        reversed = true;
      }
    }
    return samples;
  }, reverseAt);
}

async function sampleTab(page, target) {
  return page.evaluate(async (target) => {
    const list = document.querySelector('[role="tablist"][aria-label="Element sections"]');
    const root = list.closest('[data-slot="tabs"]');
    const trigger = [...list.querySelectorAll('[role="tab"]')].find(
      (element) => element.textContent.trim() === target,
    );
    const read = () => {
      const indicator = list.querySelector('[data-slot="tabs-indicator"]');
      const bounds = indicator?.getBoundingClientRect();
      const panels = [...root.querySelectorAll('[data-slot="tabs-content"]')].filter(
        (element) => element.closest('[data-slot="tabs"]') === root && !element.hidden,
      );
      const style = panels[0] && getComputedStyle(panels[0]);
      return {
        at: performance.now() - started,
        indicatorLeft: bounds?.left ?? null,
        indicatorWidth: bounds?.width ?? null,
        selected: list.querySelector('[aria-selected="true"]')?.textContent.trim(),
        panels: panels.length,
        opacity: style ? Number.parseFloat(style.opacity) : null,
        translateY: style ? new DOMMatrixReadOnly(style.transform).m42 : null,
      };
    };
    const started = performance.now();
    const samples = [read()];
    trigger.click();
    while (performance.now() - started < 650) {
      await new Promise(requestAnimationFrame);
      samples.push(read());
    }
    return samples;
  }, target);
}

// Pause a real in-flight frame only for its screenshot, then let the animation finish normally.
async function captureMotionFrame(page, kind, captureFrame, name) {
  const animations = await page.evaluateHandle(async (kind) => {
    const nav = document.querySelector('[data-shell-area="sidenav"]');
    const list = document.querySelector('[role="tablist"][aria-label="Element sections"]');
    const root = list.closest('[data-slot="tabs"]');
    const trigger =
      kind === "tabs"
        ? [...list.querySelectorAll('[role="tab"]')].find(
            (element) => element.textContent.trim() === "Controls",
          )
        : document.querySelector('[data-slot="shell-sidenav-toggle"]');
    trigger.click();
    const started = performance.now();
    while (performance.now() - started < 650) {
      await new Promise(requestAnimationFrame);
      const targets =
        kind === "tabs"
          ? [...root.querySelectorAll('[data-slot="tabs-indicator"], [data-slot="tabs-content"]')]
          : [nav, document.querySelector(".shell-scrim")].filter(Boolean);
      const running = targets
        .flatMap((element) => element.getAnimations())
        .filter((animation) => {
          const progress = animation.effect?.getComputedTiming().progress;
          return animation.playState === "running" && progress >= 0.2 && progress <= 0.8;
        });
      if (running.length) {
        running.forEach((animation) => animation.pause());
        return running;
      }
    }
    throw new Error(`No running ${kind} animation was available for its frame capture`);
  }, kind);
  try {
    await captureFrame(name);
  } finally {
    await animations.evaluate(async (running) => {
      running.forEach((animation) => animation.play());
      await Promise.allSettled(running.map((animation) => animation.finished));
    });
    await animations.dispose();
  }
}

function expectStableBrand(samples) {
  assert.ok(
    samples.every(
      (sample) => near(sample.markX, samples[0].markX) && near(sample.markY, samples[0].markY),
    ),
    "The app mark stays fixed throughout navigation motion",
  );
  assert.ok(
    samples.every((sample) => sample.fits),
    "Navigation motion never overflows the viewport",
  );
}

function expectWidthMotion(samples, reduced) {
  const start = samples[0].width;
  const end = samples.at(-1).width;
  assert.ok(Math.abs(end - start) > 100, "The navigation changes between expanded and rail widths");
  const intermediate = samples.filter((sample) => between(sample.width, start, end));
  assert.equal(
    intermediate.length > 0,
    !reduced,
    reduced
      ? "Reduced motion changes navigation width without intermediate frames"
      : "Navigation visibly interpolates between expanded and rail widths",
  );
  expectStableBrand(samples);
}

function expectOverlayMotion(samples, reduced, opening) {
  const moving = samples.filter((sample) => sample.visible && sample.left < -1);
  assert.equal(
    moving.length > 0,
    !reduced,
    reduced
      ? "Reduced motion opens and closes the overlay without sliding frames"
      : "The overlay visibly slides on opening and closing",
  );
  assert.equal(
    samples.at(-1).visible,
    opening,
    "The overlay reaches its requested final visibility",
  );
  if (opening) {
    assert.ok(near(samples.at(-1).left, 0), "The open overlay settles at the viewport edge");
  } else {
    const closing = samples.filter((sample) => sample.visible && !sample.expanded);
    if (!reduced) assert.ok(closing.length > 0, "Closing stays mounted long enough to animate");
    assert.ok(
      closing.every((sample) => sample.inert && sample.ariaHidden === "true"),
      "Closing navigation is inert and removed from the accessibility tree",
    );
  }
  expectStableBrand(samples);
}

function expectTabMotion(samples, reduced, target) {
  const start = samples[0].indicatorLeft;
  const end = samples.at(-1).indicatorLeft;
  assert.notEqual(start, null, "The app tabs render a shared selection indicator");
  assert.notEqual(end, null);
  assert.ok(Math.abs(end - start) > 10, "The indicator moves to the newly selected app tab");
  assert.equal(
    samples.some((sample) => between(sample.indicatorLeft, start, end)),
    !reduced,
    reduced
      ? "Reduced motion places the indicator immediately"
      : "The indicator visibly slides between tabs",
  );
  const active = samples.filter((sample) => sample.selected === target && sample.panels === 1);
  assert.ok(active.length > 0, "The selected app tab has a content panel");
  assert.equal(
    active.some(
      (sample) => sample.opacity > 0 && sample.opacity < 0.99 && sample.translateY > 0.01,
    ),
    !reduced,
    reduced
      ? "Reduced motion shows the new content immediately"
      : "Changing the app tab fades and lifts its actual content",
  );
  assert.ok(
    samples.every((sample) => sample.panels <= 1),
    "Tab changes do not expose duplicate panels",
  );
  assert.equal(samples.at(-1).selected, target);
  assert.ok(near(samples.at(-1).opacity, 1) && near(samples.at(-1).translateY, 0));
}

/** Motion is observed in the real app under both OS motion preferences, then state is restored. */
export async function expectPatternMotion(page, { recordSamples, captureFrame }) {
  const samples = {};
  try {
    const nav = page.locator('[data-shell-area="sidenav"]');
    const toggle = page.locator('[data-slot="shell-sidenav-toggle"]');
    const splitter = page.getByRole("separator", { name: "Resize side navigation", exact: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const originalWidth = (await nav.boundingBox()).width;
    await splitter.press("ArrowRight");
    await expect
      .poll(async () => (await nav.boundingBox()).width)
      .toBeCloseTo(originalWidth + 16, 0);
    const resizedWidth = (await nav.boundingBox()).width;

    for (const preference of ["no-preference", "reduce"]) {
      const reduced = preference === "reduce";
      await page.emulateMedia({ reducedMotion: preference });
      const run = (samples[preference] = {});
      run.collapse = await sampleNavigation(page);
      expectWidthMotion(run.collapse, reduced);
      assert.equal(run.collapse.at(-1).expanded, false);
      run.expand = await sampleNavigation(page);
      expectWidthMotion(run.expand, reduced);
      assert.equal(run.expand.at(-1).expanded, true);
      assert.ok(
        near(run.expand.at(-1).width, resizedWidth),
        "Expansion restores the user-resized width",
      );
      if (!reduced) {
        run.desktopReverse = await sampleNavigation(page, 70);
        assert.ok(run.desktopReverse.some((sample) => sample.width < resizedWidth - 4));
        assert.ok(
          run.desktopReverse.at(-1).expanded && near(run.desktopReverse.at(-1).width, resizedWidth),
          "A rapid desktop reversal finishes expanded at the resized width",
        );
        expectStableBrand(run.desktopReverse);
        await captureMotionFrame(
          page,
          "navigation",
          captureFrame,
          "navigation-collapse-in-flight-1440",
        );
        run.captureDesktopRestore = await sampleNavigation(page);
        assert.ok(near(run.captureDesktopRestore.at(-1).width, resizedWidth));
      }

      run.controls = await sampleTab(page, "Controls");
      expectTabMotion(run.controls, reduced, "Controls");
      run.overview = await sampleTab(page, "Overview");
      expectTabMotion(run.overview, reduced, "Overview");
      if (!reduced) {
        await captureMotionFrame(page, "tabs", captureFrame, "tabs-change-in-flight-1440");
        run.captureTabRestore = await sampleTab(page, "Overview");
      }

      await page.setViewportSize({ width: 390, height: 1000 });
      await expect(nav).toBeHidden();
      run.mobileOpen = await sampleNavigation(page);
      expectOverlayMotion(run.mobileOpen, reduced, true);
      if (!reduced) {
        await captureMotionFrame(
          page,
          "navigation",
          captureFrame,
          "navigation-close-in-flight-390",
        );
        run.captureMobileRestore = await sampleNavigation(page);
        assert.equal(run.captureMobileRestore.at(-1).visible, true);
      }
      run.mobileClose = await sampleNavigation(page);
      expectOverlayMotion(run.mobileClose, reduced, false);
      if (!reduced) {
        run.mobileReverse = await sampleNavigation(page, 70);
        assert.equal(
          run.mobileReverse.at(-1).visible,
          false,
          "Rapid mobile reversal finishes closed without a lingering overlay",
        );
        assert.equal(run.mobileReverse.at(-1).expanded, false);
        expectStableBrand(run.mobileReverse);
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect.poll(async () => (await nav.boundingBox()).width).toBeCloseTo(resizedWidth, 0);
    }

    await splitter.press("ArrowLeft");
    await expect.poll(async () => (await nav.boundingBox()).width).toBeCloseTo(originalWidth, 0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    return samples;
  } finally {
    await recordSamples(samples);
  }
}
