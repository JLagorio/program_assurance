import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Columns3, List, Rows3 } from "lucide-react";

import { Button, ButtonGroup, IconButton } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
  args: { children: null },
  argTypes: { children: { control: false }, className: { control: false } },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Joined secondary buttons, a split primary, and joined IconButtons. */
export const Matrix: Story = {
  render: () => (
    <div className="space-y-4">
      <ButtonGroup>
        <Button>Day</Button>
        <Button>Week</Button>
        <Button>Month</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="primary">Record result</Button>
        <Button variant="primary" aria-label="More ways to record" className="px-2">
          <ChevronDown className="size-3.5" />
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <IconButton aria-label="List">
          <List className="size-3.5" />
        </IconButton>
        <IconButton aria-label="Rows">
          <Rows3 className="size-3.5" />
        </IconButton>
        <IconButton aria-label="Columns">
          <Columns3 className="size-3.5" />
        </IconButton>
      </ButtonGroup>
      <Spec>inner corners square · borders overlap by 1px · hover lifts above its neighbours</Spec>
    </div>
  ),
};
