import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* A region that scrolls with the kit's thin bar instead of the platform's,
   so a rail or a picker list looks the same on every OS. Size it with
   className; the bar appears on hover. */
export function ScrollArea({
  orientation = "vertical",
  className,
  children,
}: {
  orientation?: "vertical" | "horizontal" | "both";
  className?: string;
  children: ReactNode;
}) {
  return (
    <ScrollAreaPrimitive.Root
      type="hover"
      className={cn("relative flex flex-col overflow-hidden", className)}
    >
      <ScrollAreaPrimitive.Viewport className="size-full min-h-0 flex-1 rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" ? <Bar orientation="vertical" /> : null}
      {orientation !== "vertical" ? <Bar orientation="horizontal" /> : null}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function Bar({ orientation }: { orientation: "vertical" | "horizontal" }) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      orientation={orientation}
      className={cn(
        "flex touch-none select-none p-0.5 transition-colors",
        orientation === "vertical" ? "h-full w-2" : "h-2 w-full flex-col",
      )}
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border-strong" />
    </ScrollAreaPrimitive.Scrollbar>
  );
}
