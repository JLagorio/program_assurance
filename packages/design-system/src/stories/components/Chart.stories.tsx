import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download } from "lucide-react";
import { useState } from "react";

import {
  Badge,
  Button,
  Chart,
  Stat,
  ToggleGroup,
  type ChartDatum,
  type ChartSeries,
  type Tone,
} from "../../components";
import { Box, Grid, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";


/* ---------- fixtures ---------- */

const byFamily = [
  { family: "AC", satisfied: 34, partial: 5, other: 7, notAssessed: 2, target: 44 },
  { family: "AU", satisfied: 18, partial: 4, other: 3, notAssessed: 1, target: 24 },
  { family: "CM", satisfied: 23, partial: 4, other: 5, notAssessed: 0, target: 30 },
  { family: "IA", satisfied: 22, partial: 1, other: 3, notAssessed: 2, target: 26 },
  { family: "SC", satisfied: 40, partial: 6, other: 4, notAssessed: 3, target: 50 },
  { family: "SI", satisfied: 29, partial: 3, other: 2, notAssessed: 1, target: 34 },
];
const statusSeries: ChartSeries[] = [
  { key: "satisfied", label: "Satisfied", tone: "success" },
  { key: "partial", label: "Partial", tone: "warning" },
  { key: "other", label: "Other than satisfied", tone: "danger" },
  { key: "notAssessed", label: "Not assessed", tone: "neutral" },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const byMonth = months.map((month, i) => ({
  month,
  open: [14, 17, 15, 19, 12, 11, 9, 8, 5][i],
  closed: [3, 5, 8, 6, 11, 9, 7, 6, 4][i],
  plan: [14, 13, 12, 11, 10, 9, 8, 7, 6][i],
  assessed: [120, 150, 190, 210, 240, 280, 310, 330, 350][i],
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

const byAssessor = [
  { week: "W31", whitfield: 12, okafor: 9, ryde: 7, hoppel: 4, lind: 3 },
  { week: "W32", whitfield: 14, okafor: 8, ryde: 9, hoppel: 6, lind: 2 },
  { week: "W33", whitfield: 11, okafor: 12, ryde: 8, hoppel: 5, lind: 4 },
  { week: "W34", whitfield: 15, okafor: 10, ryde: 6, hoppel: 7, lind: 3 },
  { week: "W35", whitfield: 13, okafor: 11, ryde: 10, hoppel: 5, lind: 5 },
];
const assessors: ChartSeries[] = [
  { key: "whitfield", label: "D. Whitfield" },
  { key: "okafor", label: "A. Okafor" },
  { key: "ryde", label: "M. Ryde" },
  { key: "hoppel", label: "G. Hoppel" },
  { key: "lind", label: "S. Lind" },
];

const windows: ChartDatum[] = [
  { phase: "Categorize", weeks: [0, 3] },
  { phase: "Select", weeks: [2, 6] },
  { phase: "Implement", weeks: [5, 14] },
  { phase: "Assess", weeks: [12, 20] },
  { phase: "Authorize", weeks: [19, 23] },
  { phase: "Monitor", weeks: [23, 36] },
];

const risks = [
  { id: "RSK-014", title: "Unpatched hypervisor", likelihood: 4, impact: 5, exposure: 420, status: "open" },
  { id: "RSK-021", title: "Shared service account", likelihood: 5, impact: 3, exposure: 260, status: "open" },
  { id: "RSK-007", title: "Backup restore untested", likelihood: 3, impact: 4, exposure: 180, status: "treating" },
  { id: "RSK-030", title: "Vendor SBOM missing", likelihood: 2, impact: 4, exposure: 120, status: "treating" },
  { id: "RSK-011", title: "Log retention 30 days", likelihood: 3, impact: 2, exposure: 90, status: "treating" },
  { id: "RSK-002", title: "Stale firewall rules", likelihood: 2, impact: 2, exposure: 40, status: "accepted" },
  { id: "RSK-019", title: "Legacy TLS on printer", likelihood: 1, impact: 2, exposure: 20, status: "accepted" },
  { id: "RSK-025", title: "Single admin for PKI", likelihood: 2, impact: 5, exposure: 210, status: "open" },
];
const riskGroups = [
  { key: "open", label: "Open", tone: "danger" as const },
  { key: "treating", label: "In treatment", tone: "warning" as const },
  { key: "accepted", label: "Accepted", tone: "neutral" as const },
];

const bySystem = [
  {
    name: "Payments",
    children: [
      { name: "Ledger API", value: 18 },
      { name: "Card vault", value: 11 },
      { name: "Settlement", value: 7 },
    ],
  },
  {
    name: "Identity",
    children: [
      { name: "SSO", value: 14 },
      { name: "PKI", value: 9 },
    ],
  },
  { name: "Reporting", children: [{ name: "Warehouse", value: 12 }, { name: "Dashboards", value: 4 }] },
  { name: "Network", children: [{ name: "Edge", value: 6 }, { name: "Core", value: 3 }] },
];

const families = ["AC", "AU", "CM", "IA", "SC", "SI"];
const heatMonths = months.slice(3);
const findingsByFamilyMonth: Record<string, number[]> = {
  AC: [6, 8, 9, 5, 4, 3],
  AU: [2, 3, 2, 1, 1, 0],
  CM: [5, 5, 7, 6, 3, 2],
  IA: [3, 2, 2, 2, 1, 1],
  SC: [9, 11, 12, 8, 6, 4],
  SI: [4, 4, 5, 3, 2, 2],
};
const varianceByPhase: Record<string, number[]> = {
  Categorize: [0, 0, 0, 0, 0, 0],
  Select: [-2, -3, 0, 0, 0, 0],
  Implement: [1, 3, 5, 7, 6, 4],
  Assess: [0, 0, 2, 4, 9, 12],
  Authorize: [0, 0, 0, 0, 3, 8],
};
const phases = Object.keys(varianceByPhase);
const likelihoods = ["Rare", "Unlikely", "Possible", "Likely", "Certain"];
const impacts = ["Minor", "Moderate", "Major", "Severe", "Critical"];
const riskCount = (row: string, col: string) => {
  const l = likelihoods.indexOf(row) + 1;
  const i = impacts.indexOf(col) + 1;
  return risks.filter((r) => r.likelihood === l && r.impact === i).length;
};
const riskTone = (_value: number, row: string, col: string): Tone => {
  const score = (likelihoods.indexOf(row) + 1) * (impacts.indexOf(col) + 1);
  return score >= 15 ? "danger" : score >= 8 ? "warning" : score >= 4 ? "information" : "success";
};

const meta = {
  title: "Components/Chart",
  component: Chart.Bar,
  parameters: { layout: "padded" },
  args: { data: byFamily, x: "family", series: statusSeries, label: "Coverage by control family" },
} satisfies Meta<typeof Chart.Bar>;
export default meta;
type Story = StoryObj<typeof meta>;

/* ---------- the contract ---------- */

/** Every kind in both modes: bars in every arrangement, lines and areas with their furniture, rings, sparklines, points, tiles, grids and their keys, the legend, the Frame's states, and the categorical set. */
export const ChartMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Bar · one series (brand) · grouped (categorical) · stacked (status)">
        <Box style={{ width: 300 }}>
          <Chart.Bar
            data={bySource}
            x="source"
            series={[{ key: "n", label: "Findings", tone: "brand" }]}
            size="small"
            label="Findings by source"
          />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Bar data={byAssessor} x="week" series={assessors.slice(0, 3)} size="small" label="Reviews by assessor" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked size="small" label="Coverage by family" />
        </Box>
      </Specimens>
      <Specimens title="Bar · horizontal with end labels · a target per bar · floating from-to values">
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
          <Chart.Bar
            data={byFamily}
            x="family"
            series={[{ key: "satisfied", label: "Satisfied", tone: "success" }]}
            target="target"
            size="small"
            label="Satisfied against target"
          />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Bar
            data={windows}
            x="phase"
            series={[{ key: "weeks", label: "Window", tone: "information" }]}
            horizontal
            format={(v) => `W${v}`}
            size="small"
            label="Phase windows"
          />
        </Box>
      </Specimens>
      <Specimens title="Line · plain · smooth with dots and end labels · a band, a target and a milestone">
        <Box style={{ width: 300 }}>
          <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" label="Findings over time" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={findingSeries}
            curve="smooth"
            dots
            labels="end"
            size="small"
            label="Findings over time"
          />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={[{ key: "open", label: "Open", tone: "brand" }]}
            bands={[{ from: 0, to: 8, label: "Tolerable" }]}
            reference={[
              { y: 10, label: "Limit", tone: "danger" },
              { x: "Jun", label: "Milestone C" },
            ]}
            size="small"
            label="Open findings against the limit"
          />
        </Box>
      </Specimens>
      <Specimens title="Area · one series · stacked · baseline auto">
        <Box style={{ width: 300 }}>
          <Chart.Area
            data={byMonth}
            x="month"
            series={[{ key: "open", label: "Open", tone: "brand" }]}
            size="small"
            label="Open findings"
          />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Area data={byMonth} x="month" series={findingSeries} stacked size="small" label="Findings, stacked" />
        </Box>
        <Box style={{ width: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={[{ key: "plan", label: "Plan", tone: "neutral" }]}
            baseline="auto"
            size="small"
            label="Plan, cropped"
          />
        </Box>
      </Specimens>
      <Specimens title="Donut · 64, 120 and 160 · a gauge">
        <Chart.Donut
          size={64}
          thickness={8}
          name="Done"
          slices={[
            { key: "a", label: "Done", value: 3, tone: "success" },
            { key: "b", label: "Left", value: 1, tone: "neutral" },
          ]}
        />
        <Chart.Donut
          label="80%"
          caption="satisfied"
          name="Coverage"
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
          caption="open"
          name="Open findings"
          slices={[
            { key: "o", label: "Open", value: 5, tone: "danger" },
            { key: "c", label: "Closed", value: 59, tone: "neutral" },
          ]}
        />
        <Chart.Donut
          arc="half"
          size={160}
          thickness={16}
          label="72"
          caption="posture"
          name="Risk posture"
          slices={[{ key: "p", label: "Posture", value: 72, tone: "warning" }, { key: "r", label: "To 100", value: 28, tone: "neutral" }]}
        />
      </Specimens>
      <Specimens title="Sparkline · line · with an end dot and a reference · area · bars">
        <Chart.Sparkline data={byMonth} y="open" tone="danger" />
        <Chart.Sparkline data={byMonth} y="open" tone="brand" endDot reference={10} />
        <Chart.Sparkline data={byMonth} y="closed" tone="success" appearance="area" />
        <Chart.Sparkline data={byMonth} y="closed" tone="neutral" appearance="bars" width={120} height={28} />
      </Specimens>
      <Specimens title="Scatter · groups · a bubble with quadrants">
        <Box style={{ width: 340 }}>
          <Chart.Scatter
            data={risks}
            x="likelihood"
            y="impact"
            name="id"
            groupBy="status"
            groups={riskGroups}
            size="small"
            label="Risks by likelihood and impact"
          />
        </Box>
        <Box style={{ width: 340 }}>
          <Chart.Scatter
            data={risks}
            x="likelihood"
            y="impact"
            z="exposure"
            name="id"
            tone="brand"
            reference={[{ x: 3 }, { y: 3 }]}
            size="small"
            label="Risks by exposure"
          />
        </Box>
      </Specimens>
      <Specimens title="Treemap">
        <Box style={{ width: 480 }}>
          <Chart.Treemap data={bySystem} size="small" label="Findings by system and component" />
        </Box>
      </Specimens>
      <Specimens title="Heatmap · sequential · diverging · status, with values">
        <Stack space="space.100">
          <Chart.Heatmap
            rows={families}
            columns={heatMonths}
            value={(r, c) => findingsByFamilyMonth[r]?.[heatMonths.indexOf(c)]}
            size="small"
            label="Findings by family and month"
          />
          <Chart.Scale scale="sequential" min="0" max="12" />
        </Stack>
        <Stack space="space.100">
          <Chart.Heatmap
            rows={phases}
            columns={heatMonths}
            value={(r, c) => varianceByPhase[r]?.[heatMonths.indexOf(c)]}
            scale="diverging"
            domain={[-12, 12]}
            format={(v) => `${v > 0 ? "+" : ""}${v}d`}
            size="small"
            label="Schedule variance by phase and month"
          />
          <Chart.Scale scale="diverging" min="−12 days" mid="On plan" max="+12 days" />
        </Stack>
        <Chart.Heatmap
          rows={[...likelihoods].reverse()}
          columns={impacts}
          value={riskCount}
          scale={riskTone}
          size="small"
          label="Risk matrix"
          rowLabel="Likelihood"
          columnLabel="Impact"
        />
      </Specimens>
      <Specimens title="Legend · squares · strokes · dots">
        <Chart.Legend series={statusSeries} />
        <Chart.Legend series={findingSeries} swatch="line" />
        <Chart.Legend series={riskGroups} swatch="dot" />
      </Specimens>
      <Specimens title="Frame · loading · empty · error">
        <Box style={{ width: 300 }}>
          <Chart title="Findings over time" status="loading" size="small">
            <span />
          </Chart>
        </Box>
        <Box style={{ width: 300 }}>
          <Chart title="Findings over time" status="empty" statusText="No findings in this window." size="small">
            <span />
          </Chart>
        </Box>
        <Box style={{ width: 300 }}>
          <Chart title="Findings over time" status="error" statusText="The register did not answer." size="small">
            <span />
          </Chart>
        </Box>
      </Specimens>
      <Specimens title="The categorical set · six hues in order, then Other">
        <Chart.Legend
          series={[
            { key: "1", label: "Series 1" },
            { key: "2", label: "Series 2" },
            { key: "3", label: "Series 3" },
            { key: "4", label: "Series 4" },
            { key: "5", label: "Series 5" },
            { key: "6", label: "Series 6" },
            { key: "7", label: "Other" },
          ]}
        />
      </Specimens>
    </Stack>
  ),
};

/* ---------- the frame ---------- */

function FramedChart() {
  const [range, setRange] = useState<"3m" | "9m">("9m");
  const data = range === "3m" ? byMonth.slice(-3) : byMonth;
  return (
    <Box style={{ width: 720 }}>
      <Chart.Frame
        title="Findings over time"
        description="Open and closed at the end of each month, this year"
        series={findingSeries}
        swatch="line"
        data={data}
        x="month"
        xLabel="Month"
        actions={
          <ToggleGroup
            aria-label="Range"
            value={range}
            onChange={setRange}
            items={[
              { value: "3m", label: "3 months" },
              { value: "9m", label: "9 months" },
            ]}
          />
        }
      >
        <Chart.Line data={data} x="month" series={findingSeries} labels="end" />
      </Chart.Frame>
    </Box>
  );
}

/** The Frame: title, one line under it, the legend (hover dims the other series, click isolates one), a control, and the Table toggle that lays the same numbers out. */
export const Framed: Story = { render: () => <FramedChart /> };

/** Findings by source: one series, so no legend; `brand` because the reader is asked to look at it. */
export const Bars: Story = {
  render: () => (
    <Box style={{ width: 560 }}>
      <Chart title="Findings by source" data={bySource} x="source" series={[{ key: "n", label: "Findings", tone: "brand" }]}>
        <Chart.Bar data={bySource} x="source" series={[{ key: "n", label: "Findings", tone: "brand" }]} labels="end" />
      </Chart>
    </Box>
  ),
};

/** Coverage by family, four status series stacked: parts of each family's whole. The tones are the Badge's. */
export const Stacked: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Coverage by control family" description="Determinations across 372 controls" series={statusSeries} data={byFamily} x="family">
        <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked />
      </Chart>
    </Box>
  ),
};

/** Long names go down the side, and the value sits at the bar's end. */
export const Horizontal: Story = {
  render: () => (
    <Box style={{ width: 480 }}>
      <Chart title="Findings by source" data={bySource} x="source" series={[{ key: "n", label: "Findings" }]}>
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
        series={[{ key: "satisfied", label: "Satisfied", tone: "success" }]}
      >
        <Chart.Bar data={byFamily} x="family" series={[{ key: "satisfied", label: "Satisfied", tone: "success" }]} target="target" />
      </Chart>
    </Box>
  ),
};

/** A value that is a `[from, to]` pair floats: phase windows in weeks, with today as a milestone. */
export const Windows: Story = {
  render: () => (
    <Box style={{ width: 560 }}>
      <Chart title="RMF phase windows" description="Weeks from kickoff" data={windows} x="phase" series={[{ key: "weeks", label: "Window" }]} format={(v) => `W${v}`}>
        <Chart.Bar
          data={windows}
          x="phase"
          series={[{ key: "weeks", label: "Window", tone: "information" }]}
          horizontal
          reference={[{ y: 16, label: "Today" }]}
        />
      </Chart>
    </Box>
  ),
};

/** Open and closed findings over nine months. Straight segments: the points are what was counted. */
export const Lines: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Findings over time" series={findingSeries} swatch="line" data={byMonth} x="month">
        <Chart.Line data={byMonth} x="month" series={findingSeries} />
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
        series={[
          { key: "open", label: "Open", tone: "brand" },
          { key: "plan", label: "Plan", tone: "neutral" },
        ]}
        swatch="line"
        data={byMonth}
        x="month"
      >
        <Chart.Line
          data={byMonth}
          x="month"
          series={[
            { key: "open", label: "Open", tone: "brand" },
            { key: "plan", label: "Plan", tone: "neutral" },
          ]}
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

/** Stacked areas: parts of a whole over time. The wash is the hue at 12%. */
export const Areas: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Findings, open and closed" series={findingSeries} data={byMonth} x="month">
        <Chart.Area data={byMonth} x="month" series={findingSeries} stacked />
      </Chart>
    </Box>
  ),
};

/** A ring beside its Stat, and half a ring as a gauge. The number in the middle is the point; the slices are the parts. */
export const Donuts: Story = {
  render: () => (
    <Inline space="space.600" alignBlock="center">
      <Inline space="space.300" alignBlock="center">
        <Chart.Donut
          label="80%"
          caption="satisfied"
          name="Control coverage"
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
      <Chart.Donut
        arc="half"
        size={200}
        thickness={20}
        label="72"
        caption="risk posture"
        name="Risk posture"
        slices={[
          { key: "p", label: "Posture", value: 72, tone: "warning" },
          { key: "r", label: "To 100", value: 28, tone: "neutral" },
        ]}
      />
    </Inline>
  ),
};

/** Sparklines in tiles: the number carries the value, the line the trend, and a reference says what last period was. */
export const Sparklines: Story = {
  render: () => (
    <Box style={{ width: 720 }}>
      <Stat.Grid cols={3}>
        <Stat.Tile
          label="Open findings"
          value={
            <Inline space="space.150" alignBlock="center">
              <span>5</span>
              <Chart.Sparkline data={byMonth} y="open" tone="danger" endDot />
            </Inline>
          }
          note="Down from 14 in January"
        />
        <Stat.Tile
          label="Closed this year"
          value={
            <Inline space="space.150" alignBlock="center">
              <span>59</span>
              <Chart.Sparkline data={byMonth} y="closed" tone="success" appearance="bars" />
            </Inline>
          }
          note="Nine months"
        />
        <Stat.Tile
          label="Plan"
          value={
            <Inline space="space.150" alignBlock="center">
              <span>6</span>
              <Chart.Sparkline data={byMonth} y="plan" tone="neutral" appearance="area" reference={10} />
            </Inline>
          }
          note="Against a limit of 10"
        />
      </Stat.Grid>
    </Box>
  ),
};

/** Risks by likelihood and impact, sized by exposure, in three status groups; the lines make quadrants. */
export const ScatterStory: Story = {
  name: "Scatter",
  render: () => (
    <Box style={{ width: 560 }}>
      <Chart title="Risks by likelihood and impact" description="Sized by exposure in $K" series={riskGroups} swatch="dot">
        <Chart.Scatter
          data={risks}
          x="likelihood"
          y="impact"
          z="exposure"
          name="id"
          groupBy="status"
          groups={riskGroups}
          reference={[{ x: 3 }, { y: 3 }]}
          xLabel="Likelihood"
          yLabel="Impact"
          size="large"
        />
      </Chart>
    </Box>
  ),
};

/** Findings by system and component: each tile a leaf sized by count, each system a hue. A name shows when it fits; the rest is the tooltip's. */
export const TreemapStory: Story = {
  name: "Treemap",
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart title="Findings by system and component" series={bySystem.map((s) => ({ key: s.name, label: s.name }))}>
        <Chart.Treemap data={bySystem} size="large" />
      </Chart>
    </Box>
  ),
};

