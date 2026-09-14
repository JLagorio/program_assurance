import { test } from "node:test";
import assert from "node:assert/strict";
import { parseStoredShell, readShell, writeShell } from "../src/layout/storage.ts";

test("a stored shell keeps only booleans and positive finite widths", () => {
  assert.deepEqual(
    parseStoredShell(JSON.stringify({ collapsed: true, sideNavWidth: 260, panelWidth: 400 })),
    {
      collapsed: true,
      sideNavWidth: 260,
      panelWidth: 400,
    },
  );
  assert.deepEqual(
    parseStoredShell(JSON.stringify({ collapsed: "yes", sideNavWidth: "abc", panelWidth: -5 })),
    {
      collapsed: undefined,
      sideNavWidth: undefined,
      panelWidth: undefined,
    },
  );
  assert.deepEqual(
    parseStoredShell(JSON.stringify({ sideNavWidth: 260.6, panelWidth: Infinity })),
    {
      collapsed: undefined,
      sideNavWidth: 261,
      panelWidth: undefined,
    },
  );
});

test("corrupt, empty or non-object storage yields null", () => {
  assert.equal(parseStoredShell(null), null);
  assert.equal(parseStoredShell(""), null);
  assert.equal(parseStoredShell("{not json"), null);
  assert.equal(parseStoredShell("42"), null);
  assert.equal(parseStoredShell("null"), null);
});

test("readShell and writeShell survive a missing or throwing storage", () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
  };
  writeShell("k", { collapsed: false, sideNavWidth: 300 });
  assert.deepEqual(readShell("k"), { collapsed: false, sideNavWidth: 300, panelWidth: undefined });
  globalThis.localStorage = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  };
  assert.equal(readShell("k"), null);
  assert.doesNotThrow(() => writeShell("k", { collapsed: true }));
  delete globalThis.localStorage;
});
