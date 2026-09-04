import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Flex, Text } from "../../primitives";

const meta = {
  title: "Primitives/Flex",
  component: Flex,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Flex>;
export default meta;
type Story = StoryObj<typeof meta>;

function Cell({ label }: { label: string }) {
  return (
    <Box
      backgroundColor="color.background.information.subtler"
      padding="space.100"
      className="rounded-small"
    >
      <Text size="xsmall" color="color.text.information">
        {label}
      </Text>
    </Box>
  );
}

export const FlexRow: Story = {
  render: () => (
    <Flex
      direction="row"
      gap="space.100"
      alignItems="center"
      justifyContent="space-between"
      wrap="wrap"
    >
      <Cell label="start" />
      <Cell label="middle" />
      <Cell label="end" />
    </Flex>
  ),
};
