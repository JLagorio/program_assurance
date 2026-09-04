import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress, tones } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: { layout: "padded" },
  args: { value: 64 },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Bars: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-[480px]">
      {tones.map((t) => (
        <Inline key={t} space="space.300" alignBlock="center">
          <Text size="xsmall" color="color.text.subtlest" className="w-800">
            {t}
          </Text>
          <Progress value={t === "neutral" ? 20 : 64} tone={t} />
        </Inline>
      ))}
      <Progress.Stacked
        segments={[
          { key: "verified", value: 41, tone: "success", title: "41 verified" },
          { key: "review", value: 12, tone: "information", title: "12 in review" },
          { key: "due", value: 6, tone: "warning", title: "6 due" },
          { key: "overdue", value: 3, tone: "danger", title: "3 overdue" },
          { key: "todo", value: 18, tone: "neutral", title: "18 not started" },
        ]}
      />
    </Stack>
  ),
};

/** Every tone at three values, and the stacked bar at two heights. */
export const ProgressMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={tones}
        cols={["0", "40", "100"] as const}
        rowLabel="tone"
        render={(tone, v) => (
          <Box style={{ width: 160 }}>
            <Progress value={Number(v)} tone={tone} />
          </Box>
        )}
      />
      <Specimens title="Stacked">
        <Box style={{ width: 320 }}>
          <Progress.Stacked
            segments={[
              { key: "s", value: 298, tone: "success", title: "Satisfied" },
              { key: "p", value: 40, tone: "warning", title: "Partial" },
              { key: "o", value: 26, tone: "danger", title: "Other than satisfied" },
              { key: "n", value: 8, tone: "neutral", title: "Not assessed" },
            ]}
          />
        </Box>
        <Box style={{ width: 320 }}>
          <Progress.Stacked
            segments={[
              { key: "m", value: 12, tone: "success", title: "Met" },
              { key: "x", value: 3, tone: "danger", title: "Not met" },
              { key: "r", value: 5, tone: "information", title: "Not run" },
              { key: "u", value: 9, tone: "neutral", appearance: "hatched", title: "Not covered" },
            ]}
          />
        </Box>
        <Box style={{ width: 320 }}>
          <Progress.Stacked
            height={4}
            segments={[
              { key: "s", value: 3, tone: "success" },
              { key: "o", value: 1, tone: "danger" },
            ]}
          />
        </Box>
      </Specimens>
    </Stack>
  ),
};
