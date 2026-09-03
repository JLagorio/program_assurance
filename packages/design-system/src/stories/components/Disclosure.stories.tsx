import type { Meta, StoryObj } from "@storybook/react-vite";

import { Accordion, Collapsible } from "../../components";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Disclosure",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

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

/** Collapsible closed and open, with and without a count; Accordion single and multiple. */
export const DisclosureMatrix: Story = {
  render: () => (
    <Stack space="space.300">
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
    </Stack>
  ),
};
