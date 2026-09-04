import type { Meta, StoryObj } from "@storybook/react-vite";

import { Accordion } from "../../components";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  parameters: { layout: "padded" },
  args: {
    children: (
      <Accordion.Item value="evidence" title="Evidence">
        Bank reconciliation, approval matrix, walkthrough notes.
      </Accordion.Item>
    ),
  },
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AccordionStory: Story = {
  name: "Accordion",
  render: () => (
    <Accordion defaultValue="evidence" className="max-w-[560px]">
      <Accordion.Item value="evidence" title="Evidence" count={3}>
        <Text color="color.text.subtle">
          Bank reconciliation, approval matrix, walkthrough notes.
        </Text>
      </Accordion.Item>
      <Accordion.Item value="history" title="History">
        <Text color="color.text.subtle">Opening this closes Evidence: one at a time.</Text>
      </Accordion.Item>
      <Accordion.Item value="related" title="Related controls" count={2}>
        <Text color="color.text.subtle">CTRL-0418, CTRL-0419.</Text>
      </Accordion.Item>
    </Accordion>
  ),
};

/** Single and multiple. */
export const AccordionMatrix: Story = {
  render: () => (
    <Specimens title="Accordion">
      <Stack space="space.200" className="w-layout-list">
        <Accordion type="single" defaultValue="a">
          <Accordion.Item value="a" title="Single · open" count={3}>
            <Text>One at a time.</Text>
          </Accordion.Item>
          <Accordion.Item value="b" title="Single · closed">
            <Text>Opening this closes the other.</Text>
          </Accordion.Item>
        </Accordion>
        <Accordion type="multiple" defaultValue={["a", "b"]}>
          <Accordion.Item value="a" title="Multiple · open" count="2 of 4">
            <Text>Any number open.</Text>
          </Accordion.Item>
          <Accordion.Item value="b" title="Multiple · open">
            <Text>Any number open.</Text>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Specimens>
  ),
};
