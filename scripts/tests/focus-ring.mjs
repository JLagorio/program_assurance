/**
 * Focus in the running app (A11-12): a focus ring that a clipping or scrolling ancestor cuts, found
 * by tabbing through a surface as a keyboard reader does, and focus that goes back to the control
 * that opened a dialog once it closes. The ring measure is the kit's focus gate
 * (packages/design-system/test/story-gates.ts) run on the app's own screens: a ring that loses half
 * or more of its band to an ancestor fails. Reads only.
 */
import assert from "node:assert/strict";
import { expect as playwrightExpect } from "playwright/test";

const expect = playwrightExpect.configure({ timeout: 30000 });

/**
 * In the page: the focused element, whether it sits inside `root`, and its focus ring with the
 * share of the ring's band its clipping ancestors cut away. Serialized by Playwright, so every
 * helper lives inside it.
 * @param {Element | null} root
 */
async function measureFocusedRing(root) {
  // Rings measured mid-transition (a ring that draws in, a dialog that scales in) move from run
  // to run: let finite animations end first, then two frames.
  const running = document
    .getAnimations()
    .filter(
      (animation) =>
        animation.playState === "running" &&
        Number.isFinite(animation.effect?.getComputedTiming().iterations ?? 1),
    )
    .map((animation) => animation.finished.catch(() => undefined));
  await Promise.race([Promise.all(running), new Promise((done) => setTimeout(done, 1000))]);
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));

  const px = (value) => (value.endsWith("px") ? parseFloat(value) : 0);
  const grow = (box, by) => ({ l: box.l - by, t: box.t - by, r: box.r + by, b: box.b + by });
  const area = (box) => Math.max(0, box.r - box.l) * Math.max(0, box.b - box.t);
  const meet = (a, b) => ({
    l: Math.max(a.l, b.l),
    t: Math.max(a.t, b.t),
    r: Math.min(a.r, b.r),
    b: Math.min(a.b, b.b),
  });
  const boxOf = (rect) => ({ l: rect.left, t: rect.top, r: rect.right, b: rect.bottom });
  const makesContainingBlock = (style) =>
    style.position !== "static" ||
    style.transform !== "none" ||
    style.filter !== "none" ||
    /paint|layout|strict|content/.test(style.contain) ||
    (style.containerType !== "" && style.containerType !== "normal");
  const containingBlock = (el) => {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement)
      if (makesContainingBlock(getComputedStyle(a))) return a;
    return null;
  };
  // Every ancestor that clips or scrolls the element, as a box in the window.
  const clipBoxes = (el) => {
    const boxes = [];
    let node = el;
    while (node && node !== document.body && node !== document.documentElement) {
      const style = getComputedStyle(node);
      const parent =
        style.position === "fixed"
          ? null
          : style.position === "absolute"
            ? containingBlock(node)
            : node.parentElement;
      if (!parent || parent === document.body || parent === document.documentElement) break;
      const ps = getComputedStyle(parent);
      const clipX = ps.overflowX !== "visible";
      const clipY = ps.overflowY !== "visible";
      const clipAll = ps.clipPath !== "none" || /paint|strict|content/.test(ps.contain);
      if ((clipX || clipY || clipAll) && ps.display !== "inline" && ps.display !== "contents") {
        const rect = parent.getBoundingClientRect();
        const margin =
          ps.overflowX === "clip" || ps.overflowY === "clip" ? px(ps.overflowClipMargin) : 0;
        const left = rect.left + parent.clientLeft;
        const top = rect.top + parent.clientTop;
        boxes.push({
          l: clipX || clipAll ? left - margin : -1e9,
          r: clipX || clipAll ? left + parent.clientWidth + margin : 1e9,
          t: clipY || clipAll ? top - margin : -1e9,
          b: clipY || clipAll ? top + parent.clientHeight + margin : 1e9,
        });
      }
      node = parent;
    }
    return boxes;
  };
  const outlined = (style) =>
    style.outlineStyle !== "none" &&
    parseFloat(style.outlineWidth) > 0 &&
    style.outlineColor !== "transparent" &&
    !/rgba\([^)]*,\s*0\)$/.test(style.outlineColor);
  // The focus indicator's band: an outline, a ring on ::after or ::before, or a spread shadow.
  const ringOf = (el) => {
    const style = getComputedStyle(el);
    if (outlined(style))
      return {
        box: boxOf(el.getBoundingClientRect()),
        width: parseFloat(style.outlineWidth),
        offset: parseFloat(style.outlineOffset) || 0,
        start: el,
      };
    for (const pseudo of ["::after", "::before"]) {
      const ps = getComputedStyle(el, pseudo);
      if (ps.content === "none" || !outlined(ps)) continue;
      const owner =
        ps.position === "absolute" && style.position === "static" ? containingBlock(el) : el;
      const host = owner ?? el;
      const rect = host.getBoundingClientRect();
      const left = rect.left + host.clientLeft;
      const top = rect.top + host.clientTop;
      return {
        box: {
          l: left + px(ps.left),
          t: top + px(ps.top),
          r: left + (host.clientWidth || rect.width) - px(ps.right),
          b: top + (host.clientHeight || rect.height) - px(ps.bottom),
        },
        width: parseFloat(ps.outlineWidth),
        offset: parseFloat(ps.outlineOffset) || 0,
        start: host,
      };
    }
    const shadow = style.boxShadow.match(
      /(?:rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)|#[0-9a-f]+)\s+0px\s+0px\s+0px\s+([\d.]+)px(\s+inset)?/,
    );
    if (shadow && parseFloat(shadow[1] ?? "0") >= 1) {
      const width = parseFloat(shadow[1] ?? "0");
      return {
        box: boxOf(el.getBoundingClientRect()),
        width,
        offset: shadow[2] ? -width : 0,
        start: el,
      };
    }
    return null;
  };
  const ringLoss = (ring) => {
    const outer = grow(ring.box, ring.offset + ring.width);
    const inner = grow(ring.box, ring.offset);
    const band = area(outer) - area(inner);
    if (band <= 0) return 0;
    let view = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 };
    for (const clip of clipBoxes(ring.start)) view = meet(view, clip);
    const shown = area(meet(outer, view)) - area(meet(inner, view));
    return 1 - Math.max(0, shown) / band;
  };
  // `<button data-slot="x"> in [data-slot="y"] "text"`: what to look for on the screen.
  const describe = (el) => {
    const slot = el.getAttribute("data-slot");
    const within = slot
      ? null
      : el.parentElement?.closest("[data-slot]")?.getAttribute("data-slot");
    const role = el.getAttribute("role");
    const name = (el.getAttribute("aria-label") ?? el.textContent ?? "")
      .trim()
      .replace(/\s+/g, " ");
    return [
      `<${el.tagName.toLowerCase()}${slot ? ` data-slot="${slot}"` : ""}${role ? ` role="${role}"` : ""}>`,
      within ? ` in [data-slot="${within}"]` : "",
      name ? ` "${name.length > 40 ? `${name.slice(0, 39)}…` : name}"` : "",
    ].join("");
  };

  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement)
    return { inside: false, id: -1, description: "the page", focusVisible: false, ring: false };
  // One number per element for the walk, so a dialog's focus trap is seen to come round.
  const ids = (window.__focusRingIds ??= new WeakMap());
  if (!ids.has(el)) ids.set(el, (window.__focusRingNext = (window.__focusRingNext ?? 0) + 1));
  const ring = ringOf(el);
  return {
    inside: root ? root.contains(el) : true,
    id: ids.get(el),
    description: describe(el),
    focusVisible: el.matches(":focus-visible"),
    ring: Boolean(ring),
    lost: ring ? ringLoss(ring) : 0,
  };
}

