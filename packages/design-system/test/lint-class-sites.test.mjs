// The class reader (eslint-plugin/class-sites.js) and the value resolver under it
// (eslint-plugin/values.js): shadcn's value-resolution cases ported to Ledger's vocabulary, what
// each resolver function answers and what it cannot read, the sites a file holds, the per-file
// cache, and the kit's own helpers in package mode.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";

import ledger from "../eslint-plugin/index.js";
import { builtClass, classSites } from "../eslint-plugin/class-sites.js";
import {
  entriesOf,
  leaves,
  memberValues,
  objectsOf,
  patternSteps,
  returnsOf,
  unwrap,
} from "../eslint-plugin/values.js";
import { KIT, KIT_SETTINGS, PRODUCT, REPO } from "./lint-helpers.mjs";

const languageOptions = { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } };

/** Runs `create(context)` as a rule over `code`, and ESLint's other rules as `rules` says. */
function run(code, create, { rules = {}, settings, filename = PRODUCT } = {}) {
  const probe = { rules: { probe: { meta: { schema: [] }, create } } };
  return new Linter({ cwd: REPO }).verify(
    code,
    [
      {
        files: ["**/*.{ts,tsx}"],
        languageOptions,
        plugins: { probe, ledger },
        rules: { "probe/probe": "error", ...rules },
        ...(settings ? { settings } : {}),
      },
    ],
    { filename },
  );
}

/** Every site of a file, as the reader hands them to a rule. */
function sitesOf(code, options) {
  const sites = [];
  run(code, (context) => classSites(context).visitors((site) => sites.push(site)), options);
  return sites;
}

/** The token rules' findings, as `messageId:class`. */
const TOKEN_RULES = { "ledger/no-non-token-class": "error", "ledger/no-arbitrary-value": "error" };
function findings(code, options = {}) {
  return run(code, () => ({}), { rules: TOKEN_RULES, ...options })
    .filter(({ ruleId }) => ruleId?.startsWith("ledger/"))
    .map(({ message, ruleId }) => {
      const quoted = message.match(/^"([^"]+)"/)?.[1];
      return `${ruleId.slice(7)}${/builds a class name at runtime/.test(message) ? ".runtime" : ""}:${quoted}`;
    });
}

/* ---------- shadcn's resolution cases, ported ---------- */

// From @shadcn/lint's class-value-resolution, destructured-initializers and value-resolution
// tests, rewritten for Ledger (docs/examples/lint-hardening-2026-09-28/harvest-sites/
// ported-cases.mjs). `reports` are the token rules' findings; `unread` the reasons the reader gives
// for the className on <Button>, which ledger/readable-classes reports.
const H = 'import { Button, cn } from "@ledger/design-system";\n';
const PORTED = [
  [
    "defaults are authored",
    'function Save({ className = "bg-red-500" }) { return <Button className={className} /> }',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "defaults are authored",
    'function Save({ className: cls = "bg-red-500" }) { return <Button className={cls} /> }',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "defaults are authored",
    'function Save(props = { className: "bg-red-500" }) { return <Button className={props.className} /> }',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "defaults are authored",
    'function Save({ className } = { className: "bg-red-500" }) { return <Button className={className} /> }',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "a write revokes forwarding",
    'function Save({ className }) { className ??= "bg-red-500"; return <Button className={className} /> }',
    { unread: ["reassigned"] },
  ],
  [
    "a write revokes forwarding",
    'function Save({ className: cls }) { cls = "bg-red-500"; return <Button className={cls} /> }',
    { unread: ["reassigned"] },
  ],
  [
    "a write revokes forwarding",
    'function Save(props) { props.className = "bg-red-500"; return <Button className={props.className} /> }',
    // The class written in place is read where it is written, as a DOM element's would be.
    { reports: ["no-non-token-class:bg-red-500"], unread: ["reassigned"] },
  ],
  [
    "a write revokes forwarding",
    'function Save(props) { Object.assign(props, { className: "bg-red-500" }); return <Button className={props.className} /> }',
    { reports: ["no-non-token-class:bg-red-500"], unread: ["reassigned"] },
  ],
  [
    "untouched forwarding is clean",
    "function Save({ className }) { return <Button className={className} /> }",
    {},
  ],
  [
    "untouched forwarding is clean",
    "function Save({ className: cls }) { return <Button className={cls} /> }",
    {},
  ],
  [
    "untouched forwarding is clean",
    "function Save(props) { return <Button className={props.className} {...props} /> }",
    {},
  ],
  [
    "untouched forwarding is clean",
    'function Save({ className = "w-full" }) { return <Button className={cn("flex", className)} /> }',
    {},
  ],
  [
    "another prop is not className",
    "function Save({ tone }) { return <Button className={tone} /> }",
    { unread: ["prop"] },
  ],
  [
    "a mutated object is unreadable",
    'const theme = { className: "w-full" }; theme.className = "bg-red-500"; export const A = () => <Button className={theme.className} />',
    { reports: ["no-non-token-class:bg-red-500"], unread: ["reassigned"] },
  ],
  [
    "an imported member is unreadable",
    'import { theme } from "./theme"; export const A = () => <Button className={theme.className} />',
    { unread: ["imported"] },
  ],
  [
    "a glued number is one runtime value",
    "const n = 8; export const A = () => <Button className={`p-${n}`} />",
    { reports: ["no-non-token-class.runtime:p-${n}"], unread: ["glued-template"] },
  ],
  [
    "the last write wins over a spread",
    'const base = { className: "w-full" }; export const A = () => <Button {...{ ...base, className: "bg-red-500" }} />',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "a computed static key",
    'export const A = () => <Button {...{ ["className"]: "bg-red-500" }} />',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "a destructured slot only",
    'export function A({ ok }) { const [dot, text, cls] = ok ? ["var(--ok)", "Connected", "items-center"] : ["var(--muted)", "Needs setup", "items-start"]; return <span className={cls}>{text}</span> }',
    {},
  ],
  [
    "a destructured slot only",
    'export function A({ ok }) { const { Icon, colorCls } = ok ? { Icon: "x", colorCls: "flex" } : { Icon: "y", colorCls: "grid" }; return <span className={colorCls} title={Icon} /> }',
    {},
  ],
  [
    "a destructured slot's mistake is found",
    'export function A({ ok }) { const [dot, label, cls] = ok ? ["var(--ok)", "Connected", "p-[13px]"] : ["var(--muted)", "Needs setup", "flex"]; return <span className={cls}>{label}</span> }',
    { reports: ["no-arbitrary-value:p-[13px]"] },
  ],
  [
    "a rest is not its siblings",
    'export function A({ more }) { const [label, ...rest] = ["Label", "flex"]; return <span className={rest[0]}>{label}</span> }',
    {},
  ],
  [
    "a dynamic key reads every value",
    'const tones = { a: "bg-red-500", b: "flex" }; export const A = ({ t }) => <Button className={tones[t]} />',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "a nested map, dynamic then static",
    'const tones = { a: { fill: "bg-red-500" }, b: { fill: "flex" } }; export const A = ({ t }) => <div className={cn(tones[t].fill)} />',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "a same-file tone function",
    'const tone = (on) => (on ? "bg-red-500" : "flex"); export const A = ({ on }) => <div className={cn("grid", tone(on))} />',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "an array join",
    'const control = ["flex", "bg-red-500"].join(" "); export const A = () => <Button className={control} />',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "a glued template leaves no fragment",
    "export const A = ({ t }) => <div className={`bg-${t} flex`} />",
    { reports: ["no-non-token-class.runtime:bg-${t}"] },
  ],
  [
    "tv config values, not keys",
    'import { tv } from "tailwind-variants"; export const box = tv({ base: "flex", variants: { size: { sm: "gap-100" } }, responsiveVariants: ["sm", "md"], defaultVariants: { size: "sm" } })',
    {},
  ],
  [
    "a slot map through a const",
    'const slots = { root: "bg-red-500" }; export const A = () => <div classNames={slots} />',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "nested slot map values",
    'export const A = () => <div classNames={{ root: { inner: "bg-red-500" } }} />',
    { reports: ["no-non-token-class:bg-red-500"] },
  ],
  [
    "OSCAL class data is not a class",
    'export const control = { id: "ac-1", class: "SP800-53", title: "Access Control" };',
    {},
  ],
];

