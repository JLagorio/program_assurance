import { CalendarDays, CircleAlert, CircleCheck, Clock } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import {
  compareDays,
  dateToDay,
  formatIsoDay,
  parseInstant,
  parseIsoDay,
  type CalendarDay,
} from "../lib/locale-format";
import { toneClasses } from "../lib/status-tone";
import { warnOnce } from "./date-picker";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { Absent } from "./typography";

/** A value the display parts read: an ISO day, an ISO instant, a Date or epoch milliseconds. */
export type DateTimeValue = string | number | Date | null | undefined;

/** How much of a value shows: a day, a day and a time, a time, or Intl options of your own. */
export type DateTimeFormat = "date" | "datetime" | "time" | Intl.DateTimeFormatOptions;

const presets = {
  date: { month: "short", day: "numeric", year: "numeric" },
  datetime: { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" },
  time: { hour: "numeric", minute: "2-digit" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

/** What can take focus around a date and so reveal it: a link, a button or a widget row. */
const FOCUSABLE_HOST =
  'a[href], button, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="row"], [role="treeitem"]';

/**
 * The host around a date that takes focus itself, or null. A row or option that is not focusable
 * (no `tabindex`, as in a plain table) is no host: the date then keeps its own tab stop, or the
 * keyboard could never reach the full value.
 */
function focusableHost(element: HTMLElement | null): Element | null {
  const host = element?.parentElement?.closest(FOCUSABLE_HOST) ?? null;
  if (!(host instanceof HTMLElement)) return null;
  if (host.matches("a[href], button, summary") || host.hasAttribute("tabindex")) return host;
  return null;
}

type Read =
  | { kind: "day"; day: CalendarDay; iso: string }
  | { kind: "instant"; instant: number; iso: string };

/** Reads a value as a calendar day (which never shifts) or an instant (shown in the provider's zone). */
function useRead(value: DateTimeValue, part: string): Read | null {
  const { timeZone } = useLedgerLocale();
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date || typeof value === "number") {
    const instant = +value;
    if (Number.isNaN(instant)) return null;
    return { kind: "instant", instant, iso: new Date(instant).toISOString() };
  }
  const day = parseIsoDay(value);
  if (day) return { kind: "day", day, iso: formatIsoDay(day) };
  const instant = parseInstant(value, timeZone);
  if (instant !== null) return { kind: "instant", instant, iso: new Date(instant).toISOString() };
  warnOnce(`${part}: "${value}" is not an ISO day or instant; it is shown as written.`);
  return null;
}

/** The words for a read value: its text and its full form for the tooltip. */
function useWords(read: Read | null, format: DateTimeFormat | undefined, showTimeZone: boolean) {
  const { formatDay, formatDate } = useLedgerLocale();
  if (!read) return null;
  if (read.kind === "day") {
    // A day has no time: every preset shows it as a day.
    const options = typeof format === "object" ? format : presets.date;
    return {
      text: formatDay(read.day, options),
      full: formatDay(read.day, { dateStyle: "full" }),
    };
  }
  const options = typeof format === "object" ? format : presets[format ?? "datetime"];
  return {
    text: formatDate(read.instant, showTimeZone ? { ...options, timeZoneName: "short" } : options),
    full: formatDate(read.instant, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "long",
    }),
  };
}

type DateTimeOwnProps = {
  /** An ISO day ("2026-09-18"), which never shifts; an ISO instant, a Date or epoch milliseconds, shown in the LedgerProvider's time zone. Nothing shows Absent. */
  value: DateTimeValue;
  /** `date` ("Sep 18, 2026", a day's default), `datetime` ("Sep 18, 2026, 5:30 PM", an instant's default), `time` ("5:30 PM"), or Intl options. */
  format?: DateTimeFormat | undefined;
  /** Adds the zone's short name to an instant: "Sep 18, 2026, 5:30 PM PDT". The tooltip always names the zone. */
  showTimeZone?: boolean | undefined;
  /** Leaves out the full value ("Friday, September 18, 2026 at 5:30 PM Pacific Daylight Time"), which otherwise opens in a tooltip on hover and keyboard focus and is the description a screen reader hears on focus. Off by default, as on IconButton. */
  isTooltipDisabled?: boolean | undefined;
  /**
   * Takes a tab stop so the keyboard reaches the tooltip. On by default; inside a link, a button
   * or a row the host's focus opens it instead and the date takes no tab stop. Turn it off in a
   * dense list whose rows or preview already show the full value.
   */
  focusable?: boolean | undefined;
  /** What a screen reader hears where there is no value, as Absent's `label`. */
  absentLabel?: string | undefined;
  ref?: Ref<HTMLTimeElement> | undefined;
};

export type DateTimeProps = DateTimeOwnProps &
  Omit<ComponentProps<"time">, keyof DateTimeOwnProps | "children" | "dateTime">;

type DateTimeTextProps = DateTimeProps & {
  /** The visible words in place of the formatted value (RelativeTime's "2 hours ago"). Package-only. */
  text?: string | undefined;
};

/** The shared renderer: a `<time>` with its machine value, words and the tooltip. */
function DateTimeText({
  value,
  format,
  showTimeZone = false,
  isTooltipDisabled = false,
  focusable = true,
  absentLabel,
  text,
  className,
  ref,
  ...props
}: DateTimeTextProps) {
  const tooltip = !isTooltipDisabled;
  const read = useRead(value, "DateTime");
  const words = useWords(read, format, showTimeZone);
  const descriptionId = useId();
  const element = useRef<HTMLTimeElement | null>(null);
  const [host, setHost] = useState<Element | null>(null);
  const [hostFocused, setHostFocused] = useState(false);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    setHost(focusableHost(element.current));
  }, []);
  useEffect(() => {
    if (!host || !tooltip) return;
    const focusIn = () => setHostFocused(host.matches(":focus-visible"));
    const focusOut = () => setHostFocused(false);
    host.addEventListener("focusin", focusIn);
    host.addEventListener("focusout", focusOut);
    return () => {
      host.removeEventListener("focusin", focusIn);
      host.removeEventListener("focusout", focusOut);
    };
  }, [host, tooltip]);

  if (!read || !words) {
    if (value === null || value === undefined || value === "")
      return (
        <Absent
          {...(absentLabel ? { label: absentLabel } : {})}
          {...(className ? { className } : {})}
        />
      );
    return (
      <span data-slot="date-time" className={className}>
        {String(value)}
      </span>
    );
  }

  const shown = text ?? words.text;
  const reveals = tooltip && words.full !== shown;
  const setRef = (node: HTMLTimeElement | null) => {
    element.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  const time = (
    <time
      {...props}
      ref={setRef}
      data-slot="date-time"
      dateTime={read.iso}
      suppressHydrationWarning
      {...(reveals && focusable && !host && props.tabIndex === undefined ? { tabIndex: 0 } : {})}
      {...(reveals ? { "aria-describedby": descriptionId } : {})}
      className={cn(
        "whitespace-nowrap tabular-nums",
        reveals && "rounded-xsmall focus-visible:outline-focused",
        className,
      )}
    >
      {shown}
    </time>
  );
  if (!reveals) return time;
  return (
    <>
      <Tooltip open={open || hostFocused} onOpenChange={setOpen}>
        <TooltipTrigger render={time} />
        <TooltipContent aria-hidden="true">{words.full}</TooltipContent>
      </Tooltip>
      <span id={descriptionId} hidden>
        {words.full}
      </span>
    </>
  );
}

