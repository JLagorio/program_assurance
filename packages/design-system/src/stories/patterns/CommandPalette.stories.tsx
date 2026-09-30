import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  formatShortcut,
  getModifierKey,
  KbdShortcut,
} from "../../components";

import { CommandPalette, useCommandPalette, type PaletteCommand } from "../..";
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
  {
    id: "assess",
    group: "Record",
    label: "Record an assessment",
    shortcut: "A",
    run: () => undefined,
  },
  {
    id: "export",
    group: "Record",
    label: "Export the SSP",
    shortcut: "Shift+E",
    run: () => undefined,
  },
  { id: "controls", group: "Go to", label: "Controls", run: () => undefined },
  { id: "findings", group: "Go to", label: "Findings", run: () => undefined },
  { id: "mode", group: "Preferences", label: "Switch the colour mode", run: () => undefined },
];

function PaletteDemo() {
  const palette = useCommandPalette();
  const [editing, setEditing] = useState(false);
  return (
    <Stack space="space.150" alignInline="start">
      <Button onClick={() => palette.setOpen(true)}>
        Open the palette, or press <KbdShortcut keys="Mod+K" />
      </Button>
      <Button variant="secondary" onClick={() => setEditing(true)}>
        Edit the program
      </Button>
      <CommandPalette
        open={palette.open}
        onClose={() => palette.setOpen(false)}
        commands={commands}
      />
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent width="medium">
          <DialogHeader>
            <DialogTitle>Edit program</DialogTitle>
          </DialogHeader>
          <DialogBody>Over this dialog the palette's shortcut does nothing.</DialogBody>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

const press = (init: KeyboardEventInit) =>
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", bubbles: true, ...init }));

/**
 * `useCommandPalette` toggles the palette on ⌘K on Apple platforms and Ctrl+K elsewhere. It
 * ignores a held key's repeats, the chord with another modifier, the other platform's modifier, a
 * key a handler has already taken, and the chord pressed over another dialog.
 */
export const CommandPaletteStory: Story = {
  name: "Command palette",
  render: () => <PaletteDemo />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const apple = getModifierKey() === "meta";
    const mod = apple ? { metaKey: true } : { ctrlKey: true };
    const other = apple ? { ctrlKey: true } : { metaKey: true };
    const palette = () => page.queryByRole("dialog", { name: "Command palette" });
    press(mod);
    await waitFor(() => expect(palette()).toBeVisible());
    // A held key's repeats leave it open.
    press({ ...mod, repeat: true });
    press({ ...mod, repeat: true });
    await expect(palette()).toBeVisible();
    // With Shift held it is another chord.
    press({ ...mod, shiftKey: true });
    await expect(palette()).toBeVisible();
    press(mod);
    await waitFor(() => expect(palette()).toBeNull());
    press(other);
    press({ ...mod, shiftKey: true });
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(palette()).toBeNull();
    // A key a handler has already taken is its.
    const taken = new KeyboardEvent("keydown", {
      key: "k",
      bubbles: true,
      cancelable: true,
      ...mod,
    });
    taken.preventDefault();
    document.dispatchEvent(taken);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(palette()).toBeNull();
    // Over another dialog it does nothing, so no second modal stacks on a draft.
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Edit the program" }));
    await page.findByRole("dialog", { name: "Edit program" });
    press(mod);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(palette()).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
  },
};

/**
 * Open, with three groups, shortcuts on two commands and the keys in the footer: the one state a
 * palette has. A shortcut is drawn in the platform's glyphs and said as `aria-keyshortcuts`, so a
 * command's name is its label.
 */
export const CommandPaletteMatrix: Story = {
  render: () => <CommandPalette open onClose={() => undefined} commands={commands} />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole("dialog", { name: "Command palette" });
    await expect(dialog).toHaveAccessibleDescription("Search for a command to run.");
    const input = within(dialog).getByRole("combobox", { name: "Command palette" });
    await expect(input).toHaveAttribute("placeholder", "Type a command…");
    const exporting = within(dialog).getByRole("option", { name: "Export the SSP" });
    await expect(exporting).toHaveAttribute(
      "aria-keyshortcuts",
      formatShortcut("Shift+E", { modifier: getModifierKey(), as: "aria" }),
    );
    await expect(within(dialog).getByRole("option", { name: "Controls" })).not.toHaveAttribute(
      "aria-keyshortcuts",
    );
    await waitFor(() =>
      expect(input).toHaveAttribute(
        "aria-activedescendant",
        within(dialog).getByRole("option", { name: "Record an assessment" }).id,
      ),
    );
  },
};

