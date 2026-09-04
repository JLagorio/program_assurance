import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../components";
import { Card } from "../../patterns";
import { Box, Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/Card",
  component: Card,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj;

/** Plain, with a header, with a description and an action. */
export const CardMatrix: Story = {
  render: () => (
    <Stack space="space.200" className="w-layout-list">
      <Card>
        <Box padding="space.200">
          <Text>Plain card</Text>
        </Box>
      </Card>
      <Card>
        <Card.Header title="With a header" />
        <Box padding="space.200">
          <Text size="small" color="color.text.subtle">
            Body
          </Text>
        </Box>
      </Card>
      <Card>
        <Card.Header
          title="Description and action"
          description="Everything derived from the live matrix."
          action={
            <Button size="small" variant="subtle">
              Edit
            </Button>
          }
        />
        <Box padding="space.200">
          <Text size="small" color="color.text.subtle">
            Body
          </Text>
        </Box>
      </Card>
    </Stack>
  ),
};
