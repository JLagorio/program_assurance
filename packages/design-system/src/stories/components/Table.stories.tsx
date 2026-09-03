import type { Meta, StoryObj } from "@storybook/react-vite";
import { Filter, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Badge,
  Button,
  FilterChip,
  Indicator,
  Pagination,
  Person,
  Table,
  Toolbar,
  type Tone,
} from "../../components";
import { Stack, Text, Box } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Table",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

type Row = {
  id: string;
  name: string;
  owner: string;
  status: { tone: Tone; label: string };
  severity: { tone: Tone; label: string };
  due: string;
  family: string;
};

const rows: Row[] = [
  {
    id: "CTRL-0412",
    name: "Segregation of duties, payables",
    owner: "Dana Whitfield",
    status: { tone: "success", label: "Verified" },
    severity: { tone: "danger", label: "High" },
    due: "14 Sep 2026",
    family: "Finance",
  },
  {
    id: "CTRL-0418",
    name: "Vendor master change approval",
    owner: "Dana Whitfield",
    status: { tone: "information", label: "In review" },
    severity: { tone: "warning", label: "Medium" },
    due: "18 Sep 2026",
    family: "Finance",
  },
  {
    id: "CTRL-0450",
    name: "Privileged access review",
    owner: "Priya Natarajan",
    status: { tone: "danger", label: "Overdue" },
    severity: { tone: "danger", label: "High" },
    due: "2 Sep 2026",
    family: "Security",
  },
  {
    id: "CTRL-0451",
    name: "Firewall rule recertification",
    owner: "Priya Natarajan",
    status: { tone: "warning", label: "Due soon" },
    severity: { tone: "warning", label: "Medium" },
    due: "9 Sep 2026",
    family: "Security",
  },
  {
    id: "CTRL-0472",
    name: "Backup restore test",
    owner: "Marcus Oyelaran",
    status: { tone: "neutral", label: "Draft" },
    severity: { tone: "neutral", label: "Low" },
    due: "30 Sep 2026",
    family: "Operations",
  },
];

function Register() {
  const [sort, setSort] = useState<{ key: "id" | "due"; dir: "asc" | "desc" }>({
    key: "id",
    dir: "asc",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set(["CTRL-0418"]));
  const [preview, setPreview] = useState<string | null>("CTRL-0450");
  const [page, setPage] = useState(2);
  const [search, setSearch] = useState("");
  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) => (a[sort.key] < b[sort.key] ? -1 : 1) * (sort.dir === "asc" ? 1 : -1),
      ),
    [sort],
  );
  const all = selected.size === rows.length;
  const some = selected.size > 0 && !all;
  const toggleSort = (key: "id" | "due") =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  return (
    <Stack space="space.0">
      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search controls"
        actions={
          <Button variant="primary" size="small">
            <Plus className="size-icon-small" />
            New control
          </Button>
        }
      >
        <FilterChip label="Owner" value="Dana Whitfield" isActive />
        <FilterChip label="Status" />
        <Button variant="subtle" size="small">
          <Filter className="size-icon-small" />
          More filters
        </Button>
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Table.Selection
              header
              checked={all ? true : some ? "indeterminate" : false}
              onCheckedChange={(next) =>
                setSelected(next ? new Set(rows.map((r) => r.id)) : new Set())
              }
              label="Select all"
            />
            <Table.Header
              sort={sort.key === "id" ? sort.dir : false}
              onSort={() => toggleSort("id")}
              sticky
            >
              Id
            </Table.Header>
            <Table.Header>Control</Table.Header>
            <Table.Header width={180}>Owner</Table.Header>
            <Table.Header>Status</Table.Header>
            <Table.Header>Severity</Table.Header>
            <Table.Header
              sort={sort.key === "due" ? sort.dir : false}
              onSort={() => toggleSort("due")}
            >
              Due
            </Table.Header>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <Table.Row key={r.id} isSelected={selected.has(r.id)} onClick={() => setPreview(r.id)}>
              <Table.Selection
                checked={selected.has(r.id)}
                onCheckedChange={(next) =>
                  setSelected((s) => {
                    const n = new Set(s);
                    if (next) n.add(r.id);
                    else n.delete(r.id);
                    return n;
                  })
                }
                label={`Select ${r.id}`}
              />
              <Table.Id id={r.id} isActive={preview === r.id} onPreview={() => setPreview(r.id)} />
              <Table.Cell>{r.name}</Table.Cell>
              <Table.Cell>
                <Person name={r.owner} />
              </Table.Cell>
              <Table.Cell>
                <Badge tone={r.status.tone}>{r.status.label}</Badge>
              </Table.Cell>
              <Table.Cell>
                <Indicator tone={r.severity.tone}>{r.severity.label}</Indicator>
              </Table.Cell>
              <Table.Cell className="tabular-nums">{r.due}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      <Pagination
        page={page}
        pageCount={28}
        onPageChange={setPage}
        total={1391}
        pageSize={50}
        className="pt-150"
      />
    </Stack>
  );
}

