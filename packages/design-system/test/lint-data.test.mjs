// The lint data the token build writes (build/lint-data.mjs) and the plugin's reader of it
// (eslint-plugin/data.js): the files are what Tailwind and the tokens give today, they say which
// Tailwind and which inputs they reflect, Tailwind never reads them for classes, and the plugin
// reads them lazily, both from src or both from dist, never loads Tailwind, reports stale data once
// per file whichever data rule is on, and throws on missing data.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mock, test } from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";

import { ARIA_1_3, VOCABULARY, lintData, vocabularyAliases } from "../build/lint-data.mjs";
import { classesOf, classify } from "../eslint-plugin/classes.js";
import { inputFiles, inputHashes, inputsHash } from "../eslint-plugin/data.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const generated = path.join(packageRoot, "src/generated");
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(generated, file), "utf8"));
const facts = readJson("lint.json");
const values = readJson("lint-values.json");
const allowlist = readJson("utilities.json");
const require = createRequire(path.join(packageRoot, "package.json"));

/* ---------- the files ---------- */

/** What the token build writes today, asked of Tailwind once for the tests that need it. */
let building;
const built = () => (building ??= lintData());

test("lint.json and lint-values.json are what the token build writes today", async () => {
  for (const [file, text] of Object.entries((await built()).files))
    assert.equal(
      fs.readFileSync(path.join(generated, file), "utf8"),
      text,
      `src/generated/${file} has drifted from Tailwind or the tokens; run npm run build:tokens`,
    );
});

test("the data names the Tailwind it reflects, the installed one, and the Lint page says so", () => {
  const installed = require("tailwindcss/package.json").version;
  assert.equal(
    facts.tailwind,
    installed,
    "lint.json reflects another Tailwind; rebuild the tokens",
  );
  assert.equal(values.tailwind, installed);
  const page = fs.readFileSync(path.join(packageRoot, "src/stories/docs/Lint.mdx"), "utf8");
  assert.ok(
    page.includes(`Tailwind ${installed}`),
    `Lint.mdx does not say the lint data reflects Tailwind ${installed}`,
  );
});

test("both files were built from today's inputs, which lint.json lists by hash", () => {
  const inputs = inputHashes();
  assert.deepEqual(facts.inputs, inputs, "lint.json is stale; run npm run build:tokens");
  assert.equal(facts.inputsHash, inputsHash(inputs));
  assert.equal(values.inputsHash, facts.inputsHash, "lint-values.json is another build's");
  // Everything the data is read from: the allowlist, the token docs, every stylesheet the
  // Storybook entry reads, the kit's @utility declarations among them, and shadcn's theme names.
  for (const file of [
    "build/vocabulary-aliases.json",
    "src/generated/utilities.json",
    "src/generated/docs.json",
    "src/generated/utilities.css",
    "src/generated/theme.css",
    "src/styles/layout.css",
    "src/styles/storybook.css",
  ])
    assert.ok(inputFiles().includes(file), `${file} is no input`);
  // Each file is hashed with its line endings as \n, so a checkout's line endings change nothing.
  const copy = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-inputs-")));
  try {
    for (const file of inputFiles()) {
      fs.mkdirSync(path.dirname(path.join(copy, file)), { recursive: true });
      const text = fs.readFileSync(path.join(packageRoot, file), "utf8");
      fs.writeFileSync(path.join(copy, file), text.replace(/\n/g, "\r\n"));
    }
    assert.deepEqual(inputHashes(copy), inputs);
  } finally {
    fs.rmSync(copy, { recursive: true, force: true });
  }
});

test("Tailwind reads no class from the lint data, which spells classes no element renders", async () => {
  // The kit's entry scans the package (`@source "../"`); every file the build writes is negated.
  const ledgerCss = fs.readFileSync(path.join(packageRoot, "src/styles/ledger.css"), "utf8");
  const negated = [...ledgerCss.matchAll(/@source\s+not\s+"\.\.\/generated\/([^"]+)"/g)].map(
    ([, glob]) => new RegExp(`^${glob.replace(/[.]/g, "\\.").replace(/\*/g, "[^/]*")}$`),
  );
  for (const file of Object.keys((await built()).files))
    assert.ok(
      negated.some((glob) => glob.test(file)),
      `ledger.css lets Tailwind scan src/generated/${file} for classes`,
    );
});

