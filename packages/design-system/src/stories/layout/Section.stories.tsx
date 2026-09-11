import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Section, Stack } from "../..";
const meta = {
  title: "Layout/Section",
  component: Section,
  parameters: { layout: "padded" },
  args: { title: "Evidence", children: "No files attached." },
} satisfies Meta<typeof Section>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Presentation: Story = {
  render: () => (
    <Stack space="space.400">
      <Section title="Evidence" count={0} action={<Button size="small">Attach file</Button>}>
        No files attached.
      </Section>
      <Section title="Activity" divided description="Recent changes to this record.">
        Review requested by Alex Morgan.
      </Section>
    </Stack>
  ),
};
