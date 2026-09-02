import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Combobox, Field, type ComboboxOption } from "@/ds/primitives";

const controls: ComboboxOption[] = [
  { value: "AC-2", label: "AC-2 Account management", keywords: "access", meta: "AC" },
  { value: "AC-2(3)", label: "AC-2(3) Disable accounts", keywords: "access", meta: "AC" },
  { value: "AC-3", label: "AC-3 Access enforcement", keywords: "access", meta: "AC" },
  { value: "AU-2", label: "AU-2 Event logging", keywords: "audit", meta: "AU" },
  { value: "AU-6", label: "AU-6 Audit record review", keywords: "audit", meta: "AU" },
  { value: "CM-6", label: "CM-6 Configuration settings", keywords: "config", meta: "CM" },
  {
    value: "IR-4",
    label: "IR-4 Incident handling",
    keywords: "incident",
    meta: "IR",
    disabled: true,
  },
];

const meta = {
  title: "Primitives/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  parameters: { docs: { story: { inline: false, height: "420px" } } },
  args: {
    options: controls,
    placeholder: "Choose a control",
    searchPlaceholder: "Search controls",
    width: 320,
    onChange: () => {},
  },
  argTypes: {
    options: { control: false },
    value: { control: false },
    onChange: { control: false },
    placeholder: { control: "text" },
    searchPlaceholder: { control: "text" },
    empty: { control: "text" },
    width: { control: "number" },
    disabled: { control: "boolean" },
    className: { control: false },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

function Live(props: Partial<Story["args"]>) {
  const [value, setValue] = useState("AC-2(3)");
  return (
    <div className="max-w-[320px]">
      <Field label="Derived from control" hint="Type to filter; families as the trailing hint.">
        <Combobox {...meta.args} {...props} value={value} onChange={setValue} />
      </Field>
    </div>
  );
}

/** A hairline trigger; open it to search the list. One option is disabled. */
export const Playground: Story = {
  render: (args) => <Live {...args} />,
};

/** Nothing chosen yet: the placeholder reads muted. */
function Unchosen() {
  const [value, setValue] = useState("");
  return (
    <div className="max-w-[320px]">
      <Combobox {...meta.args} value={value} onChange={setValue} aria-label="Control" />
    </div>
  );
}

export const Placeholder: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Unchosen />,
};
