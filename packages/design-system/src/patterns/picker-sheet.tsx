import type { RowData } from "@tanstack/react-table";
import { AlertCircle, ChevronLeft } from "lucide-react";
import { type ReactNode } from "react";
import { Alert, AlertDescription } from "../components/alert";
import { Button, IconButton } from "../components/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  type SheetContentProps,
  type SheetProps,
  type SheetWidth,
} from "../components/sheet";
import { Truncate } from "../components/truncate";
import { useLedgerLocale } from "../lib/locale";
import type { LedgerLocale } from "../lib/locale-format";
import type { DataTableInstance, DataTableState } from "./data-table";
import { Toolbar } from "./toolbar";

/** Why the sheet asked to close, from Base UI: `reason` is `escape-key`, `outside-press` or `close-press` (the close button or Cancel). */
export type PickerSheetCloseDetails = Parameters<NonNullable<SheetProps["onOpenChange"]>>[1];

/** The toolbar's search field. With `table`, the sheet owns the query; without it, the caller does. */
export type PickerSheetSearch = {
  /** The query, when the caller owns it (no `table`). */
  value?: string | undefined;
  /** Called with each new query, when the caller owns it (no `table`). */
  onChange?: ((value: string) => void) | undefined;
  /** Names what is searched, and names the field: "Search requirements". "Search" unsaid. */
  placeholder?: string | undefined;
};

/**
 * Choosing many from hundreds: the association panel. A Sheet whose toolbar is a search field and the
 * filters, whose body is a Table with sortable headers and Table.Selection, and whose footer names what is
 * chosen and the one thing to do with it. Selection survives search and filters. When the chosen rows need
 * fields of their own, a second frame of the same sheet shows them as a compact table with Editable cells
 * and a default applied to all; `onBack` returns to the first frame. The kit owns the frame; the caller
 * owns the columns, the rows and the selection.
 */
export type PickerSheetProps<TData extends RowData = RowData> = {
  open: boolean;
  /** Where focus goes when the sheet opens, as on SheetContent: a rationale field, say. The search field, or the first control, unsaid. */
  initialFocus?: SheetContentProps["initialFocus"];
  /** Override focus return when choosing opens the next workflow surface. */
  finalFocus?: SheetContentProps["finalFocus"];
  /**
   * The reader asked to close: Escape, the blanket, the close button or Cancel. Base UI's details
   * say which (`details.reason`). Not called while `pending`.
   */
  onClose: (details?: PickerSheetCloseDetails) => void;
  /** Back to the choosing frame from the details frame. */
  onBack?: (() => void) | undefined;
  /** The task, a verb and its object: "Allocate requirements". */
  title: ReactNode;
  /** What the chosen rows will be attached to: "Flight computer · 14 allocated today". */
  subtitle?: ReactNode;
  /**
   * The DataTable the reader chooses from. The search field drives its global filter, so a search
   * with no match shows the table's own filtered empty with Clear filters, never "nothing to add";
   * and, unless they are given, `selected` is its selection, `total` every row that can be
   * chosen, search and filters aside, and `onClear` clears its selection. Pass the whole
   * collection as the table's `data`.
   */
  table?: DataTableInstance<TData> | undefined;
  /** The search field in the toolbar. With `table` it filters the table; without, the caller filters the rows. */
  search?: PickerSheetSearch | undefined;
  /** Filters after the search field, such as `DataTable.Filter`s. They fold into the toolbar's More when the sheet is too narrow for them. */
  filters?: ReactNode;
  /** How many filters apply: More counts them and says so in its name ("More filters, 2 applied") while the filters are folded, so a narrowed list never reads as all of it. The table's column filters unsaid. */
  activeFilters?: number | undefined;
  /** A row under search and filters that does not scroll: a default applied to every chosen row. */
  toolbar?: ReactNode;
  /** How many rows are chosen. The footer reads it out and the action waits for it. From `table` unsaid. */
  selected?: number | undefined;
  /** How many rows there are to choose from, search and filters aside: the "28" of "3 of 28 selected". From `table` unsaid. */
  total?: number | undefined;
  /**
   * Where the rows on offer are, as the DataTable's `state`. While they are `loading`, and when
   * they failed to load (`error` with none on offer), what there is to choose from is not known, so
   * the footer counts only what is chosen ("0 selected") and never says "0 of 0". A failed refresh
   * that keeps its rows still counts them. `ready` unsaid.
   */
  state?: DataTableState | undefined;
  /**
   * The footer's read-out in place of the count. A `table` that chooses one record
   * (`selectable: "single"`) reads the chosen row's `rowLabel` unsaid.
   */
  summary?: ReactNode;
  /** Clears the selection; a link in the footer beside the count. From `table` unsaid. */
  onClear?: (() => void) | undefined;
  /**
   * The one thing the footer does, named in full: "Allocate 12 to Flight computer". It waits,
   * disabled, until something is chosen. `isLoading` (the sheet's `pending` unsaid) shows it working.
   */
  action: {
    label: ReactNode;
    onClick: () => void;
    disabled?: boolean | undefined;
    isLoading?: boolean | undefined;
  };
  /** A second, lesser button before Cancel: "Continue without details". */
  secondary?: ReactNode;
  /**
   * The action's command is in flight. The sheet holds: Escape, the blanket, the close button and
   * Cancel do nothing (`onClose` is not called), Back and Clear are disabled, the toolbar and the
   * rows cannot change, and the sheet is `aria-busy`. End it when the command settles.
   */
  pending?: boolean | undefined;
  /**
   * What went wrong with the last attempt and what to do, as one sentence: shown as a danger Alert
   * above the footer's buttons, outside the scroll, so it is seen however long the list is. The
   * choice and the fields are kept for a retry.
   */
  error?: ReactNode;
  /**
   * A SheetContent width step: `large` (760px, room for a table of four columns) unsaid, `xlarge`
   * (960px) for more. A number of pixels still works; prefer a step.
   */
  width?: SheetWidth | number | undefined;
  /** Frame one: a DataTable with a selection. Frame two: a DataTable of the chosen rows with editable cells. */
  children: ReactNode;
};

