import { Calendar as CalendarIcon } from "lucide-react";
import { useContext, useEffect, useId, useRef, useState, type FocusEvent, type Ref } from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import {
  dateToDay,
  formatIsoDay,
  parseInstant,
  type CalendarDay,
  type WallTime,
} from "../lib/locale-format";
import { FieldStateContext, useFieldControlState, type ControlSize } from "./controls";
import {
  DayPopup,
  dayFormat,
  useCustomValidity,
  useDayConstraints,
  useTypedEntry,
  warnOnce,
  type DatePickerProps,
} from "./date-picker";
import { FieldError } from "./field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./input-group";
import { Popover, PopoverTrigger } from "./popover";
import { TimeInput, useIsoTime, useTimeInput, type TimeFieldHourCycle } from "./time-field";

/** How a moment reads in an error: "Sep 18, 2026, 5:30 PM". */
const momentFormat = { ...dayFormat, hour: "numeric", minute: "2-digit" } as const;

export type DateTimeFieldProps = {
  /**
   * The moment as an ISO instant ("2026-09-19T00:30:00.000Z"), controlled; pair it with
   * `onValueChange`. A value with no offset ("2026-09-18T17:30", what `datetime-local` holds) is read
   * as a wall time in the provider's zone.
   */
  value?: string | undefined;
  /** The starting moment when uncontrolled. */
  defaultValue?: string | undefined;
  /** Called with the new instant in UTC ("2026-09-19T00:30:00.000Z"), or "" while the day or the time is missing or not valid. */
  onValueChange?: ((instant: string) => void) | undefined;
  /** The earliest moment the reader may enter, as an instant. Earlier days are disabled in the month; an earlier time on the same day is an error that names it. */
  min?: string | undefined;
  /** The latest moment the reader may enter, as an instant. */
  max?: string | undefined;
  /** Days the reader may not choose, as on DatePicker: true, or the reason as a sentence. */
  isDateUnavailable?: DatePickerProps["isDateUnavailable"];
  /** The time a day takes when the reader picks it before any time, as an ISO time ("17:00"). Without it the time waits for the reader. */
  defaultTime?: string | undefined;
  /** Minutes the Up and Down arrows move the time by. 15 by default. */
  step?: number | undefined;
  /** The clock the time reads on; by default the locale's. */
  hourCycle?: TimeFieldHourCycle | undefined;
  /** Shows the provider zone's short name after the time ("PDT"), with its long name for assistive technology. On by default: a time without its zone is ambiguous. */
  showTimeZone?: boolean | undefined;
  /** The form field's name; a hidden input carries the instant on submit. Put it here, not on the Field. */
  name?: string | undefined;
  /** An external owning form, matching the native form attribute. */
  form?: string | undefined;
  /** Not available. A Field's or FieldSet's `disabled` also reaches it. */
  disabled?: boolean | undefined;
  /** The day input's id: a FieldLabel's `htmlFor` points at it. */
  id?: string | undefined;
  /** `medium` (32px) in a form; `small` (28px) in a toolbar. */
  size?: ControlSize | undefined;
  /** Names the field. Inside a Field it defaults to the FieldLabel. */
  "aria-labelledby"?: string | undefined;
  /** The name when there is no visible label. */
  "aria-label"?: string | undefined;
  /** IDs of the hint or error describing the field; both inputs are described by them. */
  "aria-describedby"?: string | undefined;
  /** Set when form validation fails; both inputs turn. */
  "aria-invalid"?: boolean | undefined;
  /** Called with the message when what the reader entered is not a moment the field accepts, and with null once it is. */
  onEntryError?: ((message: string | null) => void) | undefined;
  /** The month's own options, as on DatePicker. */
  calendarProps?: DatePickerProps["calendarProps"];
  /** Layout only; reaches the field's root. */
  className?: string | undefined;
  /** The day input. */
  ref?: Ref<HTMLInputElement> | undefined;
};

/**
 * A moment: a day and a time together, typed or picked, in the LedgerProvider's time zone, which
 * it shows after the time. It holds and reports an ISO instant, so what the reader sees and what
 * is stored name the same moment. Inside a Field the day input is the Field's control and the time
 * input follows its label, hint, error and state.
 */
