import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Chart } from "../..";
import { Button, KeyValue } from "../../components";
import { Box, Stack, Text } from "../../primitives";
import {
  assessors,
  byAssessor,
  byFamily,
  byMonth,
  byMonthRates,
  bySource,
  familyNames,
  percent,
  sourceSeries,
  statusSeries,
  varianceRows,
  varianceSeries,
  windows,
} from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/Chart/Bar",
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
/** Days: a signed count with a true minus sign, as the kit's deltas print it. */
const days = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)} days`;
const shortDays = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}d`;
/** Controls gained and lost by family this quarter: a stack with parts on both sides of zero. */
const churn = [
  { family: "AC", gained: 6, lost: -2 },
  { family: "AU", gained: 3, lost: -4 },
  { family: "CM", gained: 5, lost: -1 },
  { family: "IA", gained: 2, lost: -3 },
];
const churnSeries = [
  { key: "gained", label: "Gained", tone: "success" as const },
  { key: "lost", label: "Lost", tone: "danger" as const },
];
const churnLine = { key: "net", label: "Net", tone: "neutral" as const };
const churnRows = churn.map((d) => ({ ...d, net: d.gained + d.lost }));

/** Every arrangement in both modes: one series, grouped, stacked; horizontal with end labels, a target per bar, floating values; a line over the bars, axis titles, the skeleton; the three heights. */
export const BarMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="One series (brand) · grouped (the categorical set) · stacked (the status tones)">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={bySource}
            x="source"
            series={sourceSeries}
            size="small"
            label="Findings by source"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={byAssessor}
            x="week"
            series={assessors.slice(0, 3)}
            size="small"
            label="Reviews by assessor"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={byFamily}
            x="family"
            series={statusSeries}
            stacked
            size="small"
            label="Coverage by family"
          />
        </Box>
      </Specimens>
      <Specimens title="Horizontal with end labels · a target per bar · floating from-to values with a milestone">
        <Box style={{ width: "100%", maxWidth: 300 }}>
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
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={byFamily}
            x="family"
            series={satisfied}
            target="target"
            size="small"
            label="Satisfied against target"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
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
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={byMonth}
            x="month"
            series={closedBars}
            line={planLine}
            size="small"
            label="Closed against the plan"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={bySource}
            x="source"
            series={sourceSeries}
            xLabel="Source"
            yLabel="Findings"
            size="small"
            label="Findings by source"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={bySource}
            x="source"
            series={sourceSeries}
            size="small"
            label="Findings by source"
            loading
          />
        </Box>
      </Specimens>
      <Specimens title="Below zero, with the zero line · a shared domain · textured">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={varianceRows}
            x="phase"
            series={varianceSeries}
            labels="end"
            format={shortDays}
            size="small"
            label="Schedule variance by phase"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={bySource}
            x="source"
            series={sourceSeries}
            domain={[0, 60]}
            size="small"
            label="Findings by source, to 60"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={byFamily}
            x="family"
            series={statusSeries}
            stacked
            texture
            size="small"
            label="Coverage by family, textured"
          />
        </Box>
      </Specimens>
      <Specimens title="A stack's total at its end · a line over a stack (not in its total) · a stack across zero">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={byFamily}
            x="family"
            series={statusSeries}
            stacked
            labels="end"
            size="small"
            label="Coverage by family, totals"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={byMonth}
            x="month"
            series={[
              { key: "open", label: "Open", tone: "danger" },
              { key: "closed", label: "Closed", tone: "success" },
            ]}
            stacked
            line={planLine}
            size="small"
            label="Findings against the plan"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Bar
            data={churnRows}
            x="family"
            series={churnSeries}
            stacked
            line={churnLine}
            size="small"
            label="Controls gained and lost"
          />
        </Box>
      </Specimens>
      <Specimens title="Sizes · small 120 · medium 200 · large 320">
        <Box style={{ width: "100%", maxWidth: 240 }}>
          <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" label="Small" />
        </Box>
        <Box style={{ width: "100%", maxWidth: 240 }}>
          <Chart.Bar
            data={bySource}
            x="source"
            series={sourceSeries}
            size="medium"
            label="Medium"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 240 }}>
          <Chart.Bar data={bySource} x="source" series={sourceSeries} size="large" label="Large" />
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** Findings by source: one series, so no legend; `brand` because the reader is asked to look at it; the value at each bar's end. It chooses nothing, so it is an image named by the Frame's title, with no tab stop: the table carries its numbers. */
export const Single: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="Findings by source"
        description="Opened this year"
        data={bySource}
        x="source"
        xLabel="Source"
        series={sourceSeries}
      >
        <Chart.Bar data={bySource} x="source" series={sourceSeries} labels="end" />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const figure = canvas.getByRole("figure", { name: "Findings by source" });
    const plot = await within(figure).findByRole("img", { name: "Findings by source" });
    await expect(plot).toHaveAttribute("data-chart-surface");
    await expect(plot).not.toHaveAttribute("tabindex");
    await expect(figure.querySelector('[role="application"]')).toBeNull();
  },
};

