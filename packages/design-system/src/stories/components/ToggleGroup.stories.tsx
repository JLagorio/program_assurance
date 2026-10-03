import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, Underline } from "lucide-react";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  Count,
  Scroller,
  ScrollerArrow,
  ScrollerViewport,
  ToggleGroup,
  ToggleGroupItem,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix, Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/ToggleGroup",
  component: ToggleGroup,
  parameters: { layout: "padded" },
  args: { "aria-label": "Text alignment", defaultValue: ["left"] },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  ),
} satisfies Meta<typeof ToggleGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

/** How many lines a group's items sit on. */
const lines = (group: HTMLElement) =>
  new Set(
    within(group)
      .getAllByRole("button")
      .map((item) => Math.round(item.getBoundingClientRect().top)),
  ).size;

/** Variants, inherited sizes, default spacing and connected items. */
export const ToggleGroupMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["default", "outline"] as const}
        cols={["small", "medium", "large"] as const}
        render={(variant, size) => (
          <ToggleGroup
            aria-label={`${variant} ${size} view`}
            variant={variant}
            size={size}
            defaultValue={["table"]}
          >
            <ToggleGroupItem value="table">Table</ToggleGroupItem>
            <ToggleGroupItem value="board">Board</ToggleGroupItem>
            <ToggleGroupItem value="calendar" disabled>
              Calendar
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      />
      <Specimens title="Connected items and an unavailable group">
        <ToggleGroup
          aria-label="Connected alignment"
          variant="outline"
          spacing={0}
          defaultValue={["left"]}
        >
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup aria-label="Unavailable alignment" disabled defaultValue={["left"]}>
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const variant of ["default", "outline"]) {
      for (const [size, height] of [
        ["small", 28],
        ["medium", 32],
        ["large", 36],
      ] as const) {
        const group = canvas.getByRole("group", { name: `${variant} ${size} view` });
        await expect(group).toHaveAttribute("data-slot", "toggle-group");
        await expect(group).toHaveAttribute("data-size", size);
        await expect(getComputedStyle(group).columnGap).toBe("8px");
        // In a table cell the group keeps one line at every width; the Matrix scrolls instead.
        await expect(getComputedStyle(group).flexWrap).toBe("nowrap");
        await expect(lines(group)).toBe(1);
        const items = within(group);
        const table = items.getByRole("button", { name: "Table" });
        const board = items.getByRole("button", { name: "Board" });
        await expect(table).toHaveAttribute("data-slot", "toggle-group-item");
        await expect(table).toHaveAttribute("data-size", size);
        await expect(table.getBoundingClientRect().height).toBe(height);
        await expect(table).toHaveAttribute("aria-pressed", "true");
        await userEvent.click(table);
        await expect(table).toHaveAttribute("aria-pressed", "false");
        await userEvent.click(board);
        await expect(board).toHaveAttribute("aria-pressed", "true");
        await expect(table).toHaveAttribute("aria-pressed", "false");
        await expect(items.getByRole("button", { name: "Calendar" })).toBeDisabled();
      }
    }
    const connected = canvas.getByRole("group", { name: "Connected alignment" });
    await expect(getComputedStyle(connected).columnGap).toBe("0px");
    await expect(getComputedStyle(connected).flexWrap).toBe("nowrap");
    const [first, middle, last] = within(connected).getAllByRole("button");
    await expect(first!.getBoundingClientRect().right).toBe(middle!.getBoundingClientRect().left);
    await expect(middle!.getBoundingClientRect().right).toBe(last!.getBoundingClientRect().left);
    await expect(getComputedStyle(middle!).borderTopLeftRadius).toBe("0px");
    for (const item of within(
      canvas.getByRole("group", { name: "Unavailable alignment" }),
    ).getAllByRole("button")) {
      await expect(item).toBeDisabled();
    }
  },
};

const groupRef = createRef<HTMLDivElement>();
const itemRef = createRef<HTMLButtonElement>();

