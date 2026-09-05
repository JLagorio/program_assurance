import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createContext, useContext, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cn } from "../lib/cn";

type Side = NonNullable<ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>["side"]>;
type Align = NonNullable<ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>["align"]>;

const SharedProvider = createContext(false);

/**
 * One provider for a whole app, so moving from one tooltipped control to the next shows the next
 * tooltip at once instead of waiting the delay again. The Shell mounts it; a product without the
 * Shell mounts it at its root. A Tooltip with no provider above makes its own.
 */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <SharedProvider.Provider value={true}>
      <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={300}>
        {children}
      </TooltipPrimitive.Provider>
    </SharedProvider.Provider>
  );
}

export type TooltipProps = {
  /** The label: a word or a short phrase, or a phrase with a Kbd. Never a control. */
  content: ReactNode;
  /** Which side of the trigger; it flips when there is no room. */
  side?: Side | undefined;
  align?: Align | undefined;
  /** Milliseconds before it shows. 300 by default; 0 for a control whose name is the tooltip. */
  delay?: number | undefined;
  /** Starts open. For a story or a walkthrough. */
  defaultOpen?: boolean | undefined;
  className?: string | undefined;
  /** The trigger: one focusable element that takes a ref and props (Button, IconButton, a TextLink). */
  children: ReactNode;
};

/** A short label on hover or focus. For a peek at a record, HoverCard; for something you act on, Popover. */
export function Tooltip({
  content,
  side = "top",
  align = "center",
  delay = 300,
  defaultOpen = false,
  className,
  children,
}: TooltipProps) {
  const shared = useContext(SharedProvider);
  const tooltip = (
    <TooltipPrimitive.Root defaultOpen={defaultOpen} delayDuration={delay}>
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
  );
  return shared ? (
    tooltip
  ) : (
    <TooltipPrimitive.Provider delayDuration={delay}>{tooltip}</TooltipPrimitive.Provider>
  );
}
