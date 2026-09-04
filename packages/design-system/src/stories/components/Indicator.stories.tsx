import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Count, Dot, Indicator, tones } from "../../components";
import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Indicator",
  component: Indicator,
  parameters: { layout: "padded" },
  args: { children: "High", tone: "danger" },
} satisfies Meta<typeof Indicator>;
export default meta;
type Story = StoryObj<typeof meta>;

const labels = {
  neutral: "Draft",
  information: "In review",
  success: "Verified",
  warning: "Due soon",
  danger: "Overdue",
} as const;

/** Indicator and Dot in every tone. */
export const IndicatorMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      {tones.map((t) => (
        <Inline key={t} space="space.300" alignBlock="center">
          <Text size="xsmall" color="color.text.subtlest" className="w-800">
            {t}
          </Text>
          <Indicator tone={t}>{labels[t]}</Indicator>
          <Dot tone={t} />
        </Inline>
      ))}
    </Stack>
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
