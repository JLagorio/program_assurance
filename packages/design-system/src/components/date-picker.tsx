import { useFieldRootContext } from "@base-ui/react/internals/field-root-context";
import { useLabelableId } from "@base-ui/react/internals/labelable-provider";
import { useLedgerLocale } from "../lib/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { flushSync } from "react-dom";
import type { Modifiers } from "react-day-picker";

import { cn } from "../lib/cn";
import {
  compareDays,
  dateToDay,
  dayToDate,
  formatIsoDay,
  parseInstant,
  parseIsoDay,
  zonedParts,
  type CalendarDay,
} from "../lib/locale-format";
import { Button } from "./button";
import { Calendar, type CalendarProps } from "./calendar";
import {
  FieldStateContext,
  fieldControl,
  fieldControlHeight,
  useFieldControlState,
  type ControlSize,
} from "./controls";
import { FieldError } from "./field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./input-group";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/* ——— Shared by DatePicker, DateRangePicker and DateTimeField (package-only) ——————————————— */

/** How a chosen day reads in a field: "Sep 18, 2026". */
export const dayFormat = { month: "short", day: "numeric", year: "numeric" } as const;

/**
 * Makes a button trigger the control of the Field around it, as Base UI's own Select trigger is:
 * the FieldLabel points at it, and the Field's hint, error and invalid state reach it. Returns the
 * props to spread last. Outside a Field it adds nothing. Base UI's field and labelable contexts
 * come from its internals entry, pinned with the package's exact Base UI version.
 */
export function useFieldTrigger(id: string, disabled: boolean) {
  useLabelableId({ id });
  const { validation } = useFieldRootContext();
  return (props: { "aria-describedby"?: string | undefined }) =>
    validation.getValidationProps(disabled, props) as {
      "aria-describedby"?: string | undefined;
      "aria-invalid"?: boolean | undefined;
    };
}

const warned = new Set<string>();
/** A developer mistake said once per value, never thrown: the field still renders. */
export function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

/**
 * Reads a day value. Only an ISO day ("2026-09-18") is a day; a timestamp is read as its day in
 * the provider's zone and anything else as empty, each with a warning, so the field never shows
 * one thing and submits another.
 */
export function useIsoDay(value: string | undefined, part: string): CalendarDay | null {
  const { timeZone } = useLedgerLocale();
  return useMemo(() => {
    if (!value) return null;
    const day = parseIsoDay(value);
    if (day) return day;
    const instant = parseInstant(value, timeZone);
    if (instant !== null) {
      warnOnce(
        `${part}: "${value}" is a timestamp; it takes an ISO day ("yyyy-MM-dd"). It is read as its day in ${timeZone}.`,
      );
      const { year, month, day: date } = zonedParts(instant, timeZone);
      return { year, month, day: date };
    }
    warnOnce(`${part}: "${value}" is not an ISO day ("yyyy-MM-dd"); it is treated as empty.`);
    return null;
  }, [value, timeZone, part]);
}

export type DayConstraintProps = {
  /** The earliest day the reader may choose, as an ISO day. Earlier days are disabled with the reason in their name, and typing one is an error. */
  min?: string | undefined;
  /** The latest day the reader may choose, as an ISO day. */
  max?: string | undefined;
  /**
   * Other days the reader may not choose: return true, or the reason as a sentence ("Weekends are
   * closed."), which the day's accessible name and the typed-entry error carry. Say the rule in the
   * field's hint as well, where everyone reads it.
   */
  isDateUnavailable?: ((iso: string) => boolean | string | undefined) | undefined;
};

