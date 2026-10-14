import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "../../components/button";
import {
  Spreadsheet,
  SpreadsheetSheetBar,
  type SpreadsheetProps,
  type SpreadsheetRow,
  type SpreadsheetSelection,
  type SpreadsheetSheet,
} from "../../patterns/spreadsheet";
import { arrows } from "../_lib/direction";
import { interact } from "../_lib/interact";

const rows: SpreadsheetRow[] = [
  {
    id: "first",
    label: "First task",
    rowNumber: 1,
    values: { item: "Prepare", hours: "2", stage: "Planned" },
  },
  {
    id: "second",
    label: "Second task",
    rowNumber: 2,
    values: { item: "Review", hours: "4", stage: "Planned" },
  },
  {
    id: "third",
    label: "Third task",
    rowNumber: 3,
    values: { item: "Publish", hours: "1", stage: "Ready" },
  },
  {
    id: "fourth",
    label: "Fourth task",
    rowNumber: 4,
    values: { item: "Follow up", hours: "3", stage: "Planned" },
  },
];

const meta = {
  title: "Patterns/Spreadsheet interactions",
  component: Spreadsheet,
  tags: ["!manifest"],
  parameters: { layout: "padded" },
  args: {
    label: "Planning workbook",
    columns: [
      { id: "item", label: "Item", width: 180 },
      { id: "hours", label: "Hours", width: 110 },
      { id: "stage", label: "Stage", width: 140 },
    ],
    rows,
  },
} satisfies Meta<typeof Spreadsheet>;
export default meta;
type Story = StoryObj<typeof meta>;

