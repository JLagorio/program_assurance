import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive } from "lucide-react";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
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
  subcomponents: { AlertDialogContent, AlertDialogBody, AlertDialogCancel, AlertDialogAction },
  parameters: { layout: "padded" },
} satisfies Meta<typeof AlertDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
const cancelRef = createRef<HTMLButtonElement>();
function Confirmation() {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false);
  return (
    <AlertDialog open={open} pending={pending} onOpenChange={setOpen}>
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
          <AlertDialogCancel ref={cancelRef}>Keep program</AlertDialogCancel>
          <AlertDialogAction
            variant="danger"
            isLoading={pending}
            onClick={() => {
              setPending(true);
              // Close when the command succeeds.
              setTimeout(() => {
                setPending(false);
                setOpen(false);
              }, 1000);
            }}
          >
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
/**
 * `pending` on the root holds the decision while its command runs: Escape is cancelled, Cancel is
 * disabled and the popup is busy. The blanket never dismisses an AlertDialog.
 */
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
    await expect(popup).toHaveAttribute("aria-busy", "true");
    await userEvent.keyboard("{Escape}");
    await expect(popup).toBeVisible();
    const action = content.getByRole("button", { name: "Archive" });
    await expect(action).toHaveAttribute("aria-busy", "true");
    await expect(action).toHaveFocus();
    // Cancel, where focus started, is unavailable but still reachable: focus on it is never
    // dropped to the page, and pressing it does nothing.
    const keep = content.getByRole("button", { name: "Keep program" });
    await expect(keep).toHaveAttribute("aria-disabled", "true");
    await userEvent.tab({ shift: true });
    await expect(keep).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(popup).toBeVisible();
    await expect(keep).toHaveFocus();
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull(), { timeout: 4000 });
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

const records = Array.from({ length: 24 }, (_, i) => `Draft ${String(i + 1).padStart(2, "0")}`);

/**
 * AlertDialogBody holds what the decision affects when one line of description is not enough. It
 * scrolls between the header and the footer, so Cancel and the verb stay in view.
 */
export const WithBody: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="danger" />}>Delete 24 drafts</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete 24 drafts?</AlertDialogTitle>
          <AlertDialogDescription>These drafts are removed for everyone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogBody>
          <ul className="flex flex-col gap-050 ps-200">
            {records.map((record) => (
              <li key={record} className="list-disc">
                {record}
              </li>
            ))}
          </ul>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep drafts</AlertDialogCancel>
          <AlertDialogAction render={<AlertDialogCancel />} variant="danger">
            Delete drafts
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Delete 24 drafts" }));
    const popup = await body.findByRole("alertdialog", { name: "Delete 24 drafts?" });
    const region = popup.querySelector<HTMLElement>('[data-slot="alert-dialog-body"]')!;
    await expect(within(region).getAllByRole("listitem")).toHaveLength(24);
    await waitFor(() =>
      expect(popup.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight),
    );
    const footer = popup.querySelector<HTMLElement>('[data-slot="alert-dialog-footer"]')!;
    region.scrollTop = region.scrollHeight;
    await expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    await userEvent.click(within(popup).getByRole("button", { name: "Keep drafts" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
  },
};

/** The content's size, in a one-line confirmation. */
export const Playground: StoryObj<typeof AlertDialogContent> = {
  args: { size: "default" },
  argTypes: { size: { control: "inline-radio", options: ["default", "sm"] } },
  render: (args) => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button />}>Leave the page</AlertDialogTrigger>
      <AlertDialogContent {...args}>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this page?</AlertDialogTitle>
          <AlertDialogDescription>Your changes are kept as a draft.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction render={<AlertDialogCancel />}>Leave</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Leave the page" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("alertdialog", { name: "Leave this page?" });
    await userEvent.click(within(popup).getByRole("button", { name: "Stay" }));
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
