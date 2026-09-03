import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { Calendar, Combobox, DatePicker, Dot, Field, Select } from "../../components";
import { Inline, Stack } from "../../primitives";

const meta = {
  title: "Components/Pickers",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const people = [
  { value: "dana", label: "Dana Whitfield", meta: "Finance" },
  { value: "priya", label: "Priya Natarajan", meta: "Security" },
  { value: "marcus", label: "Marcus Oyelaran", meta: "Operations", keywords: "ops" },
  { value: "lee", label: "Lee Anand", disabled: true },
];

function Fields() {
  const [owner, setOwner] = useState<string | undefined>("priya");
  const [status, setStatus] = useState("review");
  const [due, setDue] = useState("2026-09-14");
  return (
    <Stack space="space.300" className="max-w-[360px]">
      <Field label="Status" hint="Select: a short, fixed list whose options carry a Dot.">
        <Select value={status} onValueChange={setStatus} width={220}>
          <Select.Group label="Open">
            <Select.Item value="draft"><Dot tone="neutral" /> Draft</Select.Item>
            <Select.Item value="review"><Dot tone="information" /> In review</Select.Item>
          </Select.Group>
          <Select.Separator />
          <Select.Item value="verified"><Dot tone="success" /> Verified</Select.Item>
          <Select.Item value="overdue"><Dot tone="danger" /> Overdue</Select.Item>
          <Select.Item value="retired" disabled>Retired</Select.Item>
        </Select>
      </Field>
      <Field label="Owner" hint="Combobox: a list worth searching.">
        <Combobox options={people} value={owner} onChange={setOwner} placeholder="Choose an owner" width={320} />
      </Field>
      <Field label="Due" hint={`DatePicker holds an ISO day: ${due || "none"}.`}>
        <DatePicker value={due} onChange={setDue} />
      </Field>
      <Inline space="space.200">
        <Select placeholder="Disabled" disabled><Select.Item value="a">A</Select.Item></Select>
        <DatePicker disabled placeholder="Disabled" />
      </Inline>
    </Stack>
  );
}

export const FieldsStory: Story = { name: "Fields", render: () => <Fields /> };

function Range() {
  const [range, setRange] = useState<DateRange | undefined>({ from: new Date(2026, 8, 7), to: new Date(2026, 8, 11) });
  return <Calendar mode="range" selected={range} onSelect={setRange} defaultMonth={new Date(2026, 8, 1)} numberOfMonths={2} />;
}

export const CalendarRange: Story = { render: () => <Range /> };
