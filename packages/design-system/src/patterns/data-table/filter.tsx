import { useLedgerLocale } from "../../lib/locale";
import { parseIsoDay } from "../../lib/locale-format";
import { type ColumnFiltersState, type RowData } from "@tanstack/react-table";
import { ChevronDown, ListFilter } from "lucide-react";
import { useId, useMemo, useState, type ReactNode } from "react";
import { Count } from "../../components/badge";
import { Button } from "../../components/button";
import { Checkbox } from "../../components/checkbox";
import { FilterChip } from "../../components/chip";
import { DatePicker, dayFormat } from "../../components/date-picker";
import { Input } from "../../components/input";
import { SearchField } from "../../components/search-field";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuShortcut,
} from "../../components/dropdown-menu";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "../../components/popover";
import { ToggleGroup, ToggleGroupItem } from "../../components/toggle-group";
import { Scroller, ScrollerArrow, ScrollerViewport } from "../../components/scroller";
import { token } from "../../generated/tokens";
import { cn } from "../../lib/cn";
import { statusOf } from "./columns";
import { activeTriggerClass } from "./group-by";
import { type DataTableInstance } from "./use-data-table";

/*
 * Filters share one toolbar popover, or appear as individual chips. Their fields are built
 * from the column: the facet's values as checkboxes for a status, a person, a short text column or
 * a column of several values; a range for a number or a date; a text field for a long text column.
 * The applied filter reads on the chip. Search is the global filter. Presets are saved questions: a
 * named set of column filters with the count it would show.
 */

/** Above this many distinct values a text column filters by substring rather than by checkbox. */
const FACET_LIMIT = 30;
/** Above this many values a facet takes a search field over its checkboxes. */
const FACET_SEARCH_AT = 8;

const asArray = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : v == null || v === "" ? [] : [v];

/** One value a facet offers. A server-filtered table passes its values, and their counts, as `options`: the rows it holds are one page, so their values are not every value there is. */
export type FilterOption = {
  /** The stored value the filter matches. */
  value: string;
  /** The words for it. The value itself, or a status map's label, unsaid. */
  label?: string | undefined;
  /** How many records hold it. Unsaid, no count shows. */
  count?: number | undefined;
};

