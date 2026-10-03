import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Chart } from "../..";
import { Button, KeyValue } from "../../components";
import { Box, Stack, Text } from "../../primitives";
import { bySource, bySystem, componentFacts, sourceSeries } from "../_lib/chart-data";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

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
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Specimens title="Four systems · small · one branch (its tone inherited)">
        <Box style={{ width: "100%", maxWidth: 420 }}>
          <Chart.Treemap data={bySystem} size="small" label="Findings by system and component" />
        </Box>
        <Box style={{ width: "100%", maxWidth: 240 }}>
          <Chart.Treemap data={bySystem} size="small" label="Findings by system and component" />
        </Box>
        <Box style={{ width: "100%", maxWidth: 240 }}>
          <Chart.Treemap data={bySystem.slice(0, 1)} size="small" label="Findings in Payments" />
        </Box>
      </Specimens>
      <Specimens title="Loading">
        <Box style={{ width: "100%", maxWidth: 420 }}>
          <Chart.Treemap
            data={bySystem}
            size="small"
            label="Findings by system and component"
            loading
          />
        </Box>
      </Specimens>
      <Specimens title="Unnamed · decorative, with no tab stops">
        <Box style={{ width: "100%", maxWidth: 240 }}>
          <Chart.Treemap data={bySystem.slice(0, 1)} size="small" />
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const decorative = canvasElement.querySelector('[data-chart-plot][aria-hidden="true"]');
    await expect(decorative).not.toBeNull();
    await expect(decorative?.querySelectorAll('[tabindex="0"], [role="button"]')).toHaveLength(0);
    // A named treemap that chooses nothing is an image of the data, with no tab stop.
    const named = canvas.getByRole("img", { name: "Findings in Payments" });
    await expect(named.querySelectorAll('[tabindex="0"], [role="button"]')).toHaveLength(0);
    await expect(canvasElement.querySelectorAll('[data-chart-plot] [tabindex="0"]')).toHaveLength(
      0,
    );
  },
};

/** Findings by system and component: each tile a leaf sized by count, each system a hue. A name shows when it fits; the rest is the tooltip's. */
export const Systems: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
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
    <Box style={{ maxWidth: 640 }}>
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
                        <KeyValue label="Owner" labelWidth="narrow">
                          {f.owner}
                        </KeyValue>
                        <KeyValue label="Assessed" labelWidth="narrow">
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
    // Enter the plotted actions through the real tab sequence after the legend and the Table toggle.
    await expect(canvas.getByRole("button", { name: "Network" })).toBeVisible();
    canvas.getByRole("button", { name: "Table" }).focus();
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

/** Whether a tile's keyboard ring shows, and where it is drawn. */
const ringOf = (tile: Element) => {
  const ring = tile.querySelector<SVGGElement>('[data-slot="chart-mark-focus"]');
  return { ring, shown: ring ? getComputedStyle(ring).opacity === "1" : false };
};

/** A click on a tile, or Enter on it, opens its card: the tile, its system and its value, then the caller's facts. The keyboard's ring is drawn inside the tile, so the next tile cannot paint over it and the plot's edge cannot cut it; the hover tooltip names the tile and its system. */
export const Details: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart title="Findings by system and component" description="Click a tile" series={systems}>
        <Chart.Treemap
          data={bySystem}
          size="large"
          details={(s) => {
            const f = componentFacts[s.name];
            return f ? (
              <Stack space="space.150">
                <div>
                  <KeyValue label="Owner" labelWidth="narrow">
                    {f.owner}
                  </KeyValue>
                  <KeyValue label="Open" labelWidth="narrow">
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
    await expect(tile).toHaveAttribute("aria-haspopup", "dialog");
    // The pointer's tooltip: the tile's name and its system, then its value.
    await userEvent.hover(tile.querySelector("rect")!);
    const tooltip = await waitFor(() => {
      const box = canvasElement.querySelector(".recharts-tooltip-wrapper");
      expect(box?.textContent).toContain("Card vault");
      return box!;
    });
    await expect(tooltip.textContent).toContain("Payments");
    await expect(tooltip.textContent).toContain("11");
    await userEvent.click(tile);
    const dialog = await page.findByRole("dialog", { name: /Findings by system and component/ });
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Open Card vault" })).toBeVisible(),
    );
    await expect(tile).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Payments, Card vault: 11" })).toHaveFocus();
    // On the keyboard the ring shows on the first tile and on the last, wholly inside the plot.
    const tiles = Array.from(
      canvasElement.querySelectorAll<SVGGElement>('[data-chart-tile][tabindex="0"]'),
    );
    const svg = canvasElement.querySelector("[data-chart-plot] svg.recharts-surface")!;
    // The tiles draw in from script, not CSS: measure once they hold still.
    await waitFor(async () => {
      const at = () => tiles.map((t) => t.getBoundingClientRect().left).join();
      const before = at();
      await new Promise((r) => setTimeout(r, 120));
      expect(at()).toBe(before);
    });
    for (const t of [tiles[0]!, tiles[tiles.length - 1]!]) {
      await userEvent.keyboard("{Shift}");
      t.focus();
      await waitFor(() => expect(ringOf(t).shown).toBe(true));
      const bounds = svg.getBoundingClientRect();
      const box = ringOf(t).ring!.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(bounds.left);
      await expect(box.top).toBeGreaterThanOrEqual(bounds.top);
      await expect(box.right).toBeLessThanOrEqual(bounds.right);
      await expect(box.bottom).toBeLessThanOrEqual(bounds.bottom);
      // The ring is the last thing the tile draws, and the tile's own box holds it.
      await expect(t.lastElementChild).toBe(ringOf(t).ring);
      // The pointer's tooltip stands down while the keyboard is on a tile.
      await waitFor(() =>
        expect(
          canvasElement.querySelector<HTMLElement>(".recharts-tooltip-wrapper")?.style.visibility,
        ).not.toBe("visible"),
      );
    }
    await expect(ringOf(tiles[1]!).shown).toBe(false);
  },
};

