import type { ColumnFiltersState, SortingState, Updater } from "@tanstack/react-table";
import { AlertCircle, ChevronLeft, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Alert, AlertDescription } from "../components/alert";
import { Button, IconButton } from "../components/button";
import { Checkbox } from "../components/checkbox";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/dialog";
import type { EmptyIllustrationKind } from "../components/empty";
import { useReadOnlyScroller } from "../components/overlay";
import { Truncate } from "../components/truncate";
import { PageHeader } from "../layout/page-header";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { HeadingLevelProvider } from "../primitives/heading-level";
import {
  DataTable,
  displayedRows,
  showRow,
  useDataTable,
  type DataTableColumn,
  type DataTableState,
} from "./data-table";
import type { FilterOption } from "./data-table/filter";
import { onOfferIn, selectedCount } from "./picker-sheet";
import { PreviewNavigation } from "./preview-navigation";
import { Toolbar } from "./toolbar";
import { token } from "../generated/tokens";

/** What the browser says when there is nothing it could link: no eligible records at all. */
export type RecordBrowserEmpty = {
  /** "Nothing to choose from" unsaid. */
  title?: string | undefined;
  /** One line: why there is nothing, and what makes something. "No records can be linked here yet." unsaid. */
  description?: string | undefined;
  /** The step that makes a record to link. The browser's `actions` unsaid; `null` for none. */
  action?: ReactNode;
  /** A quieter step beside it: a link to where the records are made. */
  secondary?: ReactNode;
  /** The picture above the message. `records` unsaid; `false` for none. */
  illustration?: EmptyIllustrationKind | false | undefined;
};

/** What a server-paged browser asks the server for one page: the reader's search, sort and filters, and the page. */
export type RecordBrowserQuery = {
  /** The search text. */
  search: string;
  /** The sort, first column first. */
  sorting: SortingState;
  /** The column filters, as the table holds them. */
  filters: ColumnFiltersState;
  /** The page, counted from 0. */
  pageIndex: number;
  /** Records a page. */
  pageSize: number;
};

/**
 * A browser whose records the server pages, sorts, filters and searches, as DataTable's `manual`
 * mode: the caller holds the question and hands the browser the page that answers it.
 */
export type RecordBrowserServer<T extends { id: string }> = {
  /** The question the caller reads its page by. The search field, the sort, the filters and the pages show it. */
  query: RecordBrowserQuery;
  /**
   * Called with the next question when the reader asks another: a search, a sort or a filter asks
   * from the first page, a page or a preview's step past the page's edge keeps the rest. Hand it
   * back as `query`, read that page and give it as `records`, keeping the rows the reader has (the
   * same array) with `state="refreshing"` while it is on its way, so they are never taken for its
   * answer.
   */
  onQueryChange: (query: RecordBrowserQuery) => void;
  /** How many records the question finds: the pages' total, and the preview's ("21 of 62 records"). */
  rowCount: number;
  /**
   * How many records there are to choose from, search and filters aside: the "62" of the footer's
   * "3 of 62 selected". Unsaid, the footer says how many are chosen ("3 selected").
   */
  total?: number | undefined;
  /** Each filter's values, by column id (DataTable.Filter's `options`): one page's rows are not every value there is. */
  filterOptions?: Readonly<Partial<Record<string, readonly FilterOption[]>>> | undefined;
  /**
   * The records of `selectedIds` that no page the browser was given may hold: one the reader made
   * through `actions`, which the caller chose. The browser keeps every record a page gives it, so a
   * choice made on another page is still counted, named and confirmed; these are kept with them.
   */
  selected?: readonly T[] | undefined;
};

