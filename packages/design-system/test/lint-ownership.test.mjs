// One class, one owner: every class the seven class rules read is reported by one of them at most,
// the one classify (eslint-plugin/classes.js) names, and each rule reports the same whether it runs
// alone, with the others, or after them. A part rule may still quote a class its owner reports
// (overlay-width-preset names the width class on a DialogContent), which is pinned below. The rules
// share per-file state (the class sites a file holds, read once and handed to every rule, and
// classify's answers), so this is also where that sharing is shown to change no rule's findings.
// Where a class's owner is off or waived no other rule reports it: the limits are pinned here.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";

import ledger from "../eslint-plugin/index.js";
import { classesOf, classify } from "../eslint-plugin/classes.js";
import {
  FIXTURE,
  STOCK_FILE,
  stockClasses,
  stockSource,
  stockVerdicts,
} from "../../../scripts/lint-corpus.mjs";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = path.resolve(packageRoot, "../..");
const typescript = {
  files: ["**/*.{ts,tsx}"],
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
};
const quiet = { linterOptions: { reportUnusedDisableDirectives: "off" } };
/** As both lint configs run: a disable that silences nothing is an error. */
const strict = { linterOptions: { reportUnusedDisableDirectives: "error" } };

/** A product screen, under the recommended preset, as the root config lints one. */
const PRODUCT = "src/components/prototype/screen.tsx";
/** A file of the kit's source, a story, and Bleed, under the package preset as the kit lints them. */
const KIT = "packages/design-system/src/components/example.tsx";
const STORY = "packages/design-system/src/stories/Example.stories.tsx";
const BLEED = "packages/design-system/src/primitives/bleed.tsx";

const packagePreset = ledger.configs.package.map((entry) => ({
  files: ["src/**/*.{ts,tsx}"],
  ...entry,
}));

/** The ledger findings of `code` at `at`, under the preset its path takes, with `rules` over it;
    with `directives`, an unused disable too (its ruleId is null). */
function lint(code, at = PRODUCT, { rules, directives = false } = {}) {
  const inKit = at.startsWith("packages/design-system/");
  const config = [
    typescript,
    directives ? strict : quiet,
    ...(inKit ? packagePreset : ledger.configs.recommended),
    ...(rules ? [{ rules }] : []),
  ];
  return new Linter({ cwd: inKit ? packageRoot : repoRoot })
    .verify(code, config, { filename: path.join(repoRoot, at) })
    .filter(({ ruleId }) => ruleId === null || ruleId?.startsWith("ledger/"));
}
const said = (messages) => messages.map(({ ruleId, message }) => [ruleId, message]);

/* ---------- (a) the stock corpus: no class has two owners ---------- */

test("no stock class is reported by two rules, and each reported one by the rule classify names", () => {
  const classes = stockClasses(JSON.parse(fs.readFileSync(path.join(repoRoot, FIXTURE), "utf8")));
  const { text, first } = stockSource(classes);
  const messages = new Linter({ cwd: repoRoot }).verify(
    text,
    [typescript, quiet, ...ledger.configs.recommended],
    { filename: path.join(repoRoot, STOCK_FILE) },
  );
  assert.equal(
    messages.find(({ fatal }) => fatal),
    undefined,
    "the stock file parses",
  );
  const verdicts = stockVerdicts(classes, messages, first);
  const twice = [...verdicts].filter(([, rules]) => rules.size >= 2);
  assert.deepEqual(
    twice.map(([cls, rules]) => `${cls}: ${[...rules].join(", ")}`),
    [],
    "a class has one owner",
  );
  const disagree = [];
  for (const [cls, rules] of verdicts) {
    const [parsed] = classesOf(cls);
    const { owner } = classify(parsed);
    const expected = owner ? [`ledger/${owner}`] : [];
    if ([...rules].join() !== expected.join())
      disagree.push(`${cls}: reported by ${[...rules].join(", ") || "no rule"}, owned by ${owner}`);
  }
  assert.deepEqual(disagree, [], "every stock class is reported by its owner and no other rule");
});

/* ---------- the owner of each kind of class ---------- */

