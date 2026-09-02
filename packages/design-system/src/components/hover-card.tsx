import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";
import { menuMotion } from "./menu";

type Side = NonNullable<ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>["side"]>;
type Align = NonNullable<ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>["align"]>;

export type HoverCardProps = {
  content: ReactNode;
  side?: Side | undefined;
  align?: Align | undefined;
  width?: number | undefined;
  delay?: number | undefined;
  defaultOpen?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/** A peek at a record from its id or name: a few facts, no actions. Opens on hover after a short delay and on focus. */
export function HoverCard({ content, side = "bottom", align = "start", width = 280, delay = 400, defaultOpen = false, className, children }: HoverCardProps) {
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
          className={cn("z-50 rounded-large border border-default bg-surface-overlay p-150 font-body text-default shadow-overlay outline-none", menuMotion, className)}
        >
          {content}
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}
