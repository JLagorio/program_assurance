import type { Meta, StoryObj } from "@storybook/react-vite";

import { Download, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { expect, spyOn, userEvent, waitFor, within } from "storybook/test";

import { Chart, type ChartSelection } from "../..";
import {
  Badge,
  Button,
  KeyValue,
  Spinner,
  Stat,
  ToggleGroup,
  ToggleGroupItem,
} from "../../components";
import {
  Box,
  Grid,
  Grid as GridPrimitive,
  HeadingLevelProvider,
  Inline,
  Stack,
  Text,
} from "../../primitives";
import {
  assessors,
  assessorsEmphasised,
  byAssessor,
  byFamily,
  byFamilyFacts,
  byMonth,
  byMonthRates,
  bySource,
  componentFacts,
  componentsOf,
  familyNames,
  findingSeries,
  percent,
  riskGroups,
  sourceSeries,
  statusSeries,
  systemTotals,
} from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/Chart/Overview",
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

/* ---------- examples ---------- */

/** The Frame in every state, the legend in every swatch, the tones, and one of each kind inside it. */
export const ChartMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Frame · ready · loading (the plot's own skeleton) · refreshing (the last plot, dimmed)">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart title="Findings over time" series={findingSeries} swatch="line" size="small">
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart
            title="Findings over time"
            series={findingSeries}
            swatch="line"
            size="small"
            state="loading"
          >
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart
            title="Findings over time"
            series={findingSeries}
            swatch="line"
            size="small"
            state="refreshing"
          >
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        </Box>
      </Specimens>
      <Specimens title="Frame · empty · error with Try again beside it · a drill-down's path">
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart
            title="Findings over time"
            state="empty"
            statusText="No findings in this window."
            size="small"
          >
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart
            title="Findings over time"
            state="error"
            statusText="The register did not answer."
            size="small"
            onRetry={() => {}}
          >
            <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
          </Chart>
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart
            title="Findings by system"
            path={[{ label: "All systems", onSelect: () => {} }, { label: "Payments" }]}
            size="small"
          >
            <Chart.Bar
              data={componentsOf("Payments")}
              x="name"
              series={brand}
              size="small"
              labels="end"
            />
          </Chart>
        </Box>
      </Specimens>
      <Specimens title="Legend · squares · strokes · dots · at the bottom">
        <Chart.Legend series={statusSeries} />
        <Chart.Legend series={findingSeries} swatch="line" />
        <Chart.Legend series={riskGroups} swatch="dot" />
      </Specimens>
      <Specimens title="Frame · the Table twin, and a control in actions">
        <Box style={{ width: "100%", maxWidth: 420 }}>
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
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart title="Coverage by control family" series={statusSeries} texture size="small">
            <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked size="small" />
          </Chart>
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
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
        <Box style={{ width: "100%", maxWidth: 420 }}>
          <Chart
            title="Findings by source"
            data={bySource}
            x="source"
            xLabel="Source"
            series={sourceSeries}
            download={["csv", "png"]}
            expandable
            size="small"
          >
            <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" />
          </Chart>
        </Box>
        <Box style={{ width: "100%", maxWidth: 300 }}>
          <Chart
            title="Coverage by control family"
            description="Determinations across 372 controls"
            series={statusSeries}
            data={byFamily}
            x="family"
            size="small"
          >
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
  const figure = useRef<HTMLElement>(null);
  const [range, setRange] = useState<"3m" | "9m">("9m");
  const data = range === "3m" ? byMonth.slice(-3) : byMonth;
  return (
    <Box style={{ maxWidth: 720 }}>
      <Button onClick={() => figure.current?.focus()}>Focus chart</Button>
      <Chart.Frame
        ref={figure}
        id="findings-chart"
        tabIndex={-1}
        data-report="findings"
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
            value={[range]}
            onValueChange={(values) => {
              if (values[0]) setRange(values[0]);
            }}
          >
            <ToggleGroupItem value="3m">3 months</ToggleGroupItem>
            <ToggleGroupItem value="9m">9 months</ToggleGroupItem>
          </ToggleGroup>
        }
      >
        <Chart.Line data={data} x="month" series={findingSeries} labels="end" />
      </Chart.Frame>
    </Box>
  );
}

