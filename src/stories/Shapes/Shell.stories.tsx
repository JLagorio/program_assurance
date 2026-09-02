import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Plus } from "lucide-react";

import { Shell } from "@/components/app/shell";
import { Badge, Button, Card, PageHeader, Person, Table, Id } from "@/components/app/ui";

const meta = {
  title: "Shapes/Shell",
  component: Shell,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  argTypes: { children: { control: false } },
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

const findings = [
  {
    id: "FND-2231",
    title: "Shared admin account on jump host",
    control: "AC-2(3)",
    status: "Overdue",
    tone: "danger",
    owner: "D. Reyes",
  },
  {
    id: "FND-2232",
    title: "MFA not enforced for privileged sessions",
    control: "IA-2(1)",
    status: "In remediation",
    tone: "warning",
    owner: "K. Lund",
  },
  {
    id: "FND-2234",
    title: "Default credentials on core switch",
    control: "IA-5(1)",
    status: "In remediation",
    tone: "warning",
    owner: "D. Reyes",
  },
  {
    id: "FND-2236",
    title: "No session lock on kiosk terminals",
    control: "AC-11",
    status: "Accepted",
    tone: "neutral",
    owner: "A. Whitfield",
  },
] as const;

/** Sidebar, top bar and main column with an index page inside. */
export const Default: Story = {
  args: {
    children: (
      <div className="space-y-6">
        <PageHeader
          eyebrow="PRG-1041 · Northwind payroll"
          title="Findings & assets"
          description="Open findings across the authorization boundary, grouped by the control they fail."
          actions={
            <>
              <Button variant="ghost">
                <Download className="size-4" />
                Export
              </Button>
              <Button variant="primary">
                <Plus className="size-4" />
                New finding
              </Button>
            </>
          }
        />
        <Card>
          <Card.Header title="Open findings" description="4 across 4 controls" />
          <Table>
            <thead>
              <tr>
                <Table.Header className="w-[104px]">Finding</Table.Header>
                <Table.Header>Title</Table.Header>
                <Table.Header className="w-[96px]">Control</Table.Header>
                <Table.Header className="w-[140px]">Status</Table.Header>
                <Table.Header className="w-[140px]">Owner</Table.Header>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <Table.Row key={f.id}>
                  <Table.Id id={f.id} />
                  <Table.Cell>{f.title}</Table.Cell>
                  <Table.Cell>
                    <Id>{f.control}</Id>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge tone={f.tone}>{f.status}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Person name={f.owner} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    ),
  },
};
