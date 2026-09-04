import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";
import { useState } from "react";

import { Button, Field, Input, InputGroup, useRequired } from "../../components";
import { Grid as GridPrimitive, Inline, Stack } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: { layout: "padded" },
  args: { defaultValue: "Atlas payments platform" },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

const states = ["rest", "filled", "invalid", "disabled", "read-only"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  ...(s === "rest"
    ? { placeholder: "Atlas payments platform" }
    : { defaultValue: "Atlas payments platform" }),
  ...(s === "invalid" ? { "aria-invalid": true } : {}),
  ...(s === "disabled" ? { disabled: true } : {}),
  ...(s === "read-only" ? { readOnly: true } : {}),
});

/** Every state down the side; bare, inside a Field, and inside an InputGroup across. */
export const InputMatrix: Story = {
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "in a Field", "in an InputGroup"] as const}
      rowLabel="state"
      render={(state, col) => (
        <div style={{ width: 240 }}>
          {col === "bare" ? (
            <Input aria-label="Program name" {...stateProps(state)} />
          ) : col === "in a Field" ? (
            <Field
              label="Program name"
              isRequired
              hint={state === "invalid" ? undefined : "As it appears on the authorization package."}
              error={state === "invalid" ? "Required." : undefined}
            >
              <Input {...stateProps(state)} />
            </Field>
          ) : (
            <InputGroup leading={<Search />}>
              <Input {...stateProps(state)} placeholder="Search controls" />
            </InputGroup>
          )}
        </div>
      )}
    />
  ),
};

function FormDemo() {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const req = useRequired({ name, owner });
  return (
    <div style={{ width: 360 }}>
      <Stack space="space.200">
        <Field
          label="Program name"
          isRequired
          hint="As it appears on the authorization package."
          error={req.errorFor("name")}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Owner" isRequired error={req.errorFor("owner")}>
          <Input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="first.last@example.mil"
          />
        </Field>
        <Field label="Acronym" hint="Up to eight characters. Shown in the side nav and on badges.">
          <Input defaultValue="ATLAS" maxLength={8} />
        </Field>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary" onClick={() => req.check()}>
            Create program
          </Button>
        </Inline>
      </Stack>
    </div>
  );
}

/** Inside a Field with a label, a hint and, on submit, the error. Press Create with a field empty. */
export const InField: Story = { render: () => <FormDemo /> };

/** The width says how long the answer is. The layout sets it; the Input fills what it is given. */
export const Widths: Story = {
  render: () => (
    <GridPrimitive
      templateColumns="repeat(6, minmax(0, 1fr))"
      columnGap="space.200"
      rowGap="space.200"
    >
      <div style={{ gridColumn: "span 1" }}>
        <Field label="Acronym">
          <Input defaultValue="ATLAS" />
        </Field>
      </div>
      <div style={{ gridColumn: "span 2" }}>
        <Field label="Owner">
          <Input defaultValue="Grace Hoppel" />
        </Field>
      </div>
      <div style={{ gridColumn: "span 3" }}>
        <Field label="System">
          <Input defaultValue="Cardholder and settlement processing for the Atlas platform" />
        </Field>
      </div>
    </GridPrimitive>
  ),
};

/** The `type` and the input mode come from the value; the icon, unit or shortcut at either end from an InputGroup. */
export const Kinds: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="type and inputMode">
        <div style={{ width: 240 }}>
          <Field label="Email" hint="Where the decision is sent.">
            <Input type="email" inputMode="email" defaultValue="grace.hoppel@example.mil" />
          </Field>
        </div>
        <div style={{ width: 160 }}>
          <Field label="Retention">
            <InputGroup trailing="days">
              <Input type="number" inputMode="numeric" defaultValue="90" min={0} />
            </InputGroup>
          </Field>
        </div>
      </Specimens>
      <Specimens title="an InputGroup at either end">
        <div style={{ width: 280 }}>
          <InputGroup leading={<Search />} trailing="⌘K">
            <Input placeholder="Search risks, controls, evidence…" />
          </InputGroup>
        </div>
      </Specimens>
      <Specimens title="read-only: a value shown in the form's grid that cannot be edited here">
        <div style={{ width: 200 }}>
          <Field label="Program ID">
            <Input readOnly defaultValue="PRG-1041" />
          </Field>
        </div>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Owner">
              <Input placeholder="first.last@example.mil" />
            </Field>
          </div>
        }
        doText="The label names the field; the placeholder shows the format and goes away."
        dont={
          <div style={{ width: 240 }}>
            <Input placeholder="Owner" />
          </div>
        }
        dontText="The placeholder is the label. It vanishes on the first keystroke and is never read as a name."
      />
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Program name">
              <Input />
            </Field>
          </div>
        }
        doText="A noun, sentence case, no colon."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Enter the Program Name:">
              <Input />
            </Field>
          </div>
        }
        dontText="An instruction with a colon and title case. The form is not talking; it is labelling."
      />
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Owner" error="Choose a person who is on the program.">
              <Input defaultValue="j.doe" />
            </Field>
          </div>
        }
        doText="The error says what is wrong and what fixes it."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Owner" error="Invalid input">
              <Input defaultValue="j.doe" />
            </Field>
          </div>
        }
        dontText="The reader knows it is invalid; the red border said so. They need to know why."
      />
      <Pair
        do={
          <div style={{ width: 120 }}>
            <Field label="Acronym">
              <Input defaultValue="ATLAS" />
            </Field>
          </div>
        }
        doText="Eight characters get a field eight characters wide."
        dont={
          <div style={{ width: 480 }}>
            <Field label="Acronym">
              <Input defaultValue="ATLAS" />
            </Field>
          </div>
        }
        dontText="A field the width of the page for a five-letter answer. The width lies about the answer."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