test("the variant grammar has Ledger's breakpoints and container sizes, and no 2xl breakpoint", () => {
  const { breakpoints, containers, functional } = facts.variants;
  for (const root of ["min", "max"])
    assert.deepEqual(functional[root].values, Object.keys(breakpoints));
  for (const root of ["@", "@min", "@max"])
    assert.deepEqual(functional[root].values, Object.keys(containers));
  for (const name of ["sm", "md", "lg", "aside", "panel", "wide", "xl"])
    assert.ok(name in breakpoints, `no ${name} breakpoint`);
  // Decision 5: xl stays, the alias of panel behind Grid's xl column count; 2xl is reset away.
  assert.equal(breakpoints.xl, breakpoints.panel);
  assert.ok(!("2xl" in breakpoints), "Tailwind's 2xl breakpoint survives the reset");
  assert.ok(!facts.variants.static.includes("2xl"));
  assert.equal(containers.split, "50rem");
  assert.equal(containers.compact, "25rem");
  assert.deepEqual(functional.not.values, []);
  assert.ok(functional.group.compound.includes("hover") && functional.group.modifier);
  assert.ok(functional.data.anyName && functional.nth.integer && functional.aria.arbitrary);
  for (const name of ["hover", "focus-visible", "motion-reduce", "dark", "panel"])
    assert.ok(facts.variants.static.includes(name), `no ${name} variant`);
});

test("negatable names the utilities a leading minus negates", () => {
  for (const root of ["mt", "inset-x", "translate-y", "indent", "scroll-mt"])
    assert.ok(facts.negatable.includes(root), `${root} takes a minus`);
  for (const root of ["p", "gap", "w", "size", "min-w", "scroll-p"])
    assert.ok(!facts.negatable.includes(root), `${root} takes no minus`);
});

