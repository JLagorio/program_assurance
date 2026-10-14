import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";

import { CollapsibleContent, CollapsibleHeader } from "../../components/collapsible";
import { TooltipProvider } from "../../components/tooltip";
import { token, tokenValue } from "../../generated/tokens";
import { announce, Announcer } from "../../lib/announce";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { HeadingLevelProvider } from "../../primitives/heading-level";
import {
  AreaPortal,
  AsideDisclosureContext,
  AsideLayoutContext,
  AsideRailContext,
  SlotsContext,
  type AsideDisplay,
} from "../slots";
import { applyShell, readShell, SHELL_STORAGE_KEY, writeShell } from "../storage";
import {
  asideQuery,
  desktopQuery,
  focusPage,
  followFocusToPage,
  MAIN,
  mainMinWidth,
  mergeRefs,
  PANEL_MIN,
  panelNarrowQuery,
  PEEK_CLOSE_DELAY,
  ShellContext,
  SIDENAV_MIN,
  useShell,
  useSkipLink,
  type ShellApi,
  type SideNavTrigger,
  type SkipLink,
} from "./context";

/** Milliseconds after a location change before the page is announced, so a router that sets `document.title` after rendering has set it. */
const PAGE_SETTLE = 150;

/** The page's name after a change: the document's title, else the page's first h1. */
const currentPageTitle = (root: HTMLElement | null) =>
  root?.ownerDocument.title.trim() ||
  root?.querySelector(`${MAIN} h1`)?.textContent?.trim() ||
  null;

