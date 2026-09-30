import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Linter } from "eslint";
import ts from "typescript";
import tseslint from "typescript-eslint";

import plugin from "../eslint-plugin/index.js";
import {
  EXAMPLE_KINDS,
  SECTIONS,
  docsDir,
  fromShadcnPath,
  lintPagePath,
  proseToMdx,
  readAliases,
  readPages,
  referencePath,
  renderFromShadcn,
  renderLintPage,
  renderReference,
} from "../build/lint-docs.mjs";

// The Guidance/Lint rules page holds the one table of the rules; it must say what the plugin does.
const page = fs.readFileSync(new URL("../src/stories/docs/Lint.mdx", import.meta.url), "utf8");
const rows = new Map(
  page
    .split("\n")
    .filter((line) => /^\|\s*`[a-z-]+`\s*\|/.test(line))
    .map((line) => {
      // A cell may hold an escaped pipe (`\|`), which is text, not a column.
      const cells = line
        .split(/(?<!\\)\|/)
        .slice(1, -1)
        .map((cell) => cell.trim());
      // A cell's footnote marks (¹ to ⁹) are the page's own; the severity is the word before them.
      const severity = (cell) => cell.replace(/[¹²³⁴-⁹]/g, "").trim();
      return [
        cells[0].replaceAll("`", ""),
        { package: severity(cells[3]), recommended: severity(cells[4]) },
      ];
    }),
);

/** A preset's own setting for a rule: its first, unscoped entry, as a word. */
const presetSeverity = (preset, rule) => {
  const entries = plugin.configs[preset];
  const base = (Array.isArray(entries) ? entries : [entries]).find((entry) => !entry.files);
  const setting = base?.rules?.[`ledger/${rule}`] ?? "off";
  const word = Array.isArray(setting) ? setting[0] : setting;
  return { 0: "off", 1: "warn", 2: "error" }[word] ?? word;
};

test("every rule the plugin ships has a row on the Lint rules page", () => {
  for (const rule of Object.keys(plugin.rules))
    assert.ok(rows.has(rule), `Lint.mdx has no row for ledger/${rule}`);
});

test("every row on the Lint rules page names a rule the plugin ships", () => {
  for (const rule of rows.keys())
    assert.ok(
      rule in plugin.rules,
      `Lint.mdx lists ledger/${rule}, which the plugin does not ship`,
    );
});

test("the page's preset columns match the presets", () => {
  for (const [rule, documented] of rows) {
    for (const preset of ["package", "recommended"])
      assert.equal(
        documented[preset],
        presetSeverity(preset, rule),
        `ledger/${rule} in ${preset}: the page says ${documented[preset]}`,
      );
  }
});

/* ---------- each rule's page: eslint-plugin/docs/<rule>.md ---------- */

const pages = readPages();
const rules = Object.keys(plugin.rules);

test("every rule the plugin ships has a page, and every page is a rule's", () => {
  const missing = rules.filter((rule) => !pages.has(rule));
  assert.deepEqual(missing, [], `eslint-plugin/docs has no page for ${missing.join(", ")}`);
  for (const name of pages.keys())
    assert.ok(
      name in plugin.rules,
      `eslint-plugin/docs/${name}.md is for no rule the plugin ships`,
    );
});

