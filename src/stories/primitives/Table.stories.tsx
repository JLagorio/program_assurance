import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Person, Table, Indicator, Id, type Tone } from "@/ds/primitives";
import { Card, Empty } from "@/ds/patterns";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Table",
  component: Table,
  tags: ["autodocs"],
  argTypes: { className: { control: false }, children: { control: false } },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

type Severity = "Critical" | "High" | "Moderate" | "Low";

type Finding = {
  id: string;
  title: string;
  control: string;
  severity: Severity;
  status: string;
  tone: Tone;
  owner: string;
  due: string;
};

const findings: Finding[] = [
  {
    id: "FND-2231",
    title: "Shared admin account on jump host",
    control: "AC-2(3)",
    severity: "Critical",
    status: "Overdue",
    tone: "danger",
    owner: "D. Reyes",
    due: "2026-08-28",
  },
  {
    id: "FND-2232",
    title: "MFA not enforced for privileged sessions",
    control: "IA-2(1)",
    severity: "High",
    status: "In remediation",
    tone: "warning",
    owner: "K. Lund",
    due: "2026-09-14",
  },
  {
    id: "FND-2233",
    title: "Audit records retained 30 days; policy requires 90",
    control: "AU-11",
    severity: "Moderate",
    status: "In remediation",
    tone: "warning",
    owner: "M. Okafor",
    due: "2026-09-30",
  },
  {
    id: "FND-2234",
    title: "Default credentials on core switch",
    control: "IA-5(1)",
    severity: "Critical",
    status: "In remediation",
    tone: "warning",
    owner: "D. Reyes",
    due: "2026-09-05",
  },
  {
    id: "FND-2235",
    title: "OpenSSL 3.0.2 on web tier, two versions behind",
    control: "SI-2",
    severity: "High",
    status: "Needs review",
    tone: "warning",
    owner: "S. Chen",
    due: "2026-09-21",
  },
  {
    id: "FND-2236",
    title: "No session lock on kiosk terminals",
    control: "AC-11",
    severity: "Low",
    status: "Accepted",
    tone: "neutral",
    owner: "A. Whitfield",
    due: "—",
  },
  {
    id: "FND-2237",
    title: "Inactive accounts not disabled after 90 days",
    control: "AC-2(3)",
    severity: "Moderate",
    status: "Remediated",
    tone: "success",
    owner: "K. Lund",
    due: "2026-08-14",
  },
  {
    id: "FND-2238",
    title: "Backup encryption keys stored with backups",
    control: "CP-9(8)",
    severity: "High",
    status: "Overdue",
    tone: "danger",
    owner: "M. Okafor",
    due: "2026-08-20",
  },
];

/** Badges only at the top of the ladder; the rest is text (status-vocabulary.md). */
function SeverityCell({ severity }: { severity: Severity }) {
  const tone = severity === "Critical" ? "danger" : severity === "High" ? "warning" : "neutral";
  return <Indicator tone={tone}>{severity}</Indicator>;
}

function Head() {
  return (
    <thead>
      <tr>
        <Table.Header className="w-[104px]">Finding</Table.Header>
        <Table.Header>Title</Table.Header>
        <Table.Header className="w-[96px]">Control</Table.Header>
        <Table.Header className="w-[96px]">Severity</Table.Header>
        <Table.Header className="w-[140px]">Status</Table.Header>
        <Table.Header className="w-[140px]">Owner</Table.Header>
        <Table.Header className="w-[120px] text-right">Due</Table.Header>
      </tr>
    </thead>
  );
}

function Cells({ f }: { f: Finding }) {
  return (
    <>
      <Table.Cell>{f.title}</Table.Cell>
      <Table.Cell>
        <Id>{f.control}</Id>
      </Table.Cell>
      <Table.Cell>
        <SeverityCell severity={f.severity} />
      </Table.Cell>
      <Table.Cell>
        <Badge tone={f.tone}>{f.status}</Badge>
      </Table.Cell>
      <Table.Cell>
        <Person name={f.owner} />
      </Table.Cell>
      <Table.Cell className="tnum text-right">{f.due}</Table.Cell>
    </>
  );
}