function FacetBody({
  values,
  chosen,
  onChange,
  labelOf,
  title,
}: {
  values: [unknown, number | undefined][];
  chosen: unknown[];
  onChange: (next: unknown[]) => void;
  /** The words for a value: a status map's label, the value itself unsaid. */
  labelOf: (value: unknown) => string;
  /** The column's name, for the search field over a long facet. */
  title: string;
}) {
  const { t, formatNumber, locale } = useLedgerLocale();
  const [query, setQuery] = useState("");

  if (values.length === 0)
    return <p className="font-body-small text-subtle">{t("noFilterValues")}</p>;
  const has = (v: unknown) => chosen.some((c) => String(c) === String(v));
  const needle = query.trim().toLocaleLowerCase(locale);
  const shown = needle
    ? values.filter(([value]) => labelOf(value).toLocaleLowerCase(locale).includes(needle))
    : values;
  return (
    <div className="flex min-w-0 flex-col gap-100">
      {/* A long facet takes a search, so a reader finds one person among forty without scrolling. */}
      {values.length > FACET_SEARCH_AT ? (
        <SearchField
          size="small"
          value={query}
          onValueChange={(next) => setQuery(next)}
          aria-label={t("searchFacet", { label: title })}
          placeholder={t("search")}
        />
      ) : null}
      {shown.length === 0 ? (
        <p className="font-body-small text-subtle">{t("noMatchingValues")}</p>
      ) : (
        <div className="flex flex-col gap-075">
          {shown.map(([value, count]) => (
            <label
              key={String(value)}
              className="inline-flex items-center gap-100 font-body text-default"
            >
              <Checkbox
                checked={has(value)}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? [...chosen, value]
                      : chosen.filter((c) => String(c) !== String(value)),
                  )
                }
              />
              <span className="flex min-w-0 select-none items-center gap-100">
                <span className="min-w-0 break-words">{labelOf(value)}</span>
                {count === undefined ? null : (
                  <span className="tabular-nums font-body-small text-subtlest">
                    {formatNumber(count)}
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/** An end of a range as the field holds it: "" for an open end. */
const fieldText = (v: unknown) => (v == null ? "" : String(v));

function RangeBody({
  value,
  onChange,
  type,
  min,
  max,
}: {
  value: [unknown, unknown];
  onChange: (next: [unknown, unknown]) => void;
  type: "number" | "date";
  min?: number | undefined;
  max?: number | undefined;
}) {
  const { t, formatNumber } = useLedgerLocale();
  const reversedId = useId();

  const [from, to] = value;
  const reversed =
    from != null && to != null && from !== "" && to !== ""
      ? type === "number"
        ? Number(from) > Number(to)
        : String(from) > String(to)
      : false;
  const invalid = reversed
    ? { "aria-invalid": true as const, "aria-describedby": reversedId }
    : {};
  const message = reversed ? (
    <p id={reversedId} className="font-body-small text-danger">
      {t("rangeReversed")}
    </p>
  ) : null;
  if (type === "date") {
    // Two days from the kit's picker, each end open until chosen. The one limits the other, so a
    // reader cannot pick an end before the start.
    const start = fieldText(from);
    const end = fieldText(to);
    return (
      <div className="flex min-w-0 flex-col gap-100">
        <DatePicker
          size="small"
          value={start}
          onValueChange={(iso) => onChange([iso || undefined, to])}
          placeholder={t("from")}
          aria-label={t("from")}
          {...(parseIsoDay(end) ? { max: end } : {})}
          className="w-full"
        />
        <DatePicker
          size="small"
          value={end}
          onValueChange={(iso) => onChange([from, iso || undefined])}
          placeholder={t("to")}
          aria-label={t("to")}
          {...(parseIsoDay(start) ? { min: start } : {})}
          {...invalid}
          className="w-full"
        />
        {message}
      </div>
    );
  }
  const parse = (v: string) => (v === "" ? undefined : Number(v));
  return (
    <div className="flex min-w-0 flex-col gap-100">
      <div className="flex items-center gap-100">
        <Input
          type="number"
          size="small"
          value={fieldText(from)}
          onChange={(e) => onChange([parse(e.target.value), to])}
          placeholder={min === undefined ? t("from") : formatNumber(min)}
          aria-label={t("from")}
        />
        <span className="text-subtle">–</span>
        <Input
          type="number"
          size="small"
          value={fieldText(to)}
          onChange={(e) => onChange([from, parse(e.target.value)])}
          placeholder={max === undefined ? t("to") : formatNumber(max)}
          aria-label={t("to")}
          {...invalid}
        />
      </div>
      {message}
    </div>
  );
}

type FilterProps<TData extends RowData> = {
  table: DataTableInstance<TData>;
  column: string;
  label?: string | undefined;
  /** The popover's width in pixels, 220 by default (`dimension.part.filter`). */
  width?: number | undefined;
  /**
   * The values to offer, in this order, with their counts: for a table the server filters
   * (`manual`), whose rows are one page. Unsaid, the facet is the values of the rows the table
   * holds, counted after the search and the other filters.
   */
  options?: readonly FilterOption[] | undefined;
};

/** The chip that filters one column. The popover's body follows the column's kind. */
export function Filter<TData extends RowData>(props: FilterProps<TData>) {
  return <ColumnFilter {...props} />;
}

function ColumnFilter<TData extends RowData>({
  table,
  column: columnId,
  label,
  width,
  options,
  inline = false,
}: FilterProps<TData> & { inline?: boolean }) {
  const { t, formatNumber, formatDay, formatDayRange, locale } = useLedgerLocale();

  const column = table.getColumn(columnId);
  const [open, setOpen] = useState(false);
  const kind = column?.columnDef.meta?.kind;
  const header = column?.columnDef.header;
  const title = label ?? (typeof header === "string" ? header : columnId);
  const raw = column?.getFilterValue();
  const facetValues = column?.getFacetedUniqueValues();
  const statuses = column?.columnDef.meta?.statuses;
  const status = useMemo(() => (statuses ? statusOf(statuses) : undefined), [statuses]);
  // A column of several values per row (its `getUniqueValues` gives them) facets by each value, not
  // by the combinations the rows hold.
  const multiValued = typeof column?.columnDef.getUniqueValues === "function";
  const labels = useMemo(
    () =>
      new Map(
        (options ?? []).flatMap((o): [string, string][] =>
          o.label === undefined ? [] : [[o.value, o.label]],
        ),
      ),
    [options],
  );
  const labelOf = (value: unknown) =>
    labels.get(String(value)) ?? (status ? status.label(value) : String(value));
  const chosenKey = JSON.stringify(asArray(raw).map(String));
  const facets = useMemo(() => {
    if (kind === "number" || kind === "date" || kind === "custom" || kind === "actions") return null;
    let values: [unknown, number | undefined][];
    if (options) values = options.map((o) => [o.value, o.count]);
    else {
      if (!facetValues || (kind === "list" && !multiValued)) return null;
      values = [...facetValues.entries()].filter(([v]) => v != null && v !== "");
      if ((kind === "text" || kind === "list") && values.length > FACET_LIMIT) return null;
    }
    // A chosen value stays in the list, at 0, after the search or another filter removes its rows,
    // so it can still be unchecked where it was checked.
    const listed = new Set(values.map(([v]) => String(v)));
    const missing = (JSON.parse(chosenKey) as string[]).filter((v) => !listed.has(v));
    values = [...values, ...missing.map((v): [unknown, number | undefined] => [v, 0])];
    // The order holds while the counts change: a status map's own order, the server's order, else
    // alphabetical. Counts never reorder the list under the reader's pointer.
    if (status) return values.sort((a, b) => status.compare(a[0], b[0]));
    if (options) return values;
    return values.sort((a, b) =>
      String(a[0]).localeCompare(String(b[0]), locale, { numeric: true, sensitivity: "base" }),
    );
  }, [facetValues, kind, locale, status, options, multiValued, chosenKey]);
  if (!column) return null;

  let body: ReactNode;
  let value: string | undefined;
  if (kind === "number" || kind === "date") {
    const range: [unknown, unknown] = Array.isArray(raw)
      ? [raw[0], raw[1]]
      : [undefined, undefined];
    const [min, max] = kind === "number" ? (column.getFacetedMinMaxValues() ?? []) : [];
    body = (
      <RangeBody
        type={kind}
        value={range}
        onChange={(next) => column.setFilterValue(next)}
        min={min}
        max={max}
      />
    );
    const [from, to] = range;
    const set = (v: unknown) => v != null && v !== "";
    // The chip says the range in the reader's words: "Sep 7 – 11, 2026", "≥ 5".
    const words = (v: unknown) => {
      if (kind === "number") return typeof v === "number" ? formatNumber(v) : String(v);
      const day = typeof v === "string" ? parseIsoDay(v) : null;
      return day ? formatDay(day, dayFormat) : String(v);
    };
    const fromDay = typeof from === "string" ? parseIsoDay(from) : null;
    const toDay = typeof to === "string" ? parseIsoDay(to) : null;
    value =
      set(from) && set(to)
        ? fromDay && toDay && String(from) <= String(to)
          ? formatDayRange(fromDay, toDay, dayFormat)
          : `${words(from)}–${words(to)}`
        : set(from)
          ? `≥ ${words(from)}`
          : set(to)
            ? `≤ ${words(to)}`
            : undefined;
  } else if (facets) {
    const chosen = asArray(raw);
    body = (
      <FacetBody
        values={facets}
        chosen={chosen}
        onChange={(next) => column.setFilterValue(next.length ? next : undefined)}
        labelOf={labelOf}
        title={title}
      />
    );
    value =
      chosen.length === 1
        ? labelOf(chosen[0])
        : chosen.length > 1
          ? t("chosenCount", { count: formatNumber(chosen.length) })
          : undefined;
  } else {
    const contains =
      raw && typeof raw === "object" && "contains" in raw
        ? String((raw as { contains: unknown }).contains)
        : "";
    body = (
      <Input
        size="small"
        value={contains}
        onChange={(e) =>
          column.setFilterValue(e.target.value ? { contains: e.target.value } : undefined)
        }
        placeholder={t("contains", { label: title })}
        aria-label={t("contains", { label: title })}
      />
    );
    value = contains || undefined;
  }

  if (inline) {
    return (
      <fieldset className="flex min-w-0 flex-col gap-100">
        <legend className="pb-100 font-body-small font-medium text-default">{title}</legend>
        {body}
      </fieldset>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<FilterChip label={title} value={value} isActive={value !== undefined} />}
      />
      {/* A long facet scrolls inside the popover, which never runs past the window. */}
      <PopoverContent
        aria-label={title}
        align="start"
        style={{ width: width ?? token("dimension.part.filter") }}
      >
        <div className="flex flex-col gap-100">
          {body}
          {value !== undefined ? (
            <div className="flex justify-end">
              <Button variant="link" size="small" onClick={() => column.setFilterValue(undefined)}>
                {t("clear")}
              </Button>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** A single toolbar action for several column filters, with their count and a clear action. */
export function Filters<TData extends RowData>({
  table,
  columns,
  options,
  additionalFilters,
}: {
  table: DataTableInstance<TData>;
  columns: readonly string[];
  /** Each column's values, by column id, for a table the server filters: see Filter's `options`. */
  options?: Readonly<Partial<Record<string, readonly FilterOption[]>>> | undefined;
  /** Filters owned by the caller, such as a URL-backed scope. Included in the count and Clear all. */
  additionalFilters?:
    | {
        content: ReactNode;
        count: number;
        onClear: () => void;
      }
    | undefined;
}) {
  const { t, formatNumber } = useLedgerLocale();
  const count = table.state.columnFilters.length + (additionalFilters?.count ?? 0);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            size="small"
            iconBefore={<ListFilter />}
            iconAfter={<ChevronDown />}
            className={count ? activeTriggerClass : undefined}
            {...(count ? { "data-active-trigger": "" } : {})}
          >
            {t("filters")}
            {count ? ` (${formatNumber(count)})` : ""}
          </Button>
        }
      />
      <PopoverContent align="start">
        <div className="flex items-center justify-between gap-100">
          <PopoverTitle>{t("filters")}</PopoverTitle>
          <Button
            variant="link"
            size="small"
            disabled={!count}
            onClick={() => {
              table.setColumnFilters([]);
              additionalFilters?.onClear();
            }}
          >
            {t("clearAllFilters")}
          </Button>
        </div>
        <div className="flex flex-col gap-200 pt-100">
          {additionalFilters?.content}
          {columns.map((column) => (
            <ColumnFilter
              key={column}
              table={table}
              column={column}
              options={options?.[column]}
              inline
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** The global filter, as a search field: a clear button while there is a query, and Escape clears it. Text and id columns take part; numbers and dates do not. */
export function Search<TData extends RowData>({
  table,
  placeholder,
  width,
}: {
  table: DataTableInstance<TData>;
  placeholder?: string | undefined;
  /** The field's width in pixels, 200 by default (`dimension.part.tableSearch`); it never runs past its row. */
  width?: number | undefined;
}) {
  const { t } = useLedgerLocale();

  return (
    <SearchField
      size="small"
      value={String(table.state.globalFilter ?? "")}
      onValueChange={(next) => table.setGlobalFilter(next)}
      placeholder={placeholder ?? t("search")}
      aria-label={placeholder ?? t("search")}
      style={{ width: width ?? token("dimension.part.tableSearch"), maxWidth: "100%" }}
    />
  );
}

export type Preset = {
  id: string;
  label: ReactNode;
  /** The column filters the preset applies; none means every row. */
  filters?: ColumnFiltersState | undefined;
};

/** How many rows a set of column filters would show, of every row, a tree's nested rows included: before search and before pagination. */
export function countRows<TData extends RowData>(
  table: DataTableInstance<TData>,
  filters: ColumnFiltersState = [],
): number {
  const resolved = filters.flatMap((f) => {
    const column = table.getColumn(f.id);
    return column ? [{ id: f.id, value: f.value, fn: column.getFilterFn() }] : [];
  });
  return table
    .getPreFilteredRowModel()
    .flatRows.filter((row) => resolved.every((f) => f.fn(row, f.id, f.value))).length;
}

/** An empty end, an empty list and nothing at all are the same open question. */
const isOpen = (v: unknown) => v == null || v === "" || (Array.isArray(v) && v.length === 0);

/** Whether two filter values ask the same thing. A range is ordered; a facet is a set, so the order the reader checked its values in, or one value against a list of one, does not matter. */
function sameValue(a: unknown, b: unknown, ordered: boolean): boolean {
  if (isOpen(a) && isOpen(b)) return true;
  if (ordered) {
    if (!Array.isArray(a) || !Array.isArray(b)) return JSON.stringify(a) === JSON.stringify(b);
    const length = Math.max(a.length, b.length);
    return Array.from({ length }, (_, i) => i).every((i) =>
      isOpen(a[i]) && isOpen(b[i]) ? true : Object.is(a[i], b[i]) || String(a[i]) === String(b[i]),
    );
  }
  const set = (v: unknown) =>
    Array.isArray(v) || (v !== null && typeof v === "object")
      ? Array.isArray(v)
        ? v.map(String).sort()
        : [JSON.stringify(v)]
      : [String(v)];
  const left = set(a);
  const right = set(b);
  return left.length === right.length && left.every((v, i) => v === right[i]);
}

/** Whether the table's column filters are a preset's question, whatever order they were set in. */
function sameQuestion<TData extends RowData>(
  table: DataTableInstance<TData>,
  preset: ColumnFiltersState,
  current: ColumnFiltersState,
) {
  const asked = (filters: ColumnFiltersState) =>
    new Map(filters.filter((f) => !isOpen(f.value)).map((f) => [f.id, f.value]));
  const a = asked(preset);
  const b = asked(current);
  if (a.size !== b.size) return false;
  return [...a].every(([id, value]) => {
    if (!b.has(id)) return false;
    const kind = table.getColumn(id)?.columnDef.meta?.kind;
    return sameValue(value, b.get(id), kind === "number" || kind === "date");
  });
}

/**
 * Each preset's count, counted once per set of rows and set of questions: not again on every
 * keystroke or selection, which leave both as they were. A server-filtered table passes its own.
 */
function usePresetCounts<TData extends RowData>(
  table: DataTableInstance<TData>,
  presets: Preset[],
  given: Readonly<Record<string, number>> | undefined,
): ReadonlyMap<string, number> {
  const rows = table.getPreFilteredRowModel();
  // The key only says when to count again; the count reads the presets themselves, whose values
  // (a number range's Infinity, an open end) a JSON round trip would change.
  const questions = JSON.stringify(presets.map((p) => [p.id, p.filters ?? []]));
  const givenKey = given ? JSON.stringify(given) : "";
  return useMemo(
    () => {
      void rows;
      void questions;
      void givenKey;
      if (given)
        return new Map(
          presets.flatMap((p): [string, number][] => {
            const count = given[p.id];
            return count === undefined ? [] : [[p.id, count]];
          }),
        );
      return new Map(presets.map((p) => [p.id, countRows(table, p.filters)]));
    },
    // `presets` is left out on purpose: a new array with the same questions counts nothing new.
    [table, rows, questions, givenKey],
  );
}

/** The menu's questions, drawn only while it is open: a closed menu counts nothing. */
function PresetMenuItems<TData extends RowData>({
  table,
  presets,
  counts: given,
}: {
  table: DataTableInstance<TData>;
  presets: Preset[];
  counts: Readonly<Record<string, number>> | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const counts = usePresetCounts(table, presets, given);
  return presets.map((p) => {
    const count = counts.get(p.id);
    return (
      <DropdownMenuRadioItem key={p.id} value={p.id} closeOnClick>
        {p.label}
        {count === undefined ? null : (
          <DropdownMenuShortcut>
            <span className="tabular-nums">{formatNumber(count)}</span>
          </DropdownMenuShortcut>
        )}
      </DropdownMenuRadioItem>
    );
  });
}

/** The strip's questions, each with its count, counted once per set of rows. */
function PresetStripItems<TData extends RowData>({
  table,
  presets,
  counts: given,
}: {
  table: DataTableInstance<TData>;
  presets: Preset[];
  counts: Readonly<Record<string, number>> | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const counts = usePresetCounts(table, presets, given);
  return presets.map((p) => {
    const count = counts.get(p.id);
    return (
      <ToggleGroupItem key={p.id} value={p.id}>
        {p.label}
        {count === undefined ? null : <Count value={formatNumber(count)} />}
      </ToggleGroupItem>
    );
  });
}

/**
 * Saved questions, each with the count it would show. Choosing one replaces the column filters.
 * `strip` is a ToggleGroup on its own line above the table; `menu` is one small button in the
 * toolbar that reads the current question and opens the list, for a toolbar that also holds
 * search and filters. The button is named by what it shows ("All programs 7"), and `aria-label`
 * (the locale's "Saved questions" unsaid) describes it; on the strip it names the group.
 */
export function Presets<TData extends RowData>({
  table,
  presets,
  variant = "strip",
  counts,
  "aria-label": ariaLabel,
  className,
}: {
  table: DataTableInstance<TData>;
  presets: Preset[];
  variant?: "strip" | "menu" | undefined;
  /** Each preset's count, by id, for a table the server filters (`manual`): its rows are one page, so it cannot count them. Unsaid, the table counts its own rows. */
  counts?: Readonly<Record<string, number>> | undefined;
  "aria-label"?: string | undefined;
  className?: string | undefined;
}) {
  const { t, formatNumber } = useLedgerLocale();
  const descriptionId = useId();

  const current = table.state.columnFilters;
  const active = presets.find((p) => sameQuestion(table, p.filters ?? [], current));
  // The trigger's count is the active question's; the rows it counts change only with the data.
  const rows = table.getPreFilteredRowModel();
  const activeFilters = active ? JSON.stringify(active.filters ?? []) : undefined;
  const counted = counts !== undefined;
  const activeGiven = active ? counts?.[active.id] : undefined;
  const activeCount = useMemo(
    () => {
      void rows;
      if (activeFilters === undefined || !active) return undefined;
      if (counted) return activeGiven;
      return countRows(table, active.filters);
    },
    // Keyed by the question's value, not the preset object: see usePresetCounts.
    [table, rows, activeFilters, counted, activeGiven],
  );
  if (variant === "menu") {
    const count = activeCount;
    const label = active?.label ?? t("view");
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              // Named by what it shows, so "click All programs" finds it and a screen reader hears
              // the question and its count; what the button is for is its description. Narrower
              // than its content, the label gives way with an ellipsis and keeps its full text as a
              // title (when it is text); the count and the chevron stay whole.
              <Button
                variant="secondary"
                size="small"
                iconAfter={<ChevronDown />}
                aria-describedby={descriptionId}
                className={cn("min-w-0 max-w-full", className)}
              >
                <span
                  className="min-w-0 truncate"
                  title={typeof label === "string" ? label : undefined}
                >
                  {label}
                </span>
                {count === undefined ? null : <Count value={formatNumber(count)} />}
              </Button>
            }
          />
          <DropdownMenuContent align="start" style={{ minWidth: 240 }}>
            <DropdownMenuRadioGroup
              aria-label={ariaLabel ?? t("savedQuestions")}
              value={active?.id ?? ""}
              onValueChange={(id: string) => {
                const preset = presets.find((p) => p.id === id);
                if (preset) table.setColumnFilters(preset.filters ?? []);
              }}
            >
              <PresetMenuItems table={table} presets={presets} counts={counts} />
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <span id={descriptionId} hidden>
          {ariaLabel ?? t("savedQuestions")}
        </span>
      </>
    );
  }
  // The strip keeps every question in one row; narrower than its row it scrolls, arrows where a pointer can hover.
  return (
    <Scroller orientation="horizontal" className="max-w-full">
      <ScrollerViewport>
        <ToggleGroup<string>
          aria-label={ariaLabel ?? t("savedQuestions")}
          className={className}
          size="sm"
          value={active ? [active.id] : []}
          onValueChange={([id]) => {
            if (id === undefined) return;
            const preset = presets.find((p) => p.id === id);
            table.setColumnFilters(preset?.filters ?? []);
          }}
        >
          <PresetStripItems table={table} presets={presets} counts={counts} />
        </ToggleGroup>
      </ScrollerViewport>
      <ScrollerArrow edge="start" />
      <ScrollerArrow edge="end" />
    </Scroller>
  );
}
