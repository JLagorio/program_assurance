import type { Meta, StoryObj } from "@storybook/react-vite";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button, Combobox, Dot, Field, NativeSelect, Select, useRequired } from "../../components";
import type { Tone } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const statuses: { value: string; label: string; tone: Tone }[] = [
  { value: "draft", label: "Draft", tone: "neutral" },
  { value: "review", label: "In review", tone: "information" },
  { value: "approved", label: "Approved", tone: "success" },
  { value: "withdrawn", label: "Withdrawn", tone: "danger" },
];
const environments = ["Development", "Test", "Production"];

function StatusItems() {
  return (
    <>
      {statuses.map((s) => (
        <Select.Item key={s.value} value={s.value}>
          <Dot tone={s.tone} /> {s.label}
        </Select.Item>
      ))}
    </>
  );
}

const meta = {
  title: "Components/Select",
  component: Select,
  parameters: { layout: "padded" },
  args: {
    "aria-label": "Status",
    placeholder: "Choose a status",
    defaultValue: "review",
    children: <StatusItems />,
  },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

const states = ["rest", "filled", "invalid", "disabled"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  ...(s === "rest" ? {} : { defaultValue: "review" }),
  ...(s === "disabled" ? { disabled: true } : {}),
});

/** Every state down the side; bare and inside a Field across. Open one to see the list. */
export const SelectMatrix: Story = {
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "in a Field"] as const}
      rowLabel="state"
      render={(state, col) => (
        <div style={{ width: 240 }}>
          {col === "bare" ? (
            <Select
              aria-label="Status"
              placeholder="Choose a status"
              {...stateProps(state)}
              {...(state === "invalid" ? { "aria-invalid": true } : {})}
            >
              <StatusItems />
            </Select>
          ) : (
            <Field
              label="Status"
              isRequired
              hint={state === "invalid" ? undefined : "Where the assessment stands."}
              error={state === "invalid" ? "Required." : undefined}
            >
              <Select placeholder="Choose a status" {...stateProps(state)}>
                <StatusItems />
              </Select>
            </Field>
          )}
        </div>
      )}
    />
  ),
};

/** `medium` in a form, `small` in a toolbar beside small Buttons and a small NativeSelect. */
export const Sizes: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="medium (32px): in a form">
        <div style={{ width: 240 }}>
          <Field label="Status">
            <Select placeholder="Choose a status" defaultValue="review">
              <StatusItems />
            </Select>
          </Field>
        </div>
      </Specimens>
      <Specimens title="small (28px): a toolbar's filter">
        <Inline space="space.100" alignBlock="center">
          <Button size="small" variant="secondary" iconBefore={<SlidersHorizontal />}>
            Filter
          </Button>
          <Select size="small" aria-label="Status" defaultValue="all" width={180}>
            <Select.Item value="all">All statuses</Select.Item>
            <StatusItems />
          </Select>
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

/** Groups with a separator, an option the reader cannot pick yet, and a real default. */
export const Options: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start">
      <div style={{ width: 240 }}>
        <Field label="Status" hint="Groups, and an option the reader cannot pick yet.">
          <Select placeholder="Choose a status" defaultValue="draft">
            <Select.Group label="Open">
              <Select.Item value="draft">
                <Dot tone="neutral" /> Draft
              </Select.Item>
              <Select.Item value="review">
                <Dot tone="information" /> In review
              </Select.Item>
            </Select.Group>
            <Select.Separator />
            <Select.Group label="Closed">
              <Select.Item value="approved">
                <Dot tone="success" /> Approved
              </Select.Item>
              <Select.Item value="withdrawn" disabled>
                <Dot tone="danger" /> Withdrawn
              </Select.Item>
            </Select.Group>
          </Select>
        </Field>
      </div>
      <div style={{ width: 240 }}>
        <Field label="Severity" hint="A default: the common answer is already chosen.">
          <Select defaultValue="moderate">
            <Select.Item value="low">
              <Dot tone="neutral" /> Low
            </Select.Item>
            <Select.Item value="moderate">
              <Dot tone="warning" /> Moderate
            </Select.Item>
            <Select.Item value="high">
              <Dot tone="danger" /> High
            </Select.Item>
          </Select>
        </Field>
      </div>
    </Inline>
  ),
};

function FormDemo() {
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const req = useRequired({ status });
  return (
    <div style={{ width: 360 }}>
      <Stack space="space.200">
        <Field
          label="Status"
          isRequired
          hint="Where the assessment stands."
          error={req.errorFor("status")}
        >
          <Select placeholder="Choose a status" value={status} onValueChange={setStatus}>
            <StatusItems />
          </Select>
        </Field>
        <Field label="Severity">
          <Select value={severity} onValueChange={setSeverity}>
            <Select.Item value="low">
              <Dot tone="neutral" /> Low
            </Select.Item>
            <Select.Item value="moderate">
              <Dot tone="warning" /> Moderate
            </Select.Item>
            <Select.Item value="high">
              <Dot tone="danger" /> High
            </Select.Item>
          </Select>
        </Field>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary" onClick={() => req.check()}>
            Save
          </Button>
        </Inline>
      </Stack>
    </div>
  );
}

/** Inside a Field with a label, a hint and, on submit, the error. Press Save with the status unchosen. */
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
        doText="Plain words are a NativeSelect: the browser's list, no code."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Environment">
              <Select defaultValue="Production">
                {environments.map((e) => (
                  <Select.Item key={e} value={e}>
                    {e}
                  </Select.Item>
                ))}
              </Select>
            </Field>
          </div>
        }
        dontText="A Select for three plain words. The kit draws a list the browser would have drawn better, on a phone especially."
      />
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Status">
              <Select defaultValue="review">
                <StatusItems />
              </Select>
            </Field>
          </div>
        }
        doText="The Dot means something: it is the status's colour, the same one the Badge and the table row use."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Environment">
              <Select defaultValue="Production">
                {environments.map((e) => (
                  <Select.Item key={e} value={e}>
                    <Dot tone="information" /> {e}
                  </Select.Item>
                ))}
              </Select>
            </Field>
          </div>
        }
        dontText="A blue dot on every option. It means nothing, and the reader looks for the difference."
      />
      <Pair
        do={
          <div style={{ width: 240 }}>
            <Field label="Owner">
              <Combobox
                value=""
                onChange={() => undefined}
                placeholder="Choose an owner"
                options={Array.from({ length: 40 }, (_, i) => ({
                  value: String(i),
                  label: `Person ${i + 1}`,
                }))}
              />
            </Field>
          </div>
        }
        doText="Dozens of people are a Combobox: the reader types a name."
        dont={
          <div style={{ width: 240 }}>
            <Field label="Owner">
              <Select placeholder="Choose an owner">
                {Array.from({ length: 40 }, (_, i) => (
                  <Select.Item key={i} value={String(i)}>
                    Person {i + 1}
                  </Select.Item>
                ))}
              </Select>
            </Field>
          </div>
        }
        dontText="Forty people in a Select. The reader scrolls a list they cannot search."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
