import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button, Command } from "../../components";
import { CommandPalette, type PaletteCommand, useCommandPalette } from "../../patterns";
import { Stack } from "../../primitives";
import { Pair } from "../_lib/pair";

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
/** Open, with three groups, hints on two commands and the keys in the footer: the one state a palette has. */
export const CommandPaletteMatrix: Story = {
  tags: ["contract"],
  render: () => <CommandPalette open onClose={() => undefined} commands={commands} />,
};

/** The palette's list, inline, for a pair. */
function Rows({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-large border border-default bg-surface-overlay shadow-raised">
      <Command label="Commands">
        <Command.Input placeholder="Type a command…" />
        <Command.List>{children}</Command.List>
      </Command>
    </div>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Rows>
            <Command.Group heading="Record">
              <Command.Item value="assess" trailing="A">
                Record an assessment
              </Command.Item>
              <Command.Item value="export" trailing="⇧E">
                Export the SSP
              </Command.Item>
            </Command.Group>
            <Command.Group heading="Go to">
              <Command.Item value="controls">Controls</Command.Item>
              <Command.Item value="findings">Findings</Command.Item>
            </Command.Group>
          </Rows>
        }
        doText="A verb and its object under a heading that says what kind of command it is; the shortcut at the end."
        dont={
          <Rows>
            <Command.Item value="assessment">Assessment</Command.Item>
            <Command.Item value="ssp">SSP</Command.Item>
            <Command.Item value="controls page">Controls page</Command.Item>
            <Command.Item value="findings page">Findings page</Command.Item>
            <Command.Item value="dark">Dark mode</Command.Item>
            <Command.Item value="settings">Settings</Command.Item>
          </Rows>
        }
        dontText="Nouns in one list. Assessment is a place or a thing to do, and nothing groups the six."
      />
    </Stack>
  ),
};

function RepeatedCommandsDemo() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("Nothing run");
  return (
    <Stack space="space.150">
      <Button onClick={() => setOpen(true)}>Open repeated commands</Button>
      <span role="status">{result}</span>
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        commands={[
          { id: "first", group: "Actions", label: "Export", run: () => setResult("First export") },
          {
            id: "second",
            group: "Actions",
            label: "Export",
            run: () => setResult("Second export"),
          },
          { id: "settings", group: "Go to", label: "Settings", run: () => setResult("Settings") },
          { id: "third", group: "Actions", label: "Export", run: () => setResult("Third export") },
        ]}
      />
    </Stack>
  );
}

/** Distinct command identities survive identical labels and repeated nonadjacent headings. */
export const RepeatedCommandIdentity: Story = {
  tags: ["contract"],
  render: () => <RepeatedCommandsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open repeated commands" }));
    const dialog = within(await page.findByRole("dialog", { name: "Command palette" }));
    await userEvent.type(dialog.getByRole("combobox"), "Export");
    const options = dialog.getAllByRole("option", { name: "Export" });
    await expect(options).toHaveLength(3);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await expect(await canvas.findByRole("status")).toHaveTextContent("Second export");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Open repeated commands" }));
    const reopened = within(await page.findByRole("dialog", { name: "Command palette" }));
    await userEvent.click(reopened.getAllByRole("option", { name: "Export" })[2]!);
    await expect(await canvas.findByRole("status")).toHaveTextContent("Third export");
  },
};
