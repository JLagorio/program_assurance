import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, FilterChip, Toolbar } from "../../components";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Toolbar",
  component: Toolbar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Toolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Search only, with filters, with actions, and dense. */
export const ToolbarMatrix: Story = {
  render: () => (
    <Stack space="space.200" className="max-w-layout-measure">
      <Toolbar search="" onSearch={() => {}} placeholder="Search controls" />
      <Toolbar search="AC-2" onSearch={() => {}}>
        <FilterChip label="Baseline" value="Rev. 5" isActive />
        <FilterChip label="Impact" />
      </Toolbar>
      <Toolbar search="" onSearch={() => {}} actions={<Button size="small">Export</Button>}>
        <FilterChip label="Owner" />
      </Toolbar>
      <Toolbar
        actions={
          <Button size="small" variant="primary">
            New
          </Button>
        }
      >
        <Text size="small" color="color.text.subtle">
          No search: the children carry the row.
        </Text>
      </Toolbar>
    </Stack>
  ),
};
