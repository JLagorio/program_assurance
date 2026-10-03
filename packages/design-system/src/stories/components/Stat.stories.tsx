import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState, type MouseEvent } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Absent, Card, CardContent, Stat, tones } from "../../components";
import { Shell } from "../../layout";
import { LedgerProvider } from "../../lib/locale";
import { Chart } from "../../patterns";
import { Box, Grid, Stack, Text } from "../../primitives";
import { byMonth } from "../_lib/chart-data";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";
import * as typeStyle from "../_lib/type-style";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix, Specimens } = storyLayout;
const { Pair } = pairLayout;
const { typeOf, ramp } = typeStyle;

const meta = {
  title: "Components/Stat",
  component: Stat,
  parameters: { layout: "padded" },
  args: { label: "Open findings", value: 17 },
} satisfies Meta<typeof Stat>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The tiles on a grid's first row, read from layout offsets so the rise animation's transform does not move them. */
const firstRow = (grid: HTMLElement) => {
  const tiles = [...grid.children] as HTMLElement[];
  const top = tiles[0]!.offsetTop;
  return tiles.filter((tile) => Math.abs(tile.offsetTop - top) < 1);
};
/** A tile's floor in stat.css: two space.800. */
const tileMin = 128;
/** The columns a grid of `cols` shows at its own inner width: each tile keeps 128px, six and five fold to three, every count to two, one below two tiles. */
const expectedColumns = (width: number, cols: 2 | 3 | 4 | 5 | 6) => {
  const fits = (n: number) => width >= n * tileMin + (n - 1);
  if (fits(cols)) return cols;
  if (cols >= 5 && fits(3)) return 3;
  return fits(2) ? 2 : 1;
};

/** Stat and Stat.Tile in every tone and at zero; Stat.Grid as a card and as a band. */
export const StatMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={[...tones, "zero"] as const}
        cols={["Stat", "Tile"] as const}
        rowLabel="tone"
        render={(row, col) => {
          const tone = row === "zero" ? "danger" : row;
          const value = row === "zero" ? 0 : 5;
          return col === "Stat" ? (
            <Stat label="Open findings" value={value} tone={tone} />
          ) : (
            <Box style={{ width: 200, maxWidth: "100%" }}>
              <Stat.Tile
                label="Open findings"
                value={value}
                note={row === "zero" ? "Nothing waiting on you" : "1 CAT I"}
                tone={tone}
              />
            </Box>
          );
        }}
      />
      <Specimens title="Stat.Grid · card, 3 columns">
        <Box style={{ width: 600, maxWidth: "100%" }}>
          <Stat.Grid cols={3} role="group" aria-label="Card, 3 columns">
            <Stat.Tile label="Coverage" value="80%" note="298 of 372" tone="success" />
            <Stat.Tile
              label="Not satisfied"
              value={74}
              note="26 other · 40 partial"
              tone="warning"
            />
            <Stat.Tile label="Open findings" value={5} note="1 CAT I" tone="danger" />
          </Stat.Grid>
        </Box>
      </Specimens>
      <Specimens title="Stat.Grid · band, 4 columns">
        <Box style={{ width: 600, maxWidth: "100%" }}>
          <Stat.Grid cols={4} frame="band" role="group" aria-label="Band, 4 columns">
            <Stat.Tile label="Coverage" value="80%" />
            <Stat.Tile label="Not satisfied" value={74} />
            <Stat.Tile label="Open findings" value={5} />
            <Stat.Tile label="Gates" value={5} note="Next: MS-C" />
          </Stat.Grid>
        </Box>
      </Specimens>
      <Text size="xsmall" color="color.text.subtlest">
        A tone on a stat is data: the number is a status. Neutral is the default and most numbers
        stay neutral.
      </Text>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A figure is Heading's `page` size as a div, with tabular numerals, in a Stat and a tile alike.
    for (const figure of [
      canvasElement.querySelector('[data-slot="stat"]')!.firstElementChild!,
      canvasElement.querySelector('[data-slot="stat-tile"]')!.children[1]!,
    ]) {
      await expect(typeOf(figure)).toEqual({ tag: "DIV", ...ramp.page });
      await expect(getComputedStyle(figure).fontVariantNumeric).toBe("tabular-nums");
    }
    for (const [name, cols] of [
      ["Card, 3 columns", 3],
      ["Band, 4 columns", 4],
    ] as const) {
      const grid = canvas.getByRole("group", { name });
      // The specimen is 600px wide where its row has room, so its title holds on a desktop.
      const row = grid.parentElement!.parentElement!;
      await expect(Math.abs(grid.offsetWidth - Math.min(600, row.clientWidth))).toBeLessThanOrEqual(
        1,
      );
      await expect(firstRow(grid)).toHaveLength(expectedColumns(grid.clientWidth, cols));
      await expect(grid).toHaveAttribute("data-slot", "stat-grid");
      // The hairlines are the grid's background between its tiles. In forced colours, which
      // replace every background with Canvas, the grid paints them in the text colour instead.
      const tile = grid.firstElementChild as HTMLElement;
      await expect(tile).toHaveAttribute("data-slot", "stat-tile");
      const gutter = getComputedStyle(grid).backgroundColor;
      await expect(gutter).not.toBe("rgba(0, 0, 0, 0)");
      await expect(gutter).not.toBe(getComputedStyle(tile).backgroundColor);
      if (matchMedia("(forced-colors: active)").matches)
        await expect(gutter).toBe(getComputedStyle(tile).color);
    }
  },
};

