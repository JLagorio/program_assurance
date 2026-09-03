import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge, Editable, KeyValue, type Tone } from "../../components";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Editable",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const statuses = ["Draft", "In review", "Verified", "Overdue"] as const;
type Status = (typeof statuses)[number];
const toneOf: Record<Status, Tone> = {
  Draft: "neutral",
  "In review": "information",
  Verified: "success",
  Overdue: "danger",
};

function Demo() {
  const [name, setName] = useState("Segregation of duties, payables");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<Status>("In review");
  return (
    <Stack space="space.050" className="max-w-[440px]">
      <KeyValue label="Name">
        <Editable.Text
          value={name}
          onChange={setName}
          save={() => wait(700)}
          validate={(v) => (v.trim() ? null : "A name is required.")}
        />
      </KeyValue>
      <KeyValue label="Owner">
        <Editable.Text
          value={owner}
          onChange={setOwner}
          placeholder="Unassigned"
          save={() =>
            wait(700).then(() => Promise.reject(new Error("The owner must be on the programme.")))
          }
        />
      </KeyValue>
      <KeyValue label="Status">
        <Editable.Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={statuses}
          save={() => wait(500)}
          render={(s) => <Badge tone={toneOf[s]}>{s}</Badge>}
        />
      </KeyValue>
    </Stack>
  );
}

export const Rail: Story = { render: () => <Demo /> };

function EditableStates() {
  const [name, setName] = useState("Northwind payroll");
  const [empty, setEmpty] = useState("");
  const [failing, setFailing] = useState("Saves never land");
  const [status, setStatus] = useState<"Draft" | "In review" | "Approved">("In review");
  return (
    <Stack space="space.100" className="w-layout-list">
      <KeyValue label="Text">
        <Editable.Text value={name} onChange={setName} save={() => wait(600)} />
      </KeyValue>
      <KeyValue label="Empty">
        <Editable.Text
          value={empty}
          onChange={setEmpty}
          placeholder="Add a name"
          save={() => wait(600)}
        />
      </KeyValue>
      <KeyValue label="Invalid">
        <Editable.Text
          value={name}
          onChange={setName}
          validate={(v) => (v.length < 4 ? "At least four characters." : null)}
          save={() => wait(600)}
        />
      </KeyValue>
      <KeyValue label="Save fails">
        <Editable.Text
          value={failing}
          onChange={setFailing}
          save={() => wait(400).then(() => Promise.reject(new Error("Offline")))}
        />
      </KeyValue>
      <KeyValue label="Select">
        <Editable.Select
          label="Status"
          options={["Draft", "In review", "Approved"] as const}
          value={status}
          onChange={setStatus}
          save={() => wait(600)}
          render={(v) => (
            <Badge
              tone={v === "Approved" ? "success" : v === "In review" ? "information" : "neutral"}
            >
              {v}
            </Badge>
          )}
        />
      </KeyValue>
    </Stack>
  );
}

/** Idle, empty, validating, failing to save, and a select. Edit a row to see the saving and saved states. */
export const EditableMatrix: Story = {
  render: () => (
    <Stack space="space.200">
      <EditableStates />
      <Text size="xsmall" color="color.text.subtlest">
        Each row saves after 600ms; the fourth rejects.
      </Text>
    </Stack>
  ),
};