const twoCores = [
  {
    name: "Payments",
    children: [
      { name: "Core", value: 9 },
      { name: "Gateway", value: 5 },
    ],
  },
  {
    name: "Network",
    children: [
      { name: "Core", value: 6 },
      { name: "Edge", value: 4 },
    ],
  },
];

/** Two components called Core, in two systems. The selection carries the tile's `path` (and its `id`, when the node has one), so choosing one Core chooses that Core alone. */
export const SameNames: Story = {
  render: () => (
    <Box style={{ maxWidth: 480 }}>
      <Chart
        title="Findings by system and component"
        series={[{ key: "Payments" }, { key: "Network" }]}
      >
        <Chart.Treemap
          data={twoCores}
          size="medium"
          details={(s) => <KeyValue label="Path">{s.path.join(" › ")}</KeyValue>}
        />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await canvas.findByRole("button", { name: "Network, Core: 6" }));
    const dialog = await page.findByRole("dialog");
    await waitFor(() => expect(within(dialog).getByText("Network › Core")).toBeVisible());
    // Only the chosen Core stays at full strength; the other Core dims with the rest.
    const paymentsCore = canvas.getByRole("button", { name: "Payments, Core: 9" });
    await expect(paymentsCore).toHaveClass("opacity-disabled");
    await expect(canvas.getByRole("button", { name: "Network, Core: 6" })).not.toHaveClass(
      "opacity-disabled",
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
  },
};

/** The Frame is given only its title: the legend keys the treemap's systems, and the Table toggle lays its leaves out one row each, a column per level named by `levels`, then the value. A system hidden from the legend stays in the table, which is the data. */
export const AsATable: Story = {
  render: () => (
    <Box style={{ maxWidth: 640 }}>
      <Chart
        title="Findings by system and component"
        description="Open findings, sized by count"
        download={["csv"]}
      >
        <Chart.Treemap data={bySystem} levels={["System", "Component"]} />
      </Chart>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Payments" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    const table = await canvas.findByRole("table", {
      name: "Findings by system and component, as a table",
    });
    const headings = within(table)
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    await expect(headings).toEqual(["System", "Component", "Value"]);
    const rows = within(table).getAllByRole("row").slice(1);
    await expect(rows).toHaveLength(9);
    await expect(Array.from(rows[0]!.querySelectorAll("th, td")).map((c) => c.textContent)).toEqual(
      ["Payments", "Ledger API", "18"],
    );
    await userEvent.click(canvas.getByRole("button", { name: "Network" }));
    await expect(within(table).getAllByRole("row")).toHaveLength(10);
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    await waitFor(() => expect(canvas.queryByRole("table")).not.toBeInTheDocument());
    await expect(canvasElement.querySelector("[data-chart-plot]")).not.toBeNull();
  },
};

/** The plot's box takes native props and a ref: an `id`, `data-*` for a test, a handler. `aria-describedby` describes the plot: its svg, an image, when it chooses nothing; its group when its tiles are the tab stops. */
export const NativeAttributes: Story = {
  render: () => (
    <Stack space="space.300">
      <Box style={{ width: "100%", maxWidth: 480 }}>
        <Chart.Treemap
          data={bySystem}
          size="small"
          label="Findings by system"
          data-testid="systems-plot"
          aria-describedby="systems-note"
          ref={(node) => node?.setAttribute("data-ref", "")}
        />
        <Text id="systems-note" size="small" color="color.text.subtle">
          Open findings, sized by count.
        </Text>
      </Box>
      <Box style={{ width: "100%", maxWidth: 480 }}>
        <Chart.Treemap
          data={bySystem}
          size="small"
          label="Systems to choose"
          onSelect={() => {}}
          aria-describedby="choose-note"
        />
        <Text id="choose-note" size="small" color="color.text.subtle">
          Choose a component for its findings.
        </Text>
      </Box>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("systems-plot");
    await expect(box).toHaveAttribute("data-chart-plot");
    await expect(box).toHaveAttribute("data-ref");
    await expect(
      canvas.getByRole("img", { name: "Findings by system" }),
    ).toHaveAccessibleDescription("Open findings, sized by count.");
    await expect(
      canvas.getByRole("group", { name: "Systems to choose" }),
    ).toHaveAccessibleDescription("Choose a component for its findings.");
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
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
