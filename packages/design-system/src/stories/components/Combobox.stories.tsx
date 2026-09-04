import type { Meta, StoryObj } from "@storybook/react-vite";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button, Combobox, Field, NativeSelect, useRequired } from "../../components";
import type { ComboboxOption } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const people: ComboboxOption[] = [
  { value: "dw", label: "Dana Whitfield", keywords: "isso", meta: "ISSO" },
  { value: "pn", label: "Priya Natarajan", keywords: "issm", meta: "ISSM" },
  { value: "gh", label: "Grace Hoppel", meta: "Program owner" },
  { value: "tz", label: "Tomasz Zieliński", meta: "Engineer" },
  { value: "mr", label: "Marcus Ryde", meta: "Assessor" },
  { value: "sc", label: "Sarah Chen", meta: "Engineer" },
  { value: "la", label: "Linus Aarto", disabled: true, meta: "On leave" },
];
const controls: ComboboxOption[] = [
  { value: "AC-2", label: "Account management", keywords: "AC-2", meta: "AC-2" },
  { value: "AC-3", label: "Access enforcement", keywords: "AC-3", meta: "AC-3" },
  { value: "AU-2", label: "Event logging", keywords: "AU-2", meta: "AU-2" },
  { value: "CM-6", label: "Configuration settings", keywords: "CM-6", meta: "CM-6" },
  { value: "IA-2", label: "Identification and authentication", keywords: "IA-2", meta: "IA-2" },
  { value: "SC-7", label: "Boundary protection", keywords: "SC-7", meta: "SC-7" },
];
const environments = ["Development", "Test", "Production"];

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  parameters: { layout: "padded" },
  args: {
    "aria-label": "Owner",
    options: people,
    value: "pn",
    onChange: () => undefined,
    placeholder: "Choose an owner",
    searchPlaceholder: "Search people…",
  },
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

const states = ["rest", "filled", "invalid", "disabled"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  value: s === "rest" ? "" : "pn",
  ...(s === "disabled" ? { disabled: true } : {}),
});

/** Every state down the side; bare and inside a Field across. Open one and type to filter. */
export const ComboboxMatrix: Story = {
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "in a Field"] as const}
      rowLabel="state"
      render={(state, col) => (
        <div style={{ width: 240 }}>
          {col === "bare" ? (
            <Combobox
              aria-label="Owner"
              options={people}
              onChange={() => undefined}
              placeholder="Choose an owner"
              {...stateProps(state)}
              {...(state === "invalid" ? { "aria-invalid": true } : {})}
            />
          ) : (
            <Field
              label="Owner"
              isRequired
              hint={state === "invalid" ? undefined : "Who answers for the control."}
              error={state === "invalid" ? "Required." : undefined}
            >
              <Combobox
                options={people}
                onChange={() => undefined}
                placeholder="Choose an owner"
                {...stateProps(state)}
              />
            </Field>
          )}
        </div>
      )}
    />
  ),
};

/** The list open: the search box, the rows with their meta, the chosen one checked, a disabled one dimmed. */
export const Open: Story = {
  render: () => (
    <div style={{ width: 280, height: 380 }}>
      <Field label="Owner">
        <Combobox
          options={people}
          value="pn"
          onChange={() => undefined}
          placeholder="Choose an owner"
          searchPlaceholder="Search people…"
          defaultOpen
        />
      </Field>
    </div>
  ),
};

/** `medium` in a form, `small` in a toolbar beside small Buttons. */
export const Sizes: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="medium (32px): in a form">
        <div style={{ width: 280 }}>
          <Field label="Control">
            <Combobox
              options={controls}
              value="AC-2"
              onChange={() => undefined}
              placeholder="Choose a control"
              searchPlaceholder="Search by id or name…"
            />
          </Field>
        </div>
      </Specimens>
      <Specimens title="small (28px): a toolbar's filter">
        <Inline space="space.100" alignBlock="center">
          <Button size="small" variant="secondary" iconBefore={<SlidersHorizontal />}>
            Filter
          </Button>
          <Combobox
            size="small"
            width={200}
            aria-label="Owner"
            options={people}
            value=""
            onChange={() => undefined}
            placeholder="Any owner"
          />
          <div style={{ width: 160 }}>
            <NativeSelect size="small" aria-label="Environment" defaultValue="">
              <option value="">Any environment</option>
              {environments.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </NativeSelect>
          </div>
        </Inline>
      </Specimens>
    </Stack>
  ),
};

function FormDemo() {
  const [owner, setOwner] = useState("");
  const [control, setControl] = useState("");
  const req = useRequired({ owner, control });
  return (
    <div style={{ width: 360 }}>
      <Stack space="space.200">
        <Field
          label="Owner"
          isRequired
          hint="Who answers for the control."
          error={req.errorFor("owner")}
        >
          <Combobox
            options={people}
            value={owner}
            onChange={setOwner}
            placeholder="Choose an owner"
            searchPlaceholder="Search people…"
          />
        </Field>
        <Field
          label="Control"
          isRequired
          hint="Type the id or the name."
          error={req.errorFor("control")}
        >
          <Combobox
            options={controls}
            value={control}
            onChange={setControl}
            placeholder="Choose a control"
            searchPlaceholder="Search by id or name…"
          />
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

/** Inside a Field with a label, a hint and, on submit, the error. Press Assign with a field unchosen. */
export const InField: Story = { render: () => <FormDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Environment">
              <NativeSelect defaultValue="Production">
                {environments.map((e) => (
                  <option key={e}>{e}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
        }
        doText="Three words are a NativeSelect. There is nothing to search."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Environment">
              <Combobox
                value="Production"
                onChange={() => undefined}
                options={environments.map((e) => ({ value: e, label: e }))}
              />
            </Field>
          </div>
        }
        dontText="A search box over three options. The reader is asked to type for a list they can see whole."
      />
      <Pair
        do={
          <div style={{ width: 280 }}>
            <Field label="Control">
              <Combobox
                value="AC-2"
                onChange={() => undefined}
                options={controls}
                placeholder="Choose a control"
              />
            </Field>
          </div>
        }
        doText="The meta is a word or an id at the end of the row; the keywords let the reader type either."
        dont={
          <div style={{ width: 280 }}>
            <Field label="Control">
              <Combobox
                value="AC-2"
                onChange={() => undefined}
                options={controls.map((c) => ({
                  ...c,
                  meta: `${c.meta} · Moderate baseline · 3 systems · last assessed May`,
                }))}
                placeholder="Choose a control"
              />
            </Field>
          </div>
        }
        dontText="A sentence of facts in the meta. The row is a choice, not a record; the facts live on the record's page."
      />
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Owner">
              <Combobox
                value=""
                onChange={() => undefined}
                options={people}
                placeholder="Choose an owner"
                searchPlaceholder="Search people…"
              />
            </Field>
          </div>
        }
        doText="The placeholder says what to choose; the search box says what to type."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Owner">
              <Combobox
                value=""
                onChange={() => undefined}
                options={people}
                placeholder="Select..."
                searchPlaceholder="Type here"
              />
            </Field>
          </div>
        }
        dontText='"Select..." and "Type here". Neither says what the answer is.'
      />
    </Stack>
  ),
};

export const Playground: Story = {};
