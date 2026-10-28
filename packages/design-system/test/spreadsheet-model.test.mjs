import assert from "node:assert/strict";
import { test } from "node:test";
import {
  spreadsheetView,
  spreadsheetPaste,
  spreadsheetFill,
  wrappedLineCount,
  serializeTsv,
} from "../src/patterns/spreadsheet/model.ts";

const columns = ["a", "b", "c", "d"].map((id) => ({ id, label: id.toUpperCase() }));
const rows = [
  { id: "one", values: { a: "first", b: "=A1", c: "3", d: "4" } },
  { id: "two", values: { a: "second", b: "5", c: "6", d: "7" } },
  { id: "three", values: { a: "third", b: "8", c: "9", d: "10" } },
];
const selected = (rowId, columnId, endRow = rowId, endColumn = columnId) => ({
  anchor: { rowId, columnId },
  focus: { rowId: endRow, columnId: endColumn },
});
const valueAt = (cell) => rows.find((row) => row.id === cell.rowId)?.values[cell.columnId] ?? "";
const source = (rowId, columnId) => ({ rowId, columnId, value: valueAt({ rowId, columnId }) });
function clipboard(cells, options = {}) {
  const matrix = cells.map((row) => row.map((cell) => cell.value));
  return {
    kind: "copy",
    sheetId: "sheet-one",
    text: serializeTsv(matrix),
    display: matrix,
    rowNumbers: [1],
    columnNumbers: [0],
    source: cells.flat(),
    ...options,
  };
}
function paste(options) {
  const view = spreadsheetView(rows, columns);
  return spreadsheetPaste({
    ...view,
    selection: selected("two", "a"),
    text: "",
    clipboard: null,
    sheetId: "sheet-one",
    valueAt,
    canWrite: () => true,
    ...options,
  });
}

test("hidden view keeps original A1 coordinates and never mutates or drops canonical data", () => {
  const before = structuredClone({ rows, columns });
  const view = spreadsheetView(rows, columns, ["one"], ["a", "c"]);
  assert.deepEqual(
    view.rows.map((row) => [row.id, row.rowNumber]),
    [
      ["two", 2],
      ["three", 3],
    ],
  );
  assert.deepEqual(
    view.columns.map((column) => column.id),
    ["b", "d"],
  );
  assert.deepEqual(view.columnNumbers, [1, 3]);
  assert.deepEqual({ rows, columns }, before);
  const sorted = spreadsheetView(
    [
      { ...rows[2], rowNumber: 3 },
      { ...rows[0], rowNumber: 1 },
    ],
    columns,
    ["one"],
  );
  assert.equal(sorted.rows[0].rowNumber, 3);
});

test("paste skips hidden coordinates while translating copied formulas from canonical source positions", () => {
  const view = spreadsheetView(rows, columns, ["two"], ["b"]);
  const clip = clipboard(
    [
      [
        { rowId: "one", columnId: "b", value: "=A1" },
        { rowId: "one", columnId: "d", value: "=C1" },
      ],
    ],
    { rowNumbers: [1], columnNumbers: [1, 3] },
  );
  const calls = [];
  const result = paste({
    ...view,
    selection: selected("three", "c"),
    text: clip.text,
    clipboard: clip,
    translateInput: (value, from, to) => {
      calls.push({ value, from, to });
      return `${value} translated`;
    },
  });
  assert.deepEqual(
    result.edits.map((edit) => [edit.rowId, edit.columnId]),
    [
      ["three", "c"],
      ["three", "d"],
    ],
  );
  assert.deepEqual(calls, [
    { value: "=A1", from: { row: 0, column: 1 }, to: { row: 2, column: 2 } },
    { value: "=C1", from: { row: 0, column: 3 }, to: { row: 2, column: 3 } },
  ]);
});

test("overlapping cut forms one atomic map and destination cells win over source clears", () => {
  const clip = clipboard([[source("one", "a"), source("one", "b")]], {
    kind: "cut",
    columnNumbers: [0, 1],
  });
  const result = paste({
    selection: selected("one", "b"),
    text: clip.text,
    clipboard: clip,
    translateInput: () => {
      throw new Error("A cut must preserve formula text.");
    },
  });
  assert.equal(result.cut, true);
  assert.deepEqual(result.edits, [
    { rowId: "one", columnId: "a", value: "" },
    { rowId: "one", columnId: "b", value: "first" },
    { rowId: "one", columnId: "c", value: "=A1" },
  ]);
  assert.equal(valueAt(source("one", "a")), "first", "planning must not clear the source");
});

