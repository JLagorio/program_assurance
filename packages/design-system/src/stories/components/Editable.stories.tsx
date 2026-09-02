import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge, Editable, KeyValue, type Tone } from "../../components";
import { Stack } from "../../primitives";

const meta = {
  title: "Components/Editable",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const statuses = ["Draft", "In review", "Verified", "Overdue"] as const;
type Status = (typeof statuses)[number];
const toneOf: Record<Status, Tone> = { Draft: "neutral", "In review": "information", Verified: "success", Overdue: "danger" };

function Demo() {
  const [name, setName] = useState("Segregation of duties, payables");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<Status>("In review");
  return (
    <Stack space="space.050" className="max-w-[440px]">
      <KeyValue label="Name">
        <Editable.Text value={name} onChange={setName} save={() => wait(700)} validate={(v) => (v.trim() ? null : "A name is required.")} />
      </KeyValue>
      <KeyValue label="Owner">
        <Editable.Text value={owner} onChange={setOwner} placeholder="Unassigned" save={() => wait(700).then(() => Promise.reject(new Error("The owner must be on the programme.")))} />
      </KeyValue>
      <KeyValue label="Status">
        <Editable.Select label="Status" value={status} onChange={setStatus} options={statuses} save={() => wait(500)} render={(s) => <Badge tone={toneOf[s]}>{s}</Badge>} />
      </KeyValue>
    </Stack>
  );
}

export const Rail: Story = { render: () => <Demo /> };