test("each page has its title, a summary and the seven sections in order", () => {
  for (const [rule, { title, summary, sections, examples, file }] of pages) {
    const where = path.relative(docsDir, file);
    assert.equal(title, `ledger/${rule}`, `${where} is titled "# ${title}"`);
    assert.ok(summary && !summary.includes("\n\n"), `${where} needs one summary sentence`);
    assert.deepEqual(
      sections.map(({ heading }) => heading),
      SECTIONS,
      `${where}'s sections are not ${SECTIONS.join(", ")}, in that order`,
    );
    const examplesSection = sections.find(({ heading }) => heading === "Examples");
    assert.deepEqual(
      examplesSection.subsections,
      EXAMPLE_KINDS,
      `${where}'s Examples holds ${EXAMPLE_KINDS.join(" then ")}`,
    );
    // Every fence in Examples is an example: it says `reported` or `allowed`.
    const fences = examplesSection.body
      .split("\n")
      .filter((line) => /^\s*(`{3,}|~{3,})/.test(line));
    assert.equal(
      fences.length / 2,
      examples.filter(({ section }) => section === "Examples").length,
      `${where} has a code block under Examples that is neither reported nor allowed`,
    );
    for (const kind of EXAMPLE_KINDS) {
      const found = examples.filter((example) => example.kind === kind.toLowerCase());
      assert.ok(
        found.length >= 2 && found.length <= 4,
        `${where} has ${found.length} ${kind.toLowerCase()} examples; it takes 2 to 4`,
      );
      for (const example of found)
        assert.equal(
          example.subsection,
          kind,
          `${where}:${example.line} is a ${example.kind} example under ${example.subsection}`,
        );
    }
  }
});

/* ---------- the examples, linted as a product or the kit lints them ---------- */

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = path.resolve(packageRoot, "../..");
const typescript = {
  files: ["**/*.{ts,tsx}"],
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
};
// The layout rules no preset turns on, on as this repository's product files have them.
const OPT_IN = ["product-responsive-table", "product-line-tabs"];

/**
 * An example as its path says: at a product path (the default) under `configs.recommended` with
 * the opt-in rules on, and at a path in the package (`path=packages/design-system/src/…`) under
 * `configs.package`, as the package's own lint runs it.
 */
function lintExample({ code, path: at = "src/components/prototype/example.tsx" }) {
  const inKit = at.startsWith("packages/design-system/");
  const config = inKit
    ? [
        typescript,
        ...plugin.configs.package.map((entry) => ({ files: ["src/**/*.{ts,tsx}"], ...entry })),
      ]
    : [
        typescript,
        ...plugin.configs.recommended,
        { rules: Object.fromEntries(OPT_IN.map((rule) => [`ledger/${rule}`, "error"])) },
      ];
  return new Linter({ cwd: inKit ? packageRoot : repoRoot }).verify(code, config, {
    filename: path.join(repoRoot, at),
  });
}

// A class has one owner (classify in classes.js), so a reported example is reported by its rule
// and by no other, and an allowed one by no rule at all.
test("every reported example is reported by its rule alone, and every allowed one by no rule", () => {
  const problems = [];
  for (const [rule, { examples, file }] of pages)
    for (const example of examples) {
      const where = `${path.relative(docsDir, file)}:${example.line}`;
      const messages = lintExample(example);
      const fatal = messages.find((message) => message.fatal);
      if (fatal) {
        problems.push(`${where} does not parse: ${fatal.message}`);
        continue;
      }
      const ledger = messages.filter((message) => message.ruleId?.startsWith("ledger/"));
      const others = ledger.filter(({ ruleId }) => ruleId !== `ledger/${rule}`);
      const said = (list) => list.map(({ ruleId, message }) => `${ruleId}: ${message}`).join("; ");
      if (example.kind === "allowed") {
        if (ledger.length) problems.push(`${where} is allowed, and reported by ${said(ledger)}`);
      } else if (others.length) problems.push(`${where} is also reported by ${said(others)}`);
      else if (!ledger.length) problems.push(`${where} is not reported by ledger/${rule}`);
    }
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

/**
 * Every allowed example compiled as the application compiles its files (the root tsconfig, which
 * reads the kit's source), each as a module at the path it is linted at, so the right code on a
 * page is code that builds: a prop a part does not take fails here. A reported example may not
 * compile, since it can show a removed name or a part used wrongly.
 */
test("every allowed example compiles against the kit", () => {
  const { config } = ts.readConfigFile(path.join(repoRoot, "tsconfig.json"), ts.sys.readFile);
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, repoRoot);
  const examples = new Map();
  for (const [rule, { examples: list, file }] of pages)
    list
      .filter(({ kind }) => kind === "allowed")
      .forEach(({ code, line, path: at = "src/components/prototype/example.tsx" }, index) =>
        examples.set(path.join(repoRoot, path.dirname(at), `lint-example-${rule}-${index}.tsx`), {
          code,
          where: `${path.relative(docsDir, file)}:${line}`,
        }),
      );
  const host = ts.createCompilerHost(options);
  const { fileExists, readFile, getSourceFile } = host;
  host.fileExists = (name) => examples.has(name) || fileExists.call(host, name);
  host.readFile = (name) => examples.get(name)?.code ?? readFile.call(host, name);
  host.getSourceFile = (name, language, ...rest) =>
    examples.has(name)
      ? ts.createSourceFile(name, examples.get(name).code, language, true)
      : getSourceFile.call(host, name, language, ...rest);
  const program = ts.createProgram(
    [...examples.keys()],
    { ...options, noEmit: true, moduleDetection: ts.ModuleDetectionKind.Force },
    host,
  );
  const problems = ts
    .getPreEmitDiagnostics(program)
    .filter(({ file }) => file && examples.has(file.fileName))
    .map(({ file, start, messageText }) => {
      const { line } = file.getLineAndCharacterOfPosition(start ?? 0);
      const { where } = examples.get(file.fileName);
      return `${where} (line ${line + 1} of the example): ${ts.flattenDiagnosticMessageText(messageText, " ")}`;
    });
  assert.ok(examples.size > 50, `only ${examples.size} allowed examples were found`);
  assert.deepEqual(problems, [], `\n${problems.join("\n")}`);
});

test("every rule's meta.docs.url is its page", () => {
  for (const rule of rules) {
    const url = plugin.rules[rule].meta?.docs?.url;
    assert.equal(url, pathToFileURL(path.join(docsDir, `${rule}.md`)).href, `ledger/${rule}'s url`);
    assert.ok(fs.existsSync(fileURLToPath(url)), `ledger/${rule}'s url names no file: ${url}`);
  }
});

test("the package's AGENTS.md sends a finding's reader to the rule's page", () => {
  const agents = fs.readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");
  assert.ok(agents.includes("eslint-plugin/docs/"), "AGENTS.md does not name eslint-plugin/docs/");
});

test("the Lint rules table and the reference are what the pages generate", () => {
  assert.equal(
    fs.readFileSync(lintPagePath, "utf8"),
    renderLintPage(fs.readFileSync(lintPagePath, "utf8"), pages),
    "Lint.mdx's rule rows have drifted from eslint-plugin/docs; run `npm run build:lint`",
  );
  const reference = fs.readFileSync(referencePath, "utf8");
  assert.equal(
    reference,
    renderReference(pages),
    "LintRules.mdx has drifted from eslint-plugin/docs; run `npm run build:lint`",
  );
  for (const rule of rules)
    assert.ok(
      reference.includes(`\n## ledger/${rule}\n`),
      `LintRules.mdx has no section for ${rule}`,
    );
});

test("the Coming from shadcn page's theme names are the lint's, one row each", () => {
  const source = fs.readFileSync(fromShadcnPath, "utf8");
  const aliases = readAliases();
  assert.equal(
    source,
    renderFromShadcn(source, aliases),
    "FromShadcn.mdx's theme names have drifted from build/vocabulary-aliases.json; run `npm run build:tokens`, then `npm run build:lint`",
  );
  const named = source
    .split("\n")
    .map((line) => /^\| `([a-z0-9-]+)` \| [A-Z]/.exec(line)?.[1])
    .filter(Boolean);
  assert.deepEqual(named, Object.keys(aliases));
  // Ledger's own border-input is no theme name, and the page no longer says it is missing.
  assert.ok(!named.includes("border-input"));
  assert.doesNotMatch(source, /no `bg-background`, `text-muted-foreground`, `border-input`/);
});

test("a page's prose reaches the Storybook as MDX that reads the same", () => {
  assert.equal(
    proseToMdx("A <Stack> takes {space}; `<Stack space={x}>` and `` `mt-${size}` `` stay code."),
    "A \\<Stack> takes \\{space\\}; `<Stack space={x}>` and `` `mt-${size}` `` stay code.",
  );
  // Another rule's page is its section, a Storybook page its path, a repository file its path.
  assert.equal(
    proseToMdx(
      "[`ledger/no-margin`](no-margin.md), [Dialog](../../src/stories/components/Dialog.mdx)",
    ),
    "[`ledger/no-margin`](#ledgerno-margin), [Dialog](?path=/docs/components-dialog--docs)",
  );
  assert.equal(
    proseToMdx("[the product patterns](../../../../docs/guides/product-patterns.md#tabs)"),
    "the product patterns (`docs/guides/product-patterns.md`)",
  );
  assert.equal(
    proseToMdx("[`ledger/no-margin`](no-margin.md)", { inPage: false }),
    "[`ledger/no-margin`](?path=/docs/guidance-lint-rules-reference--docs#ledgerno-margin)",
  );
});