/** Three assessors side by side, week by week: the categorical set in order, a 2px gap between bars. Past three, stack or emphasise. */
export const Grouped: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Reviews by assessor"
        description="Per week, the last five weeks"
        series={assessors.slice(0, 3)}
        data={byAssessor}
        x="week"
        xLabel="Week"
      >
        <Chart.Bar data={byAssessor} x="week" series={assessors.slice(0, 3)} />
      </Chart>
    </Box>
  ),
};

/** Coverage by family, four status series stacked: parts of each family's whole. The tones are the Badge's, and the tooltip totals the stack. A part hidden from the legend leaves the stack, which closes up over zero, and the value axis keeps its scale. */
export const Stacked: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Coverage by control family"
        description="Determinations across 372 controls"
        series={statusSeries}
        data={byFamily}
        x="family"
        xLabel="Family"
      >
        <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ticks = () =>
      Array.from(canvasElement.querySelectorAll(".recharts-yAxis-tick-labels text")).map(
        (t) => t.textContent,
      );
    // The bottom of the lowest part of the first stack: the stack's base.
    const base = () => {
      const part = canvasElement.querySelector<SVGGraphicsElement>(
        ".recharts-bar .recharts-rectangle",
      );
      if (!part) return Number.NaN;
      const box = part.getBBox();
      return Math.round(box.y + box.height);
    };
    await waitFor(() => expect(ticks().length).toBeGreaterThan(1));
    await waitFor(() => expect(base()).toBeGreaterThan(0));
    const scale = ticks();
    const floor = base();
    await userEvent.click(canvas.getByRole("button", { name: "Satisfied" }));
    await waitFor(() =>
      expect(canvasElement.querySelectorAll(".recharts-bar")).toHaveLength(statusSeries.length - 1),
    );
    // The part above the hidden one now stands on zero, not on the gap the hidden one left.
    await waitFor(() => expect(base()).toBe(floor), { timeout: 3000 });
    await expect(ticks()).toEqual(scale);
    // Shown again, and the pointer and focus leave the legend, so no series stays dimmed.
    const satisfied = canvas.getByRole("button", { name: "Satisfied" });
    await userEvent.click(satisfied);
    await userEvent.unhover(satisfied);
    satisfied.blur();
  },
};

/** Long names go down the side, and the value sits at the bar's end. With `onSelect`, the plot is one tab stop: Down and Right move to the next source, Up and Left to the one before, Home and End to either end, and each step is said in a live region. */
export const Horizontal: Story = {
  render: () => (
    <Box style={{ maxWidth: 480 }}>
      <Chart
        title="Findings by source"
        data={bySource}
        x="source"
        xLabel="Source"
        series={[{ key: "n", label: "Findings" }]}
      >
        <Chart.Bar
          data={bySource}
          x="source"
          series={[{ key: "n", label: "Findings", tone: "neutral" }]}
          horizontal
          labels="end"
          onSelect={() => {}}
          data-testid="sources-plot"
          aria-describedby="sources-note"
        />
      </Chart>
      <Text id="sources-note" size="small" color="color.text.subtle">
        Scans and procedures this quarter.
      </Text>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plot = await canvas.findByRole("application", { name: "Findings by source" });
    await expect(plot).toHaveAttribute("aria-roledescription", "chart");
    await expect(plot).toHaveAccessibleDescription(/Up and down arrows move between categories/);
    // The plot's box takes native props; `aria-describedby` describes the svg, beside its keys.
    await expect(canvas.getByTestId("sources-plot")).toHaveAttribute("data-chart-plot");
    await expect(plot).toHaveAccessibleDescription(/^Scans and procedures this quarter\./);
    const live = () => canvasElement.querySelector('[data-slot="chart-live"]')?.textContent;
    plot.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(live()).toBe("ACAS scan: Findings 27"));
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(live()).toBe("Code scan: Findings 19"));
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(live()).toBe("ACAS scan: Findings 27"));
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(live()).toBe("Code scan: Findings 19"));
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(live()).toBe("Test event: Findings 6"));
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(live()).toBe("Test event: Findings 6"));
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(live()).toBe("STIG checklist: Findings 41"));
    // The tooltip follows the keys: the category Home reached is the one it shows.
    await waitFor(() =>
      expect(canvasElement.querySelector(".recharts-tooltip-wrapper")).toHaveTextContent(
        /STIG checklist/,
      ),
    );
  },
};

/** Actual against planned: a mark in ink across each bar at its target: a bullet chart. */
export const Targets: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
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
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="RMF phase windows"
        description="Weeks from kickoff"
        data={windows}
        x="phase"
        xLabel="Phase"
        series={[{ key: "weeks", label: "Window" }]}
        format={(v) => `W${v}`}
      >
        <Chart.Bar
          data={windows}
          x="phase"
          series={windowSeries}
          horizontal
          reference={[{ y: 16, label: "Today" }]}
        />
      </Chart>
    </Box>
  ),
};

