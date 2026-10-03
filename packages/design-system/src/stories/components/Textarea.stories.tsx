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
import { Inline, Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix: Grid } = storyLayout;
const { Pair } = pairLayout;

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
  tags: ["!manifest"],
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
                  {fieldError1 ? (
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

/** `rows` says how long an answer is expected: two for a note, four for a description, eight for a narrative. The box is that many lines tall, and the reader can drag any of them taller. */
export const Rows: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      <div style={{ width: 260 }}>
        <Field>
          <FieldLabel>Note</FieldLabel>
          <Textarea rows={2} placeholder="Re-checked after the patch window." />
          <FieldDescription>One or two lines for the next reader.</FieldDescription>
        </Field>
      </div>
      <div style={{ width: 260 }}>
        <Field>
          <FieldLabel>Function</FieldLabel>
          <Textarea rows={4} defaultValue={value} />
          <FieldDescription>What it does for the mission.</FieldDescription>
        </Field>
      </div>
      <div style={{ width: 300 }}>
        <Field>
          <FieldLabel>Implementation statement</FieldLabel>
          <Textarea
            rows={8}
            characterLimit={2000}
            defaultValue="Access to the radar processing segment is restricted to the flight-software role. Accounts are provisioned through the program's identity service, reviewed quarterly by the ISSO, and removed within one business day of a role change. The review record is attached as evidence."
          />
          <FieldDescription>
            How this system satisfies the control, in terms an assessor can verify.
          </FieldDescription>
        </Field>
      </div>
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const height = (name: string) =>
      canvas.getByRole("textbox", { name }).getBoundingClientRect().height;
    const line = parseFloat(
      getComputedStyle(canvas.getByRole("textbox", { name: "Note" })).lineHeight,
    );
    // Each extra row adds one line: the box's height follows `rows`, with no floor above it.
    await expect(height("Function") - height("Note")).toBeCloseTo(2 * line, 0);
    await expect(height("Implementation statement") - height("Function")).toBeCloseTo(4 * line, 0);
  },
};

/**
 * `autoResize` grows the box with its text, from `rows` lines to `maxRows`, where it starts to
 * scroll, so a long statement is read without dragging a corner. Type, or paste a paragraph.
 */
export const AutoResize: Story = {
  name: "Auto resize",
  render: () => (
    <div className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Rationale</FieldLabel>
        <Textarea autoResize rows={2} maxRows={6} />
        <FieldDescription>Why the control is tailored out, for the assessor.</FieldDescription>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("textbox", { name: "Rationale" });
    const line = parseFloat(getComputedStyle(box).lineHeight);
    const start = box.getBoundingClientRect().height;
    await expect(getComputedStyle(box).resize).toBe("none");
    await userEvent.click(box);
    await userEvent.keyboard("One{Enter}Two{Enter}Three{Enter}Four");
    await waitFor(() =>
      expect(box.getBoundingClientRect().height - start).toBeCloseTo(2 * line, 0),
    );
    await userEvent.keyboard("{Enter}Five{Enter}Six{Enter}Seven{Enter}Eight");
    // Six lines at most; the rest scrolls inside the box.
    await waitFor(() =>
      expect(box.getBoundingClientRect().height - start).toBeCloseTo(4 * line, 0),
    );
    await expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);
    await userEvent.clear(box);
    await waitFor(() => expect(box.getBoundingClientRect().height).toBeCloseTo(start, 0));
  },
};

const pasted =
  "Access to the radar processing segment is restricted to the flight-software role. Accounts are provisioned through the program's identity service and reviewed each quarter.";

/**
 * `characterLimit` is a soft limit: the count under the box says how many characters are left,
 * and past the limit how many too many, while the text stays whole. A paste longer than the limit
 * keeps its tail, turns the count and the edge to the danger colour, and fails native validation
 * with the count's words; the form's own check says what fixes it on submit.
 */
