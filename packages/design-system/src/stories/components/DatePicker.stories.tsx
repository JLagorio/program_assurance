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

import { Inline, Stack } from "../../primitives";
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
            <div style={{ width: 220 }}>
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
      <div style={{ width: 220, height: 420 }}>
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
                          onChange={field.handleChange}
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
    await expect(within(dialog).getByRole("alert")).toHaveTextContent("Required.");

    const target = within(dialog).getByRole("button", { name: "Target date" });
    await userEvent.click(target);
    const calendar = await screen.findByRole("dialog", { name: "Choose a date" });
    await waitFor(() => expect(calendar.contains(calendar.ownerDocument.activeElement)).toBe(true));
    await expectPointerTarget(within(calendar).getByRole("button", { name: "Today" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Choose a date" })).toBeNull());
    await expect(dialog).toBeVisible();
    await waitFor(() => expect(target).toHaveFocus());

    await userEvent.click(target);
    const reopened = await screen.findByRole("dialog", { name: "Choose a date" });
    const clear = within(reopened).getByRole("button", { name: "Clear" });
    await expectPointerTarget(clear);
    await userEvent.click(clear);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Choose a date" })).toBeNull());
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
            <div style={{ width: 220 }}>
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
            <div style={{ width: 220 }}>
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
            <div style={{ width: 220 }}>
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
            <div style={{ width: 220 }}>
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
            <div style={{ width: 220 }}>
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
            <div style={{ width: 300 }}>
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
            onChange={setControlled}
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
                onChange={field.handleChange}
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
