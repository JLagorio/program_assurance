import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "../../components/button";
import { DropdownMenuItem } from "../../components/dropdown-menu";
import {
  Spreadsheet,
  SpreadsheetToolbar,
  type SpreadsheetRow,
  type SpreadsheetSelection,
} from "../../patterns/spreadsheet";
import { interact } from "../_lib/interact";
import { along, arrows } from "../_lib/direction";

const meta = {
  title: "Patterns/Spreadsheet",
  component: Spreadsheet,
  parameters: { layout: "padded" },
  args: {
    label: "Delivery planning",
    columns: [
      { id: "item", label: "Item", width: 250 },
      { id: "hours", label: "Hours", type: "number", width: 140 },
      {
        id: "stage",
        label: "Stage",
        type: "choice",
        options: [
          { value: "", label: "Unassigned" },
          { value: "planned", label: "Planned" },
          { value: "ready", label: "Ready" },
        ],
      },
      { id: "done", label: "Done", type: "boolean", width: 120 },
      { id: "target", label: "Target", type: "date", width: 180 },
    ],
    rows: [],
  },
} satisfies Meta<typeof Spreadsheet>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A controlled sheet with typed cells: the host applies a batch and returns new rows. */
export const Playground: Story = {
  render: (args) => {
    const [rows, setRows] = useState<SpreadsheetRow[]>([
      {
        id: "intake",
        values: {
          item: "Package inspection",
          hours: "3",
          stage: "planned",
          done: "false",
          target: "2026-10-20",
        },
      },
      {
        id: "review",
        values: {
          item: "Independent review",
          hours: "5",
          stage: "ready",
          done: "false",
          target: "2026-10-23",
        },
      },
      {
        id: "release",
        values: {
          item: "Release preparation",
          hours: "2",
          stage: "planned",
          done: "true",
          target: "2026-10-28",
        },
      },
    ]);
    return (
      <Spreadsheet
        {...args}
        rows={rows}
        onChange={(edits) => {
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
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("gridcell", { name: /^A1, Item:/ }));
    await userEvent.keyboard("{Enter}");
    const input = canvas.getByRole("textbox", { name: "Edit Item" });
    await userEvent.clear(input);
    await userEvent.type(input, "Inspection complete");
    await interact(() =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await waitFor(() =>
      expect(canvas.getByRole("gridcell", { name: "A1, Item: Inspection complete" })).toBeVisible(),
    );
    await userEvent.click(canvas.getByRole("gridcell", { name: /^B1, Hours:/ }));
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
    await interact(() => canvas.getByRole("button", { name: "Fill down" }).click());
    await waitFor(() =>
      expect(canvas.getByRole("gridcell", { name: "B2, Hours: 3" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
  },
};

/** The same single-row action strip can serve another view of a workbook. */
export const Toolbar: Story = {
  args: { onClick: fn() },
  render: (args) => (
    <SpreadsheetToolbar label="Plan controls" id="plan-controls" onClick={args.onClick}>
      <Button size="small">Open plan</Button>
      <Button size="small">Export plan</Button>
    </SpreadsheetToolbar>
  ),
  play: async ({ canvas, args }) => {
    const toolbar = canvas.getByRole("group", { name: "Plan controls" });
    await expect(toolbar).toHaveAttribute("id", "plan-controls");
    await expect(toolbar).toHaveAttribute("data-slot", "spreadsheet-toolbar");
    await userEvent.click(within(toolbar).getByRole("button", { name: "Open plan" }));
    await userEvent.click(within(toolbar).getByRole("button", { name: "Export plan" }));
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

const columnLayoutRows: SpreadsheetRow[] = [
  { id: "review", rowNumber: 1, values: { item: "Beta review", hours: "8" } },
  {
    id: "intake",
    rowNumber: 2,
    values: { item: "Alpha inspection with a considerably longer title", hours: "3" },
  },
];

/** Host actions and native cell tools share one strip; column menus keep layout beside the field. */
export const ColumnControls: Story = {
  tags: ["!manifest"],
  args: {
    label: "Column layout",
    columns: [
      { id: "item", label: "Item", width: 200 },
      { id: "hours", label: "Hours", type: "number", width: 140 },
    ],
    onColumnWidthsChange: fn(),
    onFreezeFirstColumnChange: fn(),
  },
  render: (args) => {
    const [rows, setRows] = useState(columnLayoutRows);
    const [widths, setWidths] = useState<Readonly<Record<string, number>>>({});
    const [frozen, setFrozen] = useState(true);
    return (
      <Spreadsheet
        {...args}
        rows={rows}
        readOnly
        columns={args.columns.map((column) => ({
          ...column,
          width: widths[column.id] ?? column.width,
        }))}
        columnWidths={widths}
        onColumnWidthsChange={(next) => {
          setWidths(next);
          args.onColumnWidthsChange?.(next);
        }}
        freezeFirstColumn={frozen}
        onFreezeFirstColumnChange={(next) => {
          setFrozen(next);
          args.onFreezeFirstColumnChange?.(next);
        }}
        toolbarStart={
          <Button size="small" onClick={() => setRows((current) => [...current].reverse())}>
            Reverse rows
          </Button>
        }
        actions={
          <Button size="small" onClick={() => setRows(columnLayoutRows)}>
            Reset rows
          </Button>
        }
        renderColumnMenu={(column) => (
          <DropdownMenuItem
            onClick={() =>
              setRows((current) =>
                [...current].sort((a, b) =>
                  (a.values[column.id] ?? "").localeCompare(b.values[column.id] ?? "", undefined, {
                    numeric: true,
                  }),
                ),
              )
            }
          >
            Sort by {column.label}
          </DropdownMenuItem>
        )}
      />
    );
  },
  play: async ({ canvas, canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    const toolbar = canvas.getByRole("group", { name: "Column layout actions" });
    for (const name of ["Reverse rows", "Copy", "Columns", "Reset rows"])
      await expect(within(toolbar).getByRole("button", { name })).toBeInTheDocument();
    const firstItem = () =>
      canvas
        .getAllByRole("gridcell")
        .find((cell) => /, Item:/.test(cell.getAttribute("aria-label") ?? ""));
    await userEvent.click(within(toolbar).getByRole("button", { name: "Reverse rows" }));
    await expect(firstItem()).toHaveTextContent("Alpha inspection");
    await userEvent.click(within(toolbar).getByRole("button", { name: "Reset rows" }));
    await expect(firstItem()).toHaveTextContent("Beta review");

    const columnMenu = canvas.getByRole("button", { name: "Column options for Item" });
    const width = () => columnMenu.closest('[role="columnheader"]')!.getBoundingClientRect().width;
    const initialWidth = width();
    await userEvent.click(columnMenu);
    await userEvent.click(await page.findByRole("menuitem", { name: "Narrow column" }));
    await waitFor(() => expect(width()).toBeLessThan(initialWidth));
    await expect(args.onColumnWidthsChange).toHaveBeenCalled();
    await userEvent.click(columnMenu);
    await userEvent.click(await page.findByRole("menuitem", { name: "Widen column" }));
    await waitFor(() => expect(width()).toBe(initialWidth));
    await userEvent.click(columnMenu);
    await userEvent.click(await page.findByRole("menuitem", { name: "Autofit column" }));
    await waitFor(() => expect(width()).toBeGreaterThan(initialWidth));
    await userEvent.click(columnMenu);
    await userEvent.click(await page.findByRole("menuitem", { name: "Reset column width" }));
    await waitFor(() => expect(width()).toBe(initialWidth));

    await userEvent.click(within(toolbar).getByRole("button", { name: "Columns" }));
    await userEvent.click(await page.findByRole("menuitem", { name: "Unfreeze first column" }));
    await expect(args.onFreezeFirstColumnChange).toHaveBeenLastCalledWith(false);
    await userEvent.click(columnMenu);
    await userEvent.click(await page.findByRole("menuitem", { name: "Freeze first column" }));
    await expect(args.onFreezeFirstColumnChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(within(toolbar).getByRole("button", { name: "Columns" }));
    await userEvent.click(await page.findByRole("menuitem", { name: "Autofit all columns" }));
    await waitFor(() => expect(width()).toBeGreaterThan(initialWidth));
    await userEvent.click(within(toolbar).getByRole("button", { name: "Columns" }));
    await userEvent.click(await page.findByRole("menuitem", { name: "Reset column widths" }));
    await waitFor(() => expect(width()).toBe(initialWidth));

    await userEvent.click(canvas.getByRole("gridcell", { name: "B1, Hours: 8" }));
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await page.findByRole("menuitem", { name: "Sort by Hours" });
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByRole("grid")).toHaveFocus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await userEvent.click(await page.findByRole("menuitem", { name: "Sort by Hours" }));
    await expect(firstItem()).toHaveTextContent("Alpha inspection");
    await expect(canvas.getByRole("gridcell", { name: "B1, Hours: 8" })).toHaveAttribute(
      "data-active",
    );
    await expect(canvas.getByRole("textbox", { name: "Go to cell" })).toHaveValue("B1");
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[data-slot="dropdown-menu-content"]'),
      ).not.toBeInTheDocument(),
    );
  },
};

/** Column controls stay reachable by touch and keyboard while only the action strip scrolls. */
export const PhoneColumnControls: Story = {
  ...ColumnControls,
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  play: async ({ canvas, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
    const toolbar = canvas.getByRole("group", { name: "Column layout actions" });
    const first = within(toolbar).getByRole("button", { name: "Reverse rows" });
    const last = within(toolbar).getByRole("button", { name: "Reset rows" });
    await interact(() => last.focus());
    await expect(last).toHaveFocus();
    await expect(
      Math.abs(last.getBoundingClientRect().top - first.getBoundingClientRect().top),
    ).toBeLessThanOrEqual(1);
    await userEvent.click(last);
    await userEvent.click(canvas.getByRole("button", { name: "Column options for Item" }));
    await userEvent.click(await page.findByRole("menuitem", { name: "Autofit column" }));
    await userEvent.click(canvas.getByRole("button", { name: "Column options for Item" }));
    await userEvent.click(await page.findByRole("menuitem", { name: "Reset column width" }));
    const address = canvas.getByRole("textbox", { name: "Go to cell" });
    await userEvent.clear(address);
    await userEvent.type(address, "B1{Enter}");
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await userEvent.click(await page.findByRole("menuitem", { name: "Sort by Hours" }));
    await expect(address).toHaveValue("B1");
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[data-slot="dropdown-menu-content"]'),
      ).not.toBeInTheDocument(),
    );
  },
};

/** Editing preserves prose and its caret; the preview leaves the full cell boundary visible. */
export const InlineEditing: Story = {
  tags: ["!manifest"],
  args: {
    columns: [{ id: "item", label: "Item", width: 250 }],
    rows: [
      { id: "one", values: { item: "First line\nSecond line" } },
      { id: "two", values: { item: "Next item" } },
      { id: "three", values: { item: "Last item" } },
    ],
    onChange: fn(),
    onDraftChange: fn(),
  },
  render: (args) => {
    const [rows, setRows] = useState(args.rows);
    return (
      <Spreadsheet
        {...args}
        rows={rows}
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
        actions={<Button size="small">Outside control</Button>}
      />
    );
  },
  play: async ({ canvas, args }) => {
    const cell = canvas.getByRole("gridcell", { name: /^A1, Item:/ });
    await userEvent.click(cell);
    await userEvent.keyboard("{F2}");
    let input = canvas.getByRole("textbox", { name: "Edit Item" }) as HTMLTextAreaElement;
    await expect(input).toBeInstanceOf(HTMLTextAreaElement);
    await expect(input).toHaveValue("First line\nSecond line");
    await expect(input.selectionStart).toBe(input.value.length);
    const bounds = cell.getBoundingClientRect();
    const editorBounds = input.getBoundingClientRect();
    await expect(Math.abs(editorBounds.width - bounds.width)).toBeLessThanOrEqual(2);
    await expect(Math.abs(editorBounds.x - bounds.x)).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(input).borderRadius).toBe("0px");
    await userEvent.keyboard("{Alt>}{Enter}{/Alt}");
    await userEvent.type(input, "Added clause");
    await expect(input).toHaveValue("First line\nSecond line\nAdded clause");
    await expect(args.onChange).not.toHaveBeenCalled();
    const outside = canvas.getByRole("button", { name: "Outside control" });
    await interact(() => outside.focus());
    await waitFor(() =>
      expect(canvas.queryByRole("textbox", { name: "Edit Item" })).not.toBeInTheDocument(),
    );
    await expect(outside).toHaveFocus();
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { rowId: "one", columnId: "item", value: "First line\nSecond line\nAdded clause" },
    ]);
    await expect(args.onDraftChange).toHaveBeenLastCalledWith(false);

    await userEvent.dblClick(cell);
    input = canvas.getByRole("textbox", { name: "Edit Item" }) as HTMLTextAreaElement;
    await expect(input.selectionStart).toBe(input.value.length);
    await userEvent.type(input, "!");
    const formula = canvas.getByRole("textbox", { name: "Value or formula for A1" });
    await userEvent.click(formula);
    await expect(formula).toHaveValue("First line\nSecond line\nAdded clause!");
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await interact(() =>
      formula.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await expect(canvas.getByRole("textbox", { name: "Go to cell" })).toHaveValue("A1");
    await userEvent.click(formula);
    await interact(() =>
      formula.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true })),
    );
    await expect(canvas.getByRole("textbox", { name: "Go to cell" })).toHaveValue("A2");
    await userEvent.click(cell);

    await userEvent.keyboard("R");
    await expect(canvas.getByRole("textbox", { name: "Edit Item" })).toHaveValue("R");
    await userEvent.keyboard("{Escape}{Shift>}{ArrowDown}{ArrowDown}{/Shift}{F2}");
    await expect(canvas.getByRole("textbox", { name: "Edit Item" })).toHaveValue(
      "First line\nSecond line\nAdded clause!",
    );
    await expect(canvas.getByRole("gridcell", { name: "A3, Item: Last item" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    await userEvent.click(cell);
    await userEvent.keyboard("{F2}");
    await expect(canvas.getByRole("textbox", { name: "Edit Item" })).toHaveFocus();
    await expect(cell).toHaveAttribute("data-active");
  },
};

/** Dismissing a choice does not leave a stranded edit or change its value. */
export const TypedEditorDismissal: Story = {
  tags: ["!manifest"],
  args: { onChange: fn() },
  render: (args) => {
    const [rows, setRows] = useState<SpreadsheetRow[]>([
      {
        id: "intake",
        values: {
          item: "Package inspection",
          hours: "3",
          stage: "planned",
          done: "false",
          target: "2026-10-20",
        },
      },
    ]);
    return (
      <Spreadsheet
        {...args}
        rows={rows}
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
    );
  },
  play: async ({ canvas, canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    const stage = canvas.getByRole("gridcell", { name: /^C1, Stage:/ });
    await userEvent.click(stage);
    await userEvent.keyboard("{F2}");
    await page.findByRole("option", { name: "Planned" });
    await expect(canvas.getByRole("combobox", { name: "Edit Stage" })).toHaveTextContent("Planned");
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvas.queryByRole("combobox", { name: "Edit Stage" })).not.toBeInTheDocument(),
    );
    await expect(canvas.getByRole("grid")).toHaveFocus();
    await userEvent.keyboard("{F2}");
    await page.findByRole("option", { name: "Ready" });
    await userEvent.click(canvas.getByRole("textbox", { name: "Go to cell" }));
    await waitFor(() =>
      expect(canvas.queryByRole("combobox", { name: "Edit Stage" })).not.toBeInTheDocument(),
    );
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(canvas.getByRole("button", { name: "Clear cells" })).toBeEnabled();
    await userEvent.click(stage);
    await userEvent.keyboard("{F2}");
    const ready = await page.findByRole("option", { name: "Ready" });
    await interact(() =>
      ready.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerType: "mouse",
          button: 0,
          buttons: 1,
        }),
      ),
    );
    await expect(canvas.getByRole("combobox", { name: "Edit Stage" })).toBeInTheDocument();
    await expect(args.onChange).not.toHaveBeenCalled();
    await userEvent.click(ready);
    await waitFor(() =>
      expect(canvas.getByRole("gridcell", { name: "C1, Stage: Ready" })).toBeVisible(),
    );
    await expect(args.onChange).toHaveBeenCalledTimes(1);

    await userEvent.click(canvas.getByRole("gridcell", { name: /^E1, Target:/ }));
    await userEvent.keyboard("{F2}");
    await userEvent.click(canvas.getByRole("button", { name: "Choose a date" }));
    const calendar = await page.findByRole("dialog", { name: "Edit Target" });
    await expect(canvas.getByRole("textbox", { name: "Edit Target" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(calendar).not.toBeInTheDocument());
    await expect(canvas.getByRole("textbox", { name: "Edit Target" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Choose a date" }));
    await page.findByRole("dialog", { name: "Edit Target" });
    const address = canvas.getByRole("textbox", { name: "Go to cell" });
    await interact(() => address.focus());
    await waitFor(() =>
      expect(canvas.queryByRole("textbox", { name: "Edit Target" })).not.toBeInTheDocument(),
    );
    await expect(address).toHaveFocus();
    await userEvent.click(canvas.getByRole("gridcell", { name: /^E1, Target:/ }));
    await userEvent.keyboard("{F2}");
    const invalid = canvas.getByRole("textbox", { name: "Edit Target" });
    await userEvent.clear(invalid);
    await userEvent.type(invalid, "not a date");
    await interact(() => address.focus());
    await expect(canvas.getByRole("alert")).toBeVisible();
    await expect(invalid).toBeInTheDocument();
    await expect(address).toHaveFocus();
    await interact(() => canvas.getByRole("button", { name: "Cancel cell edit" }).click());
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await userEvent.click(stage);
    await userEvent.keyboard("{F2}");
    const unassigned = await page.findByRole("option", { name: "Unassigned" });
    await userEvent.click(unassigned);
    await expect(canvas.getByRole("gridcell", { name: "C1, Stage: Unassigned" })).toBeVisible();
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { rowId: "intake", columnId: "stage", value: "" },
    ]);
    await userEvent.dblClick(stage);
    await page.findByRole("option", { name: "Unassigned" });
    await expect(canvas.getByRole("combobox", { name: "Edit Stage" })).toHaveTextContent(
      "Unassigned",
    );
    await expect(stage).toHaveAttribute("data-active");
    await expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

/** Controlled null selection can jump directly to a cell without focus resetting it. */
export const ControlledSelection: Story = {
  tags: ["!manifest"],
  args: {
    readOnly: true,
    columns: [{ id: "item", label: "Item" }],
    rows: [
      { id: "one", values: { item: "First" } },
      { id: "two", values: { item: "Second" } },
    ],
    onSelectionChange: fn(),
  },
  render: (args) => {
    const [selection, setSelection] = useState<SpreadsheetSelection | null>(null);
    return (
      <Spreadsheet
        {...args}
        selection={selection}
        onSelectionChange={(next) => {
          setSelection(next);
          args.onSelectionChange?.(next);
        }}
      />
    );
  },
  play: async ({ canvas, args }) => {
    const address = canvas.getByRole("textbox", { name: "Go to cell" });
    await userEvent.type(address, "A2{Enter}");
    await expect(canvas.getByRole("gridcell", { name: "A2, Item: Second" })).toHaveAttribute(
      "data-active",
    );
    await expect(address).toHaveValue("A2");
    await expect(args.onSelectionChange).toHaveBeenLastCalledWith({
      anchor: { rowId: "two", columnId: "item" },
      focus: { rowId: "two", columnId: "item" },
    });
  },
};

/** A failed write preserves the draft, and a retry commits exactly the same atomic intent. */
export const RecoverableSave: Story = {
  tags: ["!manifest"],
  args: { onChange: fn(), onDraftChange: fn() },
  render: (args) => {
    const [rows, setRows] = useState<SpreadsheetRow[]>([
      { id: "review", values: { item: "Independent review", hours: "5" } },
    ]);
    const refused = useRef(false);
    return (
      <Spreadsheet
        {...args}
        rows={rows}
        actions={<Button size="small">Outside control</Button>}
        onChange={async (edits) => {
          args.onChange?.(edits);
          if (!refused.current) {
            refused.current = true;
            throw new Error("The connection was interrupted. Your draft is kept.");
          }
          setRows((current) =>
            current.map((row) => ({
              ...row,
              values: {
                ...row.values,
                ...Object.fromEntries(edits.map((edit) => [edit.columnId, edit.value])),
              },
            })),
          );
        }}
      />
    );
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("gridcell", { name: /^B1, Hours:/ }));
    await userEvent.keyboard("{Enter}");
    const input = canvas.getByRole("textbox", { name: "Edit Hours" });
    await userEvent.clear(input);
    await userEvent.type(input, "8");
    await expect(args.onDraftChange).toHaveBeenLastCalledWith(true);
    const outside = canvas.getByRole("button", { name: "Outside control" });
    await interact(() => outside.focus());
    await waitFor(() => expect(canvas.getByRole("alert")).toHaveTextContent("Your draft is kept"));
    await expect(input).toHaveValue("8");
    await expect(outside).toHaveFocus();
    await interact(() => canvas.getByRole("button", { name: "Retry change" }).click());
    await waitFor(() =>
      expect(canvas.getByRole("gridcell", { name: "B1, Hours: 8" })).toBeVisible(),
    );
    await expect(args.onChange).toHaveBeenCalledTimes(2);
    await expect(args.onDraftChange).toHaveBeenLastCalledWith(false);
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
  },
};

/** A pending asynchronous write cannot be canceled or submitted twice by the keyboard. */
export const PendingCommit: Story = {
  tags: ["!manifest"],
  args: { columns: [{ id: "item", label: "Item" }], onChange: fn(), onDraftChange: fn() },
  render: (args) => {
    const [rows, setRows] = useState<SpreadsheetRow[]>([{ id: "one", values: { item: "First" } }]);
    const complete = useRef<(() => void) | null>(null);
    return (
      <Spreadsheet
        {...args}
        rows={rows}
        onChange={(edits) => {
          args.onChange?.(edits);
          return new Promise<void>((resolve) => {
            complete.current = () => {
              setRows([{ id: "one", values: { item: edits[0]!.value } }]);
              resolve();
            };
          });
        }}
        actions={
          <Button size="small" onClick={() => complete.current?.()}>
            Complete save
          </Button>
        }
      />
    );
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("gridcell", { name: "A1, Item: First" }));
    await userEvent.keyboard("{Enter}");
    const editor = canvas.getByRole("textbox", { name: "Edit Item" });
    await userEvent.clear(editor);
    await userEvent.type(editor, "Second");
    await interact(() =>
      editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await expect(canvas.getByRole("grid")).toHaveAttribute("aria-busy", "true");
    await userEvent.click(canvas.getByRole("textbox", { name: "Value or formula for A1" }));
    await userEvent.keyboard("{Escape}{Enter}");
    await expect(editor).toHaveValue("Second");
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onDraftChange).toHaveBeenLastCalledWith(true);
    await interact(() => canvas.getByRole("button", { name: "Complete save" }).click());
    await expect(canvas.getByRole("gridcell", { name: "A1, Item: Second" })).toBeVisible();
    await expect(args.onDraftChange).toHaveBeenLastCalledWith(false);
  },
};

/** A protected rectangle rejects atomically; writable quoted TSV round-trips unchanged. */
export const RectangularClipboard: Story = {
  tags: ["!manifest"],
  args: {
    onChange: fn(),
    columns: [
      { id: "code", label: "Code", readOnly: true },
      { id: "item", label: "Item" },
      { id: "hours", label: "Hours", type: "number" },
    ],
  },
  render: (args) => {
    const [rows, setRows] = useState<SpreadsheetRow[]>([
      { id: "one", values: { code: "ROW-01", item: "First", hours: "2" } },
      { id: "two", values: { code: "ROW-02", item: "Second", hours: "4" } },
    ]);
    return (
      <Spreadsheet
        {...args}
        rows={rows}
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
    );
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("gridcell", { name: /^A1, Code:/ }));
    const grid = canvas.getByRole("grid", { name: "Delivery planning" });
    const data = new DataTransfer();
    data.setData("text/plain", 'changed\t"A quoted\tvalue"\t7\r\nchanged\tSecond changed\t9');
    await interact(() =>
      grid.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: data })),
    );
    await waitFor(() =>
      expect(canvas.getByRole("alert")).toHaveTextContent(
        "The pasted range includes a read-only cell. No cells were changed.",
      ),
    );
    await expect(args.onChange).not.toHaveBeenCalled();
    for (const name of [
      "A1, Code: ROW-01",
      "B1, Item: First",
      "C1, Hours: 2",
      "A2, Code: ROW-02",
      "B2, Item: Second",
      "C2, Hours: 4",
    ])
      await expect(canvas.getByRole("gridcell", { name })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("gridcell", { name: "B1, Item: First" }));
    data.setData("text/plain", '"A quoted\tvalue"\t7\r\nSecond changed\t9');
    await interact(() =>
      grid.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: data })),
    );
    await waitFor(() =>
      expect(canvas.getByRole("gridcell", { name: /^B1, Item: A quoted\s+value/ })).toBeVisible(),
    );
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { rowId: "one", columnId: "item", value: "A quoted\tvalue" },
      { rowId: "one", columnId: "hours", value: "7" },
      { rowId: "two", columnId: "item", value: "Second changed" },
      { rowId: "two", columnId: "hours", value: "9" },
    ]);
    await expect(canvas.getByRole("gridcell", { name: "A1, Code: ROW-01" })).toHaveAttribute(
      "aria-readonly",
      "true",
    );
    await expect(canvas.getByRole("gridcell", { name: "C2, Hours: 9" })).toBeVisible();
    await userEvent.keyboard("{Control>}a{/Control}");
    const copied = new DataTransfer();
    await interact(() =>
      grid.dispatchEvent(new ClipboardEvent("copy", { bubbles: true, clipboardData: copied })),
    );
    await expect(copied.getData("text/plain")).toBe(
      'ROW-01\t"A quoted\tvalue"\t7\r\nROW-02\tSecond changed\t9',
    );
  },
};