export type RecordBrowserProps<T extends { id: string }> = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  records: readonly T[];
  columns: readonly DataTableColumn<T>[];
  /** Filterable column IDs. The table owns sorting, search, filters and selection. */
  filters?: readonly string[] | undefined;
  /** The record's name as the preview's heading: PageHeader.Title, an h3 under the dialog's title. */
  recordTitle: (record: T) => ReactNode;
  /**
   * The record's name as text, never a database key: it names the row's checkbox and eye ("Select
   * Firewall ruleset export"), the preview's Select checkbox, and what is said as the preview
   * steps. `recordTitle` when that returns a string unsaid, else the record's id: give it whenever
   * `recordTitle` returns markup or the ids are keys.
   */
  recordLabel?: ((record: T) => string) | undefined;
  /** A readable identifier over the preview's name, such as "EVD-001". Nothing unsaid; never a database key. */
  recordCode?: ((record: T) => ReactNode) | undefined;
  /**
   * The column that names the record: it leads the row and its cell carries the preview eye. Give
   * it `priority: 0` too, so a narrow browser keeps it in the row. Unsaid, the columns keep their
   * order and the eye sits on the first column that holds a value.
   */
  previewColumn?: string | undefined;
  /**
   * What the preview shows under the record's name. Record content stays inside this dialog; do
   * not render another modal here. The name is an h3 under the dialog's title, and headings inside
   * take the level under it (a Section's title is an h4).
   */
  renderPreview: (record: T) => ReactNode;
  onConfirm: (records: T[]) => void | Promise<void>;
  confirmLabel: string;
  /** Optional context, such as the relationship target. It scrolls with the results. */
  context?: ReactNode;
  /** Permanent actions, such as creating a new record. The empty state offers them too. */
  actions?: ReactNode;
  /** The search field's placeholder and name, what is searched: "Search evidence". "Search records" unsaid. */
  searchPlaceholder?: string | undefined;
  /**
   * Where the records are: `loading` draws skeleton rows under the toolbar, `refreshing` keeps the
   * rows while new ones arrive, `error` says `error`: in place of the rows when none loaded, above
   * the rows it keeps after a failed refresh. `ready` unsaid.
   */
  state?: Exclude<DataTableState, "empty"> | undefined;
  /** What a failed load says, with `state="error"`: what went wrong and what to do. */
  error?: ReactNode;
  /** With `state="error"`, Try again in the error runs this: refetch what failed. None unsaid. */
  onRetry?: (() => void) | undefined;
  /**
   * With no eligible records at all (a load that is done and found none), what the browser says in
   * place of the table, with `actions` as its step. A search or a filter that matches nothing is
   * the table's own filtered state, with Clear filters.
   */
  empty?: RecordBrowserEmpty | undefined;
  /** Own selection across related workflows that temporarily close the browser. */
  selectedIds?: readonly string[] | undefined;
  /** Reports selection changes. Pair with selectedIds for controlled selection. */
  onSelectionChange?: ((ids: string[]) => void) | undefined;
  /**
   * Server-paged, for a collection too large to hand over whole: `records` is the page that
   * answers `server.query`, and the browser asks for another through `server.onQueryChange`.
   * Selection, the footer's count, `onConfirm` and the preview's previous and next keep to the
   * whole result, across its pages. Unsaid, `records` is every eligible record and the browser
   * searches, filters, sorts and pages them itself.
   */
  server?: RecordBrowserServer<T> | undefined;
};

/** Two questions that ask the server the same thing. */
const sameQuery = (a: RecordBrowserQuery, b: RecordBrowserQuery) =>
  JSON.stringify([a.search, a.sorting, a.filters, a.pageIndex, a.pageSize]) ===
  JSON.stringify([b.search, b.sorting, b.filters, b.pageIndex, b.pageSize]);

/** A question's search, sort and filters in one spelling: every page of one result shares it. */
const resultOf = (query: RecordBrowserQuery) =>
  JSON.stringify([query.search, query.sorting, query.filters]);

/** A table's change to one slice of its state: the next value, or how to make it from the last. */
const applyUpdate = <S,>(update: Updater<S>, previous: S): S =>
  typeof update === "function" ? (update as (previous: S) => S)(previous) : update;

/** A column's id as the table knows it: its `id`, else its accessor key. */
const columnId = (column: { id?: string | undefined }) =>
  column.id ??
  ("accessorKey" in column && typeof column.accessorKey === "string"
    ? column.accessorKey
    : undefined);

/**
 * The results take the height the dialog leaves them: the toolbar and the pagination stay in view
 * and the rows scroll under the sticky header inside the table's frame, never less than a header
 * and a row. A window under 30rem tall scrolls the whole dialog instead (DialogBody).
 */
