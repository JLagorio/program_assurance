import { createContext, useContext, useMemo, type ReactNode } from "react";

import { createLedgerLocale, type LedgerLocale, type LedgerLocaleOptions } from "./locale-format";
export {
  createLedgerLocale,
  defaultMessages,
  type CalendarDay,
  type WallTime,
  type LedgerLocale,
  type LedgerLocaleOptions,
  type LedgerMessages,
  type LedgerDirection,
  type PluralForms,
} from "./locale-format";

const LocaleContext = createContext<LedgerLocale>(createLedgerLocale());

export type LedgerProviderProps = LedgerLocaleOptions & {
  /** The localized subtree. Keep locale and timeZone identical on the server and client. */
  children: ReactNode;
};

/**
 * The reader's locale, time zone and direction, and the kit's words, for every part inside: dates,
 * numbers, plural forms, labels and announcements. Mount one near the root with the reader's zone,
 * the same on the server and the client; without one, parts format in en-US and UTC. A nested
 * provider inherits every option it does not set and merges its `messages` over its parent's.
 * Renders one `div` carrying `lang` and `dir`. Keep `messages` a stable object, such as a module
 * constant: a new one on every render rebuilds the formatters. Independent of routing and
 * translation vendors.
 */
export function LedgerProvider({
  children,
  locale,
  direction,
  timeZone,
  messages,
}: LedgerProviderProps) {
  const parent = useContext(LocaleContext);
  const value = useMemo(
    () =>
      createLedgerLocale({
        locale: locale ?? parent.locale,
        direction: direction ?? parent.direction,
        timeZone: timeZone ?? parent.timeZone,
        messages: { ...parent.messages, ...messages },
      }),
    [parent, locale, direction, timeZone, messages],
  );
  return (
    <LocaleContext.Provider value={value}>
      <div lang={value.locale} dir={value.direction}>
        {children}
      </div>
    </LocaleContext.Provider>
  );
}

/**
 * Read copy and formatters from the closest LedgerProvider, for text no part renders (an export, an
 * announcement, a document title); a date on screen is a DateTime. English/UTC is the default.
 * Instants format in the provider's `timeZone`; calendar days (`formatDay`, `formatCalendarDate`)
 * never shift; typed days and times parse in the provider's locale (`parseDay`, `parseTime`).
 */
export function useLedgerLocale(): LedgerLocale {
  return useContext(LocaleContext);
}
