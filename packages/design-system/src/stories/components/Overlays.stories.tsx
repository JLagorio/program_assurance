import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  FieldLabel,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Field,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  IconButton,
  Input,
  KeyValue,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components";

import { ChevronDown, MoreHorizontal } from "lucide-react";

import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Overlays",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Anchored: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Inline space="space.300" alignBlock="center" shouldWrap>
        <Tooltip>
          <TooltipTrigger render={<Button>Tooltip</Button>} />
          <TooltipContent>Schedule the next assessment</TooltipContent>
        </Tooltip>
        <Popover>
          <PopoverTrigger render={<Button>Popover</Button>} />
          <PopoverContent aria-label="A small task" style={{ width: 280 }}>
            <Stack space="space.200">
              <Field>
                <FieldLabel id={`${fieldId}-reason-1-label`} htmlFor={`${fieldId}-reason-1`}>
                  {"Reason"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-reason-1`}
                  aria-labelledby={`${fieldId}-reason-1-label`}
                  placeholder="Why this control is deferred"
                />
              </Field>
              <Inline space="space.100" alignInline="end">
                <PopoverClose render={<Button variant="subtle" size="small" />}>
                  Cancel
                </PopoverClose>
                <PopoverClose render={<Button variant="primary" size="small" />}>
                  Defer
                </PopoverClose>
              </Inline>
            </Stack>
          </PopoverContent>
        </Popover>
        <HoverCard>
          <HoverCardTrigger href="#CTRL-0412" className="text-brand hover:underline">
            HoverCard on an id
          </HoverCardTrigger>
          <HoverCardContent>
            <Stack space="space.050">
              <Text weight="medium">CTRL-0412 Segregation of duties, payables</Text>
              <Text size="small" color="color.text.subtle">
                Owner Dana Whitfield · Verified 12 Aug 2026
              </Text>
              <Badge variant="secondary" tone="success" className="self-start">
                Verified
              </Badge>
            </Stack>
          </HoverCardContent>
        </HoverCard>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button iconAfter={<ChevronDown />}>Actions</Button>} />
          <DropdownMenuContent style={{ width: 200 }}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Control</DropdownMenuLabel>
              <DropdownMenuItem>
                Edit<DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem checked closeOnClick>
                Pin to rail
              </DropdownMenuCheckboxItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Archive</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<IconButton label="More" variant="subtle" icon={<MoreHorizontal />} />}
          />
          <DropdownMenuContent align="end" style={{ width: 200 }}>
            <DropdownMenuItem>Open in new tab</DropdownMenuItem>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Inline>
    );
  },
};

function Modals() {
  const fieldId = useId();

  const alertCancelRef = useRef<HTMLButtonElement>(null);

  const [dialog, setDialog] = useState(false);
  const [large, setLarge] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <Inline space="space.200" shouldWrap>
      <Button onClick={() => setDialog(true)}>Dialog</Button>
      <Button onClick={() => setLarge(true)}>Dialog with aside</Button>
      <Button onClick={() => setSheet(true)}>Sheet</Button>
      <Button onClick={() => setDrawer(true)}>Drawer</Button>
      <Button variant="danger" onClick={() => setConfirm(true)}>
        AlertDialog
      </Button>

      <Dialog
        open={dialog}
        onOpenChange={(next) => {
          if (!next) {
            setDialog(false);
          }
        }}
      >
        <DialogContent width="medium">
          <DialogHeader>
            <DialogTitle>Schedule assessment</DialogTitle>
            <DialogDescription>
              Pick a window; the owner is notified when you save.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Stack space="space.200">
              <Field>
                <FieldLabel id={`${fieldId}-assessor-2-label`} htmlFor={`${fieldId}-assessor-2`}>
                  {"Assessor"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-assessor-2`}
                  aria-labelledby={`${fieldId}-assessor-2-label`}
                  placeholder="Choose an assessor"
                />
              </Field>
              <Field>
                <FieldLabel id={`${fieldId}-notes-3-label`} htmlFor={`${fieldId}-notes-3`}>
                  {"Notes"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-notes-3`}
                  aria-labelledby={`${fieldId}-notes-3-label`}
                  placeholder="Anything the assessor should know first."
                />
              </Field>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <>
              <Button variant="subtle" onClick={() => setDialog(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setDialog(false)}>
                Schedule
              </Button>
            </>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={large}
        onOpenChange={(next) => {
          if (!next) {
            setLarge(false);
          }
        }}
      >
        <DialogContent width="large">
          <DialogHeader>
            <DialogTitle>Link evidence</DialogTitle>
          </DialogHeader>
          <DialogBody className="@container p-0">
            <div className="grid grid-cols-1 @2xl:grid-cols-3">
              <div className="px-250 py-200 @2xl:col-span-2">
                <Text color="color.text.subtle">
                  The body scrolls; the header, aside and footer stay put.
                </Text>
              </div>
              <div className="border-t border-default bg-surface-sunken px-250 py-200 @2xl:border-s @2xl:border-t-0">
                <Stack space="space.050">
                  <KeyValue label="Control">CTRL-0412</KeyValue>
                  <KeyValue label="Owner">Dana Whitfield</KeyValue>
                  <KeyValue label="Status">
                    <Badge variant="secondary" tone="information">
                      In review
                    </Badge>
                  </KeyValue>
                </Stack>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="primary" onClick={() => setLarge(false)}>
              Link 3 items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={sheet}
        onOpenChange={(next) => {
          if (!next) {
            setSheet(false);
          }
        }}
      >
        <SheetContent side="end" width="medium">
          <SheetHeader>
            <SheetTitle>CTRL-0412</SheetTitle>
            <SheetDescription>Segregation of duties, payables</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <Stack space="space.050">
              <KeyValue label="Owner">Dana Whitfield</KeyValue>
              <KeyValue label="Frequency">Quarterly</KeyValue>
              <KeyValue label="Last verified">12 Aug 2026</KeyValue>
            </Stack>
          </SheetBody>
          <SheetFooter>
            <Button variant="primary" onClick={() => setSheet(false)}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Drawer open={drawer} onOpenChange={setDrawer} showSwipeHandle>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Quick actions</DrawerTitle>
            <DrawerDescription>The bottom sheet for narrow screens.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <Stack space="space.100">
              <Button variant="subtle">Mark verified</Button>
              <Button variant="subtle">Request evidence</Button>
            </Stack>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose render={<Button />}>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={confirm} pending={pending} onOpenChange={setConfirm}>
        <AlertDialogContent initialFocus={alertCancelRef}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this control?</AlertDialogTitle>
            <AlertDialogDescription>
              Its evidence links are removed. The evidence itself is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={alertCancelRef}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              isLoading={pending}
              onClick={() => {
                if (pending) return;
                setPending(true);
                setTimeout(() => {
                  setPending(false);
                  setConfirm(false);
                }, 1200);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Inline>
  );
}

const overlaySurfaceVar = "var(--ds-elevation-surface-overlay)";

/**
 * The blanketed four. Each has a body part that scrolls between a fixed header and footer, a width
 * step rather than a pixel width, and records the overlay surface as the current one, so a sticky
 * header or pinned cell inside paints the overlay's colour.
 */
export const Modal: Story = {
  render: () => <Modals />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const cases = [
      ["Dialog", "dialog", "Schedule assessment", "dialog-body"],
      ["Dialog with aside", "dialog", "Link evidence", "dialog-body"],
      ["Sheet", "dialog", "CTRL-0412", "sheet-body"],
      ["Drawer", "dialog", "Quick actions", "drawer-body"],
      ["AlertDialog", "alertdialog", "Delete this control?", null],
    ] as const;
    for (const [opener, role, name, slot] of cases) {
      await userEvent.click(canvas.getByRole("button", { name: new RegExp(`^${opener}$`) }));
      const popup = await body.findByRole(role, { name });
      const surface = popup.closest<HTMLElement>(
        '[style*="--ds-utility-elevation-surface-current"]',
      );
      await expect(surface?.style.getPropertyValue("--ds-utility-elevation-surface-current")).toBe(
        overlaySurfaceVar,
      );
      if (slot) await expect(popup.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
      // In forced colours the fill and shadow are replaced; a CanvasText outline keeps the edge.
      if (window.matchMedia("(forced-colors: active)").matches) {
        const edge = popup.closest<HTMLElement>(
          '[data-slot="drawer-popup"], [data-slot$="dialog-content"], [data-slot="sheet-content"]',
        )!;
        await expect(getComputedStyle(edge).outlineStyle).toBe("solid");
      }
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole(role)).toBeNull());
    }
  },
};

function StackDemo() {
  const alertCancelRef2 = useRef<HTMLButtonElement>(null);

  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Button onClick={() => setSheet(true)}>Sheet, then a decision</Button>
      <Sheet
        open={sheet}
        onOpenChange={(next) => {
          if (!next) {
            setSheet(false);
          }
        }}
      >
        <SheetContent side="end" width="medium">
          <SheetHeader>
            <SheetTitle>CTRL-0412</SheetTitle>
            <SheetDescription>Segregation of duties, payables</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <Stack space="space.050">
              <KeyValue label="Owner">Dana Whitfield</KeyValue>
              <KeyValue label="Frequency">Quarterly</KeyValue>
              <KeyValue label="Last verified">12 Aug 2026</KeyValue>
            </Stack>
          </SheetBody>
          <SheetFooter>
            <Button variant="danger" onClick={() => setConfirm(true)}>
              Archive
            </Button>
            <Button variant="primary" onClick={() => setSheet(false)}>
              Done
            </Button>
          </SheetFooter>
          {/* Inside the Sheet that owns the decision, so only the top dialog dismisses. */}
          <AlertDialog
            open={confirm}
            onOpenChange={(next) => {
              if (!next) {
                setConfirm(false);
              }
            }}
          >
            <AlertDialogContent initialFocus={alertCancelRef2}>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive this control?</AlertDialogTitle>
                <AlertDialogDescription>
                  It leaves the register; its evidence and findings stay readable.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel ref={alertCancelRef2}>Keep control</AlertDialogCancel>
                <AlertDialogAction
                  variant="danger"
                  onClick={() => {
                    setConfirm(false);
                    setSheet(false);
                  }}
                >
                  Archive
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * The one stack the kit allows: an AlertDialog over the Sheet that owns the decision, rendered
 * inside it. The sheet dims under the prompt, in both modes, with no second blanket over the page;
 * focus goes to Cancel and comes back to the sheet's button.
 */
export const Stacked: Story = {
  render: () => <StackDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Sheet, then a decision" }));
    const sheet = await body.findByRole("dialog", { name: "CTRL-0412" });
    const archive = within(sheet).getByRole("button", { name: "Archive" });
    await expect(getComputedStyle(sheet, "::after").opacity).toBe("0");
    await userEvent.click(archive);
    const prompt = await body.findByRole("alertdialog", { name: "Archive this control?" });
    await waitFor(() =>
      expect(within(prompt).getByRole("button", { name: "Keep control" })).toHaveFocus(),
    );
    await expect(sheet).toHaveAttribute("data-nested-dialog-open");
    await waitFor(() => expect(getComputedStyle(sheet, "::after").opacity).toBe("1"));
    await expect(
      canvasElement.ownerDocument.querySelectorAll(
        '[data-slot="sheet-overlay"], [data-slot="alert-dialog-overlay"]',
      ),
    ).toHaveLength(1);
    // The prompt stands apart from the sheet under it.
    await expect(getComputedStyle(prompt).backgroundColor).not.toBe(
      getComputedStyle(sheet, "::after").backgroundColor,
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(archive).toHaveFocus());
    await expect(sheet).not.toHaveAttribute("data-nested-dialog-open");
    await waitFor(() => expect(getComputedStyle(sheet, "::after").opacity).toBe("0"));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};
