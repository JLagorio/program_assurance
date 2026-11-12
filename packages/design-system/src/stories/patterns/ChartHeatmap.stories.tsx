import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Chart } from "../..";
import { Badge, Button, KeyValue } from "../../components";
import { Box, Grid, Stack, Text } from "../../primitives";
import {
  elements,
  families,
  findingsByFamilyMonth,
  heatMonths,
  impacts,
  likelihoods,
  phases,
  requirementsByElementTechnique,
  riskCount,
  riskTone,
  risksAt,
  techniques,
  varianceByPhase,
} from "../_lib/chart-data";
import { along, isRtl, scrolledFromStart, towardsEnd } from "../_lib/direction";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const findings = (r: string, c: string) => findingsByFamilyMonth[r]?.[heatMonths.indexOf(c)];
const variance = (r: string, c: string) => varianceByPhase[r]?.[heatMonths.indexOf(c)];
const days = (v: number) => `${v > 0 ? "+" : ""}${v} days`;
/** The risk matrix's key: what each tone of `riskTone` means. */
const riskLevels = [
  { tone: "success" as const, label: "Low" },
  { tone: "information" as const, label: "Medium" },
  { tone: "warning" as const, label: "High" },
  { tone: "danger" as const, label: "Very high" },
];
/** Findings with gaps: a family not yet assessed in a month has no value, not zero. */
const withGaps = (r: string, c: string) =>
  (r === "AU" && c === "Apr") || (r === "CM" && (c === "Jul" || c === "Aug"))
    ? null
    : findings(r, c);
/** A cell's text as the table holds it: the row's header, then each cell. */
const texts = (row: Element) =>
  Array.from(row.querySelectorAll("th, td")).map((c) => c.textContent);

