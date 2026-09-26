import assert from "node:assert/strict";
import test from "node:test";
import { fitColumns, PIN_SHARE, yieldPins } from "../src/patterns/data-table/responsive.ts";

/** The released ids, sorted, so an assertion reads as a list. */
const released = (...args) => [...yieldPins(...args)].sort();

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

test("pins hold while the pinned band takes at most the pinned share of the frame", () => {
  assert.equal(PIN_SHARE, 0.6);
  const columns = [
    { id: "name", pin: "start", width: 220 },
    { id: "status", pin: "end", width: 120 },
    { id: "actions", pin: "end", width: 32, chrome: true },
  ];
  // 32 leading + 372 pinned = 404 of 1000.
  assert.deepEqual(released(columns, 1000, 32), []);
  // Exactly the share (600 of 1000) still holds; one pixel more gives way.
  assert.deepEqual(released([{ id: "name", pin: "start", width: 600 }], 1000), []);
  assert.deepEqual(released([{ id: "name", pin: "start", width: 601 }], 1000), ["name"]);
});

test("the end band gives way before the start band, so the leading identity is the last to go", () => {
  const columns = [
    { id: "name", pin: "start", width: 300 },
    { id: "status", pin: "end", width: 300 },
  ];
  // 600 pinned in an 800 frame (limit 480): the end column goes and the band is 300.
  assert.deepEqual(released(columns, 800), ["status"]);
  // 600 pinned in a 400 frame (limit 240): both go, the end first.
  assert.deepEqual(released(columns, 400), ["name", "status"]);
});

test("each band gives way from the middle outward", () => {
  const start = [
    { id: "code", pin: "start", width: 150 },
    { id: "name", pin: "start", width: 250 },
    { id: "owner", pin: "start", width: 200 },
  ];
  // 600 pinned in a 600 frame (limit 360): owner (innermost) goes, then name; code stays.
  assert.deepEqual(released(start, 600), ["name", "owner"]);
  // 600 pinned in a 900 frame (limit 540): only the innermost start column goes.
  assert.deepEqual(released(start, 900), ["owner"]);

  // The end band is drawn from the middle to the edge, so its first column is the innermost.
  const end = [
    { id: "due", pin: "end", width: 100 },
    { id: "status", pin: "end", width: 120 },
  ];
  // 220 pinned in a 300 frame (limit 180): due goes; status, at the edge, stays.
  assert.deepEqual(released(end, 300), ["due"]);
});

test("the row actions and the leading columns never give way", () => {
  const columns = [
    { id: "name", pin: "start", width: 200 },
    { id: "actions", pin: "end", width: 40, chrome: true },
  ];
  // 64 leading + 240 pinned in a 100 frame (limit 60): only the data pin can go, and does.
  assert.deepEqual(released(columns, 100, 64), ["name"]);
  // Leading and chrome alone past the share release nothing.
  assert.deepEqual(released([{ id: "actions", pin: "end", width: 40, chrome: true }], 50, 64), []);
  assert.deepEqual(released([{ id: "select", pin: "start", width: 400, chrome: true }], 100), []);
});

test("no pins, or a frame not yet measured, release nothing", () => {
  assert.deepEqual(released([], 500), []);
  assert.deepEqual(released([], 100, 400), []);
  const columns = [{ id: "name", pin: "start", width: 900 }];
  assert.deepEqual(released(columns, 0), []);
  assert.deepEqual(released(columns, -1), []);
});

test("the pins return as the frame widens, and the reader's pins are never changed", () => {
  const columns = [
    { id: "code", pin: "start", width: 120 },
    { id: "name", pin: "start", width: 220 },
    { id: "status", pin: "end", width: 120 },
    { id: "actions", pin: "end", width: 32, chrome: true },
  ];
  const before = structuredClone(columns);
  // 32 leading + 492 pinned = 524: each step up the sweep returns the pins in reverse order.
  const sweep = [280, 480, 800, 1000].map((frame) => released(columns, frame, 32));
  assert.deepEqual(sweep, [["code", "name", "status"], ["name", "status"], ["status"], []]);
  // Widening never gives more pins away.
  sweep.slice(1).forEach((ids, index) => {
    for (const id of ids) assert.ok(sweep[index].includes(id), `${id} gave way as the frame grew`);
  });
  // Narrowing again gives the same answer: the result depends on the width alone.
  assert.deepEqual(released(columns, 280, 32), sweep[0]);
  assert.deepEqual(columns, before);
});
