import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, MoreHorizontal } from "lucide-react";

import { Avatar, Button, DropdownMenu, IconButton } from "@/ds/primitives";
import { people } from "../_lib/fixtures";

const meta = {
  title: "Primitives/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
  parameters: { docs: { story: { inline: false, height: "320px" } } },
  args: { align: "start", width: 220, trigger: null, children: null },
  argTypes: {
    align: { control: "inline-radio", options: ["start", "end"] },
    width: { control: "number" },
    defaultOpen: { control: false },
    trigger: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Anchored to a Button: a label, items with an Avatar lead, one selected, a separator, a trailing hint. */
export const Open: Story = {
  render: (args) => (
    <div className="h-[280px]">
      <DropdownMenu
        {...args}
        defaultOpen
        trigger={
          <Button>
            Assign
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        }
      >
        <DropdownMenu.Label>Assign to</DropdownMenu.Label>
        {people.slice(0, 4).map((p) => (
          <DropdownMenu.Item key={p} selected={p === "D. Reyes"}>
            <span className="flex items-center gap-2">
              <Avatar name={p} size="xs" />
              {p}
            </span>
          </DropdownMenu.Item>
        ))}
        <DropdownMenu.Separator />
        <DropdownMenu.Label>More</DropdownMenu.Label>
        <DropdownMenu.Item trailing="⌘E">Request evidence</DropdownMenu.Item>
        <DropdownMenu.Item>Mark not applicable</DropdownMenu.Item>
        <DropdownMenu.Item disabled>Delete</DropdownMenu.Item>
      </DropdownMenu>
    </div>
  ),
};

/** Row actions: an IconButton trigger, aligned to the end. */
export const RowActions: Story = {
  render: () => (
    <div className="flex h-[240px] justify-end">
      <DropdownMenu
        align="end"
        width={180}
        defaultOpen
        trigger={
          <IconButton aria-label="Row actions">
            <MoreHorizontal className="size-3.5" />
          </IconButton>
        }
      >
        <DropdownMenu.Item>Open</DropdownMenu.Item>
        <DropdownMenu.Item>Preview</DropdownMenu.Item>
        <DropdownMenu.Item>Copy link</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>Archive</DropdownMenu.Item>
      </DropdownMenu>
    </div>
  ),
};
