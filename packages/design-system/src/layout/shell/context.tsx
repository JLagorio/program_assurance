import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  type Ref,
  type RefObject,
} from "react";

import { tokenValue } from "../../generated/tokens";

/**
 * The navigation system. Shell is the root; its areas are its immediate children in a fixed
 * order: Banner, TopNav, SideNav, Main, Aside, Panel. Routes contribute Aside and Panel through
 * stable portal destinations; their content and state belong to the route.
 * The package owns the areas and their behaviour: the side nav collapses, resizes, flies out on
 * hover and overlays the page on a narrow viewport; the panel resizes, runs the height of the
 * window under the banner beside the top nav from the large breakpoint (below the panel
 * breakpoint the side nav yields to its icon rail while it is open), and replaces Main below the
 * large breakpoint; the banner pushes everything down by its height. The product owns what goes in them: the nav data, the router, the
 * search, the actions, whatever fills the panel. Every part renders one element, forwards the
 * native props and the ref to it, and takes Base UI `render` where the element may change.
 */

/* ---------- state ---------- */

/** The side nav's minimum width while dragging. The maximum is half the viewport. */
export const SIDENAV_MIN = 200;
/** The panel's minimum width while dragging. */
export const PANEL_MIN = 240;
/** The large breakpoint, `dimension.breakpoint.lg`: the side nav is inline from here and an overlay below. Read at call time, from the tokens the page loaded. */
export const desktopQuery = () => `(width >= ${tokenValue("dimension.breakpoint.lg")})`;
/** Below `dimension.breakpoint.lg` the panel replaces Main; from it the panel is a column beside the page, as shell.css says with `theme(--breakpoint-lg)`. */
export const panelCompactQuery = () => `(width < ${tokenValue("dimension.breakpoint.lg")})`;
/** From `lg` to below `dimension.breakpoint.panel`, an open panel shows the side nav collapsed (the icon rail, or hidden), so Main keeps room beside the panel; from the panel breakpoint it stays as the reader left it. */
export const panelNarrowQuery = () =>
  `(width >= ${tokenValue("dimension.breakpoint.lg")}) and (width < ${tokenValue("dimension.breakpoint.panel")})`;
/** Milliseconds the flyout stays open after the pointer leaves it. */
export const PEEK_CLOSE_DELAY = 200;
/** The main area, for the focus bookkeeping that returns focus to the page. */
export const MAIN = '[data-shell-area="main"]';
/** The panel area, which stands in for Main where it replaces it. */
export const PANEL = '[data-shell-area="panel"]';
/** The areas that hold the page, as opposed to the navigation around it. */
const PAGE_AREAS = '[data-shell-area="main"], [data-shell-area="aside"], [data-shell-area="panel"]';

/**
 * The narrowest Main gets while the side nav and the panel are beside it: one list column
 * (`dimension.layout.list`) inside Main's desktop gutters (`space.300` each side), 388px with the
 * default tokens. The same sum is `--shell-main-min` in shell.css; the splitters stop there and the
 * CSS caps a remembered width there, so no pair of widths leaves Main without room for its content.
 */
export const mainMinWidth = (el?: Element) =>
  Number.parseFloat(tokenValue("dimension.layout.list", el)) +
  2 * Number.parseFloat(tokenValue("space.300", el));

const shown = (el: HTMLElement | null): el is HTMLElement => !!el && el.getClientRects().length > 0;

/**
 * After a page change, focus goes to the page: Main, or the panel where it replaces Main, without
 * scrolling. It stays put when it is already on a control in the page that survived the change (a
 * tab, a pager, a next-record link) or in a popup outside the shell, which `followFocusToPage`
 * takes on to the page once the popup hands focus back.
 */
export function focusPage(root: HTMLElement | null) {
  if (!root) return;
  const active = root.ownerDocument.activeElement;
  if (active && active !== root.ownerDocument.body && active.isConnected) {
    if (!root.contains(active) || active.closest(PAGE_AREAS)) return;
  }
  const target = [MAIN, PANEL]
    .map((area) => root.querySelector<HTMLElement>(area))
    .find((el) => shown(el));
  target?.focus({ preventScroll: true });
}

