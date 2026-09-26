import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useRef, useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import {
  ColumnSortable,
  DataTable,
  DragContext,
  HeaderMenu,
  PageHeader,
  RowSortable,
  Toolbar,
  columnKinds,
  defineColumns,
  readView,
  resetView,
  useColumnDrag,
  useDataTable,
  useTableQuery,
  tableQueryFromSearch,
  tableQueryKey,
  tableQueryToSearch,
  tableQueryToString,
  toCsv,
  viewKey,
  writeView,
  type ColumnFiltersState,
  type DataTableInstance,
  type DataTableState,
  type PaginationState,
  type SortingState,
  type StatusMap,
  type TableQuery,
  type TableQueryParams,
} from "../..";
import { Button, Id, Indicator, Input, Spinner, Stat, type Tone } from "../../components";

import { Table } from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";
import { interact } from "../_lib/interact";

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
  systems: string[];
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
const components = ["Payments API", "Ledger database", "Batch settlement", "Auth gateway"];

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
    systems: components.slice(0, i % 4),
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
function Register({ responsive = false }: { responsive?: boolean }) {
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
        responsive={responsive}
        toolbar={
          <Toolbar
            search={table.state.globalFilter}
            onSearch={table.setGlobalFilter}
            placeholder="Search findings"
            actions={
              <Button size="small" variant="primary">
                New finding
              </Button>
            }
            filters={
              <>
                <DataTable.Filter table={table} column="status" />
                <DataTable.Filter table={table} column="owner" />
                <DataTable.Filter table={table} column="family" />
                <DataTable.Filter table={table} column="open" />
                <DataTable.Filter table={table} column="due" />
              </>
            }
          />
        }
        empty={{ title: "No findings yet", description: "The first assessment creates them." }}
      />
      <Text size="small" color="color.text.subtle">
        sorted by {table.state.sorting[0]?.id ?? "nothing"} · {table.getRowCount()} of{" "}
        {findings.length} shown
      </Text>
    </Stack>
  );
}

export const RegisterStory: Story = {
  name: "Register",
  render: () => <Register />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = within(canvas.getByRole("table", { name: "Findings" }));
    const [page, firstRow] = table.getAllByRole("checkbox");
    await expect(page).not.toBeChecked();
    await userEvent.click(firstRow!);
    await expect(firstRow).toBeChecked();
    await expect(page).toBePartiallyChecked();
    await userEvent.click(page!);
    for (const checkbox of table.getAllByRole("checkbox")) await expect(checkbox).toBeChecked();
    await userEvent.click(page!);
    for (const checkbox of table.getAllByRole("checkbox")) await expect(checkbox).not.toBeChecked();

    // Row actions remain reachable without hovering the row.
    const actions = table.getAllByRole("button", { name: "Row actions" })[0]!;
    firstRow!.focus();
    await userEvent.tab(); // Record glance.
    await userEvent.tab();
    await expect(actions).toHaveFocus();
    await expect(actions).toHaveStyle({ opacity: "1" });
    await userEvent.keyboard("{ArrowDown}");
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("menuitem", { name: "Open" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(actions).toHaveFocus());
  },
};

function LiveFilterOptions() {
  const [data, setData] = useState<Finding[]>([]);
  const table = useDataTable({ columns, data, getRowId: (row) => row.id, label: "Live findings" });
  return (
    <Stack space="space.150">
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <Button onClick={() => setData(findings.slice(0, 3))}>Load findings</Button>
        <Button onClick={() => setData([{ ...findings[0]!, status: "In review" }])}>
          Refresh findings
        </Button>
        <DataTable.Filter table={table} column="status" label="Status filter" />
        <DataTable.Search table={table} placeholder="Search live findings" />
      </Inline>
      <DataTable table={table} />
    </Stack>
  );
}

export const LiveFilters: Story = {
  name: "Filters follow live rows",
  render: () => <LiveFilterOptions />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    const openFilter = async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Status filter" }));
      const popup = await screen.findByRole("dialog", { name: "Status filter" });
      await waitFor(() => expect(popup).toBeVisible());
      return within(popup);
    };
    const closeFilter = async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() =>
        expect(screen.queryByRole("dialog", { name: "Status filter" })).toBeNull(),
      );
    };
    const initial = await openFilter();
    await expect(initial.queryByRole("checkbox")).toBeNull();
    await closeFilter();
    await userEvent.click(canvas.getByRole("button", { name: "Load findings" }));
    const loaded = await openFilter();
    await expect(loaded.getByRole("checkbox", { name: "Draft 1" })).toBeVisible();
    await expect(loaded.getByRole("checkbox", { name: "Overdue 1" })).toBeVisible();
    await expect(loaded.getByRole("checkbox", { name: "Verified 1" })).toBeVisible();
    await closeFilter();
    const search = canvas.getByRole("textbox", { name: "Search live findings" });
    await userEvent.type(search, "FND-2200");
    const narrowed = await openFilter();
    await expect(narrowed.getAllByRole("checkbox")).toHaveLength(1);
    await expect(narrowed.getByRole("checkbox", { name: "Draft 1" })).toBeVisible();
    await closeFilter();
    await userEvent.clear(search);
    await userEvent.click(canvas.getByRole("button", { name: "Refresh findings" }));
    const refreshed = await openFilter();
    await expect(refreshed.getAllByRole("checkbox")).toHaveLength(1);
    await userEvent.click(refreshed.getByRole("checkbox", { name: "In review 1" }));
    await closeFilter();
    await expect(canvas.getByRole("table", { name: "Live findings" })).toHaveTextContent(
      "FND-2200",
    );
  },
};

function MetricsExample() {
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (r) => r.id,
    pageSize: 8,
    label: "Findings with metrics",
  });
  return (
    <DataTable.Metrics>
      <Toolbar
        search={table.state.globalFilter}
        onSearch={table.setGlobalFilter}
        placeholder="Search findings"
        actions={<DataTable.MetricsTrigger />}
        filters={
          <>
            <DataTable.Filter table={table} column="status" />
          </>
        }
      />
      <DataTable.MetricsContent className="px-200 py-100">
        <div className="grid grid-cols-2 gap-200 sm:grid-cols-3">
          <Stat label="Total findings" value={findings.length} />
          <Stat
            label="Verified"
            value={findings.filter((finding) => finding.status === "Verified").length}
          />
          <Stat
            label="Open items"
            value={findings.reduce((total, finding) => total + finding.open, 0)}
          />
        </div>
        <Text size="small" color="color.text.subtle">
          Across all findings. Search and filters only change the rows below.
        </Text>
      </DataTable.MetricsContent>
      <DataTable table={table} className="pt-200" />
    </DataTable.Metrics>
  );
}

export const MetricsStory: Story = {
  name: "Metrics",
  render: () => <MetricsExample />,
};

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
      <Toolbar
        search={table.state.globalFilter}
        onSearch={table.setGlobalFilter}
        placeholder="Find findings"
        views={<DataTable.Presets table={table} presets={presets} variant="menu" />}
      >
        <DataTable.Columns table={table} />
        <DataTable.Settings table={table} />
      </Toolbar>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvas.getByRole("button", { name: "Status column menu" });
    const header = menu.closest("th")!;
    const controls = menu.parentElement!;
    // Keyboard focus reveals the same opaque controls as hover. The rule must paint above them.
    menu.focus();
    await waitFor(() => expect(getComputedStyle(controls).opacity).toBe("1"));
    const rule = getComputedStyle(header, "::before");
    await expect(rule.borderBottomWidth).toBe("1px");
    await expect(Number(rule.zIndex)).toBeGreaterThan(
      Number(getComputedStyle(controls).zIndex) || 0,
    );
    await expect(rule.pointerEvents).toBe("none");
    await expect(within(header).getByRole("button", { name: "Reorder column" })).toBeVisible();

    await userEvent.click(menu);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("menuitemradio", { name: "Sort ascending" }));
    await waitFor(() => expect(header).toHaveAttribute("aria-sort", "ascending"));
    const resize = within(header).getByRole("separator", { name: "Resize column" });
    const width = Number(resize.getAttribute("aria-valuenow"));
    resize.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(resize).toHaveAttribute("aria-valuenow", String(width + 8)));
  },
};

/** The pinned table in a frame that narrows, as in a panel. While the pinned columns would take more than 60% of the frame, pins give way from the middle outward, the name first, so the middle keeps room to scroll; they return when the frame widens. The reader's pins, the column menus and the export stay as they were. */
function PinnedInFrame() {
  const [width, setWidth] = useState(320);
  return (
    <Stack space="space.150">
      <Inline space="space.100" shouldWrap>
        <Button onClick={() => setWidth(320)}>Narrow frame</Button>
        <Button onClick={() => setWidth(960)}>Wide frame</Button>
      </Inline>
      <div data-testid="pinned-frame" style={{ width, maxWidth: "100%" }}>
        <Wide />
      </div>
    </Stack>
  );
}

