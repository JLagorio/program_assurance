import axe from "axe-core";
import { page, userEvent } from "vitest/browser";

/**
 * The checks the gate projects in vitest.config.ts add to the story run. Each one counts problems
 * in the rendered story and returns them; storybook.setup.ts compares the count with the story's
 * allowance in test/gates-allow.json, which may only shrink.
 *
 * - focus (storybook-light): a focus stop whose ring loses half or more of its band to a clipping
 *   or scrolling ancestor (G3). Every tab stop is focused in turn, after a key press, so the
 *   browser shows :focus-visible as it would for Tab.
 * - touch (storybook-touch, a 390px phone with touch and a coarse pointer): a control under 24 by
 *   24 CSS px by axe's target-size rule (WCAG 2.5.8, spacing and inline exceptions included),
 *   counting the ::before or ::after hit area the kit's touch-target utilities draw, and a control
 *   that is transparent until hovered, which a touch reader cannot hover (TOO-8, TOO-9).
 * - forced-colors (storybook-forced-colors): a selected, pressed, current or checked item that
 *   looks the same as its unselected sibling once the system colours replace the tokens (TOO-7).
 * - short (storybook-short, a 320 by 256 window, 400% zoom): in an open dialog, sheet or drawer, a
 *   control that is less than half in view when it takes focus, or a title above the window that
 *   nothing scrolls back to (G5).
 * - long (storybook-long, the 320px frame): after every text grows by 40% and gains an 80
 *   character unbroken token, the page scrolling sideways, text painting past the frame outside a
 *   scroller, or text cut by overflow with no ellipsis (G1-12).
 * - motion (storybook-dark, which asks for reduced motion): an element whose transition moves it
 *   (transform, translate, rotate, scale, width, height, inset or all) for longer than 0.01 ms, an
 *   animation of those properties still running for longer than 10 ms, and a transition that
 *   started during the render or play and moved something, such as dnd-kit's inline transforms
 *   (G8-8). Opacity and colour may still fade; movement stops.
 */
export type Gate = "focus" | "touch" | "forced-colors" | "short" | "long" | "motion";
export type GateResult = { count: number; items: string[] };

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** `<button data-slot="x"> in [data-slot="y"] "text"`: what to look for in the story. */
export const describeElement = (el: Element): string => {
  const slot = el.getAttribute("data-slot");
  const within = slot ? null : el.parentElement?.closest("[data-slot]")?.getAttribute("data-slot");
  const role = el.getAttribute("role");
  const name = (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().replace(/\s+/g, " ");
  return [
    `<${el.tagName.toLowerCase()}${slot ? ` data-slot="${slot}"` : ""}${role ? ` role="${role}"` : ""}>`,
    within ? ` in [data-slot="${within}"]` : "",
    name ? ` "${name.length > 40 ? `${name.slice(0, 39)}…` : name}"` : "",
  ].join("");
};

const summarize = (items: string[]): string[] => {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  const list = [...counts].map(([item, n]) => (n > 1 ? `${item} (${n} times)` : item));
  return list.length > 8 ? [...list.slice(0, 8), `${list.length - 8} more`] : list;
};
const result = (items: string[]): GateResult => ({ count: items.length, items: summarize(items) });

/* ---------- geometry ---------- */

type Box = { l: number; t: number; r: number; b: number };
const boxOf = (rect: DOMRect): Box => ({
  l: rect.left,
  t: rect.top,
  r: rect.right,
  b: rect.bottom,
});
const grow = (box: Box, by: number): Box => ({
  l: box.l - by,
  t: box.t - by,
  r: box.r + by,
  b: box.b + by,
});
const area = (box: Box) => Math.max(0, box.r - box.l) * Math.max(0, box.b - box.t);
const meet = (a: Box, b: Box): Box => ({
  l: Math.max(a.l, b.l),
  t: Math.max(a.t, b.t),
  r: Math.min(a.r, b.r),
  b: Math.min(a.b, b.b),
});
const px = (value: string) => (value.endsWith("px") ? parseFloat(value) : 0);

const makesContainingBlock = (style: CSSStyleDeclaration) =>
  style.position !== "static" ||
  style.transform !== "none" ||
  style.filter !== "none" ||
  /paint|layout|strict|content/.test(style.contain) ||
  (style.containerType !== "" && style.containerType !== "normal");

/** The element whose box an absolutely positioned pseudo-element or child is placed against. */
const containingBlock = (el: Element): Element | null => {
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement)
    if (makesContainingBlock(getComputedStyle(a))) return a;
  return null;
};

