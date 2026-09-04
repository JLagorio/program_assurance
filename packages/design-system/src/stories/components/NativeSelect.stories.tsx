import type { Meta, StoryObj } from "@storybook/react-vite";

import { NativeSelect } from "../../components";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/NativeSelect",
  component: NativeSelect,
  parameters: { layout: "padded" },
} satisfies Meta<typeof NativeSelect>;
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

/** NativeSelect by every state. */
export const NativeSelectMatrix: Story = {
  render: () => (
    <Matrix
      rows={["NativeSelect"] as const}
      cols={textStates}
      rowLabel="control"
      render={(_row, s) => {
        const p = stateProps(s);
        return (
          <NativeSelect
            aria-label="Owner"
            disabled={p.disabled}
            aria-invalid={p["aria-invalid"]}
            defaultValue={p.defaultValue ? "b" : ""}
            style={{ width: 180 }}
          >
            <option value="">Choose…</option>
            <option value="b">Northwind payroll</option>
          </NativeSelect>
        );
      }}
    />
  ),
};
