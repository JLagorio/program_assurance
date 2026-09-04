import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useState } from "react";

import { Button, Toolbar, type Tone } from "../../components";
import {
  ColumnSortable,
  DataTable,
  DragContext,
  HeaderMenu,
  RowSortable,
  defineColumns,
  useColumnDrag,
  useDataTable,
  type ColumnFiltersState,
  type DataTableInstance,
  type DataTableState,
  type PaginationState,
  type SortingState,
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
    family: families[(i * 3) % families.length] ?? "",
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
    label: "Findings with pinned columns",
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
    label: "Findings in column groups",
    columns: groupedColumns,
    data: findings,
    getRowId: (r) => r.id,
    pageSize: 6,
  });
  return <DataTable table={table} />;
}

export const ColumnGroups: Story = { name: "Column groups", render: () => <Groups /> };

/** A header drawn by hand inside DragContext and ColumnSortable, with the column menu: the escape hatch, for a layout the renderer cannot draw. */
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
    <DragContext table={table}>
      <Table>
        <thead>
          <ColumnSortable table={table}>
            <tr>
              {table.getVisibleLeafColumns().map((c) => (
                <DraggableHeader key={c.id} table={table} column={c} />
              ))}
            </tr>
          </ColumnSortable>
        </thead>
        <tbody>
          <RowSortable table={table}>
            {table.getRowModel().rows.map((row) => (
              <Table.Row key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <Table.Cell key={cell.id}>{String(cell.getValue() ?? "")}</Table.Cell>
                ))}
              </Table.Row>
            ))}
          </RowSortable>
        </tbody>
      </Table>
    </DragContext>
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

/** A system as built: subsystems, boards, chips. The name column carries the chevron and the indent; the table is a treegrid and takes the arrow keys. Controls total in the footer. */
type Part = {
  id: string;
  name: string;
  kind: string;
  owner: string;
  controls: number;
  parts?: Part[];
};
const system: Part[] = [
  {
    id: "fc",
    name: "Flight computer",
    kind: "Subsystem",
    owner: "Dana Whitfield",
    controls: 42,
    parts: [
      {
        id: "fc-main",
        name: "Main board",
        kind: "Board",
        owner: "Grace Hoppel",
        controls: 18,
        parts: [
          { id: "fc-main-soc", name: "SoC", kind: "Chip", owner: "Grace Hoppel", controls: 6 },
          { id: "fc-main-tpm", name: "TPM", kind: "Chip", owner: "Marcus Ryde", controls: 9 },
        ],
      },
      { id: "fc-io", name: "I/O board", kind: "Board", owner: "Priya Raghavan", controls: 7 },
      {
        id: "fc-fw",
        name: "Firmware image",
        kind: "Firmware",
        owner: "Linus Aarto",
        controls: 11,
        parts: [
          {
            id: "fc-fw-boot",
            name: "Bootloader",
            kind: "Bootloader",
            owner: "Linus Aarto",
            controls: 4,
          },
        ],
      },
    ],
  },
  {
    id: "gs",
    name: "Ground station",
    kind: "Subsystem",
    owner: "Marcus Ryde",
    controls: 27,
    parts: [
      {
        id: "gs-app",
        name: "Operator console",
        kind: "Application",
        owner: "Priya Raghavan",
        controls: 15,
      },
      {
        id: "gs-svc",
        name: "Telemetry service",
        kind: "Service",
        owner: "Dana Whitfield",
        controls: 12,
      },
    ],
  },
];

const partColumns = defineColumns<Part>((c) => [
  c.text("name", { header: "Element", sortable: false }),
  c.text("kind", { header: "Kind", width: 130, sortable: false }),
  c.person("owner", { header: "Owner", width: 180, sortable: false }),
  c.number("controls", { header: "Controls", width: 110, sortable: false, footer: "sum" }),
]);

function Tree() {
  const [opened, setOpened] = useState<string | null>(null);
  const table = useDataTable({
    columns: partColumns,
    data: system,
    getRowId: (r) => r.id,
    label: "System",
    tree: {
      children: (r) => r.parts,
      label: (r) => r.name,
      hint: (_, n) => (
        <Text size="xsmall" color="color.text.subtle">
          {n} part{n === 1 ? "" : "s"}
        </Text>
      ),
      initialExpanded: ["fc"],
    },
  });
  return (
    <Stack space="space.150">
      <DataTable table={table} onRowClick={(r) => setOpened(r.name)} />
      <Text size="small" color="color.text.subtle">
        {opened ? `opened ${opened}` : "click a row to open it; arrow keys move, open and close"}
      </Text>
    </Stack>
  );
}

export const TreeStory: Story = { name: "Tree", render: () => <Tree /> };

