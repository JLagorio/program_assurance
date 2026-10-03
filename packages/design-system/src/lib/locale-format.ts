/** Default copy is replaceable at a provider boundary; templates preserve translated word order. */
export const defaultMessages = {
  close: "Close",
  open: "Open",
  back: "Back",
  next: "Next",
  previous: "Previous",
  previousRecord: "Previous record",
  nextRecord: "Next record",
  openFullRecord: "Open full record in new tab",
  opensInNewTab: "(opens in a new tab)",
  recordPosition: "{position} of {total} records",
  recordOutsideResults: "Record outside the current results",
  recordPositionNamed: "{record}, {position} of {total} records",
  recordOutsideResultsNamed: "{record}, outside the current results",
  recordPositionShort: "{position} of {total}",
  recordNotInResults: "Not in results",
  recordNavigation: "Record navigation",
  backToPreviousRecord: "Back to previous record",
  openTheFullRecord: "Open the full record",
  cancel: "Cancel",
  confirm: "Confirm",
  clear: "Clear",
  search: "Search",
  loading: "Loading",
  progressIndeterminate: "In progress",
  skipTo: "Skip to {area}",
  closeSideNavigation: "Close side navigation",
  resizeSideNavigation: "Resize side navigation",
  resizeDetails: "Resize details",
  closeDetails: "Close details",
  resizePanelNamed: "Resize {label}",
  closePanelNamed: "Close {label}",
  skipLinks: "Skip to",
  banner: "Banner",
  topNavigation: "Top navigation",
  sideNavigation: "Side navigation",
  collapseSideNavigation: "Collapse side navigation",
  expandSideNavigation: "Expand side navigation",
  mainContent: "Main content",
  pageContext: "Page context",
  actions: "Actions",
  switchProduct: "Switch product",
  pixelsWide: "{width} pixels wide",
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
  selectedCountOf: "{count} of {total} selected",
  selectionShown: "{count}. Actions: {actions}.",
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
  moveLeft: "Move left",
  moveRight: "Move right",
  sort: "Sort",
  sortBy: "Sort by",
  sortedBy: "Sort: {label}",
  sortedByDirection: "Sort: {label}, {direction}",
  sortAnnounced: "Sorted by {label}, {direction}",
  sortRemoved: "Not sorted",
  sortDirection: "Direction",
  ascending: "Ascending",
  descending: "Descending",
  oldestFirst: "Oldest first",
  newestFirst: "Newest first",
  lowestFirst: "Lowest first",
  highestFirst: "Highest first",
  aToZ: "A to Z",
  zToA: "Z to A",
  widenColumn: "Wider",
  narrowColumn: "Narrower",
  resetColumnWidth: "Reset width",
  columnWidthChanged: "{label}, {width} pixels wide",
  from: "From",
  to: "To",
  chosenCount: "{count} chosen",
  contains: "{label} contains",
  noFilterValues: "No values to filter by",
  noMatchingValues: "No values match",
  searchFacet: "Search {label}",
  rangeReversed: "The start comes after the end.",
  dragOverPosition: "{item} moved to position {position} of {total}.",
  dragDroppedPosition: "{item} dropped at position {position} of {total}.",
  savedQuestions: "Saved questions",
  view: "View",
  tableSettings: "Table settings",
  metrics: "Metrics",
  groupBy: "Group by",
  groupedBy: "Group by: {field}",
  noGrouping: "None",
  filters: "Filters",
  clearAllFilters: "Clear all filters",
  details: "Details",
  moreFields: "More fields",
  wrapText: "Wrap text",
  wrapColumn: "Wrap {label}",
  /** @deprecated A responsive row's control says its count: `showMoreFieldsFor…` and `hideMoreFieldsFor…`. Kept for one version. */
  moreFieldsFor: "More fields for {label}",
  showMoreFieldsOne: "Show {count} more field",
  showMoreFieldsOther: "Show {count} more fields",
  hideMoreFieldsOne: "Hide {count} more field",
  hideMoreFieldsOther: "Hide {count} more fields",
  showMoreFieldsForOne: "Show {count} more field for {label}",
  showMoreFieldsForOther: "Show {count} more fields for {label}",
  hideMoreFieldsForOne: "Hide {count} more field for {label}",
  hideMoreFieldsForOther: "Hide {count} more fields for {label}",
  columnMoved: "{label}, {position} of {total}",
  columnFolded: "{label}, moved into More fields",
  parts: "Parts",
  detailsLabel: "{label}, details",
  reorder: "Reorder",
  rowsError: "The rows could not be loaded.",
  rowsStale: "The rows could not be refreshed. These are the last ones loaded.",
  nothingHere: "Nothing here",
  /** What a bare Absent speaks in place of its dash. */
  absent: "Not recorded",
  nothingToShow: "Nothing to show yet",
  noResults: "No results found",
  noMatches: "Nothing matches",
  noMatchesHint: "Clear the search or a filter to see every row.",
  clearFilters: "Clear filters",
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
  chartValues: "Values",
  chartCategory: "Category",
  chartGroup: "Group",
  chartName: "Name",
  chartShare: "Share",
  chartTable: "Table",
  chartRole: "chart",
  chartUnnamed: "Chart",
  chartKeysColumns:
    "Left and right arrows move between categories, Home and End go to the first and the last, Enter chooses.",
  chartKeysRows:
    "Up and down arrows move between categories, Home and End go to the first and the last, Enter chooses.",
  chartPoint: "{category}: {values}",
  chartSeriesValue: "{label} {value}",
  chartTotal: "Total",
  chartTotalValue: "total {value}",
  chartImageFailed: "The chart could not be saved as an image.",
  chartNoImage: "This chart draws no image to save.",
  chartImageInTable: "Show the chart to save it as an image.",
  chartMarkIn: "{group}, {label}",
  chartNoValue: "none",
  chartDimensions: "{rows} by {columns}",
  chartValueShare: "{value}, {share}",
  chartAlsoHere: "Also at this point",
  resizeColumn: "Resize column",
  resize: "Resize",
  month: "Month",
  year: "Year",
  selected: "Selected",
  calendarWeek: "Week {week}",
  datePart: "Date",
  timePart: "Time",
  dateCalendarNavigation: "Month navigation",
  dateInvalid: "Enter a date such as {example}.",
  dateTooEarly: "Enter {date} or later.",
  dateTooLate: "Enter {date} or earlier.",
  dateUnavailable: "{date} is not available.",
  dateUnavailableReason: "{date} is not available. {reason}",
  dateUnavailableDay: "Not available",
  dateUnavailableDayReason: "Not available. {reason}",
  dateEarliest: "The earliest date is {date}.",
  dateLatest: "The latest date is {date}.",
  timeInvalid: "Enter a time such as {example}.",
  timeTooEarly: "Enter {time} or later.",
  timeTooLate: "Enter {time} or earlier.",
  dateTimeIncomplete: "Enter both a date and a time.",
  chooseDates: "Choose dates",
  dateRangeSpoken: "{start} to {end}",
  dateRangeStart: "Start of range",
  dateRangeEnd: "End of range",
  dateRangeSelected: "{range} selected",
  dateRangeChooseEnd: "Choose the end date.",
  dateRangePresets: "Presets",
  dateOverdue: "Overdue",
  dateDueToday: "Due today",
  dateDueSoon: "Due {relative}",
  dateExpired: "Expired",
  dateExpiresToday: "Expires today",
  dateExpiresSoon: "Expires {relative}",
  preview: "Preview",
  previewRow: "Preview row",
  previewLabel: "Preview {label}",
  resizeColumnLabel: "Resize {label}",
  listMore: "and {count} more",
  collapse: "Collapse",
  collapseLabel: "Collapse {label}",
  expandLabel: "Expand {label}",
  tableScrolls: "Table, scrolls",
  tableScrollsLabel: "{label}, scrolls",
  code: "Code",
  copyFailed: "Could not copy",
  today: "Today",
  choose: "Choose…",
  showOptions: "Show options",
  options: "Options",
  remove: "Remove",
  removeNamed: "Remove {label}",
  showingOf: "Showing {shown} of {total}. Type to narrow the list.",
  saveFailed: "Could not save",
  saving: "Saving",
  saved: "Saved",
  notSaved: "Not saved",
  editableNotSavedReason: "Not saved: {reason}",
  editableEdit: "Edit",
  editableRetryNamed: "Try again to save {label}",
  editableDiscard: "Discard",
  editableDiscardNamed: "Discard the change to {label}",
  editableSaveNamed: "Save {label}",
  editableCancelNamed: "Cancel editing {label}",
  editableChooseDateNamed: "Choose a date for {label}",
  editableMultilineHint:
    "Enter adds a line. Control or Command plus Enter saves. Escape cancels. Leaving the field saves.",
  composerSuggestions: "Suggestions",
  composerSend: "Send",
  composerSendFailed: "Could not send. Try again.",
  composerSendHint: "Ctrl/⌘ + Enter to send",
  composerSuggestionsOne: "{count} suggestion. Up and Down to choose, Enter or Tab to insert.",
  composerSuggestionsOther: "{count} suggestions. Up and Down to choose, Enter or Tab to insert.",
  composerSuggestionActive: "{label}, {position} of {count}",
  rowRange: "{from}–{to} of {total}",
  rowRangePastEnd: "0 of {total}",
  zeroRows: "0 rows",
  rowsPerPage: "Rows per page",
  perPage: "{count} per page",
  copy: "Copy",
  copied: "Copied",
  required: "Required.",
  errorSummaryTitle: "There is a problem",
  requiredGroup: "(required)",
  editLabel: "Edit {label}",
  save: "Save",
  more: "More",
  moreFilters: "More filters",
  moreDisplay: "More display options",
  moreFiltersAndDisplay: "More filters and display options",
  moreFiltersApplied: "More filters, {count} applied",
  moreFiltersAndDisplayApplied: "More filters and display options, {count} applied",
  morePages: "More pages",
  display: "Display",
  filtersAndDisplay: "Filters and display",
  showHiddenLevels: "Show hidden levels",
  breadcrumb: "Breadcrumb",
  loadingPage: "Loading page",
  lightMode: "Light",
  darkMode: "Dark",
  systemMode: "System",
  colorMode: "Appearance",
  scrollUp: "Scroll up",
  scrollDown: "Scroll down",
  scrollBack: "Scroll back",
  scrollForward: "Scroll forward",
  keyCommand: "Command",
  keyControl: "Control",
  keyOption: "Option",
  keyAlt: "Alt",
  keyShift: "Shift",
  keyMeta: "Meta",
  keyEnter: "Enter",
  keyEscape: "Escape",
  keyTab: "Tab",
  keySpace: "Space",
  keyBackspace: "Backspace",
  keyDelete: "Delete",
  keyArrowUp: "Up arrow",
  keyArrowDown: "Down arrow",
  keyArrowLeft: "Left arrow",
  keyArrowRight: "Right arrow",
  keyCapControl: "Ctrl",
  keyCapAlt: "Alt",
  keyCapShift: "Shift",
  keyCapEscape: "Esc",
  keyCapTab: "Tab",
  keyCapSpace: "Space",
  keyCapBackspace: "Backspace",
  keyCapDelete: "Del",
  keyHintMove: "to move",
  keyHintChoose: "to choose",
  keyHintClose: "to close",
  diffLabel: "Changes from {before} to {after}",
  diffBefore: "Before",
  diffAfter: "After",
  diffLegend: "Removed lines are from {before}; added lines are from {after}.",
  diffChangedCount: "{count} changed",
  diffAddedCount: "{count} added",
  diffRemovedCount: "{count} removed",
  diffNoChanges: "No differences",
  diffAdded: "Added:",
  diffRemoved: "Removed:",
  diffShowLinesOne: "Show {count} unchanged line",
  diffShowLinesOther: "Show {count} unchanged lines",
  diffHideLinesOne: "Hide {count} unchanged line",
  diffHideLinesOther: "Hide {count} unchanged lines",
  searchDescription: "Find a record by its name or its identifier.",
  searchPlaceholder: "Type a name or an identifier",
  searching: "Searching…",
  searchNoResults: "No results for “{query}”",
  searchNoResultsHint: "Check the spelling, or search for the identifier.",
  searchFailed: "The search could not load results.",
  searchResultOne: "{count} result",
  searchResultOther: "{count} results",
  keyHintOpen: "to open",
  keyHintRun: "to run",
  commandPaletteTitle: "Command palette",
  commandPaletteDescription: "Search for a command to run.",
  commandPalettePlaceholder: "Type a command…",
  commandNoMatches: "No commands match.",
  commandFailed: "The commands could not load.",
  commandMatchOne: "{count} match",
  commandMatchOther: "{count} matches",
  commandListLabel: "Results",
  clearSearch: "Clear search",
  characterLimit: "Up to {limit} characters.",
  charactersLeftOne: "{count} character left",
  charactersLeftOther: "{count} characters left",
  charactersOverOne: "{count} character too many",
  charactersOverOther: "{count} characters too many",
  numberField: "Number field",
  increaseValue: "Increase",
  decreaseValue: "Decrease",
  increaseValueFor: "Increase {label}",
  decreaseValueFor: "Decrease {label}",
  contentScrolls: "Content, scrolls",
  namedContentScrolls: "{label}, scrolls",
  stepDone: "Completed: {label}",
  stepCurrent: "Current: {label}",
  stepUpcoming: "Not started: {label}",
  stepBlocked: "Blocked: {label}",
  timelineUnread: "Unread: {title}",
  chooseFile: "Choose a file",
  chooseFiles: "Choose files",
  dropFileHere: "Drag a file here",
  dropFilesHere: "Drag files here",
  dropFileRelease: "Drop the file to add it",
  dropFilesRelease: "Drop the files to add them",
  fileTypeRejected: "{name} is not an accepted file type.",
  fileTooLarge: "{name} is larger than {size}.",
  fileCountRejected: "Add one file at a time.",
  fileAdded: "Added {name}.",
  filesAddedOne: "Added {count} file.",
  filesAddedOther: "Added {count} files.",
  /** @deprecated PickerSheet and RecordBrowser count with `selectedCount` and `selectedCountOf`. Kept for one version. */
  pickerNothingChosen: "Nothing chosen yet",
  /** @deprecated PickerSheet and RecordBrowser count with `selectedCount` and `selectedCountOf`. Kept for one version. */
  pickerToChooseFromOne: "{count} to choose from",
  /** @deprecated PickerSheet and RecordBrowser count with `selectedCount` and `selectedCountOf`. Kept for one version. */
  pickerToChooseFromOther: "{count} to choose from",
  /** @deprecated PickerSheet and RecordBrowser count with `selectedCount` and `selectedCountOf`. Kept for one version. */
  pickerChosenOne: "{count} chosen",
  /** @deprecated PickerSheet and RecordBrowser count with `selectedCount` and `selectedCountOf`. Kept for one version. */
  pickerChosenOther: "{count} chosen",
  /** @deprecated PickerSheet and RecordBrowser count with `selectedCount` and `selectedCountOf`. Kept for one version. */
  pickerChosenOfOne: "{count} chosen of {total}",
  /** @deprecated PickerSheet and RecordBrowser count with `selectedCount` and `selectedCountOf`. Kept for one version. */
  pickerChosenOfOther: "{count} chosen of {total}",
  tableRowOne: "row",
  tableRowOther: "rows",
  tableResults: "{count} {noun}",
  tableResultsOf: "{count} of {total} {noun}",
  tableResultsRange: "{from}–{to} of {total} {noun}",
  tableNoMatching: "No matching {noun}",
  selectNamed: "Select {label}",
  reorderNamed: "Reorder {label}",
  reorderColumnNamed: "Reorder {label} column",
  rowActionsFor: "Row actions for {label}",
  showDetailsFor: "Show details for {label}",
  hideDetailsFor: "Hide details for {label}",
  moveUp: "Move up",
  moveDown: "Move down",
  rowMoved: "{label}, {position} of {total}",
  tablePageEmpty: "Nothing on this page",
  goToFirstPage: "Go to first page",
  selectedCountHidden: "{count} selected, {hidden} hidden by the search or filters",
  relatedEmpty: "Nothing linked yet",
  // PICKERS: RecordBrowser and RecordPicker.
  recordBrowserSearch: "Search records",
  recordBrowserBack: "Back to results",
  recordBrowserClearSelection: "Clear selection",
  recordBrowserFailed: "The records could not be linked. Your selection is kept; try again.",
  recordBrowserEmptyTitle: "Nothing to choose from",
  recordBrowserEmptyDescription: "No records can be linked here yet.",
  recordPickerEmpty: "Nothing to choose from",
  recordPickerFailed: "The records could not load.",
  workPaneList: "List",
  workPaneBack: "Back to list",
  workPaneRowName: "{id}, {title}",
  gateMet: "Met: {label}",
  gateNotMet: "Not met: {label}",
  taskRowCompleted: "{title}, completed",
} satisfies Record<string, string>;

