import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useRef, useState } from "react";
import { Button, defineColumns, KeyValue, RecordBrowser, Section, Stack } from "../..";
import { interact } from "../_lib/interact";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

type Record = { id: string; title: string; type: string; owner: string };
const records: Record[] = Array.from({ length: 24 }, (_, index) => ({
  id: `EVD-${String(index + 1).padStart(3, "0")}`,
  title: `Verification artifact ${index + 1}`,
  type: index % 2 ? "Test result" : "Document",
  owner: index % 3 ? "Alex Morgan" : "Dana Lee",
}));
// The name keeps its place in a narrow browser; the record's id folds into More fields first.
const columns = defineColumns<Record>((c) => [
  c.id("id", { header: "Record", width: 110, hideable: false, priority: 1 }),
  c.text("title", { header: "Artifact", minWidth: 200, hideable: false, priority: 0 }),
  c.text("type", { header: "Type", width: 140 }),
  c.person("owner", { header: "Owner", width: 150 }),
]);
const meta = {
  title: "Patterns/RecordBrowser",
  component: RecordBrowser,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RecordBrowser>;
export default meta;
type Story = StoryObj;

const phone = { viewport: { value: "ledgerPhone", isRotated: false } };

function Example({
  fail = false,
  retainSelection = false,
  context,
}: {
  fail?: boolean;
  retainSelection?: boolean;
  context?: string;
}) {
  const [open, setOpen] = useState(false);
  const [linked, setLinked] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return (
    <div className="p-200">
      <Button onClick={() => setOpen(true)}>Add evidence</Button>
      <p>Linked records: {linked.join(", ") || "None"}</p>
      <RecordBrowser
        {...(retainSelection ? { selectedIds, onSelectionChange: setSelectedIds } : {})}
        open={open}
        onClose={() => setOpen(false)}
        title="Link evidence"
        description="Search and inspect the artifacts before linking them to this requirement."
        records={records}
        columns={columns}
        filters={["type", "owner"]}
        recordTitle={(record) => record.title}
        recordCode={(record) => record.id}
        searchPlaceholder="Search evidence"
        renderPreview={(record) => (
          <Section title="Details">
            <Stack space="space.200">
              <KeyValue label="Type">{record.type}</KeyValue>
              <KeyValue label="Owner">{record.owner}</KeyValue>
              <p className="font-body">
                The complete evidence record belongs here. Previewing it leaves selection, search
                and the table position intact.
              </p>
            </Stack>
          </Section>
        )}
        onConfirm={(chosen) => {
          if (fail)
            throw new Error("The evidence service is unavailable. Your selection is preserved.");
          setLinked(chosen.map((r) => r.id));
        }}
        confirmLabel="Link evidence"
        {...(context ? { context: <p className="font-body text-subtle">{context}</p> } : {})}
      />
    </div>
  );
}

/** The preview's own region, named by the record it shows. */
const previewOf = (dialog: ReturnType<typeof within>, name: string) =>
  within(dialog.getByRole("region", { name }));

/**
 * Escape until the preview has closed: a focused step button's tooltip takes the first Escape, as
 * a tooltip should, and the preview the next.
 */
const closePreview = async (dialog: ReturnType<typeof within>) => {
  const open = () => dialog.queryByRole("button", { name: "Back to results" });
  for (let press = 0; press < 3 && open(); press++) {
    await userEvent.keyboard("{Escape}");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await waitFor(() => expect(open()).toBeNull());
};

/**
 * Escape until the browser has closed: a focused eye's tooltip takes the first Escape, as a
 * tooltip should, and the browser the next.
 */
const closeBrowser = async (canvasElement: HTMLElement) => {
  const body = within(canvasElement.ownerDocument.body);
  for (let press = 0; press < 3 && body.queryByRole("dialog"); press++) {
    await userEvent.keyboard("{Escape}");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
};

/**
 * Search, preview and select, then link. The eye on each row and every checkbox say the record's
 * name; previous and next say which record and where it is; closing the preview returns focus to
 * the eye of the record that was being read. Selection survives search and pages, and a new
 * opening starts with nothing chosen.
 */
export const BrowseAndLink: Story = {
  render: Example,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    const eye = dialog.getByRole("button", { name: "Preview Verification artifact 1" });
    await userEvent.click(eye);
    await expect(eye).toHaveAttribute("aria-pressed", "true");
    const recordName = dialog.getByRole("heading", { name: "Verification artifact 1" });
    await expect(recordName).toHaveFocus();
    // The record's name is the kit's record title, a level under the dialog's h2, and what the
    // preview shows sits a level under it.
    await expect(recordName.tagName).toBe("H3");
    await expect(recordName).toHaveAttribute("data-slot", "page-header-title");
    let preview = previewOf(dialog, "Verification artifact 1");
    await expect(preview.getByRole("heading", { name: "Details" }).tagName).toBe("H4");
    await expect(preview.getByText("EVD-001")).toBeVisible();
    await expect(preview.getByRole("button", { name: "Previous record" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.click(
      preview.getByRole("checkbox", { name: "Select Verification artifact 1" }),
    );
    await waitFor(() =>
      expect(dialog.getByText("1 of 24 selected", { exact: true })).toBeVisible(),
    );
    const next = preview.getByRole("button", { name: "Next record" });
    await userEvent.click(next);
    preview = previewOf(dialog, "Verification artifact 2");
    await expect(preview.getByRole("status")).toHaveTextContent(
      "Verification artifact 2, 2 of 24 records",
    );
    await expect(next).toHaveFocus();
    await closePreview(dialog);
    await expect(
      dialog.queryByRole("heading", { name: "Verification artifact 2" }),
    ).not.toBeInTheDocument();
    // Back to the eye of the record that was being read, not the first one opened.
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "Preview Verification artifact 2" })).toHaveFocus(),
    );
    const search = dialog.getByRole("searchbox", { name: "Search evidence" });
    await userEvent.type(search, "EVD-024");
    await userEvent.click(
      dialog.getByRole("checkbox", { name: "Select Verification artifact 24" }),
    );
    await expect(dialog.getByText("2 of 24 selected", { exact: true })).toBeVisible();
    await userEvent.clear(search);
    await userEvent.click(dialog.getByRole("button", { name: "Next page" }));
    await expect(
      dialog.getByRole("checkbox", { name: "Select Verification artifact 24" }),
    ).toBeChecked();
    await interact(() => dialog.getByRole("button", { name: "Link evidence (2)" }).click());
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Link evidence" })).not.toBeInTheDocument(),
    );
    await expect(canvas.getByText("Linked records: EVD-001, EVD-024")).toBeVisible();
    await waitFor(() => expect(canvas.getByRole("button", { name: "Add evidence" })).toHaveFocus());
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const reopened = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    await waitFor(() =>
      expect(reopened.getByText("0 of 24 selected", { exact: true })).toBeVisible(),
    );
    await userEvent.keyboard("{Escape}");
  },
};

