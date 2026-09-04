import type { RowData } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { Button } from "../../components/button";
import { cn } from "../../lib/cn";
import type { DataTableInstance } from "./use-data-table";

/*
 * The bar that appears when rows are chosen: the count, the verbs, Clear. Choosing the page's rows
 * offers the rest as a second, explicit step ("Select all 340"), never silently. Escape clears.
 */
export function SelectionBar<TData extends RowData>({
  table,
  actions,
  noun = "selected",
  className,
}: {
  table: DataTableInstance<TData>;
  /** The verbs, as Buttons. */
  actions?: ReactNode;
  /** After the count: "12 selected". */
  noun?: string | undefined;
  className?: string | undefined;
}) {
  const chosen = table.getSelectedRowModel().rows.length;
  if (chosen === 0) return null;
  const total = table.getRowCount();
  const allPage = table.getIsAllPageRowsSelected();
  const all = table.getIsAllRowsSelected();
  const offerRest = allPage && !all && total > table.getRowModel().rows.length;
  return (
    <div
      role="region"
      aria-label="Selection"
      onKeyDown={(e) => {
        if (e.key === "Escape") table.resetRowSelection();
      }}
      className={cn(
        "flex flex-wrap items-center gap-100 rounded-medium border border-brand bg-selected px-150 py-075 font-body text-brand",
        className,
      )}
    >
      <span className="tabular-nums font-medium">
        {chosen.toLocaleString()} {noun}
      </span>
      {offerRest ? (
        <Button variant="link" size="small" onClick={() => table.toggleAllRowsSelected(true)}>
          Select all {total.toLocaleString()}
        </Button>
      ) : null}
      <span className="ms-auto flex items-center gap-100">
        {actions}
        <Button variant="subtle" size="small" onClick={() => table.resetRowSelection()}>
          Clear
        </Button>
      </span>
    </div>
  );
}
