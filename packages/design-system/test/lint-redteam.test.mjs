// The red-team matrix: every way a planted mistake can reach a ledger rule that reads classes,
// style or kit parts, linted with the real presets. A cell is a rule, a carrier (the shape the
// mistake arrives in) and what should happen: the rule reports it, or, for a control, stays
// silent. A cell that goes the other way today is listed in lint-redteam-escapes.json, and the list
// only shrinks (scripts/check-allow-lists.mjs holds it to its base). The test fails when a cell
// escapes that the list does not name, and when a listed cell no longer escapes: then its entry
// goes. `REDTEAM_UPDATE=1 node --test test/lint-redteam.test.mjs` writes today's escapes into the
// list, for review.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";
import ledger from "../eslint-plugin/index.js";
import { ledgerRules, namesNoRule, readDirective } from "../eslint-plugin/config-rules.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const ESCAPES = path.join(here, "lint-redteam-escapes.json");
const ABOUT =
  "Cells of test/lint-redteam.test.mjs that go against what they should do today. Under a rule, a carrier is a shape the planted mistake arrived in that the rule did not report, or a control it reported that it should have left alone (the local look-alike, another package's part or a shadowing parameter, by the rule's family). Under escape checks, a route that no ledger rule and no count sees. The list only shrinks: when the test says a cell is caught, delete its entry (scripts/check-allow-lists.mjs compares with the base branch).";

/* ---------- scopes: the real presets, where they apply ---------- */

const parser = {
  files: ["**/*.tsx"],
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
};
const unused = { linterOptions: { reportUnusedDisableDirectives: "error" } };
const SCREENS = ["src/components/prototype/**/*.tsx"];
const scopes = {
  // A screen: the recommended preset, with what the root config's product block adds to it.
  product: {
    filename: "/repo/src/components/prototype/probe.tsx",
    config: [
      parser,
      unused,
      ...ledger.configs.recommended.map((entry) => ({ files: SCREENS, ...entry })),
      {
        files: SCREENS,
        rules: {
          "ledger/product-responsive-table": "error",
          "ledger/product-line-tabs": "error",
          "ledger/use-primitives": "error",
        },
      },
    ],
  },
  // The kit's own source, with the package preset scoped as its eslint.config.js scopes it.
  kit: {
    filename: "/repo/src/patterns/probe.tsx",
    config: [
      parser,
      unused,
      ...ledger.configs.package.map((entry) => ({ files: ["src/**/*.{ts,tsx}"], ...entry })),
    ],
  },
};
const kitRules = ledger.configs.package[0].rules;

const linter = new Linter({ cwd: "/repo" });
/** One cell's messages, and its comments for the directive count. */
function lint(code, scope) {
  const { filename, config } = scopes[scope];
  const messages = linter.verify(code, config, { filename });
  const fatal = messages.find((message) => message.fatal);
  if (fatal) throw new Error(`A cell does not parse (${fatal.message}):\n${code}`);
  return { messages, comments: linter.getSourceCode().getAllComments() };
}
/** Errors the run fails on: a warning passes CI, so it catches nothing. */
const errors = (messages, rule) =>
  messages.filter(
    (message) =>
      message.severity === 2 &&
      (rule ? message.ruleId === rule : message.ruleId?.startsWith("ledger/")),
  );

/* ---------- classes: each rule's planted class, on the element it judges ---------- */

const kitImport = (...names) => `import { ${names.join(", ")} } from "@ledger/design-system";`;
const onDiv = (attribute) => `<div ${attribute} />`;
/** Token rules read a class on any element and quote it when they report. */
const TOKEN_RULES = {
  "no-arbitrary-value": { planted: "w-[240px]", element: onDiv },
  "no-alpha-token": { planted: "bg-brand-bold/50", element: onDiv },
  "no-dark-variant": { planted: "dark:bg-neutral", element: onDiv },
  "no-unknown-variant": { planted: "hovr:bg-surface", element: onDiv },
  "no-margin": { planted: "mt-200", element: onDiv },
  "no-static-design-value": { planted: "rounded", element: onDiv },
  "no-non-token-class": { planted: "bg-red-500", element: onDiv },
  "no-deprecated-token": { planted: "fill-chart-categorical-8", element: onDiv },
};
/** Part rules that read the classes on one element. */
const CLASS_PART_RULES = {
  "cell-plain": {
    planted: "font-semibold",
    imports: kitImport("Table"),
    element: (attribute) => `<Table.Cell ${attribute}>x</Table.Cell>`,
    // A class that styles the elements inside a kit part is no-restyle's finding (descendant).
    allows: {
      "descendant variant": "a weight on the elements inside, which no-restyle reports on a part",
    },
  },
  "id-not-blue": {
    planted: "text-brand",
    imports: kitImport("Id"),
    element: (attribute) => `<Id ${attribute}>X-1</Id>`,
    allows: {
      "descendant variant": "a colour on the elements inside, which no-restyle reports on a part",
    },
  },
  "button-icon-slot": {
    planted: "size-icon-small",
    imports: kitImport("Button"),
    element: (attribute) => `<Button><Plus ${attribute} />Add</Button>`,
  },
  "use-primitives": {
    planted: "p-200",
    imports: kitImport("Stack"),
    element: (attribute) => `<Stack ${attribute}>x</Stack>`,
    // Shapes the rule leaves to the class on purpose: the spacing props take one token.
    allows: {
      "variant prefix": "a padding at a breakpoint, which the spacing props cannot key",
      "descendant variant": "a padding on the children, which is not the Stack's own layout",
    },
  },
  "prefer-text-link": {
    planted: "hover:underline",
    element: (attribute) => `<a href="/records" ${attribute}>Records</a>`,
  },
  "use-heading": {
    planted: "font-heading-page",
    element: (attribute) => `<h2 ${attribute}>Scope</h2>`,
    allows: {
      "descendant variant": "a type on the elements inside the heading, which is theirs",
    },
  },
  "product-line-tabs": {
    planted: "flex-wrap",
    imports: kitImport("TabsList"),
    // The class comes first: after a spread, the rule asks for the variant again.
    element: (attribute) => `<TabsList ${attribute} variant="line" />`,
  },
  "overlay-width-preset": {
    planted: "max-w-layout-measure",
    imports: kitImport("DialogContent"),
    element: (attribute) => `<DialogContent ${attribute} />`,
  },
  "no-restyle": {
    // A weight Text's weight prop sets, which a breakpoint changes as the bare class would.
    planted: "font-semibold",
    imports: kitImport("Text"),
    element: (attribute) => `<Text ${attribute}>12</Text>`,
  },
};

