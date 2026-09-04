import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown } from "lucide-react";

import { Button, ButtonGroup, IconButton } from "../../components";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ButtonGroup>;
export default meta;
type Story = StoryObj;

/** Groups by size and variant, a split group, and a disabled member. */
export const ButtonGroupMatrix: Story = {
  render: () => (
    <Matrix
      rows={["secondary", "subtle"] as const}
      cols={["small", "medium"] as const}
      render={(variant, size) => (
        <ButtonGroup>
          <Button variant={variant} size={size}>
            Approve
          </Button>
          <Button variant={variant} size={size} disabled={size === "medium"}>
            Reject
          </Button>
          <IconButton label="More" variant={variant} size={size} icon={<ChevronDown />} />
        </ButtonGroup>
      )}
    />
  ),
};
