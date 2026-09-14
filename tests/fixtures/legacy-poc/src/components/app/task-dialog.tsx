import {
  FieldLabel,
  FieldError,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  Box,
  Button,
  Combobox,
  DatePicker,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Grid,
  Input,
  Stack,
  Textarea,
} from "@ledger/design-system";
import { useRecordForm } from "@/lib/record-form";
import { useId, useEffect } from "react";
import { type Subject } from "@/lib/activity";
import { mentionablePeople } from "@/lib/people";
import { createTask, type TaskGate } from "@/lib/tasks";

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
  const fieldId = useId();

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
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
        <DialogHeader>
          <Box className="flex items-center gap-100 pb-025">
            {subject.label ? `${subject.id} · ${subject.label}` : subject.id}
          </Box>
          <DialogTitle>Add a task</DialogTitle>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
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
                {(field) => {
                  const fieldError1 =
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined;
                  return (
                    <Field data-invalid={Boolean(fieldError1)}>
                      <FieldLabel id={`${fieldId}-task-1-label`} htmlFor={`${fieldId}-task-1`}>
                        {"Task"}
                        <span aria-hidden="true" className="text-danger">
                          {" "}
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id={`${fieldId}-task-1`}
                        aria-labelledby={`${fieldId}-task-1-label`}
                        aria-required={true}
                        aria-invalid={Boolean(fieldError1)}
                        aria-describedby={fieldError1 ? `${fieldId}-task-1-message` : undefined}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="What needs doing"
                        autoFocus
                        name={field.name}
                        onBlur={field.handleBlur}
                      />
                      {fieldError1 ? (
                        <FieldError id={`${fieldId}-task-1-message`}>{fieldError1}</FieldError>
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>
              <Grid
                gap="space.150"
                templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
              >
                <form.Field name="assignee">
                  {(field) => {
                    const valueItems = people.map((p) => ({
                      value: p.name,
                      label: p.name,
                      meta: p.meta,
                    }));
                    const fieldError2 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError2)}>
                        <FieldLabel
                          id={`${fieldId}-assignee-2-label`}
                          htmlFor={`${fieldId}-assignee-2`}
                        >
                          {"Assignee"}
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        </FieldLabel>
                        <Combobox<(typeof valueItems)[number]>
                          items={valueItems}

                          isItemEqualToValue={(item, selected) => item.value === selected.value}
                          filter={(item, query) =>
                            [item.label, item.value, "keywords" in item ? item.keywords : ""]
                              .join(" ")
                              .toLocaleLowerCase()
                              .includes(query.toLocaleLowerCase())
                          }
                          value={
                            valueItems.find((item) => item.value === field.state.value) ?? null
                          }
                          onValueChange={(item) => field.handleChange(item?.value ?? "")}
                          name={field.name}
                        >
                          <ComboboxInput
                            id={`${fieldId}-assignee-2`}
                            aria-labelledby={`${fieldId}-assignee-2-label`}
                            aria-required={true}
                            aria-invalid={Boolean(fieldError2)}
                            aria-describedby={
                              fieldError2 ? `${fieldId}-assignee-2-message` : undefined
                            }
                            placeholder="Choose a person"
                            onBlur={field.handleBlur}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
                            <ComboboxList aria-labelledby={`${fieldId}-assignee-2-label`}>
                              {(item) => (
                                <ComboboxItem
                                  key={item.value}
                                  value={item}
                                  disabled={"disabled" in item && Boolean(item.disabled)}
                                >
                                  <span className="min-w-0 flex-1">{item.label}</span>
                                  {"meta" in item && item.meta ? (
                                    <span className="text-subtle font-body-small">
                                      {String(item.meta)}
                                    </span>
                                  ) : null}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {fieldError2 ? (
                          <FieldError id={`${fieldId}-assignee-2-message`}>
                            {fieldError2}
                          </FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
                <form.Field name="due">
                  {(field) => {
                    const fieldError3 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError3)}>
                        <FieldLabel id={`${fieldId}-due-3-label`} htmlFor={`${fieldId}-due-3`}>
                          {"Due"}
                        </FieldLabel>
                        <DatePicker
                          id={`${fieldId}-due-3`}
                          aria-labelledby={`${fieldId}-due-3-label`}
                          aria-invalid={Boolean(fieldError3)}
                          aria-describedby={fieldError3 ? `${fieldId}-due-3-message` : undefined}
                          value={field.state.value}
                          onChange={field.handleChange}
                          placeholder="Choose a day"
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                        {fieldError3 ? (
                          <FieldError id={`${fieldId}-due-3-message`}>{fieldError3}</FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
              </Grid>
              <form.Field name="note">
                {(field) => {
                  const fieldError4 =
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined;
                  return (
                    <Field data-invalid={Boolean(fieldError4)}>
                      <FieldLabel id={`${fieldId}-note-4-label`} htmlFor={`${fieldId}-note-4`}>
                        {"Note"}
                      </FieldLabel>
                      <Textarea
                        id={`${fieldId}-note-4`}
                        aria-labelledby={`${fieldId}-note-4-label`}
                        aria-invalid={Boolean(fieldError4)}
                        aria-describedby={fieldError4 ? `${fieldId}-note-4-message` : undefined}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="What they need to know to do it"
                        rows={3}
                        name={field.name}
                        onBlur={field.handleBlur}
                      />
                      {fieldError4 ? (
                        <FieldError id={`${fieldId}-note-4-message`}>{fieldError4}</FieldError>
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>
            </Stack>
          </form>
        </Box>
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
