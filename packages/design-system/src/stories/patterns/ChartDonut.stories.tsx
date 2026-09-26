import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Chart } from "../..";
import { Button, KeyValue, Stat } from "../../components";
import { Box, Grid, Inline, Stack } from "../../primitives";
import { byFamily, bySource, statusSeries } from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const coverage = [
  { key: "s", label: "Satisfied", value: 298, tone: "success" as const },
  { key: "p", label: "Partial", value: 40, tone: "warning" as const },
  { key: "o", label: "Other than satisfied", value: 26, tone: "danger" as const },
  { key: "n", label: "Not assessed", value: 8, tone: "neutral" as const },
];
const done = [
  { key: "a", label: "Done", value: 3, tone: "success" as const },
  { key: "b", label: "Left", value: 1, tone: "neutral" as const },
];
const posture = [
  { key: "p", label: "Posture", value: 72, tone: "warning" as const },
  { key: "r", label: "To 100", value: 28, tone: "neutral" as const },
];

const meta = {
  title: "Patterns/Chart/Donut",
  component: Chart.Donut,
  parameters: { layout: "padded" },
  args: { slices: coverage, label: "80%", caption: "satisfied", name: "Control coverage" },
} satisfies Meta<typeof Chart.Donut>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every ring in both modes: 64, 120 and 160 across; a gauge; one slice on the track; loading. */
export const DonutMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="64 · 120 with a number and a caption · 160 · a gauge">
        <Chart.Donut size={64} thickness={8} name="Done" slices={done} />
        <Chart.Donut label="80%" caption="satisfied" name="Coverage" slices={coverage} />
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
          slices={posture}
        />
      </Specimens>
      <Specimens title="Textured · beside its textured legend">
        <Inline space="space.200" rowSpace="space.200" alignBlock="center" shouldWrap>
          <Chart.Donut
            label="80%"
            caption="satisfied"
            name="Coverage, textured"
            slices={coverage}
            texture
          />
          <Chart.Legend series={statusSeries} texture />
        </Inline>
      </Specimens>
      <Specimens title="One slice on the track · loading · a gauge loading">
        <Chart.Donut
          label="62%"
          caption="assessed"
          name="Assessed"
          slices={[
            { key: "a", label: "Assessed", value: 62, tone: "brand" },
            { key: "r", label: "Left", value: 38, tone: "neutral" },
          ]}
        />
        <Chart.Donut name="Coverage" slices={coverage} loading />
        <Chart.Donut
          arc="half"
          size={160}
          thickness={16}
          name="Risk posture"
          slices={posture}
          loading
        />
      </Specimens>
    </Stack>
  ),
};

/** A ring beside its Stat and its legend. The number in the middle is the point; the slices are the parts. */
export const BesideStat: Story = {
  render: () => (
    <Inline space="space.300" rowSpace="space.200" alignBlock="center" shouldWrap>
      <Chart.Donut label="80%" caption="satisfied" name="Control coverage" slices={coverage} />
      <Stack space="space.050">
        <Stat label="Controls satisfied" value="298 of 372" />
        <Chart.Legend series={statusSeries} />
      </Stack>
    </Inline>
  ),
};

/** Half a ring is a gauge: a score against a scale, the number at its base, the tone the score earns. No needle: the number is text. */
export const Gauge: Story = {
  render: () => (
    <Inline space="space.600" rowSpace="space.300" alignBlock="end" shouldWrap>
      <Chart.Donut
        arc="half"
        size={200}
        thickness={20}
        label="72"
        caption="risk posture"
        name="Risk posture"
        slices={posture}
      />
      <Chart.Donut
        arc="half"
        size={200}
        thickness={20}
        label="41"
        caption="readiness"
        name="Readiness"
        slices={[
          { key: "p", label: "Readiness", value: 41, tone: "danger" },
          { key: "r", label: "To 100", value: 59, tone: "neutral" },
        ]}
      />
    </Inline>
  ),
};

