import { useLedgerLocale } from "../../lib/locale";
import type { Column, RowData } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Columns3,
  EyeOff,
  FoldHorizontal,
  Pin,
  PinOff,
  RotateCcw,
  Settings2,
  UnfoldHorizontal,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

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
 * header's hover sorts, moves, pins and hides that column. All three write the table's state,
 * which the view store persists.
 */

type TableColumn<TData extends RowData> = Column<DataTableFeatures, TData, unknown>;

const labelOf = <TData extends RowData>(column: TableColumn<TData>): string => {
  const header = column.columnDef.header;
  return typeof header === "string" ? header : column.id;
};

/** The widths a column's handle and its menu keep it between. */
const widthBounds = <TData extends RowData>(column: TableColumn<TData>) => ({
  min: column.columnDef.minSize ?? 20,
  max: Math.min(column.columnDef.maxSize ?? 10000, 10000),
});

/** One press of Wider or Narrower: the handle's Shift-arrow step. */
const WIDTH_STEP = 32;

/**
 * The columns a column can move past from its menu: its neighbours in the middle band, among the
 * columns the header row draws and under the same group heading. Pinned columns and the row
 * actions keep their band, as they do under the grip, so a column never moves into or out of one.
 */
function moveNeighbours<TData extends RowData>(
  table: DataTableInstance<TData>,
  column: TableColumn<TData>,
  drawn: ReadonlySet<string> | undefined,
) {
  const band = table
    .getCenterVisibleLeafColumns()
    .filter(
      (c) =>
        c.columnDef.meta?.kind !== "actions" &&
        c.parent?.id === column.parent?.id &&
        (c.id === column.id || !drawn || drawn.has(c.id)),
    );
  const at = band.findIndex((c) => c.id === column.id);
  if (at < 0) return { before: undefined, after: undefined };
  return { before: band[at - 1]?.id, after: band[at + 1]?.id };
}

/** The data columns the header row draws, in the order it draws them: the start band, the middle, the end band. The row actions are chrome and do not count. */
function drawnOrder<TData extends RowData>(
  table: DataTableInstance<TData>,
  drawn: ReadonlySet<string> | undefined,
) {
  return [
    ...table.getStartVisibleLeafColumns(),
    ...table.getCenterVisibleLeafColumns(),
    ...table.getEndVisibleLeafColumns(),
  ]
    .filter((c) => c.columnDef.meta?.kind !== "actions" && (!drawn || drawn.has(c.id)))
    .map((c) => c.id);
}

/** A polite status that stays mounted while the menu closes and the headings reorder. It clears before it speaks, so the same words twice are said twice. */
function useStatus() {
  const [message, setMessage] = useState("");
  const say = useCallback((next: string) => {
    setMessage("");
    requestAnimationFrame(() => setMessage(next));
  }, []);
  return [message, say] as const;
}

const MoveStatusContext = createContext<((message: string) => void) | null>(null);

/**
 * The one status a table's column moves speak through: after Move left or Move right, the column's
 * name and where it now stands ("Finding, 3 of 5"). DataTable renders it around a reorderable
 * table; a HeaderMenu outside one keeps its own.
 */
export function ColumnMoveStatus({ children }: { children?: ReactNode }) {
  const [message, say] = useStatus();
  return (
    <MoveStatusContext.Provider value={say}>
      {children}
      <span role="status" data-slot="column-move-status" className="sr-only">
        {message}
      </span>
    </MoveStatusContext.Provider>
  );
}

/** Puts a column just before or just after another in the table's order, as a drop of its grip does. */
function placeColumn<TData extends RowData>(
  table: DataTableInstance<TData>,
  id: string,
  beside: string,
  side: "before" | "after",
) {
  // the current order, which is the reader's when they have one and the author's otherwise
  const all = table.getAllLeafColumns().map((c) => c.id);
  const current = table.state.columnOrder;
  const order = current.length ? [...current, ...all.filter((c) => !current.includes(c))] : all;
  const rest = order.filter((c) => c !== id);
  const at = rest.indexOf(beside);
  if (at < 0 || rest.length === order.length) return;
  rest.splice(side === "before" ? at : at + 1, 0, id);
  table.setColumnOrder(rest);
}

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

