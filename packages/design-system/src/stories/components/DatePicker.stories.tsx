import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Calendar, DatePicker, Field, Input, useRequired } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  parameters: { layout: "padded" },
  args: { "aria-label": "Scheduled completion", defaultValue: "2026-09-18" },
} satisfies Meta<typeof DatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

const states = ["rest", "filled", "invalid", "disabled"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  ...(s === "rest" ? {} : { defaultValue: "2026-09-18" }),
  ...(s === "disabled" ? { disabled: true } : {}),
});

/** Every state down the side; bare and inside a Field across. Open one to see the month. */
export const DatePickerMatrix: Story = {
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "in a Field"] as const}
      rowLabel="state"
      render={(state, col) => (
        <div style={{ width: 220 }}>
          {col === "bare" ? (
            <DatePicker
              aria-label="Scheduled completion"
              {...stateProps(state)}
              {...(state === "invalid" ? { "aria-invalid": true } : {})}
            />
          ) : (
            <Field
              label="Scheduled completion"
              isRequired
              hint={state === "invalid" ? undefined : "When the milestone is due."}
              error={state === "invalid" ? "Required." : undefined}
            >
              <DatePicker {...stateProps(state)} />
            </Field>
          )}
        </div>
      )}
    />
  ),
};

/** The month open: today in bold, the chosen day filled, Today and Clear under the grid. */
export const Open: Story = {
  render: () => (
    <div style={{ width: 220, height: 420 }}>
      <Field label="Scheduled completion">
        <DatePicker defaultValue="2026-09-18" defaultOpen />
      </Field>
    </div>
  ),
};

function FormDemo() {
  const [scheduled, setScheduled] = useState("");
  const [target, setTarget] = useState("2026-10-02");
  const req = useRequired({ scheduled });
  return (
    <div style={{ width: 360 }}>
      <Stack space="space.200">
        <Field
          label="Scheduled completion"
          isRequired
          hint="When the milestone is due."
          error={req.errorFor("scheduled")}
        >
          <DatePicker value={scheduled} onChange={setScheduled} />
        </Field>
        <Field label="Target date" hint="Optional. Clear it if the target is not set.">
          <DatePicker value={target} onChange={setTarget} />
        </Field>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary" onClick={() => req.check()}>
            Save milestone
          </Button>
        </Inline>
      </Stack>
    </div>
  );
}

/** Inside a Field with a label, a hint and, on submit, the error. Press Save with the first date unchosen; clear the second from its month. */
export const InField: Story = { render: () => <FormDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div style={{ width: 220 }}>
            <Field label="Scheduled completion" hint="When the milestone is due.">
              <DatePicker />
            </Field>
          </div>
        }
        doText="The placeholder says what to do; the hint says what the date means."
        dont={
          <div style={{ width: 220 }}>
            <Field label="Scheduled completion">
              <DatePicker placeholder="MM/DD/YYYY" />
            </Field>
          </div>
        }
        dontText="A format as the placeholder. The reader cannot type here, and the field shows the day in words once chosen."
      />
      <Pair
        do={
          <div style={{ width: 220 }}>
            <Field label="Authorized" hint="Month and year, as on the ATO letter.">
              <Input placeholder="March 2024" />
            </Field>
          </div>
        }
        doText="An approximate or remembered date is typed, with the format in the hint."
        dont={
          <div style={{ width: 220 }}>
            <Field label="Authorized" hint="Month and year, as on the ATO letter.">
              <DatePicker />
            </Field>
          </div>
        }
        dontText="A month grid for a date the reader already knows. They page back thirty months to click one day."
      />
      <Pair
        do={
          <div style={{ width: 220 }}>
            <Field label="Scheduled completion">
              <DatePicker defaultValue="2026-09-18" />
            </Field>
          </div>
        }
        doText="One day in a form is a field: the month opens when asked."
        dont={
          <div style={{ width: 300 }}>
            <Field label="Scheduled completion">
              <Calendar
                mode="single"
                selected={new Date(2026, 8, 18)}
                defaultMonth={new Date(2026, 8, 1)}
              />
            </Field>
          </div>
        }
        dontText="A month grid inline in the form. It takes the room of six fields for one answer."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