test("shadcn's 31 resolution cases read as Ledger reads them", () => {
  assert.equal(PORTED.length, 31);
  const problems = [];
  for (const [group, body, { reports = [], unread = [] }] of PORTED) {
    const code = H + body;
    const got = findings(code).sort();
    if (JSON.stringify(got) !== JSON.stringify([...reports].sort()))
      problems.push(
        `[${group}] reports ${JSON.stringify(got)}, not ${JSON.stringify(reports)}: ${body}`,
      );
    const reasons = sitesOf(code)
      .filter(({ origin, element }) => origin === "attribute" && element?.name.name === "Button")
      .flatMap(({ unresolved }) => unresolved.map(({ reason }) => reason));
    if (JSON.stringify(reasons) !== JSON.stringify(unread))
      problems.push(
        `[${group}] leaves ${JSON.stringify(reasons)} unread, not ${JSON.stringify(unread)}: ${body}`,
      );
  }
  assert.deepEqual(problems, []);
});

/* ---------- values.js ---------- */

/** Runs `ask(context, value)` on the value of every `style` attribute, whose reading hands the
    value to nothing (so it never counts as an escape). */
function ask(code, question) {
  const answers = [];
  run(code, (context) => ({
    JSXAttribute(node) {
      if (node.name.name === "style") answers.push(question(context, unwrap(node.value)));
    },
  }));
  return answers;
}
const unreadable = (list) => (item) => list.push(item.reason);

test("objectsOf follows a member into a map, and a written object is unreadable", () => {
  const [[inner]] = ask(
    "const styles = { box: { padding: 16 } }; export const A = () => <div style={styles.box} />;",
    (context, value) => objectsOf(context, value),
  );
  assert.equal(inner.properties[0].key.name, "padding");
  for (const mode of ["vocabulary", "contextual"]) {
    const reasons = [];
    const [found] = ask(
      "const s = { width: 1 }; mutate(s); s.width = el.offsetWidth; export const A = () => <div style={s} />;",
      (context, value) => objectsOf(context, value, { mode, onUnreadable: unreadable(reasons) }),
    );
    assert.deepEqual([found, reasons], [[], ["reassigned"]], mode);
  }
});

test("an object handed to a call is read for its vocabulary, and unreadable in context", () => {
  const code = "const s = { width: 1 }; mutate(s); export const A = () => <div style={s} />;";
  assert.equal(ask(code, (context, value) => objectsOf(context, value))[0].length, 1);
  const reasons = [];
  const [found] = ask(code, (context, value) =>
    objectsOf(context, value, { mode: "contextual", onUnreadable: unreadable(reasons) }),
  );
  assert.deepEqual([found, reasons], [[], ["escaped"]]);
});

test("leaves reads a const to its literal; a variable written again gives every value in vocabulary, none in context", () => {
  const [[width]] = ask(
    "const W = 288;\nexport const A = () => <div style={W} />;",
    (context, value) => leaves(context, value),
  );
  assert.deepEqual([width.value, width.loc.start.line], [288, 1]);
  const code =
    'let w = 1; if (wide) w = 2; w ??= measure(); w += " 3"; w += "4"; export const A = () => <div style={w} />;';
  const read = (mode) => {
    const reasons = [];
    const [found] = ask(code, (context, value) =>
      leaves(context, value, { mode, onUnreadable: unreadable(reasons) }),
    );
    return [found.map((leaf) => leaf.value), reasons];
  };
  // The appended " 3" starts with whitespace, so it is a value of its own; "4" glues to the value
  // before it, which no expression states.
  assert.deepEqual(read("vocabulary"), [
    [1, 2, " 3"],
    ["call", "reassigned"],
  ]);
  assert.deepEqual(read("contextual"), [[], ["reassigned"]]);
  // A write the file does not state as a value (a counter, a member write) leaves it unreadable.
  for (const written of [
    "let w = 1; w++;",
    "let w = { a: 1 }; w.a = 2;",
    "let w = 1; [w] = list;",
  ]) {
    const reasons = [];
    const [found] = ask(`${written} export const A = () => <div style={w} />;`, (context, value) =>
      leaves(context, value, { onUnreadable: unreadable(reasons) }),
    );
    assert.deepEqual([found, reasons], [[], ["reassigned"]], written);
  }
});

test("the walk reads Object.freeze, an enum, useState, useCallback and a callback's list element", () => {
  // Every style attribute's leaves, in order.
  const values = (code, mode) =>
    ask(code, (context, value) =>
      leaves(context, value, { mode }).map((leaf) => leaf.value),
    ).flat();
  assert.deepEqual(
    values(
      'const m = Object.freeze({ a: "x", b: "y" }); export const A = ({ k }) => <i style={m[k]} />;',
    ),
    ["x", "y"],
  );
  assert.deepEqual(
    values(
      'enum Pad { Big = "x", Small = "y", Plain } export const A = () => <i style={Pad.Small} />;',
    ),
    ["y"],
  );
  assert.deepEqual(
    values(
      'import { useState } from "react"; export const A = () => { const [a] = useState("x"); const [b] = useState(() => "y"); return <><i style={a} /><i style={b} /></>; };',
    ),
    ["x", "y"],
  );
  assert.deepEqual(
    values(
      'import { useCallback } from "react"; export const A = ({ on }) => { const get = useCallback((x) => (x ? "x" : "y"), []); return <i style={get(on)} />; };',
    ),
    ["x", "y"],
  );
  const tabs =
    'const TABS = [{ id: "a", pad: "x" }, { id: "b", pad: "y" }]; export const A = () => TABS.map((tab) => <i key={tab.id} style={tab.pad} />);';
  assert.deepEqual(values(tabs), ["x", "y"]);
  // In context a callback's element is one of many, so it stays a parameter.
  assert.deepEqual(values(tabs, "contextual"), []);
  assert.deepEqual(
    values(
      'const TABS = { a: { pad: "x" } }; export const A = () => Object.values(TABS).map(({ pad }) => <i style={pad} />);',
    ),
    ["x"],
  );
  // A destructured parameter's default written above its own.
  assert.deepEqual(
    values('export function A({ pad } = { pad: "x" }) { return <i style={pad} />; }'),
    ["x"],
  );
});

