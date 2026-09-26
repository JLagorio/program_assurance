import { revalidateLogic, useForm } from "@tanstack/react-form";
import { z } from "zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldLegend,
  Button,
  Calendar,
  DatePicker,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
} from "../../components";

import { LedgerProvider } from "../../lib/locale";
import { Inline, Stack } from "../../primitives";
import { interact } from "../_lib/interact";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  parameters: { layout: "padded" },
  args: { "aria-label": "Scheduled completion", defaultValue: "2026-09-18" },
} satisfies Meta<typeof DatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

const states = ["rest", "filled", "invalid", "disabled"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  ...(s === "rest" ? {} : { defaultValue: "2026-09-18" }),
  ...(s === "disabled" ? { disabled: true } : {}),
});

/** Every state down the side; bare and inside a Field across. Open one to see the month. */
export const DatePickerMatrix: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Grid
        rows={states}
        cols={["bare", "in a Field"] as const}
        rowLabel="state"
        render={(state, col) => {
          const fieldError1 = state === "invalid" ? "Required." : undefined;
          const fieldHint1 = state === "invalid" ? undefined : "When the milestone is due.";
          return (
            <div style={{ width: 220, maxWidth: "100%" }}>
              {col === "bare" ? (
                <DatePicker
                  aria-label="Scheduled completion"
                  {...stateProps(state)}
                  {...(state === "invalid" ? { "aria-invalid": true } : {})}
                />
              ) : (
                <Field data-invalid={Boolean(fieldError1)}>
                  <FieldLabel
                    id={`${fieldId}-scheduled-completion-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-label`}
                    htmlFor={`${fieldId}-scheduled-completion-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}`}
                  >
                    {"Scheduled completion"}
                    <span aria-hidden="true" className="text-danger">
                      {" "}
                      *
                    </span>
                  </FieldLabel>
                  <DatePicker
                    id={`${fieldId}-scheduled-completion-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}`}
                    aria-labelledby={`${fieldId}-scheduled-completion-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-label`}
                    aria-invalid={Boolean(fieldError1)}
                    aria-describedby={
                      fieldError1 || fieldHint1
                        ? `${fieldId}-scheduled-completion-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-message`
                        : undefined
                    }
                    {...stateProps(state)}
                  />
                  {Boolean(fieldError1) ? (
                    <FieldError
                      id={`${fieldId}-scheduled-completion-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-message`}
                    >
                      {fieldError1}
                    </FieldError>
                  ) : fieldHint1 ? (
                    <FieldDescription
                      id={`${fieldId}-scheduled-completion-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-message`}
                    >
                      {fieldHint1}
                    </FieldDescription>
                  ) : null}
                </Field>
              )}
            </div>
          );
        }}
      />
    );
  },
};

/** The month open: today in bold, the chosen day filled, Today and Clear under the grid. */
export const Open: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <div style={{ maxWidth: 220, height: 420 }}>
        <Field>
          <FieldLabel
            id={`${fieldId}-scheduled-completion-2-label`}
            htmlFor={`${fieldId}-scheduled-completion-2`}
          >
            {"Scheduled completion"}
          </FieldLabel>
          <DatePicker
            id={`${fieldId}-scheduled-completion-2`}
            aria-labelledby={`${fieldId}-scheduled-completion-2-label`}
            defaultValue="2026-09-18"
            defaultOpen
          />
        </Field>
      </div>
    );
  },
};