/** A link that fails says why in a danger Alert and keeps the selection for a retry. */
export const FailedLink: Story = {
  render: () => <Example fail />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    await userEvent.click(dialog.getByRole("checkbox", { name: "Select Verification artifact 1" }));
    await interact(() => dialog.getByRole("button", { name: "Link evidence (1)" }).click());
    await expect(dialog.getByRole("alert")).toHaveTextContent("Your selection is preserved.");
    await expect(
      dialog.getByRole("checkbox", { name: "Select Verification artifact 1" }),
    ).toBeChecked();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await expect(canvas.getByText("Linked records: None")).toBeVisible();
  },
};

/** With `selectedIds` and `onSelectionChange` the caller owns the selection, so it outlasts a closed browser. */
export const RetainedSelection: Story = {
  render: () => <Example retainSelection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    let dialog = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    await userEvent.click(dialog.getByRole("checkbox", { name: "Select Verification artifact 1" }));
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Link evidence" })).not.toBeInTheDocument(),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    dialog = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    await expect(
      dialog.getByRole("checkbox", { name: "Select Verification artifact 1" }),
    ).toBeChecked();
    await waitFor(() =>
      expect(dialog.getByText("1 of 24 selected", { exact: true })).toBeVisible(),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Clear selection" }));
    await expect(dialog.getByText("0 of 24 selected", { exact: true })).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
  },
};

/** Whether a focused control is inside the popup's visible box and clear of its footer. */
const inView = (element: HTMLElement, popup: HTMLElement, footer: HTMLElement) => {
  const box = element.getBoundingClientRect();
  const frame = popup.getBoundingClientRect();
  const floor = footer.contains(element) ? frame.bottom : footer.getBoundingClientRect().top;
  if (box.height > floor - frame.top) return box.top < floor && box.bottom > frame.top;
  return box.top >= frame.top - 1 && box.bottom <= floor + 1;
};

