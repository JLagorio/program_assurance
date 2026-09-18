import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Chart } from "../..";
import { Button, KeyValue } from "../../components";
import { Box, Stack } from "../../primitives";
import { bySource, bySystem, componentFacts, sourceSeries } from "../_lib/chart-data";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/Chart/Treemap",
  component: Chart.Treemap,
  parameters: { layout: "padded" },
  args: { data: bySystem, label: "Findings by system and component" },
} satisfies Meta<typeof Chart.Treemap>;
export default meta;
type Story = StoryObj<typeof meta>;

const systems = bySystem.map((s) => ({ key: s.name, label: s.name }));

/** Every treemap in both modes: four systems with their components; small; one branch alone; loading. */
export const TreemapMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Four systems · small · one branch (its tone inherited)">
        <Box style={{ width: 420 }}>
          <Chart.Treemap data={bySystem} size="small" label="Findings by system and component" />
        </Box>
        <Box style={{ width: 240 }}>
          <Chart.Treemap data={bySystem} size="small" label="Findings by system and component" />
        </Box>
        <Box style={{ width: 240 }}>
          <Chart.Treemap data={bySystem.slice(0, 1)} size="small" label="Findings in Payments" />
        </Box>
      </Specimens>
      <Specimens title="Loading">
        <Box style={{ width: 420 }}>
          <Chart.Treemap
            data={bySystem}
            size="small"
            label="Findings by system and component"
            loading
          />
        </Box>
      </Specimens>
      <Specimens title="Unnamed · decorative, with no tab stops">
        <Box style={{ width: 240 }}>
          <Chart.Treemap data={bySystem.slice(0, 1)} size="small" onSelect={() => undefined} />
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const decorative = canvasElement.querySelector('[data-chart-plot][aria-hidden="true"]');
    await expect(decorative).not.toBeNull();
    await expect(decorative?.querySelectorAll('[tabindex="0"], [role="button"]')).toHaveLength(0);
  },
};

/** Findings by system and component: each tile a leaf sized by count, each system a hue. A name shows when it fits; the rest is the tooltip's. */
export const Systems: Story = {
  render: () => (
    <Box style={{ width: 640, maxWidth: "100%" }}>
      <Chart
        title="Findings by system and component"
        description="Open findings, sized by count"
        series={systems}
      >
        <Chart.Treemap data={bySystem} size="large" />
      </Chart>
    </Box>
  ),
};

function Drilling() {
  const [system, setSystem] = useState<string | null>(null);
  const data = system ? bySystem.filter((s) => s.name === system) : bySystem;
  return (
    <Box style={{ width: 640, maxWidth: "100%" }}>
      <Chart.Frame
        title="Findings by system and component"
        description={system ? `Components of ${system}` : "Click a tile for its system"}
        path={
          system
            ? [{ label: "All systems", onSelect: () => setSystem(null) }, { label: system }]
            : undefined
        }
        series={system ? undefined : systems}
      >
        <Chart.Treemap
          data={data}
          size="large"
          onSelect={system ? undefined : (s) => setSystem(s.group)}
          details={
            system
              ? (s) => {
                  const f = componentFacts[s.name];
                  return f ? (
                    <Stack space="space.150">
                      <div>
                        <KeyValue label="Owner" labelWidth={88}>
                          {f.owner}
                        </KeyValue>
                        <KeyValue label="Assessed" labelWidth={88}>
                          {f.assessed}
                        </KeyValue>
                      </div>
                      <Button size="small" variant="secondary">{`Open ${s.name}`}</Button>
                    </Stack>
                  ) : null;
                }
              : undefined
          }
        />
      </Chart.Frame>
    </Box>
  );
}

/** A drill-down: a click on a tile redraws the treemap with that system's components, the way back in the path; a click on a component opens its card. */
export const Drilldown: Story = {
  render: () => <Drilling />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    // Enter the plotted actions through the real tab sequence after the legend.
    canvas.getByRole("button", { name: "Network" }).focus();
    await userEvent.tab();
    const tile = await canvas.findByRole("button", { name: "Payments, Ledger API: 18" });
    await expect(tile).toHaveFocus();
    // Reach a later branch: unlike the first branch, Recharts replaces this leaf's DOM on drill-down.
    const lastTile = canvas.getByRole("button", { name: "Network, Core: 3" });
    const tiles = canvasElement.querySelectorAll("[data-chart-tile][tabindex]");
    for (let i = 1; i < tiles.length; i++) await userEvent.tab();
    await expect(lastTile).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Components of Network")).toBeVisible();
    const detailTile = await canvas.findByRole("button", { name: "Network, Core: 3" });
    await waitFor(() => expect(detailTile).toHaveFocus());
    await userEvent.keyboard(" ");
    const dialog = await page.findByRole("dialog", { name: /Findings by system and component/ });
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Open Core" })).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Network, Core: 3" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "All systems" }));
    await expect(canvas.getByText("Click a tile for its system")).toBeVisible();
  },
};

/** A click on a tile opens its card: the tile, its system and its value, then the caller's facts. */
export const Details: Story = {
  render: () => (
    <Box style={{ width: 640, maxWidth: "100%" }}>
      <Chart title="Findings by system and component" description="Click a tile" series={systems}>
        <Chart.Treemap
          data={bySystem}
          size="large"
          details={(s) => {
            const f = componentFacts[s.name];
            return f ? (
              <Stack space="space.150">
                <div>
                  <KeyValue label="Owner" labelWidth={88}>
                    {f.owner}
                  </KeyValue>
                  <KeyValue label="Open" labelWidth={88}>
                    {`${f.open} findings`}
                  </KeyValue>
                </div>
                <Button size="small" variant="secondary">{`Open ${s.name}`}</Button>
              </Stack>
            ) : null;
          }}
        />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const tile = await canvas.findByRole("button", { name: "Payments, Card vault: 11" });
    await userEvent.click(tile);
    const dialog = await page.findByRole("dialog", { name: /Findings by system and component/ });
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Open Card vault" })).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Payments, Card vault: 11" })).toHaveFocus();
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Chart title="Findings by source" size="small">
            <Chart.Bar
              data={bySource}
              x="source"
              series={sourceSeries}
              horizontal
              labels="end"
              size="small"
            />
          </Chart>
        }
        doText="A flat list of five is bars: length compares, and every name fits."
        dont={
          <Chart title="Findings by source" size="small">
            <Chart.Treemap
              data={bySource.map((s) => ({ name: s.source, value: s.n }))}
              size="small"
            />
          </Chart>
        }
        dontText="A treemap with no hierarchy. Five tiles in five hues compare area, which the eye reads poorly, and the small ones lose their names."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    size: "medium",
  },
};
