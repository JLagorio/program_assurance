import { useLayoutEffect, useRef, type RefObject } from "react";

/** Explicit targets take precedence; otherwise restore the element that opened the surface. */
export function useOverlayFocus(open: boolean, returnFocusRef?: RefObject<HTMLElement | null>) {
  const opener = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open) {
      const active = document.activeElement;
      opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
    }
  }, [open]);
  return (event: Event) => {
    event.preventDefault();
    const explicit = returnFocusRef?.current;
    for (const target of [explicit, opener.current]) {
      if (
        !target?.isConnected ||
        target.matches(":disabled") ||
        target.closest("[hidden], [inert]")
      )
        continue;
      target.focus({ preventScroll: true });
      if (document.activeElement === target) return;
    }
    // A deleted opener needs a useful destination, even when the caller has no surviving row.
    const fallback = document.querySelector<HTMLElement>(
      '[role="dialog"], [role="alertdialog"], main, h1',
    );
    if (fallback) {
      const previous = fallback.getAttribute("tabindex");
      fallback.setAttribute("tabindex", "-1");
      fallback.focus({ preventScroll: true });
      if (previous === null) fallback.removeAttribute("tabindex");
      else fallback.setAttribute("tabindex", previous);
    }
  };
}
