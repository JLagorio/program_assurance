import { useEffect } from "react";
import { useRecordForm } from "@/lib/record-form";

import {
  Button,
  Combobox,
  DatePicker,
  Dialog,
  Field,
  Input,
  Textarea,
} from "@ledger/design-system";
import { Grid, Stack } from "@ledger/design-system";

import type { Subject } from "@/lib/activity";
import { createTask, type TaskGate } from "@/lib/tasks";
import { mentionablePeople } from "@/lib/people";

/** Add a task on a record: the ask, who has it, when. The requester is whoever is logged in. */
export function TaskDialog({
  open,
  onClose,
  program,
  subject,
  requester,
  defaultTitle = "",
  defaultAssignee,
  defaultNote = "",
  gate = null,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  program: string;
  subject: Subject;
  requester: string;
  defaultTitle?: string | undefined;
  defaultAssignee?: string | undefined;
  /** What they need to know, to start with: the rest of a comment draft made a task. */
  defaultNote?: string | undefined;
  gate?: TaskGate | null | undefined;
  onCreated?: (() => void) | undefined;
}) {
  const { form, values, formId, formRef } = useRecordForm(
    {
      title: defaultTitle,
      assignee: defaultAssignee ?? requester,
      due: "",
      note: defaultNote,
    },
    (value) => ({ title: value.title, assignee: value.assignee }),
  );
  const { title, assignee, due, note } = values;

  useEffect(() => {
    if (open)
      form.reset({
        title: defaultTitle,
        assignee: defaultAssignee ?? requester,
        due: "",
        note: defaultNote,
      });
  }, [open, defaultTitle, defaultAssignee, defaultNote, requester, form]);

  const people = mentionablePeople(program);

  const reset = () => {
    form.reset({ title: "", assignee: defaultAssignee ?? requester, due: "", note: "" });
  };

  const submit = () => {
    return form.handleSubmit({
      save: () => {
        createTask({
          program,
          title,
          subject,
          assignee,
          requester,
          due: due || null,
          note,
          gate,
        });
        reset();
        onCreated?.();
        onClose();
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Add a task"
      eyebrow={subject.label ? `${subject.id} · ${subject.label}` : subject.id}
      footer={
        <>
          <Button
            variant="subtle"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={formId + "-1"}
            disabled={form.state.isSubmitting}
          >
            Add task
          </Button>
        </>
      }
    >
      <form
        id={formId + "-1"}
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Stack space="space.150">
          <form.Field name="title">
            {(field) => (
              <Field
                isRequired
                error={
                  field.state.meta.isTouched && !field.state.meta.isValid
                    ? [...new Set(field.state.meta.errors)].join(" ")
                    : undefined
                }
                label="Task"
              >
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="What needs doing"
                  autoFocus
                  name={field.name}
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          </form.Field>
          <Grid
            gap="space.150"
            templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
          >
            <form.Field name="assignee">
              {(field) => (
                <Field
                  isRequired
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                  label="Assignee"
                >
                  <Combobox
                    value={field.state.value}
                    onChange={field.handleChange}
                    options={people.map((p) => ({ value: p.name, label: p.name, meta: p.meta }))}
                    placeholder="Choose a person"
                    searchPlaceholder="Search people…"
                    name={field.name}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="due">
              {(field) => (
                <Field
                  label="Due"
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                >
                  <DatePicker
                    value={field.state.value}
                    onChange={field.handleChange}
                    placeholder="Choose a day"
                    name={field.name}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
          </Grid>
          <form.Field name="note">
            {(field) => (
              <Field
                label="Note"
                error={
                  field.state.meta.isTouched && !field.state.meta.isValid
                    ? [...new Set(field.state.meta.errors)].join(" ")
                    : undefined
                }
              >
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="What they need to know to do it"
                  rows={3}
                  name={field.name}
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          </form.Field>
        </Stack>
      </form>
    </Dialog>
  );
}