/** min, max and unavailable days, as Calendar matchers, day names and entry errors. */
export function useDayConstraints(
  { min, max, isDateUnavailable }: DayConstraintProps,
  part: string,
) {
  const { t, formatDay } = useLedgerLocale();
  const minDay = useIsoDay(min, `${part} min`);
  const maxDay = useIsoDay(max, `${part} max`);
  return useMemo(() => {
    /** false when the day is allowed; otherwise the reason, "" when there is none to give. */
    const reasonFor = (day: CalendarDay): string | false => {
      if (minDay && compareDays(day, minDay) < 0)
        return t("dateEarliest", { date: formatDay(minDay, dayFormat) });
      if (maxDay && compareDays(day, maxDay) > 0)
        return t("dateLatest", { date: formatDay(maxDay, dayFormat) });
      const result = isDateUnavailable?.(formatIsoDay(day));
      if (typeof result === "string" && result) return result;
      return result ? "" : false;
    };
    return {
      minDay,
      maxDay,
      isAllowed: (day: CalendarDay) => reasonFor(day) === false,
      /** Why a day may not be chosen, as a sentence for a disabled control's reason; null when it may. */
      reasonOf: (day: CalendarDay): string | null => {
        const reason = reasonFor(day);
        return reason === false ? null : reason || t("dateUnavailableDay");
      },
      disabled: (date: Date) => reasonFor(dateToDay(date)) !== false,
      describeDay: (date: Date, modifiers: Modifiers) => {
        if (!modifiers["disabled"]) return undefined;
        const reason = reasonFor(dateToDay(date));
        if (reason === false) return undefined;
        return reason ? t("dateUnavailableDayReason", { reason }) : t("dateUnavailableDay");
      },
      /** What is wrong with a typed day, or null when it may be chosen. */
      entryError: (day: CalendarDay): string | null => {
        if (minDay && compareDays(day, minDay) < 0)
          return t("dateTooEarly", { date: formatDay(minDay, dayFormat) });
        if (maxDay && compareDays(day, maxDay) > 0)
          return t("dateTooLate", { date: formatDay(maxDay, dayFormat) });
        const reason = reasonFor(day);
        if (reason === false) return null;
        const date = formatDay(day, dayFormat);
        return reason
          ? t("dateUnavailableReason", { date, reason })
          : t("dateUnavailable", { date });
      },
      startMonth: minDay ? dayToDate({ ...minDay, day: 1 }) : undefined,
      endMonth: maxDay ? dayToDate({ ...maxDay, day: 1 }) : undefined,
    };
  }, [minDay, maxDay, isDateUnavailable, t, formatDay]);
}

type EntryOptions<T> = {
  /** The committed value the text shows when the reader is not typing. */
  shown: string;
  /** Reads the typed text: the value, or the message that says what is wrong. Empty text is `null`. */
  read: (text: string) => { value: T | null } | { error: string };
  /** Called with the value the text now holds, or null for none. */
  commit: (value: T | null) => void;
  /** The shown text for a value the reader just typed. */
  show: (value: T) => string;
  onEntryError?: ((message: string | null) => void) | undefined;
};

/**
 * Typed entry shared by the day and time fields. The text is read on blur and Enter, never while
 * typing. A value that reads is committed and shown in the locale's words; one that does not keeps
 * the reader's text, commits "no value" and says what fixes it, so nothing is dropped or kept
 * silently. Escape puts back the last committed text.
 */
export function useTypedEntry<T>({ shown, read, commit, show, onEntryError }: EntryOptions<T>) {
  const [text, setText] = useState(shown);
  const [error, setError] = useState<string | null>(null);
  // The shown text this field's own commit leads to, so it is not mistaken for an outside change.
  const expected = useRef<string | null>(null);
  useEffect(() => {
    if (expected.current === shown) {
      expected.current = null;
      return;
    }
    expected.current = null;
    setText(shown);
    setError(null);
  }, [shown]);
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (reported.current === error) return;
    reported.current = error;
    onEntryError?.(error);
  }, [error, onEntryError]);

  const finish = (raw: string) => {
    const result = raw.trim() ? read(raw.trim()) : { value: null };
    if ("error" in result) {
      setError(result.error);
      expected.current = "";
      commit(null);
      return;
    }
    const next = result.value === null ? "" : show(result.value);
    setError(null);
    setText(next);
    expected.current = next;
    commit(result.value);
  };
  return {
    text,
    error,
    /** Set the value directly (a day picked from the month), as if typed and read. */
    set: (value: T | null) => {
      const next = value === null ? "" : show(value);
      setError(null);
      setText(next);
      expected.current = next;
      commit(value);
    },
    reset: () => {
      setText(shown);
      setError(null);
    },
    inputProps: {
      value: text,
      onChange: (event: { currentTarget: HTMLInputElement }) => {
        setText(event.currentTarget.value);
        setError(null);
      },
      onBlur: (event: { currentTarget: HTMLInputElement }) => finish(event.currentTarget.value),
      onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
          // Committed before the form's implicit submission reads the hidden input.
          const raw = event.currentTarget.value;
          flushSync(() => finish(raw));
        } else if (event.key === "Escape" && (event.currentTarget.value !== shown || error)) {
          // Put back the last committed text; a dialog around the field stays open.
          event.preventDefault();
          event.stopPropagation();
          setText(shown);
          setError(null);
        }
      },
    },
  };
}

