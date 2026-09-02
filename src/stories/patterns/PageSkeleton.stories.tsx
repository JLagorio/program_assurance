import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageSkeleton } from "@/ds/patterns";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Patterns/PageSkeleton",
  component: PageSkeleton,
  tags: ["autodocs"],
  args: { rows: 8 },
  argTypes: { rows: { control: "number" } },
} satisfies Meta<typeof PageSkeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The router renders this inside the shell while a route loader is pending. */
export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[920px] space-y-3">
      <PageSkeleton {...args} />
      <Spec>title 20px · description 12px · four tab bars · rows 12px with a 16px gap</Spec>
    </div>
  ),
};
