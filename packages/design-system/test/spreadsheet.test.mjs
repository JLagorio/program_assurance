import { test } from "node:test";
import assert from "node:assert/strict";
import {
  columnName,
  parseAddress,
  parseTsv,
  serializeTsv,
  selectionBounds,
  validateCell,
} from "../src/patterns/spreadsheet/model.ts";

test("quoted rectangular TSV preserves embedded line breaks, tabs and quotes", () => {
  const values = [
    ["a\tb", 'say "yes"', "first\nsecond", ""],
    ["", "=SUM(A1:A2)", "3", "end"],
  ];
  assert.deepEqual(parseTsv(serializeTsv(values)), values);
  assert.deepEqual(parseTsv("1\t2\r\n3\r\n"), [
    ["1", "2"],
    ["3", ""],
  ]);
  assert.throws(() => parseTsv('"unclosed'));
});

test("addresses remain display coordinates beyond Z and reject invalid positions", () => {
  for (const [index, name] of [
    [0, "A"],
    [25, "Z"],
    [26, "AA"],
    [59, "BH"],
    [702, "AAA"],
  ]) {
    assert.equal(columnName(index), name);
    assert.deepEqual(parseAddress(`${name}17`), { row: 16, column: index });
  }
  for (const invalid of ["A0", "A-1", "1A", "A1:B2", "X999999999999999999999"])
    assert.equal(parseAddress(invalid), null);
});

test("selection follows stable ids after reordering and drops removed records", () => {
  const rows = [
    { id: "two", values: {} },
    { id: "one", values: {} },
  ];
  const columns = [
    { id: "b", label: "B" },
    { id: "a", label: "A" },
  ];
  const selection = {
    anchor: { rowId: "one", columnId: "a" },
    focus: { rowId: "two", columnId: "b" },
  };
  assert.deepEqual(selectionBounds(selection, rows, columns), {
    top: 0,
    bottom: 1,
    start: 0,
    end: 1,
  });
  assert.equal(selectionBounds(selection, rows.slice(0, 1), columns), null);
});

test("typed validation preserves formulas, rejects invalid numbers and impossible dates", () => {
  assert.equal(validateCell({ id: "n", label: "Number", type: "number" }, "=SUM(A1:A2)"), null);
  assert.equal(
    validateCell({ id: "n", label: "Number", type: "number" }, "Infinity"),
    "Enter a number or a formula.",
  );
  assert.notEqual(validateCell({ id: "d", label: "Date", type: "date" }, "2026-02-30"), null);
  assert.equal(validateCell({ id: "d", label: "Date", type: "date" }, "2028-02-29"), null);
  assert.notEqual(
    validateCell(
      { id: "s", label: "Stage", type: "choice", options: [{ value: "ready", label: "Ready" }] },
      "Ready",
    ),
    null,
  );
});
