import type { Meta, StoryObj } from "@storybook/react-vite";

import { Absent, Badge, Fact, Id, KeyValue, Person } from "../../components";
import { Box, Heading, Inline, Stack } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Fact",
  component: Fact,
  parameters: { layout: "padded" },
  args: { label: "Owner", children: "Dana Whitfield" },
} satisfies Meta<typeof Fact>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A strip of six; every kind of value; a strip that wraps. */
export const FactMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Six facts">
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
      </Specimens>
      <Specimens title="Values">
        <Fact.Group>
          <Fact label="Owner">
            <Person name="Dana Whitfield" />
          </Fact>
          <Fact label="Status">
            <Badge size="xsmall" tone="success">
              Verified
            </Badge>
          </Fact>
          <Fact label="Control">
            <Id>CTRL-0412</Id>
          </Fact>
          <Fact label="Due">12 Nov 2026</Fact>
        </Fact.Group>
      </Specimens>
      <Specimens title="Narrow: the strip wraps, each fact whole">
        <Box style={{ width: 320 }}>
          <Fact.Group>
            <Fact label="Controls">340</Fact>
            <Fact label="Satisfied">298</Fact>
            <Fact label="Open findings">5</Fact>
            <Fact label="Owner">Dana Whitfield</Fact>
            <Fact label="Frequency">Quarterly</Fact>
          </Fact.Group>
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** Under a record's title: the facts the reader acts on, above the fold; the rest in the rail as KeyValues. */
export const UnderHeader: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-[720px]">
      <Stack space="space.100">
        <Inline space="space.100" alignBlock="baseline">
          <Id className="text-subtle">CTRL-0412</Id>
          <Badge size="xsmall" tone="success">
            Verified
          </Badge>
        </Inline>
        <Heading size="large">Segregation of duties, payables</Heading>
        <Fact.Group className="border-t border-default pt-100">
          <Fact label="Owner">
            <Person name="Dana Whitfield" />
          </Fact>
          <Fact label="Frequency">Quarterly</Fact>
          <Fact label="Next due">12 Nov 2026</Fact>
          <Fact label="Open findings">2</Fact>
        </Fact.Group>
      </Stack>
      <Box style={{ width: 300 }} className="border-s border-default ps-200">
        <KeyValue label="Created">4 Mar 2025</KeyValue>
        <KeyValue label="Created by">
          <Person name="Priya Natarajan" />
        </KeyValue>
        <KeyValue label="Framework">NIST SP 800-53 r5</KeyValue>
        <KeyValue label="Family">Access control</KeyValue>
      </Box>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Fact.Group>
            <Fact label="Owner">Dana Whitfield</Fact>
            <Fact label="Frequency">Quarterly</Fact>
            <Fact label="Next due">12 Nov 2026</Fact>
            <Fact label="Open findings">2</Fact>
          </Fact.Group>
        }
        doText="The facts the reader acts on, four to six."
        dont={
          <Fact.Group>
            <Fact label="Owner">Dana Whitfield</Fact>
            <Fact label="Frequency">Quarterly</Fact>
            <Fact label="Next due">12 Nov 2026</Fact>
            <Fact label="Open findings">2</Fact>
            <Fact label="Created">4 Mar 2025</Fact>
            <Fact label="Created by">Priya Natarajan</Fact>
            <Fact label="Updated">28 Aug 2026</Fact>
            <Fact label="Framework">NIST SP 800-53 r5</Fact>
            <Fact label="Family">Access control</Fact>
            <Fact label="Baseline">Moderate</Fact>
            <Fact label="Inherited">No</Fact>
          </Fact.Group>
        }
        dontText="Eleven facts, the reference joins among them. The strip is three lines and the owner is lost in it; the rest belong in the rail."
      />
      <Pair
        do={
          <Fact.Group>
            <Fact label="Objective">Approver and payer differ</Fact>
          </Fact.Group>
        }
        doText="A value is a word, a name, a number or a date."
        dont={
          <Fact.Group>
            <Fact label="Objective">
              Payables are approved and paid by different people, so no one person can create and
              settle a vendor invoice.
            </Fact>
          </Fact.Group>
        }
        dontText="A sentence as a fact. It is Prose, or a wrapping KeyValue in the rail."
      />
      <Pair
        do={
          <Fact.Group>
            <Fact label="Owner">Dana Whitfield</Fact>
            <Fact label="Assessor">
              <Absent />
            </Fact>
          </Fact.Group>
        }
        doText="A missing value is an Absent, and the fact stays so the reader sees what is missing."
        dont={
          <Fact.Group>
            <Fact label="Owner">Dana Whitfield</Fact>
          </Fact.Group>
        }
        dontText="The empty fact dropped. Now nothing says there should be an assessor."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
