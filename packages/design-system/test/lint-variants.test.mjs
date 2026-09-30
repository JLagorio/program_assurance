// ledger/no-unknown-variant's grammar (eslint-plugin/variants.js) against Tailwind itself: every
// variant the kit's and the application's sources write, every variant of the stock corpus and a
// fuzz corpus of misspellings, compounds three deep, names, numbers, sizes and /names get the same
// verdict from the lint data as from the Tailwind the data reflects, loaded here once as the token
// build loads it. An aria- name no ARIA attribute has generates CSS, so it is Tailwind's to
// generate and the rule's to report. Also: the respellings, and the sizes a finding lists.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { classesOf } from "../eslint-plugin/classes.js";
import { lintFacts } from "../eslint-plugin/data.js";
import {
  declareVariants,
  editDistance,
  sizeLists,
  variantGenerated,
  variantProblem,
  variantsProblem,
} from "../eslint-plugin/variants.js";
import { FIXTURE, stockClasses } from "../../../scripts/lint-corpus.mjs";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = path.resolve(packageRoot, "../..");
const require = createRequire(path.join(packageRoot, "package.json"));
const { __unstable__loadDesignSystem } = require("@tailwindcss/node");
const entry = path.join(packageRoot, "src/styles/storybook.css");
const design = await __unstable__loadDesignSystem(fs.readFileSync(entry, "utf8"), {
  base: path.dirname(entry),
});
const grammar = lintFacts().variants;

/** Tailwind's verdict on each variant: whether `<variant>:flex` generates CSS. */
const tailwindGenerates = (variants) =>
  new Map(
    design
      .candidatesToCss(variants.map((variant) => `${variant}:flex`))
      .map((css, index) => [variants[index], css !== null]),
  );
/** Compound roots, which wrap another variant. */
const COMPOUND = Object.keys(grammar.functional).filter(
  (root) => grammar.functional[root].compound,
);
/**
 * Where the grammar passes what Tailwind drops, by design: a functional variant's arbitrary value
 * (`data-[.x]`) or a name that makes no valid selector (`data-a.b`), inside any compounds. The rule
 * judges the variant, not the selector a value makes (its page's Limits).
 */
function lenient(variant) {
  let rest = variant.replace(/\/[^/]*$/, "");
  for (let root; (root = COMPOUND.find((name) => rest.startsWith(`${name}-`)));)
    rest = rest.slice(root.length + 1);
  const root = Object.keys(grammar.functional)
    .filter(
      (name) =>
        !COMPOUND.includes(name) && rest.startsWith(`${name}${grammar.functional[name].join}`),
    )
    .sort((a, z) => z.length - a.length)[0];
  const value = root && rest.slice(root.length + grammar.functional[root].join.length);
  return Boolean(value && (/^\[.+\]$/.test(value) || /[.%]/.test(value)));
}
/** The variants the grammar and Tailwind disagree on: none the rule would report and Tailwind
    generates, and none Tailwind drops that the rule passes, but the lenient ones. */
function disagreements(variants) {
  const tailwind = tailwindGenerates([...new Set(variants)]);
  return [...tailwind]
    .filter(([variant, generates]) => variantGenerated(variant) !== generates)
    .filter(([variant, generates]) => generates || !lenient(variant))
    .map(([variant, generates]) => `${variant}: Tailwind ${generates ? "generates" : "drops"} it`);
}
const variantsOf = (texts) =>
  texts.flatMap((text) => classesOf(text).flatMap(({ variants, base }) => (base ? variants : [])));

/* ---------- the variants the sources write ---------- */

/** Every source file under a folder, the generated ones aside. */
function sourcesUnder(dir) {
  const found = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const at = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (!["generated", "node_modules"].includes(item.name)) found.push(...sourcesUnder(at));
    } else if (/\.(?:[cm]?[jt]sx?|mdx)$/.test(item.name)) found.push(at);
  }
  return found;
}
/** The strings a file writes, quoted or in a template's own text: where its classes are. */
const stringsOf = (source) =>
  [...source.matchAll(/"([^"\n\\]*)"|'([^'\n\\]*)'|`([^`\\$]*)`/g)].map(
    (match) => match[1] ?? match[2] ?? match[3],
  );