/** The clip boxes between an element and the page: every ancestor that clips or scrolls it. */
const clipBoxes = (el: Element): Box[] => {
  const boxes: Box[] = [];
  let node: Element | null = el;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = getComputedStyle(node);
    const parent: Element | null =
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

const visible = (el: Element) => {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && el.checkVisibility({ visibilityProperty: true });
};

const TABBABLE =
  'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex], [contenteditable="true"], [contenteditable=""]';
const tabStops = (root: ParentNode, limit: number): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(TABBABLE)]
    .filter(
      (el) =>
        el.tabIndex >= 0 &&
        !el.matches(":disabled") &&
        !el.closest("[inert], [aria-hidden='true']") &&
        visible(el),
    )
    .slice(0, limit);

/** Keyboard modality, so programmatic focus shows :focus-visible as Tab would. */
const keyboardModality = async () => {
  await userEvent.keyboard("{Shift}");
};

/** Jump every finite animation and transition to its end, so geometry is measured at rest. */
const settleAnimations = async () => {
  for (const animation of document.getAnimations()) {
    const iterations = animation.effect?.getComputedTiming().iterations ?? 1;
    if (Number.isFinite(iterations))
      try {
        animation.finish();
      } catch {
        // A paused or zero-length animation cannot finish; it is at rest already.
      }
  }
  await nextFrame();
};

const noMotion = () => {
  const style = document.createElement("style");
  style.textContent =
    "*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important;scroll-behavior:auto!important}";
  document.head.append(style);
  return () => style.remove();
};

/* ---------- focus rings (G3) ---------- */

type Ring = { box: Box; width: number; offset: number; start: Element };
const outlined = (style: CSSStyleDeclaration) =>
  style.outlineStyle !== "none" &&
  parseFloat(style.outlineWidth) > 0 &&
  style.outlineColor !== "transparent" &&
  !/rgba\([^)]*,\s*0\)$/.test(style.outlineColor);

/** The focus indicator's band: an outline, a ring on ::after or ::before, or a spread shadow. */
const ringOf = (el: HTMLElement): Ring | null => {
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

/** The share of a ring's band that its clipping ancestors cut away. */
const ringLoss = (ring: Ring): number => {
  const outer = grow(ring.box, ring.offset + ring.width);
  const inner = grow(ring.box, ring.offset);
  const band = area(outer) - area(inner);
  if (band <= 0) return 0;
  let view: Box = { l: -1e9, t: -1e9, r: 1e9, b: 1e9 };
  for (const clip of clipBoxes(ring.start)) view = meet(view, clip);
  const shown = area(meet(outer, view)) - area(meet(inner, view));
  return 1 - Math.max(0, shown) / band;
};

/**
 * Wait until the tab stops hold still for a few frames. Motion driven from script (a chart that
 * draws in) is not in document.getAnimations(), so settleAnimations cannot finish it, and a ring
 * measured mid-draw is clipped by a different amount on every run.
 */
const settleGeometry = async (limit = 2000) => {
  const snapshot = () =>
    tabStops(document.body, 40)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `${r.left},${r.top},${r.width},${r.height}`;
      })
      .join("|");
  const start = performance.now();
  let last = snapshot();
  let still = 0;
  while (still < 3 && performance.now() - start < limit) {
    await nextFrame();
    const now = snapshot();
    still = now === last ? still + 1 : 0;
    last = now;
  }
};

