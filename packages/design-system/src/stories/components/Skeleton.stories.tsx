import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton, Spinner } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
  args: {},
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The four shapes, lines by count, and three things waiting: a record head, a row of a list, a card with a chart. */
export const SkeletonMatrix: Story = {
  tags: ["contract"],
  render: () => (
    <Stack space="space.400">
      <Specimens title="Shapes: line, heading, circle, block">
        <Box style={{ width: 200 }}>
          <Skeleton />
        </Box>
        <Box style={{ width: 200 }}>
          <Skeleton shape="heading" />
        </Box>
        <Skeleton shape="circle" />
        <Skeleton shape="circle" width={24} />
        <Skeleton shape="block" width={200} height={64} />
      </Specimens>
      <Specimens title="Lines: 1, 2, 3">
        <Box style={{ width: 200 }}>
          <Skeleton lines={1} />
        </Box>
        <Box style={{ width: 200 }}>
          <Skeleton lines={2} />
        </Box>
        <Box style={{ width: 200 }}>
          <Skeleton lines={3} />
        </Box>
      </Specimens>
      <Specimens title="What is coming: a record head, a list row, a card with a chart">
        <Box style={{ width: 320 }} aria-busy>
          <Stack space="space.150">
            <Skeleton width={72} />
            <Skeleton shape="heading" width={240} />
            <Skeleton lines={2} />
          </Stack>
        </Box>
        <Box style={{ width: 320 }} aria-busy>
          <Inline space="space.150" alignBlock="center">
            <Skeleton shape="circle" width={24} />
            <Box className="flex-1">
              <Stack space="space.100">
                <Skeleton width={180} />
                <Skeleton width={120} />
              </Stack>
            </Box>
            <Skeleton width={48} />
          </Inline>
        </Box>
        <Box
          style={{ width: 320 }}
          padding="space.200"
          className="rounded-medium border border-default"
          aria-busy
        >
          <Stack space="space.200">
            <Skeleton shape="heading" width={160} />
            <Skeleton shape="block" height={120} />
            <Inline space="space.150">
              <Skeleton width={64} />
              <Skeleton width={64} />
              <Skeleton width={64} />
            </Inline>
          </Stack>
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ width: 320 }} aria-busy>
            <Stack space="space.150">
              <Skeleton shape="heading" width={200} />
              <Skeleton lines={3} />
            </Stack>
          </Box>
        }
        doText="A page or a section that is loading holds its shape: the reader knows what is coming and nothing jumps."
        dont={
          <Box style={{ width: 320, height: 84 }} className="flex items-center justify-center">
            <Spinner size="large" />
          </Box>
        }
        dontText="A spinner where content will be. The layout arrives all at once and shifts. Skeletons for progressive loads, a spinner for an action."
      />
      <Pair
        do={
          <Box style={{ width: 320 }} aria-busy>
            <Inline space="space.150" alignBlock="center">
              <Skeleton shape="circle" width={24} />
              <Box className="flex-1">
                <Skeleton lines={2} />
              </Box>
            </Inline>
          </Box>
        }
        doText="The shape of what is coming: a circle where the avatar will be, lines where the text will."
        dont={
          <Box style={{ width: 320 }}>
            <Skeleton shape="block" height={44} />
          </Box>
        }
        dontText="One grey block for a row. It says something is loading and nothing about what."
      />
      <Pair
        do={
          <Box style={{ width: 320 }} aria-busy>
            <Stack space="space.100">
              <Skeleton width={240} />
              <Skeleton width={180} />
            </Stack>
          </Box>
        }
        doText="Lines about as long as the text will be."
        dont={
          <Box style={{ width: 320 }}>
            <Stack space="space.100">
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </Stack>
          </Box>
        }
        dontText="Six full lines for a two-line note. The skeleton promises more than arrives, and the page shrinks when it does."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
