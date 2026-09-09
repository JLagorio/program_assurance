import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, createRef, useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  FieldSet,
  FieldLegend,
  FieldDescription,
  FieldError,
  Button,
  RadioGroup,
  RadioGroupItem,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

function FrequencyItems({ disableQuarterly = false }: { disableQuarterly?: boolean }) {
  return (
    <>
      <label className="inline-flex items-center gap-100">
        <RadioGroupItem value="monthly" />
        Monthly
      </label>
      <label className="inline-flex items-center gap-100">
        <RadioGroupItem value="quarterly" disabled={disableQuarterly} />
        Quarterly
      </label>
      <label className="inline-flex items-center gap-100">
        <RadioGroupItem value="annually" />
        Annually
      </label>
    </>
  );
}

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  parameters: { layout: "padded" },
  args: { "aria-label": "Frequency", defaultValue: "quarterly" },
  render: (args) => (
    <RadioGroup {...args}>
      <FrequencyItems />
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

const blockedChange = fn();

/** No selection, selected, disabled and read-only groups, plus an application rule that cancels a change. */
export const RadioGroupMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Selection states">
        {(["No selection", "Selected", "Disabled", "Read-only"] as const).map((state) => (
          <Stack key={state} space="space.100">
            <Text size="small">{state}</Text>
            <RadioGroup
              aria-label={state}
              className="w-auto"
              defaultValue={state === "No selection" ? undefined : "quarterly"}
              disabled={state === "Disabled"}
              readOnly={state === "Read-only"}
              onValueChange={
                state === "Disabled" || state === "Read-only" ? blockedChange : undefined
              }
            >
              <FrequencyItems />
            </RadioGroup>
          </Stack>
        ))}
      </Specimens>
      <Specimens title="Cancel a change that needs approval">
        <RadioGroup
          aria-label="Approved frequency"
          aria-describedby="annual-approval"
          defaultValue="quarterly"
          onValueChange={(value, details) => {
            if (value === "annually") details.cancel();
          }}
        >
          <FrequencyItems />
        </RadioGroup>
        <Text id="annual-approval">Annual reviews require program approval.</Text>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    blockedChange.mockClear();
    const empty = within(canvas.getByRole("radiogroup", { name: "No selection" }));
    for (const radio of empty.getAllByRole("radio")) {
      await expect(radio.tagName).toBe("SPAN");
      await expect(radio).toHaveAttribute("data-slot", "radio-group-item");
      await expect(radio.getBoundingClientRect().width).toBe(16);
      await expect(radio.getBoundingClientRect().height).toBe(16);
      await expect(radio).not.toBeChecked();
    }
    await userEvent.click(empty.getByText("Monthly"));
    await expect(empty.getByRole("radio", { name: "Monthly" })).toBeChecked();
    await userEvent.click(empty.getByText("Quarterly"));
    const quarterly = empty.getByRole("radio", { name: "Quarterly" });
    await expect(quarterly).toBeChecked();
    await expect(empty.getByRole("radio", { name: "Monthly" })).not.toBeChecked();
    const indicator = quarterly.querySelector('[data-slot="radio-group-indicator"]')!;
    await expect(indicator).toBeVisible();
    await expect(indicator.querySelector("span")!.getBoundingClientRect().width).toBe(8);
    await userEvent.click(quarterly);
    await expect(quarterly).toBeChecked();
    for (const name of ["Disabled", "Read-only"]) {
      const group = canvas.getByRole("radiogroup", { name });
      await expect(group).toHaveAttribute(
        name === "Disabled" ? "aria-disabled" : "aria-readonly",
        "true",
      );
      const choices = within(group);
      await userEvent.click(choices.getByRole("radio", { name: "Monthly" }), {
        pointerEventsCheck: 0,
      });
      if (name === "Read-only") await userEvent.keyboard(" ");
      await expect(choices.getByRole("radio", { name: "Quarterly" })).toBeChecked();
      await expect(choices.getByRole("radio", { name: "Monthly" })).not.toBeChecked();
    }
    await expect(blockedChange).not.toHaveBeenCalled();
    const approved = within(canvas.getByRole("radiogroup", { name: "Approved frequency" }));
    await userEvent.click(approved.getByRole("radio", { name: "Annually" }));
    await expect(approved.getByRole("radio", { name: "Quarterly" })).toBeChecked();
    await expect(approved.getByRole("radio", { name: "Annually" })).not.toBeChecked();
  },
};

