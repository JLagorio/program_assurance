import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge, Count, Dot, Indicator, tones } from "../../components";
import { Inline, Stack, Text } from "../../primitives";

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

export const Matrix: Story = {
  render: () => (
    <Stack space="space.300">
      {tones.map((t) => (
        <Inline key={t} space="space.300" alignBlock="center">
          <Text size="xsmall" color="color.text.subtlest" className="w-800">
            {t}
          </Text>
          <Badge tone={t}>{labels[t]}</Badge>
          <Badge tone={t} size="xsmall">
            {labels[t]}
          </Badge>
          <Badge tone={t} appearance="bold">
            {labels[t]}
          </Badge>
          <Badge
            tone={t}
            icon={
              t === "danger" ? (
                <AlertTriangle className="size-150" />
              ) : (
                <CheckCircle2 className="size-150" />
              )
            }
          >
            {labels[t]}
          </Badge>
          <Indicator tone={t}>{labels[t]}</Indicator>
          <Dot tone={t} />
        </Inline>
      ))}
    </Stack>
  ),
};

export const Counts: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <Count value={3} />
      <Count value={12} appearance="primary" />
      <Count value={7} appearance="important" />
      <Count value={4} appearance="added" />
      <Count value={2} appearance="removed" />
      <Count value={140} />
      <Count value={1400} max={999} appearance="primary" />
    </Inline>
  ),
};

export const InContext: Story = {
  render: () => (
    <Stack space="space.200">
      <Inline space="space.200" alignBlock="center">
        <Text weight="medium">CTRL-0412 Segregation of duties, payables</Text>
        <Badge tone="success">Verified</Badge>
        <Count value={3} />
      </Inline>
      <Inline space="space.300" alignBlock="center">
        <Indicator tone="danger">High</Indicator>
        <Indicator tone="warning">Medium</Indicator>
        <Indicator tone="neutral">Low</Indicator>
      </Inline>
    </Stack>
  ),
};

export const Playground: Story = {
  args: { tone: "success", appearance: "subtle", size: "small", children: "Verified" },
};
