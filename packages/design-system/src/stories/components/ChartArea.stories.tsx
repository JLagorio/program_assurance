import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Chart, KeyValue } from "../../components";
import { Box, Stack } from "../../primitives";
import { assessors, byAssessor, byMonth, findingSeries } from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Chart/Area",
  component: Chart.Area,
  parameters: { layout: "padded" },
  args: { data: byMonth, x: "month", series: findingSeries, label: "Findings over time" },
} satisfies Meta<typeof Chart.Area>;
export default meta;
type Story = StoryObj<typeof meta>;

const open = [{ key: "open", label: "Open", tone: "brand" as const }];

/** Every area in both modes: one series, stacked, smooth with end labels; cropped, with a band, the skeleton. */
export const AreaMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="One series · stacked · smooth with end labels">
        <Box style={{ width: 300 }}>
          <Chart.Area data={byMonth} x="month" series={open} size="small" label="Open findings" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Area data={byMonth} x="month" series={findingSeries} stacked size="small" label="Findings, stacked" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Area data={byMonth} x="month" series={findingSeries} curve="smooth" labels="end" size="small" label="Findings over time" />
        </Box>
      </Specimens>
      <Specimens title="Baseline auto · a band and a limit · loading">
        <Box style={{ width: 300 }}>
          <Chart.Area data={byMonth} x="month" series={[{ key: "assessed", label: "Assessed", tone: "brand" }]} baseline="auto" size="small" label="Controls assessed" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Area
            data={byMonth}
            x="month"
            series={open}
            bands={[{ from: 0, to: 8, label: "Tolerable" }]}
            reference={[{ y: 15, label: "Limit", tone: "danger" }]}
            size="small"
            label="Open findings against the limit"
          />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Area data={byMonth} x="month" series={findingSeries} stacked size="small" label="Findings over time" loading />
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** One series with a wash under it: the wash says "how much" where a line alone says "which way". The hue at 12%. */
export const Single: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Open findings" description="At the end of each month, this year" series={open} data={byMonth} x="month" xLabel="Month">
        <Chart.Area data={byMonth} x="month" series={open} labels="end" />
      </Chart>
    </Box>
  ),
};

/** Stacked areas: parts of a whole over time. The tooltip totals the stack. */
export const Stacked: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Findings, open and closed" description="Parts of the month's total" series={findingSeries} data={byMonth} x="month" xLabel="Month">
        <Chart.Area data={byMonth} x="month" series={findingSeries} stacked />
      </Chart>
    </Box>
  ),
};

/** A click in a month's column opens its card, as on a Line. */
export const Details: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Findings, open and closed" description="Click a month" series={findingSeries} data={byMonth} x="month" xLabel="Month">
        <Chart.Area
          data={byMonth}
          x="month"
          series={findingSeries}
          stacked
          details={(s) => (
            <Stack space="space.150">
              <KeyValue label="Total" labelWidth={88}>
                {String(Number(s.datum["open"]) + Number(s.datum["closed"]))}
              </KeyValue>
              <Button size="small" variant="secondary">{`Findings in ${String(s.datum["month"])}`}</Button>
            </Stack>
          )}
        />
      </Chart>
    </Box>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Chart title="Reviews by assessor" series={assessors.slice(0, 3)} swatch="line" size="small">
            <Chart.Line data={byAssessor} x="week" series={assessors.slice(0, 3)} size="small" />
          </Chart>
        }
        doText="Series that are not parts of one whole are lines: each reads on its own against the axis."
        dont={
          <Chart title="Reviews by assessor" series={assessors.slice(0, 3)} size="small">
            <Chart.Area data={byAssessor} x="week" series={assessors.slice(0, 3)} stacked size="small" />
          </Chart>
        }
        dontText="Three assessors stacked. The top of the stack is a number nobody asked for, and the middle series has no baseline to read against."
      />
      <Pair
        do={
          <Chart title="Findings over time" series={findingSeries} swatch="line" size="small">
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        }
        doText="Two series that cross are lines."
        dont={
          <Chart title="Findings over time" series={findingSeries} size="small">
            <Chart.Area data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        }
        dontText="Two washes that overlap. Where they cross the fills mix into a third colour that is on nobody's legend."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    stacked: true,
    curve: "linear",
    labels: "none",
    size: "medium",
  },
};
