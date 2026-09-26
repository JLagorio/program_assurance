import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Badge, Button, IconButton, KeyValue } from "../../components";
import { PageHeader } from "../../layout";
import { Inspector } from "../../patterns";
import { HeadingLevelProvider, Stack, Text } from "../../primitives";

const groups = [
  {
    title: "Ownership",
    rows: [
      { label: "Owner", value: "Dana Whitfield" },
      { label: "Sponsor", value: "Alex Morgan" },
    ],
  },
  {
    title: "Schedule",
    rows: [
      { label: "Due", value: "30 Sept 2026" },
      { label: "Frequency", value: "Quarterly" },
    ],
  },
];

const meta = {
  title: "Patterns/Inspector",
  component: Inspector,
  parameters: { layout: "padded" },
  args: {
    groups,
    footer: (
      <Button size="small" variant="link">
        Edit properties
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-full" style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Inspector>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Whether a group's chevron is turned, from its computed rotation. */
function turned(trigger: HTMLElement) {
  const icon = trigger.querySelector("svg");
  if (!icon) throw new Error("No chevron in the trigger");
  return getComputedStyle(icon).rotate === "180deg";
}

/** The groups as data, every one open, in the order the reader needs them, with a footer action under them. Each title is a button inside a heading at the contextual level, an h3 when nothing sets one. */
export const Groups: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Ownership", "Schedule"]) {
      await expect(canvas.getByRole("heading", { name }).tagName).toBe("H3");
      await expect(canvas.getByRole("button", { name })).toHaveAttribute("aria-expanded", "true");
    }
    const schedule = canvas.getByRole("button", { name: "Schedule" });
    await userEvent.click(schedule);
    await expect(schedule).toHaveAttribute("aria-expanded", "false");
    // A closed group's rows leave the page once the fold ends.
    await waitFor(() =>
      expect(canvas.queryByText("Quarterly")?.checkVisibility() ?? false).toBe(false),
    );
    await expect(canvas.getByText("Dana Whitfield")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Edit properties" })).toBeVisible();
  },
};

const editDetails = fn();

/** Inspector.Group on its own: KeyValue rows as children, open by default, an action beside the title, and `defaultOpen={false}` for the collapsed Details a reader opens when they need provenance or derivation. The chevron turns while the group is open and holds still under reduced motion. */
export const Group: Story = {
  render: () => (
    <div>
      <Inspector.Group
        title="Details"
        action={
          <IconButton
            label="Edit details"
            variant="subtle"
            size="small"
            icon={<Pencil />}
            onClick={editDetails}
          />
        }
      >
        <KeyValue label="Status">
          <Badge variant="secondary" tone="success">
            Active
          </Badge>
        </KeyValue>
        <KeyValue label="Identifier">SYS-104</KeyValue>
      </Inspector.Group>
      <Inspector.Group title="Provenance" defaultOpen={false}>
        <KeyValue label="Source">NIST SP 800-53 Rev 5</KeyValue>
        <KeyValue label="Imported">14 Sept 2026</KeyValue>
      </Inspector.Group>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const details = canvas.getByRole("button", { name: "Details" });
    const provenance = canvas.getByRole("button", { name: "Provenance" });
    const heading = canvas.getByRole("heading", { name: "Details" });
    await expect(heading.tagName).toBe("H3");
    await expect(heading).toContainElement(details);
    // The action is outside the heading, its own stop.
    await expect(
      within(heading).queryByRole("button", { name: "Edit details" }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Edit details" }));
    await expect(editDetails).toHaveBeenCalledTimes(1);
    // Open and closed look different: the open group's chevron is turned.
    await expect(details).toHaveAttribute("aria-expanded", "true");
    await expect(turned(details)).toBe(true);
    await expect(provenance).toHaveAttribute("aria-expanded", "false");
    await expect(turned(provenance)).toBe(false);
    await expect(canvas.queryByText("NIST SP 800-53 Rev 5")).toBeNull();
    provenance.focus();
    await userEvent.keyboard("{Enter}");
    await expect(provenance).toHaveFocus();
    await expect(provenance).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(canvas.getByText("NIST SP 800-53 Rev 5")).toBeVisible());
    await waitFor(() => expect(turned(provenance)).toBe(true));
    // Settled open, the rows clip no longer, so a focus ring at their edge shows whole.
    const rows = canvas.getByText("NIST SP 800-53 Rev 5").closest<HTMLElement>(
      "[data-slot=collapsible-content]",
    )!;
    await waitFor(() => expect(getComputedStyle(rows).overflow).toBe("visible"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      await expect(getComputedStyle(provenance.querySelector("svg")!).transitionProperty).toBe(
        "none",
      );
  },
};

/** On a record page the rail's groups sit under the page's h1, so the rail starts its outline at 2 and every group is an h2; under a preview's h2 record title the same groups are h3. A long title takes the row and moves the action to the next one, at the end. */
export const InARail: Story = {
  name: "In a rail",
  render: () => (
    <Stack space="space.300">
      <PageHeader>
        <PageHeader.Title>WS-X90 Sentinel Mission System</PageHeader.Title>
      </PageHeader>
      <aside aria-label="Record details" className="max-w-full" style={{ maxWidth: 320 }}>
        <HeadingLevelProvider level={2}>
          <Inspector groups={groups} />
          <Inspector.Group
            title="Authorization boundary and interconnections"
            action={
              <Button size="small" variant="subtle">
                Edit
              </Button>
            }
          >
            <KeyValue label="Boundary">Ground segment</KeyValue>
          </Inspector.Group>
        </HeadingLevelProvider>
      </aside>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rail = canvas.getByRole("complementary", { name: "Record details" });
    const long = within(rail).getByRole("heading", {
      name: "Authorization boundary and interconnections",
    });
    await expect(long.tagName).toBe("H2");
    await expect(within(rail).getByRole("heading", { name: "Ownership" }).tagName).toBe("H2");
    await expect(within(rail).getByRole("heading", { name: "Schedule" }).tagName).toBe("H2");
    const edit = within(rail).getByRole("button", { name: "Edit" }).getBoundingClientRect();
    const title = long.getBoundingClientRect();
    await expect(edit.top).toBeGreaterThanOrEqual(title.bottom - 1);
    await expect(edit.right).toBeLessThanOrEqual(rail.getBoundingClientRect().right + 0.5);
  },
};

const openChanged = fn();

function ControlledGroup() {
  const [open, setOpen] = useState(false);
  return (
    <Stack space="space.150">
      <Button size="small" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide derivation" : "Show derivation"}
      </Button>
      <Inspector.Group
        title="Derivation"
        open={open}
        onOpenChange={(next, details) => {
          openChanged(next);
          setOpen(next);
          void details;
        }}
      >
        <KeyValue label="Parent">REQ-12</KeyValue>
        <Text size="small" color="color.text.subtle">
          Derived from the mission availability objective.
        </Text>
      </Inspector.Group>
    </Stack>
  );
}

/** `open` and `onOpenChange` when the caller owns the state: a control elsewhere opens the group, and the group reports the reader's own toggles. */
export const Controlled: Story = {
  render: () => <ControlledGroup />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Derivation" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(canvas.getByRole("button", { name: "Show derivation" }));
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(canvas.getByText("REQ-12")).toBeVisible());
    await userEvent.click(trigger);
    await expect(openChanged).toHaveBeenLastCalledWith(false);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.getByRole("button", { name: "Show derivation" })).toBeVisible();
  },
};

export const Playground: Story = {};
