import { afterEach, beforeEach, expect, inject, vi } from "vitest";

import allowList from "./layout-allow.json";

/**
 * Checks every story runs under, after its render and play function and once its web fonts have
 * loaded:
 * - no unexpected console errors;
 * - the page does not scroll sideways at the width the story renders at.
 *
 * The two layout projects in vitest.config.ts add, without axe:
 * - storybook-narrow (390px phone): no word of four or more letters breaks across two lines, and
 *   nothing visible paints past the page's left edge, where no one can scroll to it (an RTL part
 *   overflows that way);
 * - storybook-contained (320px frame on the desktop canvas, the Frame toolbar's "320px
 *   container"): nothing paints past either edge of the frame outside a scroller, and no word
 *   breaks. A fullscreen story is page-level and gets no frame.
 *
 * A story that shows one of these on purpose (a Don't whose mistake is the overflow itself) is
 * listed by id in test/layout-allow.json with its reason; the list is short, and a fixture that
 * overflows because of a fixed width becomes fluid instead. Two things in the story itself change
 * how a check sees it: `layout: "fullscreen"` (page-level) skips only the contained check, and
 * story `globals` render it at the width they pin, with `frame: "canvas"` taking it out of the
 * 320px frame.
 */

type LayoutCheck = "narrow" | "contained";

declare module "vitest" {
  export interface ProvidedContext {
    "ledger/layout-check": LayoutCheck;
  }
}

const layoutCheck = (): LayoutCheck | undefined => {
  try {
    return inject("ledger/layout-check");
  } catch {
    return undefined;
  }
};

/**
 * The reason a story is exempt from a layout check. The list names each story by its id, one
 * reason each, so an exemption is a decision about that story and never a whole kind of story.
 */
const exemption = (check: LayoutCheck, storyId: string | undefined): string | undefined => {
  const entries: Record<string, string> = allowList[check];
  return storyId === undefined ? undefined : entries[storyId];
};

/** Hidden from sight on purpose: a visually-hidden label, or inside one. */
const visuallyHidden = (() => {
  let cache = new WeakMap<Element, boolean>();
  const check = (el: Element | null): boolean => {
    if (!el || el === document.body) return false;
    const cached = cache.get(el);
    if (cached !== undefined) return cached;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const hidden =
      style.clip.startsWith("rect") ||
      style.clipPath !== "none" ||
      (style.overflowX !== "visible" && rect.width <= 1 && rect.height <= 1) ||
      check(el.parentElement);
    cache.set(el, hidden);
    return hidden;
  };
  return Object.assign(check, { reset: () => (cache = new WeakMap()) });
})();

/** `<span data-slot="x"> in [data-slot="y"] "its text"`, so the failure says what to fix. */
const describe = (el: Element): string => {
  const slot = el.getAttribute("data-slot");
  const within = slot ? null : el.parentElement?.closest("[data-slot]")?.getAttribute("data-slot");
  const text = (el.textContent ?? "").trim().replace(/\s+/g, " ");
  return [
    `<${el.tagName.toLowerCase()}${slot ? ` data-slot="${slot}"` : ""}>`,
    within ? ` in [data-slot="${within}"]` : "",
    text ? ` "${text.length > 40 ? `${text.slice(0, 39)}…` : text}"` : "",
  ].join("");
};

/** Up to five distinct offenders with how far they reach, and why a hidden label escaped. */
const summarize = (items: { el: Element; reach: string }[]): string => {
  const seen = new Map<string, { reach: string; count: number }>();
  let escaped = false;
  for (const { el, reach } of items) {
    if (getComputedStyle(el).position === "absolute" && visuallyHidden(el)) escaped = true;
    const key = describe(el);
    const entry = seen.get(key);
    if (entry) entry.count += 1;
    else seen.set(key, { reach, count: 1 });
  }
  const list = [...seen]
    .slice(0, 5)
    .map(([key, { reach, count }]) => `${key} ${reach}${count > 1 ? ` (${count} times)` : ""}`);
  if (seen.size > 5) list.push(`${seen.size - 5} more`);
  return `${list.join("; ")}${
    escaped
      ? ". A visually hidden label is absolutely positioned against an ancestor outside its scroller, so it escapes the scroller: make the part (or the scroller) `relative`."
      : ""
  }`;
};

/** Keep the outermost of a set of elements, so one overflowing row is not reported per cell. */
const outermost = (els: Iterable<Element>): Element[] => {
  const set = new Set(els);
  return [...set].filter((el) => {
    for (let a = el.parentElement; a; a = a.parentElement) if (set.has(a)) return false;
    return true;
  });
};