const meta = {
  title: "Patterns/Chart/Heatmap",
  component: Chart.Heatmap,
  parameters: { layout: "padded" },
  args: {
    rows: families,
    columns: heatMonths,
    value: findings,
    label: "Findings by family and month",
    rowLabel: "Family",
    columnLabel: "Month",
  },
} satisfies Meta<typeof Chart.Heatmap>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every grid in both modes: sequential, diverging and status scales with their keys; small cells, values printed, empty cells, loading. A step close to the surface wears a `color.border.bold` edge, so its cell never sinks into the page; an empty cell is a dashed edge with no fill, so it never passes for a low value. */
export const HeatmapMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Specimens title="Sequential · diverging · status, with values">
        <Stack space="space.100" className="min-w-0">
          <Chart.Heatmap
            rows={families}
            columns={heatMonths}
            value={findings}
            domain={[0, 12]}
            size="small"
            label="Findings by family and month"
          />
          <Chart.Scale scale="sequential" domain={[0, 12]} />
        </Stack>
        <Stack space="space.100" className="min-w-0">
          <Chart.Heatmap
            rows={phases}
            columns={heatMonths}
            value={variance}
            scale="diverging"
            domain={[-12, 12]}
            format={days}
            size="small"
            label="Schedule variance by phase and month"
          />
          <Chart.Scale scale="diverging" min="−12 days" mid="On plan" max="+12 days" />
        </Stack>
        <Stack space="space.100" className="min-w-0">
          <Chart.Heatmap
            rows={[...likelihoods].reverse()}
            columns={impacts}
            value={riskCount}
            scale={riskTone}
            size="small"
            label="Risk matrix"
            rowLabel="Likelihood"
            columnLabel="Impact"
          />
          <Chart.Scale scale="status" steps={riskLevels} />
        </Stack>
      </Specimens>
      <Specimens title="Empty cells · zero as its own step">
        <Chart.Heatmap
          rows={families.slice(0, 3)}
          columns={heatMonths}
          value={withGaps}
          size="small"
          label="Findings by family and month, with gaps"
        />
        <Stack space="space.100" className="min-w-0">
          <Chart.Heatmap
            rows={families.slice(1, 4)}
            columns={heatMonths}
            value={findings}
            domain={[0, 12]}
            zeroStep
            size="small"
            label="Findings by family and month, zero apart"
          />
          <Chart.Scale scale="sequential" domain={[0, 12]} zeroStep />
        </Stack>
      </Specimens>
      <Specimens title="Values printed on a colour scale · large cells · loading">
        <Chart.Heatmap
          rows={families}
          columns={heatMonths}
          value={findings}
          showValues
          size="small"
          label="Findings by family and month, with values"
        />
        <Chart.Heatmap
          rows={families.slice(0, 3)}
          columns={heatMonths}
          value={findings}
          size="large"
          label="Findings by family and month, large"
        />
        <Chart.Heatmap
          rows={families.slice(0, 3)}
          columns={heatMonths}
          value={findings}
          size="small"
          label="Findings by family and month"
          loading
        />
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // No value is an empty cell, apart from a zero: it holds no number, even for a screen reader.
    const gaps = canvas.getByRole("table", { name: "Findings by family and month, with gaps" });
    const empty = gaps.querySelectorAll('[data-slot="chart-heatmap-cell"][data-empty]');
    await expect(empty).toHaveLength(3);
    await expect(empty[0]).toHaveAttribute("title", "AU, Apr: none");
    // An empty cell is a dashed edge and no fill; a faint step a solid edge; a strong one none.
    await expect(getComputedStyle(empty[0]!).borderTopWidth).toBe("1px");
    await expect(getComputedStyle(empty[0]!).borderTopStyle).toBe("dashed");
    await expect(getComputedStyle(empty[0]!).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    const sequential = canvas.getByRole("table", { name: "Findings by family and month" });
    const faint = getComputedStyle(within(sequential).getByTitle("AU, Jul: 1"));
    await expect(faint.borderTopWidth).toBe("1px");
    await expect(faint.borderTopStyle).toBe("solid");
    await expect(
      getComputedStyle(within(sequential).getByTitle("SC, Jun: 12")).borderTopWidth,
    ).toBe("0px");
    // Zero apart: its own fill, the track's, which no binned value wears.
    const zeroApart = canvas.getByRole("table", {
      name: "Findings by family and month, zero apart",
    });
    const zero = within(zeroApart).getByTitle("AU, Sep: 0");
    const one = within(zeroApart).getByTitle("AU, Jul: 1");
    await expect(zero.style.backgroundColor).not.toBe(one.style.backgroundColor);
    // In forced colours a colour-scale cell keeps its fill, outlined, rather than turning to Canvas.
    if (window.matchMedia("(forced-colors: active)").matches) {
      const cell = within(
        canvas.getByRole("table", { name: "Findings by family and month" }),
      ).getByTitle("SC, Jun: 12");
      await expect(getComputedStyle(cell).forcedColorAdjust).toBe("none");
      await expect(getComputedStyle(cell).backgroundColor).not.toBe(
        getComputedStyle(canvasElement.ownerDocument.body).backgroundColor,
      );
    }
  },
};

