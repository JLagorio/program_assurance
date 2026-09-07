import type { Meta, StoryObj } from "@storybook/react-vite";

import { Field, Input } from "../../components";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Field",
  component: Field,
  parameters: { layout: "padded" },
  args: { label: "Owner", children: <Input /> },
} satisfies Meta<typeof Field>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Field with a hint, an error and a requirement. */
export const FieldMatrix: Story = {
  render: () => (
    <Specimens title="Field">
      <Field label="Owner">
        <Input defaultValue="Dana Whitlock" style={{ width: 200 }} />
      </Field>
      <Field label="Owner" hint="The person who answers for it.">
        <Input defaultValue="Dana Whitlock" style={{ width: 200 }} />
      </Field>
      <Field label="Owner" error="Pick someone on the program.">
        <Input aria-invalid style={{ width: 200 }} />
      </Field>
      <Field label="Owner" isRequired>
        <Input style={{ width: 200 }} />
      </Field>
    </Specimens>
  ),
};