test("each kind of class gets exactly one finding, from its owner", () => {
  const cases = [
    ["mt-4", "ledger/no-margin", '"mt-4" is a margin'],
    ["mt-[13px]", "ledger/no-margin", '"mt-[13px]" is a margin'],
    ["md:mt-4", "ledger/no-margin", '"md:mt-4" is a margin'],
    ["dark:mt-4", "ledger/no-dark-variant", '"dark:mt-4" uses the dark variant'],
    ["dark:w-[1px]", "ledger/no-dark-variant", '"dark:w-[1px]" uses the dark variant'],
    ["bg-white", "ledger/no-static-design-value", '"bg-white" is a literal colour'],
    ["disabled:opacity-50", "ledger/no-static-design-value", '"disabled:opacity-50" is a numeric'],
    ["dark:bg-white", "ledger/no-dark-variant", '"dark:bg-white" sets a dark colour by hand'],
    ["bg-brand-bold/50", "ledger/no-alpha-token", '"bg-brand-bold/50" dims bg-brand-bold'],
    ["bg-red-500/50", "ledger/no-non-token-class", '"bg-red-500/50" is a Tailwind palette colour'],
    ["bg-muted/50", "ledger/no-non-token-class", '"bg-muted/50" is shadcn\'s muted background'],
    ["bg-unknown/50", "ledger/no-non-token-class", '"bg-unknown/50" is neither a token utility'],
    ["bg-brand-bold/[0.5]", "ledger/no-arbitrary-value", '"bg-brand-bold/[0.5]" is an arbitrary'],
    ["w-(--rail)", "ledger/no-arbitrary-value", '"w-(--rail)" reads a CSS variable'],
    [
      "bg-(--ds-elevation-surface)",
      "ledger/no-arbitrary-value",
      '"bg-(--ds-elevation-surface)" writes a token\'s variable by hand',
    ],
    [
      "bg-(color:--ds-elevation-surface)",
      "ledger/no-arbitrary-value",
      '"bg-(color:--ds-elevation-surface)" writes a token\'s variable by hand',
    ],
    ["-w-full", "ledger/no-non-token-class", '"-w-full" generates no CSS: width cannot'],
    ["fill-chart-categorical-8", "ledger/no-deprecated-token", '"fill-chart-categorical-8" is'],
    ["dark:fill-chart-categorical-8", "ledger/no-dark-variant", '"dark:fill-chart-categorical-8"'],
    ["bg-red-500", "ledger/no-non-token-class", '"bg-red-500" is Tailwind\'s palette colour'],
    // A shadcn theme name is no-non-token-class's under any variant but dark:, which is
    // no-dark-variant's; a name that is also a Ledger token (bg-input) is that token, so alpha on
    // it is no-alpha-token's.
    ["text-muted-foreground", "ledger/no-non-token-class", '"text-muted-foreground" is shadcn\'s'],
    ["hover:bg-accent", "ledger/no-non-token-class", '"hover:bg-accent" is shadcn\'s'],
    ["dark:bg-accent", "ledger/no-dark-variant", '"dark:bg-accent"'],
    ["bg-input/30", "ledger/no-alpha-token", '"bg-input/30"'],
    // A variant Tailwind does not generate comes before every rule that judges the base, and
    // after a dark: class and a margin, whose fix takes the class away.
    ["hovr:bg-surface", "ledger/no-unknown-variant", '"hovr:bg-surface" uses "hovr"'],
    ["2xl:bg-surface", "ledger/no-unknown-variant", '"2xl:bg-surface" uses "2xl"'],
    ["tablet:w-[13px]", "ledger/no-unknown-variant", '"tablet:w-[13px]" uses "tablet"'],
    ["hovr:bg-red-500", "ledger/no-unknown-variant", '"hovr:bg-red-500" uses "hovr"'],
    ["aria-expaned:bg-white", "ledger/no-unknown-variant", '"aria-expaned:bg-white" names'],
    ["hovr:mt-4", "ledger/no-margin", '"hovr:mt-4" is a margin'],
    ["dark:hovr:bg-surface", "ledger/no-dark-variant", '"dark:hovr:bg-surface" sets bg-surface'],
  ];
  for (const [cls, rule, opening] of cases) {
    const messages = lint(`export const A = () => <div className="${cls}" />;`);
    assert.equal(messages.length, 1, `${cls}: ${JSON.stringify(said(messages))}`);
    assert.equal(messages[0].ruleId, rule, cls);
    assert.ok(messages[0].message.startsWith(opening), `${cls}: ${messages[0].message}`);
  }
  // Nothing: a token utility, structure, and the structural admissions that read a variable. The
  // layout classes are use-primitives' to judge on the element, not a class rule's.
  assert.deepEqual(
    said(
      lint(
        'export const A = () => <div className="p-200 bg-surface flex grid-cols-(--ds-grid-md) h-(--accordion-panel-height)" />;',
      ).filter(({ ruleId }) => ruleId !== "ledger/use-primitives"),
    ),
    [],
  );
});

