import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect } from "storybook/test";

import { Chart } from "../..";
import { Stat, Table } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { byMonth, families, findingsByFamilyMonth, heatMonths } from "../_lib/chart-data";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Patterns/Chart/Sparkline",
  component: Chart.Sparkline,
  parameters: { layout: "padded" },
  args: { data: byMonth, y: "open", tone: "danger" },
} satisfies Meta<typeof Chart.Sparkline>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every sparkline in both modes: a line, with an end dot and a reference, an area, bars; named (with a tooltip), and loading. */
export const SparklineMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Specimens title="Line · with an end dot and a reference · area · bars">
        <Chart.Sparkline data={byMonth} y="open" tone="danger" />
        <Chart.Sparkline data={byMonth} y="open" tone="brand" endDot reference={10} />
        <Chart.Sparkline data={byMonth} y="closed" tone="success" appearance="area" />
        <Chart.Sparkline
          data={byMonth}
          y="closed"
          tone="neutral"
          appearance="bars"
          width={120}
          height={28}
        />
      </Specimens>
      <Specimens title="Named, so it is an image with a tooltip · 160 by 40 · loading">
        <Chart.Sparkline
          data={byMonth}
          y="open"
          x="month"
          tone="danger"
          label="Open findings, nine months"
          endDot
        />
        <Chart.Sparkline data={byMonth} y="open" tone="brand" width={160} height={40} endDot />
        <Chart.Sparkline data={byMonth} y="open" tone="brand" loading />
      </Specimens>
    </Stack>
  ),
};

/** Sparklines in tiles, in the Stat's `trend` slot: the number carries the value, the line the trend, and a reference says what the limit is. The value stays a number, so it formats in the locale. */
export const InTiles: Story = {
  render: () => (
    <Box style={{ maxWidth: 720 }}>
      <Stat.Grid cols={3}>
        <Stat.Tile
          label="Open findings"
          value={5}
          trend={<Chart.Sparkline data={byMonth} y="open" tone="danger" endDot />}
          note="Down from 14 in January"
        />
        <Stat.Tile
          label="Closed this year"
          value={59}
          trend={<Chart.Sparkline data={byMonth} y="closed" tone="success" appearance="bars" />}
          note="Nine months"
        />
        <Stat.Tile
          label="Plan"
          value={6}
          trend={
            <Chart.Sparkline
              data={byMonth}
              y="plan"
              tone="neutral"
              appearance="area"
              reference={10}
            />
          }
          note="Against a limit of 10"
        />
      </Stat.Grid>
    </Box>
  ),
};

/** Control coverage, 96% to 99% over six months. */
const coverage = [
  { month: "Apr", covered: 0.96 },
  { month: "May", covered: 0.965 },
  { month: "Jun", covered: 0.97 },
  { month: "Jul", covered: 0.968 },
  { month: "Aug", covered: 0.982 },
  { month: "Sep", covered: 0.99 },
];
/** `baseline`: a line or an area crops to its data (`auto`), so a trend on a high base still shows; bars start at zero, since a bar's length is its value. Forced to `zero`, the same line lies flat along the top. The tooltip names the value by `seriesLabel` and heads it with the month from `x`. */
export const Baseline: Story = {
  render: () => (
    <Inline space="space.400" alignBlock="center">
      <Chart.Sparkline
        data={coverage}
        y="covered"
        x="month"
        tone="success"
        width={120}
        height={32}
        endDot
        format={(v) => `${Math.round(v * 1000) / 10}%`}
        label="Coverage, cropped to its data"
        seriesLabel="Covered"
      />
      <Chart.Sparkline
        data={coverage}
        y="covered"
        x="month"
        tone="success"
        width={120}
        height={32}
        endDot
        baseline="zero"
        format={(v) => `${Math.round(v * 1000) / 10}%`}
        label="Coverage, from zero"
        seriesLabel="Covered"
      />
    </Inline>
  ),
  play: async ({ canvas }) => {
    const rise = (name: string) =>
      canvas
        .getByRole("img", { name })
        .querySelector(".recharts-line-curve")!
        .getBoundingClientRect().height;
    // Cropped, the three points of rise fill the box; from zero they are a pixel or so.
    await expect(rise("Coverage, cropped to its data")).toBeGreaterThan(20);
    await expect(rise("Coverage, from zero")).toBeLessThan(4);
  },
};