/** Ids that look like the product's: a UUID after the kind. */
const records: PaletteCommand[] = [
  ["Open TEST · TEST", "Go to"],
  ["Open Controls", "Go to"],
  ["Open Findings", "Go to"],
  ["Switch the colour mode", "Preferences"],
].map(([label, group], index) => ({
  id: `program-4de1${index}c2a-12de-4d3e-9de0-${index}0dea0d12de12`,
  group: group!,
  label: label!,
  run: () => undefined,
}));

/** The palette matches a command's label, then its heading and hint, never its `id`, so a UUID's letters cannot make a two-letter query match every command. */
export const MatchesLabelsNotIds: Story = {
  name: "Matches labels, not ids",
  render: () => <CommandPalette open onClose={() => undefined} commands={records} />,
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole("dialog", { name: "Command palette" });
    const input = within(dialog).getByRole("combobox", { name: "Command palette" });
    await userEvent.type(input, "de");
    // Every id holds "de"; only "Switch the colour mode" does, as a subsequence of its label.
    await waitFor(() => expect(within(dialog).getAllByRole("option")).toHaveLength(1));
    await expect(within(dialog).getByRole("option")).toHaveTextContent("Switch the colour mode");
    await userEvent.clear(input);
    await userEvent.type(input, "12");
    await waitFor(() => expect(within(dialog).queryAllByRole("option")).toHaveLength(0));
    await expect(within(dialog).getByText("No commands match.")).toBeVisible();
  },
};

const retry = fn();

/**
 * While commands load, the palette says it is searching and never that nothing matched; a failure
 * shows above the list with Try again. The name, the field, the empty sentence and Enter's verb
 * take the caller's words.
 */
export const LoadingAndFailure: Story = {
  name: "Loading and failure",
  render: () => (
    <Stack space="space.200">
      <CommandPalette
        open
        onClose={() => undefined}
        commands={[]}
        loading
        title="Program actions"
        placeholder="Type an action…"
        noResults="No actions match."
        chooseHint="to start"
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole("dialog", { name: "Program actions" });
    await waitFor(() => expect(within(dialog).getByText("Searching…")).toBeVisible());
    await expect(within(dialog).queryByText("No actions match.")).toBeNull();
    await expect(within(dialog).getByText("to start")).toBeVisible();
    await expect(within(dialog).getByRole("listbox")).toHaveAttribute("aria-busy", "true");
  },
};

/** A failure shows above the commands already listed, with Try again, which returns focus to the field. */
export const Failure: Story = {
  render: () => (
    <CommandPalette
      open
      onClose={() => undefined}
      commands={commands.slice(0, 2)}
      error
      onRetry={retry}
    />
  ),
  play: async ({ canvasElement }) => {
    retry.mockClear();
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole("dialog", { name: "Command palette" });
    await waitFor(() =>
      expect(within(dialog).getByText("The commands could not load.")).toBeVisible(),
    );
    await expect(within(dialog).getAllByRole("option")).toHaveLength(2);
    const again = within(dialog).getByRole("button", { name: "Try again" });
    await expect(again).toHaveAccessibleDescription("The commands could not load.");
    await userEvent.click(again);
    await expect(retry).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(within(dialog).getByRole("combobox", { name: "Command palette" })).toHaveFocus(),
    );
  },
};

/** The palette's list, inline, for a pair. */
function Rows({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-large border border-default bg-surface-overlay shadow-raised">
      <Command label="Commands">
        <CommandInput placeholder="Type a command…"></CommandInput>
        <CommandList>{children}</CommandList>
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
            <CommandGroup heading="Record">
              <CommandItem value="assess" shortcut="A">
                Record an assessment
              </CommandItem>
              <CommandItem value="export" shortcut="Shift+E">
                Export the SSP
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Go to">
              <CommandItem value="controls">Controls</CommandItem>
              <CommandItem value="findings">Findings</CommandItem>
            </CommandGroup>
          </Rows>
        }
        doText="A verb and its object under a heading that says what kind of command it is; the shortcut at the end."
        dont={
          <Rows>
            <CommandItem value="assessment">Assessment</CommandItem>
            <CommandItem value="ssp">SSP</CommandItem>
            <CommandItem value="controls page">Controls page</CommandItem>
            <CommandItem value="findings page">Findings page</CommandItem>
            <CommandItem value="dark">Dark mode</CommandItem>
            <CommandItem value="settings">Settings</CommandItem>
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
