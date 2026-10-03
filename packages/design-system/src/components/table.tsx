import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { useRender } from "@base-ui/react/use-render";
import { useLedgerLocale } from "../lib/locale";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  GripVertical,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { token } from "../generated/tokens";
import { cn } from "../lib/cn";
import type { Density } from "../mode/density";
import { Count } from "./badge";
import { IconButton } from "./button";
import { Checkbox } from "./checkbox";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Id } from "./id";
import { MatchDirection, Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { CellRevealsCut, Truncate } from "./truncate";
import { Absent } from "./typography";

export type TableProps = {
  /** The table's accessible name, when no heading above it says what the rows are: "Findings". */
  label?: string | undefined;
  /** Pixels. Past it the frame scrolls down inside itself and the header sticks to the frame. */
  maxHeight?: number | undefined;
  /** The frame takes the rest of a bounded flex column (a `fill-window` block, a Stack with `grow="fill"`) and scrolls inside it; the header sticks to the frame. Wins over `maxHeight`. */
  fill?: boolean | undefined;
  /** The scroll frame, for a virtualizer that needs the element that scrolls. */
  frameRef?: Ref<HTMLDivElement> | undefined;
  /** `treegrid` for DataTable's tree mode, which wires the arrow keys; `grid` only when cells are editable. A hierarchy drawn by hand is a plain table. */
  role?: "table" | "treegrid" | "grid" | undefined;
  /** The rows' height: `default`, `dimension.row` 40px, or `compact`, 36px, for a picker's table or a register the reader has set so. Never the document's setting. */
  density?: Density | undefined;
  className?: string | undefined;
  children?: ReactNode;
} & Omit<ComponentProps<"table">, "className" | "children" | "role">;

/**
 * The frame's scroll padding covers its pinned columns and its sticky header, so a control the
 * keyboard reaches is scrolled clear of them rather than left under them: focus moves into view
 * past the pinned id, and a row below the header. A value another part has written (DataTable
 * writes the inline sides from its layout) is left alone.
 */
function keepClearOfStickyParts(
  frame: HTMLElement,
  table: HTMLTableElement,
  written: Record<string, string>,
) {
  const head = table.tHead;
  const row = head?.rows[head.rows.length - 1] ?? table.tBodies[0]?.rows[0];
  let start = 0;
  let end = 0;
  for (const cell of row?.cells ?? []) {
    const pin = cell.dataset["pinned"];
    if (pin === "start")
      start = Math.max(start, (parseFloat(cell.style.insetInlineStart) || 0) + cell.offsetWidth);
    else if (pin === "end")
      end = Math.max(end, (parseFloat(cell.style.insetInlineEnd) || 0) + cell.offsetWidth);
  }
  const sides = {
    scrollPaddingInlineStart: `${start}px`,
    scrollPaddingInlineEnd: `${end}px`,
    scrollPaddingTop: `${head?.offsetHeight ?? 0}px`,
  } as const;
  for (const [side, value] of Object.entries(sides) as [keyof typeof sides, string][]) {
    const now = frame.style[side];
    if (now !== "" && now !== written[side]) continue;
    frame.style[side] = value;
    written[side] = value;
  }
}

/**
 * A table's one tooltip for the eyes in its rows. Each eye is a trigger that passes its words as the
 * payload, so a row mounts no tooltip of its own however many rows draw. An eye outside a Table
 * keeps its own.
 */
const RowTipContext = createContext<TooltipPrimitive.Handle<string> | null>(null);

/** The table shows the whole of a cut cell itself (CutReveal), so a cell carries no `title`. */
const RevealsCutContext = createContext(false);

/**
 * A table's one card for its list cells (Table.List). Each line is a trigger that passes its card
 * as the payload, so a row mounts no card of its own; a list outside a Table keeps its own.
 */
const ListCardContext = createContext<PreviewCardPrimitive.Handle<ReactNode> | null>(null);
/** On a list line whose row is open: its card is not shown, the whole list being on screen below. */
const CARD_HELD = "data-card-held";

/** How long the pointer rests on a cut cell before its whole value shows: the tooltips' delay. */
const REVEAL_DELAY = 300;
/** How long the pointer may take to cross from the cell to the reveal before the reveal closes. */
const REVEAL_GRACE = 100;
/** How long a finger holds a cut cell before its whole value shows: a long press. */
const PRESS_DELAY = 500;
/** How far a finger may move during the press and still be a press, not a scroll, in pixels. */
const PRESS_SLOP = 10;

/** A control whose focus says its own name, not the value it sits beside: the eye, a checkbox. */
const OWN_NAME =
  'button[aria-label], [data-slot="preview-eye"], [data-slot="icon-button"], [data-slot="tooltip-trigger"], [data-slot="checkbox"], input, select, textarea, [role="checkbox"], [role="radio"], [role="switch"]';
/** What shows a value whole itself: its own title, a hover card, a Truncate with its own tooltip. A Truncate the cell reveals (`data-reveal="cell"`) is the table's to show. */
const OWN_REVEAL =
  '[title], [data-slot="hover-card-trigger"], [data-slot="truncate"]:not([data-reveal="cell"])';
/** A field that takes Escape itself (an edit to cancel, a list to close), before the table hears it. */
const OWN_ESCAPE =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="combobox"], [role="textbox"]';

/** The body cell an event happened in, in this table and no table nested in it. Headings reveal themselves. */
function bodyCellOf(target: EventTarget | null, table: HTMLTableElement | null) {
  if (!table || !(target instanceof Element)) return null;
  const cell = target.closest<HTMLTableCellElement>("td, th");
  if (!cell || cell.closest("table") !== table || cell.closest("thead")) return null;
  return cell;
}

const wholeText = (el: HTMLElement) => el.innerText.replace(/\s+/g, " ").trim();

/**
 * What the column cuts in a cell, whole: the cell's text when the cell itself is cut, else the
 * text of each part of it that is (a name's link, its second line), in order; none when all of it
 * fits. Only a cell that truncates counts (a wrapping cell or a detail row holds a nested table that
 * scrolls, not a cut value), and a part that shows itself whole (a title, a hover card, a Truncate
 * with its own tooltip: two or three lines, or `fullText`) is left to do so. A one-line Truncate,
 * a Badge's included, is the cell's to show (`data-reveal="cell"`).
 */
function cutTextOf(cell: HTMLElement): string[] {
  if (cell.hasAttribute("title")) return [];
  if (getComputedStyle(cell).textOverflow !== "ellipsis") return [];
  const cut: HTMLElement[] = [];
  for (const el of [cell, ...cell.querySelectorAll<HTMLElement>("*")]) {
    if (el.clientWidth === 0 || el.scrollWidth <= el.clientWidth + 1) continue;
    if (cut.some((outer) => outer.contains(el))) continue;
    const own = el.closest(OWN_REVEAL);
    if (own && cell.contains(own)) continue;
    cut.push(el);
  }
  return cut.map(wholeText).filter(Boolean);
}

type RevealedBy = "hover" | "focus" | "press";

/**
 * The whole of a cut cell, for every reader: one tooltip per table that shows a truncated value
 * whole while the pointer rests on its cell, while the keyboard is on the cell or a link in it, and
 * after a long press on a touch screen. Nothing shows for a value that fits. The listeners sit on
 * the frame, so a row carries nothing for it. The reveal is a visual copy of text the cell already
 * holds, so it is hidden from assistive technology; Escape closes it and goes no further, the
 * pointer can move onto it, and a press that revealed is not also a click on the row.
 */