/** A row opens into its detail: here a child table of the finding's items, drawn by the same renderer. */
type Item = { id: string; step: string; state: "Done" | "Open" };
const itemsOf = (f: Finding): Item[] =>
  Array.from({ length: 1 + (f.open % 3) }, (_, i) => ({
    id: `${f.id}-${i + 1}`,
    step: ["Collect evidence", "Review with owner", "Close finding"][i] ?? "Follow up",
    state: i === 0 ? "Done" : "Open",
  }));
const itemColumns = defineColumns<Item>((c) => [
  c.id("id", { header: "Item", width: 130 }),
  c.text("step", { header: "Step" }),
  c.status("state", {
    header: "State",
    width: 110,
    tone: (r) => (r.state === "Done" ? "success" : "neutral"),
  }),
]);

function Items({ finding }: { finding: Finding }) {
  const table = useDataTable({
    columns: itemColumns,
    data: itemsOf(finding),
    getRowId: (r) => r.id,
    label: `${finding.id} items`,
  });
  return <DataTable table={table} />;
}

function Details() {
  const table = useDataTable({
    columns,
    data: findings.slice(0, 6),
    getRowId: (r) => r.id,
    detail: (r) => <Items finding={r} />,
    initialState: { expanded: { "FND-2201": true } },
  });
  return <DataTable table={table} />;
}

export const DetailRows: Story = { name: "Detail rows", render: () => <Details /> };

/** Rows under a band per family, each opened and closed as one; the family column leaves the row. */
function Grouped() {
  const table = useDataTable({ columns, data: findings, getRowId: (r) => r.id, groupBy: "family" });
  return <DataTable table={table} />;
}

export const GroupsStory: Story = { name: "Groups", render: () => <Grouped /> };

/** Pinned rows sit under the header or above the footer, on the sunken surface, whatever the sort. Pin and unpin from the row's actions. */
function PinnedRows() {
  const table = useDataTable({
    columns: useMemo(
      () =>
        defineColumns<Finding>((c) => [
          c.id("id"),
          c.text("name", { header: "Finding" }),
          c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
          c.number("open", { header: "Open items", width: 110, footer: "sum" }),
          c.actions((r) => {
            const row = tableRef.current?.getRow(r.id);
            const pinned = row?.getIsPinned();
            return pinned
              ? [{ label: "Unpin", onSelect: () => row?.pin(false) }]
              : [
                  { label: "Pin to top", onSelect: () => row?.pin("top") },
                  { label: "Pin to bottom", onSelect: () => row?.pin("bottom") },
                ];
          }),
        ]),
      [],
    ),
    data: findings.slice(0, 8),
    getRowId: (r) => r.id,
    pinRows: true,
    initialState: {
      rowPinning: { top: ["FND-2203"], bottom: [] },
      sorting: [{ id: "open", desc: true }],
    },
  });
  tableRef.current = table;
  return <DataTable table={table} />;
}
const tableRef: { current: DataTableInstance<Finding> | null } = { current: null };

export const PinnedRowsStory: Story = {
  name: "Pinned rows and totals",
  render: () => <PinnedRows />,
};

/** Rows dragged into a new order by their handle; sorting is off while it is on. The story keeps the order. */
const rankColumns = defineColumns<Finding>((c) => [
  c.id("id"),
  c.text("name", { header: "Finding" }),
  c.person("owner", { header: "Owner", width: 180 }),
]);

function Ranked() {
  const [data, setData] = useState(() => findings.slice(0, 6));
  const table = useDataTable({
    columns: rankColumns,
    data,
    getRowId: (r) => r.id,
    reorderRows: (moved, target, position) =>
      setData((rows) => {
        const rest = rows.filter((r) => r.id !== moved.id);
        const at = rest.findIndex((r) => r.id === target.id) + (position === "after" ? 1 : 0);
        return [...rest.slice(0, at), moved, ...rest.slice(at)];
      }),
  });
  return (
    <Stack space="space.150">
      <DataTable table={table} />
      <Text size="small" color="color.text.subtle">
        order: {data.map((r) => r.id.slice(-2)).join(" › ")}
      </Text>
    </Stack>
  );
}

export const ReorderingRows: Story = { name: "Reordering rows", render: () => <Ranked /> };