/** A click on a slice opens its card: the slice, its value and its share of the whole, then the caller's facts. */
export const Details: Story = {
  render: () => (
    <Inline space="space.300" rowSpace="space.200" alignBlock="center" shouldWrap>
      <Chart.Donut
        label="80%"
        caption="satisfied"
        name="Control coverage"
        size={160}
        thickness={16}
        slices={coverage}
        details={(s) => (
          <Stack space="space.150">
            <KeyValue label="Families" labelWidth={88}>
              {`${byFamily.filter((f) => f[s.slice.key === "s" ? "satisfied" : s.slice.key === "p" ? "partial" : s.slice.key === "o" ? "other" : "notAssessed"] > 0).length} of 6`}
            </KeyValue>
            <Button
              size="small"
              variant="secondary"
            >{`Controls ${s.slice.label.toLowerCase()}`}</Button>
          </Stack>
        )}
      />
      <Chart.Legend series={statusSeries} />
    </Inline>
  ),
};

/** `size` is the most a ring takes. In a container narrower than that it scales down, thickness and all, keeping its ratio; the number and caption keep their type size. Here a 200 gauge and a 160 ring share a 144px tile, and below, the same two sit in a grid of two tiles 260px across: a grid track or a flex row shrinks a ring as a block does. */
export const Narrow: Story = {
  render: () => (
    <Stack space="space.400">
      <Box data-testid="tile" style={{ maxWidth: 144 }}>
        <Stack space="space.300" alignInline="center">
          <Chart.Donut
            arc="half"
            size={200}
            thickness={20}
            label="72"
            caption="posture"
            name="Risk posture"
            slices={posture}
          />
          <Chart.Donut
            size={160}
            thickness={16}
            label="80%"
            caption="satisfied"
            name="Control coverage"
            slices={coverage}
          />
          <Chart.Donut size={160} thickness={16} name="Coverage" slices={coverage} loading />
        </Stack>
      </Box>
      <Grid
        data-testid="tiles"
        templateColumns="1fr 1fr"
        gap="space.100"
        alignItems="end"
        style={{ maxWidth: 260 }}
      >
        <Chart.Donut
          size={160}
          thickness={16}
          label="80%"
          caption="satisfied"
          name="Control coverage, in a tile"
          slices={coverage}
        />
        <Chart.Donut
          arc="half"
          size={200}
          thickness={20}
          label="72"
          caption="posture"
          name="Risk posture, in a tile"
          slices={posture}
        />
      </Grid>
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    const tile = canvas.getByTestId("tile").getBoundingClientRect();
    const tiles = canvas.getByTestId("tiles");
    const inTiles = Array.from(tiles.querySelectorAll<HTMLElement>('[role="group"]'));
    const rings = Array.from(canvasElement.querySelectorAll<HTMLElement>('[role="group"]')).filter(
      (r) => !inTiles.includes(r),
    );
    await expect(rings).toHaveLength(3);
    for (const ring of rings) {
      const box = ring.getBoundingClientRect();
      await expect(box.width).toBeLessThanOrEqual(tile.width + 0.5);
      await expect(box.right).toBeLessThanOrEqual(tile.right + 0.5);
    }
    const [gauge, ringBox] = rings.map((r) => r.getBoundingClientRect());
    // The gauge keeps its ratio: half as tall as wide, plus its base.
    await expect(gauge!.height / gauge!.width).toBeCloseTo(104 / 200, 1);
    await expect(ringBox!.height).toBeCloseTo(ringBox!.width, 0);
    // In a grid of two tiles each ring takes its own track, narrower than its size, and the two do not meet.
    const grid = tiles.getBoundingClientRect();
    await expect(inTiles).toHaveLength(2);
    const [first, second] = inTiles.map((r) => r.getBoundingClientRect());
    await expect(first!.width).toBeLessThan(160);
    await expect(second!.width).toBeLessThan(200);
    await expect(first!.right).toBeLessThanOrEqual(second!.left);
    await expect(second!.right).toBeLessThanOrEqual(grid.right + 0.5);
    await expect(second!.height / second!.width).toBeCloseTo(104 / 200, 1);
    // The arcs are drawn inside the scaled boxes, not at the full size.
    await waitFor(() => {
      const sectors = Array.from(canvasElement.querySelectorAll(".recharts-pie-sector"));
      expect(sectors.length).toBeGreaterThan(0);
      for (const sector of sectors) {
        const drawn = sector.getBoundingClientRect();
        const plot = sector.closest("[data-chart-plot]")!.getBoundingClientRect();
        expect(drawn.left).toBeGreaterThanOrEqual(plot.left - 3);
        expect(drawn.right).toBeLessThanOrEqual(plot.right + 3);
      }
    });
    await expect(within(canvas.getByTestId("tile")).getByText("80%")).toBeVisible();
    await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(
      canvasElement.ownerDocument.documentElement.clientWidth,
    );
  },
};