const direct = (c, element) => `export const A = () => ${element(`className="${c}"`)};`;
/** The shapes a class arrives in, for every rule that reads classes. */
const CLASS_CARRIERS = {
  "direct attribute": direct,
  "cn() call": (c, element) =>
    `${kitImport("cn")} export const A = () => ${element(`className={cn("${c}")}`)};`,
  "clsx object key": (c, element) =>
    `import { clsx } from "clsx"; export const A = ({ on }) => ${element(`className={clsx({ "${c}": on })}`)};`,
  "cva variant": (c, element) =>
    `import { cva } from "class-variance-authority"; const tone = cva("", { variants: { tone: { a: "${c}" } } }); export const A = () => ${element(`className={tone({ tone: "a" })}`)};`,
  ternary: (c, element) =>
    `export const A = ({ on }) => ${element(`className={on ? "${c}" : undefined}`)};`,
  "logical and": (c, element) =>
    `export const A = ({ on }) => ${element(`className={on && "${c}"}`)};`,
  "as const": (c, element) => `export const A = () => ${element(`className={"${c}" as const}`)};`,
  "template literal": (c, element) => `export const A = () => ${element(`className={\`${c}\`}`)};`,
  "template with expression": (c, element) =>
    `export const A = ({ x }) => ${element(`className={\`\${x} ${c}\`}`)};`,
  "className callback": (c, element) =>
    `export const A = () => ${element(`className={(state) => (state.open ? "${c}" : "")}`)};`,
  "same-file const": (c, element) =>
    `const k = "${c}"; export const A = () => ${element("className={k}")};`,
  "let binding": (c, element) =>
    `let k = "${c}"; export const A = () => ${element("className={k}")};`,
  "static member lookup": (c, element) =>
    `const tones = { a: "${c}" }; export const A = () => ${element("className={tones.a}")};`,
  "dynamic-key map": (c, element) =>
    `const tones = { a: "${c}" }; export const A = ({ t }) => ${element("className={tones[t]}")};`,
  "Record<Tone, string> map": (c, element) =>
    `const tones: Record<"a", string> = { a: "${c}" }; export const A = ({ t }: { t: "a" }) => ${element("className={tones[t]}")};`,
  "destructured binding": (c, element) =>
    `const { k } = { k: "${c}" }; export const A = () => ${element("className={k}")};`,
  "destructured tuple": (c, element) =>
    `const [, k] = ["Needs setup", "${c}"]; export const A = () => ${element("className={k}")};`,
  "imported constant": (c, element) =>
    `import { k } from "./tones"; export const A = () => ${element("className={k}")};`,
  "helper function": (c, element) =>
    `const tone = () => "${c}"; export const A = () => ${element("className={tone()}")};`,
  "default parameter": (c, element) =>
    `export function A({ className = "${c}" }) { return ${element("className={className}")}; }`,
  useMemo: (c, element) =>
    `import { useMemo } from "react"; export const A = () => { const k = useMemo(() => "${c}", []); return ${element("className={k}")}; };`,
  "spread props": (c, element) =>
    `export const A = () => ${element(`{...{ className: "${c}" }}`)};`,
  "spread of a const": (c, element) =>
    `const props = { className: "${c}" }; export const A = () => ${element("{...props}")};`,
  "array join": (c, element) =>
    `export const A = () => ${element(`className={["min-w-0", "${c}"].join(" ")}`)};`,
  "string concatenation": (c, element) =>
    `export const A = () => ${element(`className={"min-w-0 " + "${c}"}`)};`,
  "String.raw": (c, element) =>
    `export const A = () => ${element(`className={String.raw\`${c}\`}`)};`,
  "cx() call": (c, element) =>
    `import { cx } from "class-variance-authority"; export const A = () => ${element(`className={cx("${c}")}`)};`,
  "twJoin() call": (c, element) =>
    `import { twJoin } from "tailwind-merge"; export const A = () => ${element(`className={twJoin("${c}")}`)};`,
  "tv() recipe": (c, element) =>
    `import { tv } from "tailwind-variants"; const recipe = tv({ base: "${c}" }); export const A = () => ${element("className={recipe()}")};`,
  "aliased cn()": (c, element) =>
    `import { cn as merge } from "@ledger/design-system"; export const A = () => ${element(`className={merge("${c}")}`)};`,
  "cn() through a namespace": (c, element) =>
    `import * as Kit from "@ledger/design-system"; export const A = () => ${element(`className={Kit.cn("${c}")}`)};`,
  "cn() held by a const": (c, element) =>
    `${kitImport("cn")} const merge = cn; export const A = () => ${element(`className={merge("${c}")}`)};`,
  "computed key in a helper object": (c, element) =>
    `${kitImport("cn")} const active = "${c}"; export const A = ({ on }) => ${element("className={cn({ [active]: on })}")};`,
  "filter(Boolean).join": (c, element) =>
    `export const A = ({ on }) => ${element(`className={["min-w-0", on && "${c}"].filter(Boolean).join(" ")}`)};`,
  "trim()": (c, element) =>
    `export const A = ({ x }) => ${element(`className={\`${c} \${x}\`.trim()}`)};`,
  "concat()": (c, element) =>
    `export const A = ({ on }) => ${element(`className={["min-w-0"].concat(on ? ["${c}"] : []).join(" ")}`)};`,
  "helper spread argument": (c, element) =>
    `${kitImport("cn")} const extra = ["${c}"]; export const A = () => ${element(`className={cn("min-w-0", ...extra)}`)};`,
  "Object.values join": (c, element) =>
    `const parts = { a: "${c}" }; export const A = () => ${element(`className={Object.values(parts).join(" ")}`)};`,
  "hole with its own space": (c, element) =>
    `export const A = ({ on }) => ${element(`className={\`min-w-0\${on ? " ${c}" : ""}\`}`)};`,
  "immediately called function": (c, element) =>
    `export const A = () => ${element(`className={(() => "${c}")()}`)};`,
  "let assigned again": (c, element) =>
    `export const A = ({ on }) => { let k = "min-w-0"; if (on) k = "${c}"; return ${element("className={k}")}; };`,
  "let appended to": (c, element) =>
    `export const A = ({ on }) => { let k = "min-w-0"; if (on) k += " ${c}"; return ${element("className={k}")}; };`,
  "Object.freeze map": (c, element) =>
    `const tones = Object.freeze({ a: "${c}" }); export const A = ({ t }) => ${element("className={tones[t]}")};`,
  "map callback entry": (c, element) =>
    `const ROWS = [{ id: "a", cls: "${c}" }]; export const A = () => <>{ROWS.map((row) => ${element("className={row.cls}")})}</>;`,
  useCallback: (c, element) =>
    `import { useCallback } from "react"; export const A = () => { const k = useCallback(() => "${c}", []); return ${element("className={k()}")}; };`,
  "useState initial value": (c, element) =>
    `import { useState } from "react"; export const A = () => { const [k] = useState("${c}"); return ${element("className={k}")}; };`,
  "enum member": (c, element) =>
    `enum K { A = "${c}" } export const A = () => ${element("className={K.A}")};`,
  "default of a destructured parameter": (c, element) =>
    `export function A({ k } = { k: "${c}" }) { return ${element("className={k}")}; }`,
  "variant prefix": (c, element) => direct(`md:${c}`, element),
  "important modifier": (c, element) => direct(`${c}!`, element),
  "descendant variant": (c, element) => direct(`[&_svg]:${c}`, element),
};
/**
 * A class that never lands on the element: JSX keeps the className written last. A token rule still
 * reads it, since Tailwind generates it; a part rule, which judges what lands on its part, does not.
 */
const PART_SILENT_CARRIERS = {
  // The class written last is one no rule reports on any of the elements (`truncate` on a Text is
  // its maxLines, which no-restyle reports).
  "spread overridden by className": (c, element) =>
    `export const A = () => ${element(`{...{ className: "${c}" }} className="shrink-0"`)};`,
};

/**
 * Shapes that hold no class, where no token rule may report: data beside a class map's classes, a
 * classNames prefix, a data object's class, a tv config's names, a function named like a helper.
 */
const TOKEN_CONTROLS = {
  "tone word in a class map": {
    because: "a record's tone is data beside its classes",
    code: 'export const SEVERITY = { critical: { tone: "danger", dot: "bg-danger", text: "text-danger" }, high: { tone: "warning", dot: "bg-warning", text: "text-warning" } };',
  },
  "display keyword in a class list": {
    because: "a bare word no rule knows is data, not a class",
    code: 'export const DISPLAYS = ["block", "inline-block", "flex", "grid", "none"];',
  },
  "classNames prefix": {
    because: "react-transition-group's classNames is a prefix",
    code: 'export const A = ({ show }) => <CSSTransition in={show} classNames="fade" />;',
  },
  "OSCAL class": {
    because: "a data object's lowercase class is data",
    code: 'export const prop = { name: "label", class: "sp800-53a", value: "AC-1" };',
  },
  "tv config names": {
    because: "a tv config's keys are names, with or without a base",
    code: 'import { tv } from "tailwind-variants"; import { button } from "./button"; export const small = tv({ extend: button, defaultVariants: { size: "sm" } });',
  },
  "same-file cx": {
    because: "a chart's own cx is not the class helper",
    code: 'const cx = (key) => (key === "revenue" ? 10 : 20); export const Dot = () => <circle cx={cx("revenue")} />;',
  },
  "attribute names in a list": {
    because: "a list of HTML attribute names is data, though `hidden` is also a class",
    code: 'const reachability = ["disabled", "tabindex", "href", "contenteditable", "hidden"]; export const watched = reachability;',
  },
  "a word in a *Class attribute": {
    because: "a component's own *Class prop that holds a word no class is spelt like holds data",
    code: 'export const A = ({ level }) => <><Marker impactClass="high" /><Banner securityClass={level ? "secret" : "unclassified"} /><ScrollLink activeClass="active" to="top" /></>;',
  },
  "identifiers shaped like classes": {
    because:
      "a lone string shaped like an arbitrary value, alpha or a palette colour that Tailwind does not place is data",
    code: 'export const CATALOG = "sp-800-53/5"; export const REVISION = "rev-5/1"; export const SORT = "items-[0]"; export const COLOR = "status-red-500";',
  },
};

/** Shapes with no element of their own, or whose part rows already render the part in a prop. */
const TOKEN_CARRIERS = {
  "exported constant alone": (c) => `export const k = "${c}";`,
  "render prop": (c, element) =>
    `export const A = () => <Slot render={${element(`className="${c}"`)}} />;`,
  "slot map classNames": (c) =>
    `export const A = () => <DayPicker classNames={{ day: "${c}" }} />;`,
  "non-standard attribute": (c) => `export const A = () => <Widget containerClass="${c}" />;`,
};

/* ---------- parts: each rule's planted mistake, written against a tag ---------- */

/**
 * Rules that judge a kit part. A `policy` rule judges how the kit's own part is styled or set up,
 * so a part of that name from anywhere else is not its business: a local look-alike, another
 * package's part and a parameter that shadows the import leave it silent. A `behaviour` rule
 * judges a defect any part of that name has (focus, navigation, a pending flag, a renamed name),
 * so a look-alike and another package's part still report; only a shadowing parameter, which is
 * not a part at all, leaves it silent. `module` is where the kit's own source imports the part.
 */
const PART_RULES = {
  "cell-plain": {
    family: "policy",
    part: "Table",
    member: ".Cell",
    module: "../components/table",
    bad: (T) => `<${T} className="font-semibold">x</${T}>`,
  },
  "id-not-blue": {
    family: "policy",
    part: "Id",
    module: "../components/id",
    bad: (T) => `<${T} className="text-brand">X-1</${T}>`,
  },
  "button-icon-slot": {
    family: "policy",
    part: "Button",
    module: "../components/button",
    bad: (T) => `<${T}><Plus className="size-icon-small" />Add</${T}>`,
  },
  "use-primitives": {
    family: "policy",
    part: "Stack",
    module: "../primitives/stack",
    bad: (T) => `<${T} className="p-200">x</${T}>`,
  },
  "prefer-text-link": {
    family: "policy",
    part: "TextLink",
    module: "../components/text-link",
    bad: (T) => `<${T} href="/docs" target="_blank">Docs</${T}>`,
  },
  "product-line-tabs": {
    family: "policy",
    part: "TabsList",
    module: "../components/tabs",
    bad: (T) => `<${T} />`,
  },
  "product-responsive-table": {
    family: "policy",
    part: "DataTable",
    module: "./data-table",
    bad: (T) => `<${T} responsive={false} />`,
  },
  "overlay-width-preset": {
    family: "behaviour",
    part: "DialogContent",
    module: "../components/dialog",
    bad: (T) => `<${T} className="max-w-layout-measure" />`,
  },
  "no-overlay-autofocus": {
    family: "behaviour",
    part: "DialogContent",
    module: "../components/dialog",
    bad: (T) => `<${T}><input autoFocus /></${T}>`,
  },
  "no-disabled-while-loading": {
    family: "behaviour",
    part: "Button",
    module: "../components/button",
    bad: (T) => `<${T} isLoading={saving} disabled={saving}>Save</${T}>`,
  },
  "link-button-navigation": {
    family: "behaviour",
    part: "Button",
    module: "../components/button",
    bad: (T) => `<${T} render={<a href="/records" />}>Open</${T}>`,
  },
  "text-link-navigation": {
    family: "behaviour",
    part: "TextLink",
    module: "../components/text-link",
    bad: (T) => `<${T} render={<button />}>Open</${T}>`,
  },
  "dialog-footer-order": {
    family: "behaviour",
    part: "DialogFooter",
    module: "../components/dialog",
    bad: (T) =>
      `<${T}><Button variant="primary">Create task</Button><Button>Cancel</Button></${T}>`,
  },
  "no-deprecated-name": {
    family: "behaviour",
    part: "Shell",
    member: ".Sidebar",
    module: "../layout/shell",
    bad: (T) => `<${T} />`,
  },
  "readable-classes": {
    family: "policy",
    part: "Button",
    module: "../components/button",
    bad: (T) => `<${T} className={theme.cls}>Save</${T}>`,
  },
  "no-restyle": {
    family: "policy",
    part: "Text",
    module: "../primitives/text",
    bad: (T) => `<${T} className="tabular-nums">12</${T}>`,
  },
};

const lookAlike = ({ part, member }) =>
  member
    ? `const ${part} = { ${member.slice(1)}: (props) => <span {...props} /> };`
    : `const ${part} = (props) => <span {...props} />;`;
/**
 * The shapes a part arrives in. `silentFor` names the families that must not report it; `scope`
 * is where it is linted (the kit's rows run only for rules its preset turns on).
 */
const IDENTITY_CARRIERS = {
  "named import": {
    code: ({ part, member = "", bad }) =>
      `${kitImport(part)} export const A = () => ${bad(part + member)};`,
  },
  "aliased import": {
    code: ({ part, member = "", bad }) =>
      `import { ${part} as Kitted } from "@ledger/design-system"; export const A = () => ${bad(`Kitted${member}`)};`,
  },
  "namespace import": {
    code: ({ part, member = "", bad }) =>
      `import * as Kit from "@ledger/design-system"; export const A = () => ${bad(`Kit.${part}${member}`)};`,
  },
  "render prop target": {
    code: ({ part, member = "", bad }) =>
      `${kitImport(part)} export const A = () => <Slot render={${bad(part + member)}} />;`,
  },
  "forwarding wrapper": {
    code: ({ part, member = "", bad }) =>
      `${kitImport(part)} const Mine = (props) => <${part}${member} {...props} />; export const A = () => ${bad("Mine")};`,
  },
  "forwarding wrapper, props destructured in its body": {
    code: ({ part, member = "", bad }) =>
      `${kitImport(part)} function Mine(props) { const { ...rest } = props; return <${part}${member} {...rest} />; } export const A = () => ${bad("Mine")};`,
  },
  "forwarding wrapper that renders itself first": {
    code: ({ part, member = "", bad }) =>
      `${kitImport(part)} function Mine(props) { return props.depth ? <Mine {...props} depth={0} /> : <${part}${member} {...props} />; } export const A = () => ${bad("Mine")};`,
  },
  "local look-alike": {
    silentFor: ["policy"],
    because: "a local component of the same name is not the kit's part",
    code: (spec) =>
      `${lookAlike(spec)} export const A = () => ${spec.bad(spec.part + (spec.member ?? ""))};`,
  },
  "other package": {
    silentFor: ["policy"],
    because: "another package's part is not the kit's",
    code: ({ part, member = "", bad }) =>
      `import { ${part} } from "other-kit"; export const A = () => ${bad(part + member)};`,
  },
  "other package, aliased": {
    silentFor: ["policy"],
    because: "another package's part is not the kit's, whatever it is called here",
    code: ({ part, member = "", bad }) =>
      `import { ${part} as Other } from "other-kit"; export const A = () => ${bad(`Other${member}`)};`,
  },
  "other package, namespace": {
    silentFor: ["policy"],
    because: "another package's part is not the kit's",
    code: ({ part, member = "", bad }) =>
      `import * as Other from "other-kit"; export const A = () => ${bad(`Other.${part}${member}`)};`,
  },
  "type parameter of the name": {
    code: ({ part, member = "", bad }) =>
      `${kitImport(part)} export function A<${part}>() { return ${bad(part + member)}; }`,
  },
  "local type of the name": {
    code: ({ part, member = "", bad }) =>
      `${kitImport(part)} export function A() { type ${part} = number; return ${bad(part + member)}; }`,
  },
  "shadowing parameter": {
    silentFor: ["policy", "behaviour"],
    because: "a parameter that shadows the import is not a part at all",
    code: ({ part, member = "", bad }) =>
      `${kitImport(part)} export function A(${part}) { return ${bad(part + member)}; }`,
  },
  "kit relative import": {
    scope: "kit",
    code: ({ part, member = "", module, bad }) =>
      `import { ${part} } from "${module}"; export const A = () => ${bad(part + member)};`,
  },
  "kit aliased import": {
    scope: "kit",
    code: ({ part, member = "", module, bad }) =>
      `import { ${part} as Local } from "${module}"; export const A = () => ${bad(`Local${member}`)};`,
  },
};

/* ---------- readable classes: a value no class rule can read, on a kit part ---------- */

const onButton = (value) => `<Button className={${value}}>Save</Button>`;
const withButton = (code) => `${kitImport("Button", "cn")} ${code}`;
/** The shapes an unreadable className arrives in on a kit part, each one ledger/readable-classes
    reports. */
const READABLE_CARRIERS = {
  "another prop": withButton(`export const A = ({ cls }) => ${onButton("cls")};`),
  "a prop with a default": withButton(
    `export const A = ({ cls = "w-full" }) => ${onButton("cls")};`,
  ),
  "a prop in a helper": withButton(
    `export const A = ({ extra }) => ${onButton('cn("w-full", extra)')};`,
  ),
  "a prop in a template": withButton(`export const A = ({ w }) => ${onButton("`w-full ${w}`")};`),
  "a member of the props": withButton(`export const A = (props) => ${onButton("props.cls")};`),
  "a relative import": withButton(
    `import { k } from "./tones"; export const A = () => ${onButton("k")};`,
  ),
  "an alias import": withButton(
    `import { k } from "@/lib/tones"; export const A = () => ${onButton("k")};`,
  ),
  "an imported function": withButton(
    `import { toneOf } from "./tones"; export const A = ({ t }) => ${onButton("toneOf(t)")};`,
  ),
  "a call it cannot follow": withButton(
    `export const A = ({ row }) => ${onButton("row.classFor()")};`,
  ),
  "a className written again": withButton(
    `export function A({ className }) { className ??= "w-full"; return ${onButton("className")}; }`,
  ),
  "a missing member": withButton(
    `const tones = { a: "w-full" }; export const A = () => ${onButton("tones.b")};`,
  ),
  "an unreadable spread": withButton(
    `const tones = { ...shared, a: "w-full" }; export const A = () => ${onButton("tones.b")};`,
  ),
  "a render prop target": `${kitImport("DialogTrigger", "Button")} export const A = ({ cls }) => <DialogTrigger render={<Button />} className={cls} />;`,
  "a held import": withButton(
    `import { theme } from "./theme"; const t = theme; export const A = () => ${onButton("t.cls")};`,
  ),
  "another package's function given a prop": withButton(
    `import { join } from "lodash"; export const A = ({ cls }) => ${onButton('join(["w-full", cls], " ")')};`,
  ),
  "a memoised callback over a prop": withButton(
    `import { useCallback } from "react"; export function A({ cls }) { const f = useCallback((s) => (s.open ? cls : "w-full"), [cls]); return ${onButton("f")}; }`,
  ),
  "a className in a spread object": withButton(
    "export const A = ({ cls }) => <Button {...{ className: cls }}>Save</Button>;",
  ),
  "a slot map": `${kitImport("Calendar")} export const A = ({ cls }) => <Calendar classNames={{ day: cls }} />;`,
  "a class handed to a kit recipe": `${kitImport("PopoverTrigger", "buttonVariants")} export const A = ({ cls }) => <PopoverTrigger className={buttonVariants({ variant: "secondary", className: cls })} />;`,
  "a list changed in place": withButton(
    `const list = ["w-full"]; export function A({ cls }) { list.push(cls); return ${onButton('list.join(" ")')}; }`,
  ),
};
/** Shapes the lint reads, where ledger/readable-classes stays silent. */
const READABLE_CONTROLS = {
  "forwarded className": {
    because: "a received className is the caller's, read where the caller writes it",
    code: withButton(`export const A = ({ className }) => ${onButton('cn("w-full", className)')};`),
  },
  "className callback": {
    because: "a Base UI className callback's returns are its classes",
    code: withButton(
      `export const A = () => ${onButton('(s) => (s.open ? "w-full" : undefined)')};`,
    ),
  },
  "map keyed by a prop": {
    because: "a same-file map read by a typed prop reads every entry",
    code: withButton(
      `const place = { a: "self-start", b: "self-end" }; export const A = ({ at }) => ${onButton("place[at]")};`,
    ),
  },
  "same-file function": {
    because: "a same-file function's returns are read, with its call's arguments",
    code: withButton(
      `const place = (last) => (last ? "self-end" : "self-start"); export const A = ({ last }) => ${onButton("place(last)")};`,
    ),
  },
  "cva recipe": {
    because: "a recipe's classes are read where it is written",
    code: withButton(
      `import { cva } from "class-variance-authority"; const r = cva("self-start"); export const A = () => ${onButton("r()")};`,
    ),
  },
  "kit style function": {
    because: "the kit's own classes are read where the kit declares them",
    code: `${kitImport("PopoverTrigger", "buttonVariants")} export const A = () => <PopoverTrigger className={buttonVariants({ variant: "secondary" })} />;`,
  },
  "another package's classes": {
    because: "another package's classes are not Ledger's vocabulary",
    code: withButton(
      `import { getDefaultClassNames } from "react-day-picker"; export const A = () => ${onButton('cn("p-0", getDefaultClassNames().day_button)')};`,
    ),
  },
  "another package's classes held in a const": {
    because: "an import held in a const is still that import",
    code: withButton(
      `import { getDefaultClassNames } from "react-day-picker"; export function A() { const base = getDefaultClassNames(); return ${onButton('cn("p-0", base.day_button)')}; }`,
    ),
  },
  "forwarded className callback": {
    because: "a received className is the caller's, a Base UI callback too",
    code: withButton(
      `export const A = ({ className }) => ${onButton('(state) => cn("relative", typeof className === "function" ? className(state) : className)')};`,
    ),
  },
  "a helper's omitted argument": {
    because: "an argument the call leaves out, with no default, is undefined",
    code: withButton(
      `function cls(extra) { return cn("w-full", extra); } export const A = () => ${onButton("cls()")};`,
    ),
  },
  "joined class": {
    because: "a class glued together at runtime is no-non-token-class's",
    code: withButton(`export const A = ({ tone }) => ${onButton('["bg-", tone].join("")')};`),
  },
  "plain element": {
    because: "a plain element is no kit part",
    code: "export const A = ({ cls }) => <div className={cls} />;",
  },
  "glued template": {
    because: "a class built at runtime is no-non-token-class's",
    code: withButton(`export const A = ({ tone }) => ${onButton("`bg-${tone}-500`")};`),
  },
};

/* ---------- style: a literal width or colour, however it reaches style ---------- */

const STYLE_CARRIERS = {
  "inline object": "export const A = () => <div style={{ width: 240 }} />;",
  "const object": "const s = { width: 240 }; export const A = () => <div style={s} />;",
  "let object": "let s = { width: 240 }; export const A = () => <div style={s} />;",
  "imported object": 'import { s } from "./s"; export const A = () => <div style={s} />;',
  conditional: "export const A = ({ on }) => <div style={on ? { width: 240 } : undefined} />;",
  "member lookup":
    "const styles = { card: { width: 240 } }; export const A = () => <div style={styles.card} />;",
  "helper function":
    "const f = () => ({ width: 240 }); export const A = () => <div style={f()} />;",
  "spread of a const": "const s = { width: 240 }; export const A = () => <div style={{ ...s }} />;",
  "const in a ternary branch":
    "const px = 240; export const A = ({ on }) => <div style={{ width: on ? px : 0 }} />;",
  "custom property with a raw colour":
    'export const A = () => <div style={{ ["--accent" as string]: "#ec4899" }} />;',
  "named colour": 'export const A = () => <div style={{ color: "tomato" }} />;',
  "<style> element": 'export const A = () => <style>{".x { color: red }"}</style>;',
  "style callback":
    "const s = { width: 240 }; export const A = ({ style }) => <div style={(state) => ({ ...s, ...style })} />;",
  "named number in arithmetic":
    "const GAP = 240; export const A = ({ offset }) => <div style={{ width: offset + GAP }} />;",
  "number before a unit in a template":
    "const W = 240; export const A = () => <div style={{ width: `${W}px` }} />;",
  concatenation:
    'const GUTTER = "240px"; export const A = () => <div style={{ width: "calc(100% - " + GUTTER + ")" }} />;',
  "helper argument":
    "const box = (w) => ({ width: w }); export const A = () => <div style={box(240)} />;",
  "Object.assign":
    "const s = { width: 240 }; export const A = ({ style }) => <div style={Object.assign({}, s, style)} />;",
  "memoised style callback":
    'import { useCallback } from "react"; export function A() { const s = useCallback(() => ({ width: 240 }), []); return <div style={s} />; }',
  "var() fallback": 'export const A = () => <div style={{ width: "var(--w, 240px)" }} />;',
  "logical border shorthand":
    'export const A = () => <div style={{ borderInlineStart: "3px solid #ec4899" }} />;',
  "custom property length":
    'export const A = () => <div style={{ ["--w" as string]: "240px" }} />;',
  "a part's own size": `${kitImport("token")} export const A = () => <div style={{ width: token("dimension.part.popover") }} />;`,
  "props spread": "const p = { style: { width: 240 } }; export const A = () => <div {...p} />;",
  "typed module const":
    'import type { CSSProperties } from "react"; export const s: CSSProperties = { width: 240 };',
};

/* ---------- colour: a literal colour in an SVG or chart attribute, however it gets there ---------- */

const COLOUR_CARRIERS = {
  "SVG fill attribute": 'export const A = () => <svg fill="#ec4899" />;',
  conditional: 'export const A = ({ on }) => <rect fill={on ? "#ec4899" : "currentColor"} />;',
  const: 'const c = "#ec4899"; export const A = () => <rect fill={c} />;',
  "member lookup":
    'const tones = { pink: "#ec4899" }; export const A = () => <rect fill={tones.pink} />;',
  "helper function": 'const f = () => "#ec4899"; export const A = () => <rect fill={f()} />;',
  "named colour": 'export const A = () => <path stroke="tomato" />;',
  "imported constant": 'import { c } from "./c"; export const A = () => <rect fill={c} />;',
  "recharts part":
    'import { Bar } from "recharts"; export const A = () => <Bar dataKey="v" fill="#ec4899" />;',
  "recharts object prop":
    'import { Line } from "recharts"; export const A = () => <Line dataKey="v" activeDot={{ fill: "#ec4899" }} />;',
  "colour list":
    'const COLORS = ["#ec4899", "#0088fe"]; export const A = ({ i }) => <rect fill={COLORS[i]} />;',
  "recharts data entry":
    'import { Pie } from "recharts"; export const A = () => <Pie dataKey="v" data={[{ v: 1, fill: "#ec4899" }]} />;',
  "var() fallback": 'export const A = () => <rect fill="var(--c, #ec4899)" />;',
  concatenation: 'export const A = ({ alpha }) => <rect fill={"#ec4899" + alpha} />;',
  "helper argument":
    'const paint = (c) => c; export const A = () => <rect fill={paint("#ec4899")} />;',
};

/* ---------- directives: a comment that turns the rule off around its mistake ---------- */

/**
 * no-inline-config reports what it can see. A line disable that says why, a disable that names no
 * rule, and a comment that turns no-inline-config off with the rule are silent to the lint by
 * design: scripts/check-allow-lists.mjs counts them instead, per file in src and the kit's src,
 * and the counts only shrink. `counted` reads a cell's comments as that script does.
 */
const DIRECTIVE_CARRIERS = {
  "configuration comment": (rule, code) => `/* eslint ${rule}: "off" */\n${code}`,
  "configuration comment at warn": (rule, code) => `/* eslint ${rule}: "warn" */\n${code}`,
  "block disable": (rule, code) => `/* eslint-disable ${rule} */\n${code}`,
  "block disable with a reason": (rule, code) =>
    `/* eslint-disable ${rule} -- The screen predates the rule. */\n${code}`,
  "next-line disable": (rule, code) => `// eslint-disable-next-line ${rule}\n${code}`,
  "next-line disable with a reason": (rule, code) =>
    `// eslint-disable-next-line ${rule} -- The screen predates the rule.\n${code}`,
  "line disable": (rule, code) => `${code} // eslint-disable-line ${rule}`,
  "line disable with a reason": (rule, code) =>
    `${code} // eslint-disable-line ${rule} -- The screen predates the rule.`,
  "bare block disable": (_rule, code) => `/* eslint-disable */\n${code}`,
  "bare next-line disable": (_rule, code) => `// eslint-disable-next-line\n${code}`,
  // A list of only commas or empty quotes names no rule, so ESLint turns every rule off.
  "next-line disable of an empty list": (_rule, code) => `// eslint-disable-next-line ,\n${code}`,
  "block disable of an empty name": (_rule, code) => `/* eslint-disable "" */\n${code}`,
  // ESLint decodes a configuration key before it looks the rule up.
  "configuration comment with an escaped key": (rule, code) =>
    `/* eslint "${rule.replace("/", "\\u002f")}": "off" */\n${code}`,
  "configuration comment with an escaped slash": (rule, code) =>
    `/* eslint "${rule.replace("/", "\\/")}": "off" */\n${code}`,
  "disable of no-inline-config too": (rule, code) =>
    `/* eslint-disable ledger/no-inline-config, ${rule} */\n${code}`,
  "configuration of no-inline-config too": (rule, code) =>
    `/* eslint ledger/no-inline-config: "off", ${rule}: "off" */\n${code}`,
};
function counted(comments, rule) {
  return comments.some((comment) => {
    const directive = readDirective(comment);
    if (!directive) return false;
    if (namesNoRule(directive)) return true;
    return ledgerRules(directive).some(({ name }) => name === rule);
  });
}

