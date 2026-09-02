import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* One of several views or modes, always exactly one on. Radix underneath for
   roving focus and aria-pressed; the look is the recessed segmented control. */
export function ToggleGroup<T extends string>({
  items,
  value,
  onChange,
  "aria-label": ariaLabel,
  className,
}: {
  items: { value: T; label: ReactNode; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
  className?: string;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        // Radix reports "" when the on item is pressed again; one item stays on.
        if (next) onChange(next as T);
      }}
      aria-label={ariaLabel}
      className={cn("inline-flex h-7 items-center gap-0.5 rounded-md bg-muted p-0.5", className)}
    >
      {items.map((item) => (
        <ToggleGroupPrimitive.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          className={cn(
            "inline-flex h-6 items-center rounded-[5px] px-2 text-12 font-medium outline-none transition-colors duration-100",
            "text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/35",
            "data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-hairline",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        >
          {item.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