export type LedgerMessages = { [K in keyof typeof defaultMessages]: string };
export type LedgerDirection = "ltr" | "rtl";
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export type LedgerLocaleOptions = {
  /** BCP 47 locale shared by server and client. Defaults to en-US, never the host environment. */
  locale?: string | undefined;
  /** Logical writing direction, applied to the provider scope and exposed for portals. */
  direction?: LedgerDirection | undefined;
  /** Time zone for timestamps. Date-only calendar values use formatCalendarDate instead. */
  timeZone?: string | undefined;
  /** Translated messages. Nested providers inherit untranslated messages. */
  messages?: Partial<LedgerMessages> | undefined;
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
    numberFormat(locale, options).format(value);
  const dateFormat = (options: Intl.DateTimeFormatOptions) => dateTimeFormat(locale, options);
  const formatDate = (value: Date | number, options?: Intl.DateTimeFormatOptions) =>
    dateFormat({ timeZone, ...options }).format(value);
  const formatCalendarDate = (value: Date, options?: Intl.DateTimeFormatOptions) =>
    dateFormat({ ...options, timeZone: "UTC" }).format(
      utcInstant({ year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() }),
    );
  const formatDay = (value: CalendarDay, options?: Intl.DateTimeFormatOptions) =>
    dateFormat({ ...options, timeZone: "UTC" }).format(utcInstant(value));
  const hourCycle = resolveHourCycle(locale);
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
    formatCalendarDate,
    formatPlural: (count: number, forms: PluralForms) =>
      interpolate(forms[pluralRules(locale).select(count)] ?? forms.other, {
        count: formatNumber(count),
      }),
    /** Whether the locale writes times on a 12-hour clock with a day period, or on a 24-hour clock. */
    hourCycle,
    /** The first day of the locale's week, 0 for Sunday, as Calendar's `weekStartsOn` takes it. */
    weekStartsOn: resolveWeekStart(locale),
    /** A calendar day in the locale's words. Never shifted by the time zone. */
    formatDay,
    /**
     * A wall-clock time in the locale's words ("5:30 PM", "09:15" in de-DE), on its clock unless
     * `hourCycle` says otherwise. Options that name the hour or minute replace the locale's style.
     */
    formatTime: (value: WallTime, options?: Intl.DateTimeFormatOptions) =>
      dateFormat({
        ...(options?.hour || options?.minute ? {} : { timeStyle: "short" }),
        ...options,
        timeZone: "UTC",
      }).format(utcInstant({ year: 2000, month: 1, day: 1 }, value)),
    /** Two calendar days as one range in the locale's words: "Sep 7 – 11, 2026". */
    formatDayRange: (
      start: CalendarDay,
      end: CalendarDay,
      options?: Intl.DateTimeFormatOptions,
    ) => {
      const format = dateFormat({ ...options, timeZone: "UTC" });
      const from = utcInstant(start);
      const to = utcInstant(end);
      return typeof format.formatRange === "function"
        ? format.formatRange(from, to)
        : `${format.format(from)} – ${format.format(to)}`;
    },
    /**
     * An instant relative to now in the locale's words ("5 minutes ago", "tomorrow"), and how many
     * milliseconds until those words change. Under a minute either way reads as now.
     */
    formatRelative: (
      value: Date | number,
      now: number = Date.now(),
      style: Intl.RelativeTimeFormatStyle = "long",
    ) => relativeTime(relativeFormat(locale, style), +value - now),
    /** The calendar day and wall-clock time an instant falls on in the provider's time zone. */
    zonedParts: (value: Date | number) => zonedParts(+value, timeZone),
    /** The instant a calendar day and wall-clock time name in the provider's time zone. A time a daylight-saving change skips moves forward; a repeated one takes the earlier instant. */
    toInstant: (day: CalendarDay, time: WallTime) => zonedTimeToInstant(day, time, timeZone),
    /** The provider zone's name at an instant: "PDT" (`short`) or "Pacific Daylight Time" (`long`). */
    timeZoneName: (value: Date | number, style: "short" | "long" = "short") =>
      dateFormat({ timeZone, timeZoneName: style })
        .formatToParts(value)
        .find((part) => part.type === "timeZoneName")?.value ?? timeZone,
    /**
     * A day typed in the locale's words or numbers: "Sep 18, 2026", "18/9/2026" (in en-GB),
     * "2026-09-18", "9/18" (the reference day's year, by default the reader's today). Returns
     * null when the text is not one real day.
     */
    parseDay: (text: string, reference?: CalendarDay | undefined) =>
      parseDayText(text, locale, reference ?? dateToDay(new Date())),
    /** A time typed on either clock: "5:30 pm", "17:30", "1730", "5pm". Returns null when the text is not a time of day. */
    parseTime: (text: string) => parseTimeText(text, locale),
  };
}

