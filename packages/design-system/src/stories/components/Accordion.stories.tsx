import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";

import { Accordion, Button, Collapsible, Input } from "../../components";
import { Box, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  args: { type: "single" },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

function Entry({
  value,
  label,
  disabled = false,
}: {
  value: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Accordion.Item value={value} disabled={disabled} className="border-b border-default">
      <Accordion.Header>
        <Accordion.Trigger>{label}</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content>
        <Text className="pb-200">Content for {label}.</Text>
      </Accordion.Content>
    </Accordion.Item>
  );
}

export const AccordionMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="w-layout-list max-w-full">
      <Accordion type="single" collapsible defaultValue="first" aria-label="Single selection">
        <Entry value="first" label="First section" />
        <Entry value="disabled" label="Unavailable section" disabled />
        <Entry value="last" label="Last section" />
      </Accordion>
      <Accordion type="multiple" defaultValue={["alpha", "beta"]} aria-label="Multiple selection">
        <Entry value="alpha" label="Alpha section" />
        <Entry value="beta" label="Beta section" />
      </Accordion>
      <Accordion type="single" disabled aria-label="Disabled set">
        <Entry value="locked" label="Locked section" />
      </Accordion>
      <Accordion type="single" dir="rtl" aria-label="Right to left layout">
        <Entry
          value="long"
          label="A long section title that wraps within a narrow container without truncating the reader’s question"
        />
      </Accordion>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within, waitFor } = await import("storybook/test");
    const canvas = within(canvasElement);
    const first = canvas.getByRole("button", { name: "First section" });
    const last = canvas.getByRole("button", { name: "Last section" });
    await expect(first).toHaveAttribute("aria-expanded", "true");
    first.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(last).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(first).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(last).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(last).toHaveAttribute("aria-expanded", "true");
    const panel = canvasElement.ownerDocument.getElementById(last.getAttribute("aria-controls")!);
    await expect(panel).toHaveAttribute("aria-labelledby", last.id);
    await userEvent.keyboard(" ");
    await waitFor(() => expect(last).toHaveAttribute("aria-expanded", "false"));
    await expect(canvas.getByRole("button", { name: "Unavailable section" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Locked section" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Alpha section" }));
    await expect(canvas.getByRole("button", { name: "Beta section" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

function ControlledExample() {
  const [value, setValue] = useState("record-a");
  const [renamed, setRenamed] = useState(false);
  const [reversed, setReversed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const ids = reversed ? ["record-b", "record-a"] : ["record-a", "record-b"];
  return (
    <Stack space="space.200">
      <Button onClick={() => setValue("record-b")}>Open second externally</Button>
      <Button
        onClick={() => {
          setRenamed(true);
          setReversed(true);
        }}
      >
        Rename and reorder
      </Button>
      <Button onClick={() => trigger.current?.focus()}>Focus first by ref</Button>
      <Accordion
        type="single"
        collapsible
        value={value}
        onValueChange={setValue}
        data-testid="controlled-accordion"
      >
        <>
          {ids.map((id) => (
            <Box key={id}>
              <Accordion.Item value={id}>
                <Accordion.Header asChild>
                  <h2>
                    <Accordion.Trigger ref={id === "record-a" ? trigger : undefined}>
                      {renamed ? "Shared label" : id === "record-a" ? "Record A" : "Record B"}
                    </Accordion.Trigger>
                  </h2>
                </Accordion.Header>
                <Accordion.Content forceMount>
                  <Input aria-label={`Draft ${id}`} defaultValue="Original" />
                </Accordion.Content>
              </Accordion.Item>
            </Box>
          ))}
        </>
      </Accordion>
    </Stack>
  );
}

export const ControlledAndRetained: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within, waitFor } = await import("storybook/test");
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Draft record-a" });
    await userEvent.clear(input);
    await userEvent.type(input, "Unsaved draft");
    await userEvent.click(canvas.getByRole("button", { name: "Open second externally" }));
    await expect(input).not.toBeVisible();
    await expect(canvas.queryByRole("textbox", { name: "Draft record-a" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Rename and reorder" }));
    const buttons = canvas.getAllByRole("button", { name: "Shared label" });
    await expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Focus first by ref" }));
    await expect(buttons[1]).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("textbox", { name: "Draft record-a" })).toHaveValue(
      "Unsaved draft",
    );
  },
};

export const Composition: Story = {
  render: () => (
    <Accordion type="single" defaultValue="outer">
      <Accordion.Item value="outer">
        <Accordion.Header>
          <Accordion.Trigger asChild>
            <Button variant="subtle">Outer section</Button>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>
          <Collapsible>
            <Collapsible.Trigger asChild>
              <Button>Independent detail</Button>
            </Collapsible.Trigger>
            <Collapsible.Content>Independent content</Collapsible.Content>
          </Collapsible>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within, waitFor } = await import("storybook/test");
    const canvas = within(canvasElement);
    const outer = canvas.getByRole("button", { name: "Outer section" });
    await userEvent.click(outer);
    await expect(outer).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Independent detail" }));
    await waitFor(() => expect(canvas.getByText("Independent content")).toBeVisible());
    await expect(outer).toHaveAttribute("aria-expanded", "true");
    await expect(canvasElement.querySelector("button button")).toBeNull();
  },
};
