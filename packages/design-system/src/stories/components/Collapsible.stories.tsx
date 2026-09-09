import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
} from "../../components";
const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Collapsible>;
export default meta;
type Story = StoryObj<typeof meta>;
const triggerRef = createRef<HTMLButtonElement>(),
  panelRef = createRef<HTMLDivElement>();
export const RetainedState: Story = {
  render: () => (
    <Collapsible defaultOpen>
      <CollapsibleTrigger ref={triggerRef} render={<Button />}>
        Review details
      </CollapsibleTrigger>
      <CollapsibleContent ref={panelRef} keepMounted className="flex">
        <div className="py-200">
          <Input aria-label="Review note" defaultValue="Initial note" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      trigger = canvas.getByRole("button", { name: "Review details" });
    await expect(triggerRef.current).toBe(trigger);
    const note = canvas.getByRole("textbox", { name: "Review note" });
    await userEvent.type(note, " updated");
    await userEvent.click(trigger);
    await waitFor(() => expect(panelRef.current).not.toBeVisible());
    await expect(note).toBeInTheDocument();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard(" ");
    await waitFor(() => expect(note).toBeVisible());
    await expect(note).toHaveValue("Initial note updated");
    await expect(trigger).toHaveAttribute("aria-controls", panelRef.current?.id);
  },
};
export const IndependentAndDisabled: Story = {
  render: () => (
    <Accordion defaultValue={["details"]}>
      <AccordionItem value="details">
        <AccordionTrigger>Record details</AccordionTrigger>
        <AccordionContent>
          <Collapsible defaultOpen onOpenChange={(_, details) => details.cancel()}>
            <CollapsibleTrigger>Required evidence</CollapsibleTrigger>
            <CollapsibleContent>Retention is required.</CollapsibleContent>
          </Collapsible>
          <Collapsible disabled>
            <CollapsibleTrigger>Unavailable</CollapsibleTrigger>
            <CollapsibleContent>Restricted details</CollapsibleContent>
          </Collapsible>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Required evidence" }));
    await expect(canvas.getByRole("button", { name: "Required evidence" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "Record details" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "Unavailable" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
};
export const SearchableContent: Story = {
  render: () => (
    <Collapsible>
      <CollapsibleTrigger>Recovery details</CollapsibleTrigger>
      <CollapsibleContent hiddenUntilFound data-testid="searchable">
        Recovery reference AC-47
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      panel = canvas.getByTestId("searchable");
    await expect(panel).toHaveAttribute("hidden", "until-found");
    await fireEvent(panel, new Event("beforematch"));
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Recovery details" })).toHaveAttribute(
        "aria-expanded",
        "true",
      ),
    );
    await waitFor(() => expect(panel).not.toHaveAttribute("hidden"));
  },
};
