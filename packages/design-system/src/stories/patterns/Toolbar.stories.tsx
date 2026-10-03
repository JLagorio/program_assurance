import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { Download, MoreHorizontal, Plus } from "lucide-react";
import { createRef, useState } from "react";
import { DataTable, LedgerProvider, Toolbar, defineColumns, useDataTable } from "../..";
import {
  Badge,
  Button,
  Count,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  FilterChip,
  IconButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  ToggleGroup,
  ToggleGroupItem,
  type Tone,
} from "../../components";
import { Stack, Text } from "../../primitives";
import * as direction from "../_lib/direction";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;
const { along, arrows } = direction;

const meta = {
  title: "Patterns/Toolbar",
  component: Toolbar,
  parameters: { layout: "padded" },
  args: { onSearch: fn(), placeholder: "Search controls" },
} satisfies Meta<typeof Toolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Search only; search and filters; filters and actions; no search, the children carry the row; a Select that narrows. */
export const ToolbarMatrix: Story = {
  render: () => {
    const undefinedItems = [
      { value: "ssp", label: "System security plan" },
      { value: "sap", label: "Assessment plan" },
      { value: "poam", label: "Plan of action" },
    ];
    return (
      <Stack space="space.200" className="max-w-layout-measure">
        <Toolbar search="" onSearch={() => {}} placeholder="Search controls" />
        <Toolbar
          search="AC-2"
          onSearch={() => {}}
          placeholder="Search controls"
          filters={
            <>
              <FilterChip label="Baseline" value="Rev. 5" isActive />
              <FilterChip label="Impact" />
            </>
          }
        ></Toolbar>
        <Toolbar
          search=""
          onSearch={() => {}}
          placeholder="Search controls"
          actions={
            <>
              <Button size="small" iconBefore={<Download />}>
                Export
              </Button>
              <Button size="small" variant="primary" iconBefore={<Plus />}>
                New control
              </Button>
            </>
          }
          filters={
            <>
              <FilterChip label="Owner" />
              <FilterChip label="Status" />
            </>
          }
        ></Toolbar>
        <Toolbar
          actions={
            <Text size="small" color="color.text.subtle">
              12 of 340 controls
            </Text>
          }
          filters={
            <>
              <ToggleGroup aria-label="Lens" defaultValue={["gaps"]}>
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="gaps">
                  Gaps <Count value={12} />
                </ToggleGroupItem>
                <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
              </ToggleGroup>
            </>
          }
        ></Toolbar>
        <Toolbar
          search=""
          onSearch={() => {}}
          placeholder="Search parts, suppliers"
          actions={
            <Button size="small" variant="subtle">
              Reset
            </Button>
          }
          filters={
            <>
              <div style={{ width: 220 }}>
                <Select<string> items={undefinedItems} defaultValue="ssp">
                  <SelectTrigger className="w-full" size="small" aria-label="Model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {undefinedItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          }
        ></Toolbar>
      </Stack>
    );
  },
};

const controls = [
  { id: "AC-2", title: "Account management", gap: true },
  { id: "AC-3", title: "Access enforcement", gap: false },
  { id: "AU-2", title: "Event logging", gap: true },
  { id: "CM-6", title: "Configuration settings", gap: false },
  { id: "IA-2", title: "Identification and authentication", gap: false },
  { id: "SC-7", title: "Boundary protection", gap: true },
];

function LiveDemo() {
  const [query, setQuery] = useState("");
  const [gaps, setGaps] = useState(false);
  const q = query.trim().toLowerCase();
  const rows = controls.filter(
    (c) =>
      (!gaps || c.gap) &&
      (!q || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)),
  );
  return (
    <div style={{ maxWidth: 560 }}>
      <Stack space="space.200">
        <Toolbar
          search={query}
          onSearch={setQuery}
          placeholder="Control or title"
          actions={
            // Over a plain Table the caller says the result: the count is a polite status.
            <span role="status">
              <Text size="small" color="color.text.subtle">
                {rows.length} of {controls.length} controls
              </Text>
            </span>
          }
          filters={
            <>
              <FilterChip label="Gaps" isActive={gaps} onClick={() => setGaps((v) => !v)} />
            </>
          }
        ></Toolbar>
        <Table label="Controls">
          <thead>
            <tr>
              <Table.Header width={90}>Control</Table.Header>
              <Table.Header>Title</Table.Header>
              <Table.Header width={120}>Status</Table.Header>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <Table.Row key={c.id}>
                <Table.Id id={c.id} />
                <Table.Cell>{c.title}</Table.Cell>
                <Table.Cell>
                  {c.gap ? (
                    <Badge variant="secondary" tone="danger">
                      Gap
                    </Badge>
                  ) : (
                    <Badge variant="secondary" tone="success">
                      Satisfied
                    </Badge>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      </Stack>
    </div>
  );
}

/** Typing narrows the table under it, the chip narrows it again, and the count at the end says how many remain: over a plain Table it is the caller's polite status, so the result is heard as well as seen. */
export const Live: Story = {
  render: () => <LiveDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("searchbox", { name: "Control or title" }), "AC");
    await expect(canvas.getByRole("status")).toHaveTextContent("2 of 6 controls");
    await userEvent.click(canvas.getByRole("button", { name: /Gaps/ }));
    await expect(canvas.getByRole("status")).toHaveTextContent("1 of 6 controls");
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Toolbar
            search=""
            onSearch={() => {}}
            placeholder="Search controls"
            actions={
              <Button size="small" variant="primary" iconBefore={<Plus />}>
                New control
              </Button>
            }
            filters={
              <>
                <FilterChip label="Owner" />
              </>
            }
          ></Toolbar>
        }
        doText="Every control in the row is the small size, so the row is one height."
        dont={
          <Toolbar
            search=""
            onSearch={() => {}}
            placeholder="Search controls"
            actions={
              <Button variant="primary" iconBefore={<Plus />}>
                New control
              </Button>
            }
            filters={
              <>
                <FilterChip label="Owner" />
              </>
            }
          ></Toolbar>
        }
        dontText="A default-size Button among small controls. The row grows to it and nothing else lines up."
      />
      <Pair
        do={
          <Toolbar
            actions={
              <>
                <Button size="small">Export</Button>
                <Button size="small" variant="primary">
                  New control
                </Button>
              </>
            }
            filters={
              <>
                <FilterChip label="Owner" />
              </>
            }
          ></Toolbar>
        }
        doText="Two actions at the end, the primary last. Past five, the rest go under a More menu."
        dont={
          <Toolbar
            actions={
              <>
                {["Export", "Import", "Print", "Archive", "Share", "Duplicate"].map((a) => (
                  <Button key={a} size="small">
                    {a}
                  </Button>
                ))}
                <Button size="small" variant="primary">
                  New control
                </Button>
              </>
            }
            filters={
              <>
                <FilterChip label="Owner" />
              </>
            }
          ></Toolbar>
        }
        dontText="Seven actions. The toolbar becomes a second navigation and the primary is lost among them."
      />
      <Pair
        do={
          <Toolbar
            search=""
            onSearch={() => {}}
            placeholder="Search controls"
            actions={
              <Button size="small" variant="primary">
                New control
              </Button>
            }
          />
        }
        doText="Search at the start, the action at the end: narrow first, act last."
        dont={
          <Toolbar
            search=""
            onSearch={() => {}}
            placeholder="Search controls"
            filters={
              <>
                <Button size="small" variant="primary">
                  New control
                </Button>
              </>
            }
          ></Toolbar>
        }
        dontText="The primary as a child. It sits beside the search where a filter goes, and the end of the row is empty."
      />
    </Stack>
  ),
};