export async function focusRings(): Promise<GateResult> {
  const restore = noMotion();
  try {
    await settleAnimations();
    await settleGeometry();
    await keyboardModality();
    const items: string[] = [];
    let focusVisible = 0;
    for (const el of tabStops(document.body, 40)) {
      if (!el.isConnected || !visible(el)) continue;
      el.focus();
      if (document.activeElement !== el) continue;
      if (el.matches(":focus-visible")) focusVisible += 1;
      const ring = ringOf(el);
      if (!ring) continue;
      const lost = ringLoss(ring);
      if (lost >= 0.5) items.push(`${describeElement(el)} loses ${Math.round(lost * 100)}%`);
    }
    if (items.length > 0 && focusVisible === 0)
      items.unshift("no stop matched :focus-visible; the check could not set keyboard modality");
    (document.activeElement as HTMLElement | null)?.blur?.();
    return result(items);
  } finally {
    restore();
  }
}

/* ---------- touch (TOO-8, TOO-9) ---------- */

/** A control's hit area: its box, grown by a positioned ::before or ::after that draws one. */
const hitArea = (el: Element): { width: number; height: number } => {
  const rect = el.getBoundingClientRect();
  let width = rect.width;
  let height = rect.height;
  for (const pseudo of ["::before", "::after"]) {
    const ps = getComputedStyle(el, pseudo);
    if (ps.content === "none" || ps.position !== "absolute") continue;
    width = Math.max(width, px(ps.width));
    height = Math.max(height, px(ps.height));
  }
  return { width, height };
};

const opacityOf = (el: Element) => {
  let opacity = 1;
  for (let a: Element | null = el; a && a !== document.documentElement; a = a.parentElement)
    opacity *= parseFloat(getComputedStyle(a).opacity);
  return opacity;
};

export async function touchTargets(): Promise<GateResult> {
  if (!matchMedia("(any-pointer: coarse)").matches || !matchMedia("(hover: none)").matches)
    return result([
      "touch emulation is off: (any-pointer: coarse) and (hover: none) do not match, so this project checks nothing",
    ]);
  await settleAnimations();
  const items: string[] = [];
  const { violations } = await axe.run(document, {
    runOnly: { type: "rule", values: ["target-size"] },
    resultTypes: ["violations"],
  });
  for (const violation of violations)
    for (const node of violation.nodes) {
      const selector = node.target.at(-1);
      const el = typeof selector === "string" ? document.querySelector(selector) : null;
      if (!el) continue;
      const hit = hitArea(el);
      if (hit.width >= 24 && hit.height >= 24) continue;
      items.push(
        `${describeElement(el)} has a ${Math.round(hit.width)}x${Math.round(hit.height)} target`,
      );
    }
  // Actions revealed on hover (row and card actions). A form control drawn transparent over its
  // own visible face (react-day-picker's month select) is not one.
  for (const el of document.body.querySelectorAll(
    'a[href], button, [role="button"], [role="link"], [role="menuitem"]',
  )) {
    if (!visible(el) || (el as HTMLElement).matches(":disabled")) continue;
    if (el.closest("[inert], [aria-hidden='true'], [data-closed], [data-ending-style]")) continue;
    if (opacityOf(el) < 0.05 && !el.matches(":focus-within"))
      items.push(`${describeElement(el)} is transparent until hovered, which touch cannot do`);
  }
  return result(items);
}

/* ---------- forced colours (TOO-7) ---------- */

const STATE =
  '[aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"]), [data-pressed], [data-selected]:not([data-selected="false"]), [data-checked]';
const UNSTATE =
  ':not([aria-selected="true"]):not([aria-pressed="true"]):not([aria-checked="true"]):not([aria-current]:not([aria-current="false"])):not([data-pressed]):not([data-selected]:not([data-selected="false"])):not([data-checked])';

