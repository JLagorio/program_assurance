// The class policy against Tailwind itself. Every spelling the lint admits generates CSS (a name
// marker and a hook class excepted), every @utility the kit declares passes, the structural list
// repeats no kit utility and admits no name by wildcard, and a leading minus passes exactly where
// Tailwind negates. Tailwind is loaded once, here, on the kit's Storybook entry, as the token build
// loads it (build/lint-data.mjs); the lint itself never loads it.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Linter } from "eslint";

import ledger from "../eslint-plugin/index.js";
import {
  SPACING,
  classesOf,
  closureFailures,
  hookClasses,
  isKnown,
  isMargin,
  markers,
  structural,
  tokenClassOf,
} from "../eslint-plugin/classes.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const generated = path.join(packageRoot, "src/generated");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(generated, file), "utf8"));
const facts = readJson("lint.json");
const values = readJson("lint-values.json");
const allowlist = readJson("utilities.json");

const require = createRequire(path.join(packageRoot, "package.json"));
const { __unstable__loadDesignSystem } = require("@tailwindcss/node");
const entry = path.join(packageRoot, "src/styles/storybook.css");
const design = await __unstable__loadDesignSystem(fs.readFileSync(entry, "utf8"), {
  base: path.dirname(entry),
});
/** The candidates among `list` that Tailwind generates no CSS for. */
const deadOf = (list) => {
  const css = design.candidatesToCss(list);
  return list.filter((_, index) => css[index] === null || css[index] === undefined);
};

/* ---------- every spelling a pattern admits, sampled ---------- */

/** What a digit, a run of digits or a character class stands for when a pattern is spelled out:
    a few values, 0 among them (`grid-cols-0` generates nothing, `order-0` does), a leading zero
    and a number too long to be exact (Tailwind reads neither `order-01` nor 17 digits), and the
    longest an integer's `\d{0,14}` admits. */
const SAMPLES = {
  "\\d": ["0", "7"],
  "\\d+": ["0", "1", "7", "12", "01", "12345678901234567"],
  "\\d*": ["", "0", "7"],
  "\\d{0,14}": ["", "0", "7", "12345678901234"],
  "[1-9]": ["1", "9"],
  "[\\w-]+": ["x", "row-1"],
};

/**
 * Every string a structural pattern admits, with each open part (a digit, a character class)
 * sampled: literals, groups with alternatives, `?`, `*` and `+`, and escapes. A pattern this cannot
 * spell out throws, so the test never passes on a pattern it did not read.
 */
function spellings(pattern) {
  const source = pattern.source.replace(/^\^/, "").replace(/\$$/, "");
  let at = 0;
  const alternatives = () => {
    const found = [...sequence()];
    while (source[at] === "|") {
      at++;
      found.push(...sequence());
    }
    return found;
  };
  function sequence() {
    let found = [""];
    while (at < source.length && source[at] !== "|" && source[at] !== ")") {
      let atom;
      let token;
      if (source[at] === "(") {
        at += source.startsWith("(?:", at) ? 3 : 1;
        atom = alternatives();
        if (source[at++] !== ")") throw new Error(`${pattern}: an unclosed group`);
      } else if (source[at] === "[") {
        const end = source.indexOf("]", at);
        token = source.slice(at, end + 1);
        at = end + 1;
      } else if (source[at] === "\\") {
        token = source.slice(at, at + 2);
        at += 2;
      } else if (".*+?{".includes(source[at])) {
        throw new Error(`${pattern}: "${source[at]}" at ${at} cannot be spelled out`);
      } else atom = [source[at++]];
      let quantifier = "?*+".includes(source[at]) ? source[at++] : "";
      // A counted run (`\d{0,14}`) is spelled only by its own samples.
      if (source[at] === "{") {
        quantifier = source.slice(at, source.indexOf("}", at) + 1);
        at += quantifier.length;
        if (token === undefined || !SAMPLES[`${token}${quantifier}`])
          throw new Error(`${pattern}: no sample for ${token ?? "a group"}${quantifier}`);
      }
      if (token !== undefined) {
        const sampled = SAMPLES[`${token}${quantifier}`] ?? SAMPLES[token];
        // Any other class is sampled by what it admits of a few words: an open name
        // (`recharts-[a-z-]+`) is spelled as one, so the checks below name it.
        const words = ["x", "7", "anything-goes"].filter((word) =>
          new RegExp(`^${token}+$`).test(word),
        );
        if (sampled) atom = sampled;
        else if (/^\\[^dwWsS]$/.test(token)) atom = [token[1]];
        else if (token.startsWith("[") && words.length) atom = words;
        else throw new Error(`${pattern}: no sample for ${token}${quantifier}`);
        if (SAMPLES[`${token}${quantifier}`]) {
          found = found.flatMap((head) => atom.map((tail) => head + tail));
          continue;
        }
      }
      const options =
        quantifier === "?"
          ? ["", ...atom]
          : quantifier === "*"
            ? ["", ...atom, ...atom.map((one) => one + atom[0])]
            : quantifier === "+"
              ? [...atom, ...atom.map((one) => one + atom[0])]
              : atom;
      found = found.flatMap((head) => options.map((tail) => head + tail));
    }
    return found;
  }
  const found = alternatives();
  if (at !== source.length) throw new Error(`${pattern}: read to ${at} of ${source.length}`);
  return [...new Set(found)];
}

