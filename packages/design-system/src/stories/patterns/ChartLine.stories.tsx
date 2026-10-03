import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Chart, LedgerProvider } from "../..";
import { Button, KeyValue } from "../../components";
import { Box, Stack } from "../../primitives";
import {
  assessmentWindow,
  assessors,
  assessorsEmphasised,
  authorizationDate,
  byAssessor,
  byMonth,
  byMonthGaps,
  byWeek,
  findingSeries,
} from "../_lib/chart-data";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Patterns/Chart/Line",
  component: Chart.Line,
  parameters: { layout: "padded" },
  args: { data: byMonth, x: "month", series: findingSeries, label: "Findings over time" },
} satisfies Meta<typeof Chart.Line>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The assessment's kickoff, a month before its window opens. */
const kickoffDate = new Date(2026, 4, 4);

const open = [{ key: "open", label: "Open", tone: "brand" as const }];

/** Open findings at each milestone of an assessment, in order: names longer than a tick's usual room. */
const byMilestone = [
  { milestone: "Kickoff", open: 2 },
  { milestone: "Evidence collection", open: 9 },
  { milestone: "Control testing", open: 16 },
  { milestone: "Findings review", open: 12 },
  { milestone: "Authorization package", open: 5 },
];

/** A category tick's printed words: its lines joined, without the whole name its title keeps. */
const printed = (text: Element) =>
  Array.from(text.childNodes)
    .filter((n) => n.nodeName !== "title")
    .map((n) => n.textContent ?? "")
    .join(" ");
/** The category ticks of the Frame named `name`. */
const categoryTicks = (canvasElement: HTMLElement, name: string) =>
  Array.from(
    within(canvasElement)
      .getByRole("figure", { name })
      .querySelectorAll(".recharts-xAxis-tick-labels text"),
  );
const openPlan = [
  { key: "open", label: "Open", tone: "brand" as const },
  { key: "plan", label: "Plan", tone: "neutral" as const },
];

/** Every line in both modes: plain, smooth with dots, end labels; a band, a limit and a milestone, a cropped baseline, a gap; emphasis, axis titles, the skeleton. */
export const LineMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Specimens title="Plain · smooth with dots · end labels">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={findingSeries}
            size="small"
            label="Findings over time"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={findingSeries}
            curve="smooth"
            dots
            size="small"
            label="Findings over time"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={findingSeries}
            labels="end"
            size="small"
            label="Findings over time"
          />
        </Box>
      </Specimens>
      <Specimens title="A band, a limit and a milestone · baseline auto · a gap where the data was not there">
        <Box style={{ width: "100%", maxWidth: 300 }}>
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
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={[{ key: "plan", label: "Plan", tone: "neutral" }]}
            baseline="auto"
            size="small"
            label="Plan, cropped"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byMonthGaps}
            x="month"
            series={findingSeries}
            dots
            size="small"
            label="Findings, with gaps"
          />
        </Box>
      </Specimens>
      <Specimens title="A time axis with a date band and a milestone · a shared domain · deltas in the tooltip">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byWeek}
            x="date"
            scale="time"
            series={findingSeries}
            bands={[
              { fromX: assessmentWindow.from, toX: assessmentWindow.to, label: "Assessment" },
            ]}
            reference={[{ x: authorizationDate, label: "ATO" }]}
            size="small"
            label="Findings by week"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={open}
            domain={[0, 40]}
            size="small"
            label="Open findings, to 40"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={findingSeries}
            delta
            size="small"
            label="Findings over time, with deltas"
          />
        </Box>
      </Specimens>
      <Specimens title="Emphasis (brand and neutral) · axis titles · loading">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byAssessor}
            x="week"
            series={assessorsEmphasised}
            size="small"
            label="Reviews by assessor"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={open}
            xLabel="Month"
            yLabel="Findings"
            size="small"
            label="Open findings"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart.Line
            data={byMonth}
            x="month"
            series={findingSeries}
            size="small"
            label="Findings over time"
            loading
          />
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** Open and closed findings over nine months. Straight segments: the points are what was counted. Hiding a series in the legend keeps the value axis where it was. */
export const Lines: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Findings over time"
        description="At the end of each month, this year"
        series={findingSeries}
        swatch="line"
        data={byMonth}
        x="month"
        xLabel="Month"
      >
        <Chart.Line data={byMonth} x="month" series={findingSeries} labels="end" />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ticks = () =>
      Array.from(canvasElement.querySelectorAll(".recharts-yAxis-tick-labels text")).map(
        (t) => t.textContent,
      );
    await waitFor(() => expect(ticks().length).toBeGreaterThan(1));
    const before = ticks();
    const legendOpen = canvas.getByRole("button", { name: "Open" });
    await userEvent.click(legendOpen);
    await expect(legendOpen).toHaveAttribute("aria-pressed", "false");
    await waitFor(() => expect(ticks()).toEqual(before));
    // Shown again, and the pointer and focus leave the legend, so no series stays dimmed.
    await userEvent.click(legendOpen);
    await expect(legendOpen).toHaveAttribute("aria-pressed", "true");
    await userEvent.unhover(legendOpen);
    legendOpen.blur();
  },
};

