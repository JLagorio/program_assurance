import type { Meta, StoryObj } from "@storybook/react-vite";

import { Bleed, Box, Stack, Text } from "../../primitives";

const meta = {
  title: "Primitives/Bleed",
  component: Bleed,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Bleed>;
export default meta;
type Story = StoryObj<typeof meta>;

export const BleedInsideCard: Story = {
  render: () => (
    <Box
      backgroundColor="elevation.surface.raised"
      padding="space.200"
      className="max-w-[420px] rounded-large shadow-raised"
    >
      <Stack space="space.150">
        <Text weight="medium">Card with a full-bleed strip</Text>
        <Bleed inline="space.200">
          <Box
            backgroundColor="color.background.warning"
            paddingBlock="space.100"
            paddingInline="space.200"
          >
            <Text size="small" color="color.text.warning">
              This strip escapes the card's padding on both sides.
            </Text>
          </Box>
        </Bleed>
        <Text size="small" color="color.text.subtle">
          Bleed is the only sanctioned negative spacing.
        </Text>
      </Stack>
    </Box>
  ),
};
