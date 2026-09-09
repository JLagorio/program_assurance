import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Input,
} from "../../components";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
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
    <AccordionItem value={value} disabled={disabled}>
      <AccordionTrigger>{label}</AccordionTrigger>
      <AccordionContent>
        <Text>Content for {label}.</Text>
      </AccordionContent>
    </AccordionItem>
  );
}

export const Examples: Story = {
  render: () => (
    <Stack space="space.300" className="w-layout-list max-w-full">
      <Accordion defaultValue={["first"]} aria-label="Single selection">
        <Entry value="first" label="First section" />
        <Entry value="disabled" label="Unavailable section" disabled />
        <Entry value="last" label="Last section" />
      </Accordion>
      <Accordion multiple defaultValue={["alpha", "beta"]} aria-label="Multiple selection">
        <Entry value="alpha" label="Alpha section" />
        <Entry value="beta" label="Beta section" />
      </Accordion>
      <Accordion dir="rtl" aria-label="Right to left layout">
        <Entry value="long" label="A long section title that wraps within a narrow container" />
      </Accordion>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const first = canvas.getByRole("button", { name: "First section" });
    const last = canvas.getByRole("button", { name: "Last section" });
    await expect(first).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(last);
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(last).toHaveAttribute("aria-expanded", "true");
    await expect(last.closest("h3")?.nextElementSibling).toHaveAttribute("data-open");
    const disabled = canvas.getByRole("button", { name: "Unavailable section" });
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    disabled.focus();
    await userEvent.keyboard("{Enter} ");
    await expect(disabled).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(canvas.getByRole("button", { name: "Alpha section" }));
    await expect(canvas.getByRole("button", { name: "Beta section" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  },
};

function ControlledExample() {
  const [value, setValue] = useState(["record-a"]);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <Stack space="space.200">
      <Button onClick={() => setValue(["record-b"])}>Open second externally</Button>
      <Button onClick={() => trigger.current?.focus()}>Focus first by ref</Button>
      <Accordion value={value} onValueChange={setValue} keepMounted>
        <AccordionItem value="record-a">
          <AccordionTrigger ref={trigger}>Record A</AccordionTrigger>
          <AccordionContent>
            <Input aria-label="Draft record-a" defaultValue="Original" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="record-b">
          <AccordionTrigger>Record B</AccordionTrigger>
          <AccordionContent>Second record</AccordionContent>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}

export const ControlledAndRetained: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvasElement }) => {
    const { expect, userEvent, waitFor, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Draft record-a" });
    await userEvent.clear(input);
    await userEvent.type(input, "Unsaved draft");
    await userEvent.click(canvas.getByRole("button", { name: "Open second externally" }));
    await waitFor(() => expect(input).not.toBeVisible());
    await userEvent.click(canvas.getByRole("button", { name: "Record A" }));
    await expect(input).toHaveValue("Unsaved draft");
    await userEvent.click(canvas.getByRole("button", { name: "Focus first by ref" }));
    await expect(canvas.getByRole("button", { name: "Record A" })).toHaveFocus();
  },
};