test("cut keeps its original footprint while a copied single value fills a selected range", () => {
  const clip = clipboard([[source("one", "a")]], { kind: "cut" });
  const target = selected("two", "b", "three", "c");
  const cut = paste({ selection: target, text: clip.text, clipboard: clip });
  assert.equal(cut.edits.length, 2);
  assert.deepEqual(cut.edits[1], { rowId: "two", columnId: "b", value: "first" });
  const copy = paste({ selection: target, text: clip.text, clipboard: { ...clip, kind: "copy" } });
  assert.equal(copy.edits.length, 4);
});

test("cut and paste reject protected source or destination cells without a partial write plan", () => {
  const clip = clipboard([[source("one", "a"), source("one", "b")]], {
    kind: "cut",
    columnNumbers: [0, 1],
  });
  assert.throws(
    () =>
      paste({
        text: clip.text,
        clipboard: clip,
        canWrite: (cell) => cell.rowId !== "one" || cell.columnId !== "a",
      }),
    /cut range includes a read-only cell/,
  );
  assert.throws(
    () =>
      paste({
        text: clip.text,
        clipboard: clip,
        canWrite: (cell) => cell.rowId !== "two" || cell.columnId !== "b",
      }),
    /pasted range includes a read-only cell/,
  );
  assert.equal(rows[0].values.a, "first");
});

test("stale and cross-sheet cuts are rejected; copying across sheets preserves translation", () => {
  const clip = clipboard([[source("one", "a")]], { kind: "cut" });
  assert.throws(
    () => paste({ text: clip.text, clipboard: clip, valueAt: () => "new value" }),
    /cut cells changed/,
  );
  assert.throws(
    () => paste({ text: clip.text, clipboard: clip, sheetId: "sheet-two" }),
    /original sheet/,
  );
  const result = paste({
    text: clip.text,
    clipboard: { ...clip, kind: "copy" },
    sheetId: "sheet-two",
    translateInput: (value) => `${value} translated`,
  });
  assert.equal(result.edits[0].value, "first translated");
});

test("Paste values uses calculated plain values and treats leading equals as literal text", () => {
  const clip = clipboard([[{ rowId: "one", columnId: "b", value: "=SUM(C1:D1)" }]], {
    columnNumbers: [1],
    display: [["1200"]],
  });
  const result = paste({
    text: clip.text,
    clipboard: clip,
    valuesOnly: true,
    translateInput: () => {
      throw new Error("Values must not translate formulas.");
    },
  });
  assert.equal(result.edits[0].value, "1200");
  const literal = paste({ text: "=untrusted prose", valuesOnly: true });
  assert.equal(literal.edits[0].value, "'=untrusted prose");
});

test("oversized paste is bounded by visible destinations and leaves its cut receipt intact", () => {
  const view = spreadsheetView(rows, columns, [], ["b", "c", "d"]);
  const clip = clipboard([[source("one", "a"), source("one", "b")]], {
    kind: "cut",
    columnNumbers: [0, 1],
  });
  const before = structuredClone(clip);
  assert.throws(
    () => paste({ ...view, text: clip.text, clipboard: clip }),
    /larger than this sheet/,
  );
  assert.deepEqual(clip, before);
});

test("record-backed Paste values can preserve literal leading equals without an apostrophe", () => {
  const calls = [];
  const result = paste({
    text: "=literal requirement statement",
    valuesOnly: true,
    preparePasteValue: (cell, text) => {
      calls.push(cell);
      return text;
    },
  });
  assert.equal(result.edits[0].value, "=literal requirement statement");
  assert.deepEqual(calls, [{ rowId: "two", columnId: "a" }]);
});

test("wrapped height uses real word breaks, explicit newlines, and long-token wrapping", () => {
  const measure = (text) => text.length * 10;
  assert.equal(
    wrappedLineCount("sixsix sixsix sixsix", 100, measure),
    3,
    "total width predicts two lines, but three words cannot fit in two lines",
  );
  assert.equal(wrappedLineCount("one\ntwo\n", 100, measure), 3);
  assert.equal(wrappedLineCount("abcdefghijklmnopqrstuvw", 100, measure), 3);
  assert.equal(wrappedLineCount("", 100, measure), 1);
});

