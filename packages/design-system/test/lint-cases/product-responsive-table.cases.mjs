// ledger/product-responsive-table: a product DataTable stays responsive, which it is by default. It
// reports responsive turned off, or left to a prop spread written after it. It reads the kit's
// import only, aliases and namespaces included.
import { kitImport } from "../lint-helpers.mjs";

const table = kitImport("DataTable");

export default {
  valid: [
    // Responsive by default: the prop left out, or written true.
    { code: `${table} <DataTable />` },
    { code: `${table} <DataTable responsive />` },
    { code: `${table} <DataTable responsive={true} />` },
    { code: `${table} <DataTable {...props} responsive />` },
    { code: 'import { DataTable as Register } from "@ledger/design-system"; <Register />' },
    { code: 'import * as Kit from "@ledger/design-system"; <Kit.DataTable responsive={true} />' },
    { code: `${table} <DataTable.Columns table={table} />` },
    { code: `${table} <DataTable responsive={true as const} />`, only: "ts" },
    // Not the kit's DataTable: no import, another package, a parameter that shadows the import.
    { code: "<DataTable responsive={false} />" },
    { code: 'import { DataTable } from "another-kit"; <DataTable responsive={false} />' },
    { code: `${table} function Child(DataTable) { return <DataTable responsive={false} />; }` },
    // A type-only import names no value, so the tag is not the kit's part.
    {
      code: 'import type { DataTable } from "@ledger/design-system"; <DataTable responsive={false} />',
      only: "ts",
    },
    {
      code: 'import { type DataTable } from "@ledger/design-system"; <DataTable {...props} />',
      only: "ts",
    },
  ],
  invalid: [
    {
      code: `${table} <DataTable responsive={false} />`,
      errors: [
        {
          messageId: "off",
          data: { tag: "DataTable", state: "sets responsive={false}" },
          line: 1,
          column: 52,
        },
      ],
    },
    {
      code: `${table} <DataTable responsive="true" />`,
      errors: [{ messageId: "off", data: { tag: "DataTable", state: 'sets responsive="true"' } }],
    },
    {
      code: `${table} <DataTable responsive={narrow} />`,
      errors: [{ messageId: "off", data: { tag: "DataTable", state: "sets responsive={narrow}" } }],
    },
    // A spread may turn it off: after the prop, or with no prop at all.
    {
      code: `${table} <DataTable responsive {...props} />`,
      errors: [{ messageId: "spread", data: { tag: "DataTable" } }],
    },
    {
      code: `${table} <DataTable {...props} />`,
      errors: [{ messageId: "spread", data: { tag: "DataTable" } }],
    },
    {
      code: 'import { DataTable as Register } from "@ledger/design-system"; <Register responsive={false} />',
      errors: [{ messageId: "off", data: { tag: "Register", state: "sets responsive={false}" } }],
    },
    {
      code: 'import * as Kit from "@ledger/design-system"; <Kit.DataTable responsive={false} />',
      errors: [
        { messageId: "off", data: { tag: "Kit.DataTable", state: "sets responsive={false}" } },
      ],
    },
  ],
};