export const Playground: Story = {};

/** The three frames: a card at the top of a record, a band between two sections, and bare Stats in a row of a Section. The bare row is a Grid whose columns follow its own width (as many 128px columns as fit), not the window's, like Stat.Grid. */
export const Frames: Story = {
  render: () => (
    <Stack space="space.400">
      <Stat.Grid>
        <Stat.Tile label="Controls" value={80} note="Across 6 families" />
        <Stat.Tile label="Verified" value={41} tone="success" note="51% of scope" />
        <Stat.Tile label="Overdue" value={3} tone="danger" note="Oldest 12 days" />
        <Stat.Tile label="Blocked" value={0} note="Nothing waiting on you" />
      </Stat.Grid>
      <Stat.Grid cols={3} frame="band">
        <Stat.Tile label="Evidence items" value={214} />
        <Stat.Tile label="Expiring" value={9} tone="warning" />
        <Stat.Tile label="Assessors" value={5} />
      </Stat.Grid>
      <Grid
        columnGap="space.400"
        templateColumns="repeat(auto-fit, minmax(min(100%, 8rem), 1fr))"
        role="group"
        aria-label="Summary row"
      >
        <Stat label="Objectives in scope" value={124} />
        <Stat label="With a procedure" value={118} tone="warning" />
        <Stat label="Objectives run" value={97} />
        <Stat label="Steps with no artifact" value={0} />
      </Grid>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvasElement.querySelector<HTMLElement>('[data-slot="stat-grid"]')!;
    await expect(grid).toHaveClass("stat-grid", "stat-grid-4", "border-default");
    // A zero reads muted.
    const blocked = within(grid)
      .getByText("Blocked")
      .closest<HTMLElement>('[data-slot="stat-tile"]')!;
    await expect(within(blocked).getByText("0")).toHaveClass("text-subtlest");
    // The bare row takes its columns from its own width: four across when each has 8rem.
    const row = canvas.getByRole("group", { name: "Summary row" });
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const across = Math.max(1, Math.min(4, Math.floor((row.clientWidth + 32) / (8 * rem + 32))));
    const tops = [...row.children].map((child) => (child as HTMLElement).offsetTop);
    await expect(tops.filter((top) => top === tops[0])).toHaveLength(across);
  },
};

const statRef = createRef<HTMLDivElement>();
const tileRef = createRef<HTMLDivElement>();
const gridRef = createRef<HTMLDivElement>();
const inspectStat = fn();