export type LedgerLocale = ReturnType<typeof createLedgerLocale>;

/* ——— Days, times and instants ————————————————————————————————————————————————————————————————
   A calendar day ("2026-09-18") and a wall-clock time ("17:30") have no time zone: they are what
   `input type="date"` and `input type="time"` hold, and they never shift. An instant
   ("2026-09-19T00:30:00.000Z") is a point in time; it is shown in the provider's zone, and a day
   and time typed by the reader become an instant in that zone. */

/** A calendar day, independent of any time zone. Months count from 1. */
export type CalendarDay = { year: number; month: number; day: number };
/** A wall-clock time of day, independent of any date or zone. */
export type WallTime = { hour: number; minute: number };

const pad = (value: number, width = 2) => String(value).padStart(width, "0");
const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const daysInMonth = (year: number, month: number) =>
  month === 2 ? (isLeapYear(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;

/** The UTC instant of a day (and time), with years below 100 kept as written. */
function utcInstant(day: CalendarDay, time: WallTime = { hour: 0, minute: 0 }, second = 0) {
  const date = new Date(Date.UTC(2000, 0, 1, time.hour, time.minute, second));
  date.setUTCFullYear(day.year, day.month - 1, day.day);
  return date.getTime();
}

/** Whether the parts name one real day between the years 1 and 9999. */
export function isCalendarDay(value: CalendarDay): boolean {
  const { year, month, day } = value;
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    year >= 1 &&
    year <= 9999 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

/** Reads a strict ISO day, "2026-09-18". Anything else, including "2026-02-30" and timestamps, is null. */
export function parseIsoDay(value: string): CalendarDay | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const day = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isCalendarDay(day) ? day : null;
}

/** Writes an ISO day, "2026-09-18". */
export const formatIsoDay = ({ year, month, day }: CalendarDay) =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

/** Negative when `a` is the earlier day, zero on the same day. */
export const compareDays = (a: CalendarDay, b: CalendarDay) =>
  a.year - b.year || a.month - b.month || a.day - b.day;

/** The day `amount` days after (or before) `day`. */
export function addDays(day: CalendarDay, amount: number): CalendarDay {
  const date = new Date(utcInstant(day));
  date.setUTCDate(date.getUTCDate() + amount);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

/** The local-midnight Date a calendar day is shown as in Calendar. */
export function dayToDate({ year, month, day }: CalendarDay): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month - 1, day);
  return date;
}

/** The calendar day a Calendar Date stands for, from its local fields. */
export const dateToDay = (date: Date): CalendarDay => ({
  year: date.getFullYear(),
  month: date.getMonth() + 1,
  day: date.getDate(),
});

/** Reads an ISO time, "17:30" or "17:30:00". Anything else is null. */
export function parseIsoTime(value: string): WallTime | null {
  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);
  return hour <= 23 && minute <= 59 && second <= 59 ? { hour, minute } : null;
}

