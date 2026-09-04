import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";

import { Button, Toolbar, type Tone } from "../../components";
import {
  ColumnReorder,
  DataTable,
  HeaderMenu,
  defineColumns,
  useColumnDrag,
  useDataTable,
  type DataTableInstance,
  type DataTableState,
} from "../../patterns";
import { Table } from "../../components";
import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/Data table",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

type Finding = {
  id: string;
  name: string;
  owner: string;
  status: "Draft" | "In review" | "Verified" | "Overdue";
  family: string;
  open: number;
  due: string;
};

const statusTone: Record<Finding["status"], Tone> = {
  Draft: "neutral",
  "In review": "information",
  Verified: "success",
  Overdue: "danger",
};

const owners = ["Dana Whitfield", "Grace Hoppel", "Marcus Ryde", "Priya Raghavan", "Linus Aarto"];
const families = ["Access control", "Change", "Backup", "Vendor", "Privacy"];
const names = [
  "Segregation of duties, payables",
  "Privileged access review",
  "Firewall rule recertification",
  "Backup restore test",
  "Vendor master change approval",
  "Encryption key rotation",
  "Incident postmortem sign-off",
  "Data retention schedule",
];
const statuses: Finding["status"][] = ["Draft", "In review", "Verified", "Overdue"];

/** Deterministic rows, so a story renders the same every time. */
function makeFindings(count: number): Finding[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `FND-${String(2200 + i).padStart(4, "0")}`,
    name: names[i % names.length] ?? "",
    owner: owners[(i * 7) % owners.length] ?? "",
    status: statuses[(i * 3) % statuses.length] ?? "Draft",
    family: families[(i * 5) % families.length] ?? "",
    open: (i * 37) % 120,
    due: `2026-${String(1 + (i % 12)).padStart(2, "0")}-${String(1 + ((i * 11) % 28)).padStart(2, "0")}`,
  }));
}

const findings = makeFindings(24);

const columns = defineColumns<Finding>((c) => [
  c.id("id", {
    glance: (r) => (
      <Stack space="space.050">
        <Text weight="medium">{r.name}</Text>
        <Text size="small" color="color.text.subtle">
          {r.family} · {r.owner}
        </Text>
      </Stack>
    ),
  }),
  c.text("name", { header: "Finding", minWidth: 240 }),
  c.status("status", { header: "Status", tone: (r) => statusTone[r.status] }),
  c.person("owner", { header: "Owner" }),
  c.text("family", { header: "Family", width: 140 }),
  c.number("open", { header: "Open items", width: 110 }),
  c.date("due", { header: "Due", width: 120 }),
  c.actions((r) => [
    { label: "Open", onSelect: () => console.log("open", r.id) },
    { label: "Reassign", onSelect: () => console.log("reassign", r.id) },
    { label: "Close", tone: "danger", onSelect: () => console.log("close", r.id) },
  ]),
]);

const presets = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue", filters: [{ id: "status", value: "Overdue" }] },
  { id: "review", label: "In review", filters: [{ id: "status", value: "In review" }] },
  { id: "mine", label: "Dana's", filters: [{ id: "owner", value: "Dana Whitfield" }] },
];

/** The register: search, filters as chips, presets with counts, sortable headers, the checkbox column and its bar, a glance on the id, row actions, eight rows a page. */
function Register() {
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (r) => r.id,
    selectable: true,
    pageSize: 8,
    label: "Findings",
    initialState: { sorting: [{ id: "due", desc: false }] },
  });
  return (
    <Stack space="space.150">
      <DataTable.Presets table={table} presets={presets} />
      <DataTable.SelectionBar
        table={table}
        actions={
          <>
            <Button size="small">Reassign</Button>
            <Button size="small">Close</Button>
          </>
        }
      />
      <DataTable
        table={table}
        toolbar={
          <Toolbar
            actions={
              <Button size="small" variant="primary">
                New finding
              </Button>
            }
          >
            <DataTable.Search table={table} placeholder="Search findings" />
            <DataTable.Filter table={table} column="status" />
            <DataTable.Filter table={table} column="owner" />
            <DataTable.Filter table={table} column="family" />
            <DataTable.Filter table={table} column="open" />
            <DataTable.Filter table={table} column="due" />
          </Toolbar>
        }
        empty={{ title: "No findings match", description: "Clear the search or a filter." }}
      />
      <Text size="small" color="color.text.subtle">
        sorted by {table.state.sorting[0]?.id ?? "nothing"} · {table.getRowCount()} of{" "}
        {findings.length} shown
      </Text>
    </Stack>
  );
}

