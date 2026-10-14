import { LIMITS, type CellRange, type Position } from "./types";

/** Coordinates at this boundary are zero based; Excel addresses are one based. */
export function columnName(column: number): string {
  if (!Number.isInteger(column) || column < 0 || column >= 16_384) {
    throw new Error("Column is outside Excel's address space.");
  }
  let name = "";
  for (let n = column + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  }
  return name;
}

export function cellAddress(position: Position): string {
  if (!Number.isInteger(position.row) || position.row < 0 || position.row >= 1_048_576) {
    throw new Error("Row is outside Excel's address space.");
  }
  return `${columnName(position.column)}${position.row + 1}`;
}

export function parseAddress(address: string): Position | undefined {
  const match = /^\$?([A-Z]{1,3})\$?([1-9]\d{0,6})$/i.exec(address.trim());
  if (!match) return undefined;
  let column = 0;
  for (const char of match[1]!.toUpperCase()) column = column * 26 + char.charCodeAt(0) - 64;
  const row = Number(match[2]) - 1;
  return row < 1_048_576 && column <= 16_384 ? { row, column: column - 1 } : undefined;
}

export function normalizeRange(range: CellRange): CellRange {
  return {
    start: {
      row: Math.min(range.start.row, range.end.row),
      column: Math.min(range.start.column, range.end.column),
    },
    end: {
      row: Math.max(range.start.row, range.end.row),
      column: Math.max(range.start.column, range.end.column),
    },
  };
}

export function rangePositions(range: CellRange, max = LIMITS.edits): Position[] {
  const { start, end } = normalizeRange(range);
  if (
    ![start.row, start.column, end.row, end.column].every(
      (value) => Number.isInteger(value) && value >= 0,
    )
  ) {
    throw new Error("Invalid cell range.");
  }
  if ((end.row - start.row + 1) * (end.column - start.column + 1) > max) {
    throw new Error(`Choose a range of at most ${max.toLocaleString()} cells.`);
  }
  const positions: Position[] = [];
  for (let row = start.row; row <= end.row; row++) {
    for (let column = start.column; column <= end.column; column++) positions.push({ row, column });
  }
  return positions;
}

type Reference = {
  qualifier: string;
  sheet?: string;
  first: string;
  last?: string;
  kind: "cell" | "row" | "column";
};
// This is an A1 reference transformer, never a formula evaluator. String literals
// are recognized first; the calculation engine remains responsible for semantics.
const referencePattern =
  /"(?:[^"]|"")*"|(?<![\p{L}\p{N}_.])((?:'(?:[^']|'')+'|[\p{L}_][\p{L}\p{N}_.]*)!)?(\$?[A-Z]{1,3}\$?[1-9]\d{0,6}(?::\$?[A-Z]{1,3}\$?[1-9]\d{0,6})?|\$?[A-Z]{1,3}:\$?[A-Z]{1,3}|\$?[1-9]\d{0,6}:\$?[1-9]\d{0,6})(?![\p{L}\p{N}_]|\s*\()/giu;

function mapReferences(input: string, map: (reference: Reference) => string): string {
  if (!input.startsWith("=")) return input;
  return input.replace(
    referencePattern,
    (full, qualifier: string | undefined, cells: string | undefined) => {
      if (full.startsWith('"') || !cells) return full;
      const [first, last] = cells.split(":");
      if (!first) return full;
      const kind = /^\$?[A-Z]+$/i.test(first) ? "column" : /^\$?\d+$/.test(first) ? "row" : "cell";
      if (!referencePosition(first, kind) || (last && !referencePosition(last, kind))) return full;
      const raw = qualifier?.slice(0, -1);
      const sheet = raw?.startsWith("'") ? raw.slice(1, -1).replaceAll("''", "'") : raw;
      return map({
        qualifier: qualifier ?? "",
        first,
        kind,
        ...(last ? { last } : {}),
        ...(sheet ? { sheet } : {}),
      });
    },
  );
}

function referencePosition(address: string, kind: Reference["kind"]): Position | undefined {
  return parseAddress(kind === "column" ? `${address}1` : kind === "row" ? `A${address}` : address);
}

