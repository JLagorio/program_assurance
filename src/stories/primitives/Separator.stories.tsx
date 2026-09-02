import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Separator } from "@/ds/primitives";
import { Card } from "@/ds/patterns";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Separator",
  component: Separator,
  tags: ["autodocs"],
  args: { orientation: "horizontal" },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    className: { control: false },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="flex h-10 w-[320px] items-center">
      <Separator {...args} />
    </div>
  ),
};

/** Vertical between button groups in a toolbar; horizontal between stacked groups in a card. */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[560px] space-y-6">
      <div className="space-y-2">
        <Spec>Vertical · toolbar</Spec>
        <div className="flex h-8 items-center gap-2">
          <Button size="sm">Export</Button>
          <Button size="sm">Print</Button>
          <Separator orientation="vertical" className="mx-1" />
          <Button size="sm" variant="ghost">
            Archive
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Spec>Horizontal · card</Spec>
        <Card className="p-4">
          <p className="text-13 font-medium">Implementation statement</p>
          <p className="mt-1 text-13 text-muted-foreground">
            Accounts inactive for 90 days are disabled automatically by the IdP; exceptions require
            a ticket approved by the system owner.
          </p>
          <Separator className="my-3" />
          <p className="text-13 font-medium">Assessment method</p>
          <p className="mt-1 text-13 text-muted-foreground">Test, against the full record set.</p>
        </Card>
      </div>
    </div>
  ),
};