/** Each structural pattern's spellings, which each must match: the expander's own check. */
const structuralSpellings = structural.map((pattern, index) => {
  const found = spellings(pattern);
  for (const spelling of found)
    assert.ok(pattern.test(spelling), `structural[${index}] ${pattern} does not admit ${spelling}`);
  return { pattern, index, found };
});

/** The radius tokens a side takes (`rounded-s-medium`). */
const radii = allowlist.classes.filter((cls) => /^rounded-[a-z]+$/.test(cls));
const SIDES = ["t", "b", "l", "r", "s", "e", "tl", "tr", "bl", "br", "ss", "se", "es", "ee"];

/** Every spelling the lint could admit, with where it comes from. */
const universe = new Map();
const add = (cls, from) => universe.has(cls) || universe.set(cls, from);
for (const cls of allowlist.classes) add(cls, "a token class (utilities.json)");
for (const name of facts.utilities) add(name, "an @utility (lint.json)");
for (const cls of hookClasses) add(cls, "a hook class");
for (const { pattern, index, found } of structuralSpellings)
  for (const cls of found) add(cls, `structural[${index}] ${pattern}`);
for (const prefix of SPACING)
  for (const key of allowlist.spaceKeys)
    for (const sign of ["", "-"]) add(`${sign}${prefix}-${key}`, "the spacing pattern (SPACING)");
for (const side of SIDES)
  for (const radius of radii) add(radius.replace(/^rounded/, `rounded-${side}`), "a side radius");
const admitted = [...universe.keys()].filter((cls) => isKnown(cls));

/* ---------- the tests ---------- */

test("every spelling the lint admits generates CSS, but a name marker and a hook class", () => {
  // The expansion reached every pattern.
  for (const { pattern, index, found } of structuralSpellings)
    assert.ok(
      found.some((cls) => isKnown(cls)),
      `structural[${index}] ${pattern} admits none of its spellings`,
    );
  assert.ok(admitted.length > 2000, `only ${admitted.length} spellings admitted`);
  const dead = deadOf(admitted).filter((cls) => !markers.test(cls) && !hookClasses.has(cls));
  assert.deepEqual(
    dead.map((cls) => `${cls} (${universe.get(cls)})`),
    [],
    "the lint admits spellings Tailwind generates no CSS for; tighten the pattern that admits each",
  );
});

test("a name marker and a hook class generate no CSS of their own, and are admitted by name", () => {
  for (const cls of ["group", "peer", "group/row", "peer/field", ...hookClasses])
    assert.ok(isKnown(cls), cls);
  assert.deepEqual(deadOf(["group", "peer/field", ...hookClasses]).length, 2 + hookClasses.size);
  // Any other name the chart library reads is not.
  assert.equal(isKnown("recharts-anything-goes"), false);
});

test("a leading minus passes exactly where Tailwind negates the utility", () => {
  const negatable = new Set(facts.negatable);
  for (const prefix of SPACING) {
    const cls = `-${prefix}-200`;
    const generates = deadOf([cls]).length === 0;
    assert.equal(negatable.has(prefix), generates, `lint.json's negatable disagrees on ${prefix}`);
    assert.equal(isKnown(cls), generates, cls);
  }
});

test("every @utility the kit declares passes ledger/no-non-token-class", () => {
  // One file with every name, as a product writes them; a deprecated token class is its own
  // rule's, and no-non-token-class says nothing of it.
  const messages = new Linter().verify(
    `export const A = () => <div className="${facts.utilities.join(" ")}" />;`,
    {
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { ledger },
      rules: { "ledger/no-non-token-class": "error" },
    },
  );
  assert.deepEqual(
    messages.map(({ message }) => message),
    [],
    "an @utility is declared but ledger/no-non-token-class rejects it",
  );
  assert.ok(facts.utilities.includes("sticky-rail") && facts.utilities.includes("stat-grid-6"));
});

test("the structural list repeats no kit @utility, and admits no name by wildcard", () => {
  const declared = new Set(facts.utilities);
  const repeated = structuralSpellings.flatMap(({ index, found }) =>
    found.filter((cls) => declared.has(cls)).map((cls) => `structural[${index}] ${cls}`),
  );
  assert.deepEqual(repeated, [], "a kit @utility's name comes from its CSS (lint.json) alone");
  // A character class that admits a letter, repeated, is an open name (`recharts-[a-z-]+`); the
  // one open part allowed is a marker's or a container's own name, after its slash.
  const open = structural
    .map((pattern) => pattern.source.replace(/\\\/\[\\w-\]\+/g, ""))
    .filter((source) =>
      [...source.matchAll(/(\[[^\]]*\]|\\[wWsS]|\.)([+*]|\{)/g)].some(([, part]) =>
        new RegExp(`^${part}$`).test("a"),
      ),
    );
  assert.deepEqual(open, [], "a structural pattern admits any name");
});

