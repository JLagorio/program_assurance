import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import test from "node:test";
import ts from "typescript";

const cwd = fileURLToPath(new URL("../../", import.meta.url));
const eslint = new ESLint({ cwd });

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
    export function Screen() { return <><Records /><Views variant="line" className="flex-wrap" /></>; }`;
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
