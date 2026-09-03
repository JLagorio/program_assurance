import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Info, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  Badge,
  Button,
  Dialog,
  Drawer,
  DropdownMenu,
  Field,
  HoverCard,
  IconButton,
  Input,
  KeyValue,
  Popover,
  Sheet,
  Textarea,
  Tooltip,
  Kbd,
} from "../../components";
import { Inline, Stack, Text, Box, Grid } from "../../primitives";
import { Matrix, Specimens, bothModes } from "../_lib/matrix";

const meta = {
  title: "Components/Overlays",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Anchored: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center" shouldWrap>
      <Tooltip content="Schedule the next assessment">
        <Button>Tooltip</Button>
      </Tooltip>
      <Popover width={280} trigger={<Button>Popover</Button>}>
        <Stack space="space.200">
          <Field label="Reason">
            <Input placeholder="Why this control is deferred" />
          </Field>
          <Inline space="space.100" alignInline="end">
            <Popover.Close>
              <Button variant="subtle" size="small">
                Cancel
              </Button>
            </Popover.Close>
            <Popover.Close>
              <Button variant="primary" size="small">
                Defer
              </Button>
            </Popover.Close>
          </Inline>
        </Stack>
      </Popover>
      <HoverCard
        content={
          <Stack space="space.050">
            <Text weight="medium">CTRL-0412 Segregation of duties, payables</Text>
            <Text size="small" color="color.text.subtle">
              Owner Dana Whitfield · Verified 12 Aug 2026
            </Text>
            <Badge tone="success" className="self-start">
              Verified
            </Badge>
          </Stack>
        }
      >
        <Button variant="link">HoverCard on an id</Button>
      </HoverCard>
      <DropdownMenu
        trigger={
          <Button>
            Actions
            <ChevronDown className="size-icon-small" />
          </Button>
        }
      >
        <DropdownMenu.Label>Control</DropdownMenu.Label>
        <DropdownMenu.Item trailing="⌘E">Edit</DropdownMenu.Item>
        <DropdownMenu.Item isSelected>Pin to rail</DropdownMenu.Item>
        <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item disabled>Archive</DropdownMenu.Item>
      </DropdownMenu>
      <DropdownMenu
        align="end"
        trigger={
          <IconButton label="More" variant="subtle">
            <MoreHorizontal className="size-icon-small" />
          </IconButton>
        }
      >
        <DropdownMenu.Item>Open in new tab</DropdownMenu.Item>
        <DropdownMenu.Item>Copy link</DropdownMenu.Item>
      </DropdownMenu>
    </Inline>
  ),
};

function Modals() {
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
        onClose={() => setDialog(false)}
        title="Schedule assessment"
        description="Pick a window; the owner is notified when you save."
        footer={
          <>
            <Button variant="subtle" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setDialog(false)}>
              Schedule
            </Button>
          </>
        }
      >
        <Stack space="space.200">
          <Field label="Assessor">
            <Input placeholder="Choose an assessor" />
          </Field>
          <Field label="Notes">
            <Textarea placeholder="Anything the assessor should know first." />
          </Field>
        </Stack>
      </Dialog>

      <Dialog
        open={large}
        width="large"
        onClose={() => setLarge(false)}
        title="Link evidence"
        aside={
          <Stack space="space.050">
            <KeyValue label="Control">CTRL-0412</KeyValue>
            <KeyValue label="Owner">Dana Whitfield</KeyValue>
            <KeyValue label="Status">
              <Badge tone="information">In review</Badge>
            </KeyValue>
          </Stack>
        }
        footer={
          <Button variant="primary" onClick={() => setLarge(false)}>
            Link 3 items
          </Button>
        }
      >
        <Text color="color.text.subtle">
          The body scrolls; the header, aside and footer stay put.
        </Text>
      </Dialog>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="CTRL-0412"
        subtitle="Segregation of duties, payables"
        footer={
          <Button variant="primary" onClick={() => setSheet(false)}>
            Done
          </Button>
        }
      >
        <Stack space="space.050">
          <KeyValue label="Owner">Dana Whitfield</KeyValue>
          <KeyValue label="Frequency">Quarterly</KeyValue>
          <KeyValue label="Last verified">12 Aug 2026</KeyValue>
        </Stack>
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
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setPending(true);
          setTimeout(() => {
            setPending(false);
            setConfirm(false);
          }, 1200);
        }}
        pending={pending}
        tone="danger"
        title="Delete this control?"
        description="Its evidence links are removed. The evidence itself is kept."
        confirmLabel="Delete"
      />
    </Inline>
  );
}

