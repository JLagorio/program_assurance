import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Badge,
  Fact,
  KeyValue,
  Person,
  Prose,
  RailGroup,
  Empty,
  Id,
  Eyebrow,
} from "@/components/app/ui";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Layout/Facts",
  component: KeyValue,
  tags: ["autodocs"],
  args: { label: "Owner", wrap: false, children: "D. Reyes" },
  argTypes: {
    label: { control: "text" },
    wrap: { control: "boolean" },
    children: { control: "text" },
  },
} satisfies Meta<typeof KeyValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <dl className="max-w-[272px]">
      <KeyValue {...args} />
    </dl>
  ),
};

const statement =
  "Disable accounts within an organization-defined time period when the accounts have expired, are no longer associated with a user or individual, are in violation of organizational policy, or have been inactive for the defined period.";

/** The micro-label in every tone, as a Prose heading and on its own. */
export const Labels: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-6">
        <Eyebrow>Assessment</Eyebrow>
        <Eyebrow tone="success">Entry criteria met</Eyebrow>
        <Eyebrow tone="warning">Evidence stale</Eyebrow>
        <Eyebrow tone="danger">Blocker</Eyebrow>
        <Eyebrow tone="info">Derived</Eyebrow>
      </div>
      <Spec>text-[11px] · 500 · uppercase · 0.06em · one spec for every file</Spec>
    </div>
  ),
};

/** The facts strip under a RecordHeader: inline label value pairs in a wrapping dl. */
export const FactStrip: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <dl className="flex max-w-[880px] flex-wrap items-baseline gap-x-6 gap-y-1.5 border-t border-border pt-2.5">
      <Fact label="Owner">D. Reyes</Fact>
      <Fact label="Supplier">Northwind Avionics</Fact>
      <Fact label="Part">
        <Id>NA-7731-B</Id>
      </Fact>
      <Fact label="Criticality">
        <Badge size="xs" tone="danger">
          Mission critical
        </Badge>
      </Fact>
      <Fact label="Attestation">
        <Empty />
      </Fact>
    </dl>
  ),
};

/** A rail group as the ten `*Rail` components build it: KeyValue, KeyValue wrap, IdList, Dash, Prose. */
export const Rail: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[272px]">
      <RailGroup title="Requirement">
        <KeyValue label="Control">
          <Id>AC-2(3)</Id>
        </KeyValue>
        <KeyValue label="Title" wrap>
          Disable accounts after an organization-defined period of inactivity
        </KeyValue>
        <KeyValue label="Family">AC — Access control</KeyValue>
        <KeyValue label="Unit">
          <Badge size="xs">Objective</Badge>
        </KeyValue>
        <KeyValue label="CCIs" wrap>
          <Id.List ids={["CCI-000017", "CCI-000217", "CCI-001682"]} />
        </KeyValue>
        <KeyValue label="Event">
          <Empty />
        </KeyValue>
        <Prose label="Statement">{statement}</Prose>
      </RailGroup>
      <RailGroup title="Implementation">
        <KeyValue label="Owner">
          <Person name="D. Reyes" />
        </KeyValue>
        <KeyValue label="Components" wrap>
          <Id.List ids={[]} empty="Not allocated" />
        </KeyValue>
        <Prose label="Gap" tone="danger">
          No procedure is written against objective [03]; the row cannot be assessed.
        </Prose>
      </RailGroup>
    </div>
  ),
};
