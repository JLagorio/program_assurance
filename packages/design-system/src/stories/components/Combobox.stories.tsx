import type { Meta, StoryObj } from "@storybook/react-vite";

import { Combobox } from "../../components";
import { Specimens } from "../_lib/matrix";

const owners = [
  { value: "dw", label: "Dana Whitlock", keywords: "isso", meta: "ISSO" },
  { value: "gh", label: "Grace Hoppel", meta: "Program owner" },
  { value: "la", label: "Linus Aarto", disabled: true, meta: "On leave" },
];

const meta = {
  title: "Components/Combobox",
  component: Combobox,
  parameters: { layout: "padded" },
  args: { options: owners, onChange: () => {} },
} satisfies Meta<typeof Combobox>;
export default meta;
type Story = StoryObj<typeof meta>;

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
