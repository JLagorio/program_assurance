// Fixes keep the source valid and change only what they name. Every fixable rule runs over a
// table of hostile sources (real line breaks, entities, single quotes, escapes, templates, aliases,
// namespaces, props that collide), and each output must parse, bind its JSX, keep its attributes
// unique, leave every other class byte for byte, and make no other Ledger rule report more. After
// @shadcn/lint's test/suggestion-safety.test.ts, with Ledger's closure check added.
import assert from "node:assert/strict";
import test from "node:test";
import { Linter } from "eslint";
import ts from "typescript";
import tseslint from "typescript-eslint";

import ledger from "../eslint-plugin/index.js";
import {
  classesOf,
  closureFailures,
  deprecated,
  isArbitrary,
  isKnown,
  offerReplacement,
  withVariants,
} from "../eslint-plugin/classes.js";
import { lintValues } from "../eslint-plugin/data.js";
import { replaceClassInSource, suggestionsFor } from "../eslint-plugin/fixes.js";

const filename = "/repo/src/screen.tsx";
const languageOptions = { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } };
const withRules = (rules, plugins = { ledger }) => [
  { files: ["**/*.tsx"], languageOptions, plugins, rules },
];
const recommended = [{ files: ["**/*.tsx"], languageOptions }, ...ledger.configs.recommended];
const verify = (source, config) =>
  new Linter({ cwd: "/repo" }).verify(source, config, { filename });
const fixAll = (source, config) =>
  new Linter({ cwd: "/repo" }).verifyAndFix(source, config, { filename });

/** Reports per rule, so "nothing new" means no rule reports more after the fix than before. */
const countByRule = (messages) => {
  const counts = {};
  for (const { ruleId } of messages) counts[ruleId] = (counts[ruleId] ?? 0) + 1;
  return counts;
};

/** The TSX parse of a source: its syntax errors, the JSX roots it leaves unbound and any element
    that carries one attribute twice. */
function inspect(source) {
  const file = ts.createSourceFile(
    "screen.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const bound = new Set();
  const roots = new Set();
  const duplicates = [];
  const visit = (node) => {
    if (ts.isImportClause(node)) {
      if (node.name) bound.add(node.name.text);
      const named = node.namedBindings;
      if (named && ts.isNamespaceImport(named)) bound.add(named.name.text);
      if (named && ts.isNamedImports(named))
        for (const element of named.elements) bound.add(element.name.text);
    }
    if ((ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node)) && node.name)
      if (ts.isIdentifier(node.name)) bound.add(node.name.text);
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      let tag = node.tagName;
      while (ts.isPropertyAccessExpression(tag)) tag = tag.expression;
      if (ts.isIdentifier(tag) && (tag !== node.tagName || /^[A-Z]/.test(tag.text)))
        roots.add(tag.text);
      const names = node.attributes.properties
        .filter(ts.isJsxAttribute)
        .map((attribute) => attribute.name.getText(file));
      const repeated = names.filter((name, index) => names.indexOf(name) !== index);
      if (repeated.length) duplicates.push(...repeated);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return {
    parseErrors: file.parseDiagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText)),
    unbound: [...roots].filter((root) => !bound.has(root)),
    duplicates,
  };
}

/**
 * The TypeScript errors a TSX source gives on its own, grammar and types (no lib, nothing
 * resolved), counted by message. A fix may not add one: a key written twice, a tag that names a
 * member its object lacks, a string a type no longer admits.
 */
function typeErrors(source) {
  const fileName = "/screen.tsx";
  const options = { jsx: ts.JsxEmit.Preserve, noLib: true, noResolve: true, strict: true };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name, version) =>
    name === fileName
      ? ts.createSourceFile(name, source, version, true, ts.ScriptKind.TSX)
      : undefined;
  host.fileExists = (name) => name === fileName;
  host.readFile = (name) => (name === fileName ? source : undefined);
  const program = ts.createProgram([fileName], options, host);
  const counts = new Map();
  for (const diagnostic of [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ]) {
    const message = `TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`;
    counts.set(message, (counts.get(message) ?? 0) + 1);
  }
  return counts;
}
/** The errors `output` has more of than `source`. */
const addedTypeErrors = (source, output) => {
  const was = typeErrors(source);
  return [...typeErrors(output)].filter(([message, count]) => count > (was.get(message) ?? 0));
};

