import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  CollapsibleTrigger,
  Count,
  IconButton,
  Input,
  KeyValue,
} from "../../components";
import { HeadingLevelProvider } from "../../primitives";
import { Pencil } from "lucide-react";
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
          <HeadingLevelProvider level={4}>
            <Collapsible defaultOpen onOpenChange={(_, details) => details.cancel()}>
              <CollapsibleHeader>Required evidence</CollapsibleHeader>
              <CollapsibleContent>Retention is required.</CollapsibleContent>
            </Collapsible>
            <Collapsible disabled>
              <CollapsibleHeader>Unavailable</CollapsibleHeader>
              <CollapsibleContent>Restricted details</CollapsibleContent>
            </Collapsible>
          </HeadingLevelProvider>
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
    // Under the item's h3, the inner headers are set one level down.
    await expect(canvas.getByRole("heading", { name: "Required evidence" }).tagName).toBe("H4");
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

const editProvenance = fn();

/** Whether a disclosure's chevron is turned, from its computed rotation. */
function turned(trigger: HTMLElement) {
  const icon = trigger.querySelector("[data-slot=collapsible-header-icon]");
  if (!icon) throw new Error("No chevron in the trigger");
  return getComputedStyle(icon).rotate === "180deg";
}

/** CollapsibleHeader: the trigger inside a heading, the title at the start and a chevron at the end that turns while the content is open, with the row tint under the pointer and the focus ring on the keyboard. Closed, open, with a Count in the title, with an action after it in the row, and disabled. */
export const Header: Story = {
  render: () => (
    <div className="flex flex-col" style={{ maxWidth: 480 }}>
      <Collapsible>
        <CollapsibleHeader>Provenance</CollapsibleHeader>
        <CollapsibleContent>
          <div className="flex flex-col pb-200">
            <KeyValue label="Source">NIST SP 800-53 Rev 5</KeyValue>
            <KeyValue label="Imported">14 Sept 2026</KeyValue>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible defaultOpen>
        <div className="flex min-w-0 flex-wrap items-center gap-100">
          <CollapsibleHeader>
            Derivation <Count value={3} />
          </CollapsibleHeader>
          <IconButton
            label="Edit derivation"
            variant="subtle"
            size="small"
            icon={<Pencil />}
            onClick={editProvenance}
          />
        </div>
        <CollapsibleContent>
          <div className="pb-200">Three parent requirements.</div>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible disabled>
        <CollapsibleHeader>Restricted details</CollapsibleHeader>
        <CollapsibleContent>Hidden</CollapsibleContent>
      </Collapsible>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const provenance = canvas.getByRole("button", { name: "Provenance" });
    // The trigger sits inside a heading: an h3 outside every provider, as Accordion's.
    await expect(canvas.getByRole("heading", { name: "Provenance" }).tagName).toBe("H3");
    await expect(canvas.getByRole("heading", { name: "Provenance" })).toContainElement(provenance);
    await expect(provenance).toHaveAttribute("aria-expanded", "false");
    await expect(turned(provenance)).toBe(false);
    // Keyboard: Tab reaches it, Enter and Space toggle it, focus stays.
    await userEvent.tab();
    await expect(provenance).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(provenance).toHaveAttribute("aria-expanded", "true");
    await expect(provenance).toHaveAttribute("data-panel-open");
    await waitFor(() => expect(canvas.getByText("NIST SP 800-53 Rev 5")).toBeVisible());
    await waitFor(() => expect(turned(provenance)).toBe(true));
    // Settled open, the content clips no longer, so a focus ring at its edge shows whole.
    const content = canvas
      .getByText("NIST SP 800-53 Rev 5")
      .closest<HTMLElement>("[data-slot=collapsible-content]")!;
    await waitFor(() => expect(getComputedStyle(content).overflow).toBe("visible"));
    await userEvent.keyboard(" ");
    await expect(provenance).toHaveFocus();
    await expect(provenance).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(turned(provenance)).toBe(false));
    // A Count in the title is part of its name; the action after it is its own stop.
    const derivation = canvas.getByRole("button", { name: "Derivation 3" });
    await expect(derivation).toHaveAttribute("aria-expanded", "true");
    await expect(turned(derivation)).toBe(true);
    await userEvent.tab();
    await expect(derivation).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Edit derivation" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(editProvenance).toHaveBeenCalledTimes(1);
    await expect(derivation).toHaveAttribute("aria-expanded", "true");
    // Disabled: announced, and the pointer does nothing.
    const restricted = canvas.getByRole("button", { name: "Restricted details" });
    await expect(restricted).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(restricted, { pointerEventsCheck: 0 });
    await expect(restricted).toHaveAttribute("aria-expanded", "false");
    // The row tint reaches space.100 before the flush title and ends at the row's end, where the
    // chevron sits space.100 inside it; the title does not move.
    const tint = getComputedStyle(provenance, "::before");
    const bleed = getComputedStyle(canvasElement).getPropertyValue("--ds-space-100").trim();
    await expect(tint.position).toBe("absolute");
    await expect(tint.left).toBe(`-${bleed}`);
    await expect(tint.right).toBe("0px");
    await expect(getComputedStyle(provenance).paddingInlineEnd).toBe(bleed);
    const title = provenance.querySelector("[data-slot=collapsible-header-title]")!;
    await expect(Math.round(title.getBoundingClientRect().left)).toBe(
      Math.round(provenance.getBoundingClientRect().left),
    );
    // Under reduced motion the chevron turns without moving, and the tint changes at once.
    const icon = provenance.querySelector("[data-slot=collapsible-header-icon]")!;
    await expect(icon).toHaveClass("motion-reduce:transition-none");
    await expect(provenance).toHaveClass("motion-reduce:before:transition-none");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await expect(getComputedStyle(icon).transitionProperty).toBe("none");
      await expect(tint.transitionProperty).toBe("none");
    }
  },
};

