import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleCheck, Clock, Shield, TriangleAlert } from "lucide-react";
import { expect } from "storybook/test";

import { Icon } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/Icon",
  component: Icon,
  parameters: { layout: "padded" },
  args: { children: <Shield />, label: "Authorization boundary", size: "small" },
} satisfies Meta<typeof Icon>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The two sizes, the icon colours, and a named mark beside a decorative one. */
export const IconMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <Specimens title="size small (14px) · medium (16px)">
        <Icon size="small">
          <Shield />
        </Icon>
        <Icon size="medium">
          <Shield />
        </Icon>
      </Specimens>
      <Specimens title="color">
        <Icon color="color.icon">
          <Shield />
        </Icon>
        <Icon color="color.icon.subtle">
          <Clock />
        </Icon>
        <Icon color="color.icon.success" label="Met">
          <CircleCheck />
        </Icon>
        <Icon color="color.icon.warning" label="Needs review">
          <TriangleAlert />
        </Icon>
        <Icon color="color.icon.danger" label="Overdue">
          <Clock />
        </Icon>
      </Specimens>
      <Specimens title="A mark that stands for something is named; one beside its word is not">
        <Inline space="space.050" alignBlock="center">
          <Icon color="color.icon.subtle" label="Authorization boundary">
            <Shield />
          </Icon>
          <Text>Tactical edge segment</Text>
        </Inline>
        <Inline space="space.050" alignBlock="center">
          <Icon color="color.icon.subtle">
            <Clock />
          </Icon>
          <Text>Due 12 Nov 2026</Text>
        </Inline>
      </Specimens>
    </Stack>
  ),
};

/** With a `label` the icon is an image with that name; without one it is hidden, because the word beside it says the same. */
export const Named: Story = {
  render: () => (
    <Stack space="space.100">
      <Inline space="space.050" alignBlock="center">
        <Icon color="color.icon.subtle" label="Authorization boundary" data-testid="named">
          <Shield />
        </Icon>
        <Text>Tactical edge segment</Text>
      </Inline>
      <Inline space="space.050" alignBlock="center">
        <Icon color="color.icon.subtle" data-testid="decorative">
          <Clock />
        </Icon>
        <Text>Due 12 Nov 2026</Text>
      </Inline>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const named = canvas.getByRole("img", { name: "Authorization boundary" });
    await expect(named).toBe(canvas.getByTestId("named"));
    await expect(named).toHaveAttribute("data-slot", "icon");
    await expect(named).not.toHaveAttribute("aria-hidden");
    const decorative = canvas.getByTestId("decorative");
    await expect(decorative).toHaveAttribute("aria-hidden", "true");
    await expect(decorative).not.toHaveAttribute("role");
    await expect(canvas.queryAllByRole("img")).toHaveLength(1);
    const glyph = named.querySelector("svg")!;
    await expect(glyph.getBoundingClientRect().width).toBe(14);
  },
};

/** `render` puts the icon on another element, here a `div`, with the same name and size. */
export const Rendered: Story = {
  render: () => (
    <Icon render={<div />} size="medium" label="Met" color="color.icon.success">
      <CircleCheck />
    </Icon>
  ),
  play: async ({ canvas }) => {
    const icon = canvas.getByRole("img", { name: "Met" });
    await expect(icon.tagName).toBe("DIV");
    await expect(icon.querySelector("svg")!.getBoundingClientRect().width).toBe(16);
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  // The negative example is the defect itself: a name on an element that cannot carry one.
  parameters: { a11y: { config: { rules: [{ id: "aria-prohibited-attr", enabled: false }] } } },
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Icon color="color.icon.subtle" label="Authorization boundary">
            <Shield />
          </Icon>
        }
        doText="A mark that stands alone is an Icon with a label: an image with a name a screen reader says."
        dont={
          <span aria-label="Authorization boundary">
            <Shield aria-hidden className="size-icon-small icon-subtle" />
          </span>
        }
        dontText="aria-label on a span. A generic element has no name, so the mark is silent."
      />
      <Pair
        do={
          <Inline space="space.050" alignBlock="center">
            <Icon color="color.icon.success">
              <CircleCheck />
            </Icon>
            <Text>Met</Text>
          </Inline>
        }
        doText="Beside its word, the icon is decoration and has no label; the word is the name."
        dont={
          <Inline space="space.050" alignBlock="center">
            <Icon color="color.icon.success" label="Met">
              <CircleCheck />
            </Icon>
            <Text>Met</Text>
          </Inline>
        }
        dontText="A label that repeats the word. A screen reader says Met twice."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