type DayPopupProps = {
  day: CalendarDay | null;
  constraints: ReturnType<typeof useDayConstraints>;
  calendarProps?: DatePickerProps["calendarProps"];
  onPick: (date: Date | undefined) => void;
  /** Names the month after its field. */
  labelledBy?: string | undefined;
  label?: string | undefined;
  align: "start" | "end";
  /** Where focus goes when the month closes: the field that opened it. */
  returnTo: () => HTMLElement | null;
};

/** The month with Today and Clear under it, in a popover named after its field. */
export function DayPopup({
  day,
  constraints,
  calendarProps,
  onPick,
  labelledBy,
  label,
  align,
  returnTo,
}: DayPopupProps) {
  const { t } = useLedgerLocale();
  const today = dateToDay(new Date());
  return (
    <PopoverContent
      {...(labelledBy
        ? { "aria-labelledby": labelledBy }
        : { "aria-label": label ?? t("chooseDate") })}
      finalFocus={returnTo}
      align={align}
      className="gap-0 p-0"
      style={{ width: "auto" }}
    >
      <Calendar
        mode="single"
        autoFocus
        {...(constraints.startMonth ? { startMonth: constraints.startMonth } : {})}
        {...(constraints.endMonth ? { endMonth: constraints.endMonth } : {})}
        {...calendarProps}
        {...(day ? { selected: dayToDate(day), defaultMonth: dayToDate(day) } : {})}
        disabled={constraints.disabled}
        describeDay={constraints.describeDay}
        onSelect={onPick}
      />
      <div className="flex items-center justify-between gap-100 border-t border-default px-150 py-100">
        <Button
          variant="subtle"
          size="small"
          // Stays reachable when today may not be chosen, and says why.
          disabledReason={constraints.reasonOf(today) ?? undefined}
          onClick={() => onPick(dayToDate(today))}
        >
          {t("today")}
        </Button>
        <Button variant="subtle" size="small" disabled={!day} onClick={() => onPick(undefined)}>
          {t("clear")}
        </Button>
      </div>
    </PopoverContent>
  );
}

/** Keeps a native constraint in step with the entry error, so `:invalid` and `checkValidity()` agree. */
export function useCustomValidity(
  input: { current: HTMLInputElement | null },
  error: string | null,
) {
  useEffect(() => {
    input.current?.setCustomValidity(error ?? "");
  }, [input, error]);
}

/* ——— DatePicker ——————————————————————————————————————————————————————————————————————————— */

