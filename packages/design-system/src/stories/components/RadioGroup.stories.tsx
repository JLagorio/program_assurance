import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Field, NativeSelect, RadioGroup, useRequired } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const frequencies = ["Monthly", "Quarterly", "Annually"];

function Items({ description }: { description?: boolean }) {
  return (
    <>
      <RadioGroup.Item
        value="monthly"
        description={description ? "Twelve reviews a year; for a system in change." : undefined}
      >
        Monthly
      </RadioGroup.Item>
      <RadioGroup.Item
        value="quarterly"
        description={description ? "The program's default." : undefined}
      >
        Quarterly
      </RadioGroup.Item>
      <RadioGroup.Item
        value="annually"
        description={description ? "For a system that rarely changes." : undefined}
      >
        Annually
      </RadioGroup.Item>
    </>
  );
}

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  parameters: { layout: "padded" },
  args: { "aria-label": "Frequency", defaultValue: "quarterly", children: <Items /> },
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

// Disabled labels are exempt from contrast (WCAG 1.4.3, inactive components); axe cannot tell the
// Radix control beside them is disabled, so it measures color.text.disabled anyway.
const disabledLabels = {
  a11y: { config: { rules: [{ id: "color-contrast", selector: "*:not(label:has(:disabled) *)" }] } },
};

const states = ["none chosen", "chosen", "invalid", "disabled"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  value: s === "none chosen" ? "" : "quarterly",
  onValueChange: () => undefined,
  ...(s === "disabled" ? { disabled: true } : {}),
});

/** Every state down the side; bare, in a Field, and with descriptions across. */
export const RadioGroupMatrix: Story = {
  parameters: disabledLabels,
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "in a Field", "with descriptions"] as const}
      rowLabel="state"
      render={(state, col) =>
        col === "bare" ? (
          <RadioGroup
            aria-label="Frequency"
            {...stateProps(state)}
            {...(state === "invalid" ? { "aria-invalid": true } : {})}
          >
            <Items />
          </RadioGroup>
        ) : (
          <div style={{ width: 280 }}>
            <Field
              label="Frequency"
              isGroup
              isRequired
              hint={state === "invalid" ? undefined : "How often the control is reviewed."}
              error={state === "invalid" ? "Choose a frequency." : undefined}
            >
              <RadioGroup {...stateProps(state)}>
                <Items description={col === "with descriptions"} />
              </RadioGroup>
            </Field>
          </div>
        )
      }
    />
  ),
};

/** `vertical` is the rule. `horizontal` for two or three short options in a row; the arrow keys follow the direction. */
export const Orientation: Story = {
  render: () => (
    <Stack space="space.300">
      <Field label="Scope" isGroup>
        <RadioGroup defaultValue="system" orientation="horizontal">
          <RadioGroup.Item value="system">This system</RadioGroup.Item>
          <RadioGroup.Item value="program">The whole program</RadioGroup.Item>
        </RadioGroup>
      </Field>
      <Field label="Frequency" isGroup>
        <RadioGroup defaultValue="quarterly">
          <Items />
        </RadioGroup>
      </Field>
    </Stack>
  ),
};

function FormDemo() {
  const [frequency, setFrequency] = useState("");
  const [scope, setScope] = useState("system");
  const req = useRequired({ frequency });
  return (
    <div style={{ width: 360 }}>
      <Stack space="space.300">
        <Field
          label="Frequency"
          isGroup
          isRequired
          hint="How often the control is reviewed."
          error={req.errorFor("frequency")}
        >
          <RadioGroup value={frequency} onValueChange={setFrequency}>
            <Items description />
          </RadioGroup>
        </Field>
        <Field label="Scope" isGroup>
          <RadioGroup value={scope} onValueChange={setScope} orientation="horizontal">
            <RadioGroup.Item value="system">This system</RadioGroup.Item>
            <RadioGroup.Item value="program">The whole program</RadioGroup.Item>
          </RadioGroup>
        </Field>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary" onClick={() => req.check()}>
            Schedule
          </Button>
        </Inline>
      </Stack>
    </div>
  );
}

/** Inside a Field with `isGroup`: the legend, the hint and, on submit, the error. Press Schedule with nothing chosen. */
export const InField: Story = { render: () => <FormDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Baseline">
              <NativeSelect defaultValue="Moderate">
                {[
                  "Low",
                  "Moderate",
                  "High",
                  "Low · privacy",
                  "Moderate · privacy",
                  "High · privacy",
                ].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
        }
        doText="Six or more options are a NativeSelect."
        dont={
          <Field label="Baseline" isGroup>
            <RadioGroup defaultValue="Moderate">
              {[
                "Low",
                "Moderate",
                "High",
                "Low · privacy",
                "Moderate · privacy",
                "High · privacy",
              ].map((b) => (
                <RadioGroup.Item key={b} value={b}>
                  {b}
                </RadioGroup.Item>
              ))}
            </RadioGroup>
          </Field>
        }
        dontText="Six radios. The group is taller than the form around it."
      />
      <Pair
        do={
          <Field label="Frequency" isGroup>
            <RadioGroup defaultValue="quarterly">
              <Items />
            </RadioGroup>
          </Field>
        }
        doText="The common answer is chosen already; the reader changes it or moves on."
        dont={
          <Field label="Frequency" isGroup>
            <RadioGroup>
              <Items />
            </RadioGroup>
          </Field>
        }
        dontText="Nothing chosen when quarterly is what nearly everyone wants. Every reader must click."
      />
      <Pair
        do={
          <Field label="Frequency" isGroup>
            <RadioGroup defaultValue="quarterly">
              {frequencies.map((f) => (
                <RadioGroup.Item key={f} value={f}>
                  {f}
                </RadioGroup.Item>
              ))}
            </RadioGroup>
          </Field>
        }
        doText="Vertical, so the eye runs down one column of answers."
        dont={
          <div style={{ width: 360 }}>
            <Field label="Frequency" isGroup>
              <RadioGroup defaultValue="Quarterly" orientation="horizontal">
                {[
                  "Monthly, for systems in change",
                  "Quarterly, the program default",
                  "Annually, for stable systems",
                ].map((f) => (
                  <RadioGroup.Item key={f} value={f.split(",")[0] ?? f}>
                    {f}
                  </RadioGroup.Item>
                ))}
              </RadioGroup>
            </Field>
          </div>
        }
        dontText="Long labels in a row. They wrap, and the reader cannot tell which dot belongs to which words."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