/** Bars with a line over them on the same axis: closed findings each month against the plan. The line's swatch is a stroke in the legend's tooltip. */
export const Combo: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Closed findings against the plan"
        description="Per month, this year"
        series={[...closedBars, planLine]}
        data={byMonth}
        x="month"
        xLabel="Month"
      >
        <Chart.Bar data={byMonth} x="month" series={closedBars} line={planLine} />
      </Chart>
    </Box>
  ),
};

/** Below zero: schedule variance in days hangs from the zero line, the rounded end at the data end, the label under the bar. The axis reaches below zero on its own; `domain` pins it, and a pinned axis ticks in round steps through zero, so the line every bar hangs from is labelled. */
export const Negatives: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="Schedule variance by phase"
        description="Days against the plan; below zero is early"
        data={varianceRows}
        x="phase"
        xLabel="Phase"
        series={varianceSeries}
        format={days}
      >
        <Chart.Bar
          data={varianceRows}
          x="phase"
          series={varianceSeries}
          labels="end"
          domain={[-6, 14]}
        />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const ticks = () =>
      Array.from(canvasElement.querySelectorAll(".recharts-yAxis-tick-labels text")).map(
        (t) => t.textContent,
      );
    await waitFor(() => expect(ticks()).toContain("0 days"));
    await expect(ticks()).toEqual(["−5 days", "0 days", "+5 days", "+10 days"]);
  },
};

/** Every category keeps a label at any width: a name that will not fit its column takes two lines, and a line past the column is cut with an ellipsis, the whole name in its title, the tooltip and the table. At 340px, six phases and five sources are all named. */
export const EveryCategory: Story = {
  render: () => (
    <Stack space="space.300">
      <Box style={{ width: "100%", maxWidth: 340 }}>
        <Chart title="Findings by source" data={bySource} x="source" series={sourceSeries}>
          <Chart.Bar />
        </Chart>
      </Box>
      <Box style={{ width: "100%", maxWidth: 340 }}>
        <Chart
          title="Schedule variance by phase"
          data={varianceRows}
          x="phase"
          series={varianceSeries}
          format={days}
        >
          <Chart.Bar labels="end" />
        </Chart>
      </Box>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [name, count] of [
      ["Findings by source", bySource.length],
      ["Schedule variance by phase", varianceRows.length],
    ] as const) {
      const figure = canvas.getByRole("figure", { name });
      await waitFor(() =>
        expect(figure.querySelectorAll(".recharts-xAxis-tick-labels text")).toHaveLength(count),
      );
      for (const text of figure.querySelectorAll(".recharts-xAxis-tick-labels text"))
        await expect(text.textContent?.length ?? 0).toBeGreaterThan(0);
    }
  },
};

/** A series' own `format`: the close rate is stored as a fraction and printed as a percentage on the axis, the labels, the tooltip, the card and the table, while the Frame keeps the kit's format for anything else. */
export const Rates: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Close rate by month"
        description="Closed over all findings in the month; the target is one in two"
        series={[{ key: "closeRate", label: "Close rate", tone: "brand", format: percent }]}
        data={byMonthRates}
        x="month"
        xLabel="Month"
      >
        <Chart.Bar
          data={byMonthRates}
          x="month"
          series={[{ key: "closeRate", label: "Close rate", tone: "brand", format: percent }]}
          format={percent}
          labels="end"
          domain={[0, 1]}
          reference={[{ y: 0.5, label: "Target" }]}
        />
      </Chart>
    </Box>
  ),
};

/** `texture`: every series wears a pattern as well as its colour, so a stack reads in print and under colour-vision loss. The legend and the tooltip wear it too. */
export const Textured: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Coverage by control family"
        description="Textured"
        series={statusSeries}
        texture
        data={byFamily}
        x="family"
        xLabel="Family"
      >
        <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked />
      </Chart>
    </Box>
  ),
};

/** A click on a segment opens its card: the kit's head (the series, the family, the value) and the caller's facts and link. Enter on the focused plot opens the whole category. */
export const Details: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Coverage by control family"
        description="Click a segment"
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
            series={statusSeries.map((s, i) => ({
              ...s,
              tone: `categorical.${(i + 1) as 1 | 2 | 3 | 4}` as const,
            }))}
            size="small"
          >
            <Chart.Bar
              data={byFamily}
              x="family"
              series={statusSeries.map((s, i) => ({
                ...s,
                tone: `categorical.${(i + 1) as 1 | 2 | 3 | 4}` as const,
              }))}
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
            <Chart.Bar
              data={bySource}
              x="source"
              series={[{ key: "n", label: "Findings", tone: "neutral" }]}
              horizontal
              labels="end"
              size="small"
            />
          </Chart>
        }
        doText="Long names go down the side, whole, with the value at the bar's end."
        dont={
          <Box style={{ width: "100%", maxWidth: 240 }}>
            <Chart title="Findings by source" size="small">
              <Chart.Bar
                data={bySource}
                x="source"
                series={[{ key: "n", label: "Findings", tone: "neutral" }]}
                size="small"
              />
            </Chart>
          </Box>
        }
        dontText="Long names under narrow columns. Every bar keeps a label, but on two lines cut to a few letters, and the reader hovers to learn which bar is which."
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
