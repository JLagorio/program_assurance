import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRight, Circle, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { IconButton, type IconButtonProps } from "../../components/button";
import { Kbd } from "../../components/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/tooltip";
import { useIsTruncated } from "../../components/truncate";
import { Eyebrow } from "../../components/typography";
import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import {
  mergeRefs,
  ShellContext,
  SIDENAV_MIN,
  slot,
  useShell,
  useSideNavRail,
  useSkipLink,
  type SideNavChange,
} from "./context";
import { Splitter, type ShellSplitterProps } from "./splitter";
import { useSideNavOverlay } from "./use-side-nav-overlay";

/** How deep a side nav item sits under expandable items; each level indents. */
const DepthContext = createContext(0);

/* ---------- icons ---------- */

/** An icon constructor, lucide's shape: the part sizes it, hides it from assistive tech and sets its stroke. */
export type IconComponent = ComponentType<{ className?: string | undefined; strokeWidth?: number }>;
/** A side nav icon: the constructor, or an element the part sizes and hides the same way. */
export type SideNavIcon = IconComponent | ReactElement<{ className?: string | undefined }>;

function navIcon(icon: SideNavIcon | undefined, className: string) {
  if (!icon) return null;
  if (isValidElement<{ className?: string | undefined; "aria-hidden"?: boolean }>(icon))
    return cloneElement(icon, {
      "aria-hidden": true,
      className: cn(className, icon.props.className),
    });
  const Icon = icon as IconComponent;
  return <Icon aria-hidden className={className} strokeWidth={2} />;
}

/* ---------- the phone overlay's focus ---------- */

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** What Tab reaches inside the overlay, in order: drawn, enabled, not inert. */
const tabbables = (nav: HTMLElement) =>
  [...nav.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => el.tabIndex >= 0 && el.getClientRects().length > 0 && !el.closest("[inert]"),
  );

/* ---------- side nav ---------- */

export type SideNavProps = ComponentProps<"nav"> & {
  /** The landmark's name, "Side navigation" by default. */
  label?: string | undefined;
  /** The width while the reader has not resized the side nav, between the resize bounds. It is never remembered: a drag or a key on the splitter is, and outranks it; `persist` does not store it, so a changed default reaches every reader who has not resized. */
  defaultWidth?: number | undefined;
  /** Below the large breakpoint, choosing a link in the side nav closes the overlay and moves focus to Main, so the reader lands on the page they chose. On by default; turn it off for a side nav whose links change the page in place and should stay open (a change of Shell's `locationKey` still closes it). A modified click (a new tab or window) never closes it. */
  closeOnNavigate?: boolean | undefined;
  /** The side nav collapsed, or the phone overlay closed: with its cause, and `isOverlay` for the overlay. Called only when it was showing. */
  onCollapse?: ((args: SideNavChange) => void) | undefined;
  /** The side nav expanded, or the phone overlay opened: with its cause, and `isOverlay` for the overlay. Called only when it was not showing. */
  onExpand?: ((args: SideNavChange) => void) | undefined;
};

/** A click that follows a link in this document: not a new tab, a new window or a download. */
const followsLink = (event: ReactMouseEvent<HTMLElement>) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return false;
  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!link || !event.currentTarget.contains(link)) return false;
  const target = link.getAttribute("target");
  return (!target || target === "_self") && !link.hasAttribute("download");
};

/**
 * The side nav. From the large breakpoint it is a column beside the page, collapsible to the icon
 * rail or hidden. Below it, it is a modal overlay: opening it moves focus to the current page's
 * item (else the first link), Tab and Shift+Tab stay inside it, the rest of the shell is inert,
 * and a close button at the toggle's place, Escape or the blanket close it.
 */
