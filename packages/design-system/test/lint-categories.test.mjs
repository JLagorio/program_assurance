// The class categories: lint.json's `categories`, which the token build writes from tailwind-merge's
// config and the kit's merge config (build/class-categories.mjs), read by eslint-plugin/categories.js
// with no tailwind-merge at lint time. Every group the kit's cn() merges by has one category, every
// class Tailwind lists for the kit and every Ledger class gets one, and the grammar the plugin
// builds from the data places each class in the group tailwind-merge does.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { extendTailwindMerge, getDefaultConfig, mergeConfigs } from "tailwind-merge";
import * as tailwindMerge from "tailwind-merge";

import {
  GROUP_CATEGORIES,
  classCategories,
  groupProblems,
  serialiseGrammar,
} from "../build/class-categories.mjs";
import {
  CATEGORIES,
  VALIDATORS,
  categoriesOf,
  groupOf,
  propertiesCategories,
  propertyCategories,
  layoutKindOf,
  reachesOthers,
  variantReach,
  replaces,
} from "../eslint-plugin/categories.js";
import { classesOf } from "../eslint-plugin/classes.js";
import { mergeConfig } from "../src/generated/merge-config.ts";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(path.join(packageRoot, "package.json"));
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(packageRoot, file), "utf8"));
const facts = readJson("src/generated/lint.json");
const values = readJson("src/generated/lint-values.json");
const allowlist = readJson("src/generated/utilities.json");

/** The kit's cn(), as src/lib/cn.ts builds it. */
const cn = extendTailwindMerge(mergeConfig);
/** The grammar cn() merges by. */
const merged = mergeConfigs(getDefaultConfig(), mergeConfig);

/** Every class Tailwind lists for the kit, from its Storybook entry, loaded once. */
let listing;
const tailwindClasses = () =>
  (listing ??= (async () => {
    const { __unstable__loadDesignSystem } = require("@tailwindcss/node");
    const entry = path.join(packageRoot, "src/styles/storybook.css");
    const design = await __unstable__loadDesignSystem(fs.readFileSync(entry, "utf8"), {
      base: path.dirname(entry),
    });
    return design.getClassList().map(([name]) => name);
  })());
/** Every Ledger class: the token classes and the kit's @utility names. */
const ledgerClasses = [...new Set([...allowlist.classes, ...facts.utilities])];

/* ---------- the table ---------- */

test("every tailwind-merge group the kit's cn() merges by has one category, and the table names no other group", () => {
  assert.deepEqual(groupProblems(Object.keys(merged.classGroups)), []);
  assert.deepEqual(Object.keys(GROUP_CATEGORIES), [...CATEGORIES]);
  for (const category of CATEGORIES)
    assert.ok(facts.categories.groups[category].length, `no group is ${category}`);
  assert.equal(
    facts.categories.tailwindMerge,
    JSON.parse(
      fs.readFileSync(
        path.join(path.dirname(require.resolve("tailwind-merge")), "../package.json"),
        "utf8",
      ),
    ).version,
    "lint.json's categories reflect another tailwind-merge; run npm run build:tokens",
  );
});

test("a group the table does not place, or one the grammar lost, stops the build and names it", () => {
  const listed = { classes: [], propertiesOf: () => null };
  const build = (config) =>
    classCategories({
      tailwindMerge,
      version: "test",
      mergeConfig: config,
      utilities: {},
      listed,
    });
  // A new group in the merge config.
  assert.throws(
    () => build({ ...mergeConfig, extend: { classGroups: { glow: [{ glow: ["soft"] }] } } }),
    /tailwind-merge group "glow" has no category in build\/class-categories\.mjs; add it/,
  );
  // The kit's own icon group, which the table files as colour, gone from the merge config.
  const { icon, ...withoutIcon } = mergeConfig.extend.classGroups;
  assert.ok(icon, "the merge config has the kit's icon group");
  assert.throws(
    () => build({ ...mergeConfig, extend: { ...mergeConfig.extend, classGroups: withoutIcon } }),
    /group "icon" in build\/class-categories\.mjs is no tailwind-merge group/,
  );
});

/* ---------- a class's categories ---------- */

