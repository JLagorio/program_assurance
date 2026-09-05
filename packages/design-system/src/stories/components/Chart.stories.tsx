import type { Meta, StoryObj } from "@storybook/react-vite";
import { Download, RotateCcw } from "lucide-react";
import { useState } from "react";

import {
  Badge,
  Button,
  Chart,
  KeyValue,
  Spinner,
  Stat,
  ToggleGroup,
  type ChartSelection,
} from "../../components";
import { Box, Grid, Inline, Stack, Text } from "../../primitives";
import {
  assessors,
  assessorsEmphasised,
  byAssessor,
  byFamily,
  byMonth,
  bySource,
  componentFacts,
  componentsOf,
  familyNames,
  findingSeries,
  riskGroups,
  sourceSeries,
  statusSeries,
  systemTotals,
} from "../_lib/chart-data";
import { Grid as GridPrimitive } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Chart/Overview",
  component: Chart.Frame,
  parameters: { layout: "padded" },
  args: {
    title: "Findings over time",
    description: "Open and closed at the end of each month, this year",
    series: findingSeries,
    swatch: "line",
    data: byMonth,
    x: "month",
    xLabel: "Month",
    children: <Chart.Line data={byMonth} x="month" series={findingSeries} labels="end" />,
  },
} satisfies Meta<typeof Chart.Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

const brand = [{ key: "findings", label: "Findings", tone: "brand" as const }];

/* ---------- the contract ---------- */