/** Writes an ISO time, "17:30". */
export const formatIsoTime = ({ hour, minute }: WallTime) => `${pad(hour)}:${pad(minute)}`;

/** Minutes since midnight, for comparing and stepping times. */
export const minutesOf = ({ hour, minute }: WallTime) => hour * 60 + minute;

/** The time `minutes` minutes after midnight, wrapping around the day. */
export function timeOfMinutes(minutes: number): WallTime {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 };
}

/** Reads an instant with an offset or `Z`; a value with no offset is a wall time in `timeZone`. */
export function parseInstant(value: string, timeZone: string): number | null {
  const local = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(value);
  if (local) {
    const day = { year: Number(local[1]), month: Number(local[2]), day: Number(local[3]) };
    const time = parseIsoTime(`${local[4]}:${local[5]}`);
    if (!isCalendarDay(day) || !time) return null;
    return zonedTimeToInstant(day, time, timeZone);
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i.test(value))
    return null;
  const instant = Date.parse(value);
  return Number.isNaN(instant) ? null : instant;
}

const zoneFormats = new Map<string, Intl.DateTimeFormat>();
/** The calendar day, time and second an instant falls on in a time zone. */
export function zonedParts(
  instant: number,
  timeZone: string,
): CalendarDay & WallTime & { second: number } {
  let format = zoneFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      era: "short",
    });
    zoneFormats.set(timeZone, format);
  }
  const parts: Record<string, string> = {};
  for (const part of format.formatToParts(instant)) parts[part.type] = part.value;
  const year = Number(parts["year"]);
  return {
    year: parts["era"] === "BC" ? 1 - year : year,
    month: Number(parts["month"]),
    day: Number(parts["day"]),
    hour: Number(parts["hour"]) % 24,
    minute: Number(parts["minute"]),
    second: Number(parts["second"]),
  };
}

