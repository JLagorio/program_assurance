import type { Meta, StoryObj } from "@storybook/react-vite";

import { Breadcrumb } from "../../components";
import { Box, Stack } from "../../primitives";

const meta = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Breadcrumb>;
export default meta;
type Story = StoryObj;

/** Short, long enough to wrap, a lone current page, and a link child. */
export const BreadcrumbMatrix: Story = {
  parameters: {
    // The matrix stacks four breadcrumb navs; a page has one. A false positive of the layout, not a defect.
    a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } },
  },
  render: () => (
    <Stack space="space.200">
      <Breadcrumb>
        <Breadcrumb.Item>Programs</Breadcrumb.Item>
        <Breadcrumb.Item isCurrent>Atlas payments platform</Breadcrumb.Item>
      </Breadcrumb>
      <Box style={{ width: 360 }}>
        <Breadcrumb>
          <Breadcrumb.Item>Programs</Breadcrumb.Item>
          <Breadcrumb.Item>Atlas payments platform</Breadcrumb.Item>
          <Breadcrumb.Item>Controls</Breadcrumb.Item>
          <Breadcrumb.Item>Access control</Breadcrumb.Item>
          <Breadcrumb.Item isCurrent>
            AC-2(3) Disable accounts after a period of inactivity
          </Breadcrumb.Item>
        </Breadcrumb>
      </Box>
      <Breadcrumb>
        <Breadcrumb.Item isCurrent>Only the page</Breadcrumb.Item>
      </Breadcrumb>
      <Breadcrumb>
        <Breadcrumb.Item asChild>
          <a href="#programs">A link child</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item isCurrent>Here</Breadcrumb.Item>
      </Breadcrumb>
    </Stack>
  ),
};
