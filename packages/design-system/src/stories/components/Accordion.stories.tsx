import { expect, userEvent, waitFor, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
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
import { Specimens } from "../_lib/matrix";

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
      <Specimens title="One open at a time">
        <Accordion defaultValue={["first"]}>
          <Entry value="first" label="First section" />
          <Entry value="disabled" label="Unavailable section" disabled />
          <Entry value="last" label="Last section" />
        </Accordion>
      </Specimens>
      <Specimens title="multiple">
        <Accordion multiple defaultValue={["alpha", "beta"]}>
          <Entry value="alpha" label="Alpha section" />
          <Entry value="beta" label="Beta section" />
        </Accordion>
      </Specimens>
      <Specimens title="Right to left">
        <Accordion dir="rtl">
          <Entry value="long" label="A long section title that wraps within a narrow container" />
        </Accordion>
      </Specimens>
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

const itemState = (state: { open: boolean }) => (state.open ? "py-025" : "py-050");

/**
 * Every part takes Base UI's state function for `className` as well as a string, and the
 * content's class reaches the panel, the element with `data-open` and the measured height.
 * `headerProps` reach the heading around the trigger (here `render` makes it an h4), and `icon`
 * replaces the chevron: another mark, or `null` for none.
 */
export const Parts: Story = {
  render: () => (
    <Accordion defaultValue={["scope"]} className="w-layout-list max-w-full" data-testid="root">
      <AccordionItem value="scope" className={itemState} data-testid="scope-item">
        <AccordionTrigger
          className={(state) => (state.open ? "text-subtle" : undefined)}
          headerProps={{ render: <h4 />, className: "pt-050", id: "scope-heading" }}
        >
          Scope
        </AccordionTrigger>
        <AccordionContent className={(state) => (state.open ? "pb-025" : "")}>
          <Text>Two systems and the ground segment.</Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="notes" className={itemState} data-testid="notes-item">
        <AccordionTrigger icon={<Plus className="size-icon-small" />}>Notes</AccordionTrigger>
        <AccordionContent>
          <Text>No notes.</Text>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="plain">
        <AccordionTrigger icon={null}>Without a mark</AccordionTrigger>
        <AccordionContent>
          <Text>Nothing turns.</Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A state function applies, and follows the state.
    const scopeItem = canvas.getByTestId("scope-item");
    await expect(scopeItem).toHaveClass("py-025");
    await expect(canvas.getByTestId("notes-item")).toHaveClass("py-050");
    const scope = canvas.getByRole("button", { name: "Scope" });
    await expect(scope).toHaveClass("text-subtle");
    // The content's class is on the panel that carries data-open, not on the box inside it.
    const panel = scopeItem.querySelector<HTMLElement>("[data-slot=accordion-content]")!;
    await expect(panel).toHaveClass("pb-025");
    await expect(panel).toHaveAttribute("data-open");
    // headerProps reach the heading: its element, its class and its id.
    const heading = canvas.getByRole("heading", { name: "Scope" });
    await expect(heading.tagName).toBe("H4");
    await expect(heading).toHaveClass("pt-050", "flex");
    await expect(heading).toHaveAttribute("id", "scope-heading");
    await expect(heading).toContainElement(scope);
    // icon replaces the chevron, and null leaves none.
    const notes = canvas.getByRole("button", { name: "Notes" });
    const mark = notes.querySelector("[data-slot=accordion-trigger-icon]")!;
    await expect(mark).toHaveAttribute("aria-hidden", "true");
    await expect(mark.querySelector("svg")).not.toBeNull();
    const plain = canvas.getByRole("button", { name: "Without a mark" });
    await expect(plain.querySelector("[data-slot=accordion-trigger-icon]")).toBeNull();
    await userEvent.click(notes);
    await expect(canvas.getByTestId("notes-item")).toHaveClass("py-025");
    await expect(scopeItem).toHaveClass("py-050");
    await expect(scope).not.toHaveClass("text-subtle");
    // The row tint reaches space.100 before a flush title and ends at the row's end, where the
    // mark sits space.100 inside it; the title does not move.
    const tint = getComputedStyle(scope, "::before");
    await expect(tint.position).toBe("absolute");
    const bleed = getComputedStyle(canvasElement).getPropertyValue("--ds-space-100").trim();
    await expect(tint.left).toBe(`-${bleed}`);
    await expect(tint.right).toBe("0px");
    await expect(getComputedStyle(scope).paddingInlineEnd).toBe(bleed);
    const title = scope.querySelector("[data-slot=accordion-trigger-title]")!;
    await expect(Math.round(title.getBoundingClientRect().left)).toBe(
      Math.round(scope.getBoundingClientRect().left),
    );
  },
};
