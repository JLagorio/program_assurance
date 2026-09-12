import { useId, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useForm } from "@tanstack/react-form";

import {
  Button,
  Card,
  CardContent,
  Checkbox,
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
  Switch,
} from "../../components";

const meta = {
  title: "Components/Field",
  component: Field,
  parameters: { layout: "padded" },
  args: { orientation: "vertical" },
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Example(args) {
    const id = useId();
    return (
      <Field {...args} className="w-layout-list max-w-full">
        <FieldLabel htmlFor={id}>Owner</FieldLabel>
        <Input id={id} aria-describedby={`${id}-help`} defaultValue="Dana Whitlock" />
        <FieldDescription id={`${id}-help`}>
          The person who answers for this record.
        </FieldDescription>
      </Field>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Owner" });
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
  const id = useId();
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
          {(field) => {
            const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={id}>
                  Owner
                  <span aria-hidden className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <div data-testid="control-wrapper">
                  <Input
                    ref={inputRef}
                    id={id}
                    name={field.name}
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    onBlur={field.handleBlur}
                    aria-required
                    aria-invalid={invalid}
                    aria-describedby={`${id}-message`}
                  />
                </div>
                {invalid ? (
                  <FieldError id={`${id}-message`} errors={field.state.meta.errors} />
                ) : (
                  <FieldDescription id={`${id}-message`}>Use the full name.</FieldDescription>
                )}
              </Field>
            );
          }}
        </form.Field>
        <Button type="submit">Assign owner</Button>
        {saved && <p role="status">{saved}</p>}
      </FieldGroup>
    </form>
  );
}

/** TanStack owns validation; native IDs work through structural wrappers and across instances. */
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
    await userEvent.click(canvas.getAllByRole("button", { name: "Assign owner" })[0]!);
    await expect(inputs[0]!).toHaveFocus();
    await expect(inputs[0]!).toHaveAttribute("aria-invalid", "true");
    await expect(inputs[0]!).toHaveAccessibleDescription("Enter an owner.");
    const invalidLabel = canvasElement.querySelector(`label[for="${inputs[0]!.id}"]`)!;
    await waitFor(() =>
      expect(getComputedStyle(invalidLabel).color).toBe(
        getComputedStyle(canvas.getByRole("alert")).color,
      ),
    );
    const invalidBorder = getComputedStyle(inputs[0]!)
      .getPropertyValue("--ds-color-border-danger")
      .trim();
    await waitFor(() => expect(getComputedStyle(inputs[0]!).borderColor).toBe(invalidBorder));
    await userEvent.tab();
    await waitFor(() => expect(getComputedStyle(inputs[0]!).borderColor).toBe(invalidBorder));
    await expect(inputs[1]!).not.toHaveAttribute("aria-invalid", "true");
    await userEvent.type(inputs[0]!, "Dana Whitlock");
    await userEvent.click(canvas.getAllByRole("button", { name: "Assign owner" })[0]!);
    await expect(canvas.getByRole("status")).toHaveTextContent("Assigned to Dana Whitlock.");
    await expect(inputs[0]!).not.toHaveAttribute("aria-invalid", "true");
  },
};

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
    await expect(canvas.getAllByRole("alert")).toHaveLength(2);
    await expect(canvas.getAllByRole("listitem")).toHaveLength(2);
    await expect(canvas.queryByText("Unused fallback.")).not.toBeInTheDocument();
  },
};
