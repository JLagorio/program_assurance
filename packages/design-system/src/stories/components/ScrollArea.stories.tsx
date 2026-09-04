import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScrollArea } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ScrollArea>;
export default meta;
type Story = StoryObj;

/** Vertical, horizontal, and both. */
export const ScrollAreaMatrix: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      {(["vertical", "horizontal", "both"] as const).map((o) => (
        <Box
          key={o}
          style={{ width: 220, height: 140 }}
          className="rounded-medium border border-default"
        >
          <ScrollArea orientation={o} className="h-full">
            <Box padding="space.150" style={{ width: o === "vertical" ? undefined : 480 }}>
              <Stack space="space.050">
                {Array.from({ length: o === "horizontal" ? 3 : 12 }, (_, i) => (
                  <Text key={i} size="small">
                    {o} · row {i + 1}
                  </Text>
                ))}
              </Stack>
            </Box>
          </ScrollArea>
        </Box>
      ))}
    </Inline>
  ),
};
