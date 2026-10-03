import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Chart } from "../..";
import { Button, KeyValue } from "../../components";
import { Box, Stack, Text } from "../../primitives";
import { riskGroups } from "../_lib/chart-data";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

/** Open findings on two measures: how long each has been open, and what it exposes. POA-118 and POA-131 sit at the same place. */
const findings = [
  {
    id: "POA-102",
    assets: 38,
    title: "Unpatched hypervisor",
    age: 212,
    exposure: 420,
    status: "open",
    owner: "D. Whitfield",
  },
  {
    id: "POA-107",
    assets: 12,
    title: "Shared service account",
    age: 164,
    exposure: 260,
    status: "treating",
    owner: "A. Okafor",
  },
  {
    id: "POA-111",
    assets: 20,
    title: "Backup restore untested",
    age: 131,
    exposure: 180,
    status: "open",
    owner: "M. Ryde",
  },
  {
    id: "POA-114",
    assets: 6,
    title: "Vendor SBOM missing",
    age: 96,
    exposure: 120,
    status: "treating",
    owner: "G. Hoppel",
  },
  {
    id: "POA-118",
    assets: 9,
    title: "Log retention 30 days",
    age: 74,
    exposure: 90,
    status: "accepted",
    owner: "S. Lind",
  },
  {
    id: "POA-122",
    assets: 44,
    title: "Stale firewall rules",
    age: 58,
    exposure: 210,
    status: "open",
    owner: "A. Okafor",
  },
  {
    id: "POA-125",
    assets: 2,
    title: "Legacy TLS on printer",
    age: 41,
    exposure: 30,
    status: "accepted",
    owner: "S. Lind",
  },
  {
    id: "POA-128",
    assets: 4,
    title: "Single admin for PKI",
    age: 33,
    exposure: 310,
    status: "open",
    owner: "D. Whitfield",
  },
  {
    id: "POA-131",
    assets: 9,
    title: "Audit log gaps",
    age: 74,
    exposure: 90,
    status: "treating",
    owner: "M. Ryde",
  },
  {
    id: "POA-134",
    assets: 27,
    title: "MFA exemptions",
    age: 22,
    exposure: 150,
    status: "treating",
    owner: "G. Hoppel",
  },
  {
    id: "POA-137",
    assets: 61,
    title: "Untagged assets",
    age: 12,
    exposure: 60,
    status: "open",
    owner: "S. Lind",
  },
];
const dollars = (v: number) => `$${v}K`;

const meta = {
  title: "Patterns/Chart/Scatter",
  component: Chart.Scatter,
  parameters: { layout: "padded" },
  args: {
    data: findings,
    x: "age",
    y: "exposure",
    nameKey: "id",
    label: "Findings by age and exposure",
  },
} satisfies Meta<typeof Chart.Scatter>;
export default meta;
type Story = StoryObj<typeof meta>;

const owners = [...new Set(findings.map((r) => r.owner))].map((o) => ({ key: o, label: o }));

/** Every scatter in both modes: one tone, three groups, a bubble with quadrants; axis titles, the skeleton. */
export const ScatterMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Specimens title="One tone · three groups · a bubble with quadrants">
        <Box style={{ width: "100%", maxWidth: 340 }}>
          <Chart.Scatter
            data={findings}
            x="age"
            y="exposure"
            nameKey="id"
            tone="brand"
            size="small"
            label="Findings"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 340 }}>
          <Chart.Scatter
            data={findings}
            x="age"
            y="exposure"
            nameKey="id"
            groupBy="status"
            groups={riskGroups}
            size="small"
            label="Findings by status"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 340 }}>
          <Chart.Scatter
            data={findings}
            x="age"
            y="exposure"
            z="assets"
            nameKey="id"
            tone="brand"
            reference={[{ x: 90 }, { y: 200 }]}
            size="small"
            label="Findings by assets affected"
          />
        </Box>
      </Specimens>
      <Specimens title="Axis titles · loading">
        <Box style={{ width: "100%", maxWidth: 340 }}>
          <Chart.Scatter
            data={findings}
            x="age"
            y="exposure"
            nameKey="id"
            tone="brand"
            xLabel="Days open"
            yLabel="Exposure"
            formatY={dollars}
            size="small"
            label="Findings"
          />
        </Box>
        <Box style={{ width: "100%", maxWidth: 340 }}>
          <Chart.Scatter
            data={findings}
            x="age"
            y="exposure"
            nameKey="id"
            size="small"
            label="Findings"
            loading
          />
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    // A scatter that chooses nothing is an image of its points, with no tab stop.
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "Findings by status" })).toBeVisible();
    await expect(canvasElement.querySelectorAll('[data-chart-plot] [tabindex="0"]')).toHaveLength(
      0,
    );
  },
};

