import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Network, Package } from "lucide-react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import {
  ColumnSortable,
  DataTable,
  DragContext,
  HeaderMenu,
  PageHeader,
  RowSortable,
  Shell,
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
import {
  Absent,
  Badge,
  Button,
  Icon,
  Id,
  Indicator,
  Input,
  Spinner,
  Stat,
  TextLink,
  type Tone,
} from "../../components";

import { Table } from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Inline, Stack, Text } from "../../primitives";
import * as direction from "../_lib/direction";
import * as pairLayout from "../_lib/pair";
import { interact } from "../_lib/interact";
import { displayedRows, showRow } from "../..";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;
const { along, arrows, isRtl, towardsEnd } = direction;

const meta = {
  title: "Patterns/Data table",
  component: DataTable,
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/*
 * A DataTable fits its frame unless it says `responsive={false}`. The stories about a column's own
 * features (its menu, its width, its place, an editable cell, a sort by its header) say so: their
 * plays read every column, which a phone's frame would fold into More fields.
 */

/** A row's More fields control, by its row: "Show 3 more fields for …", or "Hide …" while open. */
const moreFieldsFor = (label: string) =>
  new RegExp(`^(Show|Hide) \\d+ more fields? for ${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
/** Any row's More fields control. */
const ANY_MORE_FIELDS = /^(Show|Hide) \d+ more fields?\b/;

/** What the page's polite live regions hold now, one entry per line, from the Announcer or `announce`'s own regions. */
const politeLines = (canvasElement: HTMLElement) =>
  [
    ...canvasElement.ownerDocument.querySelectorAll(
      '[data-slot="announcer-region"][data-politeness="polite"] > div',
    ),
  ].map((line) => line.textContent ?? "");

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

/**
 * The usage to copy: `useDataTable` over the rows and the columns, then a DataTable with a Toolbar
 * above it, the search first, a filter and the one primary. It fits its frame: on a narrow one the
 * lower-priority fields move into each row's More fields.
 */
export const Usage: Story = {
  render: function FindingsRegister() {
    const table = useDataTable({
      columns,
      data: findings,
      getRowId: (r) => r.id,
      pageSize: 8,
      label: "Findings",
    });
    return (
      <DataTable
        table={table}
        toolbar={
          <Toolbar
            search={table.state.globalFilter}
            onSearch={table.setGlobalFilter}
            placeholder="Search findings"
            filters={<DataTable.Filter table={table} column="status" />}
            actions={
              <Button size="small" variant="primary">
                New finding
              </Button>
            }
          />
        }
        empty={{ title: "No findings yet", description: "The first assessment creates them." }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("table", { name: "Findings" })).toBeVisible();
    await expect(canvas.getByRole("searchbox", { name: "Search findings" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "New finding" })).toBeVisible();
  },
};

/** The register: search, filters as chips, presets with counts, sortable headers, the checkbox column, and while rows are chosen the SelectionBar in the toolbar's place, a glance on the id, row actions, eight rows a page. */
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
  // While rows are chosen the bar takes the toolbar's slot, so the rows stay under the pointer.
  const chosen = Object.values(table.state.rowSelection).some(Boolean);
  return (
    <Stack space="space.150">
      <DataTable.Presets table={table} presets={presets} />
      <DataTable
        table={table}
        responsive={responsive}
        toolbar={
          chosen ? (
            <DataTable.SelectionBar
              table={table}
              actions={
                <>
                  <Button size="small">Reassign</Button>
                  <Button size="small">Close</Button>
                </>
              }
            />
          ) : (
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
          )
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
    const [page, firstRow, secondRow] = table.getAllByRole("checkbox");
    await expect(page).not.toBeChecked();
    const before = secondRow!.getBoundingClientRect().top;
    await userEvent.click(firstRow!);
    await expect(firstRow).toBeChecked();
    await expect(page).toBePartiallyChecked();
    // The bar takes the toolbar's place: the search goes, and the next row stays under the pointer.
    const bar = await canvas.findByRole("region", { name: "Selection" });
    await expect(within(bar).getByText("1 selected")).toBeVisible();
    await expect(canvas.queryByRole("searchbox", { name: "Search findings" })).toBeNull();
    await expect(Math.abs(secondRow!.getBoundingClientRect().top - before)).toBeLessThan(20);
    // Escape in the bar clears the choice, and focus goes to the select-all.
    within(bar).getByRole("button", { name: "Clear" }).focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page).toHaveFocus());
    await expect(firstRow).not.toBeChecked();
    await expect(canvas.getByRole("searchbox", { name: "Search findings" })).toBeVisible();
    await userEvent.click(page!);
    for (const checkbox of table.getAllByRole("checkbox")) await expect(checkbox).toBeChecked();
    await userEvent.click(page!);
    for (const checkbox of table.getAllByRole("checkbox")) await expect(checkbox).not.toBeChecked();

    // With no rowLabel each row is named by its identity, the id column: that cell is the row's
    // header, and the row's controls say its text, never a raw key.
    const headers = table.getAllByRole("rowheader");
    await expect(headers).toHaveLength(8);
    const name = headers[0]!.textContent!;
    await expect(name).toMatch(/^FND-\d{4}$/);
    await expect(firstRow).toHaveAccessibleName(`Select ${name}`);
    const actions = table.getByRole("button", { name: `Row actions for ${name}` });
    await expect(table.queryAllByRole("button", { name: "Row actions" })).toHaveLength(0);

    // Row actions remain reachable without hovering the row. The id's glance is a hover card with
    // no tab stop of its own, so the row's next stop after its checkbox is its actions.
    firstRow!.focus();
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
    // An empty facet says so, rather than opening a blank popover.
    await expect(initial.getByText("No values to filter by")).toBeVisible();
    await closeFilter();
    await userEvent.click(canvas.getByRole("button", { name: "Load findings" }));
    const loaded = await openFilter();
    await expect(loaded.getByRole("checkbox", { name: "Draft 1" })).toBeVisible();
    await expect(loaded.getByRole("checkbox", { name: "Overdue 1" })).toBeVisible();
    await expect(loaded.getByRole("checkbox", { name: "Verified 1" })).toBeVisible();
    await closeFilter();
    const search = canvas.getByRole("searchbox", { name: "Search live findings" });
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
        {/* Stat.Grid takes its columns from its own width, not the window's. */}
        <Stat.Grid cols={3}>
          <Stat.Tile label="Total findings" value={findings.length} />
          <Stat.Tile
            label="Verified"
            value={findings.filter((finding) => finding.status === "Verified").length}
          />
          <Stat.Tile
            label="Open items"
            value={findings.reduce((total, finding) => total + finding.open, 0)}
          />
        </Stat.Grid>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Metrics" });
    const closed = getComputedStyle(trigger);
    const [closedFill, closedText] = [closed.backgroundColor, closed.color];
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(canvas.getByRole("region", { name: "Metrics" })).toBeVisible());
    // Open, it takes the active look Group by and Filters take: the selected fill and words.
    await expect(trigger).toHaveAttribute("data-panel-open");
    await waitFor(() => expect(getComputedStyle(trigger).backgroundColor).not.toBe(closedFill));
    await expect(getComputedStyle(trigger).color).not.toBe(closedText);
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
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
      {/* A wide comparison: every column stays in the row and the frame scrolls sideways. */}
      <DataTable table={table} maxHeight={420} responsive={false} />
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
    // The grip and the resize handle are for the pointer: the column's menu moves and sizes the
    // column by keyboard, so a header is two tab stops, the sort and the menu.
    const grip = header.querySelector<HTMLElement>('[aria-roledescription="sortable"]')!;
    await expect(grip).toBeVisible();
    await expect(grip).toHaveAttribute("aria-label", "Reorder Status column");
    await expect(grip).toHaveAttribute("aria-hidden", "true");
    await expect(grip).toHaveAttribute("tabindex", "-1");
    await expect(header.querySelector('[role="separator"]')).not.toHaveAttribute("tabindex");
    const stops = [...header.querySelectorAll<HTMLElement>("button, [tabindex]")].filter(
      (element) => element.tabIndex >= 0 && !element.closest("[aria-hidden=true]"),
    );
    await expect(stops.map((element) => element.getAttribute("aria-label") ?? "sort")).toEqual([
      "sort",
      "Status column menu",
    ]);

    await userEvent.click(menu);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("menuitemradio", { name: "Sort ascending" }));
    await waitFor(() => expect(header).toHaveAttribute("aria-sort", "ascending"));
    const width = parseFloat(header.style.width);
    await userEvent.click(menu);
    await userEvent.click(await body.findByRole("menuitem", { name: "Wider" }));
    await waitFor(() => expect(parseFloat(header.style.width)).toBe(width + 32));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
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
    const band = along(heading("ID")).end - along(frame).start;
    await expect(band).toBeLessThanOrEqual(frame.clientWidth * 0.6);
    const idStart = along(heading("ID")).start;
    const nameStart = along(heading("Finding")).start;
    frame.scrollLeft = towardsEnd(frame, 120);
    fireEvent.scroll(frame);
    await waitFor(() => expect(along(heading("Finding")).start).toBeLessThan(nameStart - 100));
    await expect(Math.round(along(heading("ID")).start)).toBe(Math.round(idStart));
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
  // The menu beside the grip moves the column by keyboard, so the grip is for the pointer.
  const header = typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
  const drag = useColumnDrag(column.id, true, { label: header, pointerOnly: true });
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
      {header}
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
  return <DataTable responsive={false} table={table} />;
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
      {/* Left to right by its own provider, so the pair holds under the Direction toolbar too. */}
      <LedgerProvider direction="ltr">
        <Movable label="Findings to arrange" />
      </LedgerProvider>
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
    // The words follow the screen: towards the end is Move right, or Move left in right to left.
    const [toStart, toEnd] = isRtl(panel)
      ? ["Move right", "Move left"]
      : ["Move left", "Move right"];
    await waitFor(() => expect(headingOrder(panel)).not.toContain("Owner"));
    const drawn = headingOrder(panel);
    await expect(drawn[0]).toBe("Finding");
    await userEvent.click(menuOf("Finding", panel));
    await body.findByRole("menuitemradio", { name: "Sort ascending" });
    if (drawn.length > 1) {
      await expect(await item(toStart)).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(await item(toEnd));
      await closed();
      await waitFor(() => expect(headingOrder(panel)).toEqual(["Status", "Finding"]));
      await waitFor(() => expect(menuOf("Finding", panel)).toHaveFocus());
      await waitFor(() => expect(moveStatus(panel)).toHaveTextContent("Finding, 2 of 2"));
      // Finding is now the last column drawn: Move right would pass Owner, which is folded.
      await userEvent.click(menuOf("Finding", panel));
      await expect(await item(toEnd)).toHaveAttribute("aria-disabled", "true");
      await expect(await item(toStart)).not.toHaveAttribute("aria-disabled", "true");
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
    const moveRight = await item(toEnd);
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
    // Out of a row and into it, mirrored in right to left.
    const { next, previous } = arrows(grid);
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
    // The element's name is the row's header, and the guides and the disclosure sit in it.
    const nameCell = within(mainBoard).getByRole("rowheader");
    await expect(nameCell).toHaveAttribute("scope", "row");
    await expect(nameCell).toHaveTextContent(/^Main board/);
    await expect(guide.closest("th")).toBe(mainBoard.children[0]);
    const rootToggle = within(grid).getByRole("button", { name: "Collapse Flight computer" });
    const childToggle = within(mainBoard).getByRole("button", { name: "Expand Main board" });
    await expect(childToggle.closest("th")).toBe(nameCell);
    const rootRect = rootToggle.getBoundingClientRect();
    const childRect = childToggle.getBoundingClientRect();
    await expect(
      Math.abs(childRect.x + childRect.width / 2 - rootRect.x - rootRect.width / 2),
    ).toBeCloseTo(16, 0);
    await userEvent.click(childToggle);
    await expect(mainBoard).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.queryByText("opened Main board")).toBeNull();
    await userEvent.click(within(mainBoard).getByRole("button", { name: "Collapse Main board" }));

    // The chevron's cell took the stop when it was pressed: Shift+Tab is its cell, and Left from
    // the row's first cell is the row. Decorative guides keep the row's keys.
    await userEvent.tab({ shift: true });
    await expect(nameCell).toHaveFocus();
    await expect(grid.querySelectorAll('tr[tabindex="0"]')).toHaveLength(0);
    await userEvent.keyboard(previous);
    await expect(mainBoard).toHaveFocus();
    await userEvent.keyboard(next);
    await expect(mainBoard).toHaveAttribute("aria-expanded", "true");
    const chip = within(grid).getByRole("row", { name: /SoC/ });
    // Right on an open row enters its first cell; Down from the row reaches its first part.
    await userEvent.keyboard(next);
    await expect(nameCell).toHaveFocus();
    await userEvent.keyboard(previous);
    await expect(mainBoard).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(chip).toHaveFocus();
    await userEvent.keyboard(previous);
    await expect(mainBoard).toHaveFocus();
    await userEvent.keyboard(previous);
    await expect(mainBoard).toHaveAttribute("aria-expanded", "false");
    await expect(within(grid).queryByRole("row", { name: /SoC/ })).toBeNull();
    // Closing the parent hides the row that held the stop: the stop is where focus went, the
    // parent's chevron's cell, and it is the only one in the rows.
    await userEvent.click(rootToggle);
    const rootName = within(rootRow).getByRole("rowheader");
    await expect(rootName).toHaveAttribute("tabindex", "0");
    await expect(grid.querySelectorAll('tbody :is(tr, td, th)[tabindex="0"]')).toHaveLength(1);
    // The stop's cell gives its chevron back to Tab; every other row's controls stay out of it.
    const reachable = [...grid.querySelectorAll<HTMLElement>("tbody button")].filter(
      (button) => button.tabIndex >= 0,
    );
    await expect(reachable.every((button) => rootName.contains(button))).toBe(true);
    await userEvent.click(within(grid).getByRole("button", { name: "Expand Flight computer" }));
  },
};

/*
 * The treegrid's keys, as the ARIA treegrid pattern has them. The rows hold one tab stop, a row or
 * one of its cells, and every link and button in them is out of the Tab order except those in the
 * cell that holds it: from the header, Tab reaches the stop and the next Tab leaves the table,
 * however many rows it has. Right on an open row enters its first cell; Right and Left move along
 * the row, Down and Up keep the column, Home and End reach the row's ends, Ctrl+Home and Ctrl+End
 * the column's; Left from the first cell is the row. Tab from a cell reaches its own controls.
 * Enter on a cell presses its link, Space its checkbox.
 */
const keyedPartColumns = defineColumns<Part>((c) => [
  c.text("name", {
    header: "Element",
    sortable: false,
    priority: 0,
    minWidth: 200,
    cell: (r) => <TextLink href={`#/parts/${r.id}`}>{r.name}</TextLink>,
  }),
  c.text("kind", { header: "Kind", width: 130, sortable: false }),
  c.person("owner", { header: "Owner", width: 180, sortable: false }),
  c.actions(() => [
    { label: "Rename", onSelect: () => {} },
    { label: "Remove", tone: "danger", onSelect: () => {} },
  ]),
]);