const chosenIn = (selection: Record<string, boolean>) =>
  Object.values(selection).filter(Boolean).length;

/**
 * Package-internal: what PickerSheet and RecordBrowser say of a selection, in the locale's words:
 * "3 of 28 selected" where the total to choose from is known, "3 selected" where it is not, and
 * "0 selected" where there is nothing to choose from. The total does not follow the search: a
 * chosen row the search hides is still one of it.
 */
export function selectedCount(
  t: LedgerLocale["t"],
  formatNumber: LedgerLocale["formatNumber"],
  selected: number,
  total: number | undefined,
) {
  return total === undefined || total === 0
    ? t("selectedCount", { count: formatNumber(selected) })
    : t("selectedCountOf", { count: formatNumber(selected), total: formatNumber(total) });
}

/**
 * Package-internal: the rows there are to choose from, search and filters aside, so a chosen row
 * the search hides is still counted among them: every row that can be chosen, nested ones included,
 * whether or not its parent is open or its page is shown. A group's band is not a row to choose,
 * and a server-paged table says how many through `rowCount`.
 */
export const onOfferIn = <TData extends RowData>(table: DataTableInstance<TData>) =>
  table.options.rowCount ??
  table.getCoreRowModel().flatRows.filter((row) => row.getCanSelect()).length;

/** The chosen record's name, in a table that chooses one: its `rowLabel`, else nothing. */
const chosenNameIn = <TData extends RowData>(table: DataTableInstance<TData>) => {
  const meta = table.options.meta;
  if (!meta?.singleSelection || !meta.rowLabel) return undefined;
  const id = Object.keys(table.state.rowSelection).find((key) => table.state.rowSelection[key]);
  if (id === undefined) return undefined;
  try {
    return meta.rowLabel(table.getRow(id, true).original as never);
  } catch {
    return undefined;
  }
};

