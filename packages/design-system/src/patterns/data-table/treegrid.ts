import type { RowData } from "@tanstack/react-table";
import type { KeyboardEvent } from "react";

import type { DataTableInstance } from "./use-data-table";

/*
 * The treegrid's keyboard, as the ARIA treegrid pattern has it. The rows hold one tab stop: a row,
 * or one cell of a row. On a row, Down and Up move between rows, Right opens a closed row or moves
 * into its first cell, Left closes an open row or moves to its parent, Home and End go to the first
 * and last row, and Enter opens the row as its name's link does. On a cell, Right and Left move
 * along the row (Left from the first cell returns to the row), Down and Up keep the column, Home
 * and End go to the row's first and last cell, Ctrl+Home and Ctrl+End to the column's first and
 * last row, Enter presses the cell's link, else its first control, and Space its checkbox. Every
 * link and button in the rows is out of the Tab order except those in the cell that holds the
 * stop, so Tab from the stop reaches that cell's controls and then leaves the table: a tree of
 * thirty rows costs one Tab, not a hundred.
 */

/** Where a control's own tab index is kept while the treegrid holds it out of the Tab order. */
const KEPT = "data-treegrid-tabindex";

/** What the Tab key could reach inside a cell. */
const FOCUSABLE =
  'a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]:not([contenteditable="false"])';

/** A control that takes no arrow key of its own, so the arrows move on from it as from its cell. */
const PLAIN =
  'a[href], button:not([aria-haspopup]:not([aria-haspopup="false"])), input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="radio"], [role="switch"], [role="link"]';

/** What Enter presses in a cell when it holds no link: its first control. */
const CONTROL =
  'button, input:not([type="hidden"]):not([aria-hidden="true"]), select, textarea, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="combobox"]';

/** What Space presses in a cell: a box that chooses the row. */
const CHOOSES = 'input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="radio"]';

/** The rows this treegrid draws, in order: its own, never a table nested in a detail row. */
export const treeRowsOf = (table: HTMLTableElement): HTMLTableRowElement[] =>
  [...table.tBodies].flatMap((body) =>
    [...body.rows].filter((row) => row.hasAttribute("data-row-id")),
  );

/** The cells the keys move across: every cell but the leading disclosure, whose chevron the row's own Right and Left work. */
export const cellsOf = (row: HTMLTableRowElement): HTMLTableCellElement[] =>
  [...row.cells].filter((cell) => cell.dataset["slot"] !== "table-disclosure");

/** The tree row an element sits in, when that row is this table's own. */
const ownRow = (table: HTMLTableElement, element: Element) => {
  const row = element.closest<HTMLTableRowElement>("tr[data-row-id]");
  return row && row.parentElement?.parentElement === table ? row : null;
};

/** The cell of `row` an element sits in. */
const ownCell = (row: HTMLTableRowElement, element: Element) => {
  const cell = element.closest<HTMLTableCellElement>("td, th");
  return cell && cell.parentElement === row ? cell : null;
};

/** Takes a control out of the Tab order, keeping its own tab index to give back. */
function holdOut(element: HTMLElement) {
  const current = element.getAttribute("tabindex");
  // Held already and untouched since: nothing to do. Anything else (a first sight, or a tab index
  // its component wrote since) is the control's own, kept to give back.
  if (current === "-1" && element.hasAttribute(KEPT)) return;
  element.setAttribute(KEPT, current ?? "");
  if (current !== "-1") element.setAttribute("tabindex", "-1");
}

/** Gives a control back its own tab index. */
function giveBack(element: HTMLElement) {
  if (!element.hasAttribute(KEPT)) return;
  const own = element.getAttribute(KEPT);
  element.removeAttribute(KEPT);
  if (own) element.setAttribute("tabindex", own);
  else element.removeAttribute("tabindex");
}