export const CharacterLimit: Story = {
  name: "Character limit",
  render: () => (
    <div className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Summary</FieldLabel>
        <Textarea rows={3} characterLimit={120} />
        <FieldDescription>One or two sentences for the register.</FieldDescription>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole<HTMLTextAreaElement>("textbox", { name: "Summary" });
    await expect(box).toHaveAccessibleDescription(
      "Up to 120 characters. 120 characters left One or two sentences for the register.",
    );
    await userEvent.click(box);
    await userEvent.paste(pasted);
    // Nothing is cut: the whole paste is kept.
    await expect(box).toHaveValue(pasted);
    const over = pasted.length - 120;
    const count = canvasElement.querySelector('[data-slot="textarea-count"]')!;
    await expect(count).toHaveTextContent(`${over} characters too many`);
    await expect(box).toHaveAttribute("data-over-limit");
    await expect(box.validity.customError).toBe(true);
    await expect(box.validationMessage).toBe(`${over} characters too many`);
    if (!matchMedia("(forced-colors: active)").matches) {
      const danger = getComputedStyle(box).getPropertyValue("--ds-color-border-danger").trim();
      await waitFor(() => expect(getComputedStyle(box).borderTopColor).toBe(danger));
    }
    await userEvent.clear(box);
    await userEvent.type(box, "Restricted to the flight-software role.");
    await expect(count).toHaveTextContent("81 characters left");
    await expect(box).not.toHaveAttribute("data-over-limit");
    await expect(box.validity.valid).toBe(true);
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
  tags: ["!manifest"],
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Stack space="space.400">
        <Pair
          do={
            <div style={{ maxWidth: 260 }}>
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
            <div style={{ maxWidth: 260 }}>
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
            <div style={{ maxWidth: 260 }}>
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
            <div style={{ maxWidth: 260 }}>
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
            <div style={{ maxWidth: 300 }}>
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
            <div style={{ maxWidth: 300 }}>
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

/**
 * Textarea is Base UI's Field.Control on a textarea, so a Field binds it as it binds Input: the
 * label, the hint and the error with no ids, and the Field's `invalid`, `required` and `disabled`.
 */
export const BoundInField: Story = {
  name: "Bound in a Field",
  render: () => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Field invalid required>
        <FieldLabel>Implementation statement</FieldLabel>
        <Textarea rows={3} />
        <FieldDescription>How the system meets the control.</FieldDescription>
        <FieldError>Describe how the system meets the control.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Previous statement</FieldLabel>
        <Textarea rows={2} defaultValue="Access is reviewed each quarter." />
      </Field>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const statement = canvas.getByRole("textbox", { name: "Implementation statement" });
    await expect(statement.tagName).toBe("TEXTAREA");
    await expect(statement).toHaveAttribute("data-slot", "textarea");
    await expect(statement).toHaveAttribute("aria-invalid", "true");
    await expect(statement).toHaveAttribute("aria-required", "true");
    await expect(statement).toHaveAccessibleDescription(
      "How the system meets the control. Describe how the system meets the control.",
    );
    await userEvent.type(statement, "Quarterly{Enter}review");
    await expect(statement).toHaveValue("Quarterly\nreview");
    await expect(canvas.getByRole("textbox", { name: "Previous statement" })).toBeDisabled();
  },
};

function InputApiExample() {
  const [note, setNote] = useState("");
  return (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Field>
        <FieldLabel>Reviewer note</FieldLabel>
        <Textarea
          rows={2}
          value={note}
          onValueChange={setNote}
          className={(state) => (state.focused ? "border-focused" : undefined)}
          style={(state) => (state.dirty ? { fontStyle: "italic" } : undefined)}
          render={<textarea data-testid="reviewer-note" />}
        />
      </Field>
      <Text>{note ? `${note.length} characters` : "No note yet"}</Text>
    </Stack>
  );
}

/**
 * Textarea takes Input's API: `onValueChange(value, details)` alongside the native `onChange`,
 * `render` for the element, and `className` and `style` as functions of the control's state.
 */
export const InputApi: Story = {
  name: "Input's API",
  render: () => <InputApiExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const note = canvas.getByRole("textbox", { name: "Reviewer note" });
    await expect(note).toBe(canvas.getByTestId("reviewer-note"));
    await expect(note).toHaveAttribute("data-slot", "textarea");
    await expect(note).toHaveAttribute("rows", "2");
    await expect(note).not.toHaveClass("border-focused");
    await userEvent.type(note, "Seen");
    await expect(note).toHaveValue("Seen");
    await expect(canvas.getByText("4 characters")).toBeVisible();
    await expect(note).toHaveClass("border-focused");
    await expect(note).toHaveStyle({ fontStyle: "italic" });
    await userEvent.tab();
    await expect(note).not.toHaveClass("border-focused");
  },
};
