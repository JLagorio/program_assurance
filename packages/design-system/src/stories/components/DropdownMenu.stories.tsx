import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Library, MoreHorizontal, Pencil, Plus } from "lucide-react";
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

const longLabel = "Include every element from the organization's shared library (12 missing)";

/**
 * Action labels set the menu width, even when its trigger is a single icon. Labels stay on one
 * line; one wider than the window leaves ends in an ellipsis at the menu's edge, and a pointer
 * resting on it shows the whole label.
 */
export const ActionLabelWidths: Story = {
  globals: { viewport: { value: "ledgerNarrow", isRotated: false } },
  render: () => (
    <Stack alignInline="start">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="small">Create system</Button>} />
        <DropdownMenuContent>
          <DropdownMenuItem>Create system</DropdownMenuItem>
          <DropdownMenuItem>Add system from product</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<IconButton label="More system actions" icon={<MoreHorizontal />} />}
        />
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Plus />
            Create system
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Library />
            Add from library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size="small" iconAfter={<ChevronDown />} />}>
          Include
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Include this element</DropdownMenuItem>
          <DropdownMenuItem>{longLabel}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    for (const label of ["Create system", "More system actions", "Include"]) {
      const trigger = canvas.getByRole("button", { name: label });
      await userEvent.click(trigger);
      const menu = await page.findByRole("menu");
      await waitFor(() => {
        const bounds = menu.getBoundingClientRect();
        expect(bounds.width).toBeGreaterThanOrEqual(trigger.getBoundingClientRect().width);
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(innerWidth);
        expect(menu.scrollWidth).toBeLessThanOrEqual(menu.clientWidth);
        for (const item of within(menu).getAllByRole("menuitem")) {
          const text = item.querySelector<HTMLElement>('[data-slot="dropdown-menu-item-label"]')!;
          const range = canvasElement.ownerDocument.createRange();
          range.selectNodeContents(text.firstChild!);
          // One line, never wrapped and never cut mid-word: a label that does not fit ends in
          // an ellipsis inside the item.
          const lines = new Set([...range.getClientRects()].map((box) => Math.round(box.top)));
          expect(lines.size).toBe(1);
          expect(getComputedStyle(item).whiteSpace).toBe("nowrap");
          expect(getComputedStyle(text).textOverflow).toBe("ellipsis");
          expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(
            item.getBoundingClientRect().right,
          );
        }
      });
      if (label === "Include") {
        const long = within(menu).getByRole("menuitem", { name: longLabel });
        const text = long.querySelector<HTMLElement>('[data-slot="dropdown-menu-item-label"]')!;
        await userEvent.hover(text);
        // Cut short by the window's edge, the label shows its whole text to a resting pointer.
        if (text.scrollWidth > text.clientWidth + 1)
          await expect(text).toHaveAttribute("title", longLabel);
        else await expect(text).not.toHaveAttribute("title");
      }
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(menu).not.toBeVisible());
    }
  },
};

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
        style={(state) => ({ minWidth: 240, outlineOffset: state.open ? 4 : 0 })}
        className={(state) => (state.open ? "font-medium" : "font-regular")}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Record</DropdownMenuLabel>
          <DropdownMenuItem
            ref={itemRef}
            onClick={edit}
            render={<div onClick={renderedEdit} className="tabular-nums" />}
            shortcut="E"
          >
            <Pencil aria-hidden />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem disabled onClick={disabledAction}>
            Reassign
          </DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger">Archive</DropdownMenuItem>
        <DropdownMenuItem variant="danger" disabled>
          Delete
        </DropdownMenuItem>
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
    // The shortcut is drawn at the end and said as aria-keyshortcuts, so the name is the label.
    const first = page.getByRole("menuitem", { name: "Edit" });
    await expect(first).toHaveAttribute("aria-keyshortcuts", "E");
    const keys = first.querySelector('[data-slot="dropdown-menu-shortcut"]')!;
    await expect(keys).toHaveAttribute("aria-hidden", "true");
    await expect(within(keys as HTMLElement).getByText("E", { selector: "kbd" })).toBeVisible();
    await expect(popupRef.current).toBe(menu);
    await expect(menu).toHaveClass("font-medium");
    await expect(menu).toHaveStyle({ minWidth: "240px", outlineOffset: "4px" });
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
    // A disabled danger item fades like any other: the danger colour would say it could run.
    const deleting = page.getByRole("menuitem", { name: "Delete" });
    await expect(deleting).toHaveFocus();
    await expect(getComputedStyle(deleting).color).toBe(getComputedStyle(disabled).color);
    await expect(getComputedStyle(deleting).color).not.toBe(
      getComputedStyle(page.getByRole("menuitem", { name: "Archive" })).color,
    );
    await user.keyboard("{ArrowUp}");
    await expect(page.getByRole("menuitem", { name: "Archive" })).toHaveFocus();
    await user.keyboard("{End}{ArrowDown}");
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
      <DropdownMenuContent>
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

