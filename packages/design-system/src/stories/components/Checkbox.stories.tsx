import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Checkbox, Field, RadioGroup, Switch } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: { layout: "padded" },
  args: { children: "Handles PII", defaultChecked: true },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

// Disabled labels are exempt from contrast (WCAG 1.4.3, inactive components); axe cannot tell the
// Radix control beside them is disabled, so it measures color.text.disabled anyway.
const disabledLabels = {
  a11y: { config: { rules: [{ id: "color-contrast", selector: "*:not(label:has(:disabled) *)" }] } },
};

const states = ["off", "on", "mixed", "off · disabled", "on · disabled"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  checked: s === "mixed" ? ("indeterminate" as const) : s.startsWith("on"),
  disabled: s.includes("disabled"),
  onCheckedChange: () => undefined,
});

/** Every state down the side; bare, labelled, and with a description across. */
export const CheckboxMatrix: Story = {
  parameters: disabledLabels,
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "labelled", "with a description"] as const}
      rowLabel="state"
      render={(state, col) =>
        col === "bare" ? (
          <Checkbox aria-label="Handles PII" {...stateProps(state)} />
        ) : col === "labelled" ? (
          <Checkbox {...stateProps(state)}>Handles PII</Checkbox>
        ) : (
          <div style={{ width: 280 }}>
            <Checkbox
              {...stateProps(state)}
              description="Names, identifiers or records about a person pass through the system."
            >
              Handles PII
            </Checkbox>
          </div>
        )
      }
    />
  ),
};

function ParentDemo() {
  const [children, setChildren] = useState({ ac: true, au: false, cm: false });
  const values = Object.values(children);
  const all = values.every(Boolean) ? true : values.some(Boolean) ? "indeterminate" : false;
  return (
    <Stack space="space.100">
      <Checkbox
        checked={all}
        onCheckedChange={(v) => setChildren({ ac: v === true, au: v === true, cm: v === true })}
      >
        Every family
      </Checkbox>
      <div className="ps-300">
        <Stack space="space.100">
          <Checkbox
            checked={children.ac}
            onCheckedChange={(v) => setChildren({ ...children, ac: v === true })}
          >
            AC · Access control
          </Checkbox>
          <Checkbox
            checked={children.au}
            onCheckedChange={(v) => setChildren({ ...children, au: v === true })}
          >
            AU · Audit and accountability
          </Checkbox>
          <Checkbox
            checked={children.cm}
            onCheckedChange={(v) => setChildren({ ...children, cm: v === true })}
          >
            CM · Configuration management
          </Checkbox>
        </Stack>
      </div>
    </Stack>
  );
}

/** A parent over its children: mixed while some are on, on when all are, and it sets all of them. */
export const Parent: Story = { render: () => <ParentDemo /> };

function GroupDemo() {
  const [p, setP] = useState({ pii: false, cross: false, safety: false });
  const [attested, setAttested] = useState(false);
  const [tried, setTried] = useState(false);
  return (
    <div style={{ width: 420 }}>
      <Stack space="space.300">
        <Field label="Parameters" isGroup hint="Each one adds controls to the baseline.">
          <Stack space="space.100">
            <Checkbox
              checked={p.pii}
              onCheckedChange={(v) => setP({ ...p, pii: v === true })}
              description="Names, identifiers or records about a person pass through the system."
            >
              Handles PII
            </Checkbox>
            <Checkbox
              checked={p.cross}
              onCheckedChange={(v) => setP({ ...p, cross: v === true })}
              description="Data moves between security domains."
            >
              Cross-domain
            </Checkbox>
            <Checkbox
              checked={p.safety}
              onCheckedChange={(v) => setP({ ...p, safety: v === true })}
              description="A failure can hurt someone."
            >
              Safety-critical
            </Checkbox>
          </Stack>
        </Field>
        <Field
          label="Attestation"
          isGroup
          isRequired
          error={tried && !attested ? "Confirm the review before submitting." : undefined}
        >
          <Checkbox checked={attested} onCheckedChange={(v) => setAttested(v === true)}>
            I have reviewed every piece of evidence in this package
          </Checkbox>
        </Field>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary" onClick={() => setTried(true)}>
            Submit package
          </Button>
        </Inline>
      </Stack>
    </div>
  );
}

/** Several in a Field with `isGroup`: the label is the group's name, the hint describes it, and a required attestation errors on submit. */
export const InField: Story = { render: () => <GroupDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Field label="Frequency" isGroup>
            <RadioGroup defaultValue="quarterly">
              <RadioGroup.Item value="monthly">Monthly</RadioGroup.Item>
              <RadioGroup.Item value="quarterly">Quarterly</RadioGroup.Item>
              <RadioGroup.Item value="annually">Annually</RadioGroup.Item>
            </RadioGroup>
          </Field>
        }
        doText="One answer from a few is a RadioGroup: choosing one clears the others."
        dont={
          <Field label="Frequency" isGroup>
            <Stack space="space.100">
              <Checkbox>Monthly</Checkbox>
              <Checkbox defaultChecked>Quarterly</Checkbox>
              <Checkbox>Annually</Checkbox>
            </Stack>
          </Field>
        }
        dontText="Checkboxes for one answer. Nothing stops the reader ticking all three."
      />
      <Pair
        do={
          <Inline space="space.200" alignBlock="center">
            <Checkbox>Notify the owner</Checkbox>
            <Button variant="primary" size="small">
              Save
            </Button>
          </Inline>
        }
        doText="A choice the form submits is a Checkbox; Save is what applies it."
        dont={
          <Inline space="space.200" alignBlock="center">
            <Switch>Notify the owner</Switch>
            <Button variant="primary" size="small">
              Save
            </Button>
          </Inline>
        }
        dontText="A Switch that waits for Save. A switch promises to apply at once; the reader flips it and nothing happens."
      />
      <Pair
        do={
          <Checkbox description="On leaves every revision a draft.">
            Submit for approval now
          </Checkbox>
        }
        doText="The label names the setting; the description says what it does."
        dont={<Checkbox>Do you want to submit the control sets for approval right now?</Checkbox>}
        dontText="A question as the label. The box does not answer yes or no; it turns a thing on."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
