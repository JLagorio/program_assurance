# ledger/product-responsive-table

Reports a kit DataTable that turns `responsive` off, or leaves it to a prop spread.

## Reports

- A `DataTable` whose last `responsive` is not the literal `true`: `responsive={false}`, a string, or an expression the rule cannot read. The finding says how the prop is written: `<DataTable> sets responsive={false}, so a narrow frame scrolls it sideways instead of folding lower-priority columns into More fields. A DataTable is responsive by default: remove the prop.`
- A `DataTable` with a prop spread after its last `responsive`, or with a spread and no `responsive`, since the spread can turn it off: `<DataTable> leaves responsive to a prop spread, which can turn it off and scroll the table sideways instead of folding lower-priority columns into More fields. Write responsive after the spread.`

A `DataTable` that leaves the prop out passes: it is responsive by default. Only a `DataTable` imported from `@ledger/design-system` is checked, through an alias or a namespace import too; a local component of the same name, or a type import, is not.

## Why

A product register has to fit the space it is given: beside an open preview panel, in a narrow window, on a phone. A responsive DataTable measures its container and keeps the record's name and the row actions, moving lower-priority fields into each row's More fields ("+3"), so no field disappears and no table scrolls sideways. `responsive={false}` makes it scroll instead, which hides columns without saying so. Every product DataTable is responsive: the product patterns' Registers section is the contract ([product patterns](../../../../docs/guides/product-patterns.md#registers)), and the Data table page describes the responsive mode ([Data table](../../src/stories/patterns/DataTable.mdx)).

## Instead

Leave `responsive` out: `<DataTable table={table} />`. Behind a prop spread, write `responsive` after it: `<DataTable {...props} responsive />`. Give the name column `priority: 0` and a readable width in `defineColumns`, so the name stays in the row when the rest fold.

## Examples

### Reported

```tsx reported
import { DataTable, defineColumns, useDataTable } from "@ledger/design-system";

type Risk = { id: string; title: string; status: string };

const columns = defineColumns<Risk>((c) => [c.text("title", { header: "Risk", priority: 0 })]);

export function RiskTable({ risks }: { risks: Risk[] }) {
  const table = useDataTable({ columns, data: risks });
  return <DataTable table={table} responsive={false} />;
}
```

```tsx reported
import type { ComponentProps } from "react";
import { DataTable } from "@ledger/design-system";

export function RegisterTable(props: ComponentProps<typeof DataTable>) {
  return <DataTable responsive {...props} />;
}
```

### Allowed

```tsx allowed
import { DataTable, defineColumns, useDataTable } from "@ledger/design-system";

type Risk = { id: string; title: string; status: string };

const columns = defineColumns<Risk>((c) => [c.text("title", { header: "Risk", priority: 0 })]);

export function RiskTable({ risks }: { risks: Risk[] }) {
  const table = useDataTable({ columns, data: risks });
  return <DataTable table={table} />;
}
```

```tsx allowed
import type { ComponentProps } from "react";
import { DataTable } from "@ledger/design-system";

export function RegisterTable(props: ComponentProps<typeof DataTable>) {
  return <DataTable {...props} responsive />;
}
```

## Suggestions and fixes

Neither. The rule offers no `--fix` and no editor suggestion: a table made responsive again also needs its column priorities and widths chosen, which only the author can do.

## Allowances

The rule is in neither preset: a horizontally scrolling comparison table (`responsive={false}`) remains a supported kit use, so a product turns it on for the files that follow its contract. This repository's root `eslint.config.js` turns it on, as an error, for the application's product files (`src/routes`, `src/components/app`, `src/components/prototype`, `src/lib` and `src/router.tsx`). It takes the plugin's `allow` option, a count of reports per file that may only shrink; `scripts/lint-allow.json` has no entry for it, so every report fails. A comment that turns the rule off, a block disable, or a line disable with no reason after `--` is reported by [`ledger/no-inline-config`](no-inline-config.md).

## Limits

- A `responsive` that comes from an expression (`responsive={wide}`) is reported, since the rule cannot read its value.
- A spread is reported whatever it holds, since the rule cannot read it: write `responsive` after it.
- A wrapper component that renders the kit's `DataTable` is checked where it renders it, not where it is used.
- It does not check the columns: a name column without `priority: 0` or a readable width still passes.
