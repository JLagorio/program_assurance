import type { Meta, StoryObj } from "@storybook/react-vite";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button, Combobox, Field, NativeSelect, RadioGroup, useRequired } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const owners = ["Dana Whitfield", "Priya Natarajan", "Grace Hoppel", "Tomasz Zieliński"];
const responsibilities = ["System", "Inherited", "Shared", "Not applicable"];

const meta = {
  title: "Components/NativeSelect",
  component: NativeSelect,
  parameters: { layout: "padded" },
  args: {
    "aria-label": "Owner",
    defaultValue: "Priya Natarajan",
    children: owners.map((o) => <option key={o}>{o}</option>),
  },
} satisfies Meta<typeof NativeSelect>;
export default meta;
type Story = StoryObj<typeof meta>;

const states = ["rest", "filled", "invalid", "disabled"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  defaultValue: s === "rest" ? "" : "Priya Natarajan",
  ...(s === "invalid" ? { "aria-invalid": true } : {}),
  ...(s === "disabled" ? { disabled: true } : {}),
});

function Owners() {
  return (
    <>
      <option value="">Choose an owner</option>
      {owners.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </>
  );
}

/** Every state down the side; bare and inside a Field across. A select has no read-only state: see the page. */
export const NativeSelectMatrix: Story = {
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "in a Field"] as const}
      rowLabel="state"
      render={(state, col) => (
        <div style={{ width: 240 }}>
          {col === "bare" ? (
            <NativeSelect aria-label="Owner" {...stateProps(state)}>
              <Owners />
            </NativeSelect>
          ) : (
            <Field
              label="Owner"
              isRequired
              hint={state === "invalid" ? undefined : "Who answers for the control."}
              error={state === "invalid" ? "Required." : undefined}
            >
              <NativeSelect {...stateProps(state)}>
                <Owners />
              </NativeSelect>
            </Field>
          )}
        </div>
      )}
    />
  ),
};

/** `medium` in a form, `small` in a toolbar beside small Buttons. The row lines up because the heights are the same tokens. */
export const Sizes: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="medium (32px): in a form">
        <div style={{ width: 240 }}>
          <Field label="Responsibility">
            <NativeSelect defaultValue="System">
              {responsibilities.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </Specimens>
      <Specimens title="small (28px): a toolbar's filter">
        <Inline space="space.100" alignBlock="center">
          <Button size="small" variant="secondary" iconBefore={<SlidersHorizontal />}>
            Filter
          </Button>
          <div style={{ width: 160 }}>
            <NativeSelect size="small" aria-label="Status" defaultValue="All">
              <option value="All">All statuses</option>
              <option>Open</option>
              <option>In review</option>
              <option>Closed</option>
            </NativeSelect>
          </div>
          <div style={{ width: 180 }}>
            <NativeSelect size="small" aria-label="Owner" defaultValue="">
              <option value="">Any owner</option>
              {owners.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </NativeSelect>
          </div>
        </Inline>
      </Specimens>
    </Stack>
  ),
};

/** The first option is either a prompt the reader must replace or a real default; groups and a disabled option are the browser's own. */
export const Options: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start">
      <div style={{ width: 220 }}>
        <Field label="Owner" hint="A prompt: the form will ask for a choice.">
          <NativeSelect defaultValue="">
            <option value="">Choose an owner</option>
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div style={{ width: 220 }}>
        <Field label="Responsibility" hint="A default: the common answer is already chosen.">
          <NativeSelect defaultValue="System">
            {responsibilities.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <div style={{ width: 220 }}>
        <Field label="Baseline" hint="Groups, and an option the reader cannot pick yet.">
          <NativeSelect defaultValue="NIST SP 800-53 Rev. 5 · Moderate">
            <optgroup label="NIST SP 800-53">
              <option>NIST SP 800-53 Rev. 5 · Low</option>
              <option>NIST SP 800-53 Rev. 5 · Moderate</option>
              <option>NIST SP 800-53 Rev. 5 · High</option>
            </optgroup>
            <optgroup label="CNSSI 1253">
              <option>CNSSI 1253 · M-M-M</option>
              <option disabled>CNSSI 1253 · H-H-H (not licensed)</option>
            </optgroup>
          </NativeSelect>
        </Field>
      </div>
    </Inline>
  ),
};

function FormDemo() {
  const [owner, setOwner] = useState("");
  const [responsibility, setResponsibility] = useState("System");
  const req = useRequired({ owner });
  return (
    <div style={{ width: 360 }}>
      <Stack space="space.200">
        <Field
          label="Owner"
          isRequired
          hint="Who answers for the control."
          error={req.errorFor("owner")}
        >
          <NativeSelect value={owner} onChange={(e) => setOwner(e.target.value)}>
            <Owners />
          </NativeSelect>
        </Field>
        <Field label="Responsibility">
          <NativeSelect value={responsibility} onChange={(e) => setResponsibility(e.target.value)}>
            {responsibilities.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </NativeSelect>
        </Field>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary" onClick={() => req.check()}>
            Assign
          </Button>
        </Inline>
      </Stack>
    </div>
  );
}

/** Inside a Field with a label, a hint and, on submit, the error. Press Assign with the owner unchosen. */
export const InField: Story = { render: () => <FormDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Scope">
              <RadioGroup defaultValue="system">
                <RadioGroup.Item value="system">This system</RadioGroup.Item>
                <RadioGroup.Item value="program">The whole program</RadioGroup.Item>
              </RadioGroup>
            </Field>
          </div>
        }
        doText="Two or three answers are a RadioGroup: every option is in view."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Scope">
              <NativeSelect defaultValue="This system">
                <option>This system</option>
                <option>The whole program</option>
              </NativeSelect>
            </Field>
          </div>
        }
        dontText="A select hiding two options. The reader opens a list to learn there was one other choice."
      />
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Owner">
              <Combobox
                value=""
                onChange={() => undefined}
                options={owners.map((o) => ({ value: o, label: o }))}
              />
            </Field>
          </div>
        }
        doText="Dozens of people are a Combobox: the reader types a name."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Owner">
              <NativeSelect defaultValue="">
                <option value="">Choose an owner</option>
                {Array.from({ length: 40 }, (_, i) => (
                  <option key={i}>
                    {owners[i % owners.length]} {i + 1}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
        }
        dontText="Forty people in a select. The reader scrolls a browser list they cannot search."
      />
      <Pair
        do={
          <div style={{ width: 200 }}>
            <NativeSelect size="small" aria-label="Status" defaultValue="All">
              <option value="All">All statuses</option>
              <option>Open</option>
              <option>Closed</option>
            </NativeSelect>
          </div>
        }
        doText="A filter starts on its real default, and the option says what it includes."
        dont={
          <div style={{ width: 200 }}>
            <NativeSelect size="small" aria-label="Status" defaultValue="">
              <option value="">Select...</option>
              <option>Open</option>
              <option>Closed</option>
            </NativeSelect>
          </div>
        }
        dontText="A filter that starts on a prompt. Nothing is filtered, and the label says nothing."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