/* ---------- the limits: a class whose owner is off or waived is not reported by another rule ---------- */

test("limit: Bleed turns no-margin off, so a margin there is reported by no rule", () => {
  const code = 'export const A = () => <div className="mt-4 -mx-200 mt-[13px]" />;';
  assert.deepEqual(said(lint(code, BLEED)), []);
  // Elsewhere in the kit each is no-margin's, once.
  assert.deepEqual(
    lint(code, KIT).map(({ ruleId }) => ruleId),
    ["ledger/no-margin", "ledger/no-margin", "ledger/no-margin"],
  );
  // A dark: margin is no-dark-variant's, which is on there.
  assert.deepEqual(
    lint('export const A = () => <div className="dark:-mx-200 dark:mt-[13px]" />;', BLEED).map(
      ({ ruleId }) => ruleId,
    ),
    ["ledger/no-dark-variant", "ledger/no-dark-variant"],
  );
});

test("limit: stories turn no-arbitrary-value off, so an arbitrary value there is reported by no rule", () => {
  const code =
    'export const A = () => <div className="w-[240px] w-(--rail) bg-brand-bold/[0.5] bg-red-500/[0.5]" />;';
  assert.deepEqual(said(lint(code, STORY)), []);
  assert.equal(lint(code, KIT).length, 4);
  // A margin stays no-margin's in a story, whatever its value, and a dark: class no-dark-variant's.
  assert.deepEqual(
    lint('export const A = () => <div className="mt-[13px] dark:mt-[13px]" />;', STORY)
      .map(({ ruleId }) => ruleId)
      .sort(),
    ["ledger/no-dark-variant", "ledger/no-margin"],
  );
});

test("limit: a line disable of a class's owner waives the whole class, whatever else is wrong with it", () => {
  // The directive is on the line above the element, so it applies, and an unused one would fail.
  const code = `export const A = () => (
  <>
    {/* eslint-disable-next-line ledger/no-margin -- The screen predates the rule. */}
    <p className="mt-4 -mx-[13px] -ms-(--overlap) dark:mt-200 bg-white" />
  </>
);`;
  // mt-4 is also a stock key, -mx-[13px] an arbitrary value and -ms-(--overlap) a variable, and no
  // rule says so; a dark: margin is no-dark-variant's, and bg-white is no margin at all.
  assert.deepEqual(
    lint(code, PRODUCT, { directives: true }).map(({ ruleId, message }) => [
      ruleId,
      message.slice(0, message.indexOf('" ') + 1),
    ]),
    [
      ["ledger/no-dark-variant", '"dark:mt-200"'],
      ["ledger/no-static-design-value", '"bg-white"'],
    ],
  );
  // Without the disable each margin is reported once, by no-margin.
  const bare = code.replace(/^\s*\{\/\*.*\*\/\}\n/m, "");
  assert.deepEqual(
    lint(bare)
      .map(({ ruleId }) => ruleId)
      .sort(),
    [
      "ledger/no-dark-variant",
      "ledger/no-margin",
      "ledger/no-margin",
      "ledger/no-margin",
      "ledger/no-static-design-value",
    ],
  );
});

test("limit: an allowance of a class's owner waives the whole class, whatever else is wrong with it", () => {
  const file = path.relative(packageRoot, path.join(repoRoot, KIT)).split(path.sep).join("/");
  const allow = (rule) => ({ [`ledger/${rule}`]: ["error", { allow: { [file]: 1 } }] });
  // One margin, at a stock key: within no-margin's allowance, and no other rule reports it.
  assert.deepEqual(
    said(
      lint('export const A = () => <div className="my-2" />;', KIT, { rules: allow("no-margin") }),
    ),
    [],
  );
  // Beside it, a dark: margin is no-dark-variant's, which has no allowance.
  assert.deepEqual(
    lint('export const A = () => <div className="my-2 dark:my-050" />;', KIT, {
      rules: allow("no-margin"),
    }).map(({ ruleId }) => ruleId),
    ["ledger/no-dark-variant"],
  );
  // One variable shorthand, or palette colour with bracketed alpha, within no-arbitrary-value's.
  for (const cls of ["max-w-(--dialog-width)", "bg-red-500/[0.5]"])
    assert.deepEqual(
      said(
        lint(`export const A = () => <div className="${cls}" />;`, KIT, {
          rules: allow("no-arbitrary-value"),
        }),
      ),
      [],
      cls,
    );
});