test("the grammar agrees with Tailwind on every variant the kit and the application write", () => {
  const files = [
    ...sourcesUnder(path.join(packageRoot, "src")),
    ...sourcesUnder(path.join(repoRoot, "src")),
  ];
  const variants = variantsOf(
    files.flatMap((file) => stringsOf(fs.readFileSync(file, "utf8"))),
  ).filter((variant) => /^[\w@[*!-]/.test(variant));
  assert.ok(new Set(variants).size > 200, `only ${new Set(variants).size} variants were found`);
  assert.deepEqual(disagreements(variants), []);
});

test("the grammar agrees with Tailwind on every variant of the stock corpus", () => {
  const classes = stockClasses(JSON.parse(fs.readFileSync(path.join(repoRoot, FIXTURE), "utf8")));
  const variants = variantsOf(classes);
  assert.ok(new Set(variants).size > 100, `only ${new Set(variants).size} variants were found`);
  assert.deepEqual(disagreements(variants), []);
});

/* ---------- a fuzz corpus ---------- */

/** Every spelling one edit from a word: a letter dropped, doubled or swapped with the next. */
function edits(word) {
  const out = new Set();
  for (let i = 0; i < word.length; i++) {
    out.add(word.slice(0, i) + word.slice(i + 1));
    out.add(word.slice(0, i) + word[i] + word.slice(i));
    if (i < word.length - 1) out.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
  }
  out.delete(word);
  return [...out];
}

test("the grammar agrees with Tailwind on misspellings, compounds, values, sizes and names", () => {
  const corpus = new Set();
  const compounds = Object.entries(grammar.functional).filter(([, spec]) => spec.compound);
  for (const name of grammar.static) {
    for (const variant of [name, ...edits(name), `${name}/x`]) corpus.add(variant);
    for (const [root] of compounds) {
      corpus.add(`${root}-${name}`);
      corpus.add(`${root}-${name}/x`);
      corpus.add(`not-${root}-${name}`);
    }
  }
  for (const [root, spec] of Object.entries(grammar.functional)) {
    const at = `${root}${spec.join}`;
    for (const value of [...spec.values, "[x]", "[.x]", "[@media_print]", "zzqx", "7", "0", "00"])
      for (const variant of [`${at}${value}`, `${at}${value}/x`, `${at}${value}/[x]`])
        corpus.add(variant);
    for (const value of ["Open", "a_b", "-x", "a.b", "é", "3n", "(--x)", "(--)", "(--x_y)"])
      corpus.add(`${at}${value}`);
    for (const value of ["(--x)/x", "(number:--x)", "(x)"]) corpus.add(`${at}${value}`);
    for (const misspelt of edits(root)) corpus.add(`${misspelt}${spec.join}open`);
    corpus.add(root);
    corpus.add(at);
  }
  for (const name of Object.keys(grammar.breakpoints))
    for (const misspelt of [name, ...edits(name)])
      for (const variant of [misspelt, `max-${misspelt}`, `min-${misspelt}`, `not-max-${misspelt}`])
        corpus.add(variant);
  for (const name of Object.keys(grammar.containers))
    for (const misspelt of [name, ...edits(name)])
      for (const variant of [`@${misspelt}`, `@max-${misspelt}`, `@${misspelt}/main`])
        corpus.add(variant);
  // Compounds three deep around a leaf of every shape: a selector, an at-rule, a media query
  // around a selector, a name, an arbitrary selector and an arbitrary at-rule.
  const roots = compounds.map(([root]) => root);
  const leaves = ["hover", "first", "sm", "print", "dark", "data-open", "aria-busy", "[.x]"];
  leaves.push("[@media_print]", "@md", "max-sm", "supports-grid", "before", "starting");
  leaves.push("nth-(--n)", "supports-(--x)", "aria-colindextext");
  for (const a of roots)
    for (const leaf of leaves) {
      corpus.add(`${a}-${leaf}`);
      for (const b of roots) {
        corpus.add(`${a}-${b}-${leaf}`);
        corpus.add(`${a}-${b}-${leaf}/x`);
        for (const c of roots) corpus.add(`${a}-${b}-${c}-${leaf}`);
      }
    }
  for (const variant of [
    ...["tablet", "max-tablet", "2xl", "max-2xl", "@8xl", "@", "@md/", "@md/a.b", "@md/é"],
    ...["group-hover/a/b", "group-hover/a.b", "group-hover/-x", "*", "**", "***", "[&>svg]"],
    ...["aria-bogus", "aria-Busy", "aria-[sort=ascending]", "aria-[sortt=ascending]", "aria-3"],
    ...["supports-[display:grid]", "in-[.table-fixed]", "not-[&:hover]", "has-[>svg]"],
  ])
    corpus.add(variant);
  assert.ok(corpus.size > 5000, `only ${corpus.size} variants in the fuzz corpus`);
  assert.deepEqual(disagreements([...corpus]), []);
  // The lenient shapes are in the corpus, so the exception is one Tailwind needs.
  const dropped = tailwindGenerates([...corpus].filter(lenient));
  assert.ok(
    [...dropped.values()].some((generates) => !generates),
    "no lenient variant is dropped",
  );
});

/* ---------- ARIA names, respellings and sizes ---------- */

test("an aria- variant must name an ARIA attribute, in any case, which Tailwind does not check", () => {
  const tailwind = tailwindGenerates(["aria-bogus", "aria-[bogus=x]"]);
  assert.ok([...tailwind.values()].every(Boolean), "Tailwind generates any aria- name");
  for (const name of lintFacts().ariaNames) assert.equal(variantProblem(`aria-${name}`), undefined);
  // ARIA 1.3's, which aria-query 5.3 does not list.
  for (const name of ["colindextext", "rowindextext", "actions"])
    assert.equal(variantProblem(`aria-${name}`), undefined, name);
  assert.equal(variantProblem("aria-Expanded"), undefined);
  assert.equal(variantProblem("aria-[current=page]"), undefined);
  assert.deepEqual(variantProblem("aria-bogus"), { cause: "aria", name: "bogus" });
  assert.deepEqual(variantProblem("aria-[sortt=ascending]"), { cause: "aria", name: "sortt" });
  assert.deepEqual(variantProblem("group-aria-selectd/row"), { cause: "aria", name: "selectd" });
});

/** A class's problem as classify sees it, with every replacement passing. */
const problemOf = (cls) => variantsProblem(classesOf(cls)[0], () => true);

test("a misspelt variant is respelled only when one spelling is near enough", () => {
  const meant = (cls) => problemOf(cls).data.meant;
  // One edit; a compound root two edits away around a variant written right; an ARIA name one
  // edit away, or two from six letters.
  assert.equal(meant("hovr:flex"), "hover");
  assert.equal(meant("motion-redcue:flex"), "motion-reduce");
  assert.equal(meant("grp-hover:flex"), "group-hover");
  assert.equal(meant("group-hovr/row:flex"), "group-hover/row");
  assert.equal(meant("not-frist:flex"), "not-first");
  assert.equal(meant("aria-expaned:flex"), "aria-expanded");
  assert.equal(meant("aria-[sortt=ascending]:flex"), "aria-[sort=ascending]");
  // Two edits is too far for a variant (tablet is two from target), a breakpoint or a container
  // size is never respelled, and neither is a word under three letters.
  for (const cls of ["tablet:flex", "hoveed:flex", "max-sn:flex", "@mdd:flex", "od:flex"])
    assert.equal(meant(cls), undefined, cls);
  // Two spellings as near as each other give none (oven is one edit from even and from open),
  // and so does a word as near to a breakpoint as to a state (wile: file, wide), or nearest one.
  for (const cls of ["oven:flex", "ivalid:flex", "wile:flex", "smm:flex", "ltg:flex"])
    assert.equal(meant(cls), undefined, cls);
  assert.equal(editDistance("tablet", "target"), 2);
  assert.equal(editDistance("redcue", "reduce"), 1);
});

test("a class's replacement respells every variant at fault and keeps everything else", () => {
  assert.equal(problemOf("md:hovr:!bg-surface").data.replacement, "md:hover:!bg-surface");
  assert.equal(problemOf("hovr:focs:bg-surface!").data.replacement, "hover:focus:bg-surface!");
  // One variant with no spelling leaves the class without a replacement, and the message names
  // the first variant's spelling.
  assert.deepEqual(problemOf("hovr:tablet:flex"), {
    cause: "respell",
    data: { variant: "hovr", meant: "hover" },
  });
  // A replacement another class rule would report is not offered (closure).
  assert.deepEqual(
    variantsProblem(classesOf("hovr:bg-surfce")[0], () => false),
    {
      cause: "respell",
      data: { variant: "hovr", meant: "hover" },
    },
  );
});

test("a breakpoint's finding lists the container sizes first, then the window breakpoints", () => {
  const { containers, breakpoints } = sizeLists();
  assert.equal(containers, "@3xs 16rem to @7xl 80rem, @compact 25rem and @split 50rem");
  assert.equal(
    breakpoints,
    "sm 40rem, md 48rem, lg 64rem, aside 75rem, panel or xl 80rem and wide 110rem",
  );
  const { cause, data } = problemOf("tablet:flex");
  assert.equal(cause, "breakpoint");
  assert.deepEqual(Object.keys(data), ["variant", "containers", "breakpoints"]);
  // Decision 5: xl stays, as panel's alias, and 2xl is no breakpoint.
  assert.equal(variantProblem("xl"), undefined);
  assert.equal(grammar.breakpoints.xl, grammar.breakpoints.panel);
  assert.equal(problemOf("2xl:flex").cause, "breakpoint");
  assert.equal(problemOf("@8xl:flex").cause, "container");
  assert.equal(problemOf("@8xl:flex").data.sizes, containers);
});

test("a CSS variable as a selector's or a feature query's value generates CSS that never matches", () => {
  const variants = ["nth-(--n)", "nth-last-of-type-(--n)", "supports-(--x)", "not-nth-(--n)"];
  const tailwind = tailwindGenerates(variants);
  assert.ok([...tailwind.values()].every(Boolean), "Tailwind generates each");
  for (const variant of variants) {
    assert.deepEqual(variantProblem(variant), { cause: "variable" }, variant);
    assert.ok(variantGenerated(variant));
  }
  // Where Tailwind takes no variable, the variant is unknown.
  for (const variant of ["data-(--x)", "aria-(--x)", "min-(--x)", "@(--x)"]) {
    assert.equal(tailwindGenerates([variant]).get(variant), false, variant);
    assert.deepEqual(variantProblem(variant), { cause: "variant" }, variant);
  }
});

test("an unknown word is a size only where a breakpoint could stand, and only when it reads as one", () => {
  const cause = (cls) => problemOf(cls).cause;
  // At the top and under not-: a digit, a t-shirt size, a device, or near a size's name.
  for (const cls of ["tablet:flex", "2xl:flex", "xxl:flex", "desktop:flex", "pannel:flex"])
    assert.equal(cause(cls), "breakpoint", cls);
  assert.equal(cause("not-tablet:flex"), "breakpoint");
  // A state-like word, and any word inside group-, peer-, in- or has-, which wrap no breakpoint.
  for (const cls of ["selected:flex", "expanded:flex", "error:flex", "group-tablet:flex"])
    assert.equal(cause(cls), "variant", cls);
  for (const cls of ["group-expanded:flex", "peer-error:flex", "in-selected:flex", "has-2xl:flex"])
    assert.equal(cause(cls), "variant", cls);
});

test("a variant another Ledger rule forbids is never the spelling offered", () => {
  for (const cls of ["dakr:flex", "darkk:flex", "not-drak:flex"])
    assert.equal(problemOf(cls).data.meant, undefined, cls);
  assert.equal(problemOf("hovr:flex").data.meant, "hover");
});

test("a /name on a variant that takes none names the variant without it, and the group's", () => {
  assert.deepEqual(problemOf("hover/row:flex"), {
    cause: "groupModifier",
    data: { variant: "hover/row", without: "hover", group: "group-hover/row" },
  });
  assert.deepEqual(problemOf("not-hover/row:flex"), {
    cause: "modifier",
    data: { variant: "not-hover/row", without: "not-hover" },
  });
  assert.equal(tailwindGenerates(["group-hover/row"]).get("group-hover/row"), true);
});

test("a variant the product declares is known as written, alone and in a compound", () => {
  // Declared names are known for the rest of the run, so this one is used nowhere else.
  assert.equal(variantProblem("theme-lint-probe")?.cause, "variant");
  declareVariants(["theme-lint-probe"]);
  for (const variant of ["theme-lint-probe", "group-theme-lint-probe", "not-theme-lint-probe"])
    assert.equal(variantProblem(variant), undefined, variant);
  assert.equal(variantProblem("theme-lint-prob")?.cause, "variant");
});
