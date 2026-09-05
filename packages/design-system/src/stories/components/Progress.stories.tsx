import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Progress, tones } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Progress",
  component: Progress,
  parameters: { layout: "padded" },
  args: { value: 64 },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

const coverage = [
  { key: "s", value: 298, tone: "success", title: "298 satisfied" },
  { key: "p", value: 40, tone: "warning", title: "40 partial" },
  { key: "o", value: 26, tone: "danger", title: "26 other than satisfied" },
  { key: "n", value: 8, tone: "neutral", title: "8 not assessed" },
] as const;

/** Every tone at three values; the three sizes; the read-out; the stacked bar. */
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
      <Specimens title="Sizes · small 4px, medium 6px, large 8px">
        {(["small", "medium", "large"] as const).map((size) => (
          <Box key={size} style={{ width: 240 }}>
            <Progress value={64} size={size} />
          </Box>
        ))}
      </Specimens>
      <Specimens title="With the value">
        <Box style={{ width: 240 }}>
          <Progress value={64} showValue />
        </Box>
        <Box style={{ width: 240 }}>
          <Progress value={51} tone="success" showValue valueText="41 of 80" />
        </Box>
        <Box style={{ width: 240 }}>
          <Progress value={64} label="Assessment progress" showValue valueText="64% complete" />
        </Box>
      </Specimens>
      <Specimens title="Stacked · large, medium, small, hatched">
        <Box style={{ width: 320 }}>
          <Progress.Stacked label="Control coverage" segments={[...coverage]} />
        </Box>
        <Box style={{ width: 320 }}>
          <Progress.Stacked size="medium" segments={[...coverage]} />
        </Box>
        <Box style={{ width: 320 }}>
          <Progress.Stacked
            size="small"
            segments={[
              { key: "s", value: 3, tone: "success" },
              { key: "o", value: 1, tone: "danger" },
            ]}
          />
        </Box>
        <Box style={{ width: 320 }}>
          <Progress.Stacked
            label="Requirement coverage"
            segments={[
              { key: "m", value: 12, tone: "success", title: "12 met" },
              { key: "x", value: 3, tone: "danger", title: "3 not met" },
              { key: "r", value: 5, tone: "information", title: "5 not run" },
              {
                key: "u",
                value: 9,
                tone: "neutral",
                appearance: "hatched",
                title: "9 not covered",
              },
            ]}
          />
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** The bar and the number beside it: `showValue` prints the percentage at a fixed minimum width, so a column of bars lines up; `valueText` says something else. */
export const WithValue: Story = {
  render: () => (
    <Stack space="space.150" className="max-w-[360px]">
      {[
        ["Access control", 100, "success"],
        ["Audit and accountability", 72, "information"],
        ["Configuration management", 9, "danger"],
        ["Incident response", 40, "warning"],
      ].map(([name, value, tone]) => (
        <Inline key={String(name)} space="space.150" alignBlock="center">
          <Text
            size="small"
            color="color.text.subtle"
            className="shrink-0 truncate"
            style={{ width: 160 }}
          >
            {name}
          </Text>
          <Progress
            value={Number(value)}
            tone={tone as (typeof tones)[number]}
            label={`${String(name)} coverage`}
            showValue
          />
        </Inline>
      ))}
      <Inline space="space.150" alignBlock="center">
        <Text
          size="small"
          color="color.text.subtle"
          className="shrink-0 truncate"
          style={{ width: 160 }}
        >
          Remediation
        </Text>
        <Progress value={64} tone="success" showValue valueText="64% complete" />
      </Inline>
    </Stack>
  ),
};

function Filtering() {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <Stack space="space.100" className="max-w-[420px]">
      <Progress.Stacked
        label="Control coverage"
        segments={coverage.map((s) => ({ ...s, onClick: () => setChosen(s.key) }))}
      />
      <Text size="small" color="color.text.subtle">
        {chosen
          ? `Showing ${coverage.find((s) => s.key === chosen)?.title ?? chosen}.`
          : "Click a segment to filter the rows under the bar."}
      </Text>
    </Stack>
  );
}

/** A stacked bar whose segments are buttons: each filters the register under it. */
export const Stacked: Story = { render: () => <Filtering /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ width: 280 }}>
            <Progress value={64} label="Assessment progress" showValue />
          </Box>
        }
        doText="The number beside the bar, or a label: something says what the bar measures and how much."
        dont={
          <Box style={{ width: 280 }}>
            <Progress value={64} />
          </Box>
        }
        dontText="A bar alone. Sixty-four percent of what, and how much is that? Hidden from a screen reader, too."
      />
      <Pair
        do={
          <Stack space="space.100" style={{ width: 280 }}>
            <Progress value={100} tone="success" showValue />
            <Progress value={72} showValue />
            <Progress value={9} tone="danger" showValue />
          </Stack>
        }
        doText="A tone is a status: complete in success, failing in danger, the rest blue."
        dont={
          <Stack space="space.100" style={{ width: 280 }}>
            <Progress value={100} tone="warning" showValue />
            <Progress value={72} tone="success" showValue />
            <Progress value={9} tone="information" showValue />
          </Stack>
        }
        dontText="Tones as decoration. The reader looks for the meaning of the colours and there is none."
      />
      <Pair
        do={
          <Box style={{ width: 280 }}>
            <Progress.Stacked label="Control coverage" segments={[...coverage]} />
          </Box>
        }
        doText="Parts of one whole are one stacked bar."
        dont={
          <Stack space="space.100" style={{ width: 280 }}>
            <Progress value={80} tone="success" showValue valueText="298 satisfied" />
            <Progress value={11} tone="warning" showValue valueText="40 partial" />
            <Progress value={7} tone="danger" showValue valueText="26 other" />
          </Stack>
        }
        dontText="One bar per part. The reader adds them up; the bar was supposed to."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