/* ---------- a part rule may quote a class its owner reports ---------- */

test("overlay-width-preset quotes the width class on an overlay, which the class's owner also reports", () => {
  const code = `${kitImport("DialogContent", "SheetContent", "AlertDialogContent")} export const A = () => <><DialogContent className="max-w-[520px]" /><SheetContent className="w-(--rail)" /><AlertDialogContent className="sm:max-w-lg" /></>;`;
  assert.deepEqual(
    lint(code)
      .map(({ ruleId, message }) => `${ruleId} ${message.slice(0, message.indexOf(" "))}`)
      .sort(),
    [
      'ledger/no-arbitrary-value "max-w-[520px]"',
      'ledger/no-arbitrary-value "w-(--rail)"',
      'ledger/no-non-token-class "sm:max-w-lg"',
      "ledger/overlay-width-preset AlertDialogContent",
      "ledger/overlay-width-preset DialogContent",
      "ledger/overlay-width-preset SheetContent",
    ],
  );
});

/* ---------- a value no rule can read, and a class built at runtime, have one owner each ---------- */

test("on a kit part, a class built at runtime is no-non-token-class's, and a value it cannot read readable-classes'", () => {
  const runtime = (code) =>
    lint(code).map(
      ({ ruleId, message }) =>
        `${ruleId}${/builds a class name at runtime/.test(message) ? " (runtime)" : ""}`,
    );
  assert.deepEqual(
    runtime(
      `${kitImport("Badge")} export const A = ({ tone }) => <Badge className={\`bg-\${tone}-500\`} />;`,
    ),
    ["ledger/no-non-token-class (runtime)"],
  );
  assert.deepEqual(
    runtime(
      `${kitImport("Badge", "cn")} export const A = ({ tone }) => <Badge className={cn("min-w-0", tone)} />;`,
    ),
    ["ledger/readable-classes"],
  );
  // A join or a concat that glues a class together is a runtime class too, not a prop as well.
  assert.deepEqual(
    runtime(
      `${kitImport("Badge")} export const A = ({ tone }) => <><Badge className={["bg-", tone].join("")} /><Badge className={"bg-".concat(tone)} /></>;`,
    ),
    ["ledger/no-non-token-class (runtime)", "ledger/no-non-token-class (runtime)"],
  );
});

/* ---------- a literal colour has one owner, whichever rule reads it ---------- */

test("a module's list of colours read by a style is no-raw-colour's, reported once where the list is", () => {
  const code =
    'const tones = { danger: "#e11d48", ok: "#16a34a" };\nexport const A = ({ tone }) => <><i style={{ color: tones[tone] }} /><svg><rect fill={tones[tone]} /></svg></>;';
  assert.deepEqual(
    lint(code).map(({ ruleId, line }) => `${ruleId}:${line}`),
    ["ledger/no-raw-colour:1"],
  );
  // A colour written in the style itself is the style's.
  assert.deepEqual(
    lint('export const A = () => <i style={{ color: "#e11d48" }} />;').map(({ ruleId }) => ruleId),
    ["ledger/no-style-design-value"],
  );
});

/* ---------- (b) independence: together, alone, in either order ---------- */

const kitImport = (...names) => `import { ${names.join(", ")} } from "@ledger/design-system";`;

/** A next-line disable of a class rule over an element with a class it waives and one it does not. */
const DIRECTIVE = `${kitImport("Shell", "Switch")} export const A = () => (<><Shell.NavItem>x</Shell.NavItem><Switch size="sm" />{/* eslint-disable-next-line ledger/no-margin -- The screen predates the rule. */}
<div className="mt-4 bg-white" /></>);`;

test("the mixed sources' next-line disable applies: it silences its line's margin and nothing else", () => {
  const messages = lint(DIRECTIVE, PRODUCT, { directives: true });
  assert.equal(
    messages.find(({ ruleId }) => ruleId === null),
    undefined,
    "the disable is used",
  );
  assert.deepEqual(
    messages.filter(({ line }) => line === 2).map(({ ruleId }) => ruleId),
    ["ledger/no-static-design-value"],
  );
});

