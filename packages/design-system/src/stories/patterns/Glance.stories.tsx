import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, HoverCard, Id, Indicator, TextLink } from "../../components";
import { Glance } from "../../patterns";
import { Box, Inline } from "../../primitives";

const meta = {
  title: "Patterns/Glance",
  component: Glance,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Glance>;
export default meta;
type Story = StoryObj;

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

/** The three record types at the card's width. */
export const GlanceMatrix: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start">
      {(Object.keys(glances) as (keyof typeof glances)[]).map((k) => (
        <Box
          key={k}
          className="rounded-large border border-default"
          paddingBlock="space.150"
          paddingInline="space.150"
          style={{ width: 300 }}
        >
          {glances[k]}
        </Box>
      ))}
    </Inline>
  ),
};