export function PickerSheet<TData extends RowData = RowData>({
  open,
  initialFocus,
  finalFocus,
  onClose,
  onBack,
  title,
  subtitle,
  table,
  search,
  filters,
  activeFilters: activeFiltersProp,
  toolbar,
  selected: selectedProp,
  total: totalProp,
  state = "ready",
  summary: summaryProp,
  onClear: onClearProp,
  action,
  secondary,
  pending = false,
  error,
  width = "large",
  children,
}: PickerSheetProps<TData>) {
  const { t, formatNumber } = useLedgerLocale();
  const selected = selectedProp ?? (table ? chosenIn(table.state.rowSelection) : 0);
  // Rows that are loading, or failed to load, are not "0 of 0": the total waits for them.
  const offered = totalProp ?? (table ? onOfferIn(table) : undefined);
  const total = state === "loading" || (state === "error" && !offered) ? undefined : offered;
  const onClear = onClearProp ?? (table ? () => table.resetRowSelection() : undefined);
  // The selection patterns' one count: "3 of 28 selected", "3 selected" while the total is not known.
  const summary =
    summaryProp ??
    (selected === 1 && table ? chosenNameIn(table) : undefined) ??
    selectedCount(t, formatNumber, selected, total);
  const query = table ? String(table.state.globalFilter ?? "") : (search?.value ?? "");
  const setQuery = (value: string) => {
    if (table) table.setGlobalFilter(value);
    else search?.onChange?.(value);
  };
  const searchName = search?.placeholder ?? t("search");
  const hasToolbar = Boolean(search || filters || toolbar);
  const activeFilters = activeFiltersProp ?? (table ? table.state.columnFilters.length : undefined);
  const step = typeof width === "string" ? width : undefined;
  return (
    <Sheet
      open={open}
      pending={pending}
      onOpenChange={(next, details) => {
        if (!next) {
          onClose(details);
        }
      }}
    >
      <SheetContent
        side="end"
        width={step}
        {...(typeof width === "number" ? { style: { maxWidth: width } } : {})}
        initialFocus={initialFocus}
        finalFocus={finalFocus}
      >
        <SheetHeader>
          <div className="flex items-start gap-100">
            {onBack && (
              <IconButton
                label={t("back")}
                icon={<ChevronLeft />}
                variant="subtle"
                isTooltipDisabled
                disabled={pending}
                focusableWhenDisabled
                onClick={onBack}
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-025">
              <SheetTitle>{title}</SheetTitle>
              {/* Without a subtitle the sheet has no description, rather than an empty one. */}
              {subtitle !== undefined && subtitle !== null && subtitle !== false ? (
                <SheetDescription>{subtitle}</SheetDescription>
              ) : null}
            </div>
          </div>
        </SheetHeader>
        {hasToolbar && (
          <div
            data-slot="picker-sheet-toolbar"
            className="shrink-0 border-b border-default px-200 py-100"
            inert={pending}
          >
            <div className="flex flex-col gap-100">
              {/* The kit's Toolbar: the search, then the filters, which fold into More. */}
              {search || filters ? (
                <Toolbar
                  {...(search
                    ? { search: query, onSearch: setQuery, placeholder: searchName }
                    : {})}
                  filters={filters}
                  activeFilters={activeFilters}
                />
              ) : null}
              {toolbar}
            </div>
          </div>
        )}
        <SheetBody inert={pending}>{children}</SheetBody>
        {/* Under 30rem tall the footer keeps a focused row clear of itself (SheetFooter). */}
        <SheetFooter>
          {error ? (
            <Alert variant="destructive" role="alert" className="w-full">
              <AlertCircle aria-hidden />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex w-full flex-wrap items-center justify-between gap-x-150 gap-y-100">
            <span
              data-slot="picker-sheet-count"
              className="flex min-w-0 items-center gap-100 font-body-small text-subtle"
            >
              <Truncate role="status" className="min-w-0 tabular-nums">
                {summary}
              </Truncate>
              {selected > 0 && onClear ? (
                <Button
                  variant="link"
                  size="small"
                  disabled={pending}
                  focusableWhenDisabled
                  onClick={onClear}
                >
                  {t("clear")}
                </Button>
              ) : null}
            </span>
            <span className="ms-auto flex flex-wrap items-center justify-end gap-100">
              {secondary}
              <SheetClose render={<Button variant="subtle" />}>{t("cancel")}</SheetClose>
              <Button
                variant="primary"
                disabled={selected === 0 || Boolean(action.disabled)}
                isLoading={action.isLoading ?? pending}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            </span>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