/**
 * At 400% zoom, 320 by 256 CSS px. The context scrolls with the results rather than taking a
 * fixed row, and under 30rem tall the whole dialog scrolls as one with the footer held at the
 * bottom: the title and Close come back into view when it is scrolled up, and every control that
 * takes focus can be seen. The preview, which takes the results' place, scrolls with it too: its
 * name and its Select checkbox come into view, clear of the footer.
 */
export const ShortWindow: Story = {
  render: () => <Example context="Linking to the access review · 3 artifacts already linked" />,
  parameters: {
    viewport: {
      options: {
        ledgerShort: {
          name: "Short window (320 by 256 CSS px)",
          styles: { width: "320px", height: "256px" },
        },
      },
    },
  },
  globals: { viewport: { value: "ledgerShort", isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(window.innerHeight).toBeLessThanOrEqual(480);
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const popup = await screen.findByRole("dialog", { name: "Link evidence" });
    const context = popup.querySelector<HTMLElement>("[data-record-browser-context]")!;
    await expect(context.closest("[data-record-browser-results]")).not.toBeNull();
    await expect(popup.scrollHeight).toBeGreaterThan(popup.clientHeight);
    const footer = popup.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
    for (let step = 0; step < 6; step++) {
      await userEvent.tab();
      const focused = canvasElement.ownerDocument.activeElement as HTMLElement;
      await expect(popup).toContainElement(focused);
      await waitFor(() => expect(inView(focused, popup, footer)).toBe(true));
    }
    // The preview in the results' place: its name and its Select checkbox can each be seen.
    const dialog = within(popup);
    await userEvent.click(dialog.getByRole("button", { name: "Preview Verification artifact 1" }));
    const heading = dialog.getByRole("heading", { name: "Verification artifact 1" });
    await waitFor(() => expect(heading).toHaveFocus());
    await waitFor(() => expect(inView(heading, popup, footer)).toBe(true));
    const select = previewOf(dialog, "Verification artifact 1").getByRole("checkbox", {
      name: "Select Verification artifact 1",
    });
    for (let step = 0; step < 4 && canvasElement.ownerDocument.activeElement !== select; step++) {
      await userEvent.tab();
      const focused = canvasElement.ownerDocument.activeElement as HTMLElement;
      await waitFor(() => expect(inView(focused, popup, footer)).toBe(true));
    }
    await expect(select).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(dialog.queryByRole("heading", { name: "Verification artifact 1" })).toBeNull(),
    );
    popup.scrollTop = 0;
    await waitFor(() =>
      expect(within(popup).getByRole("heading", { name: "Link evidence" })).toBeVisible(),
    );
    await expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight + 1);
    await closeBrowser(canvasElement);
  },
};

function PendingExample() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState(0);
  const [closes, setCloses] = useState(0);
  const pending = useRef<{ resolve: () => void; reject: () => void } | null>(null);
  return (
    <div className="p-200">
      <Button onClick={() => setOpen(true)}>Add evidence</Button>
      <p>Confirmation requests: {requests}</p>
      <p>Completed sessions: {closes}</p>
      {/* Outside the browser's results, so they stay in reach while it confirms. */}
      <Stack space="space.100">
        <Button onClick={() => pending.current?.resolve()}>Finish linking</Button>
        <Button onClick={() => pending.current?.reject()}>Fail linking</Button>
      </Stack>
      <RecordBrowser
        open={open}
        onClose={() => {
          setOpen(false);
          setCloses((count) => count + 1);
        }}
        title="Link evidence"
        description="A delayed confirmation stays with the session that started it."
        records={records}
        columns={columns}
        recordTitle={(record) => record.title}
        renderPreview={(record) => <p>{record.title}</p>}
        context={<Button onClick={() => setOpen(false)}>Leave workflow</Button>}
        onConfirm={() => {
          setRequests((count) => count + 1);
          return new Promise<void>((resolve, reject) => {
            pending.current = { resolve, reject: () => reject(new Error("Try linking again.")) };
          });
        }}
        confirmLabel="Link evidence"
      />
    </div>
  );
}

/**
 * While `onConfirm` runs the browser holds: Cancel, Close, Escape and the blanket do nothing, the
 * results are inert and `aria-busy`, and Clear selection waits, so the records being linked are
 * the ones on screen. A session the application closed while it confirmed does not lock or close
 * the next one.
 */
