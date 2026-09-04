import type { Meta, StoryObj } from "@storybook/react-vite";

import { Switch } from "../../components";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Switch off, on and disabled. */
export const SwitchMatrix: Story = {
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
      rows={["Switch"] as const}
      cols={["off", "on", "off · disabled", "on · disabled"] as const}
      rowLabel="control"
      render={(_row, s) => {
        const on = s.startsWith("on");
        const disabled = s.includes("disabled");
        return (
          <Switch checked={on} disabled={disabled} onCheckedChange={() => {}}>
            Label
          </Switch>
        );
      }}
    />
  ),
};
