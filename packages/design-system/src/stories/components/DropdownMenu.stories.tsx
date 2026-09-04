import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Button, DropdownMenu, Kbd } from "../../components";
import { Box } from "../../primitives";

const meta = {
  title: "Components/DropdownMenu",
  component: DropdownMenu,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DropdownMenu>;
export default meta;
type Story = StoryObj;

/** One menu, open, holding every item state. */
export const DropdownMenuMatrix: Story = {
  parameters: {
    // Radix hides the rest of the page (aria-hidden) while the modal menu is open and traps focus inside it; axe cannot see the trap.
    a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
  },
  render: () => (
    <Box style={{ height: 320 }} className="p-400">
      <DropdownMenu trigger={<Button variant="secondary">Actions</Button>} defaultOpen width={240}>
        <DropdownMenu.Label>Plain</DropdownMenu.Label>
        <DropdownMenu.Item onSelect={() => {}}>Open record</DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => {}} trailing={<Kbd>⌘ E</Kbd>}>
          With a shortcut
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => {}} isSelected>
          Selected
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => {}} disabled>
          Disabled
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          onSelect={() => {}}
          trailing={
            <Badge tone="danger" size="xsmall">
              3
            </Badge>
          }
        >
          With a badge
        </DropdownMenu.Item>
      </DropdownMenu>
    </Box>
  ),
};
