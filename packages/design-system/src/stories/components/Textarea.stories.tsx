import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "../../components";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

const textStates = ["default", "filled", "disabled", "invalid", "read only"] as const;
type TextState = (typeof textStates)[number];
const stateProps = (s: TextState) => ({
  defaultValue: s === "default" ? undefined : "Northwind payroll",
  disabled: s === "disabled",
  "aria-invalid": s === "invalid" ? true : undefined,
  readOnly: s === "read only",
});

/** Textarea by every state. */
export const TextareaMatrix: Story = {
  render: () => (
    <Matrix
      rows={["Textarea"] as const}
      cols={textStates}
      rowLabel="control"
      render={(_row, s) => {
        const p = stateProps(s);
        return <Textarea placeholder="Placeholder" {...p} style={{ width: 180 }} rows={2} />;
      }}
    />
  ),
};
