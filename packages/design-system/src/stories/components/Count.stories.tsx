import type { Meta, StoryObj } from "@storybook/react-vite";

import { Count } from "../../components";
import { Inline } from "../../primitives";

const meta = {
  title: "Components/Count",
  component: Count,
  parameters: { layout: "padded" },
  args: { value: 3 },
} satisfies Meta<typeof Count>;
export default meta;
type Story = StoryObj<typeof meta>;

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