/* ---------- escape checks: routes around every rule at once ---------- */

const require = createRequire(import.meta.url);
const eslintBin = path.join(path.dirname(require.resolve("eslint/package.json")), "bin/eslint.js");
const checkAllowLists = path.join(here, "../../../scripts/check-allow-lists.mjs");

/**
 * ESLint's CLI applies an eslint-suppressions.json in the directory it runs in by itself, so a
 * ledger rule named there is silent where the lint cannot see it. check-allow-lists refuses one at
 * the root, and any that names a ledger rule. Both run in an empty directory holding a root file
 * and a kit file that each suppress a margin.
 */
function suppressionsFiles() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-redteam-"));
  try {
    const plugin = pathToFileURL(path.join(here, "../eslint-plugin/index.js")).href;
    fs.writeFileSync(
      path.join(directory, "eslint.config.mjs"),
      `import ledger from ${JSON.stringify(plugin)};\nexport default [{ files: ["**/*.jsx"], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } }, ...ledger.configs.recommended.map((entry) => ({ files: ["**/*.jsx"], ...entry }))];\n`,
    );
    fs.writeFileSync(
      path.join(directory, "screen.jsx"),
      'export const A = () => <div className="mt-200" />;\n',
    );
    const suppressed = JSON.stringify({ "screen.jsx": { "ledger/no-margin": { count: 1 } } });
    fs.mkdirSync(path.join(directory, "packages/design-system"), { recursive: true });
    fs.writeFileSync(path.join(directory, "eslint-suppressions.json"), suppressed);
    fs.writeFileSync(
      path.join(directory, "packages/design-system/eslint-suppressions.json"),
      suppressed,
    );
    const node = (...args) =>
      spawnSync(process.execPath, args, {
        cwd: directory,
        encoding: "utf8",
        // Nothing above the directory is a repository, so check-allow-lists reads no base.
        env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(directory) },
      });
    const eslint = node(eslintBin, "--format", "json", "screen.jsx");
    const [result] = JSON.parse(eslint.stdout);
    const seen = errors(result.messages).length > 0;
    const guard = node(checkAllowLists);
    const refused = (file) =>
      guard.status !== 0 && new RegExp(`^${file.replaceAll(".", "\\.")}: `, "m").test(guard.stderr);
    return {
      "root suppressions file": seen || refused("eslint-suppressions.json"),
      "kit suppressions file": seen || refused("packages/design-system/eslint-suppressions.json"),
    };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