/** The number of line boxes a run of text sits on. */
const lineCount = (rects: DOMRectList): number => {
  const lines: DOMRect[] = [];
  for (const rect of Array.from(rects)) {
    if (rect.width < 0.5 || rect.height < 0.5) continue;
    const same = lines.some(
      (line) => Math.abs(line.top - rect.top) < Math.min(line.height, rect.height) / 2,
    );
    if (!same) lines.push(rect);
  }
  return lines.length;
};

const WORD = /(?<![\p{L}\p{N}])\p{L}{4,}(?![\p{L}\p{N}])/gu;

/**
 * Words of four or more letters split across two lines ("Recorde / d runs"): the part squeezed
 * its text below one word. Text that breaks anywhere on purpose (`overflow-wrap: anywhere`,
 * `word-break: break-all`, hyphenation), SVG text and visually hidden text are left out.
 */
const brokenWords = (root: Element): string[] => {
  const found = new Map<Element, string[]>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    const parent = node.parentElement;
    if (!parent || !/\p{L}{4}/u.test(text)) continue;
    if (parent.closest("svg, script, style, textarea, noscript, template")) continue;
    range.selectNodeContents(node);
    if (lineCount(range.getClientRects()) < 2) continue;
    const style = getComputedStyle(parent);
    if (style.overflowWrap === "anywhere" || style.wordBreak === "break-all") continue;
    if (style.hyphens === "auto") continue;
    if (!parent.checkVisibility({ visibilityProperty: true }) || visuallyHidden(parent)) continue;
    for (const match of text.matchAll(WORD)) {
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      if (lineCount(range.getClientRects()) > 1) {
        found.set(parent, [...(found.get(parent) ?? []), match[0]]);
      }
    }
  }
  return [...found]
    .slice(0, 5)
    .map(([el, words]) => `"${words.slice(0, 3).join('", "')}" in ${describe(el)}`);
};

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Wait for the fonts the reader sees. The preview links Geist with `display=swap`, so a story
 * first paints in the fallback font and reflows when Geist arrives; measuring before then passes
 * or fails by font timing, and by whichever fallback the machine has (a Linux runner's is wider).
 * Laying out first starts the loads for the faces the story uses. Bounded, so an unreachable font
 * host measures the fallback rather than hanging the run.
 */
const fontsSettled = async (): Promise<void> => {
  const settle = async () => {
    void document.body.offsetWidth;
    await nextFrame();
    await document.fonts.ready;
    await nextFrame();
  };
  await Promise.race([settle(), new Promise<void>((resolve) => setTimeout(resolve, 5000))]);
};

const clips = (el: Element): boolean => {
  const style = getComputedStyle(el);
  return (
    style.overflowX !== "visible" ||
    style.clipPath !== "none" ||
    /paint|strict|content/.test(style.contain)
  );
};

type Past = { el: Element; side: "left" | "right"; at: number };

/**
 * What paints past `edges` (viewport pixels) inside `root`, where nothing between it and the root
 * clips or scrolls it: the outermost such elements, with the side and the coordinate they reach.
 * An absolutely positioned element is clipped only from its containing block up, so a visually
 * hidden label that escapes a scroller with no positioned ancestor inside it is found: past the
 * right edge it scrolls the page, or the panel around the part, sideways. Past the left edge
 * (where an RTL part overflows) nothing scrolls in a left-to-right page and the content is out of
 * reach, so only what the reader would see counts there. An element fixed to the viewport (a
 * toast region) is left out. A word too long for its line paints past its own box, so text runs
 * are measured too, unless their box clips them (a truncated label).
 */
const paintsPast = (
  root: Element,
  edges: { left?: number | undefined; right?: number | undefined },
): Past[] => {
  const free = new Map<Element, boolean>();
  const paintsFree = (el: Element): boolean => {
    const cached = free.get(el);
    if (cached !== undefined) return cached;
    const position = getComputedStyle(el).position;
    const container =
      position === "absolute" && el instanceof HTMLElement ? el.offsetParent : el.parentElement;
    const result =
      position !== "fixed" &&
      (!container ||
        container === root ||
        !root.contains(container) ||
        (!clips(container) && paintsFree(container)));
    free.set(el, result);
    return result;
  };
  const beyond = (rect: DOMRect): Omit<Past, "el"> | undefined => {
    if (edges.right !== undefined && rect.right > edges.right + 1) {
      return { side: "right", at: rect.right };
    }
    if (edges.left !== undefined && rect.left < edges.left - 1) {
      return { side: "left", at: rect.left };
    }
    return undefined;
  };
  const counts = (el: Element, side: Past["side"]): boolean =>
    side === "right" || (el.checkVisibility({ visibilityProperty: true }) && !visuallyHidden(el));
  const past = new Map<Element, Past>();
  for (const el of Array.from(root.querySelectorAll("*"))) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const hit = beyond(rect);
    if (hit && counts(el, hit.side) && paintsFree(el)) past.set(el, { el, ...hit });
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || !(node.nodeValue ?? "").trim() || past.has(parent)) continue;
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    if (rect.width <= 0 || clips(parent)) continue;
    const hit = beyond(rect);
    if (hit && counts(parent, hit.side) && paintsFree(parent)) {
      past.set(parent, { el: parent, ...hit });
    }
  }
  return outermost(past.keys()).flatMap((el) => past.get(el) ?? []);
};

