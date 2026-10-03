// What each kit part sets itself: eslint-plugin/parts.json, which `npm run build:lint` writes from the
// kit's source (build/lint-parts.mjs) and ledger/no-restyle reads through eslint-plugin/parts.js.
// The file is the source's own reading, a change to a part's classes without the build is caught
// (Button through buttonVariants, Tabs' gap), the records say what the parts set, a className
// contract (`@accepts`) is checked when the data is built, and a file with no kit part never reads
// the data.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { mock } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Linter } from "eslint";
import ts from "typescript";
import tseslint from "typescript-eslint";

import { partsInventory } from "../build/lint-inventory.mjs";
import { reachesOthers } from "../eslint-plugin/categories.js";
import { classesOf } from "../eslint-plugin/classes.js";
import {
  accepts,
  acceptsOf,
  acceptsProblem,
  partData,
  partNames,
  partsPath,
  partsSetting,
  settingsChangedBy,
  settingsOf,
} from "../eslint-plugin/parts.js";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const src = path.join(packageRoot, "src");
const onDisk = () => JSON.parse(fs.readFileSync(partsPath, "utf8"));

/** The kit's program as the build makes it, with `changes` ({ "components/x.tsx": text => text })
    applied to the source it reads. */
function programWith(changes = {}) {
  const config = ts.readConfigFile(path.join(packageRoot, "tsconfig.build.json"), ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, packageRoot);
  const host = ts.createCompilerHost(parsed.options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (file, version, ...rest) => {
    const change = changes[path.relative(src, path.resolve(file)).split(path.sep).join("/")];
    return change
      ? ts.createSourceFile(file, change(ts.sys.readFile(file)), version, true)
      : getSourceFile(file, version, ...rest);
  };
  return ts.createProgram([path.join(src, "index.ts")], parsed.options, host);
}

/** `text` with `from` replaced once; a fixture whose source moved fails rather than pass. */
const replaceOnce = (from, to) => (text) => {
  assert.equal(text.split(from).length, 2, `the fixture expects "${from}" once`);
  return text.replace(from, to);
};

/** The parts whose records differ between two readings, sorted. */
const stale = (fresh, saved) =>
  [...new Set([...Object.keys(fresh), ...Object.keys(saved)])]
    .filter((name) => JSON.stringify(fresh[name]) !== JSON.stringify(saved[name]))
    .sort();

/* ---------- the data is the source's ---------- */

test("parts.json is what the build reads from the kit's source today", () => {
  const fresh = partsInventory(programWith()).parts;
  const changed = stale(fresh, onDisk().parts);
  assert.deepEqual(
    changed,
    [],
    `eslint-plugin/parts.json is stale for ${changed.slice(0, 8).join(", ")}${changed.length > 8 ? ", …" : ""}: run npm run build:lint in packages/design-system.`,
  );
});

test("a part's classes changed without build:lint leave parts.json stale: Button and Tabs", () => {
  // Button is read through buttonVariants, a helper in its own file; Tabs' gap is its root's.
  const fresh = partsInventory(
    programWith({
      "components/button.tsx": replaceOnce(
        '"bg-brand-bold text-inverse ',
        '"bg-danger-bold text-inverse ',
      ),
      "components/tabs.tsx": replaceOnce(
        "data-[orientation=horizontal]:flex-col data-[orientation=vertical]:gap-100",
        "data-[orientation=horizontal]:flex-col data-[orientation=vertical]:gap-150",
      ),
    }),
  ).parts;
  const saved = onDisk().parts;
  const changed = stale(fresh, saved);
  assert.ok(changed.includes("Button"), `Button is stale: ${changed.join(", ")}`);
  assert.ok(changed.includes("Tabs"), `Tabs is stale: ${changed.join(", ")}`);
  assert.ok(!changed.includes("Text") && !changed.includes("TabsContent"), changed.join(", "));
  const primary = (parts) => parts.Button.props.variant["bg-color"].primary;
  assert.ok(primary(saved).includes("bg-brand-bold"));
  assert.ok(primary(fresh).includes("bg-danger-bold") && !primary(fresh).includes("bg-brand-bold"));
  assert.deepEqual(saved.Tabs.root.gap, ["data-[orientation=vertical]:gap-100"]);
  assert.deepEqual(fresh.Tabs.root.gap, ["data-[orientation=vertical]:gap-150"]);
});

test("an @accepts entry that is no category and no class the kit knows stops the build", () => {
  assert.throws(
    () =>
      partsInventory(
        programWith({
          "components/id.tsx": replaceOnce(
            "@accepts color typography break-all",
            "@accepts colr typography break-all",
          ),
        }),
      ),
    /Id: @accepts "colr" is not a category \(layout, .*\) or a class the kit knows\. Did you mean "color"\?/,
  );
});

/* ---------- what the records say ---------- */

test("each part's kind, and the names it describes", () => {
  for (const name of ["Box", "Stack", "Inline", "Flex", "Grid", "Bleed"])
    assert.equal(partData(name).kind, "layout-primitive", name);
  for (const name of ["Text", "Heading"]) assert.equal(partData(name).kind, "type-primitive", name);
  assert.equal(partData("Button").kind, "component");
  // Members of a namespace by their dotted names; a name the kit does not export is none.
  for (const name of ["Section.Title", "Shell.TopNav.Item", "Table.Cell", "DataTable.Search"])
    assert.ok(partNames().includes(name), name);
  assert.equal(partData("Shell.Nope"), undefined);
  assert.equal(partData("toString"), undefined);
});

test("what a part sets, by root, prop and value", () => {
  assert.deepEqual(partData("Text").props.numeric, { "fvn-spacing": { true: ["tabular-nums"] } });
  assert.deepEqual(partData("Text").props.size["font-family"].small, ["font-body-small"]);
  assert.deepEqual(partData("Heading").props.size["font-family"].overlay, ["font-heading-overlay"]);
  // A deprecated size draws the step that replaced it.
  assert.deepEqual(partData("Heading").props.size["font-family"].xsmall, ["font-heading-overlay"]);
  // A primitive's space prop through the token tables, one class per space token.
  assert.deepEqual(partData("Stack").props.space.gap["space.200"], ["gap-200"]);
  // Decision 6: the panel's space is TabsContent's, and Tabs keeps a gap only beside a vertical strip.
  assert.deepEqual(partData("TabsContent").root.pt, ["pt-150"]);
  assert.deepEqual(partData("Tabs").root.gap, ["data-[orientation=vertical]:gap-100"]);
  assert.deepEqual(partData("RadioGroup").root.gap, ["gap-100"]);
  assert.ok(partData("Button").props.variant["bg-color"].primary.includes("bg-brand-bold"));
  assert.deepEqual(partData("Table.Header").props.align["text-alignment"].end, ["text-end"]);
  // A part whose props take no className is marked, since no caller's class meets it.
  assert.equal(partData("Dialog").className, false);
  assert.equal(partData("Button").className, undefined);
});

test("a prop's value: given (`*`), every value but one (`!x`), unset, and what a part sets with nothing written", () => {
  // `size !== "xsmall"` is every other size and none: Button's default padding, unset included.
  assert.deepEqual(partData("Button").props.size.ps["!xsmall"], ["ps-100"]);
  assert.equal(partData("Button").props.size.ps["*"], undefined);
  // `label && …` is a label given.
  assert.deepEqual(partData("Prose").props.label.pt["*"], ["pt-075"]);
  // What a part makes from several props carries what it sets when none is written: Alert's
  // neutral tone, Badge's brand bold fill, the default sizes of Avatar and Prose.
  assert.deepEqual(partData("Alert").derived["bg-color"].unset, ["bg-neutral"]);
  assert.deepEqual(partData("Alert").derived["text-color"].unset, ["text-subtle"]);
  assert.ok(partData("Badge").derived["bg-color"].unset.includes("bg-brand-bold"));
  assert.deepEqual(partData("Badge").derived["text-color"].unset, ["text-inverse"]);
  assert.deepEqual(partData("Avatar").derived.size.unset, ["size-300"]);
  assert.deepEqual(partData("Prose").derived["font-family"].unset, ["font-body"]);
  // A value that needs a prop the caller did not write has none: Box's inverse text on a bold
  // backgroundColor, a Table.Cell's pinned fill, Button's disabledReason cursor.
  assert.equal(partData("Box").derived["text-color"].unset, undefined);
  assert.equal(partData("Table.Cell").derived["bg-color"].unset, undefined);
  assert.equal(partData("Button").derived.cursor?.unset, undefined);
  // The settings say so, one class at a time.
  const alert = settingsOf("Alert").filter(
    ({ via, key }) => via === "derived" && key === "bg-color",
  );
  assert.deepEqual(
    alert.filter(({ unset }) => unset).map(({ cls }) => cls),
    ["bg-neutral"],
  );
});

test("a class whose variant styles a child or a descendant is no class of the part's element", () => {
  // `[&[aria-orientation=horizontal]>span]:rotate-90` styles the handle's span, not the handle.
  assert.equal(partData("ResizableHandle").root.rotate, undefined);
  for (const name of partNames())
    for (const { cls } of settingsOf(name))
      assert.equal(reachesOthers(classesOf(cls)[0].variants), false, `${name} ${cls}`);
});

test("which part sets a class: a primitive's prop first", () => {
  const [first] = partsSetting("font-body-small");
  assert.deepEqual(
    [first.part, first.via, first.prop, first.value],
    ["Text", "prop", "size", "small"],
  );
  const [numeric] = partsSetting("tabular-nums");
  assert.deepEqual([numeric.part, numeric.prop], ["Text", "numeric"]);
  assert.deepEqual(partsSetting("no-such-class"), []);
});

test("decision 7 in the data: a part owns only what it sets itself", () => {
  assert.ok(settingsChangedBy("TabsContent", "pt-200").length > 0);
  // py-200 replaces pt-150 where cn() merges.
  assert.ok(settingsChangedBy("TabsContent", "py-200").length > 0);
  assert.ok(settingsChangedBy("Tabs", "gap-150").length > 0);
  assert.ok(settingsChangedBy("RadioGroup", "gap-0").length > 0);
  assert.deepEqual(settingsChangedBy("RadioGroup", "divide-y"), []);
  assert.deepEqual(settingsChangedBy("Stack", "border-t"), []);
  assert.deepEqual(settingsChangedBy("Stack", "max-w-layout-measure"), []);
  assert.deepEqual(settingsChangedBy("Shell.Nope", "pt-200"), []);
});

/* ---------- className contracts ---------- */

test("every @accepts entry is a category or a class, and a contract takes what it names", () => {
  const contracts = partNames().filter((name) => partData(name).accepts);
  assert.ok(contracts.includes("Id") && contracts.includes("DatePicker"), contracts.join(", "));
  for (const name of contracts)
    for (const entry of partData(name).accepts)
      assert.equal(acceptsProblem(name, entry), undefined, `${name} @accepts ${entry}`);
  assert.deepEqual(acceptsOf("Id"), {
    categories: ["color", "typography"],
    classes: ["break-all"],
  });
  assert.equal(accepts("Id", "text-subtle"), true);
  assert.equal(accepts("Id", "md:break-all"), true);
  assert.equal(accepts("Id", "pt-200"), false);
  assert.equal(accepts("DatePicker", "w-full"), true);
  assert.equal(accepts("DatePicker", "pt-200"), false);
  // A part with no contract has no answer.
  assert.equal(accepts("Stack", "pt-200"), undefined);
});

test("acceptsProblem names the nearest category or class", () => {
  assert.match(acceptsProblem("Id", "colr"), /Did you mean "color"\?$/);
  assert.match(acceptsProblem("Id", "text-subtel"), /Did you mean "text-subtle"\?$/);
  assert.match(acceptsProblem("Id", "hover:break-all"), /^Id: @accepts "hover:break-all" is not/);
  assert.equal(acceptsProblem("Id", "layout"), undefined);
});

/* ---------- read on first use ---------- */

test("a file with no kit part never reads parts.json; the first class on one does, once", async () => {
  // A copy of the plugin and its lint data, so the module reads the file afresh.
  const copy = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-parts-")));
  fs.cpSync(path.join(packageRoot, "eslint-plugin"), path.join(copy, "eslint-plugin"), {
    recursive: true,
  });
  fs.copyFileSync(path.join(packageRoot, "package.json"), path.join(copy, "package.json"));
  fs.mkdirSync(path.join(copy, "src/generated"), { recursive: true });
  for (const file of ["lint.json", "lint-values.json", "utilities.json"])
    fs.copyFileSync(path.join(src, "generated", file), path.join(copy, "src/generated", file));
  const { default: plugin } = await import(
    pathToFileURL(path.join(copy, "eslint-plugin/index.js")).href
  );
  const product = path.join(packageRoot, "../../src/components/prototype/screen.tsx");
  const lint = (code) =>
    new Linter({ cwd: path.dirname(product) }).verify(
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
      ],
      product,
    );
  const reads = mock.method(fs, "readFileSync");
  const read = () =>
    reads.mock.calls.filter(
      ({ arguments: [at] }) => String(at) === path.join(copy, "eslint-plugin/parts.json"),
    ).length;
  try {
    assert.deepEqual(
      lint('export const A = () => <p className="font-body text-subtle">Saved</p>;\n'),
      [],
    );
    assert.equal(read(), 0, "a file with no kit part read parts.json");
    const restyle = lint(
      'import { Text } from "@ledger/design-system";\nexport const A = () => <Text className="tabular-nums">12</Text>;\n',
    );
    assert.deepEqual(
      restyle.map(({ ruleId }) => ruleId),
      ["ledger/no-restyle"],
    );
    assert.equal(read(), 1, "the first class on a kit part reads parts.json");
    lint(
      'import { Text } from "@ledger/design-system";\nexport const A = () => <Text className="tabular-nums">1</Text>;\n',
    );
    assert.equal(read(), 1, "parts.json is read once");
  } finally {
    reads.mock.restore();
    fs.rmSync(copy, { recursive: true, force: true });
  }
});
