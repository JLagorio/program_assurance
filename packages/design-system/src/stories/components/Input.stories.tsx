import { revalidateLogic, useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Field as BaseField } from "@base-ui/react/field";
import { useId, useRef, useState } from "react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import {
  FieldLabel,
  FieldDescription,
  FieldError,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Button,
  Field,
  Input,
  InputGroup,
} from "../../components";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";
import { Grid as GridPrimitive, Inline, Stack } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: { layout: "padded" },
  args: { defaultValue: "Atlas payments platform" },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

const states = ["rest", "filled", "invalid", "disabled", "read-only"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  ...(s === "rest"
    ? { placeholder: "Atlas payments platform" }
    : { defaultValue: "Atlas payments platform" }),
  ...(s === "invalid" ? { "aria-invalid": true } : {}),
  ...(s === "disabled" ? { disabled: true } : {}),
  ...(s === "read-only" ? { readOnly: true } : {}),
});

/** Every state down the side; bare, inside a Field, and inside an InputGroup across. */
export const InputMatrix: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Grid
        rows={states}
        cols={["bare", "in a Field", "in an InputGroup"] as const}
        rowLabel="state"
        render={(state, col) => {
          const fieldError1 = state === "invalid" ? "Required." : undefined;
          const fieldHint1 =
            state === "invalid" ? undefined : "As it appears on the authorization package.";
          return (
            <div style={{ width: 240 }}>
              {col === "bare" ? (
                <Input aria-label="Program name" {...stateProps(state)} />
              ) : col === "in a Field" ? (
                <Field data-invalid={Boolean(fieldError1)}>
                  <FieldLabel
                    id={`${fieldId}-program-name-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-label`}
                    htmlFor={`${fieldId}-program-name-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}`}
                  >
                    {"Program name"}
                    <span aria-hidden="true" className="text-danger">
                      {" "}
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-program-name-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}`}
                    aria-labelledby={`${fieldId}-program-name-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-label`}
                    aria-required={true}
                    aria-invalid={Boolean(fieldError1)}
                    aria-describedby={
                      fieldError1 || fieldHint1
                        ? `${fieldId}-program-name-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-message`
                        : undefined
                    }
                    {...stateProps(state)}
                  />
                  {Boolean(fieldError1) ? (
                    <FieldError
                      id={`${fieldId}-program-name-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-message`}
                    >
                      {fieldError1}
                    </FieldError>
                  ) : fieldHint1 ? (
                    <FieldDescription
                      id={`${fieldId}-program-name-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-message`}
                    >
                      {fieldHint1}
                    </FieldDescription>
                  ) : null}
                </Field>
              ) : (
                <InputGroup>
                  <InputGroupInput {...stateProps(state)} placeholder="Search controls" />
                  <InputGroupAddon>{<Search />}</InputGroupAddon>
                </InputGroup>
              )}
            </div>
          );
        }}
      />
    );
  },
};

function FormDemo() {
  const fieldId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm({
    defaultValues: { name: "", owner: "", acronym: "ATLAS" },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: {
      onDynamic: z.object({
        name: z.string().trim().min(1, "Required."),
        owner: z.string().trim().min(1, "Required."),
        acronym: z.string().max(8),
      }),
    },
    onSubmitInvalid: () =>
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      ),
    onSubmit: () => setSaved(true),
  });
  const fields = [
    {
      name: "name",
      label: "Program name",
      hint: "As it appears on the authorization package.",
      required: true,
    },
    { name: "owner", label: "Owner", hint: undefined, required: true },
    {
      name: "acronym",
      label: "Acronym",
      hint: "Up to eight characters. Shown in the side nav and on badges.",
      required: false,
    },
  ] as const;
  return (
    <form
      ref={formRef}
      aria-label="Create program"
      noValidate
      style={{ width: "100%", maxWidth: 360 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        void form.handleSubmit();
      }}
    >
      <Stack space="space.200">
        {fields.map(({ name, label, hint, required }) => (
          <form.Field key={name} name={name}>
            {(field) => {
              const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const id = `${fieldId}-${name}`;
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={id}>
                    {label}
                    {required && (
                      <span aria-hidden className="text-danger">
                        {" "}
                        *
                      </span>
                    )}
                  </FieldLabel>
                  <Input
                    id={id}
                    name={field.name}
                    required={required}
                    maxLength={name === "acronym" ? 8 : undefined}
                    placeholder={name === "owner" ? "first.last@example.mil" : undefined}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={invalid}
                    aria-describedby={invalid || hint ? `${id}-message` : undefined}
                  />
                  {invalid ? (
                    <FieldError id={`${id}-message`} errors={field.state.meta.errors} />
                  ) : hint ? (
                    <FieldDescription id={`${id}-message`}>{hint}</FieldDescription>
                  ) : null}
                </Field>
              );
            }}
          </form.Field>
        ))}
        <Inline space="space.100" alignInline="end">
          <Button
            type="button"
            variant="subtle"
            onClick={() => {
              form.reset();
              setSaved(false);
            }}
          >
            Reset
          </Button>
          <Button type="submit" variant="primary">
            Create program
          </Button>
        </Inline>
        {saved && <p role="status">Program created for this example.</p>}
      </Stack>
    </form>
  );
}

/** Inside a Field with a label, a hint and, on submit, the error. Press Create with a field empty. */
export const InField: Story = {
  render: () => <FormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByRole("textbox", { name: "Program name" });
    const owner = canvas.getByRole("textbox", { name: "Owner" });
    await userEvent.click(canvas.getByRole("button", { name: "Create program" }));
    await waitFor(() => expect(name).toHaveFocus());
    await expect(name).toHaveAccessibleDescription("Required.");
    await expect(owner).toHaveAttribute("aria-invalid", "true");
    await userEvent.type(name, "Atlas");
    await waitFor(() => expect(name).not.toHaveAttribute("aria-invalid", "true"));
    await userEvent.type(owner, "alice@example.test{Enter}");
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Program created"));
    const data = new FormData(
      canvas.getByRole("form", { name: "Create program" }) as HTMLFormElement,
    );
    await expect(data.get("name")).toBe("Atlas");
    await expect(data.get("acronym")).toBe("ATLAS");
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await expect(name).toHaveValue("");
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
    await expect(canvas.queryByRole("status")).toBeNull();
  },
};

/** The width says how long the answer is. The layout sets it; the Input fills what it is given. */
export const Widths: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <GridPrimitive
        templateColumns="repeat(6, minmax(0, 1fr))"
        columnGap="space.200"
        rowGap="space.200"
      >
        <div style={{ gridColumn: "span 1" }}>
          <Field>
            <FieldLabel id={`${fieldId}-acronym-5-label`} htmlFor={`${fieldId}-acronym-5`}>
              {"Acronym"}
            </FieldLabel>
            <Input
              id={`${fieldId}-acronym-5`}
              aria-labelledby={`${fieldId}-acronym-5-label`}
              defaultValue="ATLAS"
            />
          </Field>
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <Field>
            <FieldLabel id={`${fieldId}-owner-6-label`} htmlFor={`${fieldId}-owner-6`}>
              {"Owner"}
            </FieldLabel>
            <Input
              id={`${fieldId}-owner-6`}
              aria-labelledby={`${fieldId}-owner-6-label`}
              defaultValue="Grace Hoppel"
            />
          </Field>
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <Field>
            <FieldLabel id={`${fieldId}-system-7-label`} htmlFor={`${fieldId}-system-7`}>
              {"System"}
            </FieldLabel>
            <Input
              id={`${fieldId}-system-7`}
              aria-labelledby={`${fieldId}-system-7-label`}
              defaultValue="Cardholder and settlement processing for the Atlas platform"
            />
          </Field>
        </div>
      </GridPrimitive>
    );
  },
};

/** The `type` and the input mode come from the value; the icon, unit or shortcut at either end from an InputGroup. */
export const Kinds: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Stack space="space.300">
        <Specimens title="type and inputMode">
          <div style={{ width: 240 }}>
            <Field>
              <FieldLabel id={`${fieldId}-email-8-label`} htmlFor={`${fieldId}-email-8`}>
                {"Email"}
              </FieldLabel>
              <Input
                id={`${fieldId}-email-8`}
                aria-labelledby={`${fieldId}-email-8-label`}
                aria-describedby={`${fieldId}-email-8-message`}
                type="email"
                inputMode="email"
                defaultValue="grace.hoppel@example.mil"
              />
              <FieldDescription id={`${fieldId}-email-8-message`}>
                {"Where the decision is sent."}
              </FieldDescription>
            </Field>
          </div>
          <div style={{ width: 160 }}>
            <Field>
              <FieldLabel id={`${fieldId}-retention-9-label`} htmlFor={`${fieldId}-retention-9`}>
                {"Retention"}
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={`${fieldId}-retention-9`}
                  aria-labelledby={`${fieldId}-retention-9-label`}
                  type="number"
                  inputMode="numeric"
                  defaultValue="90"
                  min={0}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>{"days"}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </div>
        </Specimens>
        <Specimens title="an InputGroup at either end">
          <div style={{ width: 280 }}>
            <InputGroup>
              <InputGroupInput placeholder="Search risks, controls, evidence…" />
              <InputGroupAddon>{<Search />}</InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupText>{"⌘K"}</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </Specimens>
        <Specimens title="read-only: a value shown in the form's grid that cannot be edited here">
          <div style={{ width: 200 }}>
            <Field>
              <FieldLabel
                id={`${fieldId}-program-id-10-label`}
                htmlFor={`${fieldId}-program-id-10`}
              >
                {"Program ID"}
              </FieldLabel>
              <Input
                id={`${fieldId}-program-id-10`}
                aria-labelledby={`${fieldId}-program-id-10-label`}
                readOnly
                defaultValue="PRG-1041"
              />
            </Field>
          </div>
        </Specimens>
      </Stack>
    );
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
            <div style={{ width: 240 }}>
              <Field>
                <FieldLabel id={`${fieldId}-owner-11-label`} htmlFor={`${fieldId}-owner-11`}>
                  {"Owner"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-owner-11`}
                  aria-labelledby={`${fieldId}-owner-11-label`}
                  placeholder="first.last@example.mil"
                />
              </Field>
            </div>
          }
          doText="The label names the field; the placeholder shows the format and goes away."
          dont={
            <div style={{ width: 240 }}>
              <Input placeholder="Owner" />
            </div>
          }
          dontText="The placeholder is the label. It vanishes on the first keystroke and is never read as a name."
        />
        <Pair
          do={
            <div style={{ width: 240 }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-program-name-12-label`}
                  htmlFor={`${fieldId}-program-name-12`}
                >
                  {"Program name"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-program-name-12`}
                  aria-labelledby={`${fieldId}-program-name-12-label`}
                />
              </Field>
            </div>
          }
          doText="A noun, sentence case, no colon."
          dont={
            <div style={{ width: 240 }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-enter-the-program-name-13-label`}
                  htmlFor={`${fieldId}-enter-the-program-name-13`}
                >
                  {"Enter the Program Name:"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-enter-the-program-name-13`}
                  aria-labelledby={`${fieldId}-enter-the-program-name-13-label`}
                />
              </Field>
            </div>
          }
          dontText="An instruction with a colon and title case. The form is not talking; it is labelling."
        />
        <Pair
          do={
            <div style={{ width: 240 }}>
              <Field data-invalid={Boolean("Choose a person who is on the program.")}>
                <FieldLabel id={`${fieldId}-owner-14-label`} htmlFor={`${fieldId}-owner-14`}>
                  {"Owner"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-owner-14`}
                  aria-labelledby={`${fieldId}-owner-14-label`}
                  aria-invalid={Boolean("Choose a person who is on the program.")}
                  aria-describedby={`${fieldId}-owner-14-message`}
                  defaultValue="j.doe"
                />
                {Boolean("Choose a person who is on the program.") ? (
                  <FieldError id={`${fieldId}-owner-14-message`}>
                    {"Choose a person who is on the program."}
                  </FieldError>
                ) : null}
              </Field>
            </div>
          }
          doText="The error says what is wrong and what fixes it."
          dont={
            <div style={{ width: 240 }}>
              <Field data-invalid={Boolean("Invalid input")}>
                <FieldLabel id={`${fieldId}-owner-15-label`} htmlFor={`${fieldId}-owner-15`}>
                  {"Owner"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-owner-15`}
                  aria-labelledby={`${fieldId}-owner-15-label`}
                  aria-invalid={Boolean("Invalid input")}
                  aria-describedby={`${fieldId}-owner-15-message`}
                  defaultValue="j.doe"
                />
                {Boolean("Invalid input") ? (
                  <FieldError id={`${fieldId}-owner-15-message`}>{"Invalid input"}</FieldError>
                ) : null}
              </Field>
            </div>
          }
          dontText="The reader knows it is invalid; the red border said so. They need to know why."
        />
        <Pair
          do={
            <div style={{ width: 120 }}>
              <Field>
                <FieldLabel id={`${fieldId}-acronym-16-label`} htmlFor={`${fieldId}-acronym-16`}>
                  {"Acronym"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-acronym-16`}
                  aria-labelledby={`${fieldId}-acronym-16-label`}
                  defaultValue="ATLAS"
                />
              </Field>
            </div>
          }
          doText="Eight characters get a field eight characters wide."
          dont={
            <div style={{ width: 480 }}>
              <Field>
                <FieldLabel id={`${fieldId}-acronym-17-label`} htmlFor={`${fieldId}-acronym-17`}>
                  {"Acronym"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-acronym-17`}
                  aria-labelledby={`${fieldId}-acronym-17-label`}
                  defaultValue="ATLAS"
                />
              </Field>
            </div>
          }
          dontText="A field the width of the page for a five-letter answer. The width lies about the answer."
        />
      </Stack>
    );
  },
};

