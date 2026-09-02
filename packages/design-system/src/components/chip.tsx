import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export type FilterChipProps = {
  label: string;
  /** The chosen value, shown after the label. */
  value?: string | undefined;
  isActive?: boolean | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"button">, "className">;

/** A filter you add to a toolbar: dashed until it holds a value, then solid and selected. */
export function FilterChip({ label, value, isActive, className, type, ...rest }: FilterChipProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex h-control-small items-center gap-075 rounded-medium border px-100 font-body outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused",
        isActive ? "border-solid border-selected bg-selected text-selected" : "border-dashed border-bold text-subtle hover:border-default hover:text-default",
        className,
      )}
      {...rest}
    >
      <span aria-hidden>+</span>
      {label}
      {value ? <span className="font-medium text-default">{value}</span> : null}
    </button>
  );
}