export function SideNavRoot({
  id,
  label,
  defaultWidth,
  closeOnNavigate = true,
  onCollapse,
  onExpand,
  className,
  children,
  ref,
  onClick,
  onPointerEnter,
  onPointerLeave,
  ...props
}: SideNavProps) {
  const shell = useShell();
  const { t } = useLedgerLocale();
  const name = label ?? t("sideNavigation");
  const { expanded, open, peeking, modal } = shell.sideNav;
  const { navRef, scrimRef, present } = useSideNavOverlay(open, shell.isDesktop, expanded);
  const closing = present && !open;
  const rail = useSideNavRail();
  // While the flyout is held open by a popup, a click outside both closes it.
  useEffect(() => {
    if (!peeking) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      // The kit stamps its portals data-slot="…-portal"; a popup inside one is inside the flyout.
      if (!target || navRef.current?.contains(target) || target.closest('[data-slot$="-portal"]'))
        return;
      shell.endPeek(true);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [peeking, shell]);
  // The phone overlay is modal: it takes focus as it opens, on the current page's item or the
  // first link, and Tab wraps inside it. The rest of the shell is inert meanwhile (root.tsx).
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!modal || !nav) return;
    const doc = nav.ownerDocument;
    if (!nav.contains(doc.activeElement)) {
      const current = nav.querySelector<HTMLElement>('[aria-current="page"]');
      const target =
        (current && tabbables(nav).includes(current) ? current : null) ??
        tabbables(nav).find((el) => el.matches("a[href]")) ??
        tabbables(nav)[0] ??
        nav;
      target.focus();
    }
    const shellRoot = nav.closest('[data-slot="shell"]');
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      const active = doc.activeElement;
      // A popup opened from inside the overlay (a menu, or a dialog a menu item opens) keeps its
      // own Tab: it portals out of the shell, whose other areas are inert.
      if (
        active instanceof Element &&
        (active.closest('[data-slot$="-portal"]') ||
          (active !== doc.body && shellRoot && !shellRoot.contains(active)))
      )
        return;
      const items = tabbables(nav);
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;
      const inside = active instanceof Node && nav.contains(active);
      if (!inside || (event.shiftKey ? active === first || active === nav : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    doc.addEventListener("keydown", onKey);
    return () => doc.removeEventListener("keydown", onKey);
  }, [modal, navRef]);
  const skipId = useSkipLink(id, name, "sidenav");
  // The width until the reader resizes, never remembered; a drag or the browser's memory outranks it.
  const inShell = useContext(ShellContext) !== null;
  const { setSideNavDefaultWidth } = shell;
  useLayoutEffect(() => {
    if (!inShell || !defaultWidth) return;
    setSideNavDefaultWidth(Math.max(defaultWidth, SIDENAV_MIN));
    return () => setSideNavDefaultWidth(null);
  }, [inShell, defaultWidth, setSideNavDefaultWidth]);
  // The transitions call these; cleared on unmount, and never written to the detached stand-in.
  useEffect(() => {
    if (!inShell) return;
    shell.listeners.onCollapse = onCollapse;
    shell.listeners.onExpand = onExpand;
    return () => {
      shell.listeners.onCollapse = undefined;
      shell.listeners.onExpand = undefined;
    };
  }, [inShell, shell.listeners, onCollapse, onExpand]);
  const overlay = present && !shell.isDesktop;
  return (
    <>
      {overlay ? (
        // The blanket closes the overlay on a press. It is not a control of its own: the close
        // button inside the overlay and Escape do the same for the keyboard and assistive tech.
        <button
          ref={scrimRef}
          type="button"
          tabIndex={-1}
          aria-hidden
          inert={closing}
          data-overlay={open ? "open" : "closing"}
          onClick={() => shell.closeSideNav("scrim")}
          className="shell-scrim bg-blanket lg:hidden"
        />
      ) : null}
      <nav
        {...props}
        ref={mergeRefs(ref, navRef)}
        id={skipId}
        tabIndex={-1}
        aria-label={name}
        aria-hidden={closing ? true : props["aria-hidden"]}
        inert={closing || props.inert}
        data-shell-area="sidenav"
        data-slot="shell-sidenav"
        data-collapsed={rail && !present ? "icons" : undefined}
        data-overlay={present ? (open ? "open" : "closing") : undefined}
        className={cn(
          "flex-col border-e border-default bg-surface-sunken outline-none",
          present
            ? "shell-sidenav-overlay flex shadow-overlay"
            : cn("hidden", (expanded || rail) && "lg:shell-sidenav lg:flex"),
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          // Router links prevent the default to navigate themselves, so defaultPrevented is no
          // opt-out here; closeOnNavigate is. Focus moves to the page once the overlay has closed.
          if (!closeOnNavigate || shell.isDesktop || !open || !followsLink(event)) return;
          shell.closeSideNav("navigation");
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (peeking) shell.holdPeek();
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);
          if (!peeking) return;
          // A popup open from inside the flyout holds it (Base UI marks its trigger
          // data-popup-open); the next click outside closes it.
          if (navRef.current?.querySelector("[data-popup-open]")) shell.holdPeek();
          else shell.endPeek();
        }}
      >
        {overlay ? (
          // The overlay covers the toggle that opened it, so its own close takes the toggle's place.
          <div
            data-slot="shell-sidenav-close-row"
            className="flex h-layout-topnav shrink-0 items-center px-150"
          >
            <IconButton
              data-slot="shell-sidenav-close"
              label={t("closeSideNavigation")}
              variant="subtle"
              icon={<PanelLeftClose />}
              onClick={() => shell.closeSideNav("toggle-button")}
            />
          </div>
        ) : null}
        {children}
      </nav>
    </>
  );
}

