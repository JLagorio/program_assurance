import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Archive } from "lucide-react";
import { createRef, useState, type ReactNode } from "react";
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
  type AlertDialogWidth,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import * as typeStyle from "../_lib/type-style";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { typeOf, ramp } = typeStyle;
const { Pair } = pairLayout;

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
const steps: AlertDialogWidth[] = ["xsmall", "small", "medium"];

/** The content's width, in a one-line confirmation. */
export const Playground: StoryObj<typeof AlertDialogContent> = {
  args: { width: "small" },
  argTypes: { width: { control: "inline-radio", options: steps } },
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
    // The decision's title is Heading's `overlay` size, its h2.
    await expect(typeOf(content.getByRole("heading", { name: "Archive this program?" }))).toEqual({
      tag: "H2",
      ...ramp.overlay,
    });
    await waitFor(() => expect(cancelRef.current).toHaveFocus());
    await expect(popup).toHaveAccessibleDescription(
      "Evidence stays readable. New changes will be disabled.",
    );
    const overlay = document.querySelector<HTMLElement>('[data-slot="alert-dialog-overlay"]')!;
    await userEvent.click(overlay);
    await expect(popup).toHaveAttribute("data-open");
    await waitFor(() => expect(popup).toBeVisible());
    // The blanket never dismisses it, and a press on it leaves focus on Cancel.
    await expect(cancelRef.current).toHaveFocus();
    if (window.matchMedia("(forced-colors: active)").matches)
      await expect(getComputedStyle(popup).outlineStyle).toBe("solid");
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
/** `width="xsmall"`, 320px, for a one-line question. */
export const SmallConfirmation: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button />}>Discard changes</AlertDialogTrigger>
      <AlertDialogContent width="xsmall">
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
    await expect(popup).toHaveAttribute("data-width", "xsmall");
    await waitFor(() => expect(popup.getBoundingClientRect().width).toBeLessThanOrEqual(320));
    await userEvent.click(within(popup).getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

const records = Array.from({ length: 24 }, (_, i) => `Draft ${String(i + 1).padStart(2, "0")}`);

/**
 * AlertDialogBody holds what the decision affects when one line of description is not enough, in
 * a `medium` popup. It scrolls between the header and the footer, so Cancel and the verb stay in
 * view.
 */
export const WithBody: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="danger" />}>Delete 24 drafts</AlertDialogTrigger>
      <AlertDialogContent width="medium">
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

/**
 * A question that names a record by its code: the title and the description wrap the unbroken
 * value inside the popup, and the popup never scrolls sideways.
 */
