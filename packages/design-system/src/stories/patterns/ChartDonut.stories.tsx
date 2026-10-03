import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

import { Chart } from "../..";
import { Button, KeyValue, Stat } from "../../components";
import { Box, Grid, Inline, Stack, Text } from "../../primitives";
import { byFamily, bySource, statusSeries } from "../_lib/chart-data";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const coverage = [
  { key: "s", label: "Satisfied", value: 298, tone: "success" as const },
  { key: "p", label: "Partial", value: 40, tone: "warning" as const },
  { key: "o", label: "Other than satisfied", value: 26, tone: "danger" as const },
  { key: "n", label: "Not assessed", value: 8, tone: "neutral" as const },
];

const meta = {
  title: "Patterns/Chart/Donut",
  component: Chart.Donut,
  parameters: { layout: "padded" },
  args: { slices: coverage, centerLabel: "80%", caption: "satisfied", label: "Control coverage" },
} satisfies Meta<typeof Chart.Donut>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The sectors a ring draws (the track's, then a slice's), not the room a hidden slice keeps. */
const sectorsIn = (root: Element) => root.querySelectorAll("path.recharts-sector");

/** Every ring in both modes: 64, 120 and 160 across; a gauge; one value on the track; loading. */
export const DonutMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Specimens title="64 · 120 with a number and a caption · 160 · a gauge">
        <Chart.Donut
          size={64}
          thickness={8}
          label="Done"
          slices={[{ key: "a", label: "Done", value: 3, tone: "success" }]}
          max={4}
        />
        <Chart.Donut centerLabel="80%" caption="satisfied" label="Coverage" slices={coverage} />
        <Chart.Donut
          size={160}
          thickness={16}
          centerLabel="5"
          caption="open"
          label="Open findings"
          slices={[
            { key: "o", label: "Open", value: 5, tone: "danger" },
            { key: "c", label: "Closed", value: 59, tone: "neutral" },
          ]}
        />
        <Chart.Donut
          arc="half"
          size={160}
          thickness={16}
          centerLabel="72"
          caption="posture"
          label="Risk posture"
          value={72}
          max={100}
          tone="warning"
        />
      </Specimens>
      <Specimens title="Textured · beside its textured legend">
        <Inline space="space.200" rowSpace="space.200" alignBlock="center" shouldWrap>
          <Chart.Donut
            centerLabel="80%"
            caption="satisfied"
            label="Coverage, textured"
            slices={coverage}
            texture
          />
          <Chart.Legend series={statusSeries} texture />
        </Inline>
      </Specimens>
      <Specimens title="One value on the track · loading · a gauge loading">
        <Chart.Donut centerLabel="62%" caption="assessed" label="Assessed" value={62} max={100} />
        <Chart.Donut label="Coverage" slices={coverage} loading />
        <Chart.Donut
          arc="half"
          size={160}
          thickness={16}
          label="Risk posture"
          value={72}
          max={100}
          loading
        />
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textured = canvas.getByRole("img", { name: "Coverage, textured" });
    // Every slice draws, and every fill that points at a pattern finds it in the document.
    await waitFor(() => expect(sectorsIn(textured)).toHaveLength(1 + coverage.length));
    for (const path of Array.from(canvasElement.querySelectorAll("path.recharts-sector"))) {
      const fill = path.getAttribute("fill") ?? "";
      const url = /^url\(#(.+)\)$/.exec(fill);
      if (url) await expect(canvasElement.ownerDocument.getElementById(url[1]!)).not.toBeNull();
    }
    // A ring that chooses nothing is an image, and no part of it is a tab stop.
    await expect(canvasElement.querySelectorAll('[data-chart-plot] [tabindex="0"]')).toHaveLength(
      0,
    );
    // A score against a scale is a meter: its value, its range and its value in words.
    const meter = canvas.getByRole("meter", { name: "Risk posture" });
    await expect(meter).toHaveAttribute("aria-valuenow", "72");
    await expect(meter).toHaveAttribute("aria-valuemax", "100");
    await expect(meter).toHaveAttribute("aria-valuetext", "72 of 100");
  },
};

/** A ring beside its Stat and its legend. The number in the middle is the point; the slices are the parts. */
export const BesideStat: Story = {
  render: () => (
    <Inline space="space.300" rowSpace="space.200" alignBlock="center" shouldWrap>
      <Chart.Donut
        centerLabel="80%"
        caption="satisfied"
        label="Control coverage"
        slices={coverage}
      />
      <Stack space="space.050">
        <Stat label="Controls satisfied" value="298 of 372" />
        <Chart.Legend series={statusSeries} />
      </Stack>
    </Inline>
  ),
};

