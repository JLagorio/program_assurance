import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Keep Base UI portals inside an enclosing dialog's focus scope during the migration. */
export function useOverlayContainer() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const ref = useCallback((node: HTMLSpanElement | null) => {
    setContainer(node?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? null);
  }, []);
  return { container: container ?? undefined, ref };
}

/** Radix observes Escape during capture; let a nested Base UI popup handle it first. */
export function preserveNestedPopupEscape(event: KeyboardEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const popup = target.closest(
    '[data-slot="combobox-content"][data-open], [data-slot="popover-content"][data-open], [data-slot="dropdown-menu-content"][data-open], [data-slot="dropdown-menu-sub-content"][data-open]',
  );
  const trigger = target.closest('[data-slot="popover-trigger"][aria-expanded="true"]');
  const controlledPopup = trigger?.ownerDocument.getElementById(
    trigger.getAttribute("aria-controls") ?? "",
  );
  const tooltip = target
    .closest('[role="dialog"], [role="alertdialog"]')
    ?.querySelector('[data-slot="tooltip-content"][data-open]');
  const input = target.closest<HTMLInputElement>('input[data-slot="combobox-input"]');
  if (
    popup ||
    tooltip ||
    controlledPopup?.matches('[data-slot="popover-content"][data-open]') ||
    (input &&
      !input.readOnly &&
      !input.disabled &&
      (input.getAttribute("aria-expanded") === "true" ||
        input.value !== "" ||
        input
          .closest('[data-slot="combobox-chips"]')
          ?.querySelector('[data-slot="combobox-chip"]')))
  )
    event.preventDefault();
}

/** Explicit targets take precedence; otherwise restore the element that opened the surface. */
export function useOverlayFocus(open: boolean, returnFocusRef?: RefObject<HTMLElement | null>) {
  const opener = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (open) {
      let active = document.activeElement;
      // A menu item disappears on activation; return a modal task to its stable menu trigger.
      while (active instanceof HTMLElement) {
        const menu = active.closest('[role="menu"]');
        const triggerId = menu?.getAttribute("aria-labelledby");
        const trigger = triggerId ? document.getElementById(triggerId) : null;
        if (!trigger || trigger === active || !trigger.matches('[aria-haspopup="menu"]')) break;
        active = trigger;
      }
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