/** A ref, native props, a class and a style reach Stat.Grid, Stat.Tile and a bare Stat, each named last with `data-slot`. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Stat.Grid
        ref={gridRef}
        id="record-metrics"
        role="group"
        aria-label="Record metrics"
        data-columns="four"
        style={{ maxWidth: 960, backgroundColor: "transparent" }}
      >
        <Stat.Tile label="Controls" value={80} note="Across 6 families" />
        <Stat.Tile label="Verified" value={41} tone="success" note="51% of scope" />
        <Stat.Tile label="Overdue" value={3} tone="danger" note="Oldest 12 days" />
        <Stat.Tile
          ref={tileRef}
          id="blocked-metric"
          role="group"
          aria-label="Blocked metric"
          className="py-200"
          style={{ minWidth: 0 }}
          label="Blocked"
          value={0}
          note="Nothing waiting on you"
        />
      </Stat.Grid>
      <Stat
        ref={statRef}
        id="scope-metric"
        role="group"
        aria-label="Scope metric"
        data-metric="scope"
        className="py-150"
        style={{ minWidth: 0 }}
        onMouseEnter={inspectStat}
        label="Objectives in scope"
        value={124}
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    inspectStat.mockClear();
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("group", { name: "Record metrics" });
    const tile = canvas.getByRole("group", { name: "Blocked metric" });
    const stat = canvas.getByRole("group", { name: "Scope metric" });
    await expect(gridRef.current).toBe(grid);
    await expect(tileRef.current).toBe(tile);
    await expect(statRef.current).toBe(stat);
    await expect(grid).toHaveAttribute("id", "record-metrics");
    await expect(grid).toHaveAttribute("data-columns", "four");
    await expect(grid).toHaveStyle({ maxWidth: "960px" });
    await expect(grid.style.backgroundColor).toBe("transparent");
    await expect(getComputedStyle(grid).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(grid).toHaveClass("stat-grid", "stat-grid-4", "border-default");
    await expect(tile).toHaveAttribute("id", "blocked-metric");
    await expect(tile).toHaveClass("py-200", "bg-surface-current");
    await expect(tile).not.toHaveClass("py-150");
    await expect(tile).toHaveStyle({ minWidth: "0px" });
    await expect(within(tile).getByText("0")).toHaveClass("text-subtlest");
    await expect(tile).toHaveTextContent("Nothing waiting on you");
    await expect(stat).toHaveAttribute("id", "scope-metric");
    await expect(stat).toHaveAttribute("data-metric", "scope");
    await expect(stat).toHaveClass("py-150");
    await expect(stat).not.toHaveClass("py-100");
    await expect(stat).toHaveStyle({ minWidth: "0px" });
    await expect(stat).toHaveAttribute("data-slot", "stat");
    await expect(grid).toHaveAttribute("data-slot", "stat-grid");
    await expect(tile).toHaveAttribute("data-slot", "stat-tile");
    await userEvent.hover(stat);
    await expect(inspectStat).toHaveBeenCalledTimes(1);
  },
};

/** Six tiles: six across when the grid has room, three when it has half, two in a panel. The grid follows its own width, so resize the canvas or put it in a panel. */
export const SixAcross: Story = {
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>(".stat-grid")!;
    await expect(firstRow(grid)).toHaveLength(expectedColumns(grid.clientWidth, 6));
  },
  render: () => (
    <Stat.Grid cols={6}>
      <Stat.Tile label="Native records" value={412} note="read from the delivered file" />
      <Stat.Tile label="Normalized" value={412} note="mapped to the common record" />
      <Stat.Tile label="Clean" value={380} note="kept as coverage evidence" />
      <Stat.Tile label="Folded in" value={18} note="another source already reported" />
      <Stat.Tile
        label="Held for analyst"
        value={9}
        note="the normalizer would not guess"
        tone="warning"
      />
      <Stat.Tile label="Proposed" value={5} note="no finding in the register" tone="warning" />
    </Stat.Grid>
  ),
};

