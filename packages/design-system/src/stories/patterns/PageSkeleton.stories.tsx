import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageSkeleton } from "../../patterns";
import { Stack } from "../../primitives";

const meta = {
  title: "Patterns/PageSkeleton",
  component: PageSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageSkeleton>;
export default meta;
type Story = StoryObj;

/** Three rows and the default eight. */
export const PageSkeletonMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <PageSkeleton rows={3} />
      <PageSkeleton />
    </Stack>
  ),
};
