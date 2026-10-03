import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";

import { Chart } from "../..";
import { Button, KeyValue } from "../../components";
import { Box, Stack } from "../../primitives";
import { assessors, byAssessor, byMonth, byWeek, findingSeries } from "../_lib/chart-data";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Patterns/Chart/Area",
  component: Chart.Area,
  parameters: { layout: "padded" },
  args: { data: byMonth, x: "month", series: findingSeries, label: "Findings over time" },
} satisfies Meta<typeof Chart.Area>;
export default meta;
type Story = StoryObj<typeof meta>;

const open = [{ key: "open", label: "Open", tone: "brand" as const }];

/** Findings open and closed at each milestone of an assessment, in order: long names. */
const byMilestone = [
  { milestone: "Kickoff", open: 2, closed: 0 },
  { milestone: "Evidence collection", open: 9, closed: 1 },
  { milestone: "Control testing", open: 16, closed: 4 },
  { milestone: "Findings review", open: 12, closed: 9 },
  { milestone: "Authorization package", open: 5, closed: 17 },
];

/** A category tick's printed words: its lines joined, without the whole name its title keeps. */
const printed = (text: Element) =>
  Array.from(text.childNodes)
    .filter((n) => n.nodeName !== "title")
    .map((n) => n.textContent ?? "")
    .join(" ");

/** Every area in both modes: one series, stacked, smooth with end labels; textured, a time axis, a shared domain; stacked with end labels on each band's top, a band and a limit, the skeleton. */
export const AreaMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Specimens title="One series · stacked · smooth with end labels">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Area data={byMonth} x="month" series={open} size="small" label="Open findings" />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Area
            data={byMonth}
            x="month"
            series={findingSeries}
            stacked
            size="small"
            label="Findings, stacked"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Area
            data={byMonth}
            x="month"
            series={findingSeries}
            curve="smooth"
            labels="end"
            size="small"
            label="Findings over time"
          />
        </Box>
      </Specimens>
      <Specimens title="Textured · a time axis · a shared domain">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Area
            data={byAssessor}
            x="week"
            series={assessors.slice(0, 4)}
            stacked
            texture
            size="small"
            label="Reviews by assessor, textured"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Area
            data={byWeek}
            x="date"
            scale="time"
            series={open}
            size="small"
            label="Open findings by week"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Area
            data={byMonth}
            x="month"
            series={open}
            domain={[0, 40]}
            size="small"
            label="Open findings, to 40"
          />
        </Box>
      </Specimens>
      <Specimens title="Stacked with end labels, each on its band · a band and a limit · loading">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Area
            data={byMonth}
            x="month"
            series={findingSeries}
            stacked
            labels="end"
            size="small"
            label="Findings, stacked, labelled"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
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
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Area
            data={byMonth}
            x="month"
            series={findingSeries}
            stacked
            size="small"
            label="Findings over time"
            loading
          />
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    // On a stack, each end label sits on its band's top and prints the band's own value: Closed (4)
    // sits on Open (5), so its label is the higher one, where the stack ends at 9.
    const plot = within(canvasElement).getByRole("img", { name: "Findings, stacked, labelled" });
    const label = (text: string) =>
      Array.from(plot.querySelectorAll<SVGTextElement>("svg > g text, svg text")).find(
        (t) =>
          t.textContent === text &&
          !t.closest(".recharts-cartesian-axis, .recharts-cartesian-axis-tick-labels"),
      );
    await waitFor(() => {
      expect(label("4")).toBeDefined();
      expect(label("5")).toBeDefined();
    });
    await expect(label("4")!.getBoundingClientRect().top).toBeLessThan(
      label("5")!.getBoundingClientRect().top,
    );
  },
};

/** One series with a wash under it: the wash says "how much" where a line alone says "which way". The hue at 12%. */
export const Single: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Open findings"
        description="At the end of each month, this year"
        series={open}
        data={byMonth}
        x="month"
        xLabel="Month"
      >
        <Chart.Area data={byMonth} x="month" series={open} labels="end" />
      </Chart>
    </Box>
  ),
};

