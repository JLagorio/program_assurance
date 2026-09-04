import type { Meta, StoryObj } from "@storybook/react-vite";

import { HoverCard, TextLink } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/HoverCard",
  component: HoverCard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof HoverCard>;
export default meta;
type Story = StoryObj;

/** A peek on hover, and one held open. */
export const HoverCardMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="p-400">
      <Inline space="space.300">
        <HoverCard
          content={
            <Stack space="space.050">
              <Text weight="medium">RSK-0021</Text>
              <Text size="small" color="color.text.subtle">
                Unencrypted management plane on the tactical edge.
              </Text>
            </Stack>
          }
        >
          <TextLink>
            <a href="#rsk">Hover me</a>
          </TextLink>
        </HoverCard>
        <HoverCard
          content={<Text size="small">Wider card on the right.</Text>}
          side="right"
          width={320}
        >
          <TextLink>
            <a href="#rsk2">Right side</a>
          </TextLink>
        </HoverCard>
      </Inline>
      <Box style={{ height: 140 }}>
        <HoverCard
          content={
            <Stack space="space.050">
              <Text weight="medium">Open by default</Text>
              <Text size="small" color="color.text.subtle">
                The default delay is 400ms; a peek, not a click.
              </Text>
            </Stack>
          }
          defaultOpen
        >
          <TextLink>
            <a href="#rsk3">Held open</a>
          </TextLink>
        </HoverCard>
      </Box>
    </Stack>
  ),
};