/** The header's level is the context's: an h2 in a page's rail (a region wrapped in `HeadingLevelProvider level={2}`), one below a titled Section, and an h3 when nothing sets it. Wrap it in a HeadingLevelProvider for another level. */
export const HeaderLevels: Story = {
  name: "Header levels",
  render: () => (
    <div className="flex flex-col" style={{ maxWidth: 480 }}>
      <HeadingLevelProvider level={2}>
        <Collapsible defaultOpen>
          <CollapsibleHeader>Details</CollapsibleHeader>
          <CollapsibleContent>
            <div className="pb-200">
              <HeadingLevelProvider>
                <Collapsible>
                  <CollapsibleHeader>Identifiers</CollapsibleHeader>
                  <CollapsibleContent>SYS-104</CollapsibleContent>
                </Collapsible>
              </HeadingLevelProvider>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </HeadingLevelProvider>
      <Collapsible>
        <CollapsibleHeader>References</CollapsibleHeader>
        <CollapsibleContent>Two references.</CollapsibleContent>
      </Collapsible>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Details" }).tagName).toBe("H2");
    await expect(canvas.getByRole("heading", { name: "Identifiers" }).tagName).toBe("H3");
    await expect(canvas.getByRole("heading", { name: "References" }).tagName).toBe("H3");
  },
};

/**
 * A Collapsible inside an open Accordion item folds on its own measured height, not the item's:
 * every disclosure panel reads its own `--ds-collapse-height`, so the inner one eases open instead
 * of taking the settled item's `auto` and snapping.
 */
export const NestedMotion: Story = {
  name: "Nested motion",
  render: () => (
    <Accordion defaultValue={["record"]} className="w-layout-list max-w-full">
      <AccordionItem value="record">
        <AccordionTrigger>Record details</AccordionTrigger>
        <AccordionContent>
          <Collapsible>
            <CollapsibleHeader>Provenance</CollapsibleHeader>
            <CollapsibleContent data-testid="nested">
              <div className="flex flex-col pb-200">
                <KeyValue label="Source">NIST SP 800-53 Rev 5</KeyValue>
                <KeyValue label="Imported">14 Sept 2026</KeyValue>
                <KeyValue label="Resolved">15 Sept 2026</KeyValue>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const item = canvasElement.querySelector<HTMLElement>("[data-slot=accordion-content]")!;
    // The item has settled open, so it holds `auto`, which a panel inside it would inherit.
    await waitFor(() =>
      expect(item.style.getPropertyValue("--accordion-panel-height")).toBe("auto"),
    );
    await expect(item).toHaveAttribute("data-collapse-panel", "accordion");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Catch the inner panel's fold as it starts, and hold it there.
    const started = new Promise<Animation>((resolve) => {
      canvasElement.addEventListener("animationstart", (event) => {
        const target = event.target as HTMLElement;
        if (event.animationName !== "ds-collapse-open" || target.dataset["testid"] !== "nested")
          return;
        const fold = target
          .getAnimations()
          .find((animation) => (animation as CSSAnimation).animationName === "ds-collapse-open");
        if (!fold) return;
        fold.pause();
        resolve(fold);
      });
    });
    await userEvent.click(canvas.getByRole("button", { name: "Provenance" }));
    const nested = await canvas.findByTestId("nested");
    await expect(nested).toHaveAttribute("data-collapse-panel", "collapsible");
    if (!reduced) {
      // Halfway through the fold the inner panel is part of the way open: it eases on its own
      // measured height. On the item's `auto` it would be all the way open at once.
      const fold = await started;
      const duration = Number(fold.effect?.getTiming().duration ?? 0);
      fold.currentTime = duration / 2;
      const half = nested.getBoundingClientRect().height;
      const full = nested.scrollHeight;
      fold.finish();
      await expect(half).toBeGreaterThan(0);
      await expect(half).toBeLessThan(full);
    }
    await waitFor(() => expect(canvas.getByText("15 Sept 2026")).toBeVisible());
  },
};
