import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";

import {
  Spreadsheet,
  type SpreadsheetProps,
  type SpreadsheetSelection,
} from "../../patterns/spreadsheet";
import { along, arrows, towardsEnd } from "../_lib/direction";
import { interact } from "../_lib/interact";

const columns = ["A", "B", "C", "D", "E"].map((label) => ({
  id: label.toLowerCase(),
  label,
  width: 104,
}));
const makeRows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `r${index + 1}`,
    rowNumber: index + 1,
    values: Object.fromEntries(columns.map((column) => [column.id, `${column.label}${index + 1}`])),
  }));
const meta = {
  title: "Patterns/Spreadsheet selection",
  component: Spreadsheet,
  tags: ["!manifest"],
  parameters: { layout: "padded" },
  args: {
    label: "Selection workbook",
    columns,
    rows: makeRows(5),
    height: 280,
    headerDisplay: "letters",
    onChange: fn(),
  },
} satisfies Meta<typeof Spreadsheet>;
export default meta;
type Story = StoryObj<typeof meta>;
function SelectedGrid(args: SpreadsheetProps) {
  const [selection, setSelection] = useState<SpreadsheetSelection | null>(args.selection ?? null);
  return <Spreadsheet {...args} selection={selection} onSelectionChange={setSelection} />;
}

/** A range has one logical perimeter; the active cell keeps its stronger edit ring and document color. */
export const RectangleAndActiveCell: Story = {
  args: {
    freezeFirstColumn: false,
    rowHeights: { r2: 64 },
    getCellStyle: (cell) =>
      cell.rowId === "r2" && cell.columnId === "b"
        ? { color: "#334155", background: "#ecfeff", bold: true }
        : undefined,
  },
  render: (args) => <SelectedGrid {...args} />,
  play: async ({ canvas }) => {
    const user = userEvent.setup();
    const cell = (address: string) =>
      canvas.getByRole("gridcell", { name: new RegExp(`^${address},`) });
    const a1 = cell("A1"),
      b2 = cell("B2"),
      c3 = cell("C3");
    const originalColor = getComputedStyle(a1).color;
    const authoredColor = getComputedStyle(b2).color;
    const width = a1.getBoundingClientRect().width;
    const rowHeight = b2.getBoundingClientRect().height;
    await user.click(a1);
    await user.keyboard(
      `{Shift>}${arrows(a1).next}${arrows(a1).next}{ArrowDown}{ArrowDown}{/Shift}`,
    );
    await expect(c3).toHaveAttribute("aria-selected", "true");
    await expect(a1).toHaveAttribute("data-active");
    await expect(b2.querySelector('[data-slot="spreadsheet-range-outline"]')).toBeNull();
    const outline = (address: string) =>
      cell(address).querySelector<HTMLElement>('[data-slot="spreadsheet-range-outline"]')!;
    const start = getComputedStyle(outline("A1"));
    const end = getComputedStyle(outline("C3"));
    await expect(start.borderBlockStartWidth).toBe("1px");
    await expect(start.borderInlineStartWidth).toBe("1px");
    await expect(start.borderBlockEndWidth).toBe("0px");
    await expect(end.borderBlockEndWidth).toBe("1px");
    await expect(end.borderInlineEndWidth).toBe("1px");
    await expect(end.pointerEvents).toBe("none");
    await expect(a1.getBoundingClientRect().width).toBe(width);
    await expect(b2.getBoundingClientRect().height).toBe(rowHeight);
    if (!matchMedia("(forced-colors: active)").matches) {
      await expect(getComputedStyle(a1).color).toBe(originalColor);
      await expect(getComputedStyle(b2).color).toBe(authoredColor);
    }
    const heading = canvas
      .getByRole("button", { name: "Select column A" })
      .closest('[role="columnheader"]')!;
    await expect(heading).toHaveAttribute("data-active-axis");
    await expect(heading).toHaveAttribute("aria-selected", "false");
    await user.keyboard("{F2}");
    const editor = canvas.getByRole("textbox", { name: "Edit A" });
    await expect(editor).toHaveFocus();
    await expect(getComputedStyle(a1, "::after").outlineWidth).toBe("2px");
    await expect(getComputedStyle(a1, "::after").pointerEvents).toBe("none");
    await expect(a1.getBoundingClientRect().width).toBe(width);
    await user.keyboard("{Escape}");
    await user.click(canvas.getByRole("button", { name: "Select column C" }));
    const column = canvas
      .getByRole("button", { name: "Select column C" })
      .closest('[role="columnheader"]')!;
    await expect(column).toHaveAttribute("aria-selected", "true");
    await expect(column).toHaveAttribute("data-active-axis");
    await expect(
      getComputedStyle(column.querySelector('[data-slot="spreadsheet-column-menu"]')!).opacity,
    ).toBe("1");
    await user.click(canvas.getByRole("button", { name: "Select row 2, r2" }));
    const row = canvas
      .getByRole("button", { name: "Select row 2, r2" })
      .closest('[role="rowheader"]')!;
    await expect(row).toHaveAttribute("aria-selected", "true");
    await expect(row).toHaveAttribute("data-active-axis");
  },
};

