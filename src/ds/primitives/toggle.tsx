import * as TogglePrimitive from "@radix-ui/react-toggle";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/* One thing on or off: bold, a filter, a pin. Radix underneath for
   aria-pressed and the keyboard; the look is the IconButton with a recessed
   on state. Several that share one answer are a ToggleGroup. */
export function Toggle({
  className,
  pressed,
  onPressedChange,
  defaultPressed,
  disabled,
  size = "md",
  ...props
}: Omit<ComponentProps<typeof TogglePrimitive.Root>, "size"> & { size?: "sm" | "md" }) {
  return (
    <TogglePrimitive.Root
      {...(pressed === undefined ? {} : { pressed })}
      {...(defaultPressed === undefined ? {} : { defaultPressed })}
      {...(onPressedChange ? { onPressedChange } : {})}
      {...(disabled ? { disabled } : {})}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center gap-1.5 rounded-md text-13 font-medium text-muted-foreground transition-colors duration-100",
        "hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        "data-[state=on]:bg-muted data-[state=on]:text-foreground disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-6 min-w-6 px-1.5 text-12" : "h-7 min-w-7 px-2",
        className,
      )}
      {...props}
    />
  );
}
