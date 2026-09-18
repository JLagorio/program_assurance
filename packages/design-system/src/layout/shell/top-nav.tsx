import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDown, LayoutGrid } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { IconButton, type IconButtonProps } from "../../components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/tooltip";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { slot, useShell, useSideNavRail, useSkipLink } from "./context";

/* ---------- top nav ---------- */

export type ShellTopNavProps = ComponentProps<"header"> & {
  /** The landmark's name, "Top navigation" by default. */
  label?: string | undefined;
};

export type ShellTopNavStartProps = ComponentProps<"div"> & {
  /** The SideNav.ToggleButton. A ToggleButton child places itself the same way; this is the older spelling. */
  toggle?: ReactNode | undefined;
};

export type ShellTopNavMiddleProps = ComponentProps<"div">;

export type ShellTopNavEndProps = ComponentProps<"div"> & {
  /** The group's name, "Actions" by default. */
  label?: string | undefined;
};

export function TopNavRoot({ id, label, className, children, ...props }: ShellTopNavProps) {
  const { t } = useLedgerLocale();
  const name = label ?? t("topNavigation");
  const skipId = useSkipLink(id, name);
  return (
    <header
      {...props}
      id={skipId}
      tabIndex={-1}
      aria-label={name}
      data-slot="shell-topnav"
      className={cn(
        "shell-topnav flex items-stretch border-b border-default bg-surface outline-none",
        className,
      )}
    >
      {children}
    </header>
  );
}

/** The start slot: the toggle, the app switcher and the logo. While the side nav is expanded it takes the side nav's width and surface, so the logo heads that column, and the toggle moves to its end. */
export function TopNavStart({ toggle, className, children, ...props }: ShellTopNavStartProps) {
  const { isDesktop, sideNav } = useShell();
  const inline = isDesktop && sideNav.expanded;
  const rail = useSideNavRail();
  return (
    <div
      {...props}
      data-shell-slot="start"
      data-slot="shell-topnav-start"
      data-collapsed={rail ? "icons" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-100 px-150",
        inline && "lg:shell-topnav-start lg:border-e lg:border-default lg:bg-surface-sunken",
        className,
      )}
    >
      {toggle}
      {children}
    </div>
  );
}

