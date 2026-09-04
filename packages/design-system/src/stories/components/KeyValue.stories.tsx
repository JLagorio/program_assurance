import type { Meta, StoryObj } from "@storybook/react-vite";

import { Absent, Badge, KeyValue } from "../../components";
import { Stack } from "../../primitives";

const meta = {
  title: "Components/KeyValue",
  component: KeyValue,
  parameters: { layout: "padded" },
} satisfies Meta<typeof KeyValue>;
export default meta;
type Story = StoryObj;

/** Label widths, a wrapping value, and an absent one. */
export const KeyValueMatrix: Story = {
  render: () => (
    <Stack space="space.100" className="w-layout-list">
      <KeyValue label="Owner">Dana Whitlock</KeyValue>
      <KeyValue label="Owner" labelWidth={160}>
        Wider label column
      </KeyValue>
      <KeyValue label="Statement" wrap>
        Accounts inactive for 90 days are disabled automatically by the identity provider;
        exceptions need a ticket approved by the system owner.
      </KeyValue>
      <KeyValue label="Assessor">
        <Absent />
      </KeyValue>
      <KeyValue label="Status">
        <Badge tone="warning">Partially satisfied</Badge>
      </KeyValue>
    </Stack>
  ),
};
