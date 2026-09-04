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
import { useId, type CSSProperties, type ReactNode } from "react";

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

/** The drag context. Wrap the Table with it; put ColumnSortable inside the thead and RowSortable inside the tbody. */
export function DragContext<TData extends RowData>({
  table,
  children,
}: {
  table: DataTableInstance<TData>;
  children: ReactNode;
}) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
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
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[byKind]}
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
  const ids = table.getCenterVisibleLeafColumns().map((c) => c.id);
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
  const ids = table.getRowModel().rows.map((r) => r.id);
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  );
}

/** What a draggable header needs: a ref and a style for the cell, and the grip for its trailing slot. */
export function useColumnDrag(id: string, enabled: boolean) {
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
      aria-label="Reorder column"
      className={cn(
        "inline-flex size-250 shrink-0 cursor-grab items-center justify-center rounded-small icon-subtle outline-none touch-none hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused",
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
