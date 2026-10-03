/*
 * Geometry a play can assert either way the page reads: the Direction toolbar (and the
 * storybook-rtl test project) lays every story out right to left, so a play that measures a
 * line's start or end, scrolls sideways or presses a sideways arrow asks these rather than
 * assuming left to right.
 */

/** Whether an element reads right to left: the Direction toolbar, or a story's own provider. */
export const isRtl = (el: Element) => getComputedStyle(el).direction === "rtl";

/**
 * A box's start and end along the line, read the way the element reads: in right to left both are
 * negated, so `along(a).end <= along(b).start` says that a ends before b starts either way.
 */
export const along = (el: Element, box: DOMRect = el.getBoundingClientRect()) =>
  isRtl(el) ? { start: -box.right, end: -box.left } : { start: box.left, end: box.right };

/** A sideways scroll offset towards the line's end: rightward, or leftward (negative) in rtl. */
export const towardsEnd = (el: Element, by: number) => (isRtl(el) ? -by : by);

/** How far a scroller has scrolled from the line's start, a positive distance either way. */
export const scrolledFromStart = (el: Element) => Math.abs(el.scrollLeft);

/**
 * How near the line's start a scroller may stop and count as there: none left to right, and the
 * pixel a right-to-left scroller may stop short by (Chromium rounds its negative offsets), which
 * the kit's Scroller treats as the start too.
 */
export const startSlack = (el: Element) => (isRtl(el) ? 1 : 0);

/** The arrow key towards the line's end (`next`) and towards its start (`previous`). */
export const arrows = (el: Element) =>
  isRtl(el)
    ? { next: "{ArrowLeft}", previous: "{ArrowRight}" }
    : { next: "{ArrowRight}", previous: "{ArrowLeft}" };