function ControlledGrid(args: SpreadsheetProps) {
  const [data, setData] = useState(args.rows);
  const [selection, setSelection] = useState<SpreadsheetSelection | null>(null);
  const [hiddenRows, setHiddenRows] = useState<readonly string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<readonly string[]>([]);
  const [heights, setHeights] = useState<Readonly<Record<string, number>>>({});
  return (
    <Spreadsheet
      {...args}
      rows={data}
      selection={selection}
      onSelectionChange={setSelection}
      rowHeights={heights}
      onRowHeightsChange={(next) => {
        setHeights(next);
        args.onRowHeightsChange?.(next);
      }}
      hiddenRowIds={hiddenRows}
      onHiddenRowIdsChange={(ids) => {
        setHiddenRows(ids);
        args.onHiddenRowIdsChange?.(ids);
      }}
      hiddenColumnIds={hiddenColumns}
      onHiddenColumnIdsChange={(ids) => {
        setHiddenColumns(ids);
        args.onHiddenColumnIdsChange?.(ids);
      }}
      onChange={(edits) => {
        void args.onChange?.(edits);
        setData((current) =>
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
}

async function closeMenus(document: Document) {
  await waitFor(() =>
    expect(document.querySelector('[data-slot="dropdown-menu-content"]')).not.toBeInTheDocument(),
  );
}

/** Opening inside a selected rectangle retains the range; opening outside chooses one cell. */
export const ContextSelection: Story = {
  args: { onClearFormatting: fn() },
  render: (args) => <ControlledGrid {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("gridcell", { name: "A1, Item: Prepare" }));
    await userEvent.keyboard(`{Shift>}${arrows(canvasElement).next}{ArrowDown}{/Shift}`);
    const selected = canvas.getByRole("gridcell", { name: "B2, Hours: 4" });
    await expect(selected).toHaveAttribute("aria-selected", "true");
    await userEvent.pointer({ target: selected, keys: "[MouseRight]" });
    await userEvent.click(await page.findByRole("menuitem", { name: "Clear formatting" }));
    await expect(args.onClearFormatting).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kind: "cell",
        cell: { rowId: "second", columnId: "hours" },
        rowIds: ["first", "second"],
        columnIds: ["item", "hours"],
      }),
    );
    await expect(canvas.getByRole("gridcell", { name: "A1, Item: Prepare" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await closeMenus(canvasElement.ownerDocument);

    const outside = canvas.getByRole("gridcell", { name: "C3, Stage: Ready" });
    await userEvent.pointer({ target: outside, keys: "[MouseRight]" });
    await userEvent.click(await page.findByRole("menuitem", { name: "Clear formatting" }));
    await expect(args.onClearFormatting).toHaveBeenLastCalledWith(
      expect.objectContaining({ rowIds: ["third"], columnIds: ["stage"] }),
    );
    await closeMenus(canvasElement.ownerDocument);
    await userEvent.click(outside);
    await userEvent.keyboard("{Shift>}{F10}{/Shift}");
    await page.findByRole("menuitem", { name: "Clear values" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(canvas.getByRole("grid")).toHaveFocus());
    await closeMenus(canvasElement.ownerDocument);
  },
};

/** Presentation hiding retains canonical addresses and can be reversed from the menus. */
export const HiddenAddresses: Story = {
  args: { onHiddenRowIdsChange: fn(), onHiddenColumnIdsChange: fn() },
  render: (args) => <ControlledGrid {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Select column B, Hours" }));
    await userEvent.keyboard("{Shift>}{F10}{/Shift}");
    await userEvent.click(await page.findByRole("menuitem", { name: "Hide selected columns" }));
    await expect(args.onHiddenColumnIdsChange).toHaveBeenLastCalledWith(["hours"]);
    await waitFor(() =>
      expect(canvas.queryByRole("gridcell", { name: "B1, Hours: 2" })).not.toBeInTheDocument(),
    );
    await expect(canvas.getByRole("gridcell", { name: "C1, Stage: Planned" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Columns" }));
    await userEvent.click(await page.findByRole("menuitem", { name: "Unhide all columns" }));
    await expect(args.onHiddenColumnIdsChange).toHaveBeenLastCalledWith([]);
    await canvas.findByRole("gridcell", { name: "B1, Hours: 2" });
    await closeMenus(canvasElement.ownerDocument);

    // The heading chevron uses the selected column range, not only its own column.
    const pointer = userEvent.setup();
    await pointer.click(canvas.getByRole("button", { name: "Select column A, Item" }));
    await pointer.keyboard("{Shift>}");
    await pointer.click(canvas.getByRole("button", { name: "Select column B, Hours" }));
    await pointer.keyboard("{/Shift}");
    await expect(canvas.getByRole("gridcell", { name: "A1, Item: Prepare" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(canvas.getByRole("gridcell", { name: "B1, Hours: 2" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Column options for Hours" }));
    await userEvent.click(await page.findByRole("menuitem", { name: "Hide selected columns" }));
    await expect(args.onHiddenColumnIdsChange).toHaveBeenLastCalledWith(["item", "hours"]);
    await waitFor(() =>
      expect(canvas.queryByRole("gridcell", { name: "A1, Item: Prepare" })).not.toBeInTheDocument(),
    );
    await expect(canvas.getByRole("gridcell", { name: "C1, Stage: Planned" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Columns" }));
    await userEvent.click(await page.findByRole("menuitem", { name: "Unhide all columns" }));
    await expect(args.onHiddenColumnIdsChange).toHaveBeenLastCalledWith([]);
    await canvas.findByRole("gridcell", { name: "A1, Item: Prepare" });
    await closeMenus(canvasElement.ownerDocument);

    await userEvent.pointer({
      target: canvas.getByRole("button", { name: "Select row 2, Second task" }),
      keys: "[MouseRight]",
    });
    await userEvent.click(await page.findByRole("menuitem", { name: "Hide selected rows" }));
    await expect(args.onHiddenRowIdsChange).toHaveBeenLastCalledWith(["second"]);
    await waitFor(() =>
      expect(canvas.queryByRole("gridcell", { name: "A2, Item: Review" })).not.toBeInTheDocument(),
    );
    await expect(canvas.getByRole("gridcell", { name: "A3, Item: Publish" })).toBeInTheDocument();
    await userEvent.pointer({
      target: canvas.getByRole("button", { name: "Select row 3, Third task" }),
      keys: "[MouseRight]",
    });
    await userEvent.click(await page.findByRole("menuitem", { name: "Unhide all rows" }));
    await expect(args.onHiddenRowIdsChange).toHaveBeenLastCalledWith([]);
    await canvas.findByRole("gridcell", { name: "A2, Item: Review" });
    await closeMenus(canvasElement.ownerDocument);
  },
};

function ControlledSheets(args: SpreadsheetProps) {
  const [sheets, setSheets] = useState<SpreadsheetSheet[]>([
    { id: "plan", label: "Plan" },
    { id: "archive", label: "Archive" },
    { id: "forecast", label: "Forecast" },
  ]);
  const [active, setActive] = useState("plan");
  return (
    <Spreadsheet
      {...args}
      sheets={sheets}
      activeSheetId={active}
      onSheetChange={setActive}
      getSheetActions={(id) => [
        { id: "rename", label: "Rename" },
        { id: "duplicate", label: "Duplicate" },
        { id: "move-left", label: "Move left", disabled: sheets[0]?.id === id },
        { id: "move-right", label: "Move right", disabled: sheets.at(-1)?.id === id },
        { id: "delete", label: "Delete", destructive: true, disabled: sheets.length <= 1 },
      ]}
      onSheetAction={(id, action) => {
        args.onSheetAction?.(id, action);
        setSheets((current) => {
          const index = current.findIndex((sheet) => sheet.id === id);
          const target = current[index]!;
          if (action === "rename")
            return current.map((sheet) =>
              sheet.id === id ? { ...sheet, label: `${sheet.label} renamed` } : sheet,
            );
          if (action === "duplicate")
            return [...current, { id: `${id}-copy`, label: `${target.label} copy` }];
          if (action === "delete") return current.filter((sheet) => sheet.id !== id);
          const next = [...current];
          next.splice(index, 1);
          next.splice(index + (action === "move-left" ? -1 : 1), 0, target);
          return next;
        });
        if (action === "delete" && active === id) setActive("plan");
      }}
    />
  );
}

/** Context actions target an inactive tab without changing which sheet is being read. */
export const SheetActions: Story = {
  args: { onSheetAction: fn() },
  render: (args) => <ControlledSheets {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.pointer({
      target: canvas.getByRole("button", { name: "Archive" }),
      keys: "[MouseRight]",
    });
    await userEvent.click(await page.findByRole("menuitem", { name: "Rename" }));
    await expect(args.onSheetAction).toHaveBeenLastCalledWith("archive", "rename");
    await canvas.findByRole("button", { name: "Archive renamed" });
    await expect(canvas.getByRole("button", { name: "Plan" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await closeMenus(canvasElement.ownerDocument);
    await userEvent.click(
      canvas.getByRole("button", { name: "Sheet actions for Archive renamed" }),
    );
    await userEvent.click(await page.findByRole("menuitem", { name: "Duplicate" }));
    await expect(args.onSheetAction).toHaveBeenLastCalledWith("archive", "duplicate");
    await canvas.findByRole("button", { name: "Archive renamed copy" });
    await closeMenus(canvasElement.ownerDocument);
    await interact(() => canvas.getByRole("button", { name: "Archive renamed" }).focus());
    await userEvent.keyboard("{Shift>}{F10}{/Shift}");
    await userEvent.click(await page.findByRole("menuitem", { name: "Move left" }));
    await expect(args.onSheetAction).toHaveBeenLastCalledWith("archive", "move-left");
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-slot="spreadsheet-sheets"] button[data-sheet-id]'),
      ).toHaveAttribute("data-sheet-id", "archive"),
    );
    await closeMenus(canvasElement.ownerDocument);
    await userEvent.click(
      canvas.getByRole("button", { name: "Sheet actions for Archive renamed copy" }),
    );
    await userEvent.click(await page.findByRole("menuitem", { name: "Delete" }));
    await expect(args.onSheetAction).toHaveBeenLastCalledWith("archive-copy", "delete");
    await waitFor(() =>
      expect(
        canvas.queryByRole("button", { name: "Archive renamed copy" }),
      ).not.toBeInTheDocument(),
    );
    await closeMenus(canvasElement.ownerDocument);
    await userEvent.click(canvas.getByRole("button", { name: "All sheets" }));
    await userEvent.click(await page.findByRole("menuitemradio", { name: "Forecast" }));
    await expect(canvas.getByRole("button", { name: "Forecast" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    await closeMenus(canvasElement.ownerDocument);
  },
};

/** The host supplies per-cell dropdowns and readable plain comments without changing the column schema. */
export const CellAnnotations: Story = {
  args: {
    onChange: fn(),
    getCellOptions: (cell) =>
      cell.rowId === "second" && cell.columnId === "stage"
        ? [
            { value: "Planned", label: "Planned" },
            { value: "Ready", label: "Ready" },
          ]
        : undefined,
    getCellComment: (cell) =>
      cell.rowId === "second" && cell.columnId === "stage"
        ? "Confirm the reviewer before publishing."
        : undefined,
  },
  render: (args) => <ControlledGrid {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    const noted = canvas.getByRole("gridcell", { name: /^C2, Stage: Planned/ });
    await expect(noted).toHaveAttribute("data-comment", "true");
    await expect(noted).toHaveAttribute(
      "aria-description",
      expect.stringContaining("Confirm the reviewer before publishing."),
    );
    await userEvent.click(noted);
    await userEvent.keyboard("{Enter}");
    await canvas.findByRole("combobox", { name: "Edit Stage" });
    await userEvent.click(await page.findByRole("option", { name: "Ready" }));
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { rowId: "second", columnId: "stage", value: "Ready" },
    ]);
    await canvas.findByRole("gridcell", { name: /^C2, Stage: Ready/ });
    await userEvent.click(canvas.getByRole("gridcell", { name: "C1, Stage: Planned" }));
    await userEvent.keyboard("{Enter}");
    await canvas.findByRole("textbox", { name: "Edit Stage" });
    await userEvent.keyboard("{Escape}");
    await closeMenus(canvasElement.ownerDocument);
  },
};

/** The footer also works as a controlled standalone navigator outside a grid view. */
export const SheetNavigation: Story = {
  args: { onSheetChange: fn(), onAddSheet: fn(), onAddRows: fn(), onAddColumns: fn() },
  render: (args) => {
    const [sheets, setSheets] = useState<SpreadsheetSheet[]>([
      { id: "plan", label: "Plan" },
      { id: "review", label: "Review" },
      { id: "forecast", label: "Forecast" },
    ]);
    const [active, setActive] = useState("plan");
    const [rowCount, setRowCount] = useState(6);
    const [columnCount, setColumnCount] = useState(3);
    return (
      <SpreadsheetSheetBar
        sheets={sheets}
        activeSheetId={active}
        rowCount={rowCount}
        columnCount={columnCount}
        onSheetChange={(id) => {
          setActive(id);
          args.onSheetChange?.(id);
        }}
        onAddSheet={() => {
          const added = { id: `sheet-${sheets.length + 1}`, label: `Sheet ${sheets.length + 1}` };
          setSheets((current) => [...current, added]);
          setActive(added.id);
          args.onAddSheet?.();
        }}
        onAddRows={() => {
          setRowCount((count) => count + 1);
          args.onAddRows?.();
        }}
        onAddColumns={() => {
          setColumnCount((count) => count + 1);
          args.onAddColumns?.();
        }}
      />
    );
  },
  play: async ({ canvas, canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByRole("group", { name: "Workbook sheets" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Review" }));
    await expect(args.onSheetChange).toHaveBeenLastCalledWith("review");
    await expect(canvas.getByRole("button", { name: "Review" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "All sheets" }));
    await userEvent.click(await page.findByRole("menuitemradio", { name: "Forecast" }));
    await expect(args.onSheetChange).toHaveBeenLastCalledWith("forecast");
    await userEvent.keyboard("{Escape}");
    await closeMenus(canvasElement.ownerDocument);
    await userEvent.click(canvas.getByRole("button", { name: "Add sheet" }));
    await expect(args.onAddSheet).toHaveBeenCalledOnce();
    await expect(canvas.getByRole("button", { name: "Sheet 4" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Add rows" }));
    await expect(args.onAddRows).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: "Add columns" }));
    await expect(args.onAddColumns).toHaveBeenCalledOnce();
    await expect(canvas.getByText("7 rows × 4 columns")).toBeInTheDocument();
  },
};

/** Navigation stays available when long tabs and sheet tools need independent scrolling. */
export const SheetOverflow: Story = {
  args: { onSheetChange: fn(), onSheetAction: fn(), onAddSheet: fn(), onAddRows: fn() },
  render: (args) => {
    const [sheets, setSheets] = useState<SpreadsheetSheet[]>([
      { id: "source", label: "Source records" },
      { id: "locked", label: "Approved baseline" },
      ...Array.from({ length: 7 }, (_, index) => ({
        id: `analysis-${index + 1}`,
        label: `Analysis ${index + 1} planning scenario`,
      })),
    ]);
    const [active, setActive] = useState("source");
    return (
      <SpreadsheetSheetBar
        sheets={sheets}
        activeSheetId={active}
        rowCount={1250}
        columnCount={18}
        status="3 selected · Sum 42"
        onSheetChange={(id) => {
          setActive(id);
          args.onSheetChange?.(id);
        }}
        onAddSheet={() => {
          const sheet = { id: `added-${sheets.length}`, label: `New sheet ${sheets.length}` };
          setSheets((current) => [...current, sheet]);
          setActive(sheet.id);
          args.onAddSheet?.();
        }}
        onAddRows={args.onAddRows}
        getSheetActions={(id) =>
          id === "source" ? [] : [{ id: "rename", label: "Rename", disabled: id === "locked" }]
        }
        onSheetAction={(id, action) => {
          args.onSheetAction?.(id, action);
          if (action === "rename") {
            setSheets((current) =>
              current.map((sheet) =>
                sheet.id === id ? { ...sheet, label: `${sheet.label} renamed` } : sheet,
              ),
            );
          }
        }}
      />
    );
  },
  play: async ({ canvas, canvasElement, args }) => {
    const user = userEvent.setup();
    const page = within(canvasElement.ownerDocument.body);
    const add = canvas.getByRole("button", { name: "Add sheet" });
    const picker = canvas.getByRole("button", { name: "All sheets" });
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="spreadsheet-sheet-bar"]')!;
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-sheet-lane="tabs"] [data-slot="scroller-viewport"]',
    )!;
    const pinned = add.getBoundingClientRect();
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    await user.dblClick(canvas.getByRole("button", { name: "Source records" }));
    await user.dblClick(canvas.getByRole("button", { name: "Approved baseline" }));
    await expect(args.onSheetAction).not.toHaveBeenCalled();

    await user.click(picker);
    await user.click(
      await page.findByRole("menuitemradio", { name: "Analysis 7 planning scenario" }),
    );
    await user.keyboard("{Escape}");
    await closeMenus(canvasElement.ownerDocument);
    const last = canvas.getByRole("button", { name: "Analysis 7 planning scenario" });
    await expect(last).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      const tab = last.getBoundingClientRect();
      const frame = viewport.getBoundingClientRect();
      expect(tab.left).toBeGreaterThanOrEqual(frame.left - 1);
      expect(tab.right).toBeLessThanOrEqual(frame.right + 1);
    });
    await expect(add.getBoundingClientRect().left).toBeCloseTo(pinned.left, 0);
    await expect(add.getBoundingClientRect().top).toBeCloseTo(pinned.top, 0);
    await expect(picker.getBoundingClientRect().right).toBeLessThanOrEqual(
      bar.getBoundingClientRect().right + 1,
    );

    await interact(() => last.focus());
    await user.keyboard("{Home}");
    const first = canvas.getByRole("button", { name: "Source records" });
    await expect(first).toHaveFocus();
    await expect(last).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{End}");
    await expect(last).toHaveFocus();
    await user.dblClick(last);
    await expect(args.onSheetAction).toHaveBeenCalledOnce();
    await expect(args.onSheetAction).toHaveBeenLastCalledWith("analysis-7", "rename");
    const renamed = canvas.getByRole("button", { name: "Analysis 7 planning scenario renamed" });
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await page.findByRole("menuitem", { name: "Rename" });
    await user.keyboard("{Escape}");
    await closeMenus(canvasElement.ownerDocument);
    await expect(renamed).toHaveFocus();
    await user.click(add);
    await expect(args.onAddSheet).toHaveBeenCalledOnce();
    await expect(canvas.getByRole("button", { name: "New sheet 9" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(canvas.getByRole("button", { name: "Add rows" }));
    await expect(args.onAddRows).toHaveBeenCalledOnce();
    await expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth + 1);
    await expect(bar.getBoundingClientRect().height).toBeLessThanOrEqual(100);
  },
};

/** Drag and keyboard sizing apply to selected rows, commit once, and can return to automatic height. */
export const RowSizing: Story = {
  args: { onRowHeightsChange: fn() },
  render: (args) => <ControlledGrid {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    const pointer = userEvent.setup();
    const cell = (row: number) =>
      canvas.getByRole("gridcell", { name: new RegExp(`^A${row}, Item:`) });
    const height = (row: number) => cell(row).getBoundingClientRect().height;
    await pointer.click(canvas.getByRole("button", { name: "Select row 1, First task" }));
    await pointer.keyboard("{Shift>}");
    await pointer.click(canvas.getByRole("button", { name: "Select row 2, Second task" }));
    await pointer.keyboard("{/Shift}");
    await expect(cell(1)).toHaveAttribute("aria-selected", "true");
    await expect(cell(2)).toHaveAttribute("aria-selected", "true");
    const divider = canvas.getByRole("separator", { name: "Resize row 2" });
    const bounds = divider.getBoundingClientRect();
    const start = {
      clientX: bounds.left + bounds.width / 2,
      clientY: bounds.top + bounds.height / 2,
    };
    const initial = height(2);
    await pointer.pointer({ target: divider, keys: "[MouseLeft>]", coords: start });
    await pointer.pointer({ target: divider, coords: { ...start, clientY: start.clientY + 24 } });
    await expect(args.onRowHeightsChange).not.toHaveBeenCalled();
    await pointer.pointer({ keys: "[/MouseLeft]" });
    await expect(args.onRowHeightsChange).toHaveBeenCalledOnce();
    await expect(args.onRowHeightsChange).toHaveBeenLastCalledWith({
      first: initial + 24,
      second: initial + 24,
    });
    await waitFor(() => expect(height(1)).toBe(initial + 24));
    await expect(height(2)).toBe(initial + 24);

    const firstDivider = canvas.getByRole("separator", { name: "Resize row 1" });
    await interact(() => firstDivider.focus());
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(height(1)).toBe(initial + 32));
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    await waitFor(() => expect(height(1)).toBe(initial));
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(height(1)).toBe(240));
    await userEvent.dblClick(firstDivider);
    await waitFor(() => expect(height(1)).toBeLessThan(240));

    await userEvent.click(cell(1));
    const beforeShortcut = height(1);
    await userEvent.keyboard("{Alt>}{Shift>}{ArrowDown}{/Shift}{/Alt}");
    await waitFor(() => expect(height(1)).toBe(beforeShortcut + 8));
    await pointer.click(canvas.getByRole("button", { name: "Select row 1, First task" }));
    await pointer.keyboard("{Shift>}");
    await pointer.click(canvas.getByRole("button", { name: "Select row 2, Second task" }));
    await pointer.keyboard("{/Shift}");
    await pointer.pointer({
      target: canvas.getByRole("button", { name: "Select row 2, Second task" }),
      keys: "[MouseRight]",
    });
    await userEvent.click(await page.findByRole("menuitem", { name: "Automatic row height" }));
    await expect(args.onRowHeightsChange).toHaveBeenLastCalledWith({});
    await waitFor(() => expect(height(1)).toBe(initial));
    await expect(height(2)).toBe(initial);
    await closeMenus(canvasElement.ownerDocument);
  },
};

const wrappedNarrative =
  "The reviewer checks each recorded decision and its supporting material before publication. The complete explanation must remain readable when the cell wraps or its type size changes.";

/** Automatic rows follow real wrapped typography; explicit sizes stay fixed until automatic sizing is restored. */
export const AutomaticWrapping: Story = {
  args: {
    columns: [
      { id: "item", label: "Notes", width: 220 },
      { id: "stage", label: "Stage", width: 140 },
    ],
    rows: [
      {
        id: "first",
        label: "Narrative",
        rowNumber: 1,
        values: { item: wrappedNarrative, stage: "Review" },
      },
      {
        id: "second",
        label: "Short note",
        rowNumber: 2,
        values: { item: "Ready", stage: "Ready" },
      },
    ],
    onRowHeightsChange: fn(),
  },
  render: (args) => {
    const [wrap, setWrap] = useState(false);
    const [large, setLarge] = useState(false);
    return (
      <ControlledGrid
        {...args}
        getCellStyle={(cell) =>
          cell.rowId === "first" && cell.columnId === "item"
            ? { wrap, fontFamily: "Georgia", fontSize: large ? 24 : 12, verticalAlign: "bottom" }
            : undefined
        }
        toolbarStart={
          <>
            <Button size="small" isSelected={wrap} onClick={() => setWrap((value) => !value)}>
              Wrap prose
            </Button>
            <Button size="small" isSelected={large} onClick={() => setLarge((value) => !value)}>
              Large type
            </Button>
          </>
        }
      />
    );
  },
  play: async ({ canvas, canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    const narrative = canvas.getByRole("gridcell", { name: /^A1, Notes:/ });
    const short = canvas.getByRole("gridcell", { name: "A2, Notes: Ready" });
    const height = () => narrative.getBoundingClientRect().height;
    const initial = height();
    await userEvent.click(canvas.getByRole("button", { name: "Wrap prose" }));
    await waitFor(() => expect(height()).toBeGreaterThan(initial));
    const wrapped = height();
    await expect(narrative.scrollHeight).toBeLessThanOrEqual(narrative.clientHeight + 1);
    await expect(short.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      narrative.getBoundingClientRect().bottom - 1,
    );
    await userEvent.click(canvas.getByRole("button", { name: "Large type" }));
    await waitFor(() => expect(height()).toBeGreaterThan(wrapped));
    await expect(getComputedStyle(narrative).fontSize).toBe("32px");
    await expect(getComputedStyle(narrative).alignItems).toBe("flex-end");
    const automatic = height();
    await userEvent.pointer({
      target: canvas.getByRole("button", { name: "Select row 1, Narrative" }),
      keys: "[MouseRight]",
    });
    await userEvent.click(await page.findByRole("menuitem", { name: "Row height…" }));
    const dialog = await page.findByRole("dialog", { name: "Row height" });
    const size = within(dialog).getByRole("spinbutton", { name: "Height in pixels" });
    await userEvent.clear(size);
    await userEvent.type(size, "64");
    await userEvent.click(within(dialog).getByRole("button", { name: "Apply size" }));
    await waitFor(() => expect(height()).toBe(64));
    await expect(args.onRowHeightsChange).toHaveBeenLastCalledWith({ first: 64 });
    await userEvent.pointer({
      target: canvas.getByRole("button", { name: "Select row 1, Narrative" }),
      keys: "[MouseRight]",
    });
    await userEvent.click(await page.findByRole("menuitem", { name: "Fit to data" }));
    await waitFor(() => expect(height()).toBe(Math.min(240, automatic)));
    await userEvent.pointer({
      target: canvas.getByRole("button", { name: "Select row 1, Narrative" }),
      keys: "[MouseRight]",
    });
    await userEvent.click(await page.findByRole("menuitem", { name: "Automatic row height" }));
    await expect(args.onRowHeightsChange).toHaveBeenLastCalledWith({});
    await waitFor(() => expect(height()).toBe(automatic));
    await closeMenus(canvasElement.ownerDocument);
    // Selecting the wrapped cell mounts its fill handle; the hit target must not enlarge the row.
    await userEvent.click(narrative);
    const handle = canvas.getByRole("button", { name: "Drag to fill selection" });
    await expect(handle).toBeInTheDocument();
    await expect(handle.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      narrative.getBoundingClientRect().bottom,
    );
    await expect(narrative.scrollHeight).toBeLessThanOrEqual(narrative.clientHeight + 1);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

/** An explicit short row clips oversized single-line type inside its cell instead of painting over its neighbour. */
export const ClippedTypography: Story = {
  args: {
    columns: [{ id: "item", label: "Notes", width: 220 }],
    rows: [
      { id: "first", rowNumber: 1, values: { item: "Oversized title" } },
      { id: "second", rowNumber: 2, values: { item: "Adjacent row stays readable" } },
    ],
    rowHeights: { first: 24, second: 48 },
    readOnly: true,
    getCellStyle: (cell) =>
      cell.rowId === "first" ? { fontSize: 72, wrap: false, verticalAlign: "bottom" } : undefined,
  },
  play: async ({ canvas }) => {
    const first = canvas.getByRole("gridcell", { name: "A1, Notes: Oversized title" });
    const second = canvas.getByRole("gridcell", { name: "A2, Notes: Adjacent row stays readable" });
    await expect(first.getBoundingClientRect().height).toBe(24);
    const content = first.querySelector('[data-slot="truncate"]')!;
    const cellBox = first.getBoundingClientRect();
    const contentBox = content.getBoundingClientRect();
    const contentFits = contentBox.top >= cellBox.top && contentBox.bottom <= cellBox.bottom;
    const cellClips = ["hidden", "clip"].includes(getComputedStyle(first).overflowY);
    await expect(contentFits || cellClips).toBe(true);
    await expect(second.getBoundingClientRect().top).toBeGreaterThanOrEqual(cellBox.bottom);
    await userEvent.click(first);
    await userEvent.keyboard("{ArrowDown}");
    await expect(second).toHaveAttribute("data-active");
  },
};

/** A block fills through its corner handle as one batch, with canonical relative references. */
export const DragFill: Story = {
  args: {
    columns: [{ id: "formula", label: "Formula", width: 180 }],
    rows: [
      { id: "r1", rowNumber: 1, values: { formula: "=B1*2" } },
      { id: "r2", rowNumber: 2, values: { formula: "=B2*2" } },
      { id: "r3", rowNumber: 3, values: { formula: "" } },
      { id: "r4", rowNumber: 4, values: { formula: "" } },
      { id: "r5", rowNumber: 5, values: { formula: "" } },
    ],
    translateInput: (value, from, to) =>
      value.replace(/B(\d+)/g, (_, row) => `B${Number(row) + to.row - from.row}`),
    onChange: fn(),
  },
  render: (args) => <ControlledGrid {...args} />,
  play: async ({ canvas, args }) => {
    const user = userEvent.setup();
    const cell = (row: number) =>
      canvas.getByRole("gridcell", { name: new RegExp(`^A${row}, Formula:`) });
    await user.click(cell(1));
    await user.keyboard("{Shift>}");
    await user.click(cell(2));
    await user.keyboard("{/Shift}");
    const handle = canvas.getByRole("button", { name: "Drag to fill selection" });
    const handleBox = handle.getBoundingClientRect();
    const targetBox = cell(4).getBoundingClientRect();
    await user.pointer({
      target: handle,
      keys: "[MouseLeft>]",
      coords: {
        clientX: handleBox.left + handleBox.width / 2,
        clientY: handleBox.top + handleBox.height / 2,
      },
    });
    await user.pointer({
      target: cell(4),
      coords: {
        clientX: targetBox.left + targetBox.width / 2,
        clientY: targetBox.top + targetBox.height / 2,
      },
    });
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(cell(4)).toHaveAttribute("data-fill-preview");
    await user.pointer({ keys: "[/MouseLeft]" });
    await waitFor(() => expect(args.onChange).toHaveBeenCalledOnce());
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { rowId: "r3", columnId: "formula", value: "=B3*2" },
      { rowId: "r4", columnId: "formula", value: "=B4*2" },
    ]);
    await expect(cell(1)).toHaveAccessibleName("A1, Formula: =B1*2");
    await expect(cell(2)).toHaveAccessibleName("A2, Formula: =B2*2");
    await expect(cell(3)).toHaveAccessibleName("A3, Formula: =B3*2");
    await expect(cell(4)).toHaveAccessibleName("A4, Formula: =B4*2");
    for (const row of [1, 2, 3, 4])
      await expect(cell(row)).toHaveAttribute("aria-selected", "true");

    await user.click(cell(1));
    const again = canvas.getByRole("button", { name: "Drag to fill selection" });
    const start = again.getBoundingClientRect();
    await user.pointer({
      target: again,
      keys: "[MouseLeft>]",
      coords: { clientX: start.left + start.width / 2, clientY: start.top + start.height / 2 },
    });
    await user.pointer({
      target: cell(5),
      coords: {
        clientX: targetBox.left + targetBox.width / 2,
        clientY: cell(5).getBoundingClientRect().top + 12,
      },
    });
    await user.keyboard("{Escape}");
    await user.pointer({ keys: "[/MouseLeft]" });
    await expect(args.onChange).toHaveBeenCalledOnce();
    await expect(cell(5)).not.toHaveAttribute("data-fill-preview");
    await expect(cell(5)).toHaveAccessibleName("A5, Formula: Empty");
    await expect(cell(3)).toHaveAccessibleName("A3, Formula: =B3*2");
    await expect(cell(4)).toHaveAccessibleName("A4, Formula: =B4*2");
    await user.dblClick(canvas.getByRole("button", { name: "Drag to fill selection" }));
    await expect(cell(1).querySelector("input,textarea")).toBeNull();
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};

/** Filling a protected destination refuses the entire gesture; the writable cells stay unchanged. */
export const ProtectedFill: Story = {
  args: {
    columns: [{ id: "value", label: "Value", width: 180 }],
    rows: [
      { id: "r1", rowNumber: 1, values: { value: "Seed" } },
      { id: "r2", rowNumber: 2, values: { value: "Keep" } },
      { id: "r3", rowNumber: 3, values: { value: "Locked" } },
    ],
    isCellReadOnly: (cell) => cell.rowId === "r3",
    onChange: fn(),
  },
  render: (args) => <ControlledGrid {...args} />,
  play: async ({ canvas, args }) => {
    const user = userEvent.setup();
    const source = canvas.getByRole("gridcell", { name: "A1, Value: Seed" });
    const target = canvas.getByRole("gridcell", { name: "A3, Value: Locked" });
    await user.click(source);
    const handle = canvas.getByRole("button", { name: "Drag to fill selection" });
    const start = handle.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    await user.pointer({
      target: handle,
      keys: "[MouseLeft>]",
      coords: { clientX: start.left + start.width / 2, clientY: start.top + start.height / 2 },
    });
    await user.pointer({ target, coords: { clientX: end.left + 30, clientY: end.top + 12 } });
    await user.pointer({ keys: "[/MouseLeft]" });
    await expect(
      await canvas.findByText("The fill range includes a read-only cell. No cells were changed."),
    ).toBeVisible();
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(source).toHaveAccessibleName("A1, Value: Seed");
    await expect(canvas.getByRole("gridcell", { name: "A2, Value: Keep" })).toBeVisible();
    await expect(target).toHaveAccessibleName("A3, Value: Locked");
  },
};

/** Header drag selects entire columns; resizing previews locally and creates one undo transaction. */
export const HeaderGestures: Story = {
  args: {
    columns: [
      { id: "item", label: "Item", width: 104 },
      { id: "hours", label: "Hours", width: 104 },
    ],
    onColumnWidthsChange: fn(),
  },
  render: (args) => <ControlledGrid {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const page = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup();
    const first = canvas.getByRole("button", { name: "Select column A, Item" });
    const second = canvas.getByRole("button", { name: "Select column B, Hours" });
    const firstBox = first.getBoundingClientRect();
    const secondBox = second.getBoundingClientRect();
    await user.pointer({
      target: first,
      keys: "[MouseLeft>]",
      coords: { clientX: firstBox.left + 24, clientY: firstBox.top + 12 },
    });
    await user.pointer({
      target: second,
      coords: { clientX: secondBox.left + 24, clientY: secondBox.top + 12 },
    });
    await user.pointer({ keys: "[/MouseLeft]" });
    const a1 = canvas.getByRole("gridcell", { name: "A1, Item: Prepare" });
    const b4 = canvas.getByRole("gridcell", { name: "B4, Hours: 3" });
    await expect(a1).toHaveAttribute("aria-selected", "true");
    await expect(b4).toHaveAttribute("aria-selected", "true");
    const divider = canvas.getByRole("separator", { name: "Resize Hours" });
    const dividerBox = divider.getBoundingClientRect();
    const start = {
      clientX: dividerBox.left + dividerBox.width / 2,
      clientY: dividerBox.top + dividerBox.height / 2,
    };
    const direction = getComputedStyle(first).direction === "rtl" ? -1 : 1;
    await user.pointer({ target: divider, keys: "[MouseLeft>]", coords: start });
    await user.pointer({
      target: divider,
      coords: { ...start, clientX: start.clientX + direction * 24 },
    });
    await expect(args.onColumnWidthsChange).not.toHaveBeenCalled();
    await user.pointer({ keys: "[/MouseLeft]" });
    await expect(args.onColumnWidthsChange).toHaveBeenCalledOnce();
    await expect(args.onColumnWidthsChange).toHaveBeenLastCalledWith({ item: 128, hours: 128 });
    await waitFor(() => expect(a1.getBoundingClientRect().width).toBe(128));
    await expect(b4.getBoundingClientRect().width).toBe(128);
    await user.pointer({ target: divider, keys: "[MouseLeft>]", coords: start });
    await user.pointer({
      target: divider,
      coords: { ...start, clientX: start.clientX + direction * 32 },
    });
    await user.keyboard("{Escape}");
    await user.pointer({ keys: "[/MouseLeft]" });
    await expect(args.onColumnWidthsChange).toHaveBeenCalledOnce();
    await expect(a1.getBoundingClientRect().width).toBe(128);

    await user.click(a1);
    const heading = first.getBoundingClientRect();
    await user.pointer({
      target: first,
      keys: "[MouseLeft>]",
      coords: { clientX: heading.left + 24, clientY: heading.top + 12 },
    });
    await user.pointer({
      target: second,
      coords: { clientX: second.getBoundingClientRect().left + 24, clientY: heading.top + 12 },
    });
    await user.keyboard("{Escape}");
    await user.pointer({ keys: "[/MouseLeft]" });
    await expect(a1).toHaveAttribute("aria-selected", "true");
    await expect(b4).not.toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await expect(
      await page.findByRole("menu", { name: "Planning workbook cell actions" }),
    ).toBeVisible();
    await expect(page.queryByRole("menuitem", { name: "Column width…" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    await closeMenus(canvasElement.ownerDocument);
  },
};

/** Workbook fill shortcuts suppress browser defaults and submit one translated batch per command. */
export const FillShortcuts: Story = {
  args: {
    columns: [
      { id: "a", label: "First", width: 110 },
      { id: "b", label: "Second", width: 110 },
    ],
    rows: [
      { id: "r1", rowNumber: 1, values: { a: "=C1*2", b: "" } },
      { id: "r2", rowNumber: 2, values: { a: "", b: "" } },
      { id: "r3", rowNumber: 3, values: { a: "", b: "" } },
    ],
    translateInput: (value, from, to) =>
      value.replace(
        /([CD])(\d+)/g,
        (_, column, row) =>
          `${String.fromCharCode(column.charCodeAt(0) + to.column - from.column)}${Number(row) + to.row - from.row}`,
      ),
    onChange: fn(),
  },
  render: (args) => <ControlledGrid {...args} />,
  play: async ({ canvas, canvasElement, args }) => {
    const user = userEvent.setup();
    const grid = canvas.getByRole("grid", { name: "Planning workbook" });
    await user.click(canvas.getByRole("gridcell", { name: "A1, First: =C1*2" }));
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}");
    const down = new KeyboardEvent("keydown", {
      key: "d",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    await interact(() => {
      grid.dispatchEvent(down);
    });
    await expect(down.defaultPrevented).toBe(true);
    await waitFor(() => expect(args.onChange).toHaveBeenCalledOnce());
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { rowId: "r2", columnId: "a", value: "=C2*2" },
      { rowId: "r3", columnId: "a", value: "=C3*2" },
    ]);
    await user.keyboard(`{Shift>}${arrows(canvasElement).next}{/Shift}`);
    const right = new KeyboardEvent("keydown", {
      key: "r",
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    await interact(() => {
      grid.dispatchEvent(right);
    });
    await expect(right.defaultPrevented).toBe(true);
    await waitFor(() => expect(args.onChange).toHaveBeenCalledTimes(2));
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { rowId: "r1", columnId: "b", value: "=D1*2" },
      { rowId: "r2", columnId: "b", value: "=D2*2" },
      { rowId: "r3", columnId: "b", value: "=D3*2" },
    ]);
    await expect(canvas.getByRole("gridcell", { name: "B3, Second: =D3*2" })).toBeVisible();
  },
};

/** Literal formula-shaped inputs survive the real clipboard and fill path beside genuine formulas. */
export const LiteralClipboard: Story = {
  args: {
    columns: [
      { id: "a", label: "Literal", width: 130 },
      { id: "b", label: "Formula", width: 130 },
    ],
    rows: [
      { id: "r1", rowNumber: 1, values: { a: "=1+1", b: "=C1" } },
      { id: "r2", rowNumber: 2, values: { a: "", b: "" } },
      { id: "r3", rowNumber: 3, values: { a: "", b: "" } },
    ],
    isCellLiteral: (cell) => cell.rowId === "r1" && cell.columnId === "a",
    displayValue: (_cell, value) => (value.startsWith("'") ? value.slice(1) : value),
    translateInput: (value, from, to) =>
      value.replace(/C(\d+)/g, (_, row) => `C${Number(row) + to.row - from.row}`),
    onChange: fn(),
  },
  render: (args) => <ControlledGrid {...args} />,
  play: async ({ canvas, args }) => {
    const user = userEvent.setup();
    const grid = canvas.getByRole("grid", { name: "Planning workbook" });
    const cell = (address: string) =>
      canvas.getByRole("gridcell", { name: new RegExp(`^${address},`) });
    await user.click(cell("A1"));
    await user.keyboard("{Shift>}");
    await user.click(cell("B1"));
    await user.keyboard("{/Shift}");
    const clipboard = new DataTransfer();
    await interact(() => {
      grid.dispatchEvent(new ClipboardEvent("copy", { bubbles: true, clipboardData: clipboard }));
    });
    await expect(clipboard.getData("text/plain")).toBe("=1+1\t=C1");
    await user.click(cell("A2"));
    await interact(() => {
      grid.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: clipboard }));
    });
    await waitFor(() => expect(args.onChange).toHaveBeenCalledOnce());
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { rowId: "r2", columnId: "a", value: "'=1+1" },
      { rowId: "r2", columnId: "b", value: "=C2" },
    ]);
    await expect(cell("A2")).toHaveAccessibleName("A2, Literal: =1+1");
    await expect(cell("B2")).toHaveAccessibleName("B2, Formula: =C2");
    await user.click(cell("A1"));
    await user.keyboard("{Shift>}");
    await user.click(cell("B3"));
    await user.keyboard("{/Shift}{Control>}d{/Control}");
    await waitFor(() => expect(args.onChange).toHaveBeenCalledTimes(2));
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { rowId: "r3", columnId: "a", value: "'=1+1" },
      { rowId: "r3", columnId: "b", value: "=C3" },
    ]);
    await expect(cell("A1")).toHaveAccessibleName("A1, Literal: =1+1");
    await expect(cell("A3")).toHaveAccessibleName("A3, Literal: =1+1");
  },
};
