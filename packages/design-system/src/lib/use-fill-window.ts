import { useLayoutEffect, useState, type RefObject } from "react";
import { flushSync } from "react-dom";

/*
 * Where a block that fills the window starts. A `fill-window` block (layout.css) takes the rest of
 * the window below its own top edge, so it needs that edge as a number: its offset from the top of
 * the document, which it sets on itself as `--fill-top`. The block measures once before paint and
 * again whenever anything above it changes height: the observer watches the block's ancestors, not
 * the document, because the shell's grid keeps the document at the window's height while the
 * page's content shrinks.
 *
 * A change is measured on the frame after it and committed there at once, before that frame lays
 * out, never inside the ResizeObserver loop that reported it. A state update left pending in that
 * loop is rendered by the next synchronous render in it, since React renders pending default
 * updates with sync ones, and a Base UI popup's positioner renders one (`flushSync`) when its own
 * observer reports. The block then resized in the middle of the loop, and so did the body, which
 * this observer had already been told about: "ResizeObserver loop completed with undelivered
 * notifications" (Layout/Pages › Register, when Refresh closed the menu in the frame its
 * positioner was observed again).
 */

/**
 * The element's offset from the top of the document, in whole pixels. The offset chain ignores
 * transforms (the entrance animation translates the page) but rounds; the rect is exact but moves
 * while that animation runs. The exact value wins when the two agree; the ceiling keeps the
 * document from overflowing the window by a fraction of a pixel.
 */
function documentTop(el: HTMLElement) {
  let chain = 0;
  for (let node: Element | null = el; node instanceof HTMLElement; node = node.offsetParent) {
    chain += node.offsetTop;
    const parent = node.offsetParent;
    if (parent instanceof HTMLElement && parent !== document.body) chain += parent.clientTop;
  }
  const exact = el.getBoundingClientRect().top + window.scrollY;
  return Math.ceil(Math.abs(exact - chain) < 1 ? exact : chain);
}

/**
 * The offset of a `fill-window` block from the top of the document, kept current while the page
 * above it changes and after the entrance animation ends. Set it on the block as `--fill-top`.
 */
export function useFillWindow(ref: RefObject<HTMLElement | null>, enabled = true): number {
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const measure = () => setTop(documentTop(el));
    measure();
    // Every later measure waits for the next frame and commits before it lays out, so nothing of
    // the block's is left pending for another observer's synchronous render to apply mid-loop.
    let frame = 0;
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => flushSync(measure));
    };
    // Only an animation on the block or a box around it (the page's entrance) can move its top
    // without a resize; a menu, tooltip or toast animating elsewhere does not, so it is not read.
    const settle = (event: AnimationEvent) => {
      if (event.target instanceof Node && event.target.contains(el)) later();
    };
    document.addEventListener("animationend", settle);
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(later);
    let node: HTMLElement | null = el;
    for (; node && node !== document.documentElement; node = node.parentElement)
      observer?.observe(node);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener("animationend", settle);
    };
  }, [ref, enabled]);
  return top;
}
