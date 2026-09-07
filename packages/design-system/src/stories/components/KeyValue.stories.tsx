import type { Meta, StoryObj } from "@storybook/react-vite";

import { Absent, Badge, KeyValue, Person, TextLink } from "../../components";
import { Box, Stack } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/KeyValue",
  component: KeyValue,
  parameters: { layout: "padded" },
  args: { label: "Owner", children: "Dana Whitfield" },
} satisfies Meta<typeof KeyValue>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Label widths, every kind of value, a wrapping one, a truncating one with its title, and an absent one. */
export const KeyValueMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Values">
        <Box style={{ width: 360 }}>
          <KeyValue label="Control">CTRL-0412</KeyValue>
          <KeyValue label="Owner">
            <Person name="Dana Whitfield" />
          </KeyValue>
          <KeyValue label="Status">
            <Badge tone="warning">Partially satisfied</Badge>
          </KeyValue>
          <KeyValue label="Evidence">
            <TextLink>
              <a href="#ev">EV-2201 Bank reconciliation, July</a>
            </TextLink>
          </KeyValue>
          <KeyValue label="Assessor">
            <Absent />
          </KeyValue>
        </Box>
      </Specimens>
      <Specimens title="Label widths: 104 (default) and 160">
        <Box style={{ width: 360 }}>
          <KeyValue label="Owner">Dana Whitfield</KeyValue>
          <KeyValue label="Authorizing official" labelWidth={160}>
            Marcus Oyelaran
          </KeyValue>
        </Box>
      </Specimens>
      <Specimens title="A long value: truncated with its title, and wrapped">
        <Box style={{ width: 360 }}>
          <KeyValue label="Statement">
            Accounts inactive for 90 days are disabled automatically by the identity provider.
          </KeyValue>
          <KeyValue label="Statement" wrap>
            Accounts inactive for 90 days are disabled automatically by the identity provider;
            exceptions need a ticket approved by the system owner.
          </KeyValue>
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** A rail: one label width down the column, the facts in the order the reader asks for them. */
export const InRail: Story = {
  render: () => (
    <Box style={{ width: 300 }} className="border-s border-default ps-200">
      <KeyValue label="Owner">
        <Person name="Dana Whitfield" />
      </KeyValue>
      <KeyValue label="Frequency">Quarterly</KeyValue>
      <KeyValue label="Last verified">12 Aug 2026</KeyValue>
      <KeyValue label="Next due">12 Nov 2026</KeyValue>
      <KeyValue label="Status">
        <Badge tone="success">Verified</Badge>
      </KeyValue>
      <KeyValue label="Assessor">
        <Absent />
      </KeyValue>
    </Box>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ width: 300 }}>
            <KeyValue label="Owner">Dana Whitfield</KeyValue>
            <KeyValue label="Frequency">Quarterly</KeyValue>
            <KeyValue label="Last verified">12 Aug 2026</KeyValue>
          </Box>
        }
        doText="One label width down the rail, so the values make a column."
        dont={
          <Box style={{ width: 300 }}>
            <KeyValue label="Owner" labelWidth={64}>
              Dana Whitfield
            </KeyValue>
            <KeyValue label="Frequency" labelWidth={96}>
              Quarterly
            </KeyValue>
            <KeyValue label="Last verified" labelWidth={120}>
              12 Aug 2026
            </KeyValue>
          </Box>
        }
        dontText="A width per row. The values stagger and the eye cannot run down them."
      />
      <Pair
        do={
          <Box style={{ width: 300 }}>
            <KeyValue label="Objective" wrap>
              Payables are approved and paid by different people, so no one person can create and
              settle a vendor invoice.
            </KeyValue>
          </Box>
        }
        doText="A statement wraps."
        dont={
          <Box style={{ width: 300 }}>
            <KeyValue label="Objective">
              Payables are approved and paid by different people, so no one person can create and
              settle a vendor invoice.
            </KeyValue>
          </Box>
        }
        dontText="A statement truncated. The title holds it, but a hover is not reading."
      />
      <Pair
        do={
          <Box style={{ width: 300 }}>
            <KeyValue label="Assessor">
              <Absent />
            </KeyValue>
          </Box>
        }
        doText="Nothing there is an Absent: a muted dash."
        dont={
          <Box style={{ width: 300 }}>
            <KeyValue label="Assessor:">N/A</KeyValue>
          </Box>
        }
        dontText="A colon on the label and N/A for the value. The column is the colon, and N/A says not applicable, which is a different fact."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