const token = Object.values(deprecated).find((entry) => entry.replacementClass);
const from = token.class; // fill-chart-categorical-8
const to = token.replacementClass; // fill-chart-categorical-7
const shell = 'import { Shell } from "@ledger/design-system";';

/**
 * Each case: the rule, the source, the output --fix must give (the source itself when no fix is
 * safe), the reports of the rule left after the fix, and, for a class, whether the report explains
 * why no fix is offered.
 */
const hostile = [
  {
    name: "a real line break inside the attribute stays a line break",
    rule: "no-deprecated-token",
    source: `export const A = () => <path className="${from}\n  w-full" />;`,
    output: `export const A = () => <path className="${to}\n  w-full" />;`,
  },
  {
    name: "double quotes inside a single-quoted attribute survive",
    rule: "no-deprecated-token",
    source: `export const A = () => <path className='before:content-["x"] ${from}' />;`,
    output: `export const A = () => <path className='before:content-["x"] ${to}' />;`,
  },
  {
    name: "an entity elsewhere in the attribute is kept as written",
    rule: "no-deprecated-token",
    source: `export const A = () => <path className="before:content-[&quot;x&quot;] ${from}" />;`,
    output: `export const A = () => <path className="before:content-[&quot;x&quot;] ${to}" />;`,
  },
  {
    name: "a single-quoted cn() argument keeps its quotes",
    rule: "no-deprecated-token",
    source: `import { cn } from "@ledger/design-system/cn"; export const c = cn('${from}', "w-full");`,
    output: `import { cn } from "@ledger/design-system/cn"; export const c = cn('${to}', "w-full");`,
  },
  {
    name: "a clsx key keeps its quotes",
    rule: "no-deprecated-token",
    source: `import { cn } from "@ledger/design-system/cn"; export const c = cn({ '${from}': on });`,
    output: `import { cn } from "@ledger/design-system/cn"; export const c = cn({ '${to}': on });`,
  },
  {
    name: "variants and the important modifier keep their places, and a longer class is untouched",
    rule: "no-deprecated-token",
    source: `export const A = () => <path className="hover:${from} ${from}0 md:hover:!${from} ${from}!" />;`,
    output: `export const A = () => <path className="hover:${to} ${from}0 md:hover:!${to} ${to}!" />;`,
  },
  {
    name: "a selector variant with & in it is not an entity, so it is fixed",
    rule: "no-deprecated-token",
    source: `export const A = () => <svg className="[&>path]:${from} w-full" />;`,
    output: `export const A = () => <svg className="[&>path]:${to} w-full" />;`,
  },
  {
    name: "a class joined to the next by an entity gets no fix",
    rule: "no-deprecated-token",
    source: `export const A = () => <path className="bg-surface ${from}&#32;w-full" />;`,
    remaining: [/entity, so no automatic fix is offered/],
  },
  {
    name: "a JavaScript string written with an escape gets no fix",
    rule: "no-deprecated-token",
    source: `export const A = () => <path className={"${from}\\u0020w-full"} />;`,
    remaining: [/escape, so no automatic fix is offered/],
  },
  {
    name: "a line continuation disables the fix for every class in the string",
    rule: "no-deprecated-token",
    source: `import { cn } from "@ledger/design-system/cn"; export const c = cn("hover:\\\n${from} ${from}");`,
    remaining: [/escape/, /escape/],
  },
  {
    name: "a template gets no fix",
    rule: "no-deprecated-token",
    source: `import { cn } from "@ledger/design-system/cn"; export const c = cn(\`bg-\${tone} ${from}\`);`,
    remaining: [/template/],
  },
  {
    name: "both important marks keep their places",
    rule: "no-deprecated-token",
    source: `export const A = () => <path className="!${from}! w-full" />;`,
    output: `export const A = () => <path className="!${to}! w-full" />;`,
  },
  {
    name: "a clsx key renamed onto a key the object has gets no fix",
    rule: "no-deprecated-token",
    source: `import { cn } from "@ledger/design-system/cn"; export const c = (a: boolean, b: boolean) => cn({ "${from}": a, "${to}": b });`,
    remaining: [/the object already has that key, so no automatic fix is offered/],
  },
  {
    name: "a string a type names gets no fix, since the type would not admit the new one",
    rule: "no-deprecated-token",
    source: `type Fill = "${from}" | "fill-chart-categorical-6"; export const fill: Fill = "${from}"; export const A = () => <path className={fill} />;`,
    remaining: [/a type names this string, so no automatic fix is offered/],
  },
  {
    name: "an aliased root stays the alias",
    rule: "no-deprecated-name",
    source:
      'import { Shell as DsShell } from "@ledger/design-system"; export const A = () => <DsShell.NavItem>x</DsShell.NavItem>;',
    output:
      'import { Shell as DsShell } from "@ledger/design-system"; export const A = () => <DsShell.SideNav.Item>x</DsShell.SideNav.Item>;',
  },
  {
    name: "a namespace keeps its prefix",
    rule: "no-deprecated-name",
    source:
      'import * as Kit from "@ledger/design-system"; export const A = () => <Kit.Shell.NavItem>x</Kit.Shell.NavItem>;',
    output:
      'import * as Kit from "@ledger/design-system"; export const A = () => <Kit.Shell.SideNav.Item>x</Kit.Shell.SideNav.Item>;',
  },
  {
    name: "a renamed prop moves with the tag",
    rule: "no-deprecated-name",
    source: `${shell} export const A = () => <Shell.NavGroup label="Work">x</Shell.NavGroup>;`,
    output: `${shell} export const A = () => <Shell.SideNav.Section heading="Work">x</Shell.SideNav.Section>;`,
  },
  {
    name: "a prop whose new name is already set is left and still reported",
    rule: "no-deprecated-name",
    source: `${shell} export const A = () => <Shell.Brand detail="x" secondaryName="y" />;`,
    output: `${shell} export const A = () => <Shell.AppLogo detail="x" secondaryName="y" />;`,
    remaining: [/^Shell\.AppLogo detail is deprecated; use secondaryName\.$/],
  },
  {
    name: "a renamed value keeps its quotes",
    rule: "no-deprecated-name",
    source: `import { Switch } from "@ledger/design-system"; export const A = () => <Switch size='sm' />;`,
    output: `import { Switch } from "@ledger/design-system"; export const A = () => <Switch size='small' />;`,
  },
  // A tag whose root is not the kit's import is a name that matches, so it is reported and left.
  {
    name: "a local object named like the part is never rewritten",
    rule: "no-deprecated-name",
    source:
      'import { Shell as Kit } from "@ledger/design-system"; const Shell = { NavItem: ({ children }: { children: string }) => children }; export const A = () => <Kit.SideNav><Shell.NavItem>Work</Shell.NavItem></Kit.SideNav>;',
    remaining: [/^Shell\.NavItem is deprecated; use Shell\.SideNav\.Item\.$/],
  },
  {
    name: "another package's part under the kit's name is never rewritten",
    rule: "no-deprecated-name",
    source:
      'import { Shell } from "other-lib"; export const A = () => <Shell.NavItem>x</Shell.NavItem>;',
    remaining: [/^Shell\.NavItem is deprecated/],
  },
  {
    // Another package's Shell under another name is judged by the name it imports, and its tag
    // and props are never the kit's to rewrite.
    name: "another package's Shell imported under another name keeps its tag and props",
    rule: "no-deprecated-name",
    source:
      'import { Shell as Layout } from "other-lib"; export const A = () => <Layout.Brand detail="x" />;',
    remaining: [/^Shell\.Brand is deprecated/],
  },
  // A parameter or a local that shadows the kit's import is no part at all, so it is neither
  // reported nor rewritten, while the kit's own use beside it is fixed.
  {
    name: "a parameter that shadows the kit's import is never rewritten",
    rule: "no-deprecated-name",
    source: `${shell} export const A = ({ Shell }: { Shell: any }) => <Shell.NavItem>x</Shell.NavItem>; export const B = () => <Shell.NavItem>y</Shell.NavItem>;`,
    output: `${shell} export const A = ({ Shell }: { Shell: any }) => <Shell.NavItem>x</Shell.NavItem>; export const B = () => <Shell.SideNav.Item>y</Shell.SideNav.Item>;`,
  },
  {
    name: "a kit alias shadowed in a nested scope is never rewritten",
    rule: "no-deprecated-name",
    source:
      'import { Shell as S } from "@ledger/design-system"; export const A = () => { const S = { NavItem: () => null }; return <S.NavItem />; }; export const B = () => <S.NavItem />;',
    output:
      'import { Shell as S } from "@ledger/design-system"; export const A = () => { const S = { NavItem: () => null }; return <S.NavItem />; }; export const B = () => <S.SideNav.Item />;',
  },
  // A token's variable written in a class becomes the token class that declares the same.
  {
    name: "a token's variable keeps the class's variants, important mark, quotes and line break",
    rule: "no-arbitrary-value",
    source:
      "export const A = () => <div className='hover:!bg-(--ds-elevation-surface)\n  w-full' />;",
    output: "export const A = () => <div className='hover:!bg-surface\n  w-full' />;",
  },
  {
    name: "a token's variable joined to the next class by an entity gets no fix",
    rule: "no-arbitrary-value",
    source: 'export const A = () => <div className="p-(--ds-space-200)&#32;w-full" />;',
    remaining: [/entity, so no automatic fix is offered/],
  },
  {
    name: "a token's variable in a template gets no fix",
    rule: "no-arbitrary-value",
    source:
      'import { cn } from "@ledger/design-system/cn"; export const c = (tone: string) => cn(`${tone} bg-[var(--ds-elevation-surface)]`);',
    remaining: [/template/],
  },
];

