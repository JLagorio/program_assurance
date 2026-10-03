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
import { useId, useMemo, useRef, type CSSProperties, type ReactNode } from "react";

import { tokenLiterals } from "../../generated/tokens";
import { cn } from "../../lib/cn";
// Only a header or a row that can move follows the setting; the rest pass `false`.
import { useReducedMotion } from "../../lib/use-reduced-motion";
import { rowSpokenName } from "./row-name";
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
   and header that can drag reads that context, so new options on each render would redraw them all.
   Under reduced motion the keyboard's moves scroll the frame at once rather than smoothly. */
const POINTER_OPTIONS = { activationConstraint: { distance: 8 } };
const KEYBOARD_OPTIONS = { coordinateGetter: sortableKeyboardCoordinates };
const KEYBOARD_OPTIONS_REDUCED = {
  coordinateGetter: sortableKeyboardCoordinates,
  scrollBehavior: "auto" as const,
};
const MODIFIERS = [byKind];

/* A header or a row slides aside on the motion tokens, not dnd-kit's own 200ms: `medium` and the
   standard curve. Under reduced motion it moves at once, and nothing animates after a drop. */
const SLIDE = {
  duration: Number.parseFloat(tokenLiterals["motion.duration.medium"]),
  easing: tokenLiterals["motion.easing.standard"],
};
const noLayoutAnimation = () => false;
const sortableMotion = (reduced: boolean) =>
  reduced
    ? { transition: null, animateLayoutChanges: noLayoutAnimation }
    : { transition: SLIDE };

/** Where an item sits in its sortable set, from the set's own data: "3 of 8". */
function positionIn(item: { data: { current?: Record<string, unknown> | undefined } } | null) {
  const sortable = item?.data.current?.["sortable"] as
    | { index?: unknown; items?: unknown }
    | undefined;
  const index = typeof sortable?.index === "number" ? sortable.index : -1;
  const total = Array.isArray(sortable?.items) ? sortable.items.length : 0;
  return index >= 0 && total > 0 ? { position: index + 1, total } : null;
}

/** What a drag says about an item: a row's name, a column's header text, else its id. */
function spokenName<TData extends RowData>(
  table: DataTableInstance<TData>,
  id: string | number,
  kind: DragKind | undefined,
) {
  const key = String(id);
  if (kind === "row") {
    try {
      return rowSpokenName(table.getRow(key, true));
    } catch {
      return key;
    }
  }
  const header = table.getColumn(key)?.columnDef.header;
  return typeof header === "string" ? header : key;
}

/**
 * The drag context. Wrap the Table with it; put ColumnSortable inside the thead and RowSortable
 * inside the tbody. A table that is neither `reorderable` nor `reorderRows` gets its children
 * alone: no drag context, no instructions and no live region, since nothing in it can move.
 */
export function DragContext<TData extends RowData>({
  table,
  children,
}: {
  table: DataTableInstance<TData>;
  children: ReactNode;
}) {
  const meta = table.options.meta;
  if (!meta?.reorderable && !meta?.reorderRows) return <>{children}</>;
  return <Draggable table={table}>{children}</Draggable>;
}

function Draggable<TData extends RowData>({
  table,
  children,
}: {
  table: DataTableInstance<TData>;
  children: ReactNode;
}) {
  const { t, formatNumber } = useLedgerLocale();
  const id = useId();
  const reduced = useReducedMotion();
  // Where the drag was last said to be. A pick-up is first "over" its own place, which says
  // nothing new, so "Picked up Finding." is heard rather than replaced.
  const lastOver = useRef<string | number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_OPTIONS),
    useSensor(KeyboardSensor, reduced ? KEYBOARD_OPTIONS_REDUCED : KEYBOARD_OPTIONS),
  );
  /** Where the item would land, said as a place in the order: "Status moved to position 3 of 8." */
  const landing = (
    over: { data: { current?: Record<string, unknown> | undefined } } | null,
    item: string,
    phrase: "dragOverPosition" | "dragDroppedPosition",
  ) => {
    const place = positionIn(over);
    return place
      ? t(phrase, {
          item,
          position: formatNumber(place.position),
          total: formatNumber(place.total),
        })
      : undefined;
  };
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
          onDragStart: ({ active }) => {
            lastOver.current = active.id;
            return t("dragStarted", { item: spokenName(table, active.id, kindOf(active)) });
          },
          // Where it would land, as a place in the order ("Status moved to position 3 of 8."),
          // else over which item.
          onDragOver: ({ active, over }) => {
            const item = spokenName(table, active.id, kindOf(active));
            const previous = lastOver.current;
            lastOver.current = over?.id ?? null;
            if (!over) return t("dragOutside", { item });
            if (over.id === previous) return undefined;
            return (
              landing(over, item, "dragOverPosition") ??
              t("dragOver", { item, target: spokenName(table, over.id, kindOf(active)) })
            );
          },
          onDragEnd: ({ active, over }) => {
            const item = spokenName(table, active.id, kindOf(active));
            if (!over) return t("dragCanceled", { item });
            return (
              landing(over, item, "dragDroppedPosition") ??
              t("dragDropped", { item, target: spokenName(table, over.id, kindOf(active)) })
            );
          },
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
  const reduced = useReducedMotion(enabled);
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
    data: { type: "column" satisfies DragKind },
    disabled: !enabled,
    ...sortableMotion(reduced),
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
  const reduced = useReducedMotion(enabled);
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "row" satisfies DragKind },
    disabled: !enabled,
    ...sortableMotion(reduced),
  });
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