export const RegisterStory: Story = { name: "Register", render: () => <Register /> };

function Grouped() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    Finance: true,
    Security: true,
    Operations: false,
  });
  const families = [...new Set(rows.map((r) => r.family))];
  return (
    <Table>
      <thead>
        <tr>
          <Table.Header>Id</Table.Header>
          <Table.Header>Control</Table.Header>
          <Table.Header>Status</Table.Header>
        </tr>
      </thead>
      {families.map((f) => (
        <Table.Group
          key={f}
          colSpan={3}
          open={open[f] ?? false}
          onToggle={() => setOpen((o) => ({ ...o, [f]: !o[f] }))}
          title={f}
          count={rows.filter((r) => r.family === f).length}
        >
          {rows
            .filter((r) => r.family === f)
            .map((r) => (
              <Table.Row key={r.id}>
                <Table.Id id={r.id} tone="subtle" />
                <Table.Cell>{r.name}</Table.Cell>
                <Table.Cell>
                  <Badge tone={r.status.tone}>{r.status.label}</Badge>
                </Table.Cell>
              </Table.Row>
            ))}
        </Table.Group>
      ))}
    </Table>
  );
}

export const Groups: Story = { render: () => <Grouped /> };

const parts = [
  { id: "SYS-01", name: "Ground segment", kind: "System", depth: 0, children: 2, controls: 212 },
  {
    id: "SUB-011",
    name: "Mission control",
    kind: "Subsystem",
    depth: 1,
    children: 2,
    controls: 140,
  },
  {
    id: "CMP-0113",
    name: "Telemetry gateway",
    kind: "Component",
    depth: 2,
    children: 0,
    controls: 86,
  },
  {
    id: "CMP-0114",
    name: "Operator console",
    kind: "Component",
    depth: 2,
    children: 0,
    controls: 54,
  },
  { id: "SUB-012", name: "Antenna array", kind: "Subsystem", depth: 1, children: 1, controls: 72 },
  {
    id: "CMP-0121",
    name: "Pedestal controller",
    kind: "Component",
    depth: 2,
    children: 0,
    controls: 72,
  },
];

