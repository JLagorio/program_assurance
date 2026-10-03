import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Clock } from "lucide-react";
import {
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react";
import { flushSync } from "react-dom";

import { useLedgerLocale } from "../lib/locale";
import {
  formatIsoTime,
  minutesOf,
  parseIsoTime,
  timeOfMinutes,
  type WallTime,
} from "../lib/locale-format";
import { FieldStateContext, useFieldControlState, type ControlSize } from "./controls";
import { useCustomValidity, useTypedEntry, warnOnce } from "./date-picker";
import { FieldError } from "./field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "./input-group";
import type { InputProps } from "./input";

/** Which clock a time reads on: `h12` with a day period ("5:30 PM"), or `h23` ("17:30"). */
export type TimeFieldHourCycle = "h12" | "h23";

/** Reads a time value: only an ISO time ("17:30") is a time; anything else warns and is empty. */
export function useIsoTime(value: string | undefined, part: string): WallTime | null {
  if (!value) return null;
  const time = parseIsoTime(value);
  if (!time) warnOnce(`${part}: "${value}" is not an ISO time ("HH:mm"); it is treated as empty.`);
  return time;
}

type TimeInputOptions = {
  time: WallTime | null;
  commit: (time: WallTime | null) => void;
  min: WallTime | null;
  max: WallTime | null;
  step: number;
  hourCycle: TimeFieldHourCycle | undefined;
  onEntryError?: ((message: string | null) => void) | undefined;
};

/** Typed entry, the arrow keys and the spinbutton state of a time input. Package-only. */
export function useTimeInput({
  time,
  commit,
  min,
  max,
  step: stepProp,
  hourCycle,
  onEntryError,
}: TimeInputOptions) {
  const { t, formatTime, parseTime } = useLedgerLocale();
  // A step below a minute would never move the time (or divide by zero); it counts as one.
  const step = Math.max(1, Math.round(stepProp) || 1);
  const options = hourCycle ? { hourCycle } : undefined;
  const show = (value: WallTime) => formatTime(value, options);
  const typed = useTypedEntry<WallTime>({
    shown: time ? show(time) : "",
    read: (text) => {
      const parsed = parseTime(text);
      if (!parsed) return { error: t("timeInvalid", { example: show({ hour: 17, minute: 30 }) }) };
      if (min && minutesOf(parsed) < minutesOf(min))
        return { error: t("timeTooEarly", { time: show(min) }) };
      if (max && minutesOf(parsed) > minutesOf(max))
        return { error: t("timeTooLate", { time: show(max) }) };
      return { value: parsed };
    },
    commit,
    show,
    onEntryError,
  });

  /** One step up or down from what the field holds, on the step's grid, within min and max. */
  const stepBy = (direction: 1 | -1, size: number) => {
    const parsed = typed.text.trim() ? parseTime(typed.text) : null;
    const from = parsed ?? time;
    const floor = min ? minutesOf(min) : 0;
    const ceiling = max ? minutesOf(max) : 1439;
    let next: number;
    if (!from) {
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();
      next = direction > 0 ? Math.ceil(current / size) * size : Math.floor(current / size) * size;
    } else {
      const minutes = minutesOf(from);
      next =
        direction > 0
          ? Math.floor(minutes / size) * size + size
          : Math.ceil(minutes / size) * size - size;
    }
    if (min || max) next = Math.min(Math.max(next, floor), ceiling);
    typed.set(timeOfMinutes(next));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const moves: Record<string, [1 | -1, number]> = {
      ArrowUp: [1, step],
      ArrowDown: [-1, step],
      PageUp: [1, 60],
      PageDown: [-1, 60],
    };
    const move = moves[event.key];
    if (move && !event.altKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      flushSync(() => stepBy(move[0], move[1]));
      return;
    }
    typed.inputProps.onKeyDown(event);
  };

  return {
    typed,
    /** A spinbutton that also takes typing: the value in minutes, its words, and its bounds. */
    spinbutton: {
      role: "spinbutton",
      "aria-valuemin": min ? minutesOf(min) : 0,
      "aria-valuemax": max ? minutesOf(max) : 1439,
      ...(time ? { "aria-valuenow": minutesOf(time), "aria-valuetext": show(time) } : {}),
    } as const,
    onKeyDown,
  };
}

type TimeFieldOwnProps = {
  /** The time as an ISO time of day ("17:30"), controlled; pair it with `onValueChange`. It has no date and no zone. */
  value?: string | undefined;
  /** The starting time when uncontrolled, as an ISO time. */
  defaultValue?: string | undefined;
  /** Called with the new ISO time, or "" when cleared or when the typed text is not a time. */
  onValueChange?: ((time: string) => void) | undefined;
  /** The earliest time the reader may enter, as an ISO time. Earlier is an error that names it. */
  min?: string | undefined;
  /** The latest time the reader may enter, as an ISO time. */
  max?: string | undefined;
  /** Minutes the Up and Down arrows move by, on that grid (Page Up and Page Down move an hour). A typed time is kept as typed. 15 by default. */
  step?: number | undefined;
  /** The clock the time reads on. By default the LedgerProvider locale's: 12-hour with a day period in en-US, 24-hour in de-DE. Typing either always works. */
  hourCycle?: TimeFieldHourCycle | undefined;
  /** The form field's name; a hidden input carries the ISO time on submit. Put it here, not on the Field. */
  name?: string | undefined;
  /** An external owning form, matching the native form attribute. */
  form?: string | undefined;
  /** Called with the message when the typed text is not a time the field accepts, and with null once it is. The field then reports "" and shows the message under itself. */
  onEntryError?: ((message: string | null) => void) | undefined;
  /** `medium` (32px) in a form; `small` (28px) in a toolbar. */
  size?: ControlSize | undefined;
  /**
   * Layout only; reaches the field's frame.
   * @accepts layout
   */
  className?: string | undefined;
  ref?: Ref<HTMLInputElement> | undefined;
};

export type TimeFieldProps = TimeFieldOwnProps &
  Omit<
    InputProps,
    keyof TimeFieldOwnProps | "type" | "role" | "inputMode" | "autoComplete" | "onChange"
  >;

/**
 * A time of day, typed: "5:30 pm", "17:30", "1730" and "5p" all read, and the field shows the
 * time on the locale's clock. The arrow keys step it. It holds and reports an ISO time ("17:30"),
 * the contract of `input type="time"`, with no date and no zone; a moment in time is a
 * DateTimeField. Inside a Field it takes the label, hint, error, invalid, disabled and required.
 */
export function TimeField({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 15,
  hourCycle,
  name,
  form,
  onEntryError,
  size = "medium",
  className,
  ref,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
  ...props
}: TimeFieldProps) {
  const field = useContext(FieldStateContext);
  const control = useFieldControlState();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-entry-error`;
  const input = useRef<HTMLInputElement | null>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(defaultValue ?? "");
  const time = useIsoTime(value ?? inner, "TimeField");
  const iso = time ? formatIsoTime(time) : "";
  const isDisabled = Boolean(disabled ?? (field?.disabled || control.disabled));
  const { typed, spinbutton, onKeyDown } = useTimeInput({
    time,
    commit: (next) => {
      const nextIso = next ? formatIsoTime(next) : "";
      if (value === undefined) setInner(nextIso);
      if (nextIso !== iso) onValueChange?.(nextIso);
    },
    min: useIsoTime(min, "TimeField min"),
    max: useIsoTime(max, "TimeField max"),
    step,
    hourCycle,
    onEntryError,
  });
  useCustomValidity(input, typed.error);
  const resetTyped = useRef(typed.reset);
  useEffect(() => {
    resetTyped.current = typed.reset;
  });
  useEffect(() => {
    const owner = hidden.current?.form;
    if (!owner) return;
    const reset = (event: Event) =>
      queueMicrotask(() => {
        if (event.defaultPrevented) return;
        if (value === undefined) setInner(defaultValue ?? "");
        resetTyped.current();
      });
    owner.addEventListener("reset", reset);
    return () => owner.removeEventListener("reset", reset);
  }, [form, value, defaultValue]);

  const describedBy =
    [typed.error ? errorId : null, ariaDescribedby].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(ariaInvalid) || Boolean(typed.error);
  return (
    <>
      <input ref={hidden} type="hidden" name={name} form={form} value={iso} disabled={isDisabled} />
      {/* One input and a decorative icon: no unnamed group around them, as SearchField. */}
      <InputGroup data-slot="time-field" data-entry="time" role={undefined} className={className}>
        <InputGroupAddon align="inline-start" role={undefined}>
          <Clock aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          {...props}
          ref={(node: HTMLInputElement | null) => {
            input.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={inputId}
          size={size}
          form={form}
          disabled={isDisabled}
          autoComplete="off"
          spellCheck={false}
          {...spinbutton}
          {...(describedBy ? { "aria-describedby": describedBy } : {})}
          {...(invalid ? { "aria-invalid": true } : {})}
          {...typed.inputProps}
          onKeyDown={(event) => {
            props.onKeyDown?.(event);
            if (!event.defaultPrevented) onKeyDown(event);
          }}
          onBlur={(event) => {
            props.onBlur?.(event);
            typed.inputProps.onBlur(event);
          }}
        />
      </InputGroup>
      {typed.error ? <FieldError id={errorId}>{typed.error}</FieldError> : null}
    </>
  );
}

type TimeInputProps = Omit<ReturnType<typeof useTimeInput>, "typed"> & {
  typed: ReturnType<typeof useTimeInput>["typed"];
  id: string;
  size: ControlSize;
  disabled: boolean;
  invalid: boolean;
  describedBy: string | undefined;
  labelledBy: string | undefined;
  label: string | undefined;
  /** The provider zone's names, after the time. */
  zone?: { short: string; long: string; id: string } | undefined;
  inputRef?: ((node: HTMLInputElement | null) => void) | undefined;
  onBlur?: (() => void) | undefined;
};

/**
 * The time half of a DateTimeField: the same input in its own Base UI Field, so it does not take
 * over the surrounding Field's label and ids from the day input, which is that Field's control.
 */
export function TimeInput({
  typed,
  spinbutton,
  onKeyDown,
  id,
  size,
  disabled,
  invalid,
  describedBy,
  labelledBy,
  label,
  zone,
  inputRef,
  onBlur,
}: TimeInputProps) {
  return (
    <InputGroup data-entry="time">
      <FieldPrimitive.Root className="contents" disabled={disabled}>
        <InputGroupInput
          {...(inputRef ? { ref: inputRef } : {})}
          id={id}
          size={size}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          {...spinbutton}
          {...(labelledBy ? { "aria-labelledby": labelledBy } : {})}
          {...(label ? { "aria-label": label } : {})}
          {...(describedBy ? { "aria-describedby": describedBy } : {})}
          {...(invalid ? { "aria-invalid": true } : {})}
          {...typed.inputProps}
          onKeyDown={onKeyDown}
          onBlur={(event) => {
            typed.inputProps.onBlur(event);
            onBlur?.();
          }}
        />
      </FieldPrimitive.Root>
      {zone ? (
        <InputGroupAddon align="inline-end">
          <InputGroupText id={zone.id} data-slot="time-field-zone">
            <span aria-hidden="true">{zone.short}</span>
            <span className="sr-only">{zone.long}</span>
          </InputGroupText>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
