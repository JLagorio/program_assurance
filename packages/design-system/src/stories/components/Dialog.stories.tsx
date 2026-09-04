import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Dialog } from "../../components";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj;

function DialogStates() {
  const [open, setOpen] = useState<"medium" | "large" | "aside" | null>(null);
  return (
    <Stack space="space.200">
      <Specimens title="Dialog">
        <Button variant="secondary" onClick={() => setOpen("medium")}>
          Medium
        </Button>
        <Button variant="secondary" onClick={() => setOpen("large")}>
          Large
        </Button>
        <Button variant="secondary" onClick={() => setOpen("aside")}>
          Large with an aside
        </Button>
      </Specimens>
      <Dialog
        open={open !== null}
        onClose={() => setOpen(null)}
        title="Schedule assessment"
        description="The assessor and the program owner are notified."
        width={open === "medium" ? "medium" : "large"}
        aside={
          open === "aside" ? (
            <Text size="small" color="color.text.subtle">
              An aside carries reference beside the form.
            </Text>
          ) : undefined
        }
        footer={
          <>
            <Button variant="subtle" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(null)}>
              Schedule
            </Button>
          </>
        }
      >
        <Text>Body of a {open} dialog.</Text>
      </Dialog>
    </Stack>
  );
}
/** Medium, large, and large with an aside. Open one. */
export const DialogMatrix: Story = { render: () => <DialogStates /> };