/** Invalid numeric input and IME composition do not commit or throw away the editor. */
export const KeyboardAndValidation: Story = {
  tags: ["!manifest"],
  args: { rows: [{ id: "one", values: { item: "Review", hours: "3" } }], onChange: fn() },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("gridcell", { name: /^B1, Hours:/ }));
    await userEvent.keyboard("{F2}");
    const input = canvas.getByRole("textbox", { name: "Edit Hours" });
    await userEvent.clear(input);
    await userEvent.type(input, "unknown");
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true }),
    );
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(input).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect(canvas.getByRole("alert")).toHaveTextContent("Enter a number");
    await expect(input).toHaveValue("unknown");
    await expect(input).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByRole("grid")).toHaveFocus();
    await expect(canvas.getByRole("gridcell", { name: "B1, Hours: 3" })).toBeVisible();
  },
};

/** Type-specific controls keep their native choice and calendar behavior inside the grid. */
export const TypedEditors: Story = {
  ...Playground,
  tags: ["!manifest"],
  args: { onDraftChange: fn() },
  play: async ({ canvas, canvasElement, args }) => {
    await userEvent.click(canvas.getByRole("gridcell", { name: /^C1, Stage:/ }));
    await userEvent.keyboard("{Enter}");
    const page = within(canvasElement.ownerDocument.body);
    const ready = await page.findByRole("option", { name: "Ready" });
    await interact(() => ready.click());
    await waitFor(() =>
      expect(canvas.getByRole("gridcell", { name: "C1, Stage: Ready" })).toBeVisible(),
    );
    await userEvent.keyboard(arrows(canvasElement).next);
    await interact(() =>
      canvas
        .getByRole("grid")
        .dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await expect(canvas.getByRole("gridcell", { name: "D1, Done: true" })).toBeVisible();
    await userEvent.keyboard(`${arrows(canvasElement).next}{Enter}`);
    const date = canvas.getByRole("textbox", { name: "Edit Target" });
    await userEvent.clear(date);
    await userEvent.type(date, "2026-11-02");
    await expect(args.onDraftChange).toHaveBeenLastCalledWith(true);
    await interact(() =>
      date.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true })),
    );
    const address = canvas.getByRole("textbox", { name: "Go to cell" });
    await userEvent.clear(address);
    await userEvent.type(address, "E1{Enter}");
    await expect(canvas.getByRole("gridcell", { name: "E1, Target: 2026-11-02" })).toBeVisible();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    const invalid = canvas.getByRole("textbox", { name: "Edit Target" });
    await userEvent.clear(invalid);
    await userEvent.type(invalid, "not a date");
    await interact(() =>
      invalid.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await expect(canvas.getByRole("alert")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(args.onDraftChange).toHaveBeenLastCalledWith(false);
    await expect(canvas.getByRole("gridcell", { name: "E2, Target: 2026-10-23" })).toBeVisible();
  },
};

