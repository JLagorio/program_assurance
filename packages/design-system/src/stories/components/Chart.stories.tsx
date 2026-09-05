import type { Meta, StoryObj } from "@storybook/react-vite";

import { Chart, Stat, type ChartSeries } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Chart",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const byFamily = [
  { family: "AC", satisfied: 34, partial: 5, other: 7 },
  { family: "AU", satisfied: 18, partial: 4, other: 3 },
  { family: "CM", satisfied: 23, partial: 4, other: 5 },
  { family: "IA", satisfied: 22, partial: 1, other: 3 },
  { family: "SC", satisfied: 40, partial: 6, other: 4 },
  { family: "SI", satisfied: 29, partial: 3, other: 2 },
];
const statusSeries: ChartSeries[] = [
  { key: "satisfied", label: "Satisfied", tone: "success" },
  { key: "partial", label: "Partial", tone: "warning" },
  { key: "other", label: "Other than satisfied", tone: "danger" },
];

const byMonth = Array.from({ length: 9 }, (_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"][i],
  open: [14, 17, 15, 19, 12, 11, 9, 8, 5][i],
  closed: [3, 5, 8, 6, 11, 9, 7, 6, 4][i],
}));
const findingSeries: ChartSeries[] = [
  { key: "open", label: "Open", tone: "danger" },
  { key: "closed", label: "Closed", tone: "neutral" },
];

const bySource = [
  { source: "STIG checklist", n: 41 },
  { source: "ACAS scan", n: 27 },
  { source: "Code scan", n: 19 },
  { source: "Manual procedure", n: 12 },
  { source: "Test event", n: 6 },
];

/** Findings by source, one categorical series. */
export const Bars: Story = {
  render: () => (
    <Stack space="space.100">
      <Text weight="medium">Findings by source</Text>
      <Chart.Bar
        data={bySource}
        x="source"
        series={[{ key: "n", label: "Findings", tone: "brand" }]}
      />
    </Stack>
  ),
};

/** Coverage by family, three status series stacked; the legend sits above. */
export const Stacked: Story = {
  render: () => (
    <Stack space="space.100">
      <Inline spread="space-between" alignBlock="center">
        <Text weight="medium">Coverage by control family</Text>
        <Chart.Legend series={statusSeries} />
      </Inline>
      <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked />
    </Stack>
  ),
};

/** Open and closed findings over nine months. */
export const LinesStory: Story = {
  name: "Lines",
  render: () => (
    <Stack space="space.100">
      <Inline spread="space-between" alignBlock="center">
        <Text weight="medium">Findings over time</Text>
        <Chart.Legend series={findingSeries} />
      </Inline>
      <Chart.Line data={byMonth} x="month" series={findingSeries} />
    </Stack>
  ),
};

/** A ring with the number in the middle, beside a stat. */
export const DonutStory: Story = {
  name: "Donut",
  render: () => (
    <Inline space="space.400" alignBlock="center">
      <Chart.Donut
        label="80%"
        slices={[
          { key: "s", label: "Satisfied", value: 298, tone: "success" },
          { key: "p", label: "Partial", value: 40, tone: "warning" },
          { key: "o", label: "Other than satisfied", value: 26, tone: "danger" },
          { key: "n", label: "Not assessed", value: 8, tone: "neutral" },
        ]}
      />
      <Stack space="space.050">
        <Stat label="Controls satisfied" value="298 of 372" />
        <Chart.Legend series={statusSeries} />
      </Stack>
    </Inline>
  ),
};

/** A sparkline in a tile. */
export const SparklineStory: Story = {
  name: "Sparkline",
  render: () => (
    <Box style={{ width: 640 }}>
      <Stat.Grid cols={3}>
        <Stat.Tile
          label="Open findings"
          value={
            <Inline space="space.150" alignBlock="center">
              <span>5</span>
              <Chart.Sparkline data={byMonth} y="open" tone="danger" />
            </Inline>
          }
          note="Down from 14 in January"
        />
        <Stat.Tile
          label="Closed this year"
          value={
            <Inline space="space.150" alignBlock="center">
              <span>59</span>
              <Chart.Sparkline data={byMonth} y="closed" tone="success" />
            </Inline>
          }
        />
        <Stat.Tile label="Coverage" value="80%" note="298 of 372" />
      </Stat.Grid>
    </Box>
  ),
};

/** Every chart kind, in both modes: bars, stacked bars, horizontal bars, lines, areas, a donut, a sparkline, and the categorical set. */
export const ChartMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Bar · one series, brand">
        <Box className="w-full">
          <Chart.Bar
            data={bySource}
            x="source"
            series={[{ key: "n", label: "Findings", tone: "brand" }]}
            height={160}
          />
        </Box>
      </Specimens>
      <Specimens title="Bar · stacked, status tones">
        <Box className="w-full">
          <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked height={160} />
        </Box>
      </Specimens>
      <Specimens title="Bar · horizontal">
        <Box className="w-full">
          <Chart.Bar
            data={bySource}
            x="source"
            series={[{ key: "n", label: "Findings", tone: "neutral" }]}
            horizontal
            height={180}
          />
        </Box>
      </Specimens>
      <Specimens title="Line">
        <Box className="w-full">
          <Chart.Line data={byMonth} x="month" series={findingSeries} height={160} />
        </Box>
      </Specimens>
      <Specimens title="Area · stacked">
        <Box className="w-full">
          <Chart.Area data={byMonth} x="month" series={findingSeries} stacked height={160} />
        </Box>
      </Specimens>
      <Specimens title="Donut · sizes">
        <Chart.Donut
          size={64}
          thickness={8}
          slices={[
            { key: "a", label: "Done", value: 3, tone: "success" },
            { key: "b", label: "Left", value: 1, tone: "neutral" },
          ]}
        />
        <Chart.Donut
          label="80%"
          slices={[
            { key: "s", label: "Satisfied", value: 298, tone: "success" },
            { key: "p", label: "Partial", value: 40, tone: "warning" },
            { key: "o", label: "Other", value: 26, tone: "danger" },
            { key: "n", label: "Not assessed", value: 8, tone: "neutral" },
          ]}
        />
        <Chart.Donut
          size={160}
          thickness={16}
          label="5"
          slices={[
            { key: "o", label: "Open", value: 5, tone: "danger" },
            { key: "c", label: "Closed", value: 59, tone: "neutral" },
          ]}
        />
      </Specimens>
      <Specimens title="Sparkline · tones">
        <Chart.Sparkline data={byMonth} y="open" tone="brand" />
        <Chart.Sparkline data={byMonth} y="open" tone="danger" />
        <Chart.Sparkline data={byMonth} y="closed" tone="success" />
        <Chart.Sparkline data={byMonth} y="closed" tone="neutral" width={160} height={32} />
      </Specimens>
      <Specimens title="Categorical set">
        <Chart.Legend
          series={Array.from({ length: 8 }, (_, i) => ({
            key: String(i + 1),
            label: `Series ${i + 1}`,
          }))}
        />
      </Specimens>
    </Stack>
  ),
};