/** A media query's matches, followed as the window changes. */
function useMediaQuery(query: () => string, initial: boolean) {
  const [matches, setMatches] = useState(initial);
  useEffect(() => {
    const mq = window.matchMedia(query());
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return matches;
}

/** A media query's matches from before the first paint, followed as the window changes; false on the server. */
function useMediaQueryBeforePaint(query: () => string) {
  const [matches, setMatches] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia(query());
    const sync = () => setMatches(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return matches;
}

/* ---------- root ---------- */

export type ShellProps = ComponentProps<"div"> & {
  /** Collapsed on first render on a desktop. Keep it current from SideNav's onCollapse and onExpand, from the calls whose `isOverlay` is false. */
  defaultSideNavCollapsed?: boolean | undefined;
  /** Desktop collapse behavior: hide the navigation, or keep destination icons and the profile avatar in a compact rail. */
  collapsedSideNav?: "hidden" | "icons" | undefined;
  /** Ctrl+[ toggles the side nav. Off by default; ignored while a dialog is open. */
  sideNavShortcut?: boolean | undefined;
  /** Remember the collapsed state and the dragged widths in this browser: `true` for the default key, or a key of your own. Put `shellScript` in the document head so the first paint honours it. Every Shell on the origin that passes `true` shares one key, `ledger.shell`; give a second Shell with another `collapsedSideNav` a key of its own. */
  persist?: string | boolean | undefined;
  /**
   * The page Main shows, from the router: its pathname or a route id, for the page that has
   * rendered (a router's resolved location, not a pending one). When it changes, the shell treats
   * it as a new page at every width: it closes the phone side-nav overlay or the desktop flyout,
   * moves focus to Main without scrolling (unless focus is on a control in the page that survived
   * the change; focus in a menu or a dialog follows once the popup hands it back), and announces
   * the page's title. Pass a key that changes with the
   * page, not with a tab or a filter that writes to the URL. Without it the shell does none of
   * this.
   */
  locationKey?: string | undefined;
  /** What the shell announces after `locationKey` changes. By default `document.title`, else Main's first h1, read once the new page has rendered; return null to announce nothing. */
  getPageTitle?: ((locationKey: string) => string | null | undefined) | undefined;
};

export function ShellRoot({
  children,
  defaultSideNavCollapsed = false,
  collapsedSideNav = "hidden",
  sideNavShortcut = false,
  persist,
  locationKey,
  getPageTitle,
  className,
  style,
  ref,
  onFocusCapture,
  onPointerDownCapture,
  ...props
}: ShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery(desktopQuery, true);
  // The reader's desktop preference, which `persist` remembers. What shows is `shownExpanded`.
  const [expanded, setExpanded] = useState(!defaultSideNavCollapsed);
  const [open, setOpen] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [sideNavWidth, setSideNavWidth] = useState<number | null>(null);
  const [sideNavDefault, setSideNavDefault] = useState<number | null>(null);
  const [sideNavMotion, setSideNavMotion] = useState(false);
  const [panelWidth, setPanelWidth] = useState<number | null>(null);
  const [panelDefault, setPanelDefault] = useState<number | null>(null);
  const [hasBanner, setBanner] = useState(false);
  const [bannerHeight, setBannerHeight] = useState<number | null>(null);
  const [skipLinks, setSkipLinks] = useState<SkipLink[]>([]);
  const [asideSlot, setAsideSlot] = useState<HTMLDivElement | null>(null);
  const [panelSlot, setPanelSlot] = useState<HTMLDivElement | null>(null);
  const listeners = useRef<ShellApi["listeners"]>({});
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (peekTimer.current) clearTimeout(peekTimer.current);
    },
    [],
  );
  const toggle = useRef<HTMLElement | null>(null);

  // From `lg` to below the panel breakpoint an open panel shows the side nav collapsed, the icon
  // rail or hidden, so Main keeps room beside it; closing the panel shows it as the reader left it.
  // The reader's preference is not touched, and a reader who expands it meanwhile keeps it
  // expanded until the panel closes.
  const panelNarrow = useMediaQuery(panelNarrowQuery, false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [navOverride, setNavOverride] = useState(false);
  useLayoutEffect(() => {
    if (!panelSlot) return;
    const sync = () => {
      const present = panelSlot.querySelector(':scope > [data-shell-area="panel"]') !== null;
      setPanelOpen(present);
      if (!present) setNavOverride(false);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(panelSlot, { childList: true });
    return () => observer.disconnect();
  }, [panelSlot]);
  const yielded = isDesktop && panelNarrow && panelOpen && !navOverride;
  const shownExpanded = expanded && !yielded;
  // The phone overlay is modal: while it is open everything else in the shell is inert.
  const modal = !isDesktop && open;
  // A panel that folds the side nav away, or gives it back, moves it on the same curve as a toggle.
  const wasYielded = useRef(yielded);
  useEffect(() => {
    if (wasYielded.current === yielded) return;
    wasYielded.current = yielded;
    setSideNavMotion(true);
  }, [yielded]);

  // The latest state, for the callbacks below: each reports a change only when there is one.
  const state = useRef({ isDesktop, open, expanded, shownExpanded, yielded, getPageTitle });
  state.current = { isDesktop, open, expanded, shownExpanded, yielded, getPageTitle };

  // What the browser remembers: read once after mount, then write every change.
  const storageKey = persist === true ? SHELL_STORAGE_KEY : persist || null;
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (!storageKey) return;
    const stored = readShell(storageKey);
    if (stored?.collapsed !== undefined) setExpanded(!stored.collapsed);
    // Keep the preferred desktop widths. CSS constrains the current layout without
    // replacing the saved preferences when this shell mounts on a smaller screen.
    if (stored?.sideNavWidth) setSideNavWidth(Math.max(stored.sideNavWidth, SIDENAV_MIN));
    if (stored?.panelWidth) setPanelWidth(Math.max(stored.panelWidth, PANEL_MIN));
    setRestored(true);
  }, [storageKey]);
  useEffect(() => {
    if (!storageKey || !restored) return;
    // The preference, not what a panel shows for now; a `defaultWidth` is never stored.
    const value = {
      collapsed: !expanded,
      sideNavWidth: sideNavWidth ?? undefined,
      panelWidth: panelWidth ?? undefined,
    };
    writeShell(storageKey, value);
    applyShell(value);
  }, [storageKey, restored, expanded, sideNavWidth, panelWidth]);

  // Where focus goes once the overlay has closed and the rest of the shell accepts input again.
  const pendingFocus = useRef<"toggle" | "page" | null>(null);
  useLayoutEffect(() => {
    if (open) return;
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target === "toggle") toggle.current?.focus();
    else if (target === "page") focusPage(rootRef.current);
  }, [open]);

  // An overlay does not survive a change of viewport class.
  const wasDesktop = useRef(isDesktop);
  useEffect(() => {
    if (wasDesktop.current === isDesktop) return;
    const overlayWasOpen = !wasDesktop.current && state.current.open;
    wasDesktop.current = isDesktop;
    setOpen(false);
    setPeeking(false);
    setSideNavMotion(false);
    if (overlayWasOpen) listeners.current.onCollapse?.({ trigger: "viewport", isOverlay: true });
  }, [isDesktop]);

  const closeSideNav = useCallback((trigger: SideNavTrigger = "hook") => {
    const { isDesktop: desktop, open: wasOpen } = state.current;
    setOpen(false);
    setPeeking(false);
    if (desktop || !wasOpen) return;
    listeners.current.onCollapse?.({ trigger, isOverlay: true });
    // A destination chosen in the overlay hands focus to the page. Escape and the scrim leave focus
    // nowhere, and so does any other close from inside the overlay, which turns inert as it
    // closes: focus goes back to the button that opened it, once the top nav accepts input again.
    if (trigger === "navigation") {
      pendingFocus.current = "page";
      return;
    }
    const focused = document.activeElement;
    if (
      trigger === "escape" ||
      trigger === "scrim" ||
      !focused ||
      focused === document.body ||
      focused.closest('[data-shell-area="sidenav"]')
    )
      pendingFocus.current = "toggle";
  }, []);
  const openSideNav = useCallback((trigger: SideNavTrigger = "toggle-button") => {
    const { isDesktop: desktop, open: wasOpen } = state.current;
    setOpen(true);
    setPeeking(false);
    if (!desktop && !wasOpen) listeners.current.onExpand?.({ trigger, isOverlay: true });
  }, []);
  const expandSideNav = useCallback((trigger: SideNavTrigger = "hook") => {
    const { shownExpanded: wasShown, yielded: wasYielded } = state.current;
    setSideNavMotion(true);
    setOpen(false);
    setPeeking(false);
    setExpanded(true);
    // Expanded while a panel shows it collapsed: the reader's choice holds until the panel closes.
    if (wasYielded) setNavOverride(true);
    if (!wasShown) listeners.current.onExpand?.({ trigger, isOverlay: false });
  }, []);
  const collapseSideNav = useCallback(
    (trigger: SideNavTrigger = "hook") => {
      // The preference, not what shows: a collapse while a panel shows the side nav collapsed
      // still changes what `persist` stores, so it is reported.
      const { expanded: wasExpanded } = state.current;
      setSideNavMotion(true);
      const focused = document.activeElement;
      // A shortcut or resizer can collapse navigation while focus is in content about to hide.
      // Keep focus on visible rail links; return hidden group/header/resize controls to the toggle.
      if (
        focused?.closest('[data-shell-area="sidenav"]') &&
        (collapsedSideNav === "hidden" ||
          focused.closest(
            '[data-slot="shell-sidenav-level"], [data-slot="shell-sidenav-header"], [data-slot="shell-splitter"]',
          ))
      ) {
        toggle.current?.focus();
      }
      setExpanded(false);
      setNavOverride(false);
      if (wasExpanded) listeners.current.onCollapse?.({ trigger, isOverlay: false });
    },
    [collapsedSideNav],
  );
  // A splitter drag follows the pointer on the root element's own style and keeps the width once,
  // when the pointer lets go: every pointer move would otherwise re-render each part that reads the
  // shell, write the browser's storage and restyle the document. A width set any other way (a key,
  // a default, a reset) is kept at once. The grid's columns animate when the panel opens or closes
  // (shell.css); while a drag moves them they follow the pointer instead of easing behind it.
  const drag = useRef<{ sideNav?: number; panel?: number; transition?: string } | null>(null);
  const liveWidth = useCallback((area: "sideNav" | "panel", width: number | null) => {
    const root = rootRef.current;
    const current = drag.current;
    if (!current || !root || width === null) return false;
    if (current.transition === undefined) {
      current.transition = root.style.transition;
      root.style.transition = "none";
    }
    current[area] = width;
    root.style.setProperty(
      area === "sideNav" ? "--shell-sidenav-width" : "--shell-panel-width",
      `${width}px`,
    );
    return true;
  }, []);
  const startDrag = useCallback(() => {
    if (drag.current) return;
    drag.current = {};
    const doc = rootRef.current?.ownerDocument ?? document;
    // On the document, so the splitter has handled the release (or put the width back after a
    // cancelled gesture) first, and a release outside the shell still ends the drag.
    const end = () => {
      doc.removeEventListener("pointerup", end);
      doc.removeEventListener("pointercancel", end);
      const dragged = drag.current;
      drag.current = null;
      const root = rootRef.current;
      if (root && dragged?.transition !== undefined) {
        // Style the last width without a transition, then give the columns theirs back.
        void getComputedStyle(root).transitionProperty;
        root.style.transition = dragged.transition;
      }
      if (dragged?.sideNav !== undefined) setSideNavWidth(dragged.sideNav);
      if (dragged?.panel !== undefined) setPanelWidth(dragged.panel);
    };
    doc.addEventListener("pointerup", end);
    doc.addEventListener("pointercancel", end);
  }, []);
  // A drag follows the pointer immediately. Only explicit expand/collapse changes animate;
  // restoring a saved width or crossing a breakpoint must not animate the initial layout.
  const resizeSideNav = useCallback(
    (width: number | null) => {
      setSideNavMotion(false);
      if (!liveWidth("sideNav", width)) setSideNavWidth(width);
    },
    [liveWidth],
  );
  const resizePanel = useCallback(
    (width: number | null) => {
      if (!liveWidth("panel", width)) setPanelWidth(width);
    },
    [liveWidth],
  );
  const toggleSideNav = useCallback(
    (trigger: SideNavTrigger = "hook") => {
      const { isDesktop: desktop, open: isOpen, shownExpanded: shown } = state.current;
      if (desktop) (shown ? collapseSideNav : expandSideNav)(trigger);
      else if (isOpen) closeSideNav(trigger);
      else openSideNav(trigger);
    },
    [collapseSideNav, expandSideNav, closeSideNav, openSideNav],
  );

  const holdPeek = useCallback(() => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    peekTimer.current = null;
  }, []);
  const peekSideNav = useCallback(() => {
    holdPeek();
    if (isDesktop && !shownExpanded && collapsedSideNav === "hidden") {
      setOpen(true);
      setPeeking(true);
    }
  }, [holdPeek, isDesktop, shownExpanded, collapsedSideNav]);
  const endPeek = useCallback(
    (immediate = false) => {
      holdPeek();
      const close = () => {
        setPeeking((was) => {
          if (was) setOpen(false);
          return false;
        });
      };
      if (immediate) close();
      else peekTimer.current = setTimeout(close, PEEK_CLOSE_DELAY);
    },
    [holdPeek],
  );

  useEffect(() => {
    if (!sideNavShortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey && !e.metaKey && !e.altKey && e.key === "[")) return;
      // Base UI marks an open popup with data-open.
      if (document.querySelector('[role="dialog"][data-open], [role="alertdialog"][data-open]'))
        return;
      e.preventDefault();
      toggleSideNav("shortcut");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sideNavShortcut, toggleSideNav]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // A menu opened from inside the side nav takes its own Escape and stays in the side nav, and
      // so does a dialog it opens: anything that portals out of the shell closes first.
      const target = e.target;
      if (
        target instanceof Element &&
        (target.closest('[data-slot$="-portal"]') ||
          (target !== document.body &&
            target !== document.documentElement &&
            rootRef.current &&
            !rootRef.current.contains(target)))
      )
        return;
      closeSideNav("escape");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeSideNav]);

  const registerSkipLink = useCallback((link: SkipLink) => {
    setSkipLinks((links) => [...links.filter((l) => l.id !== link.id), link]);
    return () => setSkipLinks((links) => links.filter((l) => l.id !== link.id));
  }, []);

  const focusThePage = useCallback(() => focusPage(rootRef.current), []);

  // The root's width, for the CSS that keeps Main at its minimum beside the side nav and the panel:
  // 100vw would count a classic scrollbar as room. Set on the element, so a resize re-renders nothing.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const update = () => root.style.setProperty("--shell-width", `${root.clientWidth}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // Whether the side nav, at the width it shows, leaves Main its minimum with the aside beside it:
  // from `lg` below the aside breakpoint, shell.css puts the aside beside Main while it does
  // (VW2-14). The side nav's width is the one the reader dragged, the browser remembered, a
  // default or the token, not the capped width the layout draws, which the aside's own column
  // narrows. A collapsed side nav, the icon rail or hidden, always leaves the room.
  const [asideFits, setAsideFits] = useState(true);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      if (!shownExpanded) return setAsideFits(true);
      const width = root.clientWidth;
      const preferred = Number.parseFloat(
        getComputedStyle(root).getPropertyValue("--shell-sidenav-width"),
      );
      const sideNav = Math.min(Number.isFinite(preferred) ? preferred : 0, width / 2);
      const aside =
        Number.parseFloat(tokenValue("dimension.layout.rail", root)) +
        Number.parseFloat(tokenValue("space.300", root));
      setAsideFits(width - sideNav - aside >= mainMinWidth(root));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [shownExpanded, sideNavWidth, sideNavDefault]);

  // A new page: close the overlay or the flyout, move focus to the page, then say where the reader is.
  const previousLocation = useRef(locationKey);
  useEffect(() => {
    const previous = previousLocation.current;
    previousLocation.current = locationKey;
    if (previous === locationKey || previous === undefined || locationKey === undefined) return;
    const { isDesktop: desktop, open: overlayOpen } = state.current;
    const overlay = overlayOpen && !desktop;
    if (overlayOpen) {
      setOpen(false);
      setPeeking(false);
      if (overlay) {
        // Main is inert until the overlay has closed; focus goes there once it has.
        pendingFocus.current = "page";
        listeners.current.onCollapse?.({ trigger: "navigation", isOverlay: true });
      }
    }
    if (!overlay) focusPage(rootRef.current);
    // Focus left in a menu or a dialog goes on to the page once the popup hands it back.
    const stopFollowing = followFocusToPage(rootRef.current);
    const timer = setTimeout(() => {
      const title = state.current.getPageTitle
        ? state.current.getPageTitle(locationKey)
        : currentPageTitle(rootRef.current);
      if (title) announce(title);
    }, PAGE_SETTLE);
    return () => {
      clearTimeout(timer);
      stopFollowing();
    };
  }, [locationKey]);

  // How the Aside shows (VW3-22). From the aside breakpoint it is the rail, beside Main or after
  // it, as before. Below it, the rail where shell.css puts it beside Main (from `lg`, no panel
  // open, and the side nav leaving Main its minimum); elsewhere a Details disclosure, folded, where
  // the route rendered it in the page, so a record's state is one tap from the top. Read before the
  // first paint, so a phone never shows the rail for a frame.
  const largeNow = useMediaQueryBeforePaint(desktopQuery);
  const asideWide = useMediaQueryBeforePaint(asideQuery);
  const asideDisplay: AsideDisplay =
    asideWide || (largeNow && !panelOpen && asideFits) ? "rail" : "disclosure";
  // The Aside's content renders into one node of the kit's own, which moves between the shell's
  // aside slot and the place the route rendered the Aside (its marker), so a change of display
  // moves the content instead of mounting it again: a draft in an Editable survives a resize or a
  // panel opening. Neither container has React children of its own, so React never meets the node.
  const [asideHost, setAsideHost] = useState<HTMLDivElement | null>(null);
  const [asideMarker, setAsideMarker] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!asideSlot) return;
    // In the document before the content renders into it, so what measures itself on mount does.
    const host = document.createElement("div");
    host.setAttribute("data-shell-aside-host", "");
    asideSlot.append(host);
    setAsideHost(host);
    return () => host.remove();
  }, [asideSlot]);
  useLayoutEffect(() => {
    if (!asideHost || !asideSlot) return;
    const target = asideDisplay === "disclosure" && asideMarker ? asideMarker : asideSlot;
    if (asideHost.parentNode === target) return;
    // Moving the node takes focus from a control inside it; it goes back to that control, which
    // shows in either display (the Aside opens its disclosure around focus).
    const active = asideHost.ownerDocument.activeElement;
    const focused = active instanceof HTMLElement && asideHost.contains(active) ? active : null;
    target.append(asideHost);
    if (focused && focused.ownerDocument.activeElement !== focused) {
      focused.focus({ preventScroll: true });
    }
  }, [asideHost, asideSlot, asideMarker, asideDisplay]);
  // A marker leaving the page (its route unmounting) first hands the node back to the slot, before
  // React removes the route's elements and the node with them: the node never leaves the document,
  // so an Aside that mounts in the same commit (the next record's) renders into it in the page and
  // measures itself there. Stable, so a marker's ref never detaches and attaches again for it.
  const asideHome = useRef<{ host: HTMLDivElement | null; slot: HTMLDivElement | null }>({
    host: null,
    slot: null,
  });
  useLayoutEffect(() => {
    asideHome.current = { host: asideHost, slot: asideSlot };
  }, [asideHost, asideSlot]);
  const releaseAsideMarker = useCallback((node: HTMLElement) => {
    const { host, slot } = asideHome.current;
    if (host && slot && host.parentNode === node) slot.append(host);
    setAsideMarker((current) => (current === node ? null : current));
  }, []);

  const opener = useRef<HTMLElement | null>(null);
  const slots = useMemo(
    () => ({
      aside: asideHost,
      panel: panelSlot,
      opener,
      asideDisplay,
      setAsideMarker,
      releaseAsideMarker,
    }),
    [asideHost, panelSlot, asideDisplay, releaseAsideMarker],
  );

  const api = useMemo<ShellApi>(
    () => ({
      isDesktop,
      shortcut: sideNavShortcut,
      collapsedSideNav,
      sideNav: { expanded: shownExpanded, open, peeking, width: sideNavWidth, yielded, modal },
      panel: { width: panelWidth },
      expandSideNav,
      collapseSideNav,
      toggleSideNav,
      openSideNav,
      closeSideNav,
      peekSideNav,
      endPeek,
      holdPeek,
      setSideNavWidth: resizeSideNav,
      setPanelWidth: resizePanel,
      setSideNavDefaultWidth: setSideNavDefault,
      setPanelDefaultWidth: setPanelDefault,
      setBanner,
      setBannerHeight,
      registerSkipLink,
      skipLinks,
      focusPage: focusThePage,
      toggle,
      listeners: listeners.current,
    }),
    [
      isDesktop,
      sideNavShortcut,
      collapsedSideNav,
      shownExpanded,
      open,
      peeking,
      sideNavWidth,
      yielded,
      modal,
      panelWidth,
      expandSideNav,
      collapseSideNav,
      toggleSideNav,
      openSideNav,
      closeSideNav,
      peekSideNav,
      endPeek,
      holdPeek,
      resizeSideNav,
      resizePanel,
      registerSkipLink,
      skipLinks,
      focusThePage,
    ],
  );

  // The widths come from the tokens, or from what the reader dragged and the browser remembered;
  // a part's `defaultWidth` sits between the two and is never remembered (shell.css).
  const vars = {
    "--shell-banner": hasBanner
      ? bannerHeight
        ? `${bannerHeight}px`
        : token("dimension.layout.banner")
      : "0px",
    // The narrowest the panel's column gives way to, beside a Main at its own minimum (shell.css).
    "--shell-panel-min": `${PANEL_MIN}px`,
    ...(sideNavDefault ? { "--shell-sidenav-default": `${sideNavDefault}px` } : {}),
    ...(panelDefault ? { "--shell-panel-default": `${panelDefault}px` } : {}),
    ...(sideNavWidth ? { "--shell-sidenav-width": `${sideNavWidth}px` } : {}),
    ...(panelWidth ? { "--shell-panel-width": `${panelWidth}px` } : {}),
  } as CSSProperties;

  return (
    <ShellContext.Provider value={api}>
      {/* The kit's tooltip timing: 300ms to the first, the next at once for 300ms after. */}
      <TooltipProvider>
        <div
          {...props}
          ref={mergeRefs(ref, rootRef)}
          data-slot="shell"
          data-collapsed-sidenav={collapsedSideNav}
          data-sidenav={isDesktop ? (shownExpanded ? "expanded" : "collapsed") : "overlay"}
          data-sidenav-yielded={yielded ? "" : undefined}
          data-aside-fits={asideFits ? "" : undefined}
          data-sidenav-motion={sideNavMotion ? "" : undefined}
          className={cn("bg-surface text-default", className)}
          style={{ ...vars, ...style }}
          onFocusCapture={(event) => {
            onFocusCapture?.(event);
            if (event.target.closest(MAIN)) opener.current = event.target;
          }}
          onPointerDownCapture={(event) => {
            onPointerDownCapture?.(event);
            const target = event.target as HTMLElement;
            if (event.button === 0 && target.closest('[data-slot="shell-splitter"]')) startDrag();
            if (target.closest(MAIN)) {
              const control = target.closest<HTMLElement>(
                "button, a[href], input, textarea, select, [tabindex]",
              );
              if (control) opener.current = control;
            }
          }}
        >
          <SkipLinks />
          <Announcer />
          <SlotsContext.Provider value={slots}>
            {children}
            <div
              ref={setAsideSlot}
              data-shell-slot="aside"
              className="min-w-0"
              inert={modal || undefined}
            />
            <div
              ref={setPanelSlot}
              data-shell-slot="panel"
              className="min-w-0"
              inert={modal || undefined}
            />
          </SlotsContext.Provider>
        </div>
      </TooltipProvider>
    </ShellContext.Provider>
  );
}