/** How much, in one hue from light to dark, with the scale's key. The Frame offers the values two ways: Values prints each on its cell, over the colour, and Table lays the grid out as a table, a row per family and a column per month. */
export const Sequential: Story = {
  render: () => (
    <Chart title="Findings by family and month" description="Opened in the month">
      <Stack space="space.150">
        <Chart.Heatmap
          rows={families}
          columns={heatMonths}
          value={(family, month) => findingsByFamilyMonth[family]?.[heatMonths.indexOf(month)]}
          domain={[0, 12]}
          label="Findings by family and month"
          rowLabel="Family"
          columnLabel="Month"
        />
        <Chart.Scale scale="sequential" domain={[0, 12]} max="12 findings" />
      </Stack>
    </Chart>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("table", { name: "Findings by family and month" });
    const cell = canvas.getByTitle("SC, Jun: 12");
    // At rest a colour scale keeps the value for a screen reader; Values prints it on the cell.
    await expect(within(cell).getByText("12")).toHaveClass("sr-only");
    const values = canvas.getByRole("button", { name: "Values" });
    await expect(values).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(values);
    await expect(values).toHaveAttribute("aria-pressed", "true");
    await expect(within(cell).getByText("12")).not.toHaveClass("sr-only");
    await expect(within(cell).getByText("12")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    const table = await canvas.findByRole("table", {
      name: "Findings by family and month, as a table",
    });
    await expect(grid).not.toBeInTheDocument();
    await expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Family", ...heatMonths]);
    const rows = within(table).getAllByRole("row").slice(1);
    await expect(rows).toHaveLength(families.length);
    await expect(texts(rows[0]!)).toEqual([
      "AC",
      ...(findingsByFamilyMonth["AC"] ?? []).map(String),
    ]);
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    // The reader's choice holds when the grid returns.
    await expect(within(canvas.getByTitle("SC, Jun: 12")).getByText("12")).toBeVisible();
  },
};

/** Above and below, in two hues around grey: schedule variance against the plan. Red is the negative arm because below the line is the problem. */
export const Diverging: Story = {
  render: () => (
    <Chart title="Schedule variance by phase" description="Days against the plan at month end">
      <Stack space="space.150">
        <Chart.Heatmap
          rows={phases}
          columns={heatMonths}
          value={(phase, month) => varianceByPhase[phase]?.[heatMonths.indexOf(month)]}
          scale="diverging"
          domain={[-12, 12]}
          format={(v) => `${v > 0 ? "+" : ""}${v} days`}
          label="Schedule variance by phase and month"
          rowLabel="Phase"
          columnLabel="Month"
        />
        <Chart.Scale scale="diverging" min="−12 days" mid="On plan" max="+12 days" />
      </Stack>
    </Chart>
  ),
};

/** Status by place: the risk matrix, each cell in the tone its position earns (the Badge's fills), the count printed in the tone's text, and `Chart.Scale scale="status"` saying what each tone means. Its values are always printed, so the Frame offers the table and no Values toggle. The value columns share one width, the widest heading's, so no impact looks weightier than another. */
export const Status: Story = {
  render: () => (
    <Chart title="Risk matrix" description="Open risks by likelihood and impact">
      <Stack space="space.150">
        <Chart.Heatmap
          rows={[...likelihoods].reverse()}
          columns={impacts}
          value={riskCount}
          scale={riskTone}
          size="large"
          label="Risk matrix"
          rowLabel="Likelihood"
          columnLabel="Impact"
        />
        <Chart.Scale scale="status" steps={riskLevels} />
      </Stack>
    </Chart>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("button", { name: "Values" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Table" })).toBeVisible();
    // The key names every tone the cells wear.
    for (const level of riskLevels) await expect(canvas.getByText(level.label)).toBeVisible();
    // Equal columns: "Minor" is as wide as "Moderate".
    const grid = canvas.getByRole("table", { name: "Risk matrix" });
    await waitFor(() => {
      const widths = within(grid)
        .getAllByRole("columnheader")
        .slice(1)
        .map((h) => Math.round(h.getBoundingClientRect().width));
      expect(new Set(widths).size).toBe(1);
    });
  },
};

/** Rows in a hierarchy: `rowLevel` indents each row's name under the row that holds it, and a `summary` row prints its totals as numbers with no fill, so a total never reads as one more cell of the scale. A status function may give one level `emphasis: "bold"`, the tone's solid fill, so the worst reads apart from the level under it in the same tone. */
export const GroupedRows: Story = {
  render: () => (
    <Chart
      title="Open findings by element and family"
      description="Each cell in the tone of its worst finding, with how many."
    >
      <Stack space="space.150">
        <Chart.Heatmap
          rows={[
            "Space segment",
            "Flight computer",
            "Payload controller",
            "Ground segment",
            "Mission operations",
            "Key management",
          ]}
          columns={["AC", "AU", "IA", "SC"]}
          value={(row, column) =>
            (
              ({
                "Space segment": { AC: 3, AU: 5, IA: 0, SC: 2 },
                "Flight computer": { AC: 1, AU: 2, IA: 0, SC: 2 },
                "Payload controller": { AC: 2, AU: 3, IA: 0, SC: 0 },
                "Ground segment": { AC: 4, AU: 1, IA: 2, SC: 0 },
                "Mission operations": { AC: 4, AU: 0, IA: 1, SC: 0 },
                "Key management": { AC: 0, AU: 1, IA: 1, SC: 0 },
              }) as Record<string, Record<string, number>>
            )[row]?.[column]
          }
          scale={(value, row, column) =>
            row === "Payload controller" && column === "AU"
              ? { tone: "danger", emphasis: "bold" }
              : value >= 3
                ? "danger"
                : value === 2
                  ? "warning"
                  : "neutral"
          }
          rowLevel={(row) => (row.endsWith("segment") ? 0 : 1)}
          summary={(row) => row.endsWith("segment")}
          zeroStep
          selectable={() => false}
          label="Open findings by element and family"
          rowLabel="Element"
          columnLabel="Family"
        />
        <Chart.Scale
          scale="status"
          steps={[
            { tone: "neutral", label: "Low" },
            { tone: "warning", label: "Moderate" },
            { tone: "danger", label: "High" },
            { tone: "danger", emphasis: "bold", label: "Critical" },
          ]}
        />
      </Stack>
    </Chart>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("table", { name: "Open findings by element and family" });
    const row = (name: string) => within(grid).getByRole("rowheader", { name }).closest("tr")!;
    const faces = (name: string) =>
      Array.from(row(name).querySelectorAll<HTMLElement>('[data-slot="chart-heatmap-cell"]'));
    // A summary row is numbers with no fill; the rows under it wear the scale.
    await expect(row("Space segment")).toHaveAttribute("data-summary");
    for (const face of faces("Space segment")) await expect(face.className).not.toMatch(/\bbg-/);
    await expect(faces("Space segment").map((face) => face.textContent)).toEqual([
      "3",
      "5",
      "0",
      "2",
    ]);
    await expect(row("Flight computer")).not.toHaveAttribute("data-summary");
    // The one bold cell reads apart from the subtle danger beside it.
    await expect(faces("Payload controller")[1]!.className).toMatch(/\bbg-danger-bold\b/);
    await expect(faces("Mission operations")[0]!.className).toMatch(/\bbg-danger\b/);
    // With `zeroStep`, none wears no tone: a muted number, never the lowest level's fill.
    await expect(faces("Mission operations")[1]!.className).not.toMatch(/\bbg-/);
    await expect(faces("Mission operations")[1]).toHaveTextContent("0");
    // A row under another starts further in.
    const start = (name: string) =>
      parseFloat(
        getComputedStyle(within(grid).getByRole("rowheader", { name })).paddingInlineStart,
      );
    await expect(start("Flight computer")).toBeGreaterThan(start("Space segment"));
    // The key names the bold step in words.
    await expect(canvas.getByText("Critical")).toBeVisible();
  },
};

/** Long column names over narrow cells. `columnHeadings="vertical"` turns each name to read up the page from its column, so a column is as wide as its cells: these fourteen techniques take 40px each, where their names on one line would take three times the room and scroll the grid sideways. Every heading is still its column's name, whole; the pointer over it, a cell's title and the Table toggle say it level. */
export const VerticalHeadings: Story = {
  render: () => (
    <Chart
      title="Requirements by element and technique"
      description="Allocated requirements whose controls support the technique"
    >
      <Stack space="space.150">
        <Chart.Heatmap
          rows={elements.map((element) => element.name)}
          columns={techniques}
          value={(element, technique) =>
            requirementsByElementTechnique[element]?.[techniques.indexOf(technique)]
          }
          domain={[0, 5]}
          zeroStep
          size="small"
          columnHeadings="vertical"
          rowLevel={(name) => elements.find((element) => element.name === name)?.level ?? 0}
          summary={(name) => elements.find((element) => element.name === name)?.total ?? false}
          label="Requirements by element and technique"
          rowLabel="Element"
          columnLabel="Technique"
        />
        <Chart.Scale scale="sequential" domain={[0, 5]} zeroStep />
      </Stack>
    </Chart>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("table", { name: "Requirements by element and technique" });
    const headers = within(grid).getAllByRole("columnheader").slice(1);
    // Every heading is its column's name, whole, and says it level under the pointer.
    await expect(headers.map((header) => header.textContent)).toEqual(techniques);
    await expect(
      within(grid).getByRole("columnheader", { name: "Substantiated Integrity" }),
    ).toBeVisible();
    const headings = headers.map((header) =>
      header.querySelector<HTMLElement>("[data-heatmap-heading]")!,
    );
    // The names are measured in the face the reader sees, once it has loaded.
    await canvasElement.ownerDocument.fonts.ready;
    for (const heading of headings) {
      await expect(heading).toHaveAttribute("title", heading.textContent);
      // Turned: on one line that runs up the page, taller than it is wide.
      await waitFor(() => {
        const box = heading.getBoundingClientRect();
        expect(box.height).toBeGreaterThan(box.width);
        expect(Math.round(box.width)).toBeLessThanOrEqual(16);
      });
      // It turns the other way where the page reads right to left, its mirror.
      await expect(getComputedStyle(heading).rotate).toBe(isRtl(heading) ? "none" : "180deg");
    }
    // The names start on one line, beside their columns, however long each is.
    const starts = headings.map((heading) => heading.getBoundingClientRect().bottom);
    await expect(Math.max(...starts) - Math.min(...starts)).toBeLessThanOrEqual(1);
    // The columns take their cells' width, one width, and not their names'.
    await waitFor(() => {
      const widths = headers.map((header) => Math.round(header.getBoundingClientRect().width));
      expect(new Set(widths).size).toBe(1);
      expect(widths[0]).toBeLessThanOrEqual(48);
    });
    // On one line every column would be as wide as the longest name: these take under half that.
    const rowNames = within(grid).getAllByRole("columnheader")[0]!.getBoundingClientRect().width;
    const longest = Math.max(...headings.map((heading) => heading.getBoundingClientRect().height));
    await expect(grid.offsetWidth - rowNames).toBeLessThan((longest * techniques.length) / 2);
    // So the grid fits a box the names on one line would overflow: no sideways scroll, no region.
    const box = grid.parentElement!;
    if (box.clientWidth >= grid.offsetWidth) {
      await waitFor(() => {
        expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth + 1);
        expect(box).not.toHaveAttribute("role");
        expect(box).not.toHaveAttribute("tabindex");
      });
    }
    // A cell says its column level, and so does the table twin.
    await expect(
      within(grid).getByTitle("Flight computer, Substantiated Integrity: 3"),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    const table = await canvas.findByRole("table", {
      name: "Requirements by element and technique, as a table",
    });
    await expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(["Element", ...techniques]);
    await expect(table.querySelector("[data-heatmap-heading]")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    await expect(
      await canvas.findByRole("table", { name: "Requirements by element and technique" }),
    ).toBeVisible();
  },
};

/** A name longer than a heading's line, about twenty-five characters, takes a second line beside the first, so the band of headings keeps a readable height and the columns their width. A name that needs a third line widens every column alike, as the second grid shows. Keep to names of a few words: the longer a name, the more of it the reader turns their head for. */
export const VerticalHeadingsLongNames: Story = {
  render: () => (
    <Stack space="space.300">
      <Chart.Heatmap
        rows={["Flight computer", "Mission operations", "Key management"]}
        columns={[
          "Identity management and access control",
          "Awareness and training",
          "Data security",
          "Platform security",
        ]}
        value={(element, category) => (element.length + category.length) % 5}
        columnHeadings="vertical"
        showValues
        size="small"
        label="Requirements by element and category"
        rowLabel="Element"
        columnLabel="Category"
      />
      <Chart.Heatmap
        rows={["Flight computer", "Mission operations", "Key management"]}
        columns={[
          "Identity management, authentication and access control",
          "Awareness and training",
          "Data security",
          "Platform security",
        ]}
        value={(element, category) => (element.length + category.length) % 5}
        columnHeadings="vertical"
        showValues
        size="small"
        label="Requirements by element and category, a longer name"
        rowLabel="Element"
        columnLabel="Category"
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("table", { name: "Requirements by element and category" });
    const longer = canvas.getByRole("table", {
      name: "Requirements by element and category, a longer name",
    });
    const heading = (table: HTMLElement, name: string) =>
      within(table)
        .getByRole("columnheader", { name })
        .querySelector<HTMLElement>("[data-heatmap-heading]")!
        .getBoundingClientRect();
    const widths = (table: HTMLElement) =>
      within(table)
        .getAllByRole("columnheader")
        .slice(1)
        .map((header) => Math.round(header.getBoundingClientRect().width));
    // The names are measured in the face the reader sees, once it has loaded.
    await canvasElement.ownerDocument.fonts.ready;
    // The long name runs to a second line, as deep again, and neither line is longer than the cap.
    await waitFor(() => {
      const line = heading(grid, "Data security");
      const two = heading(grid, "Identity management and access control");
      expect(Math.round(two.width)).toBe(Math.round(line.width) * 2);
      expect(two.height).toBeGreaterThan(line.height);
      expect(two.height).toBeLessThanOrEqual(161);
    });
    // Two lines fit the cells' width: the columns are the width they were, and all one width.
    await waitFor(() => {
      expect(new Set(widths(grid)).size).toBe(1);
      expect(widths(grid)[0]).toBeLessThanOrEqual(48);
    });
    // A third line is deeper than a cell is wide, so every column widens with it, alike.
    await waitFor(() => {
      const line = heading(longer, "Data security");
      const three = heading(longer, "Identity management, authentication and access control");
      expect(Math.round(three.width)).toBeGreaterThanOrEqual(Math.round(line.width) * 3);
      expect(three.height).toBeLessThanOrEqual(161);
      expect(new Set(widths(longer)).size).toBe(1);
      expect(widths(longer)[0]).toBeGreaterThan(widths(grid)[0]!);
    });
    // Each name is whole all the same.
    await expect(
      within(longer).getByRole("columnheader", {
        name: "Identity management, authentication and access control",
      }),
    ).toBeVisible();
  },
};

/** The cells that hold risks are buttons: a click, or Enter, opens the cell's card with the risks in it. A cell of zero has nothing to open and is no tab stop; `selectable` says otherwise when it should. */
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
                <KeyValue key={r.id} label={r.id} labelWidth="narrow">
                  {r.title}
                </KeyValue>
              ))}
            </Stack>
            <Button size="small" variant="secondary">
              Open the register
            </Button>
          </Stack>
        )}
      />
    </Chart>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const grid = canvas.getByRole("table", { name: "Risk matrix" });
    // Only the cells with risks in them choose: a tab stop each, and none for a zero.
    const withRisks = likelihoods.flatMap((l) => impacts.filter((i) => riskCount(l, i) > 0));
    await expect(within(grid).getAllByRole("button")).toHaveLength(withRisks.length);
    await expect(canvas.getByTitle("Rare, Minor: 0").closest("button")).toBeNull();
    const cell = canvas
      .getByTitle(`Likely, Critical: ${riskCount("Likely", "Critical")}`)
      .closest("button");
    await expect(cell).not.toBeNull();
    // It opens a card, and says whether the card is open.
    await expect(cell).toHaveAttribute("aria-haspopup", "dialog");
    await expect(cell).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(cell!);
    const dialog = await page.findByRole("dialog", { name: "Risk matrix, details" });
    // The card is the kit's PopoverContent, capped at the height the window leaves it.
    await expect(dialog).toHaveAttribute("data-slot", "popover-content");
    await expect(getComputedStyle(dialog).maxHeight).not.toBe("none");
    await waitFor(() => expect(within(dialog).getByText("Likely, Critical")).toBeVisible());
    await expect(within(dialog).getByText("Likelihood by Impact")).toBeVisible();
    await expect(cell).toHaveAttribute("aria-expanded", "true");
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "Open the register" })).toHaveFocus(),
    );
    await waitFor(() => {
      const popupRect = dialog.getBoundingClientRect();
      const cellRect = cell!.getBoundingClientRect();
      expect(popupRect.left).toBeLessThan(cellRect.right);
      expect(popupRect.right).toBeGreaterThan(cellRect.left);
      expect(
        Math.min(
          Math.abs(popupRect.bottom - cellRect.top),
          Math.abs(popupRect.top - cellRect.bottom),
        ),
      ).toBeLessThan(16);
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(cell).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(cell).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    const reopened = await page.findByRole("dialog", { name: "Risk matrix, details" });
    await waitFor(() =>
      expect(within(reopened).getByRole("button", { name: "Open the register" })).toHaveFocus(),
    );
    await userEvent.click(canvas.getByText("Risk matrix"));
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(cell).toHaveFocus());
  },
};