/** A host can translate relative references while Ledger owns range coordinates. */
export const ReferenceTranslation: Story = {
  tags: ["!manifest"],
  args: {
    columns: [{ id: "formula", label: "Formula" }],
    translateInput: fn((value, from, to) =>
      value === "=A1" ? `=A${1 + to.row - from.row}` : value,
    ),
  },
  render: (args) => {
    const [rows, setRows] = useState<SpreadsheetRow[]>([
      { id: "one", values: { formula: "=A1" } },
      { id: "two", values: { formula: "" } },
      { id: "three", values: { formula: "" } },
    ]);
    return (
      <Spreadsheet
        {...args}
        rows={rows}
        onChange={(edits) =>
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
          )
        }
      />
    );
  },
  play: async ({ canvas, args }) => {
    const grid = canvas.getByRole("grid");
    await userEvent.click(canvas.getByRole("gridcell", { name: "A1, Formula: =A1" }));
    const copied = new DataTransfer();
    grid.dispatchEvent(new ClipboardEvent("copy", { bubbles: true, clipboardData: copied }));
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
    await interact(() => canvas.getByRole("button", { name: "Fill down" }).click());
    await expect(canvas.getByRole("gridcell", { name: "A2, Formula: =A2" })).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await interact(() =>
      grid.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: copied })),
    );
    await expect(canvas.getByRole("gridcell", { name: "A3, Formula: =A3" })).toBeVisible();
    await expect(args.translateInput).toHaveBeenCalledWith(
      "=A1",
      { row: 0, column: 0 },
      { row: 2, column: 0 },
    );
  },
};