/** A sparkline per row: the trend column of a table, beside the number it belongs to. Unnamed, so a screen reader hears the number once. */
export const InRows: Story = {
  render: () => (
    <Box style={{ maxWidth: 480 }}>
      <Table label="Findings by family">
        <thead>
          <tr>
            <Table.Header>Family</Table.Header>
            <Table.Header align="end">Open</Table.Header>
            <Table.Header>Six months</Table.Header>
          </tr>
        </thead>
        <tbody>
          {families.map((f) => {
            const series = (findingsByFamilyMonth[f] ?? []).map((n, i) => ({
              month: heatMonths[i],
              n,
            }));
            return (
              <Table.Row key={f} isStatic>
                <Table.Cell>{f}</Table.Cell>
                <Table.Cell align="end">{series[series.length - 1]?.n}</Table.Cell>
                <Table.Cell>
                  <Chart.Sparkline
                    data={series}
                    y="n"
                    tone="neutral"
                    endDot
                    width={80}
                    height={20}
                  />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </Table>
    </Box>
  ),
};

/** `width` is the most a sparkline takes: a 160 by 40 sparkline in a 120px cell narrows to the cell and keeps its height, and beside its number in a row of the same width it takes what the number leaves. */
export const Narrow: Story = {
  render: () => (
    <Stack space="space.300">
      <Box data-testid="cell" style={{ maxWidth: 120 }}>
        <Chart.Sparkline
          data={byMonth}
          y="open"
          x="month"
          tone="brand"
          width={160}
          height={40}
          endDot
          label="Open findings, nine months"
        />
      </Box>
      <Box data-testid="row" style={{ maxWidth: 120 }}>
        <Inline space="space.100" alignBlock="center">
          <Text size="large" weight="semibold">
            12
          </Text>
          <Chart.Sparkline
            data={byMonth}
            y="open"
            x="month"
            tone="brand"
            width={160}
            height={40}
            endDot
            label="Open findings beside the number"
          />
        </Inline>
      </Box>
    </Stack>
  ),
  play: async ({ canvas }) => {
    for (const [cellId, name] of [
      ["cell", "Open findings, nine months"],
      ["row", "Open findings beside the number"],
    ] as const) {
      const cell = canvas.getByTestId(cellId).getBoundingClientRect();
      // Named, a sparkline is an image, and never a tab stop: its number is on the page.
      const image = canvas.getByRole("img", { name });
      await expect(image.querySelector("[tabindex='0']")).toBeNull();
      const box = image.getBoundingClientRect();
      await expect(box.width).toBeLessThan(160);
      await expect(box.right).toBeLessThanOrEqual(cell.right + 0.5);
      await expect(box.height).toBe(40);
    }
    await expect(canvas.getByText("12")).toBeVisible();
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.150" alignBlock="center">
            <Text size="large" weight="semibold">
              5
            </Text>
            <Chart.Sparkline data={byMonth} y="open" tone="danger" endDot />
          </Inline>
        }
        doText="The number beside the line carries the value; the line carries the trend."
        dont={
          <Chart.Sparkline
            data={byMonth}
            y="open"
            tone="danger"
            width={200}
            height={48}
            endDot
            label="Open findings"
          />
        }
        dontText="A sparkline alone, made bigger to compensate. With no number and no axis it says only 'down'. If it needs to say more, it is a Line in a Frame."
      />
      <Pair
        do={
          <Inline space="space.150" alignBlock="center">
            <Text size="large" weight="semibold">
              59
            </Text>
            <Chart.Sparkline data={byMonth} y="closed" tone="success" appearance="bars" />
          </Inline>
        }
        doText="One tone, the status the number carries."
        dont={
          <Inline space="space.150" alignBlock="center">
            <Text size="large" weight="semibold">
              59
            </Text>
            <Chart.Sparkline data={byMonth} y="closed" tone="categorical.2" appearance="bars" />
          </Inline>
        }
        dontText="A categorical hue on a status number. Orange beside a count of closed findings asks what is wrong."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    appearance: "line",
    endDot: true,
    width: 96,
    height: 24,
  },
};