test("fill repeats blocks forward and backward without inventing numeric series or modifying its seed", () => {
  const view = spreadsheetView(rows, columns);
  const before = structuredClone(rows);
  const filled = spreadsheetFill({
    ...view,
    source: selected("two", "b", "three", "c"),
    target: selected("one", "b", "three", "c"),
    canWrite: () => true,
  });
  assert.deepEqual(filled, [
    { rowId: "one", columnId: "b", value: "8" },
    { rowId: "one", columnId: "c", value: "9" },
  ]);
  const sideways = spreadsheetFill({
    ...view,
    source: selected("two", "a", "two", "b"),
    target: selected("two", "a", "two", "d"),
    canWrite: () => true,
  });
  assert.deepEqual(
    sideways.map((cell) => cell.value),
    ["second", "5"],
  );
  assert.deepEqual(rows, before);
});

test("fill translates canonical formulas while hidden identities are excluded from writes", () => {
  const view = spreadsheetView(rows, columns, ["two"], ["a", "c"]);
  const calls = [];
  const filled = spreadsheetFill({
    ...view,
    source: selected("one", "b"),
    target: selected("one", "b", "three", "b"),
    canWrite: () => true,
    translateInput: (input, from, to) => {
      calls.push({ input, from, to });
      return "=A3";
    },
  });
  assert.deepEqual(filled, [{ rowId: "three", columnId: "b", value: "=A3" }]);
  assert.deepEqual(calls, [
    { input: "=A1", from: { row: 0, column: 1 }, to: { row: 2, column: 1 } },
  ]);
});

test("fill rejects protected source and destination before invoking translation", () => {
  const view = spreadsheetView(rows, columns);
  for (const protectedRow of ["one", "three"])
    assert.throws(
      () =>
        spreadsheetFill({
          ...view,
          source: selected("one", "a"),
          target: selected("one", "a", "three", "a"),
          canWrite: (cell) => cell.rowId !== protectedRow,
          translateInput: () => {
            assert.fail("No translation should run before protection validation");
          },
        }),
      /fill range includes a read-only cell/,
    );
});

test("fill refuses two-axis expansion and stale identity selections", () => {
  const view = spreadsheetView(rows, columns);
  assert.throws(
    () =>
      spreadsheetFill({
        ...view,
        source: selected("one", "a"),
        target: selected("one", "a", "three", "c"),
        canWrite: () => true,
      }),
    /one direction/,
  );
  assert.throws(
    () =>
      spreadsheetFill({
        ...view,
        source: selected("missing", "a"),
        target: selected("one", "a"),
        canWrite: () => true,
      }),
    /no longer visible/,
  );
  assert.deepEqual(
    spreadsheetFill({
      ...view,
      source: selected("one", "a"),
      target: selected("one", "a"),
      canWrite: () => true,
    }),
    [],
  );
});

test("cross-sheet copy retains literal formula-shaped inputs alongside genuine formulas", () => {
  const clip = clipboard(
    [
      [
        { rowId: "one", columnId: "a", value: "=1+1" },
        { rowId: "one", columnId: "b", value: "=A1*2" },
      ],
    ],
    {
      literal: [[true, false]],
      columnNumbers: [0, 1],
      display: [["=1+1", "2"]],
    },
  );
  const calls = [];
  const result = paste({
    text: clip.text,
    clipboard: clip,
    sheetId: "analysis-two",
    translateInput: (value, from, to) => {
      calls.push({ value, from, to });
      return "=A2*2";
    },
  });
  assert.deepEqual(result.edits, [
    { rowId: "two", columnId: "a", value: "'=1+1" },
    { rowId: "two", columnId: "b", value: "=A2*2" },
  ]);
  assert.deepEqual(calls, [
    { value: "=A1*2", from: { row: 0, column: 1 }, to: { row: 1, column: 1 } },
  ]);
  assert.equal(clip.text, "=1+1\t=A1*2", "OS clipboard TSV remains the source text");
  assert.equal(paste({ text: clip.text, clipboard: clip, valuesOnly: true }).edits[1].value, "2");
});

test("literal copy uses destination encoding for text-format or record cells and skips stale receipt flags", () => {
  const clip = clipboard([[{ rowId: "one", columnId: "a", value: "=1+1" }]], { literal: [[true]] });
  const calls = [];
  const result = paste({
    text: clip.text,
    clipboard: clip,
    sheetId: "records",
    preparePasteValue: (cell, input) => {
      calls.push(cell);
      return input;
    },
    translateInput: () => {
      throw new Error("Literal text must not translate.");
    },
  });
  assert.equal(result.edits[0].value, "=1+1");
  assert.deepEqual(calls, [{ rowId: "two", columnId: "a" }]);
  assert.equal(paste({ text: "=2+2", clipboard: clip }).edits[0].value, "=2+2");
});