/** Canonical addresses and formula offsets survive reordered and filtered rows. */
export const CanonicalRows: Story = {
  tags: ["!manifest"],
  args: {
    columns: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    translateInput: fn((value, from, to) =>
      value.replace(
        /^=([A-Z])(\d+)$/,
        (_: string, letter: string, row: string) =>
          `=${String.fromCharCode(letter.charCodeAt(0) + to.column - from.column)}${Number(row) + to.row - from.row}`,
      ),
    ),
  },
  render: (args) => {
    const [rows, setRows] = useState<SpreadsheetRow[]>([
      { id: "eight", rowNumber: 8, values: { a: "=B8", b: "8" } },
      { id: "three", rowNumber: 3, values: { a: "", b: "3" } },
      { id: "twelve", rowNumber: 12, values: { a: "", b: "12" } },
      { id: "fourteen", rowNumber: 14, values: { a: "", b: "14" } },
    ]);
    return (
      <Spreadsheet
        {...args}
        rows={rows}
        onChange={(edits) =>
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
          )
        }
      />
    );
  },
  play: async ({ canvas, canvasElement, args }) => {
    const address = canvas.getByRole("textbox", { name: "Go to cell" });
    const grid = canvas.getByRole("grid");
    await expect(address).toHaveValue("A8");
    await expect(canvas.getByRole("button", { name: /^Select column A$/ })).toHaveTextContent(
      /^A$/,
    );
    await expect(canvas.getByRole("textbox", { name: "Value or formula for A8" })).toHaveValue(
      "=B8",
    );
    await userEvent.click(canvas.getByRole("gridcell", { name: "A8, A: =B8" }));
    await userEvent.keyboard("{Shift>}{ArrowDown}{/Shift}");
    await interact(() => canvas.getByRole("button", { name: "Fill down" }).click());
    await expect(canvas.getByRole("gridcell", { name: "A3, A: =B3" })).toBeVisible();
    await expect(args.translateInput).toHaveBeenCalledWith(
      "=B8",
      { row: 7, column: 0 },
      { row: 2, column: 0 },
    );
    await expect(canvas.getByRole("status")).toHaveTextContent("A8 … A3");
    const copied = new DataTransfer();
    grid.dispatchEvent(new ClipboardEvent("copy", { bubbles: true, clipboardData: copied }));
    await userEvent.clear(address);
    await userEvent.type(address, "A12{Enter}");
    await interact(() =>
      grid.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: copied })),
    );
    await expect(canvas.getByRole("gridcell", { name: "A12, A: =B12" })).toBeVisible();
    await expect(canvas.getByRole("gridcell", { name: "A14, A: =B14" })).toBeVisible();
    await expect(args.translateInput).toHaveBeenCalledWith(
      "=B3",
      { row: 2, column: 0 },
      { row: 13, column: 0 },
    );
    await userEvent.clear(address);
    await userEvent.type(address, "A3{Enter}");
    const three = canvas.getByRole("gridcell", { name: "A3, A: =B3" });
    await expect(three).toHaveAttribute("data-active");
    await expect(three.parentElement).toHaveAttribute("aria-rowindex", "3");
    await expect(address).toHaveValue("A3");
    await userEvent.keyboard(`{Shift>}${arrows(canvasElement).next}{/Shift}`);
    await interact(() => canvas.getByRole("button", { name: "Fill right" }).click());
    await expect(canvas.getByRole("gridcell", { name: "B3, B: =C3" })).toBeVisible();
    await expect(args.translateInput).toHaveBeenCalledWith(
      "=B3",
      { row: 2, column: 0 },
      { row: 2, column: 1 },
    );
    await userEvent.clear(address);
    await userEvent.type(address, "A2{Enter}");
    await expect(canvas.getByRole("alert")).toHaveTextContent("current view");
    await expect(three).toHaveAttribute("data-active");
  },
};

