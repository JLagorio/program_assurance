import type { Meta, StoryObj } from "@storybook/react-vite";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Checkbox,
  DropdownMenu,
  Field,
  IconButton,
  Input,
  Popover,
  Textarea,
  Tooltip,
} from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Matrix } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: { layout: "padded" },
  args: {
    label: "Filters",
    side: "bottom",
    align: "start",
    width: 260,
    trigger: <Button variant="secondary">Open</Button>,
    children: (
      <Stack space="space.100">
        <Text weight="medium">Filters</Text>
        <Text size="small" color="color.text.subtle">
          A small task, anchored to the button that opened it.
        </Text>
        <Popover.Close>
          <Button size="small">Done</Button>
        </Popover.Close>
      </Stack>
    ),
  },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every side and alignment as a trigger, and one held open with a title, a line and a Close. */
export const PopoverMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="p-400">
      <Matrix
        rows={["top", "right", "bottom", "left"] as const}
        cols={["start", "center", "end"] as const}
        rowLabel="side"
        render={(side, align) => (
          <Popover
            label="Placement"
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
          label="Columns"
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

function DeferDemo() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [deferred, setDeferred] = useState<string | null>(null);
  return (
    <Inline space="space.200" alignBlock="center">
      <Popover
        label="Defer control"
        width={300}
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="secondary">Defer</Button>}
      >
        <Stack space="space.200">
          <Field label="Reason" isRequired>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this control waits"
            />
          </Field>
          <Inline space="space.100" alignInline="end">
            <Popover.Close>
              <Button variant="subtle" size="small">
                Cancel
              </Button>
            </Popover.Close>
            <Button
              variant="primary"
              size="small"
              disabled={!reason.trim()}
              onClick={() => {
                setDeferred(reason.trim());
                setReason("");
                setOpen(false);
              }}
            >
              Defer
            </Button>
          </Inline>
        </Stack>
      </Popover>
      {deferred ? (
        <Text size="small" color="color.text.subtle">
          Deferred: {deferred}
        </Text>
      ) : null}
    </Inline>
  );
}

/** A small task with its own state: the owner closes the popover when the task is done. Focus lands in the field and returns to the button. */
export const Task: Story = { render: () => <DeferDemo /> };

const columns = ["Owner", "Status", "Severity", "Due", "Family"];

function OptionsDemo() {
  const [shown, setShown] = useState<string[]>(["Owner", "Status", "Due"]);
  return (
    <Popover
      label="Columns"
      width={220}
      trigger={<IconButton label="Columns" variant="subtle" icon={<SlidersHorizontal />} />}
    >
      <Stack space="space.100">
        <Text weight="medium">Show</Text>
        <Stack space="space.075">
          {columns.map((c) => (
            <Checkbox
              key={c}
              checked={shown.includes(c)}
              onCheckedChange={(v) =>
                setShown((s) => (v === true ? [...s, c] : s.filter((x) => x !== c)))
              }
            >
              {c}
            </Checkbox>
          ))}
        </Stack>
        <Inline alignInline="end">
          <Popover.Close>
            <Button size="small">Done</Button>
          </Popover.Close>
        </Inline>
      </Stack>
    </Popover>
  );
}

/** A list of options that stays open while the reader chooses; Done closes it. */
export const Options: Story = { render: () => <OptionsDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ height: 240 }}>
            <Popover
              label="Defer control"
              width={280}
              defaultOpen
              trigger={<Button variant="secondary">Defer</Button>}
            >
              <Stack space="space.200">
                <Field label="Reason" isRequired>
                  <Input placeholder="Why this control waits" />
                </Field>
                <Inline space="space.100" alignInline="end">
                  <Button variant="subtle" size="small">
                    Cancel
                  </Button>
                  <Button variant="primary" size="small">
                    Defer
                  </Button>
                </Inline>
              </Stack>
            </Popover>
          </Box>
        }
        doText="One field and its buttons: a task the reader finishes where they stand."
        dont={
          <Box style={{ height: 420 }}>
            <Popover
              label="New finding"
              width={300}
              defaultOpen
              trigger={<Button variant="secondary">New finding</Button>}
            >
              <Stack space="space.150">
                {["Title", "Owner", "Severity", "Due", "Source"].map((l) => (
                  <Field key={l} label={l}>
                    <Input />
                  </Field>
                ))}
                <Inline space="space.100" alignInline="end">
                  <Button variant="subtle" size="small">
                    Cancel
                  </Button>
                  <Button variant="primary" size="small">
                    Create
                  </Button>
                </Inline>
              </Stack>
            </Popover>
          </Box>
        }
        dontText="A whole form in a popover. It runs off the screen, an outside click loses it, and it is a Sheet."
      />
      <Pair
        do={
          <Box style={{ height: 200 }}>
            <DropdownMenu trigger={<Button variant="secondary">Actions</Button>} defaultOpen>
              <DropdownMenu.Item>Edit</DropdownMenu.Item>
              <DropdownMenu.Item>Reassign</DropdownMenu.Item>
              <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
            </DropdownMenu>
          </Box>
        }
        doText="A list of actions is a DropdownMenu: arrow keys, typeahead, one Tab stop."
        dont={
          <Box style={{ height: 200 }}>
            <Popover
              label="Actions"
              width={200}
              defaultOpen
              trigger={<Button variant="secondary">Actions</Button>}
            >
              <Stack space="space.050">
                <Button variant="subtle" size="small" isFullWidth>
                  Edit
                </Button>
                <Button variant="subtle" size="small" isFullWidth>
                  Reassign
                </Button>
                <Button variant="subtle" size="small" isFullWidth>
                  Duplicate
                </Button>
              </Stack>
            </Popover>
          </Box>
        }
        dontText="A menu built from buttons in a popover. Three Tab stops, no arrow keys, and no menu role for a screen reader."
      />
      <Pair
        do={
          <Box style={{ height: 120, paddingTop: 48 }}>
            <Tooltip content="Verified 12 Aug 2026" defaultOpen>
              <Button variant="secondary">Verified</Button>
            </Tooltip>
          </Box>
        }
        doText="One line the reader only reads is a Tooltip."
        dont={
          <Box style={{ height: 120, paddingTop: 48 }}>
            <Popover
              label="Verified"
              width={220}
              defaultOpen
              trigger={<Button variant="secondary">Verified</Button>}
            >
              <Text size="small">Verified 12 Aug 2026.</Text>
            </Popover>
          </Box>
        }
        dontText="A popover for a sentence. It takes a click to open, moves focus for nothing, and takes a click to close."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Box style={{ height: 200 }} className="p-400">
      <Popover {...args} />
    </Box>
  ),
};
