import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export type FilterChipProps = {
  /** The column or the question, as a noun: Owner, Status, Gaps. */
  label: string;
  /** The chosen value, after the label: "Dana Whitfield", "3 chosen". */
  value?: string | undefined;
  /** The filter is applied: solid and selected, and pressed for a screen reader. */
  isActive?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "disabled">;

/**
 * A filter the reader adds to a toolbar: dashed with a plus until it holds a value, then solid and
 * selected. On its own it is a toggle and says so through `aria-pressed`; as a Popover's trigger it
 * takes `aria-expanded` from the popover instead.
 */
export function FilterChip({
  label,
  value,
  isActive = false,
  disabled,
  className,
  type,
  ...rest
}: FilterChipProps) {
  const opens = rest["aria-expanded"] !== undefined || rest["aria-haspopup"] !== undefined;
  return (
    <button
      type={type ?? "button"}
      {...(opens ? {} : { "aria-pressed": isActive })}
      {...(disabled ? { disabled } : {})}
      className={cn(
        "inline-flex h-control-small items-center gap-075 rounded-medium border px-100 font-body outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused disabled:pointer-events-none disabled:border-disabled disabled:text-disabled",
        isActive
          ? "border-solid border-selected bg-selected text-selected"
          : "border-dashed border-bold text-subtle hover:border-default hover:text-default",
        className,
      )}
      {...rest}
    >
      {isActive ? null : <span aria-hidden>+</span>}
      {label}
      {value ? <span className="font-medium text-default">{value}</span> : null}
    </button>
  );
}
