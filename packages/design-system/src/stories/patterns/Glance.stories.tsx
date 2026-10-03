import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Glance } from "../..";
import {
  Badge,
  Dot,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Id,
  Indicator,
  TextLink,
} from "../../components";
import { Box, Inline, Stack } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Patterns/Glance",
  component: Glance,
  parameters: { layout: "padded" },
  args: {
    id: "REQ-0042.4",
    title:
      "The module shall refuse firmware whose security version is below the value recorded in the rollback fuses.",
    meta: "Derived · revision 1",
  },
} satisfies Meta<typeof Glance>;
export default meta;
type Story = StoryObj<typeof meta>;

const glances = {
  element: (
    <Glance
      id="CN-0300"
      title="Tactical edge"
      meta="Subsystem · Atlas payments platform"
      status={<Indicator tone="warning">v2 pending approval</Indicator>}
      facts={[
        { label: "Class", value: "System" },
        { label: "Zone", value: "Tactical" },
        { label: "Requirements", value: "4 · 2 own" },
        { label: "Controls", value: "341" },
      ]}
    />
  ),
  requirement: (
    <Glance
      id="REQ-0042.4"
      title="The module shall refuse firmware whose security version is below the value recorded in the rollback fuses."
      meta="Derived · revision 1"
      status={
        <Badge variant="secondary" size="xsmall" tone="information">
          Approved
        </Badge>
      }
      facts={[
        { label: "Owner", value: "Marcus Ryde" },
        { label: "Method", value: "Test" },
        { label: "Carried by", value: "2 elements" },
        { label: "Verification", value: "Not met" },
      ]}
    />
  ),
  control: (
    <Glance
      id="SI-7(1)"
      title="Software, firmware, and information integrity · integrity checks"
      meta="SI · System and information integrity"
      status={<Indicator tone="success">Satisfied</Indicator>}
      facts={[
        { label: "Owner", value: "Dana Whitlock" },
        { label: "Requirements", value: "2" },
        { label: "Scopes", value: "3 of 3" },
      ]}
    />
  ),
} as const;

/** A static 300px surface for comparing the content independently of hover behavior. */
function GlanceCard({ children }: { children: ReactNode }) {
  return (
    <Box
      className="rounded-large border border-default"
      paddingBlock="space.150"
      paddingInline="space.150"
      style={{ width: 300 }}
    >
      {children}
    </Box>
  );
}

/** A glance behind an id; hover or focus it. */
export const GlanceStory: Story = {
  name: "Glance",
  render: () => (
    <Inline space="space.300" alignBlock="center">
      {(Object.keys(glances) as (keyof typeof glances)[]).map((k) => (
        <HoverCard key={k}>
          <TextLink render={<HoverCardTrigger href={`#${k}`} />}>
            <Id>{k === "element" ? "CN-0300" : k === "requirement" ? "REQ-0042.4" : "SI-7(1)"}</Id>
          </TextLink>
          <HoverCardContent style={{ width: 300 }}>{glances[k]}</HoverCardContent>
        </HoverCard>
      ))}
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("link", { name: "CN-0300" });
    // Keyboard focus on the trigger opens the glance, which adds no stop of its own.
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await waitFor(() => expect(body.getByText("Tactical edge")).toBeVisible(), { timeout: 3000 });
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByText("Tactical edge")).toBeNull());
  },
};

/** The three record types at the card's width: an Indicator or a Badge as the status, four facts, three, a title of two lines. */
export const GlanceMatrix: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      {(Object.keys(glances) as (keyof typeof glances)[]).map((k) => (
        <GlanceCard key={k}>{glances[k]}</GlanceCard>
      ))}
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const cards = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="glance"]')];
    await expect(cards).toHaveLength(3);
    const [element, , control] = cards;
    // Reading order: id, status, title, meta, then the facts; nothing in it takes focus.
    await expect(element).toHaveTextContent(
      /^CN-0300v2 pending approvalTactical edgeSubsystem · Atlas payments platformClass/,
    );
    await expect(within(control!).getAllByRole("term")).toHaveLength(3);
    for (const card of cards)
      await expect(card.querySelectorAll("a, button, input, [tabindex]")).toHaveLength(0);
  },
};

/** At most four facts show; the rest belong to the peek. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("term")).toHaveLength(4);
  },
  render: (args) => (
    <GlanceCard>
      <Glance
        {...args}
        status={
          <Badge variant="secondary" size="xsmall" tone="information">
            Approved
          </Badge>
        }
        facts={[
          { label: "Owner", value: "Marcus Ryde" },
          { label: "Method", value: "Test" },
          { label: "Carried by", value: "2 elements" },
          { label: "Verification", value: "Not met" },
        ]}
      />
    </GlanceCard>
  ),
};

/** The status is a word a reader can hear, and the facts are the four that decide whether to open the record: a fifth is not shown. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div data-testid="status-do">
            <Glance
              id="SI-7(1)"
              title="Software, firmware, and information integrity · integrity checks"
              meta="SI · System and information integrity"
              status={<Indicator tone="danger">Not satisfied</Indicator>}
            />
          </div>
        }
        doText="An Indicator or a Badge, its tone and its word: Not satisfied."
        dont={
          <div data-testid="status-dont">
            <Glance
              id="SI-7(1)"
              title="Software, firmware, and information integrity · integrity checks"
              meta="SI · System and information integrity"
              status={<Dot tone="danger" />}
            />
          </div>
        }
        dontText="A dot alone. The colour is the only signal: a screen reader hears nothing, and red reads the same as green to many readers."
      />
      <Pair
        do={
          <div data-testid="facts-do">
            <Glance
              id="REQ-0042.4"
              title="The module shall refuse firmware below the rollback fuses' security version."
              meta="Derived · revision 1"
              facts={[
                { label: "Owner", value: "Marcus Ryde" },
                { label: "Method", value: "Test" },
                { label: "Verification", value: "Not met" },
              ]}
            />
          </div>
        }
        doText="The facts that decide whether to open the record, four at most."
        dont={
          <div data-testid="facts-dont">
            <Glance
              id="REQ-0042.4"
              title="The module shall refuse firmware below the rollback fuses' security version."
              meta="Derived · revision 1"
              facts={[
                { label: "Owner", value: "Marcus Ryde" },
                { label: "Method", value: "Test" },
                { label: "Carried by", value: "2 elements" },
                { label: "Parent", value: "REQ-0042" },
                { label: "Verification", value: "Not met" },
                { label: "Updated", value: "14 Sep 2026" },
              ]}
            />
          </div>
        }
        dontText="Six facts. Glance shows the first four, so Verification, the one the reader came for, is not there."
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("status-do")).toHaveTextContent("Not satisfied");
    // The dot is hidden from assistive technology and says nothing in words.
    const dot = canvas.getByTestId("status-dont").querySelector('[data-slot="dot"]');
    await expect(dot).toHaveAttribute("aria-hidden", "true");
    await expect(within(canvas.getByTestId("facts-do")).getAllByRole("term")).toHaveLength(3);
    const dropped = canvas.getByTestId("facts-dont");
    await expect(within(dropped).getAllByRole("term")).toHaveLength(4);
    await expect(within(dropped).queryByText("Verification")).toBeNull();
  },
};
