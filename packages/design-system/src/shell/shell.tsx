import { Slot, Slottable } from "@radix-ui/react-slot";
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { IconButton } from "../components/button";
import { Kbd } from "../components/kbd";
import { Popover } from "../components/popover";
import { Tooltip } from "../components/tooltip";
import { Eyebrow } from "../components/typography";
import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import { legacy, type NavItemProps } from "./legacy";

/*
 * The navigation system. Shell is the root; its areas are its immediate children in a fixed
 * order, which is also the keyboard and landmark order: Banner, TopNav, SideNav, Main, Panel.
 * The package owns the areas and their behaviour: the side nav collapses, resizes, flies out on
 * hover and overlays the page on a narrow viewport; the panel resizes and overlays; the banner
 * pushes everything down. The product owns what goes in them: the nav data, the router, the
 * search, the actions, whatever fills the panel. A link is a slot the product fills with asChild.
 */

/* ---------- state ---------- */

/** The side nav's minimum width while dragging. The maximum is half the viewport. */
const SIDENAV_MIN = 200;
/** The panel's minimum width while dragging. */
const PANEL_MIN = 240;
/** The large breakpoint, Tailwind's `lg`: the side nav is inline from here and an overlay below. */
const DESKTOP = "(min-width: 64rem)";
/** The medium breakpoint, `md`: the top nav's end items fold into one button below it. */
const PEEK_CLOSE_DELAY = 200;

type SkipLink = { id: string; label: string };
type Trigger = "toggle-button" | "shortcut" | "splitter" | "scrim" | "escape" | "hook" | "viewport";

