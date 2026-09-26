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
import { AreaPortal, SlotsContext } from "../slots";
import { applyShell, readShell, SHELL_STORAGE_KEY, writeShell } from "../storage";
import {
  desktopQuery,
  focusPage,
  followFocusToPage,
  MAIN,
  mergeRefs,
  PANEL_MIN,
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

/* ---------- root ---------- */

export type ShellProps = ComponentProps<"div"> & {
  /** Collapsed on first render on a desktop. Keep it current from SideNav's onCollapse and onExpand. */
  defaultSideNavCollapsed?: boolean | undefined;
  /** Desktop collapse behavior: hide the navigation, or keep destination icons and the profile avatar in a compact rail. */
  collapsedSideNav?: "hidden" | "icons" | undefined;
  /** Ctrl+[ toggles the side nav. Off by default; ignored while a dialog is open. */
  sideNavShortcut?: boolean | undefined;
  /** Remember the collapsed state and the dragged widths in this browser: `true` for the default key, or a key of your own. Put `shellScript` in the document head so the first paint honours it. */
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
  const [isDesktop, setIsDesktop] = useState(true);
  const [expanded, setExpanded] = useState(!defaultSideNavCollapsed);
  const [open, setOpen] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [sideNavWidth, setSideNavWidth] = useState<number | null>(null);
  const [sideNavMotion, setSideNavMotion] = useState(false);
  const [panelWidth, setPanelWidth] = useState<number | null>(null);
  const [hasBanner, setBanner] = useState(false);
  const [skipLinks, setSkipLinks] = useState<SkipLink[]>([]);
  const listeners = useRef<ShellApi["listeners"]>({});
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (peekTimer.current) clearTimeout(peekTimer.current);
    },
    [],
  );
  const toggle = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(desktopQuery());
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
    const value = {
      collapsed: !expanded,
      sideNavWidth: sideNavWidth ?? undefined,
      panelWidth: panelWidth ?? undefined,
    };
    writeShell(storageKey, value);
    applyShell(value);
  }, [storageKey, restored, expanded, sideNavWidth, panelWidth]);

  // An overlay does not survive a change of viewport class.
  useEffect(() => {
    setOpen(false);
    setPeeking(false);
    setSideNavMotion(false);
  }, [isDesktop]);

  const closeSideNav = useCallback(
    (trigger: SideNavTrigger = "hook") => {
      setOpen(false);
      setPeeking(false);
      if (!isDesktop) listeners.current.onCollapse?.({ trigger });
      if (isDesktop || trigger === "navigation") return;
      // Escape and the scrim leave focus nowhere, and so does any other close from inside the
      // overlay, which turns inert as it closes: focus goes back to the button that opened it. A
      // destination chosen in the overlay moves focus to the page instead (focusPage).
      const focused = document.activeElement;
      if (
        trigger === "escape" ||
        trigger === "scrim" ||
        focused?.closest('[data-shell-area="sidenav"]')
      )
        toggle.current?.focus();
    },
    [isDesktop],
  );
  const openSideNav = useCallback(() => {
    setOpen(true);
    setPeeking(false);
    listeners.current.onExpand?.({ trigger: "toggle-button" });
  }, []);
  const expandSideNav = useCallback((trigger: SideNavTrigger = "hook") => {
    setSideNavMotion(true);
    setOpen(false);
    setPeeking(false);
    setExpanded((was) => {
      if (!was) listeners.current.onExpand?.({ trigger });
      return true;
    });
  }, []);
  const collapseSideNav = useCallback(
    (trigger: SideNavTrigger = "hook") => {
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
      setExpanded((was) => {
        if (was) listeners.current.onCollapse?.({ trigger });
        return false;
      });
    },
    [collapsedSideNav],
  );
  // A drag follows the pointer immediately. Only explicit expand/collapse changes animate;
  // restoring a saved width or crossing a breakpoint must not animate the initial layout.
  const resizeSideNav = useCallback((width: number | null) => {
    setSideNavMotion(false);
    setSideNavWidth(width);
  }, []);
  const toggleSideNav = useCallback(
    (trigger: SideNavTrigger = "hook") => {
      if (isDesktop) (expanded ? collapseSideNav : expandSideNav)(trigger);
      else if (open) closeSideNav(trigger);
      else openSideNav();
    },
    [isDesktop, expanded, open, collapseSideNav, expandSideNav, closeSideNav, openSideNav],
  );

  const holdPeek = useCallback(() => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    peekTimer.current = null;
  }, []);
  const peekSideNav = useCallback(() => {
    holdPeek();
    if (isDesktop && !expanded && collapsedSideNav === "hidden") {
      setOpen(true);
      setPeeking(true);
    }
  }, [holdPeek, isDesktop, expanded, collapsedSideNav]);
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
      if (e.key === "Escape") closeSideNav("escape");
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
  const latest = useRef({ isDesktop, open, getPageTitle });
  latest.current = { isDesktop, open, getPageTitle };
  const previousLocation = useRef(locationKey);
  useEffect(() => {
    const previous = previousLocation.current;
    previousLocation.current = locationKey;
    if (previous === locationKey || previous === undefined || locationKey === undefined) return;
    const { isDesktop: desktop, open: overlayOpen } = latest.current;
    if (overlayOpen) {
      setOpen(false);
      setPeeking(false);
      if (!desktop) listeners.current.onCollapse?.({ trigger: "navigation" });
    }
    focusPage(rootRef.current);
    // Focus left in a menu or a dialog goes on to the page once the popup hands it back.
    const stopFollowing = followFocusToPage(rootRef.current);
    const timer = setTimeout(() => {
      const title = latest.current.getPageTitle
        ? latest.current.getPageTitle(locationKey)
        : currentPageTitle(rootRef.current);
      if (title) announce(title);
    }, PAGE_SETTLE);
    return () => {
      clearTimeout(timer);
      stopFollowing();
    };
  }, [locationKey]);

  const [asideSlot, setAsideSlot] = useState<HTMLDivElement | null>(null);
  const [panelSlot, setPanelSlot] = useState<HTMLDivElement | null>(null);
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
      sideNav: { expanded, open, peeking, width: sideNavWidth },
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
      setPanelWidth,
      setBanner,
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
      expanded,
      open,
      peeking,
      sideNavWidth,
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
      registerSkipLink,
      skipLinks,
      focusThePage,
    ],
  );

  // The widths come from the tokens, or from what the reader dragged and the browser remembered.
  const vars = {
    "--shell-banner": hasBanner ? token("dimension.layout.banner") : "0px",
    // The narrowest the panel's column gives way to, beside a Main at its own minimum (shell.css).
    "--shell-panel-min": `${PANEL_MIN}px`,
    ...(sideNavWidth ? { "--shell-sidenav-width": `${sideNavWidth}px` } : {}),
    ...(panelWidth ? { "--shell-panel-width": `${panelWidth}px` } : {}),
  } as CSSProperties;

  return (
    <ShellContext.Provider value={api}>
      <TooltipProvider delay={300} timeout={300}>
        <div
          {...props}
          ref={mergeRefs(ref, rootRef)}
          data-slot="shell"
          data-collapsed-sidenav={collapsedSideNav}
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
            <div ref={setAsideSlot} data-shell-slot="aside" className="min-w-0" />
            <div ref={setPanelSlot} data-shell-slot="panel" className="min-w-0" />
          </SlotsContext.Provider>
        </div>
      </TooltipProvider>
    </ShellContext.Provider>
  );
}