/** Hidden identities keep canonical addresses; mounted perimeter pieces track frozen and virtualized cells. */
export const HiddenFrozenAndVirtualized: Story = {
  args: {
    rows: makeRows(80),
    height: 220,
    hiddenRowIds: ["r2"],
    hiddenColumnIds: ["b"],
    freezeFirstColumn: true,
    freezeFirstRow: true,
    rowHeights: { r3: 72 },
    selection: { anchor: { rowId: "r1", columnId: "a" }, focus: { rowId: "r35", columnId: "d" } },
  },
  render: (args) => <SelectedGrid {...args} />,
  play: async ({ canvas }) => {
    const grid = canvas.getByRole("grid");
    const first = canvas.getByRole("gridcell", { name: "A1, A: A1" });
    const firstOutline = first.querySelector<HTMLElement>(
      '[data-slot="spreadsheet-range-outline"]',
    )!;
    await expect(firstOutline).toHaveAttribute("data-start");
    await expect(firstOutline).toHaveAttribute("data-top");
    await expect(canvas.queryByRole("gridcell", { name: /^B1,/ })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("gridcell", { name: /^A2,/ })).not.toBeInTheDocument();
    const c1 = canvas.getByRole("gridcell", { name: "C1, C: C1" });
    await expect(c1.querySelector('[data-slot="spreadsheet-range-outline"]')).not.toHaveAttribute(
      "data-start",
    );
    const firstTop = first.getBoundingClientRect().top;
    const firstStart = along(first).start;
    const standardHeight = canvas
      .getByRole("gridcell", { name: "A4, A: A4" })
      .getBoundingClientRect().height;
    const headerHeight = grid
      .querySelector('[data-slot="spreadsheet-header"]')!
      .getBoundingClientRect().height;
    await interact(() => {
      grid.scrollLeft = towardsEnd(grid, 60);
      grid.scrollTop =
        headerHeight + 33 * standardHeight + (72 - standardHeight) - grid.clientHeight / 2;
      grid.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    await waitFor(() =>
      expect(canvas.getByRole("gridcell", { name: "D35, D: D35" })).toBeInTheDocument(),
    );
    await expect(first.getBoundingClientRect().top).toBeCloseTo(firstTop, 0);
    if (first.hasAttribute("data-frozen"))
      await expect(along(first).start).toBeCloseTo(firstStart, 0);
    const end = canvas.getByRole("gridcell", { name: "D35, D: D35" });
    const perimeter = end.querySelector<HTMLElement>('[data-slot="spreadsheet-range-outline"]')!;
    await expect(perimeter).toHaveAttribute("data-end");
    await expect(perimeter).toHaveAttribute("data-bottom");
    await expect(getComputedStyle(perimeter).borderInlineEndWidth).toBe("1px");
    await expect(getComputedStyle(perimeter).borderBlockEndWidth).toBe("1px");
    await expect(getComputedStyle(perimeter).pointerEvents).toBe("none");
    const middle = canvas.getByRole("gridcell", { name: "A34, A: A34" });
    await expect(
      middle.querySelector('[data-slot="spreadsheet-range-outline"]'),
    ).not.toHaveAttribute("data-bottom");
    await expect(grid.querySelectorAll('[role="row"]').length).toBeLessThan(30);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};
