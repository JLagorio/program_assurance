import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Checkbox, Field, Input, NativeSelect, RadioGroup, Switch, Textarea } from "../../components";
import { Inline, Stack } from "../../primitives";

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
          <option value="" disabled>Choose an owner</option>
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
        <Checkbox checked={all} onCheckedChange={(v) => setAll(v === true)}>Select every control in the family</Checkbox>
        <Checkbox defaultChecked>Evidence attached</Checkbox>
        <Checkbox>Requires walkthrough</Checkbox>
        <Checkbox disabled>Locked by policy</Checkbox>
        <Checkbox disabled defaultChecked>Locked and checked</Checkbox>
      </Stack>
      <Stack space="space.150">
        <Switch checked={notify} onCheckedChange={setNotify}>Notify the owner on status change</Switch>
        <Switch>Include in the board pack</Switch>
        <Switch disabled>Managed by the programme</Switch>
        <Switch disabled defaultChecked>Managed and on</Switch>
      </Stack>
      <RadioGroup defaultValue="quarterly">
        <RadioGroup.Item value="monthly">Monthly</RadioGroup.Item>
        <RadioGroup.Item value="quarterly">Quarterly</RadioGroup.Item>
        <RadioGroup.Item value="annually">Annually</RadioGroup.Item>
        <RadioGroup.Item value="never" disabled>Not scheduled</RadioGroup.Item>
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
