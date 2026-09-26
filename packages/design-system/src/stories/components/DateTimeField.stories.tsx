import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { DateTimeField, Field, FieldDescription, FieldLabel } from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Stack } from "../../primitives";
import { Pair } from "../_lib/pair";

/* Every story names its zone, so what it shows and submits does not depend on the machine. */
const LosAngeles = ({ children }: { children: ReactNode }) => (
  <LedgerProvider timeZone="America/Los_Angeles">{children}</LedgerProvider>
);

const meta = {
  title: "Components/DateTimeField",
  component: DateTimeField,
  parameters: { layout: "padded" },
  decorators: [(Story) => <LosAngeles>{Story()}</LosAngeles>],
  args: {
    "aria-label": "Due",
    defaultValue: "2026-09-19T00:30:00.000Z",
    onValueChange: fn(),
  },
} satisfies Meta<typeof DateTimeField>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The controls. The value is an instant; it shows in the provider's zone, named after the time. */
export const Playground: Story = {
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <DateTimeField {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "Due, Date" })).toHaveValue("Sep 18, 2026");
    const time = canvas.getByRole("spinbutton", { name: "Due, Time, Pacific Daylight Time" });
    await expect(time).toHaveValue("5:30 PM");
    await userEvent.click(time);
    await userEvent.keyboard("{ArrowUp}");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("2026-09-19T00:45:00.000Z");
  },
};

/**
 * In a Field: the day input is the Field's control, so the label points at it, and the time input
 * follows the Field's label, hint and state. The zone's short name sits after the time and its long
 * name is part of the time's accessible name. A hidden input submits the instant.
 */
export const InField: Story = {
  render: () => (
    <form aria-label="Task" style={{ maxWidth: 360 }}>
      <Field>
        <FieldLabel>Due</FieldLabel>
        <DateTimeField name="due" defaultValue="2026-09-19T00:30:00.000Z" />
        <FieldDescription>When the reviewer needs it.</FieldDescription>
      </Field>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole("form", { name: "Task" }) as HTMLFormElement;
    const submitted = () => new FormData(form).get("due");
    await expect(canvas.getByRole("group", { name: "Due" })).toBeVisible();
    const day = canvas.getByRole("textbox", { name: "Due Date" });
    const time = canvas.getByRole("spinbutton", { name: "Due Time Pacific Daylight Time" });
    await expect(day).toHaveAccessibleDescription(/When the reviewer needs it/);
    await expect(time).toHaveAccessibleDescription(/When the reviewer needs it/);
    await expect(canvas.getByText("PDT")).toBeVisible();
    await expect(submitted()).toBe("2026-09-19T00:30:00.000Z");

    await userEvent.clear(time);
    await userEvent.type(time, "9am");
    await userEvent.tab();
    await expect(time).toHaveValue("9:00 AM");
    await expect(submitted()).toBe("2026-09-18T16:00:00.000Z");

    await userEvent.clear(day);
    await userEvent.type(day, "Dec 1, 2026{Enter}");
    await expect(day).toHaveValue("Dec 1, 2026");
    // After the clocks change the same wall time is a different offset, and the zone says so.
    await expect(submitted()).toBe("2026-12-01T17:00:00.000Z");
    await expect(canvas.getByText("PST")).toBeVisible();
  },
};

