import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Meter, Table } from "../../components";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Meter",
  component: Meter,
  parameters: { layout: "padded" },
  args: { label: "Checks met", value: 2, max: 10 },
} satisfies Meta<typeof Meter>;
export default meta;
type Story = StoryObj<typeof meta>;

const marksOf = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-slot="meter-mark"]'));
const stateOf = (mark: HTMLElement) => mark.getAttribute("data-state");

/** Two of ten checks met: ten marks, the two met filled and the rest hollow, beside the count in words. With `label` the meter is an image named by the label and the count. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const meter = canvas.getByRole("img", { name: "Checks met: 2 of 10" });
    await expect(meter).toHaveAttribute("data-slot", "meter");
    const marks = marksOf(meter);
    await expect(marks).toHaveLength(10);
    await expect(marks.map(stateOf)).toEqual(["met", "met", ...Array(8).fill("open")]);
    // The count is drawn beside the marks, never left to them.
    await expect(meter.querySelector('[data-slot="meter-value"]')).toHaveTextContent("2 of 10");
    // Neutral: met and open wear the same tone, and differ by fill.
    const [met, open] = [marks[0]!, marks[2]!].map((mark) => getComputedStyle(mark));
    await expect(met!.boxShadow).toBe("none");
    await expect(open!.boxShadow).not.toBe("none");
    await expect(marks[0]).toHaveAttribute("data-tone", "neutral");
    await expect(marks[2]).toHaveAttribute("data-tone", "neutral");
  },
};

/** One of twelve closed, three of the rest late. A late mark is hatched in the danger tone, so its shape tells it from an open one as well as its colour, and the name says how many are late. */
export const Late: Story = {
  args: { label: "Condition 1 items closed", value: 1, max: 12, late: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const meter = canvas.getByRole("img", { name: "Condition 1 items closed: 1 of 12, 3 late" });
    const marks = marksOf(meter);
    await expect(marks.map(stateOf)).toEqual([
      "met",
      "late",
      "late",
      "late",
      ...Array(8).fill("open"),
    ]);
    const [met, late, open] = [marks[0]!, marks[1]!, marks[4]!].map((mark) =>
      getComputedStyle(mark),
    );
    // Three shapes: filled, hatched and hollow. Late keeps its hatch with forced colours too.
    await expect(late!.backgroundImage).toContain("repeating-linear-gradient");
    await expect(open!.backgroundImage).toBe("none");
    await expect(met!.backgroundImage).toBe("none");
    await expect(late!.boxShadow).not.toBe("none");
    await expect(met!.boxShadow).toBe("none");
  },
};

/** `medium` marks are 8px beside body text, in a row; `large` marks are 12px beside larger text, where the count is the reading of a band. */
export const Sizes: Story = {
  render: () => (
    <Stack space="space.200">
      <Meter value={2} max={10} label="Checks met, medium" />
      <Meter size="large" value={2} max={10} label="Checks met, large" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const medium = marksOf(canvas.getByRole("img", { name: "Checks met, medium: 2 of 10" }))[0]!;
    const large = marksOf(canvas.getByRole("img", { name: "Checks met, large: 2 of 10" }))[0]!;
    await expect(Math.round(medium.getBoundingClientRect().height)).toBe(8);
    await expect(Math.round(large.getBoundingClientRect().height)).toBe(12);
    await expect(Math.round(large.getBoundingClientRect().width)).toBe(12);
  },
};

const conditions = [
  { name: "Close the high-severity remediation items", met: 1, of: 12, late: 3 },
  { name: "Annual authorization review", met: 2, of: 10, late: 0 },
  { name: "Results published", met: 2, of: 3, late: 0 },
];

/** In a table's cells the count is the text and the marks beside it decoration: leave `label` unsaid, so a row reads as its numbers. The late count is said after the count, unseen. */
export const InATable: Story = {
  render: () => (
    <Table label="Conditions of the authorization">
      <thead>
        <tr>
          <Table.Header>Condition</Table.Header>
          <Table.Header width={200}>Items closed</Table.Header>
        </tr>
      </thead>
      <tbody>
        {conditions.map((row) => (
          <Table.Row key={row.name} isStatic>
            <Table.Cell rowHeader>{row.name}</Table.Cell>
            <Table.Cell>
              <Meter value={row.met} max={row.of} late={row.late} />
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // No image a cell: the numbers are the reading.
    await expect(canvas.queryByRole("img")).toBeNull();
    const row = canvas.getByRole("row", { name: /^Close the high-severity/ });
    const value = row.querySelector('[data-slot="meter-value"]')!;
    await expect(value).toHaveTextContent("1 of 12, 3 late");
    await expect(within(row).getByText("1")).toBeVisible();
    await expect(row.querySelector('[data-slot="meter-marks"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    const quiet = canvas.getByRole("row", { name: /^Annual authorization review/ });
    await expect(quiet.querySelector('[data-slot="meter-value"]')).toHaveTextContent("2 of 10");
    await expect(quiet.querySelector('[data-slot="meter-value"]')).not.toHaveTextContent("late");
  },
};

/** The count keeps to its range: a value over the whole is the whole, and late counts only what is not met. */
export const OutOfRange: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.100">
      <Text size="small" color="color.text.subtle">
        Value 5 of 3, late 4
      </Text>
      <Meter value={5} max={3} late={4} label="Results published" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const meter = canvas.getByRole("img", { name: "Results published: 3 of 3" });
    await expect(marksOf(meter).map(stateOf)).toEqual(["met", "met", "met"]);
  },
};

/** The meter's box takes native span props and a ref: an `id`, `data-*` for a test, a class that places it. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: (args) => (
    <Meter
      {...args}
      id="checks"
      data-testid="meter"
      className="max-w-full"
      ref={(node) => node?.setAttribute("data-ref", "")}
    />
  ),
  play: async ({ canvasElement }) => {
    const meter = within(canvasElement).getByTestId("meter");
    await expect(meter).toHaveAttribute("data-slot", "meter");
    await expect(meter).toHaveAttribute("id", "checks");
    await expect(meter).toHaveAttribute("data-ref");
    await expect(meter).toHaveClass("max-w-full");
    await expect(meter).toHaveAttribute("data-size", "medium");
  },
};