/** The grids in a panel's body on a wide screen: a 320px panel with its edge and `Shell.Panel.Body`'s space.200 padding, which leaves 287px. Four, six and three tiles sit two across, each at least 128px, and no note breaks a word a line. The window is wide; the grid follows the panel. */
export const InANarrowPanel: Story = {
  render: () => (
    <section
      aria-label="Narrow panel"
      className="border-s border-default"
      style={{ maxWidth: 320 }}
    >
      <Shell.Panel.Body>
        <Stack space="space.300">
          <Stat.Grid cols={4} aria-label="Four tiles in a panel" role="group">
            <Stat.Tile label="Controls" value={80} note="Across 6 families" />
            <Stat.Tile label="Verified" value={41} tone="success" note="51% of scope" />
            <Stat.Tile label="Overdue" value={3} tone="danger" note="Oldest 12 days" />
            <Stat.Tile label="Blocked" value={0} note="Nothing waiting on you" />
          </Stat.Grid>
          <Stat.Grid cols={6} frame="band" aria-label="Six tiles in a panel" role="group">
            <Stat.Tile label="Native records" value={412} />
            <Stat.Tile label="Normalized" value={412} />
            <Stat.Tile label="Clean" value={380} />
            <Stat.Tile label="Folded in" value={18} />
            <Stat.Tile label="Held for analyst" value={9} tone="warning" />
            <Stat.Tile label="Proposed" value={5} tone="warning" />
          </Stat.Grid>
          <Stat.Grid cols={3} aria-label="Three tiles in a panel" role="group">
            <Stat.Tile label="Coverage" value="80%" note="298 of 372" tone="success" />
            <Stat.Tile label="Not satisfied" value={74} note="26 other · 40 partial" />
            <Stat.Tile label="Open findings" value={5} note="1 CAT I" tone="danger" />
          </Stat.Grid>
        </Stack>
      </Shell.Panel.Body>
    </section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
    for (const [name, cols] of [
      ["Four tiles in a panel", 4],
      ["Six tiles in a panel", 6],
      ["Three tiles in a panel", 3],
    ] as const) {
      const grid = canvas.getByRole("group", { name });
      const row = firstRow(grid);
      // Two across in the panel's body, as on a 320px phone, never a pile of one column.
      await expect(row).toHaveLength(2);
      await expect(row).toHaveLength(expectedColumns(grid.clientWidth, cols));
      // The rise animation moves tiles only vertically, so their horizontal bounds are final.
      const bounds = grid.getBoundingClientRect();
      for (const tile of [...grid.children] as HTMLElement[]) {
        const box = tile.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(tileMin - 0.5);
        await expect(box.right).toBeLessThanOrEqual(bounds.right + 0.5);
      }
    }
    // A short last row shares its width, so no gutter paint shows as an empty cell.
    const three = canvas.getByRole("group", { name: "Three tiles in a panel" });
    const last = three.lastElementChild as HTMLElement;
    await expect(Math.abs(last.offsetWidth - three.clientWidth)).toBeLessThanOrEqual(1);
  },
};

