import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Chart, KeyValue } from "../../components";
import { Box, Stack } from "../../primitives";
import {
  assessors,
  byAssessor,
  byFamily,
  byMonth,
  bySource,
  familyNames,
  sourceSeries,
  statusSeries,
  windows,
} from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Chart/Bar",
  component: Chart.Bar,
  parameters: { layout: "padded" },
  args: { data: byFamily, x: "family", series: statusSeries, label: "Coverage by control family" },
} satisfies Meta<typeof Chart.Bar>;
export default meta;
type Story = StoryObj<typeof meta>;

const satisfied = [{ key: "satisfied", label: "Satisfied", tone: "success" as const }];
const windowSeries = [{ key: "weeks", label: "Window", tone: "information" as const }];
const closedBars = [{ key: "closed", label: "Closed", tone: "success" as const }];
const planLine = { key: "plan", label: "Plan", tone: "neutral" as const };

/** Every arrangement in both modes: one series, grouped, stacked; horizontal with end labels, a target per bar, floating values; a line over the bars, axis titles, the skeleton; the three heights. */
export const BarMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="One series (brand) · grouped (the categorical set) · stacked (the status tones)">
        <Box style={{ width: 300 }}>
          <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" label="Findings by source" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Bar data={byAssessor} x="week" series={assessors.slice(0, 3)} size="small" label="Reviews by assessor" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked size="small" label="Coverage by family" />
        </Box>
      </Specimens>
      <Specimens title="Horizontal with end labels · a target per bar · floating from-to values with a milestone">
        <Box style={{ width: 300 }}>
          <Chart.Bar
            data={bySource}
            x="source"
            series={[{ key: "n", label: "Findings", tone: "neutral" }]}
            horizontal
            labels="end"
            size="small"
            label="Findings by source"
          />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Bar data={byFamily} x="family" series={satisfied} target="target" size="small" label="Satisfied against target" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Bar
            data={windows}
            x="phase"
            series={windowSeries}
            horizontal
            format={(v) => `W${v}`}
            reference={[{ y: 16, label: "Today" }]}
            size="small"
            label="Phase windows"
          />
        </Box>
      </Specimens>
      <Specimens title="A line over the bars · axis titles · loading">
        <Box style={{ width: 300 }}>
          <Chart.Bar data={byMonth} x="month" series={closedBars} line={planLine} size="small" label="Closed against the plan" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Bar data={bySource} x="source" series={sourceSeries} xLabel="Source" yLabel="Findings" size="small" label="Findings by source" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" label="Findings by source" loading />
        </Box>
      </Specimens>
      <Specimens title="Sizes · small 120 · medium 200 · large 320">
        <Box style={{ width: 240 }}>
          <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" label="Small" />
        </Box>
        <Box style={{ width: 240 }}>
          <Chart.Bar data={bySource} x="source" series={sourceSeries} size="medium" label="Medium" />
        </Box>
        <Box style={{ width: 240 }}>
          <Chart.Bar data={bySource} x="source" series={sourceSeries} size="large" label="Large" />
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** Findings by source: one series, so no legend; `brand` because the reader is asked to look at it; the value at each bar's end. */
export const Single: Story = {
  render: () => (
    <Box style={{ width: 560 }}>
      <Chart title="Findings by source" description="Opened this year" data={bySource} x="source" xLabel="Source" series={sourceSeries}>
        <Chart.Bar data={bySource} x="source" series={sourceSeries} labels="end" />
      </Chart>
    </Box>
  ),
};

/** Three assessors side by side, week by week: the categorical set in order, a 2px gap between bars. Past three, stack or emphasise. */
export const Grouped: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Reviews by assessor" description="Per week, the last five weeks" series={assessors.slice(0, 3)} data={byAssessor} x="week" xLabel="Week">
        <Chart.Bar data={byAssessor} x="week" series={assessors.slice(0, 3)} />
      </Chart>
    </Box>
  ),
};

/** Coverage by family, four status series stacked: parts of each family's whole. The tones are the Badge's, and the tooltip totals the stack. */
export const Stacked: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Coverage by control family" description="Determinations across 372 controls" series={statusSeries} data={byFamily} x="family" xLabel="Family">
        <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked />
      </Chart>
    </Box>
  ),
};