/** Half a ring is a gauge: a score against a scale, the number at its base, the tone the score earns. `value` and `max` say it; the rest of the arc is the track, which neither hovers nor keys. No needle: the number is text. */
export const Gauge: Story = {
  render: () => (
    <Inline space="space.600" rowSpace="space.300" alignBlock="end" shouldWrap>
      <Chart.Donut
        arc="half"
        size={200}
        thickness={20}
        centerLabel="72"
        caption="risk posture"
        label="Risk posture"
        value={72}
        max={100}
        tone="warning"
      />
      <Chart.Donut
        arc="half"
        size={200}
        thickness={20}
        centerLabel="41"
        caption="readiness"
        label="Readiness"
        value={41}
        max={100}
        tone="danger"
      />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const readiness = canvas.getByRole("meter", { name: "Readiness" });
    await expect(readiness).toHaveAttribute("aria-valuenow", "41");
    await expect(readiness).toHaveAttribute("aria-valuetext", "41 of 100");
    // The value's arc and the track: no remainder slice is drawn as if it were data.
    await waitFor(() => expect(sectorsIn(readiness)).toHaveLength(2));
    // The track is the whole, not data: the pointer passes through it, so no tooltip names it.
    await expect(getComputedStyle(sectorsIn(readiness)[0]!).pointerEvents).toBe("none");
    await expect(getComputedStyle(sectorsIn(readiness)[1]!).pointerEvents).not.toBe("none");
    await expect(canvasElement.querySelectorAll('[data-chart-plot] [tabindex="0"]')).toHaveLength(
      0,
    );
  },
};