export const PinnedNarrow: Story = {
  name: "Pinned columns in a narrow frame",
  render: () => <PinnedInFrame />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Findings with pinned columns" });
    const frame = table.parentElement!;
    const heading = (name: string) =>
      canvas.getByRole("button", { name: `${name} column menu` }).closest("th")!;
    const offset = (name: string) => heading(name).style.insetInlineStart;

    // Narrow: the name gives way and scrolls; the id stays pinned after the checkbox.
    await waitFor(() => expect(offset("Finding")).toBe(""));
    await expect(offset("ID")).toBe("32px");
    const band = heading("ID").getBoundingClientRect().right - frame.getBoundingClientRect().left;
    await expect(band).toBeLessThanOrEqual(frame.clientWidth * 0.6);
    const idLeft = heading("ID").getBoundingClientRect().left;
    const nameLeft = heading("Finding").getBoundingClientRect().left;
    frame.scrollLeft = 120;
    fireEvent.scroll(frame);
    await waitFor(() =>
      expect(heading("Finding").getBoundingClientRect().left).toBeLessThan(nameLeft - 100),
    );
    await expect(Math.round(heading("ID").getBoundingClientRect().left)).toBe(Math.round(idLeft));
    frame.scrollLeft = 0;
    fireEvent.scroll(frame);

    // The reader's pins are unchanged: the state still holds them and the menu offers Unpin.
    await expect(canvas.getByText(/pinned: id, name/)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Finding column menu" }));
    const unpin = await body.findByRole("menuitem", { name: "Unpin" });
    await waitFor(() => expect(unpin).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());

    // Wide: the pins return, the name after the id.
    await userEvent.click(canvas.getByRole("button", { name: "Wide frame" }));
    if (canvas.getByTestId("pinned-frame").parentElement!.clientWidth >= 700)
      await waitFor(() => expect(offset("Finding")).toBe("124px"));
  },
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

const movableColumns = defineColumns<Finding>((c) => [
  c.id("id", { pin: "start" }),
  c.text("name", { header: "Finding", width: 200 }),
  c.status("status", { header: "Status", tone: (r) => statusTone[r.status] }),
  c.person("owner", { header: "Owner" }),
  c.date("due", { header: "Due", width: 120 }),
  c.actions((r) => [{ label: "Open", onSelect: () => console.log("open", r.id) }]),
]);

function Movable({ label }: { label: string }) {
  const table = useDataTable({
    label,
    columns: movableColumns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    reorderable: true,
  });
  return <DataTable table={table} />;
}

/** The headings of a table's columns, in the order they are drawn. */
const headingOrder = (table: HTMLElement) =>
  within(table)
    .getAllByRole("button", { name: / column menu$/ })
    .map((menu) => menu.getAttribute("aria-label")!.replace(/ column menu$/, ""));

/** The polite status a reorderable DataTable speaks its column moves through, beside the table's frame. */
const moveStatus = (table: HTMLElement) =>
  table
    .closest<HTMLElement>('[data-slot="table-container"]')!
    .parentElement!.querySelector<HTMLElement>('[role="status"][data-slot="column-move-status"]')!;

/** Nothing covers the middle of the element: a pointer there, or the eye, reaches it, not a pinned column over it. */
const uncovered = (element: HTMLElement) => {
  const box = element.getBoundingClientRect();
  const hit = element.ownerDocument.elementFromPoint(
    box.left + box.width / 2,
    box.top + box.height / 2,
  );
  return hit !== null && element.contains(hit);
};

/** The grip drags a column; its menu moves it one place each way, for the keyboard, a touch screen and anyone who cannot drag. Move left and Move right stop at the edges of the column's band: the pinned id and the row actions keep their places. In a right-to-left table the words follow what the reader sees, so Move right moves a column towards the start. After a move, focus is back on the column's menu, clear of the pinned columns in a frame that scrolls, and a status says where the column stands ("Finding, 3 of 5"). */
export const MovingColumns: Story = {
  name: "Moving a column from its menu",
  render: () => (
    <Stack space="space.300">
      <Movable label="Findings to arrange" />
      <LedgerProvider direction="rtl">
        <Movable label="Findings, right to left" />
      </LedgerProvider>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Findings to arrange" });
    const menuOf = (name: string, of = table) =>
      within(of).getByRole("button", { name: `${name} column menu` });
    const item = (name: string) => body.findByRole("menuitem", { name });
    const closed = () => waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(headingOrder(table)).toEqual(["ID", "Finding", "Status", "Owner", "Due"]);

    // A pinned column keeps its band: its menu has no Move.
    await userEvent.click(menuOf("ID"));
    await body.findByRole("menuitemradio", { name: "Sort ascending" });
    await expect(body.queryByRole("menuitem", { name: /^Move/ })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await closed();

    // At the start of the middle band, Move left is disabled; Move right swaps with Status, and
    // focus comes back to the column's own menu.
    await userEvent.click(menuOf("Finding"));
    await expect(await item("Move left")).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(await item("Move right"));
    await closed();
    await waitFor(() =>
      expect(headingOrder(table)).toEqual(["ID", "Status", "Finding", "Owner", "Due"]),
    );
    await waitFor(() => expect(menuOf("Finding")).toHaveFocus());
    // The status says where it went, and at a phone's width, where the frame scrolls, the menu
    // with focus is not under the pinned row actions.
    await waitFor(() => expect(moveStatus(table)).toHaveTextContent("Finding, 3 of 5"));
    await waitFor(() => expect(uncovered(menuOf("Finding"))).toBe(true));

    // By keyboard alone: open the menu, arrow to Move left, Enter.
    await userEvent.keyboard("{Enter}");
    await body.findByRole("menu");
    const moveLeft = await item("Move left");
    const focused = () => canvasElement.ownerDocument.activeElement;
    for (let press = 0; press < 8 && focused() !== moveLeft; press++)
      await userEvent.keyboard("{ArrowDown}");
    await expect(moveLeft).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await closed();
    await waitFor(() =>
      expect(headingOrder(table)).toEqual(["ID", "Finding", "Status", "Owner", "Due"]),
    );
    await waitFor(() => expect(menuOf("Finding")).toHaveFocus());
    await waitFor(() => expect(moveStatus(table)).toHaveTextContent("Finding, 2 of 5"));
    await waitFor(() => expect(uncovered(menuOf("Finding"))).toBe(true));

    // At the end of the middle band, Move right is disabled: the row actions stay last.
    await userEvent.click(menuOf("Due"));
    await expect(await item("Move right")).toHaveAttribute("aria-disabled", "true");
    await expect(await item("Move left")).not.toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Escape}");
    await closed();

    // Right to left: the start is on the right, so Move right is the disabled one, and Move left
    // puts Finding to the left of Status.
    const rtl = canvas.getByRole("table", { name: "Findings, right to left" });
    await userEvent.click(menuOf("Finding", rtl));
    await expect(await item("Move right")).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(await item("Move left"));
    await closed();
    await waitFor(() =>
      expect(headingOrder(rtl)).toEqual(["ID", "Status", "Finding", "Owner", "Due"]),
    );
    const finding = menuOf("Finding", rtl).closest("th")!.getBoundingClientRect();
    const status = menuOf("Status", rtl).closest("th")!.getBoundingClientRect();
    await expect(finding.right).toBeLessThanOrEqual(status.left + 1);
    await waitFor(() => expect(menuOf("Finding", rtl)).toHaveFocus());
    await waitFor(() => expect(moveStatus(rtl)).toHaveTextContent("Finding, 3 of 5"));
    await waitFor(() => expect(uncovered(menuOf("Finding", rtl))).toBe(true));
  },
};

const panelColumns = defineColumns<Finding>((c) => [
  c.text("name", { header: "Finding", width: 160, priority: 0 }),
  c.status("status", {
    header: "Status",
    width: 100,
    priority: 1,
    tone: (r) => statusTone[r.status],
  }),
  c.person("owner", { header: "Owner" }),
  c.date("due", { header: "Due", width: 112 }),
  c.actions((r) => [{ label: "Open", onSelect: () => console.log("open", r.id) }]),
]);

/** No priority past the name: these columns rank by their place, so a move can change which of them fit. */
const unrankedColumns = defineColumns<Finding>((c) => [
  c.text("name", { header: "Finding", width: 80, priority: 0 }),
  c.status("status", { header: "Status", width: 100, tone: (r) => statusTone[r.status] }),
  c.text("family", { header: "Family", width: 120 }),
  c.number("open", { header: "Open", width: 90 }),
  c.actions((r) => [{ label: "Open", onSelect: () => console.log("open", r.id) }]),
]);

function MovableInPanel({
  label,
  columns,
  selectable = false,
}: {
  label: string;
  columns: typeof panelColumns;
  selectable?: boolean | undefined;
}) {
  const table = useDataTable({
    label,
    columns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    reorderable: true,
    selectable,
  });
  return <DataTable responsive table={table} />;
}

/** A responsive, reorderable register in a 360px panel: it draws the name and the status and folds the rest into More fields. Move left and Move right step only among the columns it draws, so every move shows, and the last drawn column's Move right is disabled rather than passing a folded one. Unranked columns rank by their place, so a move can still change which of them fit: when the moved column itself folds, focus stays in the header row, on the column it passed, and the status says it went to More fields. The select-all checkbox keeps its whole hit area in the heading. */
export const MovingColumnsNarrow: Story = {
  name: "Moving columns in a narrow frame",
  render: () => (
    <Stack space="space.300">
      <div style={{ maxWidth: 360 }}>
        <MovableInPanel label="Findings in a panel" columns={panelColumns} selectable />
      </div>
      <div style={{ maxWidth: 360 }}>
        <MovableInPanel label="Findings with unranked columns" columns={unrankedColumns} />
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const root = canvasElement.ownerDocument.documentElement;
    const doc = canvasElement.ownerDocument;
    const item = (name: string) => body.findByRole("menuitem", { name });
    const closed = () => waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

    // The select-all checkbox: a point 11px from its middle, inside the 24px it needs, still
    // reaches it, sideways and up and down, as it does in a row.
    const panel = canvas.getByRole("table", { name: "Findings in a panel" });
    const all = within(panel).getByRole("checkbox", { name: "Select all rows on this page" });
    const box = all.getBoundingClientRect();
    const [x, y] = [box.left + box.width / 2, box.top + box.height / 2];
    for (const [dx, dy] of [
      [-11, 0],
      [11, 0],
      [0, -11],
      [0, 11],
    ] as const)
      await expect(all.contains(doc.elementFromPoint(x + dx, y + dy))).toBe(true);

    // The panel draws the name and the status; Owner and Due are in More fields. Finding moves
    // right past Status, the next column drawn, and focus comes back to its menu.
    const menuOf = (name: string, of: HTMLElement) =>
      within(of).getByRole("button", { name: `${name} column menu` });
    await waitFor(() => expect(headingOrder(panel)).not.toContain("Owner"));
    const drawn = headingOrder(panel);
    await expect(drawn[0]).toBe("Finding");
    await userEvent.click(menuOf("Finding", panel));
    await body.findByRole("menuitemradio", { name: "Sort ascending" });
    if (drawn.length > 1) {
      await expect(await item("Move left")).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(await item("Move right"));
      await closed();
      await waitFor(() => expect(headingOrder(panel)).toEqual(["Status", "Finding"]));
      await waitFor(() => expect(menuOf("Finding", panel)).toHaveFocus());
      await waitFor(() => expect(moveStatus(panel)).toHaveTextContent("Finding, 2 of 2"));
      // Finding is now the last column drawn: Move right would pass Owner, which is folded.
      await userEvent.click(menuOf("Finding", panel));
      await expect(await item("Move right")).toHaveAttribute("aria-disabled", "true");
      await expect(await item("Move left")).not.toHaveAttribute("aria-disabled", "true");
    } else {
      // A frame that draws only the name has nothing to move past.
      await expect(body.queryByRole("menuitem", { name: /^Move/ })).toBeNull();
    }
    await userEvent.keyboard("{Escape}");
    await closed();

    // Unranked: Status, Family and Open rank by their place. Where Status can move right past
    // Open, over the folded Family, Family then fits before them and Status folds.
    const unranked = canvas.getByRole("table", { name: "Findings with unranked columns" });
    await waitFor(() => expect(headingOrder(unranked)).not.toContain("Family"));
    const before = headingOrder(unranked);
    const passed = before[before.indexOf("Status") + 1];
    await userEvent.click(menuOf("Status", unranked));
    const moveRight = await item("Move right");
    if (passed === undefined) {
      // A frame that draws Status last: Move right would pass only folded columns.
      await expect(moveRight).toHaveAttribute("aria-disabled", "true");
      await userEvent.keyboard("{Escape}");
      await closed();
      return;
    }
    await userEvent.click(moveRight);
    await closed();
    await waitFor(() => expect(headingOrder(unranked)).not.toContain("Status"));
    await waitFor(() =>
      expect(moveStatus(unranked)).toHaveTextContent("Status, moved into More fields"),
    );
    // Focus never drops to the page: it is on the column Status passed.
    await waitFor(() => expect(menuOf(passed, unranked)).toHaveFocus());
  },
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
      guides: true,
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

export const TreeStory: Story = {
  name: "Tree",
  render: () => <Tree />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("treegrid", { name: "System" });
    const rootRow = within(grid).getByRole("row", { name: /Flight computer/ });
    const mainBoard = within(grid).getByRole("row", { name: /Main board/ });
    const headerButtons = within(grid.querySelector("thead")!).getAllByRole("button");
    headerButtons[headerButtons.length - 1]!.focus();
    await userEvent.tab();
    await expect(rootRow).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(mainBoard).toHaveFocus();
    await expect(rootRow).toHaveAttribute("tabindex", "-1");
    await expect(grid.querySelectorAll('tr[tabindex="0"]')).toHaveLength(1);
    const guide = mainBoard.querySelector<HTMLElement>("[data-tree-guides]")!;
    await expect(guide).toHaveAttribute("aria-hidden", "true");
    await expect(guide.closest("td")).toBe(mainBoard.children[0]);
    const rootToggle = within(grid).getByRole("button", { name: "Collapse Flight computer" });
    const childToggle = within(mainBoard).getByRole("button", { name: "Expand Main board" });
    await expect(childToggle.closest("td")).toBe(guide.closest("td"));
    const rootRect = rootToggle.getBoundingClientRect();
    const childRect = childToggle.getBoundingClientRect();
    await expect(
      Math.abs(childRect.x + childRect.width / 2 - rootRect.x - rootRect.width / 2),
    ).toBeCloseTo(16, 0);
    await userEvent.click(childToggle);
    await expect(mainBoard).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.queryByText("opened Main board")).toBeNull();
    await userEvent.click(within(mainBoard).getByRole("button", { name: "Collapse Main board" }));

    // Decorative guides must preserve the treegrid's row focus and disclosure behavior.
    await userEvent.tab({ shift: true });
    await expect(mainBoard).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(mainBoard).toHaveAttribute("aria-expanded", "true");
    const chip = within(grid).getByRole("row", { name: /SoC/ });
    await userEvent.keyboard("{ArrowRight}");
    await expect(chip).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(mainBoard).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(mainBoard).toHaveAttribute("aria-expanded", "false");
    await expect(within(grid).queryByRole("row", { name: /SoC/ })).toBeNull();
    await userEvent.click(rootToggle);
    await expect(rootRow).toHaveAttribute("tabindex", "0");
    await expect(grid.querySelectorAll('tr[tabindex="0"]')).toHaveLength(1);
    await userEvent.click(within(grid).getByRole("button", { name: "Expand Flight computer" }));
  },
};

