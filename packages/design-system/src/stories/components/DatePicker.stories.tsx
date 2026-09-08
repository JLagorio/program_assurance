import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button, Calendar, DatePicker, Dialog, Field, Input, useRequired } from "../../components";
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
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "in a Field"] as const}
      rowLabel="state"
      render={(state, col) => (
        <div style={{ width: 220 }}>
          {col === "bare" ? (
            <DatePicker
              aria-label="Scheduled completion"
              {...stateProps(state)}
              {...(state === "invalid" ? { "aria-invalid": true } : {})}
            />
          ) : (
            <Field
              label="Scheduled completion"
              isRequired
              hint={state === "invalid" ? undefined : "When the milestone is due."}
              error={state === "invalid" ? "Required." : undefined}
            >
              <DatePicker {...stateProps(state)} />
            </Field>
          )}
        </div>
      )}
    />
  ),
};

/** The month open: today in bold, the chosen day filled, Today and Clear under the grid. */
export const Open: Story = {
  render: () => (
    <div style={{ width: 220, height: 420 }}>
      <Field label="Scheduled completion">
        <DatePicker defaultValue="2026-09-18" defaultOpen />
      </Field>
    </div>
  ),
};

function FormDemo() {
  const [open, setOpen] = useState(false);
  const [scheduled, setScheduled] = useState("");
  const [target, setTarget] = useState("2026-10-02");
  const req = useRequired({ scheduled });
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit milestone dates</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Milestone dates">
        <Stack space="space.200">
          <Field
            label="Scheduled completion"
            isRequired
            hint="When the milestone is due."
            error={req.errorFor("scheduled")}
          >
            <DatePicker value={scheduled} onChange={setScheduled} />
          </Field>
          <Field label="Target date" hint="Optional. Clear it if the target is not set.">
            <DatePicker value={target} onChange={setTarget} />
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
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div style={{ width: 220 }}>
            <Field label="Scheduled completion" hint="When the milestone is due.">
              <DatePicker />
            </Field>
          </div>
        }
        doText="The placeholder says what to do; the hint says what the date means."
        dont={
          <div style={{ width: 220 }}>
            <Field label="Scheduled completion">
              <DatePicker placeholder="MM/DD/YYYY" />
            </Field>
          </div>
        }
        dontText="A format as the placeholder. The reader cannot type here, and the field shows the day in words once chosen."
      />
      <Pair
        do={
          <div style={{ width: 220 }}>
            <Field label="Authorized" hint="Month and year, as on the ATO letter.">
              <Input placeholder="March 2024" />
            </Field>
          </div>
        }
        doText="An approximate or remembered date is typed, with the format in the hint."
        dont={
          <div style={{ width: 220 }}>
            <Field label="Authorized" hint="Month and year, as on the ATO letter.">
              <DatePicker />
            </Field>
          </div>
        }
        dontText="A month grid for a date the reader already knows. They page back thirty months to click one day."
      />
      <Pair
        do={
          <div style={{ width: 220 }}>
            <Field label="Scheduled completion">
              <DatePicker defaultValue="2026-09-18" />
            </Field>
          </div>
        }
        doText="One day in a form is a field: the month opens when asked."
        dont={
          <div style={{ width: 300 }}>
            <Field label="Scheduled completion">
              <Calendar
                mode="single"
                selected={new Date(2026, 8, 18)}
                defaultMonth={new Date(2026, 8, 1)}
              />
            </Field>
          </div>
        }
        dontText="A month grid inline in the form. It takes the room of six fields for one answer."
      />
    </Stack>
  ),
};

export const Playground: Story = {};

function NativeFormDemo() {
  const [disabled, setDisabled] = useState(false);
  const [controlled, setControlled] = useState("2026-09-20");
  return (
    <>
      <form id="scheduled-date-form" aria-label="Date submission">
        <Field label="Uncontrolled date">
          <DatePicker name="scheduled" defaultValue="2026-09-18" disabled={disabled} />
        </Field>
        <Field label="Controlled date">
          <DatePicker name="controlled" value={controlled} onChange={setControlled} />
        </Field>
        <Button type="reset">Reset dates</Button>
      </form>
      <Field label="External date">
        <DatePicker name="external" form="scheduled-date-form" defaultValue="2026-09-22" />
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
  const formRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [date, setDate] = useState("");
  const [blurred, setBlurred] = useState(false);
  const validation = useRequired({ date }, undefined, { formRef });
  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        validation.check();
      }}
    >
      <Field label="Due date" isRequired error={validation.errorFor("date")}>
        <DatePicker
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
