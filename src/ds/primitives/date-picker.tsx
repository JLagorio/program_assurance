import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Calendar } from "./calendar";
import { controlBase } from "./controls";
import { Popover } from "./popover";

/* A date field. Holds and reports an ISO day ("2026-09-14"), the same
   contract as <input type="date">, so a form's string state moves over
   unchanged; the surface is a Calendar in a Popover. Uncontrolled with
   `defaultValue`, controlled with `value`. */
export function DatePicker({
  value,
  defaultValue,
  onChange,
  placeholder = "Pick a date",
  disabled,
  name,
  className,
  "aria-label": ariaLabel,
}: {
  value?: string;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
  "aria-label"?: string;
}) {
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
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(controlBase, "flex items-center gap-2 text-left", className)}
        >
          <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className={cn("tnum min-w-0 flex-1 truncate", !date && "text-muted-foreground")}>
            {date ? format(date, "MMM d, yyyy") : placeholder}
          </span>
        </button>
      }
    >
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <Calendar
        mode="single"
        {...(date ? { selected: date, defaultMonth: date } : {})}
        onSelect={pick}
      />
    </Popover>
  );
}
