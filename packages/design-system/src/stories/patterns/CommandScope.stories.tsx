import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { Alert, AlertDescription, Button, Field, FieldLabel, Input } from "../../components";
import { CommandScope, useScopedCommands } from "../../patterns/command-scope";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/CommandScope",
  component: CommandScope,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CommandScope>;
export default meta;
type Story = StoryObj;

/** A scoped shortcut runs while focus is in the workspace and leaves text input alone. */
export const Workspace: Story = {
  render: function WorkspaceCommands() {
    const [message, setMessage] = useState("No export requested");
    return (
      <CommandScope
        commands={[
          {
            id: "export",
            label: "Export selection",
            shortcut: "Alt+E",
            run: () => setMessage("Selection exported"),
          },
        ]}
      >
        <Stack space="space.150" alignInline="start">
          <Button variant="secondary">Workspace focus</Button>
          <Field>
            <FieldLabel>Notes</FieldLabel>
            <Input placeholder="Text input keeps its own keys" />
          </Field>
          <Text role="status">{message}</Text>
          <Text size="small" color="color.text.subtle">
            Focus the workspace button and press Alt+E.
          </Text>
        </Stack>
      </CommandScope>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("textbox", { name: "Notes" }));
    await userEvent.keyboard("{Alt>}e{/Alt}");
    await expect(canvas.getByRole("status")).toHaveTextContent("No export requested");
    await userEvent.click(canvas.getByRole("button", { name: "Workspace focus" }));
    await userEvent.keyboard("{Alt>}e{/Alt}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Selection exported");
  },
};

/** The closest scope owns the command; an unavailable local action never falls through. */
export const NestedScopes: Story = {
  render: function NestedWorkspace() {
    const [message, setMessage] = useState("Nothing changed");
    return (
      <CommandScope
        commands={[
          {
            id: "edit",
            label: "Edit workspace",
            shortcut: "Alt+E",
            run: () => setMessage("Workspace edited"),
          },
        ]}
      >
        <Stack space="space.150" alignInline="start">
          <Button variant="secondary">Workspace</Button>
          <CommandScope
            commands={[
              {
                id: "edit",
                label: "Edit cell",
                shortcut: "Alt+E",
                run: () => setMessage("Cell edited"),
              },
            ]}
          >
            <Button variant="secondary">Cell</Button>
          </CommandScope>
          <CommandScope
            commands={[
              {
                id: "edit",
                label: "Edit locked cell",
                shortcut: "Alt+E",
                enabled: false,
                disabledReason: "This cell is read-only",
                run: () => setMessage("Unexpected edit"),
              },
            ]}
          >
            <Button variant="secondary">Locked cell</Button>
          </CommandScope>
          <Text role="status">{message}</Text>
        </Stack>
      </CommandScope>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Cell$/ }));
    await userEvent.keyboard("{Alt>}e{/Alt}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Cell edited");
    await userEvent.click(canvas.getByRole("button", { name: "Locked cell" }));
    await userEvent.keyboard("{Alt>}e{/Alt}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Cell edited");
    await userEvent.click(canvas.getByRole("button", { name: /^Workspace$/ }));
    await userEvent.keyboard("{Alt>}e{/Alt}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Workspace edited");
  },
};

function RegisteredActions() {
  const { commands, run } = useScopedCommands();
  const [error, setError] = useState("");
  return (
    <Stack space="space.150" alignInline="start">
      {commands
        .filter((command) => !command.hidden)
        .map((command) => (
          <Button
            key={command.id}
            disabledReason={command.enabled === false ? command.disabledReason : undefined}
            onClick={() => void run(command.id).catch((reason: Error) => setError(reason.message))}
          >
            {command.label}
          </Button>
        ))}
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Stack>
  );
}

/** Buttons and palettes execute the same guarded action, with failures owned by the host. */
export const SharedActions: Story = {
  tags: ["!manifest"],
  render: () => (
    <CommandScope
      commands={[
        {
          id: "save",
          label: "Save changes",
          run: async () => {
            throw new Error("The connection was interrupted. Your changes are retained.");
          },
        },
      ]}
    >
      <RegisteredActions />
    </CommandScope>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Your changes are retained");
  },
};
