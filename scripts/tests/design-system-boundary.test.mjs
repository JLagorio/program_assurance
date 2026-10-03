import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import test from "node:test";
import ts from "typescript";
import tseslint from "typescript-eslint";

import {
  ledgerRules,
  namesNoRule,
  readDirective,
} from "../../packages/design-system/eslint-plugin/config-rules.js";
import ledger from "../../packages/design-system/eslint-plugin/index.js";

const cwd = fileURLToPath(new URL("../../", import.meta.url));
const eslint = new ESLint({ cwd });

// Source the lint does not read: the look-only reference kits and their samples.
const IGNORED_DIRECTORIES = ["src/components/examples", "src/components/reui", "src/components/ui"];
// Source that renders nothing: the generated route tree and the server and start entries.
const NOT_UI = ["src/routeTree.gen.ts", "src/server.ts", "src/start.ts"];

/** Every script or component source under src, relative to the repository: .ts and .tsx, and
    the .mts, .cts, .js, .jsx and .mjs a component could also be written in. */
async function sourceFiles(directory = resolve(cwd, "src"), out = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await sourceFiles(path, out);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) out.push(relative(cwd, path));
  }
  return out;
}

// What the root config holds a screen to: the recommended preset, and the three rules the product
// block adds. The product runs every one of them at error.
const PRODUCT_RULES = [
  ...new Set([
    ...ledger.configs.recommended.flatMap((entry) => Object.keys(entry.rules ?? {})),
    "ledger/product-responsive-table",
    "ledger/product-line-tabs",
    "ledger/use-primitives",
  ]),
];
const atError = (setting) => [2, "error"].includes(Array.isArray(setting) ? setting[0] : setting);

/**
 * The product's ledger rules that the root config leaves below error for a file, or undefined when
 * ESLint does not read the file. An empty list is a file every rule reads; a later config block
 * that turns any of them off or down for a folder shows here.
 */
async function ledgerGaps(file) {
  if (await eslint.isPathIgnored(resolve(cwd, file))) return undefined;
  const rules = (await eslint.calculateConfigForFile(resolve(cwd, file))).rules ?? {};
  return PRODUCT_RULES.filter((name) => !atError(rules[name]));
}
/** Whether ESLint reads a file with any ledger rule on. */
const ledgerScoped = async (file) => {
  const gaps = await ledgerGaps(file);
  return gaps === undefined ? undefined : gaps.length < PRODUCT_RULES.length;
};

/**
 * The inline directives in a file that change what a ledger rule sees: any that name one, reasoned
 * or not, and any disable that names no rule and so turns every rule off.
 */
function inlineLedgerDirectives(text, filePath) {
  if (!text.includes("eslint")) return [];
  const { ast } = tseslint.parser.parseForESLint(text, {
    filePath,
    ecmaFeatures: { jsx: /\.[jt]sx$/.test(filePath) },
    loc: true,
    range: true,
  });
  const found = [];
  for (const comment of ast.comments) {
    const directive = readDirective(comment);
    if (!directive) continue;
    const names = ledgerRules(directive).map((rule) => rule.name);
    if (names.length) found.push(`${comment.loc.start.line}: ${names.join(", ")}`);
    else if (namesNoRule(directive)) found.push(`${comment.loc.start.line}: every rule`);
  }
  return found;
}

