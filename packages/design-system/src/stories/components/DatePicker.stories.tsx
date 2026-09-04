import type { Meta, StoryObj } from "@storybook/react-vite";

import { DatePicker } from "../../components";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/DatePicker",
  component: DatePicker,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Empty, with a value, disabled. */
export const DatePickerMatrix: Story = {
  render: () => (
    <Specimens title="DatePicker">
      <DatePicker aria-label="Due" onChange={() => {}} />
      <DatePicker aria-label="Due" value="2026-09-18" onChange={() => {}} />
      <DatePicker aria-label="Due" value="2026-09-18" disabled onChange={() => {}} />
    </Specimens>
  ),
};