export const Modal: Story = { render: () => <Modals /> };

export const TooltipOpen: Story = {
  render: () => (
    <Inline space="space.300">
      <Tooltip content="Verified 12 Aug 2026" defaultOpen>
        <IconButton label="Info" variant="subtle">
          <Info className="size-icon-small" />
        </IconButton>
      </Tooltip>
    </Inline>
  ),
};

/** Four sides, open at once, with room to breathe. */
export const TooltipMatrix: Story = {
  render: () => (
    <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="space.800" className="p-800">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Inline key={side} alignInline="center">
          <Tooltip content={`On the ${side}`} side={side} defaultOpen>
            <Button variant="secondary">{side}</Button>
          </Tooltip>
        </Inline>
      ))}
    </Grid>
  ),
};

/** Every side and alignment as a trigger; the start-aligned one is open. */
export const PopoverMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="p-400">
      <Matrix
        rows={["top", "right", "bottom", "left"] as const}
        cols={["start", "center", "end"] as const}
        rowLabel="side"
        render={(side, align) => (
          <Popover
            trigger={
              <Button variant="secondary" size="small">
                {side} · {align}
              </Button>
            }
            side={side}
            align={align}
            width={220}
          >
            <Stack space="space.050">
              <Text weight="medium">Popover</Text>
              <Text size="small" color="color.text.subtle">
                {side}, aligned {align}.
              </Text>
            </Stack>
          </Popover>
        )}
      />
      <Box style={{ height: 160 }}>
        <Popover
          trigger={
            <Button variant="secondary" size="small">
              Open by default
            </Button>
          }
          defaultOpen
          width={260}
        >
          <Stack space="space.100">
            <Text weight="medium">Columns</Text>
            <Text size="small" color="color.text.subtle">
              A popover holds a small form or a list of options; anything larger is a Sheet.
            </Text>
            <Popover.Close>
              <Button size="small">Done</Button>
            </Popover.Close>
          </Stack>
        </Popover>
      </Box>
    </Stack>
  ),
};

/** A peek on hover, and one held open. */
export const HoverCardMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="p-400">
      <Inline space="space.300">
        <HoverCard
          content={
            <Stack space="space.050">
              <Text weight="medium">RSK-0021</Text>
              <Text size="small" color="color.text.subtle">
                Unencrypted management plane on the tactical edge.
              </Text>
            </Stack>
          }
        >
          <a href="#rsk" className="text-brand hover:underline">
            Hover me
          </a>
        </HoverCard>
        <HoverCard
          content={<Text size="small">Wider card on the right.</Text>}
          side="right"
          width={320}
        >
          <a href="#rsk2" className="text-brand hover:underline">
            Right side
          </a>
        </HoverCard>
      </Inline>
      <Box style={{ height: 140 }}>
        <HoverCard
          content={
            <Stack space="space.050">
              <Text weight="medium">Open by default</Text>
              <Text size="small" color="color.text.subtle">
                The default delay is 400ms; a peek, not a click.
              </Text>
            </Stack>
          }
          defaultOpen
        >
          <a href="#rsk3" className="text-brand hover:underline">
            Held open
          </a>
        </HoverCard>
      </Box>
    </Stack>
  ),
};

/** One menu, open, holding every item state. */
export const DropdownMenuMatrix: Story = {
  render: () => (
    <Box style={{ height: 320 }} className="p-400">
      <DropdownMenu trigger={<Button variant="secondary">Actions</Button>} defaultOpen width={240}>
        <DropdownMenu.Label>Plain</DropdownMenu.Label>
        <DropdownMenu.Item onSelect={() => {}}>Open record</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => {}} trailing={<Kbd>⌘ E</Kbd>}>
          With a shortcut
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => {}} isSelected>
          Selected
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => {}} disabled>
          Disabled
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onSelect={() => {}}
          trailing={
            <Badge tone="danger" size="xsmall">
              3
            </Badge>
          }
        >
          With a badge
        </DropdownMenu.Item>
      </DropdownMenu>
    </Box>
  ),
};

