import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Stat, tones } from "../../components";
import { Box, Grid, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Stat",
  component: Stat,
  parameters: { layout: "padded" },
  args: { label: "Open findings", value: 17 },
} satisfies Meta<typeof Stat>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Stat and Stat.Tile in every tone and at zero; Stat.Grid as a card and as a band. */
export const StatMatrix: Story = {
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
            <Box style={{ width: 200 }}>
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
        <Box style={{ width: 600 }}>
          <Stat.Grid cols={3}>
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
        <Box style={{ width: 600 }}>
          <Stat.Grid cols={4} frame="band">
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
};

/** The three frames: a card at the top of a record, a band between two sections, and bare Stats in a row of a Section. */
const statRef = createRef<HTMLDivElement>();
const tileRef = createRef<HTMLDivElement>();
const gridRef = createRef<HTMLDivElement>();
const inspectStat = fn();

export const Frames: Story = {
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
      <Stat.Grid cols={3} frame="band">
        <Stat.Tile label="Evidence items" value={214} />
        <Stat.Tile label="Expiring" value={9} tone="warning" />
        <Stat.Tile label="Assessors" value={5} />
      </Stat.Grid>
      <Grid
        columnGap="space.400"
        templateColumns={{ base: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }}
      >
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
        <Stat label="With a procedure" value={118} tone="warning" />
        <Stat label="Objectives run" value={97} />
        <Stat label="Steps with no artifact" value={0} />
      </Grid>
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
    await expect(grid).toHaveClass("grid", "sm:grid-cols-4", "border-default");
    await expect(tile).toHaveAttribute("id", "blocked-metric");
    await expect(tile).toHaveClass("py-200", "bg-surface");
    await expect(tile).not.toHaveClass("py-150");
    await expect(tile).toHaveStyle({ minWidth: "0px" });
    await expect(within(tile).getByText("0")).toHaveClass("text-subtlest");
    await expect(tile).toHaveTextContent("Nothing waiting on you");
    await expect(stat).toHaveAttribute("id", "scope-metric");
    await expect(stat).toHaveAttribute("data-metric", "scope");
    await expect(stat).toHaveClass("py-150");
    await expect(stat).not.toHaveClass("py-100");
    await expect(stat).toHaveStyle({ minWidth: "0px" });
    await userEvent.hover(stat);
    await expect(inspectStat).toHaveBeenCalledTimes(1);
  },
};

/** Six tiles: three across on a small screen, six from the large breakpoint. Resize the canvas. */
export const SixAcross: Story = {
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

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
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

export const Playground: Story = {};