function TreeKeys() {
  const [open, setOpen] = useState<Part | null>(null);
  const table = useDataTable({
    columns: keyedPartColumns,
    data: system,
    getRowId: (r) => r.id,
    label: "System, by keyboard",
    selectable: true,
    tree: { children: (r) => r.parts, label: (r) => r.name, initialExpanded: true },
    preview: { onPreview: setOpen, activeId: open?.id ?? null },
  });
  return (
    <Stack space="space.150">
      <DataTable table={table} />
      <Inline space="space.100" alignBlock="center">
        <Button size="small">After the table</Button>
        <Text size="small" color="color.text.subtle">
          {open ? `Previewing ${open.name}` : "Nothing previewed"}
        </Text>
      </Inline>
    </Stack>
  );
}

export const TreeKeysStory: Story = {
  name: "Tree keys",
  render: () => <TreeKeys />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("treegrid", { name: "System, by keyboard" });
    // Out of a row and into it, mirrored in right to left.
    const { next, previous } = arrows(grid);
    const after = canvas.getByRole("button", { name: "After the table" });
    const rowNamed = (name: RegExp) => within(grid).getByRole("row", { name });
    /** The cells the keys move across: the disclosure is the row's own. */
    const cells = (row: HTMLElement) =>
      [...(row as HTMLTableRowElement).cells].filter(
        (cell) => cell.dataset["slot"] !== "table-disclosure",
      );
    /** What in the rows the Tab key can reach now. */
    const tabbable = () =>
      [
        ...grid.querySelectorAll<HTMLElement>(
          "tbody tr, tbody td, tbody th, tbody a[href], tbody button, tbody input, tbody [tabindex]",
        ),
      ].filter((element) => element.tabIndex >= 0 && !element.hidden);
    const flight = rowNamed(/Flight computer/);
    const main = rowNamed(/Main board/);

    // From the header, Tab reaches the one stop, the first row, and the next Tab leaves the table.
    const heads = within(grid.querySelector("thead")!).getAllByRole("button");
    heads[heads.length - 1]!.focus();
    await userEvent.tab();
    await expect(flight).toHaveFocus();
    await expect(tabbable()).toEqual([flight]);
    await userEvent.tab();
    await expect(after).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(flight).toHaveFocus();

    // Right on an open row enters its first cell, the checkbox's; Right moves along the row.
    await userEvent.keyboard(next);
    await expect(cells(flight)[0]).toHaveFocus();
    await userEvent.keyboard(next);
    const name = cells(flight)[1]!;
    await expect(name).toHaveFocus();
    await expect(flight).toHaveAttribute("tabindex", "-1");
    // The cell holds the stop, and its controls follow it: the link, then the eye, then out.
    const link = within(name).getByRole("link", { name: "Flight computer" });
    const eye = within(name).getByRole("button", { name: "Preview Flight computer" });
    await expect(tabbable()).toEqual([name, link, eye]);
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await userEvent.tab();
    await expect(eye).toHaveFocus();
    await userEvent.tab();
    await expect(after).toHaveFocus();
    await userEvent.tab({ shift: true });
    await userEvent.tab({ shift: true });
    await expect(link).toHaveFocus();

    // A link takes the arrows as its cell does: Down keeps the column.
    await userEvent.keyboard("{ArrowDown}");
    await expect(cells(main)[1]).toHaveFocus();
    await expect(within(cells(main)[1]!).getByRole("link").tabIndex).toBe(0);
    await expect(link.tabIndex).toBe(-1);
    // End and Home reach the row's ends; Ctrl+End and Ctrl+Home the column's.
    await userEvent.keyboard("{End}");
    await expect(cells(main).at(-1)).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(cells(main)[0]).toHaveFocus();
    await userEvent.keyboard("{Control>}{End}{/Control}");
    await expect(cells(rowNamed(/Telemetry service/))[0]).toHaveFocus();
    await userEvent.keyboard("{Control>}{Home}{/Control}");
    await expect(cells(flight)[0]).toHaveFocus();

    // Space on the checkbox's cell chooses the row; Left from the first cell is the row again.
    await userEvent.keyboard(" ");
    await expect(within(cells(flight)[0]!).getByRole("checkbox")).toBeChecked();
    await userEvent.keyboard(previous);
    await expect(flight).toHaveFocus();
    await expect(tabbable()).toEqual([flight]);

    // Enter on the name's cell presses its link, as Enter on the row does.
    let followed = 0;
    const follow = (event: Event) => {
      event.preventDefault();
      followed += 1;
    };
    link.addEventListener("click", follow);
    try {
      await userEvent.keyboard(`${next}${next}`);
      await expect(name).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(followed).toBe(1);
      await userEvent.keyboard(`${previous}${previous}`);
      await expect(flight).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await expect(followed).toBe(2);
    } finally {
      link.removeEventListener("click", follow);
    }
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
      <DataTable responsive={false} table={table} />
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
    initialDetails: ["FND-2201"],
  });
  return <DataTable table={table} />;
}

