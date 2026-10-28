import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToHorizontalAxis, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, GripVertical } from "lucide-react";
import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
} from "react";
import { IconButton, type IconButtonProps } from "../components/button";
import { announce } from "../lib/announce";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { useReducedMotion } from "../lib/use-reduced-motion";
import { tokenLiterals } from "../generated/tokens";
import { ReorderKeyboardSensor } from "./reorder-keyboard-sensor";

export type ReorderChange = { id: string; from: number; to: number };
export type ReorderProps = Omit<ComponentProps<"div">, "onChange"> & {
  /** Stable identities in their current order. The host commits the returned order. */
  items: readonly string[];
  /** Human-readable names for drag announcements and handles. */
  getItemLabel: (id: string) => string;
  onReorder: (items: string[], change: ReorderChange) => void;
  orientation?: "horizontal" | "vertical" | undefined;
  /** Disable while the host saves, restores a draft or cannot reorder this collection. */
  disabled?: boolean | undefined;
};
type ReorderState = {
  items: readonly string[];
  label: (id: string) => string;
  orientation: "horizontal" | "vertical";
  disabled: boolean;
  active: string | null;
  over: string | null;
  move: (id: string, to: number) => void;
  handles: Map<string, HTMLElement>;
};
const Group = createContext<ReorderState | null>(null);
type ItemState = ReturnType<typeof useSortable> & { id: string; disabled: boolean };
const Item = createContext<ItemState | null>(null);
function useGroup() {
  const value = useContext(Group);
  if (!value) throw new Error("ReorderItem must be inside Reorder.");
  return value;
}
function useItem() {
  const value = useContext(Item);
  if (!value) throw new Error("ReorderHandle and ReorderMove must be inside ReorderItem.");
  return value;
}
const POINTER = { activationConstraint: { distance: 8 } };
const SLIDE = {
  duration: Number.parseFloat(tokenLiterals["motion.duration.medium"]),
  easing: tokenLiterals["motion.easing.standard"],
};
/** A controlled sortable collection without listbox semantics; links and buttons stay native. */
export function Reorder({
  items,
  getItemLabel,
  onReorder,
  orientation = "vertical",
  disabled = false,
  children,
  className,
  ...props
}: ReorderProps) {
  const id = useId();
  const locale = useLedgerLocale();
  const [active, setActive] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const handles = useRef(new Map<string, HTMLElement>());
  const sensorDisposers = useRef(new Set<{ dispose: () => void; cancel: () => void }>());
  const registerKeyboardSensor = useCallback((dispose: () => void, cancel: () => void) => {
    const sensor = { dispose, cancel };
    sensorDisposers.current.add(sensor);
    return () => {
      sensorDisposers.current.delete(sensor);
    };
  }, []);
  useEffect(
    () => () => {
      for (const sensor of sensorDisposers.current) sensor.dispose();
      sensorDisposers.current.clear();
    },
    [],
  );
  useEffect(() => {
    if (disabled) for (const sensor of sensorDisposers.current) sensor.cancel();
  }, [disabled]);
  const revealHandle = (item: string) => {
    const handle = handles.current.get(item);
    if (!handle) return;
    // Cancellation returns the item on its transform transition. Wait for the actual
    // animation (also zero under reduced motion), then reveal its resting geometry.
    requestAnimationFrame(() => {
      const animations = handle.closest('[data-slot="reorder-item"]')?.getAnimations() ?? [];
      void Promise.all(
        animations.map((animation) => animation.finished.catch(() => undefined)),
      ).then(() => {
        requestAnimationFrame(() => {
          const focused = handle.ownerDocument.activeElement;
          if (
            !handle.isConnected ||
            (focused && focused !== handle && focused !== handle.ownerDocument.body)
          )
            return;
          handle.focus();
          handle.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
        });
      });
    });
  };
  const restoreFocus = useRef<{ control: HTMLElement; handle: HTMLElement | null } | null>(null);
  useLayoutEffect(() => {
    if (disabled || !restoreFocus.current) return;
    const { control, handle } = restoreFocus.current;
    restoreFocus.current = null;
    const activeElement = control.ownerDocument.activeElement;
    if (activeElement && activeElement !== control.ownerDocument.body && activeElement !== control)
      return;
    const target =
      control.isConnected && !control.matches(":disabled,[aria-disabled=true]") ? control : handle;
    if (target?.isConnected && !target.matches(":disabled,[aria-disabled=true]")) target.focus();
  });
  const latest = useRef({ items, disabled, onReorder });
  latest.current = { items, disabled, onReorder };
  const sensors = useSensors(
    useSensor(PointerSensor, POINTER),
    useSensor(ReorderKeyboardSensor, { register: registerKeyboardSensor }),
  );
  const position = (item: string, to: number) =>
    locale.t("dragDroppedPosition", {
      item,
      position: locale.formatNumber(to + 1),
      total: locale.formatNumber(items.length),
    });
  const move = (item: string, to: number) => {
    const current = latest.current;
    const from = current.items.indexOf(item);
    if (current.disabled || from < 0 || to < 0 || to >= current.items.length || from === to) return;
    const focused = typeof document === "undefined" ? null : document.activeElement;
    if (focused instanceof HTMLElement) {
      const row = focused.closest('[data-slot="reorder-item"]');
      if (row)
        restoreFocus.current = {
          control: focused,
          handle: row.querySelector<HTMLElement>('[data-slot="reorder-handle"]'),
        };
    }
    current.onReorder(arrayMove([...current.items], from, to), { id: item, from, to });
    announce(position(getItemLabel(item), to));
  };
  return (
    <Group.Provider
      value={{
        items,
        label: getItemLabel,
        orientation,
        disabled,
        active,
        over,
        move,
        handles: handles.current,
      }}
    >
      <DndContext
        id={id}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[
          orientation === "horizontal" ? restrictToHorizontalAxis : restrictToVerticalAxis,
        ]}
        autoScroll={!disabled}
        accessibility={{
          restoreFocus: false,
          screenReaderInstructions: { draggable: locale.t("dragInstructions") },
          announcements: {
            onDragStart: ({ active: item }) =>
              locale.t("dragStarted", { item: getItemLabel(String(item.id)) }),
            onDragOver: ({ active: item, over: target }) =>
              target
                ? locale.t("dragOverPosition", {
                    item: getItemLabel(String(item.id)),
                    position: locale.formatNumber(items.indexOf(String(target.id)) + 1),
                    total: locale.formatNumber(items.length),
                  })
                : locale.t("dragOutside", { item: getItemLabel(String(item.id)) }),
            onDragEnd: () => undefined,
            onDragCancel: ({ active: item }) =>
              locale.t("dragCanceled", { item: getItemLabel(String(item.id)) }),
          },
        }}
        onDragStart={({ active: item }) => {
          setActive(String(item.id));
          setOver(String(item.id));
        }}
        onDragOver={({ over: item }) => setOver(item ? String(item.id) : null)}
        onDragCancel={({ active: item }) => {
          setActive(null);
          setOver(null);
          revealHandle(String(item.id));
        }}
        onDragEnd={({ active: item, over: target }) => {
          setActive(null);
          setOver(null);
          if (target) move(String(item.id), latest.current.items.indexOf(String(target.id)));
          revealHandle(String(item.id));
        }}
      >
        <SortableContext
          items={[...items]}
          strategy={
            orientation === "horizontal"
              ? horizontalListSortingStrategy
              : verticalListSortingStrategy
          }
        >
          <div
            {...props}
            className={cn("min-w-0", className)}
            data-slot="reorder"
            data-orientation={orientation}
            data-disabled={disabled || undefined}
          >
            {children}
          </div>
        </SortableContext>
      </DndContext>
    </Group.Provider>
  );
}
export type ReorderItemProps = Omit<ComponentProps<"div">, "id"> & {
  /** Must occur exactly once in the parent items. */
  itemId: string;
  /** Keep this item in the collection but prevent picking it up. */
  disabled?: boolean | undefined;
};
/** Owns one item's transform and insertion indicator. Native children retain their semantics. */
export function ReorderItem({
  itemId,
  disabled = false,
  children,
  className,
  style,
  ref,
  ...props
}: ReorderItemProps) {
  const group = useGroup();
  const reduced = useReducedMotion();
  const sortable = useSortable({
    id: itemId,
    disabled: disabled || group.disabled,
    transition: reduced ? null : SLIDE,
  });
  const insertion = group.over === itemId && group.active !== itemId && group.active !== null;
  const after = insertion && group.items.indexOf(group.active!) < group.items.indexOf(itemId);
  return (
    <Item.Provider value={{ ...sortable, id: itemId, disabled: disabled || group.disabled }}>
      <div
        {...props}
        ref={(node) => {
          sortable.setNodeRef(node);
          if (typeof ref === "function") return ref(node);
          if (ref) ref.current = node;
        }}
        style={{
          ...style,
          transform: CSS.Translate.toString(sortable.transform),
          transition: sortable.transition,
        }}
        className={cn(
          "relative min-w-0",
          sortable.isDragging && "z-10 bg-selected shadow-overlay",
          className,
        )}
        data-slot="reorder-item"
        data-reorder-id={itemId}
        data-dragging={sortable.isDragging || undefined}
      >
        {children}
        {insertion && (
          <span
            aria-hidden
            data-slot="reorder-insertion"
            data-position={after ? "after" : "before"}
            style={{
              [group.orientation === "horizontal"
                ? after
                  ? "borderInlineEndWidth"
                  : "borderInlineStartWidth"
                : after
                  ? "borderBottomWidth"
                  : "borderTopWidth"]: tokenLiterals["border.width.selected"],
            }}
            className={cn(
              "pointer-events-none absolute border-brand",
              group.orientation === "horizontal"
                ? after
                  ? "inset-y-0 end-0"
                  : "inset-y-0 start-0"
                : after
                  ? "inset-x-0 bottom-0"
                  : "inset-x-0 top-0",
            )}
          />
        )}
      </div>
    </Item.Provider>
  );
}
export type ReorderHandleProps = Omit<IconButtonProps, "label" | "icon"> & {
  label?: string | undefined;
  icon?: ReactElement | undefined;
};
/** Pointer handle and Space / arrows / Space keyboard drag target. Escape cancels. */
export function ReorderHandle({
  label,
  icon,
  disabled,
  className,
  ref,
  ...props
}: ReorderHandleProps) {
  const group = useGroup();
  const item = useItem();
  const locale = useLedgerLocale();
  return (
    <IconButton
      {...item.attributes}
      {...item.listeners}
      variant="subtle"
      size="small"
      {...props}
      ref={(node) => {
        item.setActivatorNodeRef(node);
        if (node) group.handles.set(item.id, node);
        else group.handles.delete(item.id);
        if (typeof ref === "function") return ref(node);
        if (ref) ref.current = node;
      }}
      icon={icon ?? <GripVertical />}
      label={label ?? locale.t("reorderNamed", { label: group.label(item.id) })}
      disabled={disabled || item.disabled}
      className={cn(
        "shrink-0 touch-none cursor-grab",
        item.isDragging && "cursor-grabbing",
        className,
      )}
      data-slot="reorder-handle"
    />
  );
}
export type ReorderMoveProps = Omit<IconButtonProps, "label" | "icon"> & {
  /** Previous/next follow the collection order, including right-to-left layouts. */
  direction: "previous" | "next";
  label: string;
};
/** Single-press alternative to dragging, required for touch and pointer accessibility. */
export function ReorderMove({ direction, disabled, onClick, ...props }: ReorderMoveProps) {
  const group = useGroup();
  const item = useItem();
  const locale = useLedgerLocale();
  const index = group.items.indexOf(item.id);
  const to = index + (direction === "previous" ? -1 : 1);
  const backward = (direction === "previous") !== (locale.direction === "rtl");
  return (
    <IconButton
      variant="subtle"
      size="small"
      {...props}
      icon={
        group.orientation === "horizontal" ? (
          backward ? (
            <ArrowLeft />
          ) : (
            <ArrowRight />
          )
        ) : direction === "previous" ? (
          <ArrowUp />
        ) : (
          <ArrowDown />
        )
      }
      disabled={disabled || item.disabled || to < 0 || to >= group.items.length}
      data-slot="reorder-move"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) group.move(item.id, to);
      }}
    />
  );
}