/** The middle slot: the search first, then the create action. Centred while the side nav is collapsed. */
export function TopNavMiddle({ className, children, ...props }: ShellTopNavMiddleProps) {
  const { isDesktop, sideNav } = useShell();
  return (
    <div
      {...props}
      data-slot="shell-topnav-middle"
      className={cn(
        "flex min-w-0 flex-1 items-center gap-100 px-200",
        isDesktop && sideNav.expanded ? "justify-start" : "justify-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The end slot: a group of actions, right-aligned. The children render as given, with no list wrapped around them, so a component that returns several buttons is several buttons. A product that needs them to fold on a phone renders its own menu there. */
export function TopNavEnd({ label, className, children, ...props }: ShellTopNavEndProps) {
  const { t } = useLedgerLocale();
  return (
    <div
      {...props}
      role="group"
      aria-label={label ?? t("actions")}
      data-slot="shell-topnav-end"
      className={cn("flex shrink-0 items-center gap-050 px-150", className)}
    >
      {children}
    </div>
  );
}

export const TopNav = Object.assign(TopNavRoot, {
  Start: TopNavStart,
  Middle: TopNavMiddle,
  End: TopNavEnd,
});

/* ---------- top nav items ---------- */

export type ShellMarkProps = ComponentProps<"span">;

/** The default mark: a brand square. */
export function Mark({ className, ...props }: ShellMarkProps) {
  return (
    <span
      {...props}
      data-slot="shell-mark"
      className={cn(
        "flex size-300 shrink-0 items-center justify-center rounded-small bg-brand-bold",
        className,
      )}
    >
      <span className="block size-100 rounded-xsmall bg-surface" />
    </span>
  );
}

export type AppLogoProps = useRender.ComponentProps<"span"> & {
  /** The product's mark; the brand square by default. */
  mark?: ReactNode | undefined;
  name: string;
  /** The tenant, workspace or environment. Hidden with the name below the large breakpoint. */
  secondaryName?: string | undefined;
};

/** The product identity. Use render={<Link />} for home or render={<button />} for a switcher. */
export function AppLogo({
  mark = <Mark />,
  name,
  secondaryName,
  render,
  ref,
  className,
  children,
  ...props
}: AppLogoProps) {
  return useRender({
    defaultTagName: "span",
    render,
    ref,
    state: { slot: "app-logo" },
    props: mergeProps<"span">(props, {
      ...slot("shell-app-logo"),
      "aria-label": name,
      className: cn(
        "flex min-w-0 items-center gap-100 rounded-medium text-left outline-none focus-visible:outline-focused",
        className,
      ),
      children: (
        <>
          {mark}
          <span className="hidden min-w-0 flex-col lg:flex">
            <span className="truncate font-body font-medium text-default">{name}</span>
            {secondaryName ? (
              <span className="truncate font-body-small text-subtle">{secondaryName}</span>
            ) : null}
          </span>
          {children}
        </>
      ),
    }),
  });
}

export type AppSwitcherProps = Omit<IconButtonProps, "icon" | "label"> & {
  /** The button's name, "Switch product" by default. */
  label?: string | undefined;
};

/** Opens the switcher between products. An IconButton: give it `onClick`, or make it a menu's trigger. */
export function AppSwitcher({ label, variant = "subtle", ...props }: AppSwitcherProps) {
  const { t } = useLedgerLocale();
  return (
    <IconButton
      {...props}
      data-slot="shell-app-switcher"
      label={label ?? t("switchProduct")}
      variant={variant}
      icon={<LayoutGrid />}
    />
  );
}

export type ProfileProps = useRender.ComponentProps<"button"> & {
  /** An Avatar, small. */
  avatar: ReactNode;
  name: string;
  /** Under the name, subtle: the job title, the team. */
  description?: string | undefined;
  /** @deprecated The person's job title, not the ARIA role: use `description`. */
  role?: string | undefined;
};

/** The person: avatar, name, description. In the side nav's footer. A button that opens the account menu with `onClick`, or a menu's trigger through `render`; a label without either. */
export function Profile({
  avatar,
  name,
  description,
  role,
  render,
  ref,
  className,
  onClick,
  ...props
}: ProfileProps) {
  const interactive = Boolean(onClick || render);
  const detail = description ?? role;
  const rail = useSideNavRail();
  const element = useRender({
    defaultTagName: interactive ? "button" : "div",
    render,
    ref,
    state: { slot: "profile" },
    props: mergeProps<"button">(props, {
      ...slot("shell-profile"),
      type: interactive ? "button" : undefined,
      onClick,
      className: cn(
        "flex w-full items-center gap-100 rounded-medium px-100 py-075 text-left",
        interactive &&
          "outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered focus-visible:outline-focused",
        className,
      ),
      children: (
        <>
          {avatar}
          <span data-slot="shell-profile-label" className="flex min-w-0 flex-col">
            <span className="block truncate font-body font-medium text-default">{name}</span>
            {detail ? (
              <span className="block truncate font-body-small text-subtle">{detail}</span>
            ) : null}
          </span>
          {interactive ? (
            <ChevronDown
              aria-hidden
              data-slot="shell-sidenav-chevron"
              className="ms-auto size-icon-small shrink-0 icon-subtle"
            />
          ) : null}
        </>
      ),
    }),
  });
  return (
    <Tooltip disabled={!rail || !interactive}>
      <TooltipTrigger render={element} />
      <TooltipContent side="inline-end">{name}</TooltipContent>
    </Tooltip>
  );
}