/** How far a time zone's wall clock is ahead of UTC at an instant, in milliseconds. */
function zoneOffset(instant: number, timeZone: string) {
  const whole = instant - (((instant % 1000) + 1000) % 1000);
  const parts = zonedParts(whole, timeZone);
  return utcInstant(parts, parts, parts.second) - whole;
}

/**
 * The instant a day and wall-clock time name in a time zone. Where a daylight-saving change skips
 * the time, it moves forward by the gap; where the time happens twice, the earlier instant wins
 * (Temporal's "compatible" choice).
 */
export function zonedTimeToInstant(day: CalendarDay, time: WallTime, timeZone: string): number {
  const wall = utcInstant(day, time);
  const DAY = 86_400_000;
  const before = zoneOffset(wall - DAY, timeZone);
  const after = zoneOffset(wall + DAY, timeZone);
  const candidates = [wall - before, wall - after].filter(
    (instant, index) => zoneOffset(instant, timeZone) === (index === 0 ? before : after),
  );
  if (candidates.length > 0) return Math.min(...candidates);
  return wall - before;
}

/* One Intl object per kind, locale and options, shared by every locale object: a table cell or a
   provider that is created again reuses the formatter instead of building one, which costs about a
   hundred times what formatting does. The time zone is one of the options. Bounded, so options
   built from data cannot grow it without limit. */
