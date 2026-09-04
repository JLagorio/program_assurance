import type { Meta, StoryObj } from "@storybook/react-vite";
import { Trash2 } from "lucide-react";
import { useState } from "react";

import { AlertDialog, Button } from "../../components";
import { Stack } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/AlertDialog",
  component: AlertDialog,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AlertDialog>;
export default meta;
type Story = StoryObj;

function AlertDialogStates() {
  const [open, setOpen] = useState<"primary" | "danger" | "pending" | null>(null);
  return (
    <Stack space="space.200">
      <Specimens title="AlertDialog">
        <Button variant="secondary" onClick={() => setOpen("primary")}>
          Primary
        </Button>
        <Button variant="danger" onClick={() => setOpen("danger")} iconBefore={<Trash2 />}>
          Danger
        </Button>
        <Button variant="secondary" onClick={() => setOpen("pending")}>
          Pending
        </Button>
      </Specimens>
      <AlertDialog
        open={open !== null}
        onClose={() => setOpen(null)}
        onConfirm={() => setOpen(null)}
        title={open === "danger" ? "Archive this program?" : "Submit for authorization?"}
        description={
          open === "danger"
            ? "Its controls, evidence and findings stay readable; nothing can be edited."
            : "The package locks and the authorizing official is notified."
        }
        tone={open === "danger" ? "danger" : "primary"}
        confirmLabel={open === "danger" ? "Archive" : "Submit"}
        pending={open === "pending"}
      />
    </Stack>
  );
}
/** Primary, danger, and pending. Open one. */
export const AlertDialogMatrix: Story = { render: () => <AlertDialogStates /> };
