import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useState } from "react";
import { Button, defineColumns, KeyValue, RecordBrowser, Stack } from "../..";
import { interact } from "../_lib/interact";

type Record = { id: string; title: string; type: string; owner: string };
const records: Record[] = Array.from({ length: 24 }, (_, index) => ({
  id: `EVD-${String(index + 1).padStart(3, "0")}`,
  title: `Verification artifact ${index + 1}`,
  type: index % 2 ? "Test result" : "Document",
  owner: index % 3 ? "Alex Morgan" : "Dana Lee",
}));
const columns = defineColumns<Record>((c) => [
  c.id("id", { header: "Record", width: 110, hideable: false }),
  c.text("title", { header: "Artifact", minWidth: 200, hideable: false }),
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

function Example({ fail = false }: { fail?: boolean }) {
  const [open, setOpen] = useState(false);
  const [linked, setLinked] = useState<string[]>([]);
  return (
    <div className="p-200">
      <Button onClick={() => setOpen(true)}>Add evidence</Button>
      <p>Linked records: {linked.join(", ") || "None"}</p>
      <RecordBrowser
        open={open}
        onClose={() => setOpen(false)}
        title="Link evidence"
        description="Search and inspect the artifacts before linking them to this requirement."
        records={records}
        columns={columns}
        filters={["type", "owner"]}
        recordTitle={(record) => record.title}
        renderPreview={(record) => (
          <Stack space="space.200">
            <KeyValue label="Type">{record.type}</KeyValue>
            <KeyValue label="Owner">{record.owner}</KeyValue>
            <p className="font-body">
              The complete evidence record belongs here. Previewing it leaves selection, search and
              the table position intact.
            </p>
          </Stack>
        )}
        onConfirm={(chosen) => {
          if (fail)
            throw new Error("The evidence service is unavailable. Your selection is preserved.");
          setLinked(chosen.map((r) => r.id));
        }}
        confirmLabel="Link evidence"
      />
    </div>
  );
}

export const BrowseAndLink: Story = {
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    const firstRecordCell = dialog.getByRole("cell", { name: /^EVD-001/ });
    const previewButton = within(firstRecordCell).getByRole("button", { name: "Preview row" });
    await userEvent.hover(firstRecordCell);
    await userEvent.click(previewButton);
    await expect(previewButton).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByRole("button", { name: "Previous preview" })).toBeDisabled();
    await expect(dialog.getByRole("heading", { name: "Verification artifact 1" })).toHaveFocus();
    await userEvent.click(dialog.getByRole("checkbox", { name: "Select EVD-001" }));
    await expect(dialog.getByText("1 selected", { exact: true })).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "Next preview" }));
    await expect(dialog.getByRole("heading", { name: "Verification artifact 2" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(
      dialog.queryByRole("heading", { name: "Verification artifact 2" }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(previewButton).toHaveFocus());
    const search = dialog.getByRole("searchbox", { name: "Search records" });
    await userEvent.type(search, "EVD-024");
    await userEvent.click(dialog.getByRole("checkbox", { name: "Select row EVD-024" }));
    await expect(dialog.getByText("2 selected", { exact: true })).toBeVisible();
    await userEvent.clear(search);
    await userEvent.click(dialog.getByRole("button", { name: "Next page" }));
    await expect(dialog.getByRole("checkbox", { name: "Select row EVD-024" })).toBeChecked();
    await interact(() => dialog.getByRole("button", { name: "Link evidence (2)" }).click());
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Link evidence" })).not.toBeInTheDocument(),
    );
    await expect(canvas.getByText("Linked records: EVD-001, EVD-024")).toBeVisible();
    await waitFor(() => expect(canvas.getByRole("button", { name: "Add evidence" })).toHaveFocus());
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const reopened = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    await waitFor(() => expect(reopened.getByText("0 selected", { exact: true })).toBeVisible());
    await userEvent.keyboard("{Escape}");
  },
};
export const FailedLink: Story = {
  render: () => <Example fail />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Add evidence" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Link evidence" }));
    await userEvent.click(dialog.getByRole("checkbox", { name: "Select row EVD-001" }));
    await interact(() => dialog.getByRole("button", { name: "Link evidence (1)" }).click());
    await expect(dialog.getByRole("alert")).toHaveTextContent("Your selection is preserved.");
    await expect(dialog.getByRole("checkbox", { name: "Select row EVD-001" })).toBeChecked();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    await expect(canvas.getByText("Linked records: None")).toBeVisible();
  },
};
