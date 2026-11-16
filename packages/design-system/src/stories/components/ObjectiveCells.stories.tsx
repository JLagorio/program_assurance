import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { ObjectiveCells } from "../../components";

const meta = {
  title: "Components/ObjectiveCells",
  component: ObjectiveCells,
  parameters: { layout: "padded" },
  args: {
    label: "SI-2 Flaw Remediation objectives by rung",
    rungs: [
      { key: "mapped", label: "Mapped" },
      { key: "evidence", label: "Evidence" },
      { key: "assessed", label: "Assessed" },
      { key: "satisfied", label: "Satisfied" },
    ],
    objectives: [
      { id: "a01", label: "SI-02a.[01]", group: "a", reached: 1 },
      { id: "a02", label: "SI-02a.[02]", group: "a", reached: 1 },
      { id: "a03", label: "SI-02a.[03]", group: "a", reached: 1 },
      { id: "b01", label: "SI-02b.[01]", group: "b", reached: 1 },
      { id: "b02", label: "SI-02b.[02]", group: "b", reached: 1 },
      { id: "b03", label: "SI-02b.[03]", group: "b", reached: 1 },
      { id: "b04", label: "SI-02b.[04]", group: "b", reached: 1 },
      { id: "c01", label: "SI-02c.[01]", group: "c", reached: 1 },
      { id: "c02", label: "SI-02c.[02]", group: "c", reached: 1 },
      { id: "d", label: "SI-02d.", group: "d", reached: 1 },
    ],
  },
} satisfies Meta<typeof ObjectiveCells>;
export default meta;
type Story = StoryObj<typeof meta>;

const rowsOf = (root: HTMLElement) => within(root).getAllByRole("group");
const cellsOf = (row: HTMLElement) => Array.from(row.querySelectorAll<HTMLElement>('[role="img"]'));
const statesOf = (row: HTMLElement) => cellsOf(row).map((cell) => cell.dataset["state"]);

