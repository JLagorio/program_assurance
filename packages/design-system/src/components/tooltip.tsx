import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

type Side = NonNullable<ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>["side"]>;
type Align = NonNullable<ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>["align"]>;

export type TooltipProps = {
  content: ReactNode;
  side?: Side | undefined;
  align?: Align | undefined;
  delay?: number | undefined;
  defaultOpen?: boolean | undefined;
  className?: string | undefined;
  /** The trigger: one element that takes a ref and props (Button, IconButton, a plain element). */
  children: ReactNode;
};

/** A short label on hover or focus. For a peek at a record, HoverCard; for something you act on, Popover. */
export function Tooltip({ content, side = "top", align = "center", delay = 300, defaultOpen = false, className, children }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root defaultOpen={defaultOpen}>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            collisionPadding={8}
            style={{ maxWidth: 260 }}
            className={cn(
              "z-50 rounded-medium bg-neutral-bold px-100 py-050 font-body-small text-inverse shadow-overlay",
              "data-[state=delayed-open]:animate-enter data-[state=instant-open]:animate-enter data-[state=closed]:animate-exit",
              className,
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
