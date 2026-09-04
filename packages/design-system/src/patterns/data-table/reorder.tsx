import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RowData } from "@tanstack/react-table";
import { GripVertical } from "lucide-react";
import { useId, type CSSProperties, type ReactNode } from "react";

import { cn } from "../../lib/cn";
import type { DataTableInstance } from "./use-data-table";

/*
 * Reordering columns by drag and by keyboard, on dnd-kit. The grip on a header's hover takes the
 * pointer (eight pixels of travel, so a click still sorts) and the keyboard (Space, arrows, Space).
 * Only the middle band reorders; pinned columns keep their band. The table's columnOrder is the
 * result, and the view store persists it.
 */

/** Wraps the header row so its cells can be dragged into a new order. */
export function ColumnReorder<TData extends RowData>({
  table,
  children,
}: {
  table: DataTableInstance<TData>;
  children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const id = useId();
  const ids = table.getCenterVisibleLeafColumns().map((c) => c.id);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
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
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/** What a draggable header needs: a ref and a style for the cell, and the grip for its trailing slot. */
export function useColumnDrag(id: string, enabled: boolean) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
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