export const DetailRows: Story = {
  name: "Detail rows",
  render: () => <Details />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // `initialDetails` opens FND-2201's detail at first, and only that one.
    await expect(canvas.getByRole("table", { name: "FND-2201 items" })).toBeVisible();
    await expect(canvas.queryByRole("table", { name: "FND-2200 items" })).toBeNull();
  },
};

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
    // `groupBy` is the grouping, and each new grouping opens its groups.
    groupBy: groupBy || undefined,
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
    await userEvent.click(canvas.getByRole("checkbox", { name: "Select FND-2200" }));

    const trigger = canvas.getByRole("button", { name: "Group by: Family" });
    trigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(await body.findByRole("menuitemradio", { name: "Family" })).toBeChecked();
    await userEvent.click(body.getByRole("menuitemradio", { name: "Owner" }));
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Group by: Owner" })).toHaveFocus();
    await expect(canvas.getByRole("checkbox", { name: "Select FND-2200" })).toBeChecked();
    await expect(search).toHaveValue("Segregation");
    await expect(canvas.getByRole("table", { name: "Grouped findings" })).toHaveTextContent(
      "Dana Whitfield",
    );

    await userEvent.click(canvas.getByRole("button", { name: "Group by: Owner" }));
    await userEvent.click(await body.findByRole("menuitemradio", { name: "None" }));
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(canvas.getByRole("button", { name: "Group by" })).toHaveFocus();
    await expect(canvas.getByRole("checkbox", { name: "Select FND-2200" })).toBeChecked();
    await expect(search).toHaveValue("Segregation");
    // Three rows fit the smallest page: there is no pager to turn until the search clears.
    await expect(
      canvas.queryByRole("navigation", { name: "Grouped findings pagination" }),
    ).toBeNull();

    await userEvent.clear(search);
    await expect(
      await canvas.findByRole("navigation", { name: "Grouped findings pagination" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Filters" }));
    const status = within(await body.findByRole("group", { name: "Status" }));
    await userEvent.click(status.getByRole("checkbox", { name: /^Verified\b/ }));
    await expect(canvas.getByRole("button", { name: "Filters (1)" })).toBeVisible();
    await expect(canvas.queryByRole("checkbox", { name: "Select FND-2200" })).toBeNull();
    await userEvent.click(body.getByRole("button", { name: "Clear all filters" }));
    await expect(canvas.getByRole("button", { name: "Filters" })).toBeVisible();
    await expect(canvas.getByRole("checkbox", { name: "Select FND-2200" })).toBeChecked();
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

/** Rows dragged into a new order by their handle, or moved one place with Move up and Move down in the row's menu; sorting is off while it is on. `rowLabel` names each row's handle and menu, and what a move says. The story keeps the order. */
const rankColumns = defineColumns<Finding>((c) => [
  c.id("id"),
  c.text("name", { header: "Finding" }),
  c.person("owner", { header: "Owner", width: 180 }),
  // No actions of its own: the menu holds only the moves.
  c.actions(() => []),
]);

function Ranked() {
  const [data, setData] = useState(() => findings.slice(0, 6));
  const table = useDataTable({
    columns: rankColumns,
    data,
    getRowId: (r) => r.id,
    rowLabel: (r) => r.id,
    label: "Ranked findings",
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

export const ReorderingRows: Story = {
  name: "Reordering rows",
  render: () => <Ranked />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Ranked findings" });
    const order = () =>
      [...table.querySelectorAll<HTMLElement>("tbody tr[data-row-id]")].map(
        (row) => row.dataset["rowId"],
      );
    await expect(within(table).getByRole("button", { name: "Reorder FND-2200" })).toBeVisible();

    // One press moves a row one place: no drag, for a single pointer or a touch screen.
    const menu = within(table).getByRole("button", { name: "Row actions for FND-2200" });
    await userEvent.click(menu);
    await expect(await body.findByRole("menuitem", { name: "Move up" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.click(await body.findByRole("menuitem", { name: "Move down" }));
    await waitFor(() => expect(order().slice(0, 2)).toEqual(["FND-2201", "FND-2200"]));
    await waitFor(() => expect(menu).toHaveFocus());
    await waitFor(() => expect(politeLines(canvasElement)).toContain("FND-2200, 2 of 6"));

    // By keyboard alone: open the menu, arrow to Move up, Enter.
    await userEvent.keyboard("{Enter}");
    const up = await body.findByRole("menuitem", { name: "Move up" });
    for (let press = 0; press < 4 && !up.matches(":focus"); press++)
      await userEvent.keyboard("{ArrowDown}");
    await expect(up).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(order().slice(0, 2)).toEqual(["FND-2200", "FND-2201"]));
    await waitFor(() => expect(politeLines(canvasElement)).toContain("FND-2200, 1 of 6"));
  },
};

/** Cells that edit in place: the name is an Editable.Text, the status an Editable.Select. Enter commits and moves down the column. The column's `onDraftChange`, `onEditingChange` and `onCancel` report each row's draft, so a host's draft guard counts the unsaved rows without reading the cells' DOM events. */
function Editing() {
  const [data, setData] = useState(() => findings.slice(0, 6));
  const [saves, setSaves] = useState(0);
  // What a draft guard holds: the rows with an unsaved draft, the row whose editor is open, and
  // how many edits were dropped.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [cancels, setCancels] = useState(0);
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
            onDraftChange: (row, draft) =>
              setDrafts((current) => {
                const next = { ...current };
                if (draft === null) delete next[row.id];
                else next[row.id] = draft;
                return next;
              }),
            onEditingChange: (row, editing) =>
              setOpen((current) => (editing ? row.id : current === row.id ? null : current)),
            onCancel: () => setCancels((count) => count + 1),
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
  const unsaved = Object.keys(drafts).length;
  return (
    <Stack space="space.150">
      <DataTable table={table} />
      <Text size="small" color="color.text.subtle">
        {saves} saved
      </Text>
      <output data-testid="draft-guard" className="block font-body-small text-subtle">
        {unsaved} unsaved · {open ?? "no"} editor open · {cancels} dropped
      </output>
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
    const guard = () => canvas.getByTestId("draft-guard").textContent;
    // Editing keeps the table a table: Tab moves across, and it claims no grid arrow keys.
    await expect(canvas.getByRole("table", { name: "Findings" })).toBeVisible();
    await expect(canvas.queryByRole("grid")).toBeNull();
    const cells = canvas.getAllByRole("button", { name: /^Finding:/ });
    await userEvent.click(cells[0]!);
    const input = canvas.getByRole("textbox", { name: "Finding" });
    await waitFor(() => expect(guard()).toBe("0 unsaved · FND-2200 editor open · 0 dropped"));
    await userEvent.clear(input);
    // The cleared field is a draft the host hears about, with its row.
    await waitFor(() => expect(guard()).toBe("1 unsaved · FND-2200 editor open · 0 dropped"));
    await interact(() =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByText("0 saved")).toBeVisible();
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
    await expect(canvas.getByText("0 saved")).toBeVisible();
    await interact(() =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await waitFor(() => expect(cells[1]!).toHaveFocus());
    // Committed: no draft is left and no editor is open.
    await waitFor(() => expect(guard()).toBe("0 unsaved · no editor open · 0 dropped"));

    // Escape drops an edit: the draft goes, and the host hears the cancel.
    await userEvent.click(cells[2]!);
    const second = canvas.getByRole("textbox", { name: "Finding" });
    await userEvent.type(second, " draft");
    await waitFor(() => expect(guard()).toBe("1 unsaved · FND-2202 editor open · 0 dropped"));
    await interact(() =>
      second.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
    );
    await waitFor(() => expect(guard()).toBe("0 unsaved · no editor open · 1 dropped"));

    await interact(() => canvas.getByRole("button", { name: "Finish saves" }).click());
    await waitFor(() => expect(canvas.getByText("1 saved")).toBeVisible());
    await expect(
      canvas.getByRole("button", { name: "Finding: Confirmed owner review" }),
    ).toBeVisible();
  },
};

/** An editable status column over a shared map: each choice reads as its label, and a first choice clears it. */
function EditingStatuses() {
  const [data, setData] = useState<WorkItem[]>(() => workItems.slice(0, 4));
  const statusColumns = useMemo(
    () =>
      defineColumns<WorkItem>((c) => [
        c.id("id"),
        c.text("name", { header: "Task", minWidth: 200 }),
        c.status("state", {
          header: "Status",
          width: 160,
          statuses: workStatuses,
          editable: {
            options: Object.keys(workStatuses),
            emptyLabel: "No status",
            onChange: (row, next) =>
              setData((rows) => rows.map((r) => (r.id === row.id ? { ...r, state: next } : r))),
            save: () => Promise.resolve(),
          },
        }),
      ]),
    [],
  );
  const table = useDataTable({
    columns: statusColumns,
    data,
    getRowId: (r) => r.id,
    label: "Work, editable status",
  });
  return (
    <Stack space="space.150">
      <DataTable responsive={false} table={table} />
      <output data-testid="stored-states" className="block font-body-small text-subtle">
        {data.map((r) => `${r.id}=${r.state || "none"}`).join(" ")}
      </output>
    </Stack>
  );
}

/** `editable.options` on a status column with `statuses`: the menu searches, shows and announces each value's label ("In review"), never the stored value ("in_review"), and commits the value. `emptyLabel` offers a first choice that clears it. An option can also be `{ value, label }`. */
export const EditingStatusesStory: Story = {
  name: "Editing a status by its labels",
  render: () => <EditingStatuses />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const stored = () => canvas.getByTestId("stored-states").textContent;
    const row = (id: string) => within(canvas.getByRole("row", { name: new RegExp(`^${id}`) }));
    const status = row("WRK-104").getByRole("combobox", { name: /^Status: In review/ });
    await userEvent.click(status);
    const listbox = await page.findByRole("listbox");
    const names = within(listbox)
      .getAllByRole("option")
      .map((option) => option.getAttribute("aria-label") ?? option.textContent);
    await expect(names).toEqual(["No status", "Overdue", "In review", "Draft", "Verified"]);
    await userEvent.click(within(listbox).getByRole("option", { name: "Verified" }));
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull());
    await waitFor(() => expect(stored()).toContain("WRK-104=verified"));
    await expect(row("WRK-104").getByRole("combobox", { name: /^Status: Verified/ })).toBeVisible();

    // The first choice clears the status.
    await userEvent.click(row("WRK-103").getByRole("combobox", { name: /^Status: Draft/ }));
    await userEvent.click(await page.findByRole("option", { name: "No status" }));
    await waitFor(() => expect(stored()).toContain("WRK-103=none"));
    await waitFor(() => expect(page.queryByRole("listbox")).toBeNull());
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

/** Loading, empty, error and ready; the narrowed empty, which the table draws itself when a search or a filter leaves no rows; and a refresh that failed, which keeps the rows the reader had under the error, with Try again. */
function States() {
  const [state, setState] = useState<DataTableState | "filtered" | "refresh failed">("loading");
  const table = useDataTable({
    label: "Findings, the states",
    columns,
    data: state === "ready" || state === "filtered" || state === "refresh failed" ? findings : [],
    pageSize: 5,
  });
  const narrowed = String(table.state.globalFilter ?? "") !== "";
  return (
    <Stack space="space.150">
      <Inline space="space.100" shouldWrap>
        {(["loading", "empty", "filtered", "error", "refresh failed", "ready"] as const).map(
          (s) => (
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
          ),
        )}
      </Inline>
      <DataTable
        table={table}
        state={state === "filtered" ? "ready" : state === "refresh failed" ? "error" : state}
        onRetry={() => setState("ready")}
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
        error={
          state === "refresh failed"
            ? "Findings could not be refreshed. These are the last ones loaded."
            : "Findings could not be loaded."
        }
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
    // The pressed button went with the empty state; focus is back in the search that asked.
    await waitFor(() => expect(canvas.getByLabelText("Search findings")).toHaveFocus());
    await expect(canvas.getAllByRole("row").length).toBeGreaterThan(2);
    const table = canvas.getByRole("table", { name: "Findings, the states" });
    // A failed load: the error stands where the rows would be, with Try again.
    await userEvent.click(canvas.getByRole("button", { name: "error" }));
    const failed = within(table).getByRole("alert");
    await expect(failed).toHaveTextContent("Findings could not be loaded.");
    await expect(within(failed).getByRole("button", { name: "Try again" })).toBeVisible();
    // A failed refresh keeps the rows the reader had, usable, under the error above the table.
    await userEvent.click(canvas.getByRole("button", { name: "refresh failed" }));
    const stale = canvas.getByRole("alert");
    await expect(table.contains(stale)).toBe(false);
    await expect(stale).toHaveTextContent("These are the last ones loaded.");
    await expect(within(table).getAllByRole("rowheader")).toHaveLength(5);
    await expect(within(table).queryByRole("alert")).toBeNull();
    await expect(table).not.toHaveAttribute("aria-busy");
    // Try again goes with the alert; focus moves on to the table's search, not to the page.
    await userEvent.click(within(stale).getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
    await waitFor(() => expect(canvas.getByLabelText("Search findings")).toHaveFocus());
    await expect(within(table).getAllByRole("rowheader")).toHaveLength(5);
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

/** The server sorts, filters and pages: the table hands its state over, shows the rows it is given, and counts what the server says. While the next page, sort or search loads, the rows it has stay under `state="refreshing"`: the table is busy, and says so. */
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
      state={loading ? (result ? "refreshing" : "loading") : "ready"}
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
  );
}

export const ServerStory: Story = {
  name: "Server",
  render: () => <Server />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Wait for the response before checking the settled, interactive table.
    const table = canvas.getByRole("table", { name: "Findings from the server" });
    await waitFor(() => expect(table).not.toHaveAttribute("aria-busy"), { timeout: 3000 });
    const first = within(table).getAllByRole("rowheader")[0]!.textContent;
    // The next page loads under the rows the reader has: busy, with the quiet bar, never empty.
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(table).toHaveAttribute("aria-busy", "true");
    await expect(
      canvasElement.querySelector('[data-slot="data-table-refreshing"]'),
    ).toBeInTheDocument();
    await expect(within(table).getAllByRole("rowheader")[0]).toHaveTextContent(first!);
    await waitFor(() => expect(table).not.toHaveAttribute("aria-busy"), { timeout: 3000 });
    await expect(within(table).getAllByRole("rowheader")[0]).not.toHaveTextContent(first!);
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
  tags: ["!manifest"],
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
  return <DataTable responsive={false} table={table} />;
}
export const KeyboardResizeMatrix: Story = {
  render: () => (
    <LedgerProvider>
      <ResizableTable />
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    // The handle is for the pointer and no tab stop; the keyboard sizes the column from its menu.
    const handle = canvas.getAllByRole("separator", { name: /^Resize / })[0]!;
    await expect(handle).not.toHaveAttribute("tabindex");
    const header = handle.closest("th")!;
    const before = parseFloat(header.style.width);
    const menu = canvas.getByRole("button", { name: "Program name column menu" });
    menu.focus();
    await userEvent.keyboard("{Enter}");
    const wider = await body.findByRole("menuitem", { name: "Wider" });
    for (let press = 0; press < 10 && !wider.matches(":focus"); press++)
      await userEvent.keyboard("{ArrowDown}");
    await expect(wider).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(parseFloat(header.style.width)).toBe(before + 32));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(menu).toHaveFocus());
    await expect(canvas.getByText("1,234")).toBeVisible();
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
      {/* The reader's stored widths, drawn as they are: the table scrolls rather than fits. */}
      <DataTable table={table} responsive={false} />
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
      String(
        parseFloat(
          canvas
            .getAllByRole("columnheader")
            .find((header) => header.textContent?.includes("Program name"))!.style.width,
        ),
      );
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
      // Pinned in one place, the initial state below, which orders the band: the name, then the code.
      c.id("id", { header: "Code", width: 100, priority: 1 }),
      c.custom("name", {
        header: "Finding",
        minWidth: 200,
        priority: 0,
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
      name: moreFieldsFor(findings[0]!.name),
    });
    await waitFor(fits);
    // More fields is a count, "+3", never a chevron: a chevron opens a branch or a group. It is
    // the 20px row control, and its name says how many fields it shows and whose.
    await expect(more.getBoundingClientRect().height).toBe(20);
    await expect(more.querySelector("svg")).toBeNull();
    const hidden = Number(more.textContent!.replace("+", ""));
    await expect(more).toHaveAccessibleName(
      `Show ${hidden} more field${hidden === 1 ? "" : "s"} for ${findings[0]!.name}`,
    );
    await userEvent.click(more);
    await expect(more).toHaveAttribute("aria-expanded", "true");
    await expect(more).toHaveAccessibleName(
      `Hide ${hidden} more field${hidden === 1 ? "" : "s"} for ${findings[0]!.name}`,
    );
    // Open, it is marked as a trigger in force, which forced colours draw in Highlight.
    await expect(more).toHaveAttribute("data-active-trigger");
    const fields = canvasElement.ownerDocument.getElementById(more.getAttribute("aria-controls")!);
    // As many fields as the count says.
    await expect(fields!.querySelectorAll("dt")).toHaveLength(hidden);
    // The hidden fields are one list, whose labels share one column (KeyValue.Group).
    await expect(fields!.querySelectorAll("dl")).toHaveLength(1);
    await expect(fields!.querySelector("dl")).toHaveAttribute("data-slot", "key-value-group");
    await expect(within(fields!).getByText("Code", { exact: true })).toBeVisible();
    await expect(within(fields!).getByText("Dana Whitfield", { exact: true })).toBeVisible();
    await expect(within(fields!).queryByText("Family", { exact: true })).not.toBeInTheDocument();
    const before = canvas.getByTestId("responsive-export").textContent;
    await expect(canvas.getByTestId("responsive-visibility")).toHaveTextContent('{"family":false}');
    await userEvent.click(canvas.getByRole("button", { name: "Wide container" }));
    // The wide container unfolds the fields only where the canvas has room for it (not on a phone).
    if (container.parentElement!.clientWidth >= 1000) {
      await waitFor(() =>
        expect(canvas.queryAllByRole("button", { name: ANY_MORE_FIELDS })).toHaveLength(0),
      );
      await waitFor(fits);
      const headers = within(table).getAllByRole("columnheader");
      expect(along(headers[1]!).start).toBeGreaterThanOrEqual(along(headers[0]!).end - 1);
    }
    expect(canvas.getByTestId("responsive-export").textContent).toBe(before);
    await userEvent.click(canvas.getByRole("button", { name: "Hide owner" }));
    await userEvent.click(canvas.getByRole("button", { name: "Narrow container" }));
    await waitFor(() =>
      expect(canvas.getByTestId("responsive-visibility")).toHaveTextContent('"owner":false'),
    );
    const reopened = await canvas.findByRole("button", {
      name: moreFieldsFor(findings[0]!.name),
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
    await userEvent.click(canvas.getAllByRole("button", { name: ANY_MORE_FIELDS })[0]!);
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
    const more = await canvas.findByRole("button", { name: moreFieldsFor("Record 0001") });
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
    const returned = await canvas.findByRole("button", { name: moreFieldsFor("Record 0001") });
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
      expect(canvas.queryAllByRole("button", { name: ANY_MORE_FIELDS })).toHaveLength(0),
    );
    await waitFor(() =>
      expect(Math.abs(frame.scrollHeight - originalHeight)).toBeLessThanOrEqual(2),
    );
    frame.scrollTop = 0;
    fireEvent.scroll(frame);
    await waitFor(() => expect(mountedRows()[0]).toHaveAttribute("data-row-id", "0"));
    await userEvent.click(canvas.getByRole("button", { name: "Preview width" }));
    const restored = await canvas.findByRole("button", { name: moreFieldsFor("Record 0001") });
    await expect(restored).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(restored);
    await waitFor(() => expect(restored).toHaveAttribute("aria-expanded", "false"));
    await userEvent.click(canvas.getByRole("button", { name: "Reverse records" }));
    await waitFor(() => expect(mountedRows()[0]).toHaveAttribute("data-row-id", "1999"));
    await waitFor(fits);
  },
};

/** The register on a small phone: the saved-view strip scrolls inside its row rather than past the window, the toolbar takes two rows (the search, then More with the filters and the primary at the end, its label whole), and the table folds its lower-priority fields into the row disclosure. Choosing a row puts the one-row SelectionBar in the two-row toolbar's place, and the slot keeps the toolbar's height, so the rows stay under the finger. */
export const RegisterNarrow: Story = {
  name: "Register at 340px",
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
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
    await expect(await canvas.findAllByRole("button", { name: ANY_MORE_FIELDS })).not.toHaveLength(
      0,
    );
    // The SelectionBar takes one row where the Toolbar took two; the slot keeps the Toolbar's
    // height, so the next row's checkbox stays under the finger.
    const boxes = within(table).getAllByRole("checkbox");
    const before = boxes[2]!.getBoundingClientRect().top;
    await userEvent.click(boxes[1]!);
    await canvas.findByRole("region", { name: "Selection" });
    await expect(boxes[2]!.getBoundingClientRect().top).toBeCloseTo(before, 0);
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
        .getByRole("button", { name: /^Preview /, pressed: true })
        .closest<HTMLElement>('[data-slot="preview-eye"]')!;
    await waitFor(() =>
      expect(open().previousElementSibling).toHaveTextContent(longFindings[0]!.name),
    );
    const slot = open();
    const value = slot.previousElementSibling as HTMLElement;
    await expect(slot).toHaveStyle({ opacity: "1" });
    await expect(value).toHaveStyle({ paddingInlineEnd: "24px" });
    await expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    await expect(along(value).end - 24).toBeLessThanOrEqual(along(slot).start + 1);

    // Nothing waits for a hover: the kebab carries the no-hover rule, and every control smaller
    // than 24px carries the touch hit area.
    // The name has priority 0, so it names the row: its cell is the row header and the kebab says it.
    await expect(within(table).getAllByRole("rowheader")[0]).toHaveTextContent(
      longFindings[0]!.name,
    );
    const kebab = within(table).getByRole("button", {
      name: `Row actions for ${longFindings[0]!.name}`,
    });
    await expect(kebab).toHaveClass("any-pointer-coarse:opacity-100");
    for (const control of within(table).getAllByRole("button")) {
      const { width, height } = control.getBoundingClientRect();
      if (width > 0 && (width < 24 || height < 24))
        await expect(control).toHaveClass("touch-target");
    }

    // Another row's eye moves the preview, and the room follows it.
    const second = within(table.querySelectorAll<HTMLElement>("tr[data-row-id]")[1]!);
    await userEvent.click(second.getByRole("button", { name: /^Preview / }));
    await waitFor(() =>
      expect(second.getByRole("button", { name: /^Preview / })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    await expect(canvas.getByText(`preview ${longFindings[1]!.id}`)).toBeVisible();
  },
};

/*
 * Header controls on a phone. Where nothing can hover, every column menu shows beside its heading.
 * A responsive table keeps the author's widths for them: the menu takes its room from the heading,
 * which ends in an ellipsis and shows whole on focus, so no column folds into More fields for it.
 */
function PhoneHeaderControls() {
  const columns = useMemo(
    () =>
      defineColumns<Finding>((c) => [
        c.text("name", { header: "Control title", minWidth: 200, priority: 0 }),
        c.id("id", { header: "Code", width: 130, priority: 1 }),
      ]),
    [],
  );
  const data = useMemo(() => longFindings.slice(0, 3), []);
  const table = useDataTable({
    columns,
    data,
    getRowId: (r) => r.id,
    label: "Controls on a phone",
    hideable: true,
  });
  return <DataTable responsive table={table} />;
}

export const HeaderControlsPhone: Story = {
  name: "Header controls at 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => <PhoneHeaderControls />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Controls on a phone" });
    const heading = (name: string) =>
      within(table)
        .getAllByRole("columnheader")
        .find((header) => header.textContent?.trim() === name)!;
    // Both columns hold on the phone: the code keeps its 130px and folds into nothing. (In a
    // 320px frame the two columns' own widths do not fit, and the code folds as it should.)
    const frame = table.closest<HTMLElement>('[data-slot="table-container"]')!;
    if (frame.clientWidth < 330) return;
    await waitFor(() => expect(heading("Code")).toBeVisible());
    await expect(within(table).queryAllByRole("button", { name: ANY_MORE_FIELDS })).toHaveLength(0);
    await expect(heading("Code").getBoundingClientRect().width).toBeCloseTo(130, 0);
    // Each heading carries its menu, shown where any pointer is coarse.
    for (const name of ["Control title", "Code"]) {
      const menu = within(heading(name)).getByRole("button", { name: `${name} column menu` });
      if (window.matchMedia("(any-pointer: coarse)").matches) await expect(menu).toBeVisible();
    }
  },
};

/*
 * A cut value, whole. The name column is narrower than its names: a cut name shows whole in the
 * table's one tooltip while the pointer rests on it, while its link has keyboard focus and after a
 * long press on a touch screen. The reader can also wrap the column from the Columns menu, so the
 * names read whole in the rows on any device; Reset columns ends the wrap.
 */
function CutNames() {
  const columns = useMemo(
    () =>
      defineColumns<Finding>((c) => [
        c.text("name", {
          header: "Finding",
          width: 220,
          priority: 0,
          cell: (r) => <TextLink href={`#/findings/${r.id}`}>{r.name}</TextLink>,
        }),
        c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
        c.text("owner", { header: "Owner", width: 160 }),
      ]),
    [],
  );
  const data = useMemo(() => longFindings.slice(0, 3), []);
  const table = useDataTable({ columns, data, getRowId: (r) => r.id, label: "Cut findings" });
  return (
    <div style={{ maxWidth: 520 }}>
      <DataTable
        responsive
        table={table}
        toolbar={
          <Toolbar>
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
          </Toolbar>
        }
      />
    </div>
  );
}

export const CutValues: Story = {
  name: "Cut values, whole",
  render: () => <CutNames />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Cut findings" });
    const reveal = () =>
      canvasElement.ownerDocument.querySelector<HTMLElement>('[data-slot="table-cell-reveal"]');
    const name = within(table).getByRole("link", { name: longFindings[0]!.name });
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    await expect(name.closest("th, td")).not.toHaveAttribute("title");

    // From the keyboard: the name's link has focus, and the cut name shows whole.
    canvas.getByRole("button", { name: /^Columns/ }).focus();
    for (let i = 0; i < 16 && canvasElement.ownerDocument.activeElement !== name; i++)
      await userEvent.tab();
    await expect(name).toHaveFocus();
    await waitFor(() => expect(reveal()).toHaveTextContent(longFindings[0]!.name));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(reveal()).toBeNull());

    // The reader wraps the column: the names read whole in their rows.
    await userEvent.click(canvas.getByRole("button", { name: /^Columns/ }));
    const wrap = within(await body.findByRole("group", { name: "Wrap text" }));
    await userEvent.click(wrap.getByRole("menuitemcheckbox", { name: "Wrap Finding" }));
    await expect(wrap.getByRole("menuitemcheckbox", { name: "Wrap Finding" })).toBeChecked();
    // A status keeps its one line: it is not offered.
    await expect(wrap.queryByRole("menuitemcheckbox", { name: "Wrap Status" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    const cell = within(table)
      .getByRole("link", { name: longFindings[0]!.name })
      .closest("th, td")!;
    await waitFor(() => expect(getComputedStyle(cell).whiteSpace).toBe("normal"));
    // The name runs on to a second line instead of ending in an ellipsis.
    const wrapped = within(table).getByRole("link", { name: longFindings[0]!.name });
    await expect(getComputedStyle(wrapped).textOverflow).not.toBe("ellipsis");
    await expect(wrapped.getClientRects().length).toBeGreaterThan(1);

    // Reset columns ends the wrap.
    await userEvent.click(canvas.getByRole("button", { name: "Table settings" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Reset columns" }));
    await waitFor(() => expect(getComputedStyle(cell).whiteSpace).toBe("nowrap"));
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
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
      responsive={false}
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
  return <DataTable responsive={false} table={table} />;
}

/** A resizable column's menu sets its width without a drag, for a single pointer, a touch screen or anyone who cannot drag (WCAG 2.5.7): Wider and Narrower step 32px and keep the menu open for another press, stopping at the column's minimum and maximum, and Reset width returns to the author's width. A polite status says the width the column now has. The handle is for the pointer and no tab stop: this menu is the keyboard's way. */
export const ColumnWidthFromMenu: Story = {
  name: "Column width from its menu",
  render: () => <WidthFromMenu />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Findings to size" });
    const width = (name: string) => parseFloat(headerNamed(table, name)!.style.width);
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
      responsive={false}
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
      responsive={false}
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
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search findings" }), "Backup");
    await waitFor(() => expect(location()).toBe("/findings?q=Backup"));
    await userEvent.click(within(headerNamed(table, "Due")!).getByRole("button", { name: "Due" }));
    await waitFor(() => expect(location()).toBe("/findings?q=Backup&sort=-due"));

    // Open a record, then Back: the register mounts again and asks the same question.
    await userEvent.click(canvas.getByRole("button", { name: "Open a record" }));
    await waitFor(() => expect(location()).toBe("/findings/FND-2204"));
    await userEvent.click(canvas.getByRole("button", { name: "Back" }));
    const back = await findTable();
    await waitFor(() =>
      expect(canvas.getByRole("searchbox", { name: "Search findings" })).toHaveValue("Backup"),
    );
    await expect(headerNamed(back, "Due")).toHaveAttribute("aria-sort", "descending");
    await expect(location()).toBe("/findings?q=Backup&sort=-due");

    // A shared link lands on the open register: its question replaces the reader's.
    await userEvent.click(canvas.getByRole("button", { name: "Follow a shared link" }));
    await waitFor(() =>
      expect(canvas.getByRole("searchbox", { name: "Search findings" })).toHaveValue(""),
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
      expect(canvas.getByRole("searchbox", { name: "Search findings" })).toHaveValue("Backup"),
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
    const field = canvas.getByRole("searchbox", { name: "Search findings" });

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
        responsive={false}
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
    const search = canvas.getByRole("searchbox", { name: "Search work" });
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

/*
 * Render budget. A custom cell counts, per row, how often its row draws, so the play sees which
 * rows a change redrew: one checkbox redraws one row, a preview step the two rows it changes, a
 * frame that narrows by a few pixels none, and a frame that folds a column every row.
 */
const drawnRows = new Map<string, number>();
function BudgetRegister() {
  const [active, setActive] = useState<string | null>(null);
  const [width, setWidth] = useState(880);
  const activeNow = useRef(active);
  activeNow.current = active;
  // Stable columns and data: the consumer's half of the memo.
  const budgetColumns = useMemo(
    () =>
      defineColumns<Finding>((c) => [
        c.id("id", {
          preview: (r) => setActive(r.id),
          active: (r) => r.id === activeNow.current,
        }),
        // The name is the identity, drawn in the row at every width, so its cell sees each row
        // that draws.
        c.text("name", {
          header: "Finding",
          minWidth: 220,
          priority: 0,
          cell: (r) => {
            drawnRows.set(r.id, (drawnRows.get(r.id) ?? 0) + 1);
            return r.name;
          },
        }),
        c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
        c.person("owner", { header: "Owner", width: 180 }),
        c.number("open", { header: "Open items", width: 110 }),
      ]),
    [],
  );
  const data = useMemo(() => findings.slice(0, 12), []);
  const table = useDataTable({
    columns: budgetColumns,
    data,
    getRowId: (r) => r.id,
    selectable: true,
    label: "Findings on a budget",
  });
  return (
    <Stack space="space.150">
      <Inline space="space.100" shouldWrap>
        <Button size="small" onClick={() => setWidth((w) => w - 6)}>
          Narrow a little
        </Button>
        <Button size="small" onClick={() => setWidth(420)}>
          Narrow to a phone
        </Button>
      </Inline>
      <div style={{ width, maxWidth: "100%" }} data-testid="budget-frame">
        <DataTable table={table} responsive />
      </div>
    </Stack>
  );
}

export const RenderBudget: Story = {
  name: "Render budget",
  render: () => <BudgetRegister />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Findings on a budget" });
    const settle = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
    const redrawn = () => [...drawnRows.keys()].sort();
    await settle();

    // One checkbox redraws its own row.
    drawnRows.clear();
    // The name has priority 0, so the checkbox says it.
    const third = table.querySelector<HTMLElement>('tr[data-row-id="FND-2202"]')!;
    await userEvent.click(
      within(third).getByRole("checkbox", { name: "Select Firewall rule recertification" }),
    );
    await settle();
    await expect(redrawn()).toEqual(["FND-2202"]);

    // A preview step redraws the row it leaves and the row it opens.
    await userEvent.click(within(table).getAllByRole("button", { name: /^Preview / })[1]!);
    await settle();
    drawnRows.clear();
    await userEvent.click(within(table).getAllByRole("button", { name: /^Preview / })[4]!);
    await settle();
    await expect(redrawn()).toEqual(["FND-2201", "FND-2204"]);

    // A row carries triggers, never a tooltip of its own: the eyes share the table's one tooltip,
    // and the row's other controls mount none.
    const triggers = [...table.querySelectorAll('tbody [data-slot="tooltip-trigger"]')];
    await expect(triggers).toHaveLength(12);
    await expect(
      triggers.every((trigger) => /^Preview /.test(trigger.getAttribute("aria-label") ?? "")),
    ).toBe(true);
    const eyes = within(table).getAllByRole("button", { name: /^Preview / });
    await userEvent.hover(eyes[6]!);
    const tips = () =>
      [...canvasElement.ownerDocument.querySelectorAll('[data-slot="tooltip-content"]')].filter(
        (tip) => tip.textContent === "Preview",
      );
    await waitFor(() => expect(tips()).toHaveLength(1));
    await userEvent.hover(eyes[7]!);
    await waitFor(() => expect(tips()).toHaveLength(1));
    await userEvent.unhover(eyes[7]!);

    // The layout projects draw the story narrower than its frame; the budget is a desktop's.
    const frameBox = canvas.getByTestId("budget-frame");
    if (frameBox.getBoundingClientRect().width < 880) return;

    // The name takes the slack through CSS, so a frame that narrows without folding a column
    // redraws nothing, and the table still fits its frame.
    const name = within(table).getByRole("columnheader", { name: "Finding" });
    await expect(name.style.width).toBe("");
    const tableFrame = table.closest<HTMLElement>('[data-slot="table-container"]')!;
    drawnRows.clear();
    for (let step = 0; step < 4; step++) {
      await userEvent.click(canvas.getByRole("button", { name: "Narrow a little" }));
      await settle();
    }
    await expect(redrawn()).toEqual([]);
    await expect(tableFrame.scrollWidth).toBeLessThanOrEqual(tableFrame.clientWidth);

    // A frame that folds a column redraws every row once, with More fields.
    await userEvent.click(canvas.getByRole("button", { name: "Narrow to a phone" }));
    await waitFor(() =>
      expect(within(table).getAllByRole("button", { name: ANY_MORE_FIELDS })).toHaveLength(12),
    );
    await settle();
    await expect(redrawn()).toHaveLength(12);
    await expect(tableFrame.scrollWidth).toBeLessThanOrEqual(tableFrame.clientWidth);
  },
};

/*
 * Narrowed outside the table. The caller filters `data` with a scope toggle the table cannot see,
 * and says so with `narrowed`: the result that is empty keeps the toolbar, the header and the
 * control that brings the rows back, in place of the no-records state that would hide them.
 */
function NarrowedOutside() {
  const [inside, setInside] = useState(false);
  const data = useMemo(() => (inside ? findings.slice(0, 5) : []), [inside]);
  const table = useDataTable({
    columns: rankColumns,
    data,
    getRowId: (r) => r.id,
    label: "Findings allocated here",
  });
  return (
    <DataTable
      table={table}
      narrowed={!inside}
      noun={{ one: "finding", other: "findings" }}
      toolbar={
        <Toolbar
          search={table.state.globalFilter}
          onSearch={table.setGlobalFilter}
          placeholder="Search findings"
          filters={
            <Button size="small" aria-pressed={inside} onClick={() => setInside((on) => !on)}>
              Include everything inside
            </Button>
          }
        />
      }
      empty={{
        title: "No findings yet",
        description: "The first assessment creates them.",
        // The caller's way back while it narrows; the kit's Clear filters for the table's own search.
        filtered: inside
          ? undefined
          : {
              title: "Nothing allocated here",
              description: "Its parts hold findings. Include everything inside to see them.",
              action: <Button onClick={() => setInside(true)}>Include everything inside</Button>,
            },
      }}
    />
  );
}

export const NarrowedOutsideTheTable: Story = {
  name: "Narrowed outside the table",
  render: () => <NarrowedOutside />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Nothing here, but the parts hold rows: the filtered empty, under the header, with the toolbar.
    await expect(canvas.getByRole("searchbox", { name: "Search findings" })).toBeVisible();
    await expect(canvas.getByRole("columnheader", { name: "Finding" })).toBeVisible();
    await expect(canvas.getByText("Nothing allocated here")).toBeVisible();
    await expect(canvas.queryByText("No findings yet")).toBeNull();
    // The table's own Clear filters would clear nothing, so only the caller's way back shows.
    await expect(canvas.queryByRole("button", { name: "Clear filters" })).toBeNull();
    const table = canvas.getByRole("table", { name: "Findings allocated here" });
    await userEvent.click(within(table).getByRole("button", { name: "Include everything inside" }));
    await waitFor(() => expect(canvas.getAllByRole("row")).toHaveLength(6));
    await waitFor(() => expect(politeLines(canvasElement)).toContain("5 findings"));

    // A search of the table's own that leaves nothing offers the kit's Clear filters again.
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search findings" }), "zzqqxx");
    await userEvent.click(await canvas.findByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(canvas.getAllByRole("row")).toHaveLength(6));
  },
};

/*
 * Result status. After a search, a filter, a saved question or a page, the table says the result
 * once the reader stops, in one polite line through the page's announcer, with the caller's noun;
 * while it loads, the table is busy.
 */
function Announced() {
  const [state, setState] = useState<DataTableState>("ready");
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (r) => r.id,
    pageSize: 8,
    label: "Findings said aloud",
  });
  return (
    <Stack space="space.150">
      <DataTable
        responsive={false}
        table={table}
        state={state}
        noun={{ one: "finding", other: "findings" }}
        toolbar={
          <Toolbar
            search={table.state.globalFilter}
            onSearch={table.setGlobalFilter}
            placeholder="Search findings"
            actions={
              <Button
                size="small"
                onClick={() => setState((now) => (now === "loading" ? "ready" : "loading"))}
              >
                {state === "loading" ? "Finish loading" : "Reload"}
              </Button>
            }
          />
        }
        empty={{ title: "No findings yet" }}
      />
    </Stack>
  );
}

export const ResultStatus: Story = {
  name: "Result status",
  render: () => <Announced />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Findings said aloud" });
    const search = canvas.getByRole("searchbox", { name: "Search findings" });
    const said = (line: string) => politeLines(canvasElement).filter((l) => l === line).length;
    const before = said("3 of 24 findings");
    // Typing is said once, when the reader stops.
    await userEvent.type(search, "Firewall");
    await waitFor(() => expect(said("3 of 24 findings")).toBe(before + 1));
    await new Promise((resolve) => setTimeout(resolve, 700));
    await expect(said("3 of 24 findings")).toBe(before + 1);

    await userEvent.type(search, "zz");
    await waitFor(() => expect(politeLines(canvasElement)).toContain("No matching findings"));
    await userEvent.clear(search);
    await waitFor(() => expect(politeLines(canvasElement)).toContain("1–8 of 24 findings"));

    await userEvent.click(canvas.getByRole("button", { name: "Page 2" }));
    await waitFor(() => expect(politeLines(canvasElement)).toContain("9–16 of 24 findings"));

    // A sort from a header is said in the words of the Sort menu, and so is turning it.
    const due = within(table).getByRole("columnheader", { name: /^Due/ });
    const direction = () =>
      due.getAttribute("aria-sort") === "descending" ? "Newest first" : "Oldest first";
    await userEvent.click(within(due).getByRole("button", { name: "Due" }));
    await waitFor(() => expect(due).toHaveAttribute("aria-sort"));
    const first = `Sorted by Due, ${direction()}`;
    await waitFor(() => expect(politeLines(canvasElement)).toContain(first));
    await userEvent.click(within(due).getByRole("button", { name: "Due" }));
    const second = `Sorted by Due, ${first.endsWith("Oldest first") ? "Newest first" : "Oldest first"}`;
    await waitFor(() => expect(politeLines(canvasElement)).toContain(second));

    // Loading keeps the header and says the table is busy.
    await userEvent.click(canvas.getByRole("button", { name: "Reload" }));
    await waitFor(() => expect(table).toHaveAttribute("aria-busy", "true"));
    await userEvent.click(canvas.getByRole("button", { name: "Finish loading" }));
    await waitFor(() => expect(table).not.toHaveAttribute("aria-busy"));
  },
};

/*
 * The name link keeps its focus ring. A register's name is a link in the preview column, cut to its
 * column: the link cuts itself and draws its ring inside its own box, so no clipping ancestor takes
 * any of it, whether the name fits or not.
 */
const linkedColumns = defineColumns<Finding>((c) => [
  c.text("name", {
    header: "Finding",
    minWidth: 140,
    priority: 0,
    cell: (r) => (
      <TextLink href={`#${r.id}`} onClick={(event) => event.preventDefault()}>
        {r.name}
      </TextLink>
    ),
  }),
  // The id opens the preview, so the eye sits at the end of the name, the row's first value.
  c.id("id", { preview: () => undefined }),
  c.person("owner", { header: "Owner", width: 180, priority: 1 }),
]);

/** The first name is longer than any panel gives it, so it is cut. */
const linkedFindings = findings.slice(0, 4).map((finding, at) =>
  at === 0
    ? {
        ...finding,
        name: "Segregation of duties across payables, receivables and the general ledger close",
      }
    : finding,
);

/** A responsive register in a narrow panel, as the product draws one, so the name is cut. */
/**
 * The register's usual shape: the id column is the name, its `cell` the record link and its
 * `preview` the eye, with an icon beside the link in a flex row, as a tree's element column draws it.
 */
const linkedIdColumns = defineColumns<Finding>((c) => [
  c.id("name", {
    header: "Finding",
    minWidth: 140,
    priority: 0,
    preview: () => undefined,
    cell: (r) => (
      <span className="flex min-w-0 items-center gap-075">
        <FileText aria-hidden className="size-icon-small shrink-0 icon-subtle" />
        <TextLink href={`#${r.id}`} onClick={(event) => event.preventDefault()}>
          {r.name}
        </TextLink>
      </span>
    ),
  }),
  c.person("owner", { header: "Owner", width: 180, priority: 1 }),
]);

function LinkedNames() {
  const table = useDataTable({
    columns: linkedColumns,
    data: linkedFindings,
    getRowId: (r) => r.id,
    label: "Findings by name",
  });
  const idTable = useDataTable({
    columns: linkedIdColumns,
    data: linkedFindings,
    getRowId: (r) => r.id,
    label: "Findings by record link",
  });
  return (
    <Stack space="space.300">
      <div style={{ width: 360, maxWidth: "100%" }}>
        <DataTable table={table} responsive />
      </div>
      <div style={{ width: 360, maxWidth: "100%" }}>
        <DataTable table={idTable} responsive />
      </div>
    </Stack>
  );
}

/** Whether any clipping ancestor, up to the table's frame, cuts the focus ring drawn around `el`. */
function ringClippedBy(el: HTMLElement): HTMLElement | null {
  const style = getComputedStyle(el);
  const reach = Math.max(0, parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth));
  const box = el.getBoundingClientRect();
  const ring = {
    left: box.left - reach,
    right: box.right + reach,
    top: box.top - reach,
    bottom: box.bottom + reach,
  };
  for (let node = el.parentElement; node; node = node.parentElement) {
    const clip = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const inner = {
      left: rect.left + node.clientLeft,
      right: rect.left + node.clientLeft + node.clientWidth,
      top: rect.top + node.clientTop,
      bottom: rect.top + node.clientTop + node.clientHeight,
    };
    const across = clip.overflowX !== "visible";
    const down = clip.overflowY !== "visible";
    if (across && (ring.left < inner.left - 0.5 || ring.right > inner.right + 0.5)) return node;
    if (down && (ring.top < inner.top - 0.5 || ring.bottom > inner.bottom + 0.5)) return node;
    if (node.dataset["slot"] === "table-container") break;
  }
  return null;
}

export const NameLinkFocus: Story = {
  name: "Name link focus",
  render: () => <LinkedNames />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A text column's link, and the id column's own link beside an icon: in both the first name
    // is cut, and the ring stays whole all the same.
    for (const name of ["Findings by name", "Findings by record link"]) {
      const table = canvas.getByRole("table", { name });
      const cut = within(table).getAllByRole("link")[0]!;
      await expect(cut.scrollWidth).toBeGreaterThan(cut.clientWidth);
      // The link ends in its own ellipsis and nothing around it overflows.
      await expect(getComputedStyle(cut).textOverflow).toBe("ellipsis");
      await expect(cut.parentElement!.scrollWidth).toBeLessThanOrEqual(
        cut.parentElement!.clientWidth,
      );
      canvasElement.ownerDocument.body.focus();
      for (let press = 0; press < 16 && canvasElement.ownerDocument.activeElement !== cut; press++)
        await userEvent.tab();
      await expect(cut).toHaveFocus();
      await expect(cut.matches(":focus-visible")).toBe(true);
      await expect(getComputedStyle(cut).outlineStyle).toBe("solid");
      await expect(ringClippedBy(cut)).toBeNull();
    }
  },
};

/*
 * Columns without a menu. With `columnMenu: false` no menu moves or sizes a column, so the grip and
 * the resize handle keep their keys: the grip takes Space and the arrow keys, the handle the arrow
 * keys, Home and End.
 */
const menulessColumns = defineColumns<Finding>((c) => [
  c.id("id"),
  c.text("name", { header: "Finding", width: 220 }),
  c.person("owner", { header: "Owner", width: 180 }),
]);

function Menuless() {
  const table = useDataTable({
    columns: menulessColumns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    label: "Findings without column menus",
    reorderable: true,
    resizable: true,
    columnMenu: false,
  });
  return <DataTable responsive={false} table={table} />;
}

export const ColumnsWithoutAMenu: Story = {
  name: "Columns without a menu",
  render: () => <Menuless />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Findings without column menus" });
    const header = within(table).getByRole("columnheader", { name: /Finding/ });
    await expect(within(header).queryByRole("button", { name: /column menu/ })).toBeNull();
    // No menu moves the column, so its grip is a named tab stop.
    const grip = within(header).getByRole("button", { name: "Reorder Finding column" });
    await expect(grip).not.toHaveAttribute("aria-hidden");
    await expect(grip.tabIndex).toBe(0);
    // No menu sizes it, so the handle takes the arrow keys.
    const handle = within(header).getByRole("separator", { name: "Resize Finding" });
    await expect(handle.tabIndex).toBe(0);
    const before = Number(handle.getAttribute("aria-valuenow"));
    handle.focus();
    // Towards the line's end widens the column: ArrowRight, or ArrowLeft in right to left.
    await userEvent.keyboard(arrows(handle).next);
    await waitFor(() => expect(handle).toHaveAttribute("aria-valuenow", String(before + 8)));
    await userEvent.keyboard("{Home}");
    await waitFor(() =>
      expect(handle.getAttribute("aria-valuenow")).toBe(handle.getAttribute("aria-valuemin")),
    );
  },
};

/*
 * Facets that hold. A `list` column's facet lists each item once, counted per row that holds it,
 * and a row matches when it holds any item chosen, never the combinations the rows hold; its
 * `emptyLabel` lists the rows with none under a value of their own. A value the reader chose stays
 * in its list, at 0, when the search or another filter removes its rows. The order is the status's
 * or the alphabet's, never the counts', and a facet of more than eight values takes a search.
 */
type Assignment = {
  id: string;
  title: string;
  status: "Open" | "Blocked" | "Done";
  assignees: string[];
};

const assigneeNames = [
  "Ada Byron",
  "Alan Turing",
  "Barbara Liskov",
  "Donald Knuth",
  "Edsger Dijkstra",
  "Frances Allen",
  "Grace Hopper",
  "John Backus",
  "Ken Thompson",
  "Margaret Hamilton",
  "Radia Perlman",
  "Tim Berners-Lee",
];
const assignmentStates: Assignment["status"][] = ["Open", "Blocked", "Done"];

/** Twelve tasks, two people each, so every person holds exactly two tasks; a thirteenth has no one. */
const assignments: Assignment[] = [
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `TSK-${String(i + 1).padStart(2, "0")}`,
    title: names[i % names.length] ?? "",
    status: assignmentStates[i % 3] ?? "Open",
    assignees: [assigneeNames[i] ?? "", assigneeNames[(i + 5) % 12] ?? ""],
  })),
  { id: "TSK-13", title: "Rotate the recovery keys", status: "Blocked", assignees: [] },
];

const assignmentColumns = defineColumns<Assignment>((c) => [
  c.id("id"),
  c.text("title", { header: "Task", minWidth: 200 }),
  c.status("status", {
    header: "Status",
    width: 120,
    tone: (r) => (r.status === "Blocked" ? "danger" : r.status === "Done" ? "success" : "neutral"),
  }),
  c.list("assignees", {
    header: "Assigned to",
    width: 200,
    items: (r) => r.assignees.map((label) => ({ key: label, label })),
    empty: () => <Absent label="Unassigned" />,
    emptyLabel: "Unassigned",
    searchable: true,
  }),
]);

function AssignmentFacets() {
  const table = useDataTable({
    columns: assignmentColumns,
    data: assignments,
    getRowId: (r) => r.id,
    label: "Tasks by assignee",
  });
  return (
    <DataTable
      responsive={false}
      table={table}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Search table={table} placeholder="Search tasks" />
          <DataTable.Filter table={table} column="status" />
          <DataTable.Filter table={table} column="assignees" width={260} />
        </Inline>
      }
    />
  );
}

export const FacetsStory: Story = {
  name: "Facets that hold",
  render: () => <AssignmentFacets />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Tasks by assignee" });
    const rows = () => table.querySelectorAll("tbody tr[data-row-id]").length;
    /** Each checkbox's words and count, in the order the facet lists them. */
    const listed = (popup: { getAllByRole: (role: "checkbox") => HTMLElement[] }) =>
      popup.getAllByRole("checkbox").map((box) => box.closest("label")?.textContent ?? "");
    const open = async (label: string) => {
      await userEvent.click(filterChip(canvasElement, label));
      const popup = await body.findByRole("dialog", { name: label });
      await waitFor(() => expect(popup).toBeVisible());
      return within(popup);
    };
    const close = async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    };

    // Each person once, counted per task that holds them, in the alphabet's order, never a pair;
    // the task with no one is under Unassigned.
    let people = await open("Assigned to");
    const boxes = people.getAllByRole("checkbox");
    await expect(boxes).toHaveLength(13);
    await expect(boxes[0]).toHaveAccessibleName("Ada Byron 2");
    await expect(boxes[11]).toHaveAccessibleName("Tim Berners-Lee 2");
    await expect(boxes[12]).toHaveAccessibleName("Unassigned 1");
    await expect(people.queryByRole("checkbox", { name: /,/ })).toBeNull();
    // Twelve values take a search; a search that finds none says so, and Escape clears it first.
    const find = people.getByRole("searchbox", { name: "Search Assigned to" });
    await userEvent.type(find, "zz");
    await expect(people.getByText("No values match")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(find).toHaveValue("");
    await expect(people.getAllByRole("checkbox")).toHaveLength(13);
    await userEvent.type(find, "grace");
    await expect(people.getAllByRole("checkbox")).toHaveLength(1);
    await userEvent.keyboard("{Escape}");
    await expect(find).toHaveValue("");
    await expect(people.getAllByRole("checkbox")).toHaveLength(13);
    await close();

    // Status Done, then a search that finds no done task: nothing remains.
    const status = await open("Status");
    await expect(listed(status)).toEqual(["Blocked5", "Done4", "Open4"]);
    await userEvent.click(status.getByRole("checkbox", { name: "Done 4" }));
    await close();
    await waitFor(() => expect(rows()).toBe(4));
    const search = canvas.getByRole("searchbox", { name: "Search tasks" });
    await userEvent.type(search, "Incident");
    await waitFor(() => expect(rows()).toBe(0));

    // Done is still listed, checked, at 0, so it can be unchecked where it was checked.
    const kept = await open("Status");
    const done = kept.getByRole("checkbox", { name: "Done 0" });
    await expect(done).toBeChecked();
    await expect(listed(kept)).toEqual(["Done0", "Open1"]);
    await userEvent.click(done);
    await close();
    await waitFor(() => expect(rows()).toBe(1));

    // A row matches when it holds a chosen person: with the search cleared, both of Grace's tasks.
    people = await open("Assigned to");
    await userEvent.click(people.getByRole("checkbox", { name: "Grace Hopper 1" }));
    await close();
    await userEvent.clear(search);
    await waitFor(() => expect(rows()).toBe(2));
    await expect(filterChip(canvasElement, "Assigned to")).toHaveTextContent("Grace Hopper");

    // Unassigned finds the task with no one, as its cell says.
    people = await open("Assigned to");
    await userEvent.click(people.getByRole("checkbox", { name: "Grace Hopper 2" }));
    await userEvent.click(people.getByRole("checkbox", { name: "Unassigned 1" }));
    await close();
    await waitFor(() => expect(rows()).toBe(1));
    await expect(within(table).getByText("Rotate the recovery keys")).toBeVisible();
    people = await open("Assigned to");
    await userEvent.click(people.getByRole("checkbox", { name: "Unassigned 1" }));
    await close();

    // The column is `searchable`: the search finds a task by any of its people.
    await userEvent.type(search, "Knuth");
    await waitFor(() => expect(rows()).toBe(2));
  },
};

