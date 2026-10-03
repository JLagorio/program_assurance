import type { ComponentProps } from "react";

import { token } from "../generated/tokens";
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
} & Omit<ComponentProps<"button">, "className" | "disabled">;

/** A value longer than this truncates with an ellipsis; its full text is its title. */
const valueMeasure = { maxWidth: token("dimension.part.filterChipValue") };

/**
 * A filter the reader adds to a toolbar: dashed with a plus until it holds a value, then solid and
 * selected. On its own it is a yes-or-no toggle and says so through `aria-pressed`; a filter with
 * values is a Popover's trigger and takes `aria-expanded` from the popover instead. One line at
 * every width: it never shrinks below its label, and a long value truncates.
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
        "inline-flex h-control-small max-w-full shrink-0 items-center gap-075 rounded-medium border px-100 font-body whitespace-nowrap outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused disabled:pointer-events-none disabled:border-disabled disabled:text-disabled",
        isActive
          ? "border-solid border-selected bg-selected text-selected"
          : "border-dashed border-bold text-subtle hover:border-default hover:text-default",
        className,
      )}
      {...rest}
      data-slot="filter-chip"
    >
      {isActive ? null : (
        <span aria-hidden className="shrink-0">
          +
        </span>
      )}
      <span data-slot="filter-chip-label" className="shrink-0">
        {label}
      </span>
      {value ? (
        <span
          data-slot="filter-chip-value"
          title={value}
          className="min-w-0 truncate font-medium text-default"
          style={valueMeasure}
        >
          {value}
        </span>
      ) : null}
    </button>
  );
}