/** A tree whose rows also open into a child table. One chevron only: the leading disclosure shows the parts, and the row opens into its claims from the Claims cell, which carries its own chevron. Two chevron columns in a row read as twins, so `detailColumn: false` leaves the second out. The two disclosures are separate state, so neither closes the other. */
type Claim = { id: string; requirement: string; responsibility: string; coverage: string };
const claimsOf = (p: Part): Claim[] =>
  Array.from({ length: 1 + (p.controls % 3) }, (_, i) => ({
    id: `${p.id}-c${i + 1}`,
    requirement: `REQ-${1000 + p.controls + i}`,
    responsibility: i === 0 ? "Primary" : "Shared",
    coverage: i % 2 === 0 ? "Full" : "Partial",
  }));
const claimColumns = defineColumns<Claim>((c) => [
  c.id("id", { header: "Claim", width: 150 }),
  c.text("requirement", { header: "Requirement", width: 140 }),
  c.text("responsibility", { header: "Responsibility", width: 150 }),
  c.status("coverage", {
    header: "Coverage",
    width: 120,
    tone: (r) => (r.coverage === "Full" ? "success" : "warning"),
  }),
]);

function Claims({ part }: { part: Part }) {
  const table = useDataTable({
    columns: claimColumns,
    data: claimsOf(part),
    getRowId: (r) => r.id,
    label: `${part.name} claims`,
  });
  return <DataTable table={table} />;
}

const claimingColumns = defineColumns<Part>((c) => [
  c.text("name", { header: "Element", sortable: false }),
  c.text("kind", { header: "Kind", width: 130, sortable: false }),
  c.list("claims", {
    header: "Claims",
    width: 220,
    opens: "detail",
    items: (r) => claimsOf(r).map((x) => ({ key: x.id, label: x.requirement, meta: x.coverage })),
  }),
  c.person("owner", { header: "Owner", width: 180, sortable: false }),
]);

function TreeWithDetail() {
  const table = useDataTable({
    columns: claimingColumns,
    data: system,
    getRowId: (r) => r.id,
    label: "System and its claims",
    view: "storybook-tree-detail",
    tree: {
      children: (r) => r.parts,
      label: (r) => r.name,
      initialExpanded: ["fc"],
    },
    detailColumn: false,
    detail: (r) => <Claims part={r} />,
  });
  return <DataTable table={table} />;
}

export const TreeWithDetailRows: Story = {
  name: "Tree with detail rows",
  render: () => <TreeWithDetail />,
};

/** Several values in one cell: the first by name, the rest as a count, every one in a hover card with its meta line and one status. With a preview on the id, the line is a button and the click is the peek, the same as the eye; a row with none says why. */
function Lists() {
  const [opened, setOpened] = useState<string | null>(null);
  const columns = useMemo(
    () =>
      defineColumns<Finding>((c) => [
        c.id("id", { preview: (r) => setOpened(r.id), active: (r) => r.id === opened }),
        c.text("name", { header: "Finding", minWidth: 200 }),
        c.list("systems", {
          header: "Systems",
          width: 220,
          items: (r) =>
            r.systems.map((s, i) => ({
              key: s,
              label: s,
              meta: "Component · Payments platform",
              status:
                i === 0 && r.status === "Overdue" ? (
                  <Indicator tone="warning">Suspect</Indicator>
                ) : undefined,
            })),
          empty: () => <Indicator tone="neutral">Not yet allocated</Indicator>,
          note: (r) =>
            r.status === "Overdue" ? "1 link suspect since its upstream changed" : undefined,
        }),
        c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
      ]),
    [opened],
  );
  const table = useDataTable({
    columns,
    data: findings.slice(0, 6),
    getRowId: (r) => r.id,
    label: "Findings by system",
  });
  return (
    <Stack space="space.150">
      <DataTable table={table} />
      <Text size="small" color="color.text.subtle">
        {opened
          ? `preview ${opened}`
          : "rest on a system to see them all; click it, or the eye, to preview the row"}
      </Text>
    </Stack>
  );
}

export const ListCells: Story = {
  name: "List cells",
  render: () => <Lists />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByText("FND-2201").closest("tr")!;
    const trigger = within(row).getByRole("button", { name: "Payments API" });
    await userEvent.hover(trigger);
    const popup = () =>
      canvasElement.ownerDocument.querySelector('[data-slot="hover-card-content"]');
    await waitFor(() => expect(popup()).toBeVisible(), { timeout: 2000 });
    await expect(popup()).toHaveTextContent("Component · Payments platform");
    await userEvent.click(trigger);
    await expect(canvas.getByText("preview FND-2201")).toBeVisible();
    await waitFor(() => expect(popup()).not.toBeInTheDocument());
  },
};

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

const groupingOptions = [
  { value: "family", label: "Family" },
  { value: "owner", label: "Owner" },
  { value: "status", label: "Status" },
] as const;

function GroupByExample() {
  const [groupBy, setGroupBy] = useState<"" | "family" | "owner" | "status">("family");
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (row) => row.id,
    label: "Grouped findings",
    selectable: true,
    pageSize: 8,
    groupBy: groupBy || undefined,
    state: { grouping: groupBy ? [groupBy] : [] },
    initialState: { expanded: true },
  });
  return (
    <DataTable.Metrics>
      <Toolbar
        search={table.state.globalFilter}
        onSearch={table.setGlobalFilter}
        placeholder="Search grouped findings"
        actions={
          <>
            <DataTable.GroupBy
              options={groupingOptions}
              value={groupBy}
              onValueChange={setGroupBy}
            />
            <DataTable.Filters table={table} columns={["status", "owner"]} />
            <DataTable.MetricsTrigger />
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </>
        }
      />
      <DataTable.MetricsContent className="px-200 py-100">
        <Stat label="Total findings" value={findings.length} />
      </DataTable.MetricsContent>
      <DataTable table={table} />
    </DataTable.Metrics>
  );
}

export const GroupByStory: Story = {
  name: "Group by menu",
  render: () => <GroupByExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const search = canvas.getByRole("searchbox", { name: "Search grouped findings" });
    await userEvent.type(search, "Segregation");
    await userEvent.click(canvas.getByRole("checkbox", { name: "Select row FND-2200" }));

    const trigger = canvas.getByRole("button", { name: "Group by: Family" });
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(await body.findByRole("menuitemradio", { name: "Family" })).toBeChecked();
    await userEvent.click(body.getByRole("menuitemradio", { name: "Owner" }));
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Group by: Owner" })).toHaveFocus();
    await expect(canvas.getByRole("checkbox", { name: "Select row FND-2200" })).toBeChecked();
    await expect(search).toHaveValue("Segregation");
    await expect(canvas.getByRole("table", { name: "Grouped findings" })).toHaveTextContent(
      "Dana Whitfield",
    );

    await userEvent.click(canvas.getByRole("button", { name: "Group by: Owner" }));
    await userEvent.click(await body.findByRole("menuitemradio", { name: "None" }));
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Group by" })).toHaveFocus();
    await expect(canvas.getByRole("checkbox", { name: "Select row FND-2200" })).toBeChecked();
    await expect(search).toHaveValue("Segregation");
    await expect(
      canvas.getByRole("navigation", { name: "Grouped findings pagination" }),
    ).toBeVisible();

    await userEvent.clear(search);
    await userEvent.click(canvas.getByRole("button", { name: "Filters" }));
    const status = within(await body.findByRole("group", { name: "Status" }));
    await userEvent.click(status.getByRole("checkbox", { name: /^Verified\b/ }));
    await expect(canvas.getByRole("button", { name: "Filters (1)" })).toBeVisible();
    await expect(canvas.queryByRole("checkbox", { name: "Select row FND-2200" })).toBeNull();
    await userEvent.click(body.getByRole("button", { name: "Clear all filters" }));
    await expect(canvas.getByRole("button", { name: "Filters" })).toBeVisible();
    await expect(canvas.getByRole("checkbox", { name: "Select row FND-2200" })).toBeChecked();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Filters" })).toHaveFocus());
  },
};

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
function Editing() {
  const [data, setData] = useState(() => findings.slice(0, 6));
  const [saves, setSaves] = useState(0);
  const pending = useRef<(() => void)[]>([]);
  const save = () =>
    new Promise<void>((resolve) => pending.current.push(resolve)).then(() =>
      setSaves((count) => count + 1),
    );
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
            save,
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
            save,
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
      <Button onClick={() => pending.current.splice(0).forEach((resolve) => resolve())}>
        Finish saves
      </Button>
    </Stack>
  );
}

