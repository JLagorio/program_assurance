import { revalidateLogic, useForm } from "@tanstack/react-form";
import { z } from "zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useId, useRef, useState } from "react";

import {
  FieldLabel,
  FieldDescription,
  FieldError,
  Button,
  Field,
  Input,
  Textarea,
} from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: { layout: "padded" },
  args: {
    defaultValue: "Terrain-following radar and collision avoidance for the rotary-wing fleet.",
    rows: 3,
  },
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

const value = "Terrain-following radar and collision avoidance for the rotary-wing fleet.";
const states = ["rest", "filled", "invalid", "disabled", "read-only"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  ...(s === "rest" ? { placeholder: "What it does for the mission." } : { defaultValue: value }),
  ...(s === "invalid" ? { "aria-invalid": true } : {}),
  ...(s === "disabled" ? { disabled: true } : {}),
  ...(s === "read-only" ? { readOnly: true } : {}),
});

/** Every state down the side; bare and inside a Field across. */
export const TextareaMatrix: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Grid
        rows={states}
        cols={["bare", "in a Field"] as const}
        rowLabel="state"
        render={(state, col) => {
          const fieldError1 = state === "invalid" ? "Required." : undefined;
          const fieldHint1 =
            state === "invalid"
              ? undefined
              : "What it does for the mission, in one or two sentences.";
          return (
            <div style={{ width: 280 }}>
              {col === "bare" ? (
                <Textarea aria-label="Function" rows={3} {...stateProps(state)} />
              ) : (
                <Field data-invalid={Boolean(fieldError1)}>
                  <FieldLabel
                    id={`${fieldId}-function-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-label`}
                    htmlFor={`${fieldId}-function-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}`}
                  >
                    {"Function"}
                    <span aria-hidden="true" className="text-danger">
                      {" "}
                      *
                    </span>
                  </FieldLabel>
                  <Textarea
                    id={`${fieldId}-function-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}`}
                    aria-labelledby={`${fieldId}-function-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-label`}
                    aria-required={true}
                    aria-invalid={Boolean(fieldError1)}
                    aria-describedby={
                      fieldError1 || fieldHint1
                        ? `${fieldId}-function-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-message`
                        : undefined
                    }
                    rows={3}
                    {...stateProps(state)}
                  />
                  {Boolean(fieldError1) ? (
                    <FieldError
                      id={`${fieldId}-function-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-message`}
                    >
                      {fieldError1}
                    </FieldError>
                  ) : fieldHint1 ? (
                    <FieldDescription
                      id={`${fieldId}-function-1-${encodeURIComponent(String(state))}-${encodeURIComponent(String(col))}-message`}
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

/** `rows` says how long an answer is expected: two for a note, four for a description, eight for a narrative. The reader can drag any of them taller. */
export const Rows: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Inline space="space.300" alignBlock="start">
        <div style={{ width: 260 }}>
          <Field>
            <FieldLabel id={`${fieldId}-note-2-label`} htmlFor={`${fieldId}-note-2`}>
              {"Note"}
            </FieldLabel>
            <Textarea
              id={`${fieldId}-note-2`}
              aria-labelledby={`${fieldId}-note-2-label`}
              aria-describedby={`${fieldId}-note-2-message`}
              rows={2}
              placeholder="Re-checked after the patch window."
            />
            <FieldDescription id={`${fieldId}-note-2-message`}>
              {"One or two lines for the next reader."}
            </FieldDescription>
          </Field>
        </div>
        <div style={{ width: 260 }}>
          <Field>
            <FieldLabel id={`${fieldId}-function-3-label`} htmlFor={`${fieldId}-function-3`}>
              {"Function"}
            </FieldLabel>
            <Textarea
              id={`${fieldId}-function-3`}
              aria-labelledby={`${fieldId}-function-3-label`}
              aria-describedby={`${fieldId}-function-3-message`}
              rows={4}
              defaultValue={value}
            />
            <FieldDescription id={`${fieldId}-function-3-message`}>
              {"What it does for the mission."}
            </FieldDescription>
          </Field>
        </div>
        <div style={{ width: 300 }}>
          <Field>
            <FieldLabel
              id={`${fieldId}-implementation-statement-4-label`}
              htmlFor={`${fieldId}-implementation-statement-4`}
            >
              {"Implementation statement"}
            </FieldLabel>
            <Textarea
              id={`${fieldId}-implementation-statement-4`}
              aria-labelledby={`${fieldId}-implementation-statement-4-label`}
              aria-describedby={`${fieldId}-implementation-statement-4-message`}
              rows={8}
              maxLength={2000}
              defaultValue="Access to the radar processing segment is restricted to the flight-software role. Accounts are provisioned through the program's identity service, reviewed quarterly by the ISSO, and removed within one business day of a role change. The review record is attached as evidence."
            />
            <FieldDescription id={`${fieldId}-implementation-statement-4-message`}>
              {
                "How this system satisfies the control, in terms an assessor can verify. Up to 2,000 characters."
              }
            </FieldDescription>
          </Field>
        </div>
      </Inline>
    );
  },
};

function FormDemo() {
  const fieldId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState(false);
  const form = useForm({
    defaultValues: { statement: "", note: "" },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: {
      onDynamic: z.object({ statement: z.string().trim().min(1, "Required."), note: z.string() }),
    },
    onSubmitInvalid: () =>
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      ),
    onSubmit: () => setSaved(true),
  });
  return (
    <form
      ref={formRef}
      aria-label="Save statement"
      noValidate
      style={{ width: "100%", maxWidth: 420 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        void form.handleSubmit();
      }}
    >
      <Stack space="space.200">
        {(["statement", "note"] as const).map((name) => (
          <form.Field key={name} name={name}>
            {(field) => {
              const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
              const id = `${fieldId}-${name}`;
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={id}>
                    {name === "statement" ? (
                      <>
                        Implementation statement
                        <span aria-hidden className="text-danger">
                          {" "}
                          *
                        </span>
                      </>
                    ) : (
                      "Note"
                    )}
                  </FieldLabel>
                  <Textarea
                    id={id}
                    name={field.name}
                    required={name === "statement"}
                    rows={name === "statement" ? 5 : 2}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={invalid}
                    aria-describedby={`${id}-message`}
                  />
                  {invalid ? (
                    <FieldError id={`${id}-message`} errors={field.state.meta.errors} />
                  ) : (
                    <FieldDescription id={`${id}-message`}>
                      {name === "statement"
                        ? "How this system satisfies the control, in terms an assessor can verify."
                        : "Optional. For the next assessor, not the record."}
                    </FieldDescription>
                  )}
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
            Save statement
          </Button>
        </Inline>
        {saved && <p role="status">Statement saved for this example.</p>}
      </Stack>
    </form>
  );
}

/** Inside a Field with a label, a hint and, on submit, the error. Press Save with the statement empty. */
export const InField: Story = {
  render: () => <FormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const statement = canvas.getByRole("textbox", { name: "Implementation statement" });
    await userEvent.click(canvas.getByRole("button", { name: "Save statement" }));
    await waitFor(() => expect(statement).toHaveFocus());
    await expect(statement).toHaveAccessibleDescription("Required.");
    await userEvent.type(statement, "Encrypt data.{Enter}Rotate keys.");
    await waitFor(() => expect(statement).not.toHaveAttribute("aria-invalid", "true"));
    await expect(statement).toHaveValue("Encrypt data.\nRotate keys.");
    await expect(canvas.queryByRole("status")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Save statement" }));
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Statement saved"));
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await expect(statement).toHaveValue("");
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
    await expect(canvas.queryByRole("status")).toBeNull();
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
            <div style={{ width: 260 }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-program-name-7-label`}
                  htmlFor={`${fieldId}-program-name-7`}
                >
                  {"Program name"}
                </FieldLabel>
                <Input
                  id={`${fieldId}-program-name-7`}
                  aria-labelledby={`${fieldId}-program-name-7-label`}
                  defaultValue="Atlas payments platform"
                />
              </Field>
            </div>
          }
          doText="A one-line answer is an Input."
          dont={
            <div style={{ width: 260 }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-program-name-8-label`}
                  htmlFor={`${fieldId}-program-name-8`}
                >
                  {"Program name"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-program-name-8`}
                  aria-labelledby={`${fieldId}-program-name-8-label`}
                  rows={3}
                  defaultValue="Atlas payments platform"
                />
              </Field>
            </div>
          }
          dontText="Three rows for a name. The height invites an essay the store cannot hold."
        />
        <Pair
          do={
            <div style={{ width: 260 }}>
              <Field>
                <FieldLabel id={`${fieldId}-note-9-label`} htmlFor={`${fieldId}-note-9`}>
                  {"Note"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-note-9`}
                  aria-labelledby={`${fieldId}-note-9-label`}
                  rows={2}
                  placeholder="Re-checked after the patch window."
                />
              </Field>
            </div>
          }
          doText="Two rows for a note; the reader drags it taller when they need to."
          dont={
            <div style={{ width: 260 }}>
              <Field>
                <FieldLabel id={`${fieldId}-note-10-label`} htmlFor={`${fieldId}-note-10`}>
                  {"Note"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-note-10`}
                  aria-labelledby={`${fieldId}-note-10-label`}
                  rows={10}
                  placeholder="Re-checked after the patch window."
                />
              </Field>
            </div>
          }
          dontText="Ten rows for a note. The rows lie about the answer and push the form off the screen."
        />
        <Pair
          do={
            <div style={{ width: 300 }}>
              <Field>
                <FieldLabel id={`${fieldId}-function-11-label`} htmlFor={`${fieldId}-function-11`}>
                  {"Function"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-function-11`}
                  aria-labelledby={`${fieldId}-function-11-label`}
                  aria-describedby={`${fieldId}-function-11-message`}
                  rows={3}
                  placeholder="Terrain-following radar and collision avoidance."
                />
                <FieldDescription id={`${fieldId}-function-11-message`}>
                  {"What it does for the mission, in one or two sentences."}
                </FieldDescription>
              </Field>
            </div>
          }
          doText="The hint carries the guidance; the placeholder is one example that goes away."
          dont={
            <div style={{ width: 300 }}>
              <Field>
                <FieldLabel id={`${fieldId}-function-12-label`} htmlFor={`${fieldId}-function-12`}>
                  {"Function"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-function-12`}
                  aria-labelledby={`${fieldId}-function-12-label`}
                  rows={3}
                  placeholder="Describe in detail what the system does, who operates it, and which mission threads depend on it. Be specific."
                />
              </Field>
            </div>
          }
          dontText="The instructions are in the placeholder. They vanish on the first keystroke."
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
        <FieldLabel
          id={`${fieldId}-assessment-notes-13-label`}
          htmlFor={`${fieldId}-assessment-notes-13`}
        >
          {"Assessment notes"}
        </FieldLabel>
        <Textarea
          id={`${fieldId}-assessment-notes-13`}
          aria-labelledby={`${fieldId}-assessment-notes-13-label`}
          {...args}
        />
      </Field>
    );
  },
};
