import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive } from "lucide-react";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "../../components";
const meta = {
  title: "Components/AlertDialog",
  component: AlertDialog,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AlertDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
const cancelRef = createRef<HTMLButtonElement>();
function Confirmation() {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false);
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next, details) => {
        if (pending && !next) details.cancel();
        else setOpen(next);
      }}
    >
      <AlertDialogTrigger render={<Button variant="danger" />}>Archive program</AlertDialogTrigger>
      <AlertDialogContent initialFocus={cancelRef}>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Archive aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>Archive this program?</AlertDialogTitle>
          <AlertDialogDescription>
            Evidence stays readable. New changes will be disabled.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelRef} disabled={pending}>
            Keep program
          </AlertDialogCancel>
          <AlertDialogAction
            variant="danger"
            onClick={() => {
              if (pending) {
                setPending(false);
                setOpen(false);
              } else setPending(true);
            }}
          >
            {pending ? "Finish archive" : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export const ConfirmationAndPending: Story = {
  render: () => <Confirmation />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Archive program" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("alertdialog", { name: "Archive this program?" }),
      content = within(popup);
    await waitFor(() => expect(cancelRef.current).toHaveFocus());
    await expect(popup).toHaveAccessibleDescription(
      "Evidence stays readable. New changes will be disabled.",
    );
    const overlay = document.querySelector<HTMLElement>('[data-slot="alert-dialog-overlay"]')!;
    await userEvent.click(overlay);
    await expect(popup).toHaveAttribute("data-open");
    await waitFor(() => expect(popup).toBeVisible());
    await userEvent.click(content.getByRole("button", { name: "Archive" }));
    await userEvent.keyboard("{Escape}");
    await expect(content.getByRole("button", { name: "Keep program" })).toBeDisabled();
    await userEvent.click(content.getByRole("button", { name: "Finish archive" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    await body.findByRole("alertdialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
  },
};
export const SmallConfirmation: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button />}>Discard changes</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>Your saved record stays unchanged.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction render={<AlertDialogCancel />} variant="danger">
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Discard changes" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("alertdialog", { name: "Discard changes?" });
    await userEvent.click(within(popup).getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** The low-level portal parts allow a compact, caller-owned decision layout. */
export const CustomPortal: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button />}>Leave review</AlertDialogTrigger>
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <BaseAlertDialog.Popup
          className="fixed inset-x-200 top-1000 z-50 mx-auto rounded-large bg-surface-overlay p-250 text-default shadow-overlay"
          style={{ maxWidth: 320 }}
        >
          <AlertDialogTitle>Leave this review?</AlertDialogTitle>
          <AlertDialogDescription>Unsaved edits remain in this session.</AlertDialogDescription>
          <AlertDialogCancel>Keep reviewing</AlertDialogCancel>
        </BaseAlertDialog.Popup>
      </AlertDialogPortal>
    </AlertDialog>
  ),
};