test("a class's categories, by what places it", () => {
  const cases = [
    // A kit @utility, by the CSS it sets (a token class is one too).
    ["max-w-layout-measure", ["layout"], "utility"],
    ["animate-rise", ["motion"], "utility"],
    ["lg:page-header", ["layout"], "utility"],
    ["fill-window", ["layout"], "utility"],
    ["stat-grid-3", ["layout"], "utility"],
    ["focus-visible:outline-focused", ["shape"], "utility"],
    ["text-subtle", ["color"], "utility"],
    ["icon-subtle", ["color"], "utility"],
    ["hover:bg-brand-bold", ["color"], "utility"],
    ["font-body-small", ["typography"], "utility"],
    ["border-default", ["color"], "utility"],
    ["opacity-disabled", ["effects"], "utility"],
    ["duration-fast", ["motion"], "utility"],
    // Any other class, by its tailwind-merge group.
    ["rounded-xsmall", ["shape"], "grammar"],
    ["shadow-raised", ["effects"], "grammar"],
    ["p-200", ["spacing"], "grammar"],
    ["data-[orientation=vertical]:gap-100", ["spacing"], "grammar"],
    ["tabular-nums", ["typography"], "grammar"],
    ["border-b", ["shape"], "grammar"],
    ["divide-y", ["shape"], "grammar"],
    ["bg-red-500", ["color"], "grammar"],
    ["w-full", ["layout"], "grammar"],
    // Text flow is the caller's.
    ["truncate", ["layout"], "grammar"],
    ["line-clamp-2", ["layout"], "grammar"],
    ["break-all", ["layout"], "grammar"],
    // A class Tailwind lists that tailwind-merge does not place, by the CSS Tailwind writes.
    ["mask-circle", ["effects"], "css"],
    // An arbitrary property, by its property.
    ["[mask-type:alpha]", ["effects"], "property"],
    // The hook class a library reads, by name; a name marker.
    ["recharts-cartesian-axis-tick-value", ["layout"], "hook"],
    ["group/tabs", ["layout"], "marker"],
    // No class Tailwind or the kit knows.
    ["glow-soft", [], "none"],
  ];
  for (const [cls, categories, via] of cases) {
    const found = categoriesOf(cls);
    assert.deepEqual(
      { categories: [...found.categories], via: found.via },
      { categories, via },
      cls,
    );
  }
  // fill-window is layout by its CSS, though cn() merges it as a fill colour: its own key. A
  // utility whose CSS agrees with its group is filed under the group.
  assert.equal(groupOf("fill-window"), "fill");
  assert.equal(categoriesOf("fill-window").key, "utility:fill-window");
  assert.equal(categoriesOf("text-subtle").key, "text-color");
  assert.equal(categoriesOf("max-w-layout-measure").key, "max-w");
  assert.equal(categoriesOf("p-200").key, "p");
  assert.equal(categoriesOf("glow-soft").key, "class:glow-soft");
  // Memoised and frozen.
  assert.equal(categoriesOf("p-200"), categoriesOf("p-200"));
  assert.ok(Object.isFrozen(categoriesOf("p-200").categories));
});

test("every class Tailwind lists for the kit and every Ledger class has a category", async () => {
  const classes = [...new Set([...(await tailwindClasses()), ...ledgerClasses])];
  assert.ok(classes.length > 6000, `Tailwind lists ${classes.length} classes`);
  const none = classes.filter((cls) => categoriesOf(cls).categories.length === 0);
  assert.deepEqual(none, [], "classes with no category");
  for (const cls of ledgerClasses)
    assert.ok(CATEGORIES.includes(categoriesOf(cls).categories[0]), cls);
});

test("every @utility is in the data, as the categories of the CSS it sets", () => {
  const byName = new Map();
  for (const [category, names] of Object.entries(facts.categories.utilities))
    for (const name of names) byName.set(name, [...(byName.get(name) ?? []), category]);
  assert.deepEqual([...byName.keys()].sort(), [...facts.utilities].sort());
  for (const [name, { properties }] of Object.entries(values.utilityDetails))
    assert.deepEqual(
      CATEGORIES.filter((category) => byName.get(name).includes(category)),
      propertiesCategories(properties),
      name,
    );
});

test("a property's category; a mixed utility is all of its categories, custom properties alone layout", () => {
  const cases = [
    ["padding-inline", ["spacing"]],
    ["row-gap", ["spacing"]],
    ["background-color", ["color"]],
    ["fill", ["color"]],
    ["background-image", ["effects"]],
    ["box-shadow", ["effects"]],
    ["border-block-end", ["shape", "color"]],
    ["outline", ["shape"]],
    ["outline-offset", ["shape"]],
    ["border-start-start-radius", ["shape"]],
    ["font-variant-numeric", ["typography"]],
    ["letter-spacing", ["typography"]],
    ["transition-property", ["motion"]],
    ["animation-delay", ["motion"]],
    ["display", ["layout"]],
    ["max-inline-size", ["layout"]],
    ["--fill-chrome", []],
  ];
  for (const [property, categories] of cases)
    assert.deepEqual(propertyCategories(property), categories, property);
  assert.deepEqual(propertiesCategories(["padding", "color", "--x"]), ["spacing", "color"]);
  assert.deepEqual(propertiesCategories(["--stat-cols", "--stat-fold"]), ["layout"]);
  assert.deepEqual([...categoriesOf("stat-grid-2").categories], ["layout"]);
});

