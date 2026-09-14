import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";

import { TooltipProvider } from "../../components/tooltip";
import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { AreaPortal, SlotsContext } from "../slots";
import { applyShell, readShell, SHELL_STORAGE_KEY, writeShell } from "../storage";
import {
  desktopQuery,
  MAIN,
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
import { clampWidth } from "./splitter";

/* ---------- root ---------- */

export type ShellProps = ComponentProps<"div"> & {
  /** Collapsed on first render on a desktop. Keep it current from SideNav's onCollapse and onExpand. */
  defaultSideNavCollapsed?: boolean | undefined;
  /** Ctrl+[ toggles the side nav. Off by default; ignored while a dialog is open. */
  sideNavShortcut?: boolean | undefined;
  /** Remember the collapsed state and the dragged widths in this browser: `true` for the default key, or a key of your own. Put `shellScript` in the document head so the first paint honours it. */
  persist?: string | boolean | undefined;
};

export function ShellRoot({
  children,
  defaultSideNavCollapsed = false,
  sideNavShortcut = false,
  persist,
  className,
  style,
  onFocusCapture,
  onPointerDownCapture,
  ...props
}: ShellProps) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [expanded, setExpanded] = useState(!defaultSideNavCollapsed);
  const [open, setOpen] = useState(false);
  const [peeking, setPeeking] = useState(false);
  const [sideNavWidth, setSideNavWidth] = useState<number | null>(null);
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
    // A remembered width is clamped again here: the screen may be smaller than when it was dragged.
    if (stored?.sideNavWidth) setSideNavWidth(clampWidth(stored.sideNavWidth, SIDENAV_MIN));
    if (stored?.panelWidth) setPanelWidth(clampWidth(stored.panelWidth, PANEL_MIN));
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
  }, [isDesktop]);

  const closeSideNav = useCallback(
    (trigger: SideNavTrigger = "hook") => {
      setOpen(false);
      setPeeking(false);
      if (!isDesktop) listeners.current.onCollapse?.({ trigger });
      // Escape and the scrim leave focus nowhere; it goes back to the button that opened it.
      if (!isDesktop && (trigger === "escape" || trigger === "scrim")) toggle.current?.focus();
    },
    [isDesktop],
  );
  const openSideNav = useCallback(() => {
    setOpen(true);
    setPeeking(false);
    listeners.current.onExpand?.({ trigger: "toggle-button" });
  }, []);
  const expandSideNav = useCallback((trigger: SideNavTrigger = "hook") => {
    setOpen(false);
    setPeeking(false);
    setExpanded((was) => {
      if (!was) listeners.current.onExpand?.({ trigger });
      return true;
    });
  }, []);
  const collapseSideNav = useCallback((trigger: SideNavTrigger = "hook") => {
    setExpanded((was) => {
      if (was) listeners.current.onCollapse?.({ trigger });
      return false;
    });
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
    if (isDesktop && !expanded) {
      setOpen(true);
      setPeeking(true);
    }
  }, [holdPeek, isDesktop, expanded]);
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
      setSideNavWidth,
      setPanelWidth,
      setBanner,
      registerSkipLink,
      skipLinks,
      toggle,
      listeners: listeners.current,
    }),
    [
      isDesktop,
      sideNavShortcut,
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
      registerSkipLink,
      skipLinks,
    ],
  );

  // The widths come from the tokens, or from what the reader dragged and the browser remembered.
  const vars = {
    "--shell-banner": hasBanner ? token("dimension.layout.banner") : "0px",
    ...(sideNavWidth ? { "--shell-sidenav-width": `${sideNavWidth}px` } : {}),
    ...(panelWidth ? { "--shell-panel-width": `${panelWidth}px` } : {}),
  } as CSSProperties;

  return (
    <ShellContext.Provider value={api}>
      <TooltipProvider delay={300} timeout={300}>
        <div
          {...props}
          data-slot="shell"
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