export const PendingConfirmation: Story = {
  name: "Pending confirmation and replacement sessions",
  render: () => <PendingExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    const open = async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
      return within(await screen.findByRole("dialog", { name: "Link evidence" }));
    };
    let dialog = await open();
    await userEvent.click(dialog.getByRole("checkbox", { name: "Select Verification artifact 1" }));
    const confirm = dialog.getByRole("button", { name: "Link evidence (1)" });
    await interact(() => {
      confirm.click();
      confirm.click();
    });
    await expect(canvas.getByText("Confirmation requests: 1")).toBeInTheDocument();
    // The kit's pending lock: the dialog is busy and Close and Cancel say they are unavailable.
    const popup = screen.getByRole("dialog", { name: "Link evidence" });
    await expect(popup).toHaveAttribute("aria-busy", "true");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(dialog.getByRole("button", { name: "Close" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    // The choice being linked cannot change while it is linked.
    const results = popup.querySelector("[data-record-browser-results]");
    await expect(results).toHaveAttribute("inert");
    await expect(results).toHaveAttribute("aria-busy", "true");
    await expect(dialog.getByRole("button", { name: "Clear selection" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.keyboard("{Escape}");
    await expect(screen.getByRole("dialog", { name: "Link evidence" })).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "Close" }));
    await expect(screen.getByRole("dialog", { name: "Link evidence" })).toBeVisible();
    await userEvent.click(
      canvasElement.ownerDocument.querySelector('[data-slot="dialog-overlay"]')!,
    );
    await expect(screen.getByRole("dialog", { name: "Link evidence" })).toBeVisible();
    // The application leaves the workflow itself; the results are inert, so it does it directly.
    await interact(() =>
      popup.querySelector<HTMLButtonElement>("[data-record-browser-context] button")!.click(),
    );
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Link evidence" })).toBeNull());
    dialog = await open();
    // The session left while it confirmed does not lock the next one.
    await expect(screen.getByRole("dialog", { name: "Link evidence" })).not.toHaveAttribute(
      "aria-busy",
    );
    await userEvent.click(dialog.getByRole("checkbox", { name: "Select Verification artifact 2" }));
    // Outside the modal, so pressed directly.
    await interact(() =>
      canvas.getByRole("button", { name: "Finish linking", hidden: true }).click(),
    );
    await expect(screen.getByRole("dialog", { name: "Link evidence" })).toBeVisible();
    await expect(
      dialog.getByRole("checkbox", { name: "Select Verification artifact 2" }),
    ).toBeChecked();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeEnabled();
    await expect(canvas.getByText("Completed sessions: 0")).toBeInTheDocument();
    await interact(() => dialog.getByRole("button", { name: "Link evidence (1)" }).click());
    await expect(canvas.getByText("Confirmation requests: 2")).toBeInTheDocument();
    await interact(() =>
      canvas.getByRole("button", { name: "Fail linking", hidden: true }).click(),
    );
    await expect(dialog.getByRole("alert")).toHaveTextContent("Try linking again.");
    await expect(
      dialog.getByRole("checkbox", { name: "Select Verification artifact 2" }),
    ).toBeChecked();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Link evidence" })).toBeNull());
    await expect(canvas.getByText("Completed sessions: 1")).toBeVisible();
  },
};

type Artifact = { id: string; code: string; title: string; kind: string };
const keyed: Artifact[] = [
  ["63f405ca-298e-5fb6-a218-d57a77ecc42e", "EV-0412", "Firewall ruleset export", "Export"],
  ["0b1f2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d", "EV-0388", "Access review, Q2", "Review"],
  ["9d8c7b6a-5f4e-4d3c-2b1a-0f9e8d7c6b5a", "EV-0301", "Pen test report", "Report"],
].map(([id, code, title, kind]) => ({ id: id!, code: code!, title: title!, kind: kind! }));
const keyedColumns = defineColumns<Artifact>((c) => [
  c.text("code", { header: "Code", width: 100 }),
  c.text("title", { header: "Artifact", minWidth: 200, priority: 0 }),
  c.text("kind", { header: "Kind", width: 120 }),
]);

function KeyedExample({
  named = true,
  trigger = "Add evidence",
}: {
  named?: boolean;
  trigger?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-200">
      <Button onClick={() => setOpen(true)}>{trigger}</Button>
      <RecordBrowser
        open={open}
        onClose={() => setOpen(false)}
        title="Link evidence"
        description="The records are keyed by database ids; the reader sees their codes and names."
        records={keyed}
        columns={keyedColumns}
        previewColumn="title"
        recordTitle={(record) => <strong>{record.title}</strong>}
        recordLabel={named ? (record) => record.title : undefined}
        recordCode={(record) => record.code}
        renderPreview={(record) => <KeyValue label="Kind">{record.kind}</KeyValue>}
        onConfirm={() => undefined}
        confirmLabel="Link evidence"
      />
    </div>
  );
}

const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

/**
 * Records keyed by database ids. `recordLabel` names each row's checkbox and eye, the preview's
 * Select and what previous and next say; `recordCode` is the eyebrow over the preview's name; and
 * `previewColumn` makes the name the column that leads the row and carries the eye. No id reaches
 * the screen or a control's name.
 */
export const ReadableNames: Story = {
  render: () => <KeyedExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const popup = await screen.findByRole("dialog", { name: "Link evidence" });
    const dialog = within(popup);
    const eye = dialog.getByRole("button", { name: "Preview Firewall ruleset export" });
    // The name leads the row, and its cell carries the eye.
    await expect(eye.closest("td, th")).toHaveTextContent("Firewall ruleset export");
    await expect(dialog.getAllByRole("columnheader")[1]).toHaveTextContent("Artifact");
    await userEvent.click(eye);
    const preview = previewOf(dialog, "Firewall ruleset export");
    await expect(preview.getByText("EV-0412")).toBeVisible();
    await expect(
      preview.getByRole("checkbox", { name: "Select Firewall ruleset export" }),
    ).toBeInTheDocument();
    await userEvent.click(preview.getByRole("button", { name: "Next record" }));
    await expect(previewOf(dialog, "Access review, Q2").getByRole("status")).toHaveTextContent(
      "Access review, Q2, 2 of 3 records",
    );
    await expect(popup.textContent ?? "").not.toMatch(uuid);
    for (const control of dialog.getAllByRole("checkbox"))
      await expect(control.getAttribute("aria-label") ?? control.textContent ?? "").not.toMatch(
        uuid,
      );
    await closePreview(dialog);
    await closeBrowser(canvasElement);
  },
};

