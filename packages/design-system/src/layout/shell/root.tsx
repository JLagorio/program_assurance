import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";

import { TooltipProvider } from "../../components/tooltip";
import { token } from "../../generated/tokens";
import { announce, Announcer } from "../../lib/announce";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { HeadingLevelProvider } from "../../primitives/heading-level";
import { AreaPortal, SlotsContext } from "../slots";
import { applyShell, readShell, SHELL_STORAGE_KEY, writeShell } from "../storage";
import {
  desktopQuery,
  focusPage,
  followFocusToPage,
  MAIN,
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

  const opener = useRef<HTMLElement | null>(null);
  const slots = useMemo(
    () => ({ aside: asideSlot, panel: panelSlot, opener }),
    [asideSlot, panelSlot],
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
          data-sidenav-motion={sideNavMotion ? "" : undefined}
          className={cn("shell-root bg-surface text-default", className)}
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
          className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:start-150 focus:top-150 focus:rounded-medium focus:bg-surface-overlay focus:px-150 focus:py-100 focus:font-body focus:font-medium focus:text-default focus:shadow-overlay focus:outline-focused"
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
      className={cn("shell-banner outline-none", className)}
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
      className={cn(
        "shell-main w-full px-200 pb-300 pt-200 outline-none lg:px-300 lg:pb-400",
        className,
      )}
    >
      {children}
    </main>
  );
}

/* ---------- aside ---------- */

export type ShellAsideProps = ComponentProps<"aside"> & {
  /** The landmark's name, "Page context" by default. */
  label?: string | undefined;
};

/**
 * Supporting page context. It follows Main on smaller screens and sits beside it when space
 * permits. Its outline starts under the page's h1 wherever it is rendered: a heading placed
 * directly inside (an Inspector group, a Section) is an h2.
 */
export function Aside({ children, label, className, ...props }: ShellAsideProps) {
  const { t } = useLedgerLocale();
  if (children === null || children === undefined || children === false) return null;
  return (
    <AreaPortal name="aside">
      <aside
        {...props}
        data-shell-area="aside"
        data-slot="shell-aside"
        aria-label={label ?? t("pageContext")}
        className={cn("min-w-0 p-200 lg:p-300", className)}
      >
        <HeadingLevelProvider level={2}>{children}</HeadingLevelProvider>
      </aside>
    </AreaPortal>
  );
}