/** Where a register reads its question from the address. */
const riskRegister = (likelihood: string, impact: string) =>
  `#risks?likelihood=${encodeURIComponent(likelihood)}&impact=${encodeURIComponent(impact)}`;

/** Each cell that holds risks opens the register filtered to its likelihood and impact: `link` returns the link element (a router's Link in an application), and the cell becomes it, named by its place and count, so a modifier or middle click opens a new tab. Both axes are levels in words, in the order given: likelihood from Certain down, impact from Minor across. The Table toggle lays the same grid out with the same links. */
export const Links: Story = {
  render: () => (
    <Chart title="Open risks by likelihood and impact" description="Choose a cell for its risks">
      <Stack space="space.150">
        <Chart.Heatmap
          rows={[...likelihoods].reverse()}
          columns={impacts}
          value={riskCount}
          scale={riskTone}
          size="large"
          rowLabel="Likelihood"
          columnLabel="Impact"
          link={(s) => <a href={riskRegister(s.row, s.column)} />}
        />
        <Chart.Scale scale="status" steps={riskLevels} />
      </Stack>
    </Chart>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("table", { name: "Open risks by likelihood and impact" });
    // The levels keep the order given, on both axes.
    await expect(
      within(grid)
        .getAllByRole("columnheader")
        .slice(1)
        .map((h) => h.textContent),
    ).toEqual(impacts);
    await expect(
      within(grid)
        .getAllByRole("rowheader")
        .map((h) => h.textContent),
    ).toEqual([...likelihoods].reverse());
    // A cell that holds risks is a link to the filtered register, named by its place and count;
    // a zero is no link, and no cell is a button.
    const withRisks = likelihoods.flatMap((l) => impacts.filter((i) => riskCount(l, i) > 0));
    await expect(within(grid).getAllByRole("link")).toHaveLength(withRisks.length);
    await expect(within(grid).queryAllByRole("button")).toHaveLength(0);
    await expect(canvas.getByTitle("Rare, Minor: 0").closest("a")).toBeNull();
    const count = riskCount("Likely", "Critical");
    const cell = within(grid).getByRole("link", { name: `Likely, Critical: ${count}` });
    await expect(cell).toHaveAttribute("href", riskRegister("Likely", "Critical"));
    cell.focus();
    await expect(cell).toHaveFocus();
    // The table twin carries the same links, in the same order.
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    const table = await canvas.findByRole("table", {
      name: "Open risks by likelihood and impact, as a table",
    });
    await expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Likelihood", ...impacts]);
    await expect(within(table).getAllByRole("link")).toHaveLength(withRisks.length);
    await expect(
      within(table).getByRole("link", { name: `Likely, Critical: ${count}` }),
    ).toHaveAttribute("href", riskRegister("Likely", "Critical"));
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
  },
};

