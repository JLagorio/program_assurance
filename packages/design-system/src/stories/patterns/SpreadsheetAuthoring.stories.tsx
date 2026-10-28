import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Spreadsheet,
  type SpreadsheetProps,
  type SpreadsheetSelection,
  type SpreadsheetCellStyle,
} from "../../patterns/spreadsheet";
import { interact } from "../_lib/interact";
import { Button } from "../../components/button";
import { Stack } from "../../primitives/stack";
import { Text } from "../../primitives/text";
const meta = {
  title: "Patterns/Spreadsheet authoring",
  component: Spreadsheet,
  tags: ["!manifest"],
  parameters: { layout: "padded" },
  args: {
    label: "Authoring workbook",
    height: 280,
    freezeFirstColumn: false,
    columns: [
      { id: "a", label: "Result", width: 120 },
      { id: "b", label: "Input", width: 120 },
      { id: "c", label: "Other", width: 120 },
    ],
    rows: [
      { id: "r1", rowNumber: 1, values: { a: "", b: "2", c: "8" } },
      { id: "r2", rowNumber: 2, values: { a: "unchanged", b: "3", c: "5" } },
    ],
    onChange: fn(),
  },
} satisfies Meta<typeof Spreadsheet>;
export default meta;
type Story = StoryObj<typeof meta>;
function Grid(args: SpreadsheetProps) {
  const [rows, setRows] = useState(args.rows);
  const [selection, setSelection] = useState<SpreadsheetSelection | null>(null);
  return (
    <Spreadsheet
      {...args}
      rows={rows}
      selection={selection}
      onSelectionChange={setSelection}
      onChange={(edits) => {
        args.onChange?.(edits);
        setRows((previous) =>
          previous.map((row) => ({
            ...row,
            values: {
              ...row.values,
              ...Object.fromEntries(
                edits
                  .filter((edit) => edit.rowId === row.id)
                  .map((edit) => [edit.columnId, edit.value]),
              ),
            },
          })),
        );
      }}
    />
  );
}
export const FormulaAssistance: Story = {
  args: {
    formulaFunctions: [
      {
        name: "SUM",
        signature: "SUM(number1, number2, …)",
        description: "Add numeric values.",
        arguments: ["First number or range", "Additional number or range"],
      },
    ],
    getFormulaReferences: (input) =>
      input.includes("B1:B2")
        ? [
            {
              selection: {
                anchor: { rowId: "r1", columnId: "b" },
                focus: { rowId: "r2", columnId: "b" },
              },
              label: "B1:B2",
            },
          ]
        : [],
  },
  render: (args) => <Grid {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const user = userEvent.setup();
    const page = within(canvasElement.ownerDocument.body);
    await user.click(canvas.getByRole("gridcell", { name: "A1, Result: Empty" }));
    const input = canvas.getByRole("textbox", { name: "Value or formula for A1" });
    await user.click(input);
    await user.type(input, "=SU");
    await expect(await page.findByRole("option", { name: /SUM/ })).toBeVisible();
    await user.keyboard("{Enter}");
    await expect(input).toHaveValue("=SUM(");
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(page.getByText("First number or range")).toBeVisible();
    const b1 = canvas.getByRole("gridcell", { name: "B1, Input: 2" }),
      b2 = canvas.getByRole("gridcell", { name: "B2, Input: 3" });
    await user.pointer([
      { target: b1, keys: "[MouseLeft>]" },
      { target: b2 },
      { keys: "[/MouseLeft]" },
    ]);
    await waitFor(() => expect(input).toHaveValue("=SUM(B1:B2"));
    await expect(b1).toHaveAttribute("data-formula-reference", "0");
    await expect(b2).toHaveAccessibleDescription("Formula reference: B1:B2");
    await expect(args.onChange).not.toHaveBeenCalled();
    await user.keyboard("){Enter}");
    await waitFor(() =>
      expect(args.onChange).toHaveBeenCalledWith([
        { rowId: "r1", columnId: "a", value: "=SUM(B1:B2)" },
      ]),
    );
    await expect(canvas.getByRole("gridcell", { name: "A1, Result: =SUM(B1:B2)" })).toBeVisible();
  },
};
function RichGrid({ failFirst = false, ...args }: SpreadsheetProps & { failFirst?: boolean }) {
  const refused = useRef(false);
  const [rows, setRows] = useState(args.rows);
  const [styles, setStyles] = useState<Record<string, SpreadsheetCellStyle>>({
    "r1:b": { bold: true },
  });
  return (
    <Spreadsheet
      {...args}
      rows={rows}
      getCellStyle={(cell) => styles[`${cell.rowId}:${cell.columnId}`]}
      getClipboardStyle={(cell) => styles[`${cell.rowId}:${cell.columnId}`]}
      onPaste={async (intent) => {
        await args.onPaste?.(intent);
        if (failFirst && !refused.current) {
          refused.current = true;
          throw new Error("Storage is unavailable.");
        }
        setRows((previous) =>
          previous.map((row) => ({
            ...row,
            values: {
              ...row.values,
              ...Object.fromEntries(
                intent.edits
                  .filter((edit) => edit.rowId === row.id)
                  .map((edit) => [edit.columnId, edit.value]),
              ),
            },
          })),
        );
        setStyles((previous) => {
          const next = { ...previous };
          for (const entry of intent.styles) {
            const key = `${entry.rowId}:${entry.columnId}`;
            if (entry.style === null) delete next[key];
            else next[key] = entry.style;
          }
          return next;
        });
      }}
    />
  );
}
export const RichClipboard: Story = {
  args: { onPaste: fn() },
  render: (args) => <RichGrid {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const user = userEvent.setup();
    const page = within(canvasElement.ownerDocument.body);
    const grid = canvas.getByRole("grid");
    const clip = new DataTransfer();
    await user.click(canvas.getByRole("gridcell", { name: "B1, Input: 2" }));
    await interact(() => {
      grid.dispatchEvent(new ClipboardEvent("copy", { bubbles: true, clipboardData: clip }));
    });
    await user.click(canvas.getByRole("gridcell", { name: "C1, Other: 8" }));
    await interact(() => {
      grid.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: clip }));
    });
    await waitFor(() =>
      expect(args.onPaste).toHaveBeenCalledWith({
        mode: "all",
        edits: [{ rowId: "r1", columnId: "c", value: "2" }],
        styles: [{ rowId: "r1", columnId: "c", style: { bold: true } }],
      }),
    );
    await expect(canvas.getByRole("gridcell", { name: "C1, Other: 2" })).toHaveAttribute(
      "data-bold",
    );
    await expect(args.onChange).not.toHaveBeenCalled();
    await user.click(canvas.getByRole("gridcell", { name: "A2, Result: unchanged" }));
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await user.click(await page.findByRole("menuitem", { name: "Paste formatting" }));
    await waitFor(() =>
      expect(args.onPaste).toHaveBeenLastCalledWith({
        mode: "formatting",
        edits: [],
        styles: [{ rowId: "r2", columnId: "a", style: { bold: true } }],
      }),
    );
    await expect(canvas.getByRole("gridcell", { name: "A2, Result: unchanged" })).toHaveAttribute(
      "data-bold",
    );
    await waitFor(() => expect(page.queryByRole("menu")).not.toBeInTheDocument());
  },
};
export const CalculatedStatistics: Story = {
  args: {
    selectionStatistics: { count: 2, numericCount: 2, sum: 1200.5, average: 600.25 },
    displayValue: (_cell, raw) => (raw ? `$${raw}.00` : ""),
  },
  render: (args) => <Grid {...args} />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("gridcell", { name: "B1, Input: $2.00" }));
    await expect(canvas.getByText(/Sum 1,200.5/)).toBeVisible();
    await expect(canvas.getByText(/Average 600.25/)).toBeVisible();
    await expect(canvas.getByText("2 cells")).toBeVisible();
  },
};