/** The search is the toolbar's own here (`onSearch` without `search`), so typing shows in the field and Escape empties it. A caller that owns the query passes `search` as well. */
export const Playground: Story = {
  render: (args) => (
    <Toolbar
      {...args}
      filters={
        <>
          <FilterChip label="Owner" />
          <FilterChip label="Status" />
        </>
      }
    ></Toolbar>
  ),
  play: async ({ args, canvasElement }) => {
    const search = within(canvasElement).getByRole("searchbox", { name: "Search controls" });
    await userEvent.type(search, "AC");
    await expect(search).toHaveValue("AC");
    await expect(args.onSearch).toHaveBeenLastCalledWith("AC");
    await userEvent.keyboard("{Escape}");
    await expect(search).toHaveValue("");
  },
};

/** The toolbar in a story's canvas. */
const toolbarOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="toolbar"]')!;
/** The saved-views control in the toolbar's views strip, whatever the views part names it. */
const viewsTrigger = (toolbar: HTMLElement) =>
  within(toolbar.querySelector<HTMLElement>('[data-slot="toolbar-views"]')!).getByRole("button");
const middle = (element: Element) => {
  const box = element.getBoundingClientRect();
  return box.top + box.height / 2;
};
/** Two controls sit on one line when their centres align. */
const sameRow = (a: Element, b: Element) => Math.abs(middle(a) - middle(b)) < 4;
/** How many lines the toolbar's visible items occupy. */
const rowCount = (toolbar: HTMLElement) => {
  const centres = Array.from(toolbar.children)
    .filter((child) => child.getClientRects().length)
    .map(middle)
    .sort((a, b) => a - b);
  return centres.filter((centre, i) => i === 0 || centre - centres[i - 1]! >= 4).length;
};
/** `b` comes after `a` in the document, so Tab reaches it later. */
const follows = (a: Element, b: Element) =>
  !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const noSidewaysScroll = () =>
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
    document.documentElement.clientWidth,
  );
/** More's popover while it is open (a closing one keeps its role for its exit animation). */
const openMore = (canvasElement: HTMLElement) =>
  canvasElement.ownerDocument.querySelector('[data-slot="popover-content"][data-open]');
/** The saved views show whole: their strip does not scroll, and nothing in it is cut off. */
const viewsWhole = async (toolbar: HTMLElement) => {
  const strip = toolbar.querySelector<HTMLElement>(
    '[data-slot="toolbar-views"] [data-slot="scroller-viewport"]',
  )!;
  await expect(strip.scrollWidth).toBeLessThanOrEqual(strip.clientWidth);
  const edge = strip.getBoundingClientRect().right + 1;
  for (const control of Array.from(strip.children))
    await expect(control.getBoundingClientRect().right).toBeLessThanOrEqual(edge);
};
/** The primary keeps its whole label inside the toolbar. */
const primaryWhole = async (toolbar: HTMLElement, primary: HTMLElement) => {
  await expect(primary).toBeVisible();
  await expect(primary.scrollWidth).toBeLessThanOrEqual(primary.clientWidth);
  await expect(along(primary).end).toBeLessThanOrEqual(along(toolbar).end + 1);
};
/** Two controls do not overlap: one sits wholly beside or wholly below the other. */
const apart = async (a: Element, b: Element) => {
  const x = a.getBoundingClientRect();
  const y = b.getBoundingClientRect();
  const beside = x.right <= y.left + 0.5 || y.right <= x.left + 0.5;
  const stacked = x.bottom <= y.top + 0.5 || y.bottom <= x.top + 0.5;
  await expect(beside || stacked).toBe(true);
};
/** Two frames: long enough for a resize to fold and for a menu to act on a choice. */
const frames = () =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
/** This story widens its own container, so it runs on the desktop canvas in every project. */
const desktopCanvas = {
  viewport: { value: "ledgerDesktop", isRotated: false },
  frame: "canvas",
};

