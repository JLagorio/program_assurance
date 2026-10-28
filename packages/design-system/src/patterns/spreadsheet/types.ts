import type { ReorderChange } from "../reorder";
import type { ComponentProps, ReactNode } from "react";

/** Stable field identity. Column order is presentation, never the cell's identity. */
export type SpreadsheetColumn = {
  id: string;
  label: string;
  type?: "text" | "number" | "choice" | "boolean" | "date" | undefined;
  options?: readonly { value: string; label: string }[] | undefined;
  readOnly?: boolean | undefined;
  width?: number | undefined;
};

export type SpreadsheetRow = {
  id: string;
  label?: string | undefined;
  /** Unique positive 1-based workbook row address. Preserve it when filtering or sorting; defaults to the visible index + 1. */
  rowNumber?: number | undefined;
  /** Raw input, including a formula's leading =. The host evaluates formulas. */
  values: Readonly<Record<string, string>>;
};

export type SpreadsheetCell = { rowId: string; columnId: string };
export type SpreadsheetSelection = { anchor: SpreadsheetCell; focus: SpreadsheetCell };
export type SpreadsheetEdit = SpreadsheetCell & { value: string };
export type SpreadsheetPresence = {
  id: string;
  name: string;
  cell: SpreadsheetCell;
  /** A color from the Ledger tone vocabulary; identity is also exposed in words. */
  tone?: "information" | "success" | "warning" | "brand" | undefined;
};
export type SpreadsheetSheet = { id: string; label: string };
export type SpreadsheetSheetAction = {
  id: string;
  label: string;
  disabled?: boolean | undefined;
  destructive?: boolean | undefined;
};
/** Context target stays distinct from the retained selection when opening inside a range. */
export type SpreadsheetMenuContext = {
  kind: "cell" | "row" | "column";
  cell: SpreadsheetCell;
  selection: SpreadsheetSelection;
  /** Visible selected identities; hidden rows and columns are deliberately excluded. */
  rowIds: readonly string[];
  columnIds: readonly string[];
};
export type SpreadsheetBorder = {
  style: "solid" | "dashed" | "dotted";
  color: string;
  width: 1 | 2 | 3;
};
export type SpreadsheetCellStyle = {
  fontFamily?: string | undefined;
  /** Document font size in points (1pt = 4/3 CSS pixels). */
  fontSize?: number | undefined;
  strikethrough?: boolean | undefined;
  color?: string | undefined;
  background?: string | undefined;
  wrap?: boolean | undefined;
  borderTop?: SpreadsheetBorder | undefined;
  borderRight?: SpreadsheetBorder | undefined;
  borderBottom?: SpreadsheetBorder | undefined;
  borderLeft?: SpreadsheetBorder | undefined;
  bold?: boolean | undefined;
  italic?: boolean | undefined;
  underline?: boolean | undefined;
  align?: "start" | "center" | "end" | undefined;
  /** Defaults to top for wrapped text and middle otherwise. */
  verticalAlign?: "top" | "middle" | "bottom" | undefined;
  tone?: "neutral" | "information" | "success" | "warning" | "danger" | "brand" | undefined;
};

/** A shared single-row workbook action strip. Native controls keep their normal Tab order. */
export type SpreadsheetToolbarProps = ComponentProps<"div"> & {
  /** Accessible name for this group of workbook controls. */
  label: string;
};

