import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "../lib/cn";
import { Calendar } from "./calendar";
import { controlBase, controlHeight } from "./controls";
import { Popover } from "./popover";

export type DatePickerProps = {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: ((iso: string) => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  name?: string | undefined;
  className?: string | undefined;
  "aria-label"?: string | undefined;
};

/** A date field. Holds and reports an ISO day ("2026-09-14"), the same contract as input type="date"; the surface is a Calendar in a Popover. */
export function DatePicker({ value, defaultValue, onChange, placeholder = "Pick a date", disabled, name, className, "aria-label": ariaLabel }: DatePickerProps) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const current = value ?? inner;
  const parsed = current ? parseISO(current) : undefined;
  const date = parsed && isValid(parsed) ? parsed : undefined;

  const pick = (next: Date | undefined) => {
    const iso = next ? format(next, "yyyy-MM-dd") : "";
    if (value === undefined) setInner(iso);
    onChange?.(iso);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      className="p-0"
      trigger={
        <button type="button" disabled={disabled} aria-label={ariaLabel} className={cn(controlBase, controlHeight.medium, "flex items-center gap-100 text-left", className)}>
          <CalendarIcon className="size-icon-small shrink-0 icon-subtle" />
          <span className={cn("min-w-0 flex-1 truncate tabular-nums", !date && "text-subtlest")}>{date ? format(date, "MMM d, yyyy") : placeholder}</span>
        </button>
      }
    >
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <Calendar mode="single" {...(date ? { selected: date, defaultMonth: date } : {})} onSelect={pick} />
    </Popover>
  );
}