/** Findings by how long they have been open and what they expose, in three status groups. Three at most: any two of the first three hues stay apart under colour vision. */
export const Groups: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="Findings by age and exposure"
        description="Open findings in the POA&M"
        series={riskGroups}
        swatch="dot"
      >
        <Chart.Scatter
          data={findings}
          x="age"
          y="exposure"
          nameKey="id"
          groupBy="status"
          groups={riskGroups}
          xLabel="Days open"
          yLabel="Exposure"
          formatX={(days) => `${String(days)} d`}
          formatY={(value) => `$${value}K`}
          size="large"
        />
      </Chart>
    </Box>
  ),
};

/** Sized by the assets each finding touches, with the lines that make quadrants: past 90 days and past $200K is the corner to treat first. A bubble's area follows the value, so twice the assets is twice the ink. Each axis has its own scale and its own format: days pinned to 0–240 with a tick every 60, exposure in dollars to $600K in round steps. */
export const Bubbles: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="Findings by age and exposure"
        description="Sized by assets affected; the lines split the POA&M into quadrants"
        series={riskGroups}
        swatch="dot"
      >
        <Chart.Scatter
          data={findings}
          x="age"
          y="exposure"
          z="assets"
          nameKey="id"
          groupBy="status"
          groups={riskGroups}
          reference={[{ x: 90 }, { y: 200 }]}
          xLabel="Days open"
          yLabel="Exposure"
          zLabel="Assets"
          xDomain={[0, 240]}
          xTicks={[0, 60, 120, 180, 240]}
          yDomain={[0, 600]}
          formatY={(v) => `$${v}K`}
          size="large"
        />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    // Each axis stops where it was pinned, with the ticks it was given, in its own format.
    const ticks = (axis: string) =>
      Array.from(canvasElement.querySelectorAll(`.recharts-${axis}-tick-labels text`)).map(
        (t) => t.textContent,
      );
    await waitFor(() => expect(ticks("xAxis")).toEqual(["0", "60", "120", "180", "240"]));
    await expect(ticks("yAxis")).toEqual(["$0K", "$200K", "$400K", "$600K"]);
  },
};

/** A click on a point, or Enter on it, opens its card: the point's name and group, each axis in its format, then the caller's facts and link. When the scatter chooses, each point is a named button and a tab stop. */
export const Details: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="Findings by age and exposure"
        description="Click a finding"
        series={riskGroups}
        swatch="dot"
      >
        <Chart.Scatter
          data={findings}
          x="age"
          y="exposure"
          nameKey="id"
          groupBy="status"
          groups={riskGroups}
          xLabel="Days open"
          yLabel="Exposure"
          formatX={(v) => `${String(v)} d`}
          formatY={(v) => `$${v}K`}
          size="large"
          details={(s) => (
            <Stack space="space.150">
              <div>
                <KeyValue label="Title" labelWidth="narrow" wrap>
                  {String(s.datum["title"])}
                </KeyValue>
                <KeyValue label="Owner" labelWidth="narrow">
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const plot = canvas.getByRole("group", { name: "Findings by age and exposure" });
    // One tab stop per point, none on the svg.
    await waitFor(() =>
      expect(plot.querySelectorAll('[tabindex="0"]')).toHaveLength(findings.length),
    );
    const point = within(plot).getByRole("button", {
      name: "POA-102, Open: Days open 212 d, Exposure $420K",
    });
    await expect(point).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.keyboard("{Shift}");
    point.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = await page.findByRole("dialog", {
      name: "Findings by age and exposure, details",
    });
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Open POA-102" })).toBeVisible(),
    );
    await expect(within(dialog).getByText("$420K")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() =>
      expect(
        within(plot).getByRole("button", {
          name: "POA-102, Open: Days open 212 d, Exposure $420K",
        }),
      ).toHaveFocus(),
    );
  },
};

