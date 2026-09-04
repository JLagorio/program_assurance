import type { Meta, StoryObj } from "@storybook/react-vite";

import { Heading, Stack, Text } from "../../primitives";

const meta = {
  title: "Primitives/Heading",
  component: Heading,
  parameters: { layout: "padded" },
  args: { size: "medium" },
} satisfies Meta<typeof Heading>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Headings: Story = {
  render: () => (
    <Stack space="space.200">
      <Heading size="large" as="div">
        298 / 372
      </Heading>
      <Heading size="medium">Program CFC-2026 · Boundary protection</Heading>
      <Heading size="small">Assessment results</Heading>
      <Heading size="xsmall" as="h4">
        Schedule assessment
      </Heading>
      <Text size="small" color="color.text.subtlest">
        Level is chosen by the page (as); size by the design. Large is a displayed number, never a
        title.
      </Text>
    </Stack>
  ),
};
