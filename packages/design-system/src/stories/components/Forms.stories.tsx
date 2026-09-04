import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  Button,
  Checkbox,
  Combobox,
  DatePicker,
  Dot,
  Field,
  Input,
  NativeSelect,
  RadioGroup,
  Select,
  Switch,
  Textarea,
  useRequired,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Forms",
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

const people = [
  { value: "dana", label: "Dana Whitfield", meta: "Finance" },
  { value: "priya", label: "Priya Natarajan", meta: "Security" },
  { value: "marcus", label: "Marcus Oyelaran", meta: "Operations", keywords: "ops" },
  { value: "lee", label: "Lee Anand", disabled: true },
];

function PickerFields() {
  const [owner, setOwner] = useState<string | undefined>("priya");
  const [status, setStatus] = useState("review");
  const [due, setDue] = useState("2026-09-14");
  return (
    <Stack space="space.300" className="max-w-[360px]">
      <Field label="Status" hint="Select: a short, fixed list whose options carry a Dot.">
        <Select value={status} onValueChange={setStatus} width={220}>
          <Select.Group label="Open">
            <Select.Item value="draft">
              <Dot tone="neutral" /> Draft
            </Select.Item>
            <Select.Item value="review">
              <Dot tone="information" /> In review
            </Select.Item>
          </Select.Group>
          <Select.Separator />
          <Select.Item value="verified">
            <Dot tone="success" /> Verified
          </Select.Item>
          <Select.Item value="overdue">
            <Dot tone="danger" /> Overdue
          </Select.Item>
          <Select.Item value="retired" disabled>
            Retired
          </Select.Item>
        </Select>
      </Field>
      <Field label="Owner" hint="Combobox: a list worth searching.">
        <Combobox
          options={people}
          value={owner}
          onChange={setOwner}
          placeholder="Choose an owner"
          width={320}
        />
      </Field>
      <Field label="Due" hint={`DatePicker holds an ISO day: ${due || "none"}.`}>
        <DatePicker value={due} onChange={setDue} />
      </Field>
      <Inline space="space.200">
        <Select placeholder="Disabled" disabled>
          <Select.Item value="a">A</Select.Item>
        </Select>
        <DatePicker disabled placeholder="Disabled" />
      </Inline>
    </Stack>
  );
}

export const FieldsStory: Story = { name: "Pickers in fields", render: () => <PickerFields /> };

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
