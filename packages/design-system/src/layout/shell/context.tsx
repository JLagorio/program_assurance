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
 * hover and overlays the page on a narrow viewport; the panel resizes, runs the full height of the
 * window beside the banner and the top nav, and replaces Main on compact screens; the banner
 * pushes everything down. The product owns what goes in them: the nav data, the router, the
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
/** Below `dimension.breakpoint.panel` the panel replaces Main; from it the panel is a column beside the page, as layout.css says with `theme(--breakpoint-panel)`. */
export const panelCompactQuery = () => `(width < ${tokenValue("dimension.breakpoint.panel")})`;
/** Milliseconds the flyout stays open after the pointer leaves it. */
export const PEEK_CLOSE_DELAY = 200;
/** The main area, for the focus bookkeeping that returns focus to the page. */
export const MAIN = '[data-shell-area="main"]';

export type SkipLink = { id: string; label: string; area?: string | undefined };
/** What caused the side nav to collapse or expand, the argument of SideNav's onCollapse and onExpand. */
export type SideNavTrigger =
  "toggle-button" | "shortcut" | "splitter" | "scrim" | "escape" | "hook" | "viewport";

export type ShellApi = {
  isDesktop: boolean;
  shortcut: boolean;
  sideNav: { expanded: boolean; open: boolean; peeking: boolean; width: number | null };
  panel: { width: number | null };
  expandSideNav: (trigger?: SideNavTrigger) => void;
  collapseSideNav: (trigger?: SideNavTrigger) => void;
  toggleSideNav: (trigger?: SideNavTrigger) => void;
  openSideNav: () => void;
  closeSideNav: (trigger?: SideNavTrigger) => void;
  peekSideNav: () => void;
  endPeek: (immediate?: boolean) => void;
  holdPeek: () => void;
  setSideNavWidth: (width: number | null) => void;
  setPanelWidth: (width: number | null) => void;
  setBanner: (present: boolean) => void;
  registerSkipLink: (link: SkipLink) => () => void;
  skipLinks: SkipLink[];
  /** The toggle button, so closing the overlay with Escape or the scrim returns focus to it. */
  toggle: RefObject<HTMLElement | null>;
  listeners: {
    onCollapse?: ((args: { trigger: SideNavTrigger }) => void) | undefined;
    onExpand?: ((args: { trigger: SideNavTrigger }) => void) | undefined;
  };
};

const noop = () => undefined;
/** A part rendered outside a Shell, in a matrix or a test, behaves as if the side nav were expanded on a desktop. */
const detached: ShellApi = {
  isDesktop: true,
  shortcut: false,
  sideNav: { expanded: true, open: false, peeking: false, width: null },
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
  setBanner: noop,
  registerSkipLink: () => noop,
  skipLinks: [],
  toggle: { current: null },
  listeners: {},
};

export const ShellContext = createContext<ShellApi | null>(null);
export const useShell = () => useContext(ShellContext) ?? detached;

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

/** The side nav from product code: is it showing, and open, close and toggle it. Use it inside a Shell. */
export function useSideNav() {
  const s = useShell();
  const { isDesktop, expandSideNav, openSideNav, collapseSideNav, closeSideNav, toggleSideNav } = s;
  const isExpanded = isDesktop ? s.sideNav.expanded : s.sideNav.open;
  return {
    isExpanded,
    expand: useCallback(
      () => (isDesktop ? expandSideNav("hook") : openSideNav()),
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
