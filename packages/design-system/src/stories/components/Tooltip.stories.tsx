import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info } from "lucide-react";

import { Button, IconButton, Tooltip } from "../../components";
import { Grid, Inline } from "../../primitives";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj;

export const TooltipOpen: Story = {
  render: () => (
    <Inline space="space.300">
      <Tooltip content="Verified 12 Aug 2026" defaultOpen>
        <IconButton label="Info" variant="subtle" icon={<Info />} />
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