/** How long after a page change focus left in a popup is followed back to the page. */
const FOLLOW_FOCUS = 1000;

/**
 * Focus in a popup outside the shell when the page changes (a menu item, a command in a dialog)
 * stays there, and the popup returns it to its trigger as it closes: in the top nav, say, which
 * would start the reader from the navigation again. Follow it for a moment, so that when it comes
 * back into the shell, or is dropped on the body, it goes on to the page through `focusPage`.
 * Returns the function that stops following; with focus anywhere else it does nothing.
 */
export function followFocusToPage(root: HTMLElement | null): () => void {
  const doc = root?.ownerDocument;
  const active = doc?.activeElement;
  if (!root || !doc || !active || active === doc.body || root.contains(active)) return () => {};
  const dropped = () => !doc.activeElement || doc.activeElement === doc.body;
  let settle: ReturnType<typeof setTimeout> | undefined;
  const onFocusIn = (event: FocusEvent) => {
    if (!(event.target instanceof Node) || !root.contains(event.target)) return;
    stop();
    focusPage(root);
  };
  // A popup removed while focused leaves focus on the body; look once the removal has landed.
  const onFocusOut = (event: FocusEvent) => {
    if (event.relatedTarget) return;
    clearTimeout(settle);
    settle = setTimeout(() => {
      if (!dropped()) return;
      stop();
      focusPage(root);
    });
  };
  const timer = setTimeout(() => {
    stop();
    if (dropped()) focusPage(root);
  }, FOLLOW_FOCUS);
  function stop() {
    doc?.removeEventListener("focusin", onFocusIn, true);
    doc?.removeEventListener("focusout", onFocusOut, true);
    clearTimeout(timer);
    clearTimeout(settle);
  }
  doc.addEventListener("focusin", onFocusIn, true);
  doc.addEventListener("focusout", onFocusOut, true);
  return stop;
}

export type SkipLink = { id: string; label: string; area?: string | undefined };
/** What caused the side nav to collapse or expand, the argument of SideNav's onCollapse and onExpand. `navigation` is a destination chosen in the phone overlay, or a change of Shell's `locationKey`; `viewport` is the phone overlay closing because the window grew past the large breakpoint. */
export type SideNavTrigger =
  | "toggle-button"
  | "shortcut"
  | "splitter"
  | "scrim"
  | "escape"
  | "hook"
  | "viewport"
  | "navigation";

/** What SideNav's onCollapse and onExpand receive: the cause, and whether the change was the phone overlay's (below the large breakpoint) rather than the desktop side nav's. Keep a remembered collapsed state from the calls where `isOverlay` is false. */
export type SideNavChange = { trigger: SideNavTrigger; isOverlay: boolean };

export type ShellApi = {
  isDesktop: boolean;
  shortcut: boolean;
  collapsedSideNav: "hidden" | "icons";
  /**
   * `expanded` is what the desktop side nav shows now: the reader's preference, unless an open
   * panel between `lg` and the panel breakpoint shows it collapsed (`yielded`). `modal` is the
   * phone overlay open, while the rest of the shell is inert.
   */
  sideNav: {
    expanded: boolean;
    open: boolean;
    peeking: boolean;
    width: number | null;
    yielded: boolean;
    modal: boolean;
  };
  panel: { width: number | null };
  expandSideNav: (trigger?: SideNavTrigger) => void;
  collapseSideNav: (trigger?: SideNavTrigger) => void;
  toggleSideNav: (trigger?: SideNavTrigger) => void;
  openSideNav: (trigger?: SideNavTrigger) => void;
  closeSideNav: (trigger?: SideNavTrigger) => void;
  peekSideNav: () => void;
  endPeek: (immediate?: boolean) => void;
  holdPeek: () => void;
  setSideNavWidth: (width: number | null) => void;
  setPanelWidth: (width: number | null) => void;
  /** The width an area takes while the reader has not resized it: a `defaultWidth`, never remembered. `null` when its part unmounts. */
  setSideNavDefaultWidth: (width: number | null) => void;
  setPanelDefaultWidth: (width: number | null) => void;
  setBanner: (present: boolean) => void;
  /** The banner area's measured height, so the top nav, the side nav and the panel sit under a banner that wraps. */
  setBannerHeight: (height: number | null) => void;
  registerSkipLink: (link: SkipLink) => () => void;
  skipLinks: SkipLink[];
  /** Moves focus to the page after a destination is chosen; see `focusPage`. */
  focusPage: () => void;
  /** The toggle button, so closing the overlay with Escape or the scrim returns focus to it. */
  toggle: RefObject<HTMLElement | null>;
  listeners: {
    onCollapse?: ((args: SideNavChange) => void) | undefined;
    onExpand?: ((args: SideNavChange) => void) | undefined;
  };
};

