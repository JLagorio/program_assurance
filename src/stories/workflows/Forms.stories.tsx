import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button, Field, Input, Stack, Switch } from "@ledger/design-system";
import { TaskDialog } from "@/components/app/task-dialog";
import { tasksFor } from "@/lib/tasks";
import { useRecordForm } from "@/lib/record-form";

/** Exercises the policy shared by record editors, conditional approvals and task forms. */
function RecordFormContract() {
  const [record, setRecord] = useState({ title: "", reference: "REC-1" });
  const [saved, setSaved] = useState("");
  const { form, formId, formRef } = useRecordForm({ draft: record, reason: "" }, (value) => ({
    "draft.title": value.draft.title,
    reason: needsReason && value.reason,
  }));
  const [needsReason, setNeedsReason] = useState(true);
  useEffect(() => {
    form.reset({ draft: record, reason: "" });
  }, [record, form]);
  return (
    <Stack space="space.200">
      <Switch checked={needsReason} onCheckedChange={setNeedsReason}>
        Require a reason
      </Switch>
      <form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit({ save: () => setSaved(form.state.values.draft.title) });
        }}
      >
        <Stack space="space.150">
          <form.Field name="draft.title">
            {(field) => (
              <Field
                label="Record title"
                isRequired
                hint="The title of this record."
                error={
                  field.state.meta.isTouched && !field.state.meta.isValid
                    ? [...new Set(field.state.meta.errors)].join(" ")
                    : undefined
                }
              >
                <Input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="reason">
            {(field) => (
              <Field
                label="Reason"
                isRequired={needsReason}
                error={
                  field.state.meta.isTouched && !field.state.meta.isValid
                    ? [...new Set(field.state.meta.errors)].join(" ")
                    : undefined
                }
              >
                <Input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </Field>
            )}
          </form.Field>
          <Button type="submit">Save record</Button>
        </Stack>
      </form>
      <Button onClick={() => setRecord({ title: "Second record", reference: "REC-2" })}>
        Open another record
      </Button>

      <output aria-label="Saved record">{saved}</output>
    </Stack>
  );
}

const meta = {
  title: "Product/Forms",
  component: RecordFormContract,
  tags: ["app-contract"],
  parameters: { layout: "padded", a11y: { test: "error" } },
} satisfies Meta<typeof RecordFormContract>;
export default meta;
type Story = StoryObj<typeof meta>;

export const NestedAndConditionalValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole("textbox", { name: "Record title" });
    const reason = canvas.getByRole("textbox", { name: "Reason" });
    await userEvent.click(canvas.getByRole("button", { name: "Save record" }));
    await waitFor(() => expect(title).toHaveFocus());
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await expect(reason).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByRole("status", { name: "Saved record" })).toBeEmptyDOMElement();
    await userEvent.type(title, "First record");
    await waitFor(() => expect(title).not.toHaveAttribute("aria-invalid", "true"));
    await expect(title).toHaveAccessibleDescription("The title of this record.");
    await userEvent.click(canvas.getByRole("switch", { name: "Require a reason" }));
    await userEvent.click(title);
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Saved record" })).toHaveTextContent(
        "First record",
      ),
    );
    await expect(reason).not.toHaveAttribute("aria-invalid", "true");
    await userEvent.clear(title);
    await userEvent.click(canvas.getByRole("button", { name: "Save record" }));
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Open another record" }));
    await expect(title).toHaveValue("Second record");
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
  },
};

function TaskFormContract() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState("");
  const subject = { kind: "control" as const, id: "FORM-CONTRACT-CONTROL", label: "Form contract" };
  return (
    <Stack space="space.150">
      <Button onClick={() => setOpen(true)}>New task</Button>
      <TaskDialog
        open={open}
        onClose={() => setOpen(false)}
        program="PRG-001"
        subject={subject}
        requester="Priya Raghavan"
        onCreated={() => setSaved(tasksFor(subject).at(-1)?.title ?? "")}
      />
      <output aria-label="Created task">{saved}</output>
    </Stack>
  );
}

export const TaskSubmissionAndReset: Story = {
  render: () => <TaskFormContract />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "New task" }));
    let dialog = within(await page.findByRole("dialog"));
    const title = dialog.getByRole("textbox", { name: "Task" });
    await userEvent.click(dialog.getByRole("button", { name: "Add task" }));
    await expect(title).toHaveAccessibleDescription("Required.");
    await waitFor(() => expect(title).toHaveFocus());
    await expect(canvas.getByLabelText("Created task")).toBeEmptyDOMElement();
    await userEvent.type(title, "Review the form contract");
    // Use a real browser key: the dialog's submit button is associated with the form from its footer.
    if (import.meta.env.MODE === "test") {
      const { userEvent: browserUserEvent } = await import("vitest/browser");
      await browserUserEvent.keyboard("{Enter}");
    } else {
      await userEvent.click(dialog.getByRole("button", { name: "Add task" }));
    }
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("status", { name: "Created task" })).toHaveTextContent(
      "Review the form contract",
    );
    await userEvent.click(canvas.getByRole("button", { name: "New task" }));
    dialog = within(await page.findByRole("dialog"));
    await expect(dialog.getByRole("textbox", { name: "Task" })).toHaveValue("");
    await expect(dialog.queryAllByRole("alert")).toHaveLength(0);
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
  },
};
