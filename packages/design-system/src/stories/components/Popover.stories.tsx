import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Popover } from "../../components";
import { Box, Stack, Text } from "../../primitives";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj;

/** Every side and alignment as a trigger; the start-aligned one is open. */
export const PopoverMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="p-400">
      <Matrix
        rows={["top", "right", "bottom", "left"] as const}
        cols={["start", "center", "end"] as const}
        rowLabel="side"
        render={(side, align) => (
          <Popover
            label="Placement"
            trigger={
              <Button variant="secondary" size="small">
                {side} · {align}
              </Button>
            }
            side={side}
            align={align}
            width={220}
          >
            <Stack space="space.050">
              <Text weight="medium">Popover</Text>
              <Text size="small" color="color.text.subtle">
                {side}, aligned {align}.
              </Text>
            </Stack>
          </Popover>
        )}
      />
      <Box style={{ height: 160 }}>
        <Popover
          label="Open by default"
          trigger={
            <Button variant="secondary" size="small">
              Open by default
            </Button>
          }
          defaultOpen
          width={260}
        >
          <Stack space="space.100">
            <Text weight="medium">Columns</Text>
            <Text size="small" color="color.text.subtle">
              A popover holds a small form or a list of options; anything larger is a Sheet.
            </Text>
            <Popover.Close>
              <Button size="small">Done</Button>
            </Popover.Close>
          </Stack>
        </Popover>
      </Box>
    </Stack>
  ),
};