/**
 * Nothing eligible to link at all: in place of the table the browser says so, with the caller's
 * `actions` as its step and a quieter link beside it, and the context stays above. A search that
 * matches nothing is not this: it is the table's filtered state, with Clear filters.
 */
export const NothingToLink: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-200">
        <Button onClick={() => setOpen(true)}>Add evidence</Button>
        <RecordBrowser
          open={open}
          onClose={() => setOpen(false)}
          title="Link evidence"
          description="Published versions in this program can be linked to the requirement."
          records={[] as Record[]}
          columns={columns}
          recordTitle={(record) => record.title}
          renderPreview={(record) => <p>{record.title}</p>}
          onConfirm={() => undefined}
          confirmLabel="Link evidence"
          context={<p className="font-body text-subtle">Linking to the access review</p>}
          actions={<Button size="small">Create evidence artifact</Button>}
          empty={{
            title: "No published evidence available",
            description: "Evidence becomes available here once a version is published.",
            secondary: (
              <Button variant="subtle" size="small">
                Open program evidence
              </Button>
            ),
            illustration: "document",
          }}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    await waitFor(() => expect(dialog.getByText("No published evidence available")).toBeVisible());
    await expect(dialog.getByText("Linking to the access review")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Create evidence artifact" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Open program evidence" })).toBeVisible();
    await expect(dialog.queryByText("Nothing matches")).toBeNull();
    await expect(dialog.getByRole("button", { name: "Link evidence" })).toBeDisabled();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

/**
 * `state` says where the records are: skeleton rows under the toolbar while they load, the
 * caller's `error` in place of the rows when they fail. Once they are in, a search that matches
 * nothing shows the table's filtered state, and Clear filters brings every row back. A refresh
 * that fails keeps the rows the reader had, under the error with Try again (`onRetry`).
 */
