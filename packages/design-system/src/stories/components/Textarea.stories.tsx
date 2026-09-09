import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";

import {
  FieldLabel,
  FieldDescription,
  FieldError,
  Button,
  Field,
  Input,
  Textarea,
  useRequired,
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

  const [statement, setStatement] = useState("");
  const [note, setNote] = useState("");
  const req = useRequired({ statement });
  const fieldError5 = req.errorFor("statement");
  return (
    <div style={{ width: 420 }}>
      <Stack space="space.200">
        <Field data-invalid={Boolean(fieldError5)}>
          <FieldLabel
            id={`${fieldId}-implementation-statement-5-label`}
            htmlFor={`${fieldId}-implementation-statement-5`}
          >
            {"Implementation statement"}
            <span aria-hidden="true" className="text-danger">
              {" "}
              *
            </span>
          </FieldLabel>
          <Textarea
            id={`${fieldId}-implementation-statement-5`}
            aria-labelledby={`${fieldId}-implementation-statement-5-label`}
            aria-required={true}
            aria-invalid={Boolean(fieldError5)}
            aria-describedby={`${fieldId}-implementation-statement-5-message`}
            rows={5}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
          />
          {Boolean(fieldError5) ? (
            <FieldError id={`${fieldId}-implementation-statement-5-message`}>
              {fieldError5}
            </FieldError>
          ) : (
            <FieldDescription id={`${fieldId}-implementation-statement-5-message`}>
              {"How this system satisfies the control, in terms an assessor can verify."}
            </FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel id={`${fieldId}-note-6-label`} htmlFor={`${fieldId}-note-6`}>
            {"Note"}
          </FieldLabel>
          <Textarea
            id={`${fieldId}-note-6`}
            aria-labelledby={`${fieldId}-note-6-label`}
            aria-describedby={`${fieldId}-note-6-message`}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <FieldDescription id={`${fieldId}-note-6-message`}>
            {"Optional. For the next assessor, not the record."}
          </FieldDescription>
        </Field>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary" onClick={() => req.check()}>
            Save statement
          </Button>
        </Inline>
      </Stack>
    </div>
  );
}

/** Inside a Field with a label, a hint and, on submit, the error. Press Save with the statement empty. */
export const InField: Story = { render: () => <FormDemo /> };

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
