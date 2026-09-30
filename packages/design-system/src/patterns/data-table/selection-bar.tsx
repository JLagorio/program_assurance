import { useLedgerLocale } from "../../lib/locale";
import type { RowData } from "@tanstack/react-table";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "../../components/button";
import { announce } from "../../lib/announce";
import { cn } from "../../lib/cn";
import type { DataTableInstance } from "./use-data-table";

/** Every row the reader chose: the loaded ones, and in a server-paged table the ones on other pages too. */
function chosenCount<TData extends RowData>(table: DataTableInstance<TData>) {
  return table.options.manualPagination
    ? Object.values(table.state.rowSelection).filter(Boolean).length
    : table.getSelectedRowModel().rows.length;
}

/*
 * The bar that appears when rows are chosen: the count, the verbs, Clear. Choosing the page's rows
 * offers the rest as a second, explicit step ("Select all 340"), never silently. The count is said
 * as it changes, and it says how many of the chosen rows the search or the filters now hide, since
 * the verbs act on every chosen row. Escape inside the bar clears; Clear hands focus to the
 * table's select-all, so the reader stays in the table.
 */
export function SelectionBar<TData extends RowData>({
  table,
  actions,
  noun,
  className,
}: {
  table: DataTableInstance<TData>;
  /** The verbs, as Buttons. They receive every chosen row, the hidden ones included: `table.getSelectedRowModel()`. */
  actions?: ReactNode;
  /** After the count: "12 selected". */
  noun?: string | undefined;
  className?: string | undefined;
}) {
  const { t, formatNumber } = useLedgerLocale();
  const bar = useRef<HTMLDivElement>(null);

  const chosen = chosenCount(table);
  // Chosen rows the search or a filter now leaves out; a server table cannot tell, and in a
  // server-paged one a chosen row on another page is not loaded, so it is not hidden.
  const hidden =
    table.options.manualFiltering || table.options.manualPagination
      ? 0
      : Math.max(0, chosen - table.getFilteredSelectedRowModel().rows.length);
  const count = noun
    ? `${formatNumber(chosen)} ${noun}`
    : hidden > 0
      ? t("selectedCountHidden", { count: formatNumber(chosen), hidden: formatNumber(hidden) })
      : t("selectedCount", { count: formatNumber(chosen) });
  const said = useRef<string | null>(null);
  useEffect(() => {
    // The first count is not news; every change after it is, down to none.
    if (said.current === null) {
      said.current = count;
      return;
    }
    if (said.current === count) return;
    said.current = count;
    announce(count);
  }, [count]);

  if (chosen === 0) return null;
  const total = table.getRowCount();
  const allPage = table.getIsAllPageRowsSelected();
  const all = table.getIsAllRowsSelected();
  const offerRest = allPage && !all && total > table.getRowModel().rows.length;
  const clear = () => {
    // The bar goes with the last chosen row, so focus goes to the table's select-all first.
    let scope = bar.current?.parentElement ?? null;
    while (scope && !scope.querySelector("table")) scope = scope.parentElement;
    const target =
      scope?.querySelector<HTMLElement>('thead [role="checkbox"]') ??
      scope?.querySelector<HTMLElement>('tbody [role="checkbox"], tbody input[type="checkbox"]');
    table.resetRowSelection();
    if (target) requestAnimationFrame(() => target.focus());
  };
  return (
    <div
      ref={bar}
      role="region"
      aria-label={t("selection")}
      data-slot="data-table-selection-bar"
      onKeyDown={(e) => {
        if (e.key === "Escape") clear();
      }}
      className={cn(
        "flex flex-wrap items-center gap-100 rounded-medium border border-brand bg-selected px-150 py-075 font-body text-brand",
        className,
      )}
    >
      <span className="tabular-nums font-medium">{count}</span>
      {offerRest ? (
        <Button variant="link" size="small" onClick={() => table.toggleAllRowsSelected(true)}>
          {t("selectAllCount", { count: formatNumber(total) })}
        </Button>
      ) : null}
      <span className="ms-auto flex items-center gap-100">
        {actions}
        <Button variant="subtle" size="small" onClick={clear}>
          {t("clear")}
        </Button>
      </span>
    </div>
  );
}