test("cut moves text-formatted formula-shaped input atomically and preserves the raw source receipt", () => {
  const clip = clipboard([[{ rowId: "one", columnId: "a", value: "=1+1" }]], {
    literal: [[true]],
    kind: "cut",
  });
  const original = structuredClone(clip);
  const result = paste({ text: clip.text, clipboard: clip, valueAt: () => "=1+1" });
  assert.deepEqual(result.edits, [
    { rowId: "one", columnId: "a", value: "" },
    { rowId: "two", columnId: "a", value: "'=1+1" },
  ]);
  assert.equal(result.cut, true);
  assert.deepEqual(clip, original);
});

test("fill keeps literal formulas literal while translating genuine formulas in the same block", () => {
  const mixed = [
    { id: "one", rowNumber: 1, values: { a: "=1+1", b: "=C1*2" } },
    { id: "two", rowNumber: 3, values: { a: "", b: "" } },
  ];
  const options = {
    ...spreadsheetView(mixed, columns.slice(0, 2)),
    source: selected("one", "a", "one", "b"),
    target: selected("one", "a", "two", "b"),
    isCellLiteral: (cell) => cell.columnId === "a",
    canWrite: () => true,
    translateInput: (input, from, to) => {
      assert.equal(input, "=C1*2");
      assert.equal(from.row, 0);
      assert.equal(to.row, 2);
      return "=C3*2";
    },
  };
  assert.deepEqual(spreadsheetFill(options), [
    { rowId: "two", columnId: "a", value: "'=1+1" },
    { rowId: "two", columnId: "b", value: "=C3*2" },
  ]);
  assert.equal(
    spreadsheetFill({ ...options, preparePasteValue: (_cell, input) => input })[0].value,
    "=1+1",
  );
  assert.deepEqual(mixed[1].values, { a: "", b: "" }, "A fill plan never mutates its input rows");
});

test("rich paste maps authored replacement styles to visible stable destinations atomically", () => {
  const clip = clipboard([[source("one", "a"), source("one", "b")]], {
    styles: [[{ bold: true }, null]],
    columnNumbers: [0, 1],
  });
  const plan = paste({ text: clip.text, clipboard: clip, selection: selected("two", "c") });
  assert.deepEqual(plan.styles, [
    { rowId: "two", columnId: "c", style: { bold: true } },
    { rowId: "two", columnId: "d", style: null },
  ]);
  assert.deepEqual(
    plan.edits.map((edit) => edit.columnId),
    ["c", "d"],
  );
  assert.throws(
    () => paste({ text: clip.text, clipboard: clip, canWrite: (cell) => cell.columnId !== "b" }),
    /read-only/,
  );
});
test("formatting-only paste never moves cut source inputs and never replaces target input", () => {
  const clip = clipboard([[source("one", "a")]], { kind: "cut", styles: [[{ italic: true }]] });
  const plan = paste({ text: clip.text, clipboard: clip, formattingOnly: true });
  assert.deepEqual(plan.edits, []);
  assert.equal(plan.cut, false);
  assert.deepEqual(plan.styles, [{ rowId: "two", columnId: "a", style: { italic: true } }]);
  assert.throws(
    () => paste({ text: "external", formattingOnly: true }),
    /Copy cells in this workbook/,
  );
});
test("rich overlapping cut clears source styles then lets destination metadata win", () => {
  const clip = clipboard([[source("one", "a"), source("one", "b")]], {
    kind: "cut",
    styles: [[{ bold: true }, { italic: true }]],
    columnNumbers: [0, 1],
  });
  const plan = paste({ text: clip.text, clipboard: clip, selection: selected("one", "b") });
  assert.deepEqual(plan.styles, [
    { rowId: "one", columnId: "a", style: null },
    { rowId: "one", columnId: "b", style: { bold: true } },
    { rowId: "one", columnId: "c", style: { italic: true } },
  ]);
  assert.equal(plan.cut, true);
  assert.deepEqual(paste({ text: clip.text, clipboard: clip, valuesOnly: true }).styles, []);
});

test("rich paste encodes literal values against incoming style and stale cut styles reject", () => {
  const clip = clipboard([[source("one", "a")]], {
    literal: [[true]],
    styles: [[{ format: "text" }]],
  });
  const calls = [];
  paste({
    text: clip.text,
    clipboard: clip,
    preparePasteValue: (cell, input, style) => {
      calls.push(style);
      return input;
    },
  });
  assert.deepEqual(calls, [{ format: "text" }]);
  assert.throws(
    () =>
      paste({
        text: clip.text,
        clipboard: { ...clip, kind: "cut" },
        styleAt: () => ({ bold: true }),
      }),
    /formatting changed/,
  );
});