type IntlObject =
  Intl.NumberFormat | Intl.DateTimeFormat | Intl.PluralRules | Intl.RelativeTimeFormat;
const intlObjects = new Map<string, IntlObject>();
function cachedIntl<T extends IntlObject>(key: string, create: () => T): T {
  let object = intlObjects.get(key) as T | undefined;
  if (!object) {
    if (intlObjects.size >= 256) intlObjects.clear();
    object = create();
    intlObjects.set(key, object);
  }
  return object;
}
const numberFormat = (locale: string, options?: Intl.NumberFormatOptions) =>
  cachedIntl(
    `number ${locale} ${options ? JSON.stringify(options) : ""}`,
    () => new Intl.NumberFormat(locale, options),
  );
const dateTimeFormat = (locale: string, options: Intl.DateTimeFormatOptions) =>
  cachedIntl(
    `date ${locale} ${JSON.stringify(options)}`,
    () => new Intl.DateTimeFormat(locale, options),
  );
const pluralRules = (locale: string) =>
  cachedIntl(`plural ${locale}`, () => new Intl.PluralRules(locale));
/** The shared `numeric: "auto"` relative-time formatter, for a kit part that names its own unit (DateLabel's "in 2 days"). Not exported from the package. */
export const relativeFormat = (locale: string, style: Intl.RelativeTimeFormatStyle = "long") =>
  cachedIntl(
    `relative ${locale} ${style}`,
    () => new Intl.RelativeTimeFormat(locale, { numeric: "auto", style }),
  );

const hourCycles = new Map<string, "h12" | "h23">();
function resolveHourCycle(locale: string): "h12" | "h23" {
  let resolved = hourCycles.get(locale);
  if (!resolved) {
    const cycle = dateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
    resolved = cycle === "h11" || cycle === "h12" ? "h12" : "h23";
    hourCycles.set(locale, resolved);
  }
  return resolved;
}

/* Where Intl.Locale has no week information (Firefox), the first day by region, from CLDR. */
const sundayFirst = new Set(
  "AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW".split(
    " ",
  ),
);
const saturdayFirst = new Set("AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY".split(" "));

const weekStarts = new Map<string, 0 | 1 | 2 | 3 | 4 | 5 | 6>();
function resolveWeekStart(locale: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  let start = weekStarts.get(locale);
  if (start === undefined) {
    start = readWeekStart(locale);
    weekStarts.set(locale, start);
  }
  return start;
}

function readWeekStart(locale: string): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  try {
    const tag = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const info = tag.getWeekInfo?.() ?? tag.weekInfo;
    if (info?.firstDay) return (info.firstDay % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const region = tag.maximize().region ?? "US";
    return sundayFirst.has(region) ? 0 : saturdayFirst.has(region) ? 6 : 1;
  } catch {
    return 0;
  }
}

/* Typed entry. The text is read in the provider's locale, and English month names and day
   periods are always understood as well. Digits of any script count; bidirectional marks and
   the narrow spaces Intl puts in formatted dates are ignored. */

const digitZeros = [
  0x30, 0x660, 0x6f0, 0x7c0, 0x966, 0x9e6, 0xa66, 0xae6, 0xb66, 0xbe6, 0xc66, 0xce6, 0xd66, 0xde6,
  0xe50, 0xed0, 0xf20, 0x1040, 0x17e0, 0x1810, 0xff10,
];

function normalizeEntry(text: string, locale: string) {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const zero = digitZeros.find((start) => code >= start && code <= start + 9);
    out += zero === undefined ? char : String(code - zero);
  }
  return out
    .replace(/[\u200e\u200f\u061c]/g, "")
    .replace(/[\u00a0\u202f\u2009]/g, " ")
    .toLocaleLowerCase(locale)
    .trim();
}

const bare = (word: string) => word.normalize("NFD").replace(/\p{M}/gu, "").replace(/\.$/, "");

const wordsOf = (text: string) => text.match(/\p{L}+/gu) ?? [];

type DayVocabulary = {
  months: Map<string, number>;
  monthNames: [string, number][];
  ignored: Set<string>;
  order: ("year" | "month" | "day")[];
};
const dayVocabularies = new Map<string, DayVocabulary>();