/** Layout uses CSS; both arrow axes select, with horizontal direction inherited or explicitly overridden. */
export const Orientation: Story = {
  name: "Layout and keyboard",
  render: () => (
    <Stack space="space.300">
      <Specimens title="Horizontal layout, with an unavailable option">
        <RadioGroup
          aria-label="Horizontal frequency"
          className="flex flex-row flex-wrap gap-200"
          defaultValue="monthly"
        >
          <FrequencyItems disableQuarterly />
        </RadioGroup>
      </Specimens>
      <LedgerProvider direction="rtl">
        <Stack space="space.300">
          <Specimens title="RTL follows the locale">
            <RadioGroup aria-label="RTL frequency" defaultValue="monthly">
              <FrequencyItems />
            </RadioGroup>
          </Specimens>
          <Specimens title="A group can override the locale direction">
            <RadioGroup aria-label="LTR frequency" dir="ltr" defaultValue="monthly">
              <FrequencyItems />
            </RadioGroup>
          </Specimens>
        </Stack>
      </LedgerProvider>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const horizontal = within(canvas.getByRole("radiogroup", { name: "Horizontal frequency" }));
    const monthly = horizontal.getByRole("radio", { name: "Monthly" });
    const annual = horizontal.getByRole("radio", { name: "Annually" });
    monthly.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(annual).toHaveFocus();
    await expect(annual).toBeChecked();
    await userEvent.keyboard("{ArrowDown}");
    await expect(monthly).toHaveFocus();
    await expect(monthly).toBeChecked();
    await userEvent.tab();
    await expect(
      within(canvas.getByRole("radiogroup", { name: "RTL frequency" })).getByRole("radio", {
        name: "Monthly",
      }),
    ).toHaveFocus();
    for (const [name, arrow] of [
      ["RTL frequency", "ArrowLeft"],
      ["LTR frequency", "ArrowRight"],
    ] as const) {
      const group = within(canvas.getByRole("radiogroup", { name }));
      group.getByRole("radio", { name: "Monthly" }).focus();
      await userEvent.keyboard(`{${arrow}}`);
      await expect(group.getByRole("radio", { name: "Quarterly" })).toHaveFocus();
      await expect(group.getByRole("radio", { name: "Quarterly" })).toBeChecked();
    }
  },
};

const groupRef = createRef<HTMLDivElement>();
const renderedGroupRef = createRef<HTMLDivElement>();
const groupInputRef = createRef<HTMLInputElement>();
const itemRef = createRef<HTMLElement>();
const itemInputRef = createRef<HTMLInputElement>();
const buttonRef = createRef<HTMLElement>();
const renderedButtonRef = createRef<HTMLButtonElement>();
const changed = fn();

function FormDemo() {
  const fieldId = useId();

  const [frequency, setFrequency] = useState("");
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState("No review scheduled.");
  const invalid = tried && !frequency;
  const fieldError1 = invalid ? "Choose a frequency." : undefined;
  return (
    <form
      noValidate
      aria-label="Review schedule"
      style={{ width: 360 }}
      onReset={() => {
        setFrequency("");
        setTried(false);
        setSaved("No review scheduled.");
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setTried(true);
        if (frequency)
          setSaved(`Scheduled: ${new FormData(event.currentTarget).get("frequency")}.`);
      }}
    >
      <Stack space="space.200">
        <FieldSet
          data-invalid={Boolean(fieldError1)}
          aria-invalid={Boolean(fieldError1)}
          aria-labelledby={`${fieldId}-frequency-1-label`}
          aria-describedby={`${fieldId}-frequency-1-message`}
        >
          <FieldLegend id={`${fieldId}-frequency-1-label`} variant="label">
            {"Frequency"}
            <span aria-hidden="true" className="text-danger">
              {" "}
              *
            </span>
          </FieldLegend>
          <RadioGroup
            aria-labelledby={`${fieldId}-frequency-1-label`}
            aria-invalid={Boolean(fieldError1)}
            aria-describedby={`${fieldId}-frequency-1-message`}
            ref={groupRef}
            inputRef={groupInputRef}
            id="review-frequency"
            name="frequency"
            required
            value={frequency}
            onValueChange={(value) => {
              setFrequency(value);
              changed(value);
            }}
            className={(state) => (state.required ? "border border-default" : "border-0")}
            style={(state) => ({ minWidth: state.required ? 240 : 160 })}
            render={
              <div ref={renderedGroupRef} className="rounded-medium" style={{ padding: 8 }} />
            }
          >
            <label className="inline-flex items-center gap-100">
              <RadioGroupItem
                ref={itemRef}
                inputRef={itemInputRef}
                value="monthly"
                id="monthly-frequency"
                aria-invalid={invalid || undefined}
              />
              Monthly
            </label>
            <Inline space="space.100" alignBlock="center">
              <RadioGroupItem
                ref={buttonRef}
                nativeButton
                render={<button ref={renderedButtonRef} title="Quarterly review" />}
                value="quarterly"
                id="quarterly-frequency"
                aria-invalid={invalid || undefined}
              />
              <label htmlFor="quarterly-frequency">Quarterly</label>
            </Inline>
            <Stack space="space.050">
              <Inline space="space.100" alignBlock="center">
                <RadioGroupItem
                  value="annually"
                  id="annual-frequency"
                  aria-describedby="annual-frequency-description"
                  aria-invalid={invalid || undefined}
                />
                <label htmlFor="annual-frequency">Annually</label>
              </Inline>
              <Text id="annual-frequency-description" size="small" color="color.text.subtle">
                One review each year.
              </Text>
            </Stack>
          </RadioGroup>
          {Boolean(fieldError1) ? (
            <FieldError id={`${fieldId}-frequency-1-message`}>{fieldError1}</FieldError>
          ) : (
            <FieldDescription id={`${fieldId}-frequency-1-message`}>
              {"How often the control is reviewed."}
            </FieldDescription>
          )}
        </FieldSet>
        <Inline space="space.100">
          <Button type="submit" variant="primary">
            Schedule
          </Button>
          <Button type="reset">Reset schedule</Button>
        </Inline>
        <Text role="status">{saved}</Text>
      </Stack>
    </form>
  );
}

