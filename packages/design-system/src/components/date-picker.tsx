import { useLedgerLocale } from "../lib/locale";
import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { cn } from "../lib/cn";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { controlBase, controlHeight, type ControlSize } from "./controls";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

type DatePickerOwnProps = {
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
  /** An external owning form, matching the native form attribute. */
  form?: string | undefined;
  id?: string | undefined;
  "aria-labelledby"?: string | undefined;
  /** Open on first render; for a sheet that exists to pick this day, and for the docs. */
  defaultOpen?: boolean | undefined;
  /** Layout only. */
  className?: string | undefined;
  /** The name when there is no visible label. */
  "aria-label"?: string | undefined;
  /** Set when form validation fails; the border turns. */
  "aria-invalid"?: boolean | undefined;
  /** Accepted and not rendered: a button may not carry `aria-required`. The asterisk and the form's check say required. */
  "aria-required"?: boolean | undefined;
  /** IDs of the hint or error describing the control. */
  "aria-describedby"?: string | undefined;
};

export type DatePickerProps = DatePickerOwnProps &
  Omit<ComponentProps<"button">, keyof DatePickerOwnProps | "children" | "type">;

/** One day, picked from a Calendar in a Popover. Holds and reports an ISO day ("2026-09-14"), the contract of `input type="date"`, and shows it as "Sep 14, 2026". Today and Clear sit under the month. */
export function DatePicker({
  value,
  defaultValue,
  onChange,
  placeholder,
  size = "medium",
  disabled,
  name,
  form,
  id,
  "aria-labelledby": ariaLabelledby,
  defaultOpen = false,
  className,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
  ...triggerProps
}: DatePickerProps) {
  const { t, formatCalendarDate } = useLedgerLocale();
  const generatedId = useId();
  const field = {
    ...triggerProps,
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedby,
  };
  const triggerId = field.id ?? generatedId;
  const input = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(defaultOpen);
  const current = value ?? inner;
  const parsed = current ? parseISO(current) : undefined;
  const date = parsed && isValid(parsed) ? parsed : undefined;

  useEffect(() => {
    const owner = input.current?.form;
    if (!owner) return;
    const reset = (event: Event) => {
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setInner(defaultValue ?? "");
        setOpen(false);
      });
    };
    owner.addEventListener("reset", reset);
    return () => owner.removeEventListener("reset", reset);
  }, [form, value, defaultValue]);

  const pick = (next: Date | undefined) => {
    if (disabled) return;
    const iso = next ? format(next, "yyyy-MM-dd") : "";
    if (value === undefined) setInner(iso);
    onChange?.(iso);
    setOpen(false);
  };

  return (
    <>
      <input
        ref={input}
        type="hidden"
        name={name}
        form={form}
        value={current}
        disabled={disabled}
        data-ds-focus-target={triggerId}
      />
      <Popover open={open && !disabled} onOpenChange={(next) => setOpen(next && !disabled)}>
        <PopoverTrigger
          render={
            <button
              type="button"
              form={form}
              disabled={disabled}
              {...field}
              id={triggerId}
              aria-required={undefined}
              className={cn(
                controlBase,
                controlHeight[size],
                "flex items-center gap-100 text-left",
                className,
              )}
            >
              <CalendarIcon className="size-icon-small shrink-0 icon-subtle" />
              <span
                className={cn("min-w-0 flex-1 truncate tabular-nums", !date && "text-subtlest")}
              >
                {date
                  ? formatCalendarDate(date, { month: "short", day: "numeric", year: "numeric" })
                  : (placeholder ?? t("chooseDate"))}
              </span>
            </button>
          }
        />
        <PopoverContent
          aria-label={t("chooseDate")}
          finalFocus={() => input.current?.ownerDocument.getElementById(triggerId) ?? null}
          align="start"
          className="gap-0 p-0"
          style={{ width: "auto" }}
        >
          <Calendar
            mode="single"
            {...(date ? { selected: date, defaultMonth: date } : {})}
            onSelect={pick}
          />
          <div className="flex items-center justify-between gap-100 border-t border-default px-150 py-100">
            <Button variant="subtle" size="small" onClick={() => pick(new Date())}>
              {t("today")}
            </Button>
            <Button variant="subtle" size="small" disabled={!date} onClick={() => pick(undefined)}>
              {t("clear")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
