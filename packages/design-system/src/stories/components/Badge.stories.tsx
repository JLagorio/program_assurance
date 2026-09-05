import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleCheck, TriangleAlert } from "lucide-react";

import { Badge, Count, Id, Indicator, Table, TextLink, tones } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: { layout: "padded" },
  args: { children: "In review", tone: "information" },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

const labels = {
  neutral: "Draft",
  information: "In review",
  success: "Verified",
  warning: "Due soon",
  danger: "Overdue",
} as const;

/** Every tone as subtle, bold, xsmall and with an icon. */
export const Matrix: Story = {
  render: () => (
    <Grid
      rows={tones}
      cols={["subtle", "bold", "xsmall", "with an icon"] as const}
      rowLabel="tone"
      render={(tone, col) => (
        <Badge
          tone={tone}
          appearance={col === "bold" ? "bold" : "subtle"}
          size={col === "xsmall" ? "xsmall" : "small"}
          icon={
            col === "with an icon" ? (
              tone === "danger" || tone === "warning" ? (
                <TriangleAlert className="size-150" />
              ) : (
                <CircleCheck className="size-150" />
              )
            ) : undefined
          }
        >
          {labels[tone]}
        </Badge>
      )}
    />
  ),
};

const rows = [
  {
    id: "CTRL-0412",
    name: "Segregation of duties, payables",
    status: "Verified",
    tone: "success",
    severity: "Low",
    sev: "neutral",
    findings: 0,
  },
  {
    id: "CTRL-0418",
    name: "Privileged access review",
    status: "Due soon",
    tone: "warning",
    severity: "Medium",
    sev: "warning",
    findings: 2,
  },
  {
    id: "CTRL-0450",
    name: "Change approval before release",
    status: "Overdue",
    tone: "danger",
    severity: "High",
    sev: "danger",
    findings: 5,
  },
] as const;

/** In a table: the status is the row's one pill at `xsmall`; severity is an Indicator; a count is a Count. */
export const InRows: Story = {
  render: () => (
    <div style={{ width: 640 }}>
      <Table label="Controls">
        <thead>
          <tr>
            <Table.Header width={96}>Id</Table.Header>
            <Table.Header>Control</Table.Header>
            <Table.Header width={112}>Status</Table.Header>
            <Table.Header width={104}>Severity</Table.Header>
            <Table.Header width={88}>Findings</Table.Header>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Cell>
                <Id>{r.id}</Id>
              </Table.Cell>
              <Table.Cell>{r.name}</Table.Cell>
              <Table.Cell>
                <Badge size="xsmall" tone={r.tone}>
                  {r.status}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Indicator tone={r.sev}>{r.severity}</Indicator>
              </Table.Cell>
              <Table.Cell>{r.findings ? <Count value={r.findings} /> : null}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  ),
};

/** A category is neutral and differs by its word; a status is a tone. The two read differently side by side. */
export const Categories: Story = {
  render: () => (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center">
        <Text size="small" color="color.text.subtle" style={{ width: 96 }}>
          Method
        </Text>
        {["Inspection", "Test", "Analysis", "Demonstration"].map((m) => (
          <Badge key={m}>{m}</Badge>
        ))}
      </Inline>
      <Inline space="space.100" alignBlock="center">
        <Text size="small" color="color.text.subtle" style={{ width: 96 }}>
          Determination
        </Text>
        <Badge tone="success">Satisfied</Badge>
        <Badge tone="warning">Partial</Badge>
        <Badge tone="danger">Other than satisfied</Badge>
        <Badge>Not assessed</Badge>
      </Inline>
    </Stack>
  ),
};

/** The one status that must win is bold; the rest of the view stays subtle. */
export const OneBold: Story = {
  render: () => (
    <Inline space="space.200" alignBlock="center">
      <Text weight="medium">CTRL-0450 Change approval before release</Text>
      <Badge tone="danger" appearance="bold">
        Overdue
      </Badge>
      <Badge>Moderate</Badge>
      <Badge>Inherited</Badge>
    </Inline>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<Badge tone="success">Verified</Badge>}
        doText="One or two words: the state."
        dont={<Badge tone="success">This control was verified by Dana Whitfield on 28 Aug</Badge>}
        dontText="A sentence in a pill. Who and when are facts for the record, not the status."
      />
      <Pair
        do={
          <Inline space="space.100">
            <Badge tone="danger" appearance="bold">
              Overdue
            </Badge>
            <Badge tone="warning">Due soon</Badge>
            <Badge tone="success">Verified</Badge>
          </Inline>
        }
        doText="One bold status in the view, the one that must win."
        dont={
          <Inline space="space.100">
            <Badge tone="danger" appearance="bold">
              Overdue
            </Badge>
            <Badge tone="warning" appearance="bold">
              Due soon
            </Badge>
            <Badge tone="success" appearance="bold">
              Verified
            </Badge>
          </Inline>
        }
        dontText="Everything bold. Nothing wins, and the page is a wall of colour."
      />
      <Pair
        do={
          <Inline space="space.100">
            <Badge>Inspection</Badge>
            <Badge>Test</Badge>
            <Badge>Analysis</Badge>
          </Inline>
        }
        doText="Categories are neutral; the word tells them apart."
        dont={
          <Inline space="space.100">
            <Badge tone="information">Inspection</Badge>
            <Badge tone="success">Test</Badge>
            <Badge tone="warning">Analysis</Badge>
          </Inline>
        }
        dontText="A colour per category, which Carbon allows and this kit does not: here a tone is a status, and a reader would look for what is wrong with Analysis."
      />
      <Pair
        do={
          <TextLink>
            <a href="#component">SVC-PAY-01</a>
          </TextLink>
        }
        doText="Something that takes the reader somewhere is a link."
        dont={
          <Badge onClick={() => undefined} className="cursor-pointer">
            SVC-PAY-01
          </Badge>
        }
        dontText="A badge with a click. It is not focusable, says nothing about where it goes, and Carbon says the same: no tags as links."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: { tone: "success", appearance: "subtle", size: "small", children: "Verified" },
};