/** As its container shrinks, the filters fold into More, then the display controls in `children` (Columns and Settings) follow under a divider, and the row wraps into two in the same order: the search with the saved views, then More with the action. The saved views and the action stay in the row. Filters keep their state through the fold, More counts the folded filter that applies (`activeFilters`), and the row takes everything back when the container widens. */
export const Constrained: Story = {
  globals: desktopCanvas,
  render: () => {
    const [narrow, setNarrow] = useState(false);
    const [query, setQuery] = useState("");
    const [gaps, setGaps] = useState(false);
    return (
      <Stack space="space.200">
        <Button onClick={() => setNarrow((value) => !value)}>
          {narrow ? "Widen container" : "Narrow container"}
        </Button>
        <div
          data-testid="toolbar-container"
          style={{ width: narrow ? 390 : 900, maxWidth: "100%" }}
        >
          <Toolbar
            search={query}
            onSearch={setQuery}
            placeholder="Find controls"
            views={<Button size="small">Saved views</Button>}
            activeFilters={Number(gaps)}
            actions={
              <Button size="small" variant="primary" iconBefore={<Plus />}>
                New control
              </Button>
            }
            filters={
              <>
                <FilterChip
                  label="Gaps"
                  isActive={gaps}
                  onClick={() => setGaps((value) => !value)}
                />
                <FilterChip label="Owner" />
                <FilterChip label="Status" />
              </>
            }
          >
            <Button size="small">Columns</Button>
            <Button size="small">Settings</Button>
          </Toolbar>
        </div>
        <p>{gaps ? "Showing gaps" : "Showing all controls"}</p>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    const toolbar = toolbarOf(canvasElement);
    await userEvent.type(canvas.getByRole("searchbox", { name: "Find controls" }), "AC-2");
    await userEvent.click(canvas.getByRole("button", { name: "Narrow container" }));
    const more = await canvas.findByRole("button", { name: "More filters and display options" });
    for (const name of ["Saved views", "New control"]) {
      const action = canvas.getByRole("button", { name });
      await expect(action).toBeVisible();
      const container = canvas.getByTestId("toolbar-container").getBoundingClientRect();
      const bounds = action.getBoundingClientRect();
      await expect(bounds.left).toBeGreaterThanOrEqual(container.left);
      await expect(bounds.right).toBeLessThanOrEqual(container.right + 1);
    }
    // The display controls are in More, not in the row.
    for (const name of ["Columns", "Settings"])
      await expect(within(toolbar).queryByRole("button", { name })).toBeNull();
    // Two rows in the one-row order: the search with the saved views, More with the action.
    const search = canvas.getByRole("searchbox", { name: "Find controls" });
    const savedViews = canvas.getByRole("button", { name: "Saved views" });
    const create = canvas.getByRole("button", { name: "New control" });
    await expect(sameRow(search, savedViews)).toBe(true);
    await expect(sameRow(more, create)).toBe(true);
    await apart(more, create);
    await expect(follows(savedViews, more) && follows(more, create)).toBe(true);
    await expect(rowCount(toolbar)).toBe(2);
    await userEvent.click(more);
    const popup = await screen.findByRole("dialog", { name: "Filters and display" });
    await waitFor(() => expect(within(popup).getByRole("button", { name: /Gaps/ })).toBeVisible());
    // Columns and Settings follow the filters, in the group named Display.
    const display = within(within(popup).getByRole("group", { name: "Display" }));
    for (const name of ["Columns", "Settings"])
      await expect(display.getByRole("button", { name })).toBeVisible();
    await userEvent.click(within(popup).getByRole("button", { name: /Gaps/ }));
    await expect(canvas.getByText("Showing gaps")).toBeVisible();
    // The folded filter that now applies shows on More, in its count and its name.
    await expect(more).toHaveAccessibleName("More filters and display options, 1 applied");
    await expect(more).toHaveTextContent(/^More\s*1$/);
    for (const name of ["Saved views", "New control"]) {
      await expect(within(popup).queryByRole("button", { name })).not.toBeInTheDocument();
    }
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(more).toHaveFocus());
    await userEvent.click(canvas.getByRole("button", { name: "Widen container" }));
    await waitFor(() =>
      expect(canvas.queryByRole("button", { name: /^More/ })).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(rowCount(toolbar)).toBe(1));
    for (const name of ["Columns", "Settings"])
      await expect(within(toolbar).getByRole("button", { name })).toBeVisible();
    await expect(canvas.getByRole("searchbox", { name: "Find controls" })).toHaveValue("AC-2");
    await expect(canvas.getByText("Showing gaps")).toBeVisible();
  },
};