/** The per-column menu: sort, move, pin, hide. Rendered in a header's trailing slot, so it appears on hover and focus, and always where nothing can hover. */
export function HeaderMenu<TData extends RowData>({
  table,
  column,
  drawn,
}: {
  table: DataTableInstance<TData>;
  column: Column<DataTableFeatures, TData, unknown>;
  /** The columns the header row draws, when a responsive table moves the rest into More fields. Move left and Move right step over the rest, so every move shows. */
  drawn?: ReadonlySet<string> | undefined;
}) {
  const { t, direction, formatNumber } = useLedgerLocale();
  const trigger = useRef<HTMLButtonElement>(null);
  const shared = useContext(MoveStatusContext);
  const [ownMessage, sayOwn] = useStatus();
  const say = shared ?? sayOwn;
  // The columns drawn after a move redraws the table, read once it has.
  const drawnNow = useRef(drawn);
  useLayoutEffect(() => {
    drawnNow.current = drawn;
  });

  const meta = table.options.meta;
  const canSort = column.getCanSort();
  const canPin = Boolean(meta?.pinnable) && column.getCanPin();
  const canHide = Boolean(meta?.hideable) && column.getCanHide();
  // A column the handle resizes takes a width from here too, one press at a time: for a single
  // pointer, a touch screen and anyone who cannot drag (WCAG 2.5.7).
  const canResize = Boolean(meta?.resizable) && column.getCanResize();
  const width = column.getSize();
  const { min, max } = widthBounds(column);
  const resized = table.state.columnSizing[column.id] !== undefined;
  // A column the grip can drag moves from here too: one press each way, for the keyboard, a touch
  // screen and anyone who cannot drag. Disabled at the edges of the column's band.
  const { before, after } =
    meta?.reorderable && !column.getIsPinned()
      ? moveNeighbours(table, column, drawn)
      : { before: undefined, after: undefined };
  const canMove = before !== undefined || after !== undefined;
  if (!canSort && !canPin && !canHide && !canMove && !canResize) return null;
  const pinned = column.getIsPinned();
  const sorted = column.getIsSorted();
  // Earlier in the order is left in a left-to-right table and right in a right-to-left one.
  const rtl = direction === "rtl";
  const moves = [
    {
      key: "start",
      beside: before,
      side: "before" as const,
      label: rtl ? t("moveRight") : t("moveLeft"),
      icon: rtl ? ArrowRight : ArrowLeft,
    },
    {
      key: "end",
      beside: after,
      side: "after" as const,
      label: rtl ? t("moveLeft") : t("moveRight"),
      icon: rtl ? ArrowLeft : ArrowRight,
    },
  ];
  const move = (beside: string, side: "before" | "after") => {
    const frame = trigger.current?.closest<HTMLElement>('[data-slot="table-container"]');
    const label = labelOf(column);
    placeColumn(table, column.id, beside, side);
    // Once the table has redrawn, the reader sees and hears where the column went.
    requestAnimationFrame(() => {
      const button = trigger.current;
      const order = drawnOrder(table, drawnNow.current);
      const at = order.indexOf(column.id);
      if (button?.isConnected && at >= 0) {
        // The heading, then its menu, where focus comes back, scroll into the frame. The frame's
        // scroll padding is the pinned bands, so neither lands under a pinned column.
        button.closest("th")?.scrollIntoView({ block: "nearest", inline: "nearest" });
        button.scrollIntoView({ block: "nearest", inline: "nearest" });
        say(
          t("columnMoved", {
            label,
            position: formatNumber(at + 1),
            total: formatNumber(order.length),
          }),
        );
        return;
      }
      // A responsive table can rank the columns again after a move and draw this one into More
      // fields. Its menu is gone, so focus stays in the header row: on the column it passed, else
      // the first column menu, else the frame.
      const menus = frame?.querySelectorAll<HTMLElement>("[data-column-menu-for]") ?? [];
      const next =
        [...menus].find((menu) => menu.dataset["columnMenuFor"] === beside) ?? menus[0] ?? frame;
      next?.focus();
      say(t("columnFolded", { label }));
    });
  };
  // Wider and Narrower step as Shift and an arrow key do on the handle; Reset width returns to the
  // author's width. Once the table has redrawn, the status says the width the column now has.
  const resize = (next: number | "reset") => {
    const label = labelOf(column);
    if (next === "reset") column.resetSize();
    else
      table.setColumnSizing((current) => ({
        ...current,
        [column.id]: Math.min(max, Math.max(min, next)),
      }));
    requestAnimationFrame(() =>
      say(t("columnWidthChanged", { label, width: formatNumber(column.getSize()) })),
    );
  };
  const groups = [canSort, canMove, canResize, canPin || canHide];
  // A rule between two groups that are both there.
  const ruleBefore = (index: number) =>
    groups[index] && groups.slice(0, index).some(Boolean) ? <DropdownMenuSeparator /> : null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          ref={trigger}
          render={
            <IconButton
              label={t("columnMenu", { label: labelOf(column) })}
              variant="subtle"
              className="size-250"
              icon={<ChevronDown />}
              // Where nothing can hover the heading drops its up-down hint for a menu that sorts.
              {...(canSort ? { "data-column-menu": "" } : {})}
              // Where focus goes when a move draws another column into More fields.
              data-column-menu-for={column.id}
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
          {ruleBefore(1)}
          {canMove ? (
            <DropdownMenuGroup>
              {moves.map(({ key, beside, side, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={key}
                  disabled={beside === undefined}
                  onClick={() => {
                    if (beside !== undefined) move(beside, side);
                  }}
                >
                  <span className="flex items-center gap-100">
                    <Icon className="size-icon-small icon-subtle" /> {label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ) : null}
          {ruleBefore(2)}
          {canResize ? (
            <DropdownMenuGroup>
              {/* Wider and Narrower keep the menu open, so a single pointer presses again. */}
              <DropdownMenuItem
                closeOnClick={false}
                disabled={width >= max}
                onClick={() => resize(width + WIDTH_STEP)}
              >
                <span className="flex items-center gap-100">
                  <UnfoldHorizontal className="size-icon-small icon-subtle" /> {t("widenColumn")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                closeOnClick={false}
                disabled={width <= min}
                onClick={() => resize(width - WIDTH_STEP)}
              >
                <span className="flex items-center gap-100">
                  <FoldHorizontal className="size-icon-small icon-subtle" /> {t("narrowColumn")}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!resized} onClick={() => resize("reset")}>
                <span className="flex items-center gap-100">
                  <RotateCcw className="size-icon-small icon-subtle" /> {t("resetColumnWidth")}
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          ) : null}
          {ruleBefore(3)}
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
      {(meta?.reorderable || canResize) && !shared ? (
        <span role="status" data-slot="column-move-status" className="sr-only">
          {ownMessage}
        </span>
      ) : null}
    </>
  );
}