/** The Frame in every state, the legend in every swatch, the tones, and one of each kind inside it. */
export const ChartMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Frame · ready · loading (the plot's own skeleton) · refreshing (the last plot, dimmed)">
        <Box style={{ width: 300 }}>
          <Chart title="Findings over time" series={findingSeries} swatch="line" size="small">
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        </Box>
        <Box style={{ width: 300 }}>
          <Chart title="Findings over time" series={findingSeries} swatch="line" size="small" status="loading">
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        </Box>
        <Box style={{ width: 300 }}>
          <Chart title="Findings over time" series={findingSeries} swatch="line" size="small" status="refreshing">
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        </Box>
      </Specimens>
      <Specimens title="Frame · empty · error with a retry · a drill-down's path">
        <Box style={{ width: 300 }}>
          <Chart title="Findings over time" status="empty" statusText="No findings in this window." size="small">
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        </Box>
        <Box style={{ width: 300 }}>
          <Chart
            title="Findings over time"
            status="error"
            statusText="The register did not answer."
            size="small"
            actions={
              <Button size="small" variant="subtle">
                Retry
              </Button>
            }
          >
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        </Box>
        <Box style={{ width: 300 }}>
          <Chart
            title="Findings by system"
            path={[{ label: "All systems", onSelect: () => {} }, { label: "Payments" }]}
            size="small"
          >
            <Chart.Bar data={componentsOf("Payments")} x="name" series={brand} size="small" labels="end" />
          </Chart>
        </Box>
      </Specimens>
      <Specimens title="Legend · squares · strokes · dots · at the bottom">
        <Chart.Legend series={statusSeries} />
        <Chart.Legend series={findingSeries} swatch="line" />
        <Chart.Legend series={riskGroups} swatch="dot" />
      </Specimens>
      <Specimens title="Frame · the Table twin, and a control in actions">
        <Box style={{ width: 420 }}>
          <Chart
            title="Findings by source"
            data={bySource}
            x="source"
            xLabel="Source"
            series={sourceSeries}
            size="small"
            actions={
              <Button size="small" variant="subtle" iconBefore={<Download />}>
                Export
              </Button>
            }
          >
            <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" />
          </Chart>
        </Box>
      </Specimens>
      <Specimens title="The tones · a status series · brand and neutral · the categorical set, then Other">
        <Chart.Legend series={statusSeries} />
        <Chart.Legend series={assessorsEmphasised.slice(0, 2)} swatch="line" />
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
      <Specimens title="Textured · every series wears a pattern, in the plot, the legend and the tooltip">
        <Box style={{ width: 300 }}>
          <Chart title="Coverage by control family" series={statusSeries} texture size="small">
            <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked size="small" />
          </Chart>
        </Box>
        <Box style={{ width: 300 }}>
          <Chart title="Findings, open and closed" series={findingSeries} texture size="small">
            <Chart.Area data={byMonth} x="month" series={findingSeries} stacked size="small" />
          </Chart>
        </Box>
        <Chart.Legend
          texture
          series={[
            { key: "1", label: "Solid" },
            { key: "2", label: "Hatch" },
            { key: "3", label: "Hatch back" },
            { key: "4", label: "Dots" },
            { key: "5", label: "Cross" },
            { key: "6", label: "Lines" },
            { key: "7", label: "Columns" },
          ]}
        />
      </Specimens>
      <Specimens title="Frame · the Download menu and the Expand button · a narrow Frame wraps its header">
        <Box style={{ width: 420 }}>
          <Chart title="Findings by source" data={bySource} x="source" xLabel="Source" series={sourceSeries} download={["csv", "png"]} expandable size="small">
            <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" />
          </Chart>
        </Box>
        <Box style={{ width: 300 }}>
          <Chart title="Coverage by control family" description="Determinations across 372 controls" series={statusSeries} data={byFamily} x="family" size="small">
            <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked size="small" />
          </Chart>
        </Box>
      </Specimens>
      <Specimens title="The colour scales · sequential · diverging">
        <Chart.Scale scale="sequential" min="0" max="12 findings" />
        <Chart.Scale scale="diverging" min="−12 days" mid="On plan" max="+12 days" />
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
        summary="Open findings fell from 14 in January to 5 in September; closed findings peaked at 11 in May."
        series={findingSeries}
        swatch="line"
        data={data}
        x="month"
        xLabel="Month"
        download={["csv", "png"]}
        expandable
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

/** The Frame: title, one line under it, the legend (hover dims the other series, click isolates one), a control that redraws the plot, and the Table toggle that lays the same numbers out. */
export const Framed: Story = { render: () => <FramedChart /> };

function ComponentCard({ name }: { name: string }) {
  const f = componentFacts[name];
  if (!f) return null;
  return (
    <Stack space="space.150">
      <div>
        <KeyValue label="Owner" labelWidth={88}>
          {f.owner}
        </KeyValue>
        <KeyValue label="Open" labelWidth={88}>
          {`${f.open} findings`}
        </KeyValue>
        <KeyValue label="Assessed" labelWidth={88}>
          {f.assessed}
        </KeyValue>
      </div>
      <Button size="small" variant="secondary">{`Open ${name}`}</Button>
    </Stack>
  );
}

function Drilling() {
  const [system, setSystem] = useState<string | null>(null);
  const rows = system ? componentsOf(system) : systemTotals;
  return (
    <Box style={{ width: 640 }}>
      <Chart.Frame
        title="Findings by system"
        description={system ? `Open findings by component of ${system}` : "Click a bar for its components"}
        path={
          system
            ? [{ label: "All systems", onSelect: () => setSystem(null) }, { label: system }]
            : undefined
        }
        data={rows}
        x="name"
        xLabel={system ? "Component" : "System"}
        series={brand}
      >
        <Chart.Bar
          data={rows}
          x="name"
          series={brand}
          labels="end"
          onSelect={system ? undefined : (s) => setSystem(String(s.datum["name"]))}
          details={system ? (s) => <ComponentCard name={String(s.datum["name"])} /> : undefined}
        />
      </Chart.Frame>
    </Box>
  );
}

/** A drill-down: a click on a system's bar redraws the plot with its components and puts the way back in the path; a click on a component opens its card. The same plot, one level down, animated between. */
export const Drilldown: Story = { render: () => <Drilling /> };

function FamilyCard({ selection }: { selection: ChartSelection }) {
  const code = String(selection.datum["family"]);
  const total = statusSeries.reduce((n, s) => n + Number(selection.datum[s.key] ?? 0), 0);
  return (
    <Stack space="space.150">
      <div>
        <KeyValue label="Family" labelWidth={88}>
          {familyNames[code] ?? code}
        </KeyValue>
        <KeyValue label="Controls" labelWidth={88}>
          {String(total)}
        </KeyValue>
        <KeyValue label="Target" labelWidth={88}>
          {`${String(selection.datum["target"])} satisfied`}
        </KeyValue>
      </div>
      <Button size="small" variant="secondary">{`Open ${code}`}</Button>
    </Stack>
  );
}

/** Details on a mark: a click on a segment opens a card anchored to it, with the kit's head (the series, the category, the value) and the caller's facts and link. Tab to the plot, arrow to a family and press Enter for the whole category. */
export const Details: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart
        title="Coverage by control family"
        description="Click a segment for the family; Enter on the focused plot opens the category"
        series={statusSeries}
        data={byFamily}
        x="family"
        xLabel="Family"
      >
        <Chart.Bar
          data={byFamily}
          x="family"
          series={statusSeries}
          stacked
          details={(s) => <FamilyCard selection={s} />}
        />
      </Chart>
    </Box>
  ),
};