let suppressions;
/** Each check says whether the route is caught. */
const ESCAPE_CHECKS = {
  // A variant that reaches into the children restyles parts the screen does not own, with classes
  // every token rule admits (no-restyle, batch 8).
  "descendant restyle": () =>
    errors(
      lint(
        `${kitImport("Button")} export const A = () => <div className="[&_button]:bg-danger-bold *:p-200"><Button>Save</Button></div>;`,
        "product",
      ).messages,
    ).length > 0,
  "root suppressions file": () => (suppressions ??= suppressionsFiles())["root suppressions file"],
  "kit suppressions file": () => (suppressions ??= suppressionsFiles())["kit suppressions file"],
};

/** Rules the matrix leaves out: none reads a class, a style or a kit part. */
const OUTSIDE = {
  "no-colgroup": "judges a native tag, which reaches it one way",
  "no-kit-shadow": "judges what a declaration is named",
  "no-native-confirm": "judges a call",
  "no-plain-alert-role": "judges a role on a native element",
  "no-inline-config": "judges comments, and is what catches the directive rows",
};

/* ---------- the cells ---------- */

/** Every cell: its section, list key, carrier, scope, what should happen and its code. */
function buildCells() {
  const cells = [];
  const add = (cell) => cells.push({ scope: "product", expect: "report", ...cell });
  const baseline = new Map();
  for (const [rule, spec] of Object.entries({ ...TOKEN_RULES, ...CLASS_PART_RULES })) {
    const token = rule in TOKEN_RULES;
    const carriers = token
      ? { ...CLASS_CARRIERS, ...PART_SILENT_CARRIERS, ...TOKEN_CARRIERS }
      : { ...CLASS_CARRIERS, ...PART_SILENT_CARRIERS };
    for (const [carrier, build] of Object.entries(carriers)) {
      const code = [spec.imports, build(spec.planted, spec.element)].filter(Boolean).join(" ");
      if (carrier === "direct attribute") baseline.set(rule, code);
      const silent =
        spec.allows?.[carrier] ??
        (!token &&
          carrier in PART_SILENT_CARRIERS &&
          "a class that never lands on the part is not the part's");
      add({
        section: "classes",
        rule,
        carrier,
        code,
        expect: silent ? "silent" : "report",
        because: silent || undefined,
        // A token rule quotes the class it reports, so a report must name the planted one.
        planted: token && spec.planted.split(":").at(-1),
      });
    }
    if (token)
      for (const [carrier, { code, because }] of Object.entries(TOKEN_CONTROLS))
        add({ section: "classes", rule, carrier, code, expect: "silent", because });
  }
  for (const [rule, spec] of Object.entries(PART_RULES))
    for (const [carrier, { code, silentFor = [], because, scope = "product" }] of Object.entries(
      IDENTITY_CARRIERS,
    )) {
      if (scope === "kit" && !kitRules[`ledger/${rule}`]) continue;
      const source = code(spec);
      if (carrier === "named import" && !baseline.has(rule)) baseline.set(rule, source);
      add({
        section: "parts",
        rule,
        carrier,
        scope,
        code: source,
        expect: silentFor.includes(spec.family) ? "silent" : "report",
        because,
      });
    }
  for (const [carrier, code] of Object.entries(READABLE_CARRIERS))
    add({ section: "readable", rule: "readable-classes", carrier, code });
  for (const [carrier, { code, because }] of Object.entries(READABLE_CONTROLS))
    add({
      section: "readable",
      rule: "readable-classes",
      carrier,
      code,
      expect: "silent",
      because,
    });
  for (const [carrier, code] of Object.entries(STYLE_CARRIERS)) {
    if (carrier === "inline object") baseline.set("no-style-design-value", code);
    add({ section: "style", rule: "no-style-design-value", carrier, code });
  }
  for (const [carrier, code] of Object.entries(COLOUR_CARRIERS)) {
    if (carrier === "SVG fill attribute") baseline.set("no-raw-colour", code);
    add({ section: "colour", rule: "no-raw-colour", carrier, code });
  }
  for (const [rule, code] of baseline)
    for (const [carrier, build] of Object.entries(DIRECTIVE_CARRIERS))
      add({ section: "directives", rule, carrier, code: build(`ledger/${rule}`, code) });
  for (const carrier of Object.keys(ESCAPE_CHECKS)) add({ section: "escape checks", carrier });
  return cells;
}

