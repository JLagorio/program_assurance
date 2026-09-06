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
    { ...valid, v: 2 },
  ])
    assert.equal(parseStoredView(value), null);
});
test("deduplicates pins and reconciles changed column IDs and width bounds", () => {
  const parsed = parseStoredView(valid);
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
