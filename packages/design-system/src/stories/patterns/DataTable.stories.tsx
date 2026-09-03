import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";

import { Button, Toolbar, type Tone } from "../../components";
import { DataTable, defineColumns, useDataTable, type DataTableState } from "../../patterns";
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

/** Every state the renderer draws: sorted, filtered, selected, with a glance, with actions, then loading, empty and error; then the toolbar parts alone. */
export const DataTableMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Register />
      <States />
      <Parts />
    </Stack>
  ),
};