export const EditingStory: Story = {
  name: "Editing",
  render: () => <Editing />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cells = canvas.getAllByRole("button", { name: /^Finding:/ });
    await userEvent.click(cells[0]!);
    const input = canvas.getByRole("textbox", { name: "Finding" });
    await userEvent.clear(input);
    await interact(() =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByText("0 saved · role grid")).toBeVisible();
    await userEvent.type(input, "Confirmed owner review");
    await interact(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true }),
      );
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", keyCode: 229, bubbles: true }),
      );
    });
    await expect(input).toHaveFocus();
    await expect(canvas.getByText("0 saved · role grid")).toBeVisible();
    await interact(() =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await waitFor(() => expect(cells[1]!).toHaveFocus());
    await interact(() => canvas.getByRole("button", { name: "Finish saves" }).click());
    await waitFor(() => expect(canvas.getByText("1 saved · role grid")).toBeVisible());
    await expect(
      canvas.getByRole("button", { name: "Finding: Confirmed owner review" }),
    ).toBeVisible();
  },
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

/** Loading keeps the header; empty and error sit under it. */
/** Loading, empty, error and ready; and the narrowed empty, which the table draws itself when a search or a filter leaves no rows. */
function States() {
  const [state, setState] = useState<DataTableState | "filtered">("loading");
  const table = useDataTable({
    label: "Findings, the states",
    columns,
    data: state === "ready" || state === "filtered" ? findings : [],
    pageSize: 5,
  });
  const narrowed = String(table.state.globalFilter ?? "") !== "";
  return (
    <Stack space="space.150">
      <Inline space="space.100" shouldWrap>
        {(["loading", "empty", "filtered", "error", "ready"] as const).map((s) => (
          <Button
            key={s}
            size="small"
            isSelected={s === "filtered" ? state === "filtered" && narrowed : state === s}
            onClick={() => {
              setState(s);
              table.setGlobalFilter(s === "filtered" ? "zz-nothing" : "");
            }}
          >
            {s}
          </Button>
        ))}
      </Inline>
      <DataTable
        table={table}
        state={state === "filtered" ? "ready" : state}
        toolbar={
          <Toolbar
            search={table.state.globalFilter}
            onSearch={table.setGlobalFilter}
            placeholder="Search findings"
            filters={<DataTable.Filter table={table} column="status" />}
          />
        }
        empty={{
          title: "No findings yet",
          description: "The first assessment creates them. Until then there is nothing to review.",
          action: (
            <Button variant="primary" onClick={() => setState("ready")}>
              Record an assessment
            </Button>
          ),
          secondary: <Button variant="link">How assessments work</Button>,
        }}
        error="Findings could not be loaded. Try again."
      />
    </Stack>
  );
}

export const StatesStory: Story = {
  name: "States",
  render: () => <States />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // No records: the caller's message and its actions.
    await userEvent.click(canvas.getByRole("button", { name: "empty" }));
    await expect(canvas.getByText("No findings yet")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Record an assessment" })).toBeVisible();
    // A search that matches nothing: the kit's message, and Clear filters brings the rows back.
    await userEvent.click(canvas.getByRole("button", { name: "filtered" }));
    await expect(canvas.getByText("Nothing matches")).toBeVisible();
    await expect(canvas.queryByText("No findings yet")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await expect(canvas.getByLabelText("Search findings")).toHaveValue("");
    await waitFor(() => expect(canvas.queryByText("Nothing matches")).toBeNull());
    await expect(canvas.getAllByRole("row").length).toBeGreaterThan(2);
  },
};

/** The register that is the page: it takes the rest of the window below its own top edge, the header sticks to the frame, the rows scroll inside it and the pagination, with its Rows per page choice, sits at the bottom at any window height. */
function Filling() {
  const data = useMemo(() => makeFindings(200), []);
  const table = useDataTable({
    columns,
    data,
    getRowId: (r) => r.id,
    selectable: true,
    pageSize: 25,
    label: "Findings",
  });
  return (
    <div className="px-300 pt-200">
      <Stack space="space.200" className="min-w-0">
        <PageHeader>
          <PageHeader.Title>Findings</PageHeader.Title>
        </PageHeader>
        <DataTable
          fill
          table={table}
          toolbar={
            <Toolbar
              search={table.state.globalFilter}
              onSearch={table.setGlobalFilter}
              placeholder="Search findings"
              actions={
                <Button size="small" variant="primary">
                  New finding
                </Button>
              }
              filters={
                <>
                  <DataTable.Filter table={table} column="status" />
                  <DataTable.Filter table={table} column="owner" />
                </>
              }
            />
          }
          empty={{ title: "No findings yet" }}
        />
      </Stack>
    </div>
  );
}

export const FillStory: Story = {
  name: "Fills the window",
  parameters: { layout: "fullscreen" },
  render: () => <Filling />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByRole("table", { name: "Findings" }).parentElement!;
    // The frame is the scroller, so the keyboard can reach it.
    await waitFor(() => expect(frame.scrollHeight).toBeGreaterThan(frame.clientHeight));
    await expect(frame).toHaveAttribute("tabindex", "0");
    // The page fits the window and the pagination sits inside it.
    const pagination = canvas.getByRole("navigation", { name: /pagination/i });
    await waitFor(() =>
      expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight),
    );
    await expect(pagination.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    // The header sticks to the frame while the rows scroll under it.
    frame.scrollTop = 240;
    const header = canvas.getAllByRole("columnheader")[0]!;
    await waitFor(() =>
      expect(
        Math.abs(header.getBoundingClientRect().top - frame.getBoundingClientRect().top),
      ).toBeLessThanOrEqual(1),
    );
    // The hairline is the heading's own, so it stays under the stuck header.
    await expect(getComputedStyle(header, "::before").borderBottomWidth).toBe("1px");
    // The reader chooses the rows per page; the range follows.
    await userEvent.click(canvas.getByRole("combobox", { name: "Rows per page" }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("option", { name: "50 per page" }));
    await waitFor(() => expect(canvas.getByText("1–50 of 200")).toBeVisible());
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
  },
};

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
    <div aria-busy={loading}>
      <DataTable
        table={table}
        state={loading && !result ? "loading" : "ready"}
        toolbar={
          <Toolbar
            search={table.state.globalFilter}
            onSearch={table.setGlobalFilter}
            placeholder="Search on the server"
            filters={
              <>
                <DataTable.Filter table={table} column="status" />
              </>
            }
          />
        }
      />
    </div>
  );
}

export const ServerStory: Story = {
  name: "Server",
  render: () => <Server />,
  play: async ({ canvasElement }) => {
    // Wait for the response before checking the settled, interactive table.
    const table = within(canvasElement).getByRole("table", { name: "Findings from the server" });
    await waitFor(() => expect(table.closest("[aria-busy]")).toHaveAttribute("aria-busy", "false"));
  },
};

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
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <Presets table={table} presets={presets} variant="menu" />
        <DataTable.Columns table={table} />
        <DataTable.Settings table={table} />
      </Inline>
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
      <TreeWithDetail />
      <Lists />
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

/** Three rows on the register's columns, for the Don't pairs. */
function Small({ state }: { state?: DataTableState | undefined }) {
  const table = useDataTable({
    label: "Findings",
    columns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
  });
  return <DataTable table={table} {...(state ? { state } : {})} />;
}

function Chips() {
  const table = useDataTable({ label: "Findings", columns, data: findings, getRowId: (r) => r.id });
  return (
    <Inline space="space.100" alignBlock="center">
      <DataTable.Search table={table} placeholder="Search findings" />
      <DataTable.Filter table={table} column="status" />
      <DataTable.Filter table={table} column="owner" />
    </Inline>
  );
}

function FilterRow() {
  return (
    <Table label="Findings">
      <thead>
        <tr>
          <Table.Header width={110}>Id</Table.Header>
          <Table.Header>Finding</Table.Header>
          <Table.Header width={140}>Status</Table.Header>
        </tr>
        <tr>
          <Table.Header hairline={false} aria-hidden />
          <Table.Header>
            <Input size="small" placeholder="Filter" aria-label="Filter findings" />
          </Table.Header>
          <Table.Header>
            <Input size="small" placeholder="Filter" aria-label="Filter status" />
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        {findings.slice(0, 3).map((f) => (
          <Table.Row key={f.id}>
            <Table.Id id={f.id} />
            <Table.Cell>{f.name}</Table.Cell>
            <Table.Cell>{f.status}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<Chips />}
        doText="Filters are chips in the toolbar, built from the columns; the applied value reads on the chip."
        dont={<FilterRow />}
        dontText="A filter row under the header. It takes a row from every table, it is empty most of the time, and a screen reader meets three fields before the first record."
      />
      <Pair
        do={<Small state="loading" />}
        doText="Loading keeps the header and draws skeleton rows where the records will be."
        dont={
          <div className="flex h-800 items-center justify-center rounded-large border border-default">
            <Spinner />
          </div>
        }
        dontText="A spinner in place of the table. The columns vanish, the height changes, and the page jumps when the rows arrive."
      />
    </Stack>
  ),
};

const kinds = columnKinds<{ name: string; count: number }>();
const persistedColumns = [
  kinds.text("name", { header: "Program name", width: 280 }),
  kinds.number("count", { header: "Count", width: 160 }),
];
function ResizableTable() {
  const table = useDataTable({
    columns: persistedColumns,
    data: [{ name: "Assurance program", count: 1234 }],
    resizable: true,
    label: "Programs",
    layout: "fixed",
  });
  return <DataTable table={table} />;
}
export const KeyboardResizeMatrix: Story = {
  render: () => (
    <LedgerProvider>
      <ResizableTable />
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const handles = within(canvasElement).getAllByRole("separator", {
      name: "Resize column",
    });
    const handle = handles[0]!;
    const before = Number(handle.getAttribute("aria-valuenow"));
    handle.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(handle).toHaveAttribute("aria-valuenow", String(before + 8)));
    await userEvent.keyboard("{Home}");
    await waitFor(() =>
      expect(handle.getAttribute("aria-valuenow")).toBe(handle.getAttribute("aria-valuemin")),
    );
    await expect(within(canvasElement).getByText("1,234")).toBeVisible();
  },
};

const firstView = "data-table-example-first";
const secondView = "data-table-example-second";
const storageRows = [{ name: "Persisted program", count: 1234 }];
function StoredTable() {
  const [view, setView] = useState(firstView);
  const table = useDataTable({
    columns: persistedColumns,
    data: storageRows,
    view,
    resizable: true,
    label: "Stored programs",
    layout: "fixed",
    initialState: { columnOrder: ["count", "name"], columnSizing: { name: 340 } },
  });
  return (
    <Stack space="space.200">
      <Button onClick={() => setView(firstView)}>First view</Button>
      <Button onClick={() => setView(secondView)}>Second view</Button>
      <Button onClick={() => table.setColumnSizing({ name: 420 })}>Widen current view</Button>
      <Button onClick={() => resetView(table)}>Restore author layout</Button>
      <DataTable table={table} />
    </Stack>
  );
}
function StoredViewsFixture() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const saved = [firstView, secondView].map((view) => localStorage.getItem(viewKey(view)));
    writeView(firstView, {
      order: ["name", "count"],
      sizing: { name: 310 },
      visibility: {},
      pinning: { start: [], end: [] },
    });
    writeView(secondView, {
      order: ["count", "name"],
      sizing: { name: 400 },
      visibility: {},
      pinning: { start: [], end: [] },
    });
    setReady(true);
    return () =>
      [firstView, secondView].forEach((view, index) => {
        const previous = saved[index];
        if (previous == null) localStorage.removeItem(viewKey(view));
        else localStorage.setItem(viewKey(view), previous);
      });
  }, []);
  return ready ? <StoredTable /> : <Text>Preparing saved views</Text>;
}
export const StoredViewsMatrix: Story = {
  render: () => <StoredViewsFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstHeader = () => canvas.getAllByRole("columnheader")[0]!;
    const nameWidth = () =>
      canvas
        .getAllByRole("columnheader")
        .find((header) => header.textContent?.includes("Program name"))!
        .querySelector('[role="separator"]')!
        .getAttribute("aria-valuenow");
    await canvas.findByRole("table", { name: "Stored programs" });
    await waitFor(() => expect(nameWidth()).toBe("310"));
    await expect(firstHeader()).toHaveTextContent("Program name");
    await userEvent.click(canvas.getByRole("button", { name: "Second view" }));
    await waitFor(() => expect(nameWidth()).toBe("400"));
    await expect(firstHeader()).toHaveTextContent("Count");
    await expect(readView(firstView)?.sizing["name"]).toBe(310);
    await userEvent.click(canvas.getByRole("button", { name: "Widen current view" }));
    await waitFor(() => expect(readView(secondView)?.sizing["name"]).toBe(420));
    await userEvent.click(canvas.getByRole("button", { name: "First view" }));
    await waitFor(() => expect(nameWidth()).toBe("310"));
    await expect(readView(secondView)?.sizing["name"]).toBe(420);
    await userEvent.click(canvas.getByRole("button", { name: "Restore author layout" }));
    await waitFor(() => expect(nameWidth()).toBe("340"));
    await expect(firstHeader()).toHaveTextContent("Count");
  },
};

