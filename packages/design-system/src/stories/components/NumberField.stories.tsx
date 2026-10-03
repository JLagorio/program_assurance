import { type Meta, type StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  NumberField,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/NumberField",
  component: NumberField,
  parameters: { layout: "padded" },
  args: {
    "aria-label": "Retention days",
    defaultValue: 90,
    min: 1,
    max: 365,
    step: 1,
    size: "medium",
  },
} satisfies Meta<typeof NumberField>;
export default meta;
type Story = StoryObj<typeof meta>;

const fieldWidth = { width: 200, maxWidth: "100%" } as const;
const days = { style: "unit", unit: "day", unitDisplay: "long" } as const;

/** The controls: value, bounds, step, size, disabled and read-only. */
export const Playground: Story = {
  args: { onValueChange: fn() },
  render: (args) => <NumberField {...args} style={fieldWidth} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Retention days" });
    await expect(input).toHaveAttribute("aria-roledescription", "Number field");
    // With only an aria-label, the steppers still say which field they change.
    await expect(canvas.getByRole("button", { name: "Decrease Retention days" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Increase Retention days" }));
    await expect(input).toHaveValue("91");
    await expect(args.onValueChange).toHaveBeenCalledWith(91, expect.anything());
    // A press with a pointer keeps focus in the input, so the arrow keys carry on from there.
    await expect(input).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    await expect(input).toHaveValue("92");
  },
};

const states = ["empty", "filled", "invalid", "disabled", "read-only"] as const;
const sizes = ["medium", "small"] as const;

/** Both sizes in every state. Read-only keeps the value selectable and drops the steppers; disabled dims the field and its steppers. */
export const States: Story = {
  tags: ["!manifest"],
  render: () => (
    <Matrix
      rows={states}
      cols={sizes}
      rowLabel="state"
      render={(state, size) => (
        <NumberField
          size={size}
          aria-label={`Budget, ${state}, ${size}`}
          placeholder="0"
          {...(state === "empty" ? {} : { defaultValue: 1250 })}
          {...(state === "invalid" ? { "aria-invalid": true } : {})}
          disabled={state === "disabled"}
          readOnly={state === "read-only"}
          style={{ width: 160, maxWidth: "100%" }}
        />
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const filled = canvas.getByRole("textbox", { name: `Budget, filled, ${size}` });
      await expect(filled).toHaveValue("1,250");
      const group = filled.closest<HTMLElement>('[data-slot="number-field-group"]')!;
      await expect(group.getBoundingClientRect().height).toBe(size === "small" ? 28 : 32);
      await expect(
        canvas.getByRole("textbox", { name: `Budget, invalid, ${size}` }),
      ).toHaveAttribute("aria-invalid", "true");
      const readOnly = canvas.getByRole("textbox", { name: `Budget, read-only, ${size}` });
      await expect(readOnly).toHaveAttribute("readonly");
      await expect(
        within(readOnly.closest<HTMLElement>('[data-slot="number-field"]')!).queryByRole("button"),
      ).toBeNull();
      const disabled = canvas.getByRole("textbox", { name: `Budget, disabled, ${size}` });
      await expect(disabled).toBeDisabled();
      for (const button of within(
        disabled.closest<HTMLElement>('[data-slot="number-field"]')!,
      ).getAllByRole("button"))
        await expect(button).toHaveAttribute("aria-disabled", "true");
    }
  },
};

/** Arrow keys step by `step`, Shift by `largeStep`, and Home and End go to `min` and `max`. At a bound the button that would pass it is unavailable. The steppers are not Tab stops: the arrow keys do what they do. */
export const Keyboard: Story = {
  render: () => (
    <Field>
      <FieldLabel>Reviewers</FieldLabel>
      <NumberField defaultValue={3} min={1} max={20} style={fieldWidth} />
    </Field>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Reviewers" });
    const increase = canvas.getByRole("button", { name: "Increase Reviewers" });
    const decrease = canvas.getByRole("button", { name: "Decrease Reviewers" });
    await expect(increase).toHaveAttribute("tabindex", "-1");
    await expect(decrease).toHaveAttribute("tabindex", "-1");
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    await expect(input).toHaveValue("4");
    await userEvent.keyboard("{Shift>}{ArrowUp}{/Shift}");
    await expect(input).toHaveValue("14");
    await userEvent.keyboard("{ArrowDown}");
    await expect(input).toHaveValue("13");
    await userEvent.keyboard("{End}");
    await expect(input).toHaveValue("20");
    await expect(increase).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Home}");
    await expect(input).toHaveValue("1");
    await expect(decrease).toHaveAttribute("aria-disabled", "true");
    await expect(increase).not.toHaveAttribute("aria-disabled", "true");
    // Tab leaves the field for the page, past both steppers.
    await userEvent.tab();
    await expect(increase).not.toHaveFocus();
    await expect(decrease).not.toHaveFocus();
  },
};

/** Typed text is parsed in the locale and formatted when the field loses focus; a value past a bound is clamped to it. The unit comes from `format`. */
export const TypedAndFormatted: Story = {
  render: () => (
    <Field>
      <FieldLabel>Retention</FieldLabel>
      <NumberField defaultValue={90} min={1} max={3650} format={days} style={fieldWidth} />
    </Field>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Retention" });
    await expect(input).toHaveValue("90 days");
    await userEvent.tripleClick(input);
    await userEvent.keyboard("1500");
    await userEvent.tab();
    await expect(input).toHaveValue("1,500 days");
    await userEvent.tripleClick(input);
    await userEvent.keyboard("9000");
    await userEvent.tab();
    await expect(input).toHaveValue("3,650 days");
  },
};

/** Inside a Field the label names the input and both steppers ("Increase Retention"), the hint and the error describe it, and the Field's `invalid`, `required` and `disabled` reach it with no ids. */
export const BoundInField: Story = {
  name: "Bound in a Field",
  render: () => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Field invalid required>
        <FieldLabel>Retention</FieldLabel>
        <NumberField defaultValue={0} min={0} format={days} style={fieldWidth} />
        <FieldDescription>How long evidence is kept after a review.</FieldDescription>
        <FieldError>Keep evidence for at least one day.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Reviewers</FieldLabel>
        <NumberField defaultValue={2} style={fieldWidth} />
      </Field>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const retention = canvas.getByRole("textbox", { name: "Retention" });
    await expect(retention).toHaveAttribute("aria-invalid", "true");
    await expect(retention).toHaveAttribute("aria-required", "true");
    await expect(retention).toHaveAccessibleDescription(
      "How long evidence is kept after a review. Keep evidence for at least one day.",
    );
    await expect(canvas.getByRole("button", { name: "Increase Retention" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Decrease Retention" })).toBeVisible();
    const reviewers = canvas.getByRole("textbox", { name: "Reviewers" });
    await expect(reviewers).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Increase Reviewers" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  },
};

function WheelFields() {
  return (
    <Stack space="space.200">
      <Field>
        <FieldLabel>Seats</FieldLabel>
        <NumberField defaultValue={10} style={fieldWidth} />
      </Field>
      <Field>
        <FieldLabel>Priority</FieldLabel>
        <NumberField defaultValue={10} allowWheelScrub style={fieldWidth} />
      </Field>
    </Stack>
  );
}

const wheelUp = (target: HTMLElement) =>
  target.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true }));

/** By default the wheel never changes a number. With `allowWheelScrub` it steps only the field that has focus, so scrolling a form past it leaves it alone. */
export const Wheel: Story = {
  render: () => <WheelFields />,
  play: async ({ canvas }) => {
    const seats = canvas.getByRole("textbox", { name: "Seats" });
    const priority = canvas.getByRole("textbox", { name: "Priority" });
    seats.focus();
    wheelUp(seats);
    await expect(seats).toHaveValue("10");
    // Not focused: the wheel scrolls past it.
    wheelUp(priority);
    await expect(priority).toHaveValue("10");
    priority.focus();
    wheelUp(priority);
    await waitFor(() => expect(priority).toHaveValue("11"));
  },
};

function FormWithNumber() {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <form
      aria-label="Evidence policy"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(String(new FormData(event.currentTarget).get("retention")));
      }}
      style={{ maxWidth: 320 }}
    >
      <Stack space="space.150">
        <Field name="retention">
          <FieldLabel>Retention in days</FieldLabel>
          <NumberField defaultValue={90} min={1} style={fieldWidth} />
        </Field>
        <Text size="small" color="color.text.subtle">
          {sent === null ? "Not sent" : `Sent retention=${sent}`}
        </Text>
        <Button type="submit" variant="primary">
          Save policy
        </Button>
      </Stack>
    </form>
  );
}