test("every @utility the kit's CSS declares is in the lint data, where it is written", () => {
  const files = [
    ...fs
      .readdirSync(path.join(packageRoot, "src/styles"))
      .filter((file) => file.endsWith(".css"))
      .map((file) => `src/styles/${file}`),
    "src/generated/utilities.css",
  ];
  const declared = {};
  for (const file of files)
    fs.readFileSync(path.join(packageRoot, file), "utf8")
      .split("\n")
      .forEach((text, index) => {
        const name = /^\s*@utility\s+(\S+)\s*\{/.exec(text)?.[1];
        if (name) declared[name] = { file, line: index + 1 };
      });
  assert.deepEqual(facts.utilities, Object.keys(declared).sort());
  assert.deepEqual(Object.keys(values.utilityDetails), facts.utilities);
  for (const [name, { file, line, properties }] of Object.entries(values.utilityDetails)) {
    assert.deepEqual({ file, line }, declared[name], `@utility ${name}`);
    assert.ok(properties.length, `@utility ${name} sets no property`);
  }
  assert.ok(values.utilityDetails["page-header"].properties.includes("flex-basis"));
  assert.deepEqual(values.utilityDetails["bg-surface"].properties, ["background-color"]);
});

test("the ARIA attribute names are aria-query's, and the ARIA 1.3 names it lacks", () => {
  const { aria } = require("aria-query");
  const listed = aria.keys().map((name) => name.replace(/^aria-/, ""));
  assert.deepEqual(facts.ariaNames, [...listed, ...ARIA_1_3].sort());
  for (const name of ["expanded", "selected", "current", "sort", "colindextext", "actions"])
    assert.ok(facts.ariaNames.includes(name));
  // Each added name is one aria-query lacks: drop it from ARIA_1_3 once aria-query lists it.
  for (const name of ARIA_1_3)
    assert.ok(!listed.includes(name), `aria-query lists aria-${name} now; drop it from ARIA_1_3`);
});

test("the token values: lengths in px, colours in OKLab over the mode's surface, one class each", () => {
  const { tokens, classes } = values;
  assert.equal(tokens["dimension.container.2xs"].px, 288);
  assert.equal(tokens["space.200"].px, 16);
  assert.equal(tokens["motion.duration.fast"].ms, 110);
  assert.deepEqual(
    [tokens["font.body"].size, tokens["font.body"].lineHeight, tokens["font.body"].weight],
    [13, 18, 400],
  );
  for (const [name, token] of Object.entries(tokens)) {
    if (token.class) assert.ok(allowlist.classes.includes(token.class), `${name}: ${token.class}`);
    assert.ok(token.short.length <= 48, `${name}'s short label: ${token.short}`);
    assert.ok(token.family && token.role, `${name} has no family or role`);
  }
  for (const [cls, name] of Object.entries(classes)) {
    assert.ok(allowlist.classes.includes(cls), `${cls} is no token class`);
    assert.ok(name in tokens, `${cls} names ${name}, no token`);
  }
  assert.equal(classes["bg-surface"], "elevation.surface");
  assert.equal(classes["rounded-medium"], "radius.medium");
  // A translucent token is the colour the reader sees: composited over the surface of its mode.
  const neutral = tokens["color.background.neutral"];
  const surface = tokens["elevation.surface"].oklab;
  assert.deepEqual(neutral.alpha, { light: 0.06, dark: 0.07 });
  assert.ok(neutral.oklab.light[0] < surface.light[0] && neutral.oklab.light[0] > 0.9);
  assert.ok(neutral.oklab.dark[0] > surface.dark[0] && neutral.oklab.dark[0] < 0.4);
  assert.ok(
    values.specialised.includes("bg-blanket") && values.specialised.includes("bg-skeleton"),
  );
  assert.ok(!values.specialised.includes("bg-surface"));
  assert.equal(values.stock.spacing, "0.25rem");
  assert.deepEqual(values.stock.text.sm, { px: 14, lineHeight: 20 });
  assert.equal(values.stock.radius.md, 6);
  assert.equal(values.stock.weight.bold, 700);
  assert.equal(Object.keys(values.stock.palette).length, 26 * 11 + 2);
});

test("shadcn's theme names are the checked table: names no Ledger class has, for classes it has", async () => {
  const table = JSON.parse(fs.readFileSync(path.join(packageRoot, VOCABULARY), "utf8")).aliases;
  assert.deepEqual(values.aliases, table);
  for (const [name, { use, states = {} }] of Object.entries(values.aliases)) {
    assert.ok(!allowlist.classes.includes(name), `${name} is a Ledger class`);
    for (const cls of [...use, ...Object.values(states)])
      assert.ok(allowlist.classes.includes(cls), `${name} names ${cls}`);
    // One owner: no-non-token-class, which names the Ledger class, with alpha or without.
    for (const [written, cause] of [
      [name, "vocabulary"],
      [`hover:${name}/50`, "vocabularyAlpha"],
    ]) {
      const { owner, cause: given } = classify(classesOf(written)[0]);
      assert.deepEqual([owner, given], ["no-non-token-class", cause], written);
    }
  }
  // Ledger names a field's border and background as shadcn does; they are its own tokens.
  for (const name of ["border-input", "bg-input"]) assert.ok(!Object.hasOwn(values.aliases, name));
  // An entry the build cannot vouch for fails it, naming the fix.
  await built();
  const entry = { means: "primary background", use: ["bg-brand-bold"] };
  const fails = (name, fields, pattern) =>
    assert.throws(() => vocabularyAliases({ [name]: fields }, allowlist), pattern);
  fails("border-input", entry, /"border-input" is a Ledger class, which the lint admits/);
  fails("flex-1", entry, /"flex-1" is a Ledger class/);
  fails("hover:bg-primary", entry, /is not one plain class/);
  fails("bg-primary", { ...entry, use: ["bg-primary-bold"] }, /utilities\.json does not list/);
  fails("bg-primary", { ...entry, use: ["fill-chart-categorical-8"] }, /deprecated/);
  fails("bg-primary", { ...entry, use: ["bg-blanket"] }, /one purpose only/);
  fails("bg-primary", { ...entry, use: ["bg-brand-bold", "bg-neutral"] }, /for says when/);
  fails("bg-primary", { ...entry, for: ["a button"] }, /needs no for/);
  fails("bg-primary", { ...entry, aside: "It is bold" }, /ending with a period/);
  fails("bg-primary", { ...entry, suggest: true }, /only as false/);
  fails("bg-primary", { ...entry, note: "x" }, /fields no finding reads: note/);
  fails("bg-primary", { use: ["bg-brand-bold"] }, /says nothing in means/);
  // A state's class is checked as a use's is, and only the states the lint reads are keys.
  fails("bg-primary", { ...entry, states: { hovered: "bg-brand-bold-hovered" } }, /states takes/);
  fails("bg-primary", { ...entry, states: { selected: "bg-selectd" } }, /does not list/);
  fails("bg-primary", { ...entry, states: { selected: "bg-blanket" } }, /one purpose only/);
  fails("bg-primary", { ...entry, states: ["bg-selected"] }, /states as an object/);
  assert.throws(() => vocabularyAliases({}, allowlist), /has no aliases/);
});

/* ---------- the plugin's reader, on a copy of the package ---------- */

/** The plugin's modules name only Node's own modules and each other: the lint loads no Tailwind. */
test("no plugin module imports anything but Node's own modules and the plugin's", () => {
  const dir = path.join(packageRoot, "eslint-plugin");
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".js")))
    for (const [, specifier] of fs
      .readFileSync(path.join(dir, file), "utf8")
      .matchAll(/^\s*(?:import|export)\b[^'"]*?from\s+["']([^"']+)["']/gm))
      assert.ok(
        specifier.startsWith("node:") || specifier.startsWith("./"),
        `eslint-plugin/${file} imports ${specifier}`,
      );
});

/**
 * A copy of the plugin in a temporary package, outside the repository, where no node_modules is
 * reachable (so the copy loads no Tailwind, or it would fail to import): the plugin, package.json
 * and the generated files it reads, with lint.json and lint-values.json in `dir`, each edited by
 * `edit[file]` (which returns the new data, or text as it is written), or left out by `omit`. A
 * `kit` copy is shaped as the kit's checkout, with every input the data was built from (docs.json,
 * which the package does not ship, among them), each changed by `change[file]`; any other copy is
 * shaped as a consumer's installed package.
 */
async function pluginCopy({ dir = "src/generated", edit = {}, omit = [], kit, change = {} } = {}) {
  // The real path, as the copy's modules see their own (macOS's /var is /private/var).
  const copy = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-data-")));
  fs.cpSync(path.join(packageRoot, "eslint-plugin"), path.join(copy, "eslint-plugin"), {
    recursive: true,
  });
  fs.copyFileSync(path.join(packageRoot, "package.json"), path.join(copy, "package.json"));
  const files = kit
    ? inputFiles()
    : ["src/generated/utilities.json", "src/generated/tokens.css", "src/styles/layout.css"];
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(copy, file)), { recursive: true });
    const text = fs.readFileSync(path.join(packageRoot, file), "utf8");
    fs.writeFileSync(path.join(copy, file), change[file] ? change[file](text) : text);
  }
  fs.mkdirSync(path.join(copy, dir), { recursive: true });
  for (const file of ["lint.json", "lint-values.json"]) {
    if (omit.includes(file)) continue;
    let text = fs.readFileSync(path.join(generated, file), "utf8");
    if (edit[file]) {
      const edited = edit[file](JSON.parse(text));
      text = typeof edited === "string" ? edited : JSON.stringify(edited, null, 2);
    }
    fs.writeFileSync(path.join(copy, dir, file), text);
  }
  const load = (module) => import(pathToFileURL(path.join(copy, "eslint-plugin", module)).href);
  const [{ default: plugin }, data] = await Promise.all([load("index.js"), load("data.js")]);
  return { copy, plugin, data, remove: () => fs.rmSync(copy, { recursive: true, force: true }) };
}

