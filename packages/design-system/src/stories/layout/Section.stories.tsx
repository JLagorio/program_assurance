import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Badge, Button, Section, Stack } from "../..";
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

/** The parts by hand: a Badge beside the title, two actions, and the heading at the level the outline needs. */
export const Composed: Story = {
  render: () => (
    <Section>
      <Section.Header divided>
        <Section.Heading>
          <span className="flex min-w-0 items-baseline gap-100">
            <Section.Title render={<h3 />}>Recorded runs</Section.Title>
            <Badge tone="success" size="xsmall">
              Passing
            </Badge>
          </span>
          <Section.Description>The last three campaigns, newest first.</Section.Description>
        </Section.Heading>
        <Section.Actions>
          <Button size="small">Export</Button>
          <Button size="small" variant="primary">
            Add test run
          </Button>
        </Section.Actions>
      </Section.Header>
      Three runs.
    </Section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region", { name: "Recorded runs" });
    await expect(within(region).getByRole("heading", { level: 3 })).toBeVisible();
    await expect(within(region).getAllByRole("button")).toHaveLength(2);
  },
};

/** No title and no heading: a plain container, not a named region. */
export const Untitled: Story = {
  render: () => <Section>Nothing attached yet.</Section>,
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('[data-slot="section"]');
    await expect(section).toBeInTheDocument();
    await expect(section).not.toHaveAttribute("aria-labelledby");
    await expect(within(canvasElement).queryByRole("region")).toBeNull();
  },
};
