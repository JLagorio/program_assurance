import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseStoredView,
  reconcileStoredView,
  readView,
  writeView,
  clearView,
  viewKey,
} from "../src/patterns/data-table/view-state.ts";
const valid = {
  v: 1,
  order: ["old", "name", "name"],
  sizing: { old: 50, name: 900 },
  visibility: { old: false, name: true },
  pinning: { start: ["name"], end: ["name", "old"] },
  density: "compact",
  pageSize: 50,
};
test("rejects incomplete or malformed persisted view state", () => {
  for (const value of [
    null,
    [],
    { v: 1 },
    { ...valid, order: "name" },
    { ...valid, sizing: [] },
    { ...valid, sizing: { name: Infinity } },
    { ...valid, sizing: { name: -1 } },
    { ...valid, sizing: { name: 10001 } },
    { ...valid, visibility: { name: "false" } },
    { ...valid, pinning: {} },
    { ...valid, density: "dense" },
    { ...valid, pageSize: 0 },
    { ...valid, pageSize: "20" },
    { ...valid, pageSize: 2.5 },
    { ...valid, v: 2 },
  ])
    assert.equal(parseStoredView(value), null);
});
test("deduplicates pins and reconciles changed column IDs and width bounds", () => {
  const parsed = parseStoredView(valid);
  assert.equal(parsed.pageSize, 50);
  assert.deepEqual(parsed.pinning, { start: ["name"], end: ["old"] });
  const restored = reconcileStoredView(parsed, [
    { id: "name", minSize: 80, maxSize: 240 },
    { id: "new" },
  ]);
  assert.deepEqual(restored.order, ["name", "new"]);
  assert.deepEqual(restored.sizing, { name: 240 });
  assert.deepEqual(restored.visibility, { name: true });
  assert.deepEqual(restored.pinning, { start: ["name"], end: [] });
});

test("storage reads discard corrupt JSON and keep view keys isolated", () => {
  const data = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
  });
  try {
    data.set(viewKey("broken"), "{");
    assert.equal(readView("broken"), null);
    data.set(viewKey("broken"), '{"v":1}');
    assert.equal(readView("broken"), null);
    writeView("first", valid);
    assert.ok(readView("first"));
    assert.equal(readView("second"), null);
    clearView("first");
    assert.equal(readView("first"), null);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("denied");
      },
    });
    assert.equal(readView("first"), null);
    assert.doesNotThrow(() => writeView("first", valid));
    assert.doesNotThrow(() => clearView("first"));
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});

test("a column added since the layout was stored takes the author's place, visibility and pin", () => {
  const stored = parseStoredView({
    v: 1,
    known: ["id", "name", "status", "actions"],
    order: ["status", "id", "name", "actions"],
    sizing: {},
    visibility: { name: true },
    pinning: { start: ["id"], end: ["actions"] },
  });
  const restored = reconcileStoredView(stored, [
    { id: "id" },
    { id: "owner", visible: false },
    { id: "name" },
    { id: "due", pin: "start" },
    { id: "status" },
    { id: "actions", trailing: true },
  ]);
  // The reader's order stays; each new column sits after the column before it in the author's order.
  assert.deepEqual(restored.order, ["status", "id", "owner", "name", "due", "actions"]);
  // New and hidden by default stays hidden; a new author pin applies.
  assert.equal(restored.visibility.owner, false);
  assert.deepEqual(restored.pinning, { start: ["id", "due"], end: ["actions"] });
});

test("a column the reader cannot hide shows whatever the store says", () => {
  const stored = parseStoredView({
    v: 1,
    order: [],
    sizing: {},
    visibility: { name: false, status: false },
    pinning: { start: [], end: [] },
  });
  const restored = reconcileStoredView(stored, [{ id: "name", hideable: false }, { id: "status" }]);
  assert.deepEqual(restored.visibility, { status: false });
});

test("a layout stored under another author version is discarded", () => {
  const data = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
  });
  try {
    const { v: _v, ...layout } = valid;
    writeView("versioned", layout);
    assert.ok(readView("versioned"), "an unversioned layout reads as version 0");
    assert.equal(readView("versioned", 2), null);
    writeView("versioned", layout, 2);
    assert.equal(readView("versioned", 2)?.author, 2);
    assert.equal(readView("versioned"), null);
    assert.equal(readView("versioned", 3), null);
    // A malformed version is corrupt, not a version.
    data.set(viewKey("versioned"), JSON.stringify({ ...valid, author: -1 }));
    assert.equal(readView("versioned"), null);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});

test("the columns the reader wraps are kept, validated and reconciled with the columns", () => {
  for (const value of [
    { ...valid, wrap: "name" },
    { ...valid, wrap: [1] },
    { ...valid, wrap: [""] },
  ])
    assert.equal(parseStoredView(value), null);
  const parsed = parseStoredView({ ...valid, wrap: ["name", "old", "name"] });
  assert.deepEqual(parsed.wrap, ["name", "old"]);
  // A wrapped column the table no longer has is forgotten; a layout with none keeps none.
  const restored = reconcileStoredView(parsed, [{ id: "name" }, { id: "new" }]);
  assert.deepEqual(restored.wrap, ["name"]);
  assert.equal(reconcileStoredView(parseStoredView(valid), [{ id: "name" }]).wrap, undefined);
});
