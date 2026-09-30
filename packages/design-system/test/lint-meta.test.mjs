// Every Ledger rule's metadata: what it is, where its page is, its words and the cases that reach
// them, and the preset that turns it on. A new rule fails here until it has all four.
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";

import ledger from "../eslint-plugin/index.js";
import { closureFailures, deprecated } from "../eslint-plugin/classes.js";
import { staleness } from "../eslint-plugin/data.js";
import { defineRule, withAllowance } from "../eslint-plugin/report.js";
import { REPO, forParser, loadCases, recordReports } from "./lint-helpers.mjs";

const rules = Object.entries(ledger.rules);
const cases = await loadCases();
const recorded = recordReports(cases);

/** The layout rules no preset turns on; a product that follows the contract turns them on itself. */
const OPT_IN = ["product-responsive-table", "product-line-tabs"];

/**
 * Message ids no source can reach with the tokens as they are, and the condition that keeps them
 * so. When the condition fails, the id is reachable and needs a case.
 */
const UNREACHABLE = {
  "no-deprecated-token": {
    // A deprecated token without a replacement the rule can ask for: none, or one another class
    // rule would report. Every one today has a replacement that passes them all.
    deprecated: () =>
      Object.values(deprecated).every(
        (entry) => entry.replacementClass && closureFailures(entry.replacementClass).length === 0,
      ),
  },
  // Lint data not built from today's inputs, which every rule that reads it reports once per
  // file; lint-data.test.mjs builds such copies.
  "no-arbitrary-value": { stale: () => staleness() === null },
  "no-non-token-class": { stale: () => staleness() === null },
  "no-unknown-variant": { stale: () => staleness() === null },
};

/** An allowance's own reports, which say the count rather than a finding's words (report.js). */
const ALLOWANCE = [
  / \(\d+ in this file; its allowance is \d+\)$/,
  /^\S+ is allowed \d+ reports? of \S+ and has \d+\. Lower its allowance to \d+/,
];

test("every rule says what kind of problem it is, what it reports and where its page is", () => {
  for (const [name, { meta }] of rules) {
    assert.ok(["problem", "suggestion", "layout"].includes(meta?.type), `${name}'s meta.type`);
    assert.ok(
      typeof meta.docs?.description === "string" && meta.docs.description.trim(),
      `${name} has no docs.description`,
    );
    const url = meta.docs.url;
    assert.ok(typeof url === "string" && url.startsWith("file:"), `${name}'s docs.url: ${url}`);
    assert.ok(fs.existsSync(fileURLToPath(url)), `${name}'s docs.url names no file: ${url}`);
  }
});

