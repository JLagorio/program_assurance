import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

export type ToggleProps = Omit<ComponentPropsWithoutRef<typeof TogglePrimitive.Root>, "size"> & { size?: "small" | "medium" | undefined };

/** One thing on or off: bold, a filter, a pin. The look is the subtle button with a recessed on state. Several that share one answer are a ToggleGroup. */
export function Toggle({ className, size = "medium", ...props }: ToggleProps) {
  return (
    <TogglePrimitive.Root
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center gap-075 rounded-medium font-body font-medium text-subtle outline-none transition-colors duration-fast ease-standard",
        "hover:bg-neutral-subtle-hovered hover:text-default focus-visible:outline-focused",
        "data-[state=on]:bg-neutral data-[state=on]:text-default disabled:pointer-events-none disabled:text-disabled",
        size === "small" ? "h-control-xsmall min-w-control-xsmall px-075 font-body-small" : "h-control-small min-w-control-small px-100",
        className,
      )}
      {...props}
    />
  );
}

export type ToggleGroupProps<T extends string> = {
  items: { value: T; label: ReactNode; disabled?: boolean | undefined }[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string | undefined;
  className?: string | undefined;
};

/** One of several views or modes, always exactly one on. The look is the recessed segmented control. */
export function ToggleGroup<T extends string>({ items, value, onChange, "aria-label": ariaLabel, className }: ToggleGroupProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as T); // Radix reports "" when the on item is pressed again; one item stays on.
      }}
      aria-label={ariaLabel}
      className={cn("inline-flex h-control-small items-center gap-025 rounded-medium bg-neutral p-025", className)}
    >
      {items.map((item) => (
        <ToggleGroupPrimitive.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          className={cn(
            "inline-flex h-control-xsmall items-center rounded-small px-100 font-body-small font-medium outline-none transition-colors duration-fast ease-standard",
            "text-subtle hover:text-default focus-visible:outline-focused",
            "data-[state=on]:bg-surface-raised data-[state=on]:text-default data-[state=on]:shadow-raised",
            "disabled:pointer-events-none disabled:text-disabled",
          )}
        >
          {item.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