/** A grid whose parent sizes it to its content (an items-start Stack, an Inline, a popover) is as wide as all its tiles side by side, up to the room it has. Four short tiles ask for 128px each, so they measure four columns and stay across. Six tiles in three columns would be six tiles wide with each tile doubled, so that grid is given the row's width (`w-full`). */
export const SizedToItsContent: Story = {
  render: () => (
    <Stack space="space.300" alignInline="start">
      <Stat.Grid cols={4} role="group" aria-label="Four short tiles">
        <Stat.Tile label="Controls" value={80} />
        <Stat.Tile label="Verified" value={41} tone="success" />
        <Stat.Tile label="Overdue" value={3} tone="danger" />
        <Stat.Tile label="Blocked" value={0} />
      </Stat.Grid>
      <Stat.Grid cols={3} className="w-full" role="group" aria-label="Six tiles given the row">
        <Stat.Tile label="Native records" value={412} />
        <Stat.Tile label="Normalized" value={412} />
        <Stat.Tile label="Clean" value={380} />
        <Stat.Tile label="Folded in" value={18} />
        <Stat.Tile label="Held for analyst" value={9} tone="warning" />
        <Stat.Tile label="Proposed" value={5} tone="warning" />
      </Stat.Grid>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const four = canvas.getByRole("group", { name: "Four short tiles" });
    const room = four.parentElement!.clientWidth;
    const across = 4 * tileMin + 3;
    // As wide as its four tiles side by side, or as the space it is given when that is less.
    await expect(four.clientWidth).toBeGreaterThanOrEqual(Math.min(across, room - 2) - 0.5);
    await expect(firstRow(four)).toHaveLength(expectedColumns(four.clientWidth, 4));
    if (room >= across + 2) await expect(firstRow(four)).toHaveLength(4);
    // Given the row, six tiles take it and fold by its width: three across and two rows on a desktop.
    const six = canvas.getByRole("group", { name: "Six tiles given the row" });
    await expect(Math.abs(six.offsetWidth - room)).toBeLessThanOrEqual(1);
    await expect(firstRow(six)).toHaveLength(expectedColumns(six.clientWidth, 3));
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stat.Grid cols={3}>
            <Stat.Tile label="Controls" value={80} note="Across 6 families" />
            <Stat.Tile label="Verified" value={41} note="51% of scope" />
            <Stat.Tile label="Overdue" value={3} tone="danger" note="Oldest 12 days" />
          </Stat.Grid>
        }
        doText="One number carries a tone, because one number is a status."
        dont={
          <Stat.Grid cols={3}>
            <Stat.Tile label="Controls" value={80} tone="information" note="Across 6 families" />
            <Stat.Tile label="Verified" value={41} tone="success" note="51% of scope" />
            <Stat.Tile label="Overdue" value={3} tone="danger" note="Oldest 12 days" />
          </Stat.Grid>
        }
        dontText="Every tile toned. The overdue count no longer stands out from the count of controls."
      />
      <Pair
        do={
          <Stat.Grid cols={2}>
            <Stat.Tile label="Blocked" value={0} note="Nothing waiting on you" />
            <Stat.Tile label="Overdue" value={0} note="Every gate closed on time" />
          </Stat.Grid>
        }
        doText="Zero reads muted, and the note says what the zero means."
        dont={
          <Stat.Grid cols={2}>
            <Stat.Tile label="Blocked" value={0} tone="success" />
            <Stat.Tile label="Overdue" value="None" tone="success" />
          </Stat.Grid>
        }
        dontText="Zero in success green, or a word in place of the number. Nothing is not a success; it is nothing."
      />
      <Pair
        do={
          <Stat.Grid cols={2}>
            <Stat.Tile label="Re-tests owed" value={37} note="12 inspection · 25 test" />
            <Stat.Tile label="With a procedure" value={9} note="28 done by hand" />
          </Stat.Grid>
        }
        doText="The label is a noun, the note one line under the number."
        dont={
          <Stat.Grid cols={2}>
            <Stat.Tile
              label="There are re-tests owed across the requirement rows that moved"
              value="37 re-tests"
              note="Of these, 12 are by inspection and 25 are by test, and 9 have a procedure written against them while 28 are done by hand."
            />
            <Stat.Tile label="Procedure" value="Yes, 9" />
          </Stat.Grid>
        }
        dontText="A sentence for a label, a phrase for a value, a paragraph for a note. The number is the point; nothing else fits in a tile."
      />
    </Stack>
  ),
};

