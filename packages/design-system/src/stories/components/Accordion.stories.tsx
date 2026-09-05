import type { Meta, StoryObj } from "@storybook/react-vite";

import { Accordion, Collapsible } from "../../components";
import { Section } from "../../patterns";
import { Box, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

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

/** `single`: one section at a time, and the open one closes. A set the reader takes one by one. */
export const AccordionStory: Story = {
  name: "Accordion",
  render: () => (
    <Accordion defaultValue="evidence" className="w-layout-list">
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

/** `multiple`: independent sections with one keyboard model. Reference the reader compares, which is why the Inspector's groups are this. */
export const Compare: Story = {
  render: () => (
    <Box className="w-layout-list">
      <Section title="Details">
        <Accordion type="multiple" defaultValue={["ownership", "dates"]} headingLevel={3} className="pt-150">
          <Accordion.Item value="ownership" title="Ownership">
            <Text color="color.text.subtle">Priya Natarajan, Finance systems.</Text>
          </Accordion.Item>
          <Accordion.Item value="dates" title="Dates">
            <Text color="color.text.subtle">Assessed 12 Aug; next gate 12 Sep.</Text>
          </Accordion.Item>
          <Accordion.Item value="scope" title="Scope" count={4}>
            <Text color="color.text.subtle">Four systems inherit it.</Text>
          </Accordion.Item>
        </Accordion>
      </Section>
    </Box>
  ),
};

/** Single and multiple, all closed, with headings, a disabled item, and inset on a surface. Each set has its own titles: an accordion's panels are region landmarks named by their titles. */
export const AccordionMatrix: Story = {
  render: () => (
    <Specimens title="Accordion">
      <Stack space="space.300" className="w-layout-list">
        <Accordion type="single" defaultValue="a">
          <Accordion.Item value="a" title="Single · open" count={3}>
            <Text color="color.text.subtle">One at a time.</Text>
          </Accordion.Item>
          <Accordion.Item value="b" title="Single · closed">
            <Text color="color.text.subtle">Opening this closes the other.</Text>
          </Accordion.Item>
        </Accordion>
        <Accordion type="multiple" defaultValue={["a", "b"]}>
          <Accordion.Item value="a" title="Multiple · open" count="2 of 4">
            <Text color="color.text.subtle">Any number open.</Text>
          </Accordion.Item>
          <Accordion.Item value="b" title="Multiple · also open">
            <Text color="color.text.subtle">Any number open.</Text>
          </Accordion.Item>
        </Accordion>
        <Accordion type="multiple">
          <Accordion.Item value="a" title="Closed by default">
            <Text color="color.text.subtle">Carbon's default: the titles are the overview.</Text>
          </Accordion.Item>
          <Accordion.Item value="b" title="Closed too">
            <Text color="color.text.subtle">The reader opens what they need.</Text>
          </Accordion.Item>
        </Accordion>
        <Accordion type="multiple" defaultValue="a" headingLevel={3}>
          <Accordion.Item value="a" title="Heading level 3">
            <Text color="color.text.subtle">In the page's outline.</Text>
          </Accordion.Item>
          <Accordion.Item value="b" title="Disabled item" disabled>
            <Text color="color.text.subtle">Cannot open.</Text>
          </Accordion.Item>
        </Accordion>
        <Box className="rounded-large border border-default bg-surface-raised">
          <Accordion type="multiple" defaultValue="a" className="border-b-0">
            <Accordion.Item value="a" title="Inset · open" inset className="border-t-0">
              <Text color="color.text.subtle">Stepped in by space.300, the first rule dropped.</Text>
            </Accordion.Item>
            <Accordion.Item value="b" title="Inset · closed" inset>
              <Text color="color.text.subtle">On a surface.</Text>
            </Accordion.Item>
          </Accordion>
        </Box>
      </Stack>
    </Specimens>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Accordion type="multiple" defaultValue={["owner", "dates"]} className="w-layout-list">
            <Accordion.Item value="owner" title="Ownership, compared">
              <Text color="color.text.subtle">Priya Natarajan, Finance systems.</Text>
            </Accordion.Item>
            <Accordion.Item value="dates" title="Dates, compared">
              <Text color="color.text.subtle">Assessed 12 Aug; next gate 12 Sep.</Text>
            </Accordion.Item>
          </Accordion>
        }
        doText="Reference the reader compares: multiple, so two stay open."
        dont={
          <Accordion type="single" defaultValue="owner" className="w-layout-list">
            <Accordion.Item value="owner" title="Ownership, one at a time">
              <Text color="color.text.subtle">Priya Natarajan, Finance systems.</Text>
            </Accordion.Item>
            <Accordion.Item value="dates" title="Dates, one at a time">
              <Text color="color.text.subtle">Assessed 12 Aug; next gate 12 Sep.</Text>
            </Accordion.Item>
          </Accordion>
        }
        dontText="Single, so opening the dates closes the owner. The reader flips to compare two lines."
      />
      <Pair
        do={
          <Box className="w-layout-list">
            <Collapsible title="Discussion, alone">
              <Text color="color.text.subtle">Why the control exists.</Text>
            </Collapsible>
          </Box>
        }
        doText="One section is a Collapsible."
        dont={
          <Accordion className="w-layout-list">
            <Accordion.Item value="discussion" title="Discussion, an accordion of one">
              <Text color="color.text.subtle">Why the control exists.</Text>
            </Accordion.Item>
          </Accordion>
        }
        dontText="An accordion of one. Nothing knows about anything; the arrows go nowhere."
      />
      <Pair
        do={
          <Stack space="space.400" className="w-layout-list">
            <Section title="Implementation" count={3}>
              <Text as="p" size="small" color="color.text.subtle" className="pt-150">
                The statements, open, in the outline.
              </Text>
            </Section>
            <Section title="Assessment" count={2}>
              <Text as="p" size="small" color="color.text.subtle" className="pt-150">
                The procedures, open.
              </Text>
            </Section>
          </Stack>
        }
        doText="The record's work is Sections, every reader reads them."
        dont={
          <Accordion className="w-layout-list">
            <Accordion.Item value="implementation" title="Implementation, folded" count={3}>
              <Text color="color.text.subtle">The statements.</Text>
            </Accordion.Item>
            <Accordion.Item value="assessment" title="Assessment, folded" count={2}>
              <Text color="color.text.subtle">The procedures.</Text>
            </Accordion.Item>
          </Accordion>
        }
        dontText="The work in an accordion, closed. Carbon: do not fold content the reader will read in full; it adds a click and hides the page."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
