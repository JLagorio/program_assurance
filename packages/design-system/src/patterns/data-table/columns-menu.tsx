import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronDown, Columns3, EyeOff, Pin, PinOff } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../../components/button";
import { DropdownMenu } from "../../components/dropdown-menu";
import { IconButton } from "../../components/button";
import type { DataTableFeatures } from "./features";
import type { DataTableInstance } from "./use-data-table";
import { resetView } from "./view-store";

/*
 * Two menus. The Columns menu in the toolbar shows and hides columns and resets the reader's view.
 * The column menu on a header's hover sorts, pins and hides that column. Both write the table's
 * state, which the view store persists.
 */

const labelOf = <TData extends RowData>(
  column: Column<DataTableFeatures, TData, unknown>,
): string => {
  const header = column.columnDef.header;
  return typeof header === "string" ? header : column.id;
};

/** Which columns to show. Items stay open while the reader toggles; Reset view is last. */
export function Columns<TData extends RowData>({
  table,
  label = "Columns",
  children,
}: {
  table: DataTableInstance<TData>;
  label?: string | undefined;
  /** The trigger, in place of the default Button. */
  children?: ReactNode;
}) {
  const columns = table.getAllLeafColumns().filter((c) => c.getCanHide());
  const hidden = columns.filter((c) => !c.getIsVisible()).length;
  const view = table.options.meta?.view;
  return (
    <DropdownMenu
      align="end"
      width={220}
      trigger={
        children ?? (
          <Button variant="secondary" size="small" iconBefore={<Columns3 />}>
            {label}
            {hidden ? (
              <span className="tabular-nums text-subtle">
                {columns.length - hidden}/{columns.length}
              </span>
            ) : null}
          </Button>
        )
      }
    >
      <DropdownMenu.Label>Show</DropdownMenu.Label>
      {columns.map((c) => (
        <DropdownMenu.Item
          key={c.id}
          isSelected={c.getIsVisible()}
          closeOnSelect={false}
          onSelect={() => c.toggleVisibility()}
        >
          {labelOf(c)}
        </DropdownMenu.Item>
      ))}
      <DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={() => resetView(table)}>
        {view ? "Reset view" : "Reset columns"}
      </DropdownMenu.Item>
    </DropdownMenu>
  );
}

/** The per-column menu: sort, pin, hide. Rendered in a header's trailing slot, so it appears on hover. */
export function HeaderMenu<TData extends RowData>({
  table,
  column,
}: {
  table: DataTableInstance<TData>;
  column: Column<DataTableFeatures, TData, unknown>;
}) {
  const meta = table.options.meta;
  const canSort = column.getCanSort();
  const canPin = Boolean(meta?.pinnable) && column.getCanPin();
  const canHide = Boolean(meta?.hideable) && column.getCanHide();
  if (!canSort && !canPin && !canHide) return null;
  const pinned = column.getIsPinned();
  const sorted = column.getIsSorted();
  return (
    <DropdownMenu
      align="end"
      width={200}
      trigger={
        <IconButton
          label={`${labelOf(column)} column menu`}
          variant="subtle"
          className="size-250"
          icon={<ChevronDown />}
        />
      }
    >
      {canSort ? (
        <>
          <DropdownMenu.Item
            isSelected={sorted === "asc"}
            onSelect={() => column.toggleSorting(false)}
          >
            <span className="flex items-center gap-100">
              <ArrowUp className="size-icon-small icon-subtle" /> Sort ascending
            </span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            isSelected={sorted === "desc"}
            onSelect={() => column.toggleSorting(true)}
          >
            <span className="flex items-center gap-100">
              <ArrowDown className="size-icon-small icon-subtle" /> Sort descending
            </span>
          </DropdownMenu.Item>
        </>
      ) : null}
      {canSort && (canPin || canHide) ? <DropdownMenu.Separator /> : null}
      {canPin ? (
        <>
          {pinned !== "start" ? (
            <DropdownMenu.Item onSelect={() => column.pin("start")}>
              <span className="flex items-center gap-100">
                <Pin className="size-icon-small icon-subtle" /> Pin to start
              </span>
            </DropdownMenu.Item>
          ) : null}
          {pinned !== "end" ? (
            <DropdownMenu.Item onSelect={() => column.pin("end")}>
              <span className="flex items-center gap-100">
                <Pin className="size-icon-small icon-subtle" /> Pin to end
              </span>
            </DropdownMenu.Item>
          ) : null}
          {pinned ? (
            <DropdownMenu.Item onSelect={() => column.pin(false)}>
              <span className="flex items-center gap-100">
                <PinOff className="size-icon-small icon-subtle" /> Unpin
              </span>
            </DropdownMenu.Item>
          ) : null}
        </>
      ) : null}
      {canHide ? (
        <DropdownMenu.Item onSelect={() => column.toggleVisibility(false)}>
          <span className="flex items-center gap-100">
            <EyeOff className="size-icon-small icon-subtle" /> Hide column
          </span>
        </DropdownMenu.Item>
      ) : null}
    </DropdownMenu>
  );
}