function FormDemo() {
  const fieldId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const form = useForm({
    defaultValues: { scheduled: "", target: "2026-10-02" },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: {
      onDynamic: z.object({ scheduled: z.string().min(1, "Required."), target: z.string() }),
    },
    onSubmitInvalid: () =>
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      ),
    onSubmit: () => setOpen(false),
  });
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit milestone dates</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Milestone dates</DialogTitle>
          </DialogHeader>
          <form
            ref={formRef}
            aria-label="Milestone dates"
            noValidate
            className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <Stack space="space.200">
              {(["scheduled", "target"] as const).map((name) => (
                <form.Field key={name} name={name}>
                  {(field) => {
                    const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    const id = `${fieldId}-${name}`;
                    return (
                      <Field data-invalid={invalid}>
                        <FieldLabel htmlFor={id}>
                          {name === "scheduled" ? (
                            <>
                              Scheduled completion
                              <span aria-hidden className="text-danger">
                                {" "}
                                *
                              </span>
                            </>
                          ) : (
                            "Target date"
                          )}
                        </FieldLabel>
                        <DatePicker
                          id={id}
                          name={field.name}
                          aria-required={name === "scheduled"}
                          value={field.state.value}
                          onValueChange={field.handleChange}
                          onBlur={field.handleBlur}
                          aria-invalid={invalid}
                          aria-describedby={`${id}-message`}
                        />
                        {invalid ? (
                          <FieldError id={`${id}-message`} errors={field.state.meta.errors} />
                        ) : (
                          <FieldDescription id={`${id}-message`}>
                            {name === "scheduled"
                              ? "When the milestone is due."
                              : "Optional. Clear it if the target is not set."}
                          </FieldDescription>
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              ))}
              <Inline space="space.100" alignInline="end">
                <Button type="button" variant="subtle" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save milestone
                </Button>
              </Inline>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** A milestone form in a dialog: required validation and a calendar that closes back to its field before the dialog closes. */
export const InField: Story = {
  render: () => <FormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    const expectPointerTarget = async (button: HTMLElement) => {
      await waitFor(() => {
        const bounds = button.getBoundingClientRect();
        const hit = button.ownerDocument.elementFromPoint(
          bounds.left + bounds.width / 2,
          bounds.top + bounds.height / 2,
        );
        expect(button.contains(hit)).toBe(true);
      });
    };
    const opener = canvas.getByRole("button", { name: "Edit milestone dates" });
    await userEvent.click(opener);
    const dialog = await screen.findByRole("dialog", { name: "Milestone dates" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Save milestone" }));
    // FieldError is not a live region: the message describes the control that focus moves to.
    await expect(within(dialog).getByText("Required.")).toBeVisible();

    const target = within(dialog).getByRole("button", { name: "Target date" });
    await userEvent.click(target);
    // The month is named after its field, and the trigger is described by its day.
    const calendar = await screen.findByRole("dialog", { name: "Target date" });
    await waitFor(() => expect(calendar.contains(calendar.ownerDocument.activeElement)).toBe(true));
    await expectPointerTarget(within(calendar).getByRole("button", { name: "Today" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Target date" })).toBeNull());
    await expect(dialog).toBeVisible();
    await waitFor(() => expect(target).toHaveFocus());
    await expect(target).toHaveAccessibleDescription(/Oct 2, 2026/);

    await userEvent.click(target);
    const reopened = await screen.findByRole("dialog", { name: "Target date" });
    const clear = within(reopened).getByRole("button", { name: "Clear" });
    await expectPointerTarget(clear);
    await userEvent.click(clear);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Target date" })).toBeNull());
    await expect(target).toHaveTextContent("Choose a date");
    await expect(dialog).toBeVisible();
    await waitFor(() => expect(target).toHaveFocus());
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Milestone dates" })).toBeNull(),
    );
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Stack space="space.400">
        <Pair
          do={
            <div style={{ maxWidth: 220 }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-scheduled-completion-5-label`}
                  htmlFor={`${fieldId}-scheduled-completion-5`}
                >
                  {"Scheduled completion"}
                </FieldLabel>
                <DatePicker
                  id={`${fieldId}-scheduled-completion-5`}
                  aria-labelledby={`${fieldId}-scheduled-completion-5-label`}
                  aria-describedby={`${fieldId}-scheduled-completion-5-message`}
                />
                <FieldDescription id={`${fieldId}-scheduled-completion-5-message`}>
                  {"When the milestone is due."}
                </FieldDescription>
              </Field>
            </div>
          }
          doText="The placeholder says what to do; the hint says what the date means."
          dont={
            <div style={{ maxWidth: 220 }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-scheduled-completion-6-label`}
                  htmlFor={`${fieldId}-scheduled-completion-6`}
                >
                  {"Scheduled completion"}
                </FieldLabel>
                <DatePicker
                  id={`${fieldId}-scheduled-completion-6`}
                  aria-labelledby={`${fieldId}-scheduled-completion-6-label`}
                  placeholder="MM/DD/YYYY"
                />
              </Field>
            </div>
          }
          dontText="A format as the placeholder. The reader cannot type here, and the field shows the day in words once chosen."
        />
        <Pair
          do={
            <div style={{ maxWidth: 220 }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-authorized-7-label`}
                  htmlFor={`${fieldId}-authorized-7`}
                >
                  {"Authorized"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-authorized-7`}
                  aria-labelledby={`${fieldId}-authorized-7-label`}
                  aria-describedby={`${fieldId}-authorized-7-message`}
                  placeholder="March 2024"
                />
                <FieldDescription id={`${fieldId}-authorized-7-message`}>
                  {"Month and year, as on the ATO letter."}
                </FieldDescription>
              </Field>
            </div>
          }
          doText="An approximate or remembered date is typed, with the format in the hint."
          dont={
            <div style={{ maxWidth: 220 }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-authorized-8-label`}
                  htmlFor={`${fieldId}-authorized-8`}
                >
                  {"Authorized"}
                </FieldLabel>
                <DatePicker
                  id={`${fieldId}-authorized-8`}
                  aria-labelledby={`${fieldId}-authorized-8-label`}
                  aria-describedby={`${fieldId}-authorized-8-message`}
                />
                <FieldDescription id={`${fieldId}-authorized-8-message`}>
                  {"Month and year, as on the ATO letter."}
                </FieldDescription>
              </Field>
            </div>
          }
          dontText="A month grid for a date the reader already knows. They page back thirty months to click one day."
        />
        <Pair
          do={
            <div style={{ maxWidth: 220 }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-scheduled-completion-9-label`}
                  htmlFor={`${fieldId}-scheduled-completion-9`}
                >
                  {"Scheduled completion"}
                </FieldLabel>
                <DatePicker
                  id={`${fieldId}-scheduled-completion-9`}
                  aria-labelledby={`${fieldId}-scheduled-completion-9-label`}
                  defaultValue="2026-09-18"
                />
              </Field>
            </div>
          }
          doText="One day in a form is a field: the month opens when asked."
          dont={
            <div style={{ maxWidth: 300 }}>
              <FieldSet aria-labelledby={`${fieldId}-scheduled-completion-10-label`}>
                <FieldLegend id={`${fieldId}-scheduled-completion-10-label`} variant="label">
                  {"Scheduled completion"}
                </FieldLegend>
                <Calendar
                  aria-labelledby={`${fieldId}-scheduled-completion-10-label`}
                  mode="single"
                  selected={new Date(2026, 8, 18)}
                  defaultMonth={new Date(2026, 8, 1)}
                />
              </FieldSet>
            </div>
          }
          dontText="A month grid inline in the form. It takes the room of six fields for one answer."
        />
      </Stack>
    );
  },
};

export const Playground: Story = {};

function NativeFormDemo() {
  const fieldId = useId();

  const [disabled, setDisabled] = useState(false);
  const [controlled, setControlled] = useState("2026-09-20");
  return (
    <>
      <form id="scheduled-date-form" aria-label="Date submission">
        <Field>
          <FieldLabel
            id={`${fieldId}-uncontrolled-date-11-label`}
            htmlFor={`${fieldId}-uncontrolled-date-11`}
          >
            {"Uncontrolled date"}
          </FieldLabel>
          <DatePicker
            id={`${fieldId}-uncontrolled-date-11`}
            aria-labelledby={`${fieldId}-uncontrolled-date-11-label`}
            name="scheduled"
            defaultValue="2026-09-18"
            disabled={disabled}
          />
        </Field>
        <Field>
          <FieldLabel
            id={`${fieldId}-controlled-date-12-label`}
            htmlFor={`${fieldId}-controlled-date-12`}
          >
            {"Controlled date"}
          </FieldLabel>
          <DatePicker
            id={`${fieldId}-controlled-date-12`}
            aria-labelledby={`${fieldId}-controlled-date-12-label`}
            name="controlled"
            value={controlled}
            onValueChange={setControlled}
          />
        </Field>
        <Button type="reset">Reset dates</Button>
      </form>
      <Field>
        <FieldLabel
          id={`${fieldId}-external-date-13-label`}
          htmlFor={`${fieldId}-external-date-13`}
        >
          {"External date"}
        </FieldLabel>
        <DatePicker
          id={`${fieldId}-external-date-13`}
          aria-labelledby={`${fieldId}-external-date-13-label`}
          name="external"
          form="scheduled-date-form"
          defaultValue="2026-09-22"
        />
      </Field>
      <Button onClick={() => setDisabled((value) => !value)}>Toggle disabled</Button>
    </>
  );
}

/** Portals never move submitted values out of their owning form. */
export const NativeForm: Story = {
  render: () => <NativeFormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const screen = within(canvasElement.ownerDocument.body);
    const form = canvas.getByRole("form", { name: "Date submission" }) as HTMLFormElement;
    const value = (name: string) => new FormData(form).get(name);
    await expect(value("scheduled")).toBe("2026-09-18");
    await expect(value("external")).toBe("2026-09-22");
    await userEvent.click(canvas.getByRole("button", { name: "Uncontrolled date" }));
    await expect(value("scheduled")).toBe("2026-09-18");
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(value("scheduled")).toBe(""));
    await waitFor(() => expect(screen.queryByRole("dialog", { hidden: true })).toBeNull());
    await userEvent.click(canvas.getByRole("button", { name: "Reset dates" }));
    await waitFor(() => expect(value("scheduled")).toBe("2026-09-18"));
    await expect(value("controlled")).toBe("2026-09-20");
    await userEvent.click(canvas.getByRole("button", { name: "Toggle disabled" }));
    await expect(value("scheduled")).toBeNull();
    await expect(canvas.getByRole("button", { name: "Uncontrolled date" })).toBeDisabled();
  },
};

function FocusIntegrationDemo() {
  const fieldId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const form = useForm({
    defaultValues: { date: "" },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: { onDynamic: z.object({ date: z.string().min(1, "Required.") }) },
    onSubmitInvalid: () => triggerRef.current?.focus(),
  });
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="date">
        {(field) => {
          const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={invalid}>
              <FieldLabel htmlFor={fieldId}>
                Due date
                <span aria-hidden className="text-danger">
                  {" "}
                  *
                </span>
              </FieldLabel>
              <DatePicker
                id={fieldId}
                name={field.name}
                ref={triggerRef}
                aria-required
                data-testid="date-trigger"
                value={field.state.value}
                onValueChange={field.handleChange}
                onBlur={field.handleBlur}
                aria-invalid={invalid}
                aria-describedby={invalid ? `${fieldId}-error` : undefined}
              />
              {invalid && <FieldError id={`${fieldId}-error`} errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>
      <Button type="submit">Validate date</Button>
      <Button type="button" onClick={() => triggerRef.current?.focus()}>
        Focus date ref
      </Button>
      <form.Subscribe selector={(state) => state.fieldMeta.date?.isBlurred ?? false}>
        {(blurred) => <output aria-label="Date touched">{String(blurred)}</output>}
      </form.Subscribe>
    </form>
  );
}
export const FocusIntegration: Story = {
  render: () => <FocusIntegrationDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Validate date" }));
    const trigger = canvas.getByRole("button", { name: "Due date" });
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("data-testid", "date-trigger");
    await expect(trigger).toHaveAttribute("aria-invalid", "true");
    await userEvent.tab();
    await expect(canvas.getByLabelText("Date touched")).toHaveTextContent("true");
    await userEvent.click(canvas.getByRole("button", { name: "Focus date ref" }));
    await expect(trigger).toHaveFocus();
  },
};

const weekends = (iso: string) =>
  [0, 6].includes(new Date(`${iso}T12:00:00Z`).getUTCDay()) ? "Weekends are closed." : false;

/** Opens a picker's month from its trigger and waits for the grid. */
const openMonth = async (trigger: HTMLElement, name: string) => {
  const screen = within(trigger.ownerDocument.body);
  await userEvent.click(trigger);
  const month = await screen.findByRole("dialog", { name });
  await waitFor(() => expect(month.querySelector('[role="grid"]')).not.toBeNull());
  return month;
};

/** `min`, `max` and `isDateUnavailable` disable days, each with its reason in the day's name; the rule is in the hint too. The month cannot page before the earliest day. */
export const MinMaxAndReasons: Story = {
  render: () => (
    <div style={{ maxWidth: 260, minHeight: 420 }}>
      <Field>
        <FieldLabel>Review meeting</FieldLabel>
        <DatePicker
          name="review"
          defaultValue="2026-09-18"
          min="2026-09-07"
          max="2026-10-30"
          isDateUnavailable={weekends}
        />
        <FieldDescription>A weekday between Sep 7 and Oct 30, 2026.</FieldDescription>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Review meeting" });
    await expect(trigger).toHaveAccessibleDescription(/Sep 18, 2026/);
    await expect(trigger).toHaveAccessibleDescription(/A weekday between/);
    const month = within(await openMonth(trigger, "Review meeting"));
    const saturday = month.getByRole("button", { name: /September 19, 2026/ });
    await expect(saturday).toBeDisabled();
    await expect(saturday).toHaveAccessibleName(/Not available\. Weekends are closed\./);
    const early = month.getByRole("button", { name: /September 4, 2026/ });
    await expect(early).toBeDisabled();
    await expect(early).toHaveAccessibleName(/The earliest date is Sep 7, 2026\./);
    await expect(month.getByRole("button", { name: "Previous month" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.click(month.getByRole("button", { name: /September 22, 2026/ }));
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveTextContent("Sep 22, 2026");
  },
};

/** When today may not be chosen, Today stays in the tab order, disabled, and says why. */
export const TodayUnavailable: Story = {
  render: () => (
    <div style={{ maxWidth: 260, minHeight: 420 }}>
      <Field>
        <FieldLabel>Closing date</FieldLabel>
        <DatePicker defaultValue="2025-12-19" max="2025-12-31" />
        <FieldDescription>A day in the 2025 reporting year.</FieldDescription>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Closing date" });
    const month = within(await openMonth(trigger, "Closing date"));
    const today = month.getByRole("button", { name: "Today" });
    await expect(today).toHaveAttribute("aria-disabled", "true");
    await expect(today).not.toHaveAttribute("disabled");
    await expect(today).toHaveAccessibleDescription("The latest date is Dec 31, 2025.");
    await expect(month.getByRole("button", { name: "Clear" })).toBeEnabled();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveTextContent("Dec 19, 2025");
  },
};

/** `calendarProps` reaches the month: the year dropdown for a day a year out, and the months it may reach. */
export const YearDropdown: Story = {
  render: () => (
    <div style={{ maxWidth: 260, minHeight: 440 }}>
      <Field>
        <FieldLabel>Planned completion</FieldLabel>
        <DatePicker
          defaultValue="2026-09-18"
          calendarProps={{
            captionLayout: "dropdown",
            startMonth: new Date(2026, 0, 1),
            endMonth: new Date(2028, 11, 1),
          }}
        />
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Planned completion" });
    const month = within(await openMonth(trigger, "Planned completion"));
    await userEvent.selectOptions(month.getByRole("combobox", { name: "Year" }), "2027");
    await userEvent.click(month.getByRole("button", { name: /September 17, 2027/ }));
    await expect(trigger).toHaveTextContent("Sep 17, 2027");
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() =>
      expect(within(canvasElement.ownerDocument.body).queryByRole("dialog")).toBeNull(),
    );
  },
};

function TypedEntryDemo() {
  const [error, setError] = useState<string | null>(null);
  return (
    <form aria-label="Typed date" style={{ maxWidth: 280, minHeight: 420 }}>
      <Field>
        <FieldLabel>Due date</FieldLabel>
        <DatePicker
          entry="type"
          name="due"
          defaultValue="2026-09-18"
          min="2026-09-01"
          onEntryError={setError}
        />
        <FieldDescription>Type a date, or choose one from the month.</FieldDescription>
      </Field>
      <output aria-label="Entry error">{error ?? "none"}</output>
    </form>
  );
}

/**
 * `entry="type"`: the day is typed in the locale's words or numbers and read on Tab or Enter.
 * Text that is not a day keeps what the reader typed, reports no day and says what fixes it under
 * the field; Escape puts back the last day. The button opens the month, and so does Alt+Down.
 */
export const TypedEntry: Story = {
  render: () => <TypedEntryDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole("form", { name: "Typed date" }) as HTMLFormElement;
    const submitted = () => new FormData(form).get("due");
    const input = canvas.getByRole("textbox", { name: "Due date" });
    await expect(input).toHaveValue("Sep 18, 2026");
    await expect(submitted()).toBe("2026-09-18");

    await userEvent.clear(input);
    await userEvent.type(input, "10/2/2026");
    await userEvent.tab();
    await expect(input).toHaveValue("Oct 2, 2026");
    await expect(submitted()).toBe("2026-10-02");

    await userEvent.clear(input);
    await userEvent.type(input, "Sep 31");
    await userEvent.tab();
    await expect(input).toHaveValue("Sep 31");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(/Enter a date such as/);
    const message = canvasElement.querySelector('[data-slot="field-error"]');
    await expect(message).toHaveTextContent(/Enter a date such as/);
    await expect(message).toBeVisible();
    await expect(canvas.getByLabelText("Entry error")).toHaveTextContent(/Enter a date such as/);
    await expect(submitted()).toBe("");

    await userEvent.clear(input);
    await userEvent.type(input, "Aug 3, 2026{Enter}");
    await expect(canvasElement.querySelector('[data-slot="field-error"]')).toHaveTextContent(
      "Enter Sep 1, 2026 or later.",
    );

    await userEvent.clear(input);
    await userEvent.type(input, "2026-09-25{Enter}");
    await expect(input).toHaveValue("Sep 25, 2026");
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(canvas.getByLabelText("Entry error")).toHaveTextContent("none");
    await userEvent.type(input, " oops");
    await userEvent.keyboard("{Escape}");
    await expect(input).toHaveValue("Sep 25, 2026");

    // Alt+Down opens the month from the text; the popup then takes focus after the key's own act
    // scope, so the key is driven in one.
    await interact(() =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true }),
      ),
    );
    const month = within(
      await within(canvasElement.ownerDocument.body).findByRole("dialog", { name: "Due date" }),
    );
    await userEvent.click(await month.findByRole("button", { name: /September 28, 2026/ }));
    await waitFor(() => expect(input).toHaveFocus());
    await expect(input).toHaveValue("Sep 28, 2026");
    await expect(submitted()).toBe("2026-09-28");
    await expect(canvas.getByRole("button", { name: "Choose a date Due date" })).toBeVisible();
  },
};

/** The same field under `LedgerProvider locale="de-DE"`: typed in German order and words, shown as "18. Sept. 2026". */
export const TypedInGerman: Story = {
  render: () => (
    <LedgerProvider locale="de-DE">
      <div style={{ maxWidth: 280 }}>
        <Field>
          <FieldLabel>Fällig am</FieldLabel>
          <DatePicker entry="type" defaultValue="2026-09-18" />
        </Field>
      </div>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Fällig am" });
    await expect(input).toHaveValue("18. Sept. 2026");
    await userEvent.clear(input);
    await userEvent.type(input, "2.10.2026{Enter}");
    await expect(input).toHaveValue("2. Okt. 2026");
  },
};
