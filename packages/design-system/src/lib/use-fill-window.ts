import { useLayoutEffect, useState, type RefObject } from "react";

/*
 * Where a block that fills the window starts. A `fill-window` block (layout.css) takes the rest of
 * the window below its own top edge, so it needs that edge as a number: its offset from the top of
 * the document, which it sets on itself as `--fill-top`. The block measures once before paint and
 * again whenever anything above it changes height: the observer watches the block's ancestors, not
 * the document, because the shell's grid keeps the document at the window's height while the
 * page's content shrinks.
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
    // Only an animation on the block or a box around it (the page's entrance) can move its top
    // without a resize; a menu, tooltip or toast animating elsewhere does not, so it is not read.
    const settle = (event: AnimationEvent) => {
      if (event.target instanceof Node && event.target.contains(el)) measure();
    };
    document.addEventListener("animationend", settle);
    const observer =
      typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
    let node: HTMLElement | null = el;
    for (; node && node !== document.documentElement; node = node.parentElement)
      observer?.observe(node);
    return () => {
      observer?.disconnect();
      document.removeEventListener("animationend", settle);
    };
  }, [ref, enabled]);
  return top;
}
