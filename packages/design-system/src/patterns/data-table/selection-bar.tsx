import { useLedgerLocale } from "../../lib/locale";
import type { RowData } from "@tanstack/react-table";
import {
  useCallback,
  useEffect,
  useRef,
  type ComponentPropsWithRef,
  type ReactNode,
  type Ref,
} from "react";

import { Button } from "../../components/button";
import { announce } from "../../lib/announce";
import { cn } from "../../lib/cn";
import type { DataTableInstance } from "./use-data-table";

/** Hands an element to a caller's ref, a callback or an object. */
function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

/** Every row the reader chose: the loaded ones, and in a server-paged table the ones on other pages too. */
function chosenCount<TData extends RowData>(table: DataTableInstance<TData>) {
  return table.options.manualPagination
    ? Object.values(table.state.rowSelection).filter(Boolean).length
    : table.getSelectedRowModel().rows.length;
}

/*
 * The bar that takes the toolbar's place while rows are chosen: the count, the verbs, Clear. Drawn
 * in the DataTable's `toolbar` slot in place of the Toolbar, it leaves the rows where they were.
 * Choosing the page's rows offers the rest as a second, explicit step ("Select all 340"), never
 * silently. The count is said as it changes, and it says how many of the chosen rows the search
 * or the filters now hide, since the verbs act on every chosen row. Escape inside the bar clears,
 * and goes no further, so a panel or a dialog around the table stays open; Clear hands focus to
 * the table's select-all, so the reader stays in the table. The bar's native `div` props,
 * `className` and `ref` reach the bar; its name is the locale's "Selection" unless the caller
 * names it, and a caller's `onKeyDown` runs first, so one that prevents the default keeps Escape.
 */
export function SelectionBar<TData extends RowData>({
  table,
  actions,
  noun,
  className,
  ref,
  onKeyDown,
  ...props
}: Omit<ComponentPropsWithRef<"div">, "children"> & {
  table: DataTableInstance<TData>;
  /** The verbs, as Buttons. They receive every chosen row, the hidden ones included: `table.getSelectedRowModel()`. */
  actions?: ReactNode;
  /** After the count: "12 selected". */
  noun?: string | undefined;
  className?: string | undefined;
}) {
  const { t, formatNumber, locale } = useLedgerLocale();
  const bar = useRef<HTMLDivElement>(null);
  // The caller's ref reaches the bar beside the bar's own.
  const setBar = useCallback(
    (element: HTMLDivElement | null) => {
      bar.current = element;
      assignRef(ref, element);
    },
    [ref],
  );

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
  const shown = useRef(false);
  useEffect(() => {
    if (said.current === count) return;
    const first = said.current === null;
    said.current = count;
    // The bar appearing is news: the first row chosen draws it (in the toolbar's slot, where it
    // mounts only then) with its count and its verbs, so both are said. A bar drawn with nothing
    // chosen says nothing until a row is; every change after that is said, down to none.
    if (chosen > 0 && !shown.current) {
      shown.current = true;
      const verbs = Array.from(
        bar.current?.querySelectorAll<HTMLElement>("button, a[href]") ?? [],
        (control) => (control.getAttribute("aria-label") ?? control.textContent ?? "").trim(),
      ).filter(Boolean);
      announce(
        verbs.length
          ? t("selectionShown", {
              count,
              actions: new Intl.ListFormat(locale, { type: "conjunction" }).format(verbs),
            })
          : count,
      );
      return;
    }
    if (chosen === 0) shown.current = false;
    if (!first) announce(count);
  }, [count, chosen, t, locale]);

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
      aria-label={t("selection")}
      {...props}
      ref={setBar}
      role="region"
      data-slot="data-table-selection-bar"
      onKeyDown={(e) => {
        onKeyDown?.(e);
        // A popup the verbs opened (a menu, portalled out of the bar) closes on its own Escape,
        // and text still being composed keeps it; the rest is the bar's, and ends here, so an
        // enclosing panel or dialog does not also close.
        if (e.key !== "Escape" || e.defaultPrevented || e.nativeEvent.isComposing) return;
        if (!(e.target instanceof Node) || !e.currentTarget.contains(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        clear();
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