const PRODUCT = path.join(packageRoot, "../../src/components/prototype/screen.tsx");
/** `code` linted as a product file under the copy's recommended preset, with `rules` over it. */
const lint = (plugin, code, rules = {}) =>
  new Linter({ cwd: path.dirname(PRODUCT) }).verify(
    code,
    [
      {
        files: ["**/*.tsx"],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
      },
      ...plugin.configs.recommended,
      { rules },
    ],
    { filename: PRODUCT },
  );

const CLEAN = 'export const Note = () => <p className="font-body text-subtle">Saved</p>;\n';
const STOCK = 'export const Note = () => <p className="font-body text-red-600">Saved</p>;\n';
/** A token's variable written by hand, which no-arbitrary-value fixes from lint-values.json. */
const VARIABLE =
  'export const Note = () => <p className="bg-(--ds-elevation-surface)">Saved</p>;\n';

/** The stale findings of each file, and the others by rule and quoted class. */
function findings(messages) {
  const stale = messages.filter(({ messageId }) => messageId === "stale");
  const others = messages
    .filter(({ messageId }) => messageId !== "stale")
    .map(({ ruleId, messageId, message }) => `${ruleId} ${messageId} ${message.split(" ")[0]}`);
  return { stale, others };
}
const DATA_RULES = ["no-arbitrary-value", "no-unknown-variant", "no-non-token-class"];