function directPanelReferences(text, filePath) {
  const source = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const shells = new Set();
  const namespaces = new Set();
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "@ledger/design-system"
    )
      continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamespaceImport(bindings)) namespaces.add(bindings.name.text);
    if (bindings && ts.isNamedImports(bindings))
      for (const binding of bindings.elements)
        if ((binding.propertyName ?? binding.name).text === "Shell") shells.add(binding.name.text);
  }
  const isShell = (node) =>
    (ts.isIdentifier(node) && shells.has(node.text)) ||
    (ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      namespaces.has(node.expression.text) &&
      node.name.text === "Shell");
  const violations = [];
  const visit = (node) => {
    if (
      (ts.isPropertyAccessExpression(node) &&
        node.name.text === "Panel" &&
        isShell(node.expression)) ||
      (ts.isVariableDeclaration(node) &&
        node.initializer &&
        isShell(node.initializer) &&
        ts.isObjectBindingPattern(node.name) &&
        node.name.elements.some(
          (binding) => (binding.propertyName ?? binding.name).getText(source) === "Panel",
        ))
    )
      violations.push(source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return violations;
}

test("the preview boundary recognizes imported aliases without rejecting other Shell slots", () => {
  for (const source of [
    'import { Shell } from "@ledger/design-system"; const view = <Shell.Panel />;',
    'import { Shell as Layout } from "@ledger/design-system"; const view = <Layout.Panel.Body />;',
    'import * as Ledger from "@ledger/design-system"; const Preview = Ledger.Shell.Panel;',
    'import { Shell } from "@ledger/design-system"; const { Panel: Preview } = Shell;',
  ])
    assert.equal(directPanelReferences(source, "screen.tsx").length, 1);
  assert.deepEqual(
    directPanelReferences(
      'import { Shell } from "@ledger/design-system"; const view = <Shell.Main><Shell.Aside /></Shell.Main>;',
      "screen.tsx",
    ),
    [],
  );
});

test("application panels go through the shared record preview host", async () => {
  const root = resolve(cwd, "src");
  const violations = [];
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.[jt]sx?$/.test(entry.name) && !/\.(test|types)\.[jt]sx?$/.test(entry.name)) {
        const file = relative(cwd, path);
        if (file === "src/components/prototype/record-preview.tsx") continue;
        for (const line of directPanelReferences(await readFile(path, "utf8"), file))
          violations.push(`${file}:${line}`);
      }
    }
  };
  await walk(root);
  assert.deepEqual(
    violations,
    [],
    "Use RecordPreviewPanel so global navigation and record headers stay separate",
  );
});

test("active application layers reject copied kit parts and arbitrary styling", async () => {
  const source = 'export function PageHeader() { return <div className="w-[137px]" />; }';
  for (const filePath of [
    "src/routes/vendors.tsx",
    "src/components/app/record-browser.tsx",
    "src/components/prototype/program-shared.tsx",
    "src/components/prototype/create-task-dialog.tsx",
  ]) {
    const [result] = await eslint.lintText(source, { filePath });
    for (const ruleId of ["ledger/no-kit-shadow", "ledger/no-arbitrary-value"]) {
      assert.ok(
        result.messages.some((message) => message.ruleId === ruleId && message.severity === 2),
        `${filePath} must reject ${ruleId}`,
      );
    }
  }
});

test("prototype screens can compose public kit parts without shadowing them", async () => {
  const [result] = await eslint.lintText(
    'import { PageHeader } from "@ledger/design-system";\nexport function Screen() { return <PageHeader><PageHeader.Title>Records</PageHeader.Title></PageHeader>; }',
    { filePath: "src/components/prototype/program-shared.tsx" },
  );
  assert.deepEqual(
    result.messages.filter((message) => message.ruleId?.startsWith("ledger/")),
    [],
  );
});

test("product composition errors are enforced on routes and shared feature code", async () => {
  const source = `import { TextLink, DialogFooter, Button } from "@ledger/design-system";
    export function Screen() {
      window.confirm("Discard?");
      return <><TextLink render={<button />}>Open</TextLink><DialogFooter><Button variant="primary">Create task</Button><Button>Cancel</Button></DialogFooter></>;
    }`;
  for (const filePath of [
    "src/routes/vendors.tsx",
    "src/components/prototype/create-task-dialog.tsx",
  ]) {
    const [result] = await eslint.lintText(source, { filePath });
    for (const ruleId of [
      "ledger/no-native-confirm",
      "ledger/text-link-navigation",
      "ledger/dialog-footer-order",
    ])
      assert.ok(
        result.messages.some((message) => message.ruleId === ruleId && message.severity === 2),
        `${filePath}: ${ruleId}`,
      );
  }
});

test("product table and tab policies apply to all application UI layers", async () => {
  const source = `import { DataTable as Records, TabsList as Views } from "@ledger/design-system";
    export function Screen() { return <><Records responsive={false} /><Views variant="line" className="flex-wrap" /></>; }`;
  for (const filePath of [
    "src/routes/vendors.tsx",
    "src/components/app/record-browser.tsx",
    "src/components/prototype/program-shared.tsx",
  ]) {
    const [result] = await eslint.lintText(source, { filePath });
    for (const ruleId of ["ledger/product-responsive-table", "ledger/product-line-tabs"])
      assert.ok(
        result.messages.some((message) => message.ruleId === ruleId && message.severity === 2),
        `${filePath}: ${ruleId}`,
      );
  }
  const [valid] = await eslint.lintText(
    `import { DataTable, TabsList } from "@ledger/design-system";
     export function Screen() { return <><DataTable responsive /><TabsList variant="line" /></>; }`,
    { filePath: "src/components/prototype/program-shared.tsx" },
  );
  assert.deepEqual(
    valid.messages.filter((message) => message.ruleId?.startsWith("ledger/")),
    [],
  );
});