/** Three grids: how many (one hue), above and below (two hues around grey), and status by place (the Badge's fills, with the count printed). Each colour scale has its key. */
export const Heatmaps: Story = {
  render: () => (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="space.400">
      <Chart title="Findings by family and month" description="Opened in the month">
        <Stack space="space.150">
          <Chart.Heatmap
            rows={families}
            columns={heatMonths}
            value={(r, c) => findingsByFamilyMonth[r]?.[heatMonths.indexOf(c)]}
            label="Findings by family and month"
            rowLabel="Family"
            columnLabel="Month"
          />
          <Chart.Scale scale="sequential" min="0" max="12 findings" />
        </Stack>
      </Chart>
      <Chart title="Schedule variance by phase" description="Days against the plan at month end">
        <Stack space="space.150">
          <Chart.Heatmap
            rows={phases}
            columns={heatMonths}
            value={(r, c) => varianceByPhase[r]?.[heatMonths.indexOf(c)]}
            scale="diverging"
            domain={[-12, 12]}
            format={(v) => `${v > 0 ? "+" : ""}${v} days`}
            label="Schedule variance by phase and month"
            rowLabel="Phase"
            columnLabel="Month"
          />
          <Chart.Scale scale="diverging" min="−12 days" mid="On plan" max="+12 days" />
        </Stack>
      </Chart>
      <Chart title="Risk matrix" description="Open risks by likelihood and impact">
        <Chart.Heatmap
          rows={[...likelihoods].reverse()}
          columns={impacts}
          value={riskCount}
          scale={riskTone}
          size="large"
          label="Risk matrix"
          rowLabel="Likelihood"
          columnLabel="Impact"
        />
      </Chart>
    </Grid>
  ),
};

