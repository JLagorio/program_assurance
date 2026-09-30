# ledger/no-colgroup

Reports a `<colgroup>`: a column's width is a content decision and goes on its Table.Header as `width`, not in a colgroup.

## Reports

- Every `<colgroup>` element, in a kit Table or a plain `table`. It says the colgroup fixes widths away from the header and asks for `width` on each Table.Header.

One report per colgroup, on its opening tag.

## Why

Column widths are content: `width` in pixels on a header fixes its column, `minWidth` gives it a floor while it takes the slack, and one column takes what is left. Set on the header, the width travels with its column. A colgroup sets widths by position, away from the headings they belong to, so a column added, hidden or moved takes its neighbour's width, and the header and the colgroup state the width in two places. See [Table](../../src/stories/components/Table.mdx) and [DataTable](../../src/stories/patterns/DataTable.mdx).

## Instead

- `width={180}` on a Table.Header fixes its column; `minWidth={200}` gives the name column a floor (180 to 220) and lets it take the slack.
- In a table with no header row, `width` goes on the column's cells.
- In a DataTable, each column kind takes `width` (also its minimum) and `minWidth` in its definition.

## Examples

### Reported

```tsx reported
import { Table } from "@ledger/design-system";

export function ControlsTable() {
  return (
    <Table label="Controls">
      <colgroup>
        <col className="w-1/3" />
        <col />
      </colgroup>
      <thead>
        <tr>
          <Table.Header>Control</Table.Header>
          <Table.Header>Owner</Table.Header>
        </tr>
      </thead>
    </Table>
  );
}
```

```tsx reported
export function PrintedSummary() {
  return (
    <table>
      <colgroup>
        <col span={2} />
      </colgroup>
      <tbody />
    </table>
  );
}
```

### Allowed

```tsx allowed
import { Table } from "@ledger/design-system";

export function ControlsTable() {
  return (
    <Table label="Controls">
      <thead>
        <tr>
          <Table.Header minWidth={200}>Control</Table.Header>
          <Table.Header width={180}>Owner</Table.Header>
        </tr>
      </thead>
    </Table>
  );
}
```

```tsx allowed
import { DataTable, defineColumns, useDataTable } from "@ledger/design-system";

type Control = { id: string; code: string; title: string; owner: string };

const columns = defineColumns<Control>((c) => [
  c.id("code", { header: "Id", width: 120 }),
  c.text("title", { header: "Control", minWidth: 200, priority: 0 }),
  c.person("owner", { header: "Owner", width: 180 }),
]);

export function ControlsRegister({ rows }: { rows: Control[] }) {
  const table = useDataTable({ columns, data: rows, label: "Controls" });
  return <DataTable responsive table={table} />;
}
```

## Suggestions and fixes

Neither. Moving each width onto its header needs the header that matches each `col`, which the rule does not work out.

## Allowances

In the kit, `test/lint-allow.json` may hold a count of this rule's reports per file that predate it; a file with more reports fails, and so does one with fewer until its count is lowered, so the list only shrinks. The application's list, `scripts/lint-allow.json`, has no entry for it, and `scripts/check-allow-lists.mjs` rejects a new one. A comment that turns the rule off is reported by [`ledger/no-inline-config`](no-inline-config.md), except a line or next-line disable that names it and says why after `--`; those are counted and may only shrink too.

## Limits

- It reads the tag name only. A `col` outside a colgroup, a component that renders a colgroup, and one made with `createElement("colgroup")` are not seen.
- Widths set by class or style on cells are not this rule's: a bracketed width is [`ledger/no-arbitrary-value`](no-arbitrary-value.md)'s, and a literal width in `style` is [`ledger/no-style-design-value`](no-style-design-value.md)'s.