/** A count that opens the register it counts: `link` fills the tile with the link, so the whole tile is one target, the tile stays the grid's child, and the focus ring is drawn inside its edge where the card frame cannot clip it. The link's name is the label, the number and the note. */
export const Linked: Story = {
  render: function Example() {
    const [opened, setOpened] = useState("Nothing opened");
    const open = (name: string) => (event: MouseEvent) => {
      event.preventDefault();
      setOpened(`Opened ${name}`);
    };
    return (
      <Stack space="space.200" className="max-w-layout-measure">
        <Stat.Grid cols={3} role="group" aria-label="Open work">
          <Stat.Tile
            label="Open tasks"
            value={12}
            note="3 due this week"
            link={<a href="#tasks" onClick={open("tasks")} />}
          />
          <Stat.Tile
            label="Open issues"
            value={4}
            tone="danger"
            note="Oldest 12 days"
            link={<a href="#issues" onClick={open("issues")} />}
          />
          <Stat.Tile
            label="Open risks"
            value={0}
            note="Nothing open"
            link={<a href="#risks" onClick={open("risks")} />}
          />
        </Stat.Grid>
        <Text role="status">{opened}</Text>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Open tasks 12 3 due this week" });
    const tile = link.parentElement!;
    await expect(tile).toHaveAttribute("data-slot", "stat-tile");
    await expect(link).toHaveAttribute("data-slot", "stat-link");
    await expect(link).toHaveAttribute("href", "#tasks");
    // The link fills its tile, so there is no band of gutter colour under it, and the tile is
    // still the grid's child.
    await expect(tile.parentElement).toHaveAttribute("data-slot", "stat-grid");
    const outer = tile.getBoundingClientRect();
    const inner = link.getBoundingClientRect();
    await expect(Math.abs(outer.height - inner.height)).toBeLessThanOrEqual(1);
    await expect(Math.abs(outer.width - inner.width)).toBeLessThanOrEqual(1);
    // A zero stays muted inside a link.
    await expect(
      within(canvas.getByRole("link", { name: /^Open risks/ })).getByText("0"),
    ).toHaveClass("text-subtlest");
    // The keyboard reaches each tile in turn; the ring is drawn inside the tile's edge.
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(parseFloat(getComputedStyle(link).outlineOffset)).toBeLessThan(0);
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Opened tasks");
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: /^Open issues/ })).toHaveFocus();
    // A click anywhere on the tile, its note included, opens it.
    await userEvent.click(
      within(canvas.getByRole("link", { name: /^Open risks/ })).getByText("Nothing open"),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent("Opened risks");
  },
};

/** While the number loads, a Skeleton holds its place and the tile is `aria-busy`; the label stays. A number that could not load is an Absent with its reason, and the note says what happened. Neither is a word in the number's place. */
export const LoadingAndUnavailable: Story = {
  name: "Loading and unavailable",
  render: () => (
    <Box style={{ width: 600, maxWidth: "100%" }}>
      <Stat.Grid cols={3} role="group" aria-label="Portfolio totals">
        <Stat.Tile label="Programs" value={14} note="2 in authorization" />
        <Stat.Tile label="Open risks" value={undefined} isLoading />
        <Stat.Tile
          label="Open findings"
          value={<Absent label="Not available" />}
          note="Could not load"
        />
      </Stat.Grid>
      <Stack space="space.100" className="pt-200">
        <Stat label="Objectives run" value={undefined} isLoading />
      </Stack>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("group", { name: "Portfolio totals" });
    const loading = grid.children[1] as HTMLElement;
    const unavailable = grid.children[2] as HTMLElement;
    await expect(loading).toHaveAttribute("aria-busy", "true");
    await expect(loading).toHaveTextContent("Open risks");
    await expect(loading.querySelector('[data-slot="skeleton"]')).not.toBeNull();
    // The placeholder is hidden; a screen reader hears the label, then "Loading".
    await expect(within(loading).getByText("Loading")).toHaveClass("sr-only");
    await expect(unavailable).not.toHaveAttribute("aria-busy");
    await expect(unavailable).toHaveTextContent("Not available");
    await expect(unavailable).toHaveTextContent("Could not load");
    // The skeleton sits where the number goes: the loading tile is no taller than a loaded one.
    await expect(loading.offsetHeight).toBeLessThanOrEqual(unavailable.offsetHeight + 1);
    // It sits in the number's line, so the line keeps the number's height and nothing below it
    // moves when the number arrives.
    const numberLine = (tile: Element) => tile.children[1]!.getBoundingClientRect().height;
    await expect(Math.abs(numberLine(loading) - numberLine(grid.children[0]!))).toBeLessThan(1);
    const bare = canvasElement.querySelector<HTMLElement>('[data-slot="stat"]')!;
    await expect(bare).toHaveAttribute("aria-busy", "true");
    await expect(bare).toHaveTextContent("Objectives run");
  },
};

