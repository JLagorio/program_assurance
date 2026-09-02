import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge, Editable, KeyValue, type Tone } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Editable",
  component: Editable.Text,
  tags: ["autodocs"],
  args: { value: "Shared admin account on jump host", onChange: () => {}, save: async () => {} },
  argTypes: {
    value: { control: false },
    onChange: { control: false },
    save: { control: false },
    validate: { control: false },
    placeholder: { control: "text" },
  },
} satisfies Meta<typeof Editable.Text>;

export default meta;
type Story = StoryObj<typeof meta>;

const statuses = [
  "Satisfied",
  "Partially satisfied",
  "Other than satisfied",
  "Not assessed",
] as const;
type Status = (typeof statuses)[number];
const statusTone: Record<Status, Tone> = {
  Satisfied: "success",
  "Partially satisfied": "warning",
  "Other than satisfied": "danger",
  "Not assessed": "neutral",
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Rail() {
  const [title, setTitle] = useState("Shared admin account on jump host");
  const [owner, setOwner] = useState("D. Reyes");
  const [status, setStatus] = useState<Status>("Partially satisfied");
  const [due, setDue] = useState("2026-09-14");
  return (
    <dl className="max-w-[320px]">
      <KeyValue label="Title">
        <Editable.Text value={title} onChange={setTitle} save={() => wait(600)} />
      </KeyValue>
      <KeyValue label="Owner">
        <Editable.Text
          value={owner}
          onChange={setOwner}
          save={() => wait(600)}
          validate={(v) => (v.trim() ? null : "An owner is required")}
        />
      </KeyValue>
      <KeyValue label="Status">
        <Editable.Select
          label="Assessment status"
          value={status}
          options={statuses}
          onChange={setStatus}
          save={() => wait(600)}
          render={(s) => (
            <Badge size="xs" tone={statusTone[s]}>
              {s}
            </Badge>
          )}
        />
      </KeyValue>
      <KeyValue label="Due">
        <Editable.Text
          value={due}
          onChange={setDue}
          save={() =>
            wait(600).then(() => Promise.reject(new Error("The server rejected the date")))
          }
          validate={(v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? null : "Use YYYY-MM-DD")}
        />
      </KeyValue>
    </dl>
  );
}

/** Click a value to edit it. Enter or blur commits, Escape reverts. The last row's save always fails, so you can see the rollback. */
export const InARail: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-3">
      <Rail />
      <Spec>saving → Spinner · saved → check · error → message and rollback</Spec>
    </div>
  ),
};
