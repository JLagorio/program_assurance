import { createLedgerLocale, type Tone } from "@ledger/design-system";
import { useSyncExternalStore } from "react";
import { statusTone as vocabularyTone, vocabularyForValue } from "@/lib/status";

/** The product's copy is English; dates and numbers read in US English. */
export const APP_LOCALE = "en-US";

/** The reader's time zone, from the browser; UTC where there is none (the server, whose own zone
 * is not the reader's and must never reach a server render). */
export function readerTimeZone(): string {
  if (typeof window === "undefined") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

const noSubscription = () => () => {};

/**
 * The zone the LedgerProvider formats in. The server and the hydrating client both render UTC, so
 * the first paint matches; the client then switches to the reader's zone before any record loads
 * (records come through the browser-only client).
 */
export function useReaderTimeZone(): string {
  return useSyncExternalStore(noSubscription, readerTimeZone, () => "UTC");
}

let readerLocale: { zone: string; locale: ReturnType<typeof createLedgerLocale> } | null = null;
function currentLocale() {
  const zone = readerTimeZone();
  if (readerLocale?.zone !== zone)
    readerLocale = { zone, locale: createLedgerLocale({ locale: APP_LOCALE, timeZone: zone }) };
  return readerLocale.locale;
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_OPTIONS = { year: "numeric", month: "short", day: "numeric" } as const;

/**
 * A date as a string, in the same locale and zone as the LedgerProvider: an ISO day never shifts,
 * an instant reads as its day in the reader's zone.
 *
 * @deprecated Render `<DateTime value={value} />` (or `<DateLabel>` for a due date) from
 * `@ledger/design-system`, and `c.date` in a table: they format through the provider, carry the
 * machine value in a `<time>` and show Absent for nothing. Use this only where a string is required
 * (an accessible name, a document title) until the caller moves.
 */
export function displayDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const day = DAY.exec(value);
  if (day)
    return currentLocale().formatDay(
      { year: Number(day[1]), month: Number(day[2]), day: Number(day[3]) },
      DATE_OPTIONS,
    );
  const instant = Date.parse(value);
  return Number.isNaN(instant) ? value : currentLocale().formatDate(instant, DATE_OPTIONS);
}

/**
 * A stored value's tone, looked up by the value alone.
 *
 * @deprecated Name the vocabulary: `<StatusBadge statuses={taskStatuses} value={…} />` from
 * `@/components/app/status`, and `c.status(key, { statuses: taskStatuses })` in a table, with the
 * maps in `@/lib/status`. A value shared by two concepts ("active", "accepted") can only be told
 * apart there.
 */
export function statusTone(value: string): Tone {
  return vocabularyTone(vocabularyForValue(value), value);
}