/** Eight findings at the 36px row height: Mono id, truncating title, Badge status, Person, tnum date. */
export const Dense: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card className="max-w-[1000px]">
      <Table>
        <Head />
        <tbody>
          {findings.map((f) => (
            <Table.Row key={f.id}>
              <Table.Id id={f.id} />
              <Cells f={f} />
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </Card>
  ),
};

function PreviewTable() {
  const [active, setActive] = useState("FND-2233");
  return (
    <div className="space-y-3">
      <Card className="max-w-[1000px]">
        <Table>
          <Head />
          <tbody>
            {findings.map((f) => (
              <Table.Row key={f.id}>
                <Table.Id id={f.id} active={f.id === active} onPreview={() => setActive(f.id)} />
                <Cells f={f} />
              </Table.Row>
            ))}
          </tbody>
        </Table>
      </Card>
      <Spec>hover a row for the eye · {active} is open in the preview rail</Spec>
    </div>
  );
}

/** IdCell with onPreview: the eye appears on row hover and stays lit on the row being previewed. */
export const WithPreview: Story = {
  parameters: { controls: { disable: true } },
  render: () => <PreviewTable />,
};

/** No rows: Empty inside the Card the table would have filled. */
export const NoRows: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card className="max-w-[720px]">
      <Card.Header title="Findings" description="Nothing open against AC-2(3)" />
      <div className="p-4">
        <Empty
          title="No findings"
          description="Assessments that fail an objective create a finding here."
          action={
            <Button size="sm">
              <Plus className="size-3.5" />
              New finding
            </Button>
          }
        />
      </div>
    </Card>
  ),
};

const families: {
  id: string;
  name: string;
  rows: { id: string; title: string; status: string; tone: Tone }[];
}[] = [
  {
    id: "AC",
    name: "Access control",
    rows: [
      { id: "AC-2", title: "Account management", status: "Satisfied", tone: "success" },
      { id: "AC-2(3)", title: "Disable accounts", status: "Partially satisfied", tone: "warning" },
      { id: "AC-3", title: "Access enforcement", status: "Satisfied", tone: "success" },
    ],
  },
  {
    id: "AU",
    name: "Audit and accountability",
    rows: [
      { id: "AU-2", title: "Event logging", status: "Satisfied", tone: "success" },
      { id: "AU-6", title: "Audit record review", status: "Other than satisfied", tone: "danger" },
    ],
  },
  {
    id: "CM",
    name: "Configuration management",
    rows: [
      { id: "CM-6", title: "Configuration settings", status: "Not assessed", tone: "neutral" },
    ],
  },
];

