import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, ListFilter, Pin, Underline } from "lucide-react";

import { Toggle } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: { size: "md", defaultPressed: true, children: "Show inherited" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    defaultPressed: { control: "boolean" },
    disabled: { control: "boolean" },
    pressed: { control: false },
    onPressedChange: { control: false },
    className: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Icon toggles at both sizes, a labelled one, and disabled. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <Toggle aria-label="Bold" defaultPressed>
          <Bold className="size-3.5" />
        </Toggle>
        <Toggle aria-label="Italic">
          <Italic className="size-3.5" />
        </Toggle>
        <Toggle aria-label="Underline" disabled>
          <Underline className="size-3.5" />
        </Toggle>
      </div>
      <div className="flex items-center gap-1">
        <Toggle size="sm" aria-label="Pin" defaultPressed>
          <Pin className="size-3" />
        </Toggle>
        <Toggle size="sm">
          <ListFilter className="size-3" />
          Filters
        </Toggle>
      </div>
      <Spec>on → bg-muted, foreground · off → muted text · same footprint as IconButton</Spec>
    </div>
  ),
};
