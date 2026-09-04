import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert, tones } from "../../components";
import { Box, Stack } from "../../primitives";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Alerts: Story = {
  render: () => (
    <Stack space="space.200" className="max-w-[560px]">
      <Alert tone="warning" title="3 controls are due this week">
        Verification for CTRL-0412, CTRL-0418 and CTRL-0450 is due by Friday.
      </Alert>
      <Alert tone="danger" title="Evidence expired">
        The bank reconciliation for July no longer covers the period.
      </Alert>
      <Alert tone="success" title="Assessment complete" />
      <Alert tone="information">Only a body. The tone sets the fill and the text.</Alert>
      <Alert tone="neutral" title="Draft">
        Neutral reads as a note, not a warning.
      </Alert>
    </Stack>
  ),
};

/** Every tone, plain and titled. */
export const AlertMatrix: Story = {
  render: () => (
    <Matrix
      rows={tones}
      cols={["plain", "titled"] as const}
      rowLabel="tone"
      render={(tone, col) => (
        <Box style={{ width: 300 }}>
          <Alert tone={tone} title={col === "titled" ? "Evidence expires in 12 days" : undefined}>
            {col === "titled"
              ? "Three artifacts on this control were collected more than a year ago."
              : "Three artifacts were collected more than a year ago."}
          </Alert>
        </Box>
      )}
    />
  ),
};
