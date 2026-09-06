import { useLedgerLocale } from "../../lib/locale";
import type { Column, RowData } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Columns3,
  EyeOff,
  Pin,
  PinOff,
  Settings2,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../../components/button";
import { DropdownMenu } from "../../components/dropdown-menu";
import { IconButton } from "../../components/button";
import type { DataTableFeatures } from "./features";
import type { DataTableInstance } from "./use-data-table";
import { resetView } from "./view-store";

/*
 * Three menus. The Columns menu in the toolbar shows and hides columns; the Settings menu beside it
 * holds the rest of the reader's view, the rows' density and Reset view. The column menu on a
 * header's hover sorts, pins and hides that column. All three write the table's state, which the
 * view store persists.
 */

const labelOf = <TData extends RowData>(
  column: Column<DataTableFeatures, TData, unknown>,
): string => {
  const header = column.columnDef.header;
  return typeof header === "string" ? header : column.id;
};

/** Which columns to show. Items stay open while the reader toggles. */
export function Columns<TData extends RowData>({
  table,
  label,
  children,
}: {
  table: DataTableInstance<TData>;
  label?: string | undefined;
  /** The trigger, in place of the default Button. */
  children?: ReactNode;
}) {
  const { t } = useLedgerLocale();

  const columns = table.getAllLeafColumns().filter((c) => c.getCanHide());
  const hidden = columns.filter((c) => !c.getIsVisible()).length;
  return (
    <DropdownMenu
      align="end"
      width={220}
      trigger={
        children ?? (
          <Button variant="secondary" size="small" iconBefore={<Columns3 />}>
            {label ?? t("columns")}
            {hidden ? (
              <span className="tabular-nums text-subtle">
                {columns.length - hidden}/{columns.length}
              </span>
            ) : null}
          </Button>
        )
      }
    >
      <DropdownMenu.Label>{t("show")}</DropdownMenu.Label>
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
    </DropdownMenu>
  );
}

/** The reader's view of the table beyond the columns: the rows' density, and Reset view last. A gear beside the Columns menu. */
export function Settings<TData extends RowData>({
  table,
  label,
  children,
}: {
  table: DataTableInstance<TData>;
  label?: string | undefined;
  /** The trigger, in place of the default IconButton. */
  children?: ReactNode;
}) {
  const { t } = useLedgerLocale();

  const view = table.options.meta?.view;
  const density = table.options.meta?.density ?? "default";
  const setDensity = table.options.meta?.setDensity;
  return (
    <DropdownMenu
      align="end"
      width={220}
      trigger={
        children ?? (
          <IconButton
            label={label ?? t("tableSettings")}
            variant="secondary"
            size="small"
            icon={<Settings2 />}
          />
        )
      }
    >
      {setDensity ? (
        <>
          <DropdownMenu.Label>{t("rows")}</DropdownMenu.Label>
          <DropdownMenu.Item
            isSelected={density === "compact"}
            closeOnSelect={false}
            onSelect={() => setDensity(density === "compact" ? "default" : "compact")}
          >
            {t("compactRows")}
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
        </>
      ) : null}
      <DropdownMenu.Item onSelect={() => resetView(table)}>
        {view ? t("resetView") : t("resetColumns")}
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
  const { t } = useLedgerLocale();

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
          label={t("columnMenu", { label: labelOf(column) })}
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
              <ArrowUp className="size-icon-small icon-subtle" /> {t("sortAscending")}
            </span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            isSelected={sorted === "desc"}
            onSelect={() => column.toggleSorting(true)}
          >
            <span className="flex items-center gap-100">
              <ArrowDown className="size-icon-small icon-subtle" /> {t("sortDescending")}
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
                <Pin className="size-icon-small icon-subtle" /> {t("pinStart")}
              </span>
            </DropdownMenu.Item>
          ) : null}
          {pinned !== "end" ? (
            <DropdownMenu.Item onSelect={() => column.pin("end")}>
              <span className="flex items-center gap-100">
                <Pin className="size-icon-small icon-subtle" /> {t("pinEnd")}
              </span>
            </DropdownMenu.Item>
          ) : null}
          {pinned ? (
            <DropdownMenu.Item onSelect={() => column.pin(false)}>
              <span className="flex items-center gap-100">
                <PinOff className="size-icon-small icon-subtle" /> {t("unpin")}
              </span>
            </DropdownMenu.Item>
          ) : null}
        </>
      ) : null}
      {canHide ? (
        <DropdownMenu.Item onSelect={() => column.toggleVisibility(false)}>
          <span className="flex items-center gap-100">
            <EyeOff className="size-icon-small icon-subtle" /> {t("hideColumn")}
          </span>
        </DropdownMenu.Item>
      ) : null}
    </DropdownMenu>
  );
}
