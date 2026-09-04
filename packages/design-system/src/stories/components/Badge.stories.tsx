import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge, tones } from "../../components";
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
        </Inline>
      ))}
    </Stack>
  ),
};

export const Playground: Story = {
  args: { tone: "success", appearance: "subtle", size: "small", children: "Verified" },
};
