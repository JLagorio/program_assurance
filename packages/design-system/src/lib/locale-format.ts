/** Default copy is replaceable at a provider boundary; templates preserve translated word order. */
export const defaultMessages = {
  close: "Close",
  open: "Open",
  back: "Back",
  next: "Next",
  previous: "Previous",
  cancel: "Cancel",
  confirm: "Confirm",
  clear: "Clear",
  search: "Search",
  loading: "Loading",
  refreshing: "Refreshing",
  notifications: "Notifications",
  pagination: "Pagination",
  pageLabel: "Page {page}",
  previousPage: "Previous page",
  nextPage: "Next page",
  firstPage: "First page",
  lastPage: "Last page",
  pageOf: "Page {page} of {total}",
  chooseDate: "Choose a date",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  selection: "Selection",
  selectedCount: "{count} selected",
  selectAllCount: "Select all {count}",
  selectAll: "Select all",
  selectPage: "Select all rows on this page",
  selectRow: "Select row {id}",
  reorderRow: "Reorder row {id}",
  reorderColumn: "Reorder column",
  dragInstructions:
    "Press Space to pick up. Use arrow keys to move. Press Space to drop, or Escape to cancel.",
  dragStarted: "Picked up {item}.",
  dragOver: "{item} moved over {target}.",
  dragOutside: "{item} moved outside a drop target.",
  dragDropped: "Dropped {item} over {target}.",
  dragCanceled: "Dragging canceled. {item} returned to its starting position.",
  shareOfTotal: "{share} of {total}",
  rowActions: "Row actions",
  columns: "Columns",
  show: "Show",
  rows: "Rows",
  compactRows: "Compact rows",
  resetView: "Reset view",
  resetColumns: "Reset columns",
  columnMenu: "{label} column menu",
  sortAscending: "Sort ascending",
  sortDescending: "Sort descending",
  pinStart: "Pin to start",
  pinEnd: "Pin to end",
  unpin: "Unpin",
  hideColumn: "Hide column",
  from: "From",
  to: "To",
  chosenCount: "{count} chosen",
  contains: "{label} contains",
  savedQuestions: "Saved questions",
  view: "View",
  tableSettings: "Table settings",
  details: "Details",
  detailsLabel: "{label}, details",
  reorder: "Reorder",
  rowsError: "The rows could not be loaded.",
  nothingHere: "Nothing here",
  nothingToShow: "Nothing to show yet",
  noResults: "No results found",
  noMatches: "Nothing matches",
  retry: "Try again",
  chartError: "The chart could not load",
  chartPath: "Chart path",
  showChart: "Show as chart",
  showTable: "Show as table",
  download: "Download",
  expand: "Expand",
  tableLabel: "{label}, as a table",
  paginationLabel: "{label} pagination",
  loadingLabel: "{label}, loading",
  target: "Target",
  point: "Point",
  points: "Points",
  value: "Value",
  downloadCsv: "Download CSV",
  downloadPng: "Download PNG",
  resizeColumn: "Resize column",
  resize: "Resize",
  month: "Month",
  year: "Year",
  selected: "Selected",
  calendarWeek: "Week {week}",
  preview: "Preview",
  previewRow: "Preview row",
  collapse: "Collapse",
  collapseLabel: "Collapse {label}",
  expandLabel: "Expand {label}",
  tableScrolls: "Table, scrolls",
  tableScrollsLabel: "{label}, scrolls",
  code: "Code",
  copyFailed: "Could not copy",
  today: "Today",
  choose: "Choose…",
  saveFailed: "Could not save",
  saving: "Saving",
  saved: "Saved",
  notSaved: "Not saved",
  rowRange: "{from}–{to} of {total}",
  zeroRows: "0 rows",
  copy: "Copy",
  copied: "Copied",
  required: "Required.",
  editLabel: "Edit {label}",
  save: "Save",
  more: "More",
  lightMode: "Light",
  darkMode: "Dark",
  systemMode: "Match system",
  colorMode: "Colour mode",
} satisfies Record<string, string>;

export type LedgerMessages = { [K in keyof typeof defaultMessages]: string };
export type LedgerDirection = "ltr" | "rtl";
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export type LedgerLocaleOptions = {
  /** BCP 47 locale shared by server and client. Defaults to en-US, never the host environment. */
  locale?: string;
  /** Logical writing direction, applied to the provider scope and exposed for portals. */
  direction?: LedgerDirection;
  /** Time zone for timestamps. Date-only calendar values use formatCalendarDate instead. */
  timeZone?: string;
  /** Translated messages. Nested providers inherit untranslated messages. */
  messages?: Partial<LedgerMessages>;
};

const interpolate = (message: string, params: Record<string, string | number> = {}) =>
  message.replace(/\{(\w+)\}/g, (match, key: string) => String(params[key] ?? match));

/** Pure formatter factory for server rendering, non-React code and deterministic tests. */
export function createLedgerLocale({
  locale = "en-US",
  direction = "ltr",
  timeZone = "UTC",
  messages = {},
}: LedgerLocaleOptions = {}) {
  const copy: LedgerMessages = { ...defaultMessages, ...messages };
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale, options).format(value);
  const formatDate = (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(value);
  return {
    locale,
    direction,
    timeZone,
    messages: copy,
    t: (key: keyof LedgerMessages, params?: Record<string, string | number>) =>
      interpolate(copy[key], params),
    formatNumber,
    formatDate,
    /** A calendar Date represents the selected local year/month/day, not a UTC timestamp. */
    formatCalendarDate: (value: Date, options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
        Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
      ),
    formatPlural: (count: number, forms: PluralForms) =>
      interpolate(forms[new Intl.PluralRules(locale).select(count)] ?? forms.other, {
        count: formatNumber(count),
      }),
  };
}

export type LedgerLocale = ReturnType<typeof createLedgerLocale>;
