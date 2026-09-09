import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontal, Pencil } from "lucide-react";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  IconButton,
  Kbd,
} from "../../components";

import { menuSurface } from "../../components/menu";
import { LedgerProvider } from "../../lib/locale";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DropdownMenu>;
export default meta;
type Story = StoryObj<typeof meta>;
const triggerRef = createRef<HTMLButtonElement>();
const renderedRef = createRef<HTMLButtonElement>();
const popupRef = createRef<HTMLDivElement>();
const itemRef = createRef<HTMLDivElement>();
const edit = fn();
const renderedEdit = fn();
const disabledAction = fn();
const changed = fn();

/** Native render composition, grouped actions, shortcuts and disabled keyboard behavior. */
export const DropdownMenuMatrix: Story = {
  name: "Actions",
  render: () => (
    <DropdownMenu onOpenChange={changed}>
      <DropdownMenuTrigger
        ref={triggerRef}
        render={<Button ref={renderedRef} variant="secondary" />}
      >
        Actions
      </DropdownMenuTrigger>
      <DropdownMenuContent
        ref={popupRef}
        style={(state) => ({ width: 240, outlineOffset: state.open ? 4 : 0 })}
        className={(state) => (state.open ? "font-medium" : "font-regular")}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Record</DropdownMenuLabel>
          <DropdownMenuItem
            ref={itemRef}
            onClick={edit}
            render={<div onClick={renderedEdit} className="tabular-nums" />}
          >
            <Pencil aria-hidden />
            Edit
            <DropdownMenuShortcut>
              <Kbd>E</Kbd>
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem disabled onClick={disabledAction}>
            Reassign
          </DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Archive</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument,
      canvas = within(canvasElement),
      page = within(doc.body);
    const user = userEvent.setup({ document: doc });
    edit.mockClear();
    renderedEdit.mockClear();
    disabledAction.mockClear();
    changed.mockClear();
    const trigger = canvas.getByRole("button", { name: "Actions" });
    await expect(triggerRef.current).toBe(trigger);
    await expect(renderedRef.current).toBe(trigger);
    await expect(trigger).toHaveAttribute("type", "button");
    // Built Storybook can start playback before Base UI attaches native keyboard listeners.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const menu = await page.findByRole("menu");
    await waitFor(() => expect(menu).toBeVisible());
    const first = page.getByRole("menuitem", { name: "Edit E" });
    await expect(popupRef.current).toBe(menu);
    await expect(menu).toHaveClass("font-medium");
    await expect(menu).toHaveStyle({ width: "240px", outlineOffset: "4px" });
    await expect(itemRef.current).toBe(first);
    await expect(first).toHaveClass("tabular-nums");
    await expect(canvasElement).not.toContainElement(menu);
    await expect(page.getByRole("group", { name: "Record" })).toContainElement(first);
    await waitFor(() => expect(first).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    const disabled = page.getByRole("menuitem", { name: "Reassign" });
    await expect(disabled).toHaveFocus();
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{Enter}");
    await expect(disabledAction).not.toHaveBeenCalled();
    await expect(menu).toBeVisible();
    await user.keyboard("{End}");
    await expect(page.getByRole("menuitem", { name: "Archive" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    await expect(first).toHaveFocus();
    await user.keyboard("d");
    await expect(page.getByRole("menuitem", { name: "Duplicate" })).toHaveFocus();
    await user.keyboard("{Home}{Enter}");
    await expect(edit).toHaveBeenCalledTimes(1);
    await expect(renderedEdit).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(page.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(changed).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: "item-press" }),
    );
  },
};

function PreferencesDemo() {
  const [owner, setOwner] = useState(true);
  const [sort, setSort] = useState("name");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" />}>
        View options
      </DropdownMenuTrigger>
      <DropdownMenuContent style={{ width: 220 }}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Columns</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={owner} onCheckedChange={setOwner}>
            Owner
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked onCheckedChange={(_, details) => details.cancel()}>
            Required identifier
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuLabel>Sort</DropdownMenuLabel>
          <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setOwner(true);
            setSort("name");
          }}
        >
          Reset view
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Checkbox and radio items stay open by default; a normal action closes the menu. */
export const Toggles: Story = {
  name: "Preferences",
  render: () => <PreferencesDemo />,
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument,
      canvas = within(canvasElement),
      page = within(doc.body),
      user = userEvent.setup({ document: doc });
    const trigger = canvas.getByRole("button", { name: "View options" });
    await user.click(trigger);
    const owner = await page.findByRole("menuitemcheckbox", { name: "Owner" });
    await waitFor(() => expect(page.getByRole("menu")).toBeVisible());
    await user.click(owner);
    await expect(owner).toHaveAttribute("aria-checked", "false");
    await expect(page.getByRole("menu")).toBeVisible();
    const required = page.getByRole("menuitemcheckbox", { name: "Required identifier" });
    await user.click(required);
    await expect(required).toHaveAttribute("aria-checked", "true");
    await user.click(page.getByRole("menuitemradio", { name: "Date" }));
    await expect(page.getByRole("menuitemradio", { name: "Date" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.getByRole("menuitemradio", { name: "Name" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await user.click(page.getByRole("menuitem", { name: "Reset view" }));
    await waitFor(() => expect(page.queryByRole("menu")).toBeNull());
    trigger.focus();
    await user.keyboard("{Enter}");
    await waitFor(() =>
      expect(page.getByRole("menuitemcheckbox", { name: "Owner" })).toHaveAttribute(
        "aria-checked",
        "true",
      ),
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Submenu arrows follow the locale; links retain href and native browser navigation. */
export const Submenus: Story = {
  render: () => (
    <LedgerProvider direction="rtl">
      <div className="flex justify-center gap-200 p-400">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="secondary" />}>
            Record actions
          </DropdownMenuTrigger>
          <DropdownMenuContent style={{ width: 220 }}>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Share</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
                <DropdownMenuItem>Send invitation</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuLinkItem href="#record-guide" closeOnClick>
              Open guide
            </DropdownMenuLinkItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="secondary" />}>
            Custom placement
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <MenuPrimitive.Positioner sideOffset={8} collisionPadding={16} className="z-50">
              <MenuPrimitive.Popup className={menuSurface}>
                <DropdownMenuItem>Copy reference</DropdownMenuItem>
              </MenuPrimitive.Popup>
            </MenuPrimitive.Positioner>
          </DropdownMenuPortal>
        </DropdownMenu>
      </div>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument,
      canvas = within(canvasElement),
      page = within(doc.body),
      user = userEvent.setup({ document: doc });
    const trigger = canvas.getByRole("button", { name: "Record actions" });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const share = await page.findByRole("menuitem", { name: "Share" });
    await waitFor(() => expect(share).toHaveFocus());
    await user.keyboard("{ArrowLeft}");
    const copy = await page.findByRole("menuitem", { name: "Copy link" });
    await waitFor(() => expect(copy).toHaveFocus());
    const sub = copy.closest('[role="menu"]')!;
    await expect(sub).toHaveAttribute("dir", "rtl");
    await expect(sub).toHaveAttribute("data-side", "inline-end");
    await waitFor(() =>
      expect(sub.getBoundingClientRect().right).toBeLessThanOrEqual(
        share.getBoundingClientRect().left + 4,
      ),
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("menuitem", { name: "Copy link" })).toBeNull());
    await expect(share).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    const link = page.getByRole("menuitem", { name: "Open guide" });
    await expect(link).toHaveFocus();
    await expect(link.tagName).toBe("A");
    await expect(link).toHaveAttribute("href", "#record-guide");
    let allowed = false;
    const preventNavigation = (event: MouseEvent) => {
      if (event.target === link) {
        allowed = !event.defaultPrevented;
        event.preventDefault();
      }
    };
    doc.addEventListener("click", preventNavigation);
    try {
      await user.keyboard("{Enter}");
      await expect(allowed).toBe(true);
    } finally {
      doc.removeEventListener("click", preventNavigation);
    }
    await waitFor(() => expect(page.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    const custom = canvas.getByRole("button", { name: "Custom placement" });
    await user.click(custom);
    const customMenu = await page.findByRole("menu");
    await expect(canvasElement).not.toContainElement(customMenu);
    await expect(
      within(customMenu).getByRole("menuitem", { name: "Copy reference" }),
    ).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(custom).toHaveFocus());
  },
};

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<IconButton label="Record actions" icon={<MoreHorizontal />} />}
        />
        <DropdownMenuContent style={{ width: 200 }}>
          <DropdownMenuItem onClick={() => setOpen(true)}>Edit record</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Edit record</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <Stack space="space.200">
              <Text>Choose an action for this record.</Text>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="secondary" />}>
                  More options
                </DropdownMenuTrigger>
                <DropdownMenuContent style={{ width: 200 }}>
                  <DropdownMenuItem>Copy record</DropdownMenuItem>
                  <DropdownMenuItem>Move record</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </Stack>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** A menu opens a dialog; a nested menu uses Base UI portals and dismisses one layer at a time. */
export const Dialogs: Story = {
  render: () => <DialogDemo />,
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument,
      canvas = within(canvasElement),
      page = within(doc.body),
      user = userEvent.setup({ document: doc });
    const opener = canvas.getByRole("button", { name: "Record actions" });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    opener.focus();
    await user.keyboard("{ArrowDown}");
    const edit = await page.findByRole("menuitem", { name: "Edit record" });
    await waitFor(() => expect(edit).toHaveFocus());
    await user.keyboard("{Enter}");
    const dialog = await page.findByRole("dialog", { name: "Edit record" });
    const more = within(dialog).getByRole("button", { name: "More options" });
    await waitFor(() => expect(more).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    const menu = await page.findByRole("menu");
    await waitFor(() => expect(menu).toBeVisible());
    await waitFor(() => {
      const r = menu.getBoundingClientRect();
      expect(menu.contains(doc.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))).toBe(true);
    });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("menu")).toBeNull());
    await expect(dialog).toBeVisible();
    await expect(more).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