/** SI-2's ten objectives, grouped by the statement's four parts: every one mapped, none with evidence. A row a rung and a column an objective, so the row where the cells turn hollow, Evidence, is where the control stopped; the rows above are ink and the rows below faint. Each row ends in how many reached it of those that reached the rung before. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const figure = within(canvasElement).getByRole("figure", {
      name: "SI-2 Flaw Remediation objectives by rung",
    });
    const rows = rowsOf(figure);
    // A row a rung, named by the rung and its count; a rung nothing reached the one before of has no count.
    await expect(rows.map((row) => row.textContent)).toEqual([
      "Mapped10 of 10",
      "Evidence0 of 10",
      "Assessed",
      "Satisfied",
    ]);
    await expect(rows[0]).toHaveAccessibleName("Mapped 10 of 10");
    await expect(rows[1]).toHaveAccessibleName("Evidence 0 of 10");
    await expect(rows[2]).toHaveAccessibleName("Assessed");
    // Every cell is named by its objective's label and its state on the rung.
    const evidence = cellsOf(rows[1]!);
    await expect(evidence).toHaveLength(10);
    await expect(evidence[0]).toHaveAccessibleName("SI-02a.[01], Missing");
    await expect(cellsOf(rows[0]!)[9]).toHaveAccessibleName("SI-02d., Reached");
    await expect(cellsOf(rows[3]!)[4]).toHaveAccessibleName("SI-02b.[02], Not yet");
    await expect(statesOf(rows[0]!).every((state) => state === "reached")).toBe(true);
    await expect(statesOf(rows[1]!).every((state) => state === "gap")).toBe(true);
    await expect(statesOf(rows[2]!).every((state) => state === "not-yet")).toBe(true);
    // A cell is a picture, never a control: nothing in the grid takes focus.
    await expect(figure.querySelector('[data-slot="objective-cells-rungs"] button, a')).toBeNull();
    // The statement's four parts are four runs, and a column is one objective on every rung.
    await expect(rows[0]!.querySelectorAll('[data-slot="objective-cells-run"]')).toHaveLength(4);
    const left = (cell: HTMLElement) => Math.round(cell.getBoundingClientRect().left);
    const top = (cell: HTMLElement) => Math.round(cell.getBoundingClientRect().top);
    for (const row of rows.slice(1)) {
      await expect(cellsOf(row).map(left)).toEqual(cellsOf(rows[0]!).map(left));
      await expect(cellsOf(row).map(top)).not.toEqual(cellsOf(rows[0]!).map(top));
    }
  },
};

/** A control part of the way through an assessment: two objectives judged satisfied, one partially satisfied and one other than satisfied, two waiting on the assessor, one mapped with no evidence and one not mapped. A judgement's hue lands on the rung it decides: the last one where the objective is satisfied, the one it stopped under where it is not. */
export const Judged: Story = {
  args: {
    label: "AC-2(5) Inactivity Logout objectives by rung",
    objectives: [
      {
        id: "a01",
        label: "AC-02(05)[01]",
        group: "a",
        reached: 4,
        judgement: { label: "Satisfied", tone: "success" },
      },
      {
        id: "a02",
        label: "AC-02(05)[02]",
        group: "a",
        reached: 4,
        judgement: { label: "Satisfied", tone: "success" },
      },
      {
        id: "a03",
        label: "AC-02(05)[03]",
        group: "a",
        reached: 3,
        judgement: { label: "Partially satisfied", tone: "warning" },
      },
      {
        id: "a04",
        label: "AC-02(05)[04]",
        group: "a",
        reached: 3,
        judgement: { label: "Other than satisfied", tone: "danger" },
      },
      { id: "b01", label: "AC-02(05)[05]", group: "b", reached: 2, waiting: true },
      { id: "b02", label: "AC-02(05)[06]", group: "b", reached: 2, waiting: true },
      { id: "b03", label: "AC-02(05)[07]", group: "b", reached: 1 },
      { id: "b04", label: "AC-02(05)[08]", group: "b", reached: 0 },
    ],
  },
  play: async ({ canvasElement }) => {
    const figure = within(canvasElement).getByRole("figure", {
      name: "AC-2(5) Inactivity Logout objectives by rung",
    });
    const rows = rowsOf(figure);
    await expect(rows.map((row) => row.textContent)).toEqual([
      "Mapped7 of 8",
      "Evidence6 of 7",
      "Assessed4 of 6",
      "Satisfied2 of 4",
    ]);
    // A column tells one objective's climb, top to bottom.
    const column = (index: number) => rows.map((row) => statesOf(row)[index]);
    await expect(column(0)).toEqual(["reached", "reached", "reached", "judged"]);
    await expect(column(3)).toEqual(["reached", "reached", "reached", "judged"]);
    await expect(column(4)).toEqual(["reached", "reached", "waiting", "not-yet"]);
    await expect(column(6)).toEqual(["reached", "gap", "not-yet", "not-yet"]);
    await expect(column(7)).toEqual(["gap", "not-yet", "not-yet", "not-yet"]);
    // A judgement is said in its words and drawn in its tone.
    const satisfied = cellsOf(rows[3]!);
    await expect(satisfied[0]).toHaveAccessibleName("AC-02(05)[01], Satisfied");
    await expect(satisfied[0]).toHaveAttribute("data-tone", "success");
    await expect(satisfied[2]).toHaveAccessibleName("AC-02(05)[03], Partially satisfied");
    await expect(satisfied[3]).toHaveAccessibleName("AC-02(05)[04], Other than satisfied");
    await expect(satisfied[3]).toHaveAttribute("data-tone", "danger");
    await expect(cellsOf(rows[2]!)[5]).toHaveAccessibleName("AC-02(05)[06], Waiting");
    // Only a judgement takes a hue: every other cell is neutral.
    const toned = rows.flatMap(cellsOf).filter((cell) => cell.dataset["tone"] !== "neutral");
    await expect(toned).toHaveLength(4);
  },
};

/** SI-4(13), three of its six objectives mapped. Each rung counts of those that reached the rung before, so Evidence is 0 of 3, and a rung nothing has reached the one before of draws no count. An objective not mapped is hollow on the first rung and faint after it; one mapped is hollow on the second. */
export const PartlyMapped: Story = {
  args: {
    label: "SI-4(13) Analyze Traffic and Event Patterns objectives by rung",
    rungs: [
      { key: "mapped", label: "Mapped" },
      { key: "evidence", label: "Evidence" },
      { key: "assessed", label: "Assessed" },
    ],
    objectives: [
      { id: "a01", label: "SI-04(13)(a)[01]", group: "a", reached: 1 },
      { id: "a02", label: "SI-04(13)(a)[02]", group: "a", reached: 0 },
      { id: "b01", label: "SI-04(13)(b)[01]", group: "b", reached: 1 },
      { id: "b02", label: "SI-04(13)(b)[02]", group: "b", reached: 0 },
      { id: "c01", label: "SI-04(13)(c)[01]", group: "c", reached: 1 },
      { id: "c02", label: "SI-04(13)(c)[02]", group: "c", reached: 0 },
    ],
  },
  play: async ({ canvasElement }) => {
    const rows = rowsOf(canvasElement);
    await expect(rows.map((row) => row.textContent)).toEqual([
      "Mapped3 of 6",
      "Evidence0 of 3",
      "Assessed",
    ]);
    await expect(statesOf(rows[0]!)).toEqual([
      "reached",
      "gap",
      "reached",
      "gap",
      "reached",
      "gap",
    ]);
    await expect(statesOf(rows[1]!)).toEqual([
      "gap",
      "not-yet",
      "gap",
      "not-yet",
      "gap",
      "not-yet",
    ]);
  },
};

