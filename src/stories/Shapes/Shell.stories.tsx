import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, Plus } from "lucide-react";

import { Shell } from "@/components/app/shell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  IdCell,
  Mono,
  PageHeader,
  Person,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/app/ui";

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
          <CardHeader title="Open findings" description="4 across 4 controls" />
          <Table>
            <thead>
              <tr>
                <Th className="w-[104px]">Finding</Th>
                <Th>Title</Th>
                <Th className="w-[96px]">Control</Th>
                <Th className="w-[140px]">Status</Th>
                <Th className="w-[140px]">Owner</Th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f) => (
                <Tr key={f.id}>
                  <IdCell id={f.id} />
                  <Td className="font-medium">{f.title}</Td>
                  <Td>
                    <Mono className="text-muted-foreground">{f.control}</Mono>
                  </Td>
                  <Td>
                    <Badge tone={f.tone}>{f.status}</Badge>
                  </Td>
                  <Td>
                    <Person name={f.owner} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    ),
  },
};
