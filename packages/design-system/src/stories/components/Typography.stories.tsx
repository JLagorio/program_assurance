import type { Meta, StoryObj } from "@storybook/react-vite";

import { Absent, Eyebrow, KeyValue, Prose, tones } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Typography",
  component: Eyebrow,
  parameters: { layout: "padded" },
  args: { children: "Rationale" },
} satisfies Meta<typeof Eyebrow>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Eyebrow in every tone and as a heading; Absent; Prose in every tone. */
export const TypographyMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Eyebrow">
        {tones.map((t) => (
          <Eyebrow key={t} tone={t}>
            {t}
          </Eyebrow>
        ))}
      </Specimens>
      <Specimens title="Eyebrow as a section heading (h3) and as a label (dt)">
        <Eyebrow as="h3">By supplier origin</Eyebrow>
        <dl>
          <Eyebrow as="dt">Algorithm</Eyebrow>
          <dd>SHA-256 with RSA</dd>
        </dl>
      </Specimens>
      <Specimens title="Absent">
        <Text>
          Assessor: <Absent />
        </Text>
      </Specimens>
      <Stack space="space.200" className="max-w-layout-measure">
        {tones.map((t) => (
          <Prose key={t} label={`${t} prose`} tone={t}>
            The condition, stated against CCI-001453. Management traffic on the tactical edge
            segment is not cryptographically protected.
          </Prose>
        ))}
      </Stack>
    </Stack>
  ),
};

/** In a rail: an Eyebrow heads a group of rows; Prose carries the paragraphs. */
export const InRail: Story = {
  render: () => (
    <Box style={{ width: 320 }} className="border-s border-default ps-200">
      <Stack space="space.300">
        <div>
          <Eyebrow as="h3" className="pb-050">
            Schedule
          </Eyebrow>
          <KeyValue label="Frequency">Quarterly</KeyValue>
          <KeyValue label="Next due">12 Nov 2026</KeyValue>
          <KeyValue label="Assessor">
            <Absent />
          </KeyValue>
        </div>
        <Prose label="Rationale" tone="warning">
          The July run had one exception where the approver also released the payment. Compensating
          review in place.
        </Prose>
        <Prose label="Objective">
          Payables are approved and paid by different people, so no one person can create and settle
          a vendor invoice.
        </Prose>
      </Stack>
    </Box>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<Eyebrow>Rationale</Eyebrow>}
        doText="One to three words: a name for what follows."
        dont={
          <Eyebrow>The rationale the assessor gave for accepting the exception in July</Eyebrow>
        }
        dontText="A sentence in uppercase. An eyebrow is a label, and uppercase is hard to read past three words."
      />
      <Pair
        do={
          <Prose label="Rationale">
            The July run had one exception where the approver also released the payment.
          </Prose>
        }
        doText="A labelled paragraph is Prose: the eyebrow over the text."
        dont={
          <Text>
            <Text weight="medium">Rationale: </Text>
            The July run had one exception where the approver also released the payment.
          </Text>
        }
        dontText="A bold run-in label with a colon. It reads as part of the sentence, and a column of them has no edge."
      />
      <Pair
        do={
          <Inline space="space.100" alignBlock="baseline">
            <Text color="color.text.subtle">Assessor</Text>
            <Absent />
          </Inline>
        }
        doText="Nothing there is a muted dash, in the value's place."
        dont={
          <Inline space="space.100" alignBlock="baseline">
            <Text color="color.text.subtle">Assessor</Text>
            <Text>N/A</Text>
          </Inline>
        }
        dontText="N/A in the default colour. It says not applicable, which is a different fact, and it reads as loud as a value."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
