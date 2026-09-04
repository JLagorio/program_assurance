import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../components";
import { Stack, Text } from "../../primitives";
import { Block } from "../../shapes";

const meta = {
  title: "Shapes/Block",
  component: Block,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Block>;
export default meta;
type Story = StoryObj;

/** Title alone, with a count, with an action, and a count of zero. */
export const BlockMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Block title="Findings">
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Block>
      <Block title="Findings" count={7}>
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Block>
      <Block title="Findings" count={7} action={<Button size="xsmall">New finding</Button>}>
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Block>
      <Block title="Findings" count={0}>
        <Text size="small" color="color.text.subtle">
          A zero count still shows.
        </Text>
      </Block>
    </Stack>
  ),
};
