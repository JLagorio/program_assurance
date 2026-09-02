import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Spinner } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Spinner",
  component: Spinner,
  tags: ["autodocs"],
  args: { size: "sm" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md"] },
    label: { control: "text" },
    className: { control: false },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Beside text, inside a busy button, and on its own at md. */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Spinner /> Saving…
      </div>
      <Button variant="primary" disabled>
        <Spinner className="text-primary-foreground" /> Submitting
      </Button>
      <div className="space-y-1.5">
        <Spec>md · a region loading</Spec>
        <Spinner size="md" />
      </div>
    </div>
  ),
};
