import { ContextMenu } from "@base-ui/react/context-menu";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Columns3,
  Copy,
  ClipboardPaste,
  Scissors,
  Eraser,
  ExternalLink,
  Lock,
  Redo2,
  Undo2,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { flushSync } from "react-dom";

import { Alert, AlertDescription } from "../../components/alert";
import { Button, IconButton } from "../../components/button";
import { DatePicker } from "../../components/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "../../components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "../../components/empty";
import { Input } from "../../components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/select";
import { Scroller, ScrollerArrow, ScrollerViewport } from "../../components/scroller";
import { Separator } from "../../components/separator";
import { Truncate } from "../../components/truncate";
import { token } from "../../generated/tokens";
import { announce } from "../../lib/announce";
import { cn } from "../../lib/cn";
import { useLedgerLocale } from "../../lib/locale";
import { VisuallyHidden } from "../../primitives/visually-hidden";
import {
  columnName,
  parseAddress,
  selectionBounds,
  serializeTsv,
  validateCell,
  spreadsheetView,
  spreadsheetPaste,
  spreadsheetFill,
  wrappedLineCount,
  type SpreadsheetClipboard,
} from "./model";
import { SpreadsheetSheetBar } from "./sheet-bar";
import type {
  SpreadsheetCell,
  SpreadsheetMenuContext,
  SpreadsheetCellStyle,
  SpreadsheetEdit,
  SpreadsheetProps,
  SpreadsheetSelection,
  SpreadsheetRow,
  SpreadsheetToolbarProps,
} from "./types";

const EMPTY_IDS: readonly string[] = [];
const EMPTY_HEIGHTS: Readonly<Record<string, number>> = {};
const MIN_ROW_HEIGHT = 24;
const MAX_ROW_HEIGHT = 240;
const MAX_AUTO_ROW_HEIGHT = 480;
const clampRowHeight = (height: number) =>
  Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, Math.round(height)));
const MIN_WIDTH = 104;
const MAX_WIDTH = 640;
const sameCell = (a: SpreadsheetCell | null | undefined, b: SpreadsheetCell | null | undefined) =>
  a?.rowId === b?.rowId && a?.columnId === b?.columnId;
const clampWidth = (width: number) => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
type Draft = { cell: SpreadsheetCell; value: string };
type GridGestureBase = {
  pointerId: number;
  x: number;
  y: number;
  rowIds: string[];
  columnIds: string[];
};
type GridGesture = GridGestureBase &
  (
    | {
        kind: "fill";
        source: SpreadsheetSelection;
        target: SpreadsheetSelection;
        sourceValues: SpreadsheetEdit[];
      }
    | {
        kind: "row" | "column";
        original: SpreadsheetSelection | null;
        originalKind: SpreadsheetMenuContext["kind"];
        anchor: number;
      }
  );
const borderCss = (border: SpreadsheetCellStyle["borderTop"]) =>
  border ? `${border.width}px ${border.style} ${border.color}` : undefined;

// A grid owns its cell boundary and focus indicator. Form-field chrome would create a second
// inset field and move the text when editing starts. Share this native text surface with the bar.
function CellTextEditor(props: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={1}
      wrap="off"
      spellCheck={false}
      autoComplete="off"
      autoCapitalize="off"
      enterKeyHint="done"
      {...props}
      data-slot="spreadsheet-text-editor"
    />
  );
}

/** A shared workbook strip: normal Tab navigation, horizontal overflow and visible edge arrows. */
export function SpreadsheetToolbar({
  label,
  children,
  className,
  ...props
}: SpreadsheetToolbarProps) {
  return (
    <div
      {...props}
      className={cn("min-w-0", className)}
      role="group"
      aria-label={label}
      data-slot="spreadsheet-toolbar"
    >
      <Scroller orientation="horizontal">
        <ScrollerViewport>
          <div data-slot="spreadsheet-tools">{children}</div>
        </ScrollerViewport>
        <ScrollerArrow edge="start" />
        <ScrollerArrow edge="end" />
      </Scroller>
    </div>
  );
}

