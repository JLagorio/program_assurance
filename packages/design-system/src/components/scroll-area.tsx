import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import type { ReactNode } from "react";

import { cn } from "../lib/cn";

/* A region that scrolls with the kit's thin bar instead of the platform's, so a rail looks the
   same on every OS. The bar sits over the content's edge and shows while the pointer is over the
   region or, said so, always. The viewport is a tab stop, so a keyboard reader can scroll it. */

export type ScrollAreaProps = {
  /** Which way it scrolls: `vertical`, the default; `horizontal` for a wide table in a card; `both`. */
  orientation?: "vertical" | "horizontal" | "both" | undefined;
  /** When the bar shows: `hover`, the default, while the pointer is over the region and for a moment after it scrolls; `always`, so a reader sees there is more without touching it. */
  bar?: "hover" | "always" | undefined;
  /** Names the region for a screen reader, so a keyboard reader who lands on it knows what scrolls: "Facts", "Related". Unsaid, it is a plain scrolling box. */
  label?: string | undefined;
  /** Sizes the region: a height, `h-full` in a pane, `max-h-full` in a rail. It is never taller than its content. */
  className?: string | undefined;
  children: ReactNode;
};

/** A region that scrolls with the kit's thin bar. */
export function ScrollArea({
  orientation = "vertical",
  bar = "hover",
  label,
  className,
  children,
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      type={bar}
      scrollHideDelay={600}
      className={cn("relative flex flex-col overflow-hidden", className)}
    >
      <ScrollAreaPrimitive.Viewport
        tabIndex={0}
        {...(label ? { role: "region", "aria-label": label } : {})}
        className="size-full min-h-0 flex-1 outline-none focus-visible:outline-focused"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" ? <Bar orientation="vertical" /> : null}
      {orientation !== "vertical" ? <Bar orientation="horizontal" /> : null}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

/** The bar: 8px of track with a 4px thumb, over the content's edge. */
function Bar({ orientation }: { orientation: "vertical" | "horizontal" }) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      orientation={orientation}
      className={cn(
        "flex touch-none select-none p-025 transition-colors",
        orientation === "vertical" ? "h-full w-100" : "h-100 w-full flex-col",
      )}
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-neutral-pressed transition-colors duration-fast ease-standard hover:bg-neutral-bold" />
    </ScrollAreaPrimitive.Scrollbar>
  );
}
