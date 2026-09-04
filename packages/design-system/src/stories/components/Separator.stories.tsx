import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "../../components";
import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj;

/** Horizontal and vertical. */
export const SeparatorMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Separator />
      <Inline space="space.200" alignBlock="center" className="h-control-medium">
        <Text>Left</Text>
        <Separator orientation="vertical" />
        <Text>Right</Text>
      </Inline>
    </Stack>
  ),
};
