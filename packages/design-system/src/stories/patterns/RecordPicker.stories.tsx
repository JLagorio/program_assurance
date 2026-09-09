import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  Id,
} from "../../components";

import { RecordPicker, type PickerRecord } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

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

/** Open, with a badge, without one, with a meta line, without one; the count in the field and the keys in the footer. */
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

/** The picker's list, inline, for a pair. */
function Rows({ placeholder, children }: { placeholder: string; children: ReactNode }) {
  return (
    <div className="rounded-large border border-default bg-surface-overlay shadow-raised">
      <Command label="Evidence">
        <CommandInput placeholder={placeholder}></CommandInput>
        <CommandList>{children}</CommandList>
      </Command>
    </div>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Rows placeholder="Search evidence…">
            {pickerRecords.slice(0, 2).map((r) => (
              <CommandItem key={r.id} value={r.id} className="h-auto py-100">
                <Id className="text-subtle">{r.id}</Id>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{r.title}</span>
                  <span className="block truncate font-body-xsmall text-subtle">{r.meta}</span>
                </span>
                {r.badge ? (
                  <Badge variant="secondary" size="xsmall" tone={r.badge.tone ?? "neutral"}>
                    {r.badge.label}
                  </Badge>
                ) : null}
              </CommandItem>
            ))}
          </Rows>
        }
        doText="The id first, the name, a line of meta under it, one badge at the end. A row the reader scans."
        dont={
          <Rows placeholder="Search…">
            <CommandItem value="a" className="h-auto py-100">
              <span className="min-w-0 flex-1">
                <span className="block">Firewall ruleset export</span>
                <span className="block font-body-xsmall text-subtle">
                  Exported from the management console by Dana Whitfield on 12 August 2026 for the
                  Q3 review and attached to the change record the same day.
                </span>
              </span>
              <Inline space="space.050">
                <Badge variant="secondary" size="xsmall" tone="success">
                  Fresh
                </Badge>
                <Badge variant="secondary" tone="neutral" size="xsmall">
                  PDF
                </Badge>
                <Badge variant="secondary" size="xsmall" tone="information">
                  Reviewed
                </Badge>
              </Inline>
            </CommandItem>
            <CommandItem value="b" className="h-auto py-100">
              <span className="min-w-0 flex-1">
                <span className="block">Access review, Q2</span>
                <span className="block font-body-xsmall text-subtle">
                  The quarterly review of privileged accounts across the enclave, signed off by the
                  ISSO and the system owner at the end of June.
                </span>
              </span>
              <Inline space="space.050">
                <Badge variant="secondary" size="xsmall" tone="warning">
                  Stale
                </Badge>
                <Badge variant="secondary" tone="neutral" size="xsmall">
                  XLSX
                </Badge>
                <Badge variant="secondary" size="xsmall" tone="information">
                  Reviewed
                </Badge>
              </Inline>
            </CommandItem>
          </Rows>
        }
        dontText="No id, a paragraph and three badges per row, and Search… as the placeholder. The id is how a record is known, and the paragraph is the record's."
      />
    </Stack>
  ),
};
