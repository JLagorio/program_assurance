import type { Meta, StoryObj } from "@storybook/react-vite";
import { Command as CommandIcon, Search, X } from "lucide-react";

import { Input, InputGroup, Kbd, NativeSelect } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/InputGroup",
  component: InputGroup,
  tags: ["autodocs"],
  args: { children: null },
  argTypes: {
    leading: { control: false },
    trailing: { control: false },
    children: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A search icon, a shortcut hint, a unit, a clear button, and a NativeSelect with an icon. */
export const Matrix: Story = {
  render: () => (
    <div className="max-w-[360px] space-y-4">
      <div className="space-y-1.5">
        <Spec>leading icon</Spec>
        <InputGroup leading={<Search />}>
          <Input placeholder="Search controls" />
        </InputGroup>
      </div>
      <div className="space-y-1.5">
        <Spec>leading icon + trailing shortcut, the shell's search</Spec>
        <InputGroup
          leading={<Search />}
          trailing={
            <span className="flex items-center gap-0.5">
              <CommandIcon className="size-2.5" />K
            </span>
          }
        >
          <Input type="search" placeholder="Search risks, controls, evidence…" />
        </InputGroup>
      </div>
      <div className="space-y-1.5">
        <Spec>trailing unit</Spec>
        <InputGroup trailing="days">
          <Input type="number" defaultValue={90} className="tnum" />
        </InputGroup>
      </div>
      <div className="space-y-1.5">
        <Spec>trailing clear button</Spec>
        <InputGroup
          trailing={
            <button
              type="button"
              aria-label="Clear"
              className="rounded p-0.5 hover:text-foreground"
            >
              <X />
            </button>
          }
        >
          <Input defaultValue="AC-2(3)" />
        </InputGroup>
      </div>
      <div className="space-y-1.5">
        <Spec>NativeSelect with a leading Kbd</Spec>
        <InputGroup leading={<Kbd>F</Kbd>}>
          <NativeSelect defaultValue="AC">
            <option value="AC">Access control</option>
            <option value="AU">Audit and accountability</option>
          </NativeSelect>
        </InputGroup>
      </div>
    </div>
  ),
};
