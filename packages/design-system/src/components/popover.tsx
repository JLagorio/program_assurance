import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";
import { menuMotion } from "./menu";

type Side = NonNullable<ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>["side"]>;
type Align = NonNullable<ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>["align"]>;

export type PopoverProps = {
  trigger: ReactNode;
  /** The dialog's accessible name: what the task is ("Filters", "Choose a date"). */
  label?: string | undefined;
  side?: Side | undefined;
  align?: Align | undefined;
  /** The surface's width in pixels. */
  width?: number | undefined;
  /** The surface as wide as its trigger: a list under a field. */
  matchTriggerWidth?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/** An anchored surface for a small task: a filter form, a picker, a confirmation. Closes on Escape, an outside click, or Popover.Close. */
function PopoverRoot({
  trigger,
  label,
  side = "bottom",
  align = "start",
  width,
  matchTriggerWidth = false,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
  children,
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root
      {...(open === undefined ? { defaultOpen } : { open })}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={side}
          align={align}
          sideOffset={4}
          collisionPadding={8}
          aria-label={label}
          style={
            width
              ? { width }
              : matchTriggerWidth
                ? { width: "var(--radix-popover-trigger-width)" }
                : undefined
          }
          className={cn(
            "z-50 rounded-large border border-default bg-surface-overlay p-150 font-body text-default shadow-overlay outline-none",
            menuMotion,
            className,
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/** Closes the popover it sits in. Wraps one element, usually a Button. */
function PopoverClose({ children }: { children: ReactNode }) {
  return <PopoverPrimitive.Close asChild>{children}</PopoverPrimitive.Close>;
}

export const Popover = Object.assign(PopoverRoot, { Close: PopoverClose });