type ShellApi = {
  isDesktop: boolean;
  shortcut: boolean;
  sideNav: { expanded: boolean; open: boolean; peeking: boolean; width: number | null };
  panel: { width: number | null };
  expandSideNav: (trigger?: Trigger) => void;
  collapseSideNav: (trigger?: Trigger) => void;
  toggleSideNav: (trigger?: Trigger) => void;
  openSideNav: () => void;
  closeSideNav: (trigger?: Trigger) => void;
  peekSideNav: () => void;
  endPeek: (immediate?: boolean) => void;
  holdPeek: () => void;
  setSideNavWidth: (width: number | null) => void;
  setPanelWidth: (width: number | null) => void;
  setBanner: (present: boolean) => void;
  registerSkipLink: (link: SkipLink) => () => void;
  skipLinks: SkipLink[];
  listeners: {
    onCollapse?: ((args: { trigger: Trigger }) => void) | undefined;
    onExpand?: ((args: { trigger: Trigger }) => void) | undefined;
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
  listeners: {},
};

const ShellContext = createContext<ShellApi | null>(null);
const useShell = () => useContext(ShellContext) ?? detached;
/** How deep a side nav item sits under expandable items; each level indents. */
const DepthContext = createContext(0);

/** The side nav from product code: is it showing, and open, close and toggle it. Use it inside a Shell. */
export function useSideNav() {
  const s = useShell();
  const isExpanded = s.isDesktop ? s.sideNav.expanded : s.sideNav.open;
  return {
    isExpanded,
    expand: useCallback(() => (s.isDesktop ? s.expandSideNav("hook") : s.openSideNav()), [s]),
    collapse: useCallback(
      () => (s.isDesktop ? s.collapseSideNav("hook") : s.closeSideNav("hook")),
      [s],
    ),
    toggle: useCallback(() => s.toggleSideNav("hook"), [s]),
  };
}

function useSkipLink(idProp: string | undefined, label: string) {
  const generated = useId();
  const id = idProp ?? `shell-${generated.replace(/[^\w-]/g, "")}`;
  const { registerSkipLink } = useShell();
  useEffect(() => registerSkipLink({ id, label }), [registerSkipLink, id, label]);
  return id;
}

/* ---------- root ---------- */

export type ShellProps = {
  /** The areas, as immediate children, in order: Banner, TopNav, SideNav, Main, Panel. */
  children: ReactNode;
  /** Collapsed on first render on a desktop. Keep it current from SideNav's onCollapse and onExpand. */
  defaultSideNavCollapsed?: boolean | undefined;
  /** Ctrl+[ toggles the side nav. Off by default; ignored while a dialog is open. */
  sideNavShortcut?: boolean | undefined;
  className?: string | undefined;
  /** @deprecated The old frame's sidebar. Render Shell.SideNav as a child instead. */
  sidebar?: ReactNode;
  /** @deprecated The old frame's top bar. Render Shell.TopNav as a child instead. */
  topBar?: ReactNode;
};

function ShellRoot(props: ShellProps) {
  if (props.sidebar !== undefined || props.topBar !== undefined)
    return (
      <legacy.Root sidebar={props.sidebar} topBar={props.topBar}>
        {props.children}
      </legacy.Root>
    );
  return <NavigationRoot {...props} />;
}

function NavigationRoot({
  children,
  defaultSideNavCollapsed = false,
  sideNavShortcut = false,
  className,
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

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // An overlay does not survive a change of viewport class.
  useEffect(() => {
    setOpen(false);
    setPeeking(false);
  }, [isDesktop]);

  const closeSideNav = useCallback(
    (trigger: Trigger = "hook") => {
      setOpen(false);
      setPeeking(false);
      if (!isDesktop) listeners.current.onCollapse?.({ trigger });
    },
    [isDesktop],
  );
  const openSideNav = useCallback(() => {
    setOpen(true);
    setPeeking(false);
    listeners.current.onExpand?.({ trigger: "toggle-button" });
  }, []);
  const expandSideNav = useCallback((trigger: Trigger = "hook") => {
    setOpen(false);
    setPeeking(false);
    setExpanded((was) => {
      if (!was) listeners.current.onExpand?.({ trigger });
      return true;
    });
  }, []);
  const collapseSideNav = useCallback((trigger: Trigger = "hook") => {
    setExpanded((was) => {
      if (was) listeners.current.onCollapse?.({ trigger });
      return false;
    });
  }, []);
  const toggleSideNav = useCallback(
    (trigger: Trigger = "hook") => {
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
      if (
        document.querySelector(
          '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
        )
      )
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

  const vars = {
    "--shell-banner": hasBanner ? token("dimension.layout.banner") : "0px",
    "--shell-sidenav-width": sideNavWidth ? `${sideNavWidth}px` : token("dimension.layout.sidenav"),
    "--shell-panel-width": panelWidth ? `${panelWidth}px` : token("dimension.layout.panel"),
  } as CSSProperties;

  return (
    <ShellContext.Provider value={api}>
      <div className={cn("shell-root bg-surface text-default", className)} style={vars}>
        <SkipLinks />
        {children}
      </div>
    </ShellContext.Provider>
  );
}

/** Visually hidden until focused: one link per area, in the areas' order. */
function SkipLinks() {
  const { skipLinks } = useShell();
  if (!skipLinks.length) return null;
  return (
    <nav aria-label="Skip to" className="contents">
      {skipLinks.map((l) => (
        <a
          key={l.id}
          href={`#${l.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(l.id)?.focus();
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:start-0 focus:top-0 focus:z-50 focus:start-150 focus:top-150 focus:rounded-medium focus:bg-surface-overlay focus:px-150 focus:py-100 focus:font-body focus:font-medium focus:text-default focus:shadow-overlay focus:outline-focused"
        >
          Skip to {l.label.toLowerCase()}
        </a>
      ))}
    </nav>
  );
}

/* ---------- banner ---------- */

/** The banner area, above the top nav. It holds a Banner and pushes everything down while it is rendered. */
function BannerArea({
  id,
  label = "Banner",
  children,
}: {
  id?: string | undefined;
  label?: string | undefined;
  children: ReactNode;
}) {
  const { setBanner } = useShell();
  const skipId = useSkipLink(id, label);
  useEffect(() => {
    setBanner(true);
    return () => setBanner(false);
  }, [setBanner]);
  return (
    <div
      id={skipId}
      tabIndex={-1}
      role="region"
      aria-label={label}
      className="shell-banner outline-none"
    >
      {children}
    </div>
  );
}

/* ---------- top nav ---------- */

function TopNavRoot({
  id,
  label = "Top navigation",
  className,
  children,
}: {
  id?: string | undefined;
  label?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  const skipId = useSkipLink(id, label);
  return (
    <header
      id={skipId}
      tabIndex={-1}
      aria-label={label}
      className={cn(
        "shell-topnav flex items-stretch border-b border-default bg-surface outline-none",
        className,
      )}
    >
      {children}
    </header>
  );
}

/** The start slot: the toggle, then the app switcher and the logo. While the side nav is expanded it takes the side nav's width and surface, so the logo heads that column. */
function TopNavStart({ toggle, children }: { toggle?: ReactNode; children?: ReactNode }) {
  const { isDesktop, sideNav } = useShell();
  const inline = isDesktop && sideNav.expanded;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-100 px-150",
        inline && "lg:shell-topnav-start lg:border-e lg:border-default lg:bg-surface-sunken",
      )}
    >
      {inline ? null : toggle}
      {children}
      {inline ? <span className="ms-auto flex items-center">{toggle}</span> : null}
    </div>
  );
}

/** The middle slot: the search first, then the create action. Centred while the side nav is collapsed. */
function TopNavMiddle({ children }: { children: ReactNode }) {
  const { isDesktop, sideNav } = useShell();
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-100 px-200",
        isDesktop && sideNav.expanded ? "justify-start" : "justify-center",
      )}
    >
      {children}
    </div>
  );
}

/** The end slot: a list of actions, right-aligned. Below the medium breakpoint they fold into one More button. */
function TopNavEnd({
  label = "Actions",
  moreLabel = "More",
  children,
}: {
  label?: string | undefined;
  moreLabel?: string | undefined;
  children: ReactNode;
}) {
  const items = Children.toArray(children);
  return (
    <div className="flex shrink-0 items-center px-150">
      <ul aria-label={label} className="hidden items-center gap-050 md:flex">
        {items.map((child, i) => (
          <li key={i} className="flex items-center">
            {child}
          </li>
        ))}
      </ul>
      <div className="md:hidden">
        <Popover
          align="end"
          trigger={
            <IconButton label={moreLabel} variant="subtle">
              <MoreHorizontal className="size-icon-medium" />
            </IconButton>
          }
        >
          <ul aria-label={label} className="flex flex-col gap-050">
            {items.map((child, i) => (
              <li key={i} className="flex items-center">
                {child}
              </li>
            ))}
          </ul>
        </Popover>
      </div>
    </div>
  );
}

const TopNav = Object.assign(TopNavRoot, {
  Start: TopNavStart,
  Middle: TopNavMiddle,
  End: TopNavEnd,
});

/* ---------- top nav items ---------- */

/** The default mark: a brand square. */
function Mark() {
  return (
    <span className="flex size-300 shrink-0 items-center justify-center rounded-small bg-brand-bold">
      <span className="block size-100 rounded-xsmall bg-surface" />
    </span>
  );
}

export type AppLogoProps = {
  /** The product's mark; the brand square by default. */
  mark?: ReactNode;
  name: string;
  /** The line under the name: the tenant, the workspace, the environment. Hidden with the name below the large breakpoint. */
  secondaryName?: string | undefined;
  /** The router's Link as the child, with no children of its own; the logo fills it. */
  asChild?: boolean | undefined;
  /** A switcher instead of a link: a chevron follows the name. */
  onClick?: (() => void) | undefined;
  className?: string | undefined;
  children?: ReactNode;
};

/** The product's mark and name, in the top nav's start slot. A link home, or a switcher, or plain. */
function AppLogo({
  mark = <Mark />,
  name,
  secondaryName,
  asChild,
  onClick,
  className,
  children,
}: AppLogoProps) {
  const base = cn(
    "flex min-w-0 items-center gap-100 rounded-medium text-left outline-none focus-visible:outline-focused",
    className,
  );
  const names = (
    <span className="hidden min-w-0 flex-col lg:flex">
      <span className="truncate font-body font-medium text-default">{name}</span>
      {secondaryName ? (
        <span className="truncate font-body-small text-subtle">{secondaryName}</span>
      ) : null}
    </span>
  );
  const chevron = onClick ? (
    <ChevronDown className="hidden size-icon-small shrink-0 icon-subtle lg:block" />
  ) : null;
  if (asChild)
    return (
      <Slot className={base}>
        {mark}
        <Slottable>{children}</Slottable>
        {names}
      </Slot>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={base}>
        {mark}
        {names}
        {chevron}
      </button>
    );
  return (
    <span className={base}>
      {mark}
      {names}
    </span>
  );
}

/** Opens the switcher between products. */
function AppSwitcher({
  label = "Switch product",
  onClick,
}: {
  label?: string | undefined;
  onClick?: (() => void) | undefined;
}) {
  return (
    <Tooltip content={label}>
      <IconButton label={label} variant="subtle" onClick={onClick}>
        <LayoutGrid className="size-icon-medium" />
      </IconButton>
    </Tooltip>
  );
}

/** The person: avatar, name, role. In the side nav's footer, or in the top nav's end slot as an avatar alone. */
function Profile({
  avatar,
  name,
  role,
  onClick,
}: {
  avatar: ReactNode;
  name: string;
  role?: string | undefined;
  onClick?: (() => void) | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-100 rounded-medium px-100 py-075 text-left outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered focus-visible:outline-focused"
    >
      {avatar}
      <span className="flex min-w-0 flex-col">
        <span className="block truncate font-body font-medium text-default">{name}</span>
        {role ? <span className="block truncate font-body-small text-subtle">{role}</span> : null}
      </span>
      <ChevronDown className="ms-auto size-icon-small shrink-0 icon-subtle" />
    </button>
  );
}

/* ---------- side nav ---------- */

export type SideNavProps = {
  id?: string | undefined;
  /** The landmark's name. */
  label?: string | undefined;
  /** The width on first render, between the resize bounds. Keep it current from the splitter's onResizeEnd. */
  defaultWidth?: number | undefined;
  onCollapse?: ((args: { trigger: Trigger }) => void) | undefined;
  onExpand?: ((args: { trigger: Trigger }) => void) | undefined;
  className?: string | undefined;
  children: ReactNode;
};

function SideNavRoot({
  id,
  label = "Side navigation",
  defaultWidth,
  onCollapse,
  onExpand,
  className,
  children,
}: SideNavProps) {
  const shell = useShell();
  const skipId = useSkipLink(id, label);
  const { expanded, open, peeking } = shell.sideNav;
  // The first width only; later widths come from the splitter.
  useEffect(() => {
    if (defaultWidth) shell.setSideNavWidth(defaultWidth);
  }, []);
  useEffect(() => {
    shell.listeners.onCollapse = onCollapse;
    shell.listeners.onExpand = onExpand;
  });
  return (
    <>
      {open && !peeking ? (
        <button
          type="button"
          aria-label="Close side navigation"
          onClick={() => shell.closeSideNav("scrim")}
          className="fixed inset-0 z-40 bg-blanket lg:hidden"
        />
      ) : null}
      <nav
        id={skipId}
        tabIndex={-1}
        aria-label={label}
        className={cn(
          "flex-col border-e border-default bg-surface-sunken outline-none",
          open
            ? "shell-sidenav-overlay flex shadow-overlay"
            : cn("hidden", expanded && "lg:shell-sidenav lg:flex"),
          className,
        )}
        onPointerEnter={peeking ? shell.holdPeek : undefined}
        onPointerLeave={peeking ? () => shell.endPeek() : undefined}
      >
        {children}
      </nav>
    </>
  );
}

/** The top of the side nav, fixed: a container switcher, a search, a title. */
function SideNavHeader({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 items-center gap-100 px-150 pt-150">{children}</div>;
}

/** The middle: the sections and items. It scrolls, and it grows to push the footer down. */
function SideNavBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-200 overflow-y-auto px-150 py-150">
      {children}
    </div>
  );
}

/** The bottom of the side nav, fixed: the person, a settings link. */
function SideNavFooter({ children }: { children: ReactNode }) {
  return <div className="shrink-0 border-t border-default p-150">{children}</div>;
}

/** A group of items under an eyebrow. */
function SideNavSection({
  heading,
  children,
}: {
  heading?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div role="group" aria-label={heading} className="flex flex-col gap-025">
      {heading ? <Eyebrow className="px-150 pb-050 pt-100">{heading}</Eyebrow> : null}
      {children}
    </div>
  );
}

export type SideNavItemProps = {
  /** The router's Link as the child; its own children are the label. */
  asChild?: boolean | undefined;
  /** The current page. */
  isActive?: boolean | undefined;
  icon?: ComponentType<{ className?: string | undefined; strokeWidth?: number }> | undefined;
  /** A count or a badge on the right. */
  badge?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"a">, "children" | "className">;

const itemBase =
  "flex h-control-small w-full items-center gap-100 rounded-medium px-150 font-body text-left outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused";
const itemTone = (active: boolean | undefined) =>
  active
    ? "bg-neutral font-medium text-default"
    : "text-subtle hover:bg-neutral-subtle-hovered hover:text-default";
const indent = (depth: number) =>
  depth
    ? { paddingInlineStart: `calc(${token("space.150")} + ${depth} * ${token("space.250")})` }
    : undefined;

/** One destination. A link (asChild around the router's Link, or href), or a button when it only has onClick. */
function SideNavItem({
  asChild,
  isActive,
  icon: Icon,
  badge,
  className,
  children,
  ...rest
}: SideNavItemProps) {
  const depth = useContext(DepthContext);
  const Comp = asChild ? Slot : rest.href === undefined && rest.onClick ? "button" : "a";
  const buttonProps = Comp === "button" ? { type: "button" as const } : {};
  return (
    <Comp
      aria-current={isActive ? "page" : undefined}
      className={cn(itemBase, itemTone(isActive), className)}
      style={indent(depth)}
      {...buttonProps}
      {...(rest as object)}
    >
      {Icon ? (
        <Icon
          className={cn("size-icon-small shrink-0", isActive ? "icon-default" : "icon-subtle")}
          strokeWidth={2}
        />
      ) : null}
      <Slottable>{children}</Slottable>
      {badge ? (
        <span className="ms-auto font-body-xsmall text-subtle tabular-nums">{badge}</span>
      ) : null}
    </Comp>
  );
}

export type SideNavExpandableProps = {
  label: string;
  icon?: ComponentType<{ className?: string | undefined; strokeWidth?: number }> | undefined;
  badge?: ReactNode;
  defaultOpen?: boolean | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Items and further expandables, indented one level. */
  children: ReactNode;
};

/** A row that opens a level of items under it. */
function SideNavExpandable({
  label,
  icon: Icon,
  badge,
  defaultOpen = false,
  open,
  onOpenChange,
  children,
}: SideNavExpandableProps) {
  const depth = useContext(DepthContext);
  const [own, setOwn] = useState(defaultOpen);
  const isOpen = open ?? own;
  const set = (next: boolean) => {
    if (open === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  return (
    <div className="flex flex-col gap-025">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => set(!isOpen)}
        className={cn(itemBase, itemTone(false))}
        style={indent(depth)}
      >
        {Icon ? <Icon className="size-icon-small shrink-0 icon-subtle" strokeWidth={2} /> : null}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {badge ? <span className="font-body-xsmall text-subtle tabular-nums">{badge}</span> : null}
        <ChevronRight
          className={cn(
            "size-icon-small shrink-0 icon-subtle transition-transform duration-fast ease-standard",
            isOpen && "rotate-90",
          )}
        />
      </button>
      {isOpen ? (
        <DepthContext.Provider value={depth + 1}>
          <div className="flex flex-col gap-025">{children}</div>
        </DepthContext.Provider>
      ) : null}
    </div>
  );
}

/** The button that shows and hides the side nav, in the top nav's start slot. Hovering it while the side nav is collapsed flies the side nav out. */
function SideNavToggleButton({
  collapseLabel = "Collapse side navigation",
  expandLabel = "Expand side navigation",
}: {
  collapseLabel?: string | undefined;
  expandLabel?: string | undefined;
}) {
  const shell = useShell();
  const showing = shell.isDesktop ? shell.sideNav.expanded : shell.sideNav.open;
  const label = showing ? collapseLabel : expandLabel;
  const Icon = showing ? PanelLeftClose : PanelLeftOpen;
  return (
    <Tooltip
      content={
        shell.shortcut ? (
          <span className="flex items-center gap-075">
            {label}
            <span className="flex items-center gap-025">
              <Kbd>Ctrl</Kbd>
              <Kbd>[</Kbd>
            </span>
          </span>
        ) : (
          label
        )
      }
    >
      <IconButton
        label={label}
        variant="subtle"
        aria-expanded={showing}
        onClick={() => shell.toggleSideNav("toggle-button")}
        onPointerEnter={shell.peekSideNav}
        onPointerLeave={() => shell.endPeek()}
      >
        <Icon className="size-icon-medium" />
      </IconButton>
    </Tooltip>
  );
}

/* ---------- splitters ---------- */

type SplitterProps = {
  /** The accessible name; the handle is visually blank. */
  label: string;
  onResizeStart?: ((args: { initialWidth: number }) => void) | undefined;
  onResizeEnd?: ((args: { initialWidth: number; finalWidth: number }) => void) | undefined;
};

/** A drag handle on an area's inner edge. `direction` is which way a drag grows the area: 1 for the side nav, -1 for the panel. */
function Splitter({
  label,
  min,
  direction,
  edge,
  setWidth,
  onResizeStart,
  onResizeEnd,
  onDoubleClick,
}: SplitterProps & {
  min: number;
  direction: 1 | -1;
  edge: "start" | "end";
  setWidth: (w: number) => void;
  onDoubleClick?: (() => void) | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; width: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const measure = () => ref.current?.parentElement?.getBoundingClientRect().width ?? min;
  const clamp = (w: number) => Math.round(Math.min(Math.max(w, min), window.innerWidth / 2));

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // A synthetic pointer has no capture.
    }
    drag.current = { x: e.clientX, width: measure() };
    setDragging(true);
    onResizeStart?.({ initialWidth: drag.current.width });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setWidth(clamp(drag.current.width + direction * (e.clientX - drag.current.x)));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const initialWidth = drag.current.width;
    drag.current = null;
    setDragging(false);
    onResizeEnd?.({ initialWidth, finalWidth: measure() });
  };
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" ? 16 : e.key === "ArrowLeft" ? -16 : 0;
    if (!step) return;
    e.preventDefault();
    const initialWidth = measure();
    const finalWidth = clamp(initialWidth + direction * step);
    setWidth(finalWidth);
    onResizeEnd?.({ initialWidth, finalWidth });
  };

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onDoubleClick={onDoubleClick}
      className={cn(
        "absolute inset-y-0 z-10 hidden w-050 cursor-col-resize select-none touch-none outline-none transition-colors duration-fast ease-standard hover:bg-brand-bold focus-visible:bg-brand-bold lg:block",
        edge === "end" ? "end-0" : "start-0",
        dragging && "bg-brand-bold",
      )}
    />
  );
}

/** Makes the side nav resizable. A double-click collapses it. */
function SideNavSplitter(props: SplitterProps) {
  const shell = useShell();
  return (
    <Splitter
      {...props}
      min={SIDENAV_MIN}
      direction={1}
      edge="end"
      setWidth={shell.setSideNavWidth}
      onDoubleClick={() => shell.collapseSideNav("splitter")}
    />
  );
}

const SideNav = Object.assign(SideNavRoot, {
  Header: SideNavHeader,
  Body: SideNavBody,
  Footer: SideNavFooter,
  Section: SideNavSection,
  Item: SideNavItem,
  Expandable: SideNavExpandable,
  ToggleButton: SideNavToggleButton,
  Splitter: SideNavSplitter,
});

/* ---------- main ---------- */

/** The page. It fills what the side nav and the panel leave and uses the body scroll. */
function Main({
  id,
  label = "Main content",
  className,
  children,
}: {
  id?: string | undefined;
  label?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  const skipId = useSkipLink(id, label);
  return (
    <main
      id={skipId}
      tabIndex={-1}
      className={cn("shell-main w-full px-200 py-300 outline-none lg:px-300 lg:py-400", className)}
    >
      {children}
    </main>
  );
}

/* ---------- panel ---------- */

export type ShellPanelProps = {
  id?: string | undefined;
  /** The landmark's name: say what is in it, "Preview" or "Comments", not "Panel". */
  label?: string | undefined;
  /** The width on first render. Keep it current from the splitter's onResizeEnd. */
  defaultWidth?: number | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/** The area beside the page, at the end. Render it when there is something to show and unmount it when there is not; below the large breakpoint it overlays the page. What is in it is the product's: a preview, a thread, a form. */
function PanelRoot({ id, label = "Panel", defaultWidth, className, children }: ShellPanelProps) {
  const shell = useShell();
  const skipId = useSkipLink(id, label);
  // The first width only; later widths come from the splitter.
  useEffect(() => {
    if (defaultWidth) shell.setPanelWidth(defaultWidth);
  }, []);
  return (
    <aside
      id={skipId}
      tabIndex={-1}
      aria-label={label}
      className={cn(
        "shell-panel-overlay flex flex-col overflow-y-auto border-s border-default bg-surface shadow-overlay outline-none lg:shell-panel lg:shadow-none",
        className,
      )}
    >
      {children}
    </aside>
  );
}

/** Makes the panel resizable from its start edge. */
function PanelSplitter(props: SplitterProps) {
  const shell = useShell();
  return (
    <Splitter
      {...props}
      min={PANEL_MIN}
      direction={-1}
      edge="start"
      setWidth={shell.setPanelWidth}
    />
  );
}

const Panel = Object.assign(PanelRoot, { Splitter: PanelSplitter });

/* ---------- export ---------- */

export const Shell = Object.assign(ShellRoot, {
  Banner: BannerArea,
  TopNav,
  SideNav,
  Main,
  Panel,
  AppLogo,
  AppSwitcher,
  Mark,
  Profile,
  /** @deprecated Use Shell.SideNav with Header, Body and Footer. */
  Sidebar: legacy.Sidebar,
  /** @deprecated Use Shell.TopNav with Start, Middle and End. */
  TopBar: legacy.TopBar,
  /** @deprecated Use Shell.AppLogo; `detail` is `secondaryName`. */
  Brand: legacy.Brand,
  /** @deprecated Use Shell.SideNav.Section; `label` is `heading`. */
  NavGroup: legacy.NavGroup,
  /** @deprecated Use Shell.SideNav.Item. */
  NavItem: legacy.NavItem,
  /** @deprecated Use Shell.Profile. */
  User: legacy.User,
});

export type { NavItemProps };