/** The Frame: title, one line under it, the legend (hover dims the other series, click hides its own), a control that redraws the plot, and the Table toggle that lays the same numbers out. */
export const Framed: Story = {
  render: () => <FramedChart />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const figure = canvas.getByRole("figure", { name: "Findings over time" });
    await expect(figure).toHaveAttribute("id", "findings-chart");
    await expect(figure).toHaveAttribute("data-report", "findings");
    await userEvent.click(canvas.getByRole("button", { name: "Focus chart" }));
    await expect(figure).toHaveFocus();
    // A plot that chooses nothing is an image named by the title, with no tab stop; the figure is
    // described by its line and its summary, and the summary is not read again in the caption.
    const plot = within(figure).getByRole("img", { name: "Findings over time" });
    await expect(plot).toHaveAttribute("data-chart-surface");
    await expect(plot).not.toHaveAttribute("tabindex");
    await expect(figure).toHaveAccessibleDescription(
      "Open and closed at the end of each month, this year Open findings fell from 14 in January to 5 in September; closed findings peaked at 11 in May.",
    );
    await expect(within(figure).queryByText(/Open findings fell/)).not.toBeVisible();
    // The tooltip the card stands down is recharts' own wrapper.
    await expect(figure.querySelector(".recharts-tooltip-wrapper")).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Open" }));
    await expect(canvas.getByRole("button", { name: "Open" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    // The series just hidden is still under the pointer, and the one left is not dimmed for it.
    await expect(figure.querySelectorAll("[data-chart-plot] .opacity-disabled")).toHaveLength(0);
    // Inline, the plot takes the medium height.
    await expect(
      figure.querySelector("[data-chart-plot]")?.getBoundingClientRect().height,
    ).toBeCloseTo(200, 0);
    // The Table toggle keeps its name when pressed; `aria-pressed` carries the state, and focus stays.
    const table = canvas.getByRole("button", { name: "Table" });
    await expect(table).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(table);
    await expect(canvas.getByRole("button", { name: "Table" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(table).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Expand" }));
    const dialog = await page.findByRole("dialog", { name: "Findings over time" });
    await expect(within(dialog).getByRole("figure")).not.toHaveAttribute("id", "findings-chart");
    await expect(canvasElement.ownerDocument.querySelectorAll("#findings-chart")).toHaveLength(1);
    await expect(within(dialog).getByRole("button", { name: "Open" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await waitFor(() => expect(within(dialog).getByRole("table")).toBeVisible());
    const dialogTable = within(dialog).getByRole("button", { name: "Table" });
    await expect(dialogTable).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(dialogTable);
    // Expanded, the same plot redraws at large.
    await waitFor(() =>
      expect(dialog.querySelector("[data-chart-plot]")?.getBoundingClientRect().height).toBeCloseTo(
        320,
        0,
      ),
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "Open" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Open" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Focus chart" }));
    await expect(figure).toHaveFocus();
  },
};

const closeRate = [{ key: "closeRate", label: "Close rate", tone: "brand" as const }];
/** Each family's determinations as shares of its controls. */
const familyShares = byFamily.map(({ family, satisfied, partial, other, notAssessed }) => {
  const total = satisfied + partial + other + notAssessed;
  return {
    family,
    satisfied: satisfied / total,
    partial: partial / total,
    other: other / total,
    notAssessed: notAssessed / total,
  };
});

/** Said once. On the left the Frame holds the data, the series, the format and the size, and the bar inside is bare; Expand redraws it at large. On the right the Frame holds only its title and the bar holds everything: the legend keys the bar's series, and the table and the CSV print its format. Either way the plot, the tooltip, the table and the CSV say the same thing. */
export const SaidOnce: Story = {
  render: () => (
    <GridPrimitive templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="space.300">
      <Chart
        title="Close rate by month"
        description="Closed as a share of open and closed"
        data={byMonthRates}
        x="month"
        xLabel="Month"
        series={closeRate}
        format={percent}
        size="small"
        expandable
      >
        <Chart.Bar labels="end" />
      </Chart>
      <Chart
        title="Coverage by control family, as shares"
        description="Each family's determinations"
        download={["csv"]}
      >
        <Chart.Bar
          data={familyShares}
          x="family"
          xLabel="Family"
          series={statusSeries}
          stacked
          domain={[0, 1]}
          format={percent}
        />
      </Chart>
    </GridPrimitive>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const rates = canvas.getByRole("figure", { name: "Close rate by month" });
    const shares = canvas.getByRole("figure", { name: "Coverage by control family, as shares" });
    // The bare bar draws the Frame's records at the Frame's size.
    await expect(
      rates.querySelector("[data-chart-plot]")?.getBoundingClientRect().height,
    ).toBeCloseTo(120, 0);
    // In the Frame's format: the value axis prints percentages.
    await waitFor(() =>
      expect(
        Array.from(rates.querySelectorAll(".recharts-yAxis-tick-labels text")).some((t) =>
          /^\d+%$/.test(t.textContent ?? ""),
        ),
      ).toBe(true),
    );
    await userEvent.click(within(rates).getByRole("button", { name: "Table" }));
    const rateTable = await within(rates).findByRole("table");
    await expect(within(rateTable).getAllByRole("row")[1]).toHaveTextContent("Jan18%");
    await userEvent.click(within(rates).getByRole("button", { name: "Table" }));
    await userEvent.click(within(rates).getByRole("button", { name: "Expand" }));
    const dialog = await page.findByRole("dialog", { name: "Close rate by month" });
    await waitFor(() =>
      expect(dialog.querySelector("[data-chart-plot]")?.getBoundingClientRect().height).toBeCloseTo(
        320,
        0,
      ),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    // The Frame given only a title keys the bar's series and prints its format in the table.
    await expect(within(shares).getByRole("button", { name: "Satisfied" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(within(shares).getByRole("button", { name: "Table" }));
    const shareTable = await within(shares).findByRole("table");
    await expect(
      within(shareTable)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Family", "Satisfied", "Partial", "Other than satisfied", "Not assessed"]);
    await expect(within(shareTable).getAllByRole("row")[1]).toHaveTextContent("AC71%10%15%4%");
  },
};

/** Each determination across every family: a ring's slices. */
const overall = statusSeries.map((s) => ({
  key: s.key,
  label: s.label ?? s.key,
  tone: s.tone,
  value: byFamily.reduce((n, d) => n + Number((d as Record<string, unknown>)[s.key] ?? 0), 0),
}));

function Following() {
  const [view, setView] = useState<"family" | "overall" | "figures">("family");
  return (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Control coverage"
        description="Determinations across six families"
        actions={
          <ToggleGroup
            aria-label="View"
            value={[view]}
            onValueChange={(values) => {
              if (values[0]) setView(values[0]);
            }}
          >
            <ToggleGroupItem value="family">By family</ToggleGroupItem>
            <ToggleGroupItem value="overall">Overall</ToggleGroupItem>
            <ToggleGroupItem value="figures">Figures</ToggleGroupItem>
          </ToggleGroup>
        }
      >
        {view === "family" ? (
          <Chart.Bar data={byFamily} x="family" xLabel="Family" series={statusSeries} stacked />
        ) : view === "overall" ? (
          <Chart.Donut slices={overall} label="75%" caption="satisfied" size={160} thickness={16} />
        ) : (
          <div>
            {overall.map((s) => (
              <KeyValue key={s.key} label={s.label} labelWidth={160}>
                {String(s.value)}
              </KeyValue>
            ))}
          </div>
        )}
      </Chart>
    </Box>
  );
}

/** The Frame follows the part it holds. Swap the bars for a ring and the legend keys its slices, a series hidden from the bars stays hidden in the ring (and out of the bars' table), and the table lays the ring out by slice. Swap the ring for figures, which are no part, and the legend and the Table toggle leave with it rather than describe a plot that is gone. */
export const FollowsItsPart: Story = {
  render: () => <Following />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const figure = within(canvas.getByRole("figure", { name: "Control coverage" }));
    const headings = () => figure.getAllByRole("columnheader").map((h) => h.textContent);
    await userEvent.click(figure.getByRole("button", { name: "Partial" }));
    await expect(figure.getByRole("button", { name: "Partial" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await userEvent.click(figure.getByRole("button", { name: "Table" }));
    // The table shows what the legend shows: Partial, hidden, leaves it too (the CSV keeps it).
    await expect(headings()).toEqual([
      "Family",
      "Satisfied",
      "Other than satisfied",
      "Not assessed",
    ]);
    // Each row is headed by its category.
    await expect(figure.getAllByRole("rowheader")[0]).toHaveTextContent("AC");
    await userEvent.click(figure.getByRole("button", { name: "Table" }));
    // The ring: the same keys, so Partial stays hidden; the track and the slices draw.
    await userEvent.click(figure.getByRole("button", { name: "Overall" }));
    // The hidden slice keeps its place, so the others keep their angles.
    await waitFor(() =>
      expect(canvasElement.querySelectorAll(".recharts-pie-sector").length).toBeGreaterThanOrEqual(
        4,
      ),
    );
    await expect(figure.getByRole("button", { name: "Partial" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await userEvent.click(figure.getByRole("button", { name: "Table" }));
    await expect(headings()).toEqual(["Category", "Value", "Share"]);
    await expect(figure.getAllByRole("row")).toHaveLength(5);
    await userEvent.click(figure.getByRole("button", { name: "Table" }));
    // Figures are no part: nothing is left to key or to lay out.
    await userEvent.click(figure.getByRole("button", { name: "Figures" }));
    await waitFor(() =>
      expect(figure.queryByRole("button", { name: "Satisfied" })).not.toBeInTheDocument(),
    );
    await expect(figure.queryByRole("button", { name: "Table" })).not.toBeInTheDocument();
    await userEvent.click(figure.getByRole("button", { name: "By family" }));
    await expect(await figure.findByRole("button", { name: "Satisfied" })).toBeVisible();
    await expect(figure.getByRole("button", { name: "Table" })).toBeVisible();
  },
};

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
    <Box style={{ maxWidth: 640 }}>
      <Chart.Frame
        title="Findings by system"
        description={
          system ? `Open findings by component of ${system}` : "Click a bar for its components"
        }
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
    <Box style={{ maxWidth: 640 }}>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const plot = canvas.getByRole("application");
    const figure = canvas.getByRole("figure", { name: "Coverage by control family" });
    let previousPath: string | null = null;
    let changedAt = performance.now();
    const mark = await waitFor(() => {
      const element = canvasElement.querySelector<SVGGraphicsElement>(".recharts-bar-rectangle");
      const path = element?.querySelector("path")?.getAttribute("d") ?? null;
      if (path !== previousPath) changedAt = performance.now();
      previousPath = path;
      // The plot has measured its container: it spans the Frame, whatever the frame's width.
      expect(
        Math.abs(plot.getBoundingClientRect().width - figure.getBoundingClientRect().width),
      ).toBeLessThan(2);
      expect(element?.getBoundingClientRect().height).toBeGreaterThan(0);
      // Recharts keys animated marks by their changing coordinates, replacing each SVG node.
      expect(performance.now() - changedAt).toBeGreaterThan(100);
      return element!;
    });
    const markRect = mark.getBoundingClientRect();
    await userEvent.click(mark);
    const dialog = await page.findByRole("dialog", { name: "Coverage by control family, details" });
    await waitFor(() => expect(within(dialog).getByText("Access control")).toBeVisible());
    // The card says what the tooltip would, so the tooltip stands down while the card is open.
    const tooltip = canvasElement.querySelector(".recharts-tooltip-wrapper");
    if (tooltip) await expect(getComputedStyle(tooltip).display).toBe("none");
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Open AC" })).toHaveFocus(),
    );
    await waitFor(() => {
      const popupRect = dialog.getBoundingClientRect();
      expect(popupRect.left).toBeLessThan(markRect.right);
      expect(popupRect.right).toBeGreaterThan(markRect.left);
      expect(
        Math.min(
          Math.abs(popupRect.bottom - markRect.top),
          Math.abs(popupRect.top - markRect.bottom),
        ),
      ).toBeLessThan(16);
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(plot).toHaveFocus());
    // The plot is one tab stop named by the Frame's title and described by its keys; each step of
    // the arrow keys is said in its live region, the category and every value, then the total.
    await expect(plot).toHaveAccessibleName("Coverage by control family");
    await expect(plot).toHaveAttribute("aria-roledescription", "chart");
    await expect(plot).toHaveAttribute("data-chart-surface");
    const live = canvasElement.querySelector('[data-slot="chart-live"]');
    await expect(live).toHaveAttribute("aria-live", "polite");
    await userEvent.keyboard("{Home}{ArrowRight}");
    await waitFor(() =>
      expect(live).toHaveTextContent(
        "AU: Satisfied 18, Partial 4, Other than satisfied 3, Not assessed 1, total 26",
      ),
    );
    // Enter chooses the category the live region said, though the pointer still rests on AC.
    await userEvent.keyboard("{Enter}");
    const reopened = await page.findByRole("dialog", {
      name: "Coverage by control family, details",
    });
    await waitFor(() =>
      expect(within(reopened).getByRole("button", { name: "Open AU" })).toHaveFocus(),
    );
    await userEvent.click(canvas.getByText("Coverage by control family"));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(plot).toHaveFocus());
    // Come back to by the keyboard, the plot is where it was left: said, shown and chosen there.
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(live).toHaveTextContent(/^CM: /));
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(plot).toHaveFocus());
    await waitFor(() =>
      expect(canvasElement.querySelector(".recharts-tooltip-wrapper")).toHaveTextContent(/^CM/),
    );
    await userEvent.keyboard("{Enter}");
    const again = await page.findByRole("dialog", { name: "Coverage by control family, details" });
    await waitFor(() =>
      expect(within(again).getByRole("button", { name: "Open CM" })).toHaveFocus(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

function Filtering_() {
  const [family, setFamily] = useState<string | null>(null);
  const rows = family ? byFamily.filter((f) => f.family === family) : byFamily;
  return (
    <Box style={{ maxWidth: 640 }}>
      <Stack space="space.200">
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
            <Badge
              variant="secondary"
              tone="neutral"
              key={r.family}
            >{`${r.family} · ${r.satisfied + r.partial + r.other + r.notAssessed}`}</Badge>
          ))}
        </Inline>
      </Stack>
    </Box>
  );
}

/** The table twin with columns beyond the series: `columns` names keys in the datum the plot does not draw, a name beside the category (`place: "before"`), a total, a share and an owner after the series, so the twin is the record's table and not only the plot's. The CSV carries them too. Click Table. */
export const Columns: Story = {
  render: () => (
    <Box style={{ maxWidth: 760 }}>
      <Chart
        title="Coverage by control family"
        description="Determinations across the six families; the table adds the name, the total, the share and the owner"
        series={statusSeries}
        data={byFamilyFacts}
        x="family"
        xLabel="Family"
        columns={[
          { key: "name", label: "Name", place: "before" },
          { key: "total", label: "Total" },
          { key: "share", label: "Share", format: (v) => `${String(v)}%` },
          { key: "owner", label: "Owner" },
        ]}
        download={["csv"]}
      >
        <Chart.Bar data={byFamilyFacts} x="family" series={statusSeries} stacked />
      </Chart>
    </Box>
  ),
};

/** A chart that filters: `onSelect` without `details`, so a click changes what is under the chart and opens nothing. The Clear button is the way back, reachable without the chart. */
export const Filtering: Story = { render: () => <Filtering_ /> };

/** One series is the point: it takes `brand`, the rest take `neutral`. The honest answer to "make this chart clearer". */
export const Emphasis: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
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

/** The Frame's states hold the plot's height, so the page does not jump when the data arrives. Loading draws the plot's own silhouette or a generic placeholder; refreshing keeps the last plot under a spinner. */
export const States: Story = {
  render: () => (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="space.300">
      <Chart
        title="Findings over time"
        description="Loading"
        series={findingSeries}
        swatch="line"
        state="loading"
      >
        <Chart.Line data={byMonth} x="month" series={findingSeries} />
      </Chart>
      <Chart.Frame
        title="Loading without a plot"
        description="Generic loading placeholder"
        state="loading"
        size="medium"
        children={null}
      />
      <Chart
        title="Findings over time"
        description="Refreshing"
        series={findingSeries}
        swatch="line"
        state="refreshing"
      >
        <Chart.Line data={byMonth} x="month" series={findingSeries} />
      </Chart>
      <Chart
        title="Findings over time"
        description="Empty"
        state="empty"
        statusText="No findings in this window."
      >
        <Chart.Line data={byMonth} x="month" series={findingSeries} />
      </Chart>
      <Chart
        title="Findings over time"
        description="Error"
        state="error"
        statusText="The register did not answer."
        onRetry={() => {}}
      >
        <Chart.Line data={byMonth} x="month" series={findingSeries} />
      </Chart>
      <Chart
        title="Findings this week"
        description="Ready, with no records"
        data={[]}
        x="month"
        series={findingSeries}
        statusText="Nothing was opened or closed this week."
        statusAction={
          <Button size="small" variant="secondary">
            Clear filters
          </Button>
        }
      >
        <Chart.Line />
      </Chart>
    </Grid>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loadingFrame = canvas.getByRole("figure", { name: "Loading without a plot" });
    const skeleton = loadingFrame.querySelector<HTMLElement>('[data-slot="skeleton"]');
    // The figure says its state as DataTable does.
    await expect(loadingFrame).toHaveAttribute("data-slot", "chart-frame");
    await expect(loadingFrame).toHaveAttribute("data-state", "loading");

    await expect(skeleton).toHaveAttribute("aria-hidden", "true");
    // The standard medium plot reserves 200px while its data loads.
    await expect(skeleton?.getBoundingClientRect().height).toBe(200);
    // A failed plot is an alert, as a failed table is, with Try again beside its message.
    const failed = canvas
      .getAllByRole("figure", { name: "Findings over time" })
      .find((f) => f.getAttribute("data-state") === "error")!;
    const alert = within(failed).getByRole("alert");
    await expect(alert).toHaveTextContent("The chart could not load");
    await expect(within(alert).getByRole("button", { name: "Try again" })).toBeVisible();
    // Ready with records that hold nothing says so, with its action, instead of drawing bare axes.
    const empty = canvas.getByRole("figure", { name: "Findings this week" });
    await expect(empty).toHaveAttribute("data-state", "empty");
    await expect(within(empty).getByText("Nothing to show yet")).toBeVisible();
    await expect(within(empty).getByRole("button", { name: "Clear filters" })).toBeVisible();
    await expect(empty.querySelector(".recharts-surface")).toBeNull();
    await expect(
      failed.querySelector('[data-slot="chart-status"]')?.getBoundingClientRect().height,
    ).toBeGreaterThanOrEqual(200);
  },
};

function Replaying() {
  const [n, setN] = useState(0);
  return (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Findings by source"
        description="The marks arrive over motion.duration.slow on the standard curve"
        data={bySource}
        x="source"
        series={sourceSeries}
        actions={
          <Button
            size="small"
            variant="subtle"
            iconBefore={<RotateCcw />}
            onClick={() => setN(n + 1)}
          >
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
      <Box style={{ width: "100%", maxWidth: 420 }}>
        <Chart
          title="Reviews by assessor"
          series={assessors}
          swatch="line"
          legend="bottom"
          data={byAssessor}
          x="week"
          actions={
            <ToggleGroup aria-label="Range" defaultValue={["5w"]}>
              <ToggleGroupItem value="5w">5 weeks</ToggleGroupItem>
              <ToggleGroupItem value="13w">13 weeks</ToggleGroupItem>
            </ToggleGroup>
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
      <Chart
        title="Open findings"
        description="Per month"
        series={open}
        syncId="findings"
        data={byMonth}
        x="month"
        size="small"
      >
        <Chart.Line
          data={byMonth}
          x="month"
          series={open}
          domain={[0, 20]}
          labels="end"
          size="small"
        />
      </Chart>
      <Chart
        title="Closed findings"
        description="Per month"
        series={closed}
        syncId="findings"
        data={byMonth}
        x="month"
        size="small"
      >
        <Chart.Line
          data={byMonth}
          x="month"
          series={closed}
          domain={[0, 20]}
          labels="end"
          size="small"
        />
      </Chart>
      <Chart
        title="Controls assessed"
        description="Cumulative, its own scale"
        series={assessed}
        syncId="findings"
        data={byMonth}
        x="month"
        size="small"
      >
        <Chart.Line
          data={byMonth}
          x="month"
          series={assessed}
          baseline="auto"
          labels="end"
          size="small"
        />
      </Chart>
    </GridPrimitive>
  ),
};

/** The Download menu hands the reader the table twin as a CSV, or the plot as a PNG at twice the pixel density on the surface colour; Expand opens the same chart in a large Dialog. Both sit with the Table toggle. */
export const Downloads: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const create = spyOn(URL, "createObjectURL");
    const click = spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const blobs = () => create.mock.calls.map((call) => call[0] as Blob);
    try {
      await canvas.findByRole("img", { name: "Coverage by control family" });
      await userEvent.click(canvas.getByRole("button", { name: "Download" }));
      await userEvent.click(await page.findByRole("menuitem", { name: "Download CSV" }));
      await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
      const anchor = click.mock.contexts[0] as HTMLAnchorElement;
      await expect(anchor.download).toBe("coverage-by-control-family.csv");
      const csv = blobs().at(-1)!;
      await expect(csv.type).toBe("text/csv;charset=utf-8");
      const bytes = new Uint8Array(await csv.arrayBuffer());
      // A byte order mark for the spreadsheet, and CRLF between lines.
      await expect(bytes.slice(0, 3)).toEqual(new Uint8Array([0xef, 0xbb, 0xbf]));
      await expect(new TextDecoder().decode(bytes.slice(3))).toMatch(
        /^Family,Satisfied,Partial,Other than satisfied,Not assessed\r\nAC,34,5,7,2\r\n/,
      );
      // The first menu finishes closing before the second opens, or its fading item is found.
      await waitFor(() => expect(page.queryByRole("menu")).toBeNull());
      await userEvent.click(canvas.getByRole("button", { name: "Download" }));
      await userEvent.click(await page.findByRole("menuitem", { name: "Download PNG" }));
      await waitFor(() => expect(click).toHaveBeenCalledTimes(2));
      const png = blobs().at(-1)!;
      await expect(png.type).toBe("image/png");
      await expect(png.size).toBeGreaterThan(1000);
      await expect((click.mock.contexts[1] as HTMLAnchorElement).download).toBe(
        "coverage-by-control-family.png",
      );
      // The image holds the title and the legend above the plot: taller than the plot alone.
      const image = await createImageBitmap(png);
      const plot = canvasElement.querySelector("svg[data-chart-surface]")!.getBoundingClientRect();
      await expect(image.height / 2).toBeGreaterThan(plot.height + 20);
      await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
      await waitFor(() => expect(page.queryByRole("menu")).not.toBeInTheDocument());
      // With the table showing there is no plot to draw: the PNG item says what brings it back.
      await userEvent.click(canvas.getByRole("button", { name: "Table" }));
      await userEvent.click(canvas.getByRole("button", { name: "Download" }));
      const pngItem = await page.findByRole("menuitem", { name: "Download PNG" });
      await expect(pngItem).toHaveAttribute("aria-disabled", "true");
      await expect(pngItem).toHaveAccessibleDescription("Show the chart to save it as an image.");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(page.queryByRole("menu")).not.toBeInTheDocument());
      await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    } finally {
      create.mockRestore();
      click.mockRestore();
    }
  },
};

/** `texture` on the Frame: every series wears a pattern as well as its colour, in the plot, the legend, the tooltip, the card and the PNG. For print, colour-vision loss and forced colours; the first series stays solid. */
export const Textured: Story = {
  render: () => (
    <GridPrimitive templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="space.300">
      <Chart
        title="Coverage by control family"
        description="Textured"
        series={statusSeries}
        texture
        data={byFamily}
        x="family"
        download={["png"]}
      >
        <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked />
      </Chart>
      <Chart
        title="Reviews by assessor"
        description="Textured"
        series={assessors.slice(0, 4)}
        texture
        data={byAssessor}
        x="week"
      >
        <Chart.Area data={byAssessor} x="week" series={assessors.slice(0, 4)} stacked />
      </Chart>
    </GridPrimitive>
  ),
};

/** At a narrow width the header wraps: the tools stay on the title's row, the legend takes the next from the start, and the plot keeps its height. */
export const Narrow: Story = {
  render: () => (
    <Box style={{ maxWidth: 320 }}>
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
  play: async ({ canvasElement }) => {
    const figure = within(canvasElement).getByRole("figure", {
      name: "Coverage by control family",
    });
    const caption = figure
      .querySelector('[data-slot="chart-frame-caption"]')!
      .getBoundingClientRect();
    const tools = figure.querySelector('[data-slot="chart-frame-tools"]')!.getBoundingClientRect();
    const legend = figure.querySelector('[data-slot="chart-legend"]')!.getBoundingClientRect();
    // The tools share the title's row; the legend starts the next row at the figure's start.
    await expect(tools.top).toBeLessThan(caption.bottom);
    await expect(legend.top).toBeGreaterThanOrEqual(caption.bottom - 1);
    await expect(Math.abs(legend.left - figure.getBoundingClientRect().left)).toBeLessThan(8);
  },
};

/** A dashboard's charts are in the page's outline: inside a HeadingLevelProvider or a titled Section the Frame's title is a heading at that level (`titleLevel` sets one outright); outside every one it is plain text. */
export const Headings: Story = {
  render: () => (
    <HeadingLevelProvider level={2}>
      <GridPrimitive templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="space.300">
        <Chart title="Open findings" series={open} data={byMonth} x="month" size="small">
          <Chart.Line />
        </Chart>
        <Chart title="Closed findings" series={closed} data={byMonth} x="month" size="small">
          <Chart.Bar />
        </Chart>
      </GridPrimitive>
    </HeadingLevelProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 2, name: "Open findings" })).toBeVisible();
    await expect(canvas.getByRole("heading", { level: 2, name: "Closed findings" })).toBeVisible();
    await expect(canvas.getByRole("figure", { name: "Open findings" })).toBeVisible();
  },
};

/** The mistakes the family is written to prevent, each beside the right way. Each kind's page has its own. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stack space="space.200">
            <Chart title="Open findings" size="small">
              <Chart.Line
                data={byMonth}
                x="month"
                series={[{ key: "open", label: "Open", tone: "brand" }]}
                size="small"
              />
            </Chart>
            <Chart title="Controls assessed" size="small">
              <Chart.Line
                data={byMonth}
                x="month"
                series={[{ key: "assessed", label: "Assessed", tone: "brand" }]}
                size="small"
              />
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
          <Chart
            title="Findings by source"
            description="Opened this year"
            data={bySource}
            x="source"
            series={sourceSeries}
            size="small"
          >
            <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" />
          </Chart>
        }
        doText="Every chart on a page sits in its Frame: a title that names it, a line that says the period, the table one toggle away."
        dont={<Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" />}
        dontText="A bare plot. Nothing says what it counts or when; a screen reader hears nothing at all (an unnamed plot is decoration), and there is no table."
      />
      <Pair
        do={
          <Chart title="Findings by source" series={sourceSeries} size="small" state="loading">
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
    state: "ready",
    legend: "top",
    size: "medium",
  },
};

/** A line, a bar and a stacked bar on a small phone: the frame shrinks to its container, the axes thin out, the legend wraps, and nothing leaves the window. */
export const SmallPhone: Story = {
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  tags: ["narrow"],
  render: () => (
    <Stack space="space.300">
      <Chart title="Findings over time" series={findingSeries} swatch="line" size="small">
        <Chart.Line data={byMonth} x="month" series={findingSeries} size="small" />
      </Chart>
      <Chart title="Findings by source" series={sourceSeries} size="small">
        <Chart.Bar data={bySource} x="source" series={sourceSeries} size="small" />
      </Chart>
      <Chart title="Coverage by control family" series={statusSeries} size="small">
        <Chart.Bar data={byFamily} x="family" series={statusSeries} stacked size="small" />
      </Chart>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    for (const figure of within(canvasElement).getAllByRole("figure")) {
      await expect(figure.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
      await expect(figure.scrollWidth).toBeLessThanOrEqual(figure.clientWidth + 1);
    }
  },
};
