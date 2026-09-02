import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Side = NonNullable<ComponentProps<typeof PopoverPrimitive.Content>["side"]>;
type Align = NonNullable<ComponentProps<typeof PopoverPrimitive.Content>["align"]>;

/* An anchored surface for a small task: a filter form, a picker, a confirmation.
   The trigger is one element; the popover opens on click and closes on Escape,
   an outside click, or Popover.Close. Uncontrolled unless `open` is passed. */
function PopoverRoot({
  trigger,
  side = "bottom",
  align = "start",
  width,
  defaultOpen = false,
  open,
  onOpenChange,
  className,
  children,
}: {
  trigger: ReactNode;
  side?: Side;
  align?: Align;
  width?: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}) {
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
          style={width ? { width } : undefined}
          className={cn(
            "z-50 rounded-lg border border-border bg-popover p-3 text-13 text-popover-foreground shadow-pop outline-none",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            className,
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* Closes the popover it sits in. Wraps one element, usually a Button. */
function PopoverClose({ children }: { children: ReactNode }) {
  return <PopoverPrimitive.Close asChild>{children}</PopoverPrimitive.Close>;
}

export const Popover = Object.assign(PopoverRoot, { Close: PopoverClose });