/**
 * Checkbox and radio items stay open by default; a normal action closes the menu. Each kind sits
 * in its own labelled group, apart from the actions, so an unchecked option never reads as an
 * action; the chosen radio item carries a dot and a checked checkbox item a check.
 */
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
    // A dot marks the chosen option of a set; a check marks an option that is on.
    await expect(
      page
        .getByRole("menuitemradio", { name: "Date" })
        .querySelector('[data-slot="dropdown-menu-radio-item-indicator"] svg circle'),
    ).not.toBeNull();
    await expect(
      required.querySelector('[data-slot="dropdown-menu-checkbox-item-indicator"] svg circle'),
    ).toBeNull();
    await expect(page.getByRole("group", { name: "Sort" })).toContainElement(
      page.getByRole("menuitemradio", { name: "Date" }),
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
          <DropdownMenuContent>
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
    // Inline-end is the left in RTL. Where the window leaves no room there (a phone), the submenu
    // flips to stay on screen instead.
    if (share.getBoundingClientRect().left >= sub.getBoundingClientRect().width + 32) {
      await expect(sub).toHaveAttribute("data-side", "inline-end");
      await waitFor(() =>
        expect(sub.getBoundingClientRect().right).toBeLessThanOrEqual(
          share.getBoundingClientRect().left + 4,
        ),
      );
    } else {
      await waitFor(() => expect(sub.getBoundingClientRect().left).toBeGreaterThanOrEqual(0));
      await expect(sub.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    }
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
        <DropdownMenuContent>
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
                <DropdownMenuContent>
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

const publish = fn();

/**
 * `description` puts a second line under a label: what tells two similar actions apart. An action
 * that cannot run takes `disabledReason`, which disables it and shows why on that line; the arrow
 * keys still reach it and a screen reader reads the reason as its description. A disabled
 * destructive item fades like any other, so it never looks ready to run.
 */
export const DescriptionsAndReasons: Story = {
  name: "Descriptions and disabled reasons",
  globals: { viewport: { value: "ledgerNarrow", isRotated: false } },
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>Version actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem description="Keeps the current version as the baseline">
          <Plus />
          Create draft
        </DropdownMenuItem>
        <DropdownMenuItem description="Starts again from the published version">
          <Pencil />
          Revert to published
        </DropdownMenuItem>
        <DropdownMenuItem
          disabledReason="Add content to this version before publishing it."
          onClick={publish}
        >
          Publish version
          <DropdownMenuShortcut>
            <Kbd>P</Kbd>
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger">Archive</DropdownMenuItem>
        <DropdownMenuItem variant="danger" disabledReason="A published version cannot be deleted.">
          Delete version
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const canvas = within(canvasElement);
    const body = within(doc.body);
    const user = userEvent.setup({ document: doc });
    publish.mockClear();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const trigger = canvas.getByRole("button", { name: "Version actions" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const menu = await body.findByRole("menu");
    await waitFor(() => expect(menu).toBeVisible());
    // The name is the label; the second line is the description.
    const draft = within(menu).getByRole("menuitem", { name: "Create draft" });
    await expect(draft).toHaveAccessibleDescription("Keeps the current version as the baseline");
    await expect(
      within(draft).getByText("Keeps the current version as the baseline"),
    ).toBeVisible();
    // The label and its line share one column after the icon.
    const label = within(draft).getByText("Create draft");
    const line = within(draft).getByText("Keeps the current version as the baseline");
    await expect(line.getBoundingClientRect().left).toBe(label.getBoundingClientRect().left);
    await expect(line.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      label.getBoundingClientRect().bottom - 1,
    );
    // The unavailable action is reachable, announced and inert.
    await user.keyboard("{ArrowDown}{ArrowDown}");
    // A Shortcut drawn by hand is hidden too, so the name is the label alone.
    const unavailable = within(menu).getByRole("menuitem", { name: "Publish version" });
    await waitFor(() => expect(unavailable).toHaveFocus());
    await expect(unavailable).toHaveAttribute("aria-disabled", "true");
    await expect(unavailable).toHaveAccessibleDescription(
      "Add content to this version before publishing it.",
    );
    await user.keyboard("{Enter}");
    await expect(publish).not.toHaveBeenCalled();
    await expect(menu).toBeVisible();
    // The reason stays readable on the disabled row; the label fades. Forced colours draw the
    // whole disabled row in GrayText, the system's readable disabled colour.
    const reason = within(unavailable).getByText(
      "Add content to this version before publishing it.",
    );
    if (!matchMedia("(forced-colors: active)").matches)
      await expect(getComputedStyle(reason).color).not.toBe(
        getComputedStyle(within(unavailable).getByText("Publish version")).color,
      );
    // A disabled danger item takes the disabled colour, not the danger colour.
    const archive = within(menu).getByRole("menuitem", { name: "Archive" });
    const deleting = within(menu).getByRole("menuitem", { name: "Delete version" });
    await expect(archive).toHaveAttribute("data-variant", "danger");
    await expect(getComputedStyle(deleting).color).not.toBe(getComputedStyle(archive).color);
    await expect(getComputedStyle(deleting).color).toBe(getComputedStyle(unavailable).color);
    // The descriptions wrap inside a narrow menu instead of widening it past the screen.
    await expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(innerWidth);
    await expect(menu.scrollWidth).toBeLessThanOrEqual(menu.clientWidth);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/**
 * A Label names the Group around it. One placed outside any Group, as a heading at the top of a
 * menu, still renders, in a group of its own, and says once in the console that it names nothing;
 * the menu keeps working.
 */
export const LabelOutsideAGroup: Story = {
  name: "Label outside a group",
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" />}>Export</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Format</DropdownMenuLabel>
        <DropdownMenuItem>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem>Export as JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);
    const user = userEvent.setup({ document: doc });
    const trigger = within(canvasElement).getByRole("button", { name: "Export" });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const menu = await body.findByRole("menu");
    await waitFor(() => expect(menu).toBeVisible());
    await expect(within(menu).getByText("Format")).toBeVisible();
    await expect(within(menu).getByRole("group", { name: "Format" })).toBeInTheDocument();
    const first = within(menu).getByRole("menuitem", { name: "Export as CSV" });
    await waitFor(() => expect(first).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** A long menu scrolls inside the available height; hover arrows scroll it and keyboard focus reveals the highlighted item. */
export const Scrolling: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button />}>Assign to</DropdownMenuTrigger>
      <DropdownMenuContent style={{ maxHeight: 200 }}>
        {Array.from({ length: 24 }, (_, i) => (
          <DropdownMenuItem key={i}>Assessor {i + 1}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const canvas = within(canvasElement);
    const body = within(doc.body);
    const user = userEvent.setup({ document: doc });
    await user.click(canvas.getByRole("button", { name: "Assign to" }));
    const menu = await body.findByRole("menu", { name: "Assign to" });
    const viewport = menu.querySelector<HTMLElement>('[data-slot="scroller-viewport"]')!;
    await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    const arrow = (edge: "start" | "end") =>
      menu.querySelector<HTMLElement>(`[data-slot="scroller-arrow"][data-edge="${edge}"]`);
    await waitFor(() => expect(arrow("end")).toBeVisible());
    await expect(arrow("start")).toBeNull();
    await user.hover(arrow("end")!);
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    await user.unhover(arrow("end")!);
    await waitFor(() => expect(arrow("start")).toBeVisible());
    await user.keyboard("{End}");
    const last = within(menu).getByRole("menuitem", { name: "Assessor 24" });
    await waitFor(() => expect(last).toHaveFocus());
    await waitFor(() =>
      expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        viewport.getBoundingClientRect().bottom + 1,
      ),
    );
    await waitFor(() => expect(arrow("end")).toBeNull());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("menu")).toBeNull());
  },
};

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
    // Position the nested menu after its dialog anchor has finished arriving.
    await waitFor(() =>
      expect(dialog.getAnimations().every((animation) => animation.playState !== "running")).toBe(
        true,
      ),
    );
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
