import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Climb } from "../../components";

const meta = {
  title: "Components/Climb",
  component: Climb,
  parameters: { layout: "padded" },
  args: {
    label: "Controls of the baseline",
    start: "Selected",
    rungs: [
      {
        key: "requirement",
        label: "Requirement",
        stopped: { key: "to-map", value: 14, fill: "empty", label: "14 to map" },
      },
      {
        key: "evidence",
        label: "Evidence",
        stopped: { key: "need-evidence", value: 235, fill: "outline", label: "235 need evidence" },
      },
      {
        key: "assessed",
        label: "Assessed",
        stopped: { key: "to-assess", value: 90, label: "90 to assess" },
      },
      {
        key: "satisfied",
        label: "Satisfied",
        stopped: [
          { key: "other", value: 13, tone: "danger", label: "13 other than satisfied" },
          { key: "partial", value: 34, tone: "warning", label: "34 partially satisfied" },
        ],
      },
    ],
    reached: { key: "satisfied", value: 174, tone: "success", label: "174 satisfied" },
  },
} satisfies Meta<typeof Climb>;
export default meta;
type Story = StoryObj<typeof meta>;

const segmentsOf = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-slot="climb-segment"]'));
const rungsOf = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>('[data-slot="climb-rung"]'));
const width = (element: Element) => element.getBoundingClientRect().width;
/** A rung's count, its first line. */
const countOf = (rung: HTMLElement) => rung.firstElementChild?.textContent ?? "";