test("leaves follows a destructured slot through a branch, a function and useMemo", () => {
  const values = (code) =>
    ask(code, (context, value) => leaves(context, value).map((leaf) => leaf.value))[0];
  assert.deepEqual(
    values('const [a, b] = on ? ["x", "y"] : ["z", "w"]; export const A = () => <i style={b} />;'),
    ["y", "w"],
  );
  assert.deepEqual(
    values(
      'function size(s) { switch (s) { case "a": return 8; default: if (s) return 12; } try { return 16; } finally {} } export const A = () => <i style={size(k)} />;',
    ),
    [8, 12, 16],
  );
  assert.deepEqual(
    values(
      'import { useMemo } from "react"; export const A = () => { const k = useMemo(() => "x", []); return <i style={k} />; };',
    ),
    ["x"],
  );
});

test("memberValues reads every entry for a runtime key in vocabulary mode, none in context", () => {
  const code =
    'const tones = { a: "x", b: "y" }; export const A = ({ t }) => <i style={tones[t]} />;';
  assert.deepEqual(
    ask(code, (context, value) => memberValues(context, value).map((node) => node.value))[0],
    ["x", "y"],
  );
  const reasons = [];
  const [found] = ask(code, (context, value) =>
    memberValues(context, value, { mode: "contextual", onUnreadable: unreadable(reasons) }),
  );
  assert.deepEqual([found, reasons], [[], ["computed-key"]]);
});

test("entriesOf flattens a same-file spread, and says what it cannot read", () => {
  const [entries] = ask(
    'const base = { a: "1" }; export const A = () => <i style={{ ...base, b: "2", ...other, [k]: "3" }} />;',
    (context, value) => entriesOf(context, value),
  );
  assert.deepEqual(
    entries.map((entry) => entry.key ?? `?${entry.reason}`),
    ["a", "b", "?spread", "?computed-key"],
  );
});

test("patternSteps is a destructured binding's route, and a rest has none", () => {
  const routes = [];
  run("const [a, { b: [, c] }] = x; const [...rest] = y;", () => ({
    VariableDeclarator(node) {
      const bindings = [];
      const walk = (pattern) => {
        if (pattern.type === "Identifier") bindings.push(pattern);
        else if (pattern.type === "ArrayPattern") pattern.elements.forEach((e) => e && walk(e));
        else if (pattern.type === "ObjectPattern")
          pattern.properties.forEach((p) => walk(p.value ?? p.argument));
        else if (pattern.type === "RestElement") walk(pattern.argument);
      };
      walk(node.id);
      for (const binding of bindings) routes.push([binding.name, patternSteps(binding, node.id)]);
    },
  }));
  assert.deepEqual(routes, [
    ["a", [{ index: 0 }]],
    ["c", [{ index: 1 }, { key: "b" }, { index: 1 }]],
    ["rest", null],
  ]);
});

test("returnsOf leaves a nested function's returns out", () => {
  const found = [];
  run('function f() { const g = () => "inner"; if (x) return "a"; return "b"; }', () => ({
    FunctionDeclaration(node) {
      found.push(...returnsOf(node).map((value) => value.value));
    },
  }));
  assert.deepEqual(found, ["a", "b"]);
});

/* ---------- sites ---------- */

test("a site says where it is, what reached it, what did not, and which part owns it", () => {
  const [site] = sitesOf(
    'import { Table, cn } from "@ledger/design-system"; export const A = ({ tone }) => <Table.Cell className={cn("truncate", tone)} />;',
  ).filter(({ origin }) => origin === "attribute");
  assert.deepEqual(
    {
      origin: site.origin,
      attribute: site.attribute,
      element: site.element.type,
      strings: site.strings.map(({ text }) => text),
      unresolved: site.unresolved.map(({ reason }) => reason),
      part: site.part,
      owner: site.owner,
    },
    {
      origin: "attribute",
      attribute: "className",
      element: "JSXOpeningElement",
      strings: ["truncate"],
      unresolved: ["prop"],
      part: "Table.Cell",
      owner: { part: "Table.Cell", via: "self", wrapper: "" },
    },
  );
});

test("a parameter with a default is a prop where its function is written, and its default in a call that leaves it out", () => {
  const onButtons = (code) =>
    sitesOf(H + code)
      .filter(({ origin, element }) => origin === "attribute" && element?.name.name === "Button")
      .map(({ strings, unresolved }) => ({
        strings: strings.map(({ text }) => text),
        unresolved: unresolved.map(({ reason }) => reason),
      }));
  // A caller can give it any other value, which no class site reads: the default is read, and the
  // parameter is still a prop.
  assert.deepEqual(
    onButtons('function Save({ w = "w-full" }) { return <Button className={w} /> }'),
    [{ strings: ["w-full"], unresolved: ["prop"] }],
  );
  assert.deepEqual(
    onButtons('function Save(props = { w: "w-full" }) { return <Button className={props.w} /> }'),
    [{ strings: ["w-full"], unresolved: ["prop"] }],
  );
  // Read for a call, it is what the call gives it, or its default where the call leaves it out
  // (the default is read as vocabulary either way).
  assert.deepEqual(
    onButtons(
      'const place = (at = "self-end") => cn("min-w-0", at); export const A = () => <><Button className={place()} /><Button className={place("self-start")} /></>',
    ),
    [
      { strings: ["min-w-0", "self-end"], unresolved: [] },
      { strings: ["min-w-0", "self-start", "self-end"], unresolved: [] },
    ],
  );
});

test("a helper read for its call: an argument left out with no default is nothing, and a slot or the rest of a pattern reads the argument", () => {
  const onButtons = (code) =>
    sitesOf(H + code)
      .filter(({ origin, element }) => origin === "attribute" && element?.name.name === "Button")
      .map(({ strings, unresolved }) => ({
        strings: strings.map(({ text }) => text),
        unresolved: unresolved.map(({ reason }) => reason),
      }));
  assert.deepEqual(
    onButtons(
      'function cls(extra) { return cn("w-full", extra); } function place(p) { const { tone } = p; return tone; } function rest({ a, ...others }) { return others.tone; } export const A = () => <><Button className={cls()} /><Button className={place({ tone: "self-end" })} /><Button className={rest({ a: 1, tone: "self-start" })} /></>',
    ),
    [
      { strings: ["w-full"], unresolved: [] },
      { strings: ["self-end"], unresolved: [] },
      { strings: ["self-start"], unresolved: [] },
    ],
  );
  // A spread argument hides the parameter it reaches.
  assert.deepEqual(
    onButtons(
      'function cls(extra) { return cn("w-full", extra); } export const A = ({ list }) => <Button className={cls(...list)} />',
    ),
    [{ strings: ["w-full"], unresolved: ["spread"] }],
  );
  // A list glued by a join with no space is one class built at runtime.
  assert.deepEqual(
    onButtons('export const A = ({ tone }) => <Button className={["bg-", tone].join("")} />'),
    [{ strings: [], unresolved: ["glued-template"] }],
  );
});