/** `defaultTime` fills the time when the reader picks a day first; without it the field waits for a time and says so once focus leaves it. */
export const DefaultTimeAndIncomplete: Story = {
  render: () => (
    <Stack space="space.300">
      <div style={{ maxWidth: 360 }}>
        <Field>
          <FieldLabel>Response due</FieldLabel>
          <DateTimeField defaultTime="17:00" onValueChange={fn()} />
        </Field>
      </div>
      <div style={{ maxWidth: 360 }}>
        <Field>
          <FieldLabel>Evidence collected</FieldLabel>
          <DateTimeField />
        </Field>
      </div>
      <button type="button">After the fields</button>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const responseDay = canvas.getByRole("textbox", { name: "Response due Date" });
    await userEvent.type(responseDay, "Oct 2, 2026");
    await userEvent.tab();
    await expect(
      canvas.getByRole("spinbutton", { name: "Response due Time Pacific Daylight Time" }),
    ).toHaveValue("5:00 PM");

    const collectedDay = canvas.getByRole("textbox", { name: "Evidence collected Date" });
    await userEvent.type(collectedDay, "Oct 2, 2026");
    await userEvent.click(canvas.getByRole("button", { name: "After the fields" }));
    const group = canvas.getByRole("group", { name: "Evidence collected" });
    const message = group.parentElement?.querySelector('[data-slot="field-error"]');
    await expect(message).toHaveTextContent("Enter both a date and a time.");
    const collectedTime = canvas.getByRole("spinbutton", {
      name: "Evidence collected Time Pacific Daylight Time",
    });
    await expect(collectedTime).toHaveAttribute("aria-invalid", "true");
    await expect(collectedTime).toHaveAccessibleDescription(/Enter both a date and a time\./);
    await userEvent.type(collectedTime, "14:05{Enter}");
    await expect(group.parentElement?.querySelector('[data-slot="field-error"]')).toBeNull();
  },
};

/** `min` and `max` are moments: earlier days are disabled in the month, and an earlier time on the first allowed day is an error that names the limit. */
export const MinAndMax: Story = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <Field>
        <FieldLabel>Follow-up</FieldLabel>
        <DateTimeField
          defaultValue="2026-09-21T16:00:00.000Z"
          min="2026-09-21T16:00:00.000Z"
          max="2026-10-31T00:00:00.000Z"
        />
        <FieldDescription>From Sep 21, 9:00 AM, to the end of October.</FieldDescription>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const time = canvas.getByRole("spinbutton", { name: "Follow-up Time Pacific Daylight Time" });
    await userEvent.clear(time);
    await userEvent.type(time, "8:30 am{Enter}");
    await expect(canvasElement.querySelector('[data-slot="field-error"]')).toHaveTextContent(
      "Enter Sep 21, 2026, 9:00 AM or later.",
    );
    await userEvent.clear(time);
    await userEvent.type(time, "10:00 am{Enter}");
    await expect(canvasElement.querySelector('[data-slot="field-error"]')).toBeNull();
  },
};

/** A native form reset puts the field back as it was, including a half entry that never became a value. */
export const FormReset: Story = {
  render: () => (
    <form aria-label="Evidence" style={{ maxWidth: 360 }}>
      <Stack space="space.200">
        <Field>
          <FieldLabel>Collected</FieldLabel>
          <DateTimeField name="collected" />
        </Field>
        <div>
          <button type="reset">Reset the form</button>
        </div>
      </Stack>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const day = canvas.getByRole("textbox", { name: "Collected Date" });
    const time = canvas.getByRole("spinbutton", { name: "Collected Time Pacific Daylight Time" });
    await userEvent.type(day, "Oct 2, 2026");
    await userEvent.click(canvas.getByRole("button", { name: "Reset the form" }));
    await waitFor(() => expect(day).toHaveValue(""));
    await expect(time).toHaveValue("");
    await expect(canvasElement.querySelector('[data-slot="field-error"]')).toBeNull();
    await expect(day).not.toHaveAttribute("aria-invalid");

    // A time that does not read is put back too.
    await userEvent.type(time, "half past");
    await userEvent.tab();
    await expect(time).toHaveAttribute("aria-invalid", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Reset the form" }));
    await waitFor(() => expect(time).toHaveValue(""));
    await expect(canvasElement.querySelector('[data-slot="field-error"]')).toBeNull();
  },
};

/** The mistakes the page is written to prevent. */
export const Dont: Story = {
  render: () => (
    <Pair
      do={
        <div style={{ maxWidth: 360 }}>
          <Field>
            <FieldLabel>Evidence collected</FieldLabel>
            <DateTimeField defaultValue="2026-09-18T23:05:00.000Z" />
          </Field>
        </div>
      }
      doText="A moment with its zone in view: what the reader enters is what is stored."
      dont={
        <div style={{ maxWidth: 360 }}>
          <Field>
            <FieldLabel>Evidence collected</FieldLabel>
            <DateTimeField defaultValue="2026-09-18T23:05:00.000Z" showTimeZone={false} />
          </Field>
        </div>
      }
      dontText="A moment with the zone hidden. Readers in two offices read the same time as two moments."
    />
  ),
};
