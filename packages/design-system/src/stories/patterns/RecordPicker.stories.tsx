import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "../../components";
import { type PickerRecord, RecordPicker } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/RecordPicker",
  component: RecordPicker,
  parameters: { layout: "padded" },
} satisfies Meta<typeof RecordPicker>;
export default meta;
type Story = StoryObj;

const pickerRecords: PickerRecord[] = [
  {
    id: "EV-0412",
    title: "Firewall ruleset export",
    meta: "Evidence · 12 Aug 2026",
    badge: { label: "Fresh", tone: "success" },
  },
  {
    id: "EV-0388",
    title: "Access review, Q2",
    meta: "Evidence · 30 Jun 2026",
    badge: { label: "Stale", tone: "warning" },
  },
  { id: "EV-0301", title: "Pen test report", meta: "Evidence · 14 Mar 2026" },
  { id: "EV-0290", title: "Backup restore drill", keywords: "dr disaster recovery" },
];

function PickerDemo() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<PickerRecord | null>(null);
  return (
    <Stack space="space.150">
      <Inline space="space.100" alignBlock="center">
        <Button onClick={() => setOpen(true)}>Link evidence</Button>
        {picked ? <Text color="color.text.subtle">Linked {picked.id}.</Text> : null}
      </Inline>
      <RecordPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={setPicked}
        records={pickerRecords}
        title="Link evidence"
        placeholder="Search evidence…"
      />
    </Stack>
  );
}
export const RecordPickerStory: Story = { name: "Record picker", render: () => <PickerDemo /> };
/** Open, with a badge, without one, with a meta line, without one. */
export const RecordPickerMatrix: Story = {
  render: () => (
    <RecordPicker
      open
      onClose={() => undefined}
      onPick={() => undefined}
      records={pickerRecords}
      title="Link evidence"
      placeholder="Search evidence…"
    />
  ),
};