/** The same cells as a table, one toggle away: a row an objective, a column a rung, each cell its state in words. The toggle keeps its name, Table, and says by `aria-pressed` whether the table shows. */
export const TableTwin: Story = {
  args: { ...Judged.args },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const figure = canvas.getByRole("figure", {
      name: "AC-2(5) Inactivity Logout objectives by rung",
    });
    const drawn = rowsOf(figure).map((row) => cellsOf(row).map((cell) => cell.ariaLabel));
    const toggle = canvas.getByRole("button", { name: "Table" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    // The table stands in for the cells.
    await expect(figure.querySelector('[data-slot="objective-cells-rungs"]')).toBeNull();
    const table = canvas.getByRole("table", {
      name: "AC-2(5) Inactivity Logout objectives by rung, as a table",
    });
    const header = within(table).getAllByRole("columnheader");
    await expect(header.map((cell) => cell.textContent)).toEqual([
      "Objective",
      "Mapped",
      "Evidence",
      "Assessed",
      "Satisfied",
    ]);
    // The same objectives in the same order, and the same states in words.
    const rows = within(table).getAllByRole("row").slice(1);
    const labels = rows.map((row) => within(row).getByRole("rowheader").textContent);
    await expect(labels).toEqual(drawn[0]!.map((name) => name?.split(", ")[0]));
    for (const [index, row] of rows.entries()) {
      const words = Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent);
      await expect(words).toEqual(drawn.map((rung) => rung[index]?.split(", ")[1]));
    }
    await expect(rows[3]).toHaveTextContent("Other than satisfied");
    await expect(rows[4]).toHaveTextContent("Waiting");
    await userEvent.click(toggle);
    await expect(canvas.queryByRole("table")).toBeNull();
    await expect(rowsOf(figure)).toHaveLength(4);
  },
};

/** `small` is 8px cells beside body text, `medium` 12px and `large` 20px, on a control's own page. The rows wrap at the same place, so a column stays one objective at any width. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-400">
      <ObjectiveCells {...args} size="small" label="Small" />
      <ObjectiveCells {...args} size="medium" label="Medium" />
      <ObjectiveCells {...args} size="large" label="Large" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const side = (name: string) =>
      canvas.getByRole("figure", { name }).querySelector('[role="img"]')!.getBoundingClientRect()
        .width;
    await expect(side("Small")).toBe(8);
    await expect(side("Medium")).toBe(12);
    await expect(side("Large")).toBe(20);
    // Wrapped or not, every row of the large grid puts an objective in the same column.
    const rows = rowsOf(canvas.getByRole("figure", { name: "Large" }));
    const at = (row: HTMLElement) =>
      cellsOf(row).map((cell) => Math.round(cell.getBoundingClientRect().left));
    for (const row of rows.slice(1)) await expect(at(row)).toEqual(at(rows[0]!));
  },
};

/** The figure's box takes native props and a ref: an `id`, `data-*` for a test, a class that places it. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: (args) => (
    <ObjectiveCells
      {...args}
      id="si-2-objectives"
      data-testid="objective-cells"
      className="max-w-full"
      ref={(node) => node?.setAttribute("data-ref", "")}
    />
  ),
  play: async ({ canvasElement }) => {
    const figure = within(canvasElement).getByTestId("objective-cells");
    await expect(figure).toHaveAttribute("data-slot", "objective-cells");
    await expect(figure).toHaveAttribute("id", "si-2-objectives");
    await expect(figure).toHaveAttribute("data-ref");
    await expect(figure).toHaveClass("max-w-full");
  },
};
