// ledger/cell-plain: a Table.Cell carries no neutral colour, weight or type token; only a status
// colour may differ.
import { kitImport } from "../lint-helpers.mjs";

const table = kitImport("Table");

export default {
  valid: [
    { code: `${table} <Table.Cell>REQ-001</Table.Cell>` },
    // A status colour is data, not design.
    { code: `${table} <Table.Cell className="text-danger">Overdue</Table.Cell>` },
    { code: `${table} <Table.Header className="font-semibold">Name</Table.Header>` },
    { code: `${table} <Table.Cell className="truncate tabular-nums">12</Table.Cell>` },
    // A class-policy rule judges the kit's own part only: a Table that is not bound to the kit's
    // import (none, a local look-alike, another package's, a parameter, a type) is not reported.
    { code: '<Table.Cell className="font-code">x</Table.Cell>' },
    {
      code: 'function Table() { return null; } export const B = () => <Table.Cell className="font-semibold" />;',
    },
    {
      code: 'import { Table } from "other-kit"; <Table.Cell className="font-semibold">x</Table.Cell>',
    },
    {
      code: `${table} export function Row(Table) { return <Table.Cell className="font-semibold">x</Table.Cell>; }`,
    },
    {
      code: 'import type { Table } from "@ledger/design-system"; <Table.Cell className="font-semibold">x</Table.Cell>',
      only: "ts",
    },
    // A render function that does not hand its props on leaves the classes with the element.
    {
      code: `${table} <Slot render={(item) => <Table.Cell />} className="font-semibold" />`,
    },
    // A received className is the caller's, and is not read.
    {
      code: `${table} export function Cell({ className }) { return <Table.Cell className={className}>x</Table.Cell>; }`,
    },
    // JSX keeps the className written last: a spread's className before the attribute never
    // lands on the cell.
    {
      code: `${table} const totals = { className: "font-semibold", colSpan: 2 }; <Table.Cell {...totals} className="text-end">Total</Table.Cell>`,
    },
    // A class that styles the elements inside the cell is no-restyle's finding, not the cell's.
    { code: `${table} <Table.Cell className="[&_svg]:text-subtle">x</Table.Cell>` },
    // A component of this file whose rest no longer carries className hands it on to nothing.
    {
      code: `${table} function Cell({ className, ...rest }) { return <Table.Cell {...rest} />; } export const A = () => <Cell className="font-semibold">x</Cell>;`,
    },
  ],
  invalid: [
    {
      code: `${table} <Table.Cell className="font-semibold">x</Table.Cell>`,
      errors: [{ messageId: "plain", data: { classes: "font-semibold" }, line: 1, column: 60 }],
    },
    {
      code: `${table} <Table.Cell className={cn("text-subtle", strong && "font-medium")}>x</Table.Cell>`,
      errors: [{ messageId: "plain", data: { classes: "text-subtle, font-medium" } }],
    },
    {
      // An alias and a namespace are the kit's Table.
      code: 'import { Table as T } from "@ledger/design-system"; <T.Cell className="font-semibold">x</T.Cell>',
      errors: [{ messageId: "plain", data: { classes: "font-semibold" } }],
    },
    {
      code: 'import * as L from "@ledger/design-system"; <L.Table.Cell className="text-subtle">x</L.Table.Cell>',
      errors: [{ messageId: "plain", data: { classes: "text-subtle" } }],
    },
    {
      // A render prop puts the kit's cell in the element's place, so the classes land on it.
      code: `${table} <Slot render={<Table.Cell />} className="font-semibold" />`,
      errors: [
        { messageId: "rendered", data: { wrapper: "Slot", classes: "font-semibold" }, column: 78 },
      ],
    },
    {
      code: `${table} <Slot render={(props) => <Table.Cell {...props} />} className="font-body-small" />`,
      errors: [{ messageId: "rendered", data: { wrapper: "Slot", classes: "font-body-small" } }],
    },
    {
      // The classes are read however they reach the cell: a const, a clsx key, a map entry, a
      // spread of an object that sets className.
      code: `${table} const strong = "font-semibold"; const tones = { muted: "text-subtle" }; <><Table.Cell className={strong}>x</Table.Cell><Table.Cell className={cn({ "font-medium": on })}>y</Table.Cell><Table.Cell className={tones[tone]}>z</Table.Cell><Table.Cell {...{ className: "font-code" }}>w</Table.Cell></>`,
      errors: [
        { messageId: "plain", data: { classes: "font-semibold" } },
        { messageId: "plain", data: { classes: "font-medium" } },
        { messageId: "plain", data: { classes: "text-subtle" } },
        { messageId: "plain", data: { classes: "font-code" } },
      ],
    },
    {
      // A hole that brings its own whitespace leaves the word before it whole.
      code: `${table} export const Row = ({ total }) => <Table.Cell className={\`font-semibold\${total ? " text-end" : ""}\`}>1</Table.Cell>;`,
      errors: [{ messageId: "plain", data: { classes: "font-semibold" } }],
    },
    {
      // A local type named Table hides no value: the tag is still the kit's.
      code: `${table} export function X() { type Table = number; return <Table.Cell className="font-semibold" />; }`,
      only: "ts",
      errors: [{ messageId: "plain", data: { classes: "font-semibold" } }],
    },
    {
      // A spread after the attribute that always sets className is what lands.
      code: `${table} const totals = { className: "font-semibold" }; <Table.Cell className="text-end" {...totals}>Total</Table.Cell>`,
      errors: [{ messageId: "plain", data: { classes: "font-semibold" } }],
    },
    {
      // At a breakpoint or important, the cell is still restyled.
      code: `${table} <Table.Cell className="md:font-semibold !text-subtle">x</Table.Cell>`,
      errors: [{ messageId: "plain", data: { classes: "md:font-semibold, !text-subtle" } }],
    },
    {
      // A component of this file that hands its className on to the cell.
      code: `${table} const Cell = ({ className, ...rest }) => <Table.Cell className={className} {...rest} />; export const A = () => <Cell className="font-semibold">x</Cell>;`,
      errors: [{ messageId: "forwarded", data: { wrapper: "Cell", classes: "font-semibold" } }],
    },
  ],
};
