import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  Button,
  Checkbox,
  Field,
  Input,
  NativeSelect,
  RadioGroup,
  Switch,
  Textarea,
  useRequired,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Controls",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Fields: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-[420px]">
      <Field label="Control name" hint="How it appears in the register." isRequired>
        <Input placeholder="Segregation of duties, payables" />
      </Field>
      <Field label="Owner">
        <NativeSelect defaultValue="">
          <option value="" disabled>
            Choose an owner
          </option>
          <option>Dana Whitfield</option>
          <option>Priya Natarajan</option>
          <option>Marcus Oyelaran</option>
        </NativeSelect>
      </Field>
      <Field label="Rationale" error="A rationale is required before the control can be verified.">
        <Textarea placeholder="Why this control exists and what it prevents." />
      </Field>
      <Field label="Reference" hint="Read only until the assessment closes.">
        <Input value="CTRL-0412" readOnly disabled />
      </Field>
      <Inline space="space.100">
        <Button variant="primary">Save</Button>
        <Button variant="subtle">Cancel</Button>
      </Inline>
    </Stack>
  ),
};

function Choices() {
  const [all, setAll] = useState<boolean | "indeterminate">("indeterminate");
  const [notify, setNotify] = useState(true);
  return (
    <Stack space="space.400">
      <Stack space="space.150">
        <Checkbox checked={all} onCheckedChange={(v) => setAll(v === true)}>
          Select every control in the family
        </Checkbox>
        <Checkbox defaultChecked>Evidence attached</Checkbox>
        <Checkbox>Requires walkthrough</Checkbox>
        <Checkbox disabled>Locked by policy</Checkbox>
        <Checkbox disabled defaultChecked>
          Locked and checked
        </Checkbox>
      </Stack>
      <Stack space="space.150">
        <Switch checked={notify} onCheckedChange={setNotify}>
          Notify the owner on status change
        </Switch>
        <Switch>Include in the board pack</Switch>
        <Switch disabled>Managed by the programme</Switch>
        <Switch disabled defaultChecked>
          Managed and on
        </Switch>
      </Stack>
      <RadioGroup defaultValue="quarterly">
        <RadioGroup.Item value="monthly">Monthly</RadioGroup.Item>
        <RadioGroup.Item value="quarterly">Quarterly</RadioGroup.Item>
        <RadioGroup.Item value="annually">Annually</RadioGroup.Item>
        <RadioGroup.Item value="never" disabled>
          Not scheduled
        </RadioGroup.Item>
      </RadioGroup>
    </Stack>
  );
}

export const ChoiceControls: Story = { render: () => <Choices /> };

export const Bare: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <Checkbox aria-label="Select row" />
      <Checkbox aria-label="Select row" defaultChecked />
      <Checkbox aria-label="Select all" checked="indeterminate" />
      <Switch aria-label="Enabled" />
      <Switch aria-label="Enabled" defaultChecked />
      <RadioGroup defaultValue="a" className="flex-row">
        <RadioGroup.Item value="a" aria-label="A" />
        <RadioGroup.Item value="b" aria-label="B" />
      </RadioGroup>
    </Inline>
  ),
};

const textStates = ["default", "filled", "disabled", "invalid", "read only"] as const;
type TextState = (typeof textStates)[number];
const stateProps = (s: TextState) => ({
  defaultValue: s === "default" ? undefined : "Northwind payroll",
  disabled: s === "disabled",
  "aria-invalid": s === "invalid" ? true : undefined,
  readOnly: s === "read only",
});

/** Every text control by every state; every choice control off, on and disabled; Field with a hint, an error and a requirement. */
export const ControlsMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["Input", "Textarea", "NativeSelect"] as const}
        cols={textStates}
        rowLabel="control"
        render={(row, s) => {
          const p = stateProps(s);
          if (row === "Input")
            return <Input placeholder="Placeholder" {...p} style={{ width: 180 }} />;
          if (row === "Textarea")
            return <Textarea placeholder="Placeholder" {...p} style={{ width: 180 }} rows={2} />;
          return (
            <NativeSelect
              disabled={p.disabled}
              aria-invalid={p["aria-invalid"]}
              defaultValue={p.defaultValue ? "b" : ""}
              style={{ width: 180 }}
            >
              <option value="">Choose…</option>
              <option value="b">Northwind payroll</option>
            </NativeSelect>
          );
        }}
      />
      <Matrix
        rows={["Checkbox", "Switch", "Radio"] as const}
        cols={["off", "on", "off · disabled", "on · disabled", "mixed"] as const}
        rowLabel="control"
        render={(row, s) => {
          const on = s.startsWith("on") || s === "mixed";
          const disabled = s.includes("disabled");
          if (row === "Checkbox")
            return (
              <Checkbox
                checked={s === "mixed" ? "indeterminate" : on}
                disabled={disabled}
                onCheckedChange={() => {}}
              >
                Label
              </Checkbox>
            );
          if (row === "Switch")
            return s === "mixed" ? null : (
              <Switch checked={on} disabled={disabled} onCheckedChange={() => {}}>
                Label
              </Switch>
            );
          return s === "mixed" ? null : (
            <RadioGroup value={on ? "a" : ""} onValueChange={() => {}} disabled={disabled}>
              <RadioGroup.Item value="a">Label</RadioGroup.Item>
            </RadioGroup>
          );
        }}
      />
      <Specimens title="Field">
        <Field label="Owner">
          <Input defaultValue="Dana Whitlock" style={{ width: 200 }} />
        </Field>
        <Field label="Owner" hint="The person who answers for it.">
          <Input defaultValue="Dana Whitlock" style={{ width: 200 }} />
        </Field>
        <Field label="Owner" error="Pick someone on the program.">
          <Input aria-invalid style={{ width: 200 }} />
        </Field>
        <Field label="Owner" isRequired>
          <Input style={{ width: 200 }} />
        </Field>
      </Specimens>
    </Stack>
  ),
};

/** The required fields, checked on submit: the asterisk from `isRequired`, the first empty one red with the message under it. */
function RequiredForm() {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [saved, setSaved] = useState(false);
  const req = useRequired({ title, owner });
  return (
    <Stack space="space.150" className="max-w-layout-measure">
      <Field label="Title" isRequired error={req.errorFor("title")}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is at risk"
        />
      </Field>
      <Field label="Owner" isRequired error={req.errorFor("owner")}>
        <Input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="Who answers for it"
        />
      </Field>
      <Inline space="space.100" alignBlock="center">
        <Button variant="primary" onClick={() => setSaved(req.check())}>
          Save
        </Button>
        {saved ? <Text color="color.text.subtle">Saved.</Text> : null}
      </Inline>
    </Stack>
  );
}
export const RequiredOnSubmit: Story = {
  name: "Required on submit",
  render: () => <RequiredForm />,
};
