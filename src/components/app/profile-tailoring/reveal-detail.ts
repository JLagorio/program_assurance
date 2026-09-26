import { useEffect, useRef } from "react";

/**
 * Whether a WorkPane shows its detail under the list (a narrow dialog) rather than beside it.
 * Stacked, a chosen row's detail starts after the whole list.
 */
function stackedBelowList(detail: HTMLElement | null) {
  const aside = detail?.closest('[data-slot="work-pane"]')?.querySelector("aside");
  if (!detail || !aside) return false;
  return detail.getBoundingClientRect().top >= aside.getBoundingClientRect().bottom - 1;
}

/**
 * The tailoring dialogs' interim for a stacked WorkPane (the kit's stacked behaviour is an open
 * decision, D5): after the reader chooses a row, when the detail sits under the list, bring the
 * detail into view and move focus to its heading, so choosing is never a click that seems to do
 * nothing. Side by side, focus stays on the list. `arm()` before changing `chosen`; put
 * `detailRef` on the detail's wrapper and `headingRef` on its first heading (`tabIndex={-1}`).
 */
export function useRevealDetail(chosen: unknown) {
  const detailRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const armed = useRef(false);
  useEffect(() => {
    if (!armed.current) return;
    armed.current = false;
    if (!stackedBelowList(detailRef.current)) return;
    headingRef.current?.scrollIntoView({ block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [chosen]);
  return {
    detailRef,
    headingRef,
    arm: () => {
      armed.current = true;
    },
    /** Side by side, scroll the list to the open row (the `index`th); stacked, the heading shows the detail. */
    showRow: (index: number) => {
      const detail = detailRef.current;
      if (!detail || index < 0 || stackedBelowList(detail)) return;
      const aside = detail.closest('[data-slot="work-pane"]')?.querySelector("aside");
      aside?.querySelectorAll('[data-slot="item"]')[index]?.scrollIntoView({ block: "nearest" });
    },
  };
}

/**
 * After a confirmed removal in the tailoring screens, the Remove control that asked is gone with
 * the decision (a row menu, a preview's overflow, the button in a dialog). Once the confirmation
 * has let go of focus and `target` is on screen (a preview that covered the collection has
 * closed), `target` takes focus: the record's heading in a dialog, the collection's primary on the
 * page.
 */
export function focusAfterConfirmation(target: () => HTMLElement | null) {
  let tries = 0;
  let settled = 0;
  const settle = () => {
    // The confirmation hands focus back to its opener as it unmounts; wait a frame past that.
    const asking = !!document.querySelector('[role="alertdialog"]');
    settled = asking ? 0 : settled + 1;
    const element = settled > 1 ? target() : null;
    if (element) element.focus();
    else if (tries++ < 120) requestAnimationFrame(settle);
  };
  requestAnimationFrame(settle);
}
