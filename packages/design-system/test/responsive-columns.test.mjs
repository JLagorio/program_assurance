import assert from "node:assert/strict";
import test from "node:test";
import {
  fitColumns,
  fitFrame,
  identityOf,
  PIN_SHARE,
  rankColumns,
  shareSlack,
  yieldPins,
} from "../src/patterns/data-table/responsive.ts";

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

test("priority folds monotonically: a narrower lower-priority column never outlasts a wider higher one", () => {
  // /programs at 390: the name, then Code (130, rank 11), Status (130, rank 12), Systems (100, rank 13).
  const columns = [
    { id: "name", width: 180, priority: 0 },
    { id: "code", width: 130 },
    { id: "status", width: 130 },
    { id: "systems", width: 100 },
    { id: "actions", width: 32, action: true },
  ];
  const layout = fitColumns(columns, 390, 0);
  assert.equal(layout.collapsed, true);
  // 390 - 32 disclosure = 358 budget; 32 actions + 180 name = 212; Code (130) fits (342); Status
  // (130) does not, so it and Systems fold even though Systems (100) would still fit.
  assert.deepEqual([...layout.ids].sort(), ["actions", "code", "name"]);
  assert.ok(!layout.ids.has("systems"), "a lower-priority column stayed after a higher one folded");
});

test("the spare width goes to the unsized columns, and the identity keeps its width", () => {
  // /catalog CCIs at 1440: CCI is 180 by the author, Definition is unsized (least 150).
  const columns = [
    { id: "cci", width: 180, priority: 0 },
    { id: "definition", width: 150, flexible: true },
    { id: "type", width: 120 },
    { id: "actions", width: 32, action: true },
  ];
  const fit = fitFrame(columns, 1440, 0);
  assert.equal(fit.layout.collapsed, false);
  assert.deepEqual(fit.layout.flexible, ["definition"]);
  assert.equal(fit.layout.widths.get("cci"), 180);
  // With one flexible column the renderer draws it without a width, so it takes the rest.
  const shares = shareSlack(fit.layout, 1440, 0);
  assert.equal(shares.get("definition"), 1440 - 180 - 120 - 32);
  // The key does not move with the frame while nothing folds, so a resize draws no rows.
  assert.equal(fitFrame(columns, 1300, 0).key, fit.key);
});

test("several unsized columns share the slack in proportion to their least widths", () => {
  const columns = [
    { id: "code", width: 120, priority: 0 },
    { id: "statement", width: 300, flexible: true },
    { id: "rationale", width: 150, flexible: true },
  ];
  const fit = fitFrame(columns, 1020, 32);
  assert.deepEqual(fit.layout.flexible, ["statement", "rationale"]);
  const shares = shareSlack(fit.layout, 1020, 32);
  // 1020 - 32 leading - 120 code = 868 for 450 of least width: statement 579, rationale 289.
  assert.equal(shares.get("statement"), Math.floor(300 * (868 / 450)));
  assert.equal(shares.get("rationale"), Math.floor(150 * (868 / 450)));
  assert.ok(shares.get("statement") >= 300 && shares.get("rationale") >= 150);
});

test("with every column sized, the identity takes the slack as before", () => {
  const columns = [
    { id: "name", width: 200, priority: 0 },
    { id: "status", width: 120 },
  ];
  const fit = fitFrame(columns, 800, 0);
  assert.deepEqual(fit.layout.flexible, ["name"]);
  assert.equal(fit.layout.widths.get("name"), 680);
});

test("the identity is the lowest priority, else the first column, and never the actions", () => {
  const ids = (columns) => columns.map((column) => column.id);
  // The name at priority 0 names the row though the code comes first.
  const named = [
    { id: "code", priority: 1 },
    { id: "name", priority: 0 },
    { id: "status" },
    { id: "actions", action: true, priority: -1 },
  ];
  assert.equal(identityOf(named)?.id, "name");
  assert.deepEqual(ids(rankColumns(named)), ["name", "code", "status"]);
  // With no priority the first column is the identity; the actions never are.
  assert.equal(
    identityOf([{ id: "actions", action: true }, { id: "title" }, { id: "due" }])?.id,
    "title",
  );
  // A tie keeps the given order, and a table of actions alone has none.
  assert.equal(
    identityOf([
      { id: "a", priority: 0 },
      { id: "b", priority: 0 },
    ])?.id,
    "a",
  );
  assert.equal(identityOf([{ id: "actions", action: true }]), undefined);
  // The layout keeps the same identity.
  const layout = fitColumns(
    named.map((column) => ({ ...column, width: 100 })),
    200,
  );
  assert.equal(layout.identity, "name");
});
