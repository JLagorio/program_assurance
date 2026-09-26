import { expect, userEvent, waitFor, within } from "storybook/test";
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
import { HeadingLevelProvider, Stack, Text } from "../../primitives";

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

/** Each item's heading takes the contextual level: an h3 when nothing sets it (the Examples above), an h2 here, where the Accordion is the first thing in a region that starts its outline at 2. The trigger is a button inside the heading and the chevron turns with `aria-expanded`. */
export const HeadingLevel: Story = {
  name: "Heading level",
  render: () => (
    <HeadingLevelProvider level={2}>
      <Accordion defaultValue={["ownership"]} className="w-layout-list max-w-full">
        <Entry value="ownership" label="Ownership" />
        <Entry value="schedule" label="Schedule" />
      </Accordion>
    </HeadingLevelProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Ownership", "Schedule"]) {
      const heading = canvas.getByRole("heading", { name });
      await expect(heading.tagName).toBe("H2");
      await expect(heading).toContainElement(canvas.getByRole("button", { name }));
    }
    await userEvent.click(canvas.getByRole("button", { name: "Schedule" }));
    await expect(canvas.getByRole("button", { name: "Schedule" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // An open item clips only while it folds, so a focus ring at its content's edge shows whole.
    const open = canvasElement.querySelectorAll<HTMLElement>(
      "[data-slot=accordion-content][data-open]",
    );
    await expect(open.length).toBeGreaterThan(0);
    for (const panel of open)
      await waitFor(() => expect(getComputedStyle(panel).overflow).toBe("visible"));
  },
};
