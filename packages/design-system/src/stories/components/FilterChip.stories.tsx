import type { Meta, StoryObj } from "@storybook/react-vite";

import { FilterChip } from "../../components";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/FilterChip",
  component: FilterChip,
  parameters: { layout: "padded" },
  args: { label: "Owner" },
} satisfies Meta<typeof FilterChip>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Inactive, active, with a value, and disabled. */
export const FilterChipMatrix: Story = {
  render: () => (
    <Specimens title="FilterChip">
      <FilterChip label="Impact" />
      <FilterChip label="Impact" isActive />
      <FilterChip label="Baseline" value="Rev. 5" isActive />
      <FilterChip label="Owner" disabled />
    </Specimens>
  ),
};
