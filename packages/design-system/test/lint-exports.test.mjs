import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Linter } from "eslint";
import ts from "typescript";

import ledger from "../eslint-plugin/index.js";
import {
  inventoryPath,
  packageComponentNames,
  publicComponentNames,
} from "../build/lint-inventory.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lint = (source, plugin = ledger) =>
  new Linter().verify(source, {
    plugins: { ledger: plugin },
    rules: { "ledger/no-kit-shadow": "error" },
  });

test("public inventory follows the barrel, including aliases, layout and type-only re-exports", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-exports-"));
  try {
    const entry = path.join(directory, "index.ts");
    fs.mkdirSync(path.join(directory, "layout"));
    fs.writeFileSync(
      path.join(directory, "layout/header.ts"),
      `function Header() {}\nexport { Header };\nexport function PrivateLayoutPart() {}`,
    );
    fs.writeFileSync(
      path.join(directory, "parts.ts"),
      `export function Badge() {}\nexport class TypeOnlyValue {}\nexport interface Props {}\nexport const TOKEN = "value";\nexport function helper() {}`,
    );
    fs.writeFileSync(
      path.join(directory, "barrel.ts"),
      `export { Badge } from "./parts";\nexport type { TypeOnlyValue, Props } from "./parts";\nexport { TOKEN, helper } from "./parts";`,
    );
    fs.writeFileSync(
      entry,
      `export { Header as PageHeader } from "./layout/header";\nexport * from "./barrel";`,
    );
    const program = ts.createProgram([entry], {
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      skipLibCheck: true,
    });
    assert.deepEqual(publicComponentNames(program, entry), ["Badge", "PageHeader"]);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("shipped component inventory matches current public exports", () => {
  assert.deepEqual(
    JSON.parse(fs.readFileSync(inventoryPath, "utf8")),
    { components: packageComponentNames() },
    "Run npm run build:lint -w packages/design-system after changing public exports.",
  );
});

test("no-kit-shadow rejects public layout and named exports but permits product compositions", () => {
  const names = ["PageHeader", "Section", "Shell", "Badge", "Accordion", "Breadcrumb", "DataTable"];
  for (const name of names) {
    for (const source of [
      `export function ${name}() { return null; }`,
      `export const ${name} = () => null;`,
    ]) {
      const messages = lint(source);
      assert.equal(messages.length, 1, source);
      assert.equal(messages[0].ruleId, "ledger/no-kit-shadow");
      assert.match(messages[0].message, new RegExp(`^${name} is a kit part`));
    }
  }
  assert.deepEqual(
    lint(`import { PageHeader } from "@ledger/design-system";
      export function ProgramHeader() { return PageHeader; }
      export function PageHeaderRoot() { return null; }`),
    [],
    "Imports and app-owned names, including a private package implementation name, stay valid.",
  );
});

test("installed ESLint plugin works without component source or TypeScript", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-lint-consumer-"));
  try {
    fs.writeFileSync(path.join(directory, "package.json"), '{"type":"module"}');
    fs.cpSync(path.join(root, "eslint-plugin"), path.join(directory, "eslint-plugin"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(directory, "dist/generated"), { recursive: true });
    fs.copyFileSync(
      path.join(root, "src/generated/utilities.json"),
      path.join(directory, "dist/generated/utilities.json"),
    );
    const { default: installed } = await import(
      pathToFileURL(path.join(directory, "eslint-plugin/index.js")).href
    );
    const messages = lint("export function PageHeader() { return null; }", installed);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].ruleId, "ledger/no-kit-shadow");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
