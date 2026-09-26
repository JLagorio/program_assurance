import { useLedgerLocale } from "../../lib/locale";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RowData } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";
import { useId, useMemo, type CSSProperties, type ReactNode } from "react";

import { cn } from "../../lib/cn";
import type { DataTableInstance } from "./use-data-table";

/*
 * Reordering by drag and by keyboard, on dnd-kit. One drag context around the table serves both the
 * header row (columns, sideways) and the body (rows, up and down); each has its own sortable set, so
 * a header never sorts among rows. The grip takes the pointer (eight pixels of travel, so a click
 * still sorts) and the keyboard (Space, arrows, Space). Only the middle band of columns reorders;
 * pinned columns keep their band. A column drop writes the table's columnOrder, which the view store
 * persists; a row drop tells the caller which row moved next to which.
 */

type DragKind = "column" | "row";

/** Sideways for a column, up and down for a row. */
const byKind: Modifier = (args) =>
  args.active?.data.current?.["type"] === "row"
    ? restrictToVerticalAxis(args)
    : restrictToHorizontalAxis(args);

/* The sensors' options, made once: dnd-kit rebuilds its context when they change, and every row
   and header that can drag reads that context, so new options on each render would redraw them all. */
const POINTER_OPTIONS = { activationConstraint: { distance: 8 } };
const KEYBOARD_OPTIONS = { coordinateGetter: sortableKeyboardCoordinates };
const MODIFIERS = [byKind];

/** What a drag says about an item: a row's label, a column's header text, else its id. */
function spokenName<TData extends RowData>(
  table: DataTableInstance<TData>,
  id: string | number,
  kind: DragKind | undefined,
) {
  const key = String(id);
  if (kind === "row") {
    try {
      const row = table.getRow(key, true);
      const meta = table.options.meta;
      return (
        meta?.rowLabel?.(row.original as never) ?? meta?.tree?.label(row.original as never) ?? key
      );
    } catch {
      return key;
    }
  }
  const header = table.getColumn(key)?.columnDef.header;
  return typeof header === "string" ? header : key;
}

/** The drag context. Wrap the Table with it; put ColumnSortable inside the thead and RowSortable inside the tbody. */
export function DragContext<TData extends RowData>({
  table,
  children,
}: {
  table: DataTableInstance<TData>;
  children: ReactNode;
}) {
  const { t } = useLedgerLocale();
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_OPTIONS),
    useSensor(KeyboardSensor, KEYBOARD_OPTIONS),
  );
  const kindOf = (item: { data: { current?: Record<string, unknown> | undefined } }) =>
    item.data.current?.["type"] as DragKind | undefined;
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const kind = active.data.current?.["type"] as DragKind | undefined;
    if (kind === "row") {
      const moved = table.getRow(String(active.id));
      const target = table.getRow(String(over.id));
      const rows = table.getRowModel().rows;
      const from = rows.findIndex((r) => r.id === moved.id);
      const to = rows.findIndex((r) => r.id === target.id);
      table.options.meta?.reorderRows?.(
        moved.original as never,
        target.original as never,
        to > from ? "after" : "before",
      );
      return;
    }
    // the current order, which is the reader's when they have one and the author's otherwise
    const all = table.getAllLeafColumns().map((c) => c.id);
    const current = table.state.columnOrder;
    const order = current.length ? [...current, ...all.filter((c) => !current.includes(c))] : all;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    table.setColumnOrder(arrayMove(order, from, to));
  };
  return (
    <DndContext
      id={id}
      accessibility={{
        screenReaderInstructions: { draggable: t("dragInstructions") },
        // A row is said by its label and a column by its header, never by a raw id.
        announcements: {
          onDragStart: ({ active }) =>
            t("dragStarted", { item: spokenName(table, active.id, kindOf(active)) }),
          onDragOver: ({ active, over }) =>
            over
              ? t("dragOver", {
                  item: spokenName(table, active.id, kindOf(active)),
                  target: spokenName(table, over.id, kindOf(active)),
                })
              : t("dragOutside", { item: spokenName(table, active.id, kindOf(active)) }),
          onDragEnd: ({ active, over }) =>
            over
              ? t("dragDropped", {
                  item: spokenName(table, active.id, kindOf(active)),
                  target: spokenName(table, over.id, kindOf(active)),
                })
              : t("dragCanceled", { item: spokenName(table, active.id, kindOf(active)) }),
          onDragCancel: ({ active }) =>
            t("dragCanceled", { item: spokenName(table, active.id, kindOf(active)) }),
        },
      }}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={MODIFIERS}
      onDragEnd={onDragEnd}
    >
      {children}
    </DndContext>
  );
}

