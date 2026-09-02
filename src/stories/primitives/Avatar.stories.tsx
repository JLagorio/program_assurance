import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, Person } from "@/ds/primitives";
import { people } from "../_lib/fixtures";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { name: "D. Reyes", size: "sm" },
  argTypes: {
    name: { control: "text" },
    size: { control: "inline-radio", options: ["xs", "sm"] },
    className: { control: false },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Avatar at both sizes, Person, and an Avatar.Stack overflowing its max. Neutral on purpose: colour is for state. */
export const People: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Spec>Avatar · xs</Spec>
        <div className="flex items-center gap-2">
          {people.map((p) => (
            <Avatar key={p} name={p} size="xs" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Spec>Avatar · sm</Spec>
        <div className="flex items-center gap-2">
          {people.map((p) => (
            <Avatar key={p} name={p} size="sm" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Spec>Person</Spec>
        <div className="space-y-1.5">
          {people.slice(0, 3).map((p) => (
            <Person key={p} name={p} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Spec>Avatar.Stack · 6 names, max 4</Spec>
        <Avatar.Stack names={people} />
      </div>
    </div>
  ),
};
