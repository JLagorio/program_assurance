import { useMemo, type RefObject } from "react";
import type { SpreadsheetColumn, SpreadsheetRow, SpreadsheetProps } from "./types";
import { wrappedLineCount } from "./model";
const MAX_AUTO_ROW_HEIGHT = 480;
/** Private typography measurement boundary, independent of gestures and persistence. */
export function useRowMeasurements({
  rows,
  columns,
  widths,
  rowHeight,
  gutterWidth,
  viewport,
  getCellStyle,
  displayValue,
}: {
  rows: readonly SpreadsheetRow[];
  columns: readonly SpreadsheetColumn[];
  widths: readonly number[];
  rowHeight: number;
  gutterWidth: number;
  viewport: RefObject<HTMLDivElement | null>;
  getCellStyle: SpreadsheetProps["getCellStyle"];
  displayValue: SpreadsheetProps["displayValue"];
}) {
  return useMemo(() => {
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
  }, [rows, columns, rowHeight, gutterWidth, getCellStyle, displayValue, widths, viewport]);
}
