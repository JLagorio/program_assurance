import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../components";
import { PageHeader } from "../../patterns";
import { Stack } from "../../primitives";

const meta = {
  title: "Patterns/PageHeader",
  component: PageHeader,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj;

/** Title alone, with an eyebrow and description, with actions. */
export const PageHeaderMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <PageHeader title="Programs" />
      <PageHeader
        eyebrow="Libraries"
        title="Control catalog"
        description="800-53 Rev 5, CNSSI 1253 overlays and the CCI decomposition."
      />
      <PageHeader
        title="Findings and assets"
        description="One technical fact per row."
        actions={
          <>
            <Button variant="secondary">Export</Button>
            <Button variant="primary">New finding</Button>
          </>
        }
      />
    </Stack>
  ),
};