type RegisterRow = { id: string; name: string; status: string; owner: string };
const registerTone: Record<string, Tone> = {
  Active: "success",
  Onboarding: "information",
  Retired: "neutral",
  Open: "danger",
  "In progress": "information",
  Closed: "neutral",
};
const suppliers: RegisterRow[] = [
  { id: "ORG-101", name: "Northwind Avionics", status: "Active", owner: "Dana Whitfield" },
  { id: "ORG-102", name: "Keel & Rudder Systems", status: "Onboarding", owner: "Marcus Ryde" },
  { id: "ORG-103", name: "Brightline Telemetry", status: "Active", owner: "Priya Raghavan" },
  { id: "ORG-104", name: "Old Quay Castings", status: "Retired", owner: "Grace Hoppel" },
];
const issues: RegisterRow[] = [
  {
    id: "ISS-201",
    name: "Badge reader offline at gate 3",
    status: "Open",
    owner: "Dana Whitfield",
  },
  {
    id: "ISS-202",
    name: "Backup job skipped two nights",
    status: "In progress",
    owner: "Marcus Ryde",
  },
  {
    id: "ISS-203",
    name: "Test portal certificate expired",
    status: "Closed",
    owner: "Priya Raghavan",
  },
  { id: "ISS-204", name: "Shared admin account in use", status: "Open", owner: "Grace Hoppel" },
];
const registerColumns = (header: string) =>
  defineColumns<RegisterRow>((c) => [
    c.id("id"),
    c.text("name", { header, minWidth: 180 }),
    c.status("status", { header: "Status", tone: (r) => registerTone[r.status] ?? "neutral" }),
    c.person("owner", { header: "Owner" }),
  ]);
const registers = {
  suppliers: {
    rows: suppliers,
    columns: registerColumns("Organization"),
    label: "Suppliers",
    placeholder: "Search suppliers",
    preset: { id: "active", label: "Active", filters: [{ id: "status", value: "Active" }] },
    create: "Create organization",
  },
  issues: {
    rows: issues,
    columns: registerColumns("Operational issue"),
    label: "Operational issues",
    placeholder: "Search operational issues",
    preset: { id: "open", label: "Open", filters: [{ id: "status", value: "Open" }] },
    create: "Create operational issue",
  },
};

/** A register's toolbar as a product composes it: search, a saved-views menu, one filter, Columns, Settings and a Collection actions overflow (an Export submenu, and a command that opens a dialog) as display controls, and one primary. */
function Register({ kind }: { kind: keyof typeof registers }) {
  const register = registers[kind];
  const table = useDataTable({
    columns: register.columns,
    data: register.rows,
    getRowId: (r) => r.id,
    label: register.label,
  });
  const [done, setDone] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  return (
    <Stack space="space.100">
      <DataTable
        table={table}
        responsive
        toolbar={
          <Toolbar
            search={String(table.state.globalFilter ?? "")}
            onSearch={table.setGlobalFilter}
            placeholder={register.placeholder}
            views={
              <DataTable.Presets
                table={table}
                variant="menu"
                presets={[{ id: "all", label: "All records" }, register.preset]}
              />
            }
            filters={<DataTable.Filter table={table} column="status" />}
            actions={
              <Button size="small" variant="primary" iconBefore={<Plus />}>
                {register.create}
              </Button>
            }
          >
            <DataTable.Columns table={table} />
            <DataTable.Settings table={table} />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <IconButton
                    label="Collection actions"
                    icon={<MoreHorizontal />}
                    size="small"
                    variant="secondary"
                  />
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setDone("CSV export started")}>
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDone("JSON export started")}>
                      JSON
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => setDone("Link copied")}>
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setImporting(true)}>
                  Import records…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Toolbar>
        }
      />
      {done ? (
        <Text size="small" color="color.text.subtle">
          {done}
        </Text>
      ) : null}
      {/* The command's dialog belongs to the register, not the toolbar, so it outlives More. */}
      <Dialog open={importing} onOpenChange={setImporting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import records</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
            <Button variant="primary">Import records</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

/** On a small phone the register's toolbar wraps into two rows in its one-row order: the search with the saved views, then More with the primary at the end, its label whole. The filter, Columns, Settings and the Collection actions overflow fold into More, filters first and the display controls under a divider, and each opens its own menu from there. Escape closes one layer at a time: the inner menu, then More. */
export const Phone: Story = {
  name: "Phone",
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  render: () => <Register kind="suppliers" />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const toolbar = toolbarOf(canvasElement);
    await waitFor(() => expect(rowCount(toolbar)).toBe(2));
    noSidewaysScroll();
    const search = canvas.getByRole("searchbox", { name: "Search suppliers" });
    const savedViews = viewsTrigger(toolbar);
    const more = canvas.getByRole("button", { name: "More filters and display options" });
    const primary = canvas.getByRole("button", { name: "Create organization" });
    await expect(sameRow(search, savedViews)).toBe(true);
    await expect(sameRow(more, primary)).toBe(true);
    await expect(follows(search, savedViews) && follows(savedViews, more)).toBe(true);
    await expect(follows(more, primary)).toBe(true);
    await viewsWhole(toolbar);
    await primaryWhole(toolbar, primary);
    await apart(more, primary);
    await expect(canvas.queryByRole("button", { name: /^Columns/ })).toBeNull();

    // Columns opens its own menu from inside More and still changes the table.
    await userEvent.click(more);
    const popup = await body.findByRole("dialog", { name: "Filters and display" });
    const display = within(within(popup).getByRole("group", { name: "Display" }));
    await waitFor(() => expect(display.getByRole("button", { name: /^Columns/ })).toBeVisible());
    await userEvent.click(display.getByRole("button", { name: /^Columns/ }));
    const owner = await body.findByRole("menuitemcheckbox", { name: "Owner" });
    await expect(owner).toBeChecked();
    await userEvent.click(owner);
    await waitFor(() => expect(owner).not.toBeChecked());
    await expect(display.getByRole("button", { name: /^Columns\s*\d+\/\d+/ })).toBeInTheDocument();
    // Escape closes the inner menu first, back to Columns, then More, back to its trigger.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(display.getByRole("button", { name: /^Columns/ })).toHaveFocus());
    await expect(openMore(canvasElement)).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openMore(canvasElement)).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());

    // The same from Settings, by keyboard: Escape closes its menu and focus comes back to Settings
    // without its tooltip, so the next Escape closes More.
    await userEvent.keyboard("{Enter}");
    const again = await body.findByRole("dialog", { name: "Filters and display" });
    const settings = within(again).getByRole("button", { name: "Table settings" });
    await waitFor(() => expect(settings).toBeVisible());
    settings.focus();
    await userEvent.keyboard("{Enter}");
    await body.findByRole("menu");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(settings).toHaveFocus());
    await frames();
    await expect(openMore(canvasElement)).not.toBeNull();
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="tooltip-content"][data-open]'),
    ).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openMore(canvasElement)).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());

    // A submenu inside More opens without closing it; the command chosen there closes both.
    await userEvent.keyboard("{Enter}");
    const third = await body.findByRole("dialog", { name: "Filters and display" });
    const overflow = within(third).getByRole("button", { name: "Collection actions" });
    await waitFor(() => expect(overflow).toBeVisible());
    overflow.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(body.getByRole("menuitem", { name: "Export" })).toHaveFocus());
    // The submenu opens towards the line's end: ArrowRight, or ArrowLeft in right to left.
    await userEvent.keyboard(arrows(overflow).next);
    await waitFor(() => expect(body.getByRole("menuitem", { name: "CSV" })).toHaveFocus());
    await expect(openMore(canvasElement)).not.toBeNull();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(body.getByRole("menuitem", { name: "JSON" })).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("JSON export started")).toBeVisible();
    await waitFor(() => expect(openMore(canvasElement)).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());
  },
};

