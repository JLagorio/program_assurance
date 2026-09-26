import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Chart } from "../..";
import { Button, KeyValue } from "../../components";
import { Box, Stack } from "../../primitives";
import { riskGroups, risks } from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/Chart/Scatter",
  component: Chart.Scatter,
  parameters: { layout: "padded" },
  args: {
    data: risks,
    x: "likelihood",
    y: "impact",
    name: "id",
    label: "Risks by likelihood and impact",
  },
} satisfies Meta<typeof Chart.Scatter>;
export default meta;
type Story = StoryObj<typeof meta>;

const owners = [...new Set(risks.map((r) => r.owner))].map((o) => ({ key: o, label: o }));

/** Every scatter in both modes: one tone, three groups, a bubble with quadrants; axis titles, the skeleton. */
export const ScatterMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="One tone · three groups · a bubble with quadrants">
        <Box style={{ width: "100%", maxWidth: 340 }}>
          <Chart.Scatter
            data={risks}
            x="likelihood"
            y="impact"
            name="id"
            tone="brand"
            size="small"
            label="Risks"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 340 }}>
          <Chart.Scatter
            data={risks}
            x="likelihood"
            y="impact"
            name="id"
            groupBy="status"
            groups={riskGroups}
            size="small"
            label="Risks by status"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 340 }}>
          <Chart.Scatter
            data={risks}
            x="likelihood"
            y="impact"
            z="exposure"
            name="id"
            tone="brand"
            reference={[{ x: 3 }, { y: 3 }]}
            size="small"
            label="Risks by exposure"
          />
        </Box>
      </Specimens>
      <Specimens title="Axis titles · loading">
        <Box style={{ width: "100%", maxWidth: 340 }}>
          <Chart.Scatter
            data={risks}
            x="likelihood"
            y="impact"
            name="id"
            tone="brand"
            xLabel="Likelihood"
            yLabel="Impact"
            size="small"
            label="Risks"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 340 }}>
          <Chart.Scatter
            data={risks}
            x="likelihood"
            y="impact"
            name="id"
            size="small"
            label="Risks"
            loading
          />
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** Risks by likelihood and impact in three status groups. Three at most: any two of the first three hues stay apart under colour vision. */
export const Groups: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="Risks by likelihood and impact"
        description="Open risks in the register"
        series={riskGroups}
        swatch="dot"
      >
        <Chart.Scatter
          data={risks}
          x="likelihood"
          y="impact"
          name="id"
          groupBy="status"
          groups={riskGroups}
          xLabel="Likelihood"
          yLabel="Impact"
          size="large"
        />
      </Chart>
    </Box>
  ),
};

/** Sized by exposure, with the lines that make quadrants. A bubble's area follows the value, so twice the exposure is twice the ink. */
export const Bubbles: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="Risks by likelihood and impact"
        description="Sized by exposure in $K; the lines split the register into quadrants"
        series={riskGroups}
        swatch="dot"
      >
        <Chart.Scatter
          data={risks}
          x="likelihood"
          y="impact"
          z="exposure"
          name="id"
          groupBy="status"
          groups={riskGroups}
          reference={[{ x: 3 }, { y: 3 }]}
          xLabel="Likelihood"
          yLabel="Impact"
          size="large"
        />
      </Chart>
    </Box>
  ),
};

/** A click on a point opens its card: the point's name and group, each axis, then the caller's facts and link. */
export const Details: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="Risks by likelihood and impact"
        description="Click a risk"
        series={riskGroups}
        swatch="dot"
      >
        <Chart.Scatter
          data={risks}
          x="likelihood"
          y="impact"
          z="exposure"
          name="id"
          groupBy="status"
          groups={riskGroups}
          xLabel="Likelihood"
          yLabel="Impact"
          size="large"
          details={(s) => (
            <Stack space="space.150">
              <div>
                <KeyValue label="Title" labelWidth={72} wrap>
                  {String(s.datum["title"])}
                </KeyValue>
                <KeyValue label="Owner" labelWidth={72}>
                  {String(s.datum["owner"])}
                </KeyValue>
              </div>
              <Button size="small" variant="secondary">{`Open ${String(s.datum["id"])}`}</Button>
            </Stack>
          )}
        />
      </Chart>
    </Box>
  ),
};

/** The Frame is given only its title and two extra columns: the legend keys the scatter's groups, and the Table toggle lays the points out one row each, the name and the group first, then a column per axis. The groups are a column of words, not a column each. */
export const AsATable: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="Risks by likelihood and impact"
        description="Sized by exposure in $K"
        columns={[
          { key: "title", label: "Title", place: "before" },
          { key: "owner", label: "Owner" },
        ]}
        download={["csv"]}
      >
        <Chart.Scatter
          data={risks}
          x="likelihood"
          y="impact"
          z="exposure"
          name="id"
          groupBy="status"
          groups={riskGroups}
          xLabel="Likelihood"
          yLabel="Impact"
          zLabel="Exposure"
        />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "In treatment" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    const table = await canvas.findByRole("table", {
      name: "Risks by likelihood and impact, as a table",
    });
    await expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Point", "Group", "Title", "Likelihood", "Impact", "Exposure", "Owner"]);
    const rows = within(table).getAllByRole("row").slice(1);
    await expect(rows).toHaveLength(risks.length);
    await expect(
      within(rows[0]!)
        .getAllByRole("cell")
        .map((c) => c.textContent),
    ).toEqual(["RSK-014", "Open", "Unpatched hypervisor", "4", "5", "420", "D. Whitfield"]);
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    await waitFor(() => expect(canvas.queryByRole("table")).not.toBeInTheDocument());
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Chart
            title="Risks by likelihood and impact"
            series={riskGroups}
            swatch="dot"
            size="small"
          >
            <Chart.Scatter
              data={risks}
              x="likelihood"
              y="impact"
              name="id"
              groupBy="status"
              groups={riskGroups}
              size="small"
            />
          </Chart>
        }
        doText="Three groups, in the status tones, because the groups are statuses. Anything finer is the tooltip's, or a filter's."
        dont={
          <Chart title="Risks by owner" series={owners} swatch="dot" size="small">
            <Chart.Scatter
              data={risks}
              x="likelihood"
              y="impact"
              name="id"
              groupBy="owner"
              groups={owners}
              size="small"
            />
          </Chart>
        }
        dontText="Five owners in five hues. Two points that sit close in the fourth and fifth hues stop being distinguishable under deutan vision, and the legend is longer than the plot."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    z: "exposure",
    zLabel: "Exposure",
    groupBy: "status",
    groups: riskGroups,
    xLabel: "Likelihood",
    yLabel: "Impact",
    size: "medium",
  },
};
