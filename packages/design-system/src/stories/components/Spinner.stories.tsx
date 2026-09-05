import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download } from "lucide-react";
import { useState } from "react";

import { Button, IconButton, Skeleton, Spinner } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: { layout: "padded" },
  args: {},
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Three sizes by appearance; then where each sits: beside a word, in a button, on its own in a row, centred in an empty section. */
export const SpinnerMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Matrix
        rows={["subtle", "inverse", "inherit"] as const}
        cols={["small", "medium", "large"] as const}
        rowLabel="appearance"
        render={(appearance, size) =>
          appearance === "inverse" ? (
            <Box
              backgroundColor="color.background.brand.bold"
              padding="space.100"
              className="inline-flex rounded-medium"
            >
              <Spinner size={size} appearance={appearance} />
            </Box>
          ) : appearance === "inherit" ? (
            <Text color="color.text.danger">
              <Spinner size={size} appearance="inherit" />
            </Text>
          ) : (
            <Spinner size={size} />
          )
        }
      />
      <Specimens title="Beside a word, in a button, on its own in a row, in an icon button">
        <Inline space="space.075" alignBlock="center">
          <Spinner label="Saving" />
          <Text size="small" color="color.text.subtle">
            Saving…
          </Text>
        </Inline>
        <Button size="small" isLoading iconBefore={<Download />}>
          Export
        </Button>
        <Spinner size="medium" label="Refreshing" />
        <IconButton label="Refresh" icon={<Download />} isLoading />
      </Specimens>
      <Specimens title="Centred in a section that is empty while it loads">
        <Box
          style={{ width: 360, height: 120 }}
          className="flex items-center justify-center rounded-medium border border-default"
        >
          <Spinner size="large" label="Loading the register" />
        </Box>
      </Specimens>
    </Stack>
  ),
};

function Delayed() {
  const [n, setN] = useState(0);
  return (
    <Stack space="space.200">
      <Inline space="space.100" alignBlock="center">
        <Button size="small" onClick={() => setN((v) => v + 1)}>
          Load again
        </Button>
        <Text size="small" color="color.text.subtle">
          The spinner appears 300ms after the button, so a load that finishes first never shows one.
        </Text>
      </Inline>
      <Inline space="space.100" alignBlock="center">
        <Box style={{ width: 24, height: 24 }} className="flex items-center justify-center">
          <Spinner key={n} size="medium" delay={300} />
        </Box>
        <Text size="small" color="color.text.subtle">
          {n === 0 ? "Waiting for the first load." : `Load ${n}.`}
        </Text>
      </Inline>
    </Stack>
  );
}

/** A spinner that waits before it shows, so a fast load never flashes one. */
export const DelayStory: Story = { name: "Delay", render: () => <Delayed /> };

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
        doText="A page or a section that is loading is a Skeleton: the layout holds still."
        dont={
          <Box style={{ width: 320, height: 84 }} className="flex items-center justify-center">
            <Spinner size="large" />
          </Box>
        }
        dontText="A spinner for a page. The reader learns nothing about what is coming, and it all arrives at once."
      />
      <Pair
        do={
          <Button size="small" isLoading>
            Export
          </Button>
        }
        doText="One spinner, on the thing that is working."
        dont={
          <Inline space="space.200" alignBlock="center">
            <Spinner />
            <Spinner size="medium" />
            <Spinner size="large" />
          </Inline>
        }
        dontText="Several spinners at once. One: the page is either working or it is not."
      />
      <Pair
        do={
          <Inline space="space.075" alignBlock="center">
            <Spinner label="Saving" />
            <Text size="small" color="color.text.subtle">
              Saving…
            </Text>
          </Inline>
        }
        doText="The label says what the wait is, in the word beside it."
        dont={
          <Inline space="space.075" alignBlock="center">
            <Spinner />
            <Text size="small" color="color.text.subtle">
              Saving…
            </Text>
          </Inline>
        }
        dontText="“Loading” read out beside “Saving”. Two words for one wait."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