/** In a form the raw number, not the formatted text, is sent under the Field's `name`. */
export const InAForm: Story = {
  render: () => <FormWithNumber />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Increase Retention in days" }));
    await userEvent.click(canvas.getByRole("button", { name: "Save policy" }));
    await expect(canvas.getByText("Sent retention=91")).toBeVisible();
  },
};

/** The number is formatted and parsed in the provider's locale, not the browser's, and the steppers' names and the role description come from its messages. Here in German, in euros. */
export const Localized: Story = {
  render: () => (
    <LedgerProvider
      locale="de-DE"
      messages={{
        increaseValue: "Erhöhen",
        decreaseValue: "Verringern",
        numberField: "Zahlenfeld",
      }}
    >
      <Field>
        <FieldLabel>Budget</FieldLabel>
        <NumberField
          defaultValue={1234.5}
          step={50}
          format={{ style: "currency", currency: "EUR" }}
          style={{ width: 220, maxWidth: "100%" }}
        />
      </Field>
    </LedgerProvider>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Budget" });
    await expect(input).toHaveAttribute("aria-roledescription", "Zahlenfeld");
    await expect((input as HTMLInputElement).value).toMatch(/^1\.234,50\s€$/);
    await userEvent.click(canvas.getByRole("button", { name: "Erhöhen Budget" }));
    await expect((input as HTMLInputElement).value).toMatch(/^1\.284,50\s€$/);
    await expect(canvas.getByRole("button", { name: "Verringern Budget" })).toBeVisible();
  },
};

