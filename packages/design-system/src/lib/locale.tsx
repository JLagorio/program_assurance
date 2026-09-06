import { createContext, useContext, useMemo, type ReactNode } from "react";

import { createLedgerLocale, type LedgerLocale, type LedgerLocaleOptions } from "./locale-format";
export {
  createLedgerLocale,
  defaultMessages,
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

/** Scoped copy, number/date formatting and direction; independent of routing and translation vendors. */
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

/** Read copy and formatters from the closest LedgerProvider. English/UTC is the safe default. */
export function useLedgerLocale(): LedgerLocale {
  return useContext(LocaleContext);
}