/** Visually hidden until focused: one link per area, in the areas' order. */
export function SkipLinks() {
  const { skipLinks } = useShell();
  const { t } = useLedgerLocale();
  if (!skipLinks.length) return null;
  return (
    <nav aria-label={t("skipLinks")} className="contents">
      {skipLinks.map((l) => (
        <a
          key={l.id}
          data-shell-skip={l.area}
          href={`#${l.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(l.id)?.focus();
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:start-0 focus:top-0 focus:z-50 focus:start-150 focus:top-150 focus:rounded-medium focus:bg-surface-overlay focus:px-150 focus:py-100 focus:font-body focus:font-medium focus:text-default focus:shadow-overlay focus:outline-focused"
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

/** The banner area, above the top nav. It holds a Banner and pushes everything down while it is rendered. */
export function BannerArea({ id, label, className, children, ...props }: ShellBannerProps) {
  const { setBanner } = useShell();
  const { t } = useLedgerLocale();
  const name = label ?? t("banner");
  const skipId = useSkipLink(id, name);
  useEffect(() => {
    setBanner(true);
    return () => setBanner(false);
  }, [setBanner]);
  return (
    <div
      {...props}
      id={skipId}
      tabIndex={-1}
      role="region"
      aria-label={name}
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
  const name = label ?? t("mainContent");
  const skipId = useSkipLink(id, name, "main");
  return (
    <main
      {...props}
      aria-label={name}
      id={skipId}
      tabIndex={-1}
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

/** Supporting page context. It follows Main on smaller screens and sits beside it when space permits. */
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
        {children}
      </aside>
    </AreaPortal>
  );
}