/** Cells that edit in place: the name is an Editable.Text, the status an Editable.Select. Enter commits and moves down the column; the table is a grid. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Editing() {
  const [data, setData] = useState(() => findings.slice(0, 6));
  const [saves, setSaves] = useState(0);
  const patch = (id: string, change: Partial<Finding>) =>
    setData((rows) => rows.map((r) => (r.id === id ? { ...r, ...change } : r)));
  const editingColumns = useMemo(
    () =>
      defineColumns<Finding>((c) => [
        c.id("id"),
        c.text("name", {
          header: "Finding",
          editable: {
            onChange: (row, next) => patch(row.id, { name: next }),
            save: () => wait(500).then(() => setSaves((n) => n + 1)),
            validate: (next) => (next.trim() ? null : "A name is required."),
          },
        }),
        c.status("status", {
          header: "Status",
          width: 140,
          tone: (r) => statusTone[r.status],
          editable: {
            options: statuses,
            onChange: (row, next) => patch(row.id, { status: next as Finding["status"] }),
            save: () => wait(500).then(() => setSaves((n) => n + 1)),
          },
        }),
        c.person("owner", { header: "Owner", width: 180 }),
        c.number("open", { header: "Open items", width: 110 }),
      ]),
    [],
  );
  const table = useDataTable({
    columns: editingColumns,
    data,
    getRowId: (r) => r.id,
    label: "Findings",
  });
  return (
    <Stack space="space.150">
      <DataTable table={table} />
      <Text size="small" color="color.text.subtle">
        {saves} saved · role {table.options.meta?.editable ? "grid" : "table"}
      </Text>
    </Stack>
  );
}

export const EditingStory: Story = { name: "Editing", render: () => <Editing /> };

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
  const table = useDataTable({
    label: "Findings, the states",
    columns,
    data: state === "ready" ? findings : [],
    pageSize: 5,
  });
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

/** Ten thousand rows without pagination: only the rows in view are drawn, the frame scrolls the rest, sorting and choosing still work. */
function Virtualized() {
  const data = useMemo(() => makeFindings(10000), []);
  const table = useDataTable({
    columns,
    data,
    getRowId: (r) => r.id,
    selectable: true,
    label: "Findings",
    virtualize: true,
  });
  return (
    <Stack space="space.150">
      <DataTable table={table} maxHeight={480} />
      <Text size="small" color="color.text.subtle">
        {table.getRowCount().toLocaleString()} rows · {table.getSelectedRowModel().rows.length}{" "}
        chosen
      </Text>
    </Stack>
  );
}

export const ThousandRows: Story = { name: "Virtualized", render: () => <Virtualized /> };

/** The server sorts, filters and pages: the table hands its state over, shows the rows it is given, and counts what the server says. */
const serverRows = makeFindings(240);
function fakeServer(q: {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  pagination: PaginationState;
}): Promise<{ rows: Finding[]; total: number }> {
  let rows = serverRows.filter((r) =>
    q.globalFilter
      ? `${r.id} ${r.name}`.toLowerCase().includes(q.globalFilter.toLowerCase())
      : true,
  );
  for (const f of q.columnFilters) {
    const values = Array.isArray(f.value) ? f.value.map(String) : [String(f.value)];
    rows = rows.filter((r) => values.includes(String(r[f.id as keyof Finding])));
  }
  const sort = q.sorting[0];
  if (sort) {
    const key = sort.id as keyof Finding;
    rows = [...rows].sort((a, b) => {
      const x = a[key];
      const y = b[key];
      const c =
        typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.desc ? -c : c;
    });
  }
  const from = q.pagination.pageIndex * q.pagination.pageSize;
  const page = rows.slice(from, from + q.pagination.pageSize);
  return new Promise((r) => setTimeout(() => r({ rows: page, total: rows.length }), 500));
}

function Server() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "due", desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 8 });
  const [result, setResult] = useState<{ rows: Finding[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    void fakeServer({ sorting, columnFilters, globalFilter, pagination }).then((r) => {
      if (!live) return;
      setResult(r);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [sorting, columnFilters, globalFilter, pagination]);
  const table = useDataTable({
    label: "Findings from the server",
    columns,
    data: result?.rows ?? [],
    getRowId: (r) => r.id,
    pageSize: 8,
    manual: { sorting: true, filtering: true, pagination: true },
    rowCount: result?.total ?? 0,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
  });
  return (
    <DataTable
      table={table}
      state={loading && !result ? "loading" : "ready"}
      toolbar={
        <Toolbar>
          <DataTable.Search table={table} placeholder="Search on the server" />
          <DataTable.Filter table={table} column="status" />
        </Toolbar>
      }
      className={loading ? "opacity-loading" : undefined}
    />
  );
}

export const ServerStory: Story = { name: "Server", render: () => <Server /> };

const { SelectionBar, Filter, Search, Presets } = DataTable;

/** The toolbar parts on their own: search, a chip per kind, presets, and the bar with the page chosen and the rest on offer. */
function Parts() {
  const table = useDataTable({
    label: "Findings and the parts",
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

/** Every state the renderer draws: sorted, filtered, selected, with a glance, with actions; loading, empty and error; the toolbar parts alone; pinned, resizable and reorderable columns; column groups; a header by hand; a tree, detail rows, groups, pinned rows with totals, rows in the reader's order; the Table parts alone. */
export const DataTableMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Register />
      <States />
      <Parts />
      <Wide />
      <Groups />
      <Reordering />
      <Tree />
      <Details />
      <Grouped />
      <PinnedRows />
      <Ranked />
      <Virtualized />
      <Editing />
      <TableParts />
    </Stack>
  ),
};