export const LoadingAndNoMatch: Story = {
  name: "Loading, failure and no match",
  render: function Render() {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<"loading" | "ready" | "error">("loading");
    const [loaded, setLoaded] = useState(false);
    return (
      <div className="p-200">
        <Button onClick={() => setOpen(true)}>Add evidence</Button>
        <RecordBrowser
          open={open}
          onClose={() => setOpen(false)}
          title="Link evidence"
          description="Published versions in this program can be linked to the requirement."
          records={loaded ? records : []}
          state={state}
          error="The evidence could not load."
          onRetry={() => setState("ready")}
          columns={columns}
          recordTitle={(record) => record.title}
          renderPreview={(record) => <p>{record.title}</p>}
          onConfirm={() => undefined}
          confirmLabel="Link evidence"
          context={
            <Stack space="space.100">
              <Button
                size="small"
                onClick={() => {
                  setLoaded(true);
                  setState("ready");
                }}
              >
                Finish loading
              </Button>
              <Button size="small" onClick={() => setState("error")}>
                Fail loading
              </Button>
            </Stack>
          }
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const popup = await screen.findByRole("dialog", { name: "Link evidence" });
    const dialog = within(popup);
    // Loading: the toolbar stays and the rows are skeletons, never the empty state.
    await waitFor(() =>
      expect(dialog.getByRole("searchbox", { name: "Search records" })).toBeVisible(),
    );
    await expect(dialog.getByRole("table", { name: "Link evidence" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(dialog.queryByText("Nothing to choose from")).toBeNull();
    await userEvent.click(dialog.getByRole("button", { name: "Finish loading" }));
    const search = dialog.getByRole("searchbox", { name: "Search records" });
    await userEvent.type(search, "zzzzqq");
    await expect(await dialog.findByText("Nothing matches")).toBeVisible();
    await expect(dialog.queryByText("Nothing to choose from")).toBeNull();
    await userEvent.click(dialog.getByRole("button", { name: "Clear filters" }));
    await expect(search).toHaveValue("");
    await expect(
      dialog.getByRole("checkbox", { name: "Select Verification artifact 1" }),
    ).toBeVisible();
    // A failed refresh keeps the rows the reader had, under the error and its Try again.
    await userEvent.click(dialog.getByRole("button", { name: "Fail loading" }));
    await expect(await dialog.findByRole("alert")).toHaveTextContent(
      "The evidence could not load.",
    );
    await expect(
      dialog.getByRole("checkbox", { name: "Select Verification artifact 1" }),
    ).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(dialog.queryByRole("alert")).toBeNull());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

/**
 * Previous and next walk every row the search and filters leave, across the table's pages: a step
 * past the last row of a page turns the table to the next one, the status says which record and
 * where it is, and at the end Next keeps focus while it says it is unavailable. Closing returns
 * focus to the eye of the record being read, on the page it is on.
 */
export const PreviewAcrossPages: Story = {
  name: "Preview across pages",
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    await userEvent.click(dialog.getByRole("button", { name: "Preview Verification artifact 20" }));
    let preview = previewOf(dialog, "Verification artifact 20");
    const next = preview.getByRole("button", { name: "Next record" });
    for (let row = 21; row <= 24; row++) {
      await userEvent.click(next);
      preview = previewOf(dialog, `Verification artifact ${row}`);
      await expect(preview.getByRole("status")).toHaveTextContent(
        `Verification artifact ${row}, ${row} of 24 records`,
      );
    }
    await expect(next).toHaveFocus();
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await closePreview(dialog);
    await waitFor(() =>
      expect(
        dialog.getByRole("button", { name: "Preview Verification artifact 24" }),
      ).toHaveFocus(),
    );
    await expect(
      dialog.queryByRole("button", { name: "Preview Verification artifact 1" }),
    ).toBeNull();
    await closeBrowser(canvasElement);
  },
};

/**
 * On a phone the preview takes the results' place, and the way back leads its header as a chevron,
 * Back to results, away from the dialog's Close. Beside the results it is the X at the end.
 * Going back returns focus to the row's eye.
 */
export const Phone: Story = {
  globals: phone,
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const popup = await screen.findByRole("dialog", { name: "Link evidence" });
    const dialog = within(popup);
    await userEvent.click(dialog.getByRole("button", { name: "Preview Verification artifact 1" }));
    const heading = dialog.getByRole("heading", { name: "Verification artifact 1" });
    await expect(popup.querySelector("[data-record-browser-results]")).not.toBeVisible();
    const back = dialog.getByRole("button", { name: "Back to results" });
    // One way back, at the start of the preview's header.
    await expect(dialog.getAllByRole("button", { name: "Back to results" })).toHaveLength(1);
    await expect(back.getBoundingClientRect().left).toBeLessThan(
      heading.getBoundingClientRect().left + 1,
    );
    await userEvent.click(back);
    await waitFor(() =>
      expect(dialog.getByRole("button", { name: "Preview Verification artifact 1" })).toHaveFocus(),
    );
    await closeBrowser(canvasElement);
  },
};

type Wide = Record & { context: string; collected: string };
const wide: Wide[] = records.map((record, index) => ({
  ...record,
  context: index % 2 ? "Flight computer" : "Ground station",
  collected: `2026-0${(index % 9) + 1}-1${index % 10}`,
}));
const wideColumns = defineColumns<Wide>((c) => [
  c.id("id", { header: "Record", width: 110, hideable: false, priority: 1 }),
  c.text("title", { header: "Artifact", minWidth: 220, hideable: false, priority: 0 }),
  c.text("type", { header: "Type", width: 140 }),
  c.person("owner", { header: "Owner", width: 160 }),
  c.text("context", { header: "Context", width: 160 }),
  c.date("collected", { header: "Collected", width: 130 }),
]);

/**
 * The table fits the results pane beside an open preview: the fields that do not fit move into
 * each row's More fields instead of a sideways scroll, and the rows scroll under the header inside
 * the table while the search, the filters and the pagination stay in view.
 */
export const FitsItsPane: Story = {
  name: "Fits its pane",
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-200">
        <Button onClick={() => setOpen(true)}>Add evidence</Button>
        <RecordBrowser
          open={open}
          onClose={() => setOpen(false)}
          title="Link evidence"
          description="Six fields per artifact, with the preview open beside them."
          records={wide}
          columns={wideColumns}
          filters={["type", "owner"]}
          recordTitle={(record) => record.title}
          renderPreview={(record) => <KeyValue label="Context">{record.context}</KeyValue>}
          onConfirm={() => undefined}
          confirmLabel="Link evidence"
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const popup = await screen.findByRole("dialog", { name: "Link evidence" });
    const dialog = within(popup);
    const results = popup.querySelector<HTMLElement>("[data-record-browser-results]")!;
    const frame = results.querySelector<HTMLElement>('[data-slot="table-container"]')!;
    // With the results alone, at any width, nothing scrolls sideways.
    await waitFor(() => expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth + 1));
    await userEvent.click(dialog.getByRole("button", { name: "Preview Verification artifact 1" }));
    // Past the split size (50rem) the preview opens beside the results rather than in their place.
    if (popup.getBoundingClientRect().width > 820) await expect(results).toBeVisible();
    if (results.checkVisibility()) {
      // Nothing scrolls sideways: the fields that do not fit are in More fields.
      await waitFor(() => expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth + 1));
      await expect(
        dialog.getAllByRole("button", { name: /^Show \d+ more fields? for / }).length,
      ).toBeGreaterThan(0);
      // The rows scroll inside the table; the search stays where it is.
      const search = dialog.getByRole("searchbox", { name: "Search records" });
      // Measured from the popup, so its entrance animation does not count as a move.
      const offset = () => search.getBoundingClientRect().top - popup.getBoundingClientRect().top;
      const before = offset();
      frame.scrollTop = frame.scrollHeight;
      await waitFor(() => expect(frame.scrollTop).toBeGreaterThan(0));
      await expect(offset()).toBeCloseTo(before, 0);
      await expect(results.scrollTop).toBe(0);
    }
    await closePreview(dialog);
    await closeBrowser(canvasElement);
  },
};

/** A record whose title is markup and whose ids are database keys takes `recordLabel`; without it, every checkbox and eye is named by the key. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  parameters: { layout: "padded" },
  render: () => (
    <Pair
      do={<KeyedExample trigger="Add evidence, named" />}
      doText="recordLabel={(record) => record.title}: the checkbox says Select Firewall ruleset export."
      dont={<KeyedExample named={false} trigger="Add evidence, keyed" />}
      dontText="No recordLabel beside a title in markup. The name falls back to the record's id, so a screen reader hears Select 63f405ca-298e-5fb6…"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence, named" }));
    const named = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    await expect(
      named.getByRole("checkbox", { name: "Select Firewall ruleset export" }),
    ).toBeInTheDocument();
    await closeBrowser(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence, keyed" }));
    const keyedDialog = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    await expect(
      keyedDialog.getByRole("checkbox", { name: `Select ${keyed[0]!.id}` }),
    ).toBeInTheDocument();
    await closeBrowser(canvasElement);
  },
};
