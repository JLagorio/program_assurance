import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import {
  Badge,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Id,
  Indicator,
  TextLink,
} from "../../components";
import { Glance } from "../../patterns";
import { Box, Inline } from "../../primitives";

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
          <TextLink>
            <HoverCardTrigger href={`#${k}`}>
              <Id>
                {k === "element" ? "CN-0300" : k === "requirement" ? "REQ-0042.4" : "SI-7(1)"}
              </Id>
            </HoverCardTrigger>
          </TextLink>
          <HoverCardContent style={{ width: 300 }}>{glances[k]}</HoverCardContent>
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

export const Playground: Story = {
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