/** A smooth curve with a marker on every point, for a series with few points where each is an event. The curve never overshoots the data. */
export const Smooth: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Open findings"
        description="Monthly count"
        series={open}
        data={byMonth}
        x="month"
        xLabel="Month"
      >
        <Chart.Line data={byMonth} x="month" series={open} curve="smooth" dots />
      </Chart>
    </Box>
  ),
};

/** A burndown: the open count against the plan, a band for the tolerable range, a limit in danger, a milestone on the category axis, and the last values printed. */
export const Burndown: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
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
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Controls assessed"
        description="Cumulative; the axis starts at the first month's count"
        series={[{ key: "assessed", label: "Assessed", tone: "brand" }]}
        data={byMonth}
        x="month"
        xLabel="Month"
      >
        <Chart.Line
          data={byMonth}
          x="month"
          series={[{ key: "assessed", label: "Assessed", tone: "brand" }]}
          baseline="auto"
          labels="end"
        />
      </Chart>
    </Box>
  ),
};

/** A missing value is a gap: April and July were not counted, and the line says so. `connectNulls` would draw across them and invent two months. */
export const Gaps: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Findings over time"
        description="The register was down in April and July"
        series={findingSeries}
        swatch="line"
        data={byMonthGaps}
        x="month"
        xLabel="Month"
      >
        <Chart.Line data={byMonthGaps} x="month" series={findingSeries} dots />
      </Chart>
    </Box>
  ),
};

/** Real dates: `scale="time"` spaces the weeks by time and picks the ticks by the span (months here, days or years elsewhere); a band between two dates is the assessment window and a reference on a date is the milestone. */
export const Dates: Story = {
  render: () => (
    <Box style={{ maxWidth: 720 }}>
      <Chart
        title="Findings by week"
        description="Open and closed at the end of each week, March to August"
        series={findingSeries}
        swatch="line"
        data={byWeek}
        x="date"
        xLabel="Week"
        download={["csv"]}
      >
        <Chart.Line
          data={byWeek}
          x="date"
          scale="time"
          series={findingSeries}
          labels="end"
          bands={[
            { fromX: assessmentWindow.from, toX: assessmentWindow.to, label: "Assessment window" },
          ]}
          reference={[{ x: authorizationDate, label: "ATO" }]}
        />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const ticks = () =>
      Array.from(canvasElement.querySelectorAll(".recharts-xAxis-tick-labels text")).map(
        (t) => t.textContent ?? "",
      );
    // The first tick stays, and carries the year; months follow on their own.
    await waitFor(() => expect(ticks()[0]).toBe("Apr 2026"));
    await expect(ticks().length).toBeGreaterThanOrEqual(5);
    await expect(ticks()[ticks().length - 1]).toMatch(/^Aug$/);
  },
};