/** What a reader in forced colours can see of an item: its paint, its borders, its marks. */
const signature = (el: Element): string => {
  const parts: string[] = [];
  const paint = (node: Element, pseudo?: string) => {
    const s = getComputedStyle(node, pseudo);
    if (pseudo && s.content === "none") return "";
    return [
      s.backgroundColor,
      s.color,
      s.borderTopColor,
      s.borderTopWidth,
      s.borderBottomColor,
      s.borderBottomWidth,
      s.borderInlineStartColor,
      s.borderInlineStartWidth,
      s.outlineStyle === "none" ? "" : `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
      s.boxShadow,
      s.textDecorationLine,
      s.fontWeight,
      s.backgroundImage,
    ].join("|");
  };
  parts.push(paint(el), paint(el, "::before"), paint(el, "::after"));
  // The painted part may be inside: react-day-picker marks the cell and paints its button.
  for (const child of [...el.querySelectorAll(":scope > *, :scope > * > *")].slice(0, 6))
    if (visible(child)) parts.push(paint(child), paint(child, "::before"), paint(child, "::after"));
  // Marks inside: a check, a dot, an indicator, a thumb; what is drawn and where.
  for (const child of el.querySelectorAll("svg, [data-slot*='indicator'], [data-slot*='thumb']")) {
    if (!visible(child)) continue;
    const rect = child.getBoundingClientRect();
    const host = el.getBoundingClientRect();
    parts.push(
      `${child.tagName}:${Math.round(rect.left - host.left)},${Math.round(rect.width)}:${paint(child)}`,
    );
  }
  return parts.join("/");
};

export async function forcedColourStates(): Promise<GateResult> {
  if (!matchMedia("(forced-colors: active)").matches)
    return result(["forced colours are off, so this project checks nothing"]);
  await settleAnimations();
  const items: string[] = [];
  const seen = new Set<Element>();
  for (const el of document.body.querySelectorAll(STATE)) {
    if (!visible(el) || el.closest("[aria-hidden='true'], [inert]")) continue;
    const role = el.getAttribute("role");
    const group = el.parentElement;
    if (!group || seen.has(group)) continue;
    const peer = [...group.children].find(
      (sibling) =>
        sibling !== el &&
        sibling.tagName === el.tagName &&
        sibling.getAttribute("role") === role &&
        sibling.matches(UNSTATE) &&
        visible(sibling),
    );
    if (!peer) continue;
    seen.add(group);
    // A moving indicator outside the items (the Tabs underline) marks the one it sits under.
    const container =
      el.closest('[role="tablist"], [role="radiogroup"], [role="listbox"], [role="toolbar"]') ??
      group;
    const marks = [...container.querySelectorAll('[data-slot*="indicator"]')].filter(
      (mark) => visible(mark) && !el.contains(mark) && !peer.contains(mark),
    );
    // Over the item (a pill), or along one of its edges (an underline, a side bar).
    const under = (item: Element) =>
      marks.some((mark) => {
        const m = mark.getBoundingClientRect();
        const r = item.getBoundingClientRect();
        const acrossX = Math.min(m.right, r.right) - Math.max(m.left, r.left);
        const acrossY = Math.min(m.bottom, r.bottom) - Math.max(m.top, r.top);
        const near = (a: number, b: number) => Math.abs(a - b) < 8;
        return (
          area(meet(boxOf(m), boxOf(r))) > 0.5 * r.width * r.height ||
          (m.height <= 6 &&
            acrossX > r.width / 2 &&
            (near(m.top, r.bottom) || near(m.bottom, r.top))) ||
          (m.width <= 6 &&
            acrossY > r.height / 2 &&
            (near(m.left, r.right) || near(m.right, r.left)))
        );
      });
    if (under(el) !== under(peer)) continue;
    if (signature(el) === signature(peer))
      items.push(`${describeElement(el)} looks the same as ${describeElement(peer)}`);
  }
  return result(items);
}

/* ---------- short windows (G5) ---------- */

const SURFACE =
  '[role="dialog"], [role="alertdialog"], [data-slot="sheet-content"], [data-slot="drawer-content"]';

/** The share of an element in view, inside the window and every ancestor that clips it. */
const inView = (el: Element): number => {
  const box = boxOf(el.getBoundingClientRect());
  const whole = area(box);
  if (whole <= 0) return 1;
  let view: Box = { l: 0, t: 0, r: innerWidth, b: innerHeight };
  for (const clip of clipBoxes(el)) view = meet(view, clip);
  return area(meet(box, view)) / whole;
};

const scrollsTo = (el: Element): boolean => {
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
    const s = getComputedStyle(a);
    if (/(auto|scroll)/.test(s.overflowY) && a.scrollHeight > a.clientHeight + 1) return true;
  }
  return false;
};

const openSurfaces = () =>
  [...document.querySelectorAll(SURFACE)].filter(
    (surface) => visible(surface) && !surface.closest("[data-closed], [data-ending-style]"),
  );

/** The checks for one open surface: its title can be reached, and focus lands in view. */
async function checkSurface(surface: Element, items: string[]) {
  const labelledBy = surface.getAttribute("aria-labelledby");
  const title = labelledBy ? document.getElementById(labelledBy) : null;
  if (
    title &&
    surface.contains(title) &&
    visible(title) &&
    inView(title) < 0.5 &&
    !scrollsTo(title)
  )
    items.push(
      `the title ${describeElement(title)} is out of the window, and nothing scrolls to it`,
    );
  for (const el of tabStops(surface, 15)) {
    if (!el.isConnected || !visible(el)) continue;
    el.focus();
    if (document.activeElement !== el) continue;
    await nextFrame();
    const shown = inView(el);
    if (shown < 0.5)
      items.push(`${describeElement(el)} is ${Math.round(shown * 100)}% in view when focused`);
  }
}

const TRIGGER =
  '[data-slot="dialog-trigger"], [data-slot="alert-dialog-trigger"], [data-slot="sheet-trigger"], [data-slot="drawer-trigger"], [aria-haspopup="dialog"]';

export async function shortWindow(): Promise<GateResult> {
  await page.viewport(320, 256);
  await nextFrame();
  await nextFrame();
  const restore = noMotion();
  try {
    await settleAnimations();
    await keyboardModality();
    const items: string[] = [];
    const open = openSurfaces();
    if (open.length > 0) {
      for (const surface of open) await checkSurface(surface, items);
      return result(items);
    }
    // Most overlay stories end with the overlay closed: open up to three from their triggers.
    const triggers = [...document.querySelectorAll<HTMLElement>(TRIGGER)]
      .filter((el) => visible(el) && !el.matches(":disabled, [aria-disabled='true']"))
      .slice(0, 3);
    for (const trigger of triggers) {
      // A reader opens what they can see: bring a trigger below the fold into view first, or its
      // popup opens off the window along with it.
      trigger.scrollIntoView({ block: "nearest" });
      await nextFrame();
      trigger.click();
      let surfaces: Element[] = [];
      for (let i = 0; i < 30 && surfaces.length === 0; i++) {
        await nextFrame();
        surfaces = openSurfaces();
      }
      await settleAnimations();
      for (const surface of surfaces) await checkSurface(surface, items);
      await userEvent.keyboard("{Escape}");
      for (let i = 0; i < 30 && openSurfaces().length > 0; i++) await nextFrame();
    }
    return result(items);
  } finally {
    restore();
  }
}

/* ---------- long content (G1-12) ---------- */

const TOKEN = "urn:uuid:0b9a3f4e-5c1d-4e7a-9f2b-8c6d1e0a7b3f/controls/ac-2.4_smt.a_param-01_odp";
/** Where an id, a URN or a file name turns up: titles, values, descriptions and prose. */
const VALUE =
  'h1, h2, h3, h4, h5, h6, p, dd, td, li, blockquote, [data-slot$="-title"], [data-slot$="-description"], [data-slot$="-value"], [data-slot$="-label"]';
/** Short labels that never hold one: controls, badges, tabs, form labels. */
const CONTROL =
  'button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [data-slot="badge"], label, [data-slot="field-label"], input, select, textarea';
const textNodes = (): Text[] => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || parent.closest("script, style, noscript, template, svg")) continue;
    nodes.push(node as Text);
  }
  return nodes;
};
const hiddenText = (el: Element) => {
  const rect = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  return rect.width <= 1 || rect.height <= 1 || s.clipPath !== "none" || s.clip.startsWith("rect");
};

/** Layout problems long text causes: page scroll, paint past the frame, text cut with no ellipsis. */
const textProblems = (): Map<Element, string> => {
  const problems = new Map<Element, string>();
  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth + 1)
    problems.set(doc, `the page scrolls sideways by ${doc.scrollWidth - doc.clientWidth}px`);
  const frame = document.querySelector("[data-ledger-frame]");
  const edge = frame?.getBoundingClientRect();
  for (const el of document.body.querySelectorAll("*")) {
    if (!visible(el) || hiddenText(el)) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && (n.nodeValue ?? "").trim());
    if (!own) continue;
    const s = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (
      edge &&
      (rect.right > edge.right + 2 || rect.left < edge.left - 2) &&
      s.position !== "fixed"
    ) {
      const clipped = clipBoxes(el).some((box) => box.r < 1e9 && box.l > -1e9);
      if (!clipped) problems.set(el, `${describeElement(el)} paints past the frame`);
    }
    const clipX = /(hidden|clip)/.test(s.overflowX);
    if (clipX && el.scrollWidth > el.clientWidth + 1) {
      const ellipsis = s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none";
      if (!ellipsis) problems.set(el, `${describeElement(el)} cuts its text with no ellipsis`);
    }
  }
  return problems;
};

/**
 * A gate's own change (focusing every stop, a smaller window, longer text) resizes what the kit
 * observes (Scroller, Toaster, DataTable), and Chromium reports the observers' catch-up as
 * "ResizeObserver loop completed with undelivered notifications". That report is about the
 * gate's change, not the story, so it is absorbed while the gate runs and for a few frames after;
 * every other error still reaches the run, and the story's own render and play are not covered.
 */
const absorbResizeLoops = () => {
  const absorb = (event: ErrorEvent) => {
    if (/ResizeObserver loop/.test(event.message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };
  window.addEventListener("error", absorb, true);
  return () => window.removeEventListener("error", absorb, true);
};

export async function longContent(): Promise<GateResult> {
  await settleAnimations();
  const before = textProblems();
  const original: [Text, string][] = [];
  try {
    let tokens = 0;
    for (const node of textNodes()) {
      const text = node.nodeValue ?? "";
      if (!text.trim() || /^[\d\s.,:%/+-]+$/.test(text)) continue;
      // Every word grows by 40%, as a translation does. Values and prose also gain an unbroken
      // token (an id, a URN, a hash); a control's label, a badge or a tab never holds one.
      const longer = text.replace(/([A-Za-z]{3,})/g, (word) =>
        word.concat(word.slice(0, Math.ceil(word.length * 0.4)).toLowerCase()),
      );
      const parent = node.parentElement;
      const value =
        parent?.closest(VALUE) && !parent.closest(CONTROL) && text.trim().length > 3 && tokens < 80;
      original.push([node, text]);
      node.nodeValue = value ? `${longer} ${TOKEN}` : longer;
      if (value) tokens += 1;
    }
    await nextFrame();
    await nextFrame();
    const items = [...textProblems()]
      .filter(([el]) => !before.has(el))
      .map(([, problem]) => problem);
    return result(items);
  } finally {
    for (const [node, text] of original) node.nodeValue = text;
  }
}

/* ---------- reduced motion (G8-8) ---------- */

/** Properties whose change moves or resizes something on the page. */
const MOVES =
  /^(all|transform|translate|rotate|scale|width|height|min-width|max-width|min-height|max-height|block-size|inline-size|top|right|bottom|left|inset(-.+)?|margin(-.+)?|flex-basis|grid-template-(rows|columns))$/;
const camelToKebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
/** A CSS time list as milliseconds: "0.15s, 0.01ms" is [150, 0.01]. */
const times = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .map((part) => (part.endsWith("ms") ? parseFloat(part) : parseFloat(part) * 1000) || 0);

/** Transitions that started during the render and play and moved something, with their duration. */
let started: string[] = [];
const onTransitionRun = (event: TransitionEvent) => {
  if (!MOVES.test(event.propertyName)) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const style = getComputedStyle(target, event.pseudoElement || null);
  const properties = style.transitionProperty.split(",").map((part) => part.trim());
  const durations = times(style.transitionDuration);
  const index = properties.findIndex((p) => p === event.propertyName || p === "all");
  const duration = durations[(index < 0 ? 0 : index) % Math.max(1, durations.length)] ?? 0;
  if (duration > 0.01)
    started.push(
      `${describeElement(target)} moved ${event.propertyName} over ${Math.round(duration)}ms`,
    );
};
/** Records moving transitions from here until the motion gate reads them (storybook.setup.ts). */
export function watchMotion(): () => void {
  started = [];
  document.addEventListener("transitionrun", onTransitionRun, true);
  return () => document.removeEventListener("transitionrun", onTransitionRun, true);
}

/** An element with no slot of its own, by its id or first classes, so the report finds it. */
const where = (el: Element) =>
  el.hasAttribute("data-slot")
    ? ""
    : el.id
      ? ` #${el.id}`
      : el.classList.length
        ? ` .${[...el.classList].slice(0, 3).join(".")}`
        : "";

export async function reducedMotion(): Promise<GateResult> {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
    return result(["reduced motion is off, so this project checks nothing"]);
  await nextFrame();
  const items = [...started];
  for (const el of document.body.querySelectorAll("*")) {
    // Storybook's own hidden loader transitions `all`; what is not drawn cannot move.
    if (!visible(el)) continue;
    const style = getComputedStyle(el);
    if (style.transitionProperty === "none" || style.transitionDuration === "0s") continue;
    const properties = style.transitionProperty.split(",").map((part) => part.trim());
    const durations = times(style.transitionDuration);
    properties.forEach((property, index) => {
      const duration = durations[index % Math.max(1, durations.length)] ?? 0;
      if (MOVES.test(property) && duration > 0.01)
        items.push(`${describeElement(el)}${where(el)} transitions ${property} over ${duration}ms`);
    });
  }
  for (const animation of document.getAnimations()) {
    if (animation.playState !== "running" && !animation.pending) continue;
    const effect = animation.effect;
    if (!(effect instanceof KeyframeEffect)) continue;
    const timing = effect.getComputedTiming();
    const duration = typeof timing.duration === "number" ? timing.duration : 0;
    if (duration <= 10) continue;
    const moved =
      "transitionProperty" in animation
        ? [String((animation as CSSTransition).transitionProperty)]
        : effect
            .getKeyframes()
            .flatMap((frame) => Object.keys(frame))
            .map(camelToKebab);
    const property = moved.find((name) => MOVES.test(name));
    if (!property) continue;
    const name =
      "animationName" in animation ? ` (${(animation as CSSAnimation).animationName})` : "";
    const target = effect.target;
    items.push(
      `${target ? describeElement(target) : "an element"} animates ${property}${name} over ${Math.round(duration)}ms`,
    );
  }
  return result(items);
}

const gates: Record<Gate, () => Promise<GateResult>> = {
  focus: focusRings,
  touch: touchTargets,
  "forced-colors": forcedColourStates,
  short: shortWindow,
  long: longContent,
  motion: reducedMotion,
};

export const gateHelp: Record<Gate, string> = {
  focus:
    "Give the clipping part ring room (padding the size of the ring) or draw the ring inset on its focusable children (outline-field-focused geometry).",
  touch:
    "Give the control a 24px hit area (touch-target, or its own size), and show row and card actions without hover where (hover: none) matches.",
  "forced-colors":
    "Key a forced-colors rule on the state (Highlight/HighlightText, SelectedItem, or a system-colour border or mark) in src/styles/forced-colors.css.",
  short:
    "Let the surface scroll as one below 30rem tall, keep its title reachable, and keep focus scroll margins inside the overlay's own scroller.",
  long: "Let titles and values wrap (ids and URLs wrap anywhere) or truncate with an ellipsis and a reveal.",
  motion:
    "Under prefers-reduced-motion: reduce, give the part's movement a 0.01ms duration in src/styles/motion.css (or read useReducedMotion for motion driven from script); a fade may stay.",
};

/** Runs a gate over the rendered story. */
export async function runGate(gate: Gate): Promise<GateResult> {
  const release = absorbResizeLoops();
  try {
    return await gates[gate]();
  } finally {
    for (let i = 0; i < 3; i++) await nextFrame();
    release();
  }
}
