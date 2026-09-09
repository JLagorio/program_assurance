import { useId } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FieldLabel, Button, Field, Input, TextLink } from "../../components";
import { Section } from "../../patterns";
import { Block } from "../../shapes";
import { Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/Section",
  component: Section,
  parameters: { layout: "padded" },
  args: {
    title: "Control coverage",
    children: (
      <Text size="small" color="color.text.subtle" className="pt-150">
        Body
      </Text>
    ),
  },
} satisfies Meta<typeof Section>;
export default meta;
type Story = StoryObj<typeof meta>;

const body = (
  <Text as="p" size="small" color="color.text.subtle" className="pt-150">
    Body
  </Text>
);

/** Title; with a count; with a constraint under it; with an action at the end. */
export const SectionMatrix: Story = {
  render: () => (
    <Stack space="space.400" className="max-w-layout-measure">
      <Section title="Control coverage">{body}</Section>
      <Section title="Findings" count={3}>
        {body}
      </Section>
      <Section title="Control coverage" description="Derived from the live matrix.">
        {body}
      </Section>
      <Section
        title="Activity"
        count={19}
        action={
          <TextLink size="small" href="#all">
            Full timeline
          </TextLink>
        }
      >
        {body}
      </Section>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Stack space="space.400">
        <Pair
          do={
            <Section title="Authorization package" count={3}>
              {body}
            </Section>
          }
          doText="A heading and a count: the whole label."
          dont={
            <Section
              title="Authorization package"
              description="SSP, SAR and POA&M assembled for the program and served read-only to the government assessor, who reviews them before the authorization decision."
            >
              {body}
            </Section>
          }
          dontText="The model explained under every heading. Forty of these and the page is a document, not a product."
        />
        <Pair
          do={
            <Block title="Assessment result" action={<Button size="small">Save</Button>}>
              <Field>
                <FieldLabel id={`${fieldId}-result-1-label`} htmlFor={`${fieldId}-result-1`}>
                  {"Result"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-result-1`}
                  aria-labelledby={`${fieldId}-result-1-label`}
                  defaultValue="Satisfied"
                />
              </Field>
            </Block>
          }
          doText="The heading names the task, with its Save action beside it."
          dont={
            <Section
              title="Assessment result"
              description="Record the result of the assessment below."
            >
              <Stack space="space.150" className="pt-150">
                <Field>
                  <FieldLabel id={`${fieldId}-result-2-label`} htmlFor={`${fieldId}-result-2`}>
                    {"Result"}
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-result-2`}
                    aria-labelledby={`${fieldId}-result-2-label`}
                    defaultValue="Satisfied"
                  />
                </Field>
                <Button size="small">Save</Button>
              </Stack>
            </Section>
          }
          dontText="The instruction repeats the heading without adding a constraint or useful help."
        />
        <Pair
          do={
            <Section title="Evidence" count={2}>
              {body}
            </Section>
          }
          doText="One level: a page is a stack of regions."
          dont={
            <Section title="Evidence">
              <Stack space="space.300" className="pt-150">
                <Section title="Documents">{body}</Section>
                <Section title="Screenshots">{body}</Section>
              </Stack>
            </Section>
          }
          dontText="Sections in a Section. Two rules, two h2s, and the reader cannot tell which region they are in."
        />
      </Stack>
    );
  },
};

export const Playground: Story = {};