function DialogStates() {
  const [open, setOpen] = useState<"medium" | "large" | "aside" | null>(null);
  return (
    <Stack space="space.200">
      <Specimens title="Dialog">
        <Button variant="secondary" onClick={() => setOpen("medium")}>
          Medium
        </Button>
        <Button variant="secondary" onClick={() => setOpen("large")}>
          Large
        </Button>
        <Button variant="secondary" onClick={() => setOpen("aside")}>
          Large with an aside
        </Button>
      </Specimens>
      <Dialog
        open={open !== null}
        onClose={() => setOpen(null)}
        title="Schedule assessment"
        description="The assessor and the program owner are notified."
        width={open === "medium" ? "medium" : "large"}
        aside={
          open === "aside" ? (
            <Text size="small" color="color.text.subtle">
              An aside carries reference beside the form.
            </Text>
          ) : undefined
        }
        footer={
          <>
            <Button variant="subtle" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(null)}>
              Schedule
            </Button>
          </>
        }
      >
        <Text>Body of a {open} dialog.</Text>
      </Dialog>
    </Stack>
  );
}
/** Medium, large, and large with an aside. Open one. */
export const DialogMatrix: Story = { render: () => <DialogStates /> };

function SheetStates() {
  const [open, setOpen] = useState<"end" | "start" | "wide" | null>(null);
  return (
    <Stack space="space.200">
      <Specimens title="Sheet">
        <Button variant="secondary" onClick={() => setOpen("end")}>
          From the end
        </Button>
        <Button variant="secondary" onClick={() => setOpen("start")}>
          From the start
        </Button>
        <Button variant="secondary" onClick={() => setOpen("wide")}>
          Wide with a footer
        </Button>
      </Specimens>
      <Sheet
        open={open !== null}
        onClose={() => setOpen(null)}
        title="AC-2(3) Disable accounts"
        subtitle="Access control · Moderate"
        side={open === "start" ? "start" : "end"}
        width={open === "wide" ? 640 : 420}
        footer={
          open === "wide" ? (
            <Button variant="primary" onClick={() => setOpen(null)}>
              Save
            </Button>
          ) : undefined
        }
      >
        <Text>Body of a sheet from the {open}.</Text>
      </Sheet>
    </Stack>
  );
}
/** Either side, and wide with a footer. Open one. */
export const SheetMatrix: Story = { render: () => <SheetStates /> };

function DrawerStates() {
  const [open, setOpen] = useState<"plain" | "footer" | null>(null);
  return (
    <Stack space="space.200">
      <Specimens title="Drawer">
        <Button variant="secondary" onClick={() => setOpen("plain")}>
          Plain
        </Button>
        <Button variant="secondary" onClick={() => setOpen("footer")}>
          With a footer
        </Button>
      </Specimens>
      <Drawer
        open={open !== null}
        onClose={() => setOpen(null)}
        title="Filters"
        description="A drawer rises from the bottom; it is the small-screen form of a Sheet."
        footer={
          open === "footer" ? (
            <Button variant="primary" onClick={() => setOpen(null)}>
              Apply
            </Button>
          ) : undefined
        }
      >
        <Text>Body of the drawer.</Text>
      </Drawer>
    </Stack>
  );
}
/** Plain and with a footer. Open one. */
export const DrawerMatrix: Story = { render: () => <DrawerStates /> };

function AlertDialogStates() {
  const [open, setOpen] = useState<"primary" | "danger" | "pending" | null>(null);
  return (
    <Stack space="space.200">
      <Specimens title="AlertDialog">
        <Button variant="secondary" onClick={() => setOpen("primary")}>
          Primary
        </Button>
        <Button variant="danger" onClick={() => setOpen("danger")}>
          <Trash2 className="size-icon-small" />
          Danger
        </Button>
        <Button variant="secondary" onClick={() => setOpen("pending")}>
          Pending
        </Button>
      </Specimens>
      <AlertDialog
        open={open !== null}
        onClose={() => setOpen(null)}
        onConfirm={() => setOpen(null)}
        title={open === "danger" ? "Archive this program?" : "Submit for authorization?"}
        description={
          open === "danger"
            ? "Its controls, evidence and findings stay readable; nothing can be edited."
            : "The package locks and the authorizing official is notified."
        }
        tone={open === "danger" ? "danger" : "primary"}
        confirmLabel={open === "danger" ? "Archive" : "Submit"}
        pending={open === "pending"}
      />
    </Stack>
  );
}
/** Primary, danger, and pending. Open one. */
export const AlertDialogMatrix: Story = { render: () => <AlertDialogStates /> };
