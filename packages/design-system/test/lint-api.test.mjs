// The read-only API (eslint-plugin/api.js), named exports of @ledger/design-system/eslint: each
// answer is the lint's own. A class's rule, message id, advice, fix and editor suggestions are the
// finding ESLint reports for that class; a plain-data kitPartOf is the part identity.js gives the
// same import in a file; the token lookups round-trip through the lint data; and stale data is an
// error that names the fix.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Linter } from "eslint";

import ledger, * as entry from "../eslint-plugin/index.js";
import * as api from "../eslint-plugin/api.js";
import { lintValues } from "../eslint-plugin/data.js";
import { kitPartOf as kitPartOfNode } from "../eslint-plugin/identity.js";
import { PRODUCT, REPO } from "./lint-helpers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = "@ledger/design-system";
const NAMES = [
  "classCategories",
  "classify",
  "kitPartOf",
  "partsSetting",
  "suggestClass",
  "tokenOfClass",
  "tokenValue",
  "tokensOfValue",
];

test("the plugin's entry exports the API by name, and its default is still the plugin", () => {
  assert.deepEqual(Object.keys(api).sort(), NAMES);
  for (const name of NAMES) {
    assert.equal(typeof entry[name], "function", name);
    assert.equal(entry[name], api[name], name);
  }
  assert.equal(entry.default, ledger);
  assert.ok(ledger.rules["no-margin"] && ledger.configs.recommended);
});

/* ---------- a class: the finding ESLint reports ---------- */

// From the repository's root, which holds both the product's files and the kit's.
const linter = new Linter({ cwd: REPO });
/** What a .tsx file needs to be linted at all: a block whose files match it, which reads JSX. */
const JSX = {
  files: ["**/*.tsx"],
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
};
const config = [...ledger.configs.recommended, JSX];

/** The classes on the one element of a linted source, as a fix or a suggestion leaves them. */
const classesAfter = (code, { range, text }) =>
  /className="([^"]*)"/.exec(code.slice(0, range[0]) + text + code.slice(range[1]))[1].split(" ");

/** What ESLint reports for `cls` on an element no rule judges as a part or a layout element, with
    `siblings` before it: the findings that name the class, and the source. */
function lintClass(cls, siblings = "") {
  const code = `export const A = () => <em className="${[siblings, cls].filter(Boolean).join(" ")}" />;\n`;
  const messages = linter.verify(code, config, { filename: PRODUCT });
  return { code, found: messages.filter(({ message }) => message.startsWith(`"${cls}"`)) };
}

/** Every owner and every reader, with a class each rule passes. */
const CLASSES = [
  ["p-200"],
  ["hover:bg-surface"],
  ["flex"],
  ["mt-4"],
  ["-mt-4"],
  ["p-4"],
  ["text-sm"],
  ["bg-gray-100"],
  ["bg-surfce"],
  ["p-210"],
  ["fill-chart-categorical-9"],
  ["-p-200"],
  ["text-muted-foreground"],
  ["bg-muted"],
  ["bg-muted/50"],
  ["bg-red-500/50"],
  ["p-[16px]"],
  ["w-[240px]"],
  ["bg-(--brand)"],
  ["bg-(--ds-elevation-surface)"],
  ["bg-brand-bold/50"],
  ["hover:bg-neutral/50"],
  ["rounded"],
  ["opacity-50"],
  ["duration-200"],
  ["bg-white"],
  ["ring"],
  ["fill-chart-categorical-8"],
  ["hovr:bg-surface"],
  ["tablet:p-200"],
  ["dark:bg-gray-900"],
  ["dark:bg-gray-900", "bg-white"],
  ["dark:bg-gray-900", "bg-surface"],
  ["dark:bg-surface", "bg-white"],
];