/* ---------- the grammar, rebuilt from data ---------- */

test("the grammar is data: validators by name, theme values by key, and a function it cannot name stops the build", () => {
  const grammar = facts.categories.grammar;
  assert.deepEqual(JSON.parse(JSON.stringify(grammar)), grammar);
  assert.deepEqual(
    serialiseGrammar(merged, tailwindMerge.validators),
    grammar,
    "lint.json's grammar is not the merged config; run npm run build:tokens",
  );
  const named = JSON.stringify(grammar).match(/"\$v:\w+"/g) ?? [];
  assert.ok(named.length > 100);
  const strange = mergeConfigs(getDefaultConfig(), {
    extend: { classGroups: { glow: [{ glow: [(value) => value === "soft"] }] } },
  });
  assert.throws(
    () => serialiseGrammar(strange, tailwindMerge.validators),
    /group glow glow: a function that is no tailwind-merge validator/,
  );
});

test("each validator is tailwind-merge's own, and each one it exports has a port", () => {
  assert.deepEqual(
    Object.keys(tailwindMerge.validators).sort(),
    Object.keys(VALIDATORS).sort(),
    "tailwind-merge's validators and categories.js's ports",
  );
  const samples = [
    ...["", "0", "1", "1.5", "-1", "px", "full", "auto", "1/2", "1.5/2", "3xl", "md", "50%", "x%"],
    ...["[10px]", "[length:var(--x)]", "[color:red]", "[#fff]", "[rgb(0_0_0)]", "[50%]"],
    ...["[url(a.png)]", "[image:var(--x)]", "[linear-gradient(red,blue)]", "[0_1px_2px_red]"],
    ...["[shadow:var(--x)]", "[family-name:var(--f)]", "[number:var(--n)]", "[weight:600]"],
    ...["[size:var(--s)]", "[position:var(--p)]", "[percentage:var(--p)]", "[calc(1px+2px)]"],
    ...["(--x)", "(length:--x)", "(color:--x)", "(image:--x)", "(shadow:--x)", "(position:--x)"],
    ...["(size:--x)", "(family-name:--x)", "(weight:--x)", "(number:--x)", "@container/sidebar"],
    ...["@container-size/x", "@container-normal/x", "@container", "12", "1e3", "10dvh", "2cqi"],
  ];
  for (const [name, port] of Object.entries(VALIDATORS))
    for (const value of samples)
      assert.equal(port(value), tailwindMerge.validators[name](value), `${name}(${value})`);
});

test("each class is in the group tailwind-merge merges it by, as the kit's cn() does", async () => {
  // A class and the first class of its group replace each other in cn() (they are one group, or
  // two that replace each other); a group the data gets wrong keeps both.
  const classes = [...new Set([...(await tailwindClasses()), ...ledgerClasses])];
  const first = new Map();
  for (const cls of classes) {
    const group = groupOf(cls);
    if (group && !first.has(group)) first.set(group, cls);
  }
  const wrong = [];
  for (const cls of classes) {
    const group = groupOf(cls);
    const other = group && first.get(group);
    if (!other || other === cls) continue;
    if (cn(other, cls) !== cls || cn(cls, other) !== other) wrong.push(`${cls} (${group})`);
  }
  assert.deepEqual(wrong, []);
  assert.ok(first.size > 300, `${first.size} groups`);
});

