import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "../../components";
import { MODE_STORAGE_KEY, ModeProvider, ModeSwitch, useMode, type ColorMode } from "../../mode";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Mode",
  component: ModeSwitch,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ModeSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

function Resolved() {
  const { mode, resolved } = useMode();
  return (
    <Text size="small" color="color.text.subtle">
      Choice: {mode} · on screen: {resolved} · stored under {MODE_STORAGE_KEY}
    </Text>
  );
}

/** The provider and the control together. The choice is stored in this browser and applied to the root, so it outlives the toolbar's setting until you change either. */
export const Live: Story = {
  render: () => (
    <ModeProvider>
      <Stack space="space.150">
        <ModeSwitch />
        <Resolved />
      </Stack>
    </ModeProvider>
  ),
};

function Controlled() {
  const [mode, setMode] = useState<ColorMode>("dark");
  return (
    <Stack space="space.150">
      <ModeSwitch value={mode} onChange={setMode} showLabels />
      <Text size="small" color="color.text.subtle">
        Held by the story, not stored: {mode}
      </Text>
    </Stack>
  );
}
/** `value` and `onChange` override the provider, for a settings form that commits later. */
export const ControlledStory: Story = { name: "Controlled", render: () => <Controlled /> };

/** Each state, icons only and with labels; then the control in a row of chrome. Nothing here touches the root. */
export const ModeMatrix: Story = {
  tags: ["contract"],
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["icons", "labels"] as const}
        cols={["light", "dark", "system"] as const}
        rowLabel="form"
        render={(form, mode) => (
          <ModeSwitch value={mode} onChange={() => {}} showLabels={form === "labels"} />
        )}
      />
      <Specimens title="In a row of chrome">
        <Inline space="space.100" alignBlock="center">
          <Text size="small" color="color.text.subtle">
            Appearance
          </Text>
          <ModeSwitch value="system" onChange={() => {}} />
        </Inline>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. Flip the toolbar to dark for the second pair. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<ModeSwitch value="system" onChange={() => {}} showLabels />}
        doText="Three states. System is the default, so a reader who never touches it gets what their machine says."
        dont={
          <Inline space="space.100" alignBlock="center">
            <Text size="small">Dark mode</Text>
            <Button variant="secondary" size="small">
              Off
            </Button>
          </Inline>
        }
        dontText="A two-state toggle. It has no answer for a machine that flips at dusk, and it pins a choice the reader never made."
      />
      <Pair
        do={
          <Box
            padding="space.200"
            backgroundColor="elevation.surface.raised"
            className="rounded-large border border-default"
          >
            <Text>On the surface token: the card follows the mode.</Text>
          </Box>
        }
        doText="Every colour is a token, so the mode flips everything at once and nothing is written twice."
        dont={
          <div
            className="rounded-large border border-default p-200"
            style={{ background: "#ffffff", color: "#172b4d" }}
          >
            <Text as="span">A hex colour: the card glares in dark.</Text>
          </div>
        }
        dontText="A colour by hand. In light it passes; in dark it is a white card on a dark page, and no switch can fix it."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: { value: "system", showLabels: true },
  render: (args) => <ModeSwitch {...args} onChange={() => {}} />,
};

/** A controlled read-only field must not silently write the surrounding provider. */
export const ControlledOwnershipContract: Story = {
  tags: ["contract"],
  render: () => (
    <ModeProvider storageKey="ledger.story.mode-ownership">
      <Stack>
        <ModeSwitch value="light" showLabels aria-label="Read-only draft" />
        <Resolved />
      </Stack>
    </ModeProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = canvas.getByText(/^Choice:/).textContent;
    const draft = within(canvas.getByRole("radiogroup", { name: "Read-only draft" }));
    await userEvent.click(draft.getByRole("radio", { name: "Dark" }));
    await expect(draft.getByRole("radio", { name: "Light" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(canvas.getByText(/^Choice:/)).toHaveTextContent(before ?? "");
  },
};
