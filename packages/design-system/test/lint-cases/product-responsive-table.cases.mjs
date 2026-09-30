// ledger/product-responsive-table: a product DataTable enables responsive columns, after any prop
// spreads. It reads the kit's import only, aliases and namespaces included.
import { kitImport } from "../lint-helpers.mjs";

const table = kitImport("DataTable");

export default {
  valid: [
    { code: `${table} <DataTable responsive />` },
    { code: `${table} <DataTable responsive={true} />` },
    { code: `${table} <DataTable {...props} responsive />` },
    {
      code: 'import { DataTable as Register } from "@ledger/design-system"; <Register responsive />',
    },
    { code: 'import * as Kit from "@ledger/design-system"; <Kit.DataTable responsive={true} />' },
    { code: `${table} <DataTable.Columns table={table} />` },
    { code: `${table} <DataTable responsive={true as const} />`, only: "ts" },
    // Not the kit's DataTable: no import, another package, a parameter that shadows the import.
    { code: "<DataTable />" },
    { code: 'import { DataTable } from "another-kit"; <DataTable />' },
    { code: `${table} function Child(DataTable) { return <DataTable />; }` },
    // A type-only import names no value, so the tag is not the kit's part.
    { code: 'import type { DataTable } from "@ledger/design-system"; <DataTable />', only: "ts" },
    { code: 'import { type DataTable } from "@ledger/design-system"; <DataTable />', only: "ts" },
  ],
  invalid: [
    {
      code: `${table} <DataTable />`,
      errors: [{ messageId: "responsive", line: 1, column: 52 }],
    },
    { code: `${table} <DataTable responsive={false} />`, errors: [{ messageId: "responsive" }] },
    { code: `${table} <DataTable responsive="true" />`, errors: [{ messageId: "responsive" }] },
    { code: `${table} <DataTable responsive={narrow} />`, errors: [{ messageId: "responsive" }] },
    // A spread after the prop may turn it off.
    { code: `${table} <DataTable responsive {...props} />`, errors: [{ messageId: "responsive" }] },
    {
      code: 'import { DataTable as Register } from "@ledger/design-system"; <Register />',
      errors: [{ messageId: "responsive" }],
    },
    {
      code: 'import * as Kit from "@ledger/design-system"; <Kit.DataTable />',
      errors: [{ messageId: "responsive" }],
    },
  ],
};