/** Right to left, the buttons sit at the end of the field (the left), decrement nearest the number, and Up still increases it. */
export const RightToLeft: Story = {
  render: () => (
    <LedgerProvider direction="rtl">
      <Field>
        <FieldLabel>Reviewers</FieldLabel>
        <NumberField defaultValue={3} min={1} max={20} style={fieldWidth} />
      </Field>
    </LedgerProvider>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: "Reviewers" });
    const decrease = canvas.getByRole("button", { name: "Decrease Reviewers" });
    const increase = canvas.getByRole("button", { name: "Increase Reviewers" });
    const box = input.getBoundingClientRect();
    await expect(decrease.getBoundingClientRect().right).toBeLessThanOrEqual(box.left + 1);
    await expect(increase.getBoundingClientRect().right).toBeLessThanOrEqual(
      decrease.getBoundingClientRect().left + 1,
    );
    await userEvent.click(input);
    await userEvent.keyboard("{ArrowUp}");
    await expect(input).toHaveValue("4");
    await userEvent.click(decrease);
    await expect(input).toHaveValue("3");
    await expect(input).toHaveFocus();
  },
};

/** A number field holds a quantity; an identifier made of digits is text. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Pair
      do={
        <Stack space="space.150">
          <Field>
            <FieldLabel>Reviewers</FieldLabel>
            <NumberField defaultValue={3} min={1} style={fieldWidth} />
          </Field>
          <Field>
            <FieldLabel>Build number</FieldLabel>
            <Input defaultValue="0412" inputMode="numeric" style={fieldWidth} />
          </Field>
        </Stack>
      }
      doText="NumberField for an amount the reader steps; an Input with inputMode numeric for digits that name something."
      dont={
        <Field>
          <FieldLabel>Build number</FieldLabel>
          <NumberField defaultValue={412} style={fieldWidth} />
        </Field>
      }
      dontText="An identifier in a NumberField. The leading zero is gone, a long one takes grouping separators, and the steppers invite a change that means nothing."
    />
  ),
};
