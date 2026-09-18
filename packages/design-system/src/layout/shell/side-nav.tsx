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
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";

import { IconButton, type IconButtonProps } from "../../components/button";
import { Kbd } from "../../components/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/tooltip";
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
  type SideNavTrigger,
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

/* ---------- side nav ---------- */

export type SideNavProps = ComponentProps<"nav"> & {
  /** The landmark's name, "Side navigation" by default. */
  label?: string | undefined;
  /** The width on first render, between the resize bounds, while nothing has been dragged or remembered. */
  defaultWidth?: number | undefined;
  onCollapse?: ((args: { trigger: SideNavTrigger }) => void) | undefined;
  onExpand?: ((args: { trigger: SideNavTrigger }) => void) | undefined;
};

export function SideNavRoot({
  id,
  label,
  defaultWidth,
  onCollapse,
  onExpand,
  className,
  children,
  ref,
  onPointerEnter,
  onPointerLeave,
  ...props
}: SideNavProps) {
  const shell = useShell();
  const { t } = useLedgerLocale();
  const name = label ?? t("sideNavigation");
  const { expanded, open, peeking } = shell.sideNav;
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
  const skipId = useSkipLink(id, name);
  // The first width only, and only while nothing is set: a drag or the browser's memory outranks it.
  useLayoutEffect(() => {
    if (defaultWidth && shell.sideNav.width == null) shell.setSideNavWidth(defaultWidth);
  }, [defaultWidth, shell.sideNav.width, shell.setSideNavWidth]);
  // The transitions call these; cleared on unmount, and never written to the detached stand-in.
  const inShell = useContext(ShellContext) !== null;
  useEffect(() => {
    if (!inShell) return;
    shell.listeners.onCollapse = onCollapse;
    shell.listeners.onExpand = onExpand;
    return () => {
      shell.listeners.onCollapse = undefined;
      shell.listeners.onExpand = undefined;
    };
  }, [inShell, shell.listeners, onCollapse, onExpand]);
  return (
    <>
      {present && !shell.isDesktop ? (
        <button
          ref={scrimRef}
          type="button"
          aria-label={t("closeSideNavigation")}
          aria-hidden={closing || undefined}
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
  /** A count or a badge on the right. */
  badge?: ReactNode | undefined;
  children: ReactNode;
  className?: string | undefined;
};

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

/** A native anchor. Use render for a router link or an explicit button action. */
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
            cn("size-icon-small shrink-0", isActive ? "icon-default" : "icon-subtle"),
          )}
          <span data-slot="shell-sidenav-label" className="min-w-0 truncate">
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
    <Tooltip disabled={!rail}>
      <TooltipTrigger render={element} />
      <TooltipContent side="inline-end">{children}</TooltipContent>
    </Tooltip>
  );
}

export type SideNavExpandableProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  icon?: SideNavIcon | undefined;
  badge?: ReactNode | undefined;
  defaultOpen?: boolean | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** Items and further expandables, indented one level. */
  children: ReactNode;
};

/** A row that opens a level of items under it. The native props and the ref go to the row's button. */
export function SideNavExpandable({
  label,
  icon,
  badge,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
  onClick,
  children,
  ...props
}: SideNavExpandableProps) {
  const depth = useContext(DepthContext);
  const shell = useShell();
  const rail = useSideNavRail();
  const levelId = useId();
  const [own, setOwn] = useState(defaultOpen);
  const isOpen = open ?? own;
  const set = (next: boolean) => {
    if (open === undefined) setOwn(next);
    onOpenChange?.(next);
  };
  return (
    <div data-slot="shell-sidenav-expandable" className="flex flex-col gap-025">
      <Tooltip disabled={!rail}>
        <TooltipTrigger
          render={
            <button
              {...props}
              type="button"
              data-slot="shell-sidenav-expandable-trigger"
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
              className={cn(itemBase, itemTone(false), className)}
              style={indent(depth)}
            >
              {navIcon(
                icon ?? (shell.collapsedSideNav === "icons" ? Circle : undefined),
                "size-icon-small shrink-0 icon-subtle",
              )}
              <span data-slot="shell-sidenav-label" className="min-w-0 flex-1 truncate">
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
                  isOpen && "rotate-90",
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
