import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { ToggleGroup, Toolbar } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
  args: {
    items: [
      { value: "family", label: "Family" },
      { value: "stage", label: "Stage" },
      { value: "owner", label: "Owner" },
      { value: "component", label: "Component" },
    ],
    value: "family",
    onChange: () => {},
  },
  argTypes: {
    items: { control: false },
    value: { control: false },
    onChange: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function Live(props: { disabledLast?: boolean }) {
  const [value, setValue] = useState("family");
  return (
    <ToggleGroup
      aria-label="Lens"
      value={value}
      onChange={setValue}
      items={[
        { value: "family", label: "Family" },
        { value: "stage", label: "Stage" },
        { value: "owner", label: "Owner" },
        { value: "component", label: "Component", disabled: props.disabledLast ?? false },
      ]}
    />
  );
}

/** Exactly one item on. Pressing the on item again keeps it on. */
export const Playground: Story = {
  render: () => <Live />,
};

/** In a Toolbar beside the search, the way the control board switches lenses. */
export const InToolbar: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[720px] space-y-4">
      <Toolbar search="" onSearch={() => {}} placeholder="Search controls">
        <Live disabledLast />
      </Toolbar>
      <Spec>h-7 · bg-muted recess · on item lifts on card with a hairline</Spec>
    </div>
  ),
};
