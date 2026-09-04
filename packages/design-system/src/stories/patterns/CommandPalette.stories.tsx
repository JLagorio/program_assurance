import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../components";
import { CommandPalette, type PaletteCommand, useCommandPalette } from "../../patterns";
import { Stack } from "../../primitives";

const meta = {
  title: "Patterns/CommandPalette",
  component: CommandPalette,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CommandPalette>;
export default meta;
type Story = StoryObj;

const commands: PaletteCommand[] = [
  { id: "assess", group: "Record", label: "Record an assessment", hint: "A", run: () => undefined },
  { id: "export", group: "Record", label: "Export the SSP", hint: "⇧E", run: () => undefined },
  { id: "controls", group: "Go to", label: "Controls", run: () => undefined },
  { id: "findings", group: "Go to", label: "Findings", run: () => undefined },
  { id: "mode", group: "Preferences", label: "Switch the colour mode", run: () => undefined },
];

function PaletteDemo() {
  const palette = useCommandPalette();
  return (
    <Stack space="space.150">
      <Button onClick={() => palette.setOpen(true)}>Open the palette, or press ⌘K</Button>
      <CommandPalette
        open={palette.open}
        onClose={() => palette.setOpen(false)}
        commands={commands}
      />
    </Stack>
  );
}
export const CommandPaletteStory: Story = {
  name: "Command palette",
  render: () => <PaletteDemo />,
};
/** Open, with three groups and hints on two commands: the one state a palette has. */
export const CommandPaletteMatrix: Story = {
  render: () => <CommandPalette open onClose={() => undefined} commands={commands} />,
};