/** The key reads as the grid is binned. Given the Heatmap's `domain`, `Chart.Scale` prints the value at each step's edge in the Frame's format, so the reader can tell that the darkest step starts at 9.6; with `zeroStep` on both, zero has its own swatch, so none reads apart from a few. The faint steps wear the edge their cells do. `scale="status"` keys a tone function's tones in words. */
export const Keys: Story = {
  render: () => (
    <Stack space="space.300">
      <Chart.Scale scale="sequential" domain={[0, 12]} />
      <Chart.Scale scale="sequential" domain={[0, 12]} zeroStep max="12 findings" />
      <Chart.Scale scale="diverging" min="−12 days" mid="On plan" max="+12 days" />
      <Chart.Scale scale="status" steps={riskLevels} />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const edge of ["2.4", "4.8", "7.2", "9.6"])
      await expect(canvas.getAllByText(edge)).toHaveLength(2);
    await expect(canvas.getByText("12 findings")).toBeVisible();
    await expect(canvas.getByText("Very high")).toBeVisible();
    // Sequential 1 to 3, zero, and the three middle diverging steps wear the edge; the rest none.
    const edged = Array.from(
      canvasElement.querySelectorAll('[data-slot="chart-scale-step"]'),
      (step) => getComputedStyle(step).borderTopWidth === "1px",
    );
    await expect(edged.slice(0, 5)).toEqual([true, true, true, false, false]);
    await expect(edged.slice(5, 11)).toEqual([true, true, true, true, false, false]);
    await expect(edged.slice(11, 16)).toEqual([false, true, true, true, false]);
  },
};

