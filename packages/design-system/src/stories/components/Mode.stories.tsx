import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { MODE_STORAGE_KEY, ModeProvider, ModeSwitch, useMode, type ColorMode } from "../../mode";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";

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

/** Each state, icons only and with labels. Nothing here touches the root. */
export const ModeMatrix: Story = {
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
