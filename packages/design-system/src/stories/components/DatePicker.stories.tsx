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
  useRequired,
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

  const [open, setOpen] = useState(false);
  const [scheduled, setScheduled] = useState("");
  const [target, setTarget] = useState("2026-10-02");
  const req = useRequired({ scheduled });
  const fieldError3 = req.errorFor("scheduled");
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit milestone dates</Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Milestone dates</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <Stack space="space.200">
              <Field data-invalid={Boolean(fieldError3)}>
                <FieldLabel
                  id={`${fieldId}-scheduled-completion-3-label`}
                  htmlFor={`${fieldId}-scheduled-completion-3`}
                >
                  {"Scheduled completion"}
                  <span aria-hidden="true" className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <DatePicker
                  id={`${fieldId}-scheduled-completion-3`}
                  aria-labelledby={`${fieldId}-scheduled-completion-3-label`}
                  aria-invalid={Boolean(fieldError3)}
                  aria-describedby={`${fieldId}-scheduled-completion-3-message`}
                  value={scheduled}
                  onChange={setScheduled}
                />
                {Boolean(fieldError3) ? (
                  <FieldError id={`${fieldId}-scheduled-completion-3-message`}>
                    {fieldError3}
                  </FieldError>
                ) : (
                  <FieldDescription id={`${fieldId}-scheduled-completion-3-message`}>
                    {"When the milestone is due."}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel
                  id={`${fieldId}-target-date-4-label`}
                  htmlFor={`${fieldId}-target-date-4`}
                >
                  {"Target date"}
                </FieldLabel>
                <DatePicker
                  id={`${fieldId}-target-date-4`}
                  aria-labelledby={`${fieldId}-target-date-4-label`}
                  aria-describedby={`${fieldId}-target-date-4-message`}
                  value={target}
                  onChange={setTarget}
                />
                <FieldDescription id={`${fieldId}-target-date-4-message`}>
                  {"Optional. Clear it if the target is not set."}
                </FieldDescription>
              </Field>
              <Inline space="space.100" alignInline="end">
                <Button variant="subtle" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (req.check()) setOpen(false);
                  }}
                >
                  Save milestone
                </Button>
              </Inline>
            </Stack>
          </div>
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

  const formRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [date, setDate] = useState("");
  const [blurred, setBlurred] = useState(false);
  const validation = useRequired({ date }, undefined, { formRef });
  const fieldError14 = validation.errorFor("date");
  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        validation.check();
      }}
    >
      <Field data-invalid={Boolean(fieldError14)}>
        <FieldLabel id={`${fieldId}-due-date-14-label`} htmlFor={`${fieldId}-due-date-14`}>
          {"Due date"}
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        </FieldLabel>
        <DatePicker
          id={`${fieldId}-due-date-14`}
          aria-labelledby={`${fieldId}-due-date-14-label`}
          aria-invalid={Boolean(fieldError14)}
          aria-describedby={fieldError14 ? `${fieldId}-due-date-14-message` : undefined}
          ref={triggerRef}
          name="date"
          data-testid="date-trigger"
          value={date}
          onChange={setDate}
          onBlur={() => {
            setBlurred(true);
            validation.touch("date");
          }}
        />
        {Boolean(fieldError14) ? (
          <FieldError id={`${fieldId}-due-date-14-message`}>{fieldError14}</FieldError>
        ) : null}
      </Field>
      <Button type="submit">Validate date</Button>
      <Button onClick={() => triggerRef.current?.focus()}>Focus date ref</Button>
      <output aria-label="Date touched">{String(blurred)}</output>
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
