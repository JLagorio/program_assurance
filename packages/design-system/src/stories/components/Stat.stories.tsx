import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stat, Tiles, tones } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Stat",
  component: Stat,
  parameters: { layout: "padded" },
  args: { label: "Open findings", value: 17 },
} satisfies Meta<typeof Stat>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Stats: Story = {
  render: () => (
    <Stack space="space.400">
      <Tiles cols={4}>
        <Stat.Tile label="Controls" value={80} note="Across 6 families" />
        <Stat.Tile label="Verified" value={41} tone="success" note="51% of scope" />
        <Stat.Tile label="Overdue" value={3} tone="danger" note="Oldest 12 days" />
        <Stat.Tile label="Blocked" value={0} note="Nothing waiting on you" />
      </Tiles>
      <Tiles cols={3} frame="band">
        <Stat.Tile label="Evidence items" value={214} />
        <Stat.Tile label="Expiring" value={9} tone="warning" />
        <Stat.Tile label="Assessors" value={5} />
      </Tiles>
      <Inline space="space.600">
        <Stat label="Open findings" value={17} />
        <Stat label="Critical" value={2} tone="danger" />
        <Stat label="Closed this month" value={31} tone="success" />
      </Inline>
    </Stack>
  ),
};

/** Stat and Stat.Tile in every tone; Tiles as a card and as a band. */
export const StatMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={tones}
        cols={["Stat", "Tile"] as const}
        rowLabel="tone"
        render={(tone, col) =>
          col === "Stat" ? (
            <Stat label="Open findings" value={5} tone={tone} />
          ) : (
            <Box style={{ width: 200 }}>
              <Stat.Tile label="Open findings" value={5} note="1 CAT I" tone={tone} />
            </Box>
          )
        }
      />
      <Specimens title="Tiles · card, 3 columns">
        <Box style={{ width: 600 }}>
          <Tiles cols={3}>
            <Stat.Tile label="Coverage" value="80%" note="298 of 372" tone="success" />
            <Stat.Tile
              label="Not satisfied"
              value={74}
              note="26 other · 40 partial"
              tone="warning"
            />
            <Stat.Tile label="Open findings" value={5} note="1 CAT I" tone="danger" />
          </Tiles>
        </Box>
      </Specimens>
      <Specimens title="Tiles · band, 4 columns">
        <Box style={{ width: 600 }}>
          <Tiles cols={4} frame="band">
            <Stat.Tile label="Coverage" value="80%" />
            <Stat.Tile label="Not satisfied" value={74} />
            <Stat.Tile label="Open findings" value={5} />
            <Stat.Tile label="Gates" value={5} note="Next: MS-C" />
          </Tiles>
        </Box>
      </Specimens>
      <Text size="xsmall" color="color.text.subtlest">
        A tone on a stat is data: the number is a status. Neutral is the default and most numbers
        stay neutral.
      </Text>
    </Stack>
  ),
};
