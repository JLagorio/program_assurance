import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Side = NonNullable<ComponentProps<typeof HoverCardPrimitive.Content>["side"]>;
type Align = NonNullable<ComponentProps<typeof HoverCardPrimitive.Content>["align"]>;

/* A peek at a record from its id or name: a few facts, no actions. Opens on
   hover after a short delay and on focus; the child is the trigger and must
   take a ref and spread its props (an element, or a component that does).
   For a label alone, Tooltip; for something you act on, Popover. */
export function HoverCard({
  content,
  side = "bottom",
  align = "start",
  width = 280,
  delay = 400,
  defaultOpen = false,
  className,
  children,
}: {
  content: ReactNode;
  side?: Side;
  align?: Align;
  width?: number;
  delay?: number;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <HoverCardPrimitive.Root openDelay={delay} closeDelay={120} defaultOpen={defaultOpen}>
      <HoverCardPrimitive.Trigger asChild>{children}</HoverCardPrimitive.Trigger>
      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          style={{ width }}
          className={cn(
            "z-50 rounded-lg border border-border bg-popover p-3 text-13 text-popover-foreground shadow-pop outline-none",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            className,
          )}
        >
          {content}
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}