const fillResults =
  "flex min-h-0 flex-1 flex-col [&>[data-slot=table-container]]:min-h-1000 [&>[data-slot=table-container]]:flex-1 [&>[data-slot=table-container]]:overflow-auto";

/** Search, compare, preview and select records before confirming a relationship. */
export function RecordBrowser<T extends { id: string }>({
  open,
  onClose,
  ...props
}: RecordBrowserProps<T>) {
  const dismissPreview = useRef<(() => void) | null>(null);
  const confirming = useRef(false);
  // Server-paged: every record a page has given while the browser is mounted, by id, so a choice
  // the caller keeps across openings (`selectedIds`) is still counted and confirmed in the next.
  const seen = useRef(new Map<string, T>());
  // The confirmation in flight holds the dialog: the kit's pending lock disables Close and Cancel
  // and cancels every dismissal while `onConfirm` runs.
  const [saving, setSaving] = useState(false);
  // One session per opening. The key changes as the browser opens, so each opening starts afresh;
  // the last session stays drawn through the exit animation and leaves once it has ended.
  const [session, setSession] = useState({ open, key: open ? 1 : 0, shown: open });
  if (session.open !== open)
    setSession({
      open,
      key: open ? session.key + 1 : session.key,
      shown: open || session.shown,
    });
  useLayoutEffect(() => {
    if (open) return;
    // A session closed from outside while it confirmed leaves the next one unlocked.
    confirming.current = false;
    setSaving(false);
  }, [open]);
  return (
    <Dialog
      open={open}
      pending={saving}
      onOpenChange={(next, details) => {
        if (!next && confirming.current) {
          details.cancel();
          return;
        }
        if (!next && details.reason === "escape-key" && dismissPreview.current) {
          details.cancel();
          dismissPreview.current();
          return;
        }
        if (!next) onClose();
      }}
      onOpenChangeComplete={(next) => {
        if (!next) setSession((current) => (current.open ? current : { ...current, shown: false }));
      }}
    >
      {session.shown ? (
        <RecordBrowserContent
          key={session.key}
          {...props}
          live={open}
          onClose={onClose}
          dismissPreview={dismissPreview}
          confirming={confirming}
          seen={seen}
          saving={saving}
          setSaving={setSaving}
        />
      ) : null}
    </Dialog>
  );
}

