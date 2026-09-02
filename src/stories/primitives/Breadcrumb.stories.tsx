import type { Meta, StoryObj } from "@storybook/react-vite";

import { Breadcrumb } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
  args: {
    items: [
      { label: "Programs", to: "/programs" },
      {
        label: "PRG-1041 Northwind payroll",
        to: "/programs/$programId",
        params: { programId: "PRG-1041" },
      },
      { label: "Controls", to: "/programs/$programId", params: { programId: "PRG-1041" } },
      { label: "AC-2(3) Disable accounts" },
    ],
  },
  argTypes: { items: { control: false }, className: { control: false } },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Four levels: three links up the record tree, the page itself last in foreground. */
export const Playground: Story = {};

/** Two levels, the shortest useful trail. */
export const Short: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-2">
      <Breadcrumb items={[{ label: "Risks", to: "/risks" }, { label: "RSK-0112" }]} />
      <Spec>12px · muted links, foreground current · chevron 12px</Spec>
    </div>
  ),
};
