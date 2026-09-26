#!/usr/bin/env node
/**
 * The allow-lists that let a gate land on a tree that does not pass it yet may only shrink. This
 * compares each list with its committed version at the base ref (DS_BASE_REF, as ds-check reads
 * it; HEAD by default) and fails when an entry was added or a count went up. A list that is new at
 * the base ref is the gate landing, so it passes; deleting an entry or lowering a count always
 * passes. Keys named `about` are notes.
 *
 * - packages/design-system/test/lint-allow.json: ESLint reports per rule and file in the kit.
 * - packages/design-system/test/gates-allow.json: story gate problems per story, skipped plays
 *   and stories that log a warning on purpose.
 * - packages/design-system/test/layout-allow.json: stories exempt from the layout checks.
 * - scripts/app-a11y-allow.json: axe violations and console messages per product screen.
 * - scripts/docs-render-allow.json: docs pages allowed to fail to render.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const LISTS = [
  "packages/design-system/test/lint-allow.json",
  "packages/design-system/test/gates-allow.json",
  "packages/design-system/test/layout-allow.json",
  "scripts/app-a11y-allow.json",
  "scripts/docs-render-allow.json",
];
const argument = process.argv.indexOf("--base-ref");
const requested =
  (argument > 0 ? process.argv[argument + 1] : undefined) || process.env.DS_BASE_REF || "HEAD";
const base = /^0+$/.test(requested) ? "HEAD^" : requested;

/** Every leaf of a list, as a path and its value, notes left out. */
function leaves(value, prefix = [], out = new Map()) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value))
      if (key !== "about") leaves(child, [...prefix, key], out);
  } else out.set(prefix.join(" › "), value);
  return out;
}

const problems = [];
for (const list of LISTS) {
  if (!existsSync(list)) continue;
  const current = leaves(JSON.parse(readFileSync(list, "utf8")));
  let committed;
  try {
    committed = execFileSync("git", ["show", `${base}:${list}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    console.log(`${list}: new at ${base}, so this is where it starts`);
    continue;
  }
  const previous = leaves(JSON.parse(committed));
  let grew = 0;
  for (const [key, value] of current) {
    if (!previous.has(key)) {
      problems.push(`${list}: ${key} is new`);
      grew += 1;
    } else if (typeof value === "number" && value > previous.get(key)) {
      problems.push(`${list}: ${key} went from ${previous.get(key)} to ${value}`);
      grew += 1;
    }
  }
  const shrank = [...previous.keys()].filter(
    (key) =>
      !current.has(key) ||
      (typeof current.get(key) === "number" && current.get(key) < previous.get(key)),
  ).length;
  console.log(
    `${list}: ${current.size} entries${shrank ? `, ${shrank} fewer or lower than at ${base}` : ""}${grew ? `, ${grew} grew` : ""}`,
  );
}
if (problems.length) {
  console.error(
    `\nAllow-lists may only shrink. Fix the site instead of listing it:\n  ${problems.join("\n  ")}`,
  );
  process.exit(1);
}