export type SideNavHeaderProps = ComponentProps<"div">;
export type SideNavBodyProps = ComponentProps<"div">;
export type SideNavFooterProps = ComponentProps<"div">;
/** @deprecated Use SideNavHeaderProps, SideNavBodyProps or SideNavFooterProps. */
export type SideNavSlotProps = ComponentProps<"div">;

/** The top of the side nav, fixed: a container switcher, a search, a title. */
export function SideNavHeader({ className, ...props }: SideNavHeaderProps) {
  return (
    <div
      {...props}
      data-slot="shell-sidenav-header"
      className={cn("flex shrink-0 items-center gap-100 px-150 pt-150", className)}
    />
  );
}

/** The middle: the sections and items. It scrolls, and it grows to push the footer down. */
export function SideNavBody({ className, ...props }: SideNavBodyProps) {
  return (
    <div
      {...props}
      data-slot="shell-sidenav-body"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-200 overflow-y-auto overscroll-none px-150 py-150",
        className,
      )}
    />
  );
}

/** The bottom of the side nav, fixed: the person, a settings link. */
export function SideNavFooter({ className, ...props }: SideNavFooterProps) {
  return (
    <div
      {...props}
      data-slot="shell-sidenav-footer"
      className={cn("shrink-0 border-t border-default p-150", className)}
    />
  );
}

export type SideNavSectionProps = ComponentProps<"div"> & {
  /** An Eyebrow over the items, and the group's name. */
  heading?: string | undefined;
};