function dayVocabulary(locale: string): DayVocabulary {
  const cached = dayVocabularies.get(locale);
  if (cached) return cached;
  const months = new Map<string, number>();
  const ignored = new Set(["of", "the", "st", "nd", "rd", "th"]);
  const lower = (value: string) => bare(value.toLocaleLowerCase(locale));
  for (const tag of [locale, "en-US"]) {
    for (let month = 1; month <= 12; month++) {
      const instant = utcInstant({ year: 2021, month, day: 15 });
      const names = [
        ...(["long", "short"] as const).map((style) =>
          new Intl.DateTimeFormat(tag, { month: style, timeZone: "UTC" }).format(instant),
        ),
        ...(["long", "short"] as const).map(
          (style) =>
            new Intl.DateTimeFormat(tag, { month: style, day: "numeric", timeZone: "UTC" })
              .formatToParts(instant)
              .find((part) => part.type === "month")?.value ?? "",
        ),
      ];
      for (const name of names) {
        const key = lower(name);
        if (key && !/\d/.test(key) && !months.has(key)) months.set(key, month);
      }
    }
    for (let weekday = 0; weekday < 7; weekday++) {
      const instant = utcInstant({ year: 2021, month: 8, day: 1 + weekday });
      for (const style of ["long", "short"] as const)
        ignored.add(
          lower(new Intl.DateTimeFormat(tag, { weekday: style, timeZone: "UTC" }).format(instant)),
        );
    }
  }
  const sample = utcInstant({ year: 2021, month: 8, day: 15 });
  for (const options of [
    { year: "numeric", month: "long", day: "numeric", weekday: "long" },
    { year: "numeric", month: "numeric", day: "numeric" },
    { dateStyle: "medium" },
  ] satisfies Intl.DateTimeFormatOptions[]) {
    for (const part of new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: "UTC",
    }).formatToParts(sample))
      if (part.type === "literal") for (const word of wordsOf(part.value)) ignored.add(lower(word));
  }
  const order = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  })
    .formatToParts(sample)
    .map((part) => part.type)
    .filter((type): type is "year" | "month" | "day" => ["year", "month", "day"].includes(type));
  const vocabulary: DayVocabulary = {
    months,
    monthNames: [...months.entries()],
    ignored,
    order: order.length === 3 ? order : ["month", "day", "year"],
  };
  dayVocabularies.set(locale, vocabulary);
  return vocabulary;
}

function monthOf(word: string, vocabulary: DayVocabulary) {
  const key = bare(word);
  const exact = vocabulary.months.get(key);
  if (exact) return exact;
  if (key.length < 3) return undefined;
  const matches = new Set(
    vocabulary.monthNames.filter(([name]) => name.startsWith(key)).map(([, month]) => month),
  );
  return matches.size === 1 ? [...matches][0] : undefined;
}

/** A two-digit year is read as the one within fifty years of the reference year. */
function fullYear(text: string, reference: number) {
  const value = Number(text);
  if (text.length > 2) return value;
  const century = Math.floor(reference / 100) * 100;
  const candidates = [century - 100 + value, century + value, century + 100 + value];
  return candidates.reduce((best, year) =>
    Math.abs(year - reference) < Math.abs(best - reference) ? year : best,
  );
}

function parseDayText(text: string, locale: string, reference: CalendarDay): CalendarDay | null {
  const value = normalizeEntry(text, locale);
  if (!value) return null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (iso) {
    const day = { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
    return isCalendarDay(day) ? day : null;
  }
  const vocabulary = dayVocabulary(locale);
  const tokens = value.match(/\d+|\p{L}+/gu) ?? [];
  let month: number | undefined;
  let numbers: string[] = [];
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      numbers.push(token);
      continue;
    }
    const named = monthOf(token, vocabulary);
    if (named !== undefined) {
      if (month !== undefined) return null;
      month = named;
    } else if (!vocabulary.ignored.has(bare(token))) return null;
  }
  const { order } = vocabulary;
  // Digits typed without separators, in the locale's order: 09182026 in en-US, 18092026 in de-DE.
  if (month === undefined && numbers.length === 1) {
    const [digits = ""] = numbers;
    if (digits.length !== 8 && digits.length !== 6) return null;
    const yearLength = digits.length === 8 ? 4 : 2;
    numbers = [];
    let at = 0;
    for (const part of order) {
      const length = part === "year" ? yearLength : 2;
      numbers.push(digits.slice(at, at + length));
      at += length;
    }
  }
  let year: string | undefined;
  let day: string | undefined;
  if (month !== undefined) {
    const [first, second] = numbers;
    if (numbers.length === 1 && first) day = first;
    else if (numbers.length === 2 && first && second) {
      const looksLikeYear = (digits: string) => digits.length >= 3 || Number(digits) > 31;
      if (looksLikeYear(first)) [year, day] = [first, second];
      else if (looksLikeYear(second)) [day, year] = [first, second];
      else if (order.indexOf("day") < order.indexOf("year")) [day, year] = [first, second];
      else [year, day] = [first, second];
    } else return null;
  } else if (numbers.length === 3) {
    const [first = "", second = "", third = ""] = numbers;
    // A four-digit first number is a year whatever the locale: 2026/9/18 in en-US.
    const parts: {
      year?: string | undefined;
      month?: string | undefined;
      day?: string | undefined;
    } =
      first.length >= 3 && order[0] !== "year"
        ? { year: first, ...pair(order, second, third) }
        : Object.fromEntries(order.map((part, index) => [part, numbers[index]]));
    year = parts.year;
    day = parts.day;
    month = parts.month === undefined ? undefined : Number(parts.month);
  } else if (numbers.length === 2) {
    const [first = "", second = ""] = numbers;
    const parts = pair(order, first, second);
    day = parts.day;
    month = Number(parts.month);
  } else return null;
  if (day === undefined || month === undefined) return null;
  const result = {
    year: year === undefined ? reference.year : fullYear(year, reference.year),
    month,
    day: Number(day),
  };
  return isCalendarDay(result) ? result : null;
}

