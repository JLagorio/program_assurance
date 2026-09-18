import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";

import { PageSkeleton } from "../..";
import { Skeleton, Spinner } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Layout/PageSkeleton",
  component: PageSkeleton,
  parameters: { layout: "padded" },
  args: {},
} satisfies Meta<typeof PageSkeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Three rows and the default eight. */
export const PageSkeletonMatrix: Story = {
  render: () => (
    <Stack space="space.600">
      <PageSkeleton rows={3} />
      <PageSkeleton />
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<PageSkeleton rows={3} />}
        doText="The page's shape before its data: the title, the tabs, the rows land where they will be."
        dont={
          <Box style={{ height: 200 }} className="flex items-center justify-center">
            <Spinner size="large" />
          </Box>
        }
        dontText="A spinner for a page. Nothing says what is coming, and everything arrives at once."
      />
      <Pair
        do={
          <Stack space="space.150" aria-busy>
            <Skeleton shape="heading" width={240} />
            <Skeleton lines={2} />
          </Stack>
        }
        doText="A section that loads on its own draws its own Skeleton, in its own shape."
        dont={
          <Stack space="space.300">
            <Inline space="space.100" alignBlock="center">
              <Text weight="semibold">Control coverage</Text>
              <Text size="small" color="color.text.subtle">
                loaded
              </Text>
            </Inline>
            <PageSkeleton rows={2} />
          </Stack>
        }
        dontText="The page skeleton under a section that has loaded. It draws a second title and a tab strip that the page does not have."
      />
    </Stack>
  ),
};

export const Playground: Story = {};

/** The page's shape on a small phone: the head's lines follow the width and nothing runs past the window. */
export const Narrow: Story = {
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  tags: ["narrow"],
  render: () => <PageSkeleton rows={4} />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    const skeleton = within(canvasElement).getByRole("status");
    for (const line of Array.from(skeleton.querySelectorAll<HTMLElement>("[data-slot=skeleton]"))) {
      await expect(line.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    }
  },
};