test("every rule keeps its words in meta.messages and reports each of them in some invalid case", () => {
  const problems = [];
  for (const [name, { meta }] of rules) {
    const ids = Object.keys(meta.messages ?? {});
    if (!ids.length) problems.push(`${name} has no meta.messages`);
    const reported = new Set(
      (recorded.get(name) ?? [])
        .filter(({ kind, messageId }) => kind === "invalid" && messageId)
        .map(({ messageId }) => messageId),
    );
    const exempt = UNREACHABLE[name] ?? {};
    for (const id of ids)
      if (exempt[id]) {
        if (!exempt[id]()) problems.push(`${name}'s "${id}" can be reached now: give it a case`);
      } else if (!reported.has(id)) problems.push(`${name} has no invalid case for "${id}"`);
    for (const id of Object.keys(exempt))
      if (!ids.includes(id)) problems.push(`${name} has no "${id}" to exempt; drop it`);
  }
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("every report goes by message id, except an allowance's count", () => {
  for (const [name, reports] of recorded)
    for (const { messageId, message, code } of reports)
      if (!messageId)
        assert.ok(
          ALLOWANCE.some((pattern) => pattern.test(message ?? "")),
          `${name} reported "${message}" without a message id, in ${code}`,
        );
});

test("every rule is on in a preset, or is one of the opt-in layout rules", () => {
  const on = (preset) =>
    new Set(
      ledger.configs[preset].flatMap((entry) =>
        Object.entries(entry.rules ?? {})
          .filter(([, setting]) => ![0, "off"].includes([setting].flat()[0]))
          .map(([rule]) => rule),
      ),
    );
  const presets = { package: on("package"), recommended: on("recommended") };
  for (const [preset, names] of Object.entries(presets))
    for (const rule of names)
      if (rule.startsWith("ledger/"))
        assert.ok(rule.slice(7) in ledger.rules, `${preset} turns on ${rule}, which is no rule`);
  for (const [name] of rules) {
    const presetsWith = Object.keys(presets).filter((preset) =>
      presets[preset].has(`ledger/${name}`),
    );
    if (OPT_IN.includes(name))
      assert.deepEqual(presetsWith, [], `${name} is opt-in, and ${presetsWith} turns it on`);
    else assert.ok(presetsWith.length, `ledger/${name} is in no preset and not in OPT_IN`);
  }
  for (const name of OPT_IN) assert.ok(name in ledger.rules, `OPT_IN names ${name}, no rule`);
});

test("every rule has a case file with valid and invalid cases, and every case file is a rule's", () => {
  assert.deepEqual([...cases.keys()].sort(), Object.keys(ledger.rules).sort());
  for (const [name, { valid, invalid }] of cases) {
    assert.ok(valid.length >= 2, `${name} has ${valid.length} valid cases; it takes two or more`);
    assert.ok(
      invalid.length >= 2,
      `${name} has ${invalid.length} invalid cases; it takes two or more`,
    );
  }
});

/* ---------- the note, and the words a report may carry ---------- */

test("every template of every rule ends with {{note}}", () => {
  const problems = [];
  for (const [name, { meta }] of rules)
    for (const [id, template] of Object.entries(meta.messages ?? {}))
      if (!template.endsWith("{{note}}"))
        problems.push(`${name}'s "${id}" does not end with {{note}}`);
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("every rule ends its findings with its note option", () => {
  const problems = [];
  for (const [name] of rules) {
    // The first invalid case that sets no allowance and no note of its own.
    const item = forParser(cases.get(name), "typescript").invalid.find(
      ({ options, settings }) =>
        !options?.[0]?.allow && options?.[0]?.note === undefined && !settings?.ledger?.note,
    );
    if (!item) {
      problems.push(`${name} has no invalid case without an allowance or a note to try it on`);
      continue;
    }
    const options = [{ ...item.options?.[0], note: "N." }];
    const messages = new Linter({ cwd: REPO })
      .verify(
        item.code,
        {
          files: ["**/*.{ts,tsx}"],
          languageOptions: {
            parser: tseslint.parser,
            parserOptions: { ecmaFeatures: { jsx: true } },
          },
          plugins: { ledger },
          linterOptions: { reportUnusedDisableDirectives: "off" },
          settings: item.settings ?? {},
          rules: { [`ledger/${name}`]: ["error", ...options] },
        },
        { filename: item.filename },
      )
      .filter(({ ruleId }) => ruleId === `ledger/${name}`);
    if (!messages.length) problems.push(`${name} reports nothing on ${item.code} with a note`);
    for (const { message } of messages)
      if (!message.endsWith(" N.")) problems.push(`${name} drops its note: ${message}`);
  }
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

/** The plugin's rule files: every file in eslint-plugin/ but report.js, whose allowance reports
    say a count rather than a finding. */
const RULE_FILES = fs
  .readdirSync(new URL("../eslint-plugin/", import.meta.url))
  .filter((file) => file.endsWith(".js") && file !== "report.js");

/** Every node under an ESTree node, itself included. */
function* nodes(node) {
  if (!node || typeof node.type !== "string") return;
  yield node;
  for (const [key, value] of Object.entries(node))
    if (key !== "parent")
      for (const child of [value].flat())
        if (child && typeof child === "object") yield* nodes(child);
}

test("no rule file reports words that are not in meta.messages", () => {
  const problems = [];
  for (const file of RULE_FILES) {
    const source = fs.readFileSync(new URL(`../eslint-plugin/${file}`, import.meta.url), "utf8");
    const { ast } = tseslint.parser.parseForESLint(source, {
      sourceType: "module",
      ecmaVersion: "latest",
      loc: true,
    });
    for (const node of nodes(ast)) {
      if (node.type !== "CallExpression") continue;
      const callee = node.callee.type === "MemberExpression" ? node.callee.property : node.callee;
      if (callee.name !== "report") continue;
      const [first, ...rest] = node.arguments;
      const keyed = (object, key) =>
        object?.type === "ObjectExpression" &&
        object.properties.some(({ key: name }) => (name?.name ?? name?.value) === key);
      // `report({ message })`, a suggestion's `desc`, or the positional `report(node, "words")`.
      const words =
        keyed(first, "message") ||
        (first?.type === "ObjectExpression" &&
          first.properties.some(
            ({ key, value }) =>
              key?.name === "suggest" &&
              value?.type === "ArrayExpression" &&
              value.elements.some((element) => keyed(element, "desc")),
          )) ||
        rest.some(({ type }) => type === "Literal" || type === "TemplateLiteral");
      if (words)
        problems.push(`eslint-plugin/${file}:${node.loc.start.line} reports words, not an id`);
    }
  }
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

/** A rule made as the plugin makes its rules, reporting one margin through `reportWith`. */
const probeRule = (reportWith) =>
  withAllowance(
    defineRule("no-margin", {
      description: "A probe.",
      hasSuggestions: true,
      messages: {
        margin: '"{{cls}}" is a margin.{{note}}',
        useSpace: 'Use Stack space instead of "{{cls}}".{{note}}',
      },
      create: (context) => ({
        JSXAttribute(node) {
          if (node.name.name === "className") reportWith(context, node);
        },
      }),
    }),
  );
const lintProbe = (rule, code, options = {}) =>
  new Linter({ cwd: "/repo" }).verify(
    code,
    {
      files: ["**/*.tsx"],
      languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { probe: { rules: { rule } } },
      rules: { "probe/rule": ["error", options] },
    },
    { filename: "/repo/src/screen.tsx" },
  );

test("a report without a message id throws, so its words cannot miss the note and the snapshot", () => {
  const plain = probeRule((context, node) => context.report({ node, message: "A plain message." }));
  assert.throws(() => lintProbe(plain, '<div className="mt-200" />'), /without a message id/);
  const positional = probeRule((context, node) => context.report(node, "A plain message."));
  assert.throws(() => lintProbe(positional, '<div className="mt-200" />'), /without a message id/);
});

test("a suggestion by message id renders with no note, and keeps it over an allowance", () => {
  const suggesting = probeRule((context, node) =>
    context.report({
      node,
      messageId: "margin",
      data: { cls: "mt-200" },
      suggest: [
        { messageId: "useSpace", data: { cls: "mt-200" }, fix: (fixer) => fixer.remove(node) },
      ],
    }),
  );
  const [finding] = lintProbe(suggesting, '<div className="mt-200" />', {
    note: "In this app: Stack.",
  });
  assert.equal(finding.message, '"mt-200" is a margin. In this app: Stack.');
  assert.equal(finding.suggestions?.[0]?.desc, 'Use Stack space instead of "mt-200".');
  const over = lintProbe(suggesting, '<><div className="mt-200" /><div className="mt-200" /></>', {
    note: "In this app: Stack.",
    allow: { "src/screen.tsx": 1 },
  });
  assert.equal(over.length, 2);
  for (const { message, suggestions } of over) {
    assert.equal(
      message,
      '"mt-200" is a margin. In this app: Stack. (2 in this file; its allowance is 1)',
    );
    assert.equal(suggestions?.[0]?.desc, 'Use Stack space instead of "mt-200".');
  }
});