export const RegisterStory: Story = { name: "Register", render: () => <Register /> };

/** Wide enough to scroll: the id and the name pinned at the start, actions at the end, and every column resizable, reorderable by its grip, hideable from the Columns menu or its own. The layout is the reader's and is kept under a view name. */
const wideColumns = defineColumns<Finding>((c) => [
  c.id("id", { pin: "start", hideable: false }),
  c.text("name", { header: "Finding", width: 240, pin: "start", hideable: false }),
  c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
  c.person("owner", { header: "Owner", width: 180 }),
  c.text("family", { header: "Family", width: 160 }),
  c.number("open", { header: "Open items", width: 120 }),
  c.date("due", { header: "Due", width: 130 }),
  c.custom("programme", { header: "Programme", width: 160, cell: (r) => r.family }),
  c.custom("closed", {
    header: "Closed items",
    width: 130,
    align: "end",
    sort: (r) => 120 - r.open,
    cell: (r) => String(120 - r.open),
  }),
  c.custom("opened", { header: "Opened", width: 150, cell: (r) => r.due }),
  c.actions((r) => [{ label: "Open", onSelect: () => console.log("open", r.id) }]),
]);

function Wide({ view }: { view?: string | undefined }) {
  const table = useDataTable({
    columns: wideColumns,
    data: findings,
    getRowId: (r) => r.id,
    selectable: true,
    pageSize: 8,
    resizable: true,
    reorderable: true,
    view,
  });
  return (
    <Stack space="space.150">
      <Inline space="space.100" alignBlock="center">
        <DataTable.Search table={table} />
        <Inline className="ml-auto" space="space.100">
          <DataTable.Columns table={table} />
        </Inline>
      </Inline>
      <DataTable table={table} maxHeight={420} />
      <Text size="small" color="color.text.subtle">
        pinned: {table.state.columnPinning.start.join(", ") || "none"} ·{" "}
        {table.state.columnPinning.end.join(", ") || "none"} · order:{" "}
        {table.state.columnOrder.length ? "the reader's" : "the author's"}
        {view ? ` · kept as ${view}` : ""}
      </Text>
    </Stack>
  );
}

export const PinnedColumns: Story = {
  name: "Pinned, resizable, reorderable",
  render: () => <Wide />,
};

/** The same table under a view name: reorder, resize, hide or pin something, reload the story, and it is still so. Reset view in the Columns menu forgets it. */
export const SavedView: Story = {
  name: "Saved view",
  render: () => <Wide view="storybook-findings" />,
};

/** Two header rows: a heading over the columns it groups. Pinning splits a group at the band's edge. */
const groupedColumns = defineColumns<Finding>((c) => [
  c.id("id"),
  c.text("name", { header: "Finding" }),
  c.group("Ownership", [
    c.person("owner", { header: "Owner", width: 180 }),
    c.text("family", { header: "Family", width: 140 }),
  ]),
  c.group("Progress", [
    c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
    c.number("open", { header: "Open items", width: 110 }),
    c.date("due", { header: "Due", width: 120 }),
  ]),
]);

function Groups() {
  const table = useDataTable({
    columns: groupedColumns,
    data: findings,
    getRowId: (r) => r.id,
    pageSize: 6,
  });
  return <DataTable table={table} />;
}

export const ColumnGroups: Story = { name: "Column groups", render: () => <Groups /> };

/** A header drawn by hand inside ColumnReorder, with the column menu: the escape hatch, for a layout the renderer cannot draw. */
function DraggableHeader({
  table,
  column,
}: {
  table: DataTableInstance<Finding>;
  column: ReturnType<DataTableInstance<Finding>["getVisibleLeafColumns"]>[number];
}) {
  const drag = useColumnDrag(column.id, true);
  return (
    <Table.Header
      ref={drag.setNodeRef}
      style={drag.style}
      trailing={
        <>
          {drag.grip}
          <HeaderMenu table={table} column={column} />
        </>
      }
      width={150}
    >
      {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
    </Table.Header>
  );
}

function ByHand({ table }: { table: DataTableInstance<Finding> }) {
  return (
    <Table>
      <thead>
        <ColumnReorder table={table}>
          <tr>
            {table.getVisibleLeafColumns().map((c) => (
              <DraggableHeader key={c.id} table={table} column={c} />
            ))}
          </tr>
        </ColumnReorder>
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <Table.Row key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <Table.Cell key={cell.id}>{String(cell.getValue() ?? "")}</Table.Cell>
            ))}
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function Reordering() {
  const table = useDataTable({
    columns,
    data: findings.slice(0, 4),
    getRowId: (r) => r.id,
    reorderable: true,
  });
  return <ByHand table={table} />;
}

