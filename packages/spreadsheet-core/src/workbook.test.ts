import { describe, expect, it } from "vitest";
import { cellAddress, parseAddress, shiftFormulaAxis, translateFormula } from "./address";
import { exportDelimited, parseDelimited, serializeDelimited } from "./delimited";
import {
  applyEdits,
  applyOperation,
  cellAt,
  createHistory,
  createSheet,
  createWorkbook,
  deserializeWorkbook,
  serializeWorkbook,
} from "./workbook";

function fixture() {
  const sheet = createSheet("Source", { rows: 6, columns: 4 });
  let workbook = createWorkbook("Test", [sheet]);
  workbook = applyOperation(workbook, {
    type: "paste",
    sheetId: sheet.id,
    start: { row: 0, column: 0 },
    values: [
      ["2", "3", "=SUM(A1:B1)"],
      ["4", "5", "=A2+$B$1"],
    ],
  });
  return { workbook, sheet: workbook.sheets[0]! };
}

describe("stable workbook operations", () => {
  it("formats visible selections without changing hidden rows or columns", () => {
    const { workbook, sheet } = fixture();
    sheet.rows[1]!.hidden = true;
    sheet.columns[1]!.hidden = true;
    const range = { start: { row: 0, column: 0 }, end: { row: 2, column: 2 } };
    const formatted = applyOperation(workbook, {
      type: "format",
      sheetId: sheet.id,
      range,
      style: { wrap: true },
      visibleOnly: true,
    });
    expect(cellAt(formatted.sheets[0]!, { row: 0, column: 0 })!.style?.wrap).toBe(true);
    expect(cellAt(formatted.sheets[0]!, { row: 1, column: 0 })!.style).toBeUndefined();
    expect(cellAt(formatted.sheets[0]!, { row: 0, column: 1 })!.style).toBeUndefined();
    const all = applyOperation(workbook, {
      type: "format",
      sheetId: sheet.id,
      range,
      style: { bold: true },
    });
    const cleared = applyOperation(all, {
      type: "clear-formatting",
      sheetId: sheet.id,
      range,
      visibleOnly: true,
    });
    expect(cellAt(cleared.sheets[0]!, { row: 0, column: 0 })!.style).toBeUndefined();
    expect(cellAt(cleared.sheets[0]!, { row: 1, column: 0 })!.style?.bold).toBe(true);
    expect(cellAt(cleared.sheets[0]!, { row: 0, column: 1 })!.style?.bold).toBe(true);
  });

  it("persists wrapped vertical alignment with row dimensions and rejects invalid styles", () => {
    const { workbook, sheet } = fixture();
    const range = { start: { row: 0, column: 0 }, end: { row: 1, column: 1 } };
    let next = applyOperation(workbook, {
      type: "format",
      sheetId: sheet.id,
      range,
      style: { wrap: true, verticalAlign: "bottom", fontSize: 18 },
    });
    next = applyOperation(next, {
      type: "resize-row",
      sheetId: sheet.id,
      rowId: sheet.rows[0]!.id,
      height: 96,
    });
    const saved = deserializeWorkbook(serializeWorkbook(next));
    expect(saved.sheets[0]!.rows[0]!.height).toBe(96);
    expect(cellAt(saved.sheets[0]!, { row: 1, column: 1 })!.style).toMatchObject({
      wrap: true,
      verticalAlign: "bottom",
      fontSize: 18,
    });
    expect(() =>
      applyOperation(next, {
        type: "format",
        sheetId: sheet.id,
        range,
        style: { verticalAlign: "baseline" as "bottom" },
      }),
    ).toThrow("Invalid vertical alignment");
    expect(cellAt(next.sheets[0]!, { row: 0, column: 0 })!.input).toBe("2");
  });

  it("validates all edits before applying a record batch and preserves bindings", () => {
    const sheet = createSheet("Requirements", { rows: 3, columns: 2, mode: "records" });
    sheet.rows[0] = { id: "headers", readonly: true };
    sheet.rows[1] = { id: "row-requirement", recordId: "req-1", revision: "v7" };
    sheet.columns[0] = { id: "statement", name: "Statement", fieldId: "statement", type: "text" };
    sheet.columns[1] = {
      id: "status",
      name: "Status",
      fieldId: "status",
      type: "select",
      options: ["open", "closed"],
    };
    const initial = createWorkbook("Requirements", [sheet]);
    expect(() =>
      applyEdits(initial, sheet.id, [
        { rowId: "row-requirement", columnId: "statement", value: "New statement" },
        { rowId: "row-requirement", columnId: "status", value: "invalid" },
      ]),
    ).toThrow("dropdown");
    expect(initial.sheets[0]!.cells).toEqual({});
    const next = applyEdits(initial, sheet.id, [
      { rowId: "row-requirement", columnId: "status", value: "open" },
    ]);
    expect(next.sheets[0]!.cells["row-requirement"]!["status"]!.binding).toEqual({
      recordId: "req-1",
      fieldId: "status",
      revision: "v7",
    });
    expect(() =>
      applyEdits(next, sheet.id, [{ rowId: "headers", columnId: "statement", value: "Changed" }]),
    ).toThrow("read only");
    expect(() =>
      applyEdits(next, sheet.id, [
        { rowId: "row-requirement", columnId: "statement", value: "=1+1" },
      ]),
    ).toThrow("analysis sheet");
    expect(() =>
      applyOperation(next, { type: "insert-rows", sheetId: sheet.id, index: 0, count: 1 }),
    ).toThrow("source");
  });

  it("keeps stable identities while inserting and deleting axes and updates cross-sheet formulas", () => {
    const { workbook, sheet } = fixture();
    const analysis = createSheet("Analysis", { rows: 3, columns: 2 });
    analysis.cells[analysis.rows[0]!.id] = {
      [analysis.columns[0]!.id]: { input: "=SUM(Source!A1:A2)" },
    };
    let next = applyOperation(workbook, { type: "add-sheet", sheet: analysis });
    next = applyOperation(next, { type: "insert-rows", sheetId: sheet.id, index: 1, count: 1 });
    expect(next.sheets[0]!.rows[2]!.id).toBe(sheet.rows[1]!.id);
    expect(cellAt(next.sheets[0]!, { row: 2, column: 2 })!.input).toBe("=A3+$B$1");
    expect(cellAt(next.sheets[1]!, { row: 0, column: 0 })!.input).toBe("=SUM(Source!A1:A3)");
    next = applyOperation(next, { type: "delete-rows", sheetId: sheet.id, index: 0, count: 1 });
    expect(cellAt(next.sheets[1]!, { row: 0, column: 0 })!.input).toBe("=SUM(Source!A1:A2)");
    expect(cellAt(next.sheets[0]!, { row: 1, column: 2 })!.input).toBe("=A2+#REF!");
    next = applyOperation(next, { type: "rename-sheet", sheetId: sheet.id, name: "New source" });
    expect(cellAt(next.sheets[1]!, { row: 0, column: 0 })!.input).toBe("=SUM('New source'!A1:A2)");
  });

  it("translates relative/mixed references without changing literal strings or function names", () => {
    expect(
      translateFormula(
        '=SUM(A1:$B$2)+C$3+$D4+LOG10(100)+"A1"',
        { row: 0, column: 0 },
        { row: 2, column: 1 },
      ),
    ).toBe('=SUM(B3:$B$2)+D$3+$D6+LOG10(100)+"A1"');
    expect(
      translateFormula(
        "='Sheet one'!A1+'O''Brien'!$B2",
        { row: 0, column: 0 },
        { row: 1, column: 1 },
      ),
    ).toBe("='Sheet one'!B2+'O''Brien'!$B3");
    expect(shiftFormulaAxis("=SUM(A2:A5)", "One", "One", "row", 1, 2, true)).toBe("=SUM(A2:A3)");
    expect(shiftFormulaAxis("=SUM(A2:A3)", "One", "One", "row", 1, 2, true)).toBe("=SUM(#REF!)");
    expect(
      translateFormula("=SUM(A:B,$C:$D,1:3,$4:$5)", { row: 0, column: 0 }, { row: 2, column: 1 }),
    ).toBe("=SUM(B:C,$C:$D,3:5,$4:$5)");
    expect(shiftFormulaAxis("=SUM(One!A:C)", "Other", "One", "column", 1, 1, false)).toBe(
      "=SUM(One!A:D)",
    );
  });

  it("fills formulas and numeric series atomically, including formatting", () => {
    const { workbook, sheet } = fixture();
    const filled = applyOperation(workbook, {
      type: "fill",
      sheetId: sheet.id,
      source: { start: { row: 0, column: 2 }, end: { row: 1, column: 2 } },
      target: { start: { row: 2, column: 2 }, end: { row: 3, column: 2 } },
    });
    expect(cellAt(filled.sheets[0]!, { row: 2, column: 2 })!.input).toBe("=SUM(A3:B3)");
    const series = applyOperation(filled, {
      type: "fill",
      sheetId: sheet.id,
      source: { start: { row: 0, column: 0 }, end: { row: 1, column: 0 } },
      target: { start: { row: 2, column: 0 }, end: { row: 4, column: 0 } },
      series: true,
    });
    expect(cellAt(series.sheets[0]!, { row: 4, column: 0 })!.input).toBe("10");
    expect(() =>
      applyOperation(series, {
        type: "format",
        sheetId: sheet.id,
        range: { start: { row: 0, column: 0 }, end: { row: 100_000, column: 100 } },
        style: { bold: true },
      }),
    ).toThrow();
  });

  it("fills formatting from empty source cells without requiring dense empty storage", () => {
    const sheet = createSheet("Styles", { rows: 3, columns: 2 });
    let workbook = createWorkbook("Styles", [sheet]);
    workbook = applyOperation(workbook, {
      type: "format",
      sheetId: sheet.id,
      range: { start: { row: 0, column: 0 }, end: { row: 0, column: 0 } },
      style: { background: "#FFEEDD" },
    });
    const filled = applyOperation(workbook, {
      type: "fill",
      sheetId: sheet.id,
      source: { start: { row: 0, column: 0 }, end: { row: 0, column: 0 } },
      target: { start: { row: 1, column: 0 }, end: { row: 2, column: 0 } },
    });
    expect(cellAt(filled.sheets[0]!, { row: 2, column: 0 })).toEqual({
      input: "",
      style: { background: "#FFEEDD" },
    });
    expect(cellAt(workbook.sheets[0]!, { row: 2, column: 0 })).toBeUndefined();
  });
  it("undo/redo restores a whole operation while revisions keep increasing", () => {
    const { workbook, sheet } = fixture();
    const history = createHistory(workbook);
    history.apply({ type: "rename-sheet", sheetId: sheet.id, name: "Renamed" });
    expect(history.undo().sheets[0]!.name).toBe("Source");
    const previous = history.current.revision;
    expect(history.redo().sheets[0]!.name).toBe("Renamed");
    expect(history.current.revision).toBeGreaterThan(previous);
    expect(() => applyEdits(history.current, sheet.id, [], { expectedRevision: 0 })).toThrow(
      "changed",
    );
  });

  it("blocks unsafe structural rewrites and does not turn a duplicated record into formulas", () => {
    const source = createSheet("Records", { rows: 2, columns: 2, mode: "records" });
    source.rows[0]!.recordId = "record-1";
    source.columns[0]!.fieldId = "statement";
    source.cells[source.rows[0]!.id] = {
      [source.columns[0]!.id]: {
        input: '=INDIRECT("Records!A1")',
        binding: { recordId: "record-1", fieldId: "statement" },
      },
    };
    let workbook = createWorkbook("Literal copy", [source]);
    workbook = applyOperation(workbook, {
      type: "rename-sheet",
      sheetId: source.id,
      name: "Renamed",
    });
    expect(cellAt(workbook.sheets[0]!, { row: 0, column: 0 })!.input).toBe(
      '=INDIRECT("Records!A1")',
    );
    workbook = applyOperation(workbook, { type: "duplicate-sheet", sheetId: source.id });
    const cell = cellAt(workbook.sheets[1]!, { row: 0, column: 0 })!;
    expect(cell.binding).toBeUndefined();
    expect(cell.style?.format).toBe("text");
    expect(workbook.sheets[1]!.rows[0]!.recordId).toBeUndefined();
    const analysis = createSheet("Dynamic", { rows: 2, columns: 2 });
    analysis.cells[analysis.rows[0]!.id] = {
      [analysis.columns[0]!.id]: { input: '=INDIRECT("Renamed!A1")' },
    };
    workbook = applyOperation(workbook, { type: "add-sheet", sheet: analysis });
    expect(() =>
      applyOperation(workbook, { type: "rename-sheet", sheetId: source.id, name: "Next" }),
    ).toThrow("INDIRECT");
  });

  it("round trips snapshots and rejects dangling coordinates and unsafe keys", () => {
    const { workbook } = fixture();
    expect(deserializeWorkbook(serializeWorkbook(workbook))).toEqual(workbook);
    const invalid = structuredClone(workbook);
    invalid.sheets[0]!.cells["unknown"] = { unknown: { input: "x" } };
    expect(() => deserializeWorkbook(JSON.stringify(invalid))).toThrow("unknown row");
    const unsafe = structuredClone(workbook);
    unsafe.sheets[0]!.rows[0]!.id = "__proto__";
    expect(() => deserializeWorkbook(JSON.stringify(unsafe))).toThrow("identity");
    expect(parseAddress("$XFD$1048576")).toEqual({ row: 1048575, column: 16383 });
    expect(cellAddress({ row: 9, column: 26 })).toBe("AA10");
  });
});

