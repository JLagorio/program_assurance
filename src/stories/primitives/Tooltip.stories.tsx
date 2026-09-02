import type { Meta, StoryObj } from "@storybook/react-vite";
import { History, Link2 } from "lucide-react";

import { Button, IconButton, Tooltip } from "@/ds/primitives";

const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  args: {
    content: "View assessment history",
    side: "top",
    align: "center",
    delay: 300,
    children: null,
  },
  argTypes: {
    content: { control: "text" },
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    delay: { control: "number" },
    defaultOpen: { control: false },
    className: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="flex h-[160px] items-center justify-center">
      <Tooltip {...args} defaultOpen>
        <IconButton aria-label="View assessment history">
          <History className="size-4" />
        </IconButton>
      </Tooltip>
    </div>
  ),
};

/** Open on the three controls that most often need a label: two icon buttons and a destructive action. */
export const Sides: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid h-[240px] place-items-center">
      <div className="flex items-center gap-12">
        <Tooltip content="View assessment history" side="top" defaultOpen>
          <IconButton aria-label="View assessment history">
            <History className="size-4" />
          </IconButton>
        </Tooltip>
        <Tooltip content="Link evidence" side="bottom" defaultOpen>
          <IconButton aria-label="Link evidence">
            <Link2 className="size-4" />
          </IconButton>
        </Tooltip>
        <Tooltip
          content="Removes the finding from the POA&M. This cannot be undone."
          side="right"
          defaultOpen
        >
          <Button variant="danger" size="sm">
            Delete finding
          </Button>
        </Tooltip>
      </div>
    </div>
  ),
};