/** The date range is two of the kit's day pickers, each end open until chosen, the one limiting the other; the chip says the range in the reader's words. A number range says so when its start comes after its end. */
function RangeFilters() {
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (r) => r.id,
    label: "Findings by range",
    initialState: {
      columnFilters: [
        { id: "due", value: ["2026-03-01", "2026-05-31"] },
        { id: "open", value: [90, 10] },
      ],
    },
  });
  return (
    <DataTable
      table={table}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Filter table={table} column="due" />
          <DataTable.Filter table={table} column="open" />
        </Inline>
      }
    />
  );
}

export const RangeFiltersStory: Story = {
  name: "Date and number ranges",
  render: () => <RangeFilters />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    // The chip reads the range as the cells read their dates, not as ISO text.
    const due = filterChip(canvasElement, "Due");
    await expect(due).toHaveTextContent(/Mar 1\s*–\s*May 31, 2026/);
    await expect(filterChip(canvasElement, "Open items")).toHaveTextContent("90–10");

    await userEvent.click(due);
    const range = within(await body.findByRole("dialog", { name: "Due" }));
    const from = range.getByRole("button", { name: "From" });
    await expect(from).toHaveTextContent("Mar 1, 2026");
    await expect(range.getByRole("button", { name: "To" })).toHaveTextContent("May 31, 2026");
    // The day picker opens over the filter; Escape closes the month first, then the filter.
    await userEvent.click(from);
    await waitFor(() => expect(body.getAllByRole("dialog")).toHaveLength(2));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.getAllByRole("dialog")).toHaveLength(1));
    await expect(body.getByRole("dialog", { name: "Due" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());

    // A start after the end is flagged at the end, in words.
    await userEvent.click(filterChip(canvasElement, "Open items"));
    const open = within(await body.findByRole("dialog", { name: "Open items" }));
    const to = open.getByRole("spinbutton", { name: "To" });
    await expect(to).toHaveAttribute("aria-invalid", "true");
    await expect(to).toHaveAccessibleDescription("The start comes after the end.");
    await userEvent.clear(to);
    await userEvent.type(to, "100");
    await waitFor(() => expect(to).not.toHaveAttribute("aria-invalid"));
    await expect(open.queryByText("The start comes after the end.")).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/*
 * The saved-question menu. The trigger is named by what it shows, the question and its count, so
 * "click All findings" finds it, and "Saved questions" is its description. A question matches the
 * table's filters however they were set: the values in another order, or one value on its own.
 */
const manyFindings = makeFindings(150);
const menuPresets = [
  { id: "all", label: "All findings" },
  {
    id: "active",
    label: "Draft or in review",
    filters: [{ id: "status", value: ["Draft", "In review"] }],
  },
  { id: "overdue", label: "Overdue", filters: [{ id: "status", value: "Overdue" }] },
];

function QuestionMenu() {
  const table = useDataTable({
    columns,
    data: manyFindings,
    getRowId: (r) => r.id,
    pageSize: 10,
    label: "Findings by saved question",
  });
  return (
    <DataTable
      table={table}
      toolbar={
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <DataTable.Presets table={table} presets={menuPresets} variant="menu" />
          <DataTable.Filter table={table} column="status" />
        </Inline>
      }
    />
  );
}

export const SavedQuestionMenu: Story = {
  name: "Saved question menu",
  render: () => <QuestionMenu />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const count = (...states: Finding["status"][]) =>
      manyFindings.filter((f) => states.includes(f.status)).length;
    // The visible words are the name; the count is whole, not 99+.
    const trigger = canvas.getByRole("button", { name: "All findings 150" });
    await expect(trigger).toHaveAccessibleDescription("Saved questions");

    // In review, then Draft, from the chip: the question "Draft or in review" still matches.
    await userEvent.click(filterChip(canvasElement, "Status"));
    const status = within(await body.findByRole("dialog", { name: "Status" }));
    await userEvent.click(status.getByRole("checkbox", { name: /^In review/ }));
    await userEvent.click(status.getByRole("checkbox", { name: /^Draft/ }));
    await expect(
      canvas.getByRole("button", {
        name: `Draft or in review ${count("Draft", "In review")}`,
      }),
    ).toBeVisible();
    // One value on its own is the question that names it as a string.
    await userEvent.click(status.getByRole("checkbox", { name: /^In review/ }));
    await userEvent.click(status.getByRole("checkbox", { name: /^Draft/ }));
    await userEvent.click(status.getByRole("checkbox", { name: /^Overdue/ }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    const overdue = canvas.getByRole("button", { name: `Overdue ${count("Overdue")}` });
    await expect(overdue).toHaveAccessibleDescription("Saved questions");

    // The menu lists every question, checks the one in force, and replaces the filters. Each
    // question's count is part of its name, not a shortcut hidden from assistive technology.
    await userEvent.click(overdue);
    await expect(
      await body.findByRole("menuitemradio", { name: `Overdue ${count("Overdue")}` }),
    ).toBeChecked();
    await expect(body.getByRole("menuitemradio", { name: "All findings 150" })).not.toBeChecked();
    await userEvent.click(body.getByRole("menuitemradio", { name: /^All findings/ }));
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await expect(canvas.getByRole("button", { name: "All findings 150" })).toHaveFocus();
  },
};

/*
 * Server facets and counts. A table the server filters holds one page of rows, so it cannot count
 * what the other pages hold: the server's values and counts reach the facet as `options`, and each
 * saved question's count reaches the presets as `counts`.
 */
const serverStatusOptions = statuses.map((status) => ({
  value: status,
  count: serverRows.filter((row) => row.status === status).length,
}));
const serverPresets = [
  { id: "all", label: "All findings" },
  { id: "overdue", label: "Overdue", filters: [{ id: "status", value: "Overdue" }] },
];
const serverPresetCounts = {
  all: serverRows.length,
  overdue: serverRows.filter((row) => row.status === "Overdue").length,
};

function ServerFaceted() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 8 });
  const [result, setResult] = useState<{ rows: Finding[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    void fakeServer({ sorting: [], columnFilters, globalFilter: "", pagination }).then((r) => {
      if (!live) return;
      setResult(r);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [columnFilters, pagination]);
  const table = useDataTable({
    label: "Findings with server facets",
    columns,
    data: result?.rows ?? [],
    getRowId: (r) => r.id,
    pageSize: 8,
    manual: { filtering: true, pagination: true },
    rowCount: result?.total ?? 0,
    state: { columnFilters, pagination },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
  });
  return (
    <div aria-busy={loading}>
      <DataTable
        table={table}
        state={loading && !result ? "loading" : "ready"}
        toolbar={
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <DataTable.Presets
              table={table}
              presets={serverPresets}
              counts={serverPresetCounts}
              variant="menu"
            />
            <DataTable.Filter table={table} column="status" options={serverStatusOptions} />
          </Inline>
        }
      />
    </div>
  );
}

export const ServerFacets: Story = {
  name: "Server facets and counts",
  render: () => <ServerFaceted />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const table = canvas.getByRole("table", { name: "Findings with server facets" });
    const settled = () =>
      waitFor(() => expect(table.closest("[aria-busy]")).toHaveAttribute("aria-busy", "false"));
    await settled();
    // Every status the server holds, with the server's counts, though the page holds eight rows.
    await expect(canvas.getByRole("button", { name: "All findings 240" })).toBeVisible();
    await userEvent.click(filterChip(canvasElement, "Status"));
    const status = within(await body.findByRole("dialog", { name: "Status" }));
    await expect(
      status.getAllByRole("checkbox").map((box) => box.closest("label")?.textContent),
    ).toEqual(serverStatusOptions.map((option) => `${option.value}${option.count}`));
    await userEvent.click(status.getByRole("checkbox", { name: /^Overdue/ }));
    await userEvent.keyboard("{Escape}");
    await settled();
    await expect(
      canvas.getByRole("button", { name: `Overdue ${serverPresetCounts.overdue}` }),
    ).toBeVisible();
  },
};

/** Previous and Next stay focusable at the first and last page (aria-disabled), so a reader who pages to the end by keyboard keeps their place. */
function Paged() {
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (r) => r.id,
    pageSize: 8,
    label: "Paged findings",
  });
  return <DataTable table={table} />;
}