/** One row's cells and controls: the stop's cell is the one tab stop, its controls follow it; the rest wait. */
function syncRow(row: HTMLTableRowElement, stop: HTMLTableCellElement | null) {
  for (const cell of row.cells) {
    const isStop = cell === stop;
    if (isStop) {
      if (cell.getAttribute("tabindex") !== "0") cell.setAttribute("tabindex", "0");
    } else if (cell.hasAttribute("tabindex") && cell.getAttribute("tabindex") !== "-1") {
      cell.setAttribute("tabindex", "-1");
    }
    for (const control of cell.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (isStop) giveBack(control);
      else holdOut(control);
  }
}

/**
 * Keeps the Tab order the treegrid pattern asks for: `stop` is the cell that holds the rows' tab
 * stop, or `null` while a row holds it (the row's own `tabIndex` says which). `rows` narrows the
 * work to the rows that changed.
 */
export function syncTabOrder(
  table: HTMLTableElement,
  stop: HTMLTableCellElement | null,
  rows: Iterable<HTMLTableRowElement> = treeRowsOf(table),
) {
  for (const row of rows) syncRow(row, stop && stop.parentElement === row ? stop : null);
}

/** The rows a batch of changes touched, or `null` when it reached past a row and every row is due. */
export function touchedRows(
  table: HTMLTableElement,
  records: MutationRecord[],
): Set<HTMLTableRowElement> | null {
  const rows = new Set<HTMLTableRowElement>();
  for (const record of records) {
    const target = record.target instanceof Element ? record.target : null;
    const row = target ? ownRow(table, target) : null;
    if (row) rows.add(row);
    else if (record.type === "childList") return null;
  }
  return rows;
}

/** The cell a stop names: its row by id and its place among the row's cells, held to the row's last. */
export function stopCell(
  table: HTMLTableElement,
  rowId: string | null,
  index: number | null,
): HTMLTableCellElement | null {
  if (rowId === null || index === null) return null;
  const row = treeRowsOf(table).find((r) => r.dataset["rowId"] === rowId);
  if (!row) return null;
  const cells = cellsOf(row);
  return cells[Math.min(index, cells.length - 1)] ?? null;
}

/** Where focus now sits in the rows: a row, or a cell and its place among the row's cells. */
export function focusPlace(
  table: HTMLTableElement,
  target: Element,
): { rowId: string; cell: HTMLTableCellElement | null; index: number | null } | null {
  const row = ownRow(table, target);
  const rowId = row?.dataset["rowId"];
  if (!row || !rowId) return null;
  if (target === row) return { rowId, cell: null, index: null };
  const cell = ownCell(row, target);
  const index = cell ? cellsOf(row).indexOf(cell) : -1;
  // The leading disclosure is the row's own chevron: focus there leaves the row the stop.
  return index < 0 || !cell ? { rowId, cell: null, index: null } : { rowId, cell, index };
}

const focusCell = (row: HTMLTableRowElement | undefined, index: number) => {
  if (!row) return;
  const cells = cellsOf(row);
  const cell = cells[Math.max(0, Math.min(index, cells.length - 1))];
  if (!cell) return;
  cell.setAttribute("tabindex", "0");
  cell.focus();
};

const focusRow = (row: HTMLTableRowElement | undefined) => row?.focus();

/** Opens the row as its name's link does: the name's link, else the row's own click. */
const openRow = (row: HTMLTableRowElement) => {
  const link = row.querySelector<HTMLAnchorElement>("a[href]");
  if (link) link.click();
  else row.click();
};

/** The treegrid's keys, on the table: a row's, a cell's, or a plain control's in a cell, as its cell's. */
export function treegridKeys<TData extends RowData>(
  table: DataTableInstance<TData>,
  direction: "ltr" | "rtl",
) {
  return (event: KeyboardEvent<HTMLTableElement>) => {
    if (event.defaultPrevented || event.altKey || event.metaKey) return;
    const element = event.currentTarget;
    const target = event.target as HTMLElement;
    const tr = ownRow(element, target);
    const id = tr?.dataset["rowId"];
    if (!tr || !id) return;
    const rows = treeRowsOf(element);
    const at = rows.indexOf(tr);
    // Right and Left follow the reading direction: mirrored in a right-to-left table.
    const key =
      direction === "rtl" && event.key === "ArrowLeft"
        ? "ArrowRight"
        : direction === "rtl" && event.key === "ArrowRight"
          ? "ArrowLeft"
          : event.key;
    const ctrl = event.ctrlKey;

    if (target === tr) {
      if (ctrl && key !== "Home" && key !== "End") return;
      const row = table.getRow(id);
      switch (key) {
        case "ArrowDown":
          focusRow(rows[at + 1]);
          break;
        case "ArrowUp":
          focusRow(rows[at - 1]);
          break;
        case "ArrowRight":
          if (row.getCanExpand() && !row.getIsExpanded()) row.toggleExpanded(true);
          else focusCell(tr, 0);
          break;
        case "ArrowLeft":
          if (row.getIsExpanded()) row.toggleExpanded(false);
          else {
            const parent = row.getParentRow();
            if (parent) focusRow(rows.find((r) => r.dataset["rowId"] === parent.id));
          }
          break;
        case "Home":
          focusRow(rows[0]);
          break;
        case "End":
          focusRow(rows[rows.length - 1]);
          break;
        case "Enter":
          openRow(tr);
          break;
        default:
          return;
      }
      event.preventDefault();
      return;
    }

    const cell = ownCell(tr, target);
    if (!cell) return;
    const onCell = target === cell;
    // A control that takes its own keys keeps them: a field, a menu's button, a combobox.
    if (!onCell && !target.matches(PLAIN)) return;
    const cells = cellsOf(tr);
    const index = cells.indexOf(cell);
    if (index < 0) return;
    if (ctrl && key !== "Home" && key !== "End") return;
    switch (key) {
      case "ArrowRight":
        if (index < cells.length - 1) focusCell(tr, index + 1);
        break;
      case "ArrowLeft":
        if (index > 0) focusCell(tr, index - 1);
        else focusRow(tr);
        break;
      case "ArrowDown":
        focusCell(rows[at + 1], index);
        break;
      case "ArrowUp":
        focusCell(rows[at - 1], index);
        break;
      case "Home":
        if (ctrl) focusCell(rows[0], index);
        else focusCell(tr, 0);
        break;
      case "End":
        if (ctrl) focusCell(rows[rows.length - 1], index);
        else focusCell(tr, cells.length - 1);
        break;
      case "Enter": {
        // The cell's link, as Enter on the row opens it, else its first control, else the row.
        if (!onCell) return;
        const control =
          cell.querySelector<HTMLElement>("a[href]") ?? cell.querySelector<HTMLElement>(CONTROL);
        if (control) control.click();
        else openRow(tr);
        break;
      }
      case " ": {
        if (!onCell) return;
        cell.querySelector<HTMLElement>(CHOOSES)?.click();
        break;
      }
      default:
        return;
    }
    event.preventDefault();
  };
}