/** In a Frame given only its title and `xLabel`: the legend keys the slices, a hover dims the others and a click hides one, and the Table toggle lays them out with each one's value and its share of the whole. A hidden slice leaves the ring and stays in the table, which is the data. */
export const Framed: Story = {
  render: () => (
    <Box style={{ maxWidth: 480 }}>
      <Chart
        title="Control coverage"
        description="Determinations across 372 controls"
        xLabel="Determination"
        download={["csv"]}
      >
        <Chart.Donut label="80%" caption="satisfied" size={160} thickness={16} slices={coverage} />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The track's one sector, then a sector per slice shown.
    const sectors = () => canvasElement.querySelectorAll(".recharts-pie-sector");
    const dimmed = () => canvasElement.querySelectorAll("[data-chart-plot] .opacity-disabled");
    await waitFor(() => expect(sectors()).toHaveLength(5));
    // A mouse over a legend item dims the other slices.
    await userEvent.hover(canvas.getByRole("button", { name: "Satisfied" }));
    await waitFor(() => expect(dimmed()).toHaveLength(3));
    await userEvent.click(canvas.getByRole("button", { name: "Partial" }));
    await expect(canvas.getByRole("button", { name: "Partial" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await waitFor(() => expect(sectors()).toHaveLength(4));
    // The slice just hidden is still under the pointer; the slices left are not dimmed for it.
    await expect(dimmed()).toHaveLength(0);
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    await expect(canvas.getByRole("button", { name: "Table" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const table = await canvas.findByRole("table", { name: "Control coverage, as a table" });
    await expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Determination", "Value", "Share"]);
    const rows = within(table).getAllByRole("row").slice(1);
    await expect(rows).toHaveLength(4);
    await expect(
      within(rows[0]!)
        .getAllByRole("cell")
        .map((c) => c.textContent),
    ).toEqual(["Satisfied", "298", "80%"]);
    await expect(within(rows[1]!).getAllByRole("cell")[0]).toHaveTextContent("Partial");
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    await userEvent.click(canvas.getByRole("button", { name: "Partial" }));
    await waitFor(() => expect(sectors()).toHaveLength(5));
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ width: "100%", maxWidth: 200 }}>
            <Stat.Tile
              label="Open findings"
              value={5}
              note="Of 64 raised this year"
              tone="danger"
            />
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
        doText="Five sources compared are bars: the eye reads length far better than angle."
        dont={
          <Inline space="space.200" rowSpace="space.200" alignBlock="center" shouldWrap>
            <Chart.Donut
              name="Findings by source"
              slices={bySource.map((s, i) => ({
                key: s.source,
                label: s.source,
                value: s.n,
                tone: `categorical.${(i + 1) as 1 | 2 | 3 | 4 | 5}` as const,
              }))}
            />
            <Chart.Legend
              series={bySource.map((s, i) => ({
                key: s.source,
                label: s.source,
                tone: `categorical.${(i + 1) as 1 | 2 | 3 | 4 | 5}` as const,
              }))}
            />
          </Inline>
        }
        dontText="Five sources as slices. Which is bigger, ACAS or code scan? Five hues for a question the legend has to answer."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    arc: "full",
    size: 120,
    thickness: 12,
  },
};
