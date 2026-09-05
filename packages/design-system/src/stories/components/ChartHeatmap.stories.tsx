import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Button, Chart, KeyValue } from "../../components";
import { Grid, Stack } from "../../primitives";
import {
  families,
  findingsByFamilyMonth,
  heatMonths,
  impacts,
  likelihoods,
  phases,
  riskCount,
  riskTone,
  risksAt,
  varianceByPhase,
} from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const findings = (r: string, c: string) => findingsByFamilyMonth[r]?.[heatMonths.indexOf(c)];
const variance = (r: string, c: string) => varianceByPhase[r]?.[heatMonths.indexOf(c)];
const days = (v: number) => `${v > 0 ? "+" : ""}${v} days`;

const meta = {
  title: "Components/Chart/Heatmap",
  component: Chart.Heatmap,
  parameters: { layout: "padded" },
  args: { rows: families, columns: heatMonths, value: findings, label: "Findings by family and month", rowLabel: "Family", columnLabel: "Month" },
} satisfies Meta<typeof Chart.Heatmap>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every grid in both modes: sequential, diverging and status scales with their keys; small cells, values printed, loading. */
export const HeatmapMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Sequential · diverging · status, with values">
        <Stack space="space.100">
          <Chart.Heatmap rows={families} columns={heatMonths} value={findings} size="small" label="Findings by family and month" />
          <Chart.Scale scale="sequential" min="0" max="12" />
        </Stack>
        <Stack space="space.100">
          <Chart.Heatmap rows={phases} columns={heatMonths} value={variance} scale="diverging" domain={[-12, 12]} format={days} size="small" label="Schedule variance by phase and month" />
          <Chart.Scale scale="diverging" min="−12 days" mid="On plan" max="+12 days" />
        </Stack>
        <Chart.Heatmap rows={[...likelihoods].reverse()} columns={impacts} value={riskCount} scale={riskTone} size="small" label="Risk matrix" rowLabel="Likelihood" columnLabel="Impact" />
      </Specimens>
      <Specimens title="Values printed on a colour scale · large cells · loading">
        <Chart.Heatmap rows={families} columns={heatMonths} value={findings} showValues size="small" label="Findings by family and month, with values" />
        <Chart.Heatmap rows={families.slice(0, 3)} columns={heatMonths} value={findings} size="large" label="Findings by family and month, large" />
        <Chart.Heatmap rows={families.slice(0, 3)} columns={heatMonths} value={findings} size="small" label="Findings by family and month" loading />
      </Specimens>
    </Stack>
  ),
};

/** How much, in one hue from light to dark, with the scale's key. The value is the tooltip's and the table's; a count inside a cell would need an ink per step. */
export const Sequential: Story = {
  render: () => (
    <Chart title="Findings by family and month" description="Opened in the month">
      <Stack space="space.150">
        <Chart.Heatmap rows={families} columns={heatMonths} value={findings} label="Findings by family and month" rowLabel="Family" columnLabel="Month" />
        <Chart.Scale scale="sequential" min="0" max="12 findings" />
      </Stack>
    </Chart>
  ),
};

/** Above and below, in two hues around grey: schedule variance against the plan. Red is the negative arm because below the line is the problem. */
export const Diverging: Story = {
  render: () => (
    <Chart title="Schedule variance by phase" description="Days against the plan at month end">
      <Stack space="space.150">
        <Chart.Heatmap rows={phases} columns={heatMonths} value={variance} scale="diverging" domain={[-12, 12]} format={days} label="Schedule variance by phase and month" rowLabel="Phase" columnLabel="Month" />
        <Chart.Scale scale="diverging" min="−12 days" mid="On plan" max="+12 days" />
      </Stack>
    </Chart>
  ),
};

/** Status by place: the risk matrix, each cell in the tone its position earns (the Badge's fills), the count printed in the tone's text. */
export const Status: Story = {
  render: () => (
    <Chart title="Risk matrix" description="Open risks by likelihood and impact">
      <Chart.Heatmap rows={[...likelihoods].reverse()} columns={impacts} value={riskCount} scale={riskTone} size="large" label="Risk matrix" rowLabel="Likelihood" columnLabel="Impact" />
    </Chart>
  ),
};

/** The cells are buttons: a click, or Enter, opens the cell's card with the risks in it. */
export const Details: Story = {
  render: () => (
    <Chart title="Risk matrix" description="Click a cell for its risks">
      <Chart.Heatmap
        rows={[...likelihoods].reverse()}
        columns={impacts}
        value={riskCount}
        scale={riskTone}
        size="large"
        label="Risk matrix"
        rowLabel="Likelihood"
        columnLabel="Impact"
        details={(s) => (
          <Stack space="space.150">
            <Stack space="space.050">
              {risksAt(s.row, s.column).map((r) => (
                <KeyValue key={r.id} label={r.id} labelWidth={72}>
                  {r.title}
                </KeyValue>
              ))}
            </Stack>
            <Button size="small" variant="secondary">Open the register</Button>
          </Stack>
        )}
      />
    </Chart>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Grid templateColumns={{ base: "1fr" }} gap="space.400">
      <Pair
        do={
          <Stack space="space.100">
            <Chart.Heatmap rows={families.slice(0, 4)} columns={heatMonths} value={findings} size="small" label="Findings by family and month" />
            <Chart.Scale scale="sequential" min="0" max="12" />
          </Stack>
        }
        doText="A count is how much: one hue, light to dark, and the key says what dark means."
        dont={
          <Chart.Heatmap
            rows={families.slice(0, 4)}
            columns={heatMonths}
            value={findings}
            scale={(v) => (v >= 9 ? "danger" : v >= 5 ? "warning" : v >= 2 ? "information" : "success")}
            size="small"
            label="Findings by family and month, as statuses"
          />
        }
        dontText="A count painted as a status. Nine findings is not 'danger' and two is not 'success'; the tones mean something on the risk matrix and stop meaning it here."
      />
      <Pair
        do={
          <Stack space="space.100">
            <Chart.Heatmap rows={[...likelihoods].reverse()} columns={impacts} value={riskCount} scale={riskTone} size="small" label="Risk matrix" rowLabel="Likelihood" columnLabel="Impact" />
          </Stack>
        }
        doText="The status cells print their count: the tone's text on the tone's fill, already in the contrast test."
        dont={
          <Stack space="space.100">
            <Chart.Heatmap rows={[...likelihoods].reverse()} columns={impacts} value={riskCount} scale={riskTone} showValues={false} size="small" label="Risk matrix, no values" rowLabel="Likelihood" columnLabel="Impact" />
            <Badge tone="danger">2</Badge>
          </Stack>
        }
        dontText="Counts hidden on a status grid, and the number moved elsewhere. The reader hovers every cell to learn there are two risks in the corner."
      />
    </Grid>
  ),
};

export const Playground: Story = {
  args: {
    scale: "sequential",
    showValues: false,
    size: "medium",
  },
};