/* ---------- the kit's @utility names come from its CSS, through lint.json ---------- */

/** A copy of the plugin whose lint.json lists `utilities`, as the token build would write it after
    a stylesheet gained or lost an @utility. Nothing else changes, index.js and classes.js
    included. */
async function withUtilities(utilities, check) {
  const copy = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-tailwind-")));
  try {
    fs.cpSync(path.join(packageRoot, "eslint-plugin"), path.join(copy, "eslint-plugin"), {
      recursive: true,
    });
    fs.copyFileSync(path.join(packageRoot, "package.json"), path.join(copy, "package.json"));
    fs.mkdirSync(path.join(copy, "src/generated"), { recursive: true });
    for (const file of ["utilities.json", "tokens.css", "lint-values.json"])
      fs.copyFileSync(path.join(generated, file), path.join(copy, "src/generated", file));
    fs.writeFileSync(
      path.join(copy, "src/generated/lint.json"),
      JSON.stringify({ ...facts, utilities }),
    );
    const { isKnown: known } = await import(
      pathToFileURL(path.join(copy, "eslint-plugin/classes.js")).href
    );
    check(known);
  } finally {
    fs.rmSync(copy, { recursive: true, force: true });
  }
}

test("an @utility the CSS gains passes, and one it loses fails, with no edit to the plugin", async () => {
  assert.equal(isKnown("new-rail"), false);
  assert.equal(isKnown("sticky-rail"), true);
  await withUtilities(
    [...facts.utilities.filter((name) => name !== "sticky-rail"), "new-rail"],
    (known) => {
      assert.equal(known("new-rail"), true, "a declared @utility is admitted");
      assert.equal(known("sticky-rail"), false, "a removed @utility is not");
      assert.equal(known("page-header"), true);
    },
  );
});

/* ---------- a token's variable in a class, fixed to its token class ---------- */

/** Every spelling of a token's variable the token build paired with a token class: each class's
    own, and each scale root at each key. */
const variableSpellings = () => {
  const { classes, scales } = values.varToClass;
  return [
    ...Object.keys(classes),
    ...scales.flatMap(({ variable, keys, roots }) =>
      roots.flatMap((root) => keys.map((key) => `${root}-(${variable}${key})`)),
    ),
  ];
};

test("each token's variable the build pairs with a token class declares the same CSS", () => {
  const spellings = variableSpellings();
  const pairs = spellings.map((cls) => [cls, tokenClassOf(cls)]);
  assert.deepEqual(
    pairs.filter(([, token]) => !token).map(([cls]) => cls),
    [],
    "a paired spelling has no token class",
  );
  const flat = pairs.flat();
  const css = design.candidatesToCss(flat);
  assert.deepEqual(
    flat.filter((_, index) => !css[index]),
    [],
    "a paired class generates no CSS",
  );
  // What each declares, its own selector taken out.
  const declared = flat.map((cls, index) =>
    css[index].split(`.${cls.replace(/[^\w-]/g, "\\$&")}`).join("."),
  );
  const differ = pairs.filter((_, index) => declared[index * 2] !== declared[index * 2 + 1]);
  assert.deepEqual(differ, [], "Tailwind declares another thing for a paired spelling");
  // A type hint that routes the value to another property is no pair.
  assert.equal(tokenClassOf("bg-(length:--ds-elevation-surface)"), undefined);
  assert.equal(tokenClassOf("bg-(color:--ds-elevation-surface)"), "bg-surface");
});

test("--fix writes each paired token class, and each passes every Ledger class rule", () => {
  const spellings = variableSpellings();
  const source = `import { cn } from "@ledger/design-system/cn";\nexport const c = cn(\n${spellings.map((cls) => `  "${cls}",`).join("\n")}\n);\n`;
  const { output } = new Linter().verifyAndFix(source, {
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { ledger },
    rules: { "ledger/no-arbitrary-value": "error" },
  });
  const written = [...output.matchAll(/^  "([^"]+)",$/gm)].map(([, cls]) => cls);
  assert.equal(written.length, spellings.length);
  const left = [];
  written.forEach((cls, index) => {
    if (cls === spellings[index]) left.push(cls);
    else assert.deepEqual(closureFailures(cls), [], `${spellings[index]} → ${cls}`);
  });
  // What is left is a margin, which is no-margin's, or a token class another rule reports (a
  // deprecated one), which the rule does not ask for.
  assert.deepEqual(
    left.filter(
      (cls) => !isMargin(classesOf(cls)[0].base) && !closureFailures(tokenClassOf(cls)).length,
    ),
    [],
  );
  assert.ok(written.length - left.length > 1000, `${written.length - left.length} fixed`);
});