/** Mixed sources: classes of every owner, at every kind of site, beside the part and behaviour
    rules that read the same class sites or the same elements. */
const MIXED = [
  // The catalogue's: four owners in one helper call.
  `import { cn } from "@ledger/design-system"; export const c = cn("bg-red-500 mt-200 w-[1px] dark:bg-neutral");`,
  `export const A = () => <div className="mt-4 bg-white bg-brand-bold/50 bg-red-500/50 disabled:opacity-50 mt-[13px] bg-brand-bold/[0.5] w-(--rail) dark:bg-white fill-chart-categorical-8 p-200 flex" />;`,
  // A module-level map, read by a static and a dynamic key, and a const read at two sites.
  `const tones = { danger: "bg-red-500 text-white/70", ok: "bg-success-subtle mt-100" }; const k = "rounded ring-2"; export const A = ({ t }) => <><p className={tones[t]} /><p className={tones.ok} /><span className={k} /><b className={k} /></>;`,
  // A glued template beside whole classes, a let written again, a slot map.
  'import { cn } from "@ledger/design-system"; export const A = ({ tone, on, x }) => { let c = "p-200"; if (x) c = "bg-red-500/50 mt-4"; return <><div className={cn(`bg-${tone}-500 mt-4 ${on ? " rounded" : ""}`, on && "ring-2")} /><DayPicker classNames={{ root: c, day: "dark:bg-surface" }} /></>; };',
  // cva and tv recipes.
  `import { cva } from "class-variance-authority"; import { tv } from "tailwind-variants"; export const b = cva("inline-flex rounded", { variants: { tone: { danger: "bg-red-500/50 dark:bg-danger", brand: "bg-brand-bold hover:bg-brand-bold/80" } } }); export const t = tv({ base: "mt-4", slots: { icon: "size-icon-small w-[13px]" } });`,
  // The part rules that read classes on kit parts.
  `${kitImport("Table", "Id", "Button", "Stack", "TabsList", "DialogContent")} import { Plus } from "icons"; export const A = () => <><Table.Cell className="font-semibold text-subtle mt-4">x</Table.Cell><Id className="text-brand">X-1</Id><Button><Plus className="size-icon-small" />Add</Button><Stack className="p-200 gap-100 bg-white">x</Stack><TabsList className="flex-wrap" /><DialogContent className="max-w-[520px]" /></>;`,
  // Links, a new tab, a style object, an SVG fill, a colgroup, confirm and a plain alert role.
  `${kitImport("TextLink")} export const A = () => { if (confirm("Go?")) return null; return <><a href="/r" target="_blank" className="text-brand hover:underline mt-4">R</a><TextLink href="/r" target="_blank">R</TextLink><div style={{ width: 240, color: "#fff" }} className="w-[240px]" /><svg><rect fill="#fff" className="fill-chart-categorical-8" /></svg><table><colgroup /></table><p role="alert">Failed</p></>; };`,
  // Renamed parts and props, and a disable that names a class rule, on the line above its element.
  DIRECTIVE,
  // A value no class rule can read on a kit part, beside a class built at runtime on another.
  `${kitImport("Button", "Badge", "cn")} import { toneOf } from "./tones"; export const A = ({ cls, tone }) => <><Button className={cn("mt-4", cls)} /><Badge className={\`bg-\${tone}-500\`} /><Button className={toneOf(tone)} /></>;`,
  // A colour list read by a style and an SVG fill, a recharts record's fill, and a part's own size.
  `${kitImport("token")} import { Pie } from "recharts"; const tones = { danger: "#e11d48", ok: "#16a34a" }; export const A = ({ t }) => <><i style={{ color: tones[t], width: token("dimension.part.popover"), "--w": "12px" }} /><svg><rect fill={tones[t]} /></svg><Pie dataKey="v" data={[{ v: 1, fill: "#0088fe" }]} /></>;`,
  // Overlays, pending buttons, navigation dressed as a button, and a table that turns responsive off.
  `${kitImport("Dialog", "DialogContent", "DialogFooter", "DialogClose", "Button", "Input", "TextLink", "DataTable")} export const A = ({ pending, table }) => <Dialog><DialogContent className="w-[480px]"><Input autoFocus className="mt-4" /><DialogFooter><Button variant="primary" isLoading={pending} disabled={pending}>Save</Button><DialogClose render={<Button>Cancel</Button>} /></DialogFooter><Button render={<a href="/records" />}>Records</Button><TextLink render={<button />}>x</TextLink><DataTable table={table} responsive={false} /></DialogContent></Dialog>;`,
  // Variants Tailwind does not generate, beside a dark: class and a margin under one.
  `export const A = () => <div className="hovr:bg-surface tablet:w-[13px] aria-expaned:bg-white hovr:mt-4 dark:hovr:bg-surface md:hovr:!bg-surface" />;`,
  // Classes that change what a kit part sets, beside a class rule's, and a class that styles the
  // parts inside an element.
  `${kitImport("Text", "Tabs", "Button")} export const A = () => <><Text className="tabular-nums mt-4 text-red-500">1</Text><Tabs className="gap-150" /><div className="[&_button]:bg-danger-bold *:mt-4"><Button>Save</Button></div></>;`,
  // A title's type copied onto a raw heading, beside its layout, a margin and a palette colour, and
  // onto a heading a kit title part renders.
  `${kitImport("DialogTitle", "Stack")} export const A = () => <Stack><h2 className="font-heading-page flex gap-100 mt-4 text-red-500">x</h2><DialogTitle render={<h3 className="font-heading-overlay min-w-0" />}>y</DialogTitle></Stack>;`,
  // A block disable, a local look-alike and a primitive given layout classes.
  `/* eslint-disable ledger/no-dark-variant */ ${kitImport("Box")} const Badge = (props) => <span {...props} />; export const A = () => <><Badge className="bg-red-500/50" /><Box className="flex gap-100 mt-4 dark:p-200" /></>;`,
];