export const PagingKeepsFocus: Story = {
  name: "Paging keeps focus",
  render: () => <Paged />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole("button", { name: "Previous page" });
    const next = canvas.getByRole("button", { name: "Next page" });
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await expect(previous.tabIndex).toBe(0);
    const current = (page: number) =>
      waitFor(() =>
        expect(canvas.getByRole("button", { name: `Page ${page}` })).toHaveAttribute(
          "aria-current",
          "page",
        ),
      );
    next.focus();
    await userEvent.keyboard("{Enter}");
    await current(2);
    await userEvent.keyboard("{Enter}");
    await current(3);
    // The last page: Next says it cannot go on, and keeps focus.
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await current(3);
    await expect(next).toHaveFocus();
    await expect(previous).not.toHaveAttribute("aria-disabled");
  },
};

/** A table that can reorder speaks a drag as a place in the order, by the column's header ("Finding moved to position 3 of 3."). Its headers slide on the motion tokens, and not at all under reduced motion. A table that cannot reorder mounts no drag context and no live region. */
function DragSpoken() {
  const table = useDataTable({
    columns: menulessColumns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    label: "Findings by drag",
    reorderable: true,
    columnMenu: false,
  });
  const still = useDataTable({
    columns: menulessColumns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    label: "Findings that stay put",
  });
  return (
    <Stack space="space.300">
      <DataTable responsive={false} table={table} />
      <DataTable responsive={false} table={still} />
    </Stack>
  );
}