/** In a Frame the grid takes the Frame's state: loading draws the skeleton cells at the grid's own shape, `aria-busy`, named "[the grid's name], loading". */
export const Loading: Story = {
  render: () => (
    <Chart title="Findings by family and month" state="loading">
      <Chart.Heatmap rows={families} columns={heatMonths} value={findings} />
    </Chart>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = await canvas.findByRole("table", {
      name: "Findings by family and month, loading",
    });
    await expect(grid).toHaveAttribute("aria-busy", "true");
    await expect(within(grid).getAllByRole("row")).toHaveLength(families.length + 1);
  },
};

/** A grid wider than its box scrolls sideways inside it: the row names hold still at the start, and the scroller is a named region and a tab stop, so a keyboard can scroll it. A grid that fits is neither. */
export const Narrow: Story = {
  render: () => (
    <Stack space="space.300">
      <Box data-testid="narrow" style={{ maxWidth: 280 }}>
        <Chart.Heatmap
          rows={families}
          columns={[...heatMonths, ...heatMonths.map((m) => `${m} ’27`)]}
          value={(r, c) => findings(r, c.split(" ")[0]!)}
          size="small"
          label="Findings by family, twelve months"
          rowLabel="Family"
        />
      </Box>
      <Chart.Heatmap
        rows={families.slice(0, 2)}
        columns={heatMonths.slice(0, 3)}
        value={findings}
        size="small"
        label="Findings, three months"
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = await canvas.findByRole("region", {
      name: "Findings by family, twelve months, scrolls",
    });
    await expect(region).toHaveAttribute("tabindex", "0");
    await expect(canvas.queryByRole("region", { name: /three months/ })).toBeNull();
    // Scrolled to its end, the row names are still at the start of the box, whichever way the
    // page reads: the scroll and the start are asked of the direction helpers.
    const rowName = within(region).getByRole("rowheader", { name: "AC" });
    const before = along(rowName).start;
    region.scrollLeft = towardsEnd(region, region.scrollWidth);
    await waitFor(() => expect(scrolledFromStart(region)).toBeGreaterThan(1));
    await expect(Math.round(along(rowName).start)).toBe(Math.round(before));
  },
};