/** A hierarchy with columns: the treegrid. The caller flattens and folds; Table.Tree is the name cell. */
function TreeGrid() {
  const [open, setOpen] = useState(() => new Set(["SYS-01", "SUB-011"]));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const rows: typeof parts = [];
  let hideBelow = Infinity;
  for (const p of parts) {
    if (p.depth > hideBelow) continue;
    hideBelow = Infinity;
    rows.push(p);
    if (p.children && !open.has(p.id)) hideBelow = p.depth;
  }
  return (
    <Table role="treegrid">
      <thead>
        <tr>
          <Table.Header>Element</Table.Header>
          <Table.Header width={110}>Kind</Table.Header>
          <Table.Header width={96} className="text-right">
            Controls
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => {
          const expanded = open.has(p.id);
          return (
            <Table.Row
              key={p.id}
              aria-level={p.depth + 1}
              aria-expanded={p.children ? expanded : undefined}
            >
              <Table.Tree
                depth={p.depth}
                hasChildren={p.children > 0}
                expanded={expanded}
                onToggle={() => toggle(p.id)}
                label={p.name}
                hint={
                  p.children && !expanded ? (
                    <Text size="xsmall" color="color.text.subtle">
                      {p.children} part{p.children === 1 ? "" : "s"}
                    </Text>
                  ) : null
                }
              >
                {p.name}
              </Table.Tree>
              <Table.Cell>{p.kind}</Table.Cell>
              <Table.Cell className="text-right">{p.controls}</Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}
export const TreeStory: Story = { name: "Tree", render: () => <TreeGrid /> };

function GroupStates() {
  const [open, setOpen] = useState(true);
  return (
    <Table>
      <thead>
        <tr>
          <Table.Header width={110}>Id</Table.Header>
          <Table.Header>Control</Table.Header>
          <Table.Header width={140}>Status</Table.Header>
        </tr>
      </thead>
      <Table.Group
        colSpan={3}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        title="Access control"
        count={2}
        trailing={
          <Text size="xsmall" color="color.text.subtlest">
            2 of 46
          </Text>
        }
      >
        <Table.Row>
          <Table.Id id="AC-2" />
          <Table.Cell>Account management</Table.Cell>
          <Table.Cell>
            <Badge tone="success">Satisfied</Badge>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Id id="AC-3" />
          <Table.Cell>Access enforcement</Table.Cell>
          <Table.Cell>
            <Badge tone="warning">Partial</Badge>
          </Table.Cell>
        </Table.Row>
      </Table.Group>
      <Table.Group
        colSpan={3}
        open={false}
        onToggle={() => {}}
        title="Audit and accountability (closed)"
        count={25}
      >
        {null}
      </Table.Group>
    </Table>
  );
}

/** Every header, row, cell and id state, then a group open and closed. */
export const TableMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Table>
        <thead>
          <tr>
            <Table.Selection
              header
              checked="indeterminate"
              onCheckedChange={() => {}}
              label="Select all"
            />
            <Table.Header sticky width={110}>
              Sticky
            </Table.Header>
            <Table.Header sort="asc" onSort={() => {}}>
              Sorted asc
            </Table.Header>
            <Table.Header sort="desc" onSort={() => {}}>
              Sorted desc
            </Table.Header>
            <Table.Header sort={false} onSort={() => {}}>
              Sortable
            </Table.Header>
            <Table.Header width={120} className="text-right">
              Right, 120
            </Table.Header>
          </tr>
        </thead>
        <tbody>
          <Table.Row>
            <Table.Selection checked={false} onCheckedChange={() => {}} label="Select" />
            <Table.Id id="FND-2231" />
            <Table.Cell>Plain row</Table.Cell>
            <Table.Cell>
              <Indicator tone="danger">CAT I</Indicator>
            </Table.Cell>
            <Table.Cell>
              <Person name="Dana Whitlock" />
            </Table.Cell>
            <Table.Cell className="text-right">1,204</Table.Cell>
          </Table.Row>
          <Table.Row isSelected>
            <Table.Selection checked onCheckedChange={() => {}} label="Select" />
            <Table.Id id="FND-2214" isActive />
            <Table.Cell>Selected row · active id</Table.Cell>
            <Table.Cell>
              <Indicator tone="warning">CAT II</Indicator>
            </Table.Cell>
            <Table.Cell>
              <Person name="Grace Hoppel" />
            </Table.Cell>
            <Table.Cell className="text-right">318</Table.Cell>
          </Table.Row>
          <Table.Row isStatic>
            <Table.Selection checked={false} onCheckedChange={() => {}} label="Select" disabled />
            <Table.Id id="FND-2240" tone="subtle" />
            <Table.Cell>Static row · subtle id · disabled selection</Table.Cell>
            <Table.Cell>
              <Badge tone="neutral">Triaged</Badge>
            </Table.Cell>
            <Table.Cell className="truncate">
              A cell that is much too long for its column truncates with an ellipsis
            </Table.Cell>
            <Table.Cell className="text-right text-danger">-12</Table.Cell>
          </Table.Row>
        </tbody>
      </Table>
      <GroupStates />
      <TreeGrid />
    </Stack>
  ),
};

/** Inactive, active, with a value, and disabled. */
export const ChipMatrix: Story = {
  render: () => (
    <Specimens title="FilterChip">
      <FilterChip label="Impact" />
      <FilterChip label="Impact" isActive />
      <FilterChip label="Baseline" value="Rev. 5" isActive />
      <FilterChip label="Owner" disabled />
    </Specimens>
  ),
};

/** First page, a middle page with the range, the last page, and a single page. */
export const PaginationMatrix: Story = {
  render: () => (
    <Stack space="space.200" className="max-w-layout-measure">
      <Pagination page={1} pageCount={12} onPageChange={() => {}} total={289} pageSize={25} />
      <Pagination page={6} pageCount={12} onPageChange={() => {}} total={289} pageSize={25} />
      <Pagination page={12} pageCount={12} onPageChange={() => {}} total={289} pageSize={25} />
      <Pagination page={1} pageCount={1} onPageChange={() => {}} total={5} pageSize={25} />
    </Stack>
  ),
};

/** Search only, with filters, with actions, and dense. */
export const ToolbarMatrix: Story = {
  render: () => (
    <Stack space="space.200" className="max-w-layout-measure">
      <Toolbar search="" onSearch={() => {}} placeholder="Search controls" />
      <Toolbar search="AC-2" onSearch={() => {}}>
        <FilterChip label="Baseline" value="Rev. 5" isActive />
        <FilterChip label="Impact" />
      </Toolbar>
      <Toolbar search="" onSearch={() => {}} actions={<Button size="small">Export</Button>}>
        <FilterChip label="Owner" />
      </Toolbar>
      <Toolbar
        actions={
          <Button size="small" variant="primary">
            New
          </Button>
        }
      >
        <Text size="small" color="color.text.subtle">
          No search: the children carry the row.
        </Text>
      </Toolbar>
    </Stack>
  ),
};