/** A wide active cell begins after the frozen identity, even in a constrained viewport. */
export const FrozenIdentity: Story = {
  tags: ["!manifest"],
  args: {
    readOnly: true,
    columns: [
      { id: "id", label: "Identity", width: 120 },
      { id: "description", label: "Description", width: 640 },
    ],
    rows: [{ id: "one", values: { id: "ROW-01", description: "A long record description" } }],
  },
  play: async ({ canvas }) => {
    const address = canvas.getByRole("textbox", { name: "Go to cell" });
    await userEvent.clear(address);
    await userEvent.type(address, "B1{Enter}");
    const identity = canvas.getByRole("gridcell", { name: "A1, Identity: ROW-01" });
    const selected = canvas.getByRole("gridcell", {
      name: "B1, Description: A long record description",
    });
    if (identity.hasAttribute("data-frozen")) {
      await expect(along(selected).start).toBeGreaterThanOrEqual(along(identity).end - 1);
      await expect(Number(getComputedStyle(selected).zIndex)).toBeLessThan(
        Number(getComputedStyle(identity).zIndex),
      );
    }
  },
};

/** Two axes are windowed while the selected cell stays in the accessibility tree. */
export const LargeSheet: Story = {
  tags: ["!manifest"],
  args: { label: "Large workbook", readOnly: true, freezeFirstRow: true },
  render: (args) => (
    <Spreadsheet
      {...args}
      columns={Array.from({ length: 60 }, (_, index) => ({
        id: `c${index}`,
        label: `Field ${index + 1}`,
        width: 160,
      }))}
      rows={Array.from({ length: 10000 }, (_, index) => ({
        id: `r${index}`,
        values: Object.fromEntries(
          Array.from({ length: 60 }, (_, column) => [
            `c${column}`,
            index === 0 ? `Field ${column + 1}` : `${index + 1}:${column + 1}`,
          ]),
        ),
      }))}
    />
  ),
  play: async ({ canvas }) => {
    const grid = canvas.getByRole("grid");
    await expect(grid).toHaveAttribute("aria-rowcount", "10001");
    await expect(canvas.getAllByRole("gridcell").length).toBeLessThan(500);
    const address = canvas.getByRole("textbox", { name: "Go to cell" });
    await userEvent.clear(address);
    await userEvent.type(address, "BH9999{Enter}");
    await waitFor(() =>
      expect(canvas.getByRole("gridcell", { name: "BH9999, Field 60: 9999:60" })).toHaveAttribute(
        "data-active",
      ),
    );
    await expect(canvas.getAllByRole("gridcell").length).toBeLessThan(500);
    await expect(canvas.getByRole("gridcell", { name: /^A1, Field 1:/ })).toBeInTheDocument();
  },
};