/** A group of items under an eyebrow. */
export function SideNavSection({ heading, className, children, ...props }: SideNavSectionProps) {
  const headingId = useId();
  return (
    <div
      {...props}
      role="group"
      aria-labelledby={heading ? headingId : undefined}
      data-slot="shell-sidenav-section"
      className={cn("flex flex-col gap-025", className)}
    >
      {heading ? (
        <div data-slot="shell-sidenav-heading" className="px-150 pb-050 pt-100">
          <Eyebrow id={headingId}>{heading}</Eyebrow>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export type SideNavItemProps = useRender.ComponentProps<"a"> & {
  /** The current page. */
  isActive?: boolean | undefined;
  icon?: SideNavIcon | undefined;
  /** A count or a badge on the right. In the icon rail it stays in the item's name, and a dot on the icon says it is there. */
  badge?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
};

/* The focus ring sits flush on the item's edge (shell.css takes the offset away), inside the 2px
   gap between items, so it is drawn on the side nav's surface and never over a neighbour's fill. */
const itemBase =
  "flex h-control-small w-full items-center gap-100 rounded-medium px-150 font-body text-start outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused";
/* The current page takes the selected fill and colour, distinct from hover's neutral tint. */
const itemTone = (active: boolean | undefined) =>
  active
    ? "bg-selected font-medium text-selected hover:bg-selected-hovered"
    : "text-subtle hover:bg-neutral-subtle-hovered hover:text-default";
const iconTone = (active: boolean | undefined) => (active ? "icon-selected" : "icon-subtle");
const indent = (depth: number) =>
  depth
    ? { paddingInlineStart: `calc(${token("space.150")} + ${depth} * ${token("space.250")})` }
    : undefined;

/** A native anchor. Use render for a router link or an explicit button action. Its name shows in a tooltip in the icon rail, and wherever the side nav's width cuts it. */
export function SideNavItem({
  render,
  ref,
  isActive,
  icon,
  badge,
  className,
  children,
  ...props
}: SideNavItemProps) {
  const depth = useContext(DepthContext);
  const shell = useShell();
  const rail = useSideNavRail();
  const labelRef = useRef<HTMLSpanElement>(null);
  const cut = useIsTruncated(labelRef, { enabled: !rail });
  const element = useRender({
    defaultTagName: "a",
    render,
    ref,
    state: { slot: "side-nav-item" },
    props: mergeProps<"a">(props, {
      ...slot("shell-sidenav-item"),
      "aria-current": isActive ? "page" : undefined,
      className: cn(itemBase, itemTone(isActive), className),
      style: indent(depth),
      children: (
        <>
          {navIcon(
            icon ?? (shell.collapsedSideNav === "icons" ? Circle : undefined),
            cn("size-icon-small shrink-0", iconTone(isActive)),
          )}
          <span ref={labelRef} data-slot="shell-sidenav-label" className="min-w-0 truncate">
            {children}
          </span>
          {badge ? (
            <span
              data-slot="shell-sidenav-badge"
              className="ms-auto font-body-xsmall text-subtle tabular-nums"
            >
              {badge}
            </span>
          ) : null}
        </>
      ),
    }),
  });
  return (
    <Tooltip disabled={!rail && !cut}>
      <TooltipTrigger render={element} />
      <TooltipContent side="inline-end">{children}</TooltipContent>
    </Tooltip>
  );
}

export type SideNavExpandableProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  icon?: SideNavIcon | undefined;
  badge?: ReactNode | undefined;
  /** Open on first render. By default the group starts open when it holds the current page (`isActive`). */
  defaultOpen?: boolean | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** The group holds the current page. Its row takes the current page's colour wherever the item itself is out of view: while the group is closed and in the icon rail. */
  isActive?: boolean | undefined;
  /** Items and further expandables, indented one level. */
  children: ReactNode;
};

/** A row that opens a level of items under it. The native props and the ref go to the row's button. */
export function SideNavExpandable({
  label,
  icon,
  badge,
  defaultOpen,
  open,
  onOpenChange,
  isActive,
  className,
  onClick,
  children,
  ...props
}: SideNavExpandableProps) {
  const depth = useContext(DepthContext);
  const shell = useShell();
  const rail = useSideNavRail();
  const levelId = useId();
  const labelRef = useRef<HTMLSpanElement>(null);
  const cut = useIsTruncated(labelRef, { enabled: !rail });
  const [own, setOwn] = useState(defaultOpen ?? Boolean(isActive));
  const isOpen = open ?? own;
  // The current page is out of view: the group is closed, or the rail hides its items.
  const holdsHidden = Boolean(isActive) && (rail || !isOpen);
  const set = (next: boolean) => {
    if (open === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  return (
    <div data-slot="shell-sidenav-expandable" className="flex flex-col gap-025">
      <Tooltip disabled={!rail && !cut}>
        <TooltipTrigger
          render={
            <button
              {...props}
              type="button"
              data-slot="shell-sidenav-expandable-trigger"
              data-active={isActive ? "" : undefined}
              data-current={holdsHidden ? "" : undefined}
              aria-expanded={isOpen && !rail}
              aria-controls={isOpen && !rail ? levelId : undefined}
              onClick={(event) => {
                onClick?.(event);
                if (event.defaultPrevented) return;
                if (rail) {
                  shell.expandSideNav();
                  set(true);
                } else set(!isOpen);
              }}
              className={cn(itemBase, itemTone(holdsHidden), className)}
              style={indent(depth)}
            >
              {navIcon(
                icon ?? (shell.collapsedSideNav === "icons" ? Circle : undefined),
                cn("size-icon-small shrink-0", iconTone(holdsHidden)),
              )}
              <span
                ref={labelRef}
                data-slot="shell-sidenav-label"
                className="min-w-0 flex-1 truncate"
              >
                {label}
              </span>
              {badge ? (
                <span
                  data-slot="shell-sidenav-badge"
                  className="font-body-xsmall text-subtle tabular-nums"
                >
                  {badge}
                </span>
              ) : null}
              <ChevronRight
                aria-hidden
                data-slot="shell-sidenav-chevron"
                className={cn(
                  "size-icon-small shrink-0 icon-subtle transition-transform duration-fast ease-standard",
                  isOpen ? "rotate-90" : "rtl:rotate-180",
                )}
              />
            </button>
          }
        />
        <TooltipContent side="inline-end">{label}</TooltipContent>
      </Tooltip>
      {isOpen ? (
        <DepthContext.Provider value={depth + 1}>
          <div id={levelId} data-slot="shell-sidenav-level" className="flex flex-col gap-025">
            {children}
          </div>
        </DepthContext.Provider>
      ) : null}
    </div>
  );
}

export type SideNavToggleButtonProps = Omit<IconButtonProps, "icon" | "label"> & {
  /** The button's name while the side nav shows. */
  collapseLabel?: string | undefined;
  /** The button's name while it is hidden. */
  expandLabel?: string | undefined;
};

/** The button that shows and hides the side nav, a child of the top nav's start slot. While the side nav is inline it moves to the slot's end; hovering it while the side nav is collapsed flies the side nav out. */
export function SideNavToggleButton({
  collapseLabel,
  expandLabel,
  variant = "subtle",
  ref,
  onClick,
  onPointerEnter,
  onPointerLeave,
  ...props
}: SideNavToggleButtonProps) {
  const shell = useShell();
  const { t } = useLedgerLocale();
  const showing = shell.isDesktop ? shell.sideNav.expanded : shell.sideNav.open;
  const label = showing
    ? (collapseLabel ?? t("collapseSideNavigation"))
    : (expandLabel ?? t("expandSideNavigation"));
  const Icon = showing ? PanelLeftClose : PanelLeftOpen;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <IconButton
            {...props}
            ref={mergeRefs(ref, shell.toggle)}
            data-slot="shell-sidenav-toggle"
            label={label}
            variant={variant}
            aria-expanded={showing}
            onClick={(event) => {
              onClick?.(event);
              if (!event.defaultPrevented) shell.toggleSideNav("toggle-button");
            }}
            onPointerEnter={(event) => {
              onPointerEnter?.(event);
              shell.peekSideNav();
            }}
            onPointerLeave={(event) => {
              onPointerLeave?.(event);
              shell.endPeek();
            }}
            icon={<Icon />}
            isTooltipDisabled
          />
        }
      />
      <TooltipContent>
        {label}
        {shell.shortcut ? (
          <span className="flex items-center gap-025">
            <Kbd>Ctrl</Kbd>
            <Kbd>[</Kbd>
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

/** Makes the side nav resizable. A double-click collapses it. */
export function SideNavSplitter({ label, ...props }: ShellSplitterProps) {
  const shell = useShell();
  const { t } = useLedgerLocale();
  return (
    <Splitter
      {...props}
      label={label ?? t("resizeSideNavigation")}
      min={SIDENAV_MIN}
      direction={1}
      edge="end"
      setWidth={shell.setSideNavWidth}
      onDoubleClick={() => shell.collapseSideNav("splitter")}
    />
  );
}

export const SideNav = Object.assign(SideNavRoot, {
  Header: SideNavHeader,
  Body: SideNavBody,
  Footer: SideNavFooter,
  Section: SideNavSection,
  Item: SideNavItem,
  Expandable: SideNavExpandable,
  ToggleButton: SideNavToggleButton,
  Splitter: SideNavSplitter,
});