export type SpreadsheetProps = Omit<ComponentProps<"div">, "onChange" | "onPaste" | "children"> & {
  /** Names this grid; required even when a page heading names the workbook. */
  label: string;
  columns: readonly SpreadsheetColumn[];
  rows: readonly SpreadsheetRow[];
  /** One atomic intent. Reject to keep the editor's draft and expose Retry. The host owns validation, persistence and updating rows. */
  onChange?: ((edits: readonly SpreadsheetEdit[]) => void | Promise<void>) | undefined;
  /** Reports an unsaved editor draft so the host can guard navigation and structural operations. False after commit, cancellation or unmount. */
  /** Host-provided formulas; completion inserts names without evaluating expressions. */
  formulaFunctions?: readonly SpreadsheetFunction[] | undefined;
  /** Parse references into stable selections in the current sheet; unknown/other-sheet references can be omitted. */
  getFormulaReferences?:
    ((input: string, cell: SpreadsheetCell) => readonly SpreadsheetFormulaReference[]) | undefined;
  /** Encode a picked range for the current formula. Defaults to canonical A1 addresses in this sheet. */
  getFormulaReference?: ((selection: SpreadsheetSelection) => string) | undefined;
  /** Snapshot authored styles for local rich copy. External TSV never carries document styles. */
  getClipboardStyle?:
    ((cell: SpreadsheetCell) => Readonly<Record<string, unknown>> | undefined) | undefined;
  /** One atomic paste intent including translated inputs and replacement styles. Rejection retains retry state. */
  onPaste?: ((paste: SpreadsheetPaste) => void | Promise<void>) | undefined;
  /** Evaluated, unformatted selection totals from the host. Null suppresses totals; undefined uses local numeric display values. */
  selectionStatistics?: SpreadsheetStatistics | null | undefined;
  onDraftChange?: ((dirty: boolean) => void) | undefined;
  selection?: SpreadsheetSelection | null | undefined;
  onSelectionChange?: ((selection: SpreadsheetSelection | null) => void) | undefined;
  readOnly?: boolean | undefined;
  /** External load/save activity. Existing values stay visible; writes pause. */
  pending?: boolean | undefined;
  error?: ReactNode;
  onRetry?: (() => void) | undefined;
  isCellReadOnly?: ((cell: SpreadsheetCell) => boolean) | undefined;
  /** Identifies cells whose formula-shaped input is literal text. Copy and fill preserve that intent. */
  isCellLiteral?: ((cell: SpreadsheetCell) => boolean) | undefined;
  getCellError?: ((cell: SpreadsheetCell) => string | undefined) | undefined;
  getCellStyle?: ((cell: SpreadsheetCell) => SpreadsheetCellStyle | undefined) | undefined;
  /** Per-cell list validation overrides the column editor with a choice editor. */
  getCellOptions?: ((cell: SpreadsheetCell) => SpreadsheetColumn["options"]) | undefined;
  getCellComment?: ((cell: SpreadsheetCell) => string | undefined) | undefined;
  /** Evaluated/formatted display; editing and clipboard preserve the raw input. */
  displayValue?: ((cell: SpreadsheetCell, value: string) => string) | undefined;
  /** Unformatted calculated value for Paste values; defaults to displayValue/raw input. */
  clipboardValue?: ((cell: SpreadsheetCell, value: string) => string) | undefined;
  /** Encode a literal input for this target. Optional style is incoming replacement metadata: undefined keeps current styling, null clears it. Defaults to escaping leading =; record-backed literal cells can return unchanged. */
  preparePasteValue?:
    | ((
        cell: SpreadsheetCell,
        value: string,
        style?: Readonly<Record<string, unknown>> | null,
      ) => string)
    | undefined;
  /** Translate relative references for fill and locally copied ranges. Row coordinates use rowNumber - 1; columns use their zero-based positions. Defaults to literal copying. */
  translateInput?:
    | ((
        value: string,
        from: { row: number; column: number },
        to: { row: number; column: number },
      ) => string)
    | undefined;
  onOpenRow?: ((rowId: string) => void) | undefined;
  activeRowId?: string | undefined;
  presence?: readonly SpreadsheetPresence[] | undefined;
  /** Host view controls before the native clipboard and column controls. */
  toolbarStart?: ReactNode;
  /** Host operations after the native controls, separated as a group. */
  actions?: ReactNode;
  /** Additional DropdownMenu items for this stable column, after native sizing and freeze actions. */
  renderColumnMenu?:
    ((column: SpreadsheetColumn, context: SpreadsheetMenuContext) => ReactNode) | undefined;
  renderCellMenu?: ((context: SpreadsheetMenuContext) => ReactNode) | undefined;
  renderRowMenu?: ((row: SpreadsheetRow, context: SpreadsheetMenuContext) => ReactNode) | undefined;
  onClearFormatting?: ((context: SpreadsheetMenuContext) => void) | undefined;
  onUndo?: (() => void) | undefined;
  onRedo?: (() => void) | undefined;
  canUndo?: boolean | undefined;
  canRedo?: boolean | undefined;
  sheets?: readonly SpreadsheetSheet[] | undefined;
  activeSheetId?: string | undefined;
  onSheetChange?: ((sheetId: string) => void) | undefined;
  onAddSheet?: (() => void) | undefined;
  getSheetActions?: ((sheetId: string) => readonly SpreadsheetSheetAction[]) | undefined;
  onSheetAction?: ((sheetId: string, actionId: string) => void) | undefined;
  /** Drag/keyboard reorder; successful cell-draft commit precedes this callback. */
  onSheetReorder?: ((ids: string[], change: ReorderChange) => void) | undefined;
  isSheetReorderDisabled?: ((sheetId: string) => boolean) | undefined;
  onAddRows?: (() => void) | undefined;
  onAddColumns?: (() => void) | undefined;
  sheetRowCount?: number | undefined;
  sheetColumnCount?: number | undefined;
  /** Hide by identity without removing rows/columns or changing their workbook addresses. */
  hiddenRowIds?: readonly string[] | undefined;
  onHiddenRowIdsChange?: ((ids: readonly string[]) => void) | undefined;
  hiddenColumnIds?: readonly string[] | undefined;
  onHiddenColumnIdsChange?: ((ids: readonly string[]) => void) | undefined;
  /** Letters-only headings suit a workbook whose first data row carries field names. */
  headerDisplay?: "labels" | "letters" | undefined;
  density?: "comfortable" | "compact" | undefined;
  /** Fill a bounded parent; surplus grid surface stays visual, never creates records. */
  fillAvailable?: boolean | undefined;
  /** Scrolling grid height in CSS pixels; defaults to a bounded viewport-relative height. Chrome remains outside the scroller. */
  height?: number | undefined;
  /** Controlled freeze state; omit for local state, initially true. The frozen identity yields in narrow viewports. */
  freezeFirstColumn?: boolean | undefined;
  /** Required to change a supplied freezeFirstColumn through its column menus. */
  onFreezeFirstColumnChange?: ((frozen: boolean) => void) | undefined;
  /** Keep the first data row visible below the column headings, for a workbook's field names. */
  freezeFirstRow?: boolean | undefined;
  /** Controlled widths by stable column id. Omit for local resizing; supplied widths require onColumnWidthsChange. Reset restores each column’s first-seen width within its sheet. */
  columnWidths?: Readonly<Record<string, number>> | undefined;
  onColumnWidthsChange?: ((widths: Readonly<Record<string, number>>) => void) | undefined;
  /** Explicit CSS-pixel row heights (24..240) override automatic growth (up to480). Omit an ID for automatic height. Supplied maps require onRowHeightsChange to resize. */
  rowHeights?: Readonly<Record<string, number>> | undefined;
  /** Receives the complete explicit-height map. Removing an ID resets it to automatic height. */
  onRowHeightsChange?: ((heights: Readonly<Record<string, number>>) => void) | undefined;
};

