import type { ColumnFiltersState, RowData } from "@tanstack/react-table";
import { Search as SearchIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "../../components/button";
import { FilterChip } from "../../components/chip";
import { Checkbox, Input } from "../../components/controls";
import { InputGroup } from "../../components/input-group";
import { Popover } from "../../components/popover";
import { ToggleGroup } from "../../components/toggle";
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
  const has = (v: unknown) => chosen.some((c) => String(c) === String(v));
  return (
    <div className="flex flex-col gap-075">
      {values.map(([value, count]) => (
        <Checkbox
          key={String(value)}
          checked={has(value)}
          onCheckedChange={(next) =>
            onChange(
              next === true
                ? [...chosen, value]
                : chosen.filter((c) => String(c) !== String(value)),
            )
          }
        >
          <span className="flex items-center gap-100">
            <span>{String(value)}</span>
            <span className="tabular-nums font-body-small text-subtlest">{count}</span>
          </span>
        </Checkbox>
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
  const [from, to] = value;
  const str = (v: unknown) => (v == null ? "" : String(v));
  const parse = (v: string) => (v === "" ? undefined : type === "number" ? Number(v) : v);
  return (
    <div className="flex items-center gap-100">
      <Input
        type={type}
        value={str(from)}
        onChange={(e) => onChange([parse(e.target.value), to])}
        placeholder={min === undefined ? "from" : String(min)}
        aria-label="From"
        className="h-control-small"
      />
      <span className="text-subtle">–</span>
      <Input
        type={type}
        value={str(to)}
        onChange={(e) => onChange([from, parse(e.target.value)])}
        placeholder={max === undefined ? "to" : String(max)}
        aria-label="To"
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
  const column = table.getColumn(columnId);
  const [open, setOpen] = useState(false);
  const kind = column?.columnDef.meta?.kind;
  const header = column?.columnDef.header;
  const title = label ?? (typeof header === "string" ? header : columnId);
  const raw = column?.getFilterValue();
  const facets = useMemo(() => {
    if (!column || kind === "number" || kind === "date" || kind === "custom" || kind === "actions")
      return null;
    const values = [...column.getFacetedUniqueValues().entries()].filter(
      ([v]) => v != null && v !== "",
    );
    if (kind === "text" && values.length > FACET_LIMIT) return null;
    return values.sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  }, [column, kind]);
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
          ? `${chosen.length} chosen`
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
        placeholder={`${title} contains`}
        aria-label={`${title} contains`}
        className="h-control-small"
      />
    );
    value = contains || undefined;
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      width={width}
      trigger={<FilterChip label={title} value={value} isActive={value !== undefined} />}
    >
      <div className="flex flex-col gap-100">
        {body}
        {value !== undefined ? (
          <div className="flex justify-end">
            <Button variant="link" size="small" onClick={() => column.setFilterValue(undefined)}>
              Clear
            </Button>
          </div>
        ) : null}
      </div>
    </Popover>
  );
}

/** The global filter, as a search field. Text and id columns take part; numbers and dates do not. */
export function Search<TData extends RowData>({
  table,
  placeholder = "Search",
  width = 200,
}: {
  table: DataTableInstance<TData>;
  placeholder?: string | undefined;
  width?: number | undefined;
}) {
  return (
    <InputGroup leading={<SearchIcon />} width={width}>
      <Input
        value={String(table.state.globalFilter ?? "")}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
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

/** How many rows a set of column filters would show, of every row: before search and before pagination. */
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
    .rows.filter((row) => resolved.every((f) => f.fn(row, f.id, f.value))).length;
}

/** Saved questions: a ToggleGroup whose items carry the count each preset would show. Choosing one replaces the column filters. */
export function Presets<TData extends RowData>({
  table,
  presets,
  "aria-label": ariaLabel = "Saved questions",
  className,
}: {
  table: DataTableInstance<TData>;
  presets: Preset[];
  "aria-label"?: string | undefined;
  className?: string | undefined;
}) {
  const current = JSON.stringify(table.state.columnFilters);
  const active = presets.find((p) => JSON.stringify(p.filters ?? []) === current)?.id ?? "";
  return (
    <ToggleGroup<string>
      aria-label={ariaLabel}
      className={className}
      value={active}
      onChange={(id) => {
        const preset = presets.find((p) => p.id === id);
        table.setColumnFilters(preset?.filters ?? []);
      }}
      items={presets.map((p) => ({
        value: p.id,
        label: p.label,
        count: countRows(table, p.filters),
      }))}
    />
  );
}