/** The longest primary in the product on the narrowest phone, 320px: the same two rows as any register, the search with the saved views and More with "Create operational issue". The saved views keep their label, count and chevron, the primary keeps its whole label, and Tab follows the screen. */
export const PhoneLongPrimary: Story = {
  name: "Phone, long primary",
  globals: { viewport: { value: "ledgerNarrow", isRotated: false } },
  render: () => <Register kind="issues" />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(320));
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const toolbar = toolbarOf(canvasElement);
    await waitFor(() => expect(rowCount(toolbar)).toBe(2));
    noSidewaysScroll();
    const search = canvas.getByRole("searchbox", { name: "Search operational issues" });
    const savedViews = viewsTrigger(toolbar);
    const more = canvas.getByRole("button", { name: "More filters and display options" });
    const primary = canvas.getByRole("button", { name: "Create operational issue" });
    await waitFor(() => expect(sameRow(search, savedViews)).toBe(true));
    await expect(sameRow(more, primary)).toBe(true);
    await viewsWhole(toolbar);
    await primaryWhole(toolbar, primary);
    await apart(more, primary);
    await expect(follows(search, savedViews) && follows(savedViews, more)).toBe(true);
    await expect(follows(more, primary)).toBe(true);

    // More still holds the filter and the display controls.
    await userEvent.click(more);
    const popup = await body.findByRole("dialog", { name: "Filters and display" });
    await waitFor(() =>
      expect(within(popup).getByRole("button", { name: /^Columns/ })).toBeVisible(),
    );
    await waitFor(() =>
      expect(within(popup).getByRole("button", { name: /Status/ })).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openMore(canvasElement)).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());
  },
};

