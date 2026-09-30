import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Badge,
  Button,
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  Id,
} from "../../components";

import { RecordPicker, type PickerRecord } from "../..";
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
/**
 * Type to narrow, Enter to choose. The picker says what it is for as it opens and focuses the
 * field; choosing a record or pressing Escape closes it and puts focus back on the button that
 * opened it.
 */
export const RecordPickerStory: Story = {
  name: "Record picker",
  render: () => <PickerDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "Link evidence" });
    await userEvent.click(opener);
    const dialog = await page.findByRole("dialog", { name: "Link evidence" });
    await expect(dialog).toHaveAccessibleDescription(
      "Find a record by its name or its identifier.",
    );
    const field = within(dialog).getByRole("combobox");
    await waitFor(() => expect(field).toHaveFocus());
    await userEvent.type(field, "firewall");
    await expect(field).toHaveAccessibleDescription("1 match");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await expect(canvas.getByText("Linked EV-0412.")).toBeVisible();
    await waitFor(() => expect(opener).toHaveFocus());
    await userEvent.click(opener);
    await page.findByRole("dialog", { name: "Link evidence" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

const keyed: PickerRecord[] = [
  {
    id: "63f405ca-298e-5fb6-a218-d57a77ecc42e",
    code: "EV-0412",
    title: "Firewall ruleset export",
    meta: "Evidence · 12 Aug 2026",
  },
  {
    id: "0b1f2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
    code: "EV-0388",
    title: "Access review, Q2",
    meta: "Evidence · 30 Jun 2026",
  },
];

type Case = "keys" | "none" | "loading" | "failed";

function StatesDemo() {
  const [open, setOpen] = useState<Case | null>(null);
  const [tries, setTries] = useState(0);
  const records = open === "none" ? [] : open === "failed" ? [] : keyed;
  const labels: Record<Case, string> = {
    keys: "Keyed records",
    none: "No records",
    loading: "Still loading",
    failed: "Failed to load",
  };
  return (
    <Stack space="space.150">
      <Inline space="space.100" shouldWrap>
        {(Object.keys(labels) as Case[]).map((key) => (
          <Button key={key} onClick={() => setOpen(key)}>
            {labels[key]}
          </Button>
        ))}
      </Inline>
      <Text color="color.text.subtle">Tries: {tries}</Text>
      <RecordPicker
        open={open !== null}
        onClose={() => setOpen(null)}
        onPick={() => undefined}
        records={records}
        title="Link evidence"
        placeholder="Search evidence…"
        empty="No published evidence to link yet."
        emptyHint="No evidence matches. Check the spelling, or search for its code."
        loading={open === "loading"}
        error={open === "failed" ? true : undefined}
        onRetry={() => setTries((count) => count + 1)}
      />
    </Stack>
  );
}

/**
 * The states a picker passes through. Records keyed by database ids show their `code`, never the
 * key; no records at all says `empty`, a query that matches nothing says `emptyHint`; `loading`
 * shows Searching… under the rows and never says nothing matched; `error` is an Alert above the
 * rows with Try again, which puts focus back in the field.
 */
export const States: Story = {
  render: () => <StatesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const openCase = async (name: string) => {
      await userEvent.click(canvas.getByRole("button", { name }));
      return within(await page.findByRole("dialog", { name: "Link evidence" }));
    };
    const close = async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    };
    let dialog = await openCase("Keyed records");
    await waitFor(() => expect(dialog.getByText("EV-0412")).toBeVisible());
    await expect(dialog.queryByText(/63f405ca/)).toBeNull();
    await userEvent.type(dialog.getByRole("combobox"), "zzzz");
    await expect(await dialog.findByText(/No evidence matches/)).toBeVisible();
    await close();
    dialog = await openCase("No records");
    await waitFor(() =>
      expect(dialog.getByText("No published evidence to link yet.")).toBeVisible(),
    );
    await close();
    dialog = await openCase("Still loading");
    await waitFor(() => expect(dialog.getByText("Searching…")).toBeVisible());
    await userEvent.type(dialog.getByRole("combobox"), "zzzz");
    await expect(dialog.queryByText(/No evidence matches/)).toBeNull();
    await close();
    dialog = await openCase("Failed to load");
    await waitFor(() => expect(dialog.getByText("The records could not load.")).toBeVisible());
    // Nothing loaded, so the field says no count: "0 matches" would blame the query.
    await expect(dialog.getByRole("combobox")).not.toHaveAccessibleDescription(/match/);
    await userEvent.click(dialog.getByRole("button", { name: "Try again" }));
    await expect(canvas.getByText("Tries: 1")).toBeInTheDocument();
    await expect(dialog.getByRole("combobox")).toHaveFocus();
    await close();
  },
};

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