/** The sortable set of columns: the middle band, in order. */
export function ColumnSortable<TData extends RowData>({
  table,
  children,
}: {
  table: DataTableInstance<TData>;
  children: ReactNode;
}) {
  // One list while the order holds: a new list each render would redraw every sortable header.
  const key = table
    .getCenterVisibleLeafColumns()
    .map((c) => c.id)
    .join("\u0000");
  const ids = useMemo(() => (key ? key.split("\u0000") : []), [key]);
  return (
    <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
      {children}
    </SortableContext>
  );
}

/** The sortable set of rows: the rows shown, in order. */
export function RowSortable<TData extends RowData>({
  table,
  children,
}: {
  table: DataTableInstance<TData>;
  children: ReactNode;
}) {
  // One list while the rows hold, so a checkbox redraws its own row and not every row.
  const key = table
    .getRowModel()
    .rows.map((r) => r.id)
    .join("\u0000");
  const ids = useMemo(() => (key ? key.split("\u0000") : []), [key]);
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  );
}

/** How a column's grip is named and reached. */
export type ColumnDragOptions = {
  /** The column's header text, for the grip's name ("Reorder Status column"). */
  label?: string | undefined;
  /**
   * The column's menu moves it by keyboard (Move left, Move right), so the grip is for the pointer
   * only: no tab stop and hidden from assistive technology, and a header costs the keyboard two
   * stops, not four. Leave it off when nothing else moves the column, and the grip keeps Space and
   * the arrow keys.
   */
  pointerOnly?: boolean | undefined;
};

/**
 * What a draggable header needs: a ref and a style for the cell, and the grip for its trailing slot.
 * The grip takes Space and the arrow keys unless `pointerOnly` says the column's menu moves it.
 */
export function useColumnDrag(
  id: string,
  enabled: boolean,
  { label, pointerOnly = false }: ColumnDragOptions = {},
) {
  const { t } = useLedgerLocale();
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
    data: { type: "column" satisfies DragKind },
    disabled: !enabled,
  });
  const style: CSSProperties | undefined = enabled
    ? {
        transform: CSS.Translate.toString(transform),
        transition,
        ...(isDragging ? { zIndex: 30, position: "relative" as const } : {}),
      }
    : undefined;
  const grip = enabled ? (
    <span
      {...attributes}
      {...listeners}
      role="button"
      {...(pointerOnly ? { tabIndex: -1, "aria-hidden": true } : {})}
      aria-label={label ? t("reorderColumnNamed", { label }) : t("reorderColumn")}
      className={cn(
        "relative inline-flex size-250 shrink-0 touch-target cursor-grab items-center justify-center rounded-small icon-subtle outline-none touch-none hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused",
        isDragging && "cursor-grabbing",
      )}
    >
      <GripVertical className="size-icon-small" />
    </span>
  ) : null;
  return { setNodeRef: enabled ? setNodeRef : undefined, style, grip, isDragging };
}

/** What a draggable row needs: a ref and a style for the row, and the props for its Table.Handle. */
export function useRowDrag(id: string, enabled: boolean) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "row" satisfies DragKind }, disabled: !enabled });
  const style: CSSProperties | undefined = enabled
    ? {
        transform: CSS.Translate.toString(transform),
        transition,
        ...(isDragging ? { zIndex: 30, position: "relative" as const } : {}),
      }
    : undefined;
  return {
    setNodeRef: enabled ? setNodeRef : undefined,
    style,
    isDragging,
    handle: enabled ? { ref: setActivatorNodeRef, ...attributes, ...listeners } : null,
  };
}
