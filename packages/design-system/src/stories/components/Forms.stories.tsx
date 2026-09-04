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
import { Grid, Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Forms",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** The field controls in Fields: label above, hint or error below, the buttons at the end. */
export const Fields: Story = {
  render: () => (
    <div style={{ width: 420 }}>
      <Stack space="space.200">
        <Field label="Control name" hint="How it appears in the register." isRequired>
          <Input placeholder="Segregation of duties, payables" />
        </Field>
        <Field label="Owner">
          <NativeSelect defaultValue="">
            <option value="">Choose an owner</option>
            <option>Dana Whitfield</option>
            <option>Priya Natarajan</option>
            <option>Marcus Oyelaran</option>
          </NativeSelect>
        </Field>
        <Field
          label="Rationale"
          error="A rationale is required before the control can be verified."
        >
          <Textarea rows={3} placeholder="Why this control exists and what it prevents." />
        </Field>
        <Field label="Reference" hint="Read only until the assessment closes.">
          <Input value="CTRL-0412" readOnly />
        </Field>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary">Save</Button>
        </Inline>
      </Stack>
    </div>
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
    <div style={{ width: 360 }}>
      <Stack space="space.200">
        <Field label="Status" hint="A Select: the options carry their Dot.">
          <Select value={status} onValueChange={setStatus}>
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
          </Select>
        </Field>
        <Field label="Owner" hint="A Combobox: a list worth searching.">
          <Combobox
            options={people}
            value={owner}
            onChange={setOwner}
            placeholder="Choose an owner"
            searchPlaceholder="Search people…"
          />
        </Field>
        <Field label="Due" hint="A DatePicker: one day, held as an ISO date.">
          <DatePicker value={due} onChange={setDue} />
        </Field>
      </Stack>
    </div>
  );
}

/** The pickers in Fields: the same shape as the fields beside them. */
export const Pickers: Story = { render: () => <PickerFields /> };

function ChoiceFields() {
  const [p, setP] = useState({ pii: true, cross: false, safety: false });
  const [frequency, setFrequency] = useState("quarterly");
  const [notify, setNotify] = useState(true);
  return (
    <div style={{ width: 420 }}>
      <Stack space="space.300">
        <Field label="Parameters" isGroup hint="Each one adds controls to the baseline.">
          <Stack space="space.100">
            <Checkbox checked={p.pii} onCheckedChange={(v) => setP({ ...p, pii: v === true })}>
              Handles PII
            </Checkbox>
            <Checkbox checked={p.cross} onCheckedChange={(v) => setP({ ...p, cross: v === true })}>
              Cross-domain
            </Checkbox>
            <Checkbox
              checked={p.safety}
              onCheckedChange={(v) => setP({ ...p, safety: v === true })}
            >
              Safety-critical
            </Checkbox>
          </Stack>
        </Field>
        <Field label="Frequency" isGroup>
          <RadioGroup value={frequency} onValueChange={setFrequency}>
            <RadioGroup.Item value="monthly">Monthly</RadioGroup.Item>
            <RadioGroup.Item value="quarterly">Quarterly</RadioGroup.Item>
            <RadioGroup.Item value="annually">Annually</RadioGroup.Item>
          </RadioGroup>
        </Field>
        <Switch
          checked={notify}
          onCheckedChange={setNotify}
          description="Applies at once; it is not part of the Save."
        >
          Notify the owner on status change
        </Switch>
      </Stack>
    </div>
  );
}

/** The choice controls: a Checkbox group and a RadioGroup in Fields with `isGroup`; a Switch stands on its own, since it applies at once. */
export const Choices: Story = { render: () => <ChoiceFields /> };

/** A form on a six-column Grid: each field as wide as its answer, a description across the row, the buttons at the end. */
export const Layout: Story = {
  render: () => (
    <div style={{ width: 640 }}>
      <Stack space="space.300">
        <Grid templateColumns="repeat(6, minmax(0, 1fr))" columnGap="space.200" rowGap="space.200">
          <div style={{ gridColumn: "span 2" }}>
            <Field label="Acronym" isRequired hint="Up to eight characters.">
              <Input defaultValue="ATLAS" maxLength={8} />
            </Field>
          </div>
          <div style={{ gridColumn: "span 4" }}>
            <Field label="Program name" isRequired>
              <Input defaultValue="Atlas payments platform" />
            </Field>
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <Field label="Owner">
              <Combobox
                options={people}
                value="priya"
                onChange={() => undefined}
                placeholder="Choose an owner"
              />
            </Field>
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <Field label="Authorization due">
              <DatePicker defaultValue="2026-12-18" />
            </Field>
          </div>
          <div style={{ gridColumn: "span 6" }}>
            <Field label="Description" hint="What the system does for the mission.">
              <Textarea
                rows={3}
                placeholder="Cardholder and settlement processing for the Atlas platform."
              />
            </Field>
          </div>
        </Grid>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary">Create program</Button>
        </Inline>
      </Stack>
    </div>
  ),
};

/** The required fields, checked on submit: the asterisk from `isRequired`, the first empty one red with the message under it. */
function RequiredForm() {
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [saved, setSaved] = useState(false);
  const req = useRequired({ title, owner });
  return (
    <div style={{ width: 420 }}>
      <Stack space="space.200">
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
        <Inline space="space.100" alignBlock="center" alignInline="end">
          {saved ? <Text color="color.text.subtle">Saved.</Text> : null}
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary" onClick={() => setSaved(req.check())}>
            Save
          </Button>
        </Inline>
      </Stack>
    </div>
  );
}
export const RequiredOnSubmit: Story = {
  name: "Required on submit",
  render: () => <RequiredForm />,
};
