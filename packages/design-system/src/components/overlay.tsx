import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type Ref,
  type RefObject,
} from "react";

import { token } from "../generated/tokens";
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

/** The window less a `space.200` gutter on each side: the room a centred dialog keeps. */
export const dialogRoom = (extent: "100%" | "100dvh") =>
  `calc(${extent} - 2 * ${token("space.200")})`;

/**
 * A centred popup's frame, Dialog's and AlertDialog's: as wide as the window leaves beside the
 * gutter, up to its width step, and never taller than the window less the gutter, so it scrolls
 * instead of running past the edge.
 */
export const dialogFrame = {
  width: dialogRoom("100%"),
  maxHeight: dialogRoom("100dvh"),
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

/**
 * The first element in `root` the keyboard reaches, leaving out `skip`: a control with a negative
 * `tabIndex`, one under `inert` or `hidden`, one that is not rendered, an unchecked radio whose
 * group has a checked one, and Base UI's focus guards are passed over.
 */
export function firstTabbable(root: HTMLElement, skip?: Element | null) {
  for (const element of root.querySelectorAll<HTMLElement>(tabbable)) {
    if (element === skip || element.tabIndex < 0) continue;
    if (element.closest("[inert], [hidden], [data-base-ui-focus-guard]")) continue;
    if (typeof element.checkVisibility === "function" && !element.checkVisibility()) continue;
    if (
      element instanceof HTMLInputElement &&
      element.type === "radio" &&
      !element.checked &&
      element.name &&
      root.querySelector(`input[type="radio"][name="${CSS.escape(element.name)}"]:checked`)
    )
      continue;
    return element;
  }
  return null;
}

/**
 * A blanketed overlay's default `initialFocus` when its close button comes first in the DOM (so Tab
 * meets it where it is drawn, at the top end): the first control after it, as Base UI would choose
 * without the button, or the popup on a touch screen, as Base UI does. With nothing else to focus,
 * the close button.
 */
export function focusPastClose(close: RefObject<HTMLElement | null>) {
  return (interaction: string) => {
    const button = close.current;
    const popup = button?.parentElement;
    if (!button || !popup) return true;
    if (interaction === "touch") return popup;
    return firstTabbable(popup, button) ?? button;
  };
}

/**
 * The element that had focus when a controlled overlay opened, read while the overlay renders
 * open for the first time, before a field inside it can take focus. Base UI returns focus to the
 * element that had it when its popup mounted, so a field with `autoFocus` becomes that element and
 * focus falls to the page when it goes away; the overlays return to this one instead, while it is
 * still on the page and can take focus. `finalFocus` still wins.
 */
export function useOpener(open: boolean | undefined) {
  const opener = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current && typeof document !== "undefined") {
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }
  wasOpen.current = Boolean(open);
  return opener;
}

/**
 * What a blanketed overlay's root tells its content: the opener it recorded, and whether a press on
 * the blanket leaves the overlay open (pending, `disablePointerDismissal`, or an AlertDialog).
 */
export type OverlayRoot = { opener: RefObject<HTMLElement | null>; holdsBlanket: boolean };
export const OverlayRootContext = createContext<OverlayRoot | null>(null);

/** Returns focus to the recorded opener while it is connected and enabled, else Base UI's default. */
export function useOpenerFocus() {
  const root = useContext(OverlayRootContext);
  return () => {
    const element = root?.opener.current;
    if (!element || !element.isConnected || element.matches(":disabled")) return true;
    return element;
  };
}

/**
 * The blanket's `onMouseDown` while a press on it leaves the overlay open: the press would take
 * focus from the control the reader is on and drop it to the page. Base UI still hears the press.
 */
export function useBlanketPress() {
  const root = useContext(OverlayRootContext);
  return root?.holdsBlanket
    ? (event: MouseEvent) => {
        event.preventDefault();
      }
    : undefined;
}

/** The overlay scrollers a sticky footer sticks to. */
const footerScroller =
  '[data-slot="dialog-content"], [data-slot="alert-dialog-content"], [data-slot="sheet-content"], [data-slot="drawer-content"]';

/**
 * A sticky footer's ref, joined to the caller's. In a window under 30rem tall the whole popup
 * scrolls under its footer, so the popup keeps the footer's measured height (two rows when its
 * buttons wrap) as its `scroll-padding-block-end`: a control that takes focus scrolls clear of the
 * footer instead of under it. Where the body is the scroller, the popup has nothing to scroll and
 * the padding does nothing.
 */
export function useFooterClearance<Element extends HTMLElement>(
  theirs: Ref<Element> | undefined,
): (footer: Element | null) => () => void {
  return useCallback(
    (footer: Element | null): (() => void) => {
      const release = joinRef(theirs, footer);
      const popup = footer?.parentElement?.closest<HTMLElement>(footerScroller);
      if (!footer || !popup || typeof ResizeObserver === "undefined") return release;
      const measure = () => {
        popup.style.scrollPaddingBlockEnd = `${footer.offsetHeight}px`;
      };
      measure();
      const observer = new ResizeObserver(measure);
      observer.observe(footer);
      return () => {
        observer.disconnect();
        popup.style.scrollPaddingBlockEnd = "";
        release();
      };
    },
    [theirs],
  );
}

/** Sets a caller's ref, and returns what undoes it, as a React 19 ref cleanup would. */
function joinRef<Element>(theirs: Ref<Element> | undefined, element: Element | null): () => void {
  if (typeof theirs === "function") {
    const cleanup = theirs(element);
    return typeof cleanup === "function"
      ? () => {
          cleanup();
        }
      : () => {
          theirs(null);
        };
  }
  if (theirs) theirs.current = element;
  return () => {
    if (theirs) theirs.current = null;
  };
}

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