type DatePickerOwnProps = DayConstraintProps & {
  /** The chosen day as an ISO date ("2026-09-14"), controlled; pair it with `onValueChange`. Anything else warns: a timestamp is read as its day in the provider's zone, other text as empty. */
  value?: string | undefined;
  /** The starting day when uncontrolled, as an ISO date. */
  defaultValue?: string | undefined;
  /** Called with the new ISO date, or "" when cleared or when typed text is not a day. The kit's name for a value callback, as on Select, NumberField and the other date fields. */
  onValueChange?: ((iso: string) => void) | undefined;
  /**
   * Called with the new ISO date, as `onValueChange` is; both run when both are given.
   * @deprecated Use `onValueChange`, the name every other value control uses. Kept for one version.
   */
  onChange?: ((iso: string) => void) | undefined;
  /** What the field says with no day chosen: "Choose a date" when picking, nothing when typing. */
  placeholder?: string | undefined;
  /** `medium` (32px) in a form; `small` (28px) in a toolbar. */
  size?: ControlSize | undefined;
  /** Not available. The last resort. A Field's or FieldSet's `disabled` also reaches it. */
  disabled?: boolean | undefined;
  /** The form field's name; a hidden input carries the ISO date on submit. */
  name?: string | undefined;
  /** An external owning form, matching the native form attribute. */
  form?: string | undefined;
  id?: string | undefined;
  /** Names the field. Inside a Field it defaults to the FieldLabel. */
  "aria-labelledby"?: string | undefined;
  /** Open on first render; for a sheet that exists to pick this day, and for the docs. */
  defaultOpen?: boolean | undefined;
  /** Layout only. */
  className?: string | undefined;
  /** The name when there is no visible label. */
  "aria-label"?: string | undefined;
  /** Set when form validation fails; the border turns. A typed entry that is not a day sets it too. */
  "aria-invalid"?: boolean | undefined;
  /** Accepted and not rendered when picking: a button may not carry `aria-required`. The asterisk and the form's check say required. A typed field announces it. */
  "aria-required"?: boolean | undefined;
  /** IDs of the hint or error describing the control. The chosen day is described first. */
  "aria-describedby"?: string | undefined;
  /**
   * `pick` (the default): a button that opens the month. `type`: a text field that reads the day
   * in the provider's locale ("Sep 18, 2026", "9/18/2026", "2026-09-18", "9/18") with a button that
   * opens the month, for a date the reader already knows. Its label, hint, error, invalid,
   * disabled and required come from the Field around it, and native props and the ref reach the
   * input.
   */
  entry?: "pick" | "type" | undefined;
  /**
   * With `entry="type"`: called with the message when the typed text is not a day the field
   * accepts, and with null once it is. The field then reports "" and shows the message under
   * itself; a form library can show it in place of its own "Required.".
   */
  onEntryError?: ((message: string | null) => void) | undefined;
  /** The month's own options: the year dropdown (`captionLayout="dropdown"`), the months it reaches, week numbers. */
  calendarProps?:
    | Pick<
        CalendarProps,
        "captionLayout" | "startMonth" | "endMonth" | "showWeekNumber" | "fixedWeeks"
      >
    | undefined;
};

export type DatePickerProps = DatePickerOwnProps &
  Omit<ComponentProps<"button">, keyof DatePickerOwnProps | "children" | "type">;

/**
 * One day, picked from a Calendar in a Popover or typed. Holds and reports an ISO day
 * ("2026-09-14"), the contract of `input type="date"`, and shows it as "Sep 14, 2026". Today and
 * Clear sit under the month; `min`, `max` and `isDateUnavailable` disable days with their reason.
 */
