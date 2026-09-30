import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil } from "lucide-react";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Badge, Button, IconButton, KeyValue } from "../../components";
import { PageHeader } from "../../layout";
import { Inspector, InspectorGroup } from "../../patterns";
import { HeadingLevelProvider, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

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
  subcomponents: { InspectorGroup },
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

/** The groups as data, every one open, in the order the reader needs them, with a footer action under them. Each title is a button inside a heading at the contextual level, an h3 when nothing sets one, and each group's rows are one definition list. */
export const Groups: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Ownership", "Schedule"]) {
      await expect(canvas.getByRole("heading", { name }).tagName).toBe("H3");
      await expect(canvas.getByRole("button", { name })).toHaveAttribute("aria-expanded", "true");
    }
    // One list of pairs per group, not one list per fact.
    const lists = canvasElement.querySelectorAll("dl");
    await expect(lists).toHaveLength(2);
    for (const list of lists) {
      await expect(list).toHaveAttribute("data-slot", "key-value-group");
      await expect(list.querySelectorAll(":scope > div > dt")).toHaveLength(2);
    }
    // Every group is an Inspector.Group, so both forms share the header, the keyboard and the fold.
    await expect(canvasElement.querySelectorAll("[data-slot=inspector-group]")).toHaveLength(2);
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

/** Inspector.Group on its own: its rows in a KeyValue.Group (KeyValues given directly become one), open by default, an action beside the title, and `defaultOpen={false}` for the collapsed Details a reader opens when they need provenance or derivation. The chevron turns while the group is open and holds still under reduced motion. */
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
        <KeyValue.Group>
          <KeyValue label="Status">
            <Badge variant="secondary" tone="success">
              Active
            </Badge>
          </KeyValue>
          <KeyValue label="Identifier">SYS-104</KeyValue>
        </KeyValue.Group>
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
    // The rows are one definition list: a KeyValue.Group given, or KeyValues given directly.
    const detailsGroup = details.closest<HTMLElement>("[data-slot=inspector-group]")!;
    await expect(detailsGroup.querySelectorAll("dl")).toHaveLength(1);
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
    const provenanceGroup = provenance.closest<HTMLElement>("[data-slot=inspector-group]")!;
    const provenanceLists = provenanceGroup.querySelectorAll("dl");
    await expect(provenanceLists).toHaveLength(1);
    await expect(provenanceLists[0]).toHaveAttribute("data-slot", "key-value-group");
    // Settled open, the rows clip no longer, so a focus ring at their edge shows whole.
    const rows = canvas
      .getByText("NIST SP 800-53 Rev 5")
      .closest<HTMLElement>("[data-slot=collapsible-content]")!;
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
            <KeyValue.Group>
              <KeyValue label="Boundary">Ground segment</KeyValue>
            </KeyValue.Group>
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
        <KeyValue.Group>
          <KeyValue label="Parent">REQ-12</KeyValue>
        </KeyValue.Group>
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

const nativeRefs = { rail: createRef<HTMLDivElement>(), group: createRef<HTMLDivElement>() };

/** Native attributes, a class and a ref reach the root of the data form and of a group, so a product can give a rail a test id or a focus ref; each names itself last with `data-slot`. */
export const NativeAttributes: Story = {
  render: () => (
    <Stack space="space.200">
      <Inspector ref={nativeRefs.rail} data-testid="rail" className="min-w-0" groups={groups} />
      <Inspector.Group
        ref={nativeRefs.group}
        data-testid="provenance"
        title="Provenance"
        defaultOpen={false}
      >
        <KeyValue label="Source">NIST SP 800-53 Rev 5</KeyValue>
      </Inspector.Group>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rail = canvas.getByTestId("rail");
    await expect(nativeRefs.rail.current).toBe(rail);
    await expect(rail).toHaveAttribute("data-slot", "inspector");
    await expect(rail).toHaveClass("min-w-0");
    const group = canvas.getByTestId("provenance");
    await expect(nativeRefs.group.current).toBe(group);
    await expect(group).toHaveAttribute("data-slot", "inspector-group");
    await expect(within(group).getByRole("button", { name: "Provenance" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  },
};

/** The rail's facts in groups, as label and value rows under a heading that folds; not a hand-built list that leaves the outline and loses the disclosure. */
export const Dont: Story = {
  render: () => (
    <Pair
      do={
        <HeadingLevelProvider level={2}>
          <Inspector.Group title="Details">
            <KeyValue.Group>
              <KeyValue label="Owner">Dana Whitfield</KeyValue>
              <KeyValue label="Due">30 Sept 2026</KeyValue>
            </KeyValue.Group>
          </Inspector.Group>
          <Inspector.Group title="Provenance" defaultOpen={false}>
            <KeyValue.Group>
              <KeyValue label="Source">NIST SP 800-53 Rev 5</KeyValue>
            </KeyValue.Group>
          </Inspector.Group>
        </HeadingLevelProvider>
      }
      doText="Inspector.Group: a heading at the rail's level, a folding title, KeyValue rows in one KeyValue.Group, and provenance collapsed."
      dont={
        <Stack space="space.100">
          <Text weight="semibold">Details</Text>
          <Inline space="space.100">
            <Text color="color.text.subtle">Owner</Text>
            <Text>Dana Whitfield</Text>
          </Inline>
          <Inline space="space.100">
            <Text color="color.text.subtle">Due</Text>
            <Text>30 Sept 2026</Text>
          </Inline>
        </Stack>
      }
      dontText="Bold text over a hand-built row of facts: no heading in the outline, no label and value pairing, and nothing folds."
    />
  ),
};
