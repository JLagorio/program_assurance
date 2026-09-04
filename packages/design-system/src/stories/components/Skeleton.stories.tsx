import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "../../components";
import { Inline, Stack } from "../../primitives";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj;

/** Line counts and a shaped one. */
export const SkeletonMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="w-layout-list">
      <Skeleton lines={1} />
      <Skeleton lines={3} />
      <Inline space="space.150" alignBlock="center">
        <Skeleton className="size-control-medium rounded-full" />
        <Skeleton lines={2} className="flex-1" />
      </Inline>
    </Stack>
  ),
};