/** A click on a slice, or Enter on it, opens its card: the slice, its value and its share of the whole, then the caller's facts. Each slice is a button and a tab stop; the ring itself is not. */
export const Details: Story = {
  render: () => (
    <Inline space="space.300" rowSpace="space.200" alignBlock="center" shouldWrap>
      <Chart.Donut
        centerLabel="80%"
        caption="satisfied"
        label="Control coverage"
        size={160}
        thickness={16}
        slices={coverage}
        details={(s) => (
          <Stack space="space.150">
            <KeyValue label="Families" labelWidth="narrow">
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const plot = canvas.getByRole("group", { name: "Control coverage" });
    // The slices are the tab stops, one each, named with their value and share.
    await waitFor(() => expect(plot.querySelectorAll('[tabindex="0"]')).toHaveLength(4));
    // The svg itself is none of them: every stop is a slice's button.
    for (const stop of Array.from(plot.querySelectorAll('[tabindex="0"]')))
      await expect(stop).toHaveAttribute("role", "button");
    const partial = await within(plot).findByRole("button", { name: "Partial: 40, 11%" });
    await expect(partial).toHaveAttribute("aria-haspopup", "dialog");
    await expect(partial).toHaveAttribute("aria-expanded", "false");
    partial.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = await page.findByRole("dialog", { name: "Control coverage, details" });
    await waitFor(() => expect(within(dialog).getByText("11% of 372")).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() =>
      expect(within(plot).getByRole("button", { name: "Partial: 40, 11%" })).toHaveFocus(),
    );
  },
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
            centerLabel="72"
            caption="posture"
            label="Risk posture"
            value={72}
            max={100}
            tone="warning"
          />
          <Chart.Donut
            size={160}
            thickness={16}
            centerLabel="80%"
            caption="satisfied"
            label="Control coverage"
            slices={coverage}
          />
          <Chart.Donut size={160} thickness={16} label="Coverage" slices={coverage} loading />
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
          centerLabel="80%"
          caption="satisfied"
          label="Control coverage, in a tile"
          slices={coverage}
        />
        <Chart.Donut
          arc="half"
          size={200}
          thickness={20}
          centerLabel="72"
          caption="posture"
          label="Risk posture, in a tile"
          value={72}
          max={100}
          tone="warning"
        />
      </Grid>
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    const tile = canvas.getByTestId("tile").getBoundingClientRect();
    const tiles = canvas.getByTestId("tiles");
    const plots = (root: Element) =>
      Array.from(root.querySelectorAll<HTMLElement>("[data-chart-plot], [aria-busy]"));
    const inTiles = plots(tiles);
    const rings = plots(canvasElement).filter((r) => !inTiles.includes(r));
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

/** In a Frame given only its title and `xLabel`: the legend keys the slices, a hover dims the others and a click hides one, and the Table toggle lays them out with each one's value and its share of the whole. A hidden slice leaves the ring but keeps its place, so the others keep their angles and the track shows through; it stays in the table, which is the data. */
export const Framed: Story = {
  render: () => (
    <Box style={{ maxWidth: 480 }}>
      <Chart
        title="Control coverage"
        description="Determinations across 372 controls"
        xLabel="Determination"
        download={["csv"]}
      >
        <Chart.Donut
          centerLabel="80%"
          caption="satisfied"
          size={160}
          thickness={16}
          slices={coverage}
        />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The track's one sector, then a sector per slice shown.
    const sectors = () => sectorsIn(canvasElement);
    const dimmed = () => canvasElement.querySelectorAll("[data-chart-plot] .opacity-disabled");
    await waitFor(() => expect(sectors()).toHaveLength(5));
    const satisfied = () => sectors()[1]?.getAttribute("d");
    await waitFor(async () => {
      const before = satisfied();
      await new Promise((r) => setTimeout(r, 100));
      expect(satisfied()).toBe(before);
    });
    const angles = satisfied();
    // A mouse over a legend item dims the other slices.
    await userEvent.hover(canvas.getByRole("button", { name: "Satisfied" }));
    await waitFor(() => expect(dimmed()).toHaveLength(3));
    await userEvent.click(canvas.getByRole("button", { name: "Partial" }));
    await expect(canvas.getByRole("button", { name: "Partial" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await waitFor(() => expect(sectors()).toHaveLength(4));
    // The slices left keep their angles: Satisfied's arc is the one it drew before.
    await waitFor(() => expect(satisfied()).toBe(angles));
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
    // The slice heads its row; its value and share are the row's cells.
    await expect(within(rows[0]!).getByRole("rowheader")).toHaveTextContent("Satisfied");
    await expect(
      within(rows[0]!)
        .getAllByRole("cell")
        .map((c) => c.textContent),
    ).toEqual(["298", "80%"]);
    await expect(within(rows[1]!).getByRole("rowheader")).toHaveTextContent("Partial");
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    await userEvent.click(canvas.getByRole("button", { name: "Partial" }));
    await waitFor(() => expect(sectors()).toHaveLength(5));
  },
};

/** A slice far smaller than the rest still draws: 3° at least, wider than the gaps either side, so it can be hovered and read. One of 372 would otherwise vanish under its separators. */
export const SmallShare: Story = {
  render: () => (
    <Inline space="space.300" rowSpace="space.200" alignBlock="center" shouldWrap>
      <Chart.Donut
        size={160}
        thickness={16}
        centerLabel="371"
        caption="current"
        label="Accounts reviewed"
        slices={[
          { key: "c", label: "Current", value: 371, tone: "success" },
          { key: "x", label: "Expired", value: 1, tone: "danger" },
        ]}
      />
      <Chart.Legend
        series={[
          { key: "c", label: "Current", tone: "success" },
          { key: "x", label: "Expired", tone: "danger" },
        ]}
      />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const plot = within(canvasElement).getByRole("img", { name: "Accounts reviewed" });
    await waitFor(() => expect(sectorsIn(plot)).toHaveLength(3));
    // The expired slice sits just before the top, so its width is its arc: wider than the 2px
    // separators either side (1 of 372 would be under 1.4px of arc).
    await waitFor(() => {
      const box = (sectorsIn(plot)[2] as SVGGraphicsElement).getBBox();
      expect(box.width).toBeGreaterThan(3);
    });
  },
};

/** `label` names the ring, as it names every plot, and `centerLabel` is the number in the middle. In a Frame the title names the ring and neither is needed for the name. */
export const Naming: Story = {
  render: () => (
    <Inline space="space.600" rowSpace="space.300" alignBlock="center" shouldWrap>
      <Chart.Donut
        label="Control coverage"
        centerLabel="80%"
        caption="satisfied"
        slices={coverage}
      />
      <Box style={{ maxWidth: 320 }}>
        <Chart title="Open findings" size="small">
          <Chart.Donut
            centerLabel="5"
            caption="open"
            slices={[
              { key: "o", label: "Open", value: 5, tone: "danger" },
              { key: "c", label: "Closed", value: 59, tone: "neutral" },
            ]}
          />
        </Chart>
      </Box>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ring = canvas.getByRole("img", { name: "Control coverage" });
    // The name is the ring's, never printed in the hole; the middle is `centerLabel`.
    const box = ring.closest("[data-chart-plot]")!;
    await expect(within(box as HTMLElement).queryByText("Control coverage")).toBeNull();
    await expect(within(box as HTMLElement).getByText("80%")).toBeVisible();
    // In a Frame the title names the ring.
    await expect(canvas.getByRole("img", { name: "Open findings" })).toBeVisible();
    await expect(canvas.getByText("5")).toBeVisible();
  },
};

/** The earlier spelling, for one version: `name` still names the ring, and a `label` beside it, or one that is not a string, still draws the middle, each with a warning in development. `ledger/no-deprecated-name` rewrites them as `label` and `centerLabel`. */
export const EarlierSpelling: Story = {
  tags: ["!manifest"],
  name: "Deprecated spellings",
  render: () => (
    <Inline space="space.600" rowSpace="space.300" alignBlock="center" shouldWrap>
      <Chart.Donut label="62%" caption="assessed" name="Assessed" value={62} max={100} />
      <Chart.Donut label={298} caption="satisfied" slices={coverage} name="Satisfied controls" />
      <Chart.Donut name="Coverage by slice" slices={coverage} />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // `label` beside `name`: the middle, the ring named by `name`.
    const assessed = canvas.getByRole("meter", { name: "Assessed" });
    await expect(assessed).toHaveAttribute("aria-valuenow", "62");
    await expect(canvas.getByText("62%")).toBeInTheDocument();
    // A number in `label` is the middle.
    await expect(canvas.getByRole("img", { name: "Satisfied controls" })).toBeVisible();
    await expect(canvas.getByText("298")).toBeVisible();
    // `name` alone names the ring.
    await expect(canvas.getByRole("img", { name: "Coverage by slice" })).toBeVisible();
  },
};

/** The ring's box takes native props and a ref: an `id`, `data-*` for a test, a handler. `aria-describedby` describes the ring: its svg, an image, when it chooses nothing; its group when its slices are the tab stops. */
export const NativeAttributes: Story = {
  render: () => (
    <Inline space="space.600" alignBlock="start" shouldWrap>
      <Stack space="space.100">
        <Chart.Donut
          slices={coverage}
          centerLabel="80%"
          caption="satisfied"
          label="Control coverage"
          data-testid="coverage-ring"
          aria-describedby="coverage-note"
          ref={(node) => node?.setAttribute("data-ref", "")}
        />
        <Text id="coverage-note" size="small" color="color.text.subtle">
          Controls assessed this quarter.
        </Text>
      </Stack>
      <Stack space="space.100">
        <Chart.Donut
          slices={coverage}
          centerLabel="80%"
          caption="satisfied"
          label="Control coverage by slice"
          onSelect={() => {}}
          data-testid="coverage-slices"
          aria-describedby="slices-note"
        />
        <Text id="slices-note" size="small" color="color.text.subtle">
          Choose a slice for its controls.
        </Text>
      </Stack>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("coverage-ring");
    await expect(box).toHaveAttribute("data-chart-plot");
    await expect(box).toHaveAttribute("data-ref");
    await expect(canvas.getByRole("img", { name: "Control coverage" })).toHaveAccessibleDescription(
      "Controls assessed this quarter.",
    );
    const group = canvas.getByRole("group", { name: "Control coverage by slice" });
    await expect(group).toBe(canvas.getByTestId("coverage-slices"));
    await expect(group).toHaveAccessibleDescription("Choose a slice for its controls.");
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
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
            centerLabel="5"
            label="Open findings"
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
              label="Findings by source"
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
      <Pair
        do={
          <Chart.Donut
            arc="half"
            size={160}
            thickness={16}
            centerLabel="72"
            caption="posture"
            label="Risk posture"
            value={72}
            max={100}
            tone="warning"
          />
        }
        doText="A score against its scale: `value` and `max`. The rest is the track, and a screen reader hears 72 of 100."
        dont={
          <Chart.Donut
            arc="half"
            size={160}
            thickness={16}
            centerLabel="72"
            caption="posture"
            label="Risk posture, with a remainder slice"
            slices={[
              { key: "p", label: "Posture", value: 72, tone: "warning" },
              { key: "r", label: "To 100", value: 28, tone: "neutral" },
            ]}
          />
        }
        dontText="A made-up remainder slice. It hovers, sits in the legend and the table as if it were data, and hides the track."
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
