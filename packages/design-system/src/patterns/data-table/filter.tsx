import { useLedgerLocale } from "../../lib/locale";
import type { ColumnFiltersState, RowData } from "@tanstack/react-table";
import { ChevronDown, Search as SearchIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Count } from "../../components/badge";
import { Button } from "../../components/button";
import { Checkbox } from "../../components/checkbox";
import { FilterChip } from "../../components/chip";
import { Input } from "../../components/controls";
import { DropdownMenu } from "../../components/dropdown-menu";
import { InputGroup } from "../../components/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/popover";
import { ToggleGroup, ToggleGroupItem } from "../../components/toggle-group";
import type { DataTableInstance } from "./use-data-table";

/*
 * Filters live in the toolbar as chips, never as a row under the header. A chip's popover is built
 * from the column: the facet's values as checkboxes for a status, a person or a short text column;
 * a range for a number or a date; a text field for a long text column. The applied filter reads on
 * the chip. Search is the global filter. Presets are saved questions: a named set of column filters
 * with the count it would show.
 */

/** Above this many distinct values a text column filters by substring rather than by checkbox. */
const FACET_LIMIT = 30;

const asArray = (v: unknown): unknown[] =>
  Array.isArray(v) ? v : v == null || v === "" ? [] : [v];

function FacetBody({
  values,
  chosen,
  onChange,
}: {
  values: [unknown, number][];
  chosen: unknown[];
  onChange: (next: unknown[]) => void;
}) {
  const { formatNumber } = useLedgerLocale();

  const has = (v: unknown) => chosen.some((c) => String(c) === String(v));
  return (
    <div className="flex flex-col gap-075">
      {values.map(([value, count]) => (
        <label
          key={String(value)}
          className="inline-flex items-center gap-100 font-body text-default"
        >
          <Checkbox
            checked={has(value)}
            onCheckedChange={(checked) =>
              onChange(
                checked ? [...chosen, value] : chosen.filter((c) => String(c) !== String(value)),
              )
            }
          />
          <span className="flex select-none items-center gap-100">
            <span>{String(value)}</span>
            <span className="tabular-nums font-body-small text-subtlest">
              {formatNumber(count)}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

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
  const { t } = useLedgerLocale();

  const [from, to] = value;
  const str = (v: unknown) => (v == null ? "" : String(v));
  const parse = (v: string) => (v === "" ? undefined : type === "number" ? Number(v) : v);
  return (
    <div className="flex items-center gap-100">
      <Input
        type={type}
        value={str(from)}
        onChange={(e) => onChange([parse(e.target.value), to])}
        placeholder={min === undefined ? t("from") : String(min)}
        aria-label={t("from")}
        className="h-control-small"
      />
      <span className="text-subtle">–</span>
      <Input
        type={type}
        value={str(to)}
        onChange={(e) => onChange([from, parse(e.target.value)])}
        placeholder={max === undefined ? t("to") : String(max)}
        aria-label={t("to")}
        className="h-control-small"
      />
    </div>
  );
}

/** The chip that filters one column. The popover's body follows the column's kind. */
export function Filter<TData extends RowData>({
  table,
  column: columnId,
  label,
  width = 220,
}: {
  table: DataTableInstance<TData>;
  column: string;
  label?: string | undefined;
  width?: number | undefined;
}) {
  const { t, formatNumber, locale } = useLedgerLocale();

  const column = table.getColumn(columnId);
  const [open, setOpen] = useState(false);
  const kind = column?.columnDef.meta?.kind;
  const header = column?.columnDef.header;
  const title = label ?? (typeof header === "string" ? header : columnId);
  const raw = column?.getFilterValue();
  const facets = useMemo(() => {
    if (
      !column ||
      kind === "number" ||
      kind === "date" ||
      kind === "list" ||
      kind === "custom" ||
      kind === "actions"
    )
      return null;
    const values = [...column.getFacetedUniqueValues().entries()].filter(
      ([v]) => v != null && v !== "",
    );
    if (kind === "text" && values.length > FACET_LIMIT) return null;
    return values.sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), locale));
  }, [column, kind, locale]);
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
    value =
      from != null && to != null
        ? `${from}–${to}`
        : from != null
          ? `≥ ${from}`
          : to != null
            ? `≤ ${to}`
            : undefined;
  } else if (facets) {
    const chosen = asArray(raw);
    body = (
      <FacetBody
        values={facets}
        chosen={chosen}
        onChange={(next) => column.setFilterValue(next.length ? next : undefined)}
      />
    );
    value =
      chosen.length === 1
        ? String(chosen[0])
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
        value={contains}
        onChange={(e) =>
          column.setFilterValue(e.target.value ? { contains: e.target.value } : undefined)
        }
        placeholder={t("contains", { label: title })}
        aria-label={t("contains", { label: title })}
        className="h-control-small"
      />
    );
    value = contains || undefined;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<FilterChip label={title} value={value} isActive={value !== undefined} />}
      />
      <PopoverContent aria-label={title} align="start" style={{ width }}>
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

/** The global filter, as a search field. Text and id columns take part; numbers and dates do not. */
export function Search<TData extends RowData>({
  table,
  placeholder,
  width = 200,
}: {
  table: DataTableInstance<TData>;
  placeholder?: string | undefined;
  width?: number | undefined;
}) {
  const { t } = useLedgerLocale();

  return (
    <InputGroup leading={<SearchIcon />} width={width}>
      <Input
        value={String(table.state.globalFilter ?? "")}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        placeholder={placeholder ?? t("search")}
        aria-label={placeholder ?? t("search")}
        className="h-control-small"
      />
    </InputGroup>
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

/**
 * Saved questions, each with the count it would show. Choosing one replaces the column filters.
 * `strip` is a ToggleGroup on its own line above the table; `menu` is one small button in the
 * toolbar that reads the current question and opens the list, for a toolbar that also holds
 * search and filters.
 */
export function Presets<TData extends RowData>({
  table,
  presets,
  variant = "strip",
  "aria-label": ariaLabel,
  className,
}: {
  table: DataTableInstance<TData>;
  presets: Preset[];
  variant?: "strip" | "menu" | undefined;
  "aria-label"?: string | undefined;
  className?: string | undefined;
}) {
  const { t } = useLedgerLocale();

  const current = JSON.stringify(table.state.columnFilters);
  const active = presets.find((p) => JSON.stringify(p.filters ?? []) === current);
  if (variant === "menu") {
    const count = active ? countRows(table, active.filters) : undefined;
    return (
      <DropdownMenu
        align="start"
        width={240}
        trigger={
          <Button
            variant="secondary"
            size="small"
            iconAfter={<ChevronDown />}
            aria-label={ariaLabel ?? t("savedQuestions")}
            className={className}
          >
            {active?.label ?? t("view")}
            {count === undefined ? null : <Count value={count} />}
          </Button>
        }
      >
        {presets.map((p) => (
          <DropdownMenu.Item
            key={p.id}
            isSelected={p.id === active?.id}
            onSelect={() => table.setColumnFilters(p.filters ?? [])}
            trailing={<span className="tabular-nums">{countRows(table, p.filters)}</span>}
          >
            {p.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu>
    );
  }
  return (
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
      {presets.map((p) => (
        <ToggleGroupItem key={p.id} value={p.id}>
          {p.label}
          <Count value={countRows(table, p.filters)} max={9999} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