/** Two points on the first of each month, February to September, as instants at UTC midnight. */
const monthStarts = Array.from({ length: 8 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 1 + i, 1)),
  open: [14, 17, 15, 19, 12, 11, 9, 8][i],
}));
/** A findings trend over nineteen months, crossing a year. */
const twoYears = Array.from({ length: 20 }, (_, i) => ({
  date: new Date(Date.UTC(2025, 1 + i, 1)),
  open: 30 - i,
}));

/** The time axis reads in the reader's zone: the ticks are the starts of months in New York, and none reads a month early (UTC midnight on the 1st is still the evening before there). Over nineteen months the ticks step by quarters from January, and the first tick and the one that starts 2026 carry the year. The second chart's labels are German. */
export const Zones: Story = {
  render: () => (
    <Stack space="space.400">
      <LedgerProvider timeZone="America/New_York">
        <Box style={{ maxWidth: 640 }}>
          <Chart title="Open findings, New York" series={open} data={monthStarts} x="date">
            <Chart.Line scale="time" />
          </Chart>
        </Box>
      </LedgerProvider>
      <LedgerProvider locale="de-DE" timeZone="Europe/Berlin">
        <Box style={{ maxWidth: 640 }}>
          <Chart title="Offene Feststellungen" series={open} data={twoYears} x="date">
            <Chart.Line scale="time" />
          </Chart>
        </Box>
      </LedgerProvider>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ticksOf = (name: string) =>
      Array.from(
        canvas.getByRole("figure", { name }).querySelectorAll(".recharts-xAxis-tick-labels text"),
      ).map((t) => t.textContent ?? "");
    await waitFor(() => expect(ticksOf("Open findings, New York")[0]).toBe("Feb 2026"));
    await expect(ticksOf("Open findings, New York")).not.toContain("Jan");
    await waitFor(() => expect(ticksOf("Offene Feststellungen").length).toBeGreaterThan(2));
    const german = ticksOf("Offene Feststellungen");
    await expect(german.length).toBeLessThanOrEqual(8);
    await expect(german[0]).toMatch(/2025$/);
    await expect(german.some((t) => /2026$/.test(t))).toBe(true);
  },
};

