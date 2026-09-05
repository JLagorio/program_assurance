import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";
import { menuMotion } from "./menu";

type Side = NonNullable<ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>["side"]>;
type Align = NonNullable<ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>["align"]>;

export type PopoverProps = {
  /** One focusable element that takes a ref and props, usually a Button or an IconButton. It carries the aria. */
  trigger: ReactNode;
  /** The dialog's accessible name: what the task is ("Filters", "Choose a date"). */
  label?: string | undefined;
  /** Which side of the trigger; it flips when there is no room. `bottom` by default. */
  side?: Side | undefined;
  /** `start` by default: the surface's edge flush with the trigger's. */
  align?: Align | undefined;
  /** The surface's width in pixels. Unset, it is as wide as its content. */
  width?: number | undefined;
  /** The surface as wide as its trigger: a list under a field. */
  matchTriggerWidth?: boolean | undefined;
  /** Starts open. For a story. */
  defaultOpen?: boolean | undefined;
  /** Owned from outside, with `onOpenChange`: a popover that closes when its task is done. */
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
  /** The task: a small form, a list of checkboxes, a picker. Anything larger is a Sheet. */
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
