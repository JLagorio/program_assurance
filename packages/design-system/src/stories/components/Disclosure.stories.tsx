import type { Meta, StoryObj } from "@storybook/react-vite";

import { Accordion, Collapsible } from "../../components";
import { Stack, Text } from "../../primitives";

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
        <Text color="color.text.subtle">Separate the duties of authorising, recording and reconciling payables so no individual can complete a transaction alone.</Text>
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
        <Text color="color.text.subtle">Bank reconciliation, approval matrix, walkthrough notes.</Text>
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
