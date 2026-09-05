import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, Info, Pencil, Pin, Trash2 } from "lucide-react";

import { Button, Field, IconButton, Input, Kbd, Popover, Tooltip } from "../../components";
import { Grid, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: { layout: "padded" },
  args: {
    content: "Schedule the next assessment",
    side: "top",
    align: "center",
    delay: 300,
    children: <Button variant="secondary">Hover or focus me</Button>,
  },
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

const sides = ["top", "right", "bottom", "left"] as const;
const contents = {
  "a word": "Edit",
  "with a shortcut": (
    <span className="flex items-center gap-075">
      Edit
      <span className="flex items-center gap-025">
        <Kbd>⌘</Kbd>
        <Kbd>E</Kbd>
      </span>
    </span>
  ),
  "two lines": "Verified 12 Aug 2026 by Dana Whitfield, against revision 4 of the procedure.",
} as const;

/** Four sides down, and a word, a shortcut and two lines across, every one open at once. */
export const TooltipMatrix: Story = {
  render: () => (
    <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.800" className="p-800">
      {sides.flatMap((side) =>
        (Object.keys(contents) as (keyof typeof contents)[]).map((kind) => (
          <Inline
            key={`${side}-${kind}`}
            alignInline={side === "right" ? "start" : side === "left" ? "end" : "center"}
          >
            <Tooltip content={contents[kind]} side={side} defaultOpen>
              <Button variant="secondary" size="small">
                {side} · {kind}
              </Button>
            </Tooltip>
          </Inline>
        )),
      )}
    </Grid>
  ),
};

/** Icon buttons carry their tooltip through `label`. Under one TooltipProvider, as the Shell mounts, the first waits 300ms and the next shows at once. */
export const IconButtons: Story = {
  render: () => (
    <Inline space="space.050">
      <IconButton label="Edit" variant="subtle" icon={<Pencil />} />
      <IconButton label="Copy link" variant="subtle" icon={<Copy />} />
      <IconButton label="Pin to rail" variant="subtle" icon={<Pin />} />
      <IconButton label="Delete" variant="subtle" icon={<Trash2 />} />
    </Inline>
  ),
};

/** One held open, on the info button it belongs to. */
export const Open: Story = {
  render: () => (
    <Inline space="space.300">
      <Tooltip content="Verified 12 Aug 2026" defaultOpen>
        <IconButton label="Verification" variant="subtle" icon={<Info />} />
      </Tooltip>
    </Inline>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div style={{ paddingTop: 40 }}>
            <Tooltip content="Edit" defaultOpen>
              <IconButton label="Edit" variant="subtle" icon={<Pencil />} isTooltipDisabled />
            </Tooltip>
          </div>
        }
        doText="An icon-only control's name is its tooltip; IconButton draws it from label."
        dont={
          <div style={{ paddingTop: 40 }}>
            <Tooltip content="Save" defaultOpen>
              <Button variant="primary">Save</Button>
            </Tooltip>
          </div>
        }
        dontText="A tooltip that repeats the label. The reader waits 300ms to learn what they already read."
      />
      <Pair
        do={
          <div style={{ width: 280 }}>
            <Field label="Owner" hint="Required before the review closes.">
              <Input placeholder="Who answers for it" />
            </Field>
          </div>
        }
        doText="What the reader must know is beside the field, in its hint."
        dont={
          <div style={{ width: 280 }}>
            <Field
              label={
                <span className="flex items-center gap-050">
                  Owner
                  <Tooltip content="Required before the review closes.">
                    <IconButton label="About owner" variant="subtle" size="small" icon={<Info />} />
                  </Tooltip>
                </span>
              }
            >
              <Input placeholder="Who answers for it" />
            </Field>
          </div>
        }
        dontText="A rule behind an info icon. It vanishes on hover-away, never shows on touch, and the form fails for the reader who did not look."
      />
      <Pair
        do={
          <div style={{ height: 150 }}>
            <Popover
              label="Undo"
              width={220}
              defaultOpen
              trigger={<Button variant="secondary">Deleted</Button>}
            >
              <Stack space="space.100">
                <Text size="small">The finding is deleted.</Text>
                <Button size="small">Undo</Button>
              </Stack>
            </Popover>
          </div>
        }
        doText="Something to act on opens a Popover, which takes focus and holds a control."
        dont={
          <div style={{ paddingTop: 48 }}>
            <Tooltip content={<Button size="small">Undo</Button>} defaultOpen>
              <Button variant="secondary">Deleted</Button>
            </Tooltip>
          </div>
        }
        dontText="A control inside a tooltip. A tooltip cannot be focused, so the button cannot be reached, and it closes as the pointer moves toward it."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Inline alignInline="center" className="p-800">
      <Tooltip {...args} />
    </Inline>
  ),
};