/** Long names go down the side, and the value sits at the bar's end. */
export const Horizontal: Story = {
  render: () => (
    <Box style={{ width: 480 }}>
      <Chart title="Findings by source" data={bySource} x="source" xLabel="Source" series={[{ key: "n", label: "Findings" }]}>
        <Chart.Bar data={bySource} x="source" series={[{ key: "n", label: "Findings", tone: "neutral" }]} horizontal labels="end" />
      </Chart>
    </Box>
  ),
};

/** Actual against planned: a mark in ink across each bar at its target. Carbon calls this a bullet chart. */
export const Targets: Story = {
  render: () => (
    <Box style={{ width: 560 }}>
      <Chart
        title="Satisfied controls against the plan"
        description="The mark is each family's target for this assessment"
        data={byFamily}
        x="family"
        xLabel="Family"
        series={satisfied}
      >
        <Chart.Bar data={byFamily} x="family" series={satisfied} target="target" />
      </Chart>
    </Box>
  ),
};

/** A value that is a `[from, to]` pair floats: phase windows in weeks, with today as a milestone above the plot. */
export const Windows: Story = {
  render: () => (
    <Box style={{ width: 560 }}>
      <Chart title="RMF phase windows" description="Weeks from kickoff" data={windows} x="phase" xLabel="Phase" series={[{ key: "weeks", label: "Window" }]} format={(v) => `W${v}`}>
        <Chart.Bar data={windows} x="phase" series={windowSeries} horizontal reference={[{ y: 16, label: "Today" }]} />
      </Chart>
    </Box>
  ),
};

/** Bars with a line over them on the same axis: closed findings each month against the plan. The line's swatch is a stroke in the legend's tooltip. */
export const Combo: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Closed findings against the plan" description="Per month, this year" series={[...closedBars, planLine]} data={byMonth} x="month" xLabel="Month">
        <Chart.Bar data={byMonth} x="month" series={closedBars} line={planLine} />
      </Chart>
    </Box>
  ),
};

/** A click on a segment opens its card: the kit's head (the series, the family, the value) and the caller's facts and link. Enter on the focused plot opens the whole category. */
export const Details: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Coverage by control family" description="Click a segment" series={statusSeries} data={byFamily} x="family" xLabel="Family">
        <Chart.Bar
          data={byFamily}
          x="family"
          series={statusSeries}
          stacked
          details={(s) => {
            const code = String(s.datum["family"]);
            return (
              <Stack space="space.150">
                <div>
                  <KeyValue label="Family" labelWidth={88}>
                    {familyNames[code] ?? code}
                  </KeyValue>
                  <KeyValue label="Target" labelWidth={88}>
                    {`${String(s.datum["target"])} satisfied`}
                  </KeyValue>
                </div>
                <Button size="small" variant="secondary">{`Open ${code}`}</Button>
              </Stack>
            );
          }}
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
          <Chart title="Coverage by control family" series={statusSeries} size="small">
            <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked size="small" />
          </Chart>
        }
        doText="A status is a status tone: satisfied in success, partial in warning, other in danger, as on a Badge."
        dont={
          <Chart
            title="Coverage by control family"
            series={statusSeries.map((s, i) => ({ ...s, tone: `categorical.${(i + 1) as 1 | 2 | 3 | 4}` as const }))}
            size="small"
          >
            <Chart.Bar
              data={byFamily}
              x="family"
              series={statusSeries.map((s, i) => ({ ...s, tone: `categorical.${(i + 1) as 1 | 2 | 3 | 4}` as const }))}
              stacked
              size="small"
            />
          </Chart>
        }
        dontText="Status in the categorical hues. Blue for satisfied and orange for partial say nothing, and the reader looks for what is wrong with teal."
      />
      <Pair
        do={
          <Chart title="Findings by source" size="small">
            <Chart.Bar data={bySource} x="source" series={[{ key: "n", label: "Findings", tone: "neutral" }]} horizontal labels="end" size="small" />
          </Chart>
        }
        doText="Long names go down the side, whole, with the value at the bar's end."
        dont={
          <Box style={{ width: 240 }}>
            <Chart title="Findings by source" size="small">
              <Chart.Bar data={bySource} x="source" series={[{ key: "n", label: "Findings", tone: "neutral" }]} size="small" />
            </Chart>
          </Box>
        }
        dontText="Long names under narrow columns. The ticks are cut to nothing and the reader hovers to learn which bar is which."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    stacked: true,
    horizontal: false,
    labels: "none",
    size: "medium",
  },
};
