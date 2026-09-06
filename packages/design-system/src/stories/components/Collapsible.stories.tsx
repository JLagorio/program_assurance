import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";

import { Button, Collapsible, Input } from "../../components";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Collapsible>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CollapsibleMatrix: Story = {
  tags: ["contract"],
  render: () => (
    <Stack space="space.200">
      <Collapsible>
        <Collapsible.Trigger asChild>
          <Button>Show details</Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Text>Additional details</Text>
        </Collapsible.Content>
      </Collapsible>
      <Collapsible defaultOpen>
        <Collapsible.Trigger>Initially open</Collapsible.Trigger>
        <Collapsible.Content>Initially visible content</Collapsible.Content>
      </Collapsible>
      <Collapsible disabled>
        <Collapsible.Trigger>Unavailable details</Collapsible.Trigger>
        <Collapsible.Content>Disabled content</Collapsible.Content>
      </Collapsible>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within, waitFor } = await import("storybook/test");
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Show details" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(canvas.getByText("Additional details")).toBeVisible());
    await userEvent.keyboard(" ");
    await waitFor(() => expect(canvas.queryByText("Additional details")).toBeNull());
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole("button", { name: "Unavailable details" })).toBeDisabled();
    await expect(canvasElement.querySelector("button button")).toBeNull();
  },
};

function RetainedExample() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <Stack space="space.200">
      <Button
        onClick={() => {
          setOpen(true);
          trigger.current?.focus();
        }}
      >
        Open and focus externally
      </Button>
      <Collapsible open={open} onOpenChange={setOpen} data-testid="retained-root">
        <Collapsible.Trigger asChild ref={trigger}>
          <Button>Advanced options</Button>
        </Collapsible.Trigger>
        <Collapsible.Content forceMount data-testid="retained-content">
          <Input aria-label="Draft value" defaultValue="Original" />
        </Collapsible.Content>
      </Collapsible>
      <Button>After disclosure</Button>
    </Stack>
  );
}

export const ControlledAndRetained: Story = {
  tags: ["contract"],
  render: () => <RetainedExample />,
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("retained-content")).not.toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Open and focus externally" }));
    const trigger = canvas.getByRole("button", { name: "Advanced options" });
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByTestId("retained-content")).toHaveAttribute(
      "id",
      trigger.getAttribute("aria-controls"),
    );
    const input = canvas.getByRole("textbox", { name: "Draft value" });
    await userEvent.clear(input);
    await userEvent.type(input, "Keep this draft");
    await userEvent.click(trigger);
    await expect(canvas.getByTestId("retained-content")).not.toBeVisible();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "After disclosure" })).toHaveFocus();
    await userEvent.click(trigger);
    await expect(canvas.getByRole("textbox", { name: "Draft value" })).toHaveValue(
      "Keep this draft",
    );
  },
};