test("a style value's leaves: a number before a unit, a named number in a sum, a product of written numbers, and a helper's argument", () => {
  const values = (value) =>
    ask(
      `const W = 288; const GAP = 8; const WIDTH = 104; const G = "24px"; const box = (w) => w; export const A = ({ offset, depth }) => <i style={${value}} />;`,
      (context, found) =>
        leaves(context, found, { named: true }).map((leaf) =>
          leaf.type === "TemplateLiteral" ? "template" : leaf.value,
        ),
    )[0];
  assert.deepEqual(values("`${W}px`"), ["template", "288px"]);
  assert.deepEqual(values('W + "rem"'), ["288rem", "rem"]);
  assert.deepEqual(values("offset + GAP"), [8]);
  assert.deepEqual(values("offset - 1"), []);
  assert.deepEqual(values("depth * W"), []);
  assert.deepEqual(values("`${WIDTH / 16}rem`"), ["template", "6.5rem"]);
  assert.deepEqual(values("box(288)"), [288]);
  assert.deepEqual(values('"calc(100% - " + G + ")"'), ["calc(100% - ", "24px", ")"]);
});

test("each kind of site is found once, and a helper inside another site is that site's", () => {
  const code = `import { cn } from "@ledger/design-system";
export const base = "flex gap-100";
export const tones = { ok: "text-success", bad: "text-danger", label: "Needs setup" };
export const columns = [{ id: "a", cellClassName: "truncate" }];
export const x = cn("grid");
export const A = ({ on }) => <><div className={cn("p-100", on && "px-200")} {...{ className: "min-w-0" }} /><DayPicker classNames={{ root: "flex" }} /></>;`;
  const origins = sitesOf(code).map(
    ({ origin, strings }) => `${origin}:${strings.map(({ text }) => text).join("|")}`,
  );
  assert.deepEqual(origins, [
    "declaration:flex gap-100",
    // Two of the map's three strings read as classes, so it is a class map: its class-shaped
    // strings are read where it is declared, and the label is not.
    "declaration-map:text-success",
    "declaration-map:text-danger",
    "key:truncate",
    "helper:grid",
    "attribute:p-100|px-200",
    "spread:min-w-0",
    "key:min-w-0",
    "slot-map:flex",
  ]);
  // A map whose strings are mostly not classes is data: none of it is read.
  assert.deepEqual(
    sitesOf('export const labels = { ok: "Connected", bad: "Needs setup", tone: "text-danger" };'),
    [],
  );
});

test("a file that says class nowhere and names no helper listens only for its declarations", () => {
  const listeners = [];
  run(
    'export const n = 1; export const label = "Open"; export const f = (a) => a + 1;',
    (context) => {
      const visitors = classSites(context).visitors(() => {});
      listeners.push(Object.keys(visitors));
      return {};
    },
  );
  assert.deepEqual(listeners, [["VariableDeclarator", "Program:exit"]]);
  const all = [];
  run('export const A = () => <div className="flex" />;', (context) => {
    all.push(Object.keys(classSites(context).visitors(() => {})));
    return {};
  });
  assert.deepEqual(all, [
    [
      "JSXAttribute",
      "JSXSpreadAttribute",
      "Property",
      "CallExpression",
      "VariableDeclarator",
      "AssignmentExpression",
      "Program:exit",
    ],
  ]);
});

/** Two rules over one file, each asking the reader for every site: what each is handed, in order,
    and the listeners each gets. `keep` false drops the first rule's listeners, as a rule that asks
    and then listens for nothing does. */
function twoRules(code, { keep = true } = {}) {
  const handed = [[], []];
  const keys = [];
  const rule = (index) => ({
    meta: { schema: [] },
    create(context) {
      const visitors = classSites(context).visitors((site) => handed[index].push(site));
      keys.push(Object.keys(visitors));
      return index === 0 && !keep ? {} : visitors;
    },
  });
  new Linter({ cwd: REPO }).verify(
    code,
    [
      {
        files: ["**/*.{ts,tsx}"],
        languageOptions,
        plugins: { probe: { rules: { first: rule(0), second: rule(1) } } },
        rules: { "probe/first": "error", "probe/second": "error" },
      },
    ],
    { filename: PRODUCT },
  );
  return { handed, keys };
}

test("the first rule reads each site as the traversal meets it, and every rule after it is handed the same sites when it ends", () => {
  const code = `import { cn } from "@ledger/design-system";
export const base = "flex gap-100";
const tones = { ok: "text-success", bad: "text-danger" };
export const A = ({ on, t }) => <><div className={cn("p-100", on && "px-200", tones[t])} {...{ className: "min-w-0" }} /><DayPicker classNames={{ root: "flex" }} /></>;`;
  const { handed, keys } = twoRules(code);
  assert.equal(handed[0].length, 7);
  assert.deepEqual(handed[1], handed[0]);
  assert.deepEqual(keys[1], ["Program:exit"]);
  // A first rule that never listened leaves no record: the second walks the tree, in the same
  // order, to the same sites.
  const walked = twoRules(code, { keep: false });
  assert.deepEqual(walked.handed[0], []);
  const text = ({ origin, strings }) => `${origin}:${strings.map((s) => s.text).join("|")}`;
  assert.deepEqual(walked.handed[1].map(text), handed[0].map(text));
});

test("sites are shared per file and settings signature, never across signatures", () => {
  const code = 'export const v = variants({ base: "bg-red-500", defaultVariants: { size: "x" } });';
  const seen = [];
  run(code, (context) => {
    const other = Object.create(context, {
      settings: { value: { ledger: { variantFunctions: ["variants"] } } },
    });
    seen.push(classSites(context) === classSites(context));
    seen.push(classSites(context) !== classSites(other));
    const strings = (reader) =>
      reader
        .sitesAt(context.sourceCode.ast.body[0].declaration.declarations[0].init)
        .flatMap(({ strings }) => strings.map(({ text }) => text));
    seen.push(strings(classSites(context)), strings(classSites(other)));
    return {};
  });
  assert.deepEqual(seen, [true, true, [], ["bg-red-500"]]);
});

test("a const read at two sites is one finding at the literal", () => {
  const code =
    'import { Button } from "@ledger/design-system"; const k = "bg-red-500"; export const A = () => <><Button className={k} /><Button className={k} /></>;';
  const messages = run(code, () => ({}), { rules: { "ledger/no-non-token-class": "error" } });
  assert.deepEqual(
    messages.map(({ line, column }) => [line, column]),
    [[1, 59]],
  );
});

test("rules that share the sites report alone what they report together, in either order", () => {
  const code = `import { cn } from "@ledger/design-system";
const k = "p-[13px] bg-red-500"; const tones = { a: "w-[3px]", b: "text-zinc-600" };
export const A = ({ t }) => <><div className={cn(k, tones[t], \`bg-\${t}\`)} /><p className={k} /></>;`;
  const key = ({ ruleId, line, column, message }) => `${ruleId} ${line}:${column} ${message}`;
  const lint = (rules) =>
    run(code, () => ({}), { rules })
      .filter(({ ruleId }) => ruleId?.startsWith("ledger/"))
      .map(key)
      .sort();
  const arbitrary = lint({ "ledger/no-arbitrary-value": "error" });
  const nonToken = lint({ "ledger/no-non-token-class": "error" });
  const union = [...arbitrary, ...nonToken].sort();
  assert.equal(arbitrary.length, 2);
  assert.equal(nonToken.length, 3);
  assert.deepEqual(
    lint({ "ledger/no-arbitrary-value": "error", "ledger/no-non-token-class": "error" }),
    union,
  );
  assert.deepEqual(
    lint({ "ledger/no-non-token-class": "error", "ledger/no-arbitrary-value": "error" }),
    union,
  );
});