export function DatePicker({
  value,
  defaultValue,
  onValueChange,
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
  "aria-required": ariaRequired,
  min,
  max,
  isDateUnavailable,
  entry = "pick",
  onEntryError,
  calendarProps,
  ...triggerProps
}: DatePickerProps) {
  const { t, formatDay, parseDay } = useLedgerLocale();
  const field = useContext(FieldStateContext);
  const control = useFieldControlState();
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const valueId = `${triggerId}-value`;
  const errorId = `${triggerId}-entry-error`;
  const chooseId = `${triggerId}-choose`;
  const hidden = useRef<HTMLInputElement>(null);
  const typedInput = useRef<HTMLInputElement | null>(null);
  const [inner, setInner] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(defaultOpen);
  const day = useIsoDay(value ?? inner, "DatePicker");
  const iso = day ? formatIsoDay(day) : "";
  const constraints = useDayConstraints({ min, max, isDateUnavailable }, "DatePicker");
  const isDisabled = Boolean(disabled ?? (field?.disabled || control.disabled));
  const labelledBy = ariaLabelledby ?? (ariaLabel === undefined ? control.labelId : undefined);
  const bindTrigger = useFieldTrigger(triggerId, isDisabled);
  const today = dateToDay(new Date());

  const report = (next: CalendarDay | null) => {
    const nextIso = next ? formatIsoDay(next) : "";
    if (value === undefined) setInner(nextIso);
    if (nextIso === iso) return;
    onValueChange?.(nextIso);
    onChange?.(nextIso);
  };
  const typed = useTypedEntry<CalendarDay>({
    shown: day ? formatDay(day, dayFormat) : "",
    read: (text) => {
      const parsed = parseDay(text, today);
      if (!parsed) return { error: t("dateInvalid", { example: formatDay(today, dayFormat) }) };
      const problem = constraints.entryError(parsed);
      return problem ? { error: problem } : { value: parsed };
    },
    commit: report,
    show: (next) => formatDay(next, dayFormat),
    onEntryError,
  });
  useCustomValidity(typedInput, entry === "type" ? typed.error : null);
  const resetTyped = useRef(typed.reset);
  useEffect(() => {
    resetTyped.current = typed.reset;
  });

  useEffect(() => {
    const owner = hidden.current?.form;
    if (!owner) return;
    const reset = (event: Event) => {
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setInner(defaultValue ?? "");
        resetTyped.current();
        setOpen(false);
      });
    };
    owner.addEventListener("reset", reset);
    return () => owner.removeEventListener("reset", reset);
  }, [form, value, defaultValue]);

  const pick = (next: Date | undefined) => {
    if (isDisabled) return;
    const chosen = next ? dateToDay(next) : null;
    if (entry === "type") typed.set(chosen);
    else report(chosen);
    setOpen(false);
  };

  const popup = (
    <DayPopup
      day={day}
      constraints={constraints}
      calendarProps={calendarProps}
      onPick={pick}
      labelledBy={labelledBy}
      label={ariaLabel}
      align={entry === "type" ? "end" : "start"}
      returnTo={() => hidden.current?.ownerDocument.getElementById(triggerId) ?? null}
    />
  );

  const hiddenInput = (
    <input ref={hidden} type="hidden" name={name} form={form} value={iso} disabled={isDisabled} />
  );

  if (entry === "type") {
    const describedBy =
      [typed.error ? errorId : null, ariaDescribedby].filter(Boolean).join(" ") || undefined;
    const invalid = Boolean(ariaInvalid) || Boolean(typed.error);
    return (
      <>
        {hiddenInput}
        <Popover open={open && !isDisabled} onOpenChange={(next) => setOpen(next && !isDisabled)}>
          <InputGroup data-entry="type" className={className}>
            <InputGroupInput
              {...(triggerProps as ComponentProps<typeof InputGroupInput>)}
              ref={(node: HTMLInputElement | null) => {
                typedInput.current = node;
                const forwarded = (triggerProps as { ref?: unknown }).ref;
                if (typeof forwarded === "function") forwarded(node);
                else if (forwarded && typeof forwarded === "object")
                  (forwarded as { current: unknown }).current = node;
              }}
              id={triggerId}
              size={size}
              form={form}
              autoComplete="off"
              spellCheck={false}
              disabled={isDisabled}
              placeholder={placeholder}
              {...(labelledBy ? { "aria-labelledby": labelledBy } : {})}
              {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
              {...(describedBy ? { "aria-describedby": describedBy } : {})}
              {...(invalid ? { "aria-invalid": true } : {})}
              {...(ariaRequired ? { "aria-required": true } : {})}
              {...typed.inputProps}
              onKeyDown={(event) => {
                (triggerProps.onKeyDown as ((e: typeof event) => void) | undefined)?.(event);
                if (event.altKey && event.key === "ArrowDown") {
                  event.preventDefault();
                  setOpen(true);
                  return;
                }
                typed.inputProps.onKeyDown(event);
              }}
              onBlur={(event) => {
                (triggerProps.onBlur as ((e: typeof event) => void) | undefined)?.(event);
                typed.inputProps.onBlur(event);
              }}
            />
            <InputGroupAddon align="inline-end">
              <span id={chooseId} hidden>
                {t("chooseDate")}
              </span>
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
          {popup}
        </Popover>
        {typed.error ? <FieldError id={errorId}>{typed.error}</FieldError> : null}
      </>
    );
  }

  const describedBy =
    [day ? valueId : null, ariaDescribedby].filter(Boolean).join(" ") || undefined;
  return (
    <>
      {hiddenInput}
      <Popover open={open && !isDisabled} onOpenChange={(next) => setOpen(next && !isDisabled)}>
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
              data-entry="pick"
              aria-label={ariaLabel}
              aria-labelledby={labelledBy}
              {...bindTrigger({ "aria-describedby": describedBy })}
              {...(ariaInvalid ? { "aria-invalid": true } : {})}
              id={triggerId}
              aria-required={undefined}
              className={cn(
                fieldControl,
                fieldControlHeight[size],
                "flex items-center justify-start gap-100 text-start font-regular shadow-none",
                className,
              )}
            >
              <span
                id={valueId}
                className={cn("min-w-0 flex-1 truncate tabular-nums", !day && "text-subtlest")}
              >
                {day ? formatDay(day, dayFormat) : (placeholder ?? t("chooseDate"))}
              </span>
            </Button>
          }
        />
        {popup}
      </Popover>
    </>
  );
}