test("replaces says what cn() drops: the same group, or one it replaces, under the same variants", () => {
  const sample = [
    ...["p-200", "pt-150", "py-200", "px-100", "pb-0", "p-0", "ps-150", "pe-150", "-mt-100"],
    ...["gap-100", "gap-x-200", "gap-y-100", "md:p-200", "!p-100", "p-100!", "mt-100", "m-0"],
    ...["hover:bg-brand-bold", "bg-brand-bold", "bg-neutral", "text-subtle", "text-default"],
    ...["font-body-small", "font-heading-overlay", "text-lg/7", "leading-5", "tabular-nums"],
    ...["w-full", "w-layout-rail", "min-w-0", "max-w-layout-measure", "size-200", "h-full"],
    ...["rounded-medium", "rounded-t-none", "border", "border-t", "border-default", "border-b-2"],
    ...["outline-none", "outline-focused", "focus-visible:outline-focused", "shadow-raised"],
    ...["opacity-disabled", "animate-rise", "duration-fast", "truncate", "whitespace-nowrap"],
    ...["data-[orientation=vertical]:gap-100", "line-clamp-2", "block", "hidden", "flex", "grid"],
    ...["inset-0", "top-0", "h-control-medium", "divide-y", "divide-x", "page-header"],
    ...["fill-window", "icon-subtle", "before:inset-0", "hover:focus:bg-neutral"],
    ...["focus:hover:bg-neutral", "items-center", "justify-between", "[mask-type:alpha]"],
    ...["[mask-type:luminance]", "before:content-['']", "*:p-100", "*:hover:p-200"],
  ];
  const wrong = [];
  for (const earlier of sample)
    for (const later of sample) {
      if (earlier === later) continue;
      if (replaces(later, earlier) !== (cn(earlier, later) === later))
        wrong.push(`${earlier} then ${later}: cn gives "${cn(earlier, later)}"`);
    }
  assert.deepEqual(wrong, []);
});

/* ---------- variants that style another element ---------- */

test("a class whose variants style a child, a descendant or a sibling reaches another element", () => {
  const reaches = (cls) => reachesOthers(classesOf(cls)[0].variants);
  for (const cls of ["*:p-100", "**:text-subtle", "[&_svg]:size-icon-small", "[&>li]:p-100"])
    assert.ok(reaches(cls), cls);
  for (const cls of ["[&+div]:mt-100", "[&~*]:hidden", "md:[&_button]:p-0"])
    assert.ok(reaches(cls), cls);
  for (const cls of ["hover:p-100", "data-[open]:bg-neutral", "group-hover:text-default"])
    assert.ok(!reaches(cls), cls);
  for (const cls of ["before:inset-0", "[&:hover]:bg-neutral", "[&[hidden]]:hidden", "p-100"])
    assert.ok(!reaches(cls), cls);
  // A step after a state or an attribute of the element, or after a `:where(&)`, at depth 0.
  for (const cls of [
    "[&:hover_svg]:text-brand",
    "[&[data-state=open]>svg]:rotate-180",
    "[:where(&)_svg]:text-brand",
    "[:is(&)>li]:p-100",
    "[&:not(:disabled)_svg]:text-brand",
  ])
    assert.ok(reaches(cls), cls);
  // A selector inside `:has()` or an attribute, and an ancestor before `&`, step nowhere.
  for (const cls of ["[&:has(>svg)]:p-0", "[&[data-x=a_b]]:p-0", "[.dark_&]:p-0", "[&]:p-0"])
    assert.ok(!reaches(cls), cls);
});

test("variantReach names the step and the compound it ends on", () => {
  assert.deepEqual(variantReach("*"), { reach: "inside", combinator: "child", target: "*" });
  assert.deepEqual(variantReach("**"), { reach: "inside", combinator: "descendant", target: "*" });
  assert.deepEqual(variantReach("[&[data-state=open]>svg]"), {
    reach: "inside",
    combinator: "child",
    target: "svg",
  });
  assert.deepEqual(variantReach("[&_li_a]"), {
    reach: "inside",
    combinator: "descendant",
    target: "a",
  });
  assert.deepEqual(variantReach("[&_[data-slot=button]]").target, "[data-slot=button]");
  assert.deepEqual(variantReach("[&+div]"), { reach: "sibling", target: "div" });
  assert.deepEqual(variantReach("hover"), { reach: "self" });
});

test("layoutKindOf tells a part's own behaviour from where it sits", () => {
  const kind = (cls) => layoutKindOf(categoriesOf(cls).key);
  for (const cls of [
    "select-none",
    "pointer-events-none",
    "cursor-pointer",
    "appearance-none",
    "touch-none",
    "resize-none",
  ])
    assert.equal(kind(cls), "interaction", cls);
  for (const cls of ["rotate-180", "scale-95", "translate-x-full", "origin-top"])
    assert.equal(kind(cls), "transform", cls);
  for (const cls of ["truncate", "line-clamp-2", "whitespace-nowrap", "break-all", "text-wrap"])
    assert.equal(kind(cls), "text-flow", cls);
  for (const cls of ["overflow-hidden", "overflow-x-auto"])
    assert.equal(kind(cls), "overflow", cls);
  for (const cls of [
    "w-full",
    "min-w-0",
    "shrink-0",
    "flex-1",
    "hidden",
    "sticky",
    "z-10",
    "text-end",
  ])
    assert.equal(kind(cls), "placement", cls);
});
