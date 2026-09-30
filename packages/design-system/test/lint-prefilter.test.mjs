// no-deprecated-name reads a member expression's source only when the member's own name ends a
// name it can report (deprecatedMemberEnds, built once). Turned off, the prefilter lets every
// member through to the source read it skipped, as the rule ran before it: over every renamed name
// in every spelling a member can take, and over the rule's own cases, the findings and their digest
// are the same with it on and off.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { Linter } from "eslint";

import ledger, { deprecatedMemberEnds, deprecatedNames } from "../eslint-plugin/index.js";
import { PARSERS, loadCases } from "./lint-helpers.mjs";

const KIT = '"@ledger/design-system"';
/** Keys every plain object inherits: no renamed part, in any spelling. */
const PROTOTYPE_KEYS = ["constructor", "toString", "hasOwnProperty", "valueOf", "__proto__"];

/** Every renamed name as a member: bound, aliased, through a namespace or the product's shell,
    unbound, over line breaks and comments, optional, non-null, computed, and inside a longer one. */
function members() {
  const sources = [];
  for (const name of Object.keys(deprecatedNames)) {
    const [root, ...rest] = name.split(".");
    const tail = rest.map((segment) => `.${segment}`).join("");
    if (rest.length)
      sources.push(
        `import { ${root} } from ${KIT}; export const a = ${root}${tail};`,
        `import { ${root} as Aliased } from ${KIT}; export const a = Aliased${tail};`,
        `import { ${root} } from "@/components/app/shell"; export const a = ${root}${tail};`,
        `export const a = ${root}${tail};`,
        `import { ${root} } from ${KIT}; export const a = ${root}!${tail};`,
      );
    sources.push(
      `import * as Kit from ${KIT}; export const a = Kit.${name};`,
      `import * as Kit from ${KIT}; export const a = Kit\n  .${name.split(".").join("\n  .")};`,
      `import * as Kit from ${KIT}; export const a = Kit /* a comment */ .${name};`,
      `import * as Kit from ${KIT}; export const a = Kit?.${name};`,
      `import * as Kit from ${KIT}; export const a = Kit["${name}"];`,
      `import * as Kit from ${KIT}; export const a = Kit.${name}.inner;`,
      `import * as Kit from ${KIT}; export const a = Kit.${name}();`,
      `export const a = other.${name};`,
    );
  }
  // Members that name no renamed part, some sharing a removed part's name, and some the keys every
  // object inherits, which the map of renamed names does not.
  sources.push(
    `import { Shell } from ${KIT}; export const a = [Shell.SideNav.Item, Shell.Panel, Kit.Block, obj.x.y];`,
    `import * as Kit from ${KIT}; export const a = [${PROTOTYPE_KEYS.map((key) => `Kit.${key}`).join(", ")}];`,
  );
  return sources;
}

const cases = (await loadCases()).get("no-deprecated-name");
const spelled = members();
const corpus = [...spelled, ...[...cases.valid, ...cases.invalid].map(({ code }) => code)];
const linter = new Linter();
const config = {
  files: ["**/*.tsx"],
  languageOptions: { parser: PARSERS.typescript, parserOptions: { ecmaFeatures: { jsx: true } } },
  plugins: { ledger },
  rules: { "ledger/no-deprecated-name": "error" },
};

/** Every finding over the corpus: which source, where, the rule, the words and the fix. */
const findings = () =>
  corpus.flatMap((code, index) =>
    linter
      .verify(code, config, { filename: "screen.tsx" })
      .map(({ line, column, endLine, endColumn, ruleId, message, fix, fatal }) => {
        assert.ok(!fatal, `${code} parses: ${message}`);
        return [index, line, column, endLine, endColumn, ruleId, message, fix ?? null];
      }),
  );
const digest = (list) =>
  createHash("sha256")
    .update(list.map((finding) => JSON.stringify(finding)).join("\n"))
    .digest("hex");

test("the member prefilter drops no finding of no-deprecated-name", () => {
  const withPrefilter = findings();
  // Turned off, the prefilter lets every member through, as the rule read them before it.
  deprecatedMemberEnds.has = () => true;
  let without;
  try {
    without = findings();
  } finally {
    delete deprecatedMemberEnds.has;
  }
  assert.deepEqual(withPrefilter, without);
  assert.equal(digest(withPrefilter), digest(without));
});

test("a key every object inherits is no renamed name, imported, as a tag or as a member", () => {
  const sources = [
    `import { ${PROTOTYPE_KEYS.join(", ")} } from ${KIT}; export {};`,
    ...PROTOTYPE_KEYS.map(
      (key) => `import * as Kit from ${KIT}; export const a = [<Kit.${key} />, Kit.${key}];`,
    ),
  ];
  for (const code of sources) {
    // Turned off, the prefilter hands every member to the map, which must not answer for them.
    deprecatedMemberEnds.has = () => true;
    try {
      assert.deepEqual(
        linter.verify(code, config, { filename: "screen.tsx" }).map(({ message }) => message),
        [],
        code,
      );
    } finally {
      delete deprecatedMemberEnds.has;
    }
  }
});

test("the corpus reaches every name a member is reported under", () => {
  // The spelled members alone, so a report of an import or a tag in the cases does not count.
  const reported = new Set(
    findings()
      .filter(([index]) => index < spelled.length)
      .map((finding) => finding[6]),
  );
  for (const [name, dep] of Object.entries(deprecatedNames)) {
    if (dep.removed) continue;
    assert.ok(
      [...reported].some((message) => message.startsWith(`${name} is deprecated`)),
      `a member spelled ${name} is reported`,
    );
    assert.ok(deprecatedMemberEnds.has(name.split(".").at(-1)), `${name} passes the prefilter`);
  }
});