function CutReveal({
  frame,
  table,
}: {
  frame: RefObject<HTMLDivElement | null>;
  table: RefObject<HTMLTableElement | null>;
}) {
  const [shown, setShown] = useState<{ anchor: HTMLElement; text: string[] } | null>(null);
  const [open, setOpen] = useState(false);
  const popup = useRef<{ keep: () => void; leave: () => void; close: () => void } | null>(null);
  useEffect(() => {
    const root = frame.current;
    if (!root) return;
    let by: RevealedBy | null = null;
    let anchor: HTMLElement | null = null;
    let hovered: HTMLTableCellElement | null = null;
    let press: { x: number; y: number; cell: HTMLTableCellElement } | null = null;
    // The last press revealed, so the click that ends it opens nothing.
    let pressed = false;
    let openTimer = 0;
    let closeTimer = 0;
    let pressTimer = 0;
    const show = (cell: HTMLTableCellElement, via: RevealedBy) => {
      const text = cutTextOf(cell);
      if (!text.length) return false;
      window.clearTimeout(closeTimer);
      by = via;
      anchor = cell;
      setShown({ anchor: cell, text });
      setOpen(true);
      return true;
    };
    const hide = (via?: RevealedBy) => {
      if (by === null || (via !== undefined && by !== via)) return;
      window.clearTimeout(closeTimer);
      by = null;
      anchor = null;
      setOpen(false);
    };
    const hideSoon = () => {
      window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => hide("hover"), REVEAL_GRACE);
    };
    popup.current = {
      keep: () => window.clearTimeout(closeTimer),
      leave: () => {
        if (by === "hover") hideSoon();
      },
      close: () => hide(),
    };

    /** A control in the cell that names itself, the eye, has its own tooltip: none of the cell's. */
    const onOwnControl = (target: EventTarget | null, cell: HTMLElement) => {
      const control = target instanceof Element ? target.closest(OWN_NAME) : null;
      return control !== null && cell.contains(control);
    };
    let overControl = false;
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const cell = bodyCellOf(event.target, table.current);
      const control = cell !== null && onOwnControl(event.target, cell);
      if (cell === hovered && control === overControl) return;
      hovered = cell;
      overControl = control;
      window.clearTimeout(openTimer);
      if (control) hide("hover");
      if (!cell || control) return;
      // From one revealed cell to the next the reveal follows at once, as tooltips in a row do.
      const wait = by === "hover" ? 0 : REVEAL_DELAY;
      openTimer = window.setTimeout(() => {
        if (hovered === cell) show(cell, "hover");
      }, wait);
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const to = event.relatedTarget;
      if (hovered && to instanceof Node && hovered.contains(to)) return;
      hovered = null;
      window.clearTimeout(openTimer);
      if (by === "hover") hideSoon();
    };
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      const cell = bodyCellOf(target, table.current);
      if (!cell || !(target instanceof Element)) return hide("focus");
      let visible = false;
      try {
        visible = target.matches(":focus-visible");
      } catch {
        visible = false;
      }
      if (!visible || onOwnControl(target, cell)) return hide("focus");
      if (!show(cell, "focus")) hide("focus");
    };
    const onFocusOut = (event: FocusEvent) => {
      const to = event.relatedTarget;
      if (by === "focus" && !(to instanceof Node && anchor?.contains(to))) hide("focus");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || by === null || event.isComposing) return;
      // This listener hears a key before the field it was pressed in does, so a field's Escape (an
      // edit to cancel) is the field's: the reveal goes with it and the key goes on.
      if (event.target instanceof Element && event.target.closest(OWN_ESCAPE)) return hide();
      // The reveal takes this Escape; the next reaches whatever holds the table.
      event.preventDefault();
      event.stopPropagation();
      hide();
    };
    const endPress = () => {
      window.clearTimeout(pressTimer);
      press = null;
    };
    const revealPress = () => {
      const cell = press?.cell;
      endPress();
      if (cell && show(cell, "press")) pressed = true;
    };
    const onPointerDown = (event: PointerEvent) => {
      pressed = false;
      if (event.pointerType !== "touch") return;
      hide("press");
      const cell = bodyCellOf(event.target, table.current);
      endPress();
      // A press on the eye or a checkbox is that control's, never a reveal.
      if (!cell || onOwnControl(event.target, cell)) return;
      press = { x: event.clientX, y: event.clientY, cell };
      pressTimer = window.setTimeout(revealPress, PRESS_DELAY);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!press || event.pointerType !== "touch") return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > PRESS_SLOP) endPress();
    };
    // A long press that the system answers with its menu ends the press early: reveal then too.
    const onContextMenu = () => {
      if (press) revealPress();
    };
    const onClick = (event: Event) => {
      if (!pressed) return;
      pressed = false;
      event.preventDefault();
      event.stopPropagation();
    };
    const onOutsidePress = (event: PointerEvent) => {
      if (by === "press" && !(event.target instanceof Node && root.contains(event.target)))
        hide("press");
    };
    // A virtual row that scrolls away takes its cell with it; the reveal goes too.
    const onScroll = () => {
      if (anchor && !anchor.isConnected) hide();
    };
    const listeners = [
      ["pointerover", onPointerOver],
      ["pointerout", onPointerOut],
      ["focusin", onFocusIn],
      ["focusout", onFocusOut],
      ["keydown", onKeyDown],
      ["pointerdown", onPointerDown],
      ["pointermove", onPointerMove],
      ["pointerup", endPress],
      ["pointercancel", endPress],
      ["contextmenu", onContextMenu],
      ["scroll", onScroll],
    ] as const;
    for (const [type, listener] of listeners)
      root.addEventListener(type, listener as EventListener);
    root.addEventListener("click", onClick, true);
    document.addEventListener("pointerdown", onOutsidePress, true);
    return () => {
      for (const [type, listener] of listeners)
        root.removeEventListener(type, listener as EventListener);
      root.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerdown", onOutsidePress, true);
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
      window.clearTimeout(pressTimer);
      popup.current = null;
    };
  }, [frame, table]);
  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        if (!next) popup.current?.close();
      }}
    >
      <TooltipContent
        aria-hidden
        data-slot="table-cell-reveal"
        // One line for each cut part: a name, then its second line.
        className="flex-col items-start break-words"
        {...(shown ? { anchor: shown.anchor } : {})}
        onPointerEnter={() => popup.current?.keep()}
        onPointerLeave={() => popup.current?.leave()}
      >
        {shown?.text.map((line, index) => (
          <span key={index} className="block">
            {line}
          </span>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The register. The wrapper is the scroll frame: sideways always, and down past `maxHeight` or,
 * with `fill`, inside the height its column gives it, so the sticky header sticks to it and not to
 * the page. While the frame is scrolled sideways it carries
 * `data-scrolled-start` and `data-scrolled-end`, which the pinned columns read for their edge. A
 * frame that overflows is a tab stop, so the keyboard can scroll it too: a landmark named after the
 * table's `label` when it has one, else a plain named group, since two landmarks cannot share a name.
 * Its scroll padding covers the pinned columns and the sticky header, so focus is never left under
 * them.
 */
function TableRoot({
  label,
  className,
  maxHeight,
  fill,
  frameRef,
  role,
  density,
  ...props
}: TableProps) {
  const { t, direction } = useLedgerLocale();
  const frame = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLTableElement>(null);
  const track = useCallback(() => {
    const el = frame.current;
    if (!el) return;
    const distance = direction === "rtl" ? Math.abs(el.scrollLeft) : el.scrollLeft;
    const start = distance > 0;
    const end = Math.ceil(distance + el.clientWidth) < el.scrollWidth;
    if (start) el.dataset["scrolledStart"] = "";
    else delete el.dataset["scrolledStart"];
    if (end) el.dataset["scrolledEnd"] = "";
    else delete el.dataset["scrolledEnd"];
    const overflows = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
    if (overflows) {
      el.tabIndex = 0;
      el.setAttribute("role", label ? "region" : "group");
      el.setAttribute("aria-label", label ? t("tableScrollsLabel", { label }) : t("tableScrolls"));
    } else {
      el.removeAttribute("tabindex");
      el.removeAttribute("role");
      el.removeAttribute("aria-label");
    }
  }, [label, t, direction]);
  // The scroll padding the frame keeps clear of its sticky parts, written here unless something
  // else (DataTable, which knows its layout) writes it.
  const cover = useRef<Record<string, string>>({});
  useEffect(() => {
    const el = frame.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      track();
      if (table.current) keepClearOfStickyParts(el, table.current, cover.current);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (table.current) observer.observe(table.current);
    measure();
    return () => observer.disconnect();
  }, [track]);
  const tableElement = useRender({
    defaultTagName: "table",
    ref: table,
    props: {
      // Tabular numerals on the table itself: `font-body` writes the font shorthand, which resets
      // the base layer's `font-variant-numeric`, so figures in a column would not line up.
      className: cn("w-full border-collapse text-start font-body tabular-nums", className),
      ...(label ? { "aria-label": label } : {}),
      ...(role ? { role } : {}),
      ...props,
      "data-slot": "table",
    },
  });
  // The rows' one eye tooltip; its root renders nothing until an eye opens it.
  const [rowTip] = useState(() => TooltipPrimitive.createHandle<string>());
  // The list cells' one card, likewise.
  const [listCard] = useState(() => PreviewCardPrimitive.createHandle<ReactNode>());
  const frameElement = useRender({
    defaultTagName: "div",
    ref: frameRef ? [frame, frameRef] : frame,
    props: {
      "data-slot": "table-container",
      onScroll: track,
      ...(density === "compact" ? { "data-density": "compact" } : {}),
      className: cn(
        // Relative, so an absolutely positioned descendant (a visually hidden label) is clipped
        // by the frame's scroll instead of scrolling the page or the panel around it. Isolated, so
        // the sticky header and pinned cells stack among themselves (z-10, z-20) and nothing
        // outside the frame competes with them: the page's layers (layer.*) stay above the whole
        // table, and DataTable's refreshing bar over the header needs only z-10.
        "group/scroll relative isolate w-full rounded-small outline-none focus-visible:outline-focused",
        fill
          ? "min-h-0 flex-1 overflow-auto"
          : maxHeight === undefined
            ? "overflow-x-auto"
            : "overflow-auto",
      ),
      style: fill || maxHeight === undefined ? undefined : { maxHeight },
      children: tableElement,
    },
  });
  // One writing direction for the table's popups (the eye's tooltip, the lists' card, the reveal),
  // set here only where the page has not set it already.
  return (
    <MatchDirection direction={direction}>
      <RowTipContext.Provider value={rowTip}>
        <ListCardContext.Provider value={listCard}>
          <RevealsCutContext.Provider value={true}>{frameElement}</RevealsCutContext.Provider>
        </ListCardContext.Provider>
        <Tooltip handle={rowTip}>
          {({ payload }) => <TooltipContent>{payload}</TooltipContent>}
        </Tooltip>
        <HoverCard
          handle={listCard}
          onOpenChange={(next, details) => {
            // A line whose row is open shows no card: the list it stands for is on screen.
            if (next && details.trigger?.hasAttribute(CARD_HELD)) details.cancel();
          }}
        >
          {({ payload }) => (payload ? <ListCard>{payload}</ListCard> : null)}
        </HoverCard>
        <CutReveal frame={frame} table={table} />
      </RowTipContext.Provider>
    </MatchDirection>
  );
}

/** Where a column is pinned, and how far from that edge. `edge` marks the pinned column that touches the scrolling middle: `true` draws its hairline at rest, `"scrolled"` only while the frame is scrolled, for a checkbox column that is pinned on its own. */
export type PinnedProps = {
  pinned?: "start" | "end" | false | undefined;
  /** Pixels from the pinned edge: the widths of the pinned columns before it. */
  offset?: number | undefined;
  edge?: boolean | "scrolled" | undefined;
};

/** Where a cell's content sits across its column: text starts, a number ends. Logical, so an RTL table mirrors it. */
export type TableAlign = "start" | "center" | "end";

/* A caller that aligns by class (`text-right`, `text-end` or `text-center` on the cell) gets what
   `align` gives. A heading is a flex row, which a text-align class never moved, and `text-right`
   is physical, so an RTL number sat on the wrong side. */
const ALIGN_BY_CLASS = [
  [/(^|\s)text-(right|end)(\s|$)/, "end"],
  [/(^|\s)text-center(\s|$)/, "center"],
] as const;
const alignOf = (align: TableAlign | undefined, className: string | undefined): TableAlign => {
  if (align) return align;
  for (const [pattern, placed] of ALIGN_BY_CLASS)
    if (className && pattern.test(className)) return placed;
  return "start";
};
/** After the caller's class, so the logical class replaces a physical `text-right`. */
const TEXT_ALIGN = { start: "text-start", center: "text-center", end: "text-end" } as const;

/* A caller that wraps a cell by class (`whitespace-normal` and its kin) gets what `wrap` gives, so
   a link in it wraps with the text instead of being cut to one line. */
const WRAP_BY_CLASS = /(^|\s)whitespace-(normal|pre-wrap|pre-line|break-spaces)(\s|$)/;
const wrapsOf = (wrap: boolean | undefined, className: string | undefined) =>
  Boolean(wrap) || (className !== undefined && WRAP_BY_CLASS.test(className));

/* The hairline is a pseudo-element, not the cell's border: collapsed table borders are painted by
   the table and stay put while a sticky cell moves, so a border would vanish on the first scroll. */
const rule = "after:pointer-events-none after:absolute after:inset-y-0 after:border-default";

// The header's hairline is the cell's own for the same reason: a collapsed border stays put while
// the sticky heading moves, so the line would scroll away with the first row. Paint it above the
// trailing controls' opaque hover background so that background cannot interrupt the rule.
const HEADER_RULE =
  "before:pointer-events-none before:absolute before:inset-x-0 before:bottom-0 before:z-10 before:border-b before:border-default";
const edgeClass = {
  start: {
    rest: `${rule} after:end-0 after:border-e`,
    scrolled: `${rule} after:end-0 group-data-[scrolled-start]/scroll:after:border-e`,
  },
  end: {
    rest: `${rule} after:start-0 after:border-s`,
    scrolled: `${rule} after:start-0 group-data-[scrolled-end]/scroll:after:border-s`,
  },
} as const;

/** The pinned column that touches the middle carries the same hairline as every other border, and keeps it while the frame is scrolled. */
const pinnedClass = (pinned: PinnedProps["pinned"], edge: PinnedProps["edge"], z: string) =>
  pinned
    ? cn(
        "sticky bg-surface-current",
        z,
        edge && edgeClass[pinned].scrolled,
        edge === true && edgeClass[pinned].rest,
      )
    : undefined;

/* A pinned cell paints its own fill so the middle scrolls under it; it follows the row's: hovered,
   selected, and selected under the pointer. A static row is no group, so it never lights. */
const ROW_FILL =
  "group-hover/row:bg-surface-hovered group-data-[selected]/row:bg-selected group-data-[selected]/row:group-hover/row:bg-selected-hovered";

const pinnedStyle = (
  pinned: PinnedProps["pinned"],
  offset: number | undefined,
): CSSProperties | undefined =>
  pinned === "start"
    ? { insetInlineStart: offset ?? 0 }
    : pinned === "end"
      ? { insetInlineEnd: offset ?? 0 }
      : undefined;

export type ThProps = Omit<ComponentProps<"th">, "align"> &
  PinnedProps & {
    /** Makes the heading a button that reports its direction (aria-sort) and shows the arrow. */
    sort?: "asc" | "desc" | false | undefined;
    onSort?: (() => void) | undefined;
    /** Where the heading sits: `end` over a column of numbers, so it ends where they do; the sort arrow then leads. Logical, so an RTL table mirrors it. Match the column's cells. */
    align?: TableAlign | undefined;
    /** The heading wraps instead of ending in an ellipsis. For a heading that must be read whole; prefer a shorter word. */
    wrap?: boolean | undefined;
    /** The hairline under the heading, drawn on the cell so it stays while the frame scrolls. Off for a placeholder cell in a second header row. */
    hairline?: boolean | undefined;
    /** Pins the column to the leading edge. The same as `pinned="start"` with no offset. */
    sticky?: boolean | undefined;
    /** The column's width in pixels. Column widths are content decisions, so they are a prop, not a class. */
    width?: number | undefined;
    /** The least width in pixels the column keeps: in a narrow frame the table scrolls sideways rather than squeezing it. Give the name column one (180 to 220) so it is never the column that gives way. */
    minWidth?: number | undefined;
    /** A handle on the trailing edge. `onResizeStart` takes the pointer down; `resizeDelta` moves the guide while it drags; double-click resets. */
    resize?:
      | {
          onResizeStart: (event: unknown) => void;
          /** Keyboard change in pixels, or the minimum/maximum boundary. */
          onResizeKeyboard?: ((change: number | "min" | "max") => void) | undefined;
          value?: number | undefined;
          min?: number | undefined;
          max?: number | undefined;
          onResizeReset?: (() => void) | undefined;
          isResizing?: boolean | undefined;
          resizeDelta?: number | null | undefined;
          /** The column's name for the handle's: "Resize Status". Unsaid, every handle is "Resize column"; give it wherever a table has two. */
          label?: string | undefined;
        }
      | undefined;
    /** Controls that appear on hover and focus over the heading's end: the column menu, a drag grip. Where any pointer is coarse (the kit's touch predicate) they are always shown, beside the heading, and take more of the column: 24px for one 20px control, 46px for two (a grip and a menu). Widen the column by that much there so the heading keeps its room, as DataTable does where it scrolls sideways; a responsive DataTable keeps its widths and the heading gives the controls its room, showing whole on hover and focus. A column menu that sorts carries `data-column-menu`, and there the heading drops its up-down hint for it. An end-aligned heading keeps them at its start, clear of the heading. */
    trailing?: ReactNode;
  };

/**
 * Where any pointer is coarse, how much wider a header's trailing controls make it: the gap before them,
 * `space.050`, and each 20px control (`size-250`) with `space.025` between. A DataTable that scrolls
 * sideways widens a column with a menu or a grip by this much there, so the heading keeps the room
 * it has at rest where a pointer can hover; a responsive one does not, so no column folds for it.
 */
export const headerTrailingWidth = (controls: number) =>
  controls > 0 ? 4 + controls * 20 + (controls - 1) * 2 : 0;

/* A cell's `width` is firm: it is also its `min-width`, because when the table is wider than its
   frame the browser gives a cell with only a `width` its min-content width instead. `minWidth` is a
   floor alone: the column takes slack above it and the frame scrolls below it. */
const widthStyle = (
  width: number | undefined,
  minWidth: number | undefined,
  style: CSSProperties | undefined,
): CSSProperties | undefined =>
  width === undefined && minWidth === undefined
    ? style
    : {
        ...(width === undefined ? {} : { width, minWidth: width }),
        ...(minWidth === undefined ? {} : { minWidth }),
        ...style,
      };

/** The heading's own margin in its row: it takes the free space on the side away from its alignment. */
const LABEL_PLACE = { start: "me-auto", center: "mx-auto", end: "ms-auto" } as const;
/** The sort button's padding is ring room; none on the side that meets the column's text. */
const SORT_PAD = { start: "pe-050", center: "px-050", end: "ps-050 flex-row-reverse" } as const;

/**
 * A column heading. Every heading sticks to the top of the frame; one in a second header row (the
 * leaf headings under a column-group row) sticks below the rows above it, so the group row is not
 * covered once the frame scrolls.
 */
export function Th({
  ref,
  className,
  sort,
  onSort,
  sticky,
  pinned: pinnedProp,
  offset,
  edge,
  hairline = true,
  width,
  minWidth,
  resize,
  trailing,
  align,
  wrap,
  style,
  children,
  ...props
}: ThProps) {
  const { direction, t } = useLedgerLocale();
  const sortable = sort !== undefined || onSort !== undefined;
  const pinned = pinnedProp ?? (sticky ? "start" : false);
  const placed = alignOf(align, className);
  const text = typeof children === "string" ? children : undefined;
  // Which header row the cell sits in; below the first it sticks under the rows above.
  const [row, setRow] = useState(0);
  const measure = useCallback((el: HTMLTableCellElement | null) => {
    const tr = el?.parentElement;
    if (tr instanceof HTMLTableRowElement && tr.parentElement instanceof HTMLTableSectionElement)
      setRow(tr.parentElement.tagName === "THEAD" ? tr.sectionRowIndex : 0);
  }, []);
  const stuck: CSSProperties | undefined =
    row > 0 ? { top: `calc(${row} * ${token("dimension.row.header")})` } : undefined;
  const labelClass = cn(
    !sortable && "has-data-[slot=checkbox]:overflow-visible",
    !sortable && LABEL_PLACE[placed],
  );
  // A heading squeezed by its column's controls ends in an ellipsis, and a cut one shows whole in
  // a tooltip on hover and while its sort button has keyboard focus.
  const label = wrap ? (
    <span className={cn("break-words", labelClass)}>{children}</span>
  ) : text !== undefined ? (
    <Truncate className={labelClass}>{text}</Truncate>
  ) : (
    <span className={cn("truncate", labelClass)}>{children}</span>
  );
  return useRender({
    defaultTagName: "th",
    ref: ref ? [ref, measure] : measure,
    props: {
      "aria-sort": sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined,
      "data-pinned": pinned || undefined,
      className: cn(
        "group/th sticky top-0 z-10 h-row-header bg-surface-current px-150 font-body-small font-medium text-subtle",
        wrap ? "whitespace-normal" : "whitespace-nowrap",
        hairline && HEADER_RULE,
        pinnedClass(pinned, edge, "z-20"),
        className,
        TEXT_ALIGN[placed],
      ),
      style: widthStyle(width, minWidth, { ...stuck, ...pinnedStyle(pinned, offset), ...style }),
      ...props,
      children: (
        // A heading shows its own cut text: the table's reveal is for the body's cells, so a
        // Truncate in a heading keeps its tooltip, in a table nested in a cell as well.
        <CellRevealsCut.Provider value={false}>
          <span className="flex items-center gap-050">
            {sortable ? (
              <button
                type="button"
                onClick={onSort}
                className={cn(
                  "group/sort relative inline-flex min-w-0 touch-target items-center gap-050 rounded-small outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused motion-reduce:transition-none",
                  // A wrapping heading grows its button, so no line of it spills out of the header.
                  wrap ? cn("min-h-control-xsmall", TEXT_ALIGN[placed]) : "h-control-xsmall",
                  SORT_PAD[placed],
                  LABEL_PLACE[placed],
                  sort && "text-default",
                )}
              >
                {label}
                {sort === "asc" ? (
                  <ArrowUp className="size-150 shrink-0" />
                ) : sort === "desc" ? (
                  <ArrowDown className="size-150 shrink-0" />
                ) : (
                  // Where any pointer is coarse the hint says the heading sorts, unless the column's menu is
                  // beside it: the menu sorts, and one control there is enough.
                  <ChevronsUpDown className="invisible size-150 shrink-0 icon-subtlest group-focus-visible/sort:visible group-hover/sort:visible any-pointer-coarse:visible any-pointer-coarse:group-has-[[data-column-menu]]/th:hidden" />
                )}
              </button>
            ) : (
              // A control in the heading, the select-all checkbox, is not clipped with the text, so
              // its hit area, larger than the box, stays whole.
              label
            )}
            {trailing ? (
              // Over the heading's end on hover and focus, or its start when the heading ends; where
              // any pointer is coarse, always there and in the row's flow after the row's gap
              // (`headerTrailingWidth`), so the heading keeps its room in a column widened for it and
              // never runs under the controls. An end-aligned heading puts them first, so it still
              // ends where its figures do.
              <span
                className={cn(
                  "absolute inset-y-0 flex items-center gap-025 bg-surface-current opacity-0 transition-opacity duration-fast ease-standard focus-within:opacity-100 group-hover/th:opacity-100 has-[[data-popup-open]]:opacity-100 has-[[data-state=open]]:opacity-100 motion-reduce:transition-none any-pointer-coarse:static any-pointer-coarse:opacity-100",
                  placed === "end"
                    ? "start-100 pe-050 any-pointer-coarse:order-first any-pointer-coarse:pe-0"
                    : "end-100 ps-050 any-pointer-coarse:ps-0",
                )}
              >
                {trailing}
              </span>
            ) : null}
          </span>
          {resize ? (
            <span
              role="separator"
              aria-orientation="vertical"
              aria-label={
                resize.label ? t("resizeColumnLabel", { label: resize.label }) : t("resizeColumn")
              }
              tabIndex={resize.onResizeKeyboard ? 0 : undefined}
              aria-valuenow={resize.onResizeKeyboard ? (resize.value ?? width) : undefined}
              aria-valuemin={resize.onResizeKeyboard ? resize.min : undefined}
              aria-valuemax={resize.onResizeKeyboard ? resize.max : undefined}
              onKeyDown={(event) => {
                if (!resize.onResizeKeyboard) return;
                const step = event.shiftKey ? 32 : 8;
                const changes: Record<string, number | "min" | "max"> = {
                  ArrowLeft: direction === "rtl" ? step : -step,
                  ArrowRight: direction === "rtl" ? -step : step,
                  Home: "min",
                  End: "max",
                };
                const change = changes[event.key];
                if (change !== undefined) {
                  event.preventDefault();
                  resize.onResizeKeyboard(change);
                }
              }}
              onMouseDown={resize.onResizeStart}
              onTouchStart={resize.onResizeStart}
              onDoubleClick={resize.onResizeReset}
              className={cn(
                // The kit's ring drawn inside the handle, which sits on the column's edge, and the
                // guide shown while the keyboard is on it.
                "absolute inset-y-0 end-0 z-10 w-100 cursor-col-resize touch-none select-none outline-none focus-visible:outline-field-focused",
                "after:absolute after:inset-y-0 after:end-0 after:w-025 after:bg-brand-bold after:opacity-0 after:transition-opacity after:duration-fast after:ease-standard hover:after:opacity-100 focus-visible:after:opacity-100 motion-reduce:after:transition-none",
                resize.isResizing && "after:opacity-100",
              )}
              style={
                resize.isResizing && resize.resizeDelta != null
                  ? { transform: `translateX(${resize.resizeDelta}px)` }
                  : undefined
              }
            />
          ) : null}
        </CellRevealsCut.Provider>
      ),
    },
  });
}

export type TdProps = Omit<ComponentProps<"td">, "align"> &
  PinnedProps & {
    /** Pins the column to the leading edge. The same as `pinned="start"` with no offset. */
    sticky?: boolean | undefined;
    /** The column's width in pixels, for a table with no header row. */
    width?: number | undefined;
    /** The column's least width in pixels, for a table with no header row. */
    minWidth?: number | undefined;
    /** Where the content sits: `end` for a number, in tabular numerals. Logical, so an RTL table mirrors it. Match the column's heading. */
    align?: TableAlign | undefined;
    /** The value wraps, breaking a long unbroken one (a URN, a hash), instead of ending in an ellipsis. For a value that must be read whole. */
    wrap?: boolean | undefined;
    /** The cell names its row (`th scope="row"`), so a screen reader announces the row's identity with every other cell and control in it. One per row: the id or the name. */
    rowHeader?: boolean | undefined;
  };

/* Outside a Table, which shows a cut cell whole itself (CutReveal), a cell whose content is not a
   plain string takes its text as its title while, and only while, the column cuts it, so the whole
   still shows on hover. It is measured when the pointer arrives, not on every render. Content that
   shows its whole value itself (a title of its own, a hover card) is left alone. */
const DERIVED_TITLE = "data-title-derived";
function titleWhenCut(cell: HTMLElement) {
  if (cell.hasAttribute("title") && !cell.hasAttribute(DERIVED_TITLE)) return;
  const own = cell.querySelector('[title], [data-slot="hover-card-trigger"]');
  const cut =
    !own &&
    [cell, ...cell.querySelectorAll<HTMLElement>("*")].some(
      (el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1,
    );
  const text = cut ? cell.innerText.replace(/\s+/g, " ").trim() : "";
  if (text) {
    cell.setAttribute("title", text);
    cell.setAttribute(DERIVED_TITLE, "");
  } else if (cell.hasAttribute(DERIVED_TITLE)) {
    cell.removeAttribute("title");
    cell.removeAttribute(DERIVED_TITLE);
  }
}

/* A truncating cell clips, so a link in it (a record's name) is cut to the cell and draws the
   kit's ring inside its own edge, where the clip cannot take it. Link buttons keep their own. */
const LINK_KEEPS_RING =
  "[&_a:not([data-slot^=link-])]:inline-block [&_a:not([data-slot^=link-])]:min-w-0 [&_a:not([data-slot^=link-])]:max-w-full [&_a:not([data-slot^=link-])]:overflow-x-clip [&_a:not([data-slot^=link-])]:text-ellipsis [&_a:not([data-slot^=link-])]:whitespace-nowrap [&_a:not([data-slot^=link-])]:align-top [&_a:not([data-slot^=link-]):focus-visible]:outline-field-focused";

/** A cell. It truncates to one line, and a value its column cuts shows whole in the table's one tooltip: on hover, while the keyboard is on the cell or a link in it, and after a long press on a touch screen. `wrap` lets it wrap instead. */
export function Td({
  className,
  sticky,
  pinned: pinnedProp,
  offset,
  edge,
  width,
  minWidth,
  align,
  wrap: wrapProp,
  rowHeader,
  style,
  children,
  onPointerEnter,
  ...props
}: TdProps) {
  const pinned = pinnedProp ?? (sticky ? "start" : false);
  const placed = alignOf(align, className);
  const wrap = wrapsOf(wrapProp, className);
  const text = typeof children === "string" ? children : undefined;
  // In a Table the table shows a cut value whole, from the keyboard and on touch as well as on
  // hover; a title would show it a second time, and only to a mouse.
  const revealed = useContext(RevealsCutContext);
  const derive = !revealed && !wrap && text === undefined && props.title === undefined;
  // The row header is a `th` drawn exactly as a cell: not bold, not centred, not sticky chrome.
  const Cell = (rowHeader ? "th" : "td") as "td";
  return (
    <Cell
      data-pinned={pinned || undefined}
      // A wrapping cell says so, so a part in it that truncates (Table.Name) wraps with it.
      data-wrap={wrap ? "" : undefined}
      {...(rowHeader ? { scope: "row" } : {})}
      {...(text !== undefined && !wrap && !revealed ? { title: text } : {})}
      className={cn(
        // A cell the keyboard reaches (a treegrid's cell) shows the kit's ring inside its edge.
        "h-row max-w-0 px-150 align-middle focus-visible:outline-field-focused",
        wrap ? "whitespace-normal break-words" : cn("truncate whitespace-nowrap", LINK_KEEPS_RING),
        rowHeader && "font-regular",
        pinnedClass(pinned, edge, "z-10"),
        pinned && ROW_FILL,
        className,
        TEXT_ALIGN[placed],
        placed === "end" && "tabular-nums",
      )}
      style={widthStyle(width, minWidth, { ...pinnedStyle(pinned, offset), ...style })}
      onPointerEnter={
        derive
          ? (event) => {
              onPointerEnter?.(event);
              titleWhenCut(event.currentTarget);
            }
          : onPointerEnter
      }
      {...props}
    >
      {/* The table shows a cut part of a cell that truncates whole, a Truncate's included, so a
          Truncate in it mounts no tooltip of its own. */}
      {revealed && !wrap ? (
        <CellRevealsCut.Provider value={true}>{children}</CellRevealsCut.Provider>
      ) : (
        children
      )}
    </Cell>
  );
}

export type TrProps = ComponentProps<"tr"> & {
  /** The row is chosen: `color.background.selected` and `data-selected`. Pair it with a checked `Table.Selection`. */
  isSelected?: boolean | undefined;
  /** A row that is not a record: a totals row, a form laid out as a table. It does not light up on hover. */
  isStatic?: boolean | undefined;
};

/** A row. `isStatic` is for rows that are not records: a form laid out as a table, a totals row. They do not light up on hover. */
export function Tr({ ref, className, isSelected, isStatic, ...props }: TrProps) {
  return (
    <tr
      ref={ref}
      data-selected={isSelected ? "" : undefined}
      className={cn(
        "border-b border-default transition-colors duration-fast ease-standard last:border-b-0 motion-reduce:transition-none",
        // A row that is not a record is no group, so nothing in it lights up on the row's hover.
        !isStatic && "group/row hover:bg-surface-hovered",
        // A row the keyboard reaches (a tree row) shows the kit's ring inside its edge.
        "focus-visible:outline-field-focused",
        isSelected && "bg-selected hover:bg-selected-hovered",
        className,
      )}
      {...props}
    />
  );
}

export type PreviewButtonProps = {
  onPreview: () => void;
  /** The row open in the preview: the eye reads selected, with a ring as well as the fill, and reports `aria-pressed`. */
  isActive?: boolean | undefined;
  /** The eye's name, after the record: "Preview CTRL-0412". "Preview row" unsaid; name it wherever the row has an identity. */
  label?: string | undefined;
  className?: string | undefined;
};

/**
 * The eye that opens a row in the preview surface. It sits at the end of a row's first cell and is
 * there at rest, muted, so a reader never has to hunt for it; the open row's eye reads selected,
 * on the selected fill inside a `color.border.selected` ring, so it is told apart by more than its
 * colour where every eye shows.
 */
export function PreviewButton({ onPreview, isActive, label, className }: PreviewButtonProps) {
  const { t } = useLedgerLocale();
  // In a Table the eye opens the table's one tooltip, so a row mounts none of its own.
  const tip = useContext(RowTipContext);
  const eye = (
    <IconButton
      label={label ?? t("previewRow")}
      icon={<Eye />}
      variant="subtle"
      size="xxsmall"
      isSelected={Boolean(isActive)}
      isTooltipDisabled={tip !== null}
      onClick={(e) => {
        e.stopPropagation();
        onPreview();
      }}
      className={cn(
        isActive ? "border border-selected" : "text-subtlest group-hover/row:text-subtle",
        className,
      )}
    />
  );
  return tip ? <TooltipTrigger handle={tip} payload={t("preview")} render={eye} /> : eye;
}

/** While the eye shows: on the row's hover, on focus in the cell, and always where any pointer is coarse. */
const EYE_SHOWN = "group-hover/row:pe-300 group-focus-within/eye:pe-300 any-pointer-coarse:pe-300";

/**
 * The value beside the eye gives up the eye's 24px while the eye shows, so it ends in an ellipsis
 * before the eye instead of running under it. For a value in a cell whose width the column sets
 * (a `Table.Cell`); pair it with `PreviewEye` inside one `group/eye relative flex` span.
 */
export const previewValueClass = (isActive: boolean | undefined) =>
  cn(EYE_SHOWN, isActive && "pe-300");

/**
 * The id sizes its column in a table laid out by its content, so there the eye keeps its slot at
 * rest: hovering a row never moves the columns. In a `table-fixed` table the column's width is set,
 * so the id keeps its full width at rest and gives up the slot only while the eye shows.
 */
const idEyeClass = (isActive: boolean | undefined) =>
  cn("pe-300", !isActive && "in-[.table-fixed]:not-any-pointer-coarse:pe-0", EYE_SHOWN);

export type PreviewEyeProps = {
  onPreview: () => void;
  /** The row open in the preview keeps its eye shown and selected. */
  isActive?: boolean | undefined;
  /** The eye's name, after the record: "Preview CTRL-0412". "Preview row" unsaid. */
  label?: string | undefined;
};

/** The eye's slot over the end of its cell: hidden at rest, shown on the row's hover, on focus in the cell and on the open row; always shown where any pointer is coarse. */
export function PreviewEye({ onPreview, isActive, label }: PreviewEyeProps) {
  return (
    <span
      data-slot="preview-eye"
      className={cn(
        "absolute inset-y-0 end-0 flex items-center ps-050 opacity-0 transition-opacity duration-fast ease-standard motion-reduce:transition-none",
        "bg-surface-current",
        ROW_FILL,
        "group-focus-within/eye:opacity-100 group-hover/row:opacity-100 any-pointer-coarse:opacity-100",
        // the row whose preview is open keeps its eye, so the reader can see which row it is
        isActive && "opacity-100",
      )}
    >
      <PreviewButton onPreview={onPreview} isActive={isActive} label={label} />
    </span>
  );
}

/** The native props of the cell, less the ones the id cell names itself: `id` is the record's identifier, and the cell draws its own content. */
export type TableIdProps = Omit<ComponentProps<"td">, "id" | "children" | "align"> &
  PinnedProps & {
    /** The record's identifier. A plain string is also the eye's name ("Preview CTRL-0412"); a cut one shows whole in the table's reveal. */
    id: ReactNode;
    /** Draws the eye, which opens the same row in the preview surface. */
    onPreview?: (() => void) | undefined;
    /** The row open in the preview: the id in `color.text.brand` and the eye shown and selected. */
    isActive?: boolean | undefined;
    /** `subtle` where the id is not the link, in a grouped listing. */
    tone?: "brand" | "subtle" | undefined;
    /** The eye's name when `id` is not a plain string: "Preview Segregation of duties". */
    label?: string | undefined;
    /** The id names its row (`th scope="row"`). Give it to the id or the name, one per row. */
    rowHeader?: boolean | undefined;
    /** For a table without a header row, where the cells carry the widths. */
    width?: number | undefined;
    /** Pixels of tree indent before the id, one level's worth per level of nesting. */
    indent?: number | undefined;
  };

/** The id column. The row itself opens the record; the eye at the end of the cell opens the same row in the preview surface. The cell's native props, `className` and `ref` reach the cell. */
export function IdCell({
  id,
  onPreview,
  isActive,
  tone = "brand",
  label,
  rowHeader,
  width,
  indent,
  pinned,
  offset,
  edge,
  className,
  ...props
}: TableIdProps) {
  const { t } = useLedgerLocale();
  const text = typeof id === "string" ? id : undefined;
  const eyeLabel = label ?? (text === undefined ? undefined : t("previewLabel", { label: text }));
  // In a Table a cut id shows whole in the table's reveal, so it carries no title of its own.
  const revealed = useContext(RevealsCutContext);
  return (
    <Td
      width={width}
      pinned={pinned}
      offset={offset}
      edge={edge}
      rowHeader={rowHeader}
      {...(text === undefined || revealed ? {} : { title: text })}
      {...props}
      className={cn("max-w-none", className)}
      data-slot="table-id"
    >
      <span
        className="group/eye relative flex items-center"
        {...(indent ? { style: { paddingInlineStart: indent } } : {})}
      >
        <Id
          className={cn(
            "min-w-0 flex-1 truncate transition-colors duration-fast ease-standard motion-reduce:transition-none",
            // The id cuts its overflow, so a link or button inside it takes the kit's ring inside its
            // own edge, where the cut cannot take it.
            "[&_:is(a,button,[tabindex]):focus-visible]:outline-field-focused",
            isActive ? "text-brand" : null,
            tone === "brand" && !isActive ? "group-hover/row:text-brand" : null,
            onPreview && idEyeClass(isActive),
          )}
        >
          {id}
        </Id>
        {onPreview ? (
          <PreviewEye onPreview={onPreview} isActive={isActive} label={eyeLabel} />
        ) : null}
      </span>
    </Td>
  );
}

/** The width of the checkbox and the drag-handle columns, `space.400`. DataTable adds the same width to every pinned start offset, so the column must measure exactly this. */
const NARROW = 32;

/** The native props of the cell, less the ones the checkbox column sets itself: the box it draws, and its width, which DataTable counts in every pinned offset. */
export type TableSelectionProps = Omit<
  ComponentProps<"td">,
  "children" | "align" | "width" | "ref"
> &
  PinnedProps & {
    /** The cell, a `th` in the header and a `td` in a row. */
    ref?: Ref<HTMLTableCellElement> | undefined;
    /** The header's box, which chooses every row and reads mixed when only some are. */
    header?: boolean | undefined;
    checked: boolean;
    /** Mixed: some rows are chosen. For the header's box. */
    indeterminate?: boolean | undefined;
    onCheckedChange: (checked: boolean) => void;
    /** The box's name: "Select CTRL-0412", "Select all". */
    label: string;
    disabled?: boolean | undefined;
  };

/** The checkbox column. In the header it selects every row and reads mixed when only some are; in a row it selects that row. A click anywhere in the cell toggles the box and never reaches the row. The cell's native props, `className` and `ref` reach the cell; a caller's `onClick` runs before the toggle. */
export function SelectionCell({
  header = false,
  checked,
  indeterminate,
  onCheckedChange,
  label,
  disabled,
  pinned,
  offset,
  edge,
  className,
  onClick,
  ...props
}: TableSelectionProps) {
  const box = (
    <Checkbox
      checked={checked}
      indeterminate={indeterminate}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      {...(disabled ? { disabled } : {})}
      onClick={(e) => e.stopPropagation()}
    />
  );
  // The cell is the box's target: a click beside the box toggles it, and neither reaches the row,
  // whose click opens the record. The box and its input handle their own click.
  const onCellClick = (event: MouseEvent<HTMLTableCellElement>) => {
    onClick?.(event);
    event.stopPropagation();
    if (disabled) return;
    if (event.target instanceof Element && event.target.closest('[data-slot="checkbox"], input'))
      return;
    onCheckedChange(!checked);
  };
  // The caller's attributes, then the column's own: its width, its pin and its click.
  const cell = {
    ...props,
    className: cn(header ? "pe-0" : "max-w-none pe-0", className),
    width: NARROW,
    pinned,
    offset,
    edge,
    onClick: onCellClick,
    "data-slot": "table-selection",
  };
  return header ? (
    <Th {...cell}>
      <span className="flex items-center">{box}</span>
    </Th>
  ) : (
    <Td {...cell}>
      <span className="flex items-center">{box}</span>
    </Td>
  );
}

/** The native props of the band's `tbody`, less the ones the band names itself: `title` is its heading, and `onToggle` is the deprecated press. */
export type TableGroupProps = Omit<ComponentProps<"tbody">, "title" | "onToggle"> & {
  /** The number of columns the band spans: every column of the table. */
  colSpan: number;
  /** The band is open: its rows show, and its chevron says `aria-expanded`. */
  expanded?: boolean | undefined;
  /** Called with the next state when the band's heading or chevron is pressed. */
  onExpandedChange?: ((expanded: boolean) => void) | undefined;
  /**
   * The band is open.
   * @deprecated Use `expanded`, the name every disclosure in the kit shares; `open` is read for one version.
   */
  open?: boolean | undefined;
  /**
   * Called when the band's heading or chevron is pressed.
   * @deprecated Use `onExpandedChange`, which is called with the next state; `onToggle` is still called for one version where `onExpandedChange` is not given.
   */
  onToggle?: (() => void) | undefined;
  /** The band's heading, and the name of its chevron. */
  title: ReactNode;
  count?: number | string | null | undefined;
  /** Muted text or a control at the band's end: "2 of 46". */
  trailing?: ReactNode;
  children?: ReactNode;
};

/** A band of rows under one heading that opens and closes. Renders a tbody, so several groups stack inside one Table. The heading is the rows' `th scope="rowgroup"`, and its chevron is named by the title while `aria-expanded` says whether it is open. The heading sticks to the frame's leading edge, so it stays read while the rows scroll sideways. The tbody's native props, `className` and `ref` reach the tbody. */
export function TableGroup({
  colSpan,
  expanded,
  onExpandedChange,
  open: deprecatedOpen,
  onToggle: deprecatedToggle,
  title,
  count,
  trailing,
  children,
  className,
  ...props
}: TableGroupProps) {
  const { t } = useLedgerLocale();
  const titleId = useId();
  const open = expanded ?? deprecatedOpen ?? false;
  // The next state to `onExpandedChange`; the deprecated `onToggle` only where it is not given,
  // so a caller part-way through the rename never toggles twice.
  const onToggle = () => {
    if (onExpandedChange) onExpandedChange(!open);
    else deprecatedToggle?.();
  };
  return (
    <tbody {...props} className={cn("border-t border-default", className)} data-slot="table-group">
      <tr
        className="cursor-pointer bg-surface-sunken transition-colors duration-fast ease-standard hover:bg-surface-hovered motion-reduce:transition-none"
        onClick={onToggle}
      >
        <th colSpan={colSpan} scope="rowgroup" className="py-075 text-start font-regular">
          <span className="sticky start-0 inline-flex max-w-full items-center gap-150 px-100">
            {/* The band's title names the chevron; the row control is the kit's 20px one. */}
            <IconButton
              label={typeof title === "string" ? title : t(open ? "collapse" : "expand")}
              aria-labelledby={titleId}
              aria-expanded={open}
              variant="subtle"
              size="xxsmall"
              isTooltipDisabled
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              icon={
                <ChevronDown
                  className={cn(
                    "transition-transform duration-fast ease-standard motion-reduce:transition-none",
                    // Closed points to the reading direction's end: left in a right-to-left table.
                    open ? "" : "-rotate-90 rtl:rotate-90",
                  )}
                />
              }
            />
            <span
              id={titleId}
              className="flex min-w-0 flex-1 items-center gap-150 font-body font-medium text-default"
            >
              {title}
            </span>
            {count ? <Count value={count} /> : null}
            {trailing ? (
              <span className="flex shrink-0 items-center gap-150">{trailing}</span>
            ) : null}
          </span>
        </th>
      </tr>
      {open ? children : null}
    </tbody>
  );
}

/** What every chevron that opens rows takes: whether they are open, and the call that opens or closes them. */
type Disclosing = {
  /** The row's parts show: the chevron points down and says "Collapse". */
  expanded?: boolean | undefined;
  /** Called with the next state when the chevron is pressed. */
  onExpandedChange?: ((expanded: boolean) => void) | undefined;
  /**
   * Called when the chevron is pressed.
   * @deprecated Use `onExpandedChange`, which is called with the next state; `onToggle` is still called for one version where `onExpandedChange` is not given.
   */
  onToggle?: (() => void) | undefined;
};

/** The chevron's press: the next state to `onExpandedChange`, else the deprecated `onToggle`, so a caller part-way through the rename never toggles twice. */
const toggleOf =
  ({ expanded = false, onExpandedChange, onToggle }: Disclosing) =>
  () => {
    if (onExpandedChange) onExpandedChange(!expanded);
    else onToggle?.();
  };

/** The native props of the cell, less `onToggle`, the deprecated press, and the presentational `align` and `width`, which a heading sets for its column. */
export type TableTreeProps = Omit<
  ComponentProps<"td">,
  "align" | "width" | "children" | "onToggle"
> &
  Disclosing & {
    /** The row's level, from 0: one `space.200` indent each. */
    depth: number;
    hasChildren?: boolean | undefined;
    /** The row's plain name, for the chevron's accessible label: "Expand Ground segment". */
    label: string;
    /** Muted text after the name: a folded count, a kind. */
    hint?: ReactNode;
    className?: string | undefined;
    children: ReactNode;
  };

/**
 * The chevron that opens a row's parts: the kit's 20px row control, named "Expand" or "Collapse"
 * and the row. No tooltip: its name says it, and a row mounts none of its own.
 */
function RowChevron({
  expanded,
  label,
  onToggle,
}: {
  expanded: boolean;
  label: string;
  onToggle: () => void;
}) {
  const { t } = useLedgerLocale();
  return (
    <IconButton
      label={expanded ? t("collapseLabel", { label }) : t("expandLabel", { label })}
      variant="subtle"
      size="xxsmall"
      isTooltipDisabled
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      icon={
        <ChevronRight
          className={cn(
            "transition-transform duration-fast ease-standard motion-reduce:transition-none",
            // Closed points to the reading direction's end: left in a right-to-left table.
            expanded ? "rotate-90" : "rtl:rotate-180",
          )}
        />
      }
    />
  );
}

/**
 * The name cell of a row in a hierarchy that also has columns. It is the Tree recipe in a cell:
 * one indent per level, the chevron on rows that have children, named "Expand" or "Collapse" and
 * the row, the name truncated, a hint after it. Drawn by hand it is a plain table, reached by Tab;
 * DataTable's tree mode is the treegrid, with the arrow keys. The cell's native props,
 * `className` and `ref` reach the cell.
 */
export function TreeCell({
  depth,
  hasChildren = false,
  expanded = false,
  onExpandedChange,
  onToggle: deprecatedToggle,
  label,
  hint,
  className,
  children,
  ...props
}: TableTreeProps) {
  const onToggle = toggleOf({ expanded, onExpandedChange, onToggle: deprecatedToggle });
  return (
    <Td {...props} className={cn("max-w-none", className)} data-slot="table-tree">
      <span
        className="flex items-center gap-050"
        style={{ paddingInlineStart: `calc(${depth} * ${token("space.200")})` }}
      >
        {hasChildren ? (
          <RowChevron expanded={expanded} label={label} onToggle={onToggle} />
        ) : (
          <span aria-hidden className="block size-250 shrink-0" />
        )}
        <span className="truncate">{children}</span>
        {hint}
      </span>
    </Td>
  );
}

/** The native props of the cell, less the chevron it draws and `onToggle`, the deprecated press. */
export type TableDisclosureProps = Omit<ComponentProps<"td">, "align" | "children" | "onToggle"> &
  PinnedProps &
  Disclosing & {
    hasChildren?: boolean | undefined;
    /** The row's plain name, for the chevron's accessible label: "Expand Ground segment". */
    label: string;
    /** The column's width in pixels, for a table with no header row. */
    width?: number | undefined;
  };

/**
 * The chevron column of a hierarchy: its own leading cell, always first, so the disclosure never
 * moves when the reader reorders, hides or pins a column. One narrow column whatever the depth: the
 * indent belongs to the row's first value, so no width is reserved for a nesting most rows do not
 * have. A row with no parts keeps the space, so the values below it line up. The cell's native
 * props, `className` and `ref` reach the cell; a click in it never reaches the row.
 */
export function DisclosureCell({
  hasChildren = false,
  expanded = false,
  onExpandedChange,
  onToggle: deprecatedToggle,
  label,
  width,
  pinned,
  offset,
  edge,
  className,
  onClick,
  ...props
}: TableDisclosureProps) {
  const onToggle = toggleOf({ expanded, onExpandedChange, onToggle: deprecatedToggle });
  return (
    <Td
      width={width}
      pinned={pinned}
      offset={offset}
      edge={edge}
      {...props}
      className={cn("max-w-none px-0", className)}
      onClick={(e) => {
        onClick?.(e);
        e.stopPropagation();
      }}
      data-slot="table-disclosure"
    >
      <span className="flex items-center justify-center">
        {hasChildren ? (
          <RowChevron expanded={expanded} label={label} onToggle={onToggle} />
        ) : (
          <span aria-hidden className="block size-250 shrink-0" />
        )}
      </span>
    </Td>
  );
}

/** The native props of the row's one cell, less `id`, which names the row. */
export type TableDetailProps = Omit<ComponentProps<"td">, "id"> & {
  /** The row's id, which the chevron that opens it names in `aria-controls`. */
  id?: string | undefined;
  /** The number of columns the row spans: every column of the table. */
  colSpan: number;
  /** Classes for the row's one cell, where its padding is set. */
  className?: string | undefined;
  children: ReactNode;
};

/**
 * The row a record opens into: one cell spanning every column, holding whatever the record has to
 * show at length, a child table included. The chevron that opens it carries `aria-controls` with
 * this row's `id`. `id` names the row; the cell's native props, `className` and `ref` reach the
 * one cell, which holds the content and its padding.
 */
export function DetailRow({ id, colSpan, className, children, ...props }: TableDetailProps) {
  return (
    <tr id={id} className="border-b border-default bg-surface-sunken last:border-b-0">
      <td
        {...props}
        colSpan={colSpan}
        className={cn("px-200 py-150 align-top", className)}
        data-slot="table-detail"
      >
        {children}
      </td>
    </tr>
  );
}

export type TableHandleProps = ComponentProps<"span"> &
  PinnedProps & {
    ref?: Ref<HTMLSpanElement> | undefined;
    /** The grip's name, after the row: "Reorder row CTRL-0412". "Reorder" unsaid. */
    label?: string | undefined;
    isDragging?: boolean | undefined;
  };

/**
 * The grip cell for a row that can be dragged into a new order. `ref`, `attributes` and `listeners`
 * come from the drag context; the cell is the handle, so the row's own controls keep their clicks.
 */
export function HandleCell({
  ref,
  label,
  isDragging,
  className,
  pinned,
  offset,
  edge,
  ...props
}: TableHandleProps) {
  const { t } = useLedgerLocale();
  return (
    <Td className="max-w-none pe-0" width={NARROW} pinned={pinned} offset={offset} edge={edge}>
      <span
        ref={ref}
        role="button"
        aria-label={label ?? t("reorder")}
        className={cn(
          "relative inline-flex size-250 shrink-0 touch-target items-center justify-center rounded-small icon-subtlest outline-none touch-none cursor-grab hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused",
          isDragging && "cursor-grabbing",
          className,
        )}
        {...props}
      >
        <GripVertical className="size-icon-small" />
      </span>
    </Td>
  );
}

/** One item of a list cell: what the line writes and what the card lists. */
export type ListItem = {
  key: string;
  label: string;
  /** Under the label in the card: kind, path, owner. */
  meta?: ReactNode | undefined;
  /** At the end of the item's line in the card: an Indicator, one. */
  status?: ReactNode | undefined;
};

/** The native props of the line's button, which draws its own content. */
export type TableListProps = Omit<ComponentProps<"button">, "children"> & {
  items: ReadonlyArray<ListItem>;
  /** Drawn in place of the line when there are no items. `Absent` unsaid. */
  empty?: ReactNode | undefined;
  /** One line under the card's list: what among the items needs attention. */
  note?: ReactNode | undefined;
  /** The click: the row's preview, or the row's detail. */
  onOpen?: (() => void) | undefined;
  /** The line opens the row's detail, and this is whether it is open: it draws the chevron. */
  expanded?: boolean | undefined;
  /** The id of the detail row the line opens. */
  controls?: string | undefined;
};

/**
 * Several values in one cell, on one line: the first by name, the rest as a count ("+2", spoken
 * "and 2 more"), every one in a hover card with its meta line and status. The line is a button:
 * with `onOpen` its click opens the row's preview or detail; without it the click, Enter or a tap
 * opens the card, so the list is reachable on a touch screen. Every item, its meta and
 * status and the `note` are the line's description, so a screen reader hears the whole list
 * without the card. Given `expanded`, the line carries a chevron and reads as the row's
 * disclosure, so a cell that opens the row into a table says so. The button's native props,
 * `className` and `ref` reach the line's button; a caller's `onClick` runs before the line's own.
 * With no items there is no button: `empty` draws in its place.
 */
export function ListCell({
  items,
  empty,
  note,
  onOpen,
  expanded,
  controls,
  className,
  onClick,
  ...props
}: TableListProps) {
  const { formatNumber, t } = useLedgerLocale();
  // In a Table the line opens the table's one card; outside one it keeps its own.
  const shared = useContext(ListCardContext);
  // The card is the substitute for opening the row. Once the row is open the whole list is on
  // screen below, so the card is suppressed rather than sitting over what it stands in for.
  const [open, setOpen] = useState(false);
  const described = useId();
  // The shared card finds the line by its id: the caller's, when it gives one.
  const ownId = useId();
  const triggerId = props.id ?? ownId;
  const [first, ...rest] = items;
  if (!first) return <>{empty ?? <Absent />}</>;
  const line = (
    <>
      <span className="min-w-0 truncate">{first.label}</span>
      {rest.length ? (
        <span className="shrink-0 font-body-small tabular-nums text-subtle">
          <span aria-hidden>+{formatNumber(rest.length)}</span>
          <span className="sr-only"> {t("listMore", { count: formatNumber(rest.length) })}</span>
        </span>
      ) : null}
      {expanded === undefined ? null : (
        <ChevronRight
          aria-hidden
          className={cn(
            "size-icon-small shrink-0 icon-subtlest transition-transform duration-fast ease-standard motion-reduce:transition-none",
            expanded ? "rotate-90" : "rtl:rotate-180",
          )}
        />
      )}
    </>
  );
  const shape =
    "relative flex min-w-0 max-w-full touch-target items-center gap-075 rounded-xsmall text-start outline-none focus-visible:outline-focused";
  // The card wraps what it exists to show; nothing in it is cut.
  const card = (
    <div className="flex flex-col gap-100">
      <ul className="flex flex-col gap-075">
        {items.map((i) => (
          <li key={i.key} className="flex flex-col gap-025">
            <span className="flex items-start gap-100">
              <span className="min-w-0 break-words font-medium">{i.label}</span>
              {i.status ? <span className="ms-auto shrink-0">{i.status}</span> : null}
            </span>
            {i.meta ? (
              <span className="break-words font-body-small text-subtle">{i.meta}</span>
            ) : null}
          </li>
        ))}
      </ul>
      {note ? (
        <div className="border-t border-default pt-075 font-body-small text-subtle">{note}</div>
      ) : null}
    </div>
  );
  // The card's content as the line's description, in the order the card shows it. Hidden: a
  // description is read from hidden content, and the cell's own text stays the line alone.
  const description = (
    <span id={described} hidden>
      {items.map((i) => (
        <span key={i.key} className="block">
          {i.label}
          {i.meta ? <>, {i.meta}</> : null}
          {i.status ? <>, {i.status}</> : null}.
        </span>
      ))}
      {note ? <span className="block">{note}</span> : null}
    </span>
  );
  const button = (
    <button
      type="button"
      {...props}
      aria-describedby={described}
      {...(onOpen && expanded !== undefined ? { "aria-expanded": expanded } : {})}
      {...(onOpen && controls ? { "aria-controls": controls } : {})}
      {...(expanded ? { [CARD_HELD]: "" } : {})}
      onClick={(e) => {
        onClick?.(e);
        e.stopPropagation();
        if (onOpen) {
          if (shared) shared.close();
          else setOpen(false);
          onOpen();
        } else if (shared) {
          // On a touch screen the tap is the only way to the card, so it opens it rather than
          // passing on to the row.
          shared.open(triggerId);
        } else {
          setOpen(true);
        }
      }}
      className={cn(shape, onOpen && "hover:underline", className)}
      // The card's trigger keeps its name after the caller's props: the table's reveal reads it.
      data-slot="hover-card-trigger"
    >
      {line}
    </button>
  );
  if (shared)
    return (
      <>
        <HoverCardTrigger
          handle={shared}
          id={triggerId}
          payload={expanded ? null : card}
          render={button}
        />
        {description}
      </>
    );
  return (
    <>
      <HoverCard open={open && !expanded} onOpenChange={setOpen}>
        <HoverCardTrigger render={button} />
        <ListCard>{card}</ListCard>
      </HoverCard>
      {description}
    </>
  );
}

/** A list cell's card: the whole list with its meta and status, and the note. */
function ListCard({ children }: { children: ReactNode }) {
  return (
    <HoverCardContent
      align="start"
      alignOffset={0}
      className="overflow-y-auto"
      style={{ width: token("dimension.part.cellCard"), maxHeight: "var(--available-height)" }}
    >
      {children}
    </HoverCardContent>
  );
}

/** In a wrapping cell (`wrap`, or a column the reader wraps), a part that truncates wraps instead. */
const WRAPS_IN_CELL =
  "in-data-wrap:overflow-visible in-data-wrap:whitespace-normal in-data-wrap:break-words";

/** The native props of the name's `span`. */
export type TableNameProps = ComponentProps<"span"> & {
  /** The name: its text, or the record's link (a `TextLink` rendering the router's link). It is cut before anything beside it. */
  children: ReactNode;
  /** Before the name: the record's kind, as an `Icon`. Give the Icon a `label` when nothing else in the row says the kind; unlabelled, it is decoration. */
  icon?: ReactNode;
  /** A second line under the name, `font.body.small` in `color.text.subtle`: a path, a version, what the record adopts. One line, cut with an ellipsis. */
  description?: ReactNode;
  /** After the name: one `Badge` (xsmall) that marks the record, "Library", "Draft". It keeps its width while the name gives way. */
  badge?: ReactNode;
  className?: string | undefined;
};

/**
 * A record's name in a cell, with what tells two records apart at a glance: the kind's icon before
 * it, a badge after it, a muted second line under it. The name is cut first and the badge keeps
 * its width; the second line is cut on its own. Everything in it is the row header's text when the
 * cell names its row, so a screen reader hears the kind, the badge and the second line with the
 * name. `c.text` and `c.id` draw it from their `icon`, `badge` and `description`. The span's
 * native props, `className` and `ref` reach its root.
 */
export function NameCell({
  children,
  icon,
  description,
  badge,
  className,
  ...props
}: TableNameProps) {
  return (
    <span
      {...props}
      className={cn("flex min-w-0 max-w-full items-center gap-100", className)}
      data-slot="table-name"
    >
      {icon ? <span className="flex shrink-0 items-center">{icon}</span> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-center gap-100">
          <span data-slot="table-name-text" className={cn("min-w-0 truncate", WRAPS_IN_CELL)}>
            {children}
          </span>
          {badge ? <span className="flex shrink-0 items-center">{badge}</span> : null}
        </span>
        {description ? (
          <span
            data-slot="table-name-description"
            className={cn("min-w-0 truncate font-body-small text-subtle", WRAPS_IN_CELL)}
          >
            {description}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export const Table = Object.assign(TableRoot, {
  Row: Tr,
  Cell: Td,
  Header: Th,
  Disclosure: DisclosureCell,
  Id: IdCell,
  Name: NameCell,
  List: ListCell,
  Selection: SelectionCell,
  Group: TableGroup,
  Tree: TreeCell,
  Detail: DetailRow,
  Handle: HandleCell,
});