/**
 * A date or a moment, formatted through the LedgerProvider's locale and time zone, in a `<time>`
 * with its ISO value. The full value opens in a tooltip on hover and keyboard focus and is the
 * description a screen reader hears. Days never shift across zones; instants show in the
 * provider's zone.
 */
export function DateTime(props: DateTimeProps) {
  return <DateTimeText {...props} />;
}

/** The words a calendar day reads as from today: "today", "in 3 days", "last month". */
function relativeDay(
  day: CalendarDay,
  today: CalendarDay,
  format: Intl.RelativeTimeFormat,
): string {
  const days = Math.round(
    (Date.UTC(day.year, day.month - 1, day.day) -
      Date.UTC(today.year, today.month - 1, today.day)) /
      86_400_000,
  );
  const distance = Math.abs(days);
  if (distance < 7) return format.format(days, "day");
  if (distance < 30) return format.format(Math.round(days / 7), "week");
  if (distance < 365) return format.format(Math.round(days / 30.44), "month");
  return format.format(Math.round(days / 365.25), "year");
}

export type RelativeTimeProps = Omit<DateTimeProps, "format" | "showTimeZone"> & {
  /** The moment the words are relative to. By default the clock, and the words update as it runs; a fixed `now` never updates. */
  now?: Date | number | undefined;
  /** `long` ("2 hours ago"), `short` ("2 hr. ago") or `narrow` ("2h ago"). */
  unitStyle?: Intl.RelativeTimeFormatStyle | undefined;
};

/**
 * A moment relative to now ("5 minutes ago", "tomorrow", "in 3 days"), through
 * Intl.RelativeTimeFormat in the LedgerProvider's locale. The words update as time passes; the
 * exact value is in the tooltip and the `<time>` element. A day reads relative to today.
 */