export const DragSaysThePlace: Story = {
  name: "Drag says the place",
  render: () => <DragSpoken />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const table = canvas.getByRole("table", { name: "Findings by drag" });
    // Only the table that can reorder has a drag context, and so a live region.
    await expect(doc.querySelectorAll('[id^="DndLiveRegion"]')).toHaveLength(1);
    const spoken = () => doc.querySelector('[id^="DndLiveRegion"]')?.textContent ?? "";
    const grip = within(table).getByRole("button", { name: "Reorder Finding column" });
    grip.focus();
    await userEvent.keyboard(" ");
    await waitFor(() => expect(spoken()).toContain("Picked up Finding."));
    // Towards the line's end: ArrowRight, or ArrowLeft in right to left.
    await userEvent.keyboard(arrows(grip).next);
    await waitFor(() => expect(spoken()).toContain("Finding moved to position 3 of 3."));
    // The header the column passes slides on the tokens, or not at all under reduced motion.
    const owner = headerNamed(table, "Owner")!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      await expect(owner.style.transition).toBe("");
    else {
      // motion.duration.medium on the standard curve, not dnd-kit's own 200ms ease.
      await expect(owner.style.transition).toMatch(/transform 150ms cubic-bezier/);
      await expect(owner.style.transition).not.toContain("200ms");
    }
    await userEvent.keyboard(" ");
    await waitFor(() => expect(spoken()).toContain("Finding dropped at position 3 of 3."));
    await waitFor(() =>
      expect(
        within(table)
          .getAllByRole("columnheader")
          .map((header) => header.textContent?.trim() ?? "")
          .at(-1),
      ).toContain("Finding"),
    );
  },
};

/* ------------------------------------------------------------------------------------------------
 * DTCORE: one at a time, the slack, refreshing and a stranded page, the compact empty, row actions
 * that navigate, export and totals, the table's own preview, rows that open like links, versioned
 * views, the selection in the toolbar slot, days in the reader's zone, and a virtual window.
 * --------------------------------------------------------------------------------------------- */

/** One record from a list, as a picker chooses it: `selectable: "single"` draws a radio per row and no select-all; a click on the row chooses it, and the arrow keys move the choice. The rows are keyed by their own `id` without a `getRowId`. */
function ChoosingOne() {
  const [chosen, setChosen] = useState<string | null>(null);
  const table = useDataTable({
    columns,
    data: findings.slice(0, 6),
    selectable: "single",
    value: chosen,
    onValueChange: setChosen,
    label: "Findings to link",
  });
  return (
    <Stack space="space.150">
      <DataTable responsive={false} table={table} />
      <Text size="small" color="color.text.subtle">
        {chosen ? `Chosen: ${chosen}` : "Nothing chosen"}
      </Text>
    </Stack>
  );
}

export const ChoosingOneStory: Story = {
  name: "Choosing one",
  render: () => <ChoosingOne />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = within(canvas.getByRole("table", { name: "Findings to link" }));
    // No select-all and no checkboxes: one radio per row, named by the row's own id.
    await expect(table.queryByRole("checkbox")).toBeNull();
    await expect(table.getAllByRole("radio")).toHaveLength(6);
    // A click on the row chooses it; choosing is not opening.
    await userEvent.click(table.getByText(names[2]!));
    await expect(table.getByRole("radio", { name: "Select FND-2202" })).toBeChecked();
    await expect(canvas.getByText("Chosen: FND-2202")).toBeVisible();
    // The browser's own radio keys: the arrow moves the choice to the next row.
    table.getByRole("radio", { name: "Select FND-2202" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(table.getByRole("radio", { name: "Select FND-2203" })).toBeChecked();
    await expect(table.getByRole("radio", { name: "Select FND-2202" })).not.toBeChecked();
    await expect(canvas.getByText("Chosen: FND-2203")).toBeVisible();
  },
};

const slackColumns = defineColumns<Finding>((c) => [
  c.id("id", { width: 120, priority: 0 }),
  c.text("name", { header: "Finding", minWidth: 160 }),
  c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
  c.text("family", { header: "Family", minWidth: 120 }),
]);
/** A name drawn by the id kind: with a `minWidth` and no `width` it grows with the other unsized columns. */
const slackNamedColumns = defineColumns<Finding>((c) => [
  c.id("name", { header: "Named finding", minWidth: 200, priority: 0 }),
  c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
  c.text("family", { header: "Family", minWidth: 100 }),
]);

/** A responsive table that fits: the author's widths hold, and the spare width goes to the columns the author left unsized, in proportion to their minimums. With every column sized, the identity takes it. An id with only a `minWidth` is a name, and grows. */
function UnsizedSlack() {
  const [width, setWidth] = useState(1100);
  const table = useDataTable({
    columns: slackColumns,
    data: findings.slice(0, 5),
    getRowId: (r) => r.id,
    label: "Findings, fitted",
  });
  const named = useDataTable({
    columns: slackNamedColumns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    label: "Findings, named by the id",
  });
  return (
    <Stack space="space.150">
      <Inline space="space.100" shouldWrap>
        <Button size="small" onClick={() => setWidth(1100)}>
          1100 wide
        </Button>
        <Button size="small" onClick={() => setWidth(700)}>
          700 wide
        </Button>
      </Inline>
      <div data-testid="slack-frame" style={{ width, maxWidth: "100%" }}>
        <Stack space="space.200">
          <DataTable responsive table={table} />
          <DataTable responsive table={named} />
        </Stack>
      </div>
    </Stack>
  );
}

export const UnsizedColumnsTakeTheSlack: Story = {
  name: "Unsized columns take the slack",
  render: () => <UnsizedSlack />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("slack-frame");
    const table = canvas.getByRole("table", { name: "Findings, fitted" });
    const width = (name: string) => headerNamed(table, name)?.getBoundingClientRect().width ?? 0;
    if (frame.clientWidth < 1100) return;
    // The id keeps the author's 120; Finding and Family share the rest, each above its minimum.
    await waitFor(() => expect(width("Finding")).toBeGreaterThan(400));
    await expect(Math.round(width("ID"))).toBe(120);
    await expect(width("Family")).toBeGreaterThan(300);
    await expect(width("Finding") / width("Family")).toBeCloseTo(160 / 120, 1);
    // An id with only a minimum is a name: it shares the slack as the unsized text does.
    const named = canvas.getByRole("table", { name: "Findings, named by the id" });
    const namedWidth = (name: string) =>
      headerNamed(named, name)?.getBoundingClientRect().width ?? 0;
    await waitFor(() => expect(namedWidth("Named finding")).toBeGreaterThan(400));
    await expect(Math.round(namedWidth("Status"))).toBe(120);
    await expect(namedWidth("Named finding") / namedWidth("Family")).toBeCloseTo(2, 1);
    await userEvent.click(canvas.getByRole("button", { name: "700 wide" }));
    await waitFor(() => expect(width("Finding")).toBeLessThan(300));
    await expect(Math.round(width("ID"))).toBe(120);
    await expect(width("Finding")).toBeGreaterThanOrEqual(160);
    await expect(width("Family")).toBeGreaterThanOrEqual(120);
  },
};