/** Remote awareness is an optional presentation capability; the host owns its transport. */
export const PresenceAndSheets: Story = {
  args: {
    rows: [
      {
        id: "one",
        label: "Package inspection",
        values: { item: "Package inspection", hours: "3" },
      },
      {
        id: "two",
        label: "Independent review",
        values: { item: "Independent review", hours: "5" },
      },
    ],
    presence: [
      {
        id: "avery",
        name: "Avery Chen",
        cell: { rowId: "two", columnId: "hours" },
        tone: "success",
      },
    ],
    sheets: [
      { id: "delivery", label: "Delivery" },
      { id: "analysis", label: "Analysis" },
    ],
    activeSheetId: "delivery",
    onSheetChange: fn(),
    onOpenRow: fn(),
    onAddSheet: fn(),
    readOnly: true,
  },
  play: async ({ canvas, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Avery Chen" }));
    await expect(
      canvas.getByRole("gridcell", { name: /B2, Hours: 5; Avery Chen here/ }),
    ).toHaveAttribute("data-active");
    await userEvent.click(canvas.getByRole("button", { name: "Open record" }));
    await expect(args.onOpenRow).toHaveBeenCalledWith("two");
    await userEvent.click(canvas.getByRole("button", { name: "Analysis" }));
    await expect(args.onSheetChange).toHaveBeenCalledWith("analysis");
    await userEvent.click(canvas.getByRole("button", { name: "Add sheet" }));
    await expect(args.onAddSheet).toHaveBeenCalled();
  },
};

/** An external error retains readable values, and retry belongs to the host. */
export const RefreshFailure: Story = {
  args: {
    rows: [{ id: "one", values: { item: "Last available snapshot", hours: "3" } }],
    readOnly: true,
    error: "Could not refresh the workbook. The previous values are still shown.",
    onRetry: fn(),
  },
  play: async ({ canvas, args }) => {
    await expect(
      canvas.getByRole("gridcell", { name: /^A1, Item: Last available snapshot/ }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};

/** The loading state keeps its shape and never calls an in-flight read an empty sheet. */
export const Loading: Story = {
  args: { pending: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("grid")).toHaveAttribute("aria-busy", "true");
    await expect(canvas.getByText("Loading sheet")).toBeVisible();
  },
};

/** An empty workbook explains how data enters it without inventing a write capability. */
export const EmptySheet: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("This sheet is empty")).toBeVisible();
  },
};

/** At phone width the sheet scrolls in two dimensions while actions and feedback reflow. */
export const Phone: Story = {
  ...Playground,
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  play: async ({ canvas }) => {
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
    await expect(canvas.getByRole("textbox", { name: "Go to cell" })).toBeVisible();
    const grid = canvas.getByRole("grid");
    await expect(grid.scrollWidth).toBeGreaterThan(grid.clientWidth);
    await userEvent.click(canvas.getByRole("gridcell", { name: /^A1, Item:/ }));
    await userEvent.keyboard("{F2}");
    await expect(canvas.getByRole("textbox", { name: "Edit Item" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
  },
};