/** Two findings at the same place: POA-118 and POA-131 are both 74 days old with $90K exposed. The tooltip and the card name every point there, and the card offers the others, so the one under the pointer is never the only one. */
export const SamePlace: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart title="Findings by age and exposure" series={riskGroups} swatch="dot">
        <Chart.Scatter
          data={findings}
          x="age"
          y="exposure"
          nameKey="id"
          groupBy="status"
          groups={riskGroups}
          xLabel="Days open"
          yLabel="Exposure"
          formatY={dollars}
          details={(s) => <KeyValue label="Title">{String(s.datum["title"])}</KeyValue>}
        />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const point = await canvas.findByRole("button", { name: /^POA-118,/ });
    await userEvent.keyboard("{Shift}");
    point.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = await page.findByRole("dialog");
    await waitFor(() => expect(within(dialog).getByText("Also at this point")).toBeVisible());
    await userEvent.click(within(dialog).getByRole("button", { name: "POA-131" }));
    await waitFor(() => expect(within(dialog).getByText("Audit log gaps")).toBeVisible());
    await expect(within(dialog).getByRole("button", { name: "POA-118" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

/** The Frame is given only its title and two extra columns: the legend keys the scatter's groups, and the Table toggle lays the points out one row each, the name and the group first, then a column per axis in its format. The groups are a column of words, not a column each. */
export const AsATable: Story = {
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart
        title="Findings by age and exposure"
        description="Open findings in the POA&M"
        columns={[
          { key: "title", label: "Title", place: "before" },
          { key: "owner", label: "Owner" },
        ]}
        download={["csv"]}
      >
        <Chart.Scatter
          data={findings}
          x="age"
          y="exposure"
          nameKey="id"
          groupBy="status"
          groups={riskGroups}
          xLabel="Days open"
          yLabel="Exposure"
          formatY={dollars}
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
      name: "Findings by age and exposure, as a table",
    });
    await expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Point", "Group", "Title", "Days open", "Exposure", "Owner"]);
    const rows = within(table).getAllByRole("row").slice(1);
    await expect(rows).toHaveLength(findings.length);
    await expect(Array.from(rows[0]!.querySelectorAll("th, td")).map((c) => c.textContent)).toEqual(
      ["POA-102", "Open", "Unpatched hypervisor", "212", "$420K", "D. Whitfield"],
    );
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    await waitFor(() => expect(canvas.queryByRole("table")).not.toBeInTheDocument());
  },
};

/** The earlier spelling, for one version: `name` is still the key that names a point, with a warning in development, and the plot is still named by the Frame or `label`. `ledger/no-deprecated-name` rewrites it as `nameKey`. */
export const EarlierSpelling: Story = {
  tags: ["!manifest"],
  name: "Deprecated spellings",
  render: () => (
    <Box style={{ maxWidth: 560 }}>
      <Chart title="Findings by age and exposure">
        <Chart.Scatter data={findings} x="age" y="exposure" name="id" xLabel="Days open" />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("img", { name: "Findings by age and exposure" })).toBeVisible();
    // The points are named by the datum's `id`, as `nameKey="id"` names them.
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    const table = await canvas.findByRole("table", {
      name: "Findings by age and exposure, as a table",
    });
    const rows = within(table).getAllByRole("row").slice(1);
    await expect(rows.map((r) => r.querySelector("th, td")?.textContent)).toEqual(
      findings.map((f) => f.id),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    await waitFor(() => expect(canvas.queryByRole("table")).not.toBeInTheDocument());
  },
};

/** The plot's box takes native props and a ref: an `id`, `data-*` for a test, a handler. `aria-describedby` describes the plot: its svg, an image, when it chooses nothing; its group when its points are the tab stops. */
export const NativeAttributes: Story = {
  render: () => (
    <Stack space="space.300">
      <Box style={{ width: "100%", maxWidth: 480 }}>
        <Chart.Scatter
          data={findings}
          x="age"
          y="exposure"
          nameKey="id"
          size="small"
          label="Findings by age and exposure"
          data-testid="findings-plot"
          aria-describedby="findings-note"
          ref={(node) => node?.setAttribute("data-ref", "")}
        />
        <Text id="findings-note" size="small" color="color.text.subtle">
          Open findings only.
        </Text>
      </Box>
      <Box style={{ width: "100%", maxWidth: 480 }}>
        <Chart.Scatter
          data={findings}
          x="age"
          y="exposure"
          nameKey="id"
          size="small"
          label="Findings to choose"
          onSelect={() => {}}
          aria-describedby="choose-note"
        />
        <Text id="choose-note" size="small" color="color.text.subtle">
          Choose a point for its finding.
        </Text>
      </Box>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("findings-plot");
    await expect(box).toHaveAttribute("data-chart-plot");
    await expect(box).toHaveAttribute("data-ref");
    await expect(
      canvas.getByRole("img", { name: "Findings by age and exposure" }),
    ).toHaveAccessibleDescription("Open findings only.");
    await expect(
      canvas.getByRole("group", { name: "Findings to choose" }),
    ).toHaveAccessibleDescription("Choose a point for its finding.");
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Chart title="Findings by age and exposure" series={riskGroups} swatch="dot" size="small">
            <Chart.Scatter
              data={findings}
              x="age"
              y="exposure"
              nameKey="id"
              groupBy="status"
              groups={riskGroups}
              size="small"
            />
          </Chart>
        }
        doText="Three groups, in the status tones, because the groups are statuses. Anything finer is the tooltip's, or a filter's."
        dont={
          <Chart title="Findings by owner" series={owners} swatch="dot" size="small">
            <Chart.Scatter
              data={findings}
              x="age"
              y="exposure"
              nameKey="id"
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
    groupBy: "status",
    groups: riskGroups,
    xLabel: "Days open",
    yLabel: "Exposure",
    formatY: dollars,
    size: "medium",
  },
};