function ResponsiveRegister() {
  const [width, setWidth] = useState(390);
  const table = useDataTable({
    data: findings.slice(0, 3),
    columns: defineColumns<Finding>((c) => [
      c.id("id", { header: "Code", width: 100, priority: 1, pin: "start" }),
      c.custom("name", {
        header: "Finding",
        minWidth: 200,
        priority: 0,
        pin: "start",
        sort: (row) => row.name,
        text: (row) => row.name,
        cell: (row) => row.name,
      }),
      c.status("status", {
        header: "Status",
        width: 120,
        priority: 2,
        tone: (row) => statusTone[row.status],
      }),
      c.text("owner", { header: "Owner", width: 160, priority: 3 }),
      c.text("family", { header: "Family", width: 140 }),
      c.date("due", { header: "Due", width: 120 }),
    ]),
    getRowId: (row) => row.id,
    label: "Responsive findings",
    initialState: {
      columnVisibility: { family: false },
      columnPinning: { start: ["name", "id"], end: [] },
    },
  });
  return (
    <Stack>
      <Inline space="space.100" shouldWrap>
        <Button onClick={() => setWidth(280)}>Narrow container</Button>
        <Button onClick={() => setWidth(1000)}>Wide container</Button>
        <Button onClick={() => table.getColumn("owner")?.toggleVisibility(false)}>
          Hide owner
        </Button>
      </Inline>
      <div data-testid="responsive-container" style={{ width, maxWidth: "100%" }}>
        <DataTable responsive table={table} />
      </div>
      <output data-testid="responsive-visibility">
        {JSON.stringify(table.state.columnVisibility)}
      </output>
      <output data-testid="responsive-export">{toCsv(table)}</output>
    </Stack>
  );
}

export const ResponsiveContainers: Story = {
  name: "Responsive containers",
  render: () => <ResponsiveRegister />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Responsive findings" });
    const container = canvas.getByTestId("responsive-container");
    const fits = () => {
      expect(table.getBoundingClientRect().width).toBeLessThanOrEqual(container.clientWidth + 1);
      expect(table.parentElement!.scrollWidth).toBeLessThanOrEqual(container.clientWidth + 1);
    };
    await waitFor(fits);
    await userEvent.click(canvas.getByRole("button", { name: "Narrow container" }));
    const more = await canvas.findByRole("button", {
      name: `More fields for ${findings[0]!.name}`,
    });
    await waitFor(fits);
    await userEvent.click(more);
    await expect(more).toHaveAttribute("aria-expanded", "true");
    const fields = canvasElement.ownerDocument.getElementById(more.getAttribute("aria-controls")!);
    await expect(within(fields!).getByText("Code", { exact: true })).toBeVisible();
    await expect(within(fields!).getByText("Dana Whitfield", { exact: true })).toBeVisible();
    await expect(within(fields!).queryByText("Family", { exact: true })).not.toBeInTheDocument();
    const before = canvas.getByTestId("responsive-export").textContent;
    await expect(canvas.getByTestId("responsive-visibility")).toHaveTextContent('{"family":false}');
    await userEvent.click(canvas.getByRole("button", { name: "Wide container" }));
    // The wide container unfolds the fields only where the canvas has room for it (not on a phone).
    if (container.parentElement!.clientWidth >= 1000) {
      await waitFor(() =>
        expect(canvas.queryAllByRole("button", { name: /^More fields for/ })).toHaveLength(0),
      );
      await waitFor(fits);
      const headers = within(table).getAllByRole("columnheader");
      expect(headers[1]!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        headers[0]!.getBoundingClientRect().right - 1,
      );
    }
    expect(canvas.getByTestId("responsive-export").textContent).toBe(before);
    await userEvent.click(canvas.getByRole("button", { name: "Hide owner" }));
    await userEvent.click(canvas.getByRole("button", { name: "Narrow container" }));
    await waitFor(() =>
      expect(canvas.getByTestId("responsive-visibility")).toHaveTextContent('"owner":false'),
    );
    const reopened = await canvas.findByRole("button", {
      name: `More fields for ${findings[0]!.name}`,
    });
    if (reopened.getAttribute("aria-expanded") !== "true") await userEvent.click(reopened);
    const retained = canvasElement.ownerDocument.getElementById(
      reopened.getAttribute("aria-controls")!,
    );
    expect(within(retained!).queryByText("Owner", { exact: true })).not.toBeInTheDocument();
    expect(canvas.getByTestId("responsive-export").textContent).not.toContain("Dana Whitfield");
  },
};

function ResponsiveGroups() {
  const table = useDataTable({
    data: findings.slice(0, 2),
    columns: defineColumns<Finding>((c) => [
      c.group("Identity", [
        c.id("id", { width: 100, priority: 1 }),
        c.text("name", { header: "Finding", minWidth: 200, priority: 0 }),
      ]),
      c.group("Context", [
        c.text("owner", { header: "Owner", width: 160 }),
        c.text("family", { header: "Family", width: 140 }),
      ]),
    ]),
    getRowId: (row) => row.id,
    label: "Grouped responsive findings",
    selectable: true,
  });
  return (
    <div style={{ width: 280 }}>
      <DataTable responsive table={table} />
    </div>
  );
}
export const ResponsiveGroupedHeaders: Story = {
  name: "Responsive grouped headers",
  render: () => <ResponsiveGroups />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Grouped responsive findings" });
    await waitFor(() => {
      expect(table.getBoundingClientRect().width).toBeLessThanOrEqual(281);
      expect(table.parentElement!.scrollWidth).toBeLessThanOrEqual(281);
    });
    expect(canvas.queryByRole("columnheader", { name: "Context" })).not.toBeInTheDocument();
    expect(canvas.getByRole("columnheader", { name: "Identity" })).toHaveAttribute("colspan", "1");
    await userEvent.click(canvas.getByRole("checkbox", { name: "Select all rows on this page" }));
    expect(
      canvas.getAllByRole("checkbox").every((el) => el.getAttribute("aria-checked") === "true"),
    ).toBe(true);
    await userEvent.click(canvas.getAllByRole("button", { name: /^More fields for/ })[0]!);
    await expect(canvas.getByText("Dana Whitfield", { exact: true })).toBeVisible();
  },
};

type VirtualResponsiveRow = { id: string; name: string; description: string; owner: string };
const virtualResponsiveRows: VirtualResponsiveRow[] = Array.from({ length: 2000 }, (_, index) => ({
  id: String(index),
  name: `Record ${String(index + 1).padStart(4, "0")}`,
  description: "The supporting evidence remains available when the table narrows. ".repeat(12),
  owner: `Owner ${index + 1}`,
}));
const virtualResponsiveColumns = defineColumns<VirtualResponsiveRow>((c) => [
  c.text("name", { header: "Record", width: 240, priority: 0 }),
  c.text("owner", { header: "Owner", width: 180 }),
  c.text("description", { header: "Description", width: 400 }),
]);

function ResponsiveVirtualRegister() {
  const [width, setWidth] = useState(390);
  const table = useDataTable({
    data: virtualResponsiveRows,
    columns: virtualResponsiveColumns,
    getRowId: (row) => row.id,
    label: "Responsive virtual records",
    virtualize: true,
  });
  return (
    <Stack>
      <Inline space="space.100" shouldWrap>
        <Button onClick={() => setWidth(280)}>Preview width</Button>
        <Button onClick={() => setWidth(900)}>Page width</Button>
        <Button onClick={() => table.setSorting([{ id: "name", desc: true }])}>
          Reverse records
        </Button>
      </Inline>
      <div data-testid="virtual-container" style={{ width, maxWidth: "100%" }}>
        <DataTable table={table} responsive maxHeight={320} />
      </div>
    </Stack>
  );
}

