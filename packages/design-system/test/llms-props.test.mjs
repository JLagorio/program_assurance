import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { llmsPath, pageToMarkdown } from "../build/llms.mjs";

const text = fs.readFileSync(llmsPath, "utf8");

/** The rows of the props table llms.txt writes for `<ArgTypes of={name} />`, by prop name. */
const propsTable = (name) => {
  const start = text.indexOf(`_Props of \`${name}\`, generated from its types:_`);
  assert.ok(start >= 0, `llms.txt has no props table for ${name}`);
  const rows = text.slice(start).split("\n\n")[1].split("\n").slice(2);
  return new Map(rows.map((row) => [/^\| `(\w+)`/.exec(row)?.[1], row]));
};

test("a Base UI part's table lists the props it inherits, not the DOM's", () => {
  const dialog = propsTable("Dialog");
  for (const prop of ["open", "defaultOpen", "onOpenChange", "modal"])
    assert.ok(dialog.has(prop), `Dialog's table lists ${prop}`);
  const toggle = propsTable("Switch");
  for (const prop of ["checked", "defaultChecked", "onCheckedChange", "size"])
    assert.ok(toggle.has(prop), `Switch's table lists ${prop}`);
  for (const attribute of ["onClick", "tabIndex", "aria-label"])
    assert.ok(!toggle.has(attribute), `Switch's table leaves out ${attribute}, a DOM attribute`);
});

test("a compound member's table is its own part's", () => {
  assert.ok(propsTable("Stat.Grid").has("frame"));
  assert.ok(propsTable("Table.Row").has("isSelected"));
  assert.ok(propsTable("Shell.Panel").has("onClose"));
});

test("a table stays its own block beside the next one", () => {
  const { body } = pageToMarkdown(
    ["# Parts", "<ArgTypes of={First} />", "<ArgTypes of={Second} />", "Prose."].join("\n"),
    "page.mdx",
    (name) =>
      name === "First"
        ? "\n_Props of `First`, generated from its types:_\n\n| Prop |\n| --- |\n| `a` |\n"
        : null,
  );
  assert.match(body, /\| `a` \|\n\n_Props: generated from `Second`/);
});
