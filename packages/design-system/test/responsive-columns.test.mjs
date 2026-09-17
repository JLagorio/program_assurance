import assert from "node:assert/strict";
import test from "node:test";
import { fitColumns } from "../src/patterns/data-table/responsive.ts";

test("an identity and actions reclaim disclosure space when no field is collapsed", () => {
  const layout = fitColumns(
    [
      { id: "name", width: 330, priority: 0 },
      { id: "actions", width: 32, action: true },
    ],
    300,
  );
  assert.equal(layout.collapsed, false);
  assert.deepEqual([...layout.ids].sort(), ["actions", "name"]);
  assert.equal(layout.widths.get("name"), 268);
  assert.equal(layout.widths.get("actions"), 32);
});

test("collapsed columns retain their values while the visible widths include disclosure and leading controls", () => {
  const columns = [
    { id: "code", width: 150, priority: 1 },
    { id: "name", width: 250, priority: 0 },
    { id: "owner", width: 180, priority: 2 },
    { id: "actions", width: 32, action: true },
  ];
  const before = structuredClone(columns);
  const layout = fitColumns(columns, 280, 32);
  assert.equal(layout.collapsed, true);
  assert.deepEqual([...layout.ids].sort(), ["actions", "name"]);
  assert.equal(
    [...layout.ids].reduce((sum, id) => sum + layout.widths.get(id), 64),
    280,
  );
  assert.deepEqual(columns, before);
});