/** Thousands of narrow rows remain virtual; disclosed fields contribute their measured height. */
export const ResponsiveVirtualRows: Story = {
  render: () => <ResponsiveVirtualRegister />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Responsive virtual records" });
    const frame = table.parentElement!;
    const container = canvas.getByTestId("virtual-container");
    const mountedRows = () => table.querySelectorAll("tr[data-row-id]");
    const fits = () => {
      expect(frame.scrollWidth).toBeLessThanOrEqual(container.clientWidth + 1);
      expect(mountedRows().length).toBeLessThan(60);
    };
    await waitFor(fits);
    await waitFor(() => expect(frame.scrollHeight).toBeGreaterThan(50000));
    const originalHeight = frame.scrollHeight;
    const more = await canvas.findByRole("button", { name: "More fields for Record 0001" });
    await userEvent.click(more);
    const detail = canvasElement.ownerDocument.getElementById(more.getAttribute("aria-controls")!)!;
    await expect(within(detail).getByText("Owner 1", { exact: true })).toBeVisible();
    await waitFor(() => {
      expect(detail.getBoundingClientRect().height).toBeGreaterThan(120);
      expect(frame.scrollHeight).toBeGreaterThanOrEqual(
        originalHeight + detail.getBoundingClientRect().height - 2,
      );
    });
    await waitFor(fits);
    await userEvent.click(canvas.getByRole("button", { name: "Preview width" }));
    await waitFor(fits);
    // The record leaves the rendered window, then returns with its disclosure state intact.
    frame.scrollTop = 20000;
    fireEvent.scroll(frame);
    await waitFor(() => expect(table.querySelector('tr[data-row-id="0"]')).toBeNull());
    await waitFor(fits);
    frame.scrollTop = 0;
    fireEvent.scroll(frame);
    const returned = await canvas.findByRole("button", { name: "More fields for Record 0001" });
    await expect(returned).toHaveAttribute("aria-expanded", "true");
    const returnedDetail = canvasElement.ownerDocument.getElementById(
      returned.getAttribute("aria-controls")!,
    )!;
    const following = returnedDetail.nextElementSibling!;
    await expect(following.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      returnedDetail.getBoundingClientRect().bottom - 1,
    );
    // A wide layout must discard a cached narrow disclosure height even while it is offscreen. The
    // page width unfolds the fields only where the canvas has room for it (not on a phone).
    if (container.parentElement!.clientWidth < 900) return;
    frame.scrollTop = 20000;
    fireEvent.scroll(frame);
    await waitFor(() => expect(table.querySelector('tr[data-row-id="0"]')).toBeNull());
    await userEvent.click(canvas.getByRole("button", { name: "Page width" }));
    await waitFor(() =>
      expect(canvas.queryAllByRole("button", { name: /^More fields for/ })).toHaveLength(0),
    );
    await waitFor(() =>
      expect(Math.abs(frame.scrollHeight - originalHeight)).toBeLessThanOrEqual(2),
    );
    frame.scrollTop = 0;
    fireEvent.scroll(frame);
    await waitFor(() => expect(mountedRows()[0]).toHaveAttribute("data-row-id", "0"));
    await userEvent.click(canvas.getByRole("button", { name: "Preview width" }));
    const restored = await canvas.findByRole("button", { name: "More fields for Record 0001" });
    await expect(restored).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(restored);
    await waitFor(() => expect(restored).toHaveAttribute("aria-expanded", "false"));
    await userEvent.click(canvas.getByRole("button", { name: "Reverse records" }));
    await waitFor(() => expect(mountedRows()[0]).toHaveAttribute("data-row-id", "1999"));
    await waitFor(fits);
  },
};