/** Long category names fit the room up to the next point, not a fixed number of characters. At 720px every milestone prints whole, the last on two lines where the plot's edge leaves it less room; at 340px every milestone keeps a label, on two lines or cut with an ellipsis, the whole name its title, and the first and the last move in from the plot's edges rather than past them. In a 200px card nine months cannot each hold three characters, so the labels step over every other month, whole, rather than shrink each to a letter. */
export const LongCategories: Story = {
  render: () => (
    <Stack space="space.400">
      <Box style={{ width: "100%", maxWidth: 720 }}>
        <Chart title="Open findings by milestone" series={open} data={byMilestone} x="milestone">
          <Chart.Line />
        </Chart>
      </Box>
      <Box style={{ width: "100%", maxWidth: 340 }}>
        <Chart
          title="Open findings by milestone, narrow"
          series={open}
          data={byMilestone}
          x="milestone"
        >
          <Chart.Line />
        </Chart>
      </Box>
      <Box style={{ width: "100%", maxWidth: 200 }}>
        <Chart title="Open findings, card" series={open} data={byMonth} x="month">
          <Chart.Line size="small" />
        </Chart>
      </Box>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const names = byMilestone.map((d) => d.milestone);
    const figure = (name: string) => within(canvasElement).getByRole("figure", { name });
    // At any width every milestone keeps a label inside the svg, none over its neighbour, and a
    // cut one keeps its whole name as its title.
    for (const name of ["Open findings by milestone", "Open findings by milestone, narrow"]) {
      await waitFor(() => expect(categoryTicks(canvasElement, name)).toHaveLength(names.length));
      const svg = figure(name).querySelector(".recharts-surface")!.getBoundingClientRect();
      const ticks = categoryTicks(canvasElement, name);
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
    if (figure("Open findings by milestone").getBoundingClientRect().width >= 600)
      await expect(categoryTicks(canvasElement, "Open findings by milestone").map(printed)).toEqual(
        names,
      );
    // A card: whole month names, stepping evenly from the first.
    const card = categoryTicks(canvasElement, "Open findings, card").map(printed);
    await expect(card.length).toBeGreaterThanOrEqual(3);
    await expect(card.length).toBeLessThan(byMonth.length);
    const at = card.map((m) => byMonth.findIndex((d) => d.month === m));
    await expect(at[0]).toBe(0);
    for (const [i, index] of at.entries()) if (i > 0) await expect(index - at[i - 1]!).toBe(at[1]);
  },
};

/** In a narrow plot (here a 300px frame, a panel's width, and a 200px card) the labels above it share one row: the window's and the milestone's move apart rather than overlap, the milestone's keeping closest to its line, and none leaves the plot's width, so none sits on the axis ticks. Each stays over its mark, a window's middle over its window: where the row is too short for them so (the third chart and the card), the window's label shortens before a milestone's, with an ellipsis and its whole text as its title. At the plot's start a milestone's label begins at its line, and two milestones on one date share one label (the fourth chart); there the first milestone's label gives way to the second's, and the window's beside them shortens only as far as the row needs, still over its window. The labels inside the plot are drawn over the lines, ringed in the surface, so the plan line runs behind "Tolerable". */
export const NarrowLabels: Story = {
  render: () => (
    <Stack space="space.400">
      <Box style={{ maxWidth: 300 }}>
        <Stack space="space.400">
          <Chart title="Findings by week" series={findingSeries} swatch="line">
            <Chart.Line
              data={byWeek}
              x="date"
              scale="time"
              series={findingSeries}
              labels="end"
              bands={[
                {
                  fromX: assessmentWindow.from,
                  toX: assessmentWindow.to,
                  label: "Assessment window",
                },
              ]}
              reference={[{ x: authorizationDate, label: "ATO" }]}
            />
          </Chart>
          <Chart title="Open findings against the plan" series={openPlan} swatch="line">
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
          <Chart title="Assessment milestones" series={findingSeries} swatch="line">
            <Chart.Line
              data={byWeek}
              x="date"
              scale="time"
              series={findingSeries}
              bands={[
                {
                  fromX: assessmentWindow.from,
                  toX: assessmentWindow.to,
                  label: "Independent assessment window",
                },
              ]}
              reference={[
                { x: kickoffDate, label: "Kickoff" },
                { x: authorizationDate, label: "ATO" },
              ]}
            />
          </Chart>
          <Chart title="Open findings from kickoff" series={open} swatch="line">
            <Chart.Line
              data={byMonth}
              x="month"
              series={open}
              bands={[{ fromX: "Mar", toX: "May", label: "Assessment window" }]}
              reference={[
                { x: "Jan", label: "Kickoff" },
                { x: "Feb", label: "SSP due" },
                { x: "Jul", label: "Report" },
                { x: "Jul", label: "ATO" },
              ]}
            />
          </Chart>
        </Stack>
      </Box>
      <Box style={{ maxWidth: 200 }}>
        <Chart title="Findings in the window" series={findingSeries} swatch="line">
          <Chart.Line
            data={byWeek}
            x="date"
            scale="time"
            series={findingSeries}
            bands={[
              {
                fromX: assessmentWindow.from,
                toX: assessmentWindow.to,
                label: "Assessment window",
              },
            ]}
            reference={[{ x: authorizationDate, label: "ATO" }]}
          />
        </Chart>
      </Box>
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    const label = (text: string) =>
      Array.from(canvasElement.querySelectorAll<SVGTextElement>("svg text")).find(
        (t) => t.textContent === text,
      );
    await waitFor(() => {
      expect(label("Assessment window")).toBeDefined();
      expect(label("ATO")).toBeDefined();
    });
    const windowLabel = label("Assessment window")!.getBoundingClientRect();
    const ato = label("ATO")!.getBoundingClientRect();
    // One row, no overlap: the window's label ends before the milestone's begins.
    await expect(windowLabel.right).toBeLessThanOrEqual(ato.left);
    const figure = canvas.getByRole("figure", { name: "Findings by week" });
    const frame = figure.getBoundingClientRect();
    await expect(windowLabel.left).toBeGreaterThanOrEqual(frame.left - 0.5);
    await expect(ato.right).toBeLessThanOrEqual(frame.right + 0.5);
    // Inside the plot, a label is ringed in the surface and drawn over the lines.
    const tolerable = label("Tolerable")!;
    await expect(tolerable).toHaveAttribute("paint-order", "stroke");
    const plan = canvas
      .getByRole("figure", { name: "Open findings against the plan" })
      .querySelector(".recharts-line");
    await expect(
      plan!.compareDocumentPosition(tolerable) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // A row too short for all three: the window's label shortens, titled with its whole text, and
    // stays over its band; the milestones' stay whole, and nothing overlaps or leaves the chart.
    const crowded = canvas.getByRole("figure", { name: "Assessment milestones" });
    const crowdedBox = crowded.getBoundingClientRect();
    const shortened = await waitFor(() => {
      const title = Array.from(crowded.querySelectorAll("svg g > title")).find(
        (t) => t.textContent === "Independent assessment window",
      );
      expect(title).toBeDefined();
      return title!.parentElement!.querySelector("text")!;
    });
    await expect(shortened.textContent).toMatch(/^Independent.*…$/);
    const whole = ["Kickoff", "ATO"].map((text) =>
      Array.from(crowded.querySelectorAll<SVGTextElement>("svg text")).find(
        (t) => t.textContent === text,
      ),
    );
    await expect(whole.every(Boolean)).toBe(true);
    const boxes = [shortened, ...whole.map((t) => t!)]
      .map((t) => t.getBoundingClientRect())
      .sort((a, b) => a.left - b.left);
    for (const [i, box] of boxes.entries()) {
      await expect(box.left).toBeGreaterThanOrEqual(crowdedBox.left - 0.5);
      await expect(box.right).toBeLessThanOrEqual(crowdedBox.right + 0.5);
      if (i > 0) await expect(boxes[i - 1]!.right).toBeLessThanOrEqual(box.left);
    }
    // A window's label keeps its middle over its window, however narrow the plot.
    for (const name of [
      "Findings by week",
      "Assessment milestones",
      "Findings in the window",
      "Open findings from kickoff",
    ]) {
      const figure = canvas.getByRole("figure", { name });
      const text = await waitFor(() => {
        // Its whole text is its title when it is shortened.
        const found = Array.from(figure.querySelectorAll<SVGTextElement>("svg text")).find((t) =>
          (
            t.parentElement?.querySelector(":scope > title")?.textContent ?? t.textContent
          )?.endsWith("window"),
        );
        expect(found).toBeDefined();
        return found!.getBoundingClientRect();
      });
      const band = figure.querySelector(".recharts-reference-area")!.getBoundingClientRect();
      const middle = (text.left + text.right) / 2;
      await expect(middle).toBeGreaterThanOrEqual(band.left - 0.5);
      await expect(middle).toBeLessThanOrEqual(band.right + 0.5);
    }
    // At the plot's start the milestone's label begins at its line, clear of the axis ticks, and
    // two milestones on one date share one label.
    const start = canvas.getByRole("figure", { name: "Open findings from kickoff" });
    const shared = await waitFor(() => {
      const found = Array.from(start.querySelectorAll<SVGTextElement>("svg text")).find(
        (t) => t.textContent === "Report · ATO",
      );
      expect(found).toBeDefined();
      return found!;
    });
    const lines = Array.from(start.querySelectorAll(".recharts-reference-line line")).map((l) =>
      l.getBoundingClientRect(),
    );
    const plotTop = Math.min(...lines.map((l) => l.top));
    const firstLine = Math.min(...lines.map((l) => l.left));
    const top = Array.from(start.querySelectorAll<SVGTextElement>("svg text")).filter(
      (t) =>
        !t.closest(".recharts-cartesian-axis, .recharts-cartesian-axis-tick-labels") &&
        t.getBoundingClientRect().bottom <= plotTop + 1,
    );
    await expect(top).toContain(shared);
    await expect(top.some((t) => t.textContent?.startsWith("Kic"))).toBe(true);
    // The first milestone's label gives way to the second's; the window's beside them shortens
    // only as far as the row needs, titled with its whole text, and nothing in the row overlaps.
    const beside = top.find(
      (t) => t.parentElement?.querySelector(":scope > title")?.textContent === "Assessment window",
    );
    await expect(beside?.textContent).toMatch(/^Assessment.*…$/);
    const row = top.map((t) => t.getBoundingClientRect()).sort((a, b) => a.left - b.left);
    for (const [i, box] of row.entries())
      if (i > 0) await expect(row[i - 1]!.right).toBeLessThanOrEqual(box.left);
    const ticks = Array.from(
      start.querySelectorAll(".recharts-cartesian-axis-tick-labels text"),
    ).map((t) => t.getBoundingClientRect());
    for (const label of top.map((t) => t.getBoundingClientRect())) {
      await expect(label.left).toBeGreaterThanOrEqual(firstLine - 0.5);
      for (const tick of ticks)
        await expect(
          label.right <= tick.left ||
            tick.right <= label.left ||
            label.bottom <= tick.top ||
            tick.bottom <= label.top,
        ).toBe(true);
    }
  },
};

/** `delta`: the tooltip and the card print each series' change from the point before, signed, beside the value. */
export const Deltas: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Findings over time"
        description="Hover a month for the change since the one before"
        series={findingSeries}
        swatch="line"
        data={byMonth}
        x="month"
        xLabel="Month"
      >
        <Chart.Line data={byMonth} x="month" series={findingSeries} delta details={() => null} />
      </Chart>
    </Box>
  ),
};

