import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../components";
import { Empty } from "../../patterns";
import { Stack } from "../../primitives";

const meta = {
  title: "Patterns/Empty",
  component: Empty,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Empty>;
export default meta;
type Story = StoryObj;

/** Title only, with a description, with an action. */
export const EmptyMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Empty title="No findings" />
      <Empty title="No findings" description="Nothing on this control has been observed yet." />
      <Empty
        title="No findings"
        description="Nothing on this control has been observed yet."
        action={<Button size="small">Record a finding</Button>}
      />
    </Stack>
  ),
};