for (const item of hostile)
  test(`fix safety, ${item.rule}: ${item.name}`, () => {
    const rule = withRules({ [`ledger/${item.rule}`]: "error" });
    const before = verify(item.source, rule);
    assert.ok(before.length > 0, "the rule reports the source");
    const { output, messages } = fixAll(item.source, rule);
    assert.equal(output, item.output ?? item.source);

    // (a) it parses as TSX; (d) its JSX roots are bound; (e) no element repeats an attribute.
    const { parseErrors, unbound, duplicates } = inspect(output);
    assert.deepEqual(parseErrors, [], "the output parses");
    assert.deepEqual(unbound, [], "every JSX root is bound");
    assert.deepEqual(duplicates, [], "no attribute is written twice");
    // (g) it typechecks as well as the source did: no key twice, no member its object lacks.
    assert.deepEqual(addedTypeErrors(item.source, output), [], "the fix adds no TypeScript error");

    // (b) the rule reports only what the case expects to remain.
    const remaining = item.remaining ?? [];
    assert.equal(messages.length, remaining.length, messages.map((m) => m.message).join("; "));
    remaining.forEach((pattern, index) => assert.match(messages[index].message, pattern));
    if (!item.output)
      for (const message of messages)
        assert.equal(message.fix, undefined, "a report without a safe fix carries none");

    // (c) no rule of the product preset reports more after the fix than before it.
    const after = countByRule(verify(output, recommended));
    const was = countByRule(verify(item.source, recommended));
    for (const [ruleId, count] of Object.entries(after))
      assert.ok(
        count <= (was[ruleId] ?? 0),
        `${ruleId}: ${was[ruleId] ?? 0} before, ${count} after`,
      );

    // (f) a class fix changes whole tokens that held the deprecated class and nothing else: every
    // separator, and every other token, is byte-identical.
    if (item.rule === "no-deprecated-token") {
      const was = item.source.split(/(\s+)/);
      const now = output.split(/(\s+)/);
      assert.equal(now.length, was.length);
      now.forEach((part, index) => {
        if (index % 2 === 1 || part === was[index]) assert.equal(part, was[index]);
        else assert.equal(was[index].replace(from, to), part, "only the deprecated class changes");
      });
    }
  });

