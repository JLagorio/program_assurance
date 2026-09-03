import { Slot, Slottable } from "@radix-ui/react-slot";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

/*
 * An underline tab strip. Tabs is the rail (role tablist, rule underneath); Tabs.Tab is one tab.
 * A tab is a button unless `asChild`, in which case the child (a router's Link) takes the tab's
 * classes and aria. Which tab is selected is the caller's state, because in this product tabs are
 * routes more often than in-page panels.
 */

export type TabsProps = {
  /** The tablist's accessible name. */
  label?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className">;

function TabsRoot({ label, className, children, ...rest }: TabsProps) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex items-center gap-300 overflow-x-auto border-b border-default", className)} {...rest}>
      {children}
    </div>
  );
}

export type TabProps = {
  isSelected?: boolean | undefined;
  asChild?: boolean | undefined;
  disabled?: boolean | undefined;
  /** A Count or a Badge after the label. */
  trailing?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "className" | "disabled">;

function Tab({ isSelected, asChild, disabled, trailing, className, children, type, ...rest }: TabProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      role="tab"
      aria-selected={isSelected ? true : false}
      aria-disabled={disabled ? true : undefined}
      disabled={asChild ? undefined : disabled}
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "relative inline-flex h-control-medium shrink-0 items-center gap-075 whitespace-nowrap px-050 font-body font-medium outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused",
        "after:absolute after:inset-x-0 after:-bottom-px after:h-025 after:rounded-full",
        isSelected ? "text-default after:bg-brand-bold" : "text-subtle hover:text-default",
        disabled && "pointer-events-none text-disabled",
        className,
      )}
      {...rest}
    >
      <Slottable>{children}</Slottable>
      {trailing}
    </Comp>
  );
}

export const Tabs = Object.assign(TabsRoot, { Tab });
