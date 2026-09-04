import type { Meta, StoryObj } from "@storybook/react-vite";

import { Dot, Select } from "../../components";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Select",
  component: Select,
  parameters: { layout: "padded" },
  args: { children: <Select.Item value="draft">Draft</Select.Item> },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Placeholder, value, disabled, a group with a separator and dots, and a fixed width. */
export const SelectMatrix: Story = {
  render: () => (
    <Specimens title="Select">
      <Select placeholder="Choose a status" onValueChange={() => {}} aria-label="Status">
        <Select.Item value="a">Draft</Select.Item>
      </Select>
      <Select value="review" onValueChange={() => {}} aria-label="Status">
        <Select.Item value="draft">Draft</Select.Item>
        <Select.Item value="review">In review</Select.Item>
      </Select>
      <Select value="review" onValueChange={() => {}} disabled aria-label="Status">
        <Select.Item value="review">In review</Select.Item>
      </Select>
      <Select value="draft" onValueChange={() => {}} aria-label="Status" width={220}>
        <Select.Group label="Open">
          <Select.Item value="draft">
            <Dot tone="neutral" /> Draft
          </Select.Item>
          <Select.Item value="review">
            <Dot tone="information" /> In review
          </Select.Item>
        </Select.Group>
        <Select.Separator />
        <Select.Group label="Closed">
          <Select.Item value="approved">
            <Dot tone="success" /> Approved
          </Select.Item>
          <Select.Item value="withdrawn" disabled>
            <Dot tone="danger" /> Withdrawn
          </Select.Item>
        </Select.Group>
      </Select>
    </Specimens>
  ),
};
