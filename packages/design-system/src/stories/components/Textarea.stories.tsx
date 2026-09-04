import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Field, Input, Textarea, useRequired } from "../../components";
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
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "in a Field"] as const}
      rowLabel="state"
      render={(state, col) => (
        <div style={{ width: 280 }}>
          {col === "bare" ? (
            <Textarea aria-label="Function" rows={3} {...stateProps(state)} />
          ) : (
            <Field
              label="Function"
              isRequired
              hint={
                state === "invalid"
                  ? undefined
                  : "What it does for the mission, in one or two sentences."
              }
              error={state === "invalid" ? "Required." : undefined}
            >
              <Textarea rows={3} {...stateProps(state)} />
            </Field>
          )}
        </div>
      )}
    />
  ),
};

/** `rows` says how long an answer is expected: two for a note, four for a description, eight for a narrative. The reader can drag any of them taller. */
export const Rows: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start">
      <div style={{ width: 260 }}>
        <Field label="Note" hint="One or two lines for the next reader.">
          <Textarea rows={2} placeholder="Re-checked after the patch window." />
        </Field>
      </div>
      <div style={{ width: 260 }}>
        <Field label="Function" hint="What it does for the mission.">
          <Textarea rows={4} defaultValue={value} />
        </Field>
      </div>
      <div style={{ width: 300 }}>
        <Field
          label="Implementation statement"
          hint="How this system satisfies the control, in terms an assessor can verify. Up to 2,000 characters."
        >
          <Textarea
            rows={8}
            maxLength={2000}
            defaultValue="Access to the radar processing segment is restricted to the flight-software role. Accounts are provisioned through the program's identity service, reviewed quarterly by the ISSO, and removed within one business day of a role change. The review record is attached as evidence."
          />
        </Field>
      </div>
    </Inline>
  ),
};

function FormDemo() {
  const [statement, setStatement] = useState("");
  const [note, setNote] = useState("");
  const req = useRequired({ statement });
  return (
    <div style={{ width: 420 }}>
      <Stack space="space.200">
        <Field
          label="Implementation statement"
          isRequired
          hint="How this system satisfies the control, in terms an assessor can verify."
          error={req.errorFor("statement")}
        >
          <Textarea rows={5} value={statement} onChange={(e) => setStatement(e.target.value)} />
        </Field>
        <Field label="Note" hint="Optional. For the next assessor, not the record.">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
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
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div style={{ width: 260 }}>
            <Field label="Program name">
              <Input defaultValue="Atlas payments platform" />
            </Field>
          </div>
        }
        doText="A one-line answer is an Input."
        dont={
          <div style={{ width: 260 }}>
            <Field label="Program name">
              <Textarea rows={3} defaultValue="Atlas payments platform" />
            </Field>
          </div>
        }
        dontText="Three rows for a name. The height invites an essay the store cannot hold."
      />
      <Pair
        do={
          <div style={{ width: 260 }}>
            <Field label="Note">
              <Textarea rows={2} placeholder="Re-checked after the patch window." />
            </Field>
          </div>
        }
        doText="Two rows for a note; the reader drags it taller when they need to."
        dont={
          <div style={{ width: 260 }}>
            <Field label="Note">
              <Textarea rows={10} placeholder="Re-checked after the patch window." />
            </Field>
          </div>
        }
        dontText="Ten rows for a note. The rows lie about the answer and push the form off the screen."
      />
      <Pair
        do={
          <div style={{ width: 300 }}>
            <Field label="Function" hint="What it does for the mission, in one or two sentences.">
              <Textarea rows={3} placeholder="Terrain-following radar and collision avoidance." />
            </Field>
          </div>
        }
        doText="The hint carries the guidance; the placeholder is one example that goes away."
        dont={
          <div style={{ width: 300 }}>
            <Field label="Function">
              <Textarea
                rows={3}
                placeholder="Describe in detail what the system does, who operates it, and which mission threads depend on it. Be specific."
              />
            </Field>
          </div>
        }
        dontText="The instructions are in the placeholder. They vanish on the first keystroke."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