/** The same register in a 320px frame on a wide canvas, as in a panel: the toolbar follows its container, not the window, and takes the same two rows as on a phone. Columns opens its menu from inside More; a command that opens a dialog closes More and leaves focus in the dialog, and focus comes back to More when the dialog closes. More holds what it took while it is open, and the row takes it back when More closes. */
export const Frame: Story = {
  name: "In a 320px frame",
  globals: desktopCanvas,
  render: () => (
    <div data-testid="frame" style={{ maxWidth: 320 }}>
      <Register kind="suppliers" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const toolbar = toolbarOf(canvasElement);
    const frame = canvas.getByTestId("frame");
    await waitFor(() => expect(rowCount(toolbar)).toBe(2));
    noSidewaysScroll();
    const more = canvas.getByRole("button", { name: "More filters and display options" });
    const primary = canvas.getByRole("button", { name: "Create organization" });
    await expect(
      sameRow(canvas.getByRole("searchbox", { name: "Search suppliers" }), viewsTrigger(toolbar)),
    ).toBe(true);
    await expect(sameRow(more, primary)).toBe(true);
    await viewsWhole(toolbar);
    await primaryWhole(toolbar, primary);
    await apart(more, primary);
    await expect(toolbar.getBoundingClientRect().right).toBeLessThanOrEqual(
      frame.getBoundingClientRect().right + 1,
    );
    await expect(within(toolbar).queryByRole("button", { name: /^Columns/ })).toBeNull();

    // Columns is inside More, and its menu opens from there; Escape closes the menu alone.
    await userEvent.click(more);
    let popup = await body.findByRole("dialog", { name: "Filters and display" });
    const columns = within(popup).getByRole("button", { name: /^Columns/ });
    await waitFor(() => expect(columns).toBeVisible());
    await userEvent.click(columns);
    await expect(await body.findByRole("menuitemcheckbox", { name: "Owner" })).toBeChecked();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(columns).toHaveFocus());
    await expect(openMore(canvasElement)).not.toBeNull();

    // By pointer: the Export submenu opens inside More without closing it, and the command chosen
    // there closes both.
    await userEvent.click(within(popup).getByRole("button", { name: "Collection actions" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Export" }));
    const csv = await body.findByRole("menuitem", { name: "CSV" });
    await frames();
    await expect(openMore(canvasElement)).not.toBeNull();
    await userEvent.click(csv);
    await expect(canvas.getByText("CSV export started")).toBeVisible();
    await waitFor(() => expect(openMore(canvasElement)).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());

    // A command that opens a dialog closes More without taking the dialog's focus, and closing
    // the dialog brings focus back to More.
    await userEvent.click(more);
    popup = await body.findByRole("dialog", { name: "Filters and display" });
    await userEvent.click(within(popup).getByRole("button", { name: "Collection actions" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Import records…" }));
    const importing = await body.findByRole("dialog", { name: "Import records" });
    await waitFor(() => expect(openMore(canvasElement)).toBeNull());
    const focused = () => canvasElement.ownerDocument.activeElement as HTMLElement;
    await waitFor(() => expect(importing).toContainElement(focused()));
    await frames();
    await expect(importing).toContainElement(focused());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Import records" })).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());

    // Widening while More is open keeps what it holds, so nothing moves under the reader.
    await userEvent.keyboard("{Enter}");
    popup = await body.findByRole("dialog", { name: "Filters and display" });
    frame.style.maxWidth = "none";
    await frames();
    await expect(popup).toBeInTheDocument();
    await expect(within(toolbar).queryByRole("button", { name: /^Columns/ })).toBeNull();
    // Closing More returns everything to one row, and focus to the first control that came back.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("button", { name: /^More/ })).toBeNull());
    await waitFor(() => expect(rowCount(toolbar)).toBe(1));
    await expect(within(toolbar).getByRole("button", { name: /^Columns/ })).toBeVisible();
    await waitFor(() =>
      expect(within(toolbar).getByRole("button", { name: /Status/ })).toHaveFocus(),
    );
    noSidewaysScroll();
  },
};

/** The register in a 240px frame, narrower than a phone: the search keeps 128px and the saved-views menu takes what is left. Its label shortens with an ellipsis and keeps its full text as a title; its count and chevron stay whole, More and the primary do not overlap, and nothing scrolls sideways. */
export const NarrowestFrame: Story = {
  name: "In a 240px frame",
  render: () => (
    <div data-testid="frame" style={{ maxWidth: 240 }}>
      <Register kind="suppliers" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = toolbarOf(canvasElement);
    await waitFor(() => expect(toolbar).toHaveAttribute("data-rows", "2"));
    noSidewaysScroll();
    const views = viewsTrigger(toolbar);
    const label = within(views).getByTitle("All records");
    const count = within(views).getByText("4", { exact: true });
    const chevron = views.querySelector('svg[data-icon="inline-end"]')!;
    await waitFor(() => expect(label.scrollWidth).toBeGreaterThan(label.clientWidth));
    const edge = views.getBoundingClientRect().right + 0.5;
    await expect(count.getBoundingClientRect().right).toBeLessThanOrEqual(edge);
    await expect(chevron.getBoundingClientRect().right).toBeLessThanOrEqual(edge);
    await expect(views.getBoundingClientRect().right).toBeLessThanOrEqual(
      toolbar.getBoundingClientRect().right + 0.5,
    );
    const primary = canvas.getByRole("button", { name: "Create organization" });
    await primaryWhole(toolbar, primary);
    await apart(canvas.getByRole("button", { name: "More filters and display options" }), primary);
  },
};

/** The register with the longest primary in a 208px frame: the body of a Shell.Panel at its narrowest (240px, less its padding). More and "Create operational issue" cannot share the second row, so the primary takes a line of its own under More, at the end, its label whole. Nothing overlaps and nothing scrolls sideways; the order and Tab sequence stay the same. */
export const PanelMinimum: Story = {
  name: "In a panel at its narrowest",
  render: () => (
    <div data-testid="frame" style={{ maxWidth: 208 }}>
      <Register kind="issues" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = toolbarOf(canvasElement);
    await waitFor(() => expect(toolbar).toHaveAttribute("data-rows", "2"));
    noSidewaysScroll();
    const search = canvas.getByRole("searchbox", { name: "Search operational issues" });
    const savedViews = viewsTrigger(toolbar);
    const more = canvas.getByRole("button", { name: "More filters and display options" });
    const primary = canvas.getByRole("button", { name: "Create operational issue" });
    await expect(sameRow(search, savedViews)).toBe(true);
    await primaryWhole(toolbar, primary);
    await apart(more, primary);
    // The primary sits under More, at the end of its own line.
    await expect(primary.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      more.getBoundingClientRect().bottom,
    );
    await expect(along(primary).end).toBeGreaterThanOrEqual(along(toolbar).end - 1);
    await expect(follows(savedViews, more) && follows(more, primary)).toBe(true);
    await expect(along(toolbar).end).toBeLessThanOrEqual(
      along(canvas.getByTestId("frame")).end + 1,
    );
  },
};

/** More's name, its popover's title and the Display group's name come from the locale's messages, so a LedgerProvider translates them. Here in Spanish, in a 320px frame where the filters and the display controls both fold. */
export const Localized: Story = {
  render: () => (
    <LedgerProvider
      locale="es"
      messages={{
        more: "Más",
        moreFiltersAndDisplay: "Más filtros y opciones de vista",
        filtersAndDisplay: "Filtros y vista",
        display: "Vista",
      }}
    >
      <div style={{ maxWidth: 320 }}>
        <Toolbar
          search=""
          onSearch={() => {}}
          placeholder="Buscar controles"
          filters={
            <>
              <FilterChip label="Responsable" />
              <FilterChip label="Estado" />
            </>
          }
          actions={
            <Button size="small" variant="primary" iconBefore={<Plus />}>
              Nuevo control
            </Button>
          }
        >
          <Button size="small">Columnas</Button>
          <Button size="small">Ajustes</Button>
        </Toolbar>
      </div>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const more = await canvas.findByRole("button", { name: "Más filtros y opciones de vista" });
    await expect(more).toHaveTextContent("Más");
    await userEvent.click(more);
    const popup = await body.findByRole("dialog", { name: "Filtros y vista" });
    const display = await waitFor(() => within(popup).getByRole("group", { name: "Vista" }));
    await waitFor(() =>
      expect(within(display).getByRole("button", { name: "Columnas" })).toBeVisible(),
    );
    await waitFor(() =>
      expect(within(popup).getByRole("button", { name: /Responsable/ })).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(openMore(canvasElement)).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());
    noSidewaysScroll();
  },
};

function ToolbarInForm() {
  const [query, setQuery] = useState("");
  const [linked, setLinked] = useState(0);
  const q = query.trim().toLowerCase();
  const rows = controls.filter(
    (c) => !q || c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q),
  );
  return (
    <form
      aria-label="Link controls"
      onSubmit={(event) => {
        event.preventDefault();
        setLinked((count) => count + 1);
      }}
      style={{ maxWidth: 560 }}
    >
      <Stack space="space.150">
        <Toolbar
          search={query}
          onSearch={setQuery}
          placeholder="Search controls"
          actions={
            <Text size="small" color="color.text.subtle">
              {rows.length} of {controls.length} controls
            </Text>
          }
        />
        <Stack as="ul" space="space.050">
          {rows.map((c) => (
            <Text as="li" key={c.id}>
              {`${c.id} ${c.title}`}
            </Text>
          ))}
        </Stack>
        <Text size="small" color="color.text.subtle">
          {linked === 0 ? "Not linked" : `Linked ${linked} ${linked === 1 ? "time" : "times"}`}
        </Text>
        <Button type="submit" variant="primary">
          Link controls
        </Button>
      </Stack>
    </form>
  );
}

/** A toolbar inside a form, as in a dialog that links the records a reader picks. Enter in the search never submits the form; the clear button and Escape empty the search and keep focus in it; the form's own primary still submits it. */
export const InAForm: Story = {
  name: "Inside a form",
  render: () => <ToolbarInForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "Search controls" });
    await expect(search).toHaveAttribute("enterkeyhint", "search");
    await userEvent.type(search, "AC{Enter}");
    await expect(canvas.getByText("Not linked")).toBeVisible();
    await expect(canvas.getByText("2 of 6 controls")).toBeVisible();
    // The clear button empties the search through onSearch and leaves focus in it.
    await userEvent.click(canvas.getByRole("button", { name: "Clear search" }));
    await expect(search).toHaveValue("");
    await expect(search).toHaveFocus();
    await expect(canvas.getByText("6 of 6 controls")).toBeVisible();
    await userEvent.type(search, "event");
    await expect(canvas.getByText("1 of 6 controls")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(search).toHaveValue("");
    await expect(canvas.getByText("Not linked")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Link controls" }));
    await expect(canvas.getByText("Linked 1 time")).toBeVisible();
  },
};

const toolbarRef = createRef<HTMLDivElement>();
const typed = fn();
/** Native div props and a ref reach the row: an id, data attributes, and a role and name, here a search landmark for the page's one register. The row keeps its own `data-slot`. With `onSearch` and no `search`, the toolbar owns the query: `defaultSearch` is the first one, and what the reader types shows as they type it. */
export const NativeAttributes: Story = {
  name: "Native attributes",
  render: () => (
    <Toolbar
      ref={toolbarRef}
      id="control-search"
      role="search"
      aria-label="Find controls"
      data-testid="controls-toolbar"
      data-slot="not-the-toolbar"
      defaultSearch="AC"
      onSearch={typed}
      placeholder="Search controls"
      filters={<FilterChip label="Gaps" />}
      actions={
        <Button size="small" variant="primary" iconBefore={<Plus />}>
          New control
        </Button>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole("search", { name: "Find controls" });
    await expect(toolbarRef.current).toBe(row);
    await expect(row).toHaveAttribute("id", "control-search");
    await expect(row).toHaveAttribute("data-testid", "controls-toolbar");
    await expect(row).toHaveAttribute("data-slot", "toolbar");
    const search = within(row).getByRole("searchbox", { name: "Search controls" });
    await expect(search).toHaveValue("AC");
    typed.mockClear();
    await userEvent.type(search, "-2");
    await expect(search).toHaveValue("AC-2");
    await expect(typed).toHaveBeenLastCalledWith("AC-2");
  },
};

function AppliedFilters() {
  const [gaps, setGaps] = useState(true);
  const [owner, setOwner] = useState<string | undefined>("Dana Whitfield");
  const applied = Number(gaps) + Number(owner !== undefined);
  return (
    <Stack space="space.200">
      <div data-testid="frame" style={{ maxWidth: "100%" }}>
        <Toolbar
          activeFilters={applied}
          filters={
            <>
              <FilterChip label="Gaps" isActive={gaps} onClick={() => setGaps((on) => !on)} />
              <FilterChip
                label="Owner"
                value={owner}
                isActive={owner !== undefined}
                onClick={() => setOwner((who) => (who ? undefined : "Dana Whitfield"))}
              />
            </>
          }
          actions={
            <Button size="small" variant="primary" iconBefore={<Plus />}>
              Create operational issue
            </Button>
          }
        />
      </div>
      <Text size="small" color="color.text.subtle">
        {applied === 0 ? "No filters applied" : `${applied} of 2 filters applied`}
      </Text>
    </Stack>
  );
}

/** When the filters fold, More still says the list is narrowed: it shows how many filters apply and says so in its name, "More filters, 2 applied", from `activeFilters`. A filter changed inside More is measured there, so when its label shrinks and More closes, the filters come back to the row if they now fit; a filter that grows in the row folds back into More, and focus goes with it. */
export const AppliedFiltersFolded: Story = {
  name: "Applied filters, folded",
  globals: desktopCanvas,
  render: () => <AppliedFilters />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const toolbar = toolbarOf(canvasElement);
    const frame = canvas.getByTestId("frame");
    const owner = () => within(toolbar).getByRole("button", { name: /^Owner/ });
    const strip = () => toolbar.querySelector<HTMLElement>('[data-slot="toolbar-filters"]')!;
    const primary = canvas.getByRole("button", { name: "Create operational issue" });
    const gap = parseFloat(getComputedStyle(toolbar).columnGap);
    // The row's width with the owner chosen, and with it cleared.
    const need = () =>
      strip().getBoundingClientRect().width + gap + primary.getBoundingClientRect().width;
    const withOwner = need();
    await userEvent.click(owner());
    await waitFor(() => expect(owner()).not.toHaveAttribute("aria-pressed", "true"));
    const withoutOwner = need();
    await expect(withOwner - withoutOwner).toBeGreaterThan(40);
    await userEvent.click(owner());
    await waitFor(() => expect(owner()).toHaveAttribute("aria-pressed", "true"));
    // A frame that holds the filters without the owner's name, but not with it.
    frame.style.width = `${Math.round((withOwner + withoutOwner) / 2)}px`;
    // The owner chip folded under focus, so focus went to More, which counts what applies.
    const more = await canvas.findByRole("button", { name: "More filters, 2 applied" });
    await waitFor(() => expect(more).toHaveFocus());
    await expect(more).toHaveTextContent(/^More\s*2$/);
    await expect(canvas.getByText("2 of 2 filters applied")).toBeVisible();
    // Clearing the owner inside More updates the count, and More holds the filters while open.
    await userEvent.click(more);
    const popup = await body.findByRole("dialog", { name: "Filters" });
    const inMore = await waitFor(() => within(popup).getByRole("button", { name: /^Owner/ }));
    await userEvent.click(inMore);
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "More filters, 1 applied" })).toBeInTheDocument(),
    );
    await frames();
    await expect(openMore(canvasElement)).not.toBeNull();
    // Closing More: the shorter filters fit, so the row takes them back and focus lands on the
    // first control that came back.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.queryByRole("button", { name: /^More/ })).toBeNull());
    await waitFor(() =>
      expect(within(toolbar).getByRole("button", { name: /^Gaps/ })).toHaveFocus(),
    );
    await expect(owner()).toBeVisible();
    await expect(canvas.getByText("1 of 2 filters applied")).toBeVisible();
    noSidewaysScroll();
  },
};