/** Whether a cell escapes, and any report of a class it did not plant. */
function verdict(cell) {
  if (cell.section === "escape checks")
    return { escaped: !ESCAPE_CHECKS[cell.carrier](), stray: [] };
  const rule = `ledger/${cell.rule}`;
  const { messages, comments } = lint(cell.code, cell.scope);
  const own = errors(messages, rule);
  const stray = cell.planted
    ? own.filter((message) => !message.message.includes(cell.planted)).map((m) => m.message)
    : [];
  if (cell.section === "directives") {
    const seen = own.length > 0 || errors(messages, "ledger/no-inline-config").length > 0;
    return { escaped: !seen && !counted(comments, rule), stray };
  }
  return { escaped: cell.expect === "report" ? own.length === 0 : own.length > 0, stray };
}

const keyOf = (cell) =>
  cell.section === "escape checks" ? "escape checks" : `ledger/${cell.rule}`;
const cells = buildCells();
const results = new Map(cells.map((cell) => [cell, verdict(cell)]));

if (process.env.REDTEAM_UPDATE) {
  const escapes = {};
  for (const cell of [...cells].sort((a, b) => keyOf(a).localeCompare(keyOf(b))))
    if (results.get(cell).escaped) (escapes[keyOf(cell)] ??= {})[cell.carrier] = 1;
  const keys = Object.keys(escapes).sort((a, b) =>
    a === "escape checks" ? 1 : b === "escape checks" ? -1 : a.localeCompare(b),
  );
  fs.writeFileSync(
    ESCAPES,
    `${JSON.stringify({ about: ABOUT, ...Object.fromEntries(keys.map((key) => [key, escapes[key]])) }, null, 2)}\n`,
  );
}
const listed = JSON.parse(fs.readFileSync(ESCAPES, "utf8"));

