import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Chart, KeyValue } from "../../components";
import { Box, Stack } from "../../primitives";
import {
  assessors,
  assessorsEmphasised,
  byAssessor,
  byMonth,
  byMonthGaps,
  findingSeries,
} from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Chart/Line",
  component: Chart.Line,
  parameters: { layout: "padded" },
  args: { data: byMonth, x: "month", series: findingSeries, label: "Findings over time" },
} satisfies Meta<typeof Chart.Line>;
export default meta;
type Story = StoryObj<typeof meta>;

const open = [{ key: "open", label: "Open", tone: "brand" as const }];
const openPlan = [
  { key: "open", label: "Open", tone: "brand" as const },
  { key: "plan", label: "Plan", tone: "neutral" as const },
];

/** Every line in both modes: plain, smooth with dots, end labels; a band, a limit and a milestone, a cropped baseline, a gap; emphasis, axis titles, the skeleton. */
export const LineMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Plain · smooth with dots · end labels">
        <Box style={{ width: 300 }}>
          <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" label="Findings over time" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Line data={byMonth} x="month" series={findingSeries} curve="smooth" dots size="small" label="Findings over time" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Line data={byMonth} x="month" series={findingSeries} labels="end" size="small" label="Findings over time" />
        </Box>
      </Specimens>
      <Specimens title="A band, a limit and a milestone · baseline auto · a gap where the data was not there">
        <Box style={{ width: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={open}
            bands={[{ from: 0, to: 8, label: "Tolerable" }]}
            reference={[
              { y: 15, label: "Limit", tone: "danger" },
              { x: "Jun", label: "Milestone C" },
            ]}
            size="small"
            label="Open findings against the limit"
          />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Line data={byMonth} x="month" series={[{ key: "plan", label: "Plan", tone: "neutral" }]} baseline="auto" size="small" label="Plan, cropped" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Line data={byMonthGaps} x="month" series={findingSeries} dots size="small" label="Findings, with gaps" />
        </Box>
      </Specimens>
      <Specimens title="Emphasis (brand and neutral) · axis titles · loading">
        <Box style={{ width: 300 }}>
          <Chart.Line data={byAssessor} x="week" series={assessorsEmphasised} size="small" label="Reviews by assessor" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Line data={byMonth} x="month" series={open} xLabel="Month" yLabel="Findings" size="small" label="Open findings" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" label="Findings over time" loading />
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** Open and closed findings over nine months. Straight segments: the points are what was counted. */
export const Lines: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Findings over time" description="At the end of each month, this year" series={findingSeries} swatch="line" data={byMonth} x="month" xLabel="Month">
        <Chart.Line data={byMonth} x="month" series={findingSeries} labels="end" />
      </Chart>
    </Box>
  ),
};

/** A smooth curve with a marker on every point, for a series with few points where each is an event. The curve never overshoots the data. */
export const Smooth: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Open findings" description="Monthly count" series={open} data={byMonth} x="month" xLabel="Month">
        <Chart.Line data={byMonth} x="month" series={open} curve="smooth" dots />
      </Chart>
    </Box>
  ),
};

/** A burndown: the open count against the plan, a band for the tolerable range, a limit in danger, a milestone on the category axis, and the last values printed. */
export const Burndown: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart
        title="Open findings against the plan"
        description="The band is the tolerable range; the limit is the authorization condition"
        series={openPlan}
        swatch="line"
        data={byMonth}
        x="month"
        xLabel="Month"
      >
        <Chart.Line
          data={byMonth}
          x="month"
          series={openPlan}
          labels="end"
          bands={[{ from: 0, to: 8, label: "Tolerable" }]}
          reference={[
            { y: 15, label: "Limit", tone: "danger" },
            { x: "Jun", label: "Milestone C" },
          ]}
        />
      </Chart>
    </Box>
  ),
};

/** `baseline="auto"` crops the value axis to the data, for a trend where the change matters more than the size. The description says so, because a cropped axis exaggerates. */
export const Cropped: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Controls assessed" description="Cumulative; the axis starts at the first month's count" series={[{ key: "assessed", label: "Assessed", tone: "brand" }]} data={byMonth} x="month" xLabel="Month">
        <Chart.Line data={byMonth} x="month" series={[{ key: "assessed", label: "Assessed", tone: "brand" }]} baseline="auto" labels="end" />
      </Chart>
    </Box>
  ),
};

/** A missing value is a gap: April and July were not counted, and the line says so. `connectNulls` would draw across them and invent two months. */
export const Gaps: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Findings over time" description="The register was down in April and July" series={findingSeries} swatch="line" data={byMonthGaps} x="month" xLabel="Month">
        <Chart.Line data={byMonthGaps} x="month" series={findingSeries} dots />
      </Chart>
    </Box>
  ),
};

/** A click anywhere in a month's column, or Enter on the focused point, opens the month's card: every series at that point, then the caller's facts. The chosen point is ringed on every line. */
export const Details: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Findings over time" description="Click a month" series={findingSeries} swatch="line" data={byMonth} x="month" xLabel="Month">
        <Chart.Line
          data={byMonth}
          x="month"
          series={findingSeries}
          details={(s) => (
            <Stack space="space.150">
              <div>
                <KeyValue label="Net" labelWidth={88}>
                  {`${Number(s.datum["closed"]) - Number(s.datum["open"]) >= 0 ? "+" : ""}${Number(s.datum["closed"]) - Number(s.datum["open"])} closed`}
                </KeyValue>
                <KeyValue label="Plan" labelWidth={88}>
                  {`${String(s.datum["plan"])} open`}
                </KeyValue>
              </div>
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
          <Chart title="Reviews by assessor" series={assessorsEmphasised} swatch="line" size="small">
            <Chart.Line data={byAssessor} x="week" series={assessorsEmphasised} size="small" />
          </Chart>
        }
        doText="One series is the point: brand for it, neutral for the rest."
        dont={
          <Chart title="Reviews by assessor" series={assessors} swatch="line" size="small">
            <Chart.Line data={byAssessor} x="week" series={assessors} size="small" />
          </Chart>
        }
        dontText="Five hues when the story is one line. The reader has to find it, and the legend is the chart."
      />
      <Pair
        do={
          <Chart title="Findings over time" series={findingSeries} swatch="line" size="small">
            <Chart.Line data={byMonth} x="month" series={findingSeries} labels="end" size="small" />
          </Chart>
        }
        doText="Label the end. The axis and the tooltip carry the rest."
        dont={
          <Chart title="Findings over time" series={findingSeries} swatch="line" size="small">
            <Chart.Line data={byMonth} x="month" series={findingSeries} dots size="small" label="Findings over time, every point labelled" />
          </Chart>
        }
        dontText="A number on every point. It is chaos, and it goes unread. (The kit has no such prop; dots on every point is the closest it comes.)"
      />
      <Pair
        do={
          <Chart title="Findings over time" description="The register was down in April and July" series={findingSeries} swatch="line" size="small">
            <Chart.Line data={byMonthGaps} x="month" series={findingSeries} size="small" />
          </Chart>
        }
        doText="A gap where the data was not there, and the description says why."
        dont={
          <Chart title="Findings over time" series={findingSeries} swatch="line" size="small">
            <Chart.Line data={byMonthGaps} x="month" series={findingSeries} connectNulls size="small" />
          </Chart>
        }
        dontText="A line drawn across the missing months. Two counts that never happened, read as real."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    curve: "linear",
    dots: false,
    labels: "end",
    baseline: "zero",
    size: "medium",
  },
};