/** A saved view that takes focus from the search shows its whole focus ring: the views strip scrolls sideways, but it does not cut off the ring of the control focused inside it. */
export const FocusedView: Story = {
  name: "A focused saved view",
  render: () => (
    <Toolbar
      search=""
      onSearch={() => {}}
      placeholder="Search suppliers"
      views={<Button size="small">All records</Button>}
      actions={
        <Button size="small" variant="primary" iconBefore={<Plus />}>
          Create organization
        </Button>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("searchbox", { name: "Search suppliers" }));
    await userEvent.tab();
    const view = canvas.getByRole("button", { name: "All records" });
    await expect(view).toHaveFocus();
    const style = getComputedStyle(view);
    await expect(style.outlineStyle).not.toBe("none");
    // How far the ring's outer edge reaches past the button's border box.
    const reach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
    const ring = view.getBoundingClientRect();
    const clip = view.closest('[data-slot="scroller-viewport"]')!.getBoundingClientRect();
    await expect(ring.top - reach).toBeGreaterThanOrEqual(clip.top - 0.5);
    await expect(ring.bottom + reach).toBeLessThanOrEqual(clip.bottom + 0.5);
    await expect(ring.left - reach).toBeGreaterThanOrEqual(clip.left - 0.5);
    await expect(ring.right + reach).toBeLessThanOrEqual(clip.right + 0.5);
  },
};
