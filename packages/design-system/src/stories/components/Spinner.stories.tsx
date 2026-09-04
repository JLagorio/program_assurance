import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "../../components";
import { Box, Inline } from "../../primitives";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj;

/** Both sizes, and on a bold surface. */
export const SpinnerMatrix: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <Spinner size="small" />
      <Spinner size="medium" />
      <Box
        backgroundColor="color.background.brand.bold"
        padding="space.150"
        className="rounded-medium"
      >
        <Spinner size="medium" className="icon-inverse" label="Loading on brand" />
      </Box>
    </Inline>
  ),
};
