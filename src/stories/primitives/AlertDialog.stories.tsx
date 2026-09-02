import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { AlertDialog, Button } from "@/ds/primitives";
import { behindPage } from "../_lib/fixtures";

const noop = () => {};

const meta = {
  title: "Primitives/AlertDialog",
  component: AlertDialog,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", docs: { story: { inline: false, height: "480px" } } },
  decorators: [behindPage],
  args: {
    open: true,
    onClose: noop,
    onConfirm: noop,
    title: "Accept this risk?",
    description:
      "RSK-0112 stays open with no treatment. The authorizing official is recorded as accepting it, and the decision appears in the package.",
    confirmLabel: "Accept risk",
    tone: "primary",
  },
  argTypes: {
    open: { control: "boolean" },
    title: { control: "text" },
    description: { control: "text" },
    confirmLabel: { control: "text" },
    cancelLabel: { control: "text" },
    tone: { control: "inline-radio", options: ["primary", "danger"] },
    pending: { control: "boolean" },
    onClose: { control: false },
    onConfirm: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A decision with a word before it: no close button, no outside click. */
export const Confirm: Story = {};

/** Destructive: the confirm button is danger. */
export const Destructive: Story = {
  args: {
    title: "Delete POAM-0058?",
    description:
      "The item and its four milestones are removed from the register. This cannot be undone.",
    confirmLabel: "Delete item",
    tone: "danger",
  },
};

/** Pending: the caller keeps it open while it saves; the confirm button is busy. */
export const Pending: Story = {
  args: { pending: true, confirmLabel: "Accepting…" },
};

/** Wired: opens from a button, closes on either choice. */
function LiveDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="p-6">
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete item
        </Button>
      </div>
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        title="Delete POAM-0058?"
        description="The item and its four milestones are removed from the register."
        confirmLabel="Delete item"
        tone="danger"
      />
    </>
  );
}

export const Live: Story = {
  parameters: { controls: { disable: true } },
  render: () => <LiveDemo />,
};