/** A number is written in the reader's locale from the LedgerProvider (en-US when there is none, never the machine's), so 1234 reads 1,234 here and 1.234 in de-DE. A string, such as "80%", shows as given. */
export const NumbersInTheReadersLocale: Story = {
  name: "Numbers in the reader's locale",
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Stat.Grid cols={3} role="group" aria-label="en-US">
        <Stat.Tile label="Controls" value={1234} />
        <Stat.Tile label="Coverage" value="80%" />
        <Stat.Tile label="Open findings" value={0} />
      </Stat.Grid>
      <LedgerProvider locale="de-DE">
        <Stat.Grid cols={3} role="group" aria-label="de-DE">
          <Stat.Tile label="Maßnahmen" value={1234} />
          <Stat.Tile label="Abdeckung" value="80 %" />
          <Stat.Tile label="Offene Befunde" value={0} />
        </Stat.Grid>
      </LedgerProvider>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const us = within(canvas.getByRole("group", { name: "en-US" }));
    await expect(us.getByText("1,234")).toBeInTheDocument();
    await expect(us.getByText("80%")).toBeInTheDocument();
    await expect(us.getByText("0")).toHaveClass("text-subtlest");
    const de = within(canvas.getByRole("group", { name: "de-DE" }));
    await expect(de.getByText("1.234")).toBeInTheDocument();
    await expect(de.getByText("0")).toHaveClass("text-subtlest");
  },
};

/** A trend beside the number: `trend` takes a Chart.Sparkline of the same count over time, `space.150` from it. The number stays the value, so it formats in the locale and a zero still reads muted; the note says what the line shows. */
export const WithATrend: Story = {
  name: "With a trend",
  render: () => (
    <Box style={{ maxWidth: 720 }}>
      <Stat.Grid cols={3} role="group" aria-label="Findings over the year">
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
          label="Overdue"
          value={0}
          trend={<Chart.Sparkline data={byMonth} y="plan" tone="neutral" appearance="area" />}
          note="None since June"
        />
      </Stat.Grid>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const grid = canvas.getByRole("group", { name: "Findings over the year" });
    const tiles = [...grid.children] as HTMLElement[];
    for (const tile of tiles)
      await expect(tile.querySelector('[data-slot="stat-trend"]')).not.toBeNull();
    // The value is the number alone, so zero is still muted beside its line.
    await expect(within(tiles[2]!).getByText("0")).toHaveClass("text-subtlest");
    await waitFor(() => expect(tiles[0]!.querySelector("svg")).not.toBeNull());
  },
};

/** A tile paints the surface it sits on (`utility.elevation.surface.current`), so a grid on a card is the card's colour and one in a dialog the dialog's, in both modes, never the page's. */
export const OnACard: Story = {
  name: "On a card",
  render: () => (
    <Card data-testid="card" style={{ maxWidth: 480 }}>
      <CardContent>
        <Stat.Grid cols={2}>
          <Stat.Tile label="Open risks" value={12} note="3 high or critical" />
          <Stat.Tile label="Overdue tasks" value={0} />
        </Stat.Grid>
      </CardContent>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const card = within(canvasElement).getByTestId("card");
    const surface = getComputedStyle(card).backgroundColor;
    for (const tile of card.querySelectorAll<HTMLElement>('[data-slot="stat-tile"]'))
      await expect(getComputedStyle(tile).backgroundColor).toBe(surface);
  },
};
