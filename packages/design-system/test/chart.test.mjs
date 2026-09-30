import { test } from "node:test";
import assert from "node:assert/strict";

import { csvCell, fileName, twinCsv } from "../src/patterns/chart/_csv.ts";
import { fitLabel, spreadLabels } from "../src/patterns/chart/_labels.ts";
import { MAX_TIME_TICKS, timeTicks, wallTime, zonedTime } from "../src/patterns/chart/_time.ts";
import {
  niceScale,
  niceTicks,
  pinnedTicks,
  stackExtent,
  valueDomain,
  valueExtent,
} from "../src/patterns/chart/_values.ts";

/* The chart family's pure helpers (audit CHF-13): the time axis (CHF-7, CHX-4), the CSV (CHF-8),
   the value axis' ticks (CHX-7), the reference labels' row and the category labels (CHX-2). */

const utc = (y, m, d = 1, h = 0) => Date.UTC(y, m, d, h);

test("month ticks fall on the first of the month in the reader's zone, west of UTC as well", () => {
  // Points at UTC midnight on the first of each month, read in New York.
  const min = utc(2026, 1);
  const max = utc(2026, 8);
  const { ticks, tick } = timeTicks(min, max, "en-US", "America/New_York");
  assert.ok(ticks.length <= MAX_TIME_TICKS);
  for (const t of ticks) {
    const wall = wallTime(t, "America/New_York");
    assert.equal(wall.day, 1, `${new Date(t).toISOString()} is a month's first day`);
    assert.equal(wall.hour, 0);
  }
  // Each tick is labelled with the month it starts there, none a month early (Jan to Aug before).
  assert.deepEqual(
    ticks.map((t) => tick(t)),
    ["Feb 2026", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  );
  // In UTC the same span starts on February.
  const inUtc = timeTicks(min, max, "en-US", "UTC");
  assert.equal(inUtc.tick(inUtc.ticks[0]), "Feb 2026");
});

test("the year is on the first tick and on every tick that starts a new year", () => {
  const { ticks, tick } = timeTicks(utc(2025, 1), utc(2026, 8), "en-US", "UTC");
  const labels = ticks.map((t) => tick(t));
  assert.ok(ticks.length <= MAX_TIME_TICKS, `${ticks.length} ticks`);
  // Feb 2025 to Sep 2026 steps by quarters from January: the first tick is April's, with its year.
  assert.equal(labels[0], "Apr 2025");
  assert.ok(labels.includes("Jan 2026"), labels.join(", "));
  const years = labels.filter((l) => /\d{4}$/.test(l));
  // One landmark for 2025 and one for 2026.
  assert.equal(years.length, 2, labels.join(", "));
  assert.ok(labels.some((l) => /2026$/.test(l)));
});

test("multi-month steps are aligned to January: quarters start in Jan, Apr, Jul, Oct", () => {
  const { ticks } = timeTicks(utc(2025, 0), utc(2026, 11), "en-US", "UTC");
  const months = ticks.map((t) => new Date(t).getUTCMonth());
  const step = months.length > 1 ? (months[1] - months[0] + 12) % 12 : 1;
  for (const m of months) assert.equal(m % step, 0, `month ${m} on a step of ${step}`);
  assert.ok(ticks.length <= MAX_TIME_TICKS);
});

test("a June-to-June year keeps at most eight ticks and says both years", () => {
  const { ticks, tick } = timeTicks(utc(2025, 5), utc(2026, 5), "en-US", "UTC");
  assert.ok(ticks.length <= MAX_TIME_TICKS);
  const labels = ticks.map((t) => tick(t));
  assert.match(labels[0], /2025$/);
  assert.ok(
    labels.some((l) => /2026$/.test(l)),
    labels.join(", "),
  );
});

test("day and hour ticks sit on midnights and hours in the zone", () => {
  const days = timeTicks(utc(2026, 8, 1, 12), utc(2026, 8, 20), "en-US", "America/Los_Angeles");
  for (const t of days.ticks) assert.equal(wallTime(t, "America/Los_Angeles").hour, 0);
  const hours = timeTicks(utc(2026, 8, 1, 3), utc(2026, 8, 2, 3), "en-US", "Asia/Kolkata");
  for (const t of hours.ticks) assert.equal(wallTime(t, "Asia/Kolkata").minute, 0);
});

test("zonedTime is the inverse of wallTime, across a change of daylight saving", () => {
  const t = zonedTime(2026, 2, 8, 12, "America/New_York");
  assert.deepEqual(wallTime(t, "America/New_York"), {
    year: 2026,
    month: 2,
    day: 8,
    hour: 12,
    minute: 0,
  });
  // Month 12 is the next January.
  assert.equal(zonedTime(2025, 12, 1, 0, "UTC"), utc(2026, 0));
});

test("CSV cells: formulas are text, numbers stay numbers, and quoting follows RFC 4180", () => {
  assert.equal(csvCell("=SUM(A1:A9)"), "'=SUM(A1:A9)");
  assert.equal(csvCell("+cmd"), "'+cmd");
  assert.equal(csvCell("@owner"), "'@owner");
  assert.equal(csvCell("-1+1"), "'-1+1");
  assert.equal(csvCell("\tlead"), "'\tlead");
  assert.equal(csvCell("-12.5"), "-12.5");
  assert.equal(csvCell("42"), "42");
  assert.equal(csvCell('a "quote", then'), '"a ""quote"", then"');
  assert.equal(csvCell("line\rbreak"), '"line\rbreak"');
  const csv = twinCsv({
    columns: [
      { label: "System", numeric: false },
      { label: "Open", numeric: true },
    ],
    rows: [
      {
        key: "0",
        cells: [
          { text: "=HYPERLINK()", csv: "=HYPERLINK()" },
          { text: "3", csv: "3" },
        ],
      },
      {
        key: "1",
        cells: [
          { text: "Zahlungsverkehr – Kern", csv: "Zahlungsverkehr – Kern" },
          { text: "−2", csv: "-2" },
        ],
      },
    ],
  });
  assert.equal(csv, "System,Open\r\n'=HYPERLINK(),3\r\nZahlungsverkehr – Kern,-2");
});

test("a file name keeps letters and digits in any script", () => {
  assert.equal(fileName("Coverage by control family", "csv"), "coverage-by-control-family.csv");
  assert.equal(fileName("Überdeckung – Familien", "png"), "überdeckung-familien.png");
  assert.equal(fileName("管理策の網羅", "csv"), "管理策の網羅.csv");
  assert.equal(fileName("—", "csv"), "chart.csv");
});

test("a pinned domain's ticks are round steps that pass through zero", () => {
  assert.deepEqual(niceTicks(-6, 14), [-5, 0, 5, 10]);
  assert.deepEqual(niceTicks(0, 20), [0, 5, 10, 15, 20]);
  assert.deepEqual(niceTicks(0, 1), [0, 0.25, 0.5, 0.75, 1]);
  assert.ok(niceTicks(-0.3, 0.7).includes(0));
  assert.equal(pinnedTicks([0, "auto"]), undefined);
  assert.deepEqual(pinnedTicks([0, 100]), [0, 25, 50, 75, 100]);
});

test("an axis through zero that nobody pinned steps evenly from a round end to a round end", () => {
  assert.deepEqual(niceScale(-4.2, 12), { domain: [-5, 15], ticks: [-5, 0, 5, 10, 15] });
  assert.deepEqual(niceScale(-3, 7), { domain: [-5, 7.5], ticks: [-5, -2.5, 0, 2.5, 5, 7.5] });
  const rows = [
    { a: 3, b: -2, c: 4 },
    { a: -5, b: 1, c: 2 },
  ];
  assert.deepEqual(valueExtent(rows, ["a", "b"]), [-5, 3]);
  // A stack: the parts above zero summed, and below.
  assert.deepEqual(stackExtent(rows, ["a", "b", "c"]), [-5, 7]);
});

test("the value domain: the caller's, cropped, from zero, or through zero", () => {
  assert.deepEqual(valueDomain([0, 20], "zero", false), [0, 20]);
  assert.deepEqual(valueDomain(undefined, "auto", false), ["auto", "auto"]);
  assert.deepEqual(valueDomain(undefined, "zero", false), [0, "auto"]);
  const [lo, hi] = valueDomain(undefined, "zero", true);
  assert.equal(lo(-4), -4);
  assert.equal(lo(3), 0);
  assert.equal(hi(-2), 0);
});

const measure = (text) => text.length * 6;

test("reference labels spread apart, stay within the plot and shorten only as far as they must", () => {
  const line = (key, at, text) => ({
    key,
    text,
    at,
    from: at,
    to: at,
    width: measure(text),
    weight: 3,
  });
  const placed = spreadLabels(
    [line("a", 100, "Kickoff"), line("b", 110, "Plan")],
    0,
    400,
    8,
    measure,
  );
  assert.equal(placed.length, 2);
  const [a, b] = placed.sort((p, q) => p.x - q.x);
  // Apart by at least the gap.
  assert.ok(b.x - measure(b.text) / 2 >= a.x + measure(a.text) / 2 + 8 - 0.5);
  // A row too narrow for both shortens a band's label first.
  const band = {
    key: "w",
    text: "Assessment window",
    at: 60,
    from: 0,
    to: 120,
    width: measure("Assessment window"),
    weight: 1,
  };
  const tight = spreadLabels([band, line("m", 70, "Milestone")], 0, 120, 8, measure);
  const cut = tight.find((p) => p.key === "w");
  const kept = tight.find((p) => p.key === "m");
  assert.equal(kept?.text, "Milestone");
  if (cut) assert.ok(cut.text.endsWith("…") && cut.full === "Assessment window");
  for (const p of tight) {
    assert.ok(p.x - measure(p.text) / 2 >= -0.5);
    assert.ok(p.x + measure(p.text) / 2 <= 120.5);
  }
});

test("a category label fits its band: whole, on two lines, or cut, never dropped", () => {
  assert.deepEqual(fitLabel("ACAS", 60, measure), ["ACAS"]);
  assert.deepEqual(fitLabel("Manual procedure", 60, measure), [
    "Manual",
    "procedure".length * 6 <= 60 ? "procedure" : "proced…",
  ]);
  const one = fitLabel("Manual procedure", 30, measure, 1);
  assert.equal(one.length, 1);
  assert.ok(one[0].endsWith("…"));
  assert.ok(measure(one[0]) <= 30);
  assert.equal(fitLabel("Supercalifragilistic", 24, measure).length, 1);
});