function renderPart(original: string, position: Position, kind: Reference["kind"]): string {
  if (kind === "cell") return renderReference(original, position.row, position.column);
  if (
    position.row < 0 ||
    position.row >= 1_048_576 ||
    position.column < 0 ||
    position.column >= 16_384
  )
    return "#REF!";
  return `${original.startsWith("$") ? "$" : ""}${kind === "column" ? columnName(position.column) : position.row + 1}`;
}

function renderReference(original: string, row: number, column: number): string {
  if (row < 0 || row >= 1_048_576 || column < 0 || column >= 16_384) return "#REF!";
  const match = /^(\$?)[A-Z]+(\$?)\d+$/i.exec(original)!;
  return `${match[1]}${columnName(column)}${match[2]}${row + 1}`;
}

export function translateFormula(input: string, from: Position, to: Position): string {
  return mapReferences(input, (reference) => {
    const shift = (address: string) => {
      const position = referencePosition(address, reference.kind)!;
      return renderPart(
        address,
        {
          row:
            position.row +
            (reference.kind === "column" || /\$\d+$/.test(address) ? 0 : to.row - from.row),
          column:
            position.column +
            (reference.kind === "row" || address.startsWith("$") ? 0 : to.column - from.column),
        },
        reference.kind,
      );
    };
    return `${reference.qualifier}${shift(reference.first)}${reference.last ? `:${shift(reference.last)}` : ""}`;
  });
}

export function renameFormulaSheet(input: string, previous: string, next: string | null): string {
  return mapReferences(input, (reference) => {
    const cells = `${reference.first}${reference.last ? `:${reference.last}` : ""}`;
    if (reference.sheet?.toLocaleLowerCase() !== previous.toLocaleLowerCase())
      return reference.qualifier + cells;
    return next === null ? "#REF!" : `'${next.replaceAll("'", "''")}'!${cells}`;
  });
}

export function shiftFormulaAxis(
  input: string,
  homeSheet: string,
  changedSheet: string,
  axis: "row" | "column",
  index: number,
  count: number,
  remove: boolean,
): string {
  return mapReferences(input, (reference) => {
    const original = `${reference.qualifier}${reference.first}${reference.last ? `:${reference.last}` : ""}`;
    if ((reference.sheet ?? homeSheet).toLocaleLowerCase() !== changedSheet.toLocaleLowerCase())
      return original;
    if (
      (reference.kind === "column" && axis === "row") ||
      (reference.kind === "row" && axis === "column")
    )
      return original;
    const first = referencePosition(reference.first, reference.kind)!;
    const last = reference.last ? referencePosition(reference.last, reference.kind)! : undefined;
    const shift = (n: number) => (n < index ? n : remove ? n - count : n + count);
    if (!last) {
      if (remove && first[axis] >= index && first[axis] < index + count) return "#REF!";
      first[axis] = shift(first[axis]);
      return reference.qualifier + renderPart(reference.first, first, reference.kind);
    }
    const backwards = first[axis] > last[axis];
    const lo = Math.min(first[axis], last[axis]);
    const hi = Math.max(first[axis], last[axis]);
    let nextLo = shift(lo);
    let nextHi = shift(hi);
    if (remove) {
      if (lo >= index && hi < index + count) return "#REF!";
      nextLo = lo >= index && lo < index + count ? index : shift(lo);
      nextHi = hi >= index && hi < index + count ? index - 1 : shift(hi);
    }
    first[axis] = backwards ? nextHi : nextLo;
    last[axis] = backwards ? nextLo : nextHi;
    return `${reference.qualifier}${renderPart(reference.first, first, reference.kind)}:${renderPart(reference.last!, last, reference.kind)}`;
  });
}

/** Dynamic strings, external links and 3-D references cannot be safely rewritten. */
export function hasUnrewritableReferences(input: string): boolean {
  if (!input.startsWith("=")) return false;
  const formula = input.replace(/"(?:[^"]|"")*"/g, '""');
  return /\bINDIRECT\s*\(|\[|(?:'[^']*:[^']*'|[\p{L}\p{N}_]+:[\p{L}\p{N}_]+)!/iu.test(formula);
}
