import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Side = NonNullable<ComponentProps<typeof TooltipPrimitive.Content>["side"]>;
type Align = NonNullable<ComponentProps<typeof TooltipPrimitive.Content>["align"]>;

/* A short label on hover or focus. The child is the trigger: one element that
   takes a ref and props (Button, IconButton, a plain element). */
export function Tooltip({
  content,
  side = "top",
  align = "center",
  delay = 300,
  defaultOpen = false,
  className,
  children,
}: {
  content: ReactNode;
  side?: Side;
  align?: Align;
  delay?: number;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
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
            className={cn(
              "z-50 max-w-[260px] rounded-md bg-foreground px-2 py-1 text-12 leading-snug text-background shadow-pop",
              "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
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