/** How far the page scrolls sideways, and what reaches past its edge, when it does. */
const pageOverflow = (): string | undefined => {
  const doc = document.documentElement;
  const overflow = doc.scrollWidth - doc.clientWidth;
  if (overflow <= 1) return undefined;
  const past = paintsPast(document.body, { right: doc.clientWidth }).map(({ el, at }) => ({
    el,
    reach: `right=${Math.round(at)}`,
  }));
  return `${overflow}px past the ${doc.clientWidth}px edge. ${summarize(past)}`;
};

/** What paints past the page's left edge: no one can scroll to it in a left-to-right page. */
const pageStartPast = (): string | undefined => {
  const past = paintsPast(document.body, { left: 0 }).map(({ el, at }) => ({
    el,
    reach: `left=${Math.round(at)}`,
  }));
  return past.length > 0 ? summarize(past) : undefined;
};

/** What paints past either edge of the frame outside a scroller, and by how much. */
const framePast = (frame: Element): string | undefined => {
  const { left, right } = frame.getBoundingClientRect();
  const past = paintsPast(frame, { left, right }).map(({ el, side, at }) => ({
    el,
    reach: side === "right" ? `+${Math.round(at - right)}px` : `-${Math.round(left - at)}px`,
  }));
  return past.length > 0 ? summarize(past) : undefined;
};

let errors: unknown[][];
let restore: (() => void) | undefined;
beforeEach(() => {
  errors = [];
  const original = console.error.bind(console);
  const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    errors.push(args);
    original(...args);
  });
  restore = () => spy.mockRestore();
});
afterEach(async (ctx) => {
  restore?.();
  expect(errors, "Stories must not emit unexpected console errors").toEqual([]);

  await fontsSettled();
  visuallyHidden.reset();
  const check = layoutCheck();
  const storyId = (ctx.task.meta as { storyId?: string }).storyId;
  if (check && exemption(check, storyId) !== undefined) return;

  const overflow = pageOverflow();
  if (!check) {
    if (overflow) {
      expect.fail(
        `Stories must not scroll the page sideways at the width they render at: ${overflow}`,
      );
    }
    return;
  }

  const frame =
    check === "contained"
      ? Array.from(document.querySelectorAll("[data-ledger-frame]")).at(-1)
      : undefined;
  // A fullscreen story is page-level: the preview leaves it the whole canvas, as the light
  // project renders it, so there is no frame to fit.
  if (check === "contained" && !frame) return;
  const words = brokenWords(frame ?? document.body);
  const past = frame ? framePast(frame) : undefined;
  const start = frame ? undefined : pageStartPast();
  const problems: string[] = [];
  if (overflow) problems.push(`The page scrolls sideways: ${overflow}`);
  if (start) problems.push(`Paints past the page's left edge, out of reach: ${start}`);
  if (words.length > 0) problems.push(`Words break mid-word: ${words.join("; ")}`);
  if (past) problems.push(`Paints past the 320px frame outside a scroller: ${past}`);
  if (problems.length === 0) return;

  const story = `${import.meta.env["__STORYBOOK_URL__"] ?? ""}/?path=/story/${storyId ?? ""}`;
  const where =
    check === "narrow"
      ? `at ${window.innerWidth}px (${story}&globals=viewport.value:ledgerPhone)`
      : `in a 320px frame (${story}&globals=frame:contained)`;
  expect.fail(
    [
      `Stories must fit ${where}:`,
      ...problems.map((problem) => `- ${problem}`),
      "Make the part, or the story's fixed-width frame, fluid (maxWidth, not width). A story that shows this on purpose goes in test/layout-allow.json with its reason.",
    ].join("\n"),
  );
});