describe("delimited exchange", () => {
  it("round trips quoted multiline cells and rejects truncated quotes", () => {
    const values = [
      ["one,two", 'a "quote"', "two\nlines"],
      ["", "x", ""],
    ];
    expect(parseDelimited(serializeDelimited(values, ","), ",")).toEqual(values);
    expect(parseDelimited("a\tb\r\nc\td\r\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
    expect(() => parseDelimited('"unfinished', ",")).toThrow("not closed");
  });
  it("exports record content as inert text even when formulas are requested", () => {
    const sheet = createSheet("Records", { rows: 1, columns: 2, mode: "records" });
    sheet.cells[sheet.rows[0]!.id] = {
      [sheet.columns[0]!.id]: { input: "=HYPERLINK(1)" },
      [sheet.columns[1]!.id]: { input: " @SUM(1)" },
    };
    expect(parseDelimited(exportDelimited(sheet, { formulas: true }), ",")[0]).toEqual([
      "'=HYPERLINK(1)",
      "' @SUM(1)",
    ]);
  });
});

describe("analysis annotations and presentation metadata", () => {
  it("keeps notes on empty cells, enforces dropdowns atomically, and removes metadata independently", () => {
    const sheet = createSheet("Notes", { rows: 3, columns: 2 });
    const range = { start: { row: 0, column: 0 }, end: { row: 1, column: 0 } };
    let workbook = createWorkbook("Notes", [sheet]);
    workbook = applyOperation(workbook, {
      type: "set-comment",
      sheetId: sheet.id,
      rowId: sheet.rows[0]!.id,
      columnId: sheet.columns[0]!.id,
      comment: "Needs an owner\nReview tomorrow",
    });
    workbook = applyOperation(workbook, {
      type: "set-validation",
      sheetId: sheet.id,
      range,
      validation: { type: "list", options: ["Open", "Closed"] },
    });
    const before = serializeWorkbook(workbook);
    expect(() =>
      applyOperation(workbook, {
        type: "paste",
        sheetId: sheet.id,
        start: range.start,
        values: [["Open"], ["Unsupported"]],
      }),
    ).toThrow("dropdown");
    expect(serializeWorkbook(workbook)).toBe(before);
    workbook = applyOperation(workbook, {
      type: "paste",
      sheetId: sheet.id,
      start: range.start,
      values: [["Open"], ["Closed"]],
    });
    workbook = applyOperation(workbook, {
      type: "format",
      sheetId: sheet.id,
      range,
      style: {
        fontFamily: "Georgia",
        fontSize: 18,
        strikethrough: true,
        borderBottom: { style: "solid", width: 2, color: "#123456" },
      },
    });
    expect(deserializeWorkbook(serializeWorkbook(workbook))).toEqual(workbook);
    const cleared = applyOperation(workbook, {
      type: "clear-formatting",
      sheetId: sheet.id,
      range,
    });
    expect(cellAt(cleared.sheets[0]!, range.start)).toEqual({
      input: "Open",
      comment: "Needs an owner\nReview tomorrow",
      validation: { type: "list", options: ["Open", "Closed"] },
    });
    const noRule = applyOperation(cleared, {
      type: "set-validation",
      sheetId: sheet.id,
      range,
      validation: null,
    });
    const noNote = applyOperation(noRule, {
      type: "set-comment",
      sheetId: sheet.id,
      rowId: sheet.rows[0]!.id,
      columnId: sheet.columns[0]!.id,
      comment: null,
    });
    expect(cellAt(noNote.sheets[0]!, range.start)).toEqual({ input: "Open" });
    expect(cellAt(workbook.sheets[0]!, range.start)?.comment).toContain("owner");
    expect(() =>
      applyOperation(workbook, {
        type: "set-validation",
        sheetId: sheet.id,
        range,
        validation: { type: "list", options: ["Changed"] },
      }),
    ).toThrow("dropdown");
  });

  it("rejects unsafe metadata and source annotations without changing records", () => {
    const sheet = createSheet("Records", { rows: 2, columns: 2, mode: "records" });
    const workbook = createWorkbook("Source", [sheet]);
    expect(() =>
      applyOperation(workbook, {
        type: "set-comment",
        sheetId: sheet.id,
        rowId: sheet.rows[0]!.id,
        columnId: sheet.columns[0]!.id,
        comment: "Not a canonical comment",
      }),
    ).toThrow("analysis");
    expect(() =>
      applyOperation(workbook, {
        type: "set-validation",
        sheetId: sheet.id,
        range: { start: { row: 0, column: 0 }, end: { row: 0, column: 0 } },
        validation: { type: "list", options: ["Changed schema"] },
      }),
    ).toThrow("analysis");
    const analysis = createWorkbook("Analysis", [createSheet("Analysis", { rows: 2, columns: 2 })]);
    const target = analysis.sheets[0]!;
    const invalidCells = [
      { input: "", comment: "a".repeat(10_001) },
      { input: "", validation: { type: "list", options: ["a", "a"] } },
      { input: "", validation: { type: "list", options: ["a,b"] } },
      { input: "", validation: { type: "list", options: ["=1+1"] } },
      { input: "", validation: { type: "list", options: ["a"], script: "alert(1)" } },
      { input: "outside", validation: { type: "list", options: ["a"] } },
      { input: "", style: { fontFamily: "url(https://example.com)" } },
      { input: "", style: { fontSize: 1000 } },
      { input: "", style: { borderTop: { width: 1, style: "solid", color: "red" } } },
    ];
    for (const invalid of invalidCells) {
      const raw = JSON.parse(serializeWorkbook(analysis));
      raw.sheets[0].cells[target.rows[0]!.id] = { [target.columns[0]!.id]: invalid };
      expect(() => deserializeWorkbook(JSON.stringify(raw))).toThrow();
    }
  });

  it("stores visibility and row height by stable IDs without deleting values or changing formulas", () => {
    const { workbook, sheet } = fixture();
    let next = applyOperation(workbook, {
      type: "set-rows-hidden",
      sheetId: sheet.id,
      rowIds: [sheet.rows[0]!.id],
      hidden: true,
    });
    next = applyOperation(next, {
      type: "set-columns-hidden",
      sheetId: sheet.id,
      columnIds: [sheet.columns[0]!.id],
      hidden: true,
    });
    next = applyOperation(next, {
      type: "resize-row",
      sheetId: sheet.id,
      rowId: sheet.rows[0]!.id,
      height: 72,
    });
    expect(next.sheets[0]!.rows[0]).toMatchObject({
      id: sheet.rows[0]!.id,
      height: 72,
      hidden: true,
    });
    expect(next.sheets[0]!.columns[0]!.hidden).toBe(true);
    expect(next.sheets[0]!.cells).toEqual(workbook.sheets[0]!.cells);
    expect(deserializeWorkbook(serializeWorkbook(next))).toEqual(next);
    expect(() =>
      applyOperation(next, {
        type: "set-rows-hidden",
        sheetId: sheet.id,
        rowIds: sheet.rows.map((row) => row.id),
        hidden: true,
      }),
    ).toThrow("visible");
    expect(() =>
      applyOperation(next, {
        type: "resize-row",
        sheetId: sheet.id,
        rowId: sheet.rows[0]!.id,
        height: 0,
      }),
    ).toThrow("24");
    const copied = applyOperation(next, { type: "duplicate-sheet", sheetId: sheet.id }).sheets[1]!;
    expect(copied.rows[0]).toMatchObject({ hidden: true, height: 72 });
    const unhidden = applyOperation(next, {
      type: "set-rows-hidden",
      sheetId: sheet.id,
      rowIds: [sheet.rows[0]!.id],
      hidden: false,
    });
    expect(unhidden.sheets[0]!.rows[0]!.hidden).toBeUndefined();
  });
});

it("clears visual formatting without converting literal copied record prose into formulas", () => {
  const sheet = createSheet("Literal analysis", { rows: 2, columns: 2 });
  sheet.cells[sheet.rows[0]!.id] = {
    [sheet.columns[0]!.id]: {
      input: "=SUM(1,2)",
      style: { format: "text", bold: true, color: "#123456" },
      comment: "Literal imported prose",
    },
  };
  const workbook = createWorkbook("Literal", [sheet]);
  const cleared = applyOperation(workbook, {
    type: "clear-formatting",
    sheetId: sheet.id,
    range: { start: { row: 0, column: 0 }, end: { row: 0, column: 0 } },
  });
  expect(cellAt(cleared.sheets[0]!, { row: 0, column: 0 })).toEqual({
    input: "=SUM(1,2)",
    style: { format: "text" },
    comment: "Literal imported prose",
  });
});

describe("range borders", () => {
  const border = { style: "dashed", color: "#234567", width: 2 } as const;
  const range = { start: { row: 0, column: 0 }, end: { row: 2, column: 2 } };
  const borderKeys = ["borderTop", "borderRight", "borderBottom", "borderLeft"] as const;

  it("replaces per-cell borders with one outside outline and undoes the entire range", () => {
    const { workbook, sheet } = fixture();
    const initial = applyOperation(workbook, {
      type: "format",
      sheetId: sheet.id,
      range,
      style: { bold: true, background: "#EEFFAA", borderTop: border, borderBottom: border },
    });
    const history = createHistory(initial);
    const outlined = history.apply({
      type: "borders",
      sheetId: sheet.id,
      range,
      preset: "outside",
      border,
    });
    for (let row = 0; row < 3; row++) {
      for (let column = 0; column < 3; column++) {
        const style = cellAt(outlined.sheets[0]!, { row, column })!.style!;
        expect(style).toMatchObject({ bold: true, background: "#EEFFAA" });
        expect(style.borderTop).toEqual(row === 0 ? border : undefined);
        expect(style.borderBottom).toEqual(row === 2 ? border : undefined);
        expect(style.borderLeft).toEqual(column === 0 ? border : undefined);
        expect(style.borderRight).toEqual(column === 2 ? border : undefined);
        expect(cellAt(outlined.sheets[0]!, { row, column })!.input).toBe(
          cellAt(initial.sheets[0]!, { row, column })!.input,
        );
      }
    }
    expect(outlined.revision).toBe(initial.revision + 1);
    expect(deserializeWorkbook(serializeWorkbook(outlined))).toEqual(outlined);
    expect(history.undo().sheets).toEqual(initial.sheets);
    expect(history.canUndo).toBe(false);
    expect(history.redo().sheets).toEqual(outlined.sheets);
    expect(cellAt(initial.sheets[0]!, { row: 1, column: 1 })!.style?.borderTop).toEqual(border);
  });

  it("uses visible outside and shared inside edges while leaving hidden axes unchanged", () => {
    const sheet = createSheet("Hidden", { rows: 5, columns: 5 });
    sheet.rows[0]!.hidden = true;
    sheet.rows[2]!.hidden = true;
    sheet.columns[0]!.hidden = true;
    sheet.columns[2]!.hidden = true;
    const selected = { start: { row: 4, column: 4 }, end: { row: 0, column: 0 } };
    const initial = applyOperation(createWorkbook("Hidden borders", [sheet]), {
      type: "format",
      sheetId: sheet.id,
      range: selected,
      style: { color: "#AABBCC", borderTop: border, borderLeft: border },
    });
    const outside = applyOperation(initial, {
      type: "borders",
      sheetId: sheet.id,
      range: selected,
      preset: "outside",
      border,
      visibleOnly: true,
    });
    const inside = applyOperation(outside, {
      type: "borders",
      sheetId: sheet.id,
      range: selected,
      preset: "inside",
      border,
      visibleOnly: true,
    });
    for (let row = 0; row < 5; row++) {
      for (let column = 0; column < 5; column++) {
        const before = cellAt(initial.sheets[0]!, { row, column })!;
        const outlined = cellAt(outside.sheets[0]!, { row, column })!;
        const divided = cellAt(inside.sheets[0]!, { row, column })!;
        if ([0, 2].includes(row) || [0, 2].includes(column)) {
          expect(outlined).toEqual(before);
          expect(divided).toEqual(before);
          continue;
        }
        expect(outlined.style!.borderTop).toEqual(row === 1 ? border : undefined);
        expect(outlined.style!.borderBottom).toEqual(row === 4 ? border : undefined);
        expect(outlined.style!.borderLeft).toEqual(column === 1 ? border : undefined);
        expect(outlined.style!.borderRight).toEqual(column === 4 ? border : undefined);
        expect(divided.style!.borderTop).toEqual(row !== 1 ? border : undefined);
        expect(divided.style!.borderBottom).toEqual(row !== 4 ? border : undefined);
        expect(divided.style!.borderLeft).toEqual(column !== 1 ? border : undefined);
        expect(divided.style!.borderRight).toEqual(column !== 4 ? border : undefined);
        expect(divided.style!.color).toBe("#AABBCC");
      }
    }
    expect(deserializeWorkbook(serializeWorkbook(inside))).toEqual(inside);
  });

  it("adds individual outer edges and clears only borders on protected source fields", () => {
    const sheet = createSheet("Requirements", { rows: 3, columns: 3, mode: "records" });
    sheet.rows[0]!.readonly = true;
    sheet.columns[0]!.readonly = true;
    sheet.cells[sheet.rows[0]!.id] = {
      [sheet.columns[0]!.id]: {
        input: "=literal requirement",
        binding: { recordId: "requirement-1", fieldId: "statement", revision: "7" },
        style: { format: "text", wrap: true, color: "#112233" },
      },
    };
    const initial = createWorkbook("Source presentation", [sheet]);
    let next = initial;
    for (const preset of ["top", "right", "bottom", "left"] as const)
      next = applyOperation(next, { type: "borders", sheetId: sheet.id, range, preset, border });
    expect(cellAt(next.sheets[0]!, { row: 1, column: 1 })).toBeUndefined();
    expect(cellAt(next.sheets[0]!, { row: 0, column: 1 })!.style).toEqual({ borderTop: border });
    expect(cellAt(next.sheets[0]!, { row: 1, column: 2 })!.style).toEqual({ borderRight: border });
    expect(cellAt(next.sheets[0]!, { row: 2, column: 1 })!.style).toEqual({ borderBottom: border });
    expect(cellAt(next.sheets[0]!, { row: 1, column: 0 })!.style).toEqual({ borderLeft: border });
    const cleared = applyOperation(next, {
      type: "borders",
      sheetId: sheet.id,
      range,
      preset: "none",
    });
    expect(cleared.sheets).toEqual(initial.sheets);
    expect(deserializeWorkbook(serializeWorkbook(cleared))).toEqual(cleared);
    expect(() =>
      applyOperation(initial, { type: "borders", sheetId: sheet.id, range, preset: "outside" }),
    ).toThrow("Choose a border style");
    expect(() =>
      applyOperation(initial, {
        type: "borders",
        sheetId: sheet.id,
        range,
        preset: "diagonal" as "outside",
        border,
      }),
    ).toThrow("supported border preset");
    expect(() =>
      applyOperation(initial, {
        type: "borders",
        sheetId: sheet.id,
        range,
        preset: "all",
        border: { ...border, color: "red" },
      }),
    ).toThrow("Invalid cell border");
    expect(initial.sheets[0]!.cells).toEqual(sheet.cells);
  });

  it("all and none preserve comments, dropdowns and non-border styles", () => {
    const sheet = createSheet("Review", { rows: 3, columns: 3 });
    sheet.cells[sheet.rows[0]!.id] = {
      [sheet.columns[0]!.id]: {
        input: "Open",
        comment: "Owner review",
        validation: { type: "list", options: ["Open", "Closed"] },
        style: { italic: true },
      },
    };
    const initial = createWorkbook("Review", [sheet]);
    const all = applyOperation(initial, {
      type: "borders",
      sheetId: sheet.id,
      range,
      preset: "all",
      border,
    });
    for (let row = 0; row < 3; row++)
      for (let column = 0; column < 3; column++)
        for (const key of borderKeys)
          expect(cellAt(all.sheets[0]!, { row, column })!.style![key]).toEqual(border);
    const cleared = applyOperation(all, {
      type: "borders",
      sheetId: sheet.id,
      range,
      preset: "none",
    });
    expect(cleared.sheets).toEqual(initial.sheets);
    const single = applyOperation(all, {
      type: "borders",
      sheetId: sheet.id,
      range: { start: { row: 0, column: 0 }, end: { row: 0, column: 0 } },
      preset: "inside",
      border,
    });
    expect(cellAt(single.sheets[0]!, { row: 0, column: 0 })).toEqual(
      cellAt(initial.sheets[0]!, { row: 0, column: 0 }),
    );
  });
});
