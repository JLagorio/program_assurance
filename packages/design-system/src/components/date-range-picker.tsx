import { Calendar as CalendarIcon, Check } from "lucide-react";
import { useContext, useEffect, useId, useRef, useState, type ComponentProps } from "react";
import type { DateRange } from "react-day-picker";

import { announce } from "../lib/announce";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import {
  compareDays,
  dateToDay,
  dayToDate,
  formatIsoDay,
  parseIsoDay,
  type CalendarDay,
} from "../lib/locale-format";
import { Button } from "./button";
import { Calendar, CalendarAnnounceContext } from "./calendar";
import {
  FieldStateContext,
  controlBase,
  controlHeight,
  useFieldControlState,
  type ControlSize,
} from "./controls";
import {
  dayFormat,
  useDayConstraints,
  useFieldTrigger,
  useIsoDay,
  type DatePickerProps,
  type DayConstraintProps,
} from "./date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/** A range of calendar days as two ISO days; both are "" when no range is chosen. */
export type DateRangeValue = { start: string; end: string };

/** A named range offered beside the month: "Last 30 days", "This quarter", "FY 2026". */
export type DateRangePreset = {
  /** What the button says. */
  label: string;
  /** The range it chooses. */
  value: DateRangeValue;
};

type DateRangePickerOwnProps = DayConstraintProps & {
  /** The chosen range, controlled; pair it with `onValueChange`. Each end is an ISO day. */
  value?: DateRangeValue | undefined;
  /** The starting range when uncontrolled. */
  defaultValue?: DateRangeValue | undefined;
  /** Called with the new range once both ends are chosen, or with two "" when cleared. A half-chosen range is not reported. */
  onValueChange?: ((range: DateRangeValue) => void) | undefined;
  /** Named ranges beside the month; choosing one sets the range and closes. The one that matches the value is marked. */
  presets?: DateRangePreset[] | undefined;
  /** What the field says with no range chosen: "Choose dates". */
  placeholder?: string | undefined;
  /** `medium` (32px) in a form; `small` (28px) in a toolbar or a filter. */
  size?: ControlSize | undefined;
  /** Not available. A Field's or FieldSet's `disabled` also reaches it. */
  disabled?: boolean | undefined;
  /** The start's form field name; a hidden input carries its ISO day on submit. */
  startName?: string | undefined;
  /** The end's form field name. */
  endName?: string | undefined;
  /** An external owning form, matching the native form attribute. */
  form?: string | undefined;
  id?: string | undefined;
  /** Months shown side by side where there is room; 2 by default. */
  numberOfMonths?: 1 | 2 | undefined;
  /** Open on first render; for the docs. */
  defaultOpen?: boolean | undefined;
  /** Names the field. Inside a Field it defaults to the FieldLabel. */
  "aria-labelledby"?: string | undefined;
  /** The name when there is no visible label. */
  "aria-label"?: string | undefined;
  /** Set when form validation fails; the border turns. */
  "aria-invalid"?: boolean | undefined;
  /** IDs of the hint or error describing the field. The chosen range is described first. */
  "aria-describedby"?: string | undefined;
  /** The month's own options, as on DatePicker. */
  calendarProps?: DatePickerProps["calendarProps"];
  /** Layout only. */
  className?: string | undefined;
};

export type DateRangePickerProps = DateRangePickerOwnProps &
  Omit<
    ComponentProps<"button">,
    keyof DateRangePickerOwnProps | "children" | "type" | "value" | "onChange"
  >;

const empty: DateRangeValue = { start: "", end: "" };

/**
 * A range of days, from a trigger that reads the range ("Sep 7 – 11, 2026") and a popover with
 * two months and optional presets. The first day chosen starts a new range and the second ends
 * it; the range is reported and the popover closes when both are chosen. Built on Calendar's
 * range mode; holds and reports two ISO days.
 */
