import { ChevronDown } from "lucide-react";
import { Collapsible } from "../../components";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Indicator, Table } from "../../components";

import { Section } from "../../patterns";
import { Stack, Text } from "../../primitives";
import { Block } from "../../shapes";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Shapes/Block",
  component: Block,
  parameters: { layout: "padded" },
  args: {
    title: "Open findings",
    count: 2,
    children: (
      <Stack space="space.100">
        <Indicator tone="danger">Approver released a payment in July</Indicator>
        <Indicator tone="warning">Vendor bank change without call-back</Indicator>
      </Stack>
    ),
  },
} satisfies Meta<typeof Block>;
export default meta;
type Story = StoryObj<typeof meta>;

const findings = (
  <Stack space="space.100">
    <Indicator tone="danger">Approver released a payment in July</Indicator>
    <Indicator tone="warning">Vendor bank change without call-back</Indicator>
  </Stack>
);

/** Title alone; with a count; with an action; a count of zero; a table as the work. */
export const BlockMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Block title="Determination">
        <Text color="color.text.subtle">The work: a form, a narrative, a list.</Text>
      </Block>
      <Block title="Open findings" count={2}>
        {findings}
      </Block>
      <Block title="Open findings" count={2} action={<Button size="small">Add finding</Button>}>
        {findings}
      </Block>
      <Block title="Evidence requests" count={0}>
        <Text color="color.text.subtle">None open.</Text>
      </Block>
      <Block title="Parameters" count={2}>
        <Table label="Parameters">
          <thead>
            <tr>
              <Table.Header width={140}>Parameter</Table.Header>
              <Table.Header>Value</Table.Header>
            </tr>
          </thead>
          <tbody>
            <Table.Row>
              <Table.Cell>AC-2(3)[01]</Table.Cell>
              <Table.Cell>90 days</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>AC-2(3)[02]</Table.Cell>
              <Table.Cell>30 days</Table.Cell>
            </Table.Row>
          </tbody>
        </Table>
      </Block>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Block title="Open findings" count={2}>
            {findings}
          </Block>
        }
        doText="A noun and a count. The heading says what the work is and how much of it there is."
        dont={
          <Section
            title="Open findings"
            description="Findings raised against this control during the current assessment that have not yet been closed by the assessor."
          >
            <div className="pt-150">{findings}</div>
          </Section>
        }
        dontText="A sentence under the heading explaining the model. The reader came to work, not to read; a heading carries a count or a constraint, never an explanation."
      />
      <Pair
        do={
          <Block title="Determination">
            <Text color="color.text.subtle">The work, open.</Text>
          </Block>
        }
        doText="The work the reader came for is always open: a Block."
        dont={
          <Collapsible className="border-t border-default">
            <h3>
              <Collapsible.Trigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
                {"Determination"}
                <ChevronDown
                  aria-hidden="true"
                  className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/collapsible:rotate-180"
                />
              </Collapsible.Trigger>
            </h3>
            <Collapsible.Content>
              <div className="pb-200">
                <Text color="color.text.subtle">The work, behind a click.</Text>
              </div>
            </Collapsible.Content>
          </Collapsible>
        }
        dontText="The work folded. Collapsible is for reference the reader may not need; folding the determination hides the page's job."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