/** Visually hidden until focused: one link per area, in the areas' order. The side nav's link is there only while the side nav shows beside the page: inline or as the icon rail. */
export function SkipLinks() {
  const { skipLinks, isDesktop, collapsedSideNav, sideNav } = useShell();
  const { t } = useLedgerLocale();
  const navShown = isDesktop && (sideNav.expanded || collapsedSideNav === "icons");
  const links = skipLinks.filter((l) => l.area !== "sidenav" || navShown);
  if (!links.length) return null;
  return (
    <nav aria-label={t("skipLinks")} className="contents" inert={sideNav.modal || undefined}>
      {links.map((l) => (
        <a
          key={l.id}
          data-shell-skip={l.area}
          href={`#${l.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(l.id)?.focus();
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:z-overlay focus:start-150 focus:top-150 focus:rounded-medium focus:bg-surface-overlay focus:px-150 focus:py-100 focus:font-body focus:font-medium focus:text-default focus:shadow-overlay focus:outline-focused"
        >
          {t("skipTo", { area: l.label })}
        </a>
      ))}
    </nav>
  );
}

/* ---------- banner ---------- */

export type ShellBannerProps = ComponentProps<"div"> & {
  /** The landmark's name, "Banner" by default. */
  label?: string | undefined;
};

/** The banner area, above the top nav. It holds a Banner and pushes everything down by its height while it is rendered, a wrapped banner's included. */
export function BannerArea({ id, label, className, children, ref, ...props }: ShellBannerProps) {
  const { setBanner, setBannerHeight, sideNav } = useShell();
  const { t } = useLedgerLocale();
  const name = label ?? t("banner");
  const skipId = useSkipLink(id, name);
  const own = useRef<HTMLDivElement>(null);
  // Before paint, so the top nav starts under the banner; measured, so a banner that wraps on a
  // phone pushes the top nav, the side nav and the panel down by its real height.
  useLayoutEffect(() => {
    setBanner(true);
    const el = own.current;
    let observer: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== "undefined") {
      const measure = () => setBannerHeight(el.getBoundingClientRect().height || null);
      measure();
      observer = new ResizeObserver(measure);
      observer.observe(el);
    }
    return () => {
      observer?.disconnect();
      setBanner(false);
      setBannerHeight(null);
    };
  }, [setBanner, setBannerHeight]);
  return (
    <div
      {...props}
      ref={mergeRefs(ref, own)}
      id={skipId}
      tabIndex={-1}
      role="region"
      aria-label={name}
      inert={sideNav.modal || props.inert}
      data-slot="shell-banner"
      className={cn("outline-none", className)}
    >
      {children}
    </div>
  );
}

/* ---------- main ---------- */

export type ShellMainProps = ComponentProps<"main"> & {
  /** The landmark's name, "Main content" by default. */
  label?: string | undefined;
};

/** The page. It fills what the side nav and the panel leave and uses the body scroll. */
export function Main({ id, label, className, children, ...props }: ShellMainProps) {
  const { t } = useLedgerLocale();
  const { sideNav } = useShell();
  const name = label ?? t("mainContent");
  const skipId = useSkipLink(id, name, "main");
  return (
    <main
      {...props}
      aria-label={name}
      id={skipId}
      tabIndex={-1}
      inert={sideNav.modal || props.inert}
      data-shell-area="main"
      data-slot="shell-main"
      className={cn("w-full px-200 pb-300 pt-200 outline-none lg:px-300 lg:pb-400", className)}
    >
      {children}
    </main>
  );
}

/* ---------- aside ---------- */

/** A control a reader can reach with Tab. */
const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type ShellAsideProps = ComponentProps<"aside"> & {
  /** The region's name, "<Record type> details" on a record ("Page context" by default). */
  label?: string | undefined;
  /** Where the Details are a disclosure, its heading: "Details" (a locale message) by default. An Inspector.Group of the same name inside is the disclosure's own content, without a second title. */
  heading?: string | undefined;
  /** Where the Details are a disclosure, what its row shows after its heading, closed or open: the record's state, as its status badge. Static content only, since it is part of the disclosure's button and its name. */
  summary?: ReactNode | undefined;
};

const warned = new Set<string>();
/** A composition mistake said once in the console, never thrown: the Aside still renders. */
function useWarnOnce(when: boolean, message: string) {
  useEffect(() => {
    if (!when || warned.has(message)) return;
    warned.add(message);
    console.warn(message);
  }, [when, message]);
}

/**
 * A record's Details, given to an AsideLayout as its `aside`: the rail at the end of the body where
 * the layout leaves the body room, always open, else a Details disclosure above the body, closed
 * until the reader opens it, whose row carries `summary`. Inside the layout it is a region named by
 * `label`, rendered once where the layout puts it. Its outline starts under the page's h1: as the
 * rail, a heading placed directly inside (an Inspector group, a Section) is an h2; as the
 * disclosure, its heading is the h2 and the content one level below.
 *
 * Rendered outside an AsideLayout, it takes the shell's aside area beside Main instead, from the
 * top of the page (deprecated: the next minor version renders it in place). From the aside
 * breakpoint it is the rail there, beside Main where space permits, else following it; below it,
 * wherever it would not sit beside Main, the disclosure where the route rendered it.
 */
export function Aside({
  children,
  label,
  heading,
  summary,
  className,
  onFocus,
  onBlur,
  ref,
  ...props
}: ShellAsideProps) {
  const { t } = useLedgerLocale();
  const slots = useContext(SlotsContext);
  // Inside an AsideLayout the layout decides the display from its own width and the Aside renders
  // in place; outside one, the shell's area and its marker (deprecated).
  const layout = useContext(AsideLayoutContext);
  const inLayout = layout !== null;
  useWarnOnce(
    !inLayout && slots !== null,
    "Ledger: a Shell.Aside outside an AsideLayout takes the shell's aside area beside Main, which is deprecated. Give it to an AsideLayout as its `aside`, around the body it belongs to: the Overview tab's panel on a tabbed record, everything under the PageHeader on a record without tabs.",
  );
  const setMarker = slots?.setAsideMarker;
  const releaseMarker = slots?.releaseAsideMarker;
  const disclosure = inLayout ? layout === "disclosure" : slots?.asideDisplay === "disclosure";
  const [open, setOpen] = useState(false);
  // The content folds and unfolds on the kit's motion only when the reader toggles the disclosure.
  // At first paint and when the display changes (a resize, a panel opening) it is shown as it is at
  // once (`data-instant`, shell.css), so the page never watches the Details collapse in it.
  const [motion, setMotion] = useState({ disclosure, reader: false, hadFocus: false });
  // Whether focus is on a control inside: a rail that becomes the disclosure opens around it, so
  // the control stays shown and keeps focus (the shell gives it back as the content moves).
  const [focusWithin, setFocusWithin] = useState(false);
  if (motion.disclosure !== disclosure) {
    setMotion({ disclosure, reader: false, hadFocus: focusWithin });
    if (disclosure && focusWithin) setOpen(true);
  }
  const instant = motion.disclosure !== disclosure || !motion.reader;
  // A control the change of display replaced (a group's title is an h2 in the rail and an h3 in the
  // disclosure) takes focus with it: focus goes to the first control left, the disclosure's row or
  // the rail's first group, never to the page's start.
  const own = useRef<HTMLElement>(null);
  const asideRef = useMemo(() => mergeRefs(ref, own), [ref]);
  // Once per change: a hidden Activity shown again (a retained tab panel) runs layout effects again
  // whatever their deps, and coming back to a tab moves no focus.
  const handedOff = useRef<typeof motion | null>(null);
  useLayoutEffect(() => {
    if (handedOff.current === motion) return;
    handedOff.current = motion;
    const aside = own.current;
    if (!motion.hadFocus || !aside) return;
    const active = aside.ownerDocument.activeElement;
    if (active && aside.contains(active)) return;
    aside.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
  }, [motion]);
  // Where the route rendered the Aside: its disclosure shows here.
  const marker = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !setMarker || !releaseMarker) return;
      setMarker(node);
      return () => releaseMarker(node);
    },
    [setMarker, releaseMarker],
  );
  if (children === null || children === undefined || children === false) return null;
  const name = heading ?? t("details");
  const hasSummary = summary !== null && summary !== undefined && summary !== false;
  // One element tree in both displays, so the content never mounts again: the rail is the
  // disclosure held open with no row of its own.
  const tree = (
    <CollapsiblePrimitive.Root
      open={!disclosure || open}
      onOpenChange={(next) => {
        setOpen(next);
        setMotion({ disclosure, reader: true, hadFocus: false });
      }}
      render={
        <aside
          {...props}
          ref={asideRef}
          // Inside Main it is a region: a complementary landmark belongs at the top level.
          role={inLayout || disclosure ? "region" : props.role}
          data-shell-area={inLayout ? undefined : "aside"}
          data-slot="shell-aside"
          data-display={disclosure ? "disclosure" : "rail"}
          data-instant={instant ? "" : undefined}
          aria-label={label ?? t("pageContext")}
          // The rail pads its bottom only (and its top in the shell's area): its Inspector groups
          // run its full width, each with the gutter inside its own row (AsideRailContext). In an
          // AsideLayout the column's own offset starts its first group level with the body's.
          className={cn(
            disclosure ? "min-w-0" : inLayout ? "min-w-0 pb-200" : "min-w-0 pt-100 pb-200",
            className,
          )}
          onFocus={(event) => {
            onFocus?.(event);
            setFocusWithin(true);
          }}
          onBlur={(event) => {
            onBlur?.(event);
            const next = event.relatedTarget;
            if (!(next instanceof Node && event.currentTarget.contains(next))) {
              setFocusWithin(false);
            }
          }}
        />
      }
    >
      {disclosure ? (
        <HeadingLevelProvider level={2}>
          <CollapsibleHeader>
            <span className="flex min-w-0 flex-wrap items-center gap-x-100 gap-y-050">
              <span>{name}</span>
              {hasSummary ? (
                <span data-slot="shell-aside-summary" className="inline-flex min-w-0">
                  {summary}
                </span>
              ) : null}
            </span>
          </CollapsibleHeader>
        </HeadingLevelProvider>
      ) : null}
      {/* Kept mounted while closed, so drafts inside survive and find-in-page opens it. */}
      <CollapsibleContent hiddenUntilFound>
        <AsideDisclosureContext.Provider value={disclosure ? name : null}>
          <AsideRailContext.Provider value={!disclosure}>
            <HeadingLevelProvider level={disclosure ? 3 : 2}>{children}</HeadingLevelProvider>
          </AsideRailContext.Provider>
        </AsideDisclosureContext.Provider>
      </CollapsibleContent>
    </CollapsiblePrimitive.Root>
  );
  if (inLayout) return tree;
  return (
    <>
      {slots ? <div ref={marker} data-slot="shell-aside-marker" className="contents" /> : null}
      <AreaPortal name="aside">{tree}</AreaPortal>
    </>
  );
}