function Filtering_() {
  const [family, setFamily] = useState<string | null>(null);
  const rows = family ? byFamily.filter((f) => f.family === family) : byFamily;
  return (
    <Stack space="space.200" style={{ width: 640 }}>
      <Chart
        title="Coverage by control family"
        description="Click a bar to filter the rows under it"
        series={statusSeries}
        data={byFamily}
        x="family"
      >
        <Chart.Bar
          data={byFamily}
          x="family"
          series={statusSeries}
          stacked
          onSelect={(s) => setFamily(String(s.datum["family"]))}
        />
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

/** A chart that filters: `onSelect` without `details`, so a click changes what is under the chart and opens nothing. The Clear button is the way back, reachable without the chart. */
export const Filtering: Story = { render: () => <Filtering_ /> };

/** One series is the point: it takes `brand`, the rest take `neutral`. The honest answer to "make this chart clearer". */
export const Emphasis: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart
        title="Reviews by assessor"
        description="D. Whitfield against the team"
        series={assessorsEmphasised}
        swatch="line"
        data={byAssessor}
        x="week"
      >
        <Chart.Line data={byAssessor} x="week" series={assessorsEmphasised} labels="end" />
      </Chart>
    </Box>
  ),
};

/** The Frame's states hold the plot's height, so the page does not jump when the data arrives. Loading draws the plot's own silhouette; refreshing keeps the last plot under a spinner. */
export const States: Story = {
  render: () => (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="space.300">
      <Chart title="Findings over time" description="Loading" series={findingSeries} swatch="line" status="loading">
        <Chart.Line data={byMonth} x="month" series={findingSeries} />
      </Chart>
      <Chart title="Findings over time" description="Refreshing" series={findingSeries} swatch="line" status="refreshing">
        <Chart.Line data={byMonth} x="month" series={findingSeries} />
      </Chart>
      <Chart title="Findings over time" description="Empty" status="empty" statusText="No findings in this window.">
        <Chart.Line data={byMonth} x="month" series={findingSeries} />
      </Chart>
      <Chart
        title="Findings over time"
        description="Error"
        status="error"
        statusText="The register did not answer."
        actions={
          <Button size="small" variant="subtle">
            Retry
          </Button>
        }
      >
        <Chart.Line data={byMonth} x="month" series={findingSeries} />
      </Chart>
    </Grid>
  ),
};

function Replaying() {
  const [n, setN] = useState(0);
  return (
    <Box style={{ width: 640 }}>
      <Chart
        title="Findings by source"
        description="The marks arrive over motion.duration.slow on the standard curve"
        data={bySource}
        x="source"
        series={sourceSeries}
        actions={
          <Button size="small" variant="subtle" iconBefore={<RotateCcw />} onClick={() => setN(n + 1)}>
            Replay
          </Button>
        }
      >
        <Chart.Bar key={n} data={bySource} x="source" series={sourceSeries} labels="end" />
      </Chart>
    </Box>
  );
}

/** Motion: bars grow from the baseline and lines draw in, once, over `motion.duration.slow`; a change of data moves the marks the same way; the tooltip follows over `motion.duration.fast`. Under reduced motion the marks draw in place. */
export const Motion: Story = { render: () => <Replaying /> };

/** The legend on its own beside a ring, and at the bottom of a Frame when the header is busy. */
export const Legends: Story = {
  render: () => (
    <Inline space="space.600" alignBlock="start" shouldWrap>
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
      <Box style={{ width: 420 }}>
        <Chart
          title="Reviews by assessor"
          series={assessors}
          swatch="line"
          legend="bottom"
          data={byAssessor}
          x="week"
          actions={
            <ToggleGroup
              aria-label="Range"
              value="5w"
              onChange={() => {}}
              items={[
                { value: "5w", label: "5 weeks" },
                { value: "13w", label: "13 weeks" },
              ]}
            />
          }
        >
          <Chart.Line data={byAssessor} x="week" series={assessors} size="small" />
        </Chart>
      </Box>
    </Inline>
  ),
};

