import assert from "node:assert/strict";
import test from "node:test";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";
import ledger from "../eslint-plugin/index.js";

function lint(source, name) {
  return new Linter().verify(
    source,
    {
      files: ["**/*.tsx"],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      plugins: { ledger },
      rules: { [`ledger/${name}`]: "error" },
    },
    { filename: "screen.tsx" },
  );
}

const tableImport = 'import { DataTable } from "@ledger/design-system";';
const tabsImport = 'import { TabsList } from "@ledger/design-system";';

test("product tables explicitly enable responsive after prop spreads", () => {
  for (const source of [
    `${tableImport} <DataTable />`,
    `${tableImport} <DataTable responsive={false} />`,
    `${tableImport} <DataTable responsive="true" />`,
    `${tableImport} <DataTable responsive={narrow} />`,
    `${tableImport} <DataTable {...props} />`,
    `${tableImport} <DataTable responsive {...props} />`,
    'import { DataTable as Register } from "@ledger/design-system"; <Register />',
    'import * as Kit from "@ledger/design-system"; <Kit.DataTable />',
  ]) {
    const messages = lint(source, "product-responsive-table");
    assert.equal(messages.length, 1, source);
    assert.equal(messages[0].ruleId, "ledger/product-responsive-table", source);
  }
  for (const source of [
    `${tableImport} <DataTable responsive />`,
    `${tableImport} <DataTable responsive={true} />`,
    `${tableImport} <DataTable responsive={true as const} />`,
    `${tableImport} <DataTable {...props} responsive />`,
    'import { DataTable as Register } from "@ledger/design-system"; <Register responsive />',
    'import * as Kit from "@ledger/design-system"; <Kit.DataTable responsive={true} />',
    `${tableImport} <DataTable.Columns table={table} />`,
  ])
    assert.deepEqual(lint(source, "product-responsive-table"), [], source);
});

test("product line tabs reject local wrapping, intrinsic width and overflow overrides", () => {
  for (const source of [
    `${tabsImport} <TabsList />`,
    `${tabsImport} <TabsList variant="default" />`,
    `${tabsImport} <TabsList variant={variant} />`,
    `${tabsImport} <TabsList variant="line" {...props} />`,
    `${tabsImport} <TabsList variant="line" className="flex-wrap" />`,
    `${tabsImport} <TabsList variant="line" className="md:flex-wrap-reverse!" />`,
    `${tabsImport} <TabsList variant="line" className="[&:hover]:!w-fit" />`,
    `${tabsImport} <TabsList variant="line" className={small ? "overflow-x-auto" : "w-full"} />`,
    `${tabsImport} <TabsList variant="line" className={cn("w-full", { "overflow-hidden": small })} />`,
    `${tabsImport} const layout = "w-fit"; <TabsList variant="line" className={layout} />`,
    `${tabsImport} <TabsList variant="line" className={() => "flex-wrap"} />`,
    `${tabsImport} <TabsList variant="line" style={{ overflowX: "auto" }} />`,
    `${tabsImport} <TabsList variant="line" style={{ flexWrap: "wrap" }} />`,
    `${tabsImport} <TabsList variant="line" style={{ width: "fit-content" }} />`,
    'import { TabsList as Views } from "@ledger/design-system"; <Views variant="line" className="w-fit" />',
    'import * as Kit from "@ledger/design-system"; <Kit.TabsList variant="default" />',
  ]) {
    const messages = lint(source, "product-line-tabs");
    assert.equal(messages.length, 1, source);
    assert.equal(messages[0].ruleId, "ledger/product-line-tabs", source);
  }
  for (const source of [
    `${tabsImport} <TabsList variant="line" />`,
    `${tabsImport} <TabsList {...props} variant={"line"} />`,
    `${tabsImport} <TabsList variant={"line" as const} className="w-full pt-100" />`,
    `${tabsImport} <TabsList variant="line" className={small ? "text-subtle" : "text-default"} />`,
    `${tabsImport} <TabsList variant="line" style={{ color: "inherit", overflowX: undefined }} />`,
    'import { TabsList as Views } from "@ledger/design-system"; <Views variant="line" />',
    'import * as Kit from "@ledger/design-system"; <Kit.TabsList variant="line" />',
  ])
    assert.deepEqual(lint(source, "product-line-tabs"), [], source);
});

test("product policies resolve real import bindings and do not flag unrelated or shadowed components", () => {
  for (const [name, source] of [
    ["product-responsive-table", "<DataTable />"],
    ["product-responsive-table", 'import { DataTable } from "another-kit"; <DataTable />'],
    [
      "product-responsive-table",
      `${tableImport} function Child(DataTable) { return <DataTable />; }`,
    ],
    [
      "product-responsive-table",
      'import { DataTable as Register } from "@ledger/design-system"; function Child(Register) { return <Register />; }',
    ],
    [
      "product-responsive-table",
      'import * as Kit from "@ledger/design-system"; function Child(Kit) { return <Kit.DataTable />; }',
    ],
    ["product-line-tabs", '<TabsList variant="default" className="flex-wrap" />'],
    ["product-line-tabs", 'import { TabsList } from "another-kit"; <TabsList variant="default" />'],
    ["product-line-tabs", `${tabsImport} function Child(TabsList) { return <TabsList />; }`],
  ])
    assert.deepEqual(lint(source, name), [], source);
});

test("product layout policies are opt-in and leave generic kit variants available", () => {
  for (const config of [...ledger.configs.package, ...ledger.configs.recommended]) {
    assert.equal(config.rules?.["ledger/product-responsive-table"], undefined);
    assert.equal(config.rules?.["ledger/product-line-tabs"], undefined);
  }
});
