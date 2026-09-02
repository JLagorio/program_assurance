import { Slot, Slottable } from "@radix-ui/react-slot";
import { ChevronDown } from "lucide-react";
import type { ComponentPropsWithoutRef, ComponentType, ReactNode } from "react";

import { Eyebrow } from "../components/typography";
import { cn } from "../lib/cn";

/*
 * The application frame: a sidebar of objects and queues, a top bar, the page. The package owns
 * the frame and the look of a nav item; the product owns the nav data and the router, so a
 * NavItem is `asChild` around the router's Link and `isActive` is the product's call. With
 * asChild the Link's own children become the label; Slottable keeps the icon and badge beside it.
 */

function ShellRoot({ sidebar, topBar, children }: { sidebar?: ReactNode; topBar?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface text-default">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {topBar}
        <main className="w-full flex-1 px-200 py-300 lg:px-300 lg:py-400">{children}</main>
      </div>
    </div>
  );
}

/** The sidebar: a brand row, the nav, a footer row. Hidden below the large breakpoint. */
function Sidebar({ brand, footer, children }: { brand?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-layout-sidebar shrink-0 flex-col border-e border-default bg-surface-sunken lg:flex">
      {brand ? <div className="flex h-layout-topbar items-center gap-150 px-200">{brand}</div> : null}
      <nav className="flex flex-1 flex-col gap-200 overflow-y-auto px-150 pb-200">{children}</nav>
      {footer ? <div className="border-t border-default p-150">{footer}</div> : null}
    </aside>
  );
}

/** The brand row: a mark, a name, a line under it, a chevron for the switcher. */
function Brand({ mark, name, detail, onClick }: { mark: ReactNode; name: string; detail?: string | undefined; onClick?: (() => void) | undefined }) {
  const inner = (
    <>
      {mark}
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-body font-medium text-default">{name}</span>
        {detail ? <span className="truncate font-body-small text-subtle">{detail}</span> : null}
      </span>
      {onClick ? <ChevronDown className="ms-auto size-icon-small icon-subtle" /> : null}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-150 rounded-medium text-left outline-none focus-visible:outline-focused">
      {inner}
    </button>
  ) : (
    <span className="flex w-full items-center gap-150">{inner}</span>
  );
}

/** The default mark: a brand square. */
function Mark() {
  return (
    <span className="flex size-300 shrink-0 items-center justify-center rounded-small bg-brand-bold">
      <span className="block size-100 rounded-xsmall bg-surface" />
    </span>
  );
}

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-025">
      <Eyebrow className="px-150 pb-050 pt-100">{label}</Eyebrow>
      {children}
    </div>
  );
}

export type NavItemProps = {
  asChild?: boolean | undefined;
  isActive?: boolean | undefined;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }> | undefined;
  /** A count on the right. */
  badge?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"a">, "children" | "className">;

function NavItem({ asChild, isActive, icon: Icon, badge, className, children, ...rest }: NavItemProps) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-control-small items-center gap-100 rounded-medium px-150 font-body outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused",
        isActive ? "bg-neutral font-medium text-default" : "text-subtle hover:bg-neutral-subtle-hovered hover:text-default",
        className,
      )}
      {...rest}
    >
      {Icon ? <Icon className={cn("size-icon-small shrink-0", isActive ? "icon-default" : "icon-subtle")} strokeWidth={2} /> : null}
      <Slottable>{children}</Slottable>
      {badge ? <span className="ms-auto font-body-xsmall text-subtle tabular-nums">{badge}</span> : null}
    </Comp>
  );
}

/** The person row at the foot of the sidebar. */
function User({ avatar, name, role, onClick }: { avatar: ReactNode; name: string; role?: string | undefined; onClick?: (() => void) | undefined }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-100 rounded-medium px-100 py-075 text-left outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered focus-visible:outline-focused">
      {avatar}
      <span className="flex min-w-0 flex-col">
        <span className="block truncate font-body font-medium text-default">{name}</span>
        {role ? <span className="block truncate font-body-small text-subtle">{role}</span> : null}
      </span>
      <ChevronDown className="ms-auto size-icon-small shrink-0 icon-subtle" />
    </button>
  );
}

/** The top bar: search on the left, actions on the right, sticky. */
function TopBar({ children, actions }: { children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-layout-topbar shrink-0 items-center gap-150 border-b border-default bg-surface px-200 lg:px-300">
      {children}
      {actions ? <div className="ms-auto flex items-center gap-050">{actions}</div> : null}
    </header>
  );
}

export const Shell = Object.assign(ShellRoot, { Sidebar, Brand, Mark, NavGroup, NavItem, User, TopBar });