/** External labels, Field validation, native form values/reset, and native/ref/render targets. */
export const InField: Story = {
  render: () => <FormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    changed.mockClear();
    const group = canvas.getByRole("radiogroup", { name: "Frequency" });
    const monthly = canvas.getByRole("radio", { name: "Monthly" });
    const quarterly = canvas.getByRole("radio", { name: "Quarterly" });
    await expect(groupRef.current).toBe(group);
    await expect(renderedGroupRef.current).toBe(group);
    await expect(group).toHaveAttribute("id", "review-frequency");
    await expect(group).toHaveClass("border", "rounded-medium");
    await expect(group).toHaveStyle({ minWidth: "240px", padding: "8px" });
    await expect(group).toHaveAttribute("aria-required", "true");
    await expect(group).toHaveAccessibleDescription("How often the control is reviewed.");
    await expect(itemRef.current).toBe(monthly);
    await expect(itemInputRef.current).toHaveAttribute("id", "monthly-frequency");
    await expect(itemInputRef.current).toHaveAttribute("required");
    await expect(monthly).not.toHaveAttribute("id", "monthly-frequency");
    await expect(buttonRef.current).toBe(quarterly);
    await expect(renderedButtonRef.current).toBe(quarterly);
    await expect(quarterly.tagName).toBe("BUTTON");
    await expect(quarterly).toHaveAttribute("id", "quarterly-frequency");
    await expect(quarterly).toHaveAttribute("title", "Quarterly review");
    await expect(canvas.getByRole("radio", { name: "Annually" })).toHaveAccessibleDescription(
      "One review each year.",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Schedule" }));
    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(group).toHaveAccessibleDescription("Choose a frequency.");
    await expect(canvas.getByRole("alert")).toHaveTextContent("Choose a frequency.");
    await userEvent.click(canvas.getByText("Monthly"));
    await expect(monthly).toBeChecked();
    await expect(changed).toHaveBeenLastCalledWith("monthly");
    await expect(groupInputRef.current).toBe(itemInputRef.current);
    await expect(group).not.toHaveAttribute("aria-invalid", "true");
    await expect(group).toHaveAccessibleDescription("How often the control is reviewed.");
    await userEvent.click(canvas.getByText("Quarterly"));
    await expect(quarterly).toBeChecked();
    await expect(groupInputRef.current).toHaveAttribute("value", "quarterly");
    await userEvent.click(canvas.getByRole("button", { name: "Schedule" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Scheduled: quarterly.");
    await userEvent.click(canvas.getByRole("button", { name: "Reset schedule" }));
    for (const radio of canvas.getAllByRole("radio")) await expect(radio).not.toBeChecked();
    monthly.focus();
    await userEvent.keyboard("{Enter}");
    await expect(monthly).not.toBeChecked();
    await userEvent.keyboard(" ");
    await expect(monthly).toBeChecked();
  },
};

export const Playground: Story = {};