/** Reference picking owns a draft preview, never a write, and Escape restores that draft. */
export const InlineReferenceCancellation: Story = {
  args: { ...FormulaAssistance.args, onChange: fn() },
  render: (args) => <Grid {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const user = userEvent.setup();
    const page = within(canvasElement.ownerDocument.body);
    await user.click(canvas.getByRole("gridcell", { name: "A1, Result: Empty" }));
    await user.keyboard("{F2}=SU");
    const input = canvas.getByRole("textbox", { name: "Edit Result" });
    await expect(await page.findByRole("option", { name: /SUM/ })).toBeVisible();
    await user.keyboard("{Enter}");
    await expect(input).toHaveValue("=SUM(");
    const b1 = canvas.getByRole("gridcell", { name: "B1, Input: 2" }),
      b2 = canvas.getByRole("gridcell", { name: "B2, Input: 3" });
    // Captured touch pointers stay targeted at the first cell; coordinates resolve the range.
    await interact(() => {
      b1.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 1,
          pointerId: 7,
          pointerType: "touch",
        }),
      );
      const rect = b2.getBoundingClientRect();
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          pointerId: 7,
          pointerType: "touch",
          buttons: 1,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        }),
      );
    });
    await expect(input).toHaveValue("=SUM(B1:B2");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(input).toHaveValue("=SUM("));
    await expect(args.onChange).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    await expect(canvas.queryByRole("textbox", { name: "Edit Result" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("gridcell", { name: "A1, Result: Empty" })).toBeVisible();
  },
};
export const RichPasteRecovery: Story = {
  args: { onPaste: fn() },
  render: (args) => <RichGrid {...args} failFirst />,
  play: async ({ canvas, args }) => {
    const user = userEvent.setup();
    const grid = canvas.getByRole("grid");
    const clip = new DataTransfer();
    await user.click(canvas.getByRole("gridcell", { name: "B1, Input: 2" }));
    await interact(() => {
      grid.dispatchEvent(new ClipboardEvent("copy", { bubbles: true, clipboardData: clip }));
    });
    await user.click(canvas.getByRole("gridcell", { name: "C1, Other: 8" }));
    await interact(() => {
      grid.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: clip }));
    });
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Storage is unavailable.");
    await expect(canvas.getByRole("gridcell", { name: "C1, Other: 8" })).not.toHaveAttribute(
      "data-bold",
    );
    await user.click(canvas.getByRole("button", { name: "Retry change" }));
    await waitFor(() =>
      expect(canvas.getByRole("gridcell", { name: "C1, Other: 2" })).toHaveAttribute("data-bold"),
    );
    await expect(args.onPaste).toHaveBeenCalledTimes(2);
    await expect(args.onPaste).toHaveBeenLastCalledWith({
      mode: "all",
      edits: [{ rowId: "r1", columnId: "c", value: "2" }],
      styles: [{ rowId: "r1", columnId: "c", style: { bold: true } }],
    });
    await expect(args.onChange).not.toHaveBeenCalled();
  },
};
export const ProtectedRichPaste: Story = {
  args: {
    columns: [
      { id: "a", label: "Result", width: 120 },
      { id: "b", label: "Input", width: 120 },
      { id: "c", label: "Other", width: 120, readOnly: true },
    ],
    onPaste: fn(),
  },
  render: (args) => <RichGrid {...args} />,
  play: async ({ canvas, args }) => {
    const user = userEvent.setup();
    const grid = canvas.getByRole("grid");
    const clip = new DataTransfer();
    await user.click(canvas.getByRole("gridcell", { name: "B1, Input: 2" }));
    await interact(() => {
      grid.dispatchEvent(new ClipboardEvent("copy", { bubbles: true, clipboardData: clip }));
    });
    await user.click(canvas.getByRole("gridcell", { name: "B2, Input: 3" }));
    await user.keyboard("{Shift>}");
    await user.click(canvas.getByRole("gridcell", { name: "C2, Other: 5" }));
    await user.keyboard("{/Shift}");
    await interact(() => {
      grid.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: clip }));
    });
    await expect(await canvas.findByRole("alert")).toHaveTextContent("read-only cell");
    await expect(args.onPaste).not.toHaveBeenCalled();
    await expect(canvas.getByRole("gridcell", { name: "B2, Input: 3" })).not.toHaveAttribute(
      "data-bold",
    );
  },
};