/** Engine-neutral formatting controls; physical text alignment matches document interchange. */
export type SpreadsheetFormat = Omit<SpreadsheetCellStyle, "align" | "tone"> & {
  align?: "left" | "center" | "right" | undefined;
  format?: "general" | "number" | "currency" | "percent" | "date" | "text" | undefined;
  decimals?: number | undefined;
};
export type SpreadsheetBorderPreset =
  "all" | "outside" | "inside" | "top" | "right" | "bottom" | "left" | "none";
export type SpreadsheetFormattingProps = Omit<ComponentProps<"div">, "style" | "children"> & {
  style?: SpreadsheetFormat | undefined;
  disabled?: boolean | undefined;
  /** Disable value-type formatting while retaining visual document styles. */
  numberFormatDisabled?: boolean | undefined;
  /** Properties with differing values in the selection. Applying a control replaces that property uniformly. */
  mixed?: readonly (keyof SpreadsheetFormat)[] | undefined;
  /** Resets unfinished toolbar input when selection changes. */
  selectionKey?: string | undefined;
  onFormat: (style: SpreadsheetFormat) => void;
  onBorders: (preset: SpreadsheetBorderPreset, border: SpreadsheetBorder) => void;
};

export type SpreadsheetFunction = {
  name: string;
  signature: string;
  description: string;
  arguments?: readonly string[] | undefined;
};
export type SpreadsheetFormulaReference = {
  selection: SpreadsheetSelection;
  label?: string | undefined;
};
export type SpreadsheetPaste = {
  mode: "all" | "values" | "formatting";
  edits: readonly SpreadsheetEdit[];
  /** Replacement document styles, never evaluated conditional formatting. Null clears authored styling. */
  styles: readonly (SpreadsheetCell & { style: Readonly<Record<string, unknown>> | null })[];
};
export type SpreadsheetStatistics = {
  count: number;
  numericCount: number;
  sum?: number | undefined;
  average?: number | undefined;
};