test("the inline directive check finds every way a comment switches a ledger rule off", () => {
  const screen = 'export const A = () => <div className="mt-200" />;';
  for (const source of [
    `// eslint-disable-next-line ledger/no-margin\n${screen}`,
    `// eslint-disable-next-line ledger/no-margin -- Overlap is the geometry.\n${screen}`,
    `/* eslint ledger/no-margin: "off" */\n${screen}`,
    `/* eslint-disable ledger/no-margin */\n${screen}`,
    `/* eslint-disable */\n${screen}`,
    `${screen} // eslint-disable-line`,
    // A list of only commas or empty quotes names no rule, so ESLint turns every rule off.
    `// eslint-disable-next-line ,\n${screen}`,
    `// eslint-disable-next-line , -- fine\n${screen}`,
    `/* eslint-disable "" */\n${screen}`,
    `${screen} // eslint-disable-line ''`,
    // ESLint decodes a configuration key before it looks the rule up.
    `/* eslint "ledger\\u002fno-margin": "off" */\n${screen}`,
    `/* eslint "ledger\\/no-margin": "off" */\n${screen}`,
    `/* eslint 'ledger/no\\-margin': 0 */\n${screen}`,
  ])
    assert.equal(inlineLedgerDirectives(source, "screen.tsx").length, 1, source);
  for (const source of [
    `// eslint-disable-next-line react-hooks/exhaustive-deps\n${screen}`,
    `import { Button } from "@ledger/design-system"; // eslint names no rule here\n${screen}`,
    `export const note = "/* eslint ledger/no-margin: off */";`,
  ])
    assert.deepEqual(inlineLedgerDirectives(source, "screen.tsx"), [], source);
});

test("product files keep no ledger rule off inline", async () => {
  const found = [];
  for (const file of await sourceFiles()) {
    if (!(await ledgerScoped(file))) continue;
    for (const directive of inlineLedgerDirectives(
      await readFile(resolve(cwd, file), "utf8"),
      file,
    ))
      found.push(`${file}:${directive}`);
  }
  assert.deepEqual(
    found,
    [],
    "Fix what the ledger rule reports: product code keeps no configuration or disable of a ledger rule inline",
  );
});

test("every source file gets every ledger rule at error, is a lint-ignored reference kit, or renders nothing", async () => {
  const unscoped = [];
  for (const file of await sourceFiles()) {
    const gaps = await ledgerGaps(file);
    if (gaps === undefined) {
      if (!IGNORED_DIRECTORIES.some((directory) => file.startsWith(`${directory}/`)))
        unscoped.push(`${file}: the lint ignores it`);
    } else if (NOT_UI.includes(file)) {
      if (gaps.length < PRODUCT_RULES.length) unscoped.push(`${file}: listed as not UI`);
    } else if (gaps.length === PRODUCT_RULES.length) unscoped.push(`${file}: no ledger rules`);
    else if (gaps.length) unscoped.push(`${file}: ${gaps.join(", ")} below error`);
  }
  assert.deepEqual(
    unscoped,
    [],
    "Add a new source directory to PRODUCT in eslint.config.js, or list it here with why the ledger rules do not read it. A .mts, .cts, .js, .jsx or .mjs file is outside the product lint: write it as .ts or .tsx. A config block may not turn a ledger rule off or down for product files.",
  );
});

test("the scope check sees a file the lint ignores or reads with fewer rules", async () => {
  // A component in another extension: ESLint finds no config for it, or reads it with no ledger rule.
  for (const file of ["src/components/prototype/evil.mts", "src/components/prototype/evil.jsx"])
    assert.equal(await ledgerGaps(file), undefined, file);
  assert.equal(
    (await ledgerGaps("src/components/prototype/evil.mjs"))?.length,
    PRODUCT_RULES.length,
  );
  // A later block that turns rules off for one folder, as a change to eslint.config.js could add.
  const { default: config } = await import(new URL("../../eslint.config.js", import.meta.url));
  const loosened = new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: [
      ...config,
      {
        files: ["src/components/prototype/legacy/**"],
        rules: { "ledger/no-margin": "off", "ledger/no-arbitrary-value": "warn" },
      },
    ],
  });
  const rules =
    (await loosened.calculateConfigForFile(resolve(cwd, "src/components/prototype/legacy/a.tsx")))
      .rules ?? {};
  assert.deepEqual(
    PRODUCT_RULES.filter((name) => !atError(rules[name])),
    ["ledger/no-arbitrary-value", "ledger/no-margin"],
  );
});