/** One series is the point: it takes `brand`, the rest take `neutral`. The honest answer to "make this chart clearer". */
export const Emphasis: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart
        title="Reviews by assessor"
        description="D. Whitfield against the team"
        series={assessors.map((a, i) => ({ ...a, tone: i === 0 ? "brand" : "neutral" }))}
        swatch="line"
        data={byAssessor}
        x="week"
      >
        <Chart.Line
          data={byAssessor}
          x="week"
          series={assessors.map((a, i) => ({ ...a, tone: i === 0 ? "brand" : "neutral" }))}
          labels="end"
        />
      </Chart>
    </Box>
  ),
};

function Selecting() {
  const [family, setFamily] = useState<string | null>(null);
  const rows = family ? byFamily.filter((f) => f.family === family) : byFamily;
  return (
    <Stack space="space.200" style={{ width: 640 }}>
      <Chart title="Coverage by control family" description="Click a bar to filter the rows under it" series={statusSeries} data={byFamily} x="family">
        <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked onSelect={(d) => setFamily(String(d["family"]))} />
      </Chart>
      <Inline space="space.100" alignBlock="center">
        <Text size="small" color="color.text.subtle">
          {family ? `Showing ${family}.` : "Showing every family."}
        </Text>
        {family ? (
          <Button size="small" variant="subtle" onClick={() => setFamily(null)}>
            Clear
          </Button>
        ) : null}
      </Inline>
      <Inline space="space.100" shouldWrap>
        {rows.map((r) => (
          <Badge key={r.family}>{`${r.family} · ${r.satisfied + r.partial + r.other + r.notAssessed}`}</Badge>
        ))}
      </Inline>
    </Stack>
  );
}