/** The focused element and its ring, measured within `scope` (a Locator) or the whole page. */
export function focusedRing(page, scope) {
  return scope ? scope.evaluate(measureFocusedRing) : page.evaluate(measureFocusedRing, null);
}

/** The focused element's ring, when it draws one, keeps at least half of its band in view. */
export async function expectRingInView(page, label) {
  const stop = await focusedRing(page);
  if (!stop.ring) return stop;
  assert.ok(
    stop.lost < 0.5,
    `${label}: the focus ring of ${stop.description} loses ${Math.round(stop.lost * 100)}% of its band to an ancestor that clips it`,
  );
  return stop;
}

/**
 * Tabs through a surface as a keyboard reader does, from `start` (or what has focus), and checks
 * every focus stop's ring: none may lose half or more of its band to an ancestor that clips or
 * scrolls it. The walk ends when focus leaves `scope`, comes back round (a dialog's focus trap),
 * or after `limit` stops.
 * @param {import("playwright").Page} page
 * @param {{
 *   scope: import("playwright").Locator;
 *   label: string;
 *   start?: import("playwright").Locator | undefined;
 *   limit?: number | undefined;
 *   log?: (line: string) => void;
 * }} options
 */
export async function checkFocusRings(
  page,
  { scope, label, start, limit = 40, log = console.log },
) {
  if (start) await start.focus();
  const seen = new Set();
  const clipped = [];
  let stops = 0;
  let rings = 0;
  let focusVisible = 0;
  const visit = (stop) => {
    seen.add(stop.id);
    stops += 1;
    if (stop.focusVisible) focusVisible += 1;
    if (!stop.ring) return;
    rings += 1;
    if (stop.lost >= 0.5)
      clipped.push(`${stop.description} loses ${Math.round(stop.lost * 100)}% of its ring`);
  };
  const first = await focusedRing(page, scope);
  if (first.inside) visit(first);
  for (let step = 0; step < limit; step++) {
    await page.keyboard.press("Tab");
    const stop = await focusedRing(page, scope);
    if (!stop.inside || seen.has(stop.id)) break;
    visit(stop);
  }
  assert.ok(stops > 0, `${label}: Tab reached no focus stop inside the surface`);
  assert.ok(
    focusVisible > 0,
    `${label}: no focus stop matched :focus-visible, so the keyboard ring was never drawn`,
  );
  assert.ok(rings > 0, `${label}: no focus stop drew a ring the check could measure`);
  assert.deepEqual(clipped, [], `${label}: focus rings cut by an ancestor that clips them`);
  log(`PASS ${label}: ${stops} focus stops by Tab, ${rings} rings, none cut by an ancestor`);
}

/**
 * The control that opens a surface, held by identity: focus must come back to this very element
 * when the surface closes, so it has to stay mounted while the surface is open.
 * @param {import("playwright").Locator} locator
 */
export async function openerOf(locator) {
  // A register first draws its toolbar over skeleton rows, and once it settles on no records its
  // empty state takes over the create action, so the opener is held only when nothing is loading.
  await locator.waitFor();
  await expect(locator.page().locator('[aria-busy="true"]')).toHaveCount(0);
  const handle = await locator.elementHandle();
  assert.ok(handle, "The opener is on the page");
  return handle;
}

/**
 * Focus is back on `opener` once its surface has closed, and its ring, when the keyboard closed
 * it and one is drawn, is in view.
 * @param {import("playwright").Page} page
 * @param {import("playwright").ElementHandle} opener from `openerOf`
 * @param {string} label what closed it: "Cancel on Create organization"
 */
export async function expectFocusReturned(page, opener, label) {
  await expect
    .poll(
      () => opener.evaluate((element) => element.isConnected && element === document.activeElement),
      { message: `${label}: focus goes back to the control that opened the dialog` },
    )
    .toBe(true);
  await expectRingInView(page, label);
}