test("a deprecated token whose rewrite another rule would report is that rule's alone, never rewritten", () => {
  // Under dark:, the rewrite would be dark:${to}, which no-dark-variant reports; the class is
  // no-dark-variant's (classify), whose fix drops it, so the preset reports it once and fixes
  // nothing.
  const source = `export const A = () => <path className="dark:${from}" />;`;
  const messages = verify(source, recommended);
  assert.deepEqual(
    messages.map(({ ruleId, message }) => [ruleId, message]),
    [
      [
        "ledger/no-dark-variant",
        `"dark:${from}" uses the dark variant. The colour mode flips every token by itself: drop the class, and give a colour its token.`,
      ],
    ],
  );
  assert.equal(fixAll(source, recommended).output, source);
});

test("the deprecated token's message names the variant form it asks for", () => {
  const [message] = verify(
    `export const A = () => <path className="hover:${from}" />;`,
    withRules({ "ledger/no-deprecated-token": "error" }),
  );
  assert.equal(message.message, `"hover:${from}" is deprecated; use "hover:${to}".`);
});

/* ---------- the closure property ---------- */

test("closure: every deprecated token's replacement passes every Ledger class rule", () => {
  for (const entry of Object.values(deprecated))
    if (entry.replacementClass)
      assert.deepEqual(closureFailures(entry.replacementClass), [], entry.class);
});