export const BlurCommitAction: Story = {
  args: { onChange: fn() },
  render: (args) => {
    const [rows, setRows] = useState(args.rows);
    const [dirty, setDirty] = useState(false);
    const [opened, setOpened] = useState(0);
    return (
      <Stack space="space.100">
        <Button
          onClick={() => {
            if (!dirty) setOpened((count) => count + 1);
          }}
        >
          Review staged cells
        </Button>
        <Text role="status">{opened ? `Review opened ${opened}` : "Review closed"}</Text>
        <Spreadsheet
          {...args}
          rows={rows}
          onDraftChange={setDirty}
          onChange={(edits) => {
            args.onChange?.(edits);
            setRows((current) =>
              current.map((row) => ({
                ...row,
                values: {
                  ...row.values,
                  ...Object.fromEntries(
                    edits
                      .filter((edit) => edit.rowId === row.id)
                      .map((edit) => [edit.columnId, edit.value]),
                  ),
                },
              })),
            );
          }}
        />
      </Stack>
    );
  },
  play: async ({ canvas, args }) => {
    const user = userEvent.setup();
    await user.click(canvas.getByRole("gridcell", { name: "A1, Result: Empty" }));
    await user.keyboard("{F2}First line{Alt>}{Enter}{/Alt}Second line");
    await expect(args.onChange).not.toHaveBeenCalled();
    await user.pointer({
      target: canvas.getByRole("button", { name: "Review staged cells" }),
      keys: "[MouseLeft]",
    });
    await expect(canvas.getByText("Review opened 1")).toBeVisible();
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { rowId: "r1", columnId: "a", value: "First line\nSecond line" },
    ]);
    await expect(canvas.queryByRole("textbox", { name: "Edit Result" })).not.toBeInTheDocument();
  },
};