/** A finding as the rules give it: rule, place, words, fix and suggestions. */
const key = ({ ruleId, line, column, endLine, endColumn, message, fix, suggestions }) =>
  JSON.stringify([
    ruleId,
    line,
    column,
    endLine,
    endColumn,
    message,
    fix ?? null,
    (suggestions ?? []).map(({ desc, fix: change }) => [desc, change]),
  ]);

/** The findings of `code` at `at` with these rules on at error, in this order, and no other. */
function withRules(code, at, rules, settings) {
  const config = [
    typescript,
    quiet,
    {
      plugins: { ledger },
      ...(settings ? { settings } : {}),
      rules: Object.fromEntries(rules.map((rule) => [rule, "error"])),
    },
  ];
  return new Linter({ cwd: repoRoot })
    .verify(code, config, { filename: path.join(repoRoot, at) })
    .filter(({ ruleId }) => ruleId?.startsWith("ledger/"))
    .map(key)
    .sort();
}

/**
 * All the rules together give the sorted union of each rule alone, with the rules in their order
 * and reversed: which rule reads a file's class sites first, and which classify answer is
 * remembered, changes no finding. Gives the rules that reported.
 */
function expectIndependentRules(code, at, rules, settings) {
  const alone = rules.flatMap((rule) => withRules(code, at, [rule], settings)).sort();
  assert.deepEqual(withRules(code, at, rules, settings), alone, `forward:\n${code}`);
  assert.deepEqual(
    withRules(code, at, [...rules].reverse(), settings),
    alone,
    `reversed:\n${code}`,
  );
  return alone.map((finding) => JSON.parse(finding)[0]);
}

/** Every rule is independent over the mixed sources, and every rule reports in one of them, so
    none passes by reporting nothing. */
function expectIndependentOver(sources, at, rules, settings) {
  const reached = new Set(
    sources.flatMap((code) => expectIndependentRules(code, at, rules, settings)),
  );
  assert.deepEqual(
    rules.filter((rule) => !reached.has(rule)),
    [],
    "the mixed sources reach every rule",
  );
}

test("every rule reports the same alone as with the others, in either order, in a product", () => {
  const rules = Object.keys(ledger.rules).map((name) => `ledger/${name}`);
  expectIndependentOver(MIXED, PRODUCT, rules);
});

test("every rule the kit runs reports the same alone as with the others, in the kit's source", () => {
  const rules = Object.keys(ledger.configs.package[0].rules).filter((rule) =>
    rule.startsWith("ledger/"),
  );
  const sources = MIXED.map((code) =>
    code.replaceAll('from "@ledger/design-system"', 'from "../index"'),
  );
  expectIndependentOver(sources, KIT, rules, { ledger: { kit: "self" } });
});