function GroupedTable() {
  const [open, setOpen] = useState(new Set(["AC"]));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <Card className="max-w-[720px]">
      <Table>
        <thead>
          <tr>
            <Table.Header className="w-[104px]">Control</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header className="w-[172px]">Status</Table.Header>
          </tr>
        </thead>
        {families.map((f) => (
          <Table.Group
            key={f.id}
            colSpan={3}
            open={open.has(f.id)}
            onToggle={() => toggle(f.id)}
            title={
              <>
                <Id className="w-8 shrink-0 text-foreground">{f.id}</Id>
                <span className="truncate">{f.name}</span>
              </>
            }
            count={f.rows.length}
            trailing={
              <span className="tnum text-12 text-muted-foreground">
                {f.rows.filter((r) => r.tone === "success").length}/{f.rows.length} satisfied
              </span>
            }
          >
            {f.rows.map((r) => (
              <Table.Row key={r.id}>
                <Table.Id id={r.id} />
                <Table.Cell>{r.title}</Table.Cell>
                <Table.Cell>
                  <Badge tone={r.tone}>{r.status}</Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Group>
        ))}
      </Table>
    </Card>
  );
}

/** Rows banded under family headings that open and close. Table.Group is a tbody, so groups stack. */
export const Grouped: Story = {
  parameters: { controls: { disable: true } },
  render: () => <GroupedTable />,
};

const inventory = [
  {
    id: "AC-2",
    title: "Account management",
    owner: "R. Okafor",
    evidence: 12,
    tone: "success" as const,
    status: "Satisfied",
  },
  {
    id: "AC-6(1)",
    title: "Authorize access to security functions",
    owner: "M. Tran",
    evidence: 4,
    tone: "warning" as const,
    status: "Partially satisfied",
  },
  {
    id: "AU-6",
    title: "Audit record review, analysis, and reporting",
    owner: "R. Okafor",
    evidence: 0,
    tone: "danger" as const,
    status: "Other than satisfied",
  },
  {
    id: "CM-6",
    title: "Configuration settings",
    owner: "J. Ibarra",
    evidence: 9,
    tone: "info" as const,
    status: "In assessment",
  },
  {
    id: "IR-4",
    title: "Incident handling",
    owner: "M. Tran",
    evidence: 2,
    tone: "neutral" as const,
    status: "Not assessed",
  },
  {
    id: "SC-7",
    title: "Boundary protection",
    owner: "J. Ibarra",
    evidence: 7,
    tone: "success" as const,
    status: "Satisfied",
  },
];

type SortKey = "id" | "title" | "evidence";

function InteractiveDemo() {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "id",
    dir: "asc",
  });
  const [selected, setSelected] = useState<string[]>([]);
  const sorted = [...inventory].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    const cmp =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
    return sort.dir === "asc" ? cmp : -cmp;
  });
  const flip = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  const dir = (key: SortKey) => (sort.key === key ? sort.dir : false);
  const all = selected.length === sorted.length;
  const some = selected.length > 0 && !all;
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  return (
    <div className="space-y-2">
      <Table>
        <thead>
          <tr>
            <Table.Selection
              header
              checked={all ? true : some ? "indeterminate" : false}
              onCheckedChange={(next) => setSelected(next ? sorted.map((r) => r.id) : [])}
              label="Select all controls"
            />
            <Table.Header className="w-[104px]" sort={dir("id")} onSort={() => flip("id")}>
              Control
            </Table.Header>
            <Table.Header sort={dir("title")} onSort={() => flip("title")}>
              Title
            </Table.Header>
            <Table.Header className="w-[120px]">Owner</Table.Header>
            <Table.Header
              className="w-[96px] text-right"
              sort={dir("evidence")}
              onSort={() => flip("evidence")}
            >
              Evidence
            </Table.Header>
            <Table.Header className="w-[172px]">Status</Table.Header>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <Table.Row key={r.id} selected={selected.includes(r.id)}>
              <Table.Selection
                checked={selected.includes(r.id)}
                onCheckedChange={() => toggle(r.id)}
                label={`Select ${r.id}`}
              />
              <Table.Cell>
                <Id>{r.id}</Id>
              </Table.Cell>
              <Table.Cell>{r.title}</Table.Cell>
              <Table.Cell>{r.owner}</Table.Cell>
              <Table.Cell className="tnum text-right">{r.evidence}</Table.Cell>
              <Table.Cell>
                <Badge tone={r.tone}>{r.status}</Badge>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      <Spec>
        {selected.length} selected · sort {sort.key} {sort.dir} · header sort is a button with
        aria-sort; the idle arrow shows on hover
      </Spec>
    </div>
  );
}

/** Sortable headers and a selection column. Selected rows tint primary-soft; the header box reads mixed. */
export const Interactive: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card className="max-w-[820px]">
      <InteractiveDemo />
    </Card>
  ),
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A wide table in a narrow card: the first column pins to the left edge while the rest scroll under it. */
export const Pinned: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-2">
      <Card className="max-w-[560px]">
        <Table>
          <thead>
            <tr>
              <Table.Header sticky className="w-[120px]">
                Control
              </Table.Header>
              {months.map((m) => (
                <Table.Header key={m} className="w-[72px] text-right">
                  {m}
                </Table.Header>
              ))}
            </tr>
          </thead>
          <tbody>
            {inventory.map((r, i) => (
              <Table.Row key={r.id}>
                <Table.Cell sticky className="max-w-none">
                  <Id>{r.id}</Id>
                </Table.Cell>
                {months.map((m, j) => (
                  <Table.Cell key={m} className="tnum text-right">
                    {(i * 7 + j * 3) % 11}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </tbody>
        </Table>
      </Card>
      <Spec>
        scroll the table sideways · pinned cell keeps the row's hover colour · header z-20 over
        cells z-1
      </Spec>
    </div>
  ),
};