test("in the kit, an input changed since the build is one finding at line 1 of each file, and the rules still judge", async () => {
  // A kit utility renamed and one added, which the data does not know until the build runs.
  const { plugin, data, remove } = await pluginCopy({
    kit: true,
    change: {
      "src/styles/layout.css": (text) =>
        `${text.replace("@utility fill-window {", "@utility fill-window-v2 {")}\n@utility new-rail {\n  position: sticky;\n}\n`,
    },
  });
  try {
    for (const code of [CLEAN, STOCK, `\n\n${STOCK}`]) {
      const { stale, others } = findings(lint(plugin, code));
      assert.equal(stale.length, 1, code);
      assert.equal(stale[0].line, 1);
      assert.equal(stale[0].column, 1);
      assert.ok(DATA_RULES.includes(stale[0].ruleId.slice("ledger/".length)), stale[0].ruleId);
      assert.equal(
        stale[0].message,
        '"src/generated/lint.json" is stale: src/styles/layout.css has changed since the token build wrote it. Run npm run build:tokens in @ledger/design-system.',
      );
      assert.deepEqual(
        others,
        code === CLEAN ? [] : ['ledger/no-non-token-class unknown "text-red-600"'],
      );
    }
    assert.deepEqual(data.staleness(), {
      file: "src/generated/lint.json",
      why: "src/styles/layout.css has changed since the token build wrote it",
    });
  } finally {
    remove();
  }
});