function Selection() {
  const [view, setView] = useState(["table"]);
  return (
    <Stack space="space.300">
      <Specimens title="A required view: cancel an empty selection">
        <ToggleGroup
          ref={groupRef}
          id="required-view"
          aria-label="Required view"
          value={view}
          onValueChange={(values, details) => {
            if (values.length) setView(values);
            else details.cancel();
          }}
        >
          <ToggleGroupItem ref={itemRef} value="table">
            Table
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" disabled>
            Calendar
          </ToggleGroupItem>
          <ToggleGroupItem value="board">Board</ToggleGroupItem>
        </ToggleGroup>
        <Text>Current view: {view[0]}</Text>
      </Specimens>
      <Specimens title="Multiple formatting choices, including no selection">
        <ToggleGroup aria-label="Text formatting" multiple defaultValue={["bold"]}>
          <ToggleGroupItem value="bold" aria-label="Bold">
            <Bold aria-hidden />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <Italic aria-hidden />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            <Underline aria-hidden />
          </ToggleGroupItem>
        </ToggleGroup>
      </Specimens>
      <Specimens title="Vertical keyboard navigation without wrapping">
        <ToggleGroup
          aria-label="Vertical alignment"
          orientation="vertical"
          loopFocus={false}
          defaultValue={["top"]}
        >
          <ToggleGroupItem value="top">Top</ToggleGroupItem>
          <ToggleGroupItem value="middle" disabled>
            Middle
          </ToggleGroupItem>
          <ToggleGroupItem value="bottom">Bottom</ToggleGroupItem>
        </ToggleGroup>
      </Specimens>
      <LedgerProvider direction="rtl">
        <Specimens title="Direction follows the locale; a group can override it">
          <ToggleGroup aria-label="RTL view">
            <ToggleGroupItem value="table">Table</ToggleGroupItem>
            <ToggleGroupItem value="board">Board</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup aria-label="LTR view" dir="ltr">
            <ToggleGroupItem value="table">Table</ToggleGroupItem>
            <ToggleGroupItem value="board">Board</ToggleGroupItem>
          </ToggleGroup>
        </Specimens>
      </LedgerProvider>
    </Stack>
  );
}

export const Playground: Story = {};

/** Selection, cancellation, native refs and orientation-aware roving focus. */
export const ViewsStory: Story = {
  tags: ["!manifest"],
  name: "Selection and keyboard",
  render: () => <Selection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const required = canvas.getByRole("group", { name: "Required view" });
    const view = within(required);
    const table = view.getByRole("button", { name: "Table" });
    const board = view.getByRole("button", { name: "Board" });
    await expect(groupRef.current).toBe(required);
    await expect(itemRef.current).toBe(table);
    await expect(required).toHaveAttribute("id", "required-view");
    await userEvent.click(table);
    await expect(table).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{ArrowRight}");
    await expect(board).toHaveFocus();
    await expect(table).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Enter}");
    await expect(board).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.getByText("Current view: board")).toBeVisible();
    await userEvent.keyboard("{ArrowRight}");
    await expect(table).toHaveFocus();
    const formatting = within(canvas.getByRole("group", { name: "Text formatting" }));
    const bold = formatting.getByRole("button", { name: "Bold" });
    const italic = formatting.getByRole("button", { name: "Italic" });
    await userEvent.click(italic);
    await expect(bold).toHaveAttribute("aria-pressed", "true");
    await expect(italic).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(bold);
    await userEvent.click(italic);
    for (const item of formatting.getAllByRole("button"))
      await expect(item).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(italic).toHaveAttribute("aria-pressed", "true");
    const vertical = within(canvas.getByRole("group", { name: "Vertical alignment" }));
    const top = vertical.getByRole("button", { name: "Top" });
    const bottom = vertical.getByRole("button", { name: "Bottom" });
    top.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(bottom).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(bottom).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(top).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(bottom).toHaveFocus();
    for (const [name, key] of [
      ["RTL view", "ArrowLeft"],
      ["LTR view", "ArrowRight"],
    ] as const) {
      const group = within(canvas.getByRole("group", { name }));
      const first = group.getByRole("button", { name: "Table" });
      const second = group.getByRole("button", { name: "Board" });
      first.focus();
      await userEvent.keyboard(`{${key}}`);
      await expect(second).toHaveFocus();
      await userEvent.keyboard(`{${key}}`);
      await expect(first).toHaveFocus();
    }
  },
};

const severities = [
  ["all", "All", 24],
  ["high", "High", 6],
  ["medium", "Medium", 11],
  ["low", "Low", 7],
] as const;

