import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Card, EmptyState, Person, Table, Indicator, Id } from "@/components/app/ui";
import type { Tone } from "@/components/app/ui";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Data/Table",
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

/** No rows: EmptyState inside the Card the table would have filled. */
export const Empty: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card className="max-w-[720px]">
      <Card.Header title="Findings" description="Nothing open against AC-2(3)" />
      <div className="p-4">
        <EmptyState
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