test("every lint-ignored directory under src/components is closed to product imports", async () => {
  const { default: config } = await import(new URL("../../eslint.config.js", import.meta.url));
  const ignored = config
    .filter((entry) => Object.keys(entry).every((key) => key === "ignores" || key === "name"))
    .flatMap((entry) => entry.ignores)
    .map((pattern) => /^src\/components\/([^/*]+)\/?(\*\*)?$/.exec(pattern)?.[1])
    .filter(Boolean);
  assert.deepEqual(
    ignored.map((directory) => `src/components/${directory}`).sort(),
    [...IGNORED_DIRECTORIES].sort(),
  );
  for (const directory of ignored)
    for (const filePath of [
      "src/routes/vendors.tsx",
      "src/components/app/vendors.tsx",
      "src/components/prototype/vendors.tsx",
      "src/components/app/program-wizard/vendors.tsx",
    ]) {
      // The alias and the relative path, to the folder and to a file in it.
      const up = relative(dirname(filePath), `src/components/${directory}`);
      const folder = up.startsWith(".") ? up : `./${up}`;
      for (const specifier of [
        `@/components/${directory}/pill`,
        `@/components/${directory}`,
        `${folder}/pill`,
        folder,
      ]) {
        const [result] = await eslint.lintText(
          `import { Pill } from "${specifier}";\nexport const pill = Pill;\n`,
          { filePath },
        );
        assert.ok(
          result.messages.some(
            (message) => message.ruleId === "no-restricted-imports" && message.severity === 2,
          ),
          `${filePath} may import ${specifier}; add it to REFERENCE_KITS`,
        );
      }
    }
});

/* ---------- scripts/check-allow-lists.mjs, in a throwaway repository ---------- */

const checkAllowLists = resolve(cwd, "scripts/check-allow-lists.mjs");
const LINT_PAGE = "packages/design-system/src/stories/docs/Lint.mdx";
const KIT_ALLOW = "packages/design-system/test/lint-allow.json";
const PLUGIN_INDEX = "packages/design-system/eslint-plugin/index.js";
/** A Lint rules page with a row for each rule named. */
const page = (...rules) =>
  rules.map((rule) => `| \`${rule}\` | x | x | error | error |`).join("\n");
/** A plugin at the base that defines the rules named, as the real one spells a rule's key. */
const plugin = (...rules) => rules.map((rule) => `  "${rule}": rule("x", () => ({})),`).join("\n");

/**
 * Runs the ratchet in a new repository: `base` is committed, then `tree` is written over it (null
 * deletes). The script reads the files in the directory it runs in and the rules of this
 * checkout's plugin, as it does in CI.
 */
async function ratchet({ base, tree = {}, env = {} }) {
  const directory = await mkdtemp(join(tmpdir(), "ledger-ratchet-"));
  const git = (...args) =>
    execFileSync(
      "git",
      [
        "-c",
        "user.name=t",
        "-c",
        "user.email=t@example.test",
        "-c",
        "commit.gpgsign=false",
        ...args,
      ],
      { cwd: directory, stdio: "pipe" },
    );
  const write = async (files) => {
    for (const [file, text] of Object.entries(files)) {
      if (text === null) await rm(join(directory, file), { force: true });
      else {
        await mkdir(dirname(join(directory, file)), { recursive: true });
        await writeFile(join(directory, file), text);
      }
    }
  };
  try {
    git("init", "-q");
    await write(base);
    git("add", "-A");
    git("commit", "-q", "-m", "base");
    await write(tree);
    const run = spawnSync(process.execPath, [checkAllowLists], {
      cwd: directory,
      encoding: "utf8",
      env: { ...process.env, DS_BASE_REF: "", ...env },
    });
    return { status: run.status, output: `${run.stdout}${run.stderr}` };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("check-allow-lists: a rule that already ran at the base grows like any other, row or no row", async () => {
  const base = {
    [LINT_PAGE]: page("no-arbitrary-value"),
    [PLUGIN_INDEX]: plugin("no-arbitrary-value", "no-style-design-value"),
    [KIT_ALLOW]: JSON.stringify({ "ledger/no-style-design-value": { "src/a.tsx": 1 } }),
  };
  const grown = await ratchet({
    base,
    tree: {
      [KIT_ALLOW]: JSON.stringify({
        "ledger/no-style-design-value": { "src/a.tsx": 2, "src/b.tsx": 1 },
      }),
    },
  });
  assert.equal(grown.status, 1, grown.output);
  assert.match(grown.output, /no-style-design-value › src\/a\.tsx went from 1 to 2/);
  assert.match(grown.output, /no-style-design-value › src\/b\.tsx is new/);
  // A rule the plugin does not have is not landing either: a misspelt key is growth.
  const misspelt = await ratchet({
    base,
    tree: { [KIT_ALLOW]: JSON.stringify({ "ledger/no-margn": { "src/a.tsx": 1 } }) },
  });
  assert.equal(misspelt.status, 1, misspelt.output);
});

test("check-allow-lists: a rule new to the plugin and to the Lint rules page lands", async () => {
  const landed = await ratchet({
    base: {
      [LINT_PAGE]: page("no-margin"),
      [PLUGIN_INDEX]: plugin("no-margin"),
      [KIT_ALLOW]: JSON.stringify({}),
    },
    tree: { [KIT_ALLOW]: JSON.stringify({ "ledger/no-inline-config": { "src/a.tsx": 1 } }) },
  });
  assert.equal(landed.status, 0, landed.output);
  assert.match(landed.output, /ledger\/no-inline-config lands here/);
});

test("check-allow-lists: a disable that names no rule, or a key written with an escape, is counted", async () => {
  const screen = 'export const A = () => <div className="mt-200" />;\n';
  for (const [comment, key] of [
    ["// eslint-disable-next-line ,", "every rule"],
    ['/* eslint-disable "" */', "every rule"],
    ['/* eslint "ledger\\u002fno-margin": "off" */', "ledger/no-margin"],
  ]) {
    const result = await ratchet({
      base: { [PLUGIN_INDEX]: plugin("no-margin"), "src/a.tsx": screen },
      tree: { "src/a.tsx": `${comment}\n${screen}` },
    });
    assert.equal(result.status, 1, `${comment}: ${result.output}`);
    assert.match(result.output, new RegExp(`src/a\\.tsx › ${key} is new`), comment);
  }
});

test("check-allow-lists: at a base without the kit, the directive count starts", async () => {
  const result = await ratchet({
    base: { "src/a.tsx": "export const a = 1;\n" },
    tree: {
      "packages/design-system/src/b.tsx":
        '// eslint-disable-next-line ledger/no-margin -- Overlap is the geometry.\nexport const B = () => <div className="mt-200" />;\n',
    },
  });
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /has no kit, so this is where they start/);
});

test("check-allow-lists: a base ref that was asked for and does not resolve fails", async () => {
  const result = await ratchet({
    base: { [KIT_ALLOW]: JSON.stringify({}) },
    env: { DS_BASE_REF: "1234567890abcdef1234567890abcdef12345678" },
  });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /does not resolve to a commit/);
});

test("every route declares a screen family and browser assertion", async () => {
  const inventory = JSON.parse(
    await readFile(resolve(cwd, "docs/guides/screen-inventory.json"), "utf8"),
  );
  const routes = (await readdir(resolve(cwd, "src/routes")))
    .filter((file) => file.endsWith(".tsx") && file !== "__root.tsx")
    .sort();
  assert.deepEqual(
    inventory.map((screen) => screen.file).sort(),
    routes,
    "Declare new routes in the screen inventory so the browser suite exercises them",
  );
  const families = new Set([
    "register",
    "record",
    "program-view",
    "schema-register",
    "schema-record",
    "dashboard",
    "inspector",
    "wizard",
    "redirect",
    "exception",
  ]);
  for (const screen of inventory) {
    assert.ok(families.has(screen.family), screen.file);
    assert.ok(screen.path && screen.title, screen.file);
    if (["exception", "redirect", "wizard", "inspector"].includes(screen.family))
      assert.ok(screen.reason, screen.file);
    if (screen.family === "redirect") assert.ok(screen.redirectTo, screen.file);
    if (screen.missingRecord) {
      assert.ok(screen.missingRecord.kind, screen.file);
      assert.ok(screen.missingRecord.backTo, screen.file);
      assert.ok(screen.missingRecord.reason, screen.file);
    }
    if (screen.tabList) {
      assert.ok(Array.isArray(screen.collectionTabs), screen.file);
      assert.ok(
        screen.tabExceptions &&
          typeof screen.tabExceptions === "object" &&
          !Array.isArray(screen.tabExceptions),
        screen.file,
      );
      const names = [...screen.collectionTabs, ...Object.keys(screen.tabExceptions)];
      assert.ok(
        names.length > 0 && names.every((name) => typeof name === "string" && name),
        screen.file,
      );
      assert.equal(new Set(names).size, names.length, `${screen.file}: tab shapes are exclusive`);
      assert.ok(
        Object.values(screen.tabExceptions).every((reason) => typeof reason === "string" && reason),
        `${screen.file}: every non-collection tab explains its shape`,
      );
    }
  }
});