export function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  presets,
  placeholder,
  size = "medium",
  disabled,
  startName,
  endName,
  form,
  id,
  numberOfMonths = 2,
  defaultOpen = false,
  "aria-labelledby": ariaLabelledby,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
  calendarProps,
  className,
  min,
  max,
  isDateUnavailable,
  ...triggerProps
}: DateRangePickerProps) {
  const { t, formatDay, formatDayRange } = useLedgerLocale();
  const field = useContext(FieldStateContext);
  const control = useFieldControlState();
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const valueId = `${triggerId}-value`;
  const hidden = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState<DateRangeValue>(defaultValue ?? empty);
  const [open, setOpen] = useState(defaultOpen);
  const current = value ?? inner;
  const startDay = useIsoDay(current.start, "DateRangePicker start");
  const endDay = useIsoDay(current.end, "DateRangePicker end");
  // A range needs both ends in order; anything else is no range.
  const range =
    startDay && endDay && compareDays(startDay, endDay) <= 0
      ? { start: startDay, end: endDay }
      : null;
  const constraints = useDayConstraints({ min, max, isDateUnavailable }, "DateRangePicker");
  const isDisabled = Boolean(disabled ?? (field?.disabled || control.disabled));
  const labelledBy = ariaLabelledby ?? (ariaLabel === undefined ? control.labelId : undefined);
  const bindTrigger = useFieldTrigger(triggerId, isDisabled);

  // The range being chosen in the open popover; it becomes the value once it has both ends.
  const committed: DateRange | undefined = range
    ? { from: dayToDate(range.start), to: dayToDate(range.end) }
    : undefined;
  const [draft, setDraft] = useState<DateRange | undefined>(committed);
  const openWith = (next: boolean) => {
    const allowed = next && !isDisabled;
    if (allowed) setDraft(committed);
    setOpen(allowed);
  };

  useEffect(() => {
    const owner = hidden.current?.form;
    if (!owner) return;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setInner(defaultValue ?? empty);
        setOpen(false);
      });
    owner.addEventListener("reset", reset);
    return () => owner.removeEventListener("reset", reset);
  }, [form, value, defaultValue]);

  const report = (next: { start: CalendarDay; end: CalendarDay } | null) => {
    const nextValue = next
      ? { start: formatIsoDay(next.start), end: formatIsoDay(next.end) }
      : empty;
    if (value === undefined) setInner(nextValue);
    if (nextValue.start !== current.start || nextValue.end !== current.end)
      onValueChange?.(nextValue);
    setOpen(false);
  };

  const select = (next: DateRange | undefined) => {
    if (isDisabled) return;
    const completes = Boolean(next?.from && next.to && draft?.from && !draft.to);
    setDraft(next);
    if (completes && next?.from && next.to)
      report({ start: dateToDay(next.from), end: dateToDay(next.to) });
    else if (next?.from && !next.to) announce(t("dateRangeChooseEnd"));
  };

  const long = { month: "long", day: "numeric", year: "numeric" } as const;
  const summary = range ? formatDayRange(range.start, range.end, dayFormat) : null;
  const spoken = range
    ? t("dateRangeSpoken", {
        start: formatDay(range.start, long),
        end: formatDay(range.end, long),
      })
    : null;
  const describedBy =
    [range ? valueId : null, ariaDescribedby].filter(Boolean).join(" ") || undefined;
  const choosingEnd = Boolean(draft?.from && !draft.to);
  const presetRange = (preset: DateRangePreset) => {
    const start = parseIsoDay(preset.value.start);
    const end = parseIsoDay(preset.value.end);
    return start && end && compareDays(start, end) <= 0 ? { start, end } : null;
  };
  /** Why a preset cannot be chosen: an end outside the limits or unavailable. Null when it can. */
  const presetReason = (days: { start: CalendarDay; end: CalendarDay }) =>
    constraints.reasonOf(days.start) ?? constraints.reasonOf(days.end);

  return (
    <>
      <input
        ref={hidden}
        type="hidden"
        name={startName}
        form={form}
        value={range ? current.start : ""}
        disabled={isDisabled}
      />
      <input
        type="hidden"
        name={endName}
        form={form}
        value={range ? current.end : ""}
        disabled={isDisabled}
      />
      <Popover open={open && !isDisabled} onOpenChange={openWith}>
        <PopoverTrigger
          render={
            <Button
              variant="secondary"
              iconBefore={<CalendarIcon />}
              size={size}
              type="button"
              form={form}
              disabled={isDisabled}
              {...triggerProps}
              data-slot="date-range-picker"
              data-entry="range"
              aria-label={ariaLabel}
              aria-labelledby={labelledBy}
              {...bindTrigger({ "aria-describedby": describedBy })}
              {...(ariaInvalid ? { "aria-invalid": true } : {})}
              id={triggerId}
              className={cn(
                controlBase,
                controlHeight[size],
                "flex items-center justify-start gap-100 text-start font-regular shadow-none",
                className,
              )}
            >
              <span
                aria-hidden={range && (labelledBy || ariaLabel) ? true : undefined}
                className={cn("min-w-0 flex-1 truncate tabular-nums", !range && "text-subtlest")}
              >
                {summary ?? placeholder ?? t("chooseDates")}
              </span>
              {spoken ? (
                <span id={valueId} hidden>
                  {spoken}
                </span>
              ) : null}
            </Button>
          }
        />
        <PopoverContent
          {...(labelledBy
            ? { "aria-labelledby": labelledBy }
            : { "aria-label": ariaLabel ?? t("chooseDates") })}
          finalFocus={() => hidden.current?.ownerDocument.getElementById(triggerId) ?? null}
          align="start"
          className="gap-0 p-0"
          style={{ width: "auto" }}
        >
          <div data-slot="date-range-picker-popup" className="flex flex-col sm:flex-row">
            {presets?.length ? (
              <div
                role="group"
                aria-label={t("dateRangePresets")}
                className="flex flex-wrap gap-050 border-b border-default p-100 sm:flex-col sm:flex-nowrap sm:border-e sm:border-b-0"
              >
                {presets.map((preset) => {
                  const active =
                    Boolean(range) &&
                    preset.value.start === current.start &&
                    preset.value.end === current.end;
                  const days = presetRange(preset);
                  // A preset outside the limits stays reachable and says why; a malformed one is
                  // a caller's mistake and is simply disabled.
                  const reason = days ? presetReason(days) : null;
                  return (
                    <Button
                      key={preset.label}
                      variant="subtle"
                      size="small"
                      aria-pressed={active}
                      disabled={!days}
                      disabledReason={reason ?? undefined}
                      iconAfter={active ? <Check aria-hidden /> : undefined}
                      className="justify-between"
                      onClick={() => {
                        if (days && !reason) report(days);
                      }}
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
            ) : null}
            <div className="flex flex-col">
              <CalendarAnnounceContext.Provider value={false}>
                <Calendar
                  mode="range"
                  resetOnSelect
                  autoFocus
                  numberOfMonths={numberOfMonths}
                  {...(constraints.startMonth ? { startMonth: constraints.startMonth } : {})}
                  {...(constraints.endMonth ? { endMonth: constraints.endMonth } : {})}
                  {...calendarProps}
                  selected={draft}
                  {...(range ? { defaultMonth: dayToDate(range.start) } : {})}
                  disabled={constraints.disabled}
                  describeDay={constraints.describeDay}
                  onSelect={select}
                />
              </CalendarAnnounceContext.Provider>
              <div className="flex items-center justify-between gap-100 border-t border-default px-150 py-100">
                <span className="min-w-0 font-body-small text-subtle">
                  {choosingEnd ? t("dateRangeChooseEnd") : null}
                </span>
                <Button
                  variant="subtle"
                  size="small"
                  disabled={!range && !draft?.from}
                  onClick={() => report(null)}
                >
                  {t("clear")}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