/** A server table: while it refreshes the rows stay under `aria-busy` and a quiet bar, and a load the reader waits for is said; a page that comes back empty keeps the toolbar, the header and the pager, with the way to the first page. */
function RefreshingPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [total, setTotal] = useState(12);
  const [refreshing, setRefreshing] = useState(false);
  const from = pagination.pageIndex * pagination.pageSize;
  const rows = findings.slice(0, total).slice(from, from + pagination.pageSize);
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (r) => r.id,
    label: "Findings on the server",
    pageSize: 5,
    pageSizes: [5],
    manual: { pagination: true },
    rowCount: total,
    state: { pagination },
    onPaginationChange: setPagination,
  });
  return (
    <Stack space="space.150">
      <Inline space="space.100" shouldWrap>
        <Button size="small" onClick={() => setRefreshing((now) => !now)}>
          {refreshing ? "Finish refreshing" : "Refresh"}
        </Button>
        <Button size="small" onClick={() => setTotal(10)}>
          Delete the last two
        </Button>
      </Inline>
      <DataTable
        table={table}
        state={refreshing ? "refreshing" : "ready"}
        toolbar={
          <Toolbar
            search={table.state.globalFilter}
            onSearch={table.setGlobalFilter}
            placeholder="Search the server"
          />
        }
      />
    </Stack>
  );
}

export const RefreshingAndAStrandedPage: Story = {
  name: "Refreshing and a stranded page",
  render: () => <RefreshingPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Findings on the server" });
    // Only a page is drawn, so the table says how many rows there are and where each one is.
    await expect(table).toHaveAttribute("aria-rowcount", "13");
    await expect(table.querySelector("tbody tr")).toHaveAttribute("aria-rowindex", "2");
    await userEvent.click(canvas.getByRole("button", { name: "Refresh" }));
    await expect(table).toHaveAttribute("aria-busy", "true");
    await expect(within(table).getByText("FND-2200")).toBeVisible();
    await waitFor(() =>
      expect(politeLines(canvasElement)).toContain("Findings on the server, loading"),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Finish refreshing" }));
    await waitFor(() => expect(table).not.toHaveAttribute("aria-busy"));
    // The last page, then its rows go: the page is left, not the register.
    await userEvent.click(canvas.getByRole("button", { name: "Page 3" }));
    await waitFor(() => expect(within(table).getByText("FND-2210")).toBeVisible());
    await expect(table.querySelector("tbody tr")).toHaveAttribute("aria-rowindex", "12");
    await userEvent.click(canvas.getByRole("button", { name: "Delete the last two" }));
    await expect(await canvas.findByText("Nothing on this page")).toBeVisible();
    await expect(canvas.getByRole("searchbox", { name: "Search the server" })).toBeVisible();
    await expect(
      canvas.getByRole("navigation", { name: "Findings on the server pagination" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Go to first page" }));
    await waitFor(() => expect(within(table).getByText("FND-2200")).toBeVisible());
    await waitFor(() =>
      expect(canvas.getByRole("searchbox", { name: "Search the server" })).toHaveFocus(),
    );
  },
};

/** A collection of a few rows inside a record: `empty.size: "compact"` says there is nothing in one short row beside its icon, a search that finds nothing says so the same way, and a collection that fits the smallest page has no pager. */
const compactColumns = defineColumns<Finding>((c) => [
  c.id("id"),
  c.text("name", { header: "Finding", minWidth: 200 }),
  c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
]);

function CompactCollection() {
  const [data, setData] = useState<Finding[]>([]);
  const table = useDataTable({
    columns: compactColumns,
    data,
    getRowId: (r) => r.id,
    label: "Linked findings",
    pageSize: 20,
  });
  return (
    <div style={{ maxWidth: 560 }}>
      <Stack space="space.150">
        <Inline space="space.100" shouldWrap>
          <Button size="small" onClick={() => setData(findings.slice(0, 2))}>
            Link two findings
          </Button>
        </Inline>
        <DataTable
          table={table}
          loadingRows={3}
          toolbar={
            <Toolbar
              search={table.state.globalFilter}
              onSearch={table.setGlobalFilter}
              placeholder="Search linked findings"
            />
          }
          empty={{
            size: "compact",
            icon: <FileText />,
            title: "No findings linked",
            description: "Link the findings this control answers.",
            action: <Button size="small">Link finding</Button>,
          }}
        />
      </Stack>
    </div>
  );
}

export const CompactEmpty: Story = {
  name: "Compact empty",
  render: () => <CompactCollection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const empty = canvasElement.querySelector('[data-slot="empty"]');
    await expect(empty).toHaveAttribute("data-size", "compact");
    await expect(canvas.getByText("No findings linked")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Link two findings" }));
    const table = await canvas.findByRole("table", { name: "Linked findings" });
    await expect(within(table).getByText("FND-2201")).toBeVisible();
    // Two rows fit the smallest page: no "1–2 of 2" pager under them.
    await expect(
      canvas.queryByRole("navigation", { name: "Linked findings pagination" }),
    ).toBeNull();
    const search = canvas.getByRole("searchbox", { name: "Search linked findings" });
    await userEvent.type(search, "zz-nothing");
    await expect(await canvas.findByText("Nothing matches")).toBeVisible();
    await expect(
      canvasElement.querySelector('[data-slot="empty"][data-size="compact"]'),
    ).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(search).toHaveFocus());
    await expect(search).toHaveValue("");
  },
};

const navigatingColumns = defineColumns<Finding>((c) => [
  c.id("id"),
  c.text("name", { header: "Finding", minWidth: 200 }),
  c.actions((r) => [
    { label: "Open finding", href: `#/findings/${r.id}`, icon: <FileText /> },
    {
      label: "Include every element (12 missing)",
      description: "Adds the elements this finding skips.",
      onSelect: () => {},
    },
    { label: "Reassign", onSelect: () => {}, disabledReason: "Only the owner can reassign." },
    { label: "Close finding", tone: "danger", group: "danger", onSelect: () => {} },
  ]),
]);

/** Row actions that navigate are links (open in a new tab with a modifier or the middle button), actions that act are buttons; each takes an icon, a line under its label, the reason it is unavailable, and a group, with a separator between groups. The menu is as wide as its longest label. */
function NavigatingActions() {
  const table = useDataTable({
    columns: navigatingColumns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    label: "Findings with their actions",
  });
  return <DataTable table={table} />;
}

export const RowActionsThatNavigate: Story = {
  name: "Row actions that navigate",
  render: () => <NavigatingActions />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Row actions for FND-2200" }));
    const open = await body.findByRole("menuitem", { name: "Open finding" });
    await expect(open.tagName).toBe("A");
    await expect(open).toHaveAttribute("href", "#/findings/FND-2200");
    const long = body.getByRole("menuitem", { name: "Include every element (12 missing)" });
    // The label is whole: the menu sizes to it.
    const label = [...long.querySelectorAll("span")].find((el) =>
      el.textContent?.startsWith("Include"),
    );
    if (label) await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
    await expect(body.getByRole("menuitem", { name: "Reassign" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(body.getByRole("separator")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

type Unit = { id: string; name: string; note: string; controls: number; parts?: Unit[] };
const units: Unit[] = [
  {
    id: "u1",
    name: '=HYPERLINK("https://example.test")',
    note: "-5",
    controls: 4,
    parts: [
      { id: "u1a", name: "Main board", note: "@sum", controls: 3 },
      { id: "u1b", name: "I/O board", note: "+1", controls: 2 },
    ],
  },
  { id: "u2", name: "Ground station", note: "ok", controls: 6 },
];
const unitColumns = defineColumns<Unit>((c) => [
  c.text("name", { header: "Unit", sortable: false }),
  c.text("note", { header: "Note", width: 120, sortable: false }),
  c.number("controls", { header: "Controls", width: 110, sortable: false, footer: "sum" }),
]);

/** Export and totals take the rows the filters leave, whatever is open: a folded part is exported, with each row's level, and the total does not move as a row opens. A value a spreadsheet would run as a formula is written as text; a plain number stays a number. */
function ExportAndTotals() {
  const table = useDataTable({
    columns: unitColumns,
    data: units,
    getRowId: (r) => r.id,
    label: "Units, exported",
    tree: { children: (r) => r.parts, label: (r) => r.name },
  });
  return (
    <Stack space="space.150">
      <DataTable responsive={false} table={table} />
      <output data-testid="unit-export" className="block whitespace-pre-wrap break-all">
        {toCsv(table)}
      </output>
    </Stack>
  );
}

export const ExportAndTotalsStory: Story = {
  name: "Export and totals",
  render: () => <ExportAndTotals />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("treegrid", { name: "Units, exported" });
    const csv = () => canvas.getByTestId("unit-export").textContent ?? "";
    const total = () => table.querySelector("tfoot")?.textContent?.replace(/\D/g, "") ?? "";
    // The parts are folded, and still exported, each with its level.
    await expect(within(table).queryByText("Main board")).toBeNull();
    await expect(csv()).toContain("Level,Unit,Note,Controls");
    await expect(csv()).toContain("2,Main board,'@sum,3");
    await expect(csv()).toContain("2,I/O board,+1,2");
    await expect(csv()).toContain('1,"\'=HYPERLINK(""https://example.test"")",-5,4');
    // The total counts the rows with no parts: 3 + 2 + 6, open or folded.
    await expect(total()).toBe("11");
    await userEvent.click(within(table).getByRole("button", { name: /^Expand / }));
    await expect(within(table).getByText("Main board")).toBeVisible();
    await expect(total()).toBe("11");
  },
};

/** The preview held by the table (`preview` on the hook), so the columns stay at module level: the eye opens it and the open row reads active; `rowHeader` makes the id name its row. Previous and next walk every row the search and filters leave, across pages (`displayedRows`), and `showRow` turns the table to the row's page. */
function TablePreview() {
  const [open, setOpen] = useState<Finding | null>(null);
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (r) => r.id,
    label: "Findings with a preview",
    pageSize: 8,
    rowHeader: "id",
    preview: { onPreview: setOpen, activeId: open?.id },
  });
  const order = displayedRows(table);
  const at = open ? order.findIndex((row) => row.id === open.id) : -1;
  const step = (by: number) => {
    const next = order[at + by];
    if (!next) return;
    setOpen(next.original);
    showRow(table, next.id);
  };
  return (
    <Stack space="space.150">
      <DataTable table={table} />
      {open ? (
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Text size="small">
            Previewing {open.id}, {at + 1} of {order.length}
          </Text>
          <Button size="small" onClick={() => step(-1)} disabled={at <= 0}>
            Previous record
          </Button>
          <Button size="small" onClick={() => step(1)} disabled={at >= order.length - 1}>
            Next record
          </Button>
        </Inline>
      ) : null}
    </Stack>
  );
}

export const PreviewHeldByTheTable: Story = {
  name: "Preview held by the table",
  render: () => <TablePreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = within(canvas.getByRole("table", { name: "Findings with a preview" }));
    // Each eye names its record, and the id names its row for a screen reader.
    const eyes = table.getAllByRole("button", { name: /^Preview FND-/ });
    await expect(eyes).toHaveLength(8);
    await expect(table.getAllByRole("rowheader")).toHaveLength(8);
    await userEvent.click(eyes[7]!);
    await expect(canvas.getByText("Previewing FND-2207, 8 of 24")).toBeVisible();
    await expect(eyes[7]).toHaveAttribute("aria-pressed", "true");
    // Next crosses the page: the table turns to the row it steps onto.
    await userEvent.click(canvas.getByRole("button", { name: "Next record" }));
    await expect(canvas.getByText("Previewing FND-2208, 9 of 24")).toBeVisible();
    await waitFor(() => expect(table.getByText("FND-2208")).toBeVisible());
    await expect(table.queryByText("FND-2200")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Previous record" }));
    await waitFor(() => expect(table.getByText("FND-2207")).toBeVisible());
  },
};

type ProgramElement = {
  id: string;
  name: string;
  kind: "System" | "Component";
  path: string;
  library: boolean;
  owner: string;
};

const elementRows: ProgramElement[] = [
  {
    id: "EL-01",
    name: "Ground segment",
    kind: "System",
    path: "Program Atlas",
    library: false,
    owner: "Dana Whitfield",
  },
  {
    id: "EL-02",
    name: "Telemetry, tracking and command processor",
    kind: "Component",
    path: "Ground segment · Operations network",
    library: true,
    owner: "Grace Hoppel",
  },
  {
    id: "EL-03",
    name: "Operator console",
    kind: "Component",
    path: "",
    library: false,
    owner: "Marcus Ryde",
  },
];

/** The name is a `c.text` with an icon, a badge and a second line, and the table holds the preview, so the columns stay at module level. */
const elementColumns = defineColumns<ProgramElement>((c) => [
  c.text("name", {
    header: "Element",
    priority: 0,
    minWidth: 220,
    hideable: false,
    icon: (r) => (
      <Icon label={r.kind} size="medium" color="color.icon.subtle">
        {r.kind === "System" ? <Network /> : <Package />}
      </Icon>
    ),
    badge: (r) =>
      r.library ? (
        <Badge size="xsmall" variant="secondary" tone="information">
          Library
        </Badge>
      ) : null,
    description: (r) => r.path || null,
    cell: (r) => <TextLink href={`#/elements/${r.id}`}>{r.name}</TextLink>,
  }),
  c.id("id", { header: "Code", width: 100, priority: 1 }),
  c.person("owner", { header: "Owner", width: 180, priority: 2 }),
]);

function RichNames() {
  const [open, setOpen] = useState<ProgramElement | null>(null);
  const table = useDataTable({
    columns: elementColumns,
    data: elementRows,
    getRowId: (r) => r.id,
    label: "Elements",
    preview: { onPreview: setOpen, activeId: open?.id ?? null },
  });
  return (
    <Stack space="space.150">
      <DataTable table={table} responsive />
      <Text size="small" color="color.text.subtle">
        {open ? `Previewing ${open.name}` : "Nothing previewed"}
      </Text>
    </Stack>
  );
}

/** `icon`, `badge` and `description` on the name's `c.text` draw it as Table.Name around its link: the kind, a Library mark and the path, never an Inline built in `cell`. With the table's `preview`, the name carries the eye, so the name is not declared as an id to get one, and a preview step leaves the columns as they are. */
export const RichNamesStory: Story = {
  name: "Names with an icon, a badge and a second line",
  render: () => <RichNames />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = within(canvas.getByRole("table", { name: "Elements" }));
    const header = table.getByRole("rowheader", { name: /Telemetry/ });
    // The kind, the name's link, the badge and the second line are the row header's.
    await expect(within(header).getByRole("img", { name: "Component" })).toBeVisible();
    await expect(
      within(header).getByRole("link", { name: "Telemetry, tracking and command processor" }),
    ).toBeVisible();
    await expect(within(header).getByText("Library")).toBeVisible();
    await expect(within(header).getByText("Ground segment · Operations network")).toBeVisible();
    // The row is named by the name's value, not the icon or the badge.
    const eye = table.getByRole("button", {
      name: "Preview Telemetry, tracking and command processor",
    });
    await userEvent.click(eye);
    await expect(
      canvas.getByText("Previewing Telemetry, tracking and command processor"),
    ).toBeVisible();
    await expect(eye).toHaveAttribute("aria-pressed", "true");
    // A row with no path draws no second line.
    const plain = table.getByRole("rowheader", { name: /Operator console/ });
    await expect(plain.querySelector('[data-slot="table-name-description"]')).toBeNull();
  },
};

const openingColumns = defineColumns<Finding>((c) => [
  c.id("id"),
  c.text("name", {
    header: "Finding",
    minWidth: 220,
    cell: (r) => <TextLink href={`#/findings/${r.id}`}>{r.name}</TextLink>,
  }),
  c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
]);

/** A row opens as its name's link does: a plain click opens the record, Cmd, Ctrl or Shift or the middle button opens the name's link in a new tab, and a click that ends a text selection does nothing. A focused tree row opens on Enter. */
function OpeningRows() {
  const [opened, setOpened] = useState("nothing");
  const table = useDataTable({
    columns: openingColumns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    label: "Findings that open",
  });
  const tree = useDataTable({
    columns: partColumns,
    data: system,
    getRowId: (r) => r.id,
    label: "Parts that open",
    tree: { children: (r) => r.parts, label: (r) => r.name },
  });
  return (
    <Stack space="space.200">
      <DataTable responsive={false} table={table} onRowClick={(r) => setOpened(r.id)} />
      <DataTable responsive={false} table={tree} onRowClick={(r) => setOpened(r.name)} />
      <Text size="small" color="color.text.subtle">
        Opened: {opened}
      </Text>
    </Stack>
  );
}

export const RowsOpenLikeLinks: Story = {
  name: "Rows open like links",
  render: () => <OpeningRows />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = within(canvas.getByRole("table", { name: "Findings that open" }));
    const idCell = table.getByText("FND-2200");
    const opens: string[] = [];
    const original = window.open;
    window.open = ((url?: string | URL) => {
      opens.push(String(url));
      return null;
    }) as typeof window.open;
    try {
      // A modifier click, or the middle button, opens the name's link in a new tab, not the
      // record in place.
      fireEvent.click(idCell, { ctrlKey: true });
      await expect(opens).toHaveLength(1);
      await expect(opens[0]).toContain("#/findings/FND-2200");
      fireEvent(idCell, new MouseEvent("auxclick", { bubbles: true, button: 1 }));
      await expect(opens).toHaveLength(2);
      await expect(canvas.getByText("Opened: nothing")).toBeVisible();
      // A click that ends a text selection copies; it does not open.
      const selection = window.getSelection();
      selection?.selectAllChildren(idCell);
      fireEvent.click(idCell);
      await expect(canvas.getByText("Opened: nothing")).toBeVisible();
      selection?.removeAllRanges();
      await userEvent.click(idCell);
      await expect(canvas.getByText("Opened: FND-2200")).toBeVisible();
    } finally {
      window.open = original;
    }
    // Enter on a focused tree row opens it, as its click does.
    const tree = canvas.getByRole("treegrid", { name: "Parts that open" });
    const row = tree.querySelector<HTMLElement>('tr[tabindex="0"]')!;
    row.focus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Opened: Flight computer")).toBeVisible();
  },
};

const versionedView = "data-table-example-versioned";
const versionedColumns = defineColumns<Finding>((c) => [
  c.id("id"),
  c.text("name", { header: "Finding" }),
  c.status("status", { header: "Status", width: 120, tone: (r) => statusTone[r.status] }),
  c.person("owner", { header: "Owner" }),
]);

/** A stored layout carries the author's version: raising `view.version` retires every older layout, and a column added since the layout was stored takes the author's defaults (here Owner, hidden). */
function VersionedTable({ version }: { version: number }) {
  const table = useDataTable({
    columns: versionedColumns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    label: "Findings, versioned",
    view: { id: versionedView, version },
    initialState: { columnVisibility: { owner: false } },
  });
  return <DataTable responsive={false} table={table} />;
}

function VersionedViews() {
  // The reader's layout under version 1, stored before Owner joined the table: Status hidden.
  useState(() => {
    writeView(
      versionedView,
      {
        known: ["id", "name", "status"],
        order: [],
        sizing: {},
        visibility: { status: false },
        pinning: { start: [], end: [] },
      },
      1,
    );
    return true;
  });
  const [version, setVersion] = useState(1);
  return (
    <Stack space="space.150">
      <Inline space="space.100" shouldWrap>
        <Button size="small" isSelected={version === 1} onClick={() => setVersion(1)}>
          Version 1
        </Button>
        <Button size="small" isSelected={version === 2} onClick={() => setVersion(2)}>
          Version 2
        </Button>
      </Inline>
      <VersionedTable version={version} />
    </Stack>
  );
}

export const VersionedViewsStory: Story = {
  name: "Versioned views",
  render: () => <VersionedViews />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Findings, versioned" });
    const headings = () =>
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent?.trim() ?? "");
    // Version 1: the reader's layout holds, and the new Owner column keeps the author's hidden.
    await waitFor(() => expect(headings()).not.toContain("Status"));
    await expect(headings()).not.toContain("Owner");
    await expect(headings()).toContain("Finding");
    // Version 2: every older layout is discarded; the author's layout draws.
    await userEvent.click(canvas.getByRole("button", { name: "Version 2" }));
    await waitFor(() => expect(headings()).toContain("Status"));
    await expect(headings()).not.toContain("Owner");
    await expect(readView(versionedView, 2)).not.toBeNull();
  },
};