export const ReorderingByHand: Story = {
  name: "Reordering, by hand",
  render: () => <Reordering />,
};

/** The Table parts on their own: a pinned header and cell with an offset, the edge, and a resize handle. */
function TableParts() {
  return (
    <Table>
      <thead>
        <tr>
          <Table.Header pinned="start" width={92}>
            Pinned
          </Table.Header>
          <Table.Header pinned="start" offset={92} edge width={140}>
            Pinned, edge
          </Table.Header>
          <Table.Header width={160} resize={{ onResizeStart: () => {}, isResizing: false }}>
            Resizable
          </Table.Header>
          <Table.Header
            width={160}
            resize={{ onResizeStart: () => {}, isResizing: true, resizeDelta: 24 }}
          >
            Resizing
          </Table.Header>
          <Table.Header pinned="end" edge width={60}>
            End
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        <Table.Row>
          <Table.Id id="FND-2200" pinned="start" />
          <Table.Cell pinned="start" offset={92} edge>
            Segregation of duties
          </Table.Cell>
          <Table.Cell>Dana Whitfield</Table.Cell>
          <Table.Cell>Access control</Table.Cell>
          <Table.Cell pinned="end" edge />
        </Table.Row>
      </tbody>
    </Table>
  );
}

/** Loading keeps the header and the frame; empty and error sit inside them. */
function States() {
  const [state, setState] = useState<DataTableState>("loading");
  const table = useDataTable({ columns, data: state === "ready" ? findings : [], pageSize: 5 });
  return (
    <Stack space="space.150">
      <Inline space="space.100">
        {(["loading", "empty", "error", "ready"] as const).map((s) => (
          <Button key={s} size="small" isSelected={state === s} onClick={() => setState(s)}>
            {s}
          </Button>
        ))}
      </Inline>
      <DataTable
        table={table}
        state={state}
        empty={{ title: "No findings yet", description: "The first assessment creates them." }}
        error="Findings could not be loaded. Try again."
      />
    </Stack>
  );
}

export const StatesStory: Story = { name: "States", render: () => <States /> };

/** A thousand rows without pagination, scrolling inside the frame. Choosing one row must not redraw the others. */
function Thousand() {
  const data = useMemo(() => makeFindings(1000), []);
  const table = useDataTable({
    columns,
    data,
    getRowId: (r) => r.id,
    selectable: true,
    label: "Findings",
  });
  return <DataTable table={table} maxHeight={480} />;
}

export const ThousandRows: Story = { name: "A thousand rows", render: () => <Thousand /> };

const { SelectionBar, Filter, Search, Presets } = DataTable;

/** The toolbar parts on their own: search, a chip per kind, presets, and the bar with the page chosen and the rest on offer. */
function Parts() {
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (r) => r.id,
    selectable: true,
    pageSize: 5,
    initialState: {
      rowSelection: {
        "FND-2200": true,
        "FND-2201": true,
        "FND-2202": true,
        "FND-2203": true,
        "FND-2204": true,
      },
    },
  });
  return (
    <Stack space="space.150">
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <Search table={table} />
        <Filter table={table} column="status" />
        <Filter table={table} column="owner" />
        <Filter table={table} column="open" />
        <Filter table={table} column="due" />
      </Inline>
      <Presets table={table} presets={presets} />
      <SelectionBar table={table} actions={<Button size="small">Reassign</Button>} />
    </Stack>
  );
}

/** Every state the renderer draws: sorted, filtered, selected, with a glance, with actions; loading, empty and error; the toolbar parts alone; pinned, resizable and reorderable columns; column groups; a header by hand; the Table parts alone. */
export const DataTableMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Register />
      <States />
      <Parts />
      <Wide />
      <Groups />
      <Reordering />
      <TableParts />
    </Stack>
  ),
};
