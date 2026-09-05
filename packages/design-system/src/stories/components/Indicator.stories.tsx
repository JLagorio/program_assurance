import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Dot, Id, Indicator, Table, tones } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Indicator",
  component: Indicator,
  parameters: { layout: "padded" },
  args: { children: "High", tone: "danger" },
} satisfies Meta<typeof Indicator>;
export default meta;
type Story = StoryObj<typeof meta>;

const labels = {
  neutral: "Low",
  information: "Informational",
  success: "Healthy",
  warning: "Medium",
  danger: "High",
} as const;

/** Every tone as an Indicator, a bare Dot, and a Dot that says its name. */
export const IndicatorMatrix: Story = {
  render: () => (
    <Grid
      rows={tones}
      cols={["Indicator", "Dot", "Dot with a label"] as const}
      rowLabel="tone"
      render={(tone, col) =>
        col === "Indicator" ? (
          <Indicator tone={tone}>{labels[tone]}</Indicator>
        ) : col === "Dot" ? (
          <Dot tone={tone} />
        ) : (
          <Dot tone={tone} label={labels[tone]} />
        )
      }
    />
  ),
};

const rows = [
  {
    id: "F-0231",
    title: "Shared admin account on the payables host",
    severity: "High",
    sev: "danger",
    status: "Open",
    tone: "danger",
  },
  {
    id: "F-0228",
    title: "Backup restore untested this quarter",
    severity: "Medium",
    sev: "warning",
    status: "In remediation",
    tone: "information",
  },
  {
    id: "F-0219",
    title: "Expired certificate on the reporting proxy",
    severity: "Low",
    sev: "neutral",
    status: "Closed",
    tone: "success",
  },
] as const;

/** In a table: severity is the Indicator, status the row's one pill. */
export const InRows: Story = {
  render: () => (
    <div style={{ width: 640 }}>
      <Table label="Findings">
        <thead>
          <tr>
            <Table.Header width={88}>Id</Table.Header>
            <Table.Header>Finding</Table.Header>
            <Table.Header width={104}>Severity</Table.Header>
            <Table.Header width={128}>Status</Table.Header>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Cell>
                <Id>{r.id}</Id>
              </Table.Cell>
              <Table.Cell>{r.title}</Table.Cell>
              <Table.Cell>
                <Indicator tone={r.sev}>{r.severity}</Indicator>
              </Table.Cell>
              <Table.Cell>
                <Badge size="xsmall" tone={r.tone}>
                  {r.status}
                </Badge>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  ),
};

/** An Indicator truncates its word when the column is narrower than it; the Dot never shrinks. */
export const Truncation: Story = {
  render: () => (
    <Stack space="space.150">
      <Box style={{ width: 160 }} className="border border-default px-100 py-050">
        <Indicator tone="danger">Obligation not stated by the consumer</Indicator>
      </Box>
      <Box style={{ width: 160 }} className="border border-default px-100 py-050">
        <Indicator tone="warning">Medium</Indicator>
      </Box>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.200" alignBlock="center">
            <Indicator tone="danger">High</Indicator>
            <Badge tone="danger">Open</Badge>
          </Inline>
        }
        doText="Severity as an Indicator, status as the row's one pill."
        dont={
          <Inline space="space.100" alignBlock="center">
            <Badge tone="danger">High</Badge>
            <Badge tone="danger">Open</Badge>
          </Inline>
        }
        dontText="Two pills in a row. The eye cannot tell the rank from the state."
      />
      <Pair
        do={<Dot tone="warning" label="Suspect" />}
        doText="A Dot alone says its name, so a screen reader hears the status too."
        dont={<Dot tone="warning" />}
        dontText="A bare Dot in a cell. Colour alone, and nothing for a screen reader."
      />
      <Pair
        do={<Badge tone="success">Verified</Badge>}
        doText="A record's state is a Badge."
        dont={<Indicator tone="success">Verified</Indicator>}
        dontText="A state as an Indicator. The Dot ranks; it does not name a stage."
      />
      <Pair
        do={
          <Inline space="space.300" alignBlock="center">
            <Indicator tone="danger">High</Indicator>
            <Indicator tone="warning">Medium</Indicator>
            <Indicator tone="neutral">Low</Indicator>
          </Inline>
        }
        doText="The lowest rung is neutral and muted, so the scale reads from loud to quiet."
        dont={
          <Inline space="space.300" alignBlock="center">
            <Indicator tone="danger">High</Indicator>
            <Indicator tone="warning">Medium</Indicator>
            <Indicator tone="success">Low</Indicator>
          </Inline>
        }
        dontText="Low in success green. A low severity is not good news; it is a small problem."
      />
      <Text size="xsmall" color="color.text.subtlest">
        The bare Dot in the second pair is the don't, so it has no name on purpose.
      </Text>
    </Stack>
  ),
};

export const Playground: Story = {};
