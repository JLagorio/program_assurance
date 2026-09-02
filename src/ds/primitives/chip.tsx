import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function FilterChip({
  label,
  value,
  active,
  className,
  ...props
}: ComponentProps<"button"> & {
  label: string;
  value?: string;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border border-dashed px-2 text-[13px] transition-colors",
        active
          ? "border-solid border-primary/30 bg-primary-soft text-primary"
          : "border-border-strong text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
        className,
      )}
      {...props}
    >
      <span className="text-[13px] leading-none">+</span>
      {label}
      {value ? <span className="font-medium text-foreground">{value}</span> : null}
    </button>
  );
}
