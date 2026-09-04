import type { Meta, StoryObj } from "@storybook/react-vite";

import { Collapsible } from "../../components";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  parameters: { layout: "padded" },
  args: { title: "Discussion", children: "Present, addressable, closed." },
} satisfies Meta<typeof Collapsible>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsibles: Story = {
  render: () => (
    <Stack space="space.0" className="max-w-[560px]">
      <Collapsible title="Catalog statement" defaultOpen>
        <Text color="color.text.subtle">
          Separate the duties of authorising, recording and reconciling payables so no individual
          can complete a transaction alone.
        </Text>
      </Collapsible>
      <Collapsible title="Assessment objectives" count={4}>
        <Text color="color.text.subtle">Four objectives, closed by default.</Text>
      </Collapsible>
      <Collapsible title="Discussion">
        <Text color="color.text.subtle">Present, addressable, closed.</Text>
      </Collapsible>
    </Stack>
  ),
};

/** Closed and open, with and without a count. */
export const CollapsibleMatrix: Story = {
  render: () => (
    <Specimens title="Collapsible">
      <Stack space="space.100" className="w-layout-list">
        <Collapsible title="Closed">
          <Text>Body</Text>
        </Collapsible>
        <Collapsible title="Open" defaultOpen>
          <Text>Body</Text>
        </Collapsible>
        <Collapsible title="With a count" count={12}>
          <Text>Body</Text>
        </Collapsible>
        <Collapsible title="Zero shows nothing" count={0}>
          <Text>Body</Text>
        </Collapsible>
      </Stack>
    </Specimens>
  ),
};
