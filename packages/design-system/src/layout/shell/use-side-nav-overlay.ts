import { useLayoutEffect, useRef, useState } from "react";

import { tokenValue } from "../../generated/tokens";

type OverlayFrame = {
  transform: string;
  opacity: string;
  scrimOpacity: string;
};

/** Keep the flyout mounted until its exit finishes, including interrupted exits. */
export function useSideNavOverlay(open: boolean, isDesktop: boolean, expanded: boolean) {
  const navRef = useRef<HTMLElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const [present, setPresent] = useState(open);
  const retained = useRef(open);
  const viewport = useRef(isDesktop);
  const ignoreViewportClose = useRef(false);
  const frame = useRef<OverlayFrame | null>(null);
  const activeAnimations = useRef<Animation[]>([]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const scrim = scrimRef.current;
    const changedViewport = viewport.current !== isDesktop;
    viewport.current = isDesktop;

    // Shell closes an overlay after a breakpoint change. Neither that close nor
    // pinning a desktop peek should leave an animated overlay over the new layout.
    if (changedViewport) ignoreViewportClose.current = open;
    if (changedViewport || ignoreViewportClose.current || (!open && isDesktop && expanded)) {
      if (!open) ignoreViewportClose.current = false;
      frame.current = null;
      retained.current = false;
      setPresent(false);
      return;
    }
    if (!open && !retained.current) return;

    const wasPresent = retained.current;
    retained.current = true;
    setPresent(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations: Animation[] = [];
    activeAnimations.current = animations;
    const cancel = () => {
      for (const animation of animations) {
        animation.onfinish = null;
        animation.cancel();
      }
    };
    const settle = () => {
      for (const animation of animations) {
        animation.onfinish = null;
        if (open) animation.cancel();
        // Hold the offscreen frame until React commits the hidden layout. This
        // also snaps a closing animation when reduced motion becomes enabled.
        else animation.finish();
      }
      frame.current = null;
      retained.current = open;
      setPresent(open);
    };
    const preferenceChanged = () => {
      if (reducedMotion.matches) settle();
    };
    reducedMotion.addEventListener("change", preferenceChanged);

    if (reducedMotion.matches || typeof nav.animate !== "function") {
      settle();
    } else {
      const style = getComputedStyle(nav);
      const closedTransform = `translateX(${style.direction === "rtl" ? "" : "-"}100%)`;
      const from = frame.current ?? {
        transform: wasPresent ? style.transform : closedTransform,
        opacity: wasPresent ? style.opacity : "0",
        scrimOpacity: wasPresent && scrim ? getComputedStyle(scrim).opacity : "0",
      };
      frame.current = null;
      const duration = tokenValue("motion.duration.moderate", nav);
      const timing: KeyframeAnimationOptions = {
        duration: Number.parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000),
        easing: tokenValue("motion.easing.standard", nav),
        fill: "both",
      };
      const slide = nav.animate(
        [
          { transform: from.transform, opacity: from.opacity },
          { transform: open ? "translateX(0)" : closedTransform, opacity: open ? "1" : "0" },
        ],
        timing,
      );
      animations.push(slide);
      if (scrim) {
        animations.push(
          scrim.animate([{ opacity: from.scrimOpacity }, { opacity: open ? "1" : "0" }], timing),
        );
      }
      slide.onfinish = settle;
    }

    return () => {
      // Read the rendered frame before cancelling WAAPI. A quick reversal starts
      // here instead of jumping back to either endpoint. Unmount also cancels both.
      if (retained.current) {
        const style = getComputedStyle(nav);
        frame.current = {
          transform: style.transform,
          opacity: style.opacity,
          scrimOpacity: scrim ? getComputedStyle(scrim).opacity : "0",
        };
      } else {
        frame.current = null;
      }
      cancel();
      reducedMotion.removeEventListener("change", preferenceChanged);
    };
  }, [open, isDesktop, expanded]);

  useLayoutEffect(() => {
    if (!open && !present) {
      for (const animation of activeAnimations.current) animation.cancel();
      activeAnimations.current = [];
    }
  }, [open, present]);

  return { navRef, scrimRef, present: open || present };
}
