import type { Meta, StoryObj } from "@storybook/react-vite";

import { Absent, Badge, Eyebrow, Fact, KeyValue, Prose } from "../../components";
import { Stack } from "../../primitives";

const meta = {
  title: "Components/Fact",
  component: Fact,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Fact>;
export default meta;
type Story = StoryObj;

export const Facts: Story = {
  render: () => (
    <Stack space="space.400" className="max-w-[420px]">
      <Fact.Group>
        <Fact label="Owner">Dana Whitfield</Fact>
        <Fact label="Frequency">Quarterly</Fact>
        <Fact label="Assessor">
          <Absent />
        </Fact>
      </Fact.Group>
      <div>
        <KeyValue label="Control">CTRL-0412</KeyValue>
        <KeyValue label="Status">
          <Badge tone="success">Verified</Badge>
        </KeyValue>
        <KeyValue label="Objective" wrap>
          Payables are approved and paid by different people, so no one person can create and settle
          a vendor invoice.
        </KeyValue>
        <KeyValue label="Last verified">12 Aug 2026</KeyValue>
      </div>
      <Prose label="Rationale" tone="warning">
        The July run had one exception where the approver also released the payment. Compensating
        review in place.
      </Prose>
      <Eyebrow>Plain eyebrow</Eyebrow>
    </Stack>
  ),
};

/** Fact. */
export const FactMatrix: Story = {
  render: () => (
    <Fact.Group>
      <Fact label="Controls">340</Fact>
      <Fact label="Satisfied">298</Fact>
      <Fact label="Open findings">5</Fact>
      <Fact label="Owner">Dana Whitfield</Fact>
      <Fact label="Frequency">Quarterly</Fact>
      <Fact label="Assessor">
        <Absent />
      </Fact>
    </Fact.Group>
  ),
};
