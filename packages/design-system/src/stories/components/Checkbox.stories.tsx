import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "../../components";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Checkbox off, on and disabled, and mixed. */
export const CheckboxMatrix: Story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          // Disabled labels are exempt from contrast (WCAG 1.4.3, inactive components); axe cannot tell the
          // Radix control beside them is disabled, so it measures color.text.disabled anyway.
          { id: "color-contrast", selector: "*:not(.text-disabled *)" },
        ],
      },
    },
  },
  render: () => (
    <Matrix
      rows={["Checkbox"] as const}
      cols={["off", "on", "off · disabled", "on · disabled", "mixed"] as const}
      rowLabel="control"
      render={(_row, s) => {
        const on = s.startsWith("on") || s === "mixed";
        const disabled = s.includes("disabled");
        return (
          <Checkbox
            checked={s === "mixed" ? "indeterminate" : on}
            disabled={disabled}
            onCheckedChange={() => {}}
          >
            Label
          </Checkbox>
        );
      }}
    />
  ),
};
