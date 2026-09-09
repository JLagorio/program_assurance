import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import {
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
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
  render: () => (
    <Inline space="space.300" alignBlock="center" shouldWrap>
      <Tooltip>
        <TooltipTrigger render={<Button>Tooltip</Button>} />
        <TooltipContent>Schedule the next assessment</TooltipContent>
      </Tooltip>
      <Popover>
        <PopoverTrigger render={<Button>Popover</Button>} />
        <PopoverContent aria-label="A small task" style={{ width: 280 }}>
          <Stack space="space.200">
            <Field label="Reason">
              <Input placeholder="Why this control is deferred" />
            </Field>
            <Inline space="space.100" alignInline="end">
              <PopoverClose render={<Button variant="subtle" size="small" />}>Cancel</PopoverClose>
              <PopoverClose render={<Button variant="primary" size="small" />}>Defer</PopoverClose>
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
  ),
};

function Modals() {
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
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Schedule assessment</DialogTitle>
            <DialogDescription>
              Pick a window; the owner is notified when you save.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <Stack space="space.200">
              <Field label="Assessor">
                <Input placeholder="Choose an assessor" />
              </Field>
              <Field label="Notes">
                <Textarea placeholder="Anything the assessor should know first." />
              </Field>
            </Stack>
          </div>
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
        <DialogContent
          style={{ maxWidth: ({ medium: 520, large: 860 } as const)["large"] }}
          className="top-200 translate-y-0 sm:top-600"
        >
          <DialogHeader>
            <DialogTitle>Link evidence</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="px-250 py-200 md:col-span-2">
                <Text color="color.text.subtle">
                  The body scrolls; the header, aside and footer stay put.
                </Text>
              </div>
              <div className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
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
          </div>
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
        <SheetContent side="end" style={{ maxWidth: 420 }}>
          <SheetHeader>
            <div className="flex items-start gap-100">
              <div className="flex min-w-0 flex-1 flex-col gap-025">
                <SheetTitle>CTRL-0412</SheetTitle>
                <SheetDescription>Segregation of duties, payables</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
            <Stack space="space.050">
              <KeyValue label="Owner">Dana Whitfield</KeyValue>
              <KeyValue label="Frequency">Quarterly</KeyValue>
              <KeyValue label="Last verified">12 Aug 2026</KeyValue>
            </Stack>
          </div>
          <SheetFooter>
            <Button variant="primary" onClick={() => setSheet(false)}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Quick actions"
        description="The bottom sheet for narrow screens."
        footer={<Button onClick={() => setDrawer(false)}>Close</Button>}
      >
        <Stack space="space.100">
          <Button variant="subtle">Mark verified</Button>
          <Button variant="subtle">Request evidence</Button>
        </Stack>
      </Drawer>

      <AlertDialog
        open={confirm}
        onOpenChange={(next, details) => {
          if (!next) {
            if (pending) {
              details.cancel();
              return;
            }
            setConfirm(false);
          }
        }}
      >
        <AlertDialogContent
          initialFocus={alertCancelRef}
          className="top-200 translate-y-0 sm:top-1000"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this control?</AlertDialogTitle>
            <AlertDialogDescription>
              Its evidence links are removed. The evidence itself is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={alertCancelRef} disabled={pending}>
              Cancel
            </AlertDialogCancel>
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

export const Modal: Story = { render: () => <Modals /> };

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
        <SheetContent side="end" style={{ maxWidth: 420 }}>
          <SheetHeader>
            <div className="flex items-start gap-100">
              <div className="flex min-w-0 flex-1 flex-col gap-025">
                <SheetTitle>CTRL-0412</SheetTitle>
                <SheetDescription>Segregation of duties, payables</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
            <Stack space="space.050">
              <KeyValue label="Owner">Dana Whitfield</KeyValue>
              <KeyValue label="Frequency">Quarterly</KeyValue>
              <KeyValue label="Last verified">12 Aug 2026</KeyValue>
            </Stack>
          </div>
          <SheetFooter>
            <>
              <Button variant="danger" onClick={() => setConfirm(true)}>
                Archive
              </Button>
              <Button variant="primary" onClick={() => setSheet(false)}>
                Done
              </Button>
            </>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <AlertDialog
        open={confirm}
        onOpenChange={(next) => {
          if (!next) {
            setConfirm(false);
          }
        }}
      >
        <AlertDialogContent
          initialFocus={alertCancelRef2}
          className="top-200 translate-y-0 sm:top-1000"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this control?</AlertDialogTitle>
            <AlertDialogDescription>
              It leaves the register; its evidence and findings stay readable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={alertCancelRef2}>Cancel</AlertDialogCancel>
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
    </>
  );
}

/** The one stack the kit allows: an AlertDialog over a Sheet. Focus goes to Cancel and comes back to the sheet's button. */
export const Stacked: Story = { render: () => <StackDemo /> };
