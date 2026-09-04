import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextLink } from "../../components";
import { Section } from "../../patterns";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/Section",
  component: Section,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Section>;
export default meta;
type Story = StoryObj;

/** Title; with a description; with an action. */
export const SectionMatrix: Story = {
  render: () => (
    <Stack space="space.400" className="max-w-layout-measure">
      <Section title="Control coverage">
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Section>
      <Section
        title="Control coverage"
        description="Everything below is derived from the live matrix."
      >
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Section>
      <Section
        title="Control coverage"
        action={
          <TextLink size="small">
            <a href="#all">Full timeline</a>
          </TextLink>
        }
      >
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Section>
    </Stack>
  ),
};
