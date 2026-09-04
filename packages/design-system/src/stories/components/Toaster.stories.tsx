import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Toaster, toast } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Toaster",
  component: Toaster,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj;

export const Toasts: Story = {
  render: () => (
    <>
      <Toaster />
      <Inline space="space.100">
        <Button
          onClick={() =>
            toast.success("Evidence linked", { description: "Bank reconciliation, July" })
          }
        >
          Success
        </Button>
        <Button
          onClick={() =>
            toast.error("Could not save", { description: "The owner must be on the programme." })
          }
        >
          Error
        </Button>
        <Button onClick={() => toast.warning("Due in 2 days")}>Warning</Button>
        <Button
          onClick={() =>
            toast.info("3 controls updated", {
              action: { label: "Undo", onClick: () => undefined },
            })
          }
        >
          Info with action
        </Button>
      </Inline>
    </>
  ),
};

/** Every kind of toast, fired from a button. */
export const ToasterMatrix: Story = {
  render: () => (
    <Stack space="space.200">
      <Toaster />
      <Specimens title="toast">
        <Button variant="secondary" size="small" onClick={() => toast("Saved")}>
          Plain
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => toast.success("Assessment recorded")}
        >
          Success
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => toast.error("Could not reach the evidence store")}
        >
          Error
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => toast.info("Three artifacts expire this month")}
        >
          Info
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => toast.loading("Generating the package…")}
        >
          Loading
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() =>
            toast("Archived PRG-1041", {
              description: "Its controls stay readable.",
              action: { label: "Undo", onClick: () => {} },
            })
          }
        >
          With an action
        </Button>
      </Specimens>
    </Stack>
  ),
};