/** A chart whose bars are buttons: each filters what is under the chart. The filter is also reachable without the chart, so the chart enhances and never gates. */
export const Selection: Story = { render: () => <Selecting /> };

/** The Frame's states hold the plot's height, so the page does not jump when the data arrives. */
export const States: Story = {
  render: () => (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap="space.300">
      <Chart title="Findings over time" description="Loading" status="loading">
        <span />
      </Chart>
      <Chart title="Findings over time" description="Empty" status="empty" statusText="No findings in this window.">
        <span />
      </Chart>
      <Chart title="Findings over time" description="Error" status="error" statusText="The register did not answer." actions={<Button size="small" variant="subtle" iconBefore={<Download />}>Retry</Button>}>
        <span />
      </Chart>
    </Grid>
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
          <Chart title="Reviews by assessor" series={assessors.map((a, i) => ({ ...a, tone: i === 0 ? "brand" : "neutral" }))} swatch="line" size="small">
            <Chart.Line data={byAssessor} x="week" series={assessors.map((a, i) => ({ ...a, tone: i === 0 ? "brand" : "neutral" }))} size="small" />
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
          <Stack space="space.200">
            <Chart title="Open findings" size="small">
              <Chart.Line data={byMonth} x="month" series={[{ key: "open", label: "Open", tone: "brand" }]} size="small" />
            </Chart>
            <Chart title="Controls assessed" size="small">
              <Chart.Line data={byMonth} x="month" series={[{ key: "assessed", label: "Assessed", tone: "brand" }]} size="small" />
            </Chart>
          </Stack>
        }
        doText="Two measures of different scale: two charts, one axis each, stacked so the months line up."
        dont={
          <Chart title="Findings and controls" series={[{ key: "open", label: "Open findings", tone: "danger" }, { key: "assessed", label: "Controls assessed", tone: "brand" }]} swatch="line" size="small">
            <Chart.Line
              data={byMonth}
              x="month"
              series={[
                { key: "open", label: "Open findings", tone: "danger" },
                { key: "assessed", label: "Controls assessed", tone: "brand" },
              ]}
              size="small"
            />
          </Chart>
        }
        dontText="Two measures on one plot. Findings in the tens flatten under controls in the hundreds, and a second axis would invent a correlation. The kit draws one axis on purpose."
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
        dontText="A number on every point. It is chaos, and it goes unread. (The kit has no such prop; this is the closest it comes.)"
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    data: byFamily,
    x: "family",
    series: statusSeries,
    stacked: true,
    horizontal: false,
    labels: "none",
    size: "medium",
    label: "Coverage by control family",
  },
};