test("closure: a proposed class passes every Ledger class rule, or is not offered", () => {
  // A class that fails names the one rule that owns it (classify).
  const cases = {
    "p-200": [],
    "bg-surface": [],
    "hover:!bg-surface": [],
    [to]: [],
    "grid-cols-[auto_minmax(0,1fr)]": [],
    "mt-200": ["no-margin"],
    "mt-[13px]": ["no-margin"],
    "mx-negative-200": ["no-margin"],
    "dark:bg-surface": ["no-dark-variant"],
    "bg-brand-bold/50": ["no-alpha-token"],
    "bg-brand/50": ["no-non-token-class"],
    rounded: ["no-static-design-value"],
    "w-[240px]": ["no-arbitrary-value"],
    "w-(--rail)": ["no-arbitrary-value"],
    [from]: ["no-deprecated-token"],
    [`dark:${from}`]: ["no-dark-variant"],
    "bg-surfce": ["no-non-token-class"],
    "p-200 w-full": ["one class"],
    // A variant Tailwind does not generate fails too, whatever its base.
    "hover:bg-surface": [],
    "group-hover/row:bg-surface": [],
    "@split:bg-surface": [],
    "hovr:bg-surface": ["no-unknown-variant"],
    "tablet:bg-surface": ["no-unknown-variant"],
    "2xl:bg-surface": ["no-unknown-variant"],
    "aria-expaned:bg-surface": ["no-unknown-variant"],
    "hovr:w-[240px]": ["no-unknown-variant"],
  };
  for (const [cls, failures] of Object.entries(cases)) {
    assert.deepEqual(closureFailures(cls), failures, cls);
    assert.equal(offerReplacement(cls), failures.length === 0, cls);
  }
});

test("closure: every fix a rule emits over the variant battery writes a class that passes", () => {
  const battery = ["", "hover:", "md:hover:", "!", "dark:", "group-hover:", "aria-selected:"];
  const rule = withRules({ "ledger/no-deprecated-token": "error" });
  for (const entry of Object.values(deprecated))
    for (const prefix of [...battery, "trailing"]) {
      const cls = prefix === "trailing" ? `${entry.class}!` : `${prefix}${entry.class}`;
      const source = `export const A = () => <path className="${cls}" />;`;
      const [message] = verify(source, rule);
      // A class under dark: is no-dark-variant's, whose fix drops it, so this rule says nothing.
      if (prefix === "dark:") {
        assert.equal(message, undefined, cls);
        assert.deepEqual(closureFailures(cls), ["no-dark-variant"], cls);
        continue;
      }
      assert.ok(message, cls);
      // The message asks only for a class that passes: never the rebuilt one a rule would reject.
      for (const [, asked] of message.message.matchAll(/use "([^"]+)"/g))
        assert.deepEqual(closureFailures(asked), [], `${cls}: ${message.message}`);
      const { output } = fixAll(source, rule);
      if (!message.fix) {
        assert.equal(output, source);
        assert.match(message.message, /no automatic fix is offered/, cls);
        continue;
      }
      const written = output.match(/className="([^"]*)"/)[1];
      assert.deepEqual(closureFailures(written), [], `${cls} → ${written}`);
    }
});

/* ---------- no-unknown-variant's suggestions ---------- */

/** Each editor suggestion a rule's reports carry, applied to the source one at a time. */
const suggested = (source, messages) =>
  messages.flatMap(({ suggestions = [] }) =>
    suggestions.map(
      ({ fix }) => source.slice(0, fix.range[0]) + fix.text + source.slice(fix.range[1]),
    ),
  );