function RecordBrowserContent<T extends { id: string }>({
  live,
  dismissPreview,
  confirming,
  seen,
  saving,
  setSaving,
  title,
  description,
  records,
  columns,
  filters = [],
  recordTitle,
  recordLabel,
  recordCode,
  previewColumn,
  renderPreview,
  onConfirm,
  confirmLabel,
  context,
  actions,
  searchPlaceholder,
  state,
  error,
  onRetry,
  empty,
  selectedIds,
  onSelectionChange,
  server,
  onClose,
}: Omit<RecordBrowserProps<T>, "open"> & {
  live: boolean;
  dismissPreview: RefObject<(() => void) | null>;
  confirming: RefObject<boolean>;
  seen: RefObject<Map<string, T>>;
  saving: boolean;
  setSaving: (saving: boolean) => void;
}) {
  const { t, formatNumber } = useLedgerLocale();
  const [previewId, setPreviewId] = useState<string | null>(null);
  // Server-paged: the question as last asked. Two changes in one event (Clear filters clears the
  // filters, then the search) build on each other, never on the question the browser was drawn with.
  const asked = useRef(server?.query);
  useLayoutEffect(() => {
    asked.current = server?.query;
  });
  // The rows the browser had when it asked for another page or result: until other rows arrive,
  // the rows on screen answer the question before, whatever `state` says in the meantime.
  const askedFrom = useRef<readonly T[] | null>(null);
  const ask = (change: (query: RecordBrowserQuery) => RecordBrowserQuery) => {
    const current = asked.current;
    if (!server || !current) return;
    const next = change(current);
    if (sameQuery(next, current)) return;
    asked.current = next;
    if (
      next.pageIndex !== current.pageIndex ||
      next.pageSize !== current.pageSize ||
      resultOf(next) !== resultOf(current)
    )
      askedFrom.current = records;
    server.onQueryChange(next);
  };
  // Every record a page has given, by id: a choice or a preview on another page is still counted,
  // named and confirmed. The page's own rows, and the caller's chosen ones, win.
  const paged = server !== undefined;
  const chosenElsewhere = server?.selected;
  useLayoutEffect(() => {
    if (!paged) return;
    for (const record of records) seen.current.set(record.id, record);
  }, [paged, records, seen]);
  const known = useMemo(() => {
    if (!paged) return undefined;
    const byId = new Map(seen.current);
    for (const record of chosenElsewhere ?? []) byId.set(record.id, record);
    for (const record of records) byId.set(record.id, record);
    return byId;
  }, [paged, chosenElsewhere, records, seen]);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [internalSelection, setInternalSelection] = useState<Record<string, true>>({});
  const mounted = useRef(true);
  // Whether this session is the open one: a late completion from a session the application closed
  // neither closes nor updates anything.
  const open = useRef(live);
  useLayoutEffect(() => {
    open.current = live;
  }, [live]);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // The readable name, read when it is needed, so the table's options stay stable.
  const labelSource = useRef({ recordLabel, recordTitle });
  labelSource.current = { recordLabel, recordTitle };
  const labelOf = useCallback((record: T) => {
    const { recordLabel: label, recordTitle: heading } = labelSource.current;
    if (label) return label(record);
    const shown = heading(record);
    return typeof shown === "string" || typeof shown === "number" ? String(shown) : record.id;
  }, []);
  const rowSelection = useMemo(
    () =>
      selectedIds === undefined
        ? internalSelection
        : Object.fromEntries(selectedIds.map((id) => [id, true as const])),
    [selectedIds, internalSelection],
  );
  const previewHeading = useRef<HTMLHeadingElement>(null);
  const previewBody = useReadOnlyScroller<HTMLDivElement>();
  const dialogRef = useRef<HTMLDivElement>(null);
  // The row whose preview is being read, so closing the preview returns focus to its eye.
  const openerId = useRef<string | null>(null);
  const hadPreview = useRef(false);
  const headingId = useId();
  const openPreview = useCallback((record: T) => {
    openerId.current = record.id;
    setPreviewId(record.id);
  }, []);
  // The column that names the record leads the row, so its cell carries the eye.
  const orderedColumns = useMemo(() => {
    if (previewColumn === undefined) return columns;
    const named = columns.find((column) => columnId(column) === previewColumn);
    return named ? [named, ...columns.filter((column) => column !== named)] : columns;
  }, [columns, previewColumn]);
  const query = server?.query;
  const table = useDataTable({
    data: records,
    columns: orderedColumns,
    getRowId: (record) => record.id,
    selectable: true,
    state: query
      ? {
          rowSelection,
          globalFilter: query.search,
          sorting: query.sorting,
          columnFilters: query.filters,
          pagination: { pageIndex: query.pageIndex, pageSize: query.pageSize },
        }
      : { rowSelection },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      if (selectedIds === undefined) setInternalSelection(next);
      onSelectionChange?.(Object.keys(next).filter((id) => next[id]));
    },
    // The server pages, sorts, filters and searches: each change is a question asked of it.
    ...(server
      ? {
          manual: { sorting: true, filtering: true, pagination: true },
          rowCount: server.rowCount,
          onGlobalFilterChange: (update: Updater<string>) =>
            ask((previous) => ({
              ...previous,
              search: String(applyUpdate(update, previous.search) ?? ""),
              pageIndex: 0,
            })),
          onSortingChange: (update: Updater<SortingState>) =>
            ask((previous) => ({
              ...previous,
              sorting: applyUpdate(update, previous.sorting),
              pageIndex: 0,
            })),
          onColumnFiltersChange: (update: Updater<ColumnFiltersState>) =>
            ask((previous) => ({
              ...previous,
              filters: applyUpdate(update, previous.filters),
              pageIndex: 0,
            })),
          onPaginationChange: (update: Updater<{ pageIndex: number; pageSize: number }>) =>
            ask((previous) => ({
              ...previous,
              ...applyUpdate(update, {
                pageIndex: previous.pageIndex,
                pageSize: previous.pageSize,
              }),
            })),
        }
      : {}),
    pageSize: query ? query.pageSize : 20,
    label: title,
    density: "compact",
    rowLabel: labelOf,
    preview: { onPreview: openPreview, activeId: previewId },
  });
  const preview =
    previewId === null
      ? undefined
      : known
        ? known.get(previewId)
        : records.find((record) => record.id === previewId);
  // Previous and next walk every row the search and filters leave, in the table's order, on every
  // page: a step onto another page turns the table to it.
  const displayed = displayedRows(table);
  const onPage = previewId === null ? -1 : displayed.findIndex((row) => row.id === previewId);
  // Server-paged, the rows are one page of the whole result: the page they are and the question
  // they answer settle once other rows than those the browser asked from have arrived and `state`
  // is neither loading nor refreshing, so a step never counts from rows that answer the question
  // before.
  const settled = (state === undefined || state === "ready") && askedFrom.current !== records;
  const [rowsAre, setRowsAre] = useState(() =>
    query
      ? { pageIndex: query.pageIndex, pageSize: query.pageSize, result: resultOf(query) }
      : null,
  );
  if (
    query &&
    settled &&
    (rowsAre?.pageIndex !== query.pageIndex ||
      rowsAre.pageSize !== query.pageSize ||
      rowsAre.result !== resultOf(query))
  )
    setRowsAre({ pageIndex: query.pageIndex, pageSize: query.pageSize, result: resultOf(query) });
  const answered =
    !!query &&
    settled &&
    rowsAre?.pageIndex === query.pageIndex &&
    rowsAre.pageSize === query.pageSize &&
    rowsAre.result === resultOf(query);
  const rowsOffset = rowsAre ? rowsAre.pageIndex * rowsAre.pageSize : 0;
  // Where the shown record stands in the whole result: on the page, else where it last stood
  // under the same question (a page turned by hand leaves it there), else outside the results.
  // While the next answer is on its way it keeps the place it had.
  const [place, setPlace] = useState<{ id: string; offset: number; result: string } | null>(null);
  if (query && answered && previewId !== null && onPage >= 0) {
    const at = rowsOffset + onPage;
    if (place?.id !== previewId || place.offset !== at || place.result !== resultOf(query))
      setPlace({ id: previewId, offset: at, result: resultOf(query) });
  }
  const offset = !query
    ? onPage
    : answered && onPage >= 0
      ? rowsOffset + onPage
      : place?.id === previewId && (place.result === resultOf(query) || !answered)
        ? place.offset
        : -1;
  // A step past the page's edge asks for the page that holds the record it wants, by its place in
  // the whole result, and shows it once that page has arrived.
  const [arrival, setArrival] = useState<{ offset: number; pageIndex: number } | null>(null);
  const show = (id: string) => {
    openerId.current = id;
    setPreviewId(id);
  };
  const step = (delta: -1 | 1) => {
    if (!server || !query) {
      const target = displayed[onPage + delta];
      if (!target) return;
      showRow(table, target.id);
      show(target.id);
      return;
    }
    // A step while another is on its way goes on from where that one is going.
    const from = arrival ? arrival.offset : offset;
    const target = from + delta;
    if (from < 0 || target < 0 || target >= server.rowCount) return;
    const row = answered && !arrival ? displayed[target - rowsOffset] : undefined;
    if (row) return show(row.id);
    const pageIndex = Math.floor(target / query.pageSize);
    setArrival({ offset: target, pageIndex });
    ask((previous) => ({ ...previous, pageIndex }));
  };
  const askedPage = query?.pageIndex;
  useEffect(() => {
    if (!arrival) return;
    // The reader turned to another page: the step is dropped and the preview stays where it is.
    if (askedPage !== arrival.pageIndex) return setArrival(null);
    if (!answered) return;
    setArrival(null);
    // The server orders the page: its rows are the table's, in the order given.
    const row = records[arrival.offset - rowsOffset];
    if (!row) return;
    openerId.current = row.id;
    setPreviewId(row.id);
  }, [arrival, askedPage, answered, records, rowsOffset]);
  const chosenIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );
  const selected = known
    ? chosenIds.flatMap((id) => known.get(id) ?? [])
    : table.getSelectedRowModel().flatRows.map((row) => row.original);
  // What there is to choose from once the records are in, search and filters aside. While they
  // load, or after a load that failed with none, the count says only what is chosen.
  const onOffer =
    state === "loading" || (state === "error" && records.length === 0)
      ? undefined
      : server
        ? server.total
        : onOfferIn(table);
  const closePreview = () => {
    // Keep focus in the dialog before removing the focused preview subtree. Otherwise
    // Base UI restores focus from the document body and overrides the row restoration.
    dialogRef.current?.focus({ preventScroll: true });
    setPreviewId(null);
    requestAnimationFrame(() => {
      const opener = dialogRef.current?.querySelector<HTMLElement>(
        `[data-row-id="${CSS.escape(openerId.current ?? "")}"] [data-slot="preview-eye"] button`,
      );
      const fallback = dialogRef.current?.querySelector<HTMLElement>("input[type=search]");
      (opener ?? fallback)?.focus();
    });
  };
  useLayoutEffect(() => {
    dismissPreview.current = preview ? closePreview : null;
    return () => {
      dismissPreview.current = null;
    };
  });
  useEffect(() => {
    if (previewId && !hadPreview.current) previewHeading.current?.focus();
    hadPreview.current = !!previewId;
    if (previewBody.current) previewBody.current.scrollTop = 0;
  }, [previewId, previewBody]);
  const confirm = async () => {
    if (!selected.length || confirming.current) return;
    confirming.current = true;
    setSaving(true);
    setLinkError(null);
    const current = () => mounted.current && open.current;
    try {
      await onConfirm(selected);
      if (current()) onClose();
    } catch (cause) {
      if (current())
        setLinkError(
          cause instanceof Error && cause.message ? cause.message : t("recordBrowserFailed"),
        );
    } finally {
      if (current()) {
        confirming.current = false;
        setSaving(false);
      }
    }
  };
  const previewLabel = preview ? labelOf(preview) : "";
  const code = preview ? recordCode?.(preview) : null;
  return (
    <DialogContent
      ref={dialogRef}
      data-record-browser=""
      // Most of the window both ways: its role token is its width and its cap, past every step.
      style={{
        width: token("dimension.part.recordBrowser"),
        maxWidth: token("dimension.part.recordBrowser"),
        height: "90dvh",
        maxHeight: "90dvh",
      }}
      onKeyDown={(event) => {
        // Keep Escape from reaching the underlying shell panel. Base UI handles dismissal above.
        if (event.key === "Escape") event.stopPropagation();
      }}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogBody
        data-record-browser-body=""
        className="flex p-0"
        data-preview={preview ? "open" : undefined}
      >
        {/* While the confirmation runs, the choice it is linking cannot change. */}
        <div
          data-record-browser-results=""
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain p-200"
          inert={saving}
          aria-busy={saving || undefined}
        >
          {/* The context scrolls with the results, so a short window keeps room for the rows. */}
          {context ? (
            <div data-record-browser-context="" className="shrink-0 pb-200">
              {context}
            </div>
          ) : null}
          <DataTable
            table={table}
            responsive
            className={fillResults}
            onRowClick={openPreview}
            state={state}
            error={error}
            onRetry={onRetry}
            empty={{
              title: empty?.title ?? t("recordBrowserEmptyTitle"),
              description: empty?.description ?? t("recordBrowserEmptyDescription"),
              action: empty?.action !== undefined ? empty.action : actions,
              secondary: empty?.secondary,
              illustration: empty?.illustration,
            }}
            toolbar={
              <Toolbar
                search={String(table.state.globalFilter ?? "")}
                onSearch={(value) => table.setGlobalFilter(value)}
                placeholder={searchPlaceholder ?? t("recordBrowserSearch")}
                filters={
                  filters.length ? (
                    <>
                      {filters.map((column) => (
                        <DataTable.Filter
                          key={column}
                          table={table}
                          column={column}
                          options={server?.filterOptions?.[column]}
                        />
                      ))}
                    </>
                  ) : undefined
                }
                activeFilters={table.state.columnFilters.length}
                actions={actions}
              >
                <DataTable.Columns table={table} />
              </Toolbar>
            }
          />
        </div>
        {preview ? (
          <section
            aria-labelledby={headingId}
            data-record-browser-preview=""
            className="flex min-h-0 min-w-0 flex-col border-s border-default bg-surface-current"
          >
            <div className="flex shrink-0 items-center gap-050 border-b border-default px-200 py-150">
              {/* In place of the results, the way back leads; beside them, it is the X at the end. */}
              <IconButton
                label={t("recordBrowserBack")}
                icon={<ChevronLeft className="rtl:rotate-180" />}
                variant="subtle"
                isTooltipDisabled
                data-record-browser-back=""
                className="@split:hidden"
                onClick={closePreview}
              />
              <Truncate className="min-w-0 flex-1 font-body-small text-subtle">{code}</Truncate>
              {/* The kit's navigation, without a full-record link: the preview belongs to the task. */}
              <PreviewNavigation
                position={offset + 1}
                total={server ? server.rowCount : displayed.length}
                recordLabel={previewLabel}
                onPrevious={() => step(-1)}
                onNext={() => step(1)}
              />
              <IconButton
                label={t("recordBrowserBack")}
                icon={<X />}
                variant="subtle"
                data-record-browser-back=""
                className="hidden @split:inline-flex"
                onClick={closePreview}
              />
            </div>
            <div
              ref={previewBody}
              data-record-browser-preview-body=""
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-200 outline-none focus-visible:outline-focused"
            >
              {/* The record's name is the kit's record title, a level under the dialog's title
                  (an h3), and what the preview shows sits a level under it. */}
              <PageHeader className="pb-200">
                <PageHeader.Title
                  id={headingId}
                  ref={previewHeading}
                  tabIndex={-1}
                  className="outline-none"
                >
                  {recordTitle(preview)}
                </PageHeader.Title>
              </PageHeader>
              <HeadingLevelProvider>{renderPreview(preview)}</HeadingLevelProvider>
            </div>
            <label
              className={cn(
                "flex shrink-0 items-center gap-100 border-t border-default px-200 py-150 font-body",
                saving ? "cursor-not-allowed" : "cursor-pointer",
              )}
            >
              <Checkbox
                checked={!!table.state.rowSelection[preview.id]}
                disabled={saving}
                onCheckedChange={(checked) =>
                  table.setRowSelection((selection) => {
                    const next = { ...selection };
                    if (checked) next[preview.id] = true;
                    else delete next[preview.id];
                    return next;
                  })
                }
              />
              {t("selectNamed", { label: previewLabel })}
            </label>
          </section>
        ) : null}
      </DialogBody>
      {linkError ? (
        <div className="shrink-0 px-250 py-100">
          <Alert tone="danger" role="alert">
            <AlertCircle aria-hidden />
            <AlertDescription>{linkError}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      {/* Under 30rem tall the footer keeps a focused control clear of itself (DialogFooter). */}
      <DialogFooter>
        <div className="me-auto flex min-w-0 items-center gap-100 font-body-small text-subtle">
          <Truncate role="status" className="min-w-0 tabular-nums">
            {selectedCount(t, formatNumber, selected.length, onOffer)}
          </Truncate>
          {selected.length ? (
            // The count gives way and the action keeps its one line: a link-styled Button wraps
            // as text does, so it holds its width here.
            <Button
              variant="link"
              size="small"
              disabled={saving}
              focusableWhenDisabled
              className="shrink-0"
              onClick={() => table.resetRowSelection()}
            >
              {t("recordBrowserClearSelection")}
            </Button>
          ) : null}
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-100">
          <DialogClose render={<Button variant="subtle" />}>{t("cancel")}</DialogClose>
          <Button
            variant="primary"
            disabled={!selected.length}
            isLoading={saving}
            onClick={() => void confirm()}
          >
            {confirmLabel}
            {selected.length ? ` (${formatNumber(selected.length)})` : ""}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
