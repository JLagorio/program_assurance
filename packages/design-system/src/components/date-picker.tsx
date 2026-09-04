import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { controlBase, controlHeight, type ControlSize } from "./controls";
import { Popover } from "./popover";

export type DatePickerProps = {
  /** The chosen day as an ISO date ("2026-09-14"), controlled; pair it with `onChange`. */
  value?: string | undefined;
  /** The starting day when uncontrolled, as an ISO date. */
  defaultValue?: string | undefined;
  /** Called with the new ISO date, or "" when cleared. */
  onChange?: ((iso: string) => void) | undefined;
  /** What the field says with no day chosen: "Choose a date". */
  placeholder?: string | undefined;
  /** `medium` (32px) in a form; `small` (28px) in a toolbar. */
  size?: ControlSize | undefined;
  /** Not available. The last resort. */
  disabled?: boolean | undefined;
  /** The form field's name; a hidden input carries the ISO date on submit. */
  name?: string | undefined;
  /** Open on first render; for a sheet that exists to pick this day, and for the docs. */
  defaultOpen?: boolean | undefined;
  /** Layout only. */
  className?: string | undefined;
  /** The name, when there is no Field around it. */
  "aria-label"?: string | undefined;
  /** Set by the Field from `error`; the border turns. */
  "aria-invalid"?: boolean | undefined;
  /** Accepted from the Field and not rendered: a button may not carry `aria-required`. The asterisk and the form's check say required. */
  "aria-required"?: boolean | undefined;
  /** Set by the Field: the hint or the error is the control's description. */
  "aria-describedby"?: string | undefined;
};

/** One day, picked from a Calendar in a Popover. Holds and reports an ISO day ("2026-09-14"), the contract of `input type="date"`, and shows it as "Sep 14, 2026". Today and Clear sit under the month. */
export function DatePicker({
  value,
  defaultValue,
  onChange,
  placeholder = "Choose a date",
  size = "medium",
  disabled,
  name,
  defaultOpen = false,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
}: DatePickerProps) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(defaultOpen);
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
      label="Choose a date"
      className="p-0"
      trigger={
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          className={cn(
            controlBase,
            controlHeight[size],
            "flex items-center gap-100 text-left",
            className,
          )}
        >
          <CalendarIcon className="size-icon-small shrink-0 icon-subtle" />
          <span className={cn("min-w-0 flex-1 truncate tabular-nums", !date && "text-subtlest")}>
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
      <div className="flex items-center justify-between gap-100 border-t border-default px-150 py-100">
        <Button variant="subtle" size="small" onClick={() => pick(new Date())}>
          Today
        </Button>
        <Button variant="subtle" size="small" disabled={!date} onClick={() => pick(undefined)}>
          Clear
        </Button>
      </div>
    </Popover>
  );
}
