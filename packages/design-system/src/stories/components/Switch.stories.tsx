import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Checkbox, RadioGroup, Switch, Table } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: { layout: "padded" },
  args: { children: "Notify the owner on status change", defaultChecked: true },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

// Disabled labels are exempt from contrast (WCAG 1.4.3, inactive components); axe cannot tell the
// Radix control beside them is disabled, so it measures color.text.disabled anyway.
const disabledLabels = {
  a11y: { config: { rules: [{ id: "color-contrast", selector: "*:not(label:has(:disabled) *)" }] } },
};

const states = ["off", "on", "off · disabled", "on · disabled"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) => ({
  checked: s.startsWith("on"),
  disabled: s.includes("disabled"),
  onCheckedChange: () => undefined,
});

/** Every state down the side; bare, labelled, and with a description across. */
export const SwitchMatrix: Story = {
  parameters: disabledLabels,
  render: () => (
    <Grid
      rows={states}
      cols={["bare", "labelled", "with a description"] as const}
      rowLabel="state"
      render={(state, col) =>
        col === "bare" ? (
          <Switch aria-label="Notify the owner" {...stateProps(state)} />
        ) : col === "labelled" ? (
          <Switch {...stateProps(state)}>Notify the owner</Switch>
        ) : (
          <div style={{ width: 300 }}>
            <Switch
              {...stateProps(state)}
              description="An email when a finding on this system changes status."
            >
              Notify the owner
            </Switch>
          </div>
        )
      }
    />
  ),
};

function SettingsDemo() {
  const [s, setS] = useState({ notify: true, pack: false, inherit: true });
  return (
    <div style={{ width: 420 }}>
      <Stack space="space.200">
        <Switch
          checked={s.notify}
          onCheckedChange={(v) => setS({ ...s, notify: v })}
          description="An email when a finding on this system changes status."
        >
          Notify the owner
        </Switch>
        <Switch
          checked={s.pack}
          onCheckedChange={(v) => setS({ ...s, pack: v })}
          description="The system's coverage appears in the monthly board pack."
        >
          Include in the board pack
        </Switch>
        <Switch
          checked={s.inherit}
          onCheckedChange={(v) => setS({ ...s, inherit: v })}
          description="Turn off to categorize this system on its own."
        >
          Inherits program categorization
        </Switch>
        <Switch disabled description="Set by the program; ask the ISSM.">
          Managed by the program
        </Switch>
      </Stack>
    </div>
  );
}

/** A settings list: each Switch applies the moment it is flipped, and the description says what changes. No Save. */
export const Settings: Story = { render: () => <SettingsDemo /> };

function RowsDemo() {
  const [applied, setApplied] = useState({ privacy: true, classified: false, cds: false });
  const rows = [
    ["privacy", "Privacy overlay", "22 controls"],
    ["classified", "Classified information overlay", "14 controls"],
    ["cds", "Cross domain solution overlay", "31 controls"],
  ] as const;
  return (
    <div style={{ width: 520 }}>
      <Table>
        <thead>
          <Table.Row>
            <Table.Header>Overlay</Table.Header>
            <Table.Header>Adds</Table.Header>
            <Table.Header>Applied</Table.Header>
          </Table.Row>
        </thead>
        <tbody>
          {rows.map(([key, name, adds]) => (
            <Table.Row key={key}>
              <Table.Cell>{name}</Table.Cell>
              <Table.Cell>
                <Text color="color.text.subtle">{adds}</Text>
              </Table.Cell>
              <Table.Cell>
                <Switch
                  aria-label={`Apply ${name}`}
                  checked={applied[key]}
                  onCheckedChange={(v) => setApplied({ ...applied, [key]: v })}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

/** In a table row, bare, named by `aria-label` from the row it sits in. */
export const InRows: Story = { render: () => <RowsDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.200" alignBlock="center">
            <Checkbox>Notify the owner</Checkbox>
            <Button variant="primary" size="small">
              Save
            </Button>
          </Inline>
        }
        doText="Inside a form that submits, the choice is a Checkbox."
        dont={
          <Inline space="space.200" alignBlock="center">
            <Switch>Notify the owner</Switch>
            <Button variant="primary" size="small">
              Save
            </Button>
          </Inline>
        }
        dontText="A Switch that waits for Save. It promises to apply at once and does not."
      />
      <Pair
        do={<Switch defaultChecked>Notifications</Switch>}
        doText="The label names the setting and stays the same on and off; the switch shows the state."
        dont={<Switch defaultChecked>Notifications are on</Switch>}
        dontText='The label says the state. Off, it would have to change to "Notifications are off", and a screen reader hears the state twice.'
      />
      <Pair
        do={
          <RadioGroup defaultValue="all" aria-label="Who is notified">
            <RadioGroup.Item value="all">Everyone on the program</RadioGroup.Item>
            <RadioGroup.Item value="owners">Owners only</RadioGroup.Item>
            <RadioGroup.Item value="none">No one</RadioGroup.Item>
          </RadioGroup>
        }
        doText="Three answers are a RadioGroup."
        dont={
          <Stack space="space.100">
            <Switch defaultChecked>Notify everyone on the program</Switch>
            <Switch>Notify owners only</Switch>
          </Stack>
        }
        dontText="Two switches for one choice. Both can be on, and neither says what off means."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
