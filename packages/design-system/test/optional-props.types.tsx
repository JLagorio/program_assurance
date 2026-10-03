import {
  DataTable,
  type CountProps,
  type LedgerLocaleOptions,
  type LedgerProviderProps,
  type PreviewNavigationProps,
  type ProfileProps,
  type RecordBrowserProps,
} from "../src/index";

/* An optional prop takes `undefined` as well as leaving it out (`?: T | undefined`), so a caller
   under exactOptionalPropertyTypes can pass a value it may not have (audit API-17): each of these
   failed to compile when its prop was spelled `?: T` alone. */

const unset = undefined;

const locale: LedgerLocaleOptions = {
  locale: unset,
  direction: unset,
  timeZone: unset,
  messages: unset,
};
const provider: Omit<LedgerProviderProps, "children"> = { ...locale, direction: unset };

type Row = { id: string };
const browser: Pick<RecordBrowserProps<Row>, "filters"> = { filters: unset };

const count: Pick<CountProps, "max" | "appearance"> = { max: unset, appearance: unset };
const navigation: Pick<PreviewNavigationProps, "openLink"> = { openLink: unset };
const profile: Pick<ProfileProps, "description" | "role"> = { description: unset, role: unset };

// The Columns and Settings menus' own trigger, in place of the default button.
const columns: Pick<Parameters<typeof DataTable.Columns>[0], "children"> = { children: unset };
const settings: Pick<Parameters<typeof DataTable.Settings>[0], "children"> = { children: unset };

void [locale, provider, browser, count, navigation, profile, columns, settings];