/** Stacked areas: parts of a whole over time. The tooltip totals the stack. */
export const Stacked: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Findings, open and closed"
        description="Parts of the month's total"
        series={findingSeries}
        data={byMonth}
        x="month"
        xLabel="Month"
      >
        <Chart.Area data={byMonth} x="month" series={findingSeries} stacked />
      </Chart>
    </Box>
  ),
};

/** `texture` on a stack: each wash wears its pattern in its colour, so four assessors read apart in print and under colour-vision loss. */
export const Textured: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Reviews by assessor"
        description="Per week, stacked and textured"
        series={assessors.slice(0, 4)}
        texture
        data={byAssessor}
        x="week"
        xLabel="Week"
      >
        <Chart.Area data={byAssessor} x="week" series={assessors.slice(0, 4)} stacked />
      </Chart>
    </Box>
  ),
};

/** Long category names fit the room up to the next point, as on a Line: whole at 640px, however long; at 340px every milestone keeps a label inside the plot, on two lines or cut with an ellipsis and its whole name as its title. */
export const LongCategories: Story = {
  render: () => (
    <Stack space="space.400">
      {[640, 340].map((width) => (
        <Box key={width} style={{ width: "100%", maxWidth: width }}>
          <Chart
            title={`Findings by milestone, ${width}px`}
            series={findingSeries}
            data={byMilestone}
            x="milestone"
          >
            <Chart.Area stacked />
          </Chart>
        </Box>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const names = byMilestone.map((d) => d.milestone);
    const ticksOf = (name: string) =>
      Array.from(
        canvas.getByRole("figure", { name }).querySelectorAll(".recharts-xAxis-tick-labels text"),
      );
    // At any width every milestone keeps a label inside the svg, none over its neighbour, and a
    // cut one keeps its whole name as its title.
    for (const width of [640, 340]) {
      const name = `Findings by milestone, ${width}px`;
      await waitFor(() => expect(ticksOf(name)).toHaveLength(names.length));
      const svg = canvas
        .getByRole("figure", { name })
        .querySelector(".recharts-surface")!
        .getBoundingClientRect();
      const ticks = ticksOf(name);
      const boxes = ticks.map((t) => t.getBoundingClientRect());
      for (const [i, text] of ticks.entries()) {
        await expect(printed(text).replace(/…/g, "").trim().length).toBeGreaterThanOrEqual(3);
        if (printed(text) !== names[i])
          await expect(text.querySelector("title")?.textContent).toBe(names[i]);
        const box = boxes[i]!;
        await expect(box.left).toBeGreaterThanOrEqual(svg.left - 0.5);
        await expect(box.right).toBeLessThanOrEqual(svg.right + 0.5);
        if (i > 0) await expect(boxes[i - 1]!.right).toBeLessThanOrEqual(box.left + 0.5);
      }
    }
    // With the room, every name whole, however long.
    const wide = canvas.getByRole("figure", { name: "Findings by milestone, 640px" });
    if (wide.getBoundingClientRect().width >= 600)
      await expect(ticksOf("Findings by milestone, 640px").map(printed)).toEqual(names);
  },
};

/** A click in a month's column opens its card, as on a Line. */
export const Details: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Findings, open and closed"
        description="Click a month"
        series={findingSeries}
        data={byMonth}
        x="month"
        xLabel="Month"
      >
        <Chart.Area
          data={byMonth}
          x="month"
          series={findingSeries}
          stacked
          details={(s) => (
            <Stack space="space.150">
              <KeyValue label="Total" labelWidth="narrow">
                {String(Number(s.datum["open"]) + Number(s.datum["closed"]))}
              </KeyValue>
              <Button
                size="small"
                variant="secondary"
              >{`Findings in ${String(s.datum["month"])}`}</Button>
            </Stack>
          )}
        />
      </Chart>
    </Box>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Chart
            title="Reviews by assessor"
            series={assessors.slice(0, 3)}
            swatch="line"
            size="small"
          >
            <Chart.Line data={byAssessor} x="week" series={assessors.slice(0, 3)} size="small" />
          </Chart>
        }
        doText="Series that are not parts of one whole are lines: each reads on its own against the axis."
        dont={
          <Chart title="Reviews by assessor" series={assessors.slice(0, 3)} size="small">
            <Chart.Area
              data={byAssessor}
              x="week"
              series={assessors.slice(0, 3)}
              stacked
              size="small"
            />
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