/** Month and day from two numbers, in the order the locale writes them. */
function pair(order: ("year" | "month" | "day")[], first: string, second: string) {
  return order.indexOf("month") < order.indexOf("day")
    ? { month: first, day: second }
    : { day: first, month: second };
}

type TimeVocabulary = { periods: [string, boolean][]; ignored: Set<string> };
const timeVocabularies = new Map<string, TimeVocabulary>();

function timeVocabulary(locale: string): TimeVocabulary {
  const cached = timeVocabularies.get(locale);
  if (cached) return cached;
  const periods = new Map<string, boolean>();
  const lower = (value: string) => value.toLocaleLowerCase(locale).replace(/\s+/g, " ").trim();
  for (const tag of [locale, "en-US"]) {
    for (const [hour, pm] of [
      [9, false],
      [21, true],
    ] as const) {
      const period = new Intl.DateTimeFormat(tag, {
        hour: "numeric",
        hourCycle: "h12",
        timeZone: "UTC",
      })
        .formatToParts(utcInstant({ year: 2000, month: 1, day: 1 }, { hour, minute: 0 }))
        .find((part) => part.type === "dayPeriod")?.value;
      if (period) {
        periods.set(lower(period), pm);
        periods.set(lower(period).replace(/\./g, ""), pm);
      }
    }
  }
  periods.set("am", false);
  periods.set("pm", true);
  if (locale.toLowerCase().startsWith("en")) {
    periods.set("a", false);
    periods.set("p", true);
  }
  const ignored = new Set(["h", "uhr"]);
  for (const part of new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).formatToParts(utcInstant({ year: 2000, month: 1, day: 1 }, { hour: 17, minute: 30 })))
    if (part.type === "literal") for (const word of wordsOf(part.value)) ignored.add(lower(word));
  const vocabulary = {
    periods: [...periods.entries()].sort(([a], [b]) => b.length - a.length),
    ignored,
  };
  timeVocabularies.set(locale, vocabulary);
  return vocabulary;
}

function parseTimeText(text: string, locale: string): WallTime | null {
  let value = normalizeEntry(text, locale).replace(/\./g, (dot, at: number, all: string) =>
    /\d/.test(all[at - 1] ?? "") && /\d/.test(all[at + 1] ?? "") ? ":" : "",
  );
  if (!value) return null;
  const { periods, ignored } = timeVocabulary(locale);
  let pm: boolean | undefined;
  for (const [period, isPm] of periods) {
    const at = value.indexOf(period);
    if (at < 0) continue;
    const before = value[at - 1] ?? "";
    const after = value[at + period.length] ?? "";
    // A Latin period stands apart from other words ("a" in "am" but not in a word).
    if (/\p{L}/u.test(before) || /\p{L}/u.test(after)) continue;
    pm = isPm;
    value = `${value.slice(0, at)} ${value.slice(at + period.length)}`;
    break;
  }
  const tokens = value.match(/\d+|\p{L}+/gu) ?? [];
  const numbers: string[] = [];
  for (const token of tokens) {
    if (/^\d+$/.test(token)) numbers.push(token);
    else if (!ignored.has(token)) return null;
  }
  let hour: number;
  let minute = 0;
  const [first = "", second, third] = numbers;
  if (numbers.length === 1) {
    if (first.length <= 2) hour = Number(first);
    else if (first.length <= 4) {
      hour = Number(first.slice(0, -2));
      minute = Number(first.slice(-2));
    } else return null;
  } else if (numbers.length === 2 || numbers.length === 3) {
    if (first.length > 2 || (second ?? "").length > 2 || (third ?? "").length > 2) return null;
    hour = Number(first);
    minute = Number(second);
    if (third !== undefined && Number(third) > 59) return null;
  } else return null;
  if (pm !== undefined) {
    if (hour < 1 || hour > 12) {
      // "17:30 pm" still means 17:30; "0 am" and "17 am" mean nothing.
      if (!(pm && hour > 12 && hour <= 23)) return null;
    } else hour = (hour % 12) + (pm ? 12 : 0);
  }
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
}

/** The words and the time until they change, for one difference from now. */
function relativeTime(format: Intl.RelativeTimeFormat, difference: number) {
  const units = [
    ["year", 31_557_600_000],
    ["month", 2_629_800_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ] as const;
  const distance = Math.abs(difference);
  const sign = difference < 0 ? -1 : 1;
  const limits: Record<string, number> = { month: 11, week: 4, day: 6, hour: 23, minute: 59 };
  let text = format.format(0, "second");
  let unitSize = 60_000;
  let count = 0;
  for (const [unit, size] of units) {
    const whole = Math.floor(distance / size);
    if (whole < 1 || whole > (limits[unit] ?? Infinity)) continue;
    // Minutes and hours count whole units passed; days and longer round, so 60 days is 2 months.
    const clock = unit === "minute" || unit === "hour";
    count = clock ? whole : Math.min(Math.round(distance / size), limits[unit] ?? Infinity);
    text = format.format(sign * count, unit);
    unitSize = clock ? size : 0;
    break;
  }
  if (unitSize === 0) return { text, next: 3_600_000 };
  // Past: the words change when the next whole unit passes. Future: when the count drops.
  const next = sign < 0 ? (count + 1) * unitSize - distance : distance - count * unitSize + 1;
  return { text, next: Math.min(Math.max(next, 1000), 3_600_000) };
}