test("closure: every suggestion no-unknown-variant offers over a battery writes a class that passes", () => {
  const variants = [
    "hovr:",
    "md:hovr:",
    "grp-hover:",
    "group-hovr/row:",
    "aria-expaned:",
    "focus-visble:",
  ];
  const bases = [
    "bg-surface",
    "!bg-surface",
    "bg-surface!",
    from,
    "bg-red-500",
    "w-[240px]",
    "mt-200",
    "dark:bg-surface",
    "bg-surfce",
  ];
  const rule = withRules({ "ledger/no-unknown-variant": "error" });
  let offered = 0;
  for (const variant of variants)
    for (const base of bases) {
      const cls = `${variant}${base}`;
      const source = `export const A = () => <div className="${cls}\n  w-full" />;`;
      const messages = verify(source, rule);
      for (const output of suggested(source, messages)) {
        offered += 1;
        // (a) it parses; (b) the written class passes every class rule, variant validity
        // included; (c) no rule of the product preset reports more; (f) only that class changed.
        assert.deepEqual(inspect(output).parseErrors, [], `${cls}: the output parses`);
        const written = output.match(/className="(\S+)/)[1];
        assert.deepEqual(closureFailures(written), [], `${cls} → ${written}`);
        assert.equal(output.replace(written, cls), source, `${cls}: only the class changes`);
        const after = countByRule(verify(output, recommended));
        const was = countByRule(verify(source, recommended));
        for (const [ruleId, count] of Object.entries(after))
          assert.ok(count <= (was[ruleId] ?? 0), `${cls} → ${written}: ${ruleId} reports more`);
      }
      assert.equal(fixAll(source, rule).output, source, `${cls}: a suggestion is never a --fix`);
    }
  assert.ok(offered >= 12, `only ${offered} suggestions were offered`);
});

test("no-unknown-variant offers no suggestion it cannot write in place, and names the spelling anyway", () => {
  const rule = withRules({ "ledger/no-unknown-variant": "error" });
  const cn = 'import { cn } from "@ledger/design-system/cn";';
  for (const source of [
    'export const A = () => <div className="hovr:bg-surface&#32;w-full" />;',
    'export const A = () => <div className={"hovr:bg-surface\\u0020w-full"} />;',
    `${cn} export const c = cn(\`hovr:bg-surface \${tone}\`);`,
    `${cn} export const c = (a: boolean, b: boolean) => cn({ "hovr:bg-surface": a, "hover:bg-surface": b });`,
    'type K = "hovr:bg-surface"; export const k: K = "hovr:bg-surface"; export const A = () => <div className={k} />;',
  ]) {
    const [message, ...rest] = verify(source, rule);
    assert.equal(rest.length, 0, source);
    assert.match(message.message, /Spell the variant "hover"\.$/, source);
    assert.equal(message.suggestions, undefined, source);
  }
});

/* ---------- a shadcn theme name's suggestions ---------- */

test("closure: every shadcn theme name offers each of its Ledger classes, which pass, and --fix applies none", () => {
  const rule = withRules({ "ledger/no-non-token-class": "error" });
  const { aliases } = lintValues();
  let offered = 0;
  for (const [name, entry] of Object.entries(aliases))
    for (const cls of [name, `hover:!${name}`]) {
      const source = `export const A = () => <div className="${cls}\n  w-full" />;`;
      const messages = verify(source, rule);
      assert.equal(messages.length, 1, `${cls}: ${messages.map((m) => m.message).join(" | ")}`);
      // One for each class the table names, unless the table says its class does another job.
      const outputs = suggested(source, messages);
      assert.equal(outputs.length, entry.suggest === false ? 0 : entry.use.length, cls);
      for (const output of outputs) {
        offered += 1;
        assert.deepEqual(inspect(output).parseErrors, [], `${cls}: the output parses`);
        const written = output.match(/className="(\S+)/)[1];
        assert.deepEqual(closureFailures(written), [], `${cls} → ${written}`);
        assert.equal(output.replace(written, cls), source, `${cls}: only the class changes`);
        const after = countByRule(verify(output, recommended));
        const was = countByRule(verify(source, recommended));
        for (const [ruleId, count] of Object.entries(after))
          assert.ok(count <= (was[ruleId] ?? 0), `${cls} → ${written}: ${ruleId} reports more`);
      }
      assert.equal(fixAll(source, rule).output, source, `${cls}: a suggestion is never a --fix`);
    }
  assert.ok(offered >= 2 * Object.keys(aliases).length, `only ${offered} suggestions were offered`);
});

test("closure: a theme name under a state its entry keys offers that state's class, which passes", () => {
  const rule = withRules({ "ledger/no-non-token-class": "error" });
  const { aliases } = lintValues();
  // A variant of each state the vocabulary keys, as a shadcn part writes it.
  const VARIANTS = { selected: "data-[state=on]:", placeholder: "placeholder:" };
  let offered = 0;
  for (const [name, entry] of Object.entries(aliases))
    for (const [state, cls] of Object.entries(entry.states ?? {})) {
      const written = `${VARIANTS[state]}${name}`;
      const source = `export const A = () => <div className="${written}\n  w-full" />;`;
      const outputs = suggested(source, verify(source, rule));
      assert.deepEqual(
        outputs,
        entry.suggest === false ? [] : [source.replace(written, `${VARIANTS[state]}${cls}`)],
        written,
      );
      for (const output of outputs) {
        offered += 1;
        assert.deepEqual(closureFailures(`${VARIANTS[state]}${cls}`), [], written);
        const after = countByRule(verify(output, recommended));
        const was = countByRule(verify(source, recommended));
        for (const [ruleId, count] of Object.entries(after))
          assert.ok(count <= (was[ruleId] ?? 0), `${written}: ${ruleId} reports more`);
      }
      assert.equal(
        fixAll(source, rule).output,
        source,
        `${written}: a suggestion is never a --fix`,
      );
    }
  assert.ok(offered >= 6, `only ${offered} state suggestions were offered`);
});

test("withVariants keeps the variants and where the important modifier stood", () => {
  const rebuild = (cls, base) => withVariants(classesOf(cls)[0], base);
  assert.equal(rebuild("hover:!bg-neutral", "bg-surface"), "hover:!bg-surface");
  assert.equal(rebuild("hover:bg-neutral!", "bg-surface"), "hover:bg-surface!");
  assert.equal(
    rebuild("[&>svg]:data-[open]:bg-neutral", "bg-surface"),
    "[&>svg]:data-[open]:bg-surface",
  );
  assert.equal(rebuild("bg-neutral", "bg-surface"), "bg-surface");
  assert.equal(rebuild("md:!bg-neutral!", "bg-surface"), "md:!bg-surface!");
});

test("replaceClassInSource returns null rather than a wrong edit", () => {
  const literal = (source) => {
    const linter = new Linter({ cwd: "/repo" });
    let found;
    linter.verify(
      source,
      [
        {
          languageOptions,
          files: ["**/*.tsx"],
          plugins: {
            probe: {
              rules: {
                literal: {
                  create: (context) => ({
                    Literal(node) {
                      if (typeof node.value === "string" && !found) found = { node, context };
                    },
                  }),
                },
              },
            },
          },
          rules: { "probe/literal": "error" },
        },
      ],
      { filename },
    );
    return (token, replacement) =>
      replaceClassInSource(found.node, found.context.sourceCode, token, replacement);
  };
  assert.equal(literal('<p className="a b" />;')("b", "c"), '"a c"');
  assert.equal(literal("<p className='a\tb' />;")("a", "c"), "'c\tb'");
  assert.equal(literal('<p className="ab" />;')("a", "c"), null, "whole tokens only");
  assert.equal(literal('<p className="a&#32;b" />;')("a", "c"), null, "an entity joins the tokens");
  // The value is "&amp; &": the raw "&amp;" is the class "&", not the class "&amp;".
  assert.equal(literal('<p className="&amp;amp; &amp;" />;')("&amp;", "c"), null, "look-alike");
  assert.equal(literal('<p className="[&>a]:b c" />;')("[&>a]:b", "x"), '"x c"', "no entity");
  assert.equal(literal('cn("a\\u0020b");')("a", "c"), null, "an escape");
  assert.equal(literal('cn("a b");')("x", "c"), null, "nothing matched");
});

test("suggestions: only the safe ones are offered, never an empty list, and --fix applies none", () => {
  const plugin = {
    rules: {
      probe: {
        meta: { type: "suggestion", hasSuggestions: true, schema: [] },
        create: (context) => ({
          JSXAttribute(node) {
            if (node.value?.type !== "Literal") return;
            context.report({
              node: node.value,
              message: "bg-surfce is not a token.",
              suggest: suggestionsFor(
                node.value,
                context,
                "bg-surfce",
                ["bg-surface", "mt-200"],
                (replacement) => `Replace "bg-surfce" with "${replacement}".`,
              ),
            });
          },
        }),
      },
    },
  };
  const config = withRules({ "probe/probe": "error" }, { probe: plugin });
  const source = 'export const A = () => <div className="bg-surfce\n  w-full" />;';
  const [message] = verify(source, config);
  assert.deepEqual(
    message.suggestions.map((suggestion) => suggestion.desc),
    ['Replace "bg-surfce" with "bg-surface".'],
    "mt-200 fails no-margin, so it is not offered",
  );
  const { fix } = message.suggestions[0];
  assert.equal(
    source.slice(0, fix.range[0]) + fix.text + source.slice(fix.range[1]),
    'export const A = () => <div className="bg-surface\n  w-full" />;',
  );
  assert.equal(fixAll(source, config).output, source, "a suggestion is never a --fix");
  const [joined] = verify(
    'export const A = () => <div className="bg-surfce&#32;w-full" />;',
    config,
  );
  assert.equal(joined.suggestions, undefined, "none, rather than an empty list");
});

/* ---------- what the class reader reads ---------- */

test("a destructured const is one slot, so the labels beside it are not read as classes", () => {
  const rules = withRules({
    "ledger/no-non-token-class": "error",
    "ledger/no-arbitrary-value": "error",
    "ledger/no-margin": "error",
  });
  assert.deepEqual(
    verify(
      `export const A = ({ ok }) => {
        const [dot, text, cls] = ok ? ["var(--ok)", "Connected", "items-center"] : ["var(--muted)", "Needs setup", "items-start"];
        return <span className={cls} style={{ color: dot }}>{text}</span>;
      };`,
      rules,
    ).map((message) => message.message),
    [],
  );
  assert.deepEqual(
    verify(
      `export const A = ({ ok }) => {
        const { Icon, colorCls } = ok ? { Icon: "x", colorCls: "flex" } : { Icon: "y", colorCls: "grid" };
        return <span className={colorCls} />;
      };`,
      rules,
    ).map((message) => message.message),
    [],
  );
  // The slot's own value is read, and its key is never misread as the class "k".
  assert.deepEqual(
    verify(
      'const { k } = { k: "mt-200" }; export const A = () => <div className={k} />;',
      rules,
    ).map((message) => message.message.match(/^"([^"]+)"/)?.[1]),
    ["mt-200"],
  );
  // A plain const is still read where it is used.
  assert.equal(
    verify('const k = "mt-200"; export const A = () => <div className={k} />;', rules).length,
    1,
  );
});

test("a grid template with no length in it is structure; one that names a length is arbitrary", () => {
  const admitted = [
    "grid-cols-[auto_1fr]",
    "grid-cols-[minmax(0,1fr)_auto]",
    "grid-cols-[auto_minmax(0,1fr)]",
    "grid-rows-[auto_1fr_auto]",
    "grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]",
    "grid-cols-[min-content_max-content]",
    "grid-cols-[subgrid]",
  ];
  const reported = [
    "grid-cols-[220px_minmax(0,1fr)]",
    "grid-cols-[120px_80px_minmax(0,1fr)_minmax(0,2fr)]",
    "grid-cols-[minmax(12rem,1fr)_auto]",
    "grid-cols-[repeat(3,1fr)]",
    "grid-cols-[auto_var(--w)]",
    "grid-cols-[subgrid_auto]",
    "w-[240px]",
  ];
  for (const base of admitted) {
    assert.equal(isArbitrary(base), false, base);
    assert.equal(isKnown(base), true, base);
  }
  for (const base of reported) assert.equal(isArbitrary(base), true, base);
  const rules = withRules({
    "ledger/no-arbitrary-value": "error",
    "ledger/no-non-token-class": "error",
  });
  assert.deepEqual(
    verify(
      'export const A = () => <div className="grid has-[>svg]:grid-cols-[auto_1fr] @3xl:grid-cols-[minmax(0,1fr)_auto]" />;',
      rules,
    ),
    [],
  );
  assert.equal(
    verify(
      'export const A = () => <div className="grid grid-cols-[220px_minmax(0,1fr)]" />;',
      rules,
    ).length,
    1,
  );
});

test("stories run the token rule at error, so a new story class fails CI", () => {
  const stories = ledger.configs.package.find((entry) => entry.files?.includes("src/stories/**"));
  const setting = stories.rules["ledger/no-non-token-class"];
  assert.equal(Array.isArray(setting) ? setting[0] : setting, "error");
});