export function DateTimeField({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  isDateUnavailable,
  defaultTime,
  step = 15,
  hourCycle,
  showTimeZone = true,
  name,
  form,
  disabled,
  id,
  size = "medium",
  "aria-labelledby": ariaLabelledby,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
  onEntryError,
  calendarProps,
  className,
  ref,
}: DateTimeFieldProps) {
  const locale = useLedgerLocale();
  const { t, formatDay, formatDate, parseDay, timeZone, timeZoneName, toInstant, zonedParts } =
    locale;
  const field = useContext(FieldStateContext);
  const control = useFieldControlState();
  const baseId = useId();
  const dateId = id ?? `${baseId}-date`;
  const timeId = `${baseId}-time`;
  const errorId = `${baseId}-error`;
  const datePartId = `${baseId}-date-part`;
  const timePartId = `${baseId}-time-part`;
  const zoneId = `${baseId}-zone`;
  const chooseId = `${baseId}-choose`;
  const dateInput = useRef<HTMLInputElement | null>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const isDisabled = Boolean(disabled ?? (field?.disabled || control.disabled));
  const labelledBy = ariaLabelledby ?? (ariaLabel === undefined ? control.labelId : undefined);

  const readInstant = (text: string | undefined, part: string) => {
    if (!text) return null;
    const instant = parseInstant(text, timeZone);
    if (instant === null)
      warnOnce(`DateTimeField${part}: "${text}" is not an ISO instant; it is treated as empty.`);
    return instant;
  };
  const [inner, setInner] = useState(defaultValue ?? "");
  const instant = readInstant(value ?? inner, "");
  const iso = instant === null ? "" : new Date(instant).toISOString();
  const minInstant = readInstant(min, " min");
  const maxInstant = readInstant(max, " max");
  const dayOf = (moment: number | null) => {
    if (moment === null) return null;
    const { year, month, day } = zonedParts(moment);
    return { year, month, day };
  };
  const timeOf = (moment: number | null) => {
    if (moment === null) return null;
    const { hour, minute } = zonedParts(moment);
    return { hour, minute };
  };
  const minDay = dayOf(minInstant);
  const maxDay = dayOf(maxInstant);
  const constraints = useDayConstraints(
    {
      min: minDay ? formatIsoDay(minDay) : undefined,
      max: maxDay ? formatIsoDay(maxDay) : undefined,
      isDateUnavailable,
    },
    "DateTimeField",
  );
  const fallbackTime = useIsoTime(defaultTime, "DateTimeField defaultTime");

  // What the reader has entered so far, which may not yet make a moment.
  const [draftDay, setDraftDay] = useState<CalendarDay | null>(() => dayOf(instant));
  const [draftTime, setDraftTime] = useState<WallTime | null>(() => timeOf(instant));
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [incomplete, setIncomplete] = useState(false);
  const [open, setOpen] = useState(false);
  const own = useRef<string | null>(null);
  useEffect(() => {
    // Our own change is already in the drafts; any other one replaces them.
    if (own.current === iso) {
      own.current = null;
      return;
    }
    own.current = null;
    setDraftDay(dayOf(instant));
    setDraftTime(timeOf(instant));
    setRangeError(null);
    setIncomplete(false);
    // `instant` follows `iso`, which is the dependency.
  }, [iso]);

  // The drafts as they are after this event's own commits, for the group's blur that follows them.
  const latest = useRef({ day: draftDay, time: draftTime });
  latest.current = { day: draftDay, time: draftTime };
  const update = (nextDay: CalendarDay | null, nextTime: WallTime | null) => {
    latest.current = { day: nextDay, time: nextTime };
    setDraftDay(nextDay);
    setDraftTime(nextTime);
    if (nextDay && nextTime) setIncomplete(false);
    if (!nextDay && !nextTime) setIncomplete(false);
    let moment = nextDay && nextTime ? toInstant(nextDay, nextTime) : null;
    let problem: string | null = null;
    if (moment !== null && minInstant !== null && moment < minInstant)
      problem = t("dateTooEarly", { date: formatDate(minInstant, momentFormat) });
    else if (moment !== null && maxInstant !== null && moment > maxInstant)
      problem = t("dateTooLate", { date: formatDate(maxInstant, momentFormat) });
    if (problem) moment = null;
    setRangeError(problem);
    const nextIso = moment === null ? "" : new Date(moment).toISOString();
    if (nextIso === iso) return;
    own.current = nextIso;
    if (value === undefined) setInner(nextIso);
    onValueChange?.(nextIso);
  };

  const today = dateToDay(new Date());
  const dayEntry = useTypedEntry<CalendarDay>({
    shown: draftDay ? formatDay(draftDay, dayFormat) : "",
    read: (text) => {
      const parsed = parseDay(text, today);
      if (!parsed) return { error: t("dateInvalid", { example: formatDay(today, dayFormat) }) };
      const problem = constraints.entryError(parsed);
      return problem ? { error: problem } : { value: parsed };
    },
    commit: (day) => update(day, draftTime ?? (day ? fallbackTime : null)),
    show: (day) => formatDay(day, dayFormat),
  });
  const timeInput = useTimeInput({
    time: draftTime,
    commit: (time) => update(draftDay, time),
    min: null,
    max: null,
    step,
    hourCycle,
  });
  useCustomValidity(dateInput, dayEntry.error);

  const error =
    dayEntry.error ??
    timeInput.typed.error ??
    rangeError ??
    (incomplete ? t("dateTimeIncomplete") : null);
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (reported.current === error) return;
    reported.current = error;
    onEntryError?.(error);
  }, [error, onEntryError]);

  // The time input is not the Field's control, so it follows the day input's description and
  // invalid state, which Base UI keeps for the Field's hint and error.
  const [mirror, setMirror] = useState<{ describedBy: string; invalid: boolean }>({
    describedBy: "",
    invalid: false,
  });
  useEffect(() => {
    const node = dateInput.current;
    if (!node) return;
    const read = () =>
      setMirror((previous) => {
        const next = {
          describedBy: node.getAttribute("aria-describedby") ?? "",
          invalid: node.getAttribute("aria-invalid") === "true",
        };
        return previous.describedBy === next.describedBy && previous.invalid === next.invalid
          ? previous
          : next;
      });
    read();
    const observer = new MutationObserver(read);
    observer.observe(node, {
      attributes: true,
      attributeFilter: ["aria-describedby", "aria-invalid"],
    });
    return () => observer.disconnect();
  }, []);

  const resets = useRef({ day: dayEntry.reset, time: timeInput.typed.reset, dayOf, timeOf });
  useEffect(() => {
    resets.current = { day: dayEntry.reset, time: timeInput.typed.reset, dayOf, timeOf };
  });
  useEffect(() => {
    const owner = hidden.current?.form;
    if (!owner) return;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setInner(defaultValue ?? "");
        // A half entry never became a value, so the drafts and the typed text go back as well.
        const restored = value ?? defaultValue;
        const moment = restored ? parseInstant(restored, timeZone) : null;
        resets.current.day();
        resets.current.time();
        setDraftDay(resets.current.dayOf(moment));
        setDraftTime(resets.current.timeOf(moment));
        setRangeError(null);
        setIncomplete(false);
      });
    owner.addEventListener("reset", reset);
    return () => owner.removeEventListener("reset", reset);
  }, [form, value, defaultValue, timeZone]);

  // The zone's name at the moment shown, so a daylight-saving change reads right; now when empty.
  const moment = instant ?? Date.now();
  const zone = showTimeZone
    ? { short: timeZoneName(moment, "short"), long: timeZoneName(moment, "long"), id: zoneId }
    : undefined;

  const pick = (next: Date | undefined) => {
    if (isDisabled) return;
    dayEntry.set(next ? dateToDay(next) : null);
    setOpen(false);
  };
  const leaveGroup = (event: FocusEvent<HTMLDivElement>) => {
    if (open || event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setIncomplete(Boolean(latest.current.day) !== Boolean(latest.current.time));
  };

  const dayInvalid =
    Boolean(ariaInvalid) ||
    Boolean(dayEntry.error) ||
    Boolean(rangeError) ||
    (incomplete && !draftDay);
  const timeInvalid =
    Boolean(ariaInvalid) ||
    mirror.invalid ||
    Boolean(timeInput.typed.error) ||
    Boolean(rangeError) ||
    (incomplete && !draftTime);
  const describe = (...lists: (string | null | undefined)[]) =>
    [...new Set(lists.flatMap((list) => (list ? list.split(" ") : [])).filter(Boolean))].join(
      " ",
    ) || undefined;
  const name_ = (part: string) => (labelledBy ? `${labelledBy} ${part}` : undefined);

  return (
    <>
      <input ref={hidden} type="hidden" name={name} form={form} value={iso} disabled={isDisabled} />
      <div
        role="group"
        data-slot="date-time-field"
        {...(labelledBy ? { "aria-labelledby": labelledBy } : {})}
        {...(!labelledBy && ariaLabel ? { "aria-label": ariaLabel } : {})}
        onBlur={leaveGroup}
        className={cn("@container/date-time-field w-full min-w-0", className)}
      >
        <span id={datePartId} hidden>
          {t("datePart")}
        </span>
        <span id={timePartId} hidden>
          {t("timePart")}
        </span>
        <span id={chooseId} hidden>
          {t("chooseDate")}
        </span>
        <div className="grid grid-cols-1 gap-100 @3xs/date-time-field:grid-cols-2">
          <Popover open={open && !isDisabled} onOpenChange={(next) => setOpen(next && !isDisabled)}>
            <InputGroup data-entry="date">
              <InputGroupInput
                ref={(node: HTMLInputElement | null) => {
                  dateInput.current = node;
                  if (typeof ref === "function") ref(node);
                  else if (ref) ref.current = node;
                }}
                id={dateId}
                size={size}
                form={form}
                autoComplete="off"
                spellCheck={false}
                disabled={isDisabled}
                {...(name_(datePartId) ? { "aria-labelledby": name_(datePartId) } : {})}
                {...(!labelledBy && ariaLabel
                  ? { "aria-label": `${ariaLabel}, ${t("datePart")}` }
                  : {})}
                {...(describe(error ? errorId : null, ariaDescribedby)
                  ? { "aria-describedby": describe(error ? errorId : null, ariaDescribedby) }
                  : {})}
                {...(dayInvalid ? { "aria-invalid": true } : {})}
                {...dayEntry.inputProps}
                onKeyDown={(event) => {
                  if (event.altKey && event.key === "ArrowDown") {
                    event.preventDefault();
                    setOpen(true);
                    return;
                  }
                  dayEntry.inputProps.onKeyDown(event);
                }}
              />
              <InputGroupAddon align="inline-end">
                <PopoverTrigger
                  render={
                    <InputGroupButton
                      size="icon-xs"
                      disabled={isDisabled}
                      className="relative touch-target"
                      {...(labelledBy
                        ? { "aria-labelledby": `${chooseId} ${labelledBy}` }
                        : { "aria-label": t("chooseDate") })}
                    />
                  }
                >
                  <CalendarIcon aria-hidden />
                </PopoverTrigger>
              </InputGroupAddon>
            </InputGroup>
            <DayPopup
              day={draftDay}
              constraints={constraints}
              calendarProps={calendarProps}
              onPick={pick}
              labelledBy={labelledBy}
              label={ariaLabel}
              align="end"
              returnTo={() => dateInput.current}
            />
          </Popover>
          <TimeInput
            {...timeInput}
            id={timeId}
            size={size}
            disabled={isDisabled}
            invalid={timeInvalid}
            describedBy={describe(mirror.describedBy, error ? errorId : null, ariaDescribedby)}
            labelledBy={name_(zone ? `${timePartId} ${zoneId}` : timePartId)}
            label={
              !labelledBy && ariaLabel
                ? [ariaLabel, t("timePart"), zone?.long].filter(Boolean).join(", ")
                : undefined
            }
            zone={zone}
          />
        </div>
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </>
  );
}
