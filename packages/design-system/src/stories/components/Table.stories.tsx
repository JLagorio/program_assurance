import type { Meta, StoryObj } from "@storybook/react-vite";
import { Filter, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge, Button, FilterChip, Indicator, Pagination, Person, Table, Toolbar, type Tone } from "../../components";
import { Stack } from "../../primitives";

const meta = {
  title: "Components/Table",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

type Row = { id: string; name: string; owner: string; status: { tone: Tone; label: string }; severity: { tone: Tone; label: string }; due: string; family: string };

const rows: Row[] = [
  { id: "CTRL-0412", name: "Segregation of duties, payables", owner: "Dana Whitfield", status: { tone: "success", label: "Verified" }, severity: { tone: "danger", label: "High" }, due: "14 Sep 2026", family: "Finance" },
  { id: "CTRL-0418", name: "Vendor master change approval", owner: "Dana Whitfield", status: { tone: "information", label: "In review" }, severity: { tone: "warning", label: "Medium" }, due: "18 Sep 2026", family: "Finance" },
  { id: "CTRL-0450", name: "Privileged access review", owner: "Priya Natarajan", status: { tone: "danger", label: "Overdue" }, severity: { tone: "danger", label: "High" }, due: "2 Sep 2026", family: "Security" },
  { id: "CTRL-0451", name: "Firewall rule recertification", owner: "Priya Natarajan", status: { tone: "warning", label: "Due soon" }, severity: { tone: "warning", label: "Medium" }, due: "9 Sep 2026", family: "Security" },
  { id: "CTRL-0472", name: "Backup restore test", owner: "Marcus Oyelaran", status: { tone: "neutral", label: "Draft" }, severity: { tone: "neutral", label: "Low" }, due: "30 Sep 2026", family: "Operations" },
];

function Register() {
  const [sort, setSort] = useState<{ key: "id" | "due"; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });
  const [selected, setSelected] = useState<Set<string>>(new Set(["CTRL-0418"]));
  const [preview, setPreview] = useState<string | null>("CTRL-0450");
  const [page, setPage] = useState(2);
  const [search, setSearch] = useState("");
  const sorted = useMemo(() => [...rows].sort((a, b) => (a[sort.key] < b[sort.key] ? -1 : 1) * (sort.dir === "asc" ? 1 : -1)), [sort]);
  const all = selected.size === rows.length;
  const some = selected.size > 0 && !all;
  const toggleSort = (key: "id" | "due") => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  return (
    <Stack space="space.0">
      <Toolbar search={search} onSearch={setSearch} placeholder="Search controls" actions={<Button variant="primary" size="small"><Plus className="size-icon-small" />New control</Button>}>
        <FilterChip label="Owner" value="Dana Whitfield" isActive />
        <FilterChip label="Status" />
        <Button variant="subtle" size="small"><Filter className="size-icon-small" />More filters</Button>
      </Toolbar>
      <Table>
        <thead>
          <tr>
            <Table.Selection header checked={all ? true : some ? "indeterminate" : false} onCheckedChange={(next) => setSelected(next ? new Set(rows.map((r) => r.id)) : new Set())} label="Select all" />
            <Table.Header sort={sort.key === "id" ? sort.dir : false} onSort={() => toggleSort("id")} sticky>Id</Table.Header>
            <Table.Header>Control</Table.Header>
            <Table.Header width={180}>Owner</Table.Header>
            <Table.Header>Status</Table.Header>
            <Table.Header>Severity</Table.Header>
            <Table.Header sort={sort.key === "due" ? sort.dir : false} onSort={() => toggleSort("due")}>Due</Table.Header>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <Table.Row key={r.id} isSelected={selected.has(r.id)} onClick={() => setPreview(r.id)}>
              <Table.Selection checked={selected.has(r.id)} onCheckedChange={(next) => setSelected((s) => { const n = new Set(s); if (next) n.add(r.id); else n.delete(r.id); return n; })} label={`Select ${r.id}`} />
              <Table.Id id={r.id} isActive={preview === r.id} onPreview={() => setPreview(r.id)} />
              <Table.Cell>{r.name}</Table.Cell>
              <Table.Cell><Person name={r.owner} /></Table.Cell>
              <Table.Cell><Badge tone={r.status.tone}>{r.status.label}</Badge></Table.Cell>
              <Table.Cell><Indicator tone={r.severity.tone}>{r.severity.label}</Indicator></Table.Cell>
              <Table.Cell className="tabular-nums">{r.due}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pageCount={28} onPageChange={setPage} total={1391} pageSize={50} className="pt-150" />
    </Stack>
  );
}

export const RegisterStory: Story = { name: "Register", render: () => <Register /> };

function Grouped() {
  const [open, setOpen] = useState<Record<string, boolean>>({ Finance: true, Security: true, Operations: false });
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
        <Table.Group key={f} colSpan={3} open={open[f] ?? false} onToggle={() => setOpen((o) => ({ ...o, [f]: !o[f] }))} title={f} count={rows.filter((r) => r.family === f).length}>
          {rows.filter((r) => r.family === f).map((r) => (
            <Table.Row key={r.id}>
              <Table.Id id={r.id} tone="subtle" />
              <Table.Cell>{r.name}</Table.Cell>
              <Table.Cell><Badge tone={r.status.tone}>{r.status.label}</Badge></Table.Cell>
            </Table.Row>
          ))}
        </Table.Group>
      ))}
    </Table>
  );
}

export const Groups: Story = { render: () => <Grouped /> };
