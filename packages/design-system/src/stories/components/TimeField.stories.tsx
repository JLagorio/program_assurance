import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Field, FieldDescription, FieldLabel, TimeField } from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Stack } from "../../primitives";
import { Matrix } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/TimeField",
  component: TimeField,
  parameters: { layout: "padded" },
  args: { "aria-label": "Start time", defaultValue: "09:30", onValueChange: fn() },
} satisfies Meta<typeof TimeField>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The controls: value, step, the clock and the size. */
export const Playground: Story = {
  render: (args) => (
    <div style={{ maxWidth: 200 }}>
      <TimeField {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole("spinbutton", { name: "Start time" });
    await expect(input).toHaveValue("9:30 AM");
    // One input and a decorative icon: the part's own slot, and no unnamed group around them.
    await expect(input.closest('[data-slot="time-field"]')).not.toBeNull();
    await expect(within(canvasElement).queryByRole("group")).toBeNull();
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowUp}");
    await expect(input).toHaveValue("9:45 AM");
    await expect(input).toHaveAttribute("aria-valuenow", String(9 * 60 + 45));
    await expect(args.onValueChange).toHaveBeenLastCalledWith("09:45");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    await expect(input).toHaveValue("9:15 AM");
    await expect(input).toHaveAttribute("aria-valuetext", "9:15 AM");
  },
};

const states = ["rest", "filled", "invalid", "disabled"] as const;

/** Every state, bare and in a Field. The invalid one is a Field marked invalid by its form. */
export const TimeFieldMatrix: Story = {
  render: () => (
    <Matrix
      rows={states}
      cols={["bare", "in a Field"] as const}
      rowLabel="state"
      render={(state, col) => {
        const props = {
          ...(state === "rest" ? {} : { defaultValue: "17:30" }),
          ...(state === "disabled" ? { disabled: true } : {}),
        };
        return (
          <div style={{ width: 180, maxWidth: "100%" }}>
            {col === "bare" ? (
              <TimeField
                aria-label="Start time"
                {...props}
                {...(state === "invalid" ? { "aria-invalid": true } : {})}
              />
            ) : (
              <Field invalid={state === "invalid"}>
                <FieldLabel>Start time</FieldLabel>
                <TimeField {...props} />
                <FieldDescription>When the review begins.</FieldDescription>
              </Field>
            )}
          </div>
        );
      }}
    />
  ),
};

function EntryDemo() {
  const [error, setError] = useState<string | null>(null);
  return (
    <form aria-label="Review time" style={{ maxWidth: 240 }}>
      <Field>
        <FieldLabel>Start time</FieldLabel>
        <TimeField name="start" min="08:00" max="18:00" onEntryError={setError} />
        <FieldDescription>Between 8:00 AM and 6:00 PM.</FieldDescription>
      </Field>
      <output aria-label="Entry error">{error ?? "none"}</output>
    </form>
  );
}

/**
 * Typed on either clock and read on Tab or Enter: "5pm", "17:30" and "1730" all read, and the
 * field shows the time on the locale's clock. It is a spinbutton: Up and Down step it by `step`
 * minutes on that grid, Page Up and Page Down by an hour, within `min` and `max`. A time outside
 * them, or text that is not a time, keeps the text and says what fixes it.
 */
export const TypedEntry: Story = {
  render: () => <EntryDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole("form", { name: "Review time" }) as HTMLFormElement;
    const submitted = () => new FormData(form).get("start");
    const input = canvas.getByRole("spinbutton", { name: "Start time" });
    await expect(input).toHaveAccessibleDescription(/Between 8:00 AM and 6:00 PM/);

    await userEvent.type(input, "5pm");
    await userEvent.tab();
    await expect(input).toHaveValue("5:00 PM");
    await expect(input).toHaveAttribute("aria-valuetext", "5:00 PM");
    await expect(submitted()).toBe("17:00");

    await userEvent.click(input);
    await userEvent.keyboard("{ArrowUp}");
    await expect(input).toHaveValue("5:15 PM");
    await userEvent.keyboard("{PageUp}");
    await expect(input).toHaveValue("6:00 PM");
    await expect(submitted()).toBe("18:00");

    await userEvent.clear(input);
    await userEvent.type(input, "7:00{Enter}");
    const message = canvasElement.querySelector('[data-slot="field-error"]');
    await expect(message).toHaveTextContent("Enter 8:00 AM or later.");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription(/Enter 8:00 AM or later\./);
    await expect(submitted()).toBe("");

    await userEvent.clear(input);
    await userEvent.type(input, "half past{Enter}");
    await expect(canvasElement.querySelector('[data-slot="field-error"]')).toHaveTextContent(
      "Enter a time such as 5:30 PM.",
    );
    await expect(canvas.getByLabelText("Entry error")).toHaveTextContent(
      "Enter a time such as 5:30 PM.",
    );

    await userEvent.clear(input);
    await userEvent.type(input, "1030{Enter}");
    await expect(input).toHaveValue("10:30 AM");
    await expect(input).not.toHaveAttribute("aria-invalid");
    await expect(canvas.getByLabelText("Entry error")).toHaveTextContent("none");
  },
};

/** The clock comes from the LedgerProvider's locale (24-hour in de-DE); `hourCycle` sets it where a product needs one clock everywhere. Typing either clock always works. */
export const Clocks: Story = {
  render: () => (
    <Stack space="space.200">
      <div style={{ maxWidth: 200 }}>
        <LedgerProvider locale="de-DE">
          <TimeField aria-label="Beginn" defaultValue="17:30" />
        </LedgerProvider>
      </div>
      <div style={{ maxWidth: 200 }}>
        <TimeField aria-label="Start, 24-hour" defaultValue="17:30" hourCycle="h23" />
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const german = canvas.getByRole("spinbutton", { name: "Beginn" });
    await expect(german).toHaveValue("17:30");
    await userEvent.clear(german);
    await userEvent.type(german, "9.15 Uhr{Enter}");
    await expect(german).toHaveValue("09:15");
    const fixed = canvas.getByRole("spinbutton", { name: "Start, 24-hour" });
    await expect(fixed).toHaveValue("17:30");
    await userEvent.clear(fixed);
    await userEvent.type(fixed, "6:45 pm{Enter}");
    await expect(fixed).toHaveValue("18:45");
    // Without min and max the arrows wrap at midnight, both ways.
    await userEvent.clear(fixed);
    await userEvent.type(fixed, "23:50{Enter}");
    await userEvent.keyboard("{ArrowUp}");
    await expect(fixed).toHaveValue("00:00");
    await userEvent.keyboard("{ArrowDown}");
    await expect(fixed).toHaveValue("23:45");
  },
};

/** The mistakes the page is written to prevent. */
export const Dont: Story = {
  render: () => (
    <Pair
      do={
        <div style={{ maxWidth: 200 }}>
          <Field>
            <FieldLabel>Daily stand-up</FieldLabel>
            <TimeField defaultValue="09:30" />
            <FieldDescription>Every weekday, in each team's own time.</FieldDescription>
          </Field>
        </div>
      }
      doText="A time of day that repeats, with no date: TimeField holds a wall time."
      dont={
        <div style={{ maxWidth: 200 }}>
          <Field>
            <FieldLabel>Evidence collected</FieldLabel>
            <TimeField defaultValue="16:05" />
          </Field>
        </div>
      }
      dontText="A moment in time as a time alone. The day and the zone are lost; a moment is a DateTimeField."
    />
  ),
};