const noop = () => undefined;
/** A part rendered outside a Shell, in a matrix or a test, behaves as if the side nav were expanded on a desktop. */
const detached: ShellApi = {
  isDesktop: true,
  shortcut: false,
  collapsedSideNav: "hidden",
  sideNav: {
    expanded: true,
    open: false,
    peeking: false,
    width: null,
    yielded: false,
    modal: false,
  },
  panel: { width: null },
  expandSideNav: noop,
  collapseSideNav: noop,
  toggleSideNav: noop,
  openSideNav: noop,
  closeSideNav: noop,
  peekSideNav: noop,
  endPeek: noop,
  holdPeek: noop,
  setSideNavWidth: noop,
  setPanelWidth: noop,
  setSideNavDefaultWidth: noop,
  setPanelDefaultWidth: noop,
  setBanner: noop,
  setBannerHeight: noop,
  registerSkipLink: () => noop,
  skipLinks: [],
  focusPage: noop,
  toggle: { current: null },
  listeners: {},
};

export const ShellContext = createContext<ShellApi | null>(null);
export const useShell = () => useContext(ShellContext) ?? detached;

/** Icon presentation is desktop-only; an open overlay always shows full labels. */
export function useSideNavRail() {
  const shell = useShell();
  return (
    shell.isDesktop &&
    shell.collapsedSideNav === "icons" &&
    !shell.sideNav.expanded &&
    !shell.sideNav.open
  );
}

/** The part's `data-slot`, spread into a Base UI props object (a literal key would fail the excess-property check). */
export const slot = (name: string) => ({ "data-slot": name });

/** One callback ref that feeds every ref given: the consumer's and the part's own. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

/**
 * The side nav from product code: is it showing, is it the phone overlay (below the large
 * breakpoint, so products need not repeat the breakpoint), and open, close and toggle it. Use it
 * inside a Shell.
 */
export function useSideNav() {
  const s = useShell();
  const { isDesktop, expandSideNav, openSideNav, collapseSideNav, closeSideNav, toggleSideNav } = s;
  const isExpanded = isDesktop ? s.sideNav.expanded : s.sideNav.open;
  return {
    isExpanded,
    /** Below the large breakpoint the side nav is an overlay over the page; from it, a column. */
    isOverlay: !isDesktop,
    expand: useCallback(
      () => (isDesktop ? expandSideNav("hook") : openSideNav("hook")),
      [isDesktop, expandSideNav, openSideNav],
    ),
    collapse: useCallback(
      () => (isDesktop ? collapseSideNav("hook") : closeSideNav("hook")),
      [isDesktop, collapseSideNav, closeSideNav],
    ),
    toggle: useCallback(() => toggleSideNav("hook"), [toggleSideNav]),
  };
}

export function useSkipLink(idProp: string | undefined, label: string, area?: string) {
  const generated = useId();
  const id = idProp ?? `shell-${generated.replace(/[^\w-]/g, "")}`;
  const { registerSkipLink } = useShell();
  useEffect(() => registerSkipLink({ id, label, area }), [registerSkipLink, id, label, area]);
  return id;
}
