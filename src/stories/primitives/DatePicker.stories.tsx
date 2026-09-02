import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { DatePicker, Field, Input, NativeSelect } from "@/ds/primitives";
import { Card } from "@/ds/patterns";

const meta = {
  title: "Primitives/DatePicker",
  component: DatePicker,
  tags: ["autodocs"],
  parameters: { docs: { story: { inline: false, height: "420px" } } },
  args: { defaultValue: "2026-09-14", placeholder: "Pick a date" },
  argTypes: {
    defaultValue: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    value: { control: false },
    onChange: { control: false },
    name: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Uncontrolled: the trigger reads the day, the Calendar opens beneath it. */
export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[240px]">
      <DatePicker {...args} aria-label="Target date" />
    </div>
  ),
};

/** Controlled with the same ISO string a native date input would give, in a form beside other controls. */
function FormDemo() {
  const [scheduled, setScheduled] = useState("2026-09-30");
  return (
    <Card className="max-w-[640px]">
      <form className="grid grid-cols-3 gap-3 p-4" onSubmit={(e) => e.preventDefault()}>
        <Field label="Scheduled completion">
          <DatePicker value={scheduled} onChange={setScheduled} />
        </Field>
        <Field label="Point of contact">
          <NativeSelect defaultValue="D. Reyes">
            <option>D. Reyes</option>
            <option>K. Lund</option>
          </NativeSelect>
        </Field>
        <Field label="Ticket">
          <Input defaultValue="OPS-4412" />
        </Field>
        <p className="col-span-3 text-[12px] text-muted-foreground">
          value: <span className="tnum">{scheduled || "—"}</span>
        </p>
      </form>
    </Card>
  );
}

export const InAForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => <FormDemo />,
};

/** Empty and disabled. */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex max-w-[520px] gap-3">
      <DatePicker aria-label="Empty" />
      <DatePicker defaultValue="2026-08-27" disabled aria-label="Disabled" />
    </div>
  ),
};
