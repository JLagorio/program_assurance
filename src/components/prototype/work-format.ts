import { useSyncExternalStore } from "react";

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
 * (records come through the browser-only client). Dates render through `<DateTime>` or `c.date`,
 * and a string that must hold a date (an accessible name) through `useLedgerLocale().formatDate`,
 * all in this zone.
 */
export function useReaderTimeZone(): string {
  return useSyncExternalStore(noSubscription, readerTimeZone, () => "UTC");
}
