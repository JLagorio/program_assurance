import type { Meta, StoryObj } from "@storybook/react-vite";

import { Chart, Stat, Table } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { byMonth, families, findingsByFamilyMonth, heatMonths } from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Chart/Sparkline",
  component: Chart.Sparkline,
  parameters: { layout: "padded" },
  args: { data: byMonth, y: "open", tone: "danger" },
} satisfies Meta<typeof Chart.Sparkline>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every sparkline in both modes: a line, with an end dot and a reference, an area, bars; named (with a tooltip), and loading. */
export const SparklineMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Line · with an end dot and a reference · area · bars">
        <Chart.Sparkline data={byMonth} y="open" tone="danger" />
        <Chart.Sparkline data={byMonth} y="open" tone="brand" endDot reference={10} />
        <Chart.Sparkline data={byMonth} y="closed" tone="success" appearance="area" />
        <Chart.Sparkline data={byMonth} y="closed" tone="neutral" appearance="bars" width={120} height={28} />
      </Specimens>
      <Specimens title="Named, so it is a group with a tooltip · 160 by 40 · loading">
        <Chart.Sparkline data={byMonth} y="open" x="month" tone="danger" label="Open findings, nine months" endDot />
        <Chart.Sparkline data={byMonth} y="open" tone="brand" width={160} height={40} endDot />
        <Chart.Sparkline data={byMonth} y="open" tone="brand" loading />
      </Specimens>
    </Stack>
  ),
};

/** Sparklines in tiles: the number carries the value, the line the trend, and a reference says what the limit is. */
export const InTiles: Story = {
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

/** A sparkline per row: the trend column of a table, beside the number it belongs to. Unnamed, so a screen reader hears the number once. */
export const InRows: Story = {
  render: () => (
    <Box style={{ width: 480 }}>
      <Table label="Findings by family">
        <thead>
          <tr>
            <Table.Header>Family</Table.Header>
            <Table.Header className="text-end">Open</Table.Header>
            <Table.Header>Six months</Table.Header>
          </tr>
        </thead>
        <tbody>
          {families.map((f) => {
            const series = (findingsByFamilyMonth[f] ?? []).map((n, i) => ({ month: heatMonths[i], n }));
            return (
              <Table.Row key={f} isStatic>
                <Table.Cell>{f}</Table.Cell>
                <Table.Cell className="text-end tabular-nums">{series[series.length - 1]?.n}</Table.Cell>
                <Table.Cell>
                  <Chart.Sparkline data={series} y="n" tone="neutral" endDot width={80} height={20} />
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </Table>
    </Box>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
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
        dont={<Chart.Sparkline data={byMonth} y="open" tone="danger" width={200} height={48} endDot label="Open findings" />}
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
