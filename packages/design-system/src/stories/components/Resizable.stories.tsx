import type { Meta, StoryObj } from "@storybook/react-vite";

import { Resizable, ScrollArea } from "../../components";
import { Box, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Resizable",
  component: Resizable,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Resizable>;
export default meta;
type Story = StoryObj;

export const Panes: Story = {
  render: () => (
    <div
      className="h-400 max-w-[720px] overflow-hidden rounded-large border border-default"
      style={{ height: 260 }}
    >
      <Resizable>
        <Resizable.Panel defaultSize={30} minSize={20}>
          <ScrollArea className="h-full">
            <Stack space="space.0">
              {Array.from({ length: 24 }, (_, i) => (
                <Box key={i} paddingInline="space.150" paddingBlock="space.075">
                  <Text size="small">CTRL-{400 + i}</Text>
                </Box>
              ))}
            </Stack>
          </ScrollArea>
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel>
          <Box padding="space.200">
            <Text color="color.text.subtle">Drag the hairline. The arrow keys move it too.</Text>
          </Box>
        </Resizable.Panel>
      </Resizable>
    </div>
  ),
};

/** Horizontal and vertical splits with a minimum. */
export const ResizableMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Box style={{ height: 120 }} className="rounded-medium border border-default">
        <Resizable>
          <Resizable.Panel defaultSize={30} minSize={20}>
            <Box padding="space.150">
              <Text size="small">List · 30%</Text>
            </Box>
          </Resizable.Panel>
          <Resizable.Handle />
          <Resizable.Panel>
            <Box padding="space.150">
              <Text size="small">Detail</Text>
            </Box>
          </Resizable.Panel>
        </Resizable>
      </Box>
      <Box style={{ height: 200 }} className="rounded-medium border border-default">
        <Resizable orientation="vertical">
          <Resizable.Panel defaultSize={50}>
            <Box padding="space.150">
              <Text size="small">Top</Text>
            </Box>
          </Resizable.Panel>
          <Resizable.Handle />
          <Resizable.Panel>
            <Box padding="space.150">
              <Text size="small">Bottom</Text>
            </Box>
          </Resizable.Panel>
        </Resizable>
      </Box>
    </Stack>
  ),
};
