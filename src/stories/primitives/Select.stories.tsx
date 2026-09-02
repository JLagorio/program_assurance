import type { Meta, StoryObj } from "@storybook/react-vite";

import { Dot, Field, NativeSelect, Select } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: { docs: { story: { inline: false, height: "360px" } } },
  args: { placeholder: "Choose a status", defaultValue: "partial", children: null },
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    value: { control: false },
    defaultValue: { control: false },
    onValueChange: { control: false },
    name: { control: false },
    className: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const statuses = [
  { value: "satisfied", label: "Satisfied", tone: "success" as const },
  { value: "partial", label: "Partially satisfied", tone: "warning" as const },
  { value: "other", label: "Other than satisfied", tone: "danger" as const },
  { value: "na", label: "Not assessed", tone: "neutral" as const },
];

/** Options that carry a Dot: the reason this exists beside NativeSelect. */
export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[280px]">
      <Select {...args} aria-label="Assessment status">
        {statuses.map((s) => (
          <Select.Item key={s.value} value={s.value}>
            <Dot tone={s.tone} />
            {s.label}
          </Select.Item>
        ))}
      </Select>
    </div>
  ),
};

/** Grouped options with a separator, in a Field, next to the NativeSelect it matches. */
export const Grouped: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-[600px] grid-cols-2 gap-6">
      <Field label="Owner" hint="Select on Radix">
        <Select placeholder="Anyone">
          <Select.Group label="Engineers">
            <Select.Item value="dr">D. Reyes</Select.Item>
            <Select.Item value="sc">S. Chen</Select.Item>
          </Select.Group>
          <Select.Separator />
          <Select.Group label="Assessors">
            <Select.Item value="mo">M. Okafor</Select.Item>
            <Select.Item value="kl" disabled>
              K. Lund
            </Select.Item>
          </Select.Group>
        </Select>
      </Field>
      <Field label="Owner" hint="NativeSelect, the browser's own">
        <NativeSelect defaultValue="">
          <option value="" disabled>
            Anyone
          </option>
          <option>D. Reyes</option>
          <option>S. Chen</option>
          <option>M. Okafor</option>
        </NativeSelect>
      </Field>
      <div className="col-span-2">
        <Spec>same h-8 hairline trigger · Radix surface matches DropdownMenu</Spec>
      </div>
    </div>
  ),
};