const LAND =
  "Only a rule that lands in the same change lists its escapes (REDTEAM_UPDATE=1); otherwise the list only shrinks.";
/** What is wrong with one section's cells, one line each. */
function problems(section) {
  const out = [];
  for (const cell of cells.filter((candidate) => candidate.section === section)) {
    const { escaped, stray } = results.get(cell);
    const key = keyOf(cell);
    const check = cell.section === "escape checks";
    const isListed = listed[key]?.[cell.carrier] === 1;
    for (const message of stray)
      out.push(`${key} reports a class "${cell.carrier}" did not plant: ${message}`);
    if (escaped && !isListed)
      out.push(
        check
          ? `No ledger rule and no count catches "${cell.carrier}". Close the route: lint-redteam-escapes.json only shrinks.`
          : cell.expect === "silent"
            ? `${key} reports "${cell.carrier}", which it should leave alone: ${cell.because}. Narrow the rule. ${LAND}`
            : `${key} misses the mistake planted through "${cell.carrier}". Make the rule reach it. ${LAND}`,
      );
    if (!escaped && isListed)
      out.push(
        `${check ? `"${cell.carrier}" is now caught` : `${key} now ${cell.expect === "silent" ? "leaves" : "catches"} "${cell.carrier}"`}. Delete that entry from test/lint-redteam-escapes.json: escapes only shrink.`,
      );
  }
  return out;
}

