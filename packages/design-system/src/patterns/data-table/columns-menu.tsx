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
import type { ReactElement } from "react";

import { Button } from "../../components/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../../components/dropdown-menu";
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
  children?: ReactElement;
}) {
  const { t } = useLedgerLocale();

  const columns = table.getAllLeafColumns().filter((c) => c.getCanHide());
  const hidden = columns.filter((c) => !c.getIsVisible()).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
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
      />
      <DropdownMenuContent align="end" style={{ width: 220 }}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("show")}</DropdownMenuLabel>
          {columns.map((c) => (
            <DropdownMenuCheckboxItem
              key={c.id}
              checked={c.getIsVisible()}
              onCheckedChange={(checked) => c.toggleVisibility(checked)}
            >
              {labelOf(c)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
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
  children?: ReactElement;
}) {
  const { t } = useLedgerLocale();

  const view = table.options.meta?.view;
  const density = table.options.meta?.density ?? "default";
  const setDensity = table.options.meta?.setDensity;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          children ?? (
            <IconButton
              label={label ?? t("tableSettings")}
              variant="secondary"
              size="small"
              icon={<Settings2 />}
            />
          )
        }
      />
      <DropdownMenuContent align="end" style={{ width: 220 }}>
        {setDensity ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("rows")}</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={density === "compact"}
                onCheckedChange={(checked) => setDensity(checked ? "compact" : "default")}
              >
                {t("compactRows")}
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onClick={() => resetView(table)}>
          {view ? t("resetView") : t("resetColumns")}
        </DropdownMenuItem>
      </DropdownMenuContent>
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <IconButton
            label={t("columnMenu", { label: labelOf(column) })}
            variant="subtle"
            className="size-250"
            icon={<ChevronDown />}
          />
        }
      />
      <DropdownMenuContent align="end" style={{ width: 200 }}>
        {canSort ? (
          <DropdownMenuRadioGroup
            value={sorted || ""}
            onValueChange={(value: string) => column.toggleSorting(value === "desc")}
          >
            <DropdownMenuRadioItem value="asc" closeOnClick>
              <ArrowUp className="icon-subtle" />
              {t("sortAscending")}
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="desc" closeOnClick>
              <ArrowDown className="icon-subtle" />
              {t("sortDescending")}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        ) : null}
        {canSort && (canPin || canHide) ? <DropdownMenuSeparator /> : null}
        {canPin ? (
          <>
            {pinned !== "start" ? (
              <DropdownMenuItem onClick={() => column.pin("start")}>
                <span className="flex items-center gap-100">
                  <Pin className="size-icon-small icon-subtle" /> {t("pinStart")}
                </span>
              </DropdownMenuItem>
            ) : null}
            {pinned !== "end" ? (
              <DropdownMenuItem onClick={() => column.pin("end")}>
                <span className="flex items-center gap-100">
                  <Pin className="size-icon-small icon-subtle" /> {t("pinEnd")}
                </span>
              </DropdownMenuItem>
            ) : null}
            {pinned ? (
              <DropdownMenuItem onClick={() => column.pin(false)}>
                <span className="flex items-center gap-100">
                  <PinOff className="size-icon-small icon-subtle" /> {t("unpin")}
                </span>
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}
        {canHide ? (
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <span className="flex items-center gap-100">
              <EyeOff className="size-icon-small icon-subtle" /> {t("hideColumn")}
            </span>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
