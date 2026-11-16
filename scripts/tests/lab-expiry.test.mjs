/**
 * The lab lane (src/components/prototype/lab, decision D7): product code may try a form there for 30 days
 * before it becomes a kit part or is deleted. Every file but the README says the day its trial
 * began in its header, `@lab YYYY-MM-DD`; this fails for a file that does not, or whose trial began
 * more than 30 days before today (UTC).
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import test from "node:test";

export const LAB = "src/components/prototype/lab";
export const DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}

/** The day a lab file's trial began, from `@lab YYYY-MM-DD` in its first lines, or why not. */
export function labStart(text) {
  const head = text.split("\n").slice(0, 20).join("\n");
  const found = /@lab (\d{4})-(\d{2})-(\d{2})\b/.exec(head);
  if (!found) return { error: "its header names no @lab YYYY-MM-DD start day" };
  const [, y, m, d] = found.map(Number);
  const start = Date.UTC(y, m - 1, d);
  const day = new Date(start);
  if (day.getUTCFullYear() !== y || day.getUTCMonth() !== m - 1 || day.getUTCDate() !== d)
    return { error: `@lab ${found[0].slice(5)} is no calendar day` };
  return { start, day: found[0].slice(5) };
}

/** Every lab file that has no start day, starts after today or is past its 30 days. */
export function expired(dir, today = new Date()) {
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const problems = [];
  for (const path of files(dir)) {
    const name = relative(process.cwd(), path);
    if (/(^|\/)README\.md$/.test(path)) continue;
    const start = labStart(readFileSync(path, "utf8"));
    if (start.error) {
      problems.push(`${name}: ${start.error}.`);
      continue;
    }
    const age = Math.floor((now - start.start) / DAY);
    if (age < 0) problems.push(`${name}: its trial starts on ${start.day}, after today.`);
    else if (age > DAYS)
      problems.push(
        `${name}: its trial began on ${start.day}, ${age} days ago. After ${DAYS} days a lab becomes a kit part through /ledger-add-part or is deleted.`,
      );
  }
  return problems;
}

test("a lab file names the day its trial began", () => {
  assert.deepEqual(labStart("// @lab 2026-11-16 Meter on the Overview\n"), {
    start: Date.UTC(2026, 10, 16),
    day: "2026-11-16",
  });
  assert.match(labStart("// A meter\n").error, /names no @lab/);
  assert.match(labStart("// @lab 2026-02-30\n").error, /no calendar day/);
  assert.match(labStart(`${"//\n".repeat(20)}// @lab 2026-11-16\n`).error, /names no @lab/);
});

test("a lab file fails once it is older than 30 days", () => {
  const dir = mkdtempSync(join(tmpdir(), "lab-expiry-"));
  try {
    mkdirSync(join(dir, "meter"));
    writeFileSync(join(dir, "README.md"), "# Lab lane\n");
    writeFileSync(join(dir, "meter", "meter.tsx"), "/** @lab 2026-11-16 A meter. */\n");
    writeFileSync(join(dir, "row.tsx"), "// @lab 2026-10-01 A work row.\n");
    writeFileSync(join(dir, "nameless.tsx"), "// A form with no start day.\n");
    const on = (day) => expired(dir, new Date(`${day}T12:00:00Z`));
    const at = on("2026-11-16");
    assert.equal(at.length, 2);
    assert.match(
      at.find((p) => p.includes("row.tsx")),
      /began on 2026-10-01, 46 days ago/,
    );
    assert.match(
      at.find((p) => p.includes("nameless.tsx")),
      /names no @lab/,
    );
    rmSync(join(dir, "row.tsx"));
    rmSync(join(dir, "nameless.tsx"));
    assert.deepEqual(on("2026-12-16"), [], "day 30 still stands");
    assert.match(on("2026-12-17")[0], /31 days ago/);
    assert.match(on("2026-11-15")[0], /after today/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("no lab in the product is past its 30 days", () => {
  assert.deepEqual(expired(LAB), []);
});