/** A baseline of 560 controls, rung by rung: 546 reached a requirement, 311 evidence, 221 an assessment and 174 were found satisfied. Each segment is what stopped under a rung, to scale, so the widest gap, 235 that need evidence, is the widest segment, and its words take the warning colour once. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const climb = canvas.getByRole("figure", { name: "Controls of the baseline" });
    // The rungs' counts: the whole, less what stopped under each rung and every rung before.
    const rungs = rungsOf(climb);
    await expect(rungs.map(countOf)).toEqual(["560", "546", "311", "221", "174"]);
    await expect(within(climb).getByRole("list")).toBeVisible();
    await expect(rungs[2]).toHaveTextContent("235 need evidence");
    await expect(rungs[4]).toHaveTextContent("13 other than satisfied");
    // The widest gap is marked once.
    await expect(climb.querySelectorAll("[data-widest]")).toHaveLength(1);
    await expect(rungs[2]).toHaveAttribute("data-widest");
    // Six segments, in the climb's order, each its share of the bar.
    const segments = segmentsOf(climb);
    await expect(segments.map((segment) => segment.title)).toEqual([
      "14 to map",
      "235 need evidence",
      "90 to assess",
      "13 other than satisfied",
      "34 partially satisfied",
      "174 satisfied",
    ]);
    const bar = climb.querySelector('[data-slot="climb-bar"]')!;
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    await expect(Math.abs(width(segments[1]!) / width(bar) - 235 / 560)).toBeLessThan(0.02);
    await expect(width(segments[1]!)).toBeGreaterThan(width(segments[5]!));
  },
};

/** One control of 560 stopped under the first rung. Its segment is held at three pixels, never thinner, so it still shows, and the others share what is left in proportion. */
export const OneInHundreds: Story = {
  args: {
    rungs: [
      {
        key: "requirement",
        label: "Requirement",
        stopped: { key: "to-map", value: 1, fill: "empty", label: "1 to map" },
      },
      {
        key: "evidence",
        label: "Evidence",
        stopped: { key: "need-evidence", value: 248, fill: "outline", label: "248 need evidence" },
      },
      {
        key: "assessed",
        label: "Assessed",
        stopped: { key: "to-assess", value: 90, label: "90 to assess" },
      },
      {
        key: "satisfied",
        label: "Satisfied",
        stopped: { key: "partial", value: 47, tone: "warning", label: "47 partially satisfied" },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const climb = within(canvasElement).getByRole("figure", { name: "Controls of the baseline" });
    await expect(rungsOf(climb).map(countOf)).toEqual(["560", "559", "311", "221", "174"]);
    const [one, ...rest] = segmentsOf(climb);
    // A 1-in-560 segment still draws three pixels, at any width.
    await expect(one!.title).toBe("1 to map");
    await expect(width(one!)).toBeGreaterThanOrEqual(2.99);
    await expect(width(one!)).toBeLessThan(4);
    for (const segment of rest) await expect(width(segment)).toBeGreaterThan(width(one!));
  },
};

/** A baseline that stopped at the first rungs: five of 287 controls mapped and none with evidence. A gap of nothing draws no segment and says nothing under its rung; the rungs above still say their zero. */
export const StoppedEarly: Story = {
  args: {
    label: "Controls of the Atlas baseline",
    rungs: [
      {
        key: "requirement",
        label: "Requirement",
        stopped: { key: "to-map", value: 282, fill: "empty", label: "282 to map" },
      },
      {
        key: "evidence",
        label: "Evidence",
        stopped: { key: "need-evidence", value: 5, fill: "outline", label: "5 need evidence" },
      },
      {
        key: "assessed",
        label: "Assessed",
        stopped: { key: "to-assess", value: 0, label: "0 to assess" },
      },
      {
        key: "satisfied",
        label: "Satisfied",
        stopped: { key: "short", value: 0, tone: "danger", label: "0 not satisfied" },
      },
    ],
    reached: { key: "satisfied", value: 0, tone: "success", label: "0 satisfied" },
  },
  play: async ({ canvasElement }) => {
    const climb = within(canvasElement).getByRole("figure", {
      name: "Controls of the Atlas baseline",
    });
    const rungs = rungsOf(climb);
    await expect(rungs.map(countOf)).toEqual(["287", "5", "0", "0", "0"]);
    await expect(segmentsOf(climb).map((segment) => segment.title)).toEqual([
      "282 to map",
      "5 need evidence",
    ]);
    // The widest gap is the first rung's; a rung nothing stopped under says no gap.
    await expect(rungs[1]).toHaveAttribute("data-widest");
    await expect(rungs[3]!.querySelector('[data-slot="climb-gap"]')).toBeNull();
    await expect(rungs[4]!.querySelector('[data-slot="climb-swatch"]')).toBeNull();
  },
};

/** The same numbers as a table, one toggle away: a row a rung with how many reached it and what stopped under it. The toggle keeps its name, Table, and says by `aria-pressed` whether the table shows. */
export const TableTwin: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const climb = canvas.getByRole("figure", { name: "Controls of the baseline" });
    const drawn = rungsOf(climb).map(countOf);
    const toggle = canvas.getByRole("button", { name: "Table" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    // The table stands in for the bar and the rungs.
    await expect(climb.querySelector('[data-slot="climb-bar"]')).toBeNull();
    const table = canvas.getByRole("table", { name: "Controls of the baseline, as a table" });
    const rows = within(table).getAllByRole("row").slice(1);
    await expect(rows.map((row) => row.querySelectorAll("td")[0]?.textContent)).toEqual(drawn);
    await expect(within(rows[0]!).getByRole("rowheader")).toHaveTextContent("Selected");
    await expect(within(rows[2]!).getByRole("rowheader")).toHaveTextContent("Evidence");
    await expect(rows[2]).toHaveTextContent("235 need evidence");
    await expect(rows[4]).toHaveTextContent("13 other than satisfied, 34 partially satisfied");
    // The start has nothing under it, and says so.
    await expect(within(rows[0]!).getByText("Where the climb starts")).toBeInTheDocument();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(canvas.queryByRole("table")).toBeNull();
    await expect(rungsOf(climb).map(countOf)).toEqual(drawn);
  },
};

/** The figure's box takes native props and a ref: an `id`, `data-*` for a test, a class that places it. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: (args) => (
    <Climb
      {...args}
      id="baseline-climb"
      data-testid="climb"
      className="max-w-full"
      ref={(node) => node?.setAttribute("data-ref", "")}
    />
  ),
  play: async ({ canvasElement }) => {
    const climb = within(canvasElement).getByTestId("climb");
    await expect(climb).toHaveAttribute("data-slot", "climb");
    await expect(climb).toHaveAttribute("id", "baseline-climb");
    await expect(climb).toHaveAttribute("data-ref");
    await expect(climb).toHaveClass("max-w-full");
  },
};
