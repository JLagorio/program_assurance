import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  type CSSProperties,
} from "react";

import { useLedgerLocale } from "../lib/locale";
import { Button, IconButton, type ButtonProps } from "./button";

/* Package-internal pieces the overlay families share: Dialog, Sheet, AlertDialog, Drawer, Popover
   and HoverCard. Nothing here is exported from the package. */

/**
 * The overlay surface, recorded as the current one, as Card records the raised surface: a child
 * that matches the surface it sits on (`bg-surface-current`: a sticky table header, a pinned cell,
 * a preview eye, a scroll arrow) paints the overlay's colour, not the page's.
 */
export const overlaySurface = {
  "--ds-utility-elevation-surface-current": "var(--ds-elevation-surface-overlay)",
} as CSSProperties;

type StyleProp<State> = CSSProperties | ((state: State) => CSSProperties | undefined) | undefined;

/** A part's own style under the caller's, which wins, for a static style or a Base UI state function. */
export function withStyle<State>(base: CSSProperties, style: StyleProp<State>) {
  return typeof style === "function"
    ? (state: State) => ({ ...base, ...style(state) })
    : { ...base, ...style };
}

/**
 * Whether the surrounding Dialog, Sheet or AlertDialog is pending: a save or another command is in
 * flight, so every dismissal is cancelled, the close controls are disabled and the popup is busy.
 */
export const OverlayPendingContext = createContext(false);

export function useOverlayPending() {
  return useContext(OverlayPendingContext);
}

/** The reasons a Base UI root reports; a pending root cancels every one but the caller's own. */
type ChangeDetails = { reason: string; cancel: () => void };

/**
 * Wraps a root's `onOpenChange` for the pending lock: while pending, a request to close (Escape,
 * an outside press, a close control, focus leaving a non-modal popup) is cancelled before the
 * caller hears of it. An imperative close through `actionsRef` still goes through, as a controlled
 * `open={false}` does: the caller that set `pending` is the one that ends it.
 */
export function pendingOpenChange<Details extends ChangeDetails>(
  pending: boolean,
  onOpenChange: ((open: boolean, details: Details) => void) | undefined,
) {
  return (open: boolean, details: Details) => {
    if (!open && pending && details.reason !== "imperative-action") {
      details.cancel();
      return;
    }
    onOpenChange?.(open, details);
  };
}

/**
 * A close control's `render` while its overlay is pending. A kit Button or IconButton stays
 * focusable as it is disabled (`aria-disabled`), as the built-in close button does, so a reader
 * whose focus is on Cancel when the command starts (an AlertDialog focuses Cancel first; a tap on
 * iOS does not move focus) is not dropped to the page. Any other element, and every control outside
 * pending, is returned as it is; a Button that sets `focusableWhenDisabled` itself keeps its choice.
 */
export function pendingCloseRender<Render>(render: Render, pending: boolean): Render {
  if (!pending || !isValidElement<ButtonProps>(render)) return render;
  if (render.type !== Button && render.type !== IconButton) return render;
  if (render.props.focusableWhenDisabled !== undefined) return render;
  return cloneElement(render, { focusableWhenDisabled: true }) as Render;
}

/** The body parts' `data-slot`, spread into `mergeProps` so the part's identity wins. */
export const bodySlot = (name: string) => ({ "data-slot": name });

const tabbable =
  'a[href], area[href], button:not(:disabled), input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

/** The attributes that make a control reachable or not, watched below the body. */
const reachability = ["disabled", "tabindex", "href", "contenteditable", "hidden", "inert"];

/**
 * For an overlay body: while it overflows and holds nothing the keyboard can reach, it is a tab stop
 * named "Content, scrolls", so the keyboard can scroll text a pointer can. A body with a field, a
 * button or a link needs no stop of its own; focusing those scrolls it. The attributes are set on
 * the element directly, as Table does for its frame, so a rerender does not fight them. A caller's
 * own `tabIndex` turns this off; a caller's own `role`, `aria-label` or `aria-labelledby` is kept,
 * and only what the hook added is taken away again.
 */
export function useReadOnlyScroller<Element extends HTMLElement>() {
  const ref = useRef<Element>(null);
  // What the hook added, kept across a change of locale so the next run can update or undo it.
  const added = useRef({ tabIndex: false, role: false, label: false });
  const { t } = useLedgerLocale();
  const label = t("contentScrolls");
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const own = added.current;
    if (own.label) element.setAttribute("aria-label", label);
    const track = () => {
      const overflows = element.scrollHeight > element.clientHeight + 1;
      const needed = overflows && !element.querySelector(tabbable);
      if (needed && !own.tabIndex) {
        if (element.hasAttribute("tabindex")) return;
        own.tabIndex = true;
        element.tabIndex = 0;
        if (!element.hasAttribute("role")) {
          own.role = true;
          element.setAttribute("role", "group");
        }
        if (!element.hasAttribute("aria-label") && !element.hasAttribute("aria-labelledby")) {
          own.label = true;
          element.setAttribute("aria-label", label);
        }
      } else if (!needed && own.tabIndex) {
        element.removeAttribute("tabindex");
        if (own.role) element.removeAttribute("role");
        if (own.label) element.removeAttribute("aria-label");
        own.tabIndex = own.role = own.label = false;
      }
    };
    // The body's own box, and its children's: content that grows without a DOM change (an image
    // that loads, a panel that opens) changes a child's size, not the body's.
    const resize = new ResizeObserver(track);
    const sized = new Set<globalThis.Element>();
    const observeChildren = () => {
      for (const child of sized) {
        if (child.parentElement !== element) {
          resize.unobserve(child);
          sized.delete(child);
        }
      }
      for (const child of element.children) {
        if (!sized.has(child)) {
          resize.observe(child);
          sized.add(child);
        }
      }
    };
    resize.observe(element);
    observeChildren();
    const mutation = new MutationObserver(() => {
      observeChildren();
      track();
    });
    // Content, and whether it can be reached: a FieldSet that disables its fields while pending and
    // enables them again is a change of reach, not of content.
    mutation.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: reachability,
    });
    track();
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, [label]);
  return ref;
}