/** While rows are chosen the SelectionBar takes the toolbar's place, so the rows stay where they were. It says the count as it changes and how many of the chosen rows the search or filters hide, since its verbs act on all of them; Clear hands focus to the select-all. */
function SelectionInTheToolbar() {
  const table = useDataTable({
    columns,
    data: findings,
    getRowId: (r) => r.id,
    selectable: true,
    pageSize: 8,
    label: "Findings to act on",
  });
  const chosen = Object.values(table.state.rowSelection).some(Boolean);
  return (
    <Stack space="space.150">
      <Inline space="space.100" shouldWrap>
        <Button size="small" onClick={() => table.setGlobalFilter("Backup")}>
          Show only backups
        </Button>
      </Inline>
      <DataTable
        table={table}
        toolbar={
          chosen ? (
            <DataTable.SelectionBar
              table={table}
              actions={<Button size="small">Reassign</Button>}
            />
          ) : (
            <Toolbar
              search={table.state.globalFilter}
              onSearch={table.setGlobalFilter}
              placeholder="Search findings to act on"
            />
          )
        }
      />
    </Stack>
  );
}

export const SelectionInTheToolbarStory: Story = {
  name: "Selection in the toolbar",
  render: () => <SelectionInTheToolbar />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = within(canvas.getByRole("table", { name: "Findings to act on" }));
    const second = table.getByRole("checkbox", { name: "Select FND-2201" });
    const before = second.getBoundingClientRect().top;
    await userEvent.click(table.getByRole("checkbox", { name: "Select FND-2200" }));
    const bar = await canvas.findByRole("region", { name: "Selection" });
    // The bar replaced the toolbar: the rows barely move under the pointer.
    await expect(Math.abs(second.getBoundingClientRect().top - before)).toBeLessThan(20);
    // Its appearance is said: the first count, and the verbs it brings.
    await expect(within(bar).getByText("1 selected")).toBeVisible();
    await waitFor(() =>
      expect(politeLines(canvasElement)).toContain("1 selected. Actions: Reassign and Clear."),
    );
    await userEvent.click(second);
    await expect(within(bar).getByText("2 selected")).toBeVisible();
    await waitFor(() => expect(politeLines(canvasElement)).toContain("2 selected"));
    // The chosen rows leave the view, and the bar says so.
    await userEvent.click(canvas.getByRole("button", { name: "Show only backups" }));
    await expect(
      within(bar).getByText("2 selected, 2 hidden by the search or filters"),
    ).toBeVisible();
    await userEvent.click(within(bar).getByRole("button", { name: "Clear" }));
    await waitFor(() =>
      expect(table.getByRole("checkbox", { name: "Select all rows on this page" })).toHaveFocus(),
    );
  },
};

/** A register with chosen rows inside a Shell.Panel. */
function SelectionInAPanel() {
  const [open, setOpen] = useState(false);
  const table = useDataTable({
    columns: panelColumns,
    data: findings.slice(0, 4),
    getRowId: (r) => r.id,
    selectable: true,
    label: "Findings in the preview",
  });
  const chosen = Object.values(table.state.rowSelection).some(Boolean);
  return (
    <Shell>
      <Shell.Main>
        <Stack space="space.200">
          <PageHeader>
            <PageHeader.Heading>
              <PageHeader.Title>Assessments</PageHeader.Title>
            </PageHeader.Heading>
          </PageHeader>
          <Inline space="space.100">
            <Button onClick={() => setOpen(true)}>Preview the findings</Button>
          </Inline>
        </Stack>
      </Shell.Main>
      {open && (
        <Shell.Panel title="Findings preview" defaultWidth={560} onClose={() => setOpen(false)}>
          <DataTable
            responsive
            table={table}
            toolbar={
              chosen ? (
                <DataTable.SelectionBar
                  table={table}
                  actions={<Button size="small">Reassign</Button>}
                />
              ) : (
                <Toolbar
                  search={table.state.globalFilter}
                  onSearch={table.setGlobalFilter}
                  placeholder="Search the preview's findings"
                />
              )
            }
          />
        </Shell.Panel>
      )}
    </Shell>
  );
}

/** Escape in the SelectionBar clears the chosen rows and goes no further, so the panel around the table stays open and the reader keeps their place; Escape from outside the bar is the panel's again. */
export const SelectionInAPanelStory: Story = {
  name: "Selection in a panel",
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <SelectionInAPanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole("button", { name: "Preview the findings" });
    await userEvent.click(opener);
    const panel = await canvas.findByRole("complementary", { name: "Findings preview" });
    const table = within(panel).getByRole("table", { name: "Findings in the preview" });
    const [all, first] = within(table).getAllByRole("checkbox");
    await userEvent.click(first!);
    const bar = await within(panel).findByRole("region", { name: "Selection" });
    within(bar).getByRole("button", { name: "Clear" }).focus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(all).toHaveFocus());
    await expect(first).not.toBeChecked();
    await expect(
      canvas.getByRole("complementary", { name: "Findings preview" }),
    ).toBeInTheDocument();
    // The bar is gone and focus is on the select-all: the next Escape closes the panel.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("complementary")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

type Stamped = { id: string; name: string; at: string };
const stamped: Stamped[] = [
  { id: "E-1", name: "Evening of the 24th in Los Angeles", at: "2026-09-25T02:00:00+00:00" },
  { id: "E-2", name: "Noon on the 24th", at: "2026-09-24T19:00:00Z" },
  { id: "E-3", name: "The 23rd", at: "2026-09-23T12:00:00Z" },
  { id: "E-4", name: "A calendar day", at: "2026-09-24" },
];
const stampedColumns = defineColumns<Stamped>((c) => [
  c.id("id"),
  c.text("name", { header: "Event", minWidth: 220 }),
  c.date("at", { header: "At", format: "medium", width: 200 }),
]);

function ZonedDaysTable() {
  const table = useDataTable({
    columns: stampedColumns,
    data: stamped,
    getRowId: (r) => r.id,
    label: "Events on 24 September",
    initialState: { columnFilters: [{ id: "at", value: ["2026-09-24", "2026-09-24"] }] },
  });
  return <DataTable table={table} />;
}

/** A date range filter reads each instant on the day it falls on in the reader's time zone, both ends inclusive: in Los Angeles, 02:00 UTC on the 25th is the evening of the 24th. */
export const DaysInTheReadersZone: Story = {
  name: "Days in the reader's zone",
  render: () => (
    <LedgerProvider timeZone="America/Los_Angeles">
      <ZonedDaysTable />
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const table = within(
      within(canvasElement).getByRole("table", { name: "Events on 24 September" }),
    );
    await expect(table.getByText("E-1")).toBeVisible();
    await expect(table.getByText("E-2")).toBeVisible();
    await expect(table.getByText("E-4")).toBeVisible();
    await expect(table.queryByText("E-3")).toBeNull();
  },
};

/** A virtual window draws a few of three hundred rows; the table says there are three hundred and each drawn row says its place. */
function VirtualWindow() {
  const rows = useMemo(() => makeFindings(300), []);
  const table = useDataTable({
    columns,
    data: rows,
    getRowId: (r) => r.id,
    label: "Findings, a window",
    virtualize: true,
  });
  return <DataTable table={table} maxHeight={320} />;
}

export const AVirtualWindow: Story = {
  name: "A virtual window",
  render: () => <VirtualWindow />,
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole("table", { name: "Findings, a window" });
    await expect(table).toHaveAttribute("aria-rowcount", "301");
    await waitFor(() =>
      expect(table.querySelector("tbody tr[data-row-id]")).toHaveAttribute("aria-rowindex", "2"),
    );
    await expect(table.querySelectorAll("tbody tr[data-row-id]").length).toBeLessThan(300);
  },
};

/** The register's root takes the native attributes and the ref of a `div`, a test id, an id, a class, and keeps its own `data-slot`, `data-table`, whatever the caller passes. */
function RootAttributes() {
  const root = useRef<HTMLDivElement>(null);
  const [reached, setReached] = useState("");
  const table = useDataTable({
    columns,
    data: findings.slice(0, 3),
    getRowId: (r) => r.id,
    label: "Findings with a test id",
  });
  useEffect(() => setReached(root.current?.dataset["slot"] ?? "none"), []);
  return (
    <Stack space="space.100">
      <DataTable
        ref={root}
        table={table}
        id="findings-register"
        data-testid="findings-register"
        data-slot="caller-slot"
        className="pt-100"
      />
      <Text size="small" color="color.text.subtle">
        Ref reached: <output aria-label="Ref reached">{reached}</output>
      </Text>
    </Stack>
  );
}

export const RootAttributesStory: Story = {
  name: "Root attributes",
  tags: ["!manifest"],
  render: () => <RootAttributes />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas.getByTestId("findings-register");
    await expect(root).toHaveAttribute("data-slot", "data-table");
    await expect(root).toHaveAttribute("id", "findings-register");
    await expect(root).toHaveClass("pt-100");
    await expect(root).toContainElement(
      canvas.getByRole("table", { name: "Findings with a test id" }),
    );
    await expect(canvas.getByLabelText("Ref reached")).toHaveTextContent("data-table");
  },
};