function Severity({ label }: { label: string }) {
  return (
    <ToggleGroup aria-label={label} defaultValue={["high"]}>
      {severities.map(([value, name, count]) => (
        <ToggleGroupItem key={value} value={value}>
          {name} <Count value={count} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** A spaced group in a row narrower than its items wraps them onto the next line, every choice in view and in reach. A joined group, a group in a table cell and a group in a horizontal Scroller (a saved-views strip) keep one line; the Scroller scrolls it, so a joined group that must fit a narrower row goes in one. */
export const NarrowRow: Story = {
  tags: ["!manifest"],
  name: "Narrow row",
  render: () => (
    <Stack space="space.300">
      <Specimens title="In a 240px row: wraps">
        <div data-testid="wrapping-row" style={{ maxWidth: 240 }}>
          <Severity label="Severity" />
        </div>
      </Specimens>
      <Specimens title="In a horizontal Scroller: one line that scrolls">
        <div style={{ maxWidth: 240, width: "100%" }}>
          <Scroller orientation="horizontal">
            <ScrollerViewport>
              <Severity label="Severity strip" />
            </ScrollerViewport>
            <ScrollerArrow edge="start" />
            <ScrollerArrow edge="end" />
          </Scroller>
        </div>
      </Specimens>
      <Specimens title="Joined, in a 120px row: one control, in a Scroller">
        <div style={{ maxWidth: 120, width: "100%" }}>
          <Scroller orientation="horizontal">
            <ScrollerViewport>
              <ToggleGroup
                aria-label="Joined alignment"
                variant="outline"
                spacing={0}
                defaultValue={["left"]}
              >
                <ToggleGroupItem value="left">Left</ToggleGroupItem>
                <ToggleGroupItem value="center">Center</ToggleGroupItem>
                <ToggleGroupItem value="right">Right</ToggleGroupItem>
              </ToggleGroup>
            </ScrollerViewport>
            <ScrollerArrow edge="start" />
            <ScrollerArrow edge="end" />
          </Scroller>
        </div>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByTestId("wrapping-row").getBoundingClientRect();
    const wrapping = canvas.getByRole("group", { name: "Severity" });
    for (const item of within(wrapping).getAllByRole("button")) {
      await expect(item.getBoundingClientRect().right).toBeLessThanOrEqual(row.right + 1);
    }
    await expect(lines(wrapping)).toBeGreaterThan(1);
    const strip = canvas.getByRole("group", { name: "Severity strip" });
    const items = within(strip).getAllByRole("button");
    await expect(lines(strip)).toBe(1);
    const viewport = strip.closest<HTMLElement>('[data-slot="scroller-viewport"]')!;
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    // The pressed choice is in view, and the last one is a scroll away.
    const pressed = within(strip).getByRole("button", { name: /High/ });
    await expect(pressed.getBoundingClientRect().right).toBeLessThanOrEqual(
      viewport.getBoundingClientRect().right + 1,
    );
    items.at(-1)!.focus();
    await waitFor(() =>
      expect(items.at(-1)!.getBoundingClientRect().right).toBeLessThanOrEqual(
        viewport.getBoundingClientRect().right + 1,
      ),
    );
    // A joined group never wraps: its items stay edge to edge on one line, and the Scroller
    // around it scrolls.
    const joined = canvas.getByRole("group", { name: "Joined alignment" });
    const [left, center, right] = within(joined).getAllByRole("button");
    await expect(lines(joined)).toBe(1);
    await expect(left!.getBoundingClientRect().right).toBe(center!.getBoundingClientRect().left);
    await expect(center!.getBoundingClientRect().right).toBe(right!.getBoundingClientRect().left);
    const joinedViewport = joined.closest<HTMLElement>('[data-slot="scroller-viewport"]')!;
    await expect(joinedViewport.scrollWidth).toBeGreaterThan(joinedViewport.clientWidth);
  },
};

function PressedStop() {
  const [period, setPeriod] = useState(["quarter"]);
  return (
    <Stack space="space.200">
      <button type="button">Before</button>
      <ToggleGroup aria-label="Period" value={period} onValueChange={setPeriod}>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
        <ToggleGroupItem value="quarter">Quarter</ToggleGroupItem>
        <ToggleGroupItem value="year">Year</ToggleGroupItem>
      </ToggleGroup>
      <button type="button" onClick={() => setPeriod(["year"])}>
        Show the year
      </button>
      <ToggleGroup aria-label="Filters" multiple defaultValue={["open"]}>
        <ToggleGroupItem value="mine">Mine</ToggleGroupItem>
        <ToggleGroupItem value="open">Open</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup aria-label="Unavailable pressed" defaultValue={["b"]}>
        <ToggleGroupItem value="a">First</ToggleGroupItem>
        <ToggleGroupItem value="b" disabled>
          Second
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup aria-label="View" defaultValue={["board"]}>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="board">Board</ToggleGroupItem>
      </ToggleGroup>
    </Stack>
  );
}

/**
 * A single-select group is a set of choices, like a radio group: Tab lands on the pressed item, not
 * the first, so the reader starts on the current choice and Space on it changes nothing by
 * surprise. Arrow keys still reach every item, Tab from any of them leaves the group, and a value
 * changed from outside moves the stop, as does a choice in an uncontrolled group (View). A
 * `multiple` group keeps Base UI's first-item stop, and a
 * pressed item that is disabled leaves the stop on the first enabled one.
 */
export const TabStopOnThePressedItem: Story = {
  name: "Tab stop on the pressed item",
  render: () => <PressedStop />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const period = within(canvas.getByRole("group", { name: "Period" }));
    const before = canvas.getByRole("button", { name: "Before" });
    const after = canvas.getByRole("button", { name: "Show the year" });
    before.focus();
    await userEvent.tab();
    await expect(period.getByRole("button", { name: "Quarter" })).toHaveFocus();
    // Arrows move to every item; Tab from one that is not pressed leaves the group.
    await userEvent.keyboard("{ArrowLeft}");
    await expect(period.getByRole("button", { name: "Month" })).toHaveFocus();
    await userEvent.tab();
    await expect(after).toHaveFocus();
    // Coming back lands on the pressed item again, from either side.
    await userEvent.tab({ shift: true });
    await expect(period.getByRole("button", { name: "Quarter" })).toHaveFocus();
    await expect(period.getByRole("button", { name: "Quarter" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // A change made outside the group moves the stop with the value.
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await expect(period.getByRole("button", { name: "Year" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.tab({ shift: true });
    await expect(period.getByRole("button", { name: "Year" })).toHaveFocus();
    // Choosing with the keyboard moves it too.
    await userEvent.keyboard("{Home} ");
    await expect(period.getByRole("button", { name: "Month" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    await expect(period.getByRole("button", { name: "Month" })).toHaveFocus();
    // Multiple selection: the first item is the stop.
    after.focus();
    await userEvent.tab();
    await expect(
      within(canvas.getByRole("group", { name: "Filters" })).getByRole("button", { name: "Mine" }),
    ).toHaveFocus();
    // A disabled pressed item cannot hold the stop; the first enabled item does.
    await userEvent.tab();
    await expect(
      within(canvas.getByRole("group", { name: "Unavailable pressed" })).getByRole("button", {
        name: "First",
      }),
    ).toHaveFocus();
    // An uncontrolled group moves the stop with the choice it keeps itself.
    const view = within(canvas.getByRole("group", { name: "View" }));
    await userEvent.tab();
    await expect(view.getByRole("button", { name: "Board" })).toHaveFocus();
    await userEvent.keyboard("{Home} ");
    await expect(view.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await expect(view.getByRole("button", { name: "List" })).toHaveFocus();
  },
};

/**
 * `spacing` counts 4px steps on the space scale: 1 is `space.050`, 2 (the default) `space.100`, 4
 * `space.200`. A number between two steps takes the smaller one.
 */
export const Spacing: Story = {
  tags: ["!manifest"],
  render: () => (
    <Specimens title="Gaps on the space scale">
      {([1, 2, 4, 7] as const).map((spacing) => (
        <ToggleGroup
          key={spacing}
          aria-label={`Spacing ${spacing}`}
          spacing={spacing}
          size="small"
          defaultValue={["day"]}
        >
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </Specimens>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [spacing, gap] of [
      [1, "4px"],
      [2, "8px"],
      [4, "16px"],
      [7, "24px"],
    ] as const) {
      const group = canvas.getByRole("group", { name: `Spacing ${spacing}` });
      await expect(getComputedStyle(group).columnGap).toBe(gap);
      await expect(group).toHaveAttribute("data-spacing", String(spacing));
    }
  },
};

/** `sm`, `default` and `lg` are deprecated spellings for one version; the group and its items report the new word. */
export const DeprecatedSizes: Story = {
  name: "Deprecated size spellings",
  render: () => (
    <ToggleGroup aria-label="Legacy size" size="sm" defaultValue={["day"]}>
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
    </ToggleGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Legacy size" });
    await expect(group).toHaveAttribute("data-size", "small");
    const day = canvas.getByRole("button", { name: "Day" });
    await expect(day).toHaveAttribute("data-size", "small");
    await expect(day.getBoundingClientRect().height).toBe(28);
  },
};

/**
 * The group's `aria-label` names what its items choose between. Without it a screen reader hears
 * Table and Board with no word for the choice they make.
 */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <ToggleGroup aria-label="View" defaultValue={["table"]}>
          <ToggleGroupItem value="table">Table</ToggleGroupItem>
          <ToggleGroupItem value="board">Board</ToggleGroupItem>
        </ToggleGroup>
      }
      doText="View, then Table or Board: the group says what is being chosen."
      dont={
        <ToggleGroup defaultValue={["table"]}>
          <ToggleGroupItem value="table">Table</ToggleGroupItem>
          <ToggleGroupItem value="board">Board</ToggleGroupItem>
        </ToggleGroup>
      }
      dontText="An unnamed group: two pressed-or-not buttons, and nothing says they choose the view."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [named, unnamed] = canvas.getAllByRole("group");
    await expect(named).toHaveAccessibleName("View");
    await expect(unnamed).toHaveAccessibleName("");
  },
};
