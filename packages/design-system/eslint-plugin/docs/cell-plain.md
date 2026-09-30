# ledger/cell-plain

Reports a neutral colour, weight or type token on a Table.Cell, where only a status colour may differ.

## Reports

- A `Table.Cell` whose `className` holds a neutral text colour (`text-default`, `text-subtle`, `text-subtlest`, `text-brand`, `text-selected`, `text-inverse`, `text-disabled`), a type style (`font-body`, `font-body-large`, `font-body-small`, `font-body-xsmall`, `font-heading-*`, `font-code`) or a weight (`font-regular`, `font-medium`, `font-semibold`).

One report per cell, on its `className`, naming every such class it holds. A status colour (`text-danger`, `text-warning`, `text-success`, `text-information`) is not reported.

The cell is the kit's `Table.Cell`, imported from `@ledger/design-system` by name, alias (`<T.Cell>`) or namespace (`<L.Table.Cell>`). An element whose `render` puts the cell in its place (`<Slot render={<Table.Cell />} className="…">`, or a render function that spreads its props onto the cell) styles the cell, and the finding says so: `<Slot> renders <Table.Cell>, which is one style.`

## Why

A table is read down its columns, and every cell is one style: `font.body` in the text colour, one line, truncated. A value made grey, bold or smaller in one column asks the reader what it means, and the next screen styles its cells another way. What differs in a cell is data, drawn by the part that means it: a status is a Badge, a severity an Indicator, a date a DateTime, a number ends in tabular numerals. See [Table](../../src/stories/components/Table.mdx), its Content and Style sections.

## Instead

- Drop the class: the cell's type and colour are the table's.
- A status is a `Badge` in its `tone`, a severity an `Indicator`, a person a `Person`, a date a `DateTime`.
- A number takes `align="end"` on its header and its cells, which draws it in tabular numerals.
- The id column is `Table.Id`, with `tone="subtle"` where the id is not the link.
- A value that is late or failing may take its status colour, such as `text-danger`.

## Examples

### Reported

```tsx reported
import { Table } from "@ledger/design-system";

export function OwnerCell({ owner }: { owner: string }) {
  return <Table.Cell className="font-semibold text-subtle">{owner}</Table.Cell>;
}
```

```tsx reported
import { DateTime, Table } from "@ledger/design-system";

export function DueCell({ due, late }: { due: string; late: boolean }) {
  return (
    <Table.Cell className={late ? "text-danger font-medium" : undefined}>
      <DateTime value={due} />
    </Table.Cell>
  );
}
```

```tsx reported
import { Table, cn } from "@ledger/design-system";

export function CountCell({ count, total }: { count: number; total: boolean }) {
  return (
    <Table.Cell align="end" className={cn(total && "font-semibold", "font-body-small")}>
      {count}
    </Table.Cell>
  );
}
```

### Allowed

```tsx allowed
import { DateTime, Table } from "@ledger/design-system";

export function DueCell({ due, late }: { due: string; late: boolean }) {
  return (
    <Table.Cell className={late ? "text-danger" : undefined}>
      <DateTime value={due} />
    </Table.Cell>
  );
}
```

```tsx allowed
import { Badge, Table } from "@ledger/design-system";

export function StatusCell() {
  return (
    <Table.Cell>
      <Badge tone="warning">Open</Badge>
    </Table.Cell>
  );
}
```

```tsx allowed
import { Table } from "@ledger/design-system";

export function CountCell({ count }: { count: number }) {
  return <Table.Cell align="end">{count}</Table.Cell>;
}
```

## Suggestions and fixes

Neither. Which class to drop, and whether the value needs a part in its place, is the author's decision.

## Allowances

The rule is off in the package preset, so the kit keeps no allowance for it. The application's list, `scripts/lint-allow.json`, has no entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- It judges the kit's `Table.Cell` only: a local object named `Table`, another package's `Table`, a parameter named `Table` and a type-only import are not checked.
- Only the cell's own `className`. A styled element inside the cell (`<Table.Cell><span className="font-semibold">`), a `Table.Header`, a `Table.Id`, a plain `td` and a DataTable column's `cell` renderer are not checked.
- The classes are read as the class rules read them: through a condition, a template, a class helper, a same-file `const` or map entry, and an object spread onto the element that sets `className` and is not written over by a later one (JSX keeps the last). One with a variant (`hover:text-subtle`), one passed in through a prop, imported from another file or returned by a call the lint cannot follow, and one built at runtime are not seen.
- It does not run on the kit's own source.