/** A controlled workbook viewport. Calculation, authorization and durable history belong to its host. */
export function Spreadsheet({
  label,
  columns: allColumns,
  rows: allRows,
  onChange,
  onDraftChange,
  selection,
  onSelectionChange,
  readOnly = false,
  pending = false,
  error,
  onRetry,
  isCellReadOnly,
  isCellLiteral,
  getCellError,
  getCellStyle,
  getCellOptions,
  getCellComment,
  displayValue,
  clipboardValue,
  preparePasteValue,
  translateInput,
  onOpenRow,
  activeRowId,
  presence = [],
  toolbarStart,
  actions,
  renderColumnMenu,
  renderCellMenu,
  renderRowMenu,
  onClearFormatting,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  sheets,
  activeSheetId,
  onSheetChange,
  onAddSheet,
  getSheetActions,
  onSheetAction,
  onAddRows,
  onAddColumns,
  sheetRowCount,
  sheetColumnCount,
  hiddenRowIds,
  hiddenColumnIds,
  onHiddenRowIdsChange,
  onHiddenColumnIdsChange,
  headerDisplay = "labels",
  density = "comfortable",
  fillAvailable = false,
  height,
  freezeFirstColumn,
  onFreezeFirstColumnChange,
  freezeFirstRow: requestedFreezeFirstRow = false,
  columnWidths,
  onColumnWidthsChange,
  rowHeights,
  onRowHeightsChange,
  className,
  style,
  ...props
}: SpreadsheetProps) {
  const uid = useId();
  const [localHidden, setLocalHidden] = useState<
    Record<string, { rows: readonly string[]; columns: readonly string[] }>
  >({});
  const hiddenRows = hiddenRowIds ?? localHidden[activeSheetId ?? ""]?.rows ?? EMPTY_IDS;
  const hiddenColumns = hiddenColumnIds ?? localHidden[activeSheetId ?? ""]?.columns ?? EMPTY_IDS;
  const { rows, columns, columnNumbers } = useMemo(
    () => spreadsheetView(allRows, allColumns, hiddenRows, hiddenColumns),
    [allRows, allColumns, hiddenRows, hiddenColumns],
  );
  const freezeFirstRow = requestedFreezeFirstRow && rows[0]?.id === allRows[0]?.id;
  const [localRowHeightsBySheet, setLocalRowHeightsBySheet] = useState<
    Record<string, Readonly<Record<string, number>>>
  >({});
  const localRowHeights = localRowHeightsBySheet[activeSheetId ?? ""] ?? EMPTY_HEIGHTS;
  const rowHeightOverrides = rowHeights ?? localRowHeights;
  const [rowHeightPreview, setRowHeightPreview] = useState<Readonly<Record<string, number>> | null>(
    null,
  );
  const rowResize = useRef<{
    pointerId: number;
    startY: number;
    startHeight: number;
    ids: readonly string[];
    heights: Readonly<Record<string, number>>;
  } | null>(null);
  const locale = useLedgerLocale();
  const viewport = useRef<HTMLDivElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const formula = useRef<HTMLTextAreaElement>(null);
  const alive = useRef(true);
  const writing = useRef(false);
  const finishing = useRef(false);
  const choicePicked = useRef(false);
  const dragging = useRef(false);
  const epoch = useRef(0);
  const [localSelection, setLocalSelection] = useState<SpreadsheetSelection | null>(null);
  const [rowHeight, setRowHeight] = useState(density === "compact" ? 28 : 36);
  const [gutterWidth, setGutterWidth] = useState(0);
  const [localWidthsBySheet, setLocalWidthsBySheet] = useState<
    Record<string, Readonly<Record<string, number>>>
  >({});
  const localWidths = localWidthsBySheet[activeSheetId ?? ""] ?? EMPTY_HEIGHTS;
  const widthOverrides = columnWidths ?? localWidths;
  const [columnWidthPreview, setColumnWidthPreview] = useState<Readonly<
    Record<string, number>
  > | null>(null);
  const columnResize = useRef<{
    pointerId: number;
    startX: number;
    startWidth: number;
    ids: readonly string[];
    widths: Readonly<Record<string, number>>;
  } | null>(null);
  const gridGesture = useRef<GridGesture | null>(null);
  const gestureFrame = useRef<number | null>(null);
  const gestureHandlers = useRef({
    move: (_event: PointerEvent) => {},
    end: (_event: PointerEvent) => {},
    cancel: () => {},
    tick: () => {},
  });
  const suppressHeaderClick = useRef(false);
  const [fillPreview, setFillPreview] = useState<SpreadsheetSelection | null>(null);
  const [headerDragging, setHeaderDragging] = useState<"row" | "column" | null>(null);
  const initialWidths = useRef(new Map<string, number>());
  const initialWidthKey = (columnId: string) => JSON.stringify([activeSheetId ?? null, columnId]);
  for (const column of allColumns) {
    const key = initialWidthKey(column.id);
    if (!initialWidths.current.has(key))
      initialWidths.current.set(key, clampWidth(columnWidths?.[column.id] ?? column.width ?? 180));
  }
  const resetWidth = (columnId: string) =>
    initialWidths.current.get(initialWidthKey(columnId)) ?? 180;
  const [localFreezeFirstColumn, setLocalFreezeFirstColumn] = useState(true);
  const [openColumnId, setOpenColumnId] = useState<string | null>(null);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [menuContext, setMenuContext] = useState<SpreadsheetMenuContext | null>(null);
  const selectionKind = useRef<SpreadsheetMenuContext["kind"]>("cell");
  const [sizeDialog, setSizeDialog] = useState<{
    kind: "row" | "column";
    ids: readonly string[];
  } | null>(null);
  const [sizeInput, setSizeInput] = useState("");
  const [view, setView] = useState({ top: 0, left: 0, width: 800, height: height ?? 420 });
  const [draft, setDraft] = useState<Draft | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [formulaDraft, setFormulaDraft] = useState<Draft | null>(null);
  const formulaDraftRef = useRef(formulaDraft);
  formulaDraftRef.current = formulaDraft;
  const [dateTextDirty, setDateTextDirty] = useState(false);
  const [addressDraft, setAddressDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const failed = useRef<readonly SpreadsheetEdit[] | null>(null);
  const failedStrict = useRef(false);
  const dateEntryError = useRef<string | null>(null);
  const copied = useRef<SpreadsheetClipboard | null>(null);
  const [, refreshClipboard] = useState(0);
  const busy = pending || saving;
  const rowById = useMemo(() => new Map(allRows.map((row) => [row.id, row])), [allRows]);
  const rowNumbers = useMemo(() => rows.map((row, index) => row.rowNumber ?? index + 1), [rows]);
  const columnById = useMemo(
    () => new Map(allColumns.map((column) => [column.id, column])),
    [allColumns],
  );
  const first = rows[0] && columns[0] ? { rowId: rows[0].id, columnId: columns[0].id } : null;
  const requested = selection === undefined ? localSelection : selection;
  const bounds = selectionBounds(requested, rows, columns);
  const chosen = bounds
    ? requested
    : selection === null
      ? null
      : first
        ? { anchor: first, focus: first }
        : null;
  const range = selectionBounds(chosen, rows, columns);
  const selectionRef = useRef(chosen);
  selectionRef.current = chosen;
  const active = chosen?.anchor ?? null;
  const focusRowIndex = chosen ? rows.findIndex((row) => row.id === chosen.focus.rowId) : -1;
  const focusColumnIndex = chosen
    ? columns.findIndex((column) => column.id === chosen.focus.columnId)
    : -1;
  const rowIndex = active ? rows.findIndex((row) => row.id === active.rowId) : -1;
  const columnIndex = active ? columns.findIndex((column) => column.id === active.columnId) : -1;
  const originalActiveColumn = columns[columnIndex];
  const activeOptions = active ? getCellOptions?.(active) : undefined;
  const activeColumn =
    originalActiveColumn && activeOptions !== undefined
      ? { ...originalActiveColumn, type: "choice" as const, options: activeOptions }
      : originalActiveColumn;
  const value = (cell: SpreadsheetCell) => rowById.get(cell.rowId)?.values[cell.columnId] ?? "";
  const activeValue = active ? value(active) : "";
  const currentDraft = draft ?? formulaDraft;
  const dirty =
    !!currentDraft && (dateTextDirty || currentDraft.value !== value(currentDraft.cell));
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
  useEffect(() => onDraftChange?.(dirty), [dirty, onDraftChange]);
  useEffect(() => () => onDraftChangeRef.current?.(false), []);
  const address = active ? `${columnName(columnNumbers[columnIndex]!)}${rowNumbers[rowIndex]}` : "";
  const canWrite = (cell: SpreadsheetCell) =>
    !readOnly &&
    !!onChange &&
    rowById.has(cell.rowId) &&
    columnById.has(cell.columnId) &&
    !columnById.get(cell.columnId)?.readOnly &&
    !isCellReadOnly?.(cell);
  const activeWritable = active ? canWrite(active) : false;
  const widths = useMemo(
    () =>
      columns.map((column) =>
        clampWidth(
          columnWidthPreview?.[column.id] ?? widthOverrides[column.id] ?? column.width ?? 180,
        ),
      ),
    [columns, widthOverrides, columnWidthPreview],
  );
  const heightDisabledReason =
    rowHeights !== undefined && !onRowHeightsChange
      ? "Row heights are managed by this view."
      : undefined;
  const rowMeasurements = useMemo(() => {
    const context =
      typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
    const baseFont =
      gutterWidth > 0 && viewport.current ? getComputedStyle(viewport.current) : null;
    const paddingX = parseFloat(baseFont?.getPropertyValue("--ds-space-100") ?? "") || 8;
    const paddingY = parseFloat(baseFont?.getPropertyValue("--ds-space-050") ?? "") || 4;
    const measureCell = (row: SpreadsheetRow, columnIndex: number, input?: string) => {
      const column = columns[columnIndex]!;
      const cell = { rowId: row.id, columnId: column.id };
      const format = getCellStyle?.(cell);
      const fontSize =
        format?.fontSize === undefined
          ? parseFloat(baseFont?.fontSize ?? "13")
          : format.fontSize * (4 / 3);
      const lineHeight =
        format?.fontSize === undefined
          ? parseFloat(baseFont?.lineHeight ?? "") || fontSize * 1.4
          : fontSize * 1.4;
      let lines = input === undefined ? 1 : input.split(/\r?\n/).length;
      if (format?.wrap) {
        const raw = input ?? row.values[column.id] ?? "";
        const text = input ?? displayValue?.(cell, raw) ?? raw;
        if (context)
          context.font = `${format.italic ? "italic " : ""}${format.bold ? "600" : (baseFont?.fontWeight ?? "400")} ${fontSize}px ${format.fontFamily ?? baseFont?.fontFamily ?? "sans-serif"}`;
        const available = Math.max(
          1,
          widths[columnIndex]! -
            paddingX * 2 -
            (format.borderLeft?.width ?? 0) -
            (format.borderRight?.width ?? 1),
        );
        lines = wrappedLineCount(
          text,
          available,
          (line) => context?.measureText(line).width ?? line.length * fontSize * 0.6,
        );
      }
      return Math.ceil(
        lines * lineHeight +
          paddingY * 2 +
          (format?.borderTop?.width ?? 0) +
          (format?.borderBottom?.width ?? 1),
      );
    };
    return {
      paddingY,
      measureCell,
      heights: rows.map((row) =>
        Math.min(
          MAX_AUTO_ROW_HEIGHT,
          Math.max(rowHeight, ...columns.map((_, index) => measureCell(row, index))),
        ),
      ),
    };
  }, [rows, columns, rowHeight, gutterWidth, getCellStyle, displayValue, widths]);
  const effectiveRowHeights = useMemo(
    () =>
      rows.map((row, index) => {
        const explicit = rowHeightPreview?.[row.id] ?? rowHeightOverrides[row.id];
        if (explicit !== undefined) return clampRowHeight(explicit);
        const draftColumn =
          currentDraft?.cell.rowId === row.id
            ? columns.findIndex((column) => column.id === currentDraft.cell.columnId)
            : -1;
        const draftHeight =
          draftColumn < 0 || !currentDraft
            ? 0
            : rowMeasurements.measureCell(row, draftColumn, currentDraft.value);
        return Math.min(
          MAX_AUTO_ROW_HEIGHT,
          Math.max(rowMeasurements.heights[index]!, draftHeight),
        );
      }),
    [rows, columns, rowHeightOverrides, rowHeightPreview, rowMeasurements, currentDraft],
  );
  const rowOffsets: number[] = [];
  let totalHeight = rowHeight;
  effectiveRowHeights.forEach((height) => {
    rowOffsets.push(totalHeight);
    totalHeight += height;
  });
  const offsets: number[] = [];
  let totalWidth = gutterWidth;
  widths.forEach((width) => {
    offsets.push(totalWidth);
    totalWidth += width;
  });
  // The frozen identity yields when it would occupy most of a narrow viewport.
  const freezeIdentity = freezeFirstColumn ?? localFreezeFirstColumn;
  const frozen =
    freezeIdentity &&
    columns[0]?.id === allColumns[0]?.id &&
    (widths[0] ?? 0) + gutterWidth + MIN_WIDTH < view.width;
  const widthDisabledReason =
    columnWidths !== undefined && !onColumnWidthsChange
      ? "Column widths are managed by this view."
      : undefined;
  const freezeDisabledReason =
    freezeFirstColumn !== undefined && !onFreezeFirstColumnChange
      ? "The frozen column is managed by this view."
      : undefined;
  const cellId = (row: number, column: number) => `${uid}-r${row}-c${column}`;
  const rowAtOffset = (offset: number) => {
    let start = 0;
    let end = rowOffsets.length;
    while (start < end) {
      const middle = (start + end) >>> 1;
      if (rowOffsets[middle]! + effectiveRowHeights[middle]! < offset) start = middle + 1;
      else end = middle;
    }
    return start;
  };
  const firstVisible = Math.max(0, rowAtOffset(view.top) - 3);
  const lastVisible = Math.min(rows.length - 1, rowAtOffset(view.top + view.height) + 3);
  const visibleRows = Array.from(
    new Set([
      ...Array.from(
        { length: Math.max(0, lastVisible - firstVisible + 1) },
        (_, index) => firstVisible + index,
      ),
      ...(rowIndex >= 0 ? [rowIndex] : []),
      ...(freezeFirstRow && rows.length ? [0] : []),
    ]),
  ).sort((a, b) => a - b);
  const visibleColumns = columns
    .map((_, index) => index)
    .filter(
      (index) =>
        index === columnIndex ||
        columns[index]!.id === openColumnId ||
        (frozen && index === 0) ||
        (offsets[index]! + widths[index]! >= view.left - 200 &&
          offsets[index]! <= view.left + view.width + 200),
    );
  const peerCells = useMemo(() => {
    const mapped = new Map<string, typeof presence>();
    for (const peer of presence) {
      const key = JSON.stringify([peer.cell.rowId, peer.cell.columnId]);
      mapped.set(key, [...(mapped.get(key) ?? []), peer]);
    }
    return mapped;
  }, [presence]);

  useEffect(() => {
    alive.current = true;
    const stop = () => {
      dragging.current = false;
    };
    document.addEventListener("pointerup", stop);
    return () => {
      alive.current = false;
      document.removeEventListener("pointerup", stop);
    };
  }, []);
  useEffect(() => {
    const move = (event: PointerEvent) => gestureHandlers.current.move(event);
    const end = (event: PointerEvent) => gestureHandlers.current.end(event);
    const cancel = () => {
      gestureHandlers.current.cancel();
      columnResize.current = null;
      rowResize.current = null;
      setColumnWidthPreview(null);
      setRowHeightPreview(null);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        (!gridGesture.current && !columnResize.current && !rowResize.current)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      gestureHandlers.current.cancel();
      columnResize.current = null;
      rowResize.current = null;
      setColumnWidthPreview(null);
      setRowHeightPreview(null);
      viewport.current?.focus({ preventScroll: true });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel);
    window.addEventListener("keydown", escape, true);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("keydown", escape, true);
      if (gestureFrame.current !== null) cancelAnimationFrame(gestureFrame.current);
    };
  }, []);
  useEffect(() => {
    epoch.current++;
    setDraft(null);
    setFormulaDraft(null);
    setDateTextDirty(false);
    setLocalSelection(null);
    setOpenColumnId(null);
    setColumnsMenuOpen(false);
    setFailure(null);
    failed.current = null;
    if (viewport.current) {
      viewport.current.scrollTop = 0;
      viewport.current.scrollLeft = 0;
    }
    setView((current) => ({ ...current, top: 0, left: 0 }));
    setAddressDraft(null);
    dateEntryError.current = null;
    setContextOpen(false);
    setMenuContext(null);
    setSizeDialog(null);
    rowResize.current = null;
    setRowHeightPreview(null);
    columnResize.current = null;
    setColumnWidthPreview(null);
    gridGesture.current = null;
    if (gestureFrame.current !== null) cancelAnimationFrame(gestureFrame.current);
    gestureFrame.current = null;
    setFillPreview(null);
    setHeaderDragging(null);
    selectionKind.current = "cell";
  }, [activeSheetId]);
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const header = node.querySelector<HTMLElement>('[data-slot="spreadsheet-header"]');
    const corner = node.querySelector<HTMLElement>('[data-slot="spreadsheet-corner"]');
    const measure = () => {
      if (header) setRowHeight(header.getBoundingClientRect().height);
      if (corner) setGutterWidth(corner.getBoundingClientRect().width);
      setView({
        top: node.scrollTop,
        left: Math.abs(node.scrollLeft),
        width: node.clientWidth,
        height: node.clientHeight,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (header) observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const editorRow = draft?.cell.rowId;
  const editorColumn = draft?.cell.columnId;
  useLayoutEffect(() => {
    if (!editorRow || !editorColumn) return;
    const control = editor.current?.querySelector<
      HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
    >("textarea, input:not([type=hidden]), button");
    control?.focus();
    if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
      control.setSelectionRange(control.value.length, control.value.length);
    }
  }, [editorRow, editorColumn]);

  const focusGrid = () => viewport.current?.focus({ preventScroll: true });
  function reveal(row: number, column: number) {
    const node = viewport.current;
    if (!node) return;
    const top = rowOffsets[row]!;
    const heldHeight = rowHeight + (freezeFirstRow && row > 0 ? effectiveRowHeights[0]! : 0);
    if (top < node.scrollTop + heldHeight) node.scrollTop = Math.max(0, top - heldHeight);
    else if (top + effectiveRowHeights[row]! > node.scrollTop + node.clientHeight)
      node.scrollTop = top + effectiveRowHeights[row]! - node.clientHeight;
    if (!(frozen && column === 0)) {
      const x = offsets[column] ?? gutterWidth;
      const start = gutterWidth + (frozen ? widths[0]! : 0);
      const left = Math.abs(node.scrollLeft);
      let next = left;
      if (widths[column]! > node.clientWidth - start) next = x - start;
      else if (x < left + start) next = x - start;
      else if (x + widths[column]! > left + node.clientWidth)
        next = x + widths[column]! - node.clientWidth;
      node.scrollLeft = Math.max(0, next) * (locale.direction === "rtl" ? -1 : 1);
    }
  }
  function selectCell(row: number, column: number, extend = false) {
    const record = rows[Math.max(0, Math.min(rows.length - 1, row))];
    const field = columns[Math.max(0, Math.min(columns.length - 1, column))];
    if (!record || !field) return;
    selectionKind.current = "cell";
    const focus = { rowId: record.id, columnId: field.id };
    const next = { anchor: extend && chosen ? chosen.anchor : focus, focus };
    selectionRef.current = next;
    setLocalSelection(next);
    onSelectionChange?.(next);
    setAddressDraft(null);
    setFormulaDraft(null);
    reveal(rows.indexOf(record), columns.indexOf(field));
  }
  function selectRange(next: SpreadsheetSelection) {
    selectionRef.current = next;
    setLocalSelection(next);
    onSelectionChange?.(next);
    focusGrid();
  }
  async function write(edits: readonly SpreadsheetEdit[], strict = false) {
    if (writing.current || pending || !onChange || readOnly) return false;
    if (strict && edits.some((edit) => !canWrite(edit))) {
      setFailure("The range includes a read-only cell. No cells were changed.");
      return false;
    }
    const writable = edits.filter((edit) => canWrite(edit) && value(edit) !== edit.value);
    if (!writable.length) return true;
    for (const edit of writable) {
      const original = columnById.get(edit.columnId);
      const options = getCellOptions?.(edit);
      const column =
        original && options !== undefined
          ? { ...original, type: "choice" as const, options }
          : original;
      const invalid = column && validateCell(column, edit.value);
      if (invalid) {
        setFailure(`${column.label}: ${invalid}`);
        failed.current = null;
        return false;
      }
    }
    writing.current = true;
    setSaving(true);
    setFailure(null);
    const generation = epoch.current;
    try {
      await onChange(writable);
      if (!alive.current || generation !== epoch.current) return false;
      failed.current = null;
      announce(`${writable.length} ${writable.length === 1 ? "cell" : "cells"} updated.`);
      return true;
    } catch (reason) {
      if (alive.current && generation === epoch.current) {
        failed.current = writable;
        failedStrict.current = strict;
        setFailure(
          reason instanceof Error ? reason.message : "The change could not be saved. Try again.",
        );
      }
      return false;
    } finally {
      writing.current = false;
      if (alive.current) setSaving(false);
    }
  }
  function clearDraft() {
    draftRef.current = null;
    formulaDraftRef.current = null;
    setDraft(null);
    setFormulaDraft(null);
    setDateTextDirty(false);
  }
  async function finish(next?: { row: number; column: number }, returnFocus = true) {
    if (finishing.current || writing.current || pending) return false;
    finishing.current = true;
    try {
      // Typed dates parse on blur; settle that parser before a pointer, sheet switch or Tab reads it.
      const dateInput =
        draftRef.current && activeColumn?.type === "date"
          ? editor.current?.querySelector<HTMLInputElement>("input:not([type=hidden])")
          : null;
      if (dateInput && dateInput === document.activeElement) flushSync(() => dateInput.blur());
      if (dateEntryError.current) {
        if (returnFocus) dateInput?.focus();
        return false;
      }
      const current = draftRef.current ?? formulaDraftRef.current;
      if (current && !(await write([{ ...current.cell, value: current.value }]))) return false;
      clearDraft();
      if (next) selectCell(next.row, next.column);
      if (returnFocus) focusGrid();
      return true;
    } finally {
      finishing.current = false;
    }
  }
  function cancel(returnFocus = true) {
    if (writing.current || pending) return;
    dateEntryError.current = null;
    clearDraft();
    setFailure(null);
    failed.current = null;
    if (returnFocus) focusGrid();
  }
  function ownsEditorFocus(target: Element | null) {
    if (!target) return false;
    if (editor.current?.contains(target) || target === formula.current) return true;
    if (target.closest(`[data-spreadsheet-edit-action="${uid}"]`)) return true;
    // Select and calendar content lives in a portal. Its controlling trigger belongs to this
    // editor, so moving into that popup does not finish the cell's draft.
    return [...(editor.current?.querySelectorAll("[aria-controls]") ?? [])].some((control) =>
      control
        .getAttribute("aria-controls")
        ?.split(/\s+/)
        .some((id) => control.ownerDocument.getElementById(id)?.contains(target)),
    );
  }
  function leaveEditor() {
    queueMicrotask(() => {
      if (!alive.current || ownsEditorFocus(document.activeElement)) return;
      // Select owns its commit and dismissal. Pointer focus can leave before its value callback.
      if (
        draftRef.current &&
        (getCellOptions?.(draftRef.current.cell) !== undefined ||
          columnById.get(draftRef.current.cell.columnId)?.type === "choice")
      )
        return;
      if (draftRef.current || formulaDraftRef.current) void finish(undefined, false);
    });
  }
  function begin(seed?: string) {
    if (!active || !activeWritable || busy) return;
    setFailure(null);
    dateEntryError.current = null;
    setDateTextDirty(false);
    choicePicked.current = false;
    if (activeColumn?.type === "boolean" && seed === undefined) {
      void write([{ ...active, value: activeValue === "true" ? "false" : "true" }]);
    } else setDraft({ cell: active, value: seed ?? activeValue });
  }
  function nextCell(direction: number) {
    let row = rowIndex;
    let column = columnIndex;
    for (let attempt = 0; attempt < rows.length * columns.length; attempt++) {
      column += direction;
      if (column >= columns.length) {
        column = 0;
        row++;
      }
      if (column < 0) {
        column = columns.length - 1;
        row--;
      }
      if (row < 0 || row >= rows.length) return { row: rowIndex, column: columnIndex };
      const cell = { rowId: rows[row]!.id, columnId: columns[column]!.id };
      if (canWrite(cell)) return { row, column };
    }
    return { row: rowIndex, column: columnIndex };
  }
  function selectedEdits(makeValue: (row: number, column: number) => string, selected = chosen) {
    const range = selectionBounds(selected, rows, columns);
    if (!range) return [];
    const edits: SpreadsheetEdit[] = [];
    for (let row = range.top; row <= range.bottom; row++)
      for (let column = range.start; column <= range.end; column++)
        edits.push({
          rowId: rows[row]!.id,
          columnId: columns[column]!.id,
          value: makeValue(row, column),
        });
    return edits;
  }
  function rememberCopy(kind: "copy" | "cut" = "copy", selected = chosen) {
    const range = selectionBounds(selected, rows, columns);
    if (!range) return "";
    const source = selectedEdits(
      (row, column) => rows[row]!.values[columns[column]!.id] ?? "",
      selected,
    );
    if (kind === "cut" && source.some((cell) => !canWrite(cell))) {
      setFailure("The cut range includes a read-only cell. No cells were moved.");
      return null;
    }
    const matrix = rows
      .slice(range.top, range.bottom + 1)
      .map((row) =>
        columns.slice(range.start, range.end + 1).map((column) => row.values[column.id] ?? ""),
      );
    const text = serializeTsv(matrix);
    copied.current = {
      text,
      source,
      kind,
      sheetId: activeSheetId,
      literal: rows
        .slice(range.top, range.bottom + 1)
        .map((row) =>
          columns
            .slice(range.start, range.end + 1)
            .map((column) => isCellLiteral?.({ rowId: row.id, columnId: column.id }) ?? false),
        ),
      display: rows
        .slice(range.top, range.bottom + 1)
        .map((row) =>
          columns
            .slice(range.start, range.end + 1)
            .map(
              (column) =>
                clipboardValue?.(
                  { rowId: row.id, columnId: column.id },
                  row.values[column.id] ?? "",
                ) ??
                displayValue?.(
                  { rowId: row.id, columnId: column.id },
                  row.values[column.id] ?? "",
                ) ??
                row.values[column.id] ??
                "",
            ),
        ),
      rowNumbers: rowNumbers.slice(range.top, range.bottom + 1),
      columnNumbers: columnNumbers.slice(range.start, range.end + 1),
    };
    refreshClipboard((version) => version + 1);
    return text;
  }
  async function copy(kind: "copy" | "cut" = "copy", selected = chosen) {
    const text = rememberCopy(kind, selected);
    if (text === null) return;
    try {
      await navigator.clipboard.writeText(text);
      announce(
        kind === "cut"
          ? "Selection cut. Source cells remain until you paste."
          : "Selection copied.",
      );
    } catch {
      setFailure(
        "Clipboard access is unavailable. The selection is available through this workbook’s Paste command, or use your browser’s Copy shortcut.",
      );
    }
  }
  async function paste(text: string, valuesOnly = false, selected = chosen) {
    if (!selected || busy || readOnly || !onChange) return;
    try {
      const plan = spreadsheetPaste({
        rows,
        columns,
        columnNumbers,
        selection: selected,
        text,
        clipboard: copied.current,
        valuesOnly,
        sheetId: activeSheetId,
        translateInput,
        preparePasteValue,
        valueAt: value,
        canWrite,
      });
      if (await write(plan.edits, true)) {
        if (plan.cut) {
          copied.current = null;
          refreshClipboard((version) => version + 1);
        }
      }
    } catch (reason) {
      setFailure(reason instanceof Error ? reason.message : "Could not read the pasted cells.");
    }
  }
  async function pasteClipboard(valuesOnly = false, selected = chosen) {
    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      if (!copied.current) {
        setFailure(
          "Clipboard access is unavailable. Focus the grid and use your browser’s Paste shortcut.",
        );
        return;
      }
      text = copied.current.text;
    }
    await paste(text, valuesOnly, selected);
  }
  async function commitFill(source: SpreadsheetSelection, target: SpreadsheetSelection) {
    if (busy || editing || readOnly || !onChange) return false;
    try {
      const edits = spreadsheetFill({
        rows,
        columns,
        columnNumbers,
        source,
        target,
        translateInput,
        isCellLiteral,
        preparePasteValue,
        canWrite,
      });
      return await write(edits, true);
    } catch (reason) {
      failed.current = null;
      setFailure(reason instanceof Error ? reason.message : "Could not fill the selected cells.");
      return false;
    }
  }
  function fill(direction: "down" | "right", selected = chosen) {
    const range = selectionBounds(selected, rows, columns);
    if (!range || !selected) return;
    const source = rangeFromIndices(
      range.top,
      range.start,
      direction === "down" ? range.top : range.bottom,
      direction === "right" ? range.start : range.end,
    );
    void commitFill(source, selected);
  }
  function contextFor(
    kind: SpreadsheetMenuContext["kind"],
    row: number,
    column: number,
  ): SpreadsheetMenuContext | null {
    const record = rows[row];
    const field = columns[column];
    if (!record || !field) return null;
    const cell = { rowId: record.id, columnId: field.id };
    const previous = selectionRef.current;
    const area = selectionBounds(previous, rows, columns);
    let next = previous;
    const inside =
      area && row >= area.top && row <= area.bottom && column >= area.start && column <= area.end;
    if (kind === "cell" && !inside) next = { anchor: cell, focus: cell };
    if (
      kind === "row" &&
      !(
        area &&
        row >= area.top &&
        row <= area.bottom &&
        area.start === 0 &&
        area.end === columns.length - 1
      )
    )
      next = {
        anchor: { rowId: record.id, columnId: columns[0]!.id },
        focus: { rowId: record.id, columnId: columns.at(-1)!.id },
      };
    if (
      kind === "column" &&
      !(
        area &&
        column >= area.start &&
        column <= area.end &&
        area.top === 0 &&
        area.bottom === rows.length - 1
      )
    )
      next = {
        anchor: { rowId: rows[0]!.id, columnId: field.id },
        focus: { rowId: rows.at(-1)!.id, columnId: field.id },
      };
    const selected = selectionBounds(next, rows, columns);
    if (!next || !selected) return null;
    return {
      kind,
      cell,
      selection: next,
      rowIds: rows.slice(selected.top, selected.bottom + 1).map((entry) => entry.id),
      columnIds: columns.slice(selected.start, selected.end + 1).map((entry) => entry.id),
    };
  }
  function prepareContext(target: EventTarget | null) {
    if (!(target instanceof Element) || !viewport.current?.contains(target)) return null;
    const cell = target.closest<HTMLElement>('[data-slot="spreadsheet-cell"]');
    const rowHeader = target.closest<HTMLElement>('[data-slot="spreadsheet-row-number"]');
    const columnHeader = target.closest<HTMLElement>('[data-slot="spreadsheet-column"]');
    let next: SpreadsheetMenuContext | null = null;
    if (cell)
      next = contextFor(
        "cell",
        rows.findIndex((row) => row.id === cell.dataset["rowId"]),
        columns.findIndex((column) => column.id === cell.dataset["columnId"]),
      );
    else if (rowHeader)
      next = contextFor(
        "row",
        rows.findIndex((row) => row.id === rowHeader.dataset["rowId"]),
        0,
      );
    else if (columnHeader)
      next = contextFor(
        "column",
        0,
        columns.findIndex((column) => column.id === columnHeader.dataset["columnId"]),
      );
    else if (active) next = contextFor(selectionKind.current, rowIndex, columnIndex);
    if (next) {
      selectionKind.current = next.kind;
      selectRange(next.selection);
      setMenuContext(next);
    }
    return next;
  }
  function keyboardContext() {
    if (!active) return;
    const kind = selectionKind.current;
    const target =
      kind === "row"
        ? [
            ...viewport.current!.querySelectorAll<HTMLElement>(
              '[data-slot="spreadsheet-row-number"]',
            ),
          ].find((node) => node.dataset["rowId"] === active.rowId)
        : kind === "column"
          ? [
              ...viewport.current!.querySelectorAll<HTMLElement>(
                '[data-slot="spreadsheet-column"]',
              ),
            ].find((node) => node.dataset["columnId"] === active.columnId)
          : document.getElementById(cellId(rowIndex, columnIndex));
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + Math.min(24, rect.width / 2),
        clientY: rect.top + Math.min(24, rect.height / 2),
      }),
    );
  }
  function selectHeader(kind: "row" | "column", index: number, extend: boolean) {
    if (!rows.length || !columns.length || editing) return;
    const previous = selectionRef.current;
    const anchorRow =
      extend && previous ? rows.findIndex((row) => row.id === previous.anchor.rowId) : index;
    const anchorColumn =
      extend && previous
        ? columns.findIndex((column) => column.id === previous.anchor.columnId)
        : index;
    const next =
      kind === "row"
        ? {
            anchor: { rowId: rows[Math.max(0, anchorRow)]!.id, columnId: columns[0]!.id },
            focus: { rowId: rows[index]!.id, columnId: columns.at(-1)!.id },
          }
        : {
            anchor: { rowId: rows[0]!.id, columnId: columns[Math.max(0, anchorColumn)]!.id },
            focus: { rowId: rows.at(-1)!.id, columnId: columns[index]!.id },
          };
    selectionKind.current = kind;
    selectRange(next);
  }
  function positionAtPoint(x: number, y: number) {
    const node = viewport.current;
    if (!node || !rows.length || !columns.length) return null;
    const rect = node.getBoundingClientRect();
    const inline = locale.direction === "rtl" ? rect.right - x : x - rect.left;
    const logicalX = inline + Math.abs(node.scrollLeft);
    const foundColumn =
      frozen && inline < gutterWidth + widths[0]!
        ? 0
        : offsets.findIndex((offset, index) => logicalX < offset + widths[index]!);
    const block = y - rect.top;
    const row =
      freezeFirstRow && block < rowHeight + effectiveRowHeights[0]!
        ? 0
        : Math.min(rows.length - 1, rowAtOffset(block + node.scrollTop));
    return { row: Math.max(0, row), column: foundColumn < 0 ? columns.length - 1 : foundColumn };
  }
  function rangeFromIndices(
    top: number,
    start: number,
    bottom: number,
    end: number,
  ): SpreadsheetSelection {
    return {
      anchor: { rowId: rows[top]!.id, columnId: columns[start]!.id },
      focus: { rowId: rows[bottom]!.id, columnId: columns[end]!.id },
    };
  }
  function moveGridGesture(x: number, y: number) {
    const gesture = gridGesture.current;
    if (!gesture) return;
    gesture.x = x;
    gesture.y = y;
    const position = positionAtPoint(x, y);
    if (!position) return;
    if (gesture.kind === "fill") {
      const area = selectionBounds(gesture.source, rows, columns);
      if (!area) {
        cancelGridGesture();
        return;
      }
      const vertical = Math.max(area.top - position.row, position.row - area.bottom, 0);
      const horizontal = Math.max(area.start - position.column, position.column - area.end, 0);
      gesture.target =
        vertical >= horizontal
          ? rangeFromIndices(
              Math.min(area.top, position.row),
              area.start,
              Math.max(area.bottom, position.row),
              area.end,
            )
          : rangeFromIndices(
              area.top,
              Math.min(area.start, position.column),
              area.bottom,
              Math.max(area.end, position.column),
            );
      setFillPreview(gesture.target);
    } else {
      const index = gesture.kind === "row" ? position.row : position.column;
      const next =
        gesture.kind === "row"
          ? rangeFromIndices(gesture.anchor, 0, index, columns.length - 1)
          : rangeFromIndices(0, gesture.anchor, rows.length - 1, index);
      if (
        !sameCell(next.anchor, selectionRef.current?.anchor) ||
        !sameCell(next.focus, selectionRef.current?.focus)
      )
        selectRange(next);
    }
  }
  function gestureTick() {
    const gesture = gridGesture.current;
    const node = viewport.current;
    if (!gesture || !node) return;
    const rect = node.getBoundingClientRect();
    const inline = locale.direction === "rtl" ? rect.right - gesture.x : gesture.x - rect.left;
    const heldX = gutterWidth + (frozen ? widths[0]! : 0);
    const heldY = rowHeight + (freezeFirstRow ? effectiveRowHeights[0]! : 0);
    const step = (point: number, start: number, end: number) =>
      point < start + 24 ? -12 : point > end - 24 ? 12 : 0;
    const dx = gesture.kind === "row" ? 0 : step(inline, heldX, node.clientWidth);
    const dy = gesture.kind === "column" ? 0 : step(gesture.y - rect.top, heldY, node.clientHeight);
    if (dx || dy) {
      const beforeX = node.scrollLeft,
        beforeY = node.scrollTop;
      node.scrollLeft += dx * (locale.direction === "rtl" ? -1 : 1);
      node.scrollTop += dy;
      if (node.scrollLeft !== beforeX || node.scrollTop !== beforeY)
        moveGridGesture(gesture.x, gesture.y);
    }
  }
  function startGestureLoop() {
    const tick = () => {
      gestureHandlers.current.tick();
      if (gridGesture.current) gestureFrame.current = requestAnimationFrame(tick);
    };
    gestureFrame.current = requestAnimationFrame(tick);
  }
  function clearGridGesture() {
    const gesture = gridGesture.current;
    gridGesture.current = null;
    if (gestureFrame.current !== null) cancelAnimationFrame(gestureFrame.current);
    gestureFrame.current = null;
    setFillPreview(null);
    setHeaderDragging(null);
    if (gesture && viewport.current?.hasPointerCapture(gesture.pointerId))
      viewport.current.releasePointerCapture(gesture.pointerId);
    return gesture;
  }
  function cancelGridGesture() {
    const gesture = clearGridGesture();
    if (gesture && gesture.kind !== "fill") {
      selectionKind.current = gesture.originalKind;
      selectionRef.current = gesture.original;
      setLocalSelection(gesture.original);
      onSelectionChange?.(gesture.original);
    }
  }
  async function endGridGesture() {
    const gesture = gridGesture.current;
    if (!gesture) return;
    const rowIds = rows.map((row) => row.id),
      columnIds = columns.map((column) => column.id);
    if (
      gesture.rowIds.some((id, index) => id !== rowIds[index]) ||
      gesture.rowIds.length !== rowIds.length ||
      gesture.columnIds.some((id, index) => id !== columnIds[index]) ||
      gesture.columnIds.length !== columnIds.length
    ) {
      cancelGridGesture();
      return;
    }
    clearGridGesture();
    if (gesture.kind !== "fill") return;
    if (gesture.sourceValues.some((cell) => value(cell) !== cell.value)) {
      setFailure("The fill source changed. Select it again before filling.");
      return;
    }
    if (await commitFill(gesture.source, gesture.target)) selectRange(gesture.target);
  }
  function startHeaderDrag(
    event: ReactPointerEvent<HTMLElement>,
    kind: "row" | "column",
    index: number,
  ) {
    if (event.button !== 0 || event.ctrlKey || editing || busy) return;
    event.preventDefault();
    event.stopPropagation();
    const original = selectionRef.current;
    const originalKind = selectionKind.current;
    const anchor =
      event.shiftKey && original
        ? kind === "row"
          ? rows.findIndex((row) => row.id === original.anchor.rowId)
          : columns.findIndex((column) => column.id === original.anchor.columnId)
        : index;
    selectHeader(kind, index, event.shiftKey);
    gridGesture.current = {
      kind,
      pointerId: event.pointerId,
      original,
      originalKind,
      anchor: Math.max(0, anchor),
      x: event.clientX,
      y: event.clientY,
      rowIds: rows.map((row) => row.id),
      columnIds: columns.map((column) => column.id),
    };
    setHeaderDragging(kind);
    suppressHeaderClick.current = true;
    viewport.current?.setPointerCapture(event.pointerId);
    startGestureLoop();
  }
  function startFillDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || !chosen || !range || busy || editing || readOnly || !onChange) return;
    event.preventDefault();
    event.stopPropagation();
    gridGesture.current = {
      kind: "fill",
      pointerId: event.pointerId,
      source: chosen,
      target: chosen,
      sourceValues: selectedEdits((row, column) => rows[row]!.values[columns[column]!.id] ?? ""),
      x: event.clientX,
      y: event.clientY,
      rowIds: rows.map((row) => row.id),
      columnIds: columns.map((column) => column.id),
    };
    setFillPreview(chosen);
    viewport.current?.setPointerCapture(event.pointerId);
    focusGrid();
    startGestureLoop();
  }
  gestureHandlers.current = {
    move: (event: PointerEvent) => {
      if (gridGesture.current?.pointerId === event.pointerId)
        moveGridGesture(event.clientX, event.clientY);
    },
    end: (event: PointerEvent) => {
      if (gridGesture.current?.pointerId === event.pointerId) void endGridGesture();
    },
    cancel: () => cancelGridGesture(),
    tick: gestureTick,
  };
  const hiddenRowsDisabledReason =
    hiddenRowIds !== undefined && !onHiddenRowIdsChange
      ? "Hidden rows are managed by this view."
      : undefined;
  const hiddenColumnsDisabledReason =
    hiddenColumnIds !== undefined && !onHiddenColumnIdsChange
      ? "Hidden columns are managed by this view."
      : undefined;
  function setHidden(kind: "row" | "column", ids: readonly string[]) {
    if (kind === "row" ? hiddenRowsDisabledReason : hiddenColumnsDisabledReason) return;
    const next = {
      rows: hiddenRows,
      columns: hiddenColumns,
      [kind === "row" ? "rows" : "columns"]: ids,
    };
    setLocalHidden((current) => ({ ...current, [activeSheetId ?? ""]: next }));
    (kind === "row" ? onHiddenRowIdsChange : onHiddenColumnIdsChange)?.(ids);
    const nextView = spreadsheetView(allRows, allColumns, next.rows, next.columns);
    const current = selectionRef.current;
    if (current && !selectionBounds(current, nextView.rows, nextView.columns)) {
      const firstRow = nextView.rows[0];
      const firstColumn = nextView.columns[0];
      const cell =
        firstRow && firstColumn ? { rowId: firstRow.id, columnId: firstColumn.id } : null;
      const selected = cell ? { anchor: cell, focus: cell } : null;
      selectionRef.current = selected;
      setLocalSelection(selected);
      onSelectionChange?.(selected);
    }
  }
  function updateRowHeights(next: Readonly<Record<string, number>>) {
    if (heightDisabledReason || busy) return;
    if (rowHeights === undefined)
      setLocalRowHeightsBySheet((current) => ({ ...current, [activeSheetId ?? ""]: next }));
    onRowHeightsChange?.(next);
  }
  function rowResizeIds(index: number) {
    return contextFor("row", index, 0)?.rowIds ?? [rows[index]!.id];
  }
  function resizeRows(ids: readonly string[], height: number) {
    const nextHeight = clampRowHeight(height);
    updateRowHeights({
      ...rowHeightOverrides,
      ...Object.fromEntries(ids.map((id) => [id, nextHeight])),
    });
    if (!heightDisabledReason && !busy)
      announce(`${ids.length === 1 ? "Row height" : "Selected row heights"} ${nextHeight} pixels.`);
  }
  function fitRows(ids: readonly string[]) {
    updateRowHeights({
      ...rowHeightOverrides,
      ...Object.fromEntries(
        ids.map((id) => {
          const index = rows.findIndex((row) => row.id === id);
          return [id, clampRowHeight(rowMeasurements.heights[index] ?? rowHeight)];
        }),
      ),
    });
  }
  function automaticRows(ids: readonly string[]) {
    const next = { ...rowHeightOverrides };
    ids.forEach((id) => delete next[id]);
    updateRowHeights(next);
  }
  function startRowResize(event: ReactPointerEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    event.stopPropagation();
    if (event.button !== 0 || heightDisabledReason || busy || editing) return;
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    rowResize.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: effectiveRowHeights[index]!,
      ids: rowResizeIds(index),
      heights: rowHeightOverrides,
    };
  }
  function moveRowResize(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = rowResize.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const height = clampRowHeight(drag.startHeight + event.clientY - drag.startY);
    drag.heights = {
      ...rowHeightOverrides,
      ...Object.fromEntries(drag.ids.map((id) => [id, height])),
    };
    setRowHeightPreview(drag.heights);
  }
  function endRowResize(event: ReactPointerEvent<HTMLDivElement>, commit: boolean) {
    const drag = rowResize.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    rowResize.current = null;
    setRowHeightPreview(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (commit && drag.heights !== rowHeightOverrides) updateRowHeights(drag.heights);
  }
  function openSize(kind: "row" | "column", ids: readonly string[]) {
    const index =
      kind === "row"
        ? rows.findIndex((row) => row.id === ids[0])
        : columns.findIndex((column) => column.id === ids[0]);
    setSizeInput(
      String(
        (kind === "row" ? effectiveRowHeights[index] : widths[index]) ??
          (kind === "row" ? rowHeight : 180),
      ),
    );
    setSizeDialog({ kind, ids });
  }
  function applySize() {
    if (!sizeDialog) return;
    const size = Number(sizeInput);
    const minimum = sizeDialog.kind === "row" ? MIN_ROW_HEIGHT : MIN_WIDTH;
    const maximum = sizeDialog.kind === "row" ? MAX_ROW_HEIGHT : MAX_WIDTH;
    if (!Number.isFinite(size) || size < minimum || size > maximum) return;
    if (sizeDialog.kind === "column")
      updateWidths({
        ...(columnWidths ?? localWidths),
        ...Object.fromEntries(sizeDialog.ids.map((id) => [id, size])),
      });
    else resizeRows(sizeDialog.ids, size);
    setSizeDialog(null);
  }
  function clipboardMenu(context: SpreadsheetMenuContext) {
    const source = context.rowIds.flatMap((rowId) =>
      context.columnIds.map((columnId) => ({ rowId, columnId })),
    );
    const cutDisabled = busy || editing || !source.length || source.some((cell) => !canWrite(cell));
    return (
      <>
        <DropdownMenuItem
          shortcut="Mod+X"
          disabled={cutDisabled}
          onClick={() => void copy("cut", context.selection)}
        >
          <Scissors aria-hidden />
          Cut
        </DropdownMenuItem>
        <DropdownMenuItem
          shortcut="Mod+C"
          disabled={editing}
          onClick={() => void copy("copy", context.selection)}
        >
          <Copy aria-hidden />
          Copy
        </DropdownMenuItem>
        <DropdownMenuItem
          shortcut="Mod+V"
          disabled={busy || editing || readOnly || !onChange}
          onClick={() => void pasteClipboard(false, context.selection)}
        >
          <ClipboardPaste aria-hidden />
          Paste
        </DropdownMenuItem>
        <DropdownMenuItem
          shortcut="Mod+Shift+V"
          disabled={busy || editing || readOnly || !onChange}
          onClick={() => void pasteClipboard(true, context.selection)}
        >
          <ClipboardPaste aria-hidden />
          Paste values
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busy || editing || !source.some(canWrite)}
          onClick={() => void write(selectedEdits(() => "", context.selection))}
        >
          <Eraser aria-hidden />
          Clear values
        </DropdownMenuItem>
        {onClearFormatting ? (
          <DropdownMenuItem
            disabled={busy || editing || readOnly}
            onClick={() => onClearFormatting(context)}
          >
            <Eraser aria-hidden />
            Clear formatting
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          disabled={busy || editing || readOnly || !onChange || context.rowIds.length < 2}
          onClick={() => fill("down", context.selection)}
        >
          <ArrowDown aria-hidden />
          Fill down
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={busy || editing || readOnly || !onChange || context.columnIds.length < 2}
          onClick={() => fill("right", context.selection)}
        >
          <ArrowRight aria-hidden />
          Fill right
        </DropdownMenuItem>
      </>
    );
  }
  function visibilityMenu(context: SpreadsheetMenuContext) {
    if (context.kind === "row")
      return (
        <>
          <DropdownMenuItem
            disabledReason={heightDisabledReason}
            onClick={() => openSize("row", context.rowIds)}
          >
            Row height…
          </DropdownMenuItem>
          <DropdownMenuItem
            disabledReason={heightDisabledReason}
            onClick={() => fitRows(context.rowIds)}
          >
            Fit to data
          </DropdownMenuItem>
          <DropdownMenuItem
            disabledReason={heightDisabledReason}
            disabled={!context.rowIds.some((id) => rowHeightOverrides[id] !== undefined)}
            onClick={() => automaticRows(context.rowIds)}
          >
            Automatic row height
          </DropdownMenuItem>
          <DropdownMenuItem
            disabledReason={
              hiddenRowsDisabledReason ??
              (context.rowIds.length >= rows.length ? "Keep at least one visible row." : undefined)
            }
            onClick={() => setHidden("row", [...new Set([...hiddenRows, ...context.rowIds])])}
          >
            Hide selected rows
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hiddenRows.length}
            disabledReason={hiddenRowsDisabledReason}
            onClick={() => setHidden("row", [])}
          >
            Unhide all rows
          </DropdownMenuItem>
        </>
      );
    return (
      <>
        <DropdownMenuItem
          disabledReason={widthDisabledReason}
          onClick={() => openSize("column", context.columnIds)}
        >
          Column width…
        </DropdownMenuItem>
        <DropdownMenuItem
          disabledReason={widthDisabledReason}
          onClick={() =>
            updateWidths({
              ...(columnWidths ?? localWidths),
              ...Object.fromEntries(
                context.columnIds.map((id) => [
                  id,
                  autofitWidth(columns.findIndex((column) => column.id === id)),
                ]),
              ),
            })
          }
        >
          Autofit column
        </DropdownMenuItem>
        <DropdownMenuItem
          disabledReason={
            hiddenColumnsDisabledReason ??
            (context.columnIds.length >= columns.length
              ? "Keep at least one visible column."
              : undefined)
          }
          onClick={() =>
            setHidden("column", [...new Set([...hiddenColumns, ...context.columnIds])])
          }
        >
          Hide selected columns
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!hiddenColumns.length}
          disabledReason={hiddenColumnsDisabledReason}
          onClick={() => setHidden("column", [])}
        >
          Unhide all columns
        </DropdownMenuItem>
        {freezeMenuItem}
      </>
    );
  }
  function onGridKey(event: KeyboardEvent<HTMLDivElement>) {
    if (
      !draft &&
      !formulaDraft &&
      (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))
    ) {
      event.preventDefault();
      event.stopPropagation();
      keyboardContext();
      return;
    }
    if (
      event.target !== event.currentTarget ||
      event.nativeEvent.isComposing ||
      draft ||
      formulaDraft
    )
      return;
    const mod = event.ctrlKey || event.metaKey;
    if (mod && !event.shiftKey && ["d", "r"].includes(event.key.toLowerCase())) {
      event.preventDefault();
      fill(event.key.toLowerCase() === "d" ? "down" : "right");
      return;
    }
    if (mod && event.shiftKey && event.key.toLowerCase() === "v") {
      event.preventDefault();
      void pasteClipboard(true);
      return;
    }
    if (event.key === "Escape" && copied.current?.kind === "cut") {
      event.preventDefault();
      copied.current = null;
      refreshClipboard((version) => version + 1);
      return;
    }
    if (event.altKey && event.key === "Enter" && active && onOpenRow) {
      event.preventDefault();
      onOpenRow(active.rowId);
      return;
    }
    if (
      event.altKey &&
      event.shiftKey &&
      (event.key === "ArrowUp" || event.key === "ArrowDown") &&
      rowIndex >= 0
    ) {
      event.preventDefault();
      resizeRows(
        rowResizeIds(rowIndex),
        effectiveRowHeights[rowIndex]! + (event.key === "ArrowDown" ? 8 : -8),
      );
      return;
    }
    if (event.altKey && event.key === "ArrowDown" && activeColumn) {
      event.preventDefault();
      void openColumnMenu(activeColumn.id);
      return;
    }
    if (
      event.altKey &&
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      columnIndex >= 0
    ) {
      event.preventDefault();
      resize(
        columnIndex,
        widths[columnIndex]! +
          (event.key === "ArrowRight" ? 16 : -16) * (locale.direction === "rtl" ? -1 : 1),
      );
      return;
    }
    if (event.key === " " && active && (mod || event.shiftKey)) {
      event.preventDefault();
      selectionKind.current = mod ? "column" : "row";
      selectRange(
        mod
          ? {
              anchor: { ...active, rowId: rows[0]!.id },
              focus: { ...active, rowId: rows.at(-1)!.id },
            }
          : {
              anchor: { ...active, columnId: columns[0]!.id },
              focus: { ...active, columnId: columns.at(-1)!.id },
            },
      );
      return;
    }
    if (mod && event.key.toLowerCase() === "a" && first && rows.at(-1) && columns.at(-1)) {
      event.preventDefault();
      selectRange({
        anchor: first,
        focus: { rowId: rows.at(-1)!.id, columnId: columns.at(-1)!.id },
      });
      return;
    }
    if (mod && event.key.toLowerCase() === "z") {
      const command = event.shiftKey
        ? canRedo
          ? onRedo
          : undefined
        : canUndo
          ? onUndo
          : undefined;
      if (command && !busy) {
        event.preventDefault();
        command();
      }
      return;
    }
    const lateral = locale.direction === "rtl" ? -1 : 1;
    const movement: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -lateral],
      ArrowRight: [0, lateral],
      PageUp: [-Math.max(1, Math.floor(view.height / rowHeight) - 1), 0],
      PageDown: [Math.max(1, Math.floor(view.height / rowHeight) - 1), 0],
    };
    const delta = movement[event.key];
    if (delta) {
      event.preventDefault();
      selectCell(
        Math.max(0, focusRowIndex) + delta[0],
        Math.max(0, focusColumnIndex) + delta[1],
        event.shiftKey,
      );
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const end = event.key === "End";
      selectCell(
        mod ? (end ? rows.length - 1 : 0) : Math.max(0, focusRowIndex),
        end ? columns.length - 1 : 0,
        event.shiftKey,
      );
    } else if (event.key === "Enter" || event.key === "F2" || event.key === " ") {
      event.preventDefault();
      begin();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      void write(selectedEdits(() => ""));
    } else if (!mod && !event.altKey && event.key.length === 1) {
      event.preventDefault();
      begin(event.key);
    }
  }
  function editorKey(event: KeyboardEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('[role="dialog"], [role="listbox"]')) return;
    event.stopPropagation();
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (busy) {
      if (event.key === "Enter" || event.key === "Escape") event.preventDefault();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }
    if (event.key === "Enter" && event.altKey) {
      if (event.target instanceof HTMLTextAreaElement) {
        event.preventDefault();
        const control = event.target;
        const start = control.selectionStart;
        const nextValue = `${control.value.slice(0, start)}\n${control.value.slice(control.selectionEnd)}`;
        const current = draftRef.current ?? formulaDraftRef.current;
        if (current) {
          const next = { ...current, value: nextValue };
          if (control === formula.current) {
            formulaDraftRef.current = next;
            setFormulaDraft(next);
          } else {
            draftRef.current = next;
            setDraft(next);
          }
          queueMicrotask(() => control.setSelectionRange(start + 1, start + 1));
        }
      }
      return;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      void finish(
        event.currentTarget === formula.current && event.key === "Enter"
          ? undefined
          : event.key === "Tab"
            ? nextCell(event.shiftKey ? -1 : 1)
            : {
                row: Math.min(rows.length - 1, rowIndex + (event.shiftKey ? -1 : 1)),
                column: columnIndex,
              },
      );
    }
  }
  function updateWidths(updated: Readonly<Record<string, number>>) {
    if (widthDisabledReason || busy) return;
    if (columnWidths === undefined)
      setLocalWidthsBySheet((current) => ({ ...current, [activeSheetId ?? ""]: updated }));
    onColumnWidthsChange?.(updated);
  }
  function columnResizeIds(index: number) {
    return contextFor("column", 0, index)?.columnIds ?? [columns[index]!.id];
  }
  function resize(column: number, width: number) {
    updateWidths({
      ...widthOverrides,
      ...Object.fromEntries(columnResizeIds(column).map((id) => [id, clampWidth(width)])),
    });
  }
  function fitColumns(index: number) {
    updateWidths({
      ...widthOverrides,
      ...Object.fromEntries(
        columnResizeIds(index).map((id) => [
          id,
          autofitWidth(columns.findIndex((column) => column.id === id)),
        ]),
      ),
    });
  }
  function startColumnResize(event: ReactPointerEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    event.stopPropagation();
    if (event.button !== 0 || widthDisabledReason || busy || editing) return;
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    columnResize.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: widths[index]!,
      ids: columnResizeIds(index),
      widths: widthOverrides,
    };
  }
  function moveColumnResize(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = columnResize.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const width = clampWidth(
      Math.round(
        drag.startWidth + (event.clientX - drag.startX) * (locale.direction === "rtl" ? -1 : 1),
      ),
    );
    drag.widths = { ...widthOverrides, ...Object.fromEntries(drag.ids.map((id) => [id, width])) };
    setColumnWidthPreview(drag.widths);
  }
  function endColumnResize(event: ReactPointerEvent<HTMLDivElement>, commit: boolean) {
    const drag = columnResize.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    columnResize.current = null;
    setColumnWidthPreview(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (commit && drag.widths !== widthOverrides) updateWidths(drag.widths);
  }
  function autofitWidth(columnIndex: number) {
    const column = columns[columnIndex]!;
    const node = viewport.current;
    if (!node) return widths[columnIndex]!;
    const context = document.createElement("canvas").getContext("2d");
    if (!context) return widths[columnIndex]!;
    const style = getComputedStyle(node);
    const space = parseFloat(style.getPropertyValue("--ds-space-100")) || 8;
    const measure = (text: string, format?: SpreadsheetCellStyle, weight?: string) => {
      const size = format?.fontSize ? `${format.fontSize * (4 / 3)}px` : style.fontSize;
      context.font = `${format?.italic ? "italic " : ""}${weight ?? (format?.bold ? "600" : style.fontWeight)} ${size} ${format?.fontFamily ?? style.fontFamily}`;
      let width = 0;
      for (const line of text.split(/\r?\n/))
        width = Math.max(width, context.measureText(line).width);
      return width;
    };
    // Reserve the header's letter, menu trigger, resize handle, padding and optional lock.
    let width = measure(column.label, undefined, "500") + space * (column.readOnly ? 12 : 10);
    for (const row of rows) {
      const cell = { rowId: row.id, columnId: column.id };
      const raw = row.values[column.id] ?? "";
      const shown =
        displayValue?.(cell, raw) ??
        (column.type === "choice"
          ? (column.options?.find((option) => option.value === raw)?.label ?? raw)
          : raw);
      width = Math.max(width, measure(shown, getCellStyle?.(cell)) + space * 2 + 2);
      if (width >= MAX_WIDTH) break;
    }
    return clampWidth(Math.ceil(width));
  }
  function autofitAll() {
    updateWidths({
      ...widthOverrides,
      ...Object.fromEntries(columns.map((column, index) => [column.id, autofitWidth(index)])),
    });
  }
  function resetWidths() {
    updateWidths({
      ...widthOverrides,
      ...Object.fromEntries(columns.map((column) => [column.id, resetWidth(column.id)])),
    });
  }
  function toggleFreeze() {
    if (freezeDisabledReason) return;
    const next = !freezeIdentity;
    setLocalFreezeFirstColumn(next);
    onFreezeFirstColumnChange?.(next);
  }
  async function openColumnMenu(columnId: string | null) {
    if (busy) return;
    if ((draftRef.current || formulaDraftRef.current) && !(await finish(undefined, false))) return;
    if (!alive.current) return;
    if (columnId !== null) {
      const context = contextFor(
        "column",
        0,
        columns.findIndex((column) => column.id === columnId),
      );
      if (context) {
        setMenuContext(context);
        selectionKind.current = "column";
        selectRange(context.selection);
      }
    }
    setOpenColumnId(columnId);
    setColumnsMenuOpen(columnId === null);
  }
  const freezeMenuItem = (
    <DropdownMenuItem disabledReason={freezeDisabledReason} onClick={toggleFreeze}>
      {freezeIdentity ? "Unfreeze first column" : "Freeze first column"}
    </DropdownMenuItem>
  );
  const rangeTop = range?.top;
  const rangeBottom = range?.bottom;
  const rangeStart = range?.start;
  const rangeEnd = range?.end;
  const statistics = useMemo(() => {
    let count = 0;
    let sum = 0;
    let numericCount = 0;
    if (
      rangeTop !== undefined &&
      rangeBottom !== undefined &&
      rangeStart !== undefined &&
      rangeEnd !== undefined
    ) {
      for (let r = rangeTop; r <= rangeBottom; r++) {
        const row = rows[r]!;
        for (let c = rangeStart; c <= rangeEnd; c++) {
          const column = columns[c]!;
          const raw = row.values[column.id] ?? "";
          const shown = displayValue?.({ rowId: row.id, columnId: column.id }, raw) ?? raw;
          count++;
          if (shown.trim() && Number.isFinite(Number(shown))) {
            sum += Number(shown);
            numericCount++;
          }
        }
      }
    }
    return { count, sum, numericCount };
  }, [rows, columns, displayValue, rangeTop, rangeBottom, rangeStart, rangeEnd]);
  const summary = statistics.numericCount
    ? `Sum ${locale.formatNumber(statistics.sum)} · Average ${locale.formatNumber(statistics.sum / statistics.numericCount)}`
    : "";
  const contiguousRows =
    range &&
    rowNumbers
      .slice(range.top, range.bottom + 1)
      .every((number, index) => number === rowNumbers[range.top]! + index);
  const coordinates = range
    ? `${columnName(columnNumbers[range.start]!)}${rowNumbers[range.top]}${range.start !== range.end || range.top !== range.bottom ? `${contiguousRows ? ":" : " … "}${columnName(columnNumbers[range.end]!)}${rowNumbers[range.bottom]}` : ""}`
    : "No selection";
  const cellFailure = active ? getCellError?.(active) : undefined;
  const draftText =
    formulaDraft && sameCell(formulaDraft.cell, active)
      ? formulaDraft.value
      : draft && sameCell(draft.cell, active)
        ? draft.value
        : activeValue;
  const editing = !!draft || !!formulaDraft;
  const fillBounds = selectionBounds(fillPreview, rows, columns);
  const handleInline = range
    ? offsets[range.end]! + widths[range.end]! + (frozen && range.end === 0 ? view.left : 0)
    : 0;
  const handleTop = range
    ? rowOffsets[range.bottom]! +
      effectiveRowHeights[range.bottom]! +
      (freezeFirstRow && range.bottom === 0 ? view.top : 0)
    : 0;
  const showFillHandle =
    !!range &&
    !readOnly &&
    !!onChange &&
    !busy &&
    !editing &&
    (range.end === 0 || handleInline > view.left + gutterWidth + (frozen ? widths[0]! : 0)) &&
    (range.bottom === 0 ||
      handleTop > view.top + rowHeight + (freezeFirstRow ? effectiveRowHeights[0]! : 0));

  const contextRow = menuContext ? rowById.get(menuContext.cell.rowId) : undefined;
  const contextColumn = menuContext ? columnById.get(menuContext.cell.columnId) : undefined;
  const contextHostItems =
    menuContext?.kind === "cell"
      ? renderCellMenu?.(menuContext)
      : menuContext?.kind === "row" && contextRow
        ? renderRowMenu?.(contextRow, menuContext)
        : menuContext?.kind === "column" && contextColumn
          ? renderColumnMenu?.(contextColumn, menuContext)
          : null;
  function customColumnMenu(column: number) {
    const context = contextFor("column", 0, column);
    const items = context && renderColumnMenu?.(columns[column]!, context);
    return items ? (
      <>
        <DropdownMenuSeparator />
        {items}
      </>
    ) : null;
  }

  return (
    <div
      {...props}
      className={cn("min-w-0", className)}
      style={style}
      data-slot="spreadsheet"
      data-density={density}
      data-fill-available={fillAvailable || undefined}
      data-header-display={headerDisplay}
      data-filling={!!fillPreview || undefined}
      data-selecting={headerDragging ?? undefined}
    >
      <SpreadsheetToolbar label={`${label} actions`}>
        {toolbarStart ? (
          <>
            {toolbarStart}
            <Separator orientation="vertical" isDecorative />
          </>
        ) : null}
        {onUndo ? (
          <IconButton
            label="Undo"
            size="small"
            variant="subtle"
            disabledReason={
              editing
                ? "Finish editing the current cell first."
                : !canUndo
                  ? "There is no change to undo."
                  : busy
                    ? "Wait for the current change."
                    : undefined
            }
            onClick={onUndo}
            icon={<Undo2 />}
          />
        ) : null}
        {onRedo ? (
          <IconButton
            label="Redo"
            size="small"
            variant="subtle"
            disabledReason={
              editing
                ? "Finish editing the current cell first."
                : !canRedo
                  ? "There is no change to redo."
                  : busy
                    ? "Wait for the current change."
                    : undefined
            }
            onClick={onRedo}
            icon={<Redo2 />}
          />
        ) : null}
        {!readOnly && onChange ? (
          <IconButton
            label="Cut"
            icon={<Scissors />}
            size="small"
            variant="subtle"
            disabled={
              !range || busy || editing || selectedEdits(() => "").some((cell) => !canWrite(cell))
            }
            onClick={() => void copy("cut")}
          />
        ) : null}
        <IconButton
          label="Copy"
          size="small"
          variant="subtle"
          icon={<Copy />}
          onClick={() => void copy()}
          disabled={!range || editing}
        />
        {!readOnly && onChange ? (
          <>
            <IconButton
              label="Paste"
              icon={<ClipboardPaste />}
              size="small"
              variant="subtle"
              disabled={!range || busy || editing}
              onClick={() => void pasteClipboard()}
            />
            <IconButton
              label="Fill down"
              size="small"
              variant="subtle"
              icon={<ArrowDown />}
              disabledReason={
                editing
                  ? "Finish editing the current cell first."
                  : !range || range.top === range.bottom
                    ? "Select more than one row to fill down."
                    : busy
                      ? "Wait for the current change."
                      : undefined
              }
              onClick={() => fill("down")}
            />
            <IconButton
              label="Fill right"
              size="small"
              variant="subtle"
              icon={<ArrowRight />}
              disabledReason={
                editing
                  ? "Finish editing the current cell first."
                  : !range || range.start === range.end
                    ? "Select more than one column to fill right."
                    : busy
                      ? "Wait for the current change."
                      : undefined
              }
              onClick={() => fill("right")}
            />
            <IconButton
              label="Clear cells"
              icon={<Eraser />}
              size="small"
              variant="subtle"
              disabled={!range || busy || editing}
              onClick={() => void write(selectedEdits(() => ""))}
            />
          </>
        ) : (
          <span data-slot="spreadsheet-mode">
            <Lock aria-hidden />
            Read only
          </span>
        )}
        <DropdownMenu
          open={columnsMenuOpen}
          onOpenChange={(open) => {
            if (open) void openColumnMenu(null);
            else setColumnsMenuOpen(false);
          }}
        >
          <DropdownMenuTrigger
            render={
              <Button
                size="small"
                variant="subtle"
                iconBefore={<Columns3 />}
                iconAfter={<ChevronDown />}
                disabled={!columns.length || busy}
                data-spreadsheet-edit-action={uid}
              >
                Columns
              </Button>
            }
          />
          <DropdownMenuContent>
            <DropdownMenuItem disabledReason={widthDisabledReason} onClick={autofitAll}>
              Autofit all columns
            </DropdownMenuItem>
            <DropdownMenuItem disabledReason={widthDisabledReason} onClick={resetWidths}>
              Reset column widths
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!hiddenRows.length}
              disabledReason={hiddenRowsDisabledReason}
              onClick={() => setHidden("row", [])}
            >
              Unhide all rows
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!hiddenColumns.length}
              disabledReason={hiddenColumnsDisabledReason}
              onClick={() => setHidden("column", [])}
            >
              Unhide all columns
            </DropdownMenuItem>
            {freezeMenuItem}
          </DropdownMenuContent>
        </DropdownMenu>
        {actions ? (
          <>
            <Separator orientation="vertical" isDecorative />
            {actions}
          </>
        ) : null}
      </SpreadsheetToolbar>
      <div data-slot="spreadsheet-formula">
        <Input
          size="small"
          aria-label="Go to cell"
          value={addressDraft ?? address}
          placeholder="A1"
          onChange={(event) => setAddressDraft(event.target.value)}
          onBlur={() => setAddressDraft(null)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const target = parseAddress(addressDraft ?? address);
            const visibleRow = target ? rowNumbers.indexOf(target.row + 1) : -1;
            const visibleColumn = target ? columnNumbers.indexOf(target.column) : -1;
            if (!target || visibleRow < 0 || visibleColumn < 0) {
              setFailure("Enter a cell address in the current view.");
              return;
            }
            setFailure(null);
            void finish({ row: visibleRow, column: visibleColumn });
          }}
        />
        <span data-slot="spreadsheet-function" aria-hidden>
          ƒx
        </span>
        <CellTextEditor
          ref={formula}
          aria-label={address ? `Value or formula for ${address}` : "Value or formula"}
          value={draftText}
          readOnly={!activeWritable || busy || !active}
          aria-invalid={!!cellFailure || !!failure}
          aria-describedby={cellFailure || failure ? `${uid}-error` : `${uid}-help`}
          onFocus={() => {
            if (!active || !activeWritable || busy || dateEntryError.current) return;
            const next = draftRef.current ??
              formulaDraftRef.current ?? { cell: active, value: activeValue };
            draftRef.current = null;
            formulaDraftRef.current = next;
            setDraft(null);
            setFormulaDraft(next);
          }}
          onBlur={leaveEditor}
          onChange={(event) => {
            if (!active) return;
            dateEntryError.current = null;
            setDateTextDirty(false);
            setFailure(null);
            const next = { cell: active, value: event.target.value };
            draftRef.current = null;
            formulaDraftRef.current = next;
            setDraft(null);
            setFormulaDraft(next);
          }}
          onKeyDown={editorKey}
        />
        {editing ? (
          <>
            <IconButton
              label="Apply cell edit"
              size="small"
              variant="subtle"
              disabled={busy}
              data-spreadsheet-edit-action={uid}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => void finish()}
              icon={<Check />}
            />
            <IconButton
              label="Cancel cell edit"
              size="small"
              variant="subtle"
              disabled={busy}
              data-spreadsheet-edit-action={uid}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => cancel()}
              icon={<X />}
            />
          </>
        ) : null}
      </div>
      {failure || cellFailure || error ? (
        <Alert role="alert" tone="danger" id={`${uid}-error`}>
          <AlertDescription>{failure ?? cellFailure ?? error}</AlertDescription>
          {failed.current ? (
            <Button
              size="small"
              data-spreadsheet-edit-action={uid}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                const edits = failed.current;
                if (edits)
                  void write(edits, failedStrict.current).then((saved) => {
                    if (saved) cancel();
                  });
              }}
              isLoading={saving}
            >
              Retry change
            </Button>
          ) : !failure && onRetry ? (
            <Button size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </Alert>
      ) : null}
      <VisuallyHidden id={`${uid}-help`}>
        Arrow keys move between cells. Shift and arrows select a range. Alt and Down opens the
        column menu. Alt and Left or Right resizes the column. Alt, Shift and Up or Down resizes the
        row. Enter or F2 edits. While editing in a cell, Enter saves and moves down, Tab saves and
        moves across, Alt and Enter adds a line break, and Escape cancels. Leaving the editor saves
        without moving focus. Enter in the formula bar saves the current cell. Control or Command D
        fills down and R fills right. Drag the selection handle to repeat values or formulas; Escape
        cancels. Drag row or column headings to select ranges. Copy and paste use your browser
        shortcuts. Tab leaves the grid when you are not editing.
      </VisuallyHidden>
      <DirectionProvider direction={locale.direction}>
        <ContextMenu.Root
          open={contextOpen}
          disabled={busy}
          onOpenChange={(open, details) => {
            if (open) {
              if (
                draftRef.current ||
                formulaDraftRef.current ||
                !prepareContext(details.event.target)
              ) {
                details.cancel();
                return;
              }
            }
            setContextOpen(open);
          }}
        >
          <ContextMenu.Trigger
            ref={viewport}
            data-slot="spreadsheet-viewport"
            role="grid"
            aria-label={label}
            aria-describedby={`${uid}-help`}
            aria-rowcount={Math.max(1, rows.length) + 1}
            aria-colcount={allColumns.length + 1}
            aria-multiselectable
            aria-readonly={readOnly || !onChange}
            aria-busy={busy}
            aria-activedescendant={
              !draft && rowIndex >= 0 && columnIndex >= 0
                ? cellId(rowIndex, columnIndex)
                : undefined
            }
            tabIndex={0}
            style={{ height }}
            onKeyDown={onGridKey}
            onLostPointerCapture={() => {
              if (gridGesture.current) cancelGridGesture();
            }}
            onContextMenuCapture={(event) => {
              if (!draftRef.current && !formulaDraftRef.current) return;
              if (!event.currentTarget.contains(event.target as Node)) return;
              event.preventDefault();
              event.stopPropagation();
              const target = event.target as HTMLElement;
              const cell = target.closest<HTMLElement>(
                '[data-slot="spreadsheet-cell"], [data-slot="spreadsheet-column"], [data-slot="spreadsheet-row-number"]',
              );
              const x = event.clientX,
                y = event.clientY;
              void finish(undefined, false).then((saved) => {
                if (saved && cell?.isConnected)
                  cell.dispatchEvent(
                    new MouseEvent("contextmenu", {
                      bubbles: true,
                      cancelable: true,
                      clientX: x,
                      clientY: y,
                    }),
                  );
              });
            }}
            onFocus={(event) => {
              if (event.target === event.currentTarget && !selectionRef.current && first)
                selectCell(0, 0);
            }}
            onScroll={(event) => {
              const node = event.currentTarget;
              setView({
                top: node.scrollTop,
                left: Math.abs(node.scrollLeft),
                width: node.clientWidth,
                height: node.clientHeight,
              });
            }}
            onCopy={(event) => {
              if (editing || event.target !== event.currentTarget) return;
              event.clipboardData.setData("text/plain", rememberCopy() ?? "");
              event.preventDefault();
            }}
            onCut={(event) => {
              if (editing || event.target !== event.currentTarget) return;
              event.preventDefault();
              const text = rememberCopy("cut");
              if (text !== null) event.clipboardData.setData("text/plain", text);
            }}
            onPaste={(event) => {
              if (editing || event.target !== event.currentTarget) return;
              event.preventDefault();
              void paste(event.clipboardData.getData("text/plain"));
            }}
          >
            <div
              data-slot="spreadsheet-canvas"
              style={
                {
                  width: Math.max(totalWidth, view.width),
                  height: Math.max(totalHeight, view.height - 2),
                  "--spreadsheet-grid-columns": `linear-gradient(to ${locale.direction === "rtl" ? "left" : "right"}, transparent calc(${token("space.600")} - var(--ds-border-width)), var(--ds-color-border) calc(${token("space.600")} - var(--ds-border-width)), var(--ds-color-border) ${token("space.600")}, transparent ${token("space.600")}, ${widths.map((width, index) => `transparent ${offsets[index]! + width - 1}px, var(--ds-color-border) ${offsets[index]! + width - 1}px, var(--ds-color-border) ${offsets[index]! + width}px, transparent ${offsets[index]! + width}px`).join(", ")}, transparent ${totalWidth}px)`,
                } as CSSProperties
              }
            >
              <div data-slot="spreadsheet-header" role="row" aria-rowindex={1}>
                <div role="columnheader" data-slot="spreadsheet-corner">
                  <VisuallyHidden>Row</VisuallyHidden>
                </div>
                {visibleColumns.map((column) => (
                  <div
                    key={columns[column]!.id}
                    role="columnheader"
                    aria-colindex={columnNumbers[column]! + 2}
                    data-slot="spreadsheet-column"
                    data-column-id={columns[column]!.id}
                    data-active-axis={column === columnIndex || undefined}
                    aria-selected={
                      !!range &&
                      range.start <= column &&
                      range.end >= column &&
                      range.top === 0 &&
                      range.bottom === rows.length - 1
                    }
                    onPointerDown={(event) => {
                      if (event.target === event.currentTarget)
                        startHeaderDrag(event, "column", column);
                    }}
                    data-selected={
                      (!!range && range.start <= column && range.end >= column) || undefined
                    }
                    data-frozen={(frozen && column === 0) || undefined}
                    style={{
                      width: widths[column],
                      insetInlineStart:
                        frozen && column === 0 ? token("space.600") : offsets[column],
                    }}
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      data-slot="spreadsheet-heading"
                      aria-label={`Select column ${columnName(columnNumbers[column]!)}${columns[column]!.label !== columnName(columnNumbers[column]!) ? `, ${columns[column]!.label}` : ""}`}
                      onPointerDown={(event) => startHeaderDrag(event, "column", column)}
                      onClick={(event) => {
                        if (event.detail === 0 || !suppressHeaderClick.current)
                          selectHeader("column", column, event.shiftKey);
                        suppressHeaderClick.current = false;
                      }}
                    >
                      <span data-slot="spreadsheet-letter">
                        {columnName(columnNumbers[column]!)}
                      </span>
                      {headerDisplay !== "letters" &&
                      columns[column]!.label !== columnName(columnNumbers[column]!) ? (
                        <Truncate>{columns[column]!.label}</Truncate>
                      ) : null}
                      {columns[column]!.readOnly ? <Lock aria-label="Read only" /> : null}
                    </button>
                    <div data-slot="spreadsheet-column-menu">
                      <DropdownMenu
                        open={openColumnId === columns[column]!.id}
                        onOpenChange={(open) => {
                          if (open) void openColumnMenu(columns[column]!.id);
                          else setOpenColumnId(null);
                        }}
                      >
                        <DropdownMenuTrigger
                          render={
                            <IconButton
                              label={`Column options for ${columns[column]!.label}`}
                              icon={<ChevronDown />}
                              variant="subtle"
                              size="xsmall"
                              tabIndex={-1}
                              disabled={busy}
                              data-spreadsheet-edit-action={uid}
                            />
                          }
                        />
                        <DropdownMenuContent
                          align="end"
                          finalFocus={(closeType) => {
                            if (closeType !== "keyboard") return false;
                            const focused = document.activeElement;
                            // A host action may already have focused its own filter or dialog.
                            if (
                              focused &&
                              focused !== document.body &&
                              !focused.closest(
                                '[data-slot="dropdown-menu-content"], [data-slot="spreadsheet-column-menu"]',
                              )
                            )
                              return false;
                            return viewport.current;
                          }}
                        >
                          {contextFor("column", 0, column) ? (
                            <>
                              {clipboardMenu(contextFor("column", 0, column)!)}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabledReason={widthDisabledReason}
                                onClick={() =>
                                  openSize("column", contextFor("column", 0, column)!.columnIds)
                                }
                              >
                                Column width…
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          <DropdownMenuItem
                            disabledReason={widthDisabledReason}
                            onClick={() => resize(column, autofitWidth(column))}
                          >
                            Autofit column
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabledReason={
                              widthDisabledReason ??
                              (widths[column]! <= MIN_WIDTH
                                ? "The column is at its minimum width."
                                : undefined)
                            }
                            onClick={() => resize(column, widths[column]! - 32)}
                          >
                            Narrow column
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabledReason={
                              widthDisabledReason ??
                              (widths[column]! >= MAX_WIDTH
                                ? "The column is at its maximum width."
                                : undefined)
                            }
                            onClick={() => resize(column, widths[column]! + 32)}
                          >
                            Widen column
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabledReason={widthDisabledReason}
                            onClick={() => resize(column, resetWidth(columns[column]!.id))}
                          >
                            Reset column width
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {freezeMenuItem}
                          <DropdownMenuItem
                            disabledReason={
                              hiddenColumnsDisabledReason ??
                              ((contextFor("column", 0, column)?.columnIds.length ?? 1) >=
                              columns.length
                                ? "Keep at least one visible column."
                                : undefined)
                            }
                            onClick={() =>
                              setHidden("column", [
                                ...new Set([
                                  ...hiddenColumns,
                                  ...(contextFor("column", 0, column)?.columnIds ?? [
                                    columns[column]!.id,
                                  ]),
                                ]),
                              ])
                            }
                          >
                            Hide selected columns
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!hiddenColumns.length}
                            disabledReason={hiddenColumnsDisabledReason}
                            onClick={() => setHidden("column", [])}
                          >
                            Unhide all columns
                          </DropdownMenuItem>
                          {customColumnMenu(column)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div
                      role="separator"
                      tabIndex={-1}
                      aria-orientation="vertical"
                      aria-label={`Resize ${columns[column]!.label}`}
                      aria-disabled={!!widthDisabledReason || busy || editing || undefined}
                      aria-valuenow={widths[column]}
                      aria-valuemin={MIN_WIDTH}
                      aria-valuemax={MAX_WIDTH}
                      data-slot="spreadsheet-resize"
                      onDoubleClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!editing) fitColumns(column);
                      }}
                      onKeyDown={(event) => {
                        if (
                          !["ArrowLeft", "ArrowRight", "Enter", "Home", "End"].includes(event.key)
                        )
                          return;
                        event.preventDefault();
                        event.stopPropagation();
                        if (editing || busy || widthDisabledReason) return;
                        if (event.key === "Enter") {
                          fitColumns(column);
                          return;
                        }
                        resize(
                          column,
                          event.key === "Home"
                            ? MIN_WIDTH
                            : event.key === "End"
                              ? MAX_WIDTH
                              : widths[column]! +
                                (event.key === "ArrowRight" ? 16 : -16) *
                                  (locale.direction === "rtl" ? -1 : 1),
                        );
                      }}
                      onPointerDown={(event) => startColumnResize(event, column)}
                      onPointerMove={moveColumnResize}
                      onPointerUp={(event) => endColumnResize(event, true)}
                      onPointerCancel={(event) => endColumnResize(event, false)}
                      onLostPointerCapture={(event) => endColumnResize(event, false)}
                    />
                  </div>
                ))}
              </div>
              {visibleRows.map((rowNumber) => {
                const row = rows[rowNumber]!;
                return (
                  <div
                    key={row.id}
                    role="row"
                    aria-rowindex={rowNumber + 2}
                    data-slot="spreadsheet-row"
                    data-row-id={row.id}
                    data-record-active={activeRowId === row.id || undefined}
                    data-frozen-row={(freezeFirstRow && rowNumber === 0) || undefined}
                    style={{
                      top:
                        freezeFirstRow && rowNumber === 0
                          ? "var(--spreadsheet-row-height)"
                          : rowOffsets[rowNumber],
                      height: effectiveRowHeights[rowNumber],
                    }}
                  >
                    <div
                      role="rowheader"
                      data-slot="spreadsheet-row-number"
                      data-row-id={row.id}
                      data-active-axis={rowNumber === rowIndex || undefined}
                      aria-selected={
                        !!range &&
                        range.top <= rowNumber &&
                        range.bottom >= rowNumber &&
                        range.start === 0 &&
                        range.end === columns.length - 1
                      }
                      onPointerDown={(event) => {
                        if (event.target === event.currentTarget)
                          startHeaderDrag(event, "row", rowNumber);
                      }}
                      data-selected={
                        (!!range && range.top <= rowNumber && range.bottom >= rowNumber) ||
                        undefined
                      }
                    >
                      {onOpenRow ? (
                        <IconButton
                          label={`Open ${row.label ?? row.id}`}
                          size="xxsmall"
                          variant="subtle"
                          tabIndex={-1}
                          onClick={() => onOpenRow(row.id)}
                          icon={<ExternalLink />}
                        />
                      ) : null}
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label={`Select row ${rowNumbers[rowNumber]}, ${row.label ?? row.id}`}
                        onPointerDown={(event) => startHeaderDrag(event, "row", rowNumber)}
                        onClick={(event) => {
                          if (event.detail === 0 || !suppressHeaderClick.current)
                            selectHeader("row", rowNumber, event.shiftKey);
                          suppressHeaderClick.current = false;
                        }}
                      >
                        {rowNumbers[rowNumber]}
                      </button>
                      <div
                        role="separator"
                        tabIndex={-1}
                        aria-orientation="horizontal"
                        aria-label={`Resize row ${rowNumbers[rowNumber]}`}
                        aria-disabled={!!heightDisabledReason || busy || editing || undefined}
                        aria-valuenow={Math.round(effectiveRowHeights[rowNumber]!)}
                        aria-valuemin={MIN_ROW_HEIGHT}
                        aria-valuemax={Math.max(MAX_ROW_HEIGHT, effectiveRowHeights[rowNumber]!)}
                        aria-valuetext={`${Math.round(effectiveRowHeights[rowNumber]!)} pixels${rowHeightOverrides[row.id] === undefined ? ", automatic" : ""}`}
                        aria-keyshortcuts="Alt+Shift+ArrowUp Alt+Shift+ArrowDown"
                        data-slot="spreadsheet-row-resize"
                        onClick={(event) => event.stopPropagation()}
                        onDoubleClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (!editing) fitRows(rowResizeIds(rowNumber));
                        }}
                        onKeyDown={(event) => {
                          if (
                            !["ArrowUp", "ArrowDown", "Home", "End", "Enter", "Escape"].includes(
                              event.key,
                            )
                          )
                            return;
                          event.preventDefault();
                          event.stopPropagation();
                          if (event.key === "Escape") {
                            rowResize.current = null;
                            setRowHeightPreview(null);
                            focusGrid();
                            return;
                          }
                          if (editing || busy || heightDisabledReason) return;
                          const ids = rowResizeIds(rowNumber);
                          if (event.key === "Enter") {
                            fitRows(ids);
                            return;
                          }
                          resizeRows(
                            ids,
                            event.key === "Home"
                              ? MIN_ROW_HEIGHT
                              : event.key === "End"
                                ? MAX_ROW_HEIGHT
                                : effectiveRowHeights[rowNumber]! +
                                  (event.key === "ArrowDown" ? 1 : -1) * (event.shiftKey ? 32 : 8),
                          );
                        }}
                        onPointerDown={(event) => startRowResize(event, rowNumber)}
                        onPointerMove={moveRowResize}
                        onPointerUp={(event) => endRowResize(event, true)}
                        onPointerCancel={(event) => endRowResize(event, false)}
                        onLostPointerCapture={(event) => endRowResize(event, false)}
                      />
                    </div>
                    {visibleColumns.map((columnNumber) => {
                      const originalColumn = columns[columnNumber]!;
                      const cell = { rowId: row.id, columnId: originalColumn.id };
                      const options = getCellOptions?.(cell);
                      const column =
                        options !== undefined
                          ? { ...originalColumn, type: "choice" as const, options }
                          : originalColumn;
                      const raw = row.values[column.id] ?? "";
                      const shown =
                        displayValue?.(cell, raw) ??
                        (column.type === "choice"
                          ? (column.options?.find((option) => option.value === raw)?.label ?? raw)
                          : raw);
                      const selected =
                        !!range &&
                        rowNumber >= range.top &&
                        rowNumber <= range.bottom &&
                        columnNumber >= range.start &&
                        columnNumber <= range.end;
                      const current = sameCell(active, cell);
                      const cellDraft = draft && sameCell(draft.cell, cell) ? draft : null;
                      const peers = peerCells.get(JSON.stringify([row.id, column.id])) ?? [];
                      const format = getCellStyle?.(cell);
                      const invalid = getCellError?.(cell);
                      const comment = getCellComment?.(cell);
                      return (
                        <div
                          key={column.id}
                          role="gridcell"
                          id={cellId(rowNumber, columnNumber)}
                          aria-colindex={columnNumbers[columnNumber]! + 2}
                          aria-selected={selected}
                          aria-readonly={!canWrite(cell)}
                          aria-invalid={!!invalid}
                          aria-label={`${columnName(columnNumbers[columnNumber]!)}${rowNumbers[rowNumber]}, ${column.label}: ${shown || "Empty"}${peers.length ? `; ${peers.map((peer) => peer.name).join(", ")} here` : ""}`}
                          aria-description={
                            [invalid, comment && `Comment: ${comment}`]
                              .filter(Boolean)
                              .join(". ") || undefined
                          }
                          data-slot="spreadsheet-cell"
                          data-row-id={row.id}
                          data-column-id={column.id}
                          data-wrap={format?.wrap || undefined}
                          data-fill-preview={
                            (!!fillBounds &&
                              rowNumber >= fillBounds.top &&
                              rowNumber <= fillBounds.bottom &&
                              columnNumber >= fillBounds.start &&
                              columnNumber <= fillBounds.end) ||
                            undefined
                          }
                          data-fill-top={
                            (!!fillBounds && rowNumber === fillBounds.top) || undefined
                          }
                          data-fill-bottom={
                            (!!fillBounds && rowNumber === fillBounds.bottom) || undefined
                          }
                          data-fill-start={
                            (!!fillBounds && columnNumber === fillBounds.start) || undefined
                          }
                          data-fill-end={
                            (!!fillBounds && columnNumber === fillBounds.end) || undefined
                          }
                          data-comment={!!comment || undefined}
                          title={comment && !cellDraft ? comment : undefined}
                          data-cut={
                            (copied.current?.kind === "cut" &&
                              copied.current.sheetId === activeSheetId &&
                              copied.current.source.some((source) => sameCell(source, cell))) ||
                            undefined
                          }
                          data-active={current || undefined}
                          data-selected={selected || undefined}
                          data-frozen={(frozen && columnNumber === 0) || undefined}
                          data-invalid={!!invalid || undefined}
                          data-presence={
                            peers[0]?.tone ?? (peers.length ? "information" : undefined)
                          }
                          data-tone={format?.tone}
                          data-bold={format?.bold || undefined}
                          style={
                            {
                              width: widths[columnNumber],
                              insetInlineStart:
                                frozen && columnNumber === 0
                                  ? token("space.600")
                                  : offsets[columnNumber],

                              alignItems:
                                format?.verticalAlign === "top"
                                  ? "flex-start"
                                  : format?.verticalAlign === "bottom"
                                    ? "flex-end"
                                    : format?.verticalAlign === "middle"
                                      ? "center"
                                      : undefined,
                              "--spreadsheet-editor-top-padding": cellDraft
                                ? `${Math.max(
                                    rowMeasurements.paddingY,
                                    (effectiveRowHeights[rowNumber]! -
                                      rowMeasurements.measureCell(
                                        row,
                                        columnNumber,
                                        cellDraft.value,
                                      )) *
                                      ((format?.verticalAlign ??
                                        (format?.wrap ? "top" : "middle")) === "top"
                                        ? 0
                                        : (format?.verticalAlign ??
                                              (format?.wrap ? "top" : "middle")) === "bottom"
                                          ? 1
                                          : 0.5) +
                                      rowMeasurements.paddingY,
                                  )}px`
                                : undefined,
                              fontFamily: format?.fontFamily,
                              fontSize: format?.fontSize ? `${format.fontSize}pt` : undefined,
                              fontStyle: format?.italic ? "italic" : undefined,
                              lineHeight: format?.fontSize ? 1.4 : undefined,
                              color: format?.color,
                              "--spreadsheet-cell-background": format?.background,
                              borderTop: borderCss(format?.borderTop),
                              borderRight: borderCss(format?.borderRight),
                              borderBottom: borderCss(format?.borderBottom),
                              borderLeft: borderCss(format?.borderLeft),
                              textDecoration:
                                [
                                  format?.underline && "underline",
                                  format?.strikethrough && "line-through",
                                ]
                                  .filter(Boolean)
                                  .join(" ") || undefined,
                              textAlign:
                                format?.align ?? (column.type === "number" ? "end" : "start"),
                            } as CSSProperties
                          }
                          onPointerDown={(event) => {
                            if (
                              event.button !== 0 ||
                              !event.currentTarget.contains(event.target as Node) ||
                              (event.target as HTMLElement).closest(
                                "input,button,[data-slot=spreadsheet-editor]",
                              )
                            )
                              return;
                            if (event.pointerType !== "touch") event.preventDefault();
                            if (editing) {
                              void finish({ row: rowNumber, column: columnNumber });
                              return;
                            }
                            dragging.current = event.pointerType !== "touch";
                            selectCell(rowNumber, columnNumber, event.shiftKey);
                            focusGrid();
                          }}
                          onPointerEnter={(event) => {
                            if (
                              !gridGesture.current &&
                              dragging.current &&
                              event.buttons === 1 &&
                              !editing
                            )
                              selectCell(rowNumber, columnNumber, true);
                          }}
                          onDoubleClick={(event) => {
                            if (event.currentTarget.contains(event.target as Node) && current)
                              begin();
                          }}
                        >
                          {selected &&
                          range &&
                          (rowNumber === range.top ||
                            rowNumber === range.bottom ||
                            columnNumber === range.start ||
                            columnNumber === range.end) ? (
                            <span
                              aria-hidden
                              data-slot="spreadsheet-range-outline"
                              data-top={rowNumber === range.top || undefined}
                              data-bottom={rowNumber === range.bottom || undefined}
                              data-start={columnNumber === range.start || undefined}
                              data-end={columnNumber === range.end || undefined}
                            />
                          ) : null}
                          {comment ? (
                            <span
                              data-slot="spreadsheet-comment-marker"
                              aria-hidden
                              title={comment}
                            />
                          ) : null}
                          {cellDraft ? (
                            <div
                              ref={editor}
                              data-slot="spreadsheet-editor"
                              onBlur={leaveEditor}
                              onKeyDown={column.type === "choice" ? undefined : editorKey}
                              onInputCapture={() => {
                                if (column.type === "date") setDateTextDirty(true);
                              }}
                              onKeyDownCapture={(event) => {
                                if (
                                  !busy &&
                                  column.type === "date" &&
                                  event.key === "Escape" &&
                                  !(event.target as HTMLElement).closest('[role="dialog"]') &&
                                  !event.nativeEvent.isComposing
                                ) {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  cancel();
                                }
                              }}
                            >
                              {column.type === "choice" ? (
                                <Select
                                  disabled={busy}
                                  value={cellDraft.value}
                                  onOpenChange={(open, details) => {
                                    if (
                                      open ||
                                      details.reason === "item-press" ||
                                      choicePicked.current ||
                                      writing.current ||
                                      pending
                                    )
                                      return;
                                    cancel(details.reason === "escape-key");
                                  }}
                                  onValueChange={(next) => {
                                    if (next !== null) {
                                      choicePicked.current = true;
                                      const nextDraft = { ...cellDraft, value: next };
                                      draftRef.current = nextDraft;
                                      setDraft(nextDraft);
                                      void write([{ ...cell, value: next }]).then((saved) => {
                                        if (saved) {
                                          clearDraft();
                                          focusGrid();
                                        }
                                      });
                                    }
                                  }}
                                  defaultOpen
                                >
                                  <SelectTrigger size="small" aria-label={`Edit ${column.label}`}>
                                    <SelectValue placeholder="Choose a value">
                                      {column.options?.find(
                                        (option) => option.value === cellDraft.value,
                                      )?.label ?? cellDraft.value}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent
                                    finalFocus={false}
                                    onKeyDown={(event) => {
                                      if (event.key === "Escape") {
                                        event.stopPropagation();
                                        cancel();
                                      }
                                    }}
                                  >
                                    {column.options?.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : column.type === "date" && !cellDraft.value.startsWith("=") ? (
                                <DatePicker
                                  entry="type"
                                  size="small"
                                  aria-label={`Edit ${column.label}`}
                                  value={cellDraft.value}
                                  disabled={busy}
                                  onValueChange={(next) => {
                                    const nextDraft = { ...cellDraft, value: next };
                                    draftRef.current = nextDraft;
                                    setDraft(nextDraft);
                                  }}
                                  onEntryError={(message) => {
                                    dateEntryError.current = message;
                                    setFailure(message);
                                  }}
                                />
                              ) : (
                                <CellTextEditor
                                  aria-label={`Edit ${column.label}`}
                                  wrap={format?.wrap ? "soft" : "off"}
                                  inputMode={column.type === "number" ? "decimal" : undefined}
                                  value={cellDraft.value}
                                  disabled={busy}
                                  aria-invalid={!!failure}
                                  aria-describedby={failure ? `${uid}-error` : undefined}
                                  onChange={(event) => {
                                    const next = { ...cellDraft, value: event.target.value };
                                    draftRef.current = next;
                                    setDraft(next);
                                  }}
                                />
                              )}
                            </div>
                          ) : format?.wrap ? (
                            <span data-slot="spreadsheet-wrapped-value">{shown}</span>
                          ) : (
                            <Truncate>
                              {column.type === "boolean" && !raw.startsWith("=")
                                ? raw === "true"
                                  ? "Yes"
                                  : raw === "false"
                                    ? "No"
                                    : ""
                                : shown}
                            </Truncate>
                          )}
                          {showFillHandle &&
                          rowNumber === range?.bottom &&
                          columnNumber === range?.end ? (
                            <button
                              type="button"
                              tabIndex={-1}
                              data-slot="spreadsheet-fill-handle"
                              aria-label="Drag to fill selection"
                              aria-keyshortcuts="Control+d Meta+d Control+r Meta+r"
                              title="Drag to fill · Control/Command D fills down · Control/Command R fills right"
                              disabled={selectedEdits(() => "").some((entry) => !canWrite(entry))}
                              onPointerDown={startFillDrag}
                              onDoubleClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {!rows.length || !columns.length ? (
                <div data-slot="spreadsheet-empty" role="row" aria-rowindex={2}>
                  <div role="gridcell" aria-colspan={columns.length + 1}>
                    <Empty frame="none">
                      <EmptyHeader>
                        <EmptyTitle>{pending ? "Loading sheet" : "This sheet is empty"}</EmptyTitle>
                        <EmptyDescription>
                          {pending
                            ? "Values will appear when they are ready."
                            : "Add rows and columns, or import a workbook to begin."}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </div>
                </div>
              ) : null}
            </div>
          </ContextMenu.Trigger>
          <DropdownMenuContent
            aria-label={`${label} ${menuContext?.kind ?? "cell"} actions`}
            finalFocus={() => {
              if (sizeDialog) return false;
              const focused = document.activeElement;
              if (
                focused &&
                focused !== document.body &&
                !focused.closest('[data-slot="dropdown-menu-content"]')
              )
                return false;
              return viewport.current;
            }}
          >
            {menuContext ? (
              <>
                {clipboardMenu(menuContext)}
                {menuContext.kind !== "cell" ? (
                  <>
                    <DropdownMenuSeparator />
                    {visibilityMenu(menuContext)}
                  </>
                ) : null}
                {contextHostItems ? (
                  <>
                    <DropdownMenuSeparator />
                    {contextHostItems}
                  </>
                ) : null}
              </>
            ) : null}
          </DropdownMenuContent>
        </ContextMenu.Root>
      </DirectionProvider>
      <Dialog
        open={!!sizeDialog}
        onOpenChange={(open) => {
          if (!open) setSizeDialog(null);
        }}
      >
        <DialogContent width="small" finalFocus={viewport}>
          <DialogHeader>
            <DialogTitle>{sizeDialog?.kind === "row" ? "Row height" : "Column width"}</DialogTitle>
            <DialogDescription>
              Set the selected{" "}
              {sizeDialog?.kind === "row"
                ? "rows’ height (24–240 pixels)."
                : "columns’ width (104–640 pixels)."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Input
              type="number"
              aria-label={sizeDialog?.kind === "row" ? "Height in pixels" : "Width in pixels"}
              min={sizeDialog?.kind === "row" ? 24 : MIN_WIDTH}
              max={sizeDialog?.kind === "row" ? 240 : MAX_WIDTH}
              value={sizeInput}
              onChange={(event) => setSizeInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applySize();
                }
              }}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="subtle" onClick={() => setSizeDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={applySize}
              disabled={
                !Number.isFinite(Number(sizeInput)) ||
                Number(sizeInput) < (sizeDialog?.kind === "row" ? 24 : MIN_WIDTH) ||
                Number(sizeInput) > (sizeDialog?.kind === "row" ? 240 : MAX_WIDTH)
              }
            >
              Apply size
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SpreadsheetSheetBar
        sheets={sheets ?? []}
        activeSheetId={activeSheetId}
        onSheetChange={
          onSheetChange
            ? (id) => {
                void finish(undefined, false).then((saved) => {
                  if (saved) onSheetChange(id);
                });
              }
            : undefined
        }
        onAddSheet={
          onAddSheet
            ? () => {
                void finish(undefined, false).then((saved) => {
                  if (saved) onAddSheet();
                });
              }
            : undefined
        }
        getSheetActions={getSheetActions}
        onSheetAction={
          onSheetAction
            ? (id, actionId) => {
                void finish(undefined, false).then((saved) => {
                  if (saved) onSheetAction(id, actionId);
                });
              }
            : undefined
        }
        rowCount={sheetRowCount ?? allRows.length}
        columnCount={sheetColumnCount ?? allColumns.length}
        onAddRows={
          onAddRows
            ? () => {
                void finish(undefined, false).then((saved) => {
                  if (saved) onAddRows();
                });
              }
            : undefined
        }
        onAddColumns={
          onAddColumns
            ? () => {
                void finish(undefined, false).then((saved) => {
                  if (saved) onAddColumns();
                });
              }
            : undefined
        }
        disabled={busy}
        status={
          <div data-slot="spreadsheet-summary" role="status" aria-live="polite" aria-atomic="true">
            <span>{pending ? "Updating…" : saving ? "Saving…" : coordinates}</span>
            <span>
              {locale.formatNumber(statistics.count)} {statistics.count === 1 ? "cell" : "cells"}
            </span>
            {summary ? <span>{summary}</span> : null}
          </div>
        }
      >
        {onOpenRow && active ? (
          <Button
            size="small"
            variant="subtle"
            iconBefore={<ExternalLink />}
            onClick={() => onOpenRow(active.rowId)}
          >
            Open record
          </Button>
        ) : null}
        {presence.length ? (
          <div data-slot="spreadsheet-peers" aria-label="People in this sheet">
            {presence.map((peer) => (
              <Button
                key={peer.id}
                variant="subtle"
                size="small"
                onClick={() => {
                  const row = rows.findIndex((entry) => entry.id === peer.cell.rowId);
                  const column = columns.findIndex((entry) => entry.id === peer.cell.columnId);
                  if (row >= 0 && column >= 0) void finish({ row, column });
                }}
                disabled={
                  busy ||
                  !rows.some((row) => row.id === peer.cell.rowId) ||
                  !columns.some((column) => column.id === peer.cell.columnId)
                }
              >
                {peer.name}
              </Button>
            ))}
          </div>
        ) : null}
      </SpreadsheetSheetBar>
    </div>
  );
}
