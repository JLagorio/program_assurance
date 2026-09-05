import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Chart, KeyValue, Stat } from "../../components";
import { Box, Inline, Stack } from "../../primitives";
import { byFamily, bySource, statusSeries } from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const coverage = [
  { key: "s", label: "Satisfied", value: 298, tone: "success" as const },
  { key: "p", label: "Partial", value: 40, tone: "warning" as const },
  { key: "o", label: "Other than satisfied", value: 26, tone: "danger" as const },
  { key: "n", label: "Not assessed", value: 8, tone: "neutral" as const },
];
const done = [
  { key: "a", label: "Done", value: 3, tone: "success" as const },
  { key: "b", label: "Left", value: 1, tone: "neutral" as const },
];
const posture = [
  { key: "p", label: "Posture", value: 72, tone: "warning" as const },
  { key: "r", label: "To 100", value: 28, tone: "neutral" as const },
];

const meta = {
  title: "Components/Chart/Donut",
  component: Chart.Donut,
  parameters: { layout: "padded" },
  args: { slices: coverage, label: "80%", caption: "satisfied", name: "Control coverage" },
} satisfies Meta<typeof Chart.Donut>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every ring in both modes: 64, 120 and 160 across; a gauge; one slice on the track; loading. */
export const DonutMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="64 · 120 with a number and a caption · 160 · a gauge">
        <Chart.Donut size={64} thickness={8} name="Done" slices={done} />
        <Chart.Donut label="80%" caption="satisfied" name="Coverage" slices={coverage} />
        <Chart.Donut
          size={160}
          thickness={16}
          label="5"
          caption="open"
          name="Open findings"
          slices={[
            { key: "o", label: "Open", value: 5, tone: "danger" },
            { key: "c", label: "Closed", value: 59, tone: "neutral" },
          ]}
        />
        <Chart.Donut arc="half" size={160} thickness={16} label="72" caption="posture" name="Risk posture" slices={posture} />
      </Specimens>
      <Specimens title="Textured · beside its textured legend">
        <Inline space="space.200" alignBlock="center">
          <Chart.Donut label="80%" caption="satisfied" name="Coverage, textured" slices={coverage} texture />
          <Chart.Legend series={statusSeries} texture />
        </Inline>
      </Specimens>
      <Specimens title="One slice on the track · loading · a gauge loading">
        <Chart.Donut label="62%" caption="assessed" name="Assessed" slices={[{ key: "a", label: "Assessed", value: 62, tone: "brand" }, { key: "r", label: "Left", value: 38, tone: "neutral" }]} />
        <Chart.Donut name="Coverage" slices={coverage} loading />
        <Chart.Donut arc="half" size={160} thickness={16} name="Risk posture" slices={posture} loading />
      </Specimens>
    </Stack>
  ),
};

/** A ring beside its Stat and its legend. The number in the middle is the point; the slices are the parts. */
export const BesideStat: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <Chart.Donut label="80%" caption="satisfied" name="Control coverage" slices={coverage} />
      <Stack space="space.050">
        <Stat label="Controls satisfied" value="298 of 372" />
        <Chart.Legend series={statusSeries} />
      </Stack>
    </Inline>
  ),
};

/** Half a ring is a gauge: a score against a scale, the number at its base, the tone the score earns. No needle: the number is text. */
export const Gauge: Story = {
  render: () => (
    <Inline space="space.600" alignBlock="end">
      <Chart.Donut arc="half" size={200} thickness={20} label="72" caption="risk posture" name="Risk posture" slices={posture} />
      <Chart.Donut
        arc="half"
        size={200}
        thickness={20}
        label="41"
        caption="readiness"
        name="Readiness"
        slices={[
          { key: "p", label: "Readiness", value: 41, tone: "danger" },
          { key: "r", label: "To 100", value: 59, tone: "neutral" },
        ]}
      />
    </Inline>
  ),
};

/** A click on a slice opens its card: the slice, its value and its share of the whole, then the caller's facts. */
export const Details: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <Chart.Donut
        label="80%"
        caption="satisfied"
        name="Control coverage"
        size={160}
        thickness={16}
        slices={coverage}
        details={(s) => (
          <Stack space="space.150">
            <KeyValue label="Families" labelWidth={88}>
              {`${byFamily.filter((f) => f[s.slice.key === "s" ? "satisfied" : s.slice.key === "p" ? "partial" : s.slice.key === "o" ? "other" : "notAssessed"] > 0).length} of 6`}
            </KeyValue>
            <Button size="small" variant="secondary">{`Controls ${s.slice.label.toLowerCase()}`}</Button>
          </Stack>
        )}
      />
      <Chart.Legend series={statusSeries} />
    </Inline>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ width: 200 }}>
            <Stat.Tile label="Open findings" value={5} note="Of 64 raised this year" tone="danger" />
          </Box>
        }
        doText="One number is a Stat. The number is the chart."
        dont={
          <Chart.Donut
            label="5"
            name="Open findings"
            slices={[
              { key: "o", label: "Open", value: 5, tone: "danger" },
              { key: "c", label: "Closed", value: 59, tone: "neutral" },
            ]}
          />
        }
        dontText="A ring of two slices for one number. The ring adds a comparison nobody asked for, and the number was already the point."
      />
      <Pair
        do={
          <Chart title="Findings by source" size="small">
            <Chart.Bar data={bySource} x="source" series={[{ key: "n", label: "Findings", tone: "neutral" }]} horizontal labels="end" size="small" />
          </Chart>
        }
        doText="Five sources compared are bars: the eye reads length far better than angle."
        dont={
          <Inline space="space.200" alignBlock="center">
            <Chart.Donut name="Findings by source" slices={bySource.map((s, i) => ({ key: s.source, label: s.source, value: s.n, tone: `categorical.${(i + 1) as 1 | 2 | 3 | 4 | 5}` as const }))} />
            <Chart.Legend series={bySource.map((s, i) => ({ key: s.source, label: s.source, tone: `categorical.${(i + 1) as 1 | 2 | 3 | 4 | 5}` as const }))} />
          </Inline>
        }
        dontText="Five sources as slices. Which is bigger, ACAS or code scan? Five hues for a question the legend has to answer."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    arc: "full",
    size: 120,
    thickness: 12,
  },
};