/** The grid's box, its scroller, takes native props and a ref: an `id`, `data-*` for a test, a handler. `aria-describedby` describes the table. */
export const NativeAttributes: Story = {
  render: () => (
    <Stack space="space.100">
      <Chart.Heatmap
        rows={families.slice(0, 3)}
        columns={heatMonths}
        value={findings}
        size="small"
        label="Findings by family and month"
        data-testid="findings-grid"
        aria-describedby="grid-note"
        ref={(node) => node?.setAttribute("data-ref", "")}
      />
      <Text id="grid-note" size="small" color="color.text.subtle">
        Opened in the month.
      </Text>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("findings-grid");
    await expect(box).toHaveAttribute("data-ref");
    const grid = canvas.getByRole("table", { name: "Findings by family and month" });
    await expect(box).toContainElement(grid);
    await expect(grid).toHaveAccessibleDescription("Opened in the month.");
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Grid templateColumns={{ base: "1fr" }} gap="space.400">
      <Pair
        do={
          <Stack space="space.100">
            <Chart.Heatmap
              rows={families.slice(0, 4)}
              columns={heatMonths}
              value={findings}
              size="small"
              label="Findings by family and month"
            />
            <Chart.Scale scale="sequential" min="0" max="12" />
          </Stack>
        }
        doText="A count is how much: one hue, light to dark, and the key says what dark means."
        dont={
          <Chart.Heatmap
            rows={families.slice(0, 4)}
            columns={heatMonths}
            value={findings}
            scale={(v) =>
              v >= 9 ? "danger" : v >= 5 ? "warning" : v >= 2 ? "information" : "success"
            }
            size="small"
            label="Findings by family and month, as statuses"
          />
        }
        dontText="A count painted as a status. Nine findings is not 'danger' and two is not 'success'; the tones mean something on the risk matrix and stop meaning it here."
      />
      <Pair
        do={
          <Stack space="space.100">
            <Chart.Heatmap
              rows={[...likelihoods].reverse()}
              columns={impacts}
              value={riskCount}
              scale={riskTone}
              size="small"
              label="Risk matrix"
              rowLabel="Likelihood"
              columnLabel="Impact"
            />
          </Stack>
        }
        doText="The status cells print their count: the tone's text on the tone's fill, already in the contrast test."
        dont={
          <Stack space="space.100">
            <Chart.Heatmap
              rows={[...likelihoods].reverse()}
              columns={impacts}
              value={riskCount}
              scale={riskTone}
              showValues={false}
              size="small"
              label="Risk matrix, no values"
              rowLabel="Likelihood"
              columnLabel="Impact"
            />
            <Badge variant="secondary" tone="danger">
              2
            </Badge>
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