test("a changed generated input is stale too: the var() fix waits for the build", async () => {
  // As tokens.mjs alone would leave it: bg-surface now reads another variable, which the lint
  // data's varToClass does not know.
  const { plugin, remove } = await pluginCopy({
    kit: true,
    change: {
      "src/generated/utilities.css": (text) =>
        text.replace(
          /(@utility bg-surface \{\s*background-color: var\(--ds-elevation-surface)\)/,
          "$1-sunken)",
        ),
    },
  });
  try {
    const messages = lint(plugin, VARIABLE);
    const { stale, others } = findings(messages);
    assert.equal(stale.length, 1);
    assert.match(stale[0].message, /src\/generated\/utilities\.css has changed since/);
    // The pair the data holds is no longer checked, so the class is only reported, never fixed.
    assert.deepEqual(others, ['ledger/no-arbitrary-value arbitrary "bg-(--ds-elevation-surface)"']);
    assert.ok(messages.every(({ fix }) => !fix));
  } finally {
    remove();
  }
});

test("a theme name changed since the build is stale too, and names no Ledger class until it runs", async () => {
  const { plugin, remove } = await pluginCopy({
    kit: true,
    change: { [VOCABULARY]: (text) => text.replace('"text-subtle"', '"text-subtlest"') },
  });
  try {
    const { stale, others } = findings(
      lint(plugin, 'export const Note = () => <p className="text-muted-foreground">Saved</p>;\n'),
    );
    assert.equal(stale.length, 1);
    assert.match(stale[0].message, /build\/vocabulary-aliases\.json has changed since/);
    // The table the data holds may name a class the file no longer does, so none is named.
    assert.equal(others.length, 1);
    assert.match(
      others[0],
      /^ledger\/no-non-token-class (?!vocabulary)\w+ "text-muted-foreground"$/,
    );
  } finally {
    remove();
  }
});

test("each data rule carries the stale finding, so it stays when a config turns another off", async () => {
  const { plugin, remove } = await pluginCopy({
    kit: true,
    change: { "src/generated/docs.json": (text) => text.replace("{", '{ "x": 1,') },
  });
  try {
    for (const on of DATA_RULES) {
      const off = Object.fromEntries(
        DATA_RULES.filter((rule) => rule !== on).map((rule) => [`ledger/${rule}`, "off"]),
      );
      const { stale } = findings(lint(plugin, CLEAN, off));
      assert.deepEqual(
        stale.map(({ ruleId, line }) => `${ruleId}:${line}`),
        [`ledger/${on}:1`],
      );
    }
  } finally {
    remove();
  }
});

test("an allowance never counts the stale finding, which is about the build, not the file", async () => {
  const { plugin, remove } = await pluginCopy({
    kit: true,
    change: { "src/generated/docs.json": (text) => text.replace("{", '{ "x": 1,') },
  });
  try {
    // One arbitrary value, which the file is allowed; the stale finding is reported beside it
    // and does not take the file over its allowance.
    const code = 'export const Note = () => <p className="w-[240px]">Saved</p>;\n';
    const allow = { allow: { [path.basename(PRODUCT)]: 1 } };
    const messages = lint(plugin, code, {
      "ledger/no-arbitrary-value": ["error", allow],
      "ledger/no-unknown-variant": "off",
      "ledger/no-non-token-class": "off",
      "ledger/use-primitives": "off",
    });
    assert.deepEqual(
      messages.map(({ ruleId, messageId, message }) => `${ruleId} ${messageId} ${message}`),
      [
        'ledger/no-arbitrary-value stale "src/generated/lint.json" is stale: src/generated/docs.json has changed since the token build wrote it. Run npm run build:tokens in @ledger/design-system.',
      ],
    );
  } finally {
    remove();
  }
});

test("lint-values.json from another build is stale, and the rules give their advice without it", async () => {
  const { plugin, data, remove } = await pluginCopy({
    edit: { "lint-values.json": (json) => ({ ...json, inputsHash: "0".repeat(64) }) },
  });
  try {
    for (const code of [
      CLEAN,
      VARIABLE,
      'export const A = () => <p className="-scroll-p-200" />;\n',
    ]) {
      const { stale, others } = findings(lint(plugin, code));
      assert.equal(stale.length, 1, code);
      assert.equal(
        stale[0].message,
        '"src/generated/lint-values.json" is stale: it comes from another token build than lint.json. Run npm run build:tokens in @ledger/design-system.',
      );
      assert.deepEqual(
        others,
        code === CLEAN
          ? []
          : code === VARIABLE
            ? ['ledger/no-arbitrary-value arbitrary "bg-(--ds-elevation-surface)"']
            : ['ledger/no-non-token-class unknown "-scroll-p-200"'],
      );
    }
    assert.equal(data.lintValues(), null, "values another build wrote are not used");
  } finally {
    remove();
  }
});

test("lint-values.json whose head does not show its build is checked when a rule first reads it", async () => {
  // The hash moved past the head: the first file cannot tell, the first value it needs can.
  const { plugin, data, remove } = await pluginCopy({
    edit: {
      "lint-values.json": ({ inputsHash: _, ...json }) => ({
        ...json,
        padding: "x".repeat(2000),
        inputsHash: "0".repeat(64),
      }),
    },
  });
  try {
    assert.equal(findings(lint(plugin, CLEAN)).stale.length, 0);
    const { stale, others } = findings(lint(plugin, VARIABLE));
    assert.equal(stale.length, 1, "the file that first reads the values is told, at its end");
    assert.deepEqual(others, ['ledger/no-arbitrary-value arbitrary "bg-(--ds-elevation-surface)"']);
    assert.equal(findings(lint(plugin, CLEAN)).stale.length, 1, "and every file after it");
    assert.equal(data.lintValues(), null);
  } finally {
    remove();
  }
});

test("fresh lint data is no finding, in the kit and in a consumer", async () => {
  for (const kit of [true, false]) {
    const { plugin, data, remove } = await pluginCopy({ kit });
    try {
      assert.deepEqual(lint(plugin, CLEAN), []);
      assert.equal(data.staleness(), null);
    } finally {
      remove();
    }
  }
});

test("a consumer's package compares no input, so its lint reads no stylesheet", async () => {
  // Without docs.json, which the package does not ship, the inputs are not there to compare: a
  // changed allowlist or stylesheet says nothing, and nothing is hashed.
  const { copy, plugin, data, remove } = await pluginCopy({
    change: { "src/styles/layout.css": (text) => `${text}\n@utility new-rail {\n}\n` },
  });
  const reads = mock.method(fs, "readFileSync");
  try {
    assert.deepEqual(lint(plugin, CLEAN), []);
    assert.equal(data.staleness(), null);
    const sheets = reads.mock.calls.filter(
      ({ arguments: [at] }) => String(at).startsWith(copy) && String(at).endsWith(".css"),
    );
    assert.deepEqual(sheets, []);
  } finally {
    reads.mock.restore();
    remove();
  }
});

test("missing lint data throws, naming the file and the fix", async () => {
  const { plugin, remove } = await pluginCopy({ omit: ["lint.json"] });
  try {
    assert.throws(
      () => lint(plugin, CLEAN),
      /Ledger lint data is missing: lint\.json is in neither src\/generated nor dist\/generated.*npm run build:tokens/,
    );
  } finally {
    remove();
  }
});

test("both files come from one folder: lint-values.json is never another folder's", async () => {
  // src/generated has lint.json and dist/generated both files: src's lint.json is never paired
  // with dist's values, which may be an older build's.
  const { copy, plugin, remove } = await pluginCopy({ omit: ["lint-values.json"] });
  fs.mkdirSync(path.join(copy, "dist/generated"), { recursive: true });
  for (const file of ["lint.json", "lint-values.json"])
    fs.copyFileSync(path.join(generated, file), path.join(copy, "dist/generated", file));
  try {
    assert.throws(
      () => lint(plugin, CLEAN),
      /Ledger lint data is missing: src\/generated has lint\.json but no lint-values\.json\. Run npm run build:tokens/,
    );
  } finally {
    remove();
  }
});

test("unreadable lint data throws, naming the file and the fix", async () => {
  const { plugin, remove } = await pluginCopy({ edit: { "lint.json": () => "{ not json" } });
  try {
    assert.throws(
      () => lint(plugin, CLEAN),
      /Ledger lint data is unreadable: src\/generated\/lint\.json .*npm run build:tokens/,
    );
  } finally {
    remove();
  }
});

test("a file that needs no value never parses lint-values.json; the first rule that needs one does", async () => {
  const { copy, plugin, data, remove } = await pluginCopy();
  const reads = mock.method(fs, "readFileSync");
  const heads = mock.method(fs, "readSync");
  const read = (file) =>
    reads.mock.calls.filter(
      ({ arguments: [at] }) => String(at).startsWith(copy) && String(at).endsWith(file),
    ).length;
  try {
    assert.deepEqual(lint(plugin, CLEAN), []);
    assert.equal(read("lint.json"), 1, "lint.json is read once, on the first file");
    assert.equal(read("lint-values.json"), 0, "a file that needs no value read lint-values.json");
    // Only its head, for the build that wrote it: one read of a kilobyte, once.
    assert.deepEqual(
      heads.mock.calls.map(({ arguments: [, buffer] }) => buffer.length),
      [1024],
    );
    // A stock colour's finding names the tokens nearest it (nearest.js), which are values.
    assert.deepEqual(lint(plugin, STOCK).length, 1);
    assert.equal(read("lint-values.json"), 1, "the first finding that needs a value reads it");
    assert.equal(data.lintValues().tokens["space.200"].px, 16);
    assert.equal(data.lintValues().inputsHash, data.lintFacts().inputsHash);
    assert.equal(read("lint-values.json"), 1, "lint-values.json is read once, when first asked");
  } finally {
    reads.mock.restore();
    heads.mock.restore();
    remove();
  }
});

test("without src/generated's lint data, the plugin reads dist/generated's", async () => {
  const { plugin, data, remove } = await pluginCopy({ dir: "dist/generated" });
  try {
    assert.deepEqual(lint(plugin, CLEAN), []);
    assert.match(data.generatedPath("lint.json"), /dist\/generated\/lint\.json$/);
    assert.equal(data.lintValues().tailwind, facts.tailwind);
  } finally {
    remove();
  }
});
