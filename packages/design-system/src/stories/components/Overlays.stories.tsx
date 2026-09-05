import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, MoreHorizontal } from "lucide-react";
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
} from "../../components";
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
      <Tooltip content="Schedule the next assessment">
        <Button>Tooltip</Button>
      </Tooltip>
      <Popover label="A small task" width={280} trigger={<Button>Popover</Button>}>
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
      <DropdownMenu trigger={<Button iconAfter={<ChevronDown />}>Actions</Button>}>
        <DropdownMenu.Label>Control</DropdownMenu.Label>
        <DropdownMenu.Item trailing="⌘E">Edit</DropdownMenu.Item>
        <DropdownMenu.Item isSelected>Pin to rail</DropdownMenu.Item>
        <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item disabled>Archive</DropdownMenu.Item>
      </DropdownMenu>
      <DropdownMenu
        align="end"
        trigger={<IconButton label="More" variant="subtle" icon={<MoreHorizontal />} />}
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

function StackDemo() {
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Button onClick={() => setSheet(true)}>Sheet, then a decision</Button>
      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="CTRL-0412"
        subtitle="Segregation of duties, payables"
        footer={
          <>
            <Button variant="danger" onClick={() => setConfirm(true)}>
              Archive
            </Button>
            <Button variant="primary" onClick={() => setSheet(false)}>
              Done
            </Button>
          </>
        }
      >
        <Stack space="space.050">
          <KeyValue label="Owner">Dana Whitfield</KeyValue>
          <KeyValue label="Frequency">Quarterly</KeyValue>
          <KeyValue label="Last verified">12 Aug 2026</KeyValue>
        </Stack>
      </Sheet>
      <AlertDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          setSheet(false);
        }}
        tone="danger"
        title="Archive this control?"
        description="It leaves the register; its evidence and findings stay readable."
        confirmLabel="Archive"
      />
    </>
  );
}

/** The one stack the kit allows: an AlertDialog over a Sheet. Focus goes to Cancel and comes back to the sheet's button. */
export const Stacked: Story = { render: () => <StackDemo /> };