export function RelativeTime({ value, now, unitStyle = "long", ...props }: RelativeTimeProps) {
  const { locale, formatRelative } = useLedgerLocale();
  const read = useRead(value, "RelativeTime");
  const [clock, setClock] = useState(() => (now === undefined ? Date.now() : +now));
  const current = now === undefined ? clock : +now;
  let text: string | undefined;
  let next = 3_600_000;
  if (read?.kind === "instant") {
    const words = formatRelative(read.instant, current, unitStyle);
    text = words.text;
    next = words.next;
  } else if (read?.kind === "day") {
    text = relativeDay(
      read.day,
      dateToDay(new Date(current)),
      new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: unitStyle }),
    );
  }
  const iso = read?.iso;
  useEffect(() => {
    if (now !== undefined || !iso) return;
    const timer = setTimeout(() => setClock(Date.now()), next);
    return () => clearTimeout(timer);
  }, [now, iso, next, current]);
  return <DateTimeText value={value} {...props} {...(text ? { text } : {})} />;
}

/** Where a due date stands against now. */
export type DateLabelState = "overdue" | "today" | "soon" | "upcoming" | "complete";

export type DateLabelProps = Omit<ComponentProps<"span">, "children"> & {
  /** The due date: an ISO day, compared with the reader's today, or an instant, compared with now in the provider's zone. Nothing shows Absent. */
  value: DateTimeValue;
  /** The work is done: the date shows plainly, never due or overdue. */
  complete?: boolean | undefined;
  /** How many days ahead read as soon ("Due tomorrow", "Due in 2 days"), in the warning tone. 2 by default; 0 turns it off. */
  soonWithin?: number | undefined;
  /** The moment the state is judged from; by default the clock at render. */
  now?: Date | number | undefined;
  /** How the date shows, as on DateTime: a day's `date` and an instant's `datetime` by default. */
  format?: DateTimeFormat | undefined;
  /** What a screen reader hears where there is no value. */
  absentLabel?: string | undefined;
};

const stateLook: Record<DateLabelState, { className: string; icon: ReactNode }> = {
  overdue: { className: toneClasses.danger.subtle, icon: <CircleAlert aria-hidden /> },
  today: { className: toneClasses.warning.subtle, icon: <Clock aria-hidden /> },
  soon: { className: toneClasses.warning.subtle, icon: <Clock aria-hidden /> },
  upcoming: { className: "text-default", icon: <CalendarDays aria-hidden /> },
  complete: { className: "text-subtle", icon: <CircleCheck aria-hidden /> },
};

/**
 * A due date that says where it stands: overdue, due today and due soon each carry an icon and
 * words beside the date as well as a tone, so the state never rests on colour. A completed item's
 * date shows plainly.
 */
export function DateLabel({
  value,
  complete = false,
  soonWithin = 2,
  now,
  format,
  absentLabel,
  className,
  ...props
}: DateLabelProps) {
  const { t, locale, zonedParts } = useLedgerLocale();
  const read = useRead(value, "DateLabel");
  if (!read)
    return (
      <DateTime
        value={value}
        {...(absentLabel ? { absentLabel } : {})}
        {...(className ? { className } : {})}
      />
    );
  const moment = now === undefined ? Date.now() : +now;
  let state: DateLabelState = "upcoming";
  let days = 0;
  if (complete) state = "complete";
  else {
    const today = read.kind === "day" ? dateToDay(new Date(moment)) : zonedParts(moment);
    const dueDay = read.kind === "day" ? read.day : zonedParts(read.instant);
    const order = compareDays(dueDay, today);
    days = Math.round(
      (Date.UTC(dueDay.year, dueDay.month - 1, dueDay.day) -
        Date.UTC(today.year, today.month - 1, today.day)) /
        86_400_000,
    );
    if (read.kind === "instant" ? read.instant < moment : order < 0) state = "overdue";
    else if (order === 0) state = "today";
    else if (soonWithin > 0 && days <= soonWithin) state = "soon";
  }
  const words: Record<DateLabelState, string | null> = {
    overdue: t("dateOverdue"),
    today: t("dateDueToday"),
    soon: t("dateDueSoon", {
      relative: new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(days, "day"),
    }),
    upcoming: null,
    complete: null,
  };
  const look = stateLook[state];
  return (
    <span
      {...props}
      data-slot="date-label"
      data-state={state}
      className={cn(
        "inline-flex max-w-full items-center gap-050 rounded-small px-075 py-025 font-body-small whitespace-nowrap [&>svg]:size-icon-small [&>svg]:shrink-0",
        look.className,
        className,
      )}
    >
      {look.icon}
      <DateTime value={value} {...(format ? { format } : {})} />
      {words[state] ? (
        <>
          <span aria-hidden="true">·</span>
          <span className="font-medium">{words[state]}</span>
        </>
      ) : null}
    </span>
  );
}
