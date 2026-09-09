import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;
const popupRef = createRef<HTMLDivElement>();
const fieldRef = createRef<HTMLInputElement>();
export const Form: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Schedule assessment</DialogTrigger>
      <DialogContent ref={popupRef} initialFocus={fieldRef}>
        <DialogHeader>
          <DialogTitle>Schedule assessment</DialogTitle>
          <DialogDescription>The assessor receives an invitation.</DialogDescription>
        </DialogHeader>
        <div className="p-250">
          <Input ref={fieldRef} aria-label="Assessment name" defaultValue="Quarterly review" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button variant="primary">Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Schedule assessment" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("dialog", { name: "Schedule assessment" });
    await expect(popupRef.current).toBe(popup);
    await expect(popup).toHaveAccessibleDescription("The assessor receives an invitation.");
    await waitFor(() => expect(fieldRef.current).toHaveFocus());
    await userEvent.tab({ shift: true });
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
function PendingForm() {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (!next && pending) details.cancel();
        else setOpen(next);
      }}
    >
      <DialogTrigger render={<Button />}>Edit review</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit review</DialogTitle>
        </DialogHeader>
        <div className="p-250">
          <Select defaultValue="draft" items={{ draft: "Draft", ready: "Ready" }}>
            <SelectTrigger aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
            </SelectContent>
          </Select>
          <p role="status">{pending ? "Saving" : "Ready to save"}</p>
        </div>
        <DialogFooter>
          <DialogClose disabled={pending} render={<Button variant="subtle" />}>
            Cancel
          </DialogClose>
          <Button onClick={() => setPending(!pending)}>{pending ? "Finish saving" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export const PendingAndNestedPopup: Story = {
  render: () => <PendingForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Edit review" }));
    const popup = within(await body.findByRole("dialog", { name: "Edit review" }));
    await userEvent.click(popup.getByRole("combobox", { name: "Status" }));
    await body.findByRole("option", { name: "Ready" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await expect(body.getByRole("dialog", { name: "Edit review" })).toBeVisible();
    await userEvent.click(popup.getByRole("button", { name: "Save" }));
    await userEvent.keyboard("{Escape}");
    await expect(popup.getByRole("status")).toHaveTextContent("Saving");
    await expect(popup.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await userEvent.click(popup.getByRole("button", { name: "Finish saving" }));
    await userEvent.click(popup.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};
export const Scrollable: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Review controls</DialogTrigger>
      <DialogContent style={{ maxWidth: 860 }}>
        <DialogHeader>
          <DialogTitle>Review controls</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-250">
          {Array.from({ length: 60 }, (_, i) => (
            <p key={i} className="py-100">
              Control {i + 1}: Review implementation evidence.
            </p>
          ))}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Review controls" }));
    const dialog = await body.findByRole("dialog", { name: "Review controls" });
    await waitFor(() =>
      expect(dialog.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight),
    );
    const scroller = within(dialog).getByText(
      "Control 60: Review implementation evidence.",
    ).parentElement!;
    await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/** Use the exposed portal and backdrop with a Base UI popup for a custom surface. */
export const CustomPortal: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Open custom surface</DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <BaseDialog.Popup
          className="fixed inset-x-200 top-1000 z-50 mx-auto rounded-large bg-surface-overlay p-250 text-default shadow-overlay"
          style={{ maxWidth: 440 }}
        >
          <DialogTitle>Custom review surface</DialogTitle>
          <p className="py-150">Portal and backdrop can frame a custom popup layout.</p>
          <DialogClose render={<Button />}>Done</DialogClose>
        </BaseDialog.Popup>
      </DialogPortal>
    </Dialog>
  ),
};
