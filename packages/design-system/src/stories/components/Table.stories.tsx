import type { Meta, StoryObj } from "@storybook/react-vite";
import { Filter, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Absent,
  Badge,
  Button,
  FilterChip,
  Indicator,
  Pagination,
  Person,
  Table,
  type Tone,
  Toolbar,
  usePage,
  useSort,
} from "../../components";
import { Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

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
          <Button variant="primary" size="small" iconBefore={<Plus />}>
            New control
          </Button>
        }
      >
        <FilterChip label="Owner" value="Dana Whitfield" isActive />
        <FilterChip label="Status" />
        <Button variant="subtle" size="small" iconBefore={<Filter />}>
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

const risks = Array.from({ length: 23 }, (_, i) => ({
  id: `RSK-${String(i + 1).padStart(3, "0")}`,
  title:
    [
      "Export resolver leaks tenants",
      "Stale admin accounts",
      "Unsigned firmware",
      "Backups untested",
    ][i % 4] ?? "",
  score: (i * 37) % 100,
  owner: ["Sarah Chen", "Linus Aarto", "Priya Raghavan"][i % 3] ?? "",
}));
const riskReaders = {
  id: (r: (typeof risks)[number]) => r.id,
  score: (r: (typeof risks)[number]) => r.score,
  owner: (r: (typeof risks)[number]) => r.owner,
};

/** useSort feeds the headers; usePage feeds Pagination. The page clamps when the list shrinks. */
function SortedPaged() {
  const sort = useSort(risks, riskReaders, { key: "score", dir: "desc" });
  const page = usePage(sort.rows, 8);
  return (
    <Stack space="space.150">
      <Table>
        <thead>
          <tr>
            <Table.Header sort={sort.dir("id")} onSort={() => sort.toggle("id")} width={120}>
              Risk
            </Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header sort={sort.dir("score")} onSort={() => sort.toggle("score")} width={96}>
              Score
            </Table.Header>
            <Table.Header sort={sort.dir("owner")} onSort={() => sort.toggle("owner")} width={160}>
              Owner
            </Table.Header>
          </tr>
        </thead>
        <tbody>
          {page.rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Id id={r.id} />
              <Table.Cell>{r.title}</Table.Cell>
              <Table.Cell className="tabular-nums">{r.score}</Table.Cell>
              <Table.Cell>{r.owner}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      <Pagination
        page={page.page}
        pageCount={page.pageCount}
        onPageChange={page.setPage}
        total={page.total}
        pageSize={page.pageSize}
      />
    </Stack>
  );
}
export const SortedAndPaged: Story = { name: "Sorted and paged", render: () => <SortedPaged /> };

const wideRows = Array.from({ length: 14 }, (_, i) => ({
  ...(rows[i % rows.length] as Row),
  id: `CTRL-${String(412 + i * 3).padStart(4, "0")}`,
}));

/** The frame: `maxHeight` scrolls the rows under the sticky header; the id is pinned and shows its edge once the frame moves sideways. */
function Frame() {
  return (
    <Table label="Controls" maxHeight={240} className="table-fixed">
      <thead>
        <tr>
          <Table.Header pinned="start" edge width={120}>
            Id
          </Table.Header>
          <Table.Header width={260}>Control</Table.Header>
          <Table.Header width={180}>Owner</Table.Header>
          <Table.Header width={140}>Status</Table.Header>
          <Table.Header width={120}>Severity</Table.Header>
          <Table.Header width={120}>Due</Table.Header>
          <Table.Header width={160}>Family</Table.Header>
          <Table.Header width={320}>Notes</Table.Header>
        </tr>
      </thead>
      <tbody>
        {wideRows.map((r) => (
          <Table.Row key={r.id}>
            <Table.Id id={r.id} pinned="start" edge />
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
            <Table.Cell>{r.family}</Table.Cell>
            <Table.Cell>
              A note long enough to be cut by its column and shown whole on hover, since a plain
              string is the cell's title.
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}
export const FrameStory: Story = { name: "Frame", render: () => <Frame /> };

function Scores({ align }: { align: "end" | "center" }) {
  const cls = align === "end" ? "text-right tabular-nums" : "text-center";
  return (
    <Table label="Scores">
      <thead>
        <tr>
          <Table.Header width={110}>Risk</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header width={90} className={cls}>
            Score
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        {risks.slice(0, 3).map((r) => (
          <Table.Row key={r.id}>
            <Table.Id id={r.id} />
            <Table.Cell>{r.title}</Table.Cell>
            <Table.Cell className={cls}>{r.score}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function Selected({ withColumn }: { withColumn: boolean }) {
  return (
    <Table label="Controls">
      <thead>
        <tr>
          {withColumn ? (
            <Table.Selection
              header
              checked="indeterminate"
              onCheckedChange={() => {}}
              label="Select all"
            />
          ) : null}
          <Table.Header width={110}>Id</Table.Header>
          <Table.Header>Control</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 3).map((r, i) => (
          <Table.Row key={r.id} isSelected={i === 1}>
            {withColumn ? (
              <Table.Selection
                checked={i === 1}
                onCheckedChange={() => {}}
                label={`Select ${r.id}`}
              />
            ) : null}
            <Table.Id id={r.id} />
            <Table.Cell>{r.name}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function Owners({ absent }: { absent: boolean }) {
  return (
    <Table label="Owners">
      <thead>
        <tr>
          <Table.Header width={110}>Risk</Table.Header>
          <Table.Header>Owner</Table.Header>
        </tr>
      </thead>
      <tbody>
        <Table.Row>
          <Table.Id id="RSK-001" />
          <Table.Cell>Sarah Chen</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Id id="RSK-002" />
          <Table.Cell>{absent ? <Absent /> : "—"}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Id id="RSK-003" />
          <Table.Cell>{absent ? <Absent /> : "N/A"}</Table.Cell>
        </Table.Row>
      </tbody>
    </Table>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<Scores align="end" />}
        doText="Numbers end, in tabular numerals, and so does their header."
        dont={<Scores align="center" />}
        dontText="Centred numbers. The digits never line up, so the eye cannot compare down the column."
      />
      <Pair
        do={<Selected withColumn />}
        doText="Selection is the checkbox column; the header's box chooses the page."
        dont={<Selected withColumn={false} />}
        dontText="A row painted selected by its click. The click is how a row opens, and a screen reader hears nothing chosen."
      />
      <Pair
        do={<Owners absent />}
        doText="An absent value is Absent."
        dont={<Owners absent={false} />}
        dontText="A dash typed by hand and an N/A. Two spellings of nothing, neither of which a sort or a filter understands."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: { label: "Controls" },
  render: (args) => (
    <Table {...args}>
      <thead>
        <tr>
          <Table.Header width={110}>Id</Table.Header>
          <Table.Header>Control</Table.Header>
          <Table.Header width={140}>Status</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Table.Row key={r.id}>
            <Table.Id id={r.id} />
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>
              <Badge tone={r.status.tone}>{r.status.label}</Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  ),
};
