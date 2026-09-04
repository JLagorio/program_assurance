import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { Calendar, Combobox, DatePicker, Dot, Field, Select } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Specimens } from "../_lib/matrix";

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

export const FieldsStory: Story = { name: "Fields", render: () => <Fields /> };

function Range() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 8, 7),
    to: new Date(2026, 8, 11),
  });
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      defaultMonth={new Date(2026, 8, 1)}
      numberOfMonths={2}
    />
  );
}

export const CalendarRange: Story = { render: () => <Range /> };

const owners = [
  { value: "dw", label: "Dana Whitlock", keywords: "isso", meta: "ISSO" },
  { value: "gh", label: "Grace Hoppel", meta: "Program owner" },
  { value: "la", label: "Linus Aarto", disabled: true, meta: "On leave" },
];

/** Single and range selections, days before today disabled. */
export const CalendarMatrix: Story = {
  parameters: {
    // Three calendars, three "Navigation bar" navs from react-day-picker; a page has one. A false positive of the layout.
    a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } },
  },
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      <Calendar
        mode="single"
        selected={new Date(2026, 8, 14)}
        defaultMonth={new Date(2026, 8, 1)}
      />
      <Calendar
        mode="range"
        selected={{ from: new Date(2026, 8, 7), to: new Date(2026, 8, 18) }}
        defaultMonth={new Date(2026, 8, 1)}
      />
      <Calendar
        mode="single"
        disabled={{ before: new Date(2026, 8, 10) }}
        defaultMonth={new Date(2026, 8, 1)}
      />
    </Inline>
  ),
};

/** Empty, with a value, disabled, and narrow. */
export const ComboboxMatrix: Story = {
  render: () => (
    <Specimens title="Combobox">
      <Combobox options={owners} onChange={() => {}} aria-label="Owner" />
      <Combobox options={owners} value="dw" onChange={() => {}} aria-label="Owner" />
      <Combobox options={owners} value="gh" onChange={() => {}} disabled aria-label="Owner" />
      <Combobox
        options={owners}
        onChange={() => {}}
        width={180}
        placeholder="Narrow"
        aria-label="Owner"
      />
    </Specimens>
  ),
};

/** Empty, with a value, disabled. */
export const DatePickerMatrix: Story = {
  render: () => (
    <Specimens title="DatePicker">
      <DatePicker aria-label="Due" onChange={() => {}} />
      <DatePicker aria-label="Due" value="2026-09-18" onChange={() => {}} />
      <DatePicker aria-label="Due" value="2026-09-18" disabled onChange={() => {}} />
    </Specimens>
  ),
};

/** Placeholder, value, disabled, a group with a separator and dots, and a fixed width. */
export const SelectMatrix: Story = {
  render: () => (
    <Specimens title="Select">
      <Select placeholder="Choose a status" onValueChange={() => {}} aria-label="Status">
        <Select.Item value="a">Draft</Select.Item>
      </Select>
      <Select value="review" onValueChange={() => {}} aria-label="Status">
        <Select.Item value="draft">Draft</Select.Item>
        <Select.Item value="review">In review</Select.Item>
      </Select>
      <Select value="review" onValueChange={() => {}} disabled aria-label="Status">
        <Select.Item value="review">In review</Select.Item>
      </Select>
      <Select value="draft" onValueChange={() => {}} aria-label="Status" width={220}>
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
    </Specimens>
  ),
};