test("classify and suggestClass give the finding ESLint reports for the class", () => {
  const owners = new Set();
  for (const [cls, siblings] of CLASSES) {
    const label = siblings ? `${cls} beside ${siblings}` : cls;
    const { code, found } = lintClass(cls, siblings);
    const classified = api.classify(cls);
    const suggestion = api.suggestClass(cls, { siblings });
    assert.equal(suggestion.rule, classified.rule, label);
    if (!classified.rule) {
      assert.deepEqual(found, [], label);
      assert.deepEqual([suggestion.advice, suggestion.replacements], [[], []], label);
      continue;
    }
    owners.add(classified.rule);
    assert.equal(found.length, 1, `${label}: ${found.map(({ message }) => message).join(" | ")}`);
    const [finding] = found;
    assert.equal(finding.ruleId, classified.rule, label);
    assert.equal(finding.messageId, suggestion.cause, label);
    if (suggestion.advice.length)
      assert.ok(
        suggestion.advice.some((words) => finding.message.includes(words)),
        `${label}: ${finding.message}`,
      );
    // What --fix writes, what each editor suggestion writes, or the classes the words name.
    const written = (fix) => classesAfter(code, fix).find((each) => each !== siblings);
    assert.deepEqual(
      finding.fix ? [written(finding.fix)] : [],
      suggestion.fixable ? suggestion.replacements : [],
      label,
    );
    assert.deepEqual(
      (finding.suggestions ?? []).map(({ fix }) => written(fix)),
      suggestion.suggested ? suggestion.replacements : [],
      label,
    );
    if (!suggestion.fixable && !suggestion.suggested)
      for (const replacement of suggestion.replacements)
        assert.ok(finding.message.includes(replacement), `${label}: ${finding.message}`);
  }
  // Every rule classify can name a class's owner.
  assert.deepEqual([...owners].sort(), [
    "ledger/no-alpha-token",
    "ledger/no-arbitrary-value",
    "ledger/no-dark-variant",
    "ledger/no-deprecated-token",
    "ledger/no-margin",
    "ledger/no-non-token-class",
    "ledger/no-static-design-value",
    "ledger/no-unknown-variant",
  ]);
});

test("a class's answers are frozen, and the same for the same question", () => {
  const first = api.suggestClass("p-4");
  assert.deepEqual(api.suggestClass("p-4"), first);
  assert.ok(Object.isFrozen(first) && Object.isFrozen(first.replacements));
  assert.ok(Object.isFrozen(api.classify("mt-4")));
  assert.deepEqual(api.suggestClass("p-4").replacements, ["p-200"]);
  assert.deepEqual(api.classify("hover:p-200").variants, ["hover"]);
  assert.ok(Object.isFrozen(api.partsSetting("font-body-small")));
  // An answer is a copy: changing it changes nothing the rules read.
  const { entry } = api.classify("fill-chart-categorical-8").data;
  entry.replacementClass = "changed";
  assert.deepEqual(api.suggestClass("fill-chart-categorical-8").replacements, [
    "fill-chart-categorical-7",
  ]);
});

test("a class function takes one class, as a string", () => {
  for (const fn of ["classify", "suggestClass", "classCategories", "partsSetting", "tokenOfClass"])
    for (const bad of ["", "p-200 gap-200", undefined, 4])
      assert.throws(() => api[fn](bad), TypeError, `${fn}(${JSON.stringify(bad)})`);
});