export const LongValues: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button />}>Create program</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Create WS-X90_Expanded_Control_Set_2026-09-24_rev-0b9a3f4e?
          </AlertDialogTitle>
          <AlertDialogDescription>
            It starts from requirement_allocations_requirement_id_system_id_revision_key.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction render={<AlertDialogCancel />}>Create program</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Create program" }));
    const popup = await body.findByRole("alertdialog");
    await waitFor(() => expect(popup).toBeVisible());
    const edge = popup.getBoundingClientRect();
    for (const slot of ["alert-dialog-title", "alert-dialog-description"]) {
      const text = popup.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth + 1);
      await expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(edge.right);
    }
    await expect(popup.scrollWidth).toBeLessThanOrEqual(popup.clientWidth + 1);
    await userEvent.click(within(popup).getByRole("button", { name: "Keep editing" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
  },
};

const stepWidth: Record<AlertDialogWidth, number> = { xsmall: 320, small: 400, medium: 520 };

/**
 * The three widths are Dialog's words for Dialog's widths: `small` (the default) 400px, `medium`
 * 520px, and `xsmall` 320px below them. Each narrows to the window less a `space.200` gutter on
 * each side. The deprecated `size` still works: `sm` is `xsmall`, `default` is `small`.
 */
export const Widths: Story = {
  render: () => (
    <div className="flex flex-wrap gap-100">
      {steps.map((width) => (
        <AlertDialog key={width}>
          <AlertDialogTrigger render={<Button />}>Open {width}</AlertDialogTrigger>
          <AlertDialogContent width={width}>
            <AlertDialogHeader>
              <AlertDialogTitle>A {width} question?</AlertDialogTitle>
              <AlertDialogDescription>The width is chosen by the decision.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
      <AlertDialog>
        <AlertDialogTrigger render={<Button />}>Open the old spelling</AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>An old small question?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const room = window.innerWidth - 32;
    const opened = async (button: string, name: string, width: AlertDialogWidth) => {
      await userEvent.click(canvas.getByRole("button", { name: button }));
      const popup = await body.findByRole("alertdialog", { name });
      await expect(popup).toHaveAttribute("data-width", width);
      await waitFor(() =>
        expect(popup.getBoundingClientRect().width).toBeCloseTo(
          Math.min(stepWidth[width], room),
          0,
        ),
      );
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    };
    for (const width of steps) await opened(`Open ${width}`, `A ${width} question?`, width);
    await opened("Open the old spelling", "An old small question?", "xsmall");
  },
};

/**
 * A caller's attributes, class and ref reach each part, and each part's `data-slot` comes last, so
 * a stray attribute never renames the part a selector, a sticky footer or a test looks for. Cancel,
 * the title and the description are the exception: another part renders as them (an Action as
 * Cancel, a PageHeader.Title as a title) and names them.
 */
export const NativeAttributes: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger data-testid="trigger" data-slot="mine" render={<Button />}>
        Archive program
      </AlertDialogTrigger>
      <AlertDialogContent data-testid="content" data-slot="mine">
        <AlertDialogHeader data-testid="header" data-slot="mine">
          <AlertDialogTitle>Archive this program?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter data-testid="footer" data-slot="mine">
          <AlertDialogCancel data-testid="cancel">Keep program</AlertDialogCancel>
          <AlertDialogAction data-testid="action" data-slot="mine">
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByTestId("trigger");
    await expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
    await userEvent.click(trigger);
    await body.findByRole("alertdialog", { name: "Archive this program?" });
    for (const [id, slot] of [
      ["content", "alert-dialog-content"],
      ["header", "alert-dialog-header"],
      ["footer", "alert-dialog-footer"],
      ["cancel", "alert-dialog-cancel"],
      ["action", "alert-dialog-action"],
    ] as const)
      await expect(body.getByTestId(id)).toHaveAttribute("data-slot", slot);
    await userEvent.click(body.getByRole("button", { name: "Keep program" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
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
          className="fixed inset-x-200 top-1000 z-overlay mx-auto rounded-large bg-surface-overlay p-250 text-default shadow-overlay"
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

/** A confirmation's words, drawn in place so a Do and a Don't sit side by side. */
function ConfirmationWords({
  title,
  description,
  footer,
}: {
  title: string;
  description: string;
  footer: ReactNode;
}) {
  return (
    <Stack space="space.150">
      <Stack space="space.050">
        <Text weight="semibold">{title}</Text>
        <Text size="small" color="color.text.subtle">
          {description}
        </Text>
      </Stack>
      <Inline space="space.100" alignInline="end" shouldWrap>
        {footer}
      </Inline>
    </Stack>
  );
}

/**
 * The title asks the question with its object, the description says the consequence, and both
 * buttons say what they do. "Are you sure?" with OK makes the reader read the question twice and
 * still guess what OK deletes.
 */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <ConfirmationWords
          title="Delete 24 drafts?"
          description="These drafts are removed for everyone."
          footer={
            <>
              <Button variant="subtle">Keep drafts</Button>
              <Button variant="danger">Delete drafts</Button>
            </>
          }
        />
      }
      doText="The question names what goes, the description says what follows, and the action is its verb."
      dont={
        <ConfirmationWords
          title="Are you sure?"
          description="Are you sure you want to delete these drafts?"
          footer={
            <>
              <Button variant="subtle">Cancel</Button>
              <Button variant="primary">OK</Button>
            </>
          }
        />
      }
      dontText="The question twice, no consequence, and an OK that hides the delete."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("These drafts are removed for everyone.")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Keep drafts" })).toBeVisible();
    // The action says the verb, in the danger colour; the Don't's says nothing.
    await expect(canvas.getByRole("button", { name: "Delete drafts" })).toHaveAttribute(
      "data-button-variant",
      "danger",
    );
    await expect(canvas.getByRole("button", { name: "OK" })).not.toHaveAttribute(
      "data-button-variant",
      "danger",
    );
  },
};
