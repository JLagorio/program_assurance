import assert from "node:assert/strict";
import test from "node:test";

import { clampPage, sortRows } from "../src/components/table-sort.ts";

const ids = (rows) => rows.map((row) => row.id);

test("dates sort by their raw ISO value, not by the label a cell formats", () => {
  const rows = [
    { id: "a", due: "2026-09-14" },
    { id: "b", due: "2026-09-18" },
    { id: "c", due: "2026-09-02" },
    { id: "d", due: "2026-09-30" },
    { id: "e", due: "2026-09-09" },
  ];
  assert.deepEqual(ids(sortRows(rows, (r) => r.due, "asc", "en-US")), ["c", "e", "a", "b", "d"]);
  assert.deepEqual(ids(sortRows(rows, (r) => r.due, "desc", "en-US")), ["d", "b", "a", "e", "c"]);
  const dates = rows.map((r) => ({ id: r.id, due: new Date(`${r.due}T12:00:00Z`) }));
  assert.deepEqual(ids(sortRows(dates, (r) => r.due, "asc", "en-US")), ["c", "e", "a", "b", "d"]);
});

test("text collates in the given locale, with numbers inside it read as numbers", () => {
  const rows = [{ id: "CTRL-10" }, { id: "CTRL-9" }, { id: "CTRL-100" }];
  assert.deepEqual(ids(sortRows(rows, (r) => r.id, "asc", "en-US")), [
    "CTRL-9",
    "CTRL-10",
    "CTRL-100",
  ]);
  // Swedish puts "ä" after "z"; English puts it beside "a".
  const words = [{ id: "ärende" }, { id: "zon" }, { id: "avtal" }];
  assert.deepEqual(ids(sortRows(words, (r) => r.id, "asc", "sv-SE")), ["avtal", "zon", "ärende"]);
  assert.deepEqual(ids(sortRows(words, (r) => r.id, "asc", "en-US")), ["ärende", "avtal", "zon"]);
});

test("absent values sort last in either direction, and ties keep their order", () => {
  const rows = [
    { id: "a", score: null },
    { id: "b", score: 3 },
    { id: "c", score: undefined },
    { id: "d", score: 1 },
    { id: "e", score: 3 },
    { id: "f", score: "" },
  ];
  assert.deepEqual(ids(sortRows(rows, (r) => r.score, "asc", "en-US")), [
    "d",
    "b",
    "e",
    "a",
    "c",
    "f",
  ]);
  assert.deepEqual(ids(sortRows(rows, (r) => r.score, "desc", "en-US")), [
    "b",
    "e",
    "d",
    "a",
    "c",
    "f",
  ]);
  const input = rows.slice();
  sortRows(rows, (r) => r.score, "asc", "en-US");
  assert.deepEqual(rows, input, "the given rows are not reordered in place");
});

test("the page clamps to the list it pages", () => {
  assert.equal(clampPage(3, 23, 8), 3);
  assert.equal(clampPage(4, 23, 8), 3, "past the last page, the last page");
  assert.equal(clampPage(3, 5, 8), 1, "the list shrank to one page");
  assert.equal(clampPage(2, 0, 8), 1, "an empty list still has page 1");
  assert.equal(clampPage(0, 23, 8), 1);
});
