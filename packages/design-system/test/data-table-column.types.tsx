import type { ColumnDef } from "@tanstack/react-table";
import {
  createDataTableColumnHelper,
  type DataTableColumn,
  type DataTableFeatures,
} from "../src/index";

// DataTableColumn is one column of a list whose value types differ. Its value type is erased, as
// TanStack's own columns() erases it, also in a column written where the type is expected; a
// column written on its own keeps the value type the helper checks. A change that keeps each
// column's value type in the list fails here, and its doc comment and changelog say so.

type Row = { id: string; due: Date; score: number };
type IsAny<T> = 0 extends 1 & T ? true : false;
type ValueOf<TColumn> =
  TColumn extends ColumnDef<DataTableFeatures, Row, infer TValue> ? TValue : never;

const erased: IsAny<ValueOf<DataTableColumn<Row>>> = true;

const column = createDataTableColumnHelper<Row>();
const due = column.accessor("due", {
  header: "Due",
  cell: (info) => info.getValue().toISOString(),
});
const score = column.accessor("score", {
  header: "Score",
  // @ts-expect-error Written on its own, the column keeps its value type: a number has no
  // toISOString.
  cell: (info) => info.getValue().toISOString(),
});
const columns: DataTableColumn<Row>[] = [due, score];

export { columns, erased };
