import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button, Table, Tally, type TallySegment } from "../../components";
import { TileMapKey } from "../../patterns";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Tally",
  component: Tally,
  parameters: { layout: "padded" },
  args: {
    label: "Controls behind Adaptive Response",
    total: 23,
    segments: [
      { key: "in", value: 4, label: "4 in baseline" },
      { key: "added", value: 4, tone: "brand", label: "4 added" },
      { key: "removed", value: 1, tone: "warning", fill: "outline", label: "1 removed" },
    ],
  },
} satisfies Meta<typeof Tally>;
export default meta;
type Story = StoryObj<typeof meta>;

const box = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="tally"]')!;
const segmentsOf = (tally: HTMLElement) =>
  Array.from(tally.querySelectorAll<HTMLElement>('[data-slot="tally-segment"]'));
const width = (element: Element) => element.getBoundingClientRect().width;

/** Three states of 23 items: each segment is its share of `total`, and the rest is the empty track. With `label` the tally is an image named by the label and its segments' labels. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tally = canvas.getByRole("img", {
      name: "Controls behind Adaptive Response: 4 in baseline, 4 added, 1 removed",
    });
    await expect(tally).toBe(box(canvasElement));
    const [held, added, removed] = segmentsOf(tally);
    await expect(segmentsOf(tally)).toHaveLength(3);
    // A share of the total, to a thousandth of a percent, so the stylesheet can ease it.
    await expect(held!.style.inlineSize).toBe("17.391%");
    await expect(Math.abs(width(held!) - width(added!))).toBeLessThan(0.5);
    await expect(width(removed!)).toBeLessThan(width(held!));
    // Nine of 23: the rest of the track is empty.
    const track = tally.querySelector('[data-slot="tally-track"]')!;
    const filled = segmentsOf(tally).reduce((all, segment) => all + width(segment), 0);
    await expect(Math.abs(filled / width(track) - 9 / 23)).toBeLessThan(0.01);
    // Under the pointer a segment says what it is.
    await expect(added).toHaveAttribute("title", "4 added");
  },
};

const states: TallySegment[] = [
  { key: "in", value: 61 },
  { key: "added", value: 70, tone: "brand" },
  { key: "removed", value: 3, tone: "warning", fill: "outline" },
];

/** Four thicknesses: `small` under a name, `medium` in a row, `large` in a band, and `xlarge` where the bar is a table cell's whole reading. */
export const Sizes: Story = {
  render: () => (
    <Stack space="space.200">
      {(["small", "medium", "large", "xlarge"] as const).map((size) => (
        <Stack key={size} space="space.050">
          <Text size="small" color="color.text.subtle">
            {size}
          </Text>
          <Tally size={size} segments={states} total={265} label={`Controls held, ${size}`} />
        </Stack>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const heights = Array.from(
      canvasElement.querySelectorAll('[data-slot="tally"]'),
      (tally) => tally.getBoundingClientRect().height,
    );
    await expect(heights).toHaveLength(4);
    await expect([...heights].sort((a, b) => a - b)).toEqual(heights);
    await expect(new Set(heights).size).toBe(4);
  },
};

/** A segment has a tone, one of the chart tokens, and a fill: `solid`, `outline` for what was there and is not now, and `empty`, the track's own colour. They are a TileMap mark's, so one `TileMap.Key` says what a map's marks and a tally's segments mean. */
export const TonesAndFills: Story = {
  render: () => (
    <Stack space="space.150">
      <TileMapKey
        items={[
          { label: "In baseline", value: 61 },
          { label: "Added", tone: "brand", value: 70 },
          { label: "Removed", tone: "warning", fill: "outline", value: 3 },
          { label: "Not selected", fill: "empty", value: 131 },
        ]}
      />
      <Tally
        size="xlarge"
        label="Controls in Table E-1"
        segments={[
          { key: "in", value: 61, label: "61 in baseline" },
          { key: "added", value: 70, tone: "brand", label: "70 added" },
          { key: "removed", value: 3, tone: "warning", fill: "outline", label: "3 removed" },
          { key: "out", value: 131, fill: "empty", label: "131 not selected" },
        ]}
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tally = canvas.getByRole("img", {
      name: "Controls in Table E-1: 61 in baseline, 70 added, 3 removed, 131 not selected",
    });
    const [solid, added, hollow, empty] = segmentsOf(tally).map((segment) =>
      getComputedStyle(segment),
    );
    // Filled, hollow and empty stay three things, with forced colours too.
    await expect(solid!.boxShadow).toBe("none");
    await expect(hollow!.boxShadow).not.toBe("none");
    await expect(hollow!.backgroundColor).not.toBe(added!.backgroundColor);
    await expect(empty!.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    await expect(empty!.boxShadow).toBe("none");
    // The four are the whole: nothing of the track is left over.
    const track = tally.querySelector('[data-slot="tally-track"]')!;
    const filled = segmentsOf(tally).reduce((all, segment) => all + width(segment), 0);
    await expect(Math.abs(filled - width(track))).toBeLessThan(1);
  },
};

const column = [
  { name: "Substantiated Integrity", held: 35, total: 58 },
  { name: "Analytic Monitoring", held: 34, total: 50 },
  { name: "Adaptive Response", held: 8, total: 23 },
  { name: "Unpredictability", held: 2, total: 7 },
];
const largest = Math.max(...column.map((row) => row.total));

/** `scale` sets the bar's own length as a share of its box: a row's total against the largest in its column. The bars of a column then compare by their length as well as by how full they are. */
export const Scaled: Story = {
  render: () => (
    <Stack space="space.150">
      {column.map((row) => (
        <Stack key={row.name} space="space.050">
          <Text size="small">
            {row.name} · {row.held} of {row.total}
          </Text>
          <Tally
            segments={[{ key: "held", value: row.held, tone: "brand" }]}
            total={row.total}
            scale={row.total / largest}
          />
        </Stack>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const tracks = Array.from(canvasElement.querySelectorAll('[data-slot="tally-track"]'), width);
    const boxes = Array.from(canvasElement.querySelectorAll('[data-slot="tally"]'), width);
    await expect(Math.abs(tracks[0]! - boxes[0]!)).toBeLessThan(0.5);
    await expect(Math.abs(tracks[2]! / boxes[2]! - 23 / 58)).toBeLessThan(0.01);
    // Beside its number the tally is decoration: the words carry the value.
    await expect(within(canvasElement).queryByRole("img")).toBeNull();
    await expect(canvasElement.querySelector('[data-slot="tally"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  },
};

/** `tone="danger"` is a tally that holds nothing where something is expected: the unfilled track is a hollow outline in the danger tone, never a fill, so it does not pass for a low value. */
export const Nothing: Story = {
  args: {
    label: "Controls behind Architectural Diversity",
    tone: "danger",
    total: 7,
    segments: [
      { key: "in", value: 0, label: "0 in baseline" },
      { key: "added", value: 0, tone: "brand", label: "0 added" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A segment of nothing is no part of the name.
    const tally = canvas.getByRole("img", { name: "Controls behind Architectural Diversity" });
    const track = getComputedStyle(tally.querySelector('[data-slot="tally-track"]')!);
    await expect(track.boxShadow).not.toBe("none");
    for (const segment of segmentsOf(tally)) {
      await expect(width(segment)).toBe(0);
      await expect(segment).not.toHaveAttribute("title");
    }
  },
};

const layers = [
  { name: "Adaptive Response", total: 23, steps: [4, 8, 8] },
  { name: "Analytic Monitoring", total: 50, steps: [21, 34, 34] },
  { name: "Deception", total: 21, steps: [0, 8, 8] },
  { name: "Diversity", total: 21, steps: [3, 6, 7] },
];
const layerNames = ["Reference baseline", "Allocation", "Tailoring"];

/** In a table's cells: the number is the cell's text and the tally beside it is decoration, so a row reads as numbers and the column of bars shows where a layer moved them. A cell that holds nothing takes the danger tone. */
export const InATable: Story = {
  render: () => (
    <Table label="Controls held by technique, layer by layer">
      <thead>
        <tr>
          <Table.Header>Technique</Table.Header>
          {layerNames.map((name) => (
            <Table.Header key={name} width={150}>
              {name}
            </Table.Header>
          ))}
        </tr>
      </thead>
      <tbody>
        {layers.map((row) => (
          <Table.Row key={row.name} isStatic>
            <Table.Cell rowHeader>{row.name}</Table.Cell>
            {row.steps.map((held, index) => (
              <Table.Cell key={layerNames[index]}>
                <Stack space="space.050">
                  <Text size="small" numeric>
                    {held} of {row.total}
                  </Text>
                  <Tally
                    size="small"
                    total={row.total}
                    tone={held === 0 ? "danger" : "neutral"}
                    segments={[
                      { key: "before", value: index ? Math.min(held, row.steps[0] ?? 0) : held },
                      {
                        key: "added",
                        value: index ? Math.max(0, held - (row.steps[0] ?? 0)) : 0,
                        tone: "brand",
                      },
                    ]}
                  />
                </Stack>
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </tbody>
    </Table>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole("row", { name: /^Deception/ });
    await expect(within(row).getByText("0 of 21")).toBeVisible();
    await expect(within(row).getAllByText("8 of 21")).toHaveLength(2);
    // Twelve cells, twelve tallies, none of them an image: the numbers are the reading.
    await expect(canvasElement.querySelectorAll('[data-slot="tally"]')).toHaveLength(12);
    await expect(canvas.queryByRole("img")).toBeNull();
    await expect(row.querySelector('[data-slot="tally"]')).toHaveAttribute("data-tone", "danger");
  },
};

function Stepped() {
  const [after, setAfter] = useState(false);
  return (
    <Stack space="space.150">
      <Button
        variant="secondary"
        size="small"
        aria-pressed={after}
        onClick={() => setAfter(!after)}
      >
        Apply the allocation
      </Button>
      <Tally
        size="large"
        label="Controls behind Adaptive Response"
        total={23}
        segments={[
          { key: "in", value: 4, label: "4 in baseline" },
          { key: "added", value: after ? 4 : 0, tone: "brand", label: "4 added" },
        ]}
      />
    </Stack>
  );
}

/** A value changes and the segment eases to its new share in place: a segment of nothing keeps its place at no width, so it grows from where it stands. Reduced motion switches it. */
export const Changing: Story = {
  render: () => <Stepped />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tally = canvas.getByRole("img", {
      name: "Controls behind Adaptive Response: 4 in baseline",
    });
    const added = segmentsOf(tally)[1]!;
    await expect(added.style.inlineSize).toBe("0%");
    await userEvent.click(canvas.getByRole("button", { name: "Apply the allocation" }));
    await expect(tally).toHaveAccessibleName(
      "Controls behind Adaptive Response: 4 in baseline, 4 added",
    );
    // The same element, a new share.
    await expect(segmentsOf(tally)[1]).toBe(added);
    await expect(added.style.inlineSize).toBe("17.391%");
    await expect(getComputedStyle(added).transitionProperty).toBe(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : "inline-size",
    );
  },
};

/** The tally's box takes native span props and a ref: an `id`, `data-*` for a test, a class that places it. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: (args) => (
    <Tally
      {...args}
      id="coverage"
      data-testid="tally"
      className="max-w-full"
      ref={(node) => node?.setAttribute("data-ref", "")}
    />
  ),
  play: async ({ canvasElement }) => {
    const tally = within(canvasElement).getByTestId("tally");
    await expect(tally).toHaveAttribute("data-slot", "tally");
    await expect(tally).toHaveAttribute("id", "coverage");
    await expect(tally).toHaveAttribute("data-ref");
    await expect(tally).toHaveClass("max-w-full");
    await expect(tally).toHaveAttribute("data-size", "medium");
  },
};