const open = [{ key: "open", label: "Open", tone: "brand" as const }];
const closed = [{ key: "closed", label: "Closed", tone: "brand" as const }];
const assessed = [{ key: "assessed", label: "Assessed", tone: "brand" as const }];

/** Small multiples: three charts of one measure each on one scale (`domain`) and one hover (`syncId`). The honest answer to a dual axis and to more than six series. */
export const Linked: Story = {
  render: () => (
    <GridPrimitive templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap="space.300">
      <Chart title="Open findings" description="Per month" series={open} syncId="findings" data={byMonth} x="month" size="small">
        <Chart.Line data={byMonth} x="month" series={open} domain={[0, 20]} labels="end" size="small" />
      </Chart>
      <Chart title="Closed findings" description="Per month" series={closed} syncId="findings" data={byMonth} x="month" size="small">
        <Chart.Line data={byMonth} x="month" series={closed} domain={[0, 20]} labels="end" size="small" />
      </Chart>
      <Chart title="Controls assessed" description="Cumulative, its own scale" series={assessed} syncId="findings" data={byMonth} x="month" size="small">
        <Chart.Line data={byMonth} x="month" series={assessed} baseline="auto" labels="end" size="small" />
      </Chart>
    </GridPrimitive>
  ),
};

/** The Download menu hands the reader the table twin as a CSV, or the plot as a PNG at twice the pixel density on the surface colour; Expand opens the same chart in a large Dialog. Both sit with the Table toggle. */
export const Downloads: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Chart
        title="Coverage by control family"
        description="Determinations across 372 controls"
        series={statusSeries}
        data={byFamily}
        x="family"
        xLabel="Family"
        download={["csv", "png"]}
        expandable
      >
        <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked />
      </Chart>
    </Box>
  ),
};

/** `texture` on the Frame: every series wears a pattern as well as its colour, in the plot, the legend, the tooltip and the card. For print, colour-vision loss and forced colours; the first series stays solid. */
export const Textured: Story = {
  render: () => (
    <GridPrimitive templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="space.300">
      <Chart title="Coverage by control family" description="Textured" series={statusSeries} texture data={byFamily} x="family">
        <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked />
      </Chart>
      <Chart title="Reviews by assessor" description="Textured" series={assessors.slice(0, 4)} texture data={byAssessor} x="week">
        <Chart.Area data={byAssessor} x="week" series={assessors.slice(0, 4)} stacked />
      </Chart>
    </GridPrimitive>
  ),
};

/** At a narrow width the header wraps: the legend and the tools drop under the title, and the plot keeps its height. */
export const Narrow: Story = {
  render: () => (
    <Box style={{ width: 320 }}>
      <Chart
        title="Coverage by control family"
        description="Determinations across 372 controls"
        series={statusSeries}
        data={byFamily}
        x="family"
        download={["csv"]}
        expandable
      >
        <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked />
      </Chart>
    </Box>
  ),
};

/** The mistakes the family is written to prevent, each beside the right way. Each kind's page has its own. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
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
          <Chart
            title="Findings and controls"
            series={[
              { key: "open", label: "Open findings", tone: "danger" },
              { key: "assessed", label: "Controls assessed", tone: "brand" },
            ]}
            swatch="line"
            size="small"
          >
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
          <Chart title="Findings by source" description="Opened this year" data={bySource} x="source" series={sourceSeries} size="small">
            <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" />
          </Chart>
        }
        doText="Every chart on a page sits in its Frame: a title that names it, a line that says the period, the table one toggle away."
        dont={<Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" />}
        dontText="A bare plot. Nothing says what it counts or when; a screen reader hears nothing at all (an unnamed plot is decoration), and there is no table."
      />
      <Pair
        do={
          <Chart title="Findings by source" series={sourceSeries} size="small" status="loading">
            <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" />
          </Chart>
        }
        doText="Loading holds the plot's height with its own silhouette, so the page is laid out before the data and nothing jumps."
        dont={
          <Stack space="space.150">
            <Text weight="medium">Findings by source</Text>
            <Inline space="space.100" alignBlock="center">
              <Spinner />
              <Text size="small" color="color.text.subtle">
                Loading…
              </Text>
            </Inline>
          </Stack>
        }
        dontText="A spinner where the chart will be. The section is 24px tall until the data lands, then 200px, and everything under it moves."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    status: "ready",
    legend: "top",
    size: "medium",
  },
};
