import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Gates } from "../../components";
import { Box, Stack } from "../../primitives";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Gates",
  component: Gates,
  parameters: { layout: "padded" },
  args: { children: <Gates.Item met label="Owner" /> },
} satisfies Meta<typeof Gates>;
export default meta;
type Story = StoryObj<typeof meta>;

export const GatesStory: Story = {
  name: "Gates",
  render: () => (
    <Stack space="space.100" className="max-w-[420px]">
      <Gates>
        <Gates.Item met label="Owner" />
        <Gates.Item met label="One shall" />
        <Gates.Item
          met={false}
          label="Success criterion"
          reason="Nothing decides that it is met."
          action={
            <Button size="small" variant="link">
              Add
            </Button>
          }
        />
        <Gates.Item
          met={false}
          tone="danger"
          label="Source with rationale"
          reason="SI-7(1) gives no reason."
        />
      </Gates>
    </Stack>
  ),
};

/** Met and unmet in both unmet tones; bare, with a reason, with a reason and an action. */
export const GatesMatrix: Story = {
  render: () => (
    <Matrix
      rows={["met", "unmet · warning", "unmet · danger"] as const}
      cols={["label", "reason", "action"] as const}
      rowLabel="state"
      render={(row, col) => (
        <Box style={{ width: 260 }}>
          <Gates>
            <Gates.Item
              met={row === "met"}
              tone={row.endsWith("danger") ? "danger" : "warning"}
              label="Success criterion"
              reason={col === "label" ? undefined : "Nothing decides that it is met."}
              action={
                col === "action" ? (
                  <Button size="small" variant="link">
                    Add
                  </Button>
                ) : undefined
              }
            />
          </Gates>
        </Box>
      )}
    />
  ),
};
