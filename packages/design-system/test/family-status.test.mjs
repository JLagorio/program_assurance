import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/*
 * Every family page says its status as the first line under its title, so a reader knows what the
 * part promises before reading on (Guidance/Upgrading, Status): one line, `**Status: Stable.**`,
 * `**Status: Experimental.**` or `**Status: Deprecated.**`, the last two followed by why.
 */

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const stories = path.join(root, "src/stories");
const FAMILIES = ["components", "patterns", "layout", "primitives"];
/** Pages under those folders that document no one part, so carry no status of their own. */
const NO_PART = new Set([
  "components/Overlays.mdx",
  "components/Density.mdx",
  "patterns/Forms.mdx",
  "layout/Pages.mdx",
  "layout/ShellIconRail.mdx",
  "primitives/Primitives.mdx",
]);
const STATUS = /^\*\*Status: (Stable|Experimental|Deprecated)\.\*\*/;

const pages = FAMILIES.flatMap((folder) =>
  fs
    .readdirSync(path.join(stories, folder))
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => `${folder}/${name}`),
);

test("every family page says its status first, once", () => {
  assert.ok(pages.length > 100, `only ${pages.length} family pages were found`);
  const problems = [];
  for (const page of pages) {
    if (NO_PART.has(page)) continue;
    const lines = fs.readFileSync(path.join(stories, page), "utf8").split("\n");
    const title = lines.findIndex((line) => line.startsWith("# "));
    if (title < 0) {
      problems.push(`${page} has no title`);
      continue;
    }
    const first = lines.slice(title + 1).find((line) => line.trim() !== "");
    if (!first || !STATUS.test(first))
      problems.push(
        `${page}: the first line under the title is not **Status: Stable.**, **Status: Experimental.** or **Status: Deprecated.**`,
      );
    const count = lines.filter((line) => /^\*\*Status: /.test(line)).length;
    if (count !== 1) problems.push(`${page} says its status ${count} times`);
  }
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("the pages that carry no status still exist", () => {
  // An entry that outlives its page would exempt nothing; drop it with the page.
  for (const page of NO_PART) assert.ok(pages.includes(page), `${page} is gone: drop it here`);
});