test("every other argument of the wrong kind is a TypeError that names it", () => {
  const self = { kit: "self", filename: path.join(root, "src/patterns/example.tsx") };
  const cases = [
    [() => api.suggestClass("p-4", null), /options as an object/],
    [() => api.suggestClass("p-4", { siblings: 5 }), /`siblings`/],
    [() => api.suggestClass("p-4", { siblings: [null] }), /`siblings`/],
    [() => api.tokenValue(undefined), /token's name as a string/],
    [() => api.tokenValue(5), /token's name as a string/],
    [() => api.tokensOfValue(null), /a string or a finite number/],
    [() => api.tokensOfValue(Number.NaN), /a string or a finite number/],
    [() => api.tokensOfValue("16px", null), /options as an object/],
    [() => api.tokensOfValue("#fff", { mode: "Light" }), /`mode` as "light" or "dark"/],
    [() => api.tokensOfValue("16px", { kind: "color" }), /`kind` as one of .*colour/],
    [() => api.tokensOfValue("16px", { role: "spacing" }), /`role` as one of .*space/],
    [() => api.kitPartOf("Button", PACKAGE, null), /options as an object/],
    [() => api.kitPartOf("Button", PACKAGE, { imported: 5 }), /`imported` as a string/],
    [() => api.kitPartOf("Button", PACKAGE, { kit: "other" }), /`kit` as "self"/],
    [() => api.kitPartOf("Button", "./button", { kit: "self" }), /absolute `filename`/],
    [() => api.kitPartOf("Button", "./button", { ...self, filename: "x.tsx" }), /absolute/],
    [() => api.kitPartOf("Button", PACKAGE, { filename: 5 }), /`filename` as a string/],
  ];
  for (const [ask, message] of cases) assert.throws(ask, { name: "TypeError", message }, `${ask}`);
  // What each takes still answers.
  assert.deepEqual(api.suggestClass("p-4", { siblings: ["gap-200"] }).replacements, ["p-200"]);
  assert.ok(api.tokensOfValue(16, { kind: "length", role: "space" }).length);
  assert.equal(api.kitPartOf("Button", "./button", self), "Button");
});

test("classCategories and partsSetting are the categories and part data the rules read", () => {
  assert.deepEqual(api.classCategories("hover:p-200").categories, ["spacing"]);
  assert.equal(api.classCategories("p-200").group, "p");
  const text = api.partsSetting("font-body-small")[0];
  assert.deepEqual([text.part, text.via, text.prop], ["Text", "prop", "size"]);
  assert.deepEqual(api.partsSetting("not-a-class"), []);
});

test("a part's settings are copies: changing one changes nothing ledger/no-restyle reads", () => {
  const code = `import { Alert } from "${PACKAGE}";\nexport const A = () => <Alert tone="danger" className="bg-surface">Hi</Alert>;\n`;
  const restyles = () =>
    linter
      .verify(code, config, { filename: PRODUCT })
      .filter(({ ruleId }) => ruleId === "ledger/no-restyle")
      .map(({ message }) => message);
  const derived = () =>
    api.partsSetting("bg-danger").find(({ part, via }) => part === "Alert" && via === "derived");
  const reported = restyles();
  assert.equal(reported.length, 1);
  const props = [...derived().props];
  assert.ok(props.length && Object.isFrozen(derived()));
  // A derived setting's props are the part data's own list; the answer holds a copy of it.
  derived().props.length = 0;
  const answer = derived();
  answer.props.push("changed");
  assert.deepEqual(derived().props, props);
  assert.deepEqual(restyles(), reported);
});

/* ---------- a tag: the part identity.js gives the same import ---------- */

/** The part identity.js gives `<name />` in a file with `importLine`, read through ESLint. */
function partInFile(importLine, name, { filename = PRODUCT, settings = {} } = {}) {
  const found = [];
  const probe = {
    rules: {
      part: {
        create: (context) => ({
          JSXOpeningElement(node) {
            found.push(kitPartOfNode(context, node.name));
          },
        }),
      },
    },
  };
  const messages = linter.verify(
    `${importLine}\nexport const A = () => <${name} />;\n`,
    { ...JSX, plugins: { probe }, rules: { "probe/part": "error" }, settings },
    { filename },
  );
  assert.deepEqual(messages, []);
  return found[0];
}

test("kitPartOf with plain data is the part identity.js gives the same import", () => {
  const kit = path.join(root, "src/patterns/example.tsx");
  const self = { kit: "self", filename: kit };
  const cases = [
    [`import { Table } from "${PACKAGE}";`, "Table.Cell", PACKAGE, {}],
    [`import { Button } from "${PACKAGE}";`, "Button", PACKAGE, {}],
    [`import { Table as T } from "${PACKAGE}";`, "T.Cell", PACKAGE, { imported: "Table" }],
    [`import * as L from "${PACKAGE}";`, "L.Id", PACKAGE, { imported: "*" }],
    [`import * as L from "${PACKAGE}";`, "L.Nope", PACKAGE, { imported: "*" }],
    [`import Kit from "${PACKAGE}";`, "Kit", PACKAGE, { imported: "default" }],
    [`import { Table } from "@acme/ui";`, "Table", "@acme/ui", {}],
    [`import { Helper } from "${PACKAGE}";`, "Helper", PACKAGE, {}],
    [`import { Button } from "./button";`, "Button", "./button", {}],
    [`import { Button } from "./button";`, "Button", "./button", self],
    [`import { Button } from "../stories/helpers";`, "Button", "../stories/helpers", self],
  ];
  for (const [importLine, name, source, options] of cases) {
    const { kit: kitSetting, filename } = options;
    const expected = partInFile(importLine, name, {
      ...(filename ? { filename } : {}),
      ...(kitSetting ? { settings: { ledger: { kit: kitSetting } } } : {}),
    });
    assert.equal(api.kitPartOf(name, source, options), expected, `${importLine} <${name}>`);
  }
  assert.equal(api.kitPartOf("T.Cell", PACKAGE, { imported: "Table" }), "Table.Cell");
  assert.equal(api.kitPartOf("L.Id", PACKAGE, { imported: "*" }), "Id");
  assert.equal(api.kitPartOf("Button", "./button", self), "Button");
  // An intrinsic element or a name JSX cannot write is no part.
  assert.equal(api.kitPartOf("button", PACKAGE), "");
  assert.equal(api.kitPartOf("Table..Cell", PACKAGE), "");
  assert.throws(() => api.kitPartOf("Button"), TypeError);
});

/* ---------- tokens ---------- */

test("a token's value, and the tokens that hold a value, from the lint data", () => {
  const { tokens, classes } = lintValues();
  assert.equal(api.tokenValue("space.200").px, 16);
  assert.equal(api.tokenValue("space.200").role, "space");
  assert.equal(api.tokenValue("no.such.token"), undefined);
  const names = (value, options) => api.tokensOfValue(value, options).map(({ name }) => name);
  assert.ok(names("16px").includes("space.200"));
  assert.deepEqual(names("1rem"), names("16px"));
  assert.deepEqual(names("16px", { role: "space" }), ["space.200"]);
  assert.ok(names("13px").includes("font.body"));
  assert.ok(names("0.4").includes("opacity.disabled"));
  assert.deepEqual(names("0.15s"), names("150ms"));
  assert.ok(names("#ffffff", { mode: "light" }).includes("elevation.surface"));
  assert.ok(!names("#ffffff", { mode: "dark" }).includes("elevation.surface"));
  assert.deepEqual(names("not a value"), []);
  // Every live token of a kind with a value is found by it, with its role, and none is deprecated.
  for (const [name, token] of Object.entries(tokens)) {
    const value =
      token.kind === "length"
        ? token.px !== undefined
          ? `${token.px}px`
          : (token.css ?? `${token.em}em`)
        : token.kind === "duration"
          ? `${token.ms}ms`
          : token.kind === "weight"
            ? token.weight
            : token.kind === "number" || token.kind === "easing"
              ? token.value
              : undefined;
    if (value === undefined) continue;
    const found = api.tokensOfValue(value).find((each) => each.name === name);
    if (token.deprecated) assert.equal(found, undefined, name);
    else assert.equal(found?.role, token.role, name);
  }
  // Every token class names its token, and a step of the space scale its space token.
  for (const [cls, name] of Object.entries(classes)) assert.equal(api.tokenOfClass(cls), name, cls);
  assert.equal(api.tokenOfClass("hover:p-200"), "space.200");
  assert.equal(api.tokenOfClass("gap-025"), "space.025");
  assert.equal(api.tokenOfClass("flex"), undefined);
  // A record is a copy: changing it changes nothing the rules read.
  assert.ok(Object.isFrozen(api.tokenValue("space.200")));
  const colour = api.tokensOfValue("#ffffff", { mode: "light" })[0];
  colour.oklab.light[0] = -1;
  assert.notEqual(tokens[colour.name].oklab.light[0], -1);
});

/** The plugin in a temporary package whose lint-values.json is `values`, from another build. */
function pluginWith(values) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-api-"));
  fs.writeFileSync(path.join(directory, "package.json"), '{"type":"module"}');
  fs.cpSync(path.join(root, "eslint-plugin"), path.join(directory, "eslint-plugin"), {
    recursive: true,
  });
  const generated = path.join(directory, "dist/generated");
  fs.mkdirSync(generated, { recursive: true });
  for (const file of ["utilities.json", "lint.json"])
    fs.copyFileSync(path.join(root, "src/generated", file), path.join(generated, file));
  fs.writeFileSync(path.join(generated, "lint-values.json"), values);
  return directory;
}

const STALE = /lint-values\.json" is stale: .*Run npm run build:tokens/;
const otherBuild = () => {
  const values = JSON.parse(
    fs.readFileSync(path.join(root, "src/generated/lint-values.json"), "utf8"),
  );
  return { ...values, inputsHash: "0".repeat(64) };
};

test("stale lint data is an error that names the fix, and a tag needs no data", async () => {
  const directory = pluginWith(JSON.stringify(otherBuild(), null, 2));
  try {
    const stale = await import(pathToFileURL(path.join(directory, "eslint-plugin/api.js")).href);
    for (const ask of [
      () => stale.tokensOfValue("16px"),
      () => stale.tokenValue("space.200"),
      () => stale.classify("p-4"),
      () => stale.suggestClass("p-4"),
    ])
      assert.throws(ask, STALE);
    assert.equal(stale.kitPartOf("Table.Cell", PACKAGE), "Table.Cell");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("another build's values are an error from the first question, whatever their layout", async () => {
  // Minified, the file's head does not show its build, so only reading the values finds it; each
  // function is asked first in a fresh copy of the plugin.
  const asks = {
    classify: (stale) => stale.classify("p-4"),
    suggestClass: (stale) => stale.suggestClass("p-4"),
    classCategories: (stale) => stale.classCategories("p-4"),
    tokenValue: (stale) => stale.tokenValue("space.200"),
    tokensOfValue: (stale) => stale.tokensOfValue("16px"),
    tokenOfClass: (stale) => stale.tokenOfClass("p-200"),
  };
  for (const [name, ask] of Object.entries(asks)) {
    const directory = pluginWith(JSON.stringify(otherBuild()));
    try {
      const stale = await import(pathToFileURL(path.join(directory, "eslint-plugin/api.js")).href);
      assert.throws(() => ask(stale), STALE, `${name} first`);
      assert.throws(() => ask(stale), STALE, `${name} again`);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
});

test("the API's types are its JSDoc: the export ships no declarations, and the page says so", () => {
  const { exports } = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const page = fs.readFileSync(path.join(root, "src/stories/docs/Lint.mdx"), "utf8");
  const says = /plain JavaScript[^.]*ships no type declarations/.test(page);
  if (typeof exports["./eslint"] === "string") assert.ok(says, "Lint.mdx says the API is untyped");
  else assert.ok(!says, "the export has types: Lint.mdx no longer says it is untyped");
});
