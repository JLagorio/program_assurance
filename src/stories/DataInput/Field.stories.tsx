import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

import { Button, Card, CardHeader, Field, Input, Select, Textarea } from "@/components/app/ui";

const meta = {
  title: "Data Input/Field",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "Search controls…", disabled: false, type: "text" },
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    type: { control: "inline-radio", options: ["text", "search", "date", "number"] },
    className: { control: false },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[320px]">
      <Input {...args} />
    </div>
  ),
};

const statuses = ["Satisfied", "Partially satisfied", "Other than satisfied", "Not assessed"];
const owners = ["D. Reyes", "K. Lund", "M. Okafor", "S. Chen"];
const methods = ["Examine", "Interview", "Test"];

const statement =
  "Accounts are reviewed weekly by the ISSO. Accounts inactive for 90 days are disabled automatically by the IdP; exceptions require a ticket approved by the system owner.";

type Cell = "default" | "placeholder" | "value" | "disabled" | "field";

const columns: { key: Cell; label: string }[] = [
  { key: "default", label: "default" },
  { key: "placeholder", label: "placeholder" },
  { key: "value", label: "value" },
  { key: "disabled", label: "disabled" },
  { key: "field", label: "in Field · label + hint" },
];

function input(state: Cell) {
  switch (state) {
    case "default":
      return <Input aria-label="Title" />;
    case "placeholder":
      return <Input placeholder="Finding title" />;
    case "value":
      return <Input defaultValue="Shared admin account on jump host" />;
    case "disabled":
      return <Input defaultValue="FND-2231" disabled />;
    case "field":
      return (
        <Field label="Title" hint="Shown in the findings table and on the POA&M.">
          <Input defaultValue="Shared admin account on jump host" />
        </Field>
      );
  }
}

function select(state: Cell) {
  const options = statuses.map((s) => (
    <option key={s} value={s}>
      {s}
    </option>
  ));
  switch (state) {
    case "default":
      return <Select aria-label="Status">{options}</Select>;
    case "placeholder":
      return (
        <Select aria-label="Status" defaultValue="">
          <option value="" disabled>
            Choose a status
          </option>
          {options}
        </Select>
      );
    case "value":
      return (
        <Select aria-label="Status" defaultValue="Partially satisfied">
          {options}
        </Select>
      );
    case "disabled":
      return (
        <Select aria-label="Status" defaultValue="Satisfied" disabled>
          {options}
        </Select>
      );
    case "field":
      return (
        <Field label="Assessment status" hint="RMF vocabulary; see the status guide.">
          <Select defaultValue="Partially satisfied">{options}</Select>
        </Field>
      );
  }
}

function textarea(state: Cell) {
  switch (state) {
    case "default":
      return <Textarea aria-label="Implementation statement" />;
    case "placeholder":
      return <Textarea placeholder="Describe how the control is implemented…" />;
    case "value":
      return <Textarea defaultValue={statement} />;
    case "disabled":
      return <Textarea defaultValue={statement} disabled />;
    case "field":
      return (
        <Field label="Implementation statement" hint="Exported verbatim to the SSP.">
          <Textarea defaultValue={statement} />
        </Field>
      );
  }
}

const rows: { key: string; render: (state: Cell) => ReactNode }[] = [
  { key: "Input", render: input },
  { key: "Select", render: select },
  { key: "Textarea", render: textarea },
];

const th = "h-8 pr-6 text-[12px] font-medium text-muted-foreground";
const rowLabel = "py-3 pr-6 align-top font-mono text-[11px] text-muted-foreground";

/** Each control in every state, plus the same control wrapped in a Field. This is the contract. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="overflow-x-auto">
      <table className="text-left text-[13px]">
        <thead>
          <tr>
            <th className={th}>control</th>
            {columns.map((c) => (
              <th key={c.key} className={th}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-border-subtle">
              <td className={rowLabel}>{r.key}</td>
              {columns.map((c) => (
                <td key={c.key} className="py-3 pr-6 align-top">
                  <div className="w-[220px]">{r.render(c.key)}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

/** A control-edit form: two columns of Fields, statement spanning both, footer actions. */
export const Form: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card className="max-w-[760px]">
      <CardHeader title="Edit control" description="AC-2(3) · Disable accounts" />
      <form
        className="grid grid-cols-1 gap-x-5 gap-y-4 px-4 py-4 md:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
      >
        <Field label="Control">
          <Input defaultValue="AC-2(3)" disabled />
        </Field>
        <Field label="Title">
          <Input defaultValue="Disable accounts" />
        </Field>
        <Field label="Assessment status">
          <Select defaultValue="Partially satisfied">
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Owner">
          <Select defaultValue="D. Reyes">
            {owners.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Assessment method" hint="Per SP 800-53A: examine, interview, test.">
          <Select defaultValue="Test">
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Next assessment">
          <Input type="date" defaultValue="2026-09-14" />
        </Field>
        <Field
          label="Implementation statement"
          hint="Exported verbatim to the SSP."
          className="md:col-span-2"
        >
          <Textarea defaultValue={statement} className="min-h-[96px]" />
        </Field>
      </form>
      <div className="flex items-center justify-end gap-2 border-t border-border bg-subtle px-4 py-3">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Save changes</Button>
      </div>
    </Card>
  ),
};
