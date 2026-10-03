import type { Meta, StoryObj } from "@storybook/react-vite";
import { Shield } from "lucide-react";
import { expect, within } from "storybook/test";

import { Absent, Icon, KeyValue } from "../../components";
import { Box, Inline, Stack, Text, VisuallyHidden } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Primitives/VisuallyHidden",
  component: VisuallyHidden,
  parameters: { layout: "padded" },
  args: { children: "Authorization boundary" },
} satisfies Meta<typeof VisuallyHidden>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Words only a screen reader needs: the meaning of a mark beside a name, and a heading for a region that shows none. */
export const Uses: Story = {
  render: () => (
    <Stack space="space.300">
      <Inline space="space.050" alignBlock="center">
        <Icon color="color.icon.subtle">
          <Shield />
        </Icon>
        <VisuallyHidden>Authorization boundary:</VisuallyHidden>
        <Text>Tactical edge segment</Text>
      </Inline>
      <section aria-labelledby="hidden-heading">
        <VisuallyHidden as="h2" id="hidden-heading">
          Schedule
        </VisuallyHidden>
        <Box style={{ maxWidth: 300 }}>
          <KeyValue label="Frequency">Quarterly</KeyValue>
          <KeyValue label="Assessor">
            <Absent label="Not recorded" />
          </KeyValue>
        </Box>
      </section>
    </Stack>
  ),
  play: async ({ canvasElement, canvas }) => {
    const hidden = canvas.getByText("Authorization boundary:");
    await expect(hidden).toHaveAttribute("data-slot", "visually-hidden");
    const box = hidden.getBoundingClientRect();
    await expect(box.width).toBeLessThanOrEqual(1);
    await expect(box.height).toBeLessThanOrEqual(1);
    const region = canvas.getByRole("region", { name: "Schedule" });
    await expect(within(region).getByRole("heading", { level: 2, name: "Schedule" })).toBeVisible();
    await expect(canvasElement.querySelector("h2")!.getBoundingClientRect().height).toBeLessThanOrEqual(1);
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.050" alignBlock="center">
            <Icon color="color.icon.subtle">
              <Shield />
            </Icon>
            <VisuallyHidden>Authorization boundary:</VisuallyHidden>
            <Text>Tactical edge segment</Text>
          </Inline>
        }
        doText="The meaning of the mark as hidden text, read in its place before the name."
        dont={
          <Inline space="space.050" alignBlock="center">
            <span title="Authorization boundary">
              <Shield aria-hidden className="size-icon-small icon-subtle" />
            </span>
            <Text>Tactical edge segment</Text>
          </Inline>
        }
        dontText="A title on a span. It reaches a mouse after a wait and nothing else."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