/* ---------- tests ---------- */

test("the matrix takes in every ledger rule that reads classes, style or kit parts", () => {
  const covered = new Set(cells.map((cell) => cell.rule).filter(Boolean));
  for (const rule of Object.keys(ledger.rules)) {
    const outside = Object.hasOwn(OUTSIDE, rule);
    if (covered.has(rule)) assert.ok(!outside, `ledger/${rule} is in the matrix and in OUTSIDE`);
    else
      assert.ok(
        outside,
        `ledger/${rule} is not in the matrix: give it a planted mistake, or say in OUTSIDE why no carrier reaches it`,
      );
  }
  for (const rule of Object.keys(OUTSIDE)) assert.ok(rule in ledger.rules, `${rule} is a rule`);
});

test("a class reaches every rule that reads it, whatever carries it, or the escape is listed", () => {
  assert.deepEqual(problems("classes"), []);
});

test("a kit part is judged however it is imported, and a look-alike as its rule's family says", () => {
  assert.deepEqual(problems("parts"), []);
});

test("an unreadable className on a kit part is reported however it arrives, and a readable one is not", () => {
  assert.deepEqual(problems("readable"), []);
});

test("a literal in style reaches no-style-design-value however it gets there, or is listed", () => {
  assert.deepEqual(problems("style"), []);
});

test("a literal colour reaches no-raw-colour however it gets there, or is listed", () => {
  assert.deepEqual(problems("colour"), []);
});

test("a comment that turns a rule off is reported, or counted by check-allow-lists", () => {
  assert.deepEqual(problems("directives"), []);
});

test("a descendant restyle and a suppressions file are caught, or listed", () => {
  assert.deepEqual(problems("escape checks"), []);
});

test("the escapes list names only cells the matrix runs, once each", () => {
  const ran = new Set(cells.map((cell) => `${keyOf(cell)} › ${cell.carrier}`));
  assert.equal(ran.size, cells.length, "every carrier name is unique under its rule");
  for (const [key, carriers] of Object.entries(listed)) {
    if (key === "about") continue;
    for (const [carrier, value] of Object.entries(carriers)) {
      assert.ok(ran.has(`${key} › ${carrier}`), `${key} › ${carrier} is not a cell of the matrix`);
      assert.equal(value, 1, `${key} › ${carrier}`);
    }
  }
});
