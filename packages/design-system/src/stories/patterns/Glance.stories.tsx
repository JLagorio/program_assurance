import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { Badge, Button, HoverCard, Id, Indicator, KeyValue, TextLink } from "../../components";
import { Glance } from "../../patterns";
import { Box, Inline, Stack } from "../../primitives";
import { Pair } from "../_lib/pair";

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
        <Badge size="xsmall" tone="information">
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

/** The card a glance is drawn in, at the HoverCard's width for one. */
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
        <HoverCard key={k} content={glances[k]} width={300}>
          <TextLink>
            <a href={`#${k}`}>
              <Id>
                {k === "element" ? "CN-0300" : k === "requirement" ? "REQ-0042.4" : "SI-7(1)"}
              </Id>
            </a>
          </TextLink>
        </HoverCard>
      ))}
    </Inline>
  ),
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
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<GlanceCard>{glances.requirement}</GlanceCard>}
        doText="Four facts: the ones that tell the reader whether to open it."
        dont={
          <GlanceCard>
            {glances.requirement}
            <KeyValue label="Source" labelWidth={88}>
              SRD 4.2.1
            </KeyValue>
            <KeyValue label="Priority" labelWidth={88}>
              High
            </KeyValue>
            <KeyValue label="Created" labelWidth={88}>
              3 Aug 2026
            </KeyValue>
            <KeyValue label="Updated" labelWidth={88}>
              2h ago
            </KeyValue>
          </GlanceCard>
        }
        dontText="Eight facts. The card is the record's rail in a hover, taller than the row it hangs from."
      />
      <Pair
        do={<GlanceCard>{glances.control}</GlanceCard>}
        doText="Facts only. The click is the peek, and the actions are there."
        dont={
          <GlanceCard>
            <Stack space="space.150">
              {glances.control}
              <Inline space="space.100">
                <Button size="small" variant="primary">
                  Mark satisfied
                </Button>
                <Button size="small">Open</Button>
              </Inline>
            </Stack>
          </GlanceCard>
        }
        dontText="Buttons in a glance. A hover card has no controls; it closes when the pointer leaves, and a keyboard never reaches them."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <GlanceCard>
      <Glance
        {...args}
        status={
          <Badge size="xsmall" tone="information">
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
