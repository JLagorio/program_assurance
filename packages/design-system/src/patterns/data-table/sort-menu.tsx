import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

import { Button } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import type { LedgerMessages } from "../../lib/locale-format";
import type { DataTableFeatures } from "./features";
import type { DataTableInstance } from "./use-data-table";

/*
 * The sort as a toolbar menu. The header sorts too, but a responsive table folds headers into each
 * row's More fields, and a folded column has no header to sort by or to show the sort on. This
 * menu offers every sortable column the reader shows, folded or not, and its trigger names the
 * sort, so the order of the rows is never a secret. It writes the table's sorting, so the visible
 * header keeps its arrow and `aria-sort`, and the view store and `useTableQuery` see the change.
 */

type TableColumn<TData extends RowData> = Column<DataTableFeatures, TData, unknown>;

/** A column's words: its header when that is text, else its id. */
export const labelOf = <TData extends RowData>(column: TableColumn<TData>) => {
  const header = column.columnDef.header;
  return typeof header === "string" ? header : column.id;
};

/** The words for each direction follow what the column holds: dates are oldest or newest first, numbers lowest or highest, names A to Z. A column sorted by its own `sortBy`, or a status by its rank, reads ascending or descending. */
export function directionWords<TData extends RowData>(
  column: TableColumn<TData> | undefined,
): readonly [keyof LedgerMessages, keyof LedgerMessages] {
  const kind = column?.columnDef.meta?.kind;
  if (typeof column?.columnDef.sortFn === "function") return ["ascending", "descending"];
  if (kind === "date") return ["oldestFirst", "newestFirst"];
  if (kind === "number") return ["lowestFirst", "highestFirst"];
  if (kind === "id" || kind === "text" || kind === "person" || kind === "list")
    return ["aToZ", "zToA"];
  return ["ascending", "descending"];
}

export type DataTableSortProps<TData extends RowData> = Omit<
  ComponentPropsWithRef<"button">,
  "children" | "value" | "onChange"
> & {
  table: DataTableInstance<TData>;
  /** The columns offered, in this order. Unsaid, every column the table can sort by that the reader shows, in the table's order, including those a responsive row has folded into More fields. */
  columns?: readonly string[] | undefined;
  /** The trigger's words while nothing is sorted. The locale's "Sort" unsaid. */
  label?: string | undefined;
};

/**
 * A toolbar menu to choose the sort and see it: the column under Sort by, then the direction. The
 * trigger reads the sort ("Sort: Due") with the direction's arrow, and its accessible name adds the
 * direction in words. Choices keep the menu open, so the column and the direction are set in one
 * visit. Put it among a Toolbar's display controls, where it folds into More with Columns and
 * Settings. With several sorts the menu shows and replaces the first. Native button props and a ref
 * reach the trigger.
 */
export function DataTableSort<TData extends RowData>({
  table,
  columns: offered,
  label,
  className,
  ...props
}: DataTableSortProps<TData>) {
  const { t } = useLedgerLocale();
  const sortable = table
    .getAllLeafColumns()
    .filter((column) => column.getCanSort() && column.columnDef.meta?.kind !== "actions");
  const current = table.state.sorting[0];
  const sorted = current ? table.getColumn(current.id) : undefined;
  const columns = offered
    ? offered.flatMap((id) => sortable.filter((column) => column.id === id))
    : sortable.filter((column) => column.getIsVisible() || column.id === current?.id);
  if (columns.length === 0) return null;
  const [up, down] = directionWords(sorted);
  const summary = sorted ? t("sortedBy", { label: labelOf(sorted) }) : (label ?? t("sort"));
  // The name starts with the words the trigger shows and adds the direction its arrow draws.
  const name =
    current && sorted
      ? t("sortedByDirection", { label: labelOf(sorted), direction: t(current.desc ? down : up) })
      : undefined;
  const Icon = !current ? ArrowUpDown : current.desc ? ArrowDown : ArrowUp;
  const choose = (id: string) => {
    if (columns.some((column) => column.id === id))
      table.setSorting([{ id, desc: current?.desc ?? false }]);
  };
  const turn = (value: string) => {
    if (current) table.setSorting([{ id: current.id, desc: value === "desc" }]);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="secondary"
            size="small"
            iconBefore={<Icon />}
            className={cn("min-w-0 max-w-full", className)}
            {...props}
            {...(name ? { "aria-label": name } : {})}
            data-slot="data-table-sort"
          >
            {/* Narrower than its words, the trigger ends in an ellipsis and keeps them as its title. */}
            <span className="min-w-0 truncate" title={summary}>
              {summary}
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {/* Each radio group is its own labelled group: its label names the radios it holds. */}
        <DropdownMenuRadioGroup value={current?.id ?? ""} onValueChange={choose}>
          <DropdownMenuLabel>{t("sortBy")}</DropdownMenuLabel>
          {columns.map((column) => (
            <DropdownMenuRadioItem key={column.id} value={column.id}>
              {labelOf(column)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={current ? (current.desc ? "desc" : "asc") : ""}
          onValueChange={turn}
        >
          <DropdownMenuLabel>{t("sortDirection")}</DropdownMenuLabel>
          <DropdownMenuRadioItem value="asc" disabled={!current}>
            <ArrowUp className="icon-subtle" />
            {t(up)}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="desc" disabled={!current}>
            <ArrowDown className="icon-subtle" />
            {t(down)}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