/** The register on a small phone: the saved-view strip scrolls inside its row rather than past the window, the toolbar takes two rows (the search, then More with the filters and the primary at the end, its label whole), and the table folds its lower-priority fields into the row disclosure. */
export const RegisterNarrow: Story = {
  name: "Register at 340px",
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  tags: ["narrow"],
  render: () => <Register responsive />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    const canvas = within(canvasElement);
    const strip = canvas.getByRole("group", { name: "Saved questions" });
    const viewport = strip.closest<HTMLElement>("[data-slot=scroller-viewport]")!;
    // The current labels can fit exactly; longer labels still scroll inside this boundary.
    await expect(viewport).toHaveStyle({ overflowX: "auto" });
    await expect(viewport.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    // Two rows: the search, then More with the primary at the end.
    const search = canvas.getByRole("searchbox", { name: "Search findings" });
    const more = await canvas.findByRole("button", { name: "More filters" });
    const primary = canvas.getByRole("button", { name: "New finding" });
    await expect(search.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      more.getBoundingClientRect().top,
    );
    await expect(
      Math.abs(more.getBoundingClientRect().top - primary.getBoundingClientRect().top),
    ).toBeLessThan(4);
    await expect(primary.scrollWidth).toBeLessThanOrEqual(primary.clientWidth);
    await expect(primary.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    const table = canvas.getByRole("table", { name: "Findings" });
    await waitFor(() =>
      expect(table.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth),
    );
    await expect(await canvas.findAllByRole("button", { name: /More fields/ })).not.toHaveLength(0);
  },
};

const longFindings: Finding[] = [
  { ...findings[0]!, name: "Segregation of duties across payables, receivables and treasury" },
  ...findings.slice(1, 6),
];

/** A register on a phone, where nothing can hover: the kebab and the eye are always shown, the value beside the eye ends in an ellipsis before it rather than under it, and every control smaller than 24px takes a 24px hit area. Here the id folds into More fields, so the eye moves to the name. */
function PhoneRegister() {
  const [opened, setOpened] = useState<string | null>(longFindings[0]!.id);
  const columns = useMemo(
    () =>
      defineColumns<Finding>((c) => [
        c.id("id", {
          preview: (r) => setOpened(r.id),
          active: (r) => r.id === opened,
          priority: 1,
        }),
        c.text("name", { header: "Finding", minWidth: 240, priority: 0 }),
        c.status("status", { header: "Status", tone: (r) => statusTone[r.status], priority: 2 }),
        c.person("owner", { header: "Owner" }),
        c.actions((r) => [
          { label: "Open", onSelect: () => setOpened(r.id) },
          { label: "Reassign", onSelect: () => console.log("reassign", r.id) },
        ]),
      ]),
    [opened],
  );
  const table = useDataTable({
    columns,
    data: longFindings,
    getRowId: (r) => r.id,
    label: "Findings on a phone",
  });
  return (
    <Stack space="space.150">
      <DataTable responsive table={table} />
      <Text size="small" color="color.text.subtle">
        {opened ? `preview ${opened}` : "no preview open"}
      </Text>
    </Stack>
  );
}

export const RowControlsPhone: Story = {
  name: "Row controls at 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  tags: ["narrow"],
  render: () => <PhoneRegister />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const canvas = within(canvasElement);
    const root = canvasElement.ownerDocument.documentElement;
    const table = canvas.getByRole("table", { name: "Findings on a phone" });
    await waitFor(() => expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth));

    // At this width the id folds into More fields, so the eye moves to the name; the open row's
    // eye shows, and the name beside it ends in an ellipsis before it.
    const open = () =>
      within(table)
        .getByRole("button", { name: "Preview row", pressed: true })
        .closest<HTMLElement>('[data-slot="preview-eye"]')!;
    await waitFor(() =>
      expect(open().previousElementSibling).toHaveTextContent(longFindings[0]!.name),
    );
    const slot = open();
    const value = slot.previousElementSibling as HTMLElement;
    await expect(slot).toHaveStyle({ opacity: "1" });
    await expect(value).toHaveStyle({ paddingInlineEnd: "24px" });
    await expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    await expect(value.getBoundingClientRect().right - 24).toBeLessThanOrEqual(
      slot.getBoundingClientRect().left + 1,
    );

    // Nothing waits for a hover: the kebab carries the no-hover rule, and every control smaller
    // than 24px carries the touch hit area.
    const kebab = within(table).getAllByRole("button", { name: "Row actions" })[0]!;
    await expect(kebab).toHaveClass("[@media(hover:none)]:opacity-100");
    for (const control of within(table).getAllByRole("button")) {
      const { width, height } = control.getBoundingClientRect();
      if (width > 0 && (width < 24 || height < 24))
        await expect(control).toHaveClass("touch-target");
    }

    // Another row's eye moves the preview, and the room follows it.
    const second = within(table.querySelectorAll<HTMLElement>("tr[data-row-id]")[1]!);
    await userEvent.click(second.getByRole("button", { name: "Preview row" }));
    await waitFor(() =>
      expect(second.getByRole("button", { name: "Preview row" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    await expect(canvas.getByText(`preview ${longFindings[1]!.id}`)).toBeVisible();
  },
};

/* The sort as a toolbar menu, a column's width from its menu, the question kept outside the
   register, and one status vocabulary. */

/** The sort trigger, wherever the toolbar has put it: in the row, or inside More when the row cannot hold the display controls. */
const findSortTrigger = async (canvasElement: HTMLElement) => {
  const body = within(canvasElement.ownerDocument.body);
  const shown = body.queryByRole("button", { name: /^Sort\b/ });
  if (shown) return shown;
  await userEvent.click(within(canvasElement).getByRole("button", { name: /^More/ }));
  return body.findByRole("button", { name: /^Sort\b/ });
};

/** The toolbar's filter chip for a column: the button that opens its popover, not the header's sort or column menu. */
const filterChip = (canvasElement: HTMLElement, label: string) =>
  within(canvasElement)
    .getAllByRole("button", { name: new RegExp(`^${label}`) })
    .find((button) => button.getAttribute("aria-haspopup") === "dialog")!;

/** The leaf header whose heading reads `name`. */
const headerNamed = (table: HTMLElement, name: string) =>
  within(table)
    .getAllByRole("columnheader")
    .find((header) => header.textContent?.trim() === name);

function SortRegister({
  label = "Findings by sort",
  offered,
  sortLabel,
  sorted = true,
}: {
  label?: string | undefined;
  offered?: readonly string[] | undefined;
  sortLabel?: string | undefined;
  sorted?: boolean | undefined;
}) {
  const table = useDataTable({
    columns,
    data: findings.slice(0, 8),
    getRowId: (r) => r.id,
    label,
    initialState: sorted ? { sorting: [{ id: "due", desc: false }] } : {},
  });
  return (
    <DataTable
      table={table}
      toolbar={
        <Toolbar
          search={table.state.globalFilter}
          onSearch={table.setGlobalFilter}
          placeholder="Search findings"
        >
          <DataTable.Sort table={table} columns={offered} label={sortLabel} />
          <DataTable.Columns table={table} />
          <DataTable.Settings table={table} />
        </Toolbar>
      }
    />
  );
}

/** `DataTable.Sort` in the toolbar: the trigger reads the sort, the menu picks the column under Sort by and the direction under it, in words that follow the column (oldest first for a date, A to Z for a name), and stays open so both are set in one visit. The header it sorts by keeps its arrow and `aria-sort`. */
export const SortMenuStory: Story = {
  name: "Sort menu",
  render: () => <SortRegister />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Findings by sort" });
    const trigger = await findSortTrigger(canvasElement);
    await expect(trigger).toHaveAccessibleName("Sort: Due, Oldest first");
    await expect(trigger).toHaveAttribute("data-slot", "data-table-sort");
    await expect(headerNamed(table, "Due")).toHaveAttribute("aria-sort", "ascending");

    // By pointer: a column under Sort by, then a direction; the menu stays open between them.
    await userEvent.click(trigger);
    const menu = await body.findByRole("menu");
    // Each set of radios is one group, named by its label.
    const columnsGroup = within(menu).getByRole("group", { name: "Sort by" });
    const directionGroup = within(menu).getByRole("group", { name: "Direction" });
    await expect(within(columnsGroup).getByRole("menuitemradio", { name: "Due" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(within(directionGroup).getAllByRole("menuitemradio")).toHaveLength(2);
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: "Owner" }));
    await waitFor(() =>
      expect(headerNamed(table, "Owner")).toHaveAttribute("aria-sort", "ascending"),
    );
    await expect(headerNamed(table, "Due")).not.toHaveAttribute("aria-sort");
    await expect(menu).toBeVisible();
    await userEvent.click(within(menu).getByRole("menuitemradio", { name: "Z to A" }));
    await waitFor(() =>
      expect(headerNamed(table, "Owner")).toHaveAttribute("aria-sort", "descending"),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    const again = await findSortTrigger(canvasElement);
    await waitFor(() => expect(again).toHaveFocus());
    await expect(again).toHaveAccessibleName("Sort: Owner, Z to A");

    // By keyboard: Enter opens it, the arrows reach Open items, Enter chooses; the direction holds.
    await userEvent.keyboard("{Enter}");
    await body.findByRole("menu");
    const open = await body.findByRole("menuitemradio", { name: "Open items" });
    const focused = () => canvasElement.ownerDocument.activeElement;
    for (let press = 0; press < 10 && focused() !== open; press++)
      await userEvent.keyboard("{ArrowDown}");
    await expect(open).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(headerNamed(table, "Open items")).toHaveAttribute("aria-sort", "descending"),
    );
    await expect(body.getByRole("menuitemradio", { name: "Highest first" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

const foldingColumns = defineColumns<Finding>((c) => [
  c.id("id", { priority: 1 }),
  c.text("name", { header: "Finding", minWidth: 200, priority: 0 }),
  c.status("status", { header: "Status", tone: (r) => statusTone[r.status], priority: 2 }),
  c.number("open", { header: "Open items", width: 110, priority: 3 }),
  c.date("due", { header: "Due", width: 120, priority: 4 }),
]);

function FoldedSort() {
  const table = useDataTable({
    columns: foldingColumns,
    data: findings.slice(0, 6),
    getRowId: (r) => r.id,
    label: "Findings on a phone, by sort",
  });
  return (
    <DataTable
      responsive
      table={table}
      toolbar={
        <Toolbar>
          <DataTable.Sort table={table} />
        </Toolbar>
      }
    />
  );
}

/** On a phone the register folds Due into each row's More fields, so no header can sort by it or show that it is sorted. The menu still offers it, and its trigger says what the rows are ordered by; a column that is drawn shows its arrow and `aria-sort` as ever. */
export const SortMenuFolded: Story = {
  name: "Sort menu at 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  tags: ["narrow"],
  render: () => <FoldedSort />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Findings on a phone, by sort" });
    await waitFor(() => expect(headerNamed(table, "Due")).toBeUndefined());
    const trigger = await findSortTrigger(canvasElement);
    await expect(trigger).toHaveAccessibleName("Sort");

    // Nothing is sorted yet, so the direction waits for a column.
    await userEvent.click(trigger);
    await expect(await body.findByRole("menuitemradio", { name: "Ascending" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.click(body.getByRole("menuitemradio", { name: "Due" }));
    await userEvent.click(await body.findByRole("menuitemradio", { name: "Newest first" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(trigger).toHaveAccessibleName("Sort: Due, Newest first");
    // No drawn header is the sorted one, so none claims to be; the rows are in Due order.
    for (const header of within(table).getAllByRole("columnheader"))
      await expect(header).not.toHaveAttribute("aria-sort");
    const latest = [...findings.slice(0, 6)].sort((a, b) => b.due.localeCompare(a.due))[0]!;
    await expect(table.querySelector("tr[data-row-id]")).toHaveAttribute("data-row-id", latest.id);

    // A drawn column sorts from the menu too, and its header says so.
    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole("menuitemradio", { name: "Finding" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(headerNamed(table, "Finding")).toHaveAttribute("aria-sort", "descending"),
    );
    await expect(trigger).toHaveAccessibleName("Sort: Finding, Z to A");
  },
};

/** The controls a caller has on `DataTable.Sort`: the columns it offers, in order, and the trigger's words before anything is sorted. */
export const SortPlayground: StoryObj<{ label: string; columns: string[] }> = {
  name: "Sort playground",
  args: { label: "Sort", columns: ["due", "open", "name", "owner"] },
  argTypes: {
    label: { control: "text" },
    columns: {
      control: "check",
      options: ["id", "name", "status", "owner", "family", "open", "due"],
    },
  },
  render: (args) => (
    <SortRegister
      label="Findings, sort playground"
      sorted={false}
      sortLabel={args.label}
      offered={args.columns}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const trigger = await findSortTrigger(canvasElement);
    await expect(trigger).toHaveAccessibleName("Sort");
    await userEvent.click(trigger);
    await body.findByRole("menu");
    const offered = body
      .getAllByRole("menuitemradio")
      .map((item) => item.textContent)
      .slice(0, 4);
    await expect(offered).toEqual(["Due", "Open items", "Finding", "Owner"]);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

const widthColumns = defineColumns<Finding>((c) => [
  c.text("name", { header: "Finding", width: 240 }),
  c.text("family", { header: "Family", minWidth: 96 }),
  c.date("due", { header: "Due", width: 120 }),
]);

function WidthFromMenu() {
  const table = useDataTable({
    columns: widthColumns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    resizable: true,
    label: "Findings to size",
  });
  return <DataTable table={table} />;
}

/** A resizable column's menu sets its width without a drag, for a single pointer, a touch screen or anyone who cannot drag (WCAG 2.5.7): Wider and Narrower step 32px and keep the menu open for another press, stopping at the column's minimum and maximum, and Reset width returns to the author's width. A polite status says the width the column now has, and the handle's value follows. */
export const ColumnWidthFromMenu: Story = {
  name: "Column width from its menu",
  render: () => <WidthFromMenu />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Findings to size" });
    const width = (name: string) =>
      Number(
        headerNamed(table, name)!
          .querySelector('[role="separator"]')!
          .getAttribute("aria-valuenow"),
      );
    const item = (name: string) => body.findByRole("menuitem", { name });
    await expect(width("Finding")).toBe(240);

    // A column's width is also its floor, so it can grow and come back, not shrink below it.
    await userEvent.click(within(table).getByRole("button", { name: "Finding column menu" }));
    await expect(await item("Narrower")).toHaveAttribute("aria-disabled", "true");
    await expect(await item("Reset width")).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(await item("Wider"));
    await waitFor(() => expect(width("Finding")).toBe(272));
    await expect(body.getByRole("menu")).toBeVisible();
    await waitFor(() => expect(moveStatus(table)).toHaveTextContent("Finding, 272 pixels wide"));
    await userEvent.click(await item("Wider"));
    await waitFor(() => expect(width("Finding")).toBe(304));
    await userEvent.click(await item("Narrower"));
    await waitFor(() => expect(width("Finding")).toBe(272));
    await userEvent.click(await item("Reset width"));
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(width("Finding")).toBe(240));
    await waitFor(() => expect(moveStatus(table)).toHaveTextContent("Finding, 240 pixels wide"));

    // A column with only a minimum narrows to it and stops there, by keyboard alone.
    const family = within(table).getByRole("button", { name: "Family column menu" });
    family.focus();
    await userEvent.keyboard("{Enter}");
    const narrower = await item("Narrower");
    const focused = () => canvasElement.ownerDocument.activeElement;
    for (let press = 0; press < 10 && focused() !== narrower; press++)
      await userEvent.keyboard("{ArrowDown}");
    await expect(narrower).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(width("Family")).toBe(118));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(width("Family")).toBe(96));
    await waitFor(() => expect(narrower).toHaveAttribute("aria-disabled", "true"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(family).toHaveFocus());
  },
};

const questionView = "data-table-example-question";

function SessionRegister() {
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (r) => r.id,
    pageSize: 4,
    pageSizes: [4, 8],
    label: "Findings, kept for the session",
    view: questionView,
    initialState: { sorting: [{ id: "due", desc: false }] },
  });
  useTableQuery(table, { storage: "session" });
  return (
    <DataTable
      table={table}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Search table={table} placeholder="Search findings" />
          <DataTable.Filter table={table} column="status" />
          <DataTable.Sort table={table} />
        </Inline>
      }
    />
  );
}

function SessionRoundTrip() {
  const [ready, setReady] = useState(false);
  const [record, setRecord] = useState(false);
  useEffect(() => {
    const clear = () => {
      try {
        sessionStorage.removeItem(tableQueryKey(questionView));
        localStorage.removeItem(viewKey(questionView));
      } catch {
        // storage unavailable: nothing to clear
      }
    };
    clear();
    setReady(true);
    return clear;
  }, []);
  if (!ready) return <Text>Preparing the register</Text>;
  return record ? (
    <Stack space="space.150" alignInline="start">
      <Text weight="medium">Finding FND-2204</Text>
      <Button onClick={() => setRecord(false)}>Back to findings</Button>
    </Stack>
  ) : (
    <Stack space="space.150">
      <Inline space="space.100">
        <Button onClick={() => setRecord(true)}>Open a record</Button>
      </Inline>
      <SessionRegister />
    </Stack>
  );
}

/** `useTableQuery(table, { storage: "session" })` keeps the register's question in this tab: a status filter, a sort and the second page survive opening a record and coming back, while the view store keeps the layout beside it. */
export const QuestionInSession: Story = {
  name: "Question kept for the session",
  render: () => <SessionRoundTrip />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const findTable = () => canvas.findByRole("table", { name: "Findings, kept for the session" });
    await findTable();

    // Ask a question: Draft findings, the most open items first, the second page.
    await userEvent.click(canvas.getByRole("button", { name: "Status", expanded: false }));
    await userEvent.click(await body.findByRole("checkbox", { name: "Draft 6" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await userEvent.click(await findSortTrigger(canvasElement));
    await userEvent.click(await body.findByRole("menuitemradio", { name: "Open items" }));
    await userEvent.click(await body.findByRole("menuitemradio", { name: "Highest first" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(canvas.getByText("5–6 of 6")).toBeVisible());
    await waitFor(() =>
      expect(sessionStorage.getItem(tableQueryKey(questionView))).toBe(
        tableQueryToString({
          sorting: [{ id: "open", desc: true }],
          filters: [{ id: "status", value: ["Draft"] }],
          page: 2,
        }),
      ),
    );

    // Open a record and come back: the register asks the same question.
    await userEvent.click(canvas.getByRole("button", { name: "Open a record" }));
    await userEvent.click(await canvas.findByRole("button", { name: "Back to findings" }));
    const table = await findTable();
    await waitFor(() => expect(canvas.getByText("5–6 of 6")).toBeVisible());
    await expect(filterChip(canvasElement, "Status")).toHaveTextContent("Draft");
    await expect(await findSortTrigger(canvasElement)).toHaveAccessibleName(
      "Sort: Open items, Highest first",
    );
    await expect(headerNamed(table, "Open items")).toHaveAttribute("aria-sort", "descending");
  },
};

/** A router's history, in memory: entries, the current one, push, replace and back. */
function useMemoryHistory(initial: string) {
  const [state, setState] = useState({ entries: [initial], index: 0 });
  return {
    location: state.entries[state.index]!,
    canGoBack: state.index > 0,
    push: (next: string) =>
      setState(({ entries, index }) => ({
        entries: [...entries.slice(0, index + 1), next],
        index: index + 1,
      })),
    replace: (next: string) =>
      setState(({ entries, index }) => ({
        entries: entries.map((entry, at) => (at === index ? next : entry)),
        index,
      })),
    back: () => setState(({ entries, index }) => ({ entries, index: Math.max(0, index - 1) })),
  };
}

function UrlRegister({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (params: TableQueryParams) => void;
}) {
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (r) => r.id,
    pageSize: 4,
    label: "Findings, asked in the URL",
    initialState: { sorting: [{ id: "due", desc: false }] },
  });
  useTableQuery(table, { search, onSearchChange });
  return (
    <DataTable
      table={table}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Search table={table} placeholder="Search findings" />
          <DataTable.Sort table={table} />
        </Inline>
      }
    />
  );
}

const overdueLink = `/findings?${tableQueryToString({ filters: [{ id: "status", value: ["Overdue"] }] })}`;

function UrlRoundTrip({ lag }: { lag?: number | undefined }) {
  const history = useMemoryHistory("/findings");
  const [path, query = ""] = history.location.split("?");
  // What a router's navigate with `replace` does: merge the question over the search. With `lag`,
  // the route commits it that many milliseconds later, as a router does after its loaders.
  const onSearchChange = (params: TableQueryParams) => {
    const next = new URLSearchParams(query);
    for (const [name, value] of Object.entries(params))
      if (value === undefined) next.delete(name);
      else next.set(name, value);
    const text = next.toString();
    const commit = () => history.replace(`${path}${text ? `?${text}` : ""}`);
    if (lag === undefined) commit();
    else setTimeout(commit, lag);
  };
  return (
    <Stack space="space.150">
      <Inline space="space.100" alignBlock="center" shouldWrap>
        <Button disabled={!history.canGoBack} onClick={history.back}>
          Back
        </Button>
        <Button onClick={() => history.push(overdueLink)}>Follow a shared link</Button>
        {path === "/findings" ? (
          <Button onClick={() => history.push("/findings/FND-2204")}>Open a record</Button>
        ) : null}
      </Inline>
      <div data-testid="location">
        <Id className="break-all font-body-small text-subtle">{history.location}</Id>
      </div>
      {path === "/findings" ? (
        <UrlRegister search={query} onSearchChange={onSearchChange} />
      ) : (
        <Text weight="medium">Finding FND-2204</Text>
      )}
    </Stack>
  );
}

/** `useTableQuery(table, { search, onSearchChange })` keeps the question in the URL through whatever router the product has: the reader's search and sort become `q` and `sort`, Back after opening a record restores them, and a shared link or Forward applies its question to the register that is already open. The helpers underneath are pure: `tableQueryToSearch` and `tableQueryFromSearch` write and validate the parameters. */
export const QuestionInUrl: Story = {
  name: "Question in the URL",
  render: () => <UrlRoundTrip />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const location = () => canvas.getByTestId("location").textContent ?? "";
    const findTable = () => canvas.findByRole("table", { name: "Findings, asked in the URL" });

    // The parameters are validated: a malformed slice is dropped, not applied in part.
    const question: TableQuery = {
      search: "backup",
      sorting: [{ id: "due", desc: true }],
      filters: [
        { id: "status", value: ["Overdue", "In review"] },
        { id: "due", value: [undefined, "2026-06-30"] },
        { id: "name", value: { contains: "access" } },
      ],
      page: 2,
    };
    await expect(tableQueryFromSearch(tableQueryToSearch(question))).toEqual(question);
    await expect(
      tableQueryFromSearch(
        tableQueryToSearch({ search: "a", sorting: [] }, { prefix: "findings." }),
        { prefix: "findings." },
      ),
    ).toEqual({ search: "a", sorting: [] });
    await expect(
      tableQueryFromSearch({ q: "ok", filters: "{not json", page: "-3", sort: ",," }),
    ).toEqual({ search: "ok", sorting: [] });
    await expect(tableQueryFromSearch({ filters: { status: [{ nested: true }] } })).toEqual({
      filters: [],
    });

    // Ask: a search and a sort, each written to the URL as it changes.
    const table = await findTable();
    await userEvent.type(canvas.getByRole("textbox", { name: "Search findings" }), "Backup");
    await waitFor(() => expect(location()).toBe("/findings?q=Backup"));
    await userEvent.click(within(headerNamed(table, "Due")!).getByRole("button", { name: "Due" }));
    await waitFor(() => expect(location()).toBe("/findings?q=Backup&sort=-due"));

    // Open a record, then Back: the register mounts again and asks the same question.
    await userEvent.click(canvas.getByRole("button", { name: "Open a record" }));
    await waitFor(() => expect(location()).toBe("/findings/FND-2204"));
    await userEvent.click(canvas.getByRole("button", { name: "Back" }));
    const back = await findTable();
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Search findings" })).toHaveValue("Backup"),
    );
    await expect(headerNamed(back, "Due")).toHaveAttribute("aria-sort", "descending");
    await expect(location()).toBe("/findings?q=Backup&sort=-due");

    // A shared link lands on the open register: its question replaces the reader's.
    await userEvent.click(canvas.getByRole("button", { name: "Follow a shared link" }));
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Search findings" })).toHaveValue(""),
    );
    await waitFor(() =>
      expect(
        [...back.querySelectorAll('[data-slot="badge"]')].map((badge) => badge.textContent),
      ).toEqual(["Overdue", "Overdue", "Overdue", "Overdue"]),
    );
    await expect(headerNamed(back, "Due")).toHaveAttribute("aria-sort", "ascending");
    await expect(location()).toBe(overdueLink);
    await userEvent.click(canvas.getByRole("button", { name: "Back" }));
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Search findings" })).toHaveValue("Backup"),
    );
  },
};

/** A router that commits its search later than the reader types, as one does after its loaders, gives back each earlier question on the way. `useTableQuery` knows its own echoes: the search box keeps every letter, and the URL ends on the whole word. A question the reader did not write, such as a followed link, still applies. */
export const QuestionInLaggingUrl: Story = {
  name: "Question in a URL that commits late",
  render: () => <UrlRoundTrip lag={120} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const location = () => canvas.getByTestId("location").textContent ?? "";
    await canvas.findByRole("table", { name: "Findings, asked in the URL" });
    const field = canvas.getByRole("textbox", { name: "Search findings" });

    // A letter every 50ms: the route gives back "B" while the reader is typing the fourth letter.
    await userEvent.type(field, "Backup", { delay: 50 });
    await expect(field).toHaveValue("Backup");
    await waitFor(() => expect(location()).toBe("/findings?q=Backup"), { timeout: 3000 });
    // Every echo has arrived by now; none took a letter away.
    await new Promise((resolve) => setTimeout(resolve, 240));
    await expect(field).toHaveValue("Backup");
    await expect(location()).toBe("/findings?q=Backup");

    // A link the reader follows is not an echo: its question replaces theirs.
    await userEvent.click(canvas.getByRole("button", { name: "Follow a shared link" }));
    await waitFor(() => expect(field).toHaveValue(""));
    await expect(location()).toBe(overdueLink);
  },
};

type WorkItem = { id: string; name: string; state: string };

/** One vocabulary, as a product would keep it beside its status badge and pass everywhere. */
const workStatuses = {
  overdue: { label: "Overdue", tone: "danger" },
  in_review: { label: "In review", tone: "information" },
  draft: { label: "Draft", tone: "neutral" },
  verified: { label: "Verified", tone: "success" },
} satisfies StatusMap;

const workItems: WorkItem[] = [
  { id: "WRK-101", name: "Rotate the signing keys", state: "verified" },
  { id: "WRK-102", name: "Review privileged access", state: "overdue" },
  { id: "WRK-103", name: "Test the backup restore", state: "draft" },
  { id: "WRK-104", name: "Recertify the firewall rules", state: "in_review" },
  { id: "WRK-105", name: "Retire the legacy vault", state: "archived" },
  { id: "WRK-106", name: "Sign off the postmortem", state: "overdue" },
];

const workColumns = defineColumns<WorkItem>((c) => [
  c.id("id"),
  c.text("name", { header: "Task", minWidth: 200 }),
  c.status("state", { header: "Status", statuses: workStatuses }),
]);

function StatusMapped() {
  const table = useDataTable({
    columns: workColumns,
    data: workItems,
    getRowId: (r) => r.id,
    label: "Work by status",
    initialState: { sorting: [{ id: "state", desc: false }] },
  });
  return (
    <Stack space="space.150">
      <DataTable
        table={table}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Search table={table} placeholder="Search work" />
            <DataTable.Filter table={table} column="state" />
            <DataTable.Sort table={table} />
          </Inline>
        }
      />
      <output data-testid="status-export" hidden>
        {toCsv(table)}
      </output>
    </Stack>
  );
}

/** `c.status(key, { statuses })` takes one shared map of each stored value to its label, tone and rank. The badge shows the label in the tone, the column sorts by rank rather than by the alphabet (a value the map does not know sorts after the known ones, in a neutral badge), the search finds a status by its label, the filter lists the labels in that order, and export writes the labels. */
export const StatusMapStory: Story = {
  name: "Shared status map",
  render: () => <StatusMapped />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Work by status" });
    const order = () =>
      [...table.querySelectorAll<HTMLElement>("tr[data-row-id]")].map(
        (row) => row.dataset["rowId"],
      );
    await expect(order()).toEqual([
      "WRK-102",
      "WRK-106",
      "WRK-104",
      "WRK-103",
      "WRK-101",
      "WRK-105",
    ]);
    const badges = [...table.querySelectorAll('[data-slot="badge"]')].map((b) => b.textContent);
    await expect(badges).toEqual([
      "Overdue",
      "Overdue",
      "In review",
      "Draft",
      "Verified",
      "archived",
    ]);
    await expect(await findSortTrigger(canvasElement)).toHaveAccessibleName(
      "Sort: Status, Ascending",
    );

    // The search finds a status by the words its badge shows, not only by the stored value.
    const search = canvas.getByRole("textbox", { name: "Search work" });
    await userEvent.type(search, "in review");
    await waitFor(() => expect(order()).toEqual(["WRK-104"]));
    await userEvent.clear(search);
    await waitFor(() => expect(order()).toHaveLength(workItems.length));

    // The filter speaks the labels, in the map's order.
    await userEvent.click(canvas.getByRole("button", { name: "Status", expanded: false }));
    const dialog = await body.findByRole("dialog", { name: "Status" });
    const boxes = within(dialog).getAllByRole("checkbox");
    const names = ["Overdue 2", "In review 1", "Draft 1", "Verified 1", "archived 1"];
    await expect(boxes).toHaveLength(names.length);
    for (const [at, name] of names.entries()) await expect(boxes[at]).toHaveAccessibleName(name);
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "In review 1" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await expect(filterChip(canvasElement, "Status")).toHaveTextContent("In review");
    await waitFor(() => expect(order()).toEqual(["WRK-104"]));
    await expect(canvas.getByTestId("status-export").textContent).toContain(
      "WRK-104,Recertify the firewall rules,In review",
    );
  },
};