test("a glued template or concatenation is quoted as the class it builds", () => {
  const built = [];
  run(
    'const a = `bg-${tone}-500 flex ${on ? "x" : "y"} text-${kind(a, b)}`; const b = "w-" + size + " grid";',
    (context) => ({
      TemplateLiteral(node) {
        if (node.parent.type === "VariableDeclarator")
          built.push(builtClass(node, context.sourceCode));
      },
      BinaryExpression(node) {
        if (node.parent.type === "VariableDeclarator")
          built.push(builtClass(node, context.sourceCode));
      },
    }),
  );
  assert.deepEqual(built, ["bg-${tone}-500 text-${…}", "w-${size}"]);
});

/* ---------- helpers ---------- */

test("a helper is known by name, and by what it imports when it is renamed or a namespace's", () => {
  const read = (code, settings) => findings(code, { settings });
  assert.deepEqual(read('import { cx } from "class-variance-authority"; cx("p-[13px]");'), [
    "no-arbitrary-value:p-[13px]",
  ]);
  assert.deepEqual(
    read('import { cn as merge } from "@ledger/design-system/cn"; merge("bg-red-500");'),
    ["no-non-token-class:bg-red-500"],
  );
  assert.deepEqual(read('import * as u from "@ledger/design-system/cn"; u.cn("bg-red-500");'), [
    "no-non-token-class:bg-red-500",
  ]);
  assert.deepEqual(read('import merge from "clsx"; merge("bg-red-500");'), [
    "no-non-token-class:bg-red-500",
  ]);
  // A consumer's own cn is read by its name; a renamed one from an unknown module is not.
  assert.deepEqual(read('import { cn } from "@/lib/utils"; cn("bg-red-500");'), [
    "no-non-token-class:bg-red-500",
  ]);
  assert.deepEqual(read('import { cn as merge } from "@/lib/utils"; merge("bg-red-500");'), []);
  // A local that shadows a renamed helper is not it.
  assert.deepEqual(
    read('import { cn as merge } from "clsx"; function f(merge) { return merge("bg-red-500"); }'),
    [],
  );
});

const tabs = path.join(REPO, "packages/design-system/src/components/tabs.tsx");
test("in the kit, classes() from lib/base-ui is still read, and so are aliases of lib/cn and lib/base-ui", () => {
  const source = fs.readFileSync(tabs, "utf8");
  const planted = source.replace(
    '"group/tabs flex min-w-0 gap-100 data-[orientation=horizontal]:flex-col"',
    '"group/tabs flex min-w-0 gap-100 data-[orientation=horizontal]:flex-col bg-red-500"',
  );
  assert.notEqual(planted, source, "tabs.tsx still has the classes() call this case plants in");
  const kit = { filename: tabs, settings: KIT_SETTINGS };
  assert.deepEqual(findings(source, kit), []);
  assert.deepEqual(findings(planted, kit), ["no-non-token-class:bg-red-500"]);
  const aliases =
    'import { classes as cls } from "../lib/base-ui"; import { cn as merge } from "../lib/cn"; export const a = cls("bg-a1", x); export const b = merge("bg-a2");';
  assert.deepEqual(findings(aliases, { filename: KIT, settings: KIT_SETTINGS }), [
    "no-non-token-class:bg-a1",
    "no-non-token-class:bg-a2",
  ]);
  // Outside the kit's own settings the aliases are a product's, from modules it does not know.
  assert.deepEqual(findings(aliases, { filename: KIT }), []);
});

test("a glued value is one runtime finding, a separated one is read, and config keys still hold classes", () => {
  const button = 'import { Button, TextLink, cn } from "@ledger/design-system";\n';
  assert.deepEqual(
    findings(
      `${button}export const A = ({ t }) => <Button className={\`bg-\${t} p-[13px]\`} />;`,
    ).sort(),
    ["no-arbitrary-value:p-[13px]", "no-non-token-class.runtime:bg-${t}"],
  );
  assert.deepEqual(
    findings(
      `${button}export const A = ({ on }) => <div className={\`flex \${cn(on && "grid")}\`} />;`,
    ),
    [],
  );
  assert.deepEqual(
    findings(
      `${button}export const A = () => <div className={"w-full " + "[&>select]:h-control-small"} />;`,
    ),
    [],
  );
  assert.deepEqual(findings('export const columns = [{ id: "a", cellClassName: "p-[13px]" }];'), [
    "no-arbitrary-value:p-[13px]",
  ]);
  assert.deepEqual(
    findings(
      `${button}export const A = ({ c }) => <TextLink href="/x" {...(c ? {} : { className: "bg-red-500" })} />;`,
    ),
    ["no-non-token-class:bg-red-500"],
  );
});

/* ---------- what is no class, and the carriers that still reach one ---------- */

