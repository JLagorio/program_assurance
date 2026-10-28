import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  Stack,
  Text,
} from "../..";
const meta = {
  title: "Components/ContextMenu",
  component: ContextMenu,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ContextMenu>;
export default meta;
type Story = StoryObj;
export const Actions: Story = {
  render: function Actions() {
    const [result, setResult] = useState("No action");
    const [wrap, setWrap] = useState(false);
    return (
      <Stack>
        <ContextMenu>
          <ContextMenuTrigger
            aria-label="Document actions"
            className="rounded-medium border border-default p-200 focus-visible:outline-field-focused"
          >
            Right-click, long-press or press Shift+F10 here.
          </ContextMenuTrigger>
          <ContextMenuContent aria-label="Document actions">
            <DropdownMenuItem shortcut="Mod+C" onClick={() => setResult("Copied")}>
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem disabledReason="Select an editable value first">
              Clear
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem checked={wrap} onCheckedChange={setWrap}>
              Wrap text
            </DropdownMenuCheckboxItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Alignment</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setResult("Aligned to start")}>
                  Start
                </DropdownMenuItem>
                <DropdownMenuItem>Center</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">Delete</DropdownMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <Text role="status">
          {result}
          {wrap ? " · wrapped" : ""}
        </Text>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const target = canvas.getByLabelText("Document actions");
    target.focus();
    await userEvent.keyboard("{Shift>}{F10}{/Shift}");
    const menu = await page.findByRole("menu", { name: "Document actions" });
    await expect(within(menu).getByRole("menuitem", { name: "Clear" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(within(menu).getByRole("menuitem", { name: "Clear" })).toHaveAccessibleDescription(
      "Select an editable value first",
    );
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Copy" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Copied");
    const box = target.getBoundingClientRect();
    fireEvent.contextMenu(target, { clientX: box.x + 10, clientY: box.y + 10 });
    await userEvent.click(await page.findByRole("menuitemcheckbox", { name: "Wrap text" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("menu")).not.toBeInTheDocument());
    await expect(canvas.getByRole("status")).toHaveTextContent("wrapped");
  },
};
export const LongLabels: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="p-200" aria-label="Item actions">
        Item actions
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="Item actions">
        <DropdownMenuItem>
          An unusually long action label that must remain readable in a constrained work area
        </DropdownMenuItem>
        <DropdownMenuItem disabledReason="This record is unavailable while its current changes are being saved. Please try again after the save completes.">
          Update
        </DropdownMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByLabelText("Item actions");
    const box = trigger.getBoundingClientRect();
    fireEvent.contextMenu(trigger, { clientX: box.x + 8, clientY: box.y + 8 });
    const menu = await within(canvasElement.ownerDocument.body).findByRole("menu");
    await waitFor(() => expect(menu).toBeVisible());
  },
};