/** A click anywhere in a month's column, or Enter on the focused point, opens the month's card: every series at that point, then the caller's facts. The chosen point is ringed on every line. */
export const Details: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Findings over time"
        description="Click a month"
        series={findingSeries}
        swatch="line"
        data={byMonth}
        x="month"
        xLabel="Month"
      >
        <Chart.Line
          data={byMonth}
          x="month"
          series={findingSeries}
          details={(s) => (
            <Stack space="space.150">
              <div>
                <KeyValue label="Net" labelWidth="narrow">
                  {`${Number(s.datum["closed"]) - Number(s.datum["open"]) >= 0 ? "+" : ""}${Number(s.datum["closed"]) - Number(s.datum["open"])} closed`}
                </KeyValue>
                <KeyValue label="Plan" labelWidth="narrow">
                  {`${String(s.datum["plan"])} open`}
                </KeyValue>
              </div>
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
            series={assessorsEmphasised}
            swatch="line"
            size="small"
          >
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
            <Chart.Line
              data={byMonth}
              x="month"
              series={findingSeries}
              dots
              size="small"
              label="Findings over time, every point labelled"
            />
          </Chart>
        }
        dontText="A number on every point. It is chaos, and it goes unread. (The kit has no such prop; dots on every point is the closest it comes.)"
      />
      <Pair
        do={
          <Chart
            title="Findings over time"
            description="The register was down in April and July"
            series={findingSeries}
            swatch="line"
            size="small"
          >
            <Chart.Line data={byMonthGaps} x="month" series={findingSeries} size="small" />
          </Chart>
        }
        doText="A gap where the data was not there, and the description says why."
        dont={
          <Chart title="Findings over time" series={findingSeries} swatch="line" size="small">
            <Chart.Line
              data={byMonthGaps}
              x="month"
              series={findingSeries}
              connectNulls
              size="small"
            />
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