test("a class map's data is no class: tone words, view names, display keywords, a record's tone key", () => {
  const clean = [
    'export const SEVERITY = { critical: { tone: "danger", dot: "bg-danger", text: "text-danger" }, high: { tone: "warning", dot: "bg-warning", text: "text-warning" }, low: { tone: "neutral", dot: "bg-neutral", text: "text-subtle" } } as const;',
    'export const VIEWS = ["table", "grid", "board"] as const;',
    'export const DISPLAYS = ["block", "inline-block", "flex", "grid", "none"] as const;',
    'export const positions = ["static", "relative", "absolute", "fixed", "sticky", "inherit"];',
    'export const TEXT = { heading: "font-heading-medium", body: "font-body", caption: "text-subtle", fallback: "none" };',
    'export const TONES = ["bg-danger", "bg-warning", "bg-success", "info"];',
    // A dashed data word under a key whose values are not classes.
    'export const STEPS = [{ state: "in-progress", icon: "icon-brand", text: "text-brand" }, { state: "not-started", icon: "icon-subtle", text: "text-subtle" }];',
  ];
  for (const code of clean) assert.deepEqual(findings(code), [], code);
  // A kit story's matrix of values, under the package preset.
  const story = path.join(REPO, "packages/design-system/src/stories/primitives/Probe.stories.tsx");
  assert.deepEqual(
    findings(
      'const displays = ["block", "inline-block", "flex", "inline-flex", "grid", "none"] as const; export const Displays = { render: () => <>{displays.map((d) => <span key={d}>{d}</span>)}</> };',
      { filename: story, settings: KIT_SETTINGS },
    ),
    [],
  );
  // The kit's tone table with each tone's token name beside its classes, as its comment describes.
  const toneFile = path.join(REPO, "packages/design-system/src/lib/status-tone.ts");
  const named = fs
    .readFileSync(toneFile, "utf8")
    .replace(/^( {2}(\w+): \{\n)/gm, (_, head, tone) => `${head}    token: "${tone}",\n`);
  assert.match(named, /token: "danger"/, "status-tone.ts still has the tone table this case names");
  assert.deepEqual(findings(named, { filename: toneFile, settings: KIT_SETTINGS }), []);
  // A mistake among a map's classes is still found, in a record key and in a flat map.
  assert.deepEqual(
    findings(
      'export const SEVERITY = { critical: { tone: "danger", dot: "bg-red-500", text: "text-danger", icon: "icon-danger" }, high: { tone: "warning", dot: "bg-warning", text: "text-warning", icon: "icon-warning" } };',
    ),
    ["no-non-token-class:bg-red-500"],
  );
  assert.deepEqual(
    findings('export const TEXT = { a: "font-body", b: "text-subtle", c: "p-[13px]" };'),
    ["no-arbitrary-value:p-[13px]"],
  );
});

test("a classNames string is a prefix, a data class key is data, a tv config's keys are names", () => {
  const clean = [
    'import { CSSTransition } from "react-transition-group"; export const A = ({ show }) => <CSSTransition in={show} timeout={200} classNames="fade"><span /></CSSTransition>;',
    'import { CSSTransition } from "react-transition-group"; export const A = ({ show, dir }) => <CSSTransition in={show} timeout={200} classNames={`slide-${dir}`}><span /></CSSTransition>;',
    'export const A = ({ dir }) => <Fade {...{ classNames: "fade" }} />;',
    'export const prop = { name: "label", class: "sp800-53a", value: "AC-1" };',
    'export const part = { id: "ac-1_smt", class: "zero-padded" };',
    'import { tv } from "tailwind-variants"; const button = tv({ base: "flex", variants: { size: { sm: "gap-100" } } }); export const small = tv({ extend: button, defaultVariants: { size: "sm" } });',
    'import { tv } from "tailwind-variants"; import { button } from "./button"; export const icon = tv({ extend: button, compoundVariants: [{ size: "sm", class: "gap-100" }] });',
  ];
  for (const code of clean) assert.deepEqual(findings(code), [], code);
  // A classNames object is still a slot map, through a branch too; the string branch is not.
  assert.deepEqual(
    findings(
      'export const A = ({ on }) => <DayPicker classNames={on ? { day: "bg-red-500" } : "fade"} />;',
    ),
    ["no-non-token-class:bg-red-500"],
  );
  // A class key's value that reads as classes, or has a variant or a bracket, is still read.
  assert.deepEqual(
    findings(
      'export const a = { class: "flex bg-red-500" }; export const b = { class: "p-[13px]" };',
    ),
    ["no-non-token-class:bg-red-500", "no-arbitrary-value:p-[13px]"],
  );
  // cva's first argument without a config key is its base, read clsx-style.
  assert.deepEqual(
    findings(
      'import { cva } from "class-variance-authority"; export const b = cva({ "bg-red-500": true });',
    ),
    ["no-non-token-class:bg-red-500"],
  );
});

test("a same-file cx, tv or classNames is not the helper; an imported one is", () => {
  const clean = [
    'const cx = (key: string) => (key === "revenue" ? 10 : 20); export const Dot = () => <circle cx={cx("revenue")} cy={4} r={2} />;',
    'const tv = (channel: string) => channel.toUpperCase(); export const label = tv("bbc-one");',
    'export function useTheme(classNames: (s: string) => string) { return classNames("Header"); }',
    'function twJoin(a: string) { return a; } export const x = twJoin("Header");',
  ];
  for (const code of clean) assert.deepEqual(findings(code), [], code);
  assert.deepEqual(
    findings('import { cx } from "@emotion/css"; export const x = cx("bg-red-500");'),
    ["no-non-token-class:bg-red-500"],
  );
  // A name in the settings counts as written.
  assert.deepEqual(
    findings('const cx = (s) => s; export const x = cx("bg-red-500");', {
      settings: { ledger: { classFunctions: ["cx"] } },
    }),
    ["no-non-token-class:bg-red-500"],
  );
  // cn, clsx and cva count by name, as before.
  assert.deepEqual(
    findings('const cn = (...a) => a.join(" "); export const x = cn("bg-red-500");'),
    ["no-non-token-class:bg-red-500"],
  );
});

test("a hole that brings its own whitespace is no glue; one that does not is one runtime value", () => {
  const clean = [
    'export const A = ({ on }) => <div className={`flex${on ? " gap-100" : ""}`} />;',
    'export const A = ({ on }) => <div className={"flex" + (on ? " gap-100" : "")} />;',
    'import { cn } from "@ledger/design-system"; export const A = ({ on }) => <div className={cn(`flex${on ? " gap-100" : ""}`)} />;',
    'const extra = " gap-100"; export const A = ({ on }) => <div className={`flex${on ? extra : ""}`} />;',
    'export const A = ({ on }) => <div className={`${on ? "gap-100 " : ""}flex`} />;',
  ];
  for (const code of clean) assert.deepEqual(findings(code), [], code);
  // The hole is read, and the word beside it stays whole.
  assert.deepEqual(
    findings(
      'export const A = ({ on }) => <div className={`flex items-center${on ? " p-[13px]" : ""}`} />;',
    ),
    ["no-arbitrary-value:p-[13px]"],
  );
  assert.deepEqual(
    findings('export const A = ({ on }) => <div className={`${on ? "p-[13px] " : ""}flex`} />;'),
    ["no-arbitrary-value:p-[13px]"],
  );
  assert.deepEqual(
    findings(
      'export const A = ({ on }) => <div className={"flex items-center" + (on ? " p-[13px]" : "")} />;',
    ),
    ["no-arbitrary-value:p-[13px]"],
  );
  // A value that can render as a word glues: `false`, a number, a prop, an `&&`.
  for (const hole of ['on && " gap-100"', "size", 'on ? 2 : ""', "undefined"])
    assert.deepEqual(
      findings(`export const A = ({ on, size }) => <div className={\`gap\${${hole}}\`} />;`),
      [`no-non-token-class.runtime:gap\${${/^\w+$/.test(hole) ? hole : "…"}}`],
      hole,
    );
  // Only the glued word is quoted.
  assert.deepEqual(
    findings(
      'export const A = ({ on, t }) => <div className={`flex${on ? " gap-100" : ""} bg-${t}`} />;',
    ),
    ["no-non-token-class.runtime:bg-${t}"],
  );
  // Words two adjacent strings glue together are read in every run of a concatenation.
  assert.deepEqual(
    findings(
      'export const A = ({ t }) => <div className={"bg-" + "red-500 " + t + " p-" + "[13px]"} />;',
    ).sort(),
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  );
});

test("a class reaches its site through filter, trim, concat, Object.values, a spread argument and a map", () => {
  const cases = [
    'export const A = ({ on }) => <div className={["flex", on && "p-[13px]"].filter(Boolean).join(" ")} />;',
    'export const A = ({ on }) => { const cls = ["flex", on ? "p-[13px]" : null].filter(Boolean).join(" "); return <div className={cls} />; };',
    "export const A = ({ x }) => <div className={`flex p-[13px] ${x}`.trim()} />;",
    'export const A = ({ on }) => <div className={["flex"].concat(on ? ["p-[13px]"] : []).join(" ")} />;',
    'const parts = { pad: "p-[13px]", layout: "flex" }; export const A = () => <div className={Object.values(parts).join(" ")} />;',
    'import { cn } from "@ledger/design-system"; export const A = () => { const extra = ["p-[13px]"]; return <div className={cn("flex", ...extra)} />; };',
    'import { cn } from "@ledger/design-system"; export const A = ({ on }) => <div className={cn(...["flex", on && "p-[13px]"])} />;',
    'export const A = ({ on }) => <div className={(() => (on ? "p-[13px]" : "flex"))()} />;',
    'const tones = Object.freeze({ danger: "p-[13px]", info: "flex" }); export const A = ({ tone }) => <div className={tones[tone]} />;',
    'const TABS = [{ id: "a", cls: "p-[13px]" }, { id: "b", cls: "flex" }]; export const A = () => <>{TABS.map((tab) => <div key={tab.id} className={tab.cls} />)}</>;',
    'import { useCallback } from "react"; export const A = ({ on }) => { const cls = useCallback((x) => (x ? "p-[13px]" : "flex"), []); return <div className={cls(on)} />; };',
    'import { useState } from "react"; export const A = () => { const [cls] = useState("p-[13px]"); return <div className={cls} />; };',
    'enum Pad { Big = "p-[13px]" } export const A = () => <div className={Pad.Big} />;',
    'export function A({ pad } = { pad: "p-[13px]" }) { return <div className={pad} />; }',
    'export const A = ({ on }) => { let cls = "flex"; if (on) cls += " p-[13px]"; return <div className={cls} />; };',
  ];
  for (const code of cases) assert.deepEqual(findings(code), ["no-arbitrary-value:p-[13px]"], code);
  // A list mapped to a template that glues each value builds its classes at runtime.
  assert.deepEqual(
    findings(
      'const sizes = ["100", "200"]; export const A = () => <div className={sizes.map((s) => `p-${s}`).join(" ")} />;',
    ),
    ["no-non-token-class.runtime:p-${s}"],
  );
});

test("an element's className sites are those that can win: the last one written", () => {
  const owned = (code) => {
    const found = [];
    run(code, (context) => ({
      JSXOpeningElement(node) {
        if (node.name.name === "Cell")
          found.push(
            classSites(context)
              .classSitesOf(node)
              .flatMap(({ strings }) => strings.map(({ text }) => text)),
          );
      },
    }));
    return found[0];
  };
  assert.deepEqual(
    owned(
      'const totals = { className: "font-semibold", colSpan: 2 }; export const A = () => <Cell {...totals} className="text-end" />;',
    ),
    ["text-end"],
  );
  assert.deepEqual(
    owned(
      'const totals = { className: "font-semibold" }; export const A = () => <Cell className="text-end" {...totals} />;',
    ),
    ["font-semibold"],
  );
  // A spread that may not set it leaves the attribute before it in play.
  assert.deepEqual(
    owned(
      'export const A = ({ on }) => <Cell className="text-end" {...(on ? { className: "font-semibold" } : {})} />;',
    ),
    ["text-end", "font-semibold"],
  );
  assert.deepEqual(owned('export const A = (props) => <Cell className="text-end" {...props} />;'), [
    "text-end",
  ]);
});

/* ---------- the kit's maps (lint hardening 4b) ---------- */

// The class-map-reach item's cases (docs/guides/lint-hardening-2026-09-28/catalogue.json), with
// the review's attribute list and 4a's two open carriers: `reports` are the token rules' findings.
const REACH = [
  [
    "an optional member of an `as const` map",
    'const m = { a: "p-[13px]" } as const; export const A = () => <div className={m?.a} />;',
    ["no-arbitrary-value:p-[13px]"],
  ],
  [
    "a switch in a same-file function",
    'function toneClass(t) { switch (t) { case "a": return "p-[13px]"; default: return "flex"; } } export const A = ({ t }) => <div className={cn(toneClass(t))} />;',
    ["no-arbitrary-value:p-[13px]"],
  ],
  [
    "a Record of token classes",
    'type Tone = "neutral" | "danger"; const tones: Record<Tone, string> = { neutral: "bg-neutral text-subtle", danger: "bg-danger text-danger" }; export const A = ({ tone }: { tone: Tone }) => <Badge className={cn(tones[tone])} />;',
    [],
  ],
  [
    "a cva recipe called where its classes land",
    'import { cva } from "class-variance-authority"; const recipe = cva("flex", { variants: { size: { small: "gap-100" } } }); export const A = ({ size }) => <Button className={recipe({ size })} />;',
    [],
  ],
  [
    "a tv recipe held by a const",
    'import { tv } from "tailwind-variants"; const box = tv({ base: "flex", variants: { s: { a: "p-[13px]" } } }); export const A = () => <div className={box({ s: "a" })} />;',
    ["no-arbitrary-value:p-[13px]"],
  ],
  [
    "a function that calls itself ends",
    'const f = (x) => (x ? f(!x) : "flex"); export const A = ({ a }) => <div className={f(a)} />;',
    [],
  ],
  [
    "React.useMemo",
    'import * as React from "react"; export const A = ({ on }) => { const c = React.useMemo(() => (on ? "bg-red-500" : "flex"), [on]); return <div className={c} />; };',
    ["no-non-token-class:bg-red-500"],
  ],
  [
    "a nested map read where it is declared",
    'export const toneMap = { a: { fill: "bg-neutral-bold" }, b: { fill: "bg-red-500" }, c: { fill: "text-subtle" } };',
    ["no-non-token-class:bg-red-500"],
  ],
  [
    "a map read where it is declared",
    'export const fieldControlHeight = { xsmall: "h-8", small: "h-control-small", medium: "h-control-medium" };',
    ["no-non-token-class:h-8"],
  ],
  [
    "a map half of whose strings read as classes is data where it is declared",
    'export const fieldControlHeight = { small: "h-8", medium: "h-control-medium" };',
    [],
  ],
  [
    "labels are no class map",
    'export const labels = { draft: "Draft", published: "Published", group: "catalog group" };',
    [],
  ],
  [
    "attribute names are no class list, though one is a class",
    'const reachability = ["disabled", "tabindex", "href", "contenteditable", "hidden"]; export const watched = reachability;',
    [],
  ],
  [
    "a key computed from a const, in a helper's object",
    'const active = "p-[13px]"; export const A = ({ on }) => <div className={cn({ [active]: on, flex: true })} />;',
    ["no-arbitrary-value:p-[13px]"],
  ],
  [
    "a computed key's value in a slot map",
    'const DAY = "day"; export const A = () => <DayPicker classNames={{ [DAY]: "bg-red-500" }} />;',
    ["no-non-token-class:bg-red-500"],
  ],
  [
    "a helper held by a module-level const",
    'const merge = cn; export const A = () => <div className={merge("p-[13px]")} />; export const c = merge("bg-red-500");',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  [
    "a helper held by a const inside a component",
    'export const A = () => { const merge = cn; return <div className={merge("p-[13px]")} />; };',
    ["no-arbitrary-value:p-[13px]"],
  ],
  [
    "a const that holds something else is no helper",
    'const merge = format; export const c = merge("bg-red-500"); export const A = () => <div title={merge("bg-red-500")} />;',
    [],
  ],
  // A bare word is no evidence either way: data whose other strings have dashes is no class map.
  [
    "a style object is no class map",
    'export const toolbarStyle = { position: "sticky", top: 0, display: "flex", justifyContent: "space-between" }; export const FULL_ROW = { gridColumn: "1 / -1", display: "grid", position: "relative" };',
    [],
  ],
  [
    "an attribute list, a view list, route defaults and a word map are no class maps",
    'const HIDING = ["hidden", "inert", "aria-hidden"]; export const isHidden = (el) => HIDING.some((a) => el.hasAttribute(a)); export const VIEWS = ["table", "grid", "list-detail"]; export const defaultSearch = { view: "table", layout: "grid", sort: "updated-desc" }; export const words = { hidden: "hidden", shown: "visible", archived: "read-only" };',
    [],
  ],
  // What a module-level map holds, read where it is declared.
  [
    "an Object.freeze map",
    'export const tones = Object.freeze({ danger: "bg-red-500 p-[13px] text-subtle", ok: "bg-success text-subtle", neutral: "bg-neutral text-subtle" } as const);',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  [
    "a template's own text, around its hole",
    'const base = "inline-flex items-center"; export const sizes = { small: `${base} bg-red-500 p-[13px] text-subtle`, medium: `${base} bg-success text-subtle`, large: "bg-neutral text-subtle", xl: "bg-success text-subtle" };',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  [
    "each branch of a condition and a fallback",
    'const dense = typeof window === "undefined"; export const sizes = { small: dense ? "bg-red-500 text-subtle" : "bg-success text-subtle", medium: (dense && "p-[13px] text-subtle") || "bg-neutral text-subtle", large: "bg-neutral text-subtle" };',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  [
    "a spread-built map's own entries, beside what it spreads",
    'const base = { neutral: "bg-neutral text-subtle", ok: "bg-success text-subtle" }; export const tones = { ...base, danger: "bg-red-500 p-[13px] text-subtle" };',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  [
    "Object.fromEntries and new Map, by their values; a pair's key is a name",
    'export const a = Object.fromEntries([["list-detail", "bg-red-500 text-subtle"], ["ok", "bg-success text-subtle"], ["neutral", "bg-neutral text-subtle"]]); export const b = new Map([["danger", "p-[13px] text-subtle"], ["ok", "bg-success text-subtle"], ["neutral", "bg-neutral text-subtle"]]);',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  [
    "a list of records whose ids are words",
    'export const TONES = [{ id: "danger", cls: "bg-red-500 p-[13px] text-subtle" }, { id: "ok", cls: "bg-success text-subtle" }, { id: "neutral", cls: "bg-neutral text-subtle" }];',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  [
    "a computed-key map read by a key known at runtime",
    'enum Tone { Danger = "danger", Ok = "ok" } export const A = ({ t }) => { const tones = { [Tone.Danger]: "bg-red-500 p-[13px]", [Tone.Ok]: "bg-success text-subtle" }; return <span className={cn(tones[t], Object.values(tones))} />; };',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  // A same-file function's parameters, read as what a call gave them.
  [
    "an argument of a same-file class function",
    'const note = (tone) => cn("whitespace-normal", tone); export const A = () => <p className={note("bg-red-500")} />;',
    ["no-non-token-class:bg-red-500"],
  ],
  [
    "a destructured argument, and a member of a whole one",
    'const cell = ({ z }) => cn("sticky", z); const row = (p) => cn("flex", p.fill); export const A = () => <p className={cn(cell({ z: "p-[13px]" }), row({ fill: "bg-red-500" }))} />;',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  [
    "each call's own argument",
    'const note = (tone) => cn("whitespace-normal", tone); export const A = () => <><p className={note("bg-red-500")} /><p className={note("p-[13px]")} /></>;',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  // A DOM element's classes, written in place.
  [
    "a className written, and appended to",
    'export function mount(root) { root.className = "sr-only bg-red-500"; root.className += " p-[13px]"; }',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  [
    "classList.add's classes and toggle's first",
    'export function mark(el, on) { el.classList.add("flex", "bg-red-500"); el.classList.toggle("p-[13px]", on); el.classList.remove("bg-blue-600"); }',
    ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
  ],
  [
    "a class member on data is no class",
    'export function tag(part) { part.class = "sp800-53a"; part.id = "ac-2"; }',
    [],
  ],
];

test("the kit's maps are read: member lookups, same-file returns, recipes, computed keys and a helper held by a const", () => {
  const header = 'import { Badge, Button, cn } from "@ledger/design-system";\n';
  for (const [name, body, reports] of REACH)
    assert.deepEqual(findings(header + body).sort(), [...reports].sort(), name);
});

/** The kit's real class maps, each with a string a mistake is planted in: the plants of the
    class-map-reach item's live evidence; then the class strings that reach a className through a
    same-file class function's argument, or are written to a DOM element's className. */
const PLANTS = [
  ["components/button.tsx", "bg-brand-bold text-inverse hover:bg-brand-bold-hovered"],
  ["components/button.tsx", '"size-control-xsmall"'],
  ["components/badge.tsx", '"bg-brand-subtlest text-brand"'],
  ["lib/status-tone.ts", '"bg-neutral text-subtle"'],
  ["components/controls.tsx", '"focus-visible:outline-focused aria-invalid:border-danger"'],
  ["layout/shell/side-nav.tsx", '"icon-selected"'],
  ["components/alert.tsx", '"icon-subtle"'],
  ["components/progress.tsx", '"h-050"'],
  ["primitives/text.tsx", '"font-body-large"'],
  ["components/button-group.tsx", '"min-h-control-xsmall px-100"'],
  ["components/button.tsx", '"inline-flex select-none items-center'],
  ["patterns/editable.tsx", '"text-danger")}'],
  ["patterns/editable.tsx", '"text-subtle")}'],
  ["components/table.tsx", '"z-20")'],
  ["components/table.tsx", '"z-10")'],
  ["lib/announce.tsx", '"sr-only";'],
];

test("a mistake planted in each of the kit's real class maps is reported, and the maps as they are give none", () => {
  const src = path.join(REPO, "packages/design-system/src");
  for (const [file, anchor] of PLANTS) {
    const filename = path.join(src, file);
    const source = fs.readFileSync(filename, "utf8");
    const at = source.indexOf(anchor) + (anchor.startsWith('"') ? 1 : 0);
    assert.ok(at > 0, `${file} still has the map string this case plants in: ${anchor}`);
    const planted = `${source.slice(0, at)}bg-red-500 p-[13px] ${source.slice(at)}`;
    const kit = { filename, settings: KIT_SETTINGS };
    assert.deepEqual(findings(source, kit), [], file);
    assert.deepEqual(
      findings(planted, kit).sort(),
      ["no-arbitrary-value:p-[13px]", "no-non-token-class:bg-red-500"],
      `${file}: ${anchor}`,
    );
  }
});

test("a chain of names that each read the one below twice is read once per name", () => {
  const header = 'import { cn } from "@ledger/design-system";\n';
  for (const shape of ["cn", "ternary"]) {
    const lines = ['const on = typeof window === "undefined";', 'const a0 = "flex p-[13px]";'];
    for (let level = 1; level <= 22; level++)
      lines.push(
        shape === "cn"
          ? `const a${level} = cn(a${level - 1}, on && a${level - 1});`
          : `const a${level} = on ? a${level - 1} : a${level - 1};`,
      );
    lines.push("export const A = () => <div className={a22} />;");
    const started = performance.now();
    assert.deepEqual(findings(header + lines.join("\n")), ["no-arbitrary-value:p-[13px]"], shape);
    // Read once per route, 22 levels would take seconds (2^22 routes); read once per name, ms.
    const took = performance.now() - started;
    assert.ok(took < 2000, `${shape}: ${Math.round(took)} ms`);
  }
});

test("the token build's output is not read where it declares", () => {
  const generated = path.join(REPO, "packages/design-system/src/generated/probe.ts");
  const code = 'export const utilities = { a: "bg-red-500 flex", b: "p-[13px] grid" };';
  assert.deepEqual(findings(code, { filename: generated, settings: KIT_SETTINGS }), []);
  assert.deepEqual(findings(code, { filename: KIT, settings: KIT_SETTINGS }).sort(), [
    "no-arbitrary-value:p-[13px]",
    "no-non-token-class:bg-red-500",
  ]);
});