export const Playground: Story = {
  render: function FieldExample(args) {
    const fieldId = useId();
    return (
      <Field>
        <FieldLabel id={`${fieldId}-program-name-18-label`} htmlFor={`${fieldId}-program-name-18`}>
          {"Program name"}
        </FieldLabel>
        <Input
          id={`${fieldId}-program-name-18`}
          aria-labelledby={`${fieldId}-program-name-18-label`}
          {...args}
        />
      </Field>
    );
  },
};

/** A native form and Base UI Field, including a cancellable controlled value. */
export const NativeComposition: Story = {
  render: function NativeInputExample() {
    const [account, setAccount] = useState("atlas");
    const ref = useRef<HTMLInputElement>(null);
    return (
      <form
        className="w-layout-list max-w-full"
        onSubmit={(event) => event.preventDefault()}
        onReset={() => setAccount("atlas")}
      >
        <Stack space="space.150">
          <BaseField.Root>
            <BaseField.Label>Account handle</BaseField.Label>
            <Input
              ref={ref}
              name="account"
              value={account}
              render={<input data-testid="native-account" />}
              className={(state) => (state.focused ? "text-brand" : undefined)}
              onValueChange={(value, details) => {
                if (value.includes("!")) {
                  details.cancel();
                  return;
                }
                setAccount(value);
              }}
            />
            <BaseField.Description>Exclamation marks are not accepted.</BaseField.Description>
          </BaseField.Root>
          <Inline>
            <Button onClick={() => ref.current?.focus()}>Edit account</Button>
            <Button type="reset">Reset account</Button>
          </Inline>
        </Stack>
      </form>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Account handle" });
    await expect(input).toHaveAttribute("data-testid", "native-account");
    await expect(input).toHaveAccessibleDescription("Exclamation marks are not accepted.");
    await userEvent.click(canvas.getByRole("button", { name: "Edit account" }));
    await expect(input).toHaveFocus();
    await userEvent.type(input, "!");
    await expect(input).toHaveValue("atlas");
    await userEvent.clear(input);
    await userEvent.type(input, "ledger");
    await expect(new FormData(canvasElement.querySelector("form")!).get("account")).toBe("ledger");
    await userEvent.click(canvas.getByRole("button", { name: "Reset account" }));
    await expect(input).toHaveValue("atlas");
  },
};
