import { useId, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useForm } from "@tanstack/react-form";

import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "../../components";
import { Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Field",
  component: Field,
  parameters: { layout: "padded" },
  args: { orientation: "vertical", invalid: false, required: false, disabled: false },
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The short path: a label, a control and a hint in a Field, with no ids. The Field ties them together. */
export const Playground: Story = {
  render: (args) => (
    <Field {...args} className="w-layout-list max-w-full">
      <FieldLabel>Owner</FieldLabel>
      <Input defaultValue="Dana Whitlock" />
      <FieldDescription>The person who answers for this record.</FieldDescription>
      {args.invalid && <FieldError>Choose a person who is on the program.</FieldError>}
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Owner" });
    await expect(input).toHaveAccessibleDescription("The person who answers for this record.");
    await expect(canvasElement.querySelector(`label[for="${input.id}"]`)).toBeInTheDocument();
    await userEvent.click(canvas.getByText("Owner"));
    await expect(input).toHaveFocus();
  },
};

const people = [
  { value: "dana", label: "Dana Whitlock" },
  { value: "priya", label: "Priya Natarajan" },
];

/**
 * One Field per control, each `invalid` and `required` with a FieldError: the label names the
 * control, the hint and the error describe it, and `aria-invalid` and the requirement reach Input,
 * Textarea, InputGroupInput, the Select trigger, the Combobox input, Checkbox, RadioGroup and
 * Switch. Nothing here has an id or an ARIA attribute written by hand.
 */
export const EveryControl: Story = {
  name: "Every control",
  render: () => (
    <FieldGroup className="w-layout-list max-w-full">
      <Field invalid required>
        <FieldLabel>Program name</FieldLabel>
        <Input />
        <FieldError>Enter a program name.</FieldError>
      </Field>
      <Field invalid required>
        <FieldLabel>Rationale</FieldLabel>
        <Textarea rows={2} />
        <FieldDescription>Why this control exists.</FieldDescription>
        <FieldError>Explain why this control is needed.</FieldError>
      </Field>
      <Field invalid required>
        <FieldLabel>Budget</FieldLabel>
        <InputGroup>
          <InputGroupInput inputMode="decimal" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>USD</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <FieldError>Enter a budget in US dollars.</FieldError>
      </Field>
      <Field invalid required>
        <FieldLabel>Status</FieldLabel>
        <Select items={{ open: "Open", closed: "Closed" }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <FieldError>Choose a status.</FieldError>
      </Field>
      <Field invalid required>
        <FieldLabel>Assessor</FieldLabel>
        <Combobox items={people}>
          <ComboboxInput placeholder="Choose a person" />
          <ComboboxContent>
            <ComboboxEmpty>No matches.</ComboboxEmpty>
            <ComboboxList>
              {(item: (typeof people)[number]) => (
                <ComboboxItem key={item.value} value={item}>
                  {item.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <FieldError>Choose an assessor.</FieldError>
      </Field>
      <Field orientation="horizontal" invalid required>
        <Checkbox />
        <FieldContent>
          <FieldLabel>I have reviewed the evidence</FieldLabel>
          <FieldError>Confirm the review before you submit.</FieldError>
        </FieldContent>
      </Field>
      <Field invalid required>
        <FieldSet>
          <FieldLegend variant="label">Review frequency</FieldLegend>
          <RadioGroup>
            <Field orientation="horizontal">
              <RadioGroupItem value="quarterly" />
              <FieldLabel>Quarterly</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="annually" />
              <FieldLabel>Annually</FieldLabel>
            </Field>
          </RadioGroup>
          <FieldError>Choose a review frequency.</FieldError>
        </FieldSet>
      </Field>
      <Field orientation="horizontal" invalid required>
        <Switch />
        <FieldContent>
          <FieldLabel>Notify the owner</FieldLabel>
          <FieldError>Turn on notifications for assigned work.</FieldError>
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cases: Array<[HTMLElement, string]> = [
      [canvas.getByRole("textbox", { name: "Program name" }), "Enter a program name."],
      [
        canvas.getByRole("textbox", { name: "Rationale" }),
        "Why this control exists. Explain why this control is needed.",
      ],
      [canvas.getByRole("textbox", { name: "Budget" }), "Enter a budget in US dollars."],
      [canvas.getByRole("combobox", { name: "Status" }), "Choose a status."],
      [canvas.getByRole("combobox", { name: "Assessor" }), "Choose an assessor."],
      [
        canvas.getByRole("checkbox", { name: "I have reviewed the evidence" }),
        "Confirm the review before you submit.",
      ],
      [canvas.getByRole("radiogroup", { name: "Review frequency" }), "Choose a review frequency."],
      [
        canvas.getByRole("switch", { name: "Notify the owner" }),
        "Turn on notifications for assigned work.",
      ],
    ];
    for (const [control, message] of cases) {
      await expect(control).toHaveAttribute("aria-invalid", "true");
      await expect(control).toHaveAccessibleDescription(message);
      await expect(
        control.hasAttribute("required") || control.getAttribute("aria-required") === "true",
      ).toBe(true);
    }
    // The error colour reaches the label; the asterisk is hidden from the accessible name.
    const label = canvas.getByText("Program name").closest("label")!;
    await expect(label).toHaveAttribute("data-invalid");
    await expect(label.querySelector('[data-slot="field-required"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(getComputedStyle(label).color).toBe(
      getComputedStyle(canvas.getByText("Enter a program name.")).color,
    );
    // Items in a group keep their own names; the legend names the group and shows the marker.
    await expect(canvas.getByRole("radio", { name: "Quarterly" })).toBeInTheDocument();
    await expect(
      canvas.getByText("Review frequency").querySelector('[data-slot="field-required"]'),
    ).toBeInTheDocument();
    // An inline error is not a live region; the summary or focus carries the announcement.
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
  },
};

/**
 * `disabled` on a Field disables its control and dims its label; `disabled` on a FieldSet reaches
 * every control inside, including the Checkbox, Radio and Switch roots a native disabled
 * fieldset leaves live.
 */
export const Disabled: Story = {
  render: () => (
    <FieldGroup className="w-layout-list max-w-full">
      <Field disabled>
        <FieldLabel>Reference</FieldLabel>
        <Input defaultValue="CTRL-0412" />
      </Field>
      <FieldSet disabled>
        <FieldLegend variant="label">While saving</FieldLegend>
        <Field orientation="horizontal">
          <Checkbox />
          <FieldLabel>Include every element</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Switch />
          <FieldLabel>Notify the owner</FieldLabel>
        </Field>
        <RadioGroup defaultValue="copy">
          <Field orientation="horizontal">
            <RadioGroupItem value="copy" />
            <FieldLabel>Copy the baseline</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="link" />
            <FieldLabel>Link the baseline</FieldLabel>
          </Field>
        </RadioGroup>
        <label className="inline-flex items-center gap-100 font-body">
          <Checkbox />
          Bare checkbox outside a Field
        </label>
      </FieldSet>
      <Field disabled>
        <FieldSet>
          <FieldLegend variant="label">Locked scope</FieldLegend>
          <Field orientation="horizontal">
            <Checkbox />
            <FieldLabel>Include inherited controls</FieldLabel>
          </Field>
        </FieldSet>
      </Field>
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reference = canvas.getByRole("textbox", { name: "Reference" });
    await expect(reference).toBeDisabled();
    await expect(canvas.getByText("Reference").closest("label")).toHaveAttribute("data-disabled");
    const controls = [
      canvas.getByRole("checkbox", { name: "Include every element" }),
      canvas.getByRole("switch", { name: "Notify the owner" }),
      canvas.getByRole("radio", { name: "Link the baseline" }),
      canvas.getByRole("checkbox", { name: "Bare checkbox outside a Field" }),
      // A choice in its own Field follows the disabled group Field around it.
      canvas.getByRole("checkbox", { name: "Include inherited controls" }),
    ];
    for (const control of controls) {
      await expect(control).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(control, { pointerEventsCheck: 0 });
      await expect(control).not.toBeChecked();
    }
    await expect(canvas.getByRole("radio", { name: "Copy the baseline" })).toBeChecked();
    await expect(canvas.getByText("Include inherited controls").closest("label")).toHaveAttribute(
      "data-disabled",
    );
    // Nothing in the disabled set is a tab stop.
    reference.ownerDocument.body.focus();
    await userEvent.tab();
    await expect(controls.some((control) => control === document.activeElement)).toBe(false);
  },
};

/** Explicit ids and ARIA, as earlier callers wrote them, still win over the Field's own. */
export const ExplicitAssociations: Story = {
  name: "Explicit associations",
  render: function Example() {
    const id = useId();
    return (
      <Field className="w-layout-list max-w-full">
        <FieldLabel id={`${id}-label`} htmlFor={id}>
          Owner
        </FieldLabel>
        <Input
          id={id}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-help`}
          defaultValue="Dana Whitlock"
        />
        <FieldDescription id={`${id}-help`}>
          The person who answers for this record.
        </FieldDescription>
      </Field>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Owner" });
    const label = canvas.getByText("Owner").closest("label")!;
    await expect(label.htmlFor).toBe(input.id);
    await expect(input.getAttribute("aria-labelledby")).toBe(label.id);
    // The caller's id and the description's own are the same one, listed once.
    await expect(input.getAttribute("aria-describedby")!.split(" ")).toHaveLength(1);
    await expect(input).toHaveAccessibleDescription("The person who answers for this record.");
    await userEvent.click(canvas.getByText("Owner"));
    await expect(input).toHaveFocus();
  },
};

/** The same parts support sections, responsive rows, and selectable cards. */
export const Composition: Story = {
  render: function Example() {
    const id = useId();
    return (
      <Card className="w-full max-w-layout-measure">
        <CardContent>
          <FieldSet>
            <FieldLegend>Review preferences</FieldLegend>
            <FieldDescription>Choose how this assessment is reviewed.</FieldDescription>
            <FieldGroup>
              <Field orientation="responsive">
                <FieldContent>
                  <FieldLabel htmlFor={`${id}-notify`}>Notify the owner</FieldLabel>
                  <FieldDescription id={`${id}-notify-help`}>
                    Send updates when evidence changes.
                  </FieldDescription>
                </FieldContent>
                <Switch id={`${id}-notify`} aria-describedby={`${id}-notify-help`} />
              </Field>
              <FieldSeparator>Evidence</FieldSeparator>
              <FieldLabel htmlFor={`${id}-review`}>
                <Field orientation="horizontal">
                  <Checkbox id={`${id}-review`} aria-describedby={`${id}-review-help`} />
                  <FieldContent>
                    <FieldTitle>Require a second reviewer</FieldTitle>
                    <FieldDescription id={`${id}-review-help`}>
                      A colleague confirms the determination.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor={`${id}-archived`}>
                <Field orientation="horizontal" data-disabled>
                  <Checkbox id={`${id}-archived`} disabled defaultChecked />
                  <FieldContent>
                    <FieldTitle>Keep archived evidence</FieldTitle>
                    <FieldDescription>Required by the retention policy.</FieldDescription>
                  </FieldContent>
                </Field>
              </FieldLabel>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Review preferences" })).toBeVisible();
    const checkbox = canvas.getByRole("checkbox", { name: /Require a second reviewer/ });
    await userEvent.click(canvas.getByText("Require a second reviewer"));
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toHaveAccessibleDescription("A colleague confirms the determination.");
    const toggle = canvas.getByRole("switch", { name: "Notify the owner" });
    await userEvent.click(canvas.getByText("Notify the owner"));
    await expect(toggle).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: /Keep archived evidence/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    const dividerLabel = canvas.getByText("Evidence");
    await expect(getComputedStyle(dividerLabel).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  },
};

function ValidatedOwner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState("");
  const form = useForm({
    defaultValues: { owner: "" },
    onSubmit: ({ value }) => setSaved(`Assigned to ${value.owner}.`),
    onSubmitInvalid: () => inputRef.current?.focus(),
  });
  return (
    <form
      className="w-layout-list max-w-full"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field
          name="owner"
          validators={{
            onChange: ({ value }) => (value.trim() ? undefined : { message: "Enter an owner." }),
          }}
        >
          {(field) => (
            <Field invalid={field.state.meta.isTouched && !field.state.meta.isValid} required>
              <FieldLabel>Owner</FieldLabel>
              <div data-testid="control-wrapper">
                <Input
                  ref={inputRef}
                  name={field.name}
                  value={field.state.value}
                  onValueChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
              </div>
              <FieldDescription>Use the full name.</FieldDescription>
              <FieldError errors={field.state.meta.isTouched ? field.state.meta.errors : []} />
            </Field>
          )}
        </form.Field>
        <Button type="submit">Assign owner</Button>
        {saved && <p role="status">{saved}</p>}
      </FieldGroup>
    </form>
  );
}

/**
 * TanStack Form owns validation and passes `invalid` and `errors`; the Field wires them through
 * a wrapper element, and two copies of the form get their own ids.
 */
export const Validation: Story = {
  render: () => (
    <FieldGroup>
      <ValidatedOwner />
      <ValidatedOwner />
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inputs = canvas.getAllByRole("textbox", { name: "Owner" });
    await expect(inputs[0]!.id).not.toBe(inputs[1]!.id);
    await expect(inputs[0]!).toHaveAccessibleDescription("Use the full name.");
    await expect(inputs[0]!).toBeRequired();
    await userEvent.click(canvas.getAllByRole("button", { name: "Assign owner" })[0]!);
    await expect(inputs[0]!).toHaveFocus();
    await expect(inputs[0]!).toHaveAttribute("aria-invalid", "true");
    await expect(inputs[0]!).toHaveAccessibleDescription("Use the full name. Enter an owner.");
    const invalidLabel = canvasElement.querySelector(`label[for="${inputs[0]!.id}"]`)!;
    const message = canvas.getByText("Enter an owner.");
    await waitFor(() =>
      expect(getComputedStyle(invalidLabel).color).toBe(getComputedStyle(message).color),
    );
    const invalidBorder = getComputedStyle(inputs[0]!)
      .getPropertyValue("--ds-color-border-danger")
      .trim();
    await waitFor(() => expect(getComputedStyle(inputs[0]!).borderColor).toBe(invalidBorder));
    await userEvent.tab();
    await waitFor(() => expect(getComputedStyle(inputs[0]!).borderColor).toBe(invalidBorder));
    await expect(inputs[1]!).not.toHaveAttribute("aria-invalid", "true");
    await userEvent.type(inputs[0]!, "Dana Whitlock");
    await waitFor(() => expect(inputs[0]!).not.toHaveAttribute("aria-invalid", "true"));
    await expect(inputs[0]!).toHaveAccessibleDescription("Use the full name.");
    await userEvent.click(canvas.getAllByRole("button", { name: "Assign owner" })[0]!);
    await expect(canvas.getByRole("status")).toHaveTextContent("Assigned to Dana Whitlock.");
  },
};

/**
 * Base UI validation instead of a form library: native constraints on the control (`required`
 * and `type` on the Input), checked when the field loses focus (`validationMode="onBlur"`), each
 * message under the `match` it answers. The Field's own `required` only announces and marks.
 */
export const NativeValidation: Story = {
  name: "Native validation",
  render: () => (
    <Field validationMode="onBlur" required className="w-layout-list max-w-full">
      <FieldLabel>Contact email</FieldLabel>
      <Input type="email" required />
      <FieldError match="valueMissing">Enter a contact email.</FieldError>
      <FieldError match="typeMismatch">Enter an email address like name@example.test.</FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Contact email" });
    await userEvent.type(input, "dana");
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
    await expect(input).toHaveAccessibleDescription(
      "Enter an email address like name@example.test.",
    );
    await expect(canvas.queryByText("Enter a contact email.")).not.toBeInTheDocument();
    await userEvent.type(input, "@example.test");
    await userEvent.tab();
    await waitFor(() => expect(input).not.toHaveAttribute("aria-invalid", "true"));
    await expect(
      canvas.queryByText("Enter an email address like name@example.test."),
    ).not.toBeInTheDocument();
  },
};

/** FieldError takes children or an `errors` array, drops duplicates and empties, and renders nothing when none remain. */
export const Errors: Story = {
  render: () => (
    <FieldGroup>
      <FieldError
        errors={[
          undefined,
          {},
          { message: "Enter an owner." },
          { message: "Enter an owner." },
          { message: "Use a program member." },
        ]}
      />
      <FieldError errors={[]} />
      <FieldError errors={[undefined, {}]} />
      <FieldError errors={[{ message: "Unused fallback." }]}>
        The server rejected this assignment.
      </FieldError>
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelectorAll('[data-slot="field-error"]')).toHaveLength(2);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);
    await expect(canvas.queryByText("Unused fallback.")).not.toBeInTheDocument();
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
  },
};

/** The message belongs to the Field; red text beside a control is not heard when focus reaches it. */
export const DoDont: Story = {
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <Field invalid className="max-w-full" style={{ width: 240 }}>
          <FieldLabel>Owner</FieldLabel>
          <Input defaultValue="Sam" />
          <FieldError>Choose a person who is on the program.</FieldError>
        </Field>
      }
      doText="The error is part of the Field: the input is invalid and described by it."
      dont={
        <div className="flex max-w-full flex-col gap-050" style={{ width: 240 }}>
          <Input aria-label="Owner" defaultValue="Sam" />
          <Text size="small" color="color.text.danger">
            Choose a person who is on the program.
          </Text>
        </div>
      }
      dontText="Red text beside a bare input: nothing marks the input invalid or reads the message."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [bound, bare] = canvas.getAllByRole("textbox", { name: "Owner" });
    await expect(bound).toHaveAttribute("aria-invalid", "true");
    await expect(bound).toHaveAccessibleDescription("Choose a person who is on the program.");
    await expect(bare).not.toHaveAttribute("aria-invalid", "true");
    await expect(bare).toHaveAccessibleDescription("");
  },
};
