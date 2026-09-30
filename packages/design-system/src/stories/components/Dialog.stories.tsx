import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  ErrorSummary,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  type DialogWidth,
  type ErrorSummaryIssue,
} from "../../components";
import { Heading, Stack } from "../../primitives";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  subcomponents: { DialogContent, DialogBody, DialogFooter, DialogClose },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Long enough to see the pending state, short enough for a play function. */
const SAVE_MS = 600;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const forcedColours = () => window.matchMedia("(forced-colors: active)").matches;
/** The dimming a Dialog or Sheet takes under a dialog opened inside it. */
const dimming = (popup: HTMLElement) => getComputedStyle(popup, "::after");

type Draft = { title: string; notes: string };
const emptyDraft: Draft = { title: "", notes: "" };

/**
 * The form dialog recipe: a controlled root opened from state, the first field focused through
 * `initialFocus`, the form inside DialogBody, the submit button in the footer joined to it through
 * `form`, validation on submit with an ErrorSummary, the pending lock while the save runs, a
 * confirmation before a dirty draft is discarded, and focus back on the opener when it closes.
 */
function CreateTask({ taken }: { taken?: string | undefined }) {
  const formId = useId();
  const titleId = `${formId}-title`;
  const titleRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [pending, setPending] = useState(false);
  const [issues, setIssues] = useState<ErrorSummaryIssue[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [discarding, setDiscarding] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const dirty = draft.title !== emptyDraft.title || draft.notes !== emptyDraft.notes;
  const titleError = issues.find((issue) => issue.id === "title")?.message;

  const close = () => {
    setOpen(false);
    setDraft(emptyDraft);
    setIssues([]);
  };
  const fail = (message: string) => {
    setIssues([{ id: "title", message, target: titleId }]);
    setAttempts((count) => count + 1);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const title = draft.title.trim();
    if (!title) return fail("Enter a title for the task.");
    setIssues([]);
    // The fields lock while the save runs; keep focus on the submit button, which stays focusable.
    submitRef.current?.focus();
    setPending(true);
    await wait(SAVE_MS);
    setPending(false);
    if (title === taken) return fail(`A task called “${title}” already exists. Change the title.`);
    setCreated(title);
    close();
  };

  return (
    <Stack space="space.150">
      <div>
        <Button onClick={() => setOpen(true)}>Create task</Button>
      </div>
      {created ? <p role="status">Created “{created}”.</p> : null}
      <Dialog
        open={open}
        pending={pending}
        onOpenChange={(next, details) => {
          if (next) return setOpen(true);
          if (dirty) {
            details.cancel();
            setDiscarding(true);
            return;
          }
          close();
        }}
      >
        <DialogContent width="medium" initialFocus={titleRef}>
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
            <DialogDescription>Describe the work. You can assign it later.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
              <Stack space="space.200">
                <ErrorSummary issues={issues} focusKey={attempts} />
                <FieldSet disabled={pending}>
                  <Stack space="space.200">
                    <Field invalid={Boolean(titleError)} required>
                      <FieldLabel>Title</FieldLabel>
                      <Input
                        ref={titleRef}
                        id={titleId}
                        name="title"
                        value={draft.title}
                        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                      />
                      {titleError ? <FieldError>{titleError}</FieldError> : null}
                    </Field>
                    <Field>
                      <FieldLabel>Notes</FieldLabel>
                      <Textarea
                        name="notes"
                        rows={3}
                        value={draft.notes}
                        onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                      />
                      <FieldDescription>What the assignee should know first.</FieldDescription>
                    </Field>
                  </Stack>
                </FieldSet>
              </Stack>
            </form>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
            <Button
              ref={submitRef}
              type="submit"
              form={formId}
              variant="primary"
              isLoading={pending}
            >
              Create task
            </Button>
          </DialogFooter>
          <AlertDialog open={discarding} onOpenChange={setDiscarding}>
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this task?</AlertDialogTitle>
                <AlertDialogDescription>
                  The title and notes you entered will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction
                  variant="danger"
                  onClick={() => {
                    setDiscarding(false);
                    close();
                  }}
                >
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

/**
 * A create form, the default create and edit surface. The first field takes focus through
 * `initialFocus`, never `autoFocus`, so focus returns to the opener. Submitting with the title empty
 * shows an ErrorSummary and marks the field; while the save runs the Dialog is `pending`: Escape,
 * the blanket and Close do nothing, the fields are disabled and the primary shows it is working.
 */
export const Form: Story = {
  render: () => <CreateTask />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "Create task" });
    await userEvent.click(opener);
    const popup = await body.findByRole("dialog", { name: "Create task" });
    const dialog = within(popup);
    await expect(popup).toHaveAccessibleDescription("Describe the work. You can assign it later.");
    const title = dialog.getByRole("textbox", { name: "Title" });
    await waitFor(() => expect(title).toHaveFocus());
    // Close comes first in the Tab order, where it is drawn, and the first field still takes focus.
    const closeButton = dialog.getByRole("button", { name: "Close" });
    await expect(
      closeButton.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    await userEvent.tab({ shift: true });
    await expect(closeButton).toHaveFocus();
    await userEvent.tab();
    await expect(title).toHaveFocus();
    // In forced colours the fill and shadow are gone; a CanvasText outline keeps the edge.
    if (forcedColours()) await expect(getComputedStyle(popup).outlineStyle).toBe("solid");
    // Submitting empty: the summary takes focus, names the fix and leads back to the field.
    await userEvent.click(dialog.getByRole("button", { name: "Create task" }));
    const summary = await dialog.findByRole("alert");
    await waitFor(() => expect(summary).toHaveFocus());
    await expect(within(summary).getByRole("heading", { level: 3 })).toHaveTextContent(
      "There is a problem",
    );
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await expect(title).toHaveAccessibleDescription("Enter a title for the task.");
    await userEvent.click(
      within(summary).getByRole("button", { name: "Enter a title for the task." }),
    );
    await waitFor(() => expect(title).toHaveFocus());
    await userEvent.type(title, "Quarterly review");
    // A dirty dismissal asks first; the dialog under the prompt dims, so its primary reads as out
    // of play, with no second blanket over the page. Keep editing keeps the draft and the dialog.
    await expect(dimming(popup).opacity).toBe("0");
    await userEvent.keyboard("{Escape}");
    const prompt = await body.findByRole("alertdialog", { name: "Discard this task?" });
    await waitFor(() => expect(popup).toHaveAttribute("data-nested-dialog-open"));
    await waitFor(() => expect(dimming(popup).opacity).toBe("1"));
    await expect(dimming(popup).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="alert-dialog-overlay"]'),
    ).toBeNull();
    await userEvent.click(within(prompt).getByRole("button", { name: "Keep editing" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(dimming(popup).opacity).toBe("0"));
    await expect(title).toHaveValue("Quarterly review");
    // Pending: busy, Close disabled but still focusable, every dismissal ignored.
    await userEvent.click(dialog.getByRole("button", { name: "Create task" }));
    await expect(popup).toHaveAttribute("aria-busy", "true");
    const close = dialog.getByRole("button", { name: "Close" });
    await expect(close).toHaveAttribute("aria-disabled", "true");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(title).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Create task" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(popup).toBeVisible();
    await expect(body.queryByRole("alertdialog")).toBeNull();
    // The save finishes: the dialog closes and focus returns to the opener.
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull(), { timeout: 4000 });
    await expect(canvas.getByRole("status")).toHaveTextContent("Created “Quarterly review”.");
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

/** A failed save keeps the draft and the dialog: the summary says what to change, and Discard asks first. */
export const FormSaveFails: Story = {
  render: () => <CreateTask taken="Quarterly review" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "Create task" });
    await userEvent.click(opener);
    const popup = await body.findByRole("dialog", { name: "Create task" });
    const dialog = within(popup);
    const title = dialog.getByRole("textbox", { name: "Title" });
    await waitFor(() => expect(title).toHaveFocus());
    await userEvent.type(title, "Quarterly review{Enter}");
    await expect(popup).toHaveAttribute("aria-busy", "true");
    await expect(dialog.getByRole("button", { name: "Create task" })).toHaveFocus();
    const summary = await dialog.findByRole("alert", {}, { timeout: 4000 });
    await expect(summary).toHaveTextContent("A task called “Quarterly review” already exists.");
    await waitFor(() => expect(summary).toHaveFocus());
    await expect(popup).not.toHaveAttribute("aria-busy");
    await expect(title).toHaveValue("Quarterly review");
    await expect(title).toBeEnabled();
    await userEvent.click(dialog.getByRole("button", { name: "Cancel" }));
    const prompt = await body.findByRole("alertdialog", { name: "Discard this task?" });
    await userEvent.click(within(prompt).getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};

const widths: DialogWidth[] = ["small", "medium", "large", "xlarge", "fullscreen"];
const expectedWidth: Record<DialogWidth, number> = {
  small: 400,
  medium: 520,
  large: 760,
  xlarge: 960,
  fullscreen: Number.POSITIVE_INFINITY,
};

/**
 * The five widths: `small` for a short question, `medium` (the default) for a form of a few fields,
 * `large` for two columns or a table, `xlarge` for a table beside a preview, `fullscreen` for a task
 * that needs the window. Each narrows to the window less a 1rem gutter.
 */
export const Widths: Story = {
  render: () => (
    <div className="flex flex-wrap gap-100">
      {widths.map((width) => (
        <Dialog key={width}>
          <DialogTrigger render={<Button />}>Open {width}</DialogTrigger>
          <DialogContent width={width}>
            <DialogHeader>
              <DialogTitle>A {width} dialog</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <p className="font-body">The width is chosen by the task, never set in pixels.</p>
            </DialogBody>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    for (const width of widths) {
      await userEvent.click(canvas.getByRole("button", { name: `Open ${width}` }));
      const popup = await body.findByRole("dialog", { name: `A ${width} dialog` });
      await expect(popup).toHaveAttribute("data-width", width);
      const gutter = 32;
      const room = window.innerWidth - gutter;
      await waitFor(() =>
        expect(popup.getBoundingClientRect().width).toBeCloseTo(
          Math.min(expectedWidth[width], room),
          0,
        ),
      );
      if (width === "fullscreen")
        await expect(popup.getBoundingClientRect().height).toBeCloseTo(
          window.innerHeight - gutter,
          0,
        );
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    }
  },
};

function PendingForm() {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false);
  return (
    <Dialog open={open} pending={pending} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Edit review</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit review</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Stack space="space.150">
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
          </Stack>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button onClick={() => setPending(!pending)}>{pending ? "Finish saving" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * `pending` on the root holds the dialog while a command runs: Escape, the blanket, Close and every
 * DialogClose are cancelled or disabled, and the popup is busy. A nested Select still closes on its
 * own Escape. The built-in Close keeps focus while it is disabled.
 */
export const PendingAndNestedPopup: Story = {
  render: () => <PendingForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Edit review" }));
    const popupElement = await body.findByRole("dialog", { name: "Edit review" });
    const popup = within(popupElement);
    await userEvent.click(popup.getByRole("combobox", { name: "Status" }));
    await body.findByRole("option", { name: "Ready" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await expect(body.getByRole("dialog", { name: "Edit review" })).toBeVisible();
    await userEvent.click(popup.getByRole("button", { name: "Save" }));
    await expect(popupElement).toHaveAttribute("aria-busy", "true");
    await userEvent.keyboard("{Escape}");
    await expect(popup.getByRole("status")).toHaveTextContent("Saving");
    // Cancel is unavailable but keeps its place in the Tab order, and pressing it does nothing.
    const cancel = popup.getByRole("button", { name: "Cancel" });
    await expect(cancel).toHaveAttribute("aria-disabled", "true");
    cancel.focus();
    await expect(cancel).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(cancel);
    await expect(popupElement).toBeVisible();
    await expect(popupElement).toHaveAttribute("aria-busy", "true");
    const close = popup.getByRole("button", { name: "Close" });
    close.focus();
    await expect(close).toHaveFocus();
    await expect(close).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Enter}");
    await expect(popupElement).toBeVisible();
    await expect(close).toHaveFocus();
    // A press on the blanket leaves the pending dialog open and keeps focus where it was.
    await userEvent.click(
      canvasElement.ownerDocument.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!,
    );
    await expect(popupElement).toBeVisible();
    await expect(close).toHaveFocus();
    await userEvent.click(popup.getByRole("button", { name: "Finish saving" }));
    await expect(popupElement).not.toHaveAttribute("aria-busy");
    await userEvent.click(popup.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/**
 * DialogBody is the one scroller between a fixed header and footer. Read-only content that
 * overflows makes it a tab stop, "Content, scrolls", so the keyboard can scroll it. Its headings
 * start one level below the dialog's title, and a part that matches its surface (a sticky label
 * here) paints the dialog's colour, not the page's.
 */
export const Scrollable: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Review changes</DialogTrigger>
      <DialogContent width="large">
        <DialogHeader>
          <DialogTitle>Review changes</DialogTitle>
        </DialogHeader>
        <DialogBody className="pt-0">
          <div data-testid="sticky-label" className="sticky top-0 bg-surface-current pb-100 pt-250">
            <Heading size="xsmall">Sixty changes</Heading>
          </div>
          {Array.from({ length: 60 }, (_, i) => (
            <p key={i} className="py-100 font-body">
              Change {i + 1}: the owner and the due date were updated.
            </p>
          ))}
        </DialogBody>
        <DialogFooter showCloseButton>
          <DialogClose render={<Button variant="primary" />}>Publish changes</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Review changes" }));
    const popup = await body.findByRole("dialog", { name: "Review changes" });
    await waitFor(() =>
      expect(popup.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight),
    );
    const scroller = await within(popup).findByRole("group", { name: "Content, scrolls" });
    await expect(scroller).toHaveAttribute("data-slot", "dialog-body");
    await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
    await expect(within(popup).getByRole("heading", { name: "Sixty changes" }).tagName).toBe("H3");
    const label = within(popup).getByTestId("sticky-label");
    await expect(getComputedStyle(label).backgroundColor).toBe(
      getComputedStyle(popup).backgroundColor,
    );
    await expect(scroller.tabIndex).toBe(0);
    // Its focus ring is drawn inside it, so the popup's edges cannot clip it.
    scroller.focus({ focusVisible: true } as FocusOptions);
    await waitFor(() =>
      expect(getComputedStyle(scroller).outlineOffset.startsWith("-")).toBe(true),
    );
    scroller.scrollTop = scroller.scrollHeight;
    await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0));
    const footer = popup.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
    await expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    // The footer's Close comes before the primary, and the footer is the dialog's own surface,
    // divided from the body by its hairline.
    const [footerClose, publish] = within(footer).getAllByRole("button");
    await expect(footerClose).toHaveAccessibleName("Close");
    await expect(publish).toHaveAccessibleName("Publish changes");
    await expect(getComputedStyle(footer).backgroundColor).toBe(
      getComputedStyle(popup).backgroundColor,
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

const longFormFields = [
  "Title",
  "Owner",
  "Reviewer",
  "Start date",
  "Due date",
  "Location",
  "Reference",
  "Budget",
  "Contact",
  "Notes",
];

/**
 * A form taller than the window. Every field comes into view when it takes focus, clear of the
 * footer, and the primary stays reachable: in a window under 30rem tall (a landscape phone, or
 * 400% zoom) the header scrolls away with the body and the footer stays at the bottom.
 */
export const LongForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Create booking</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create booking</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form id="long-form" noValidate onSubmit={(event) => event.preventDefault()}>
            <Stack space="space.200">
              {longFormFields.map((name) => (
                <Field key={name}>
                  <FieldLabel>{name}</FieldLabel>
                  <Input name={name} />
                </Field>
              ))}
            </Stack>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button type="submit" form="long-form" variant="primary">
            Create booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Create booking" }));
    const popup = await body.findByRole("dialog", { name: "Create booking" });
    const dialog = within(popup);
    const footer = popup.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
    const first = dialog.getByRole("textbox", { name: "Title" });
    await waitFor(() => expect(first).toHaveFocus());
    const visible = (element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      const x = box.left + box.width / 2,
        y = box.top + box.height / 2;
      return element.contains(element.ownerDocument.elementFromPoint(x, y));
    };
    for (const name of longFormFields.slice(1)) {
      await userEvent.tab();
      const field = dialog.getByRole("textbox", { name });
      await expect(field).toHaveFocus();
      await waitFor(() => expect(visible(field)).toBe(true));
      await expect(field.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        footer.getBoundingClientRect().top + 1,
      );
    }
    const primary = dialog.getByRole("button", { name: "Create booking" });
    await expect(visible(primary)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/**
 * A short window for a story: its own viewport option, so the story renders at that size in the
 * Storybook and in every test project. Under 30rem tall a dialog changes how it scrolls.
 */
const shortWindow = (width: number, height: number) => ({
  parameters: {
    viewport: {
      options: {
        ledgerShort: {
          name: `Short window (${width} by ${height} CSS px)`,
          styles: { width: `${width}px`, height: `${height}px` },
        },
      },
    },
  },
  globals: { viewport: { value: "ledgerShort", isRotated: false } },
});

/** In a short window the popup is the one scroller: the header has scrolled away, the footer stays. */
const shortWindowPlay: NonNullable<Story["play"]> = async (context) => {
  await expect(window.innerHeight).toBeLessThanOrEqual(480);
  const body = within(context.canvasElement.ownerDocument.body);
  await LongForm.play?.(context);
  await userEvent.click(
    within(context.canvasElement).getByRole("button", { name: "Create booking" }),
  );
  const popup = await body.findByRole("dialog", { name: "Create booking" });
  const region = popup.querySelector<HTMLElement>('[data-slot="dialog-body"]')!;
  const footer = popup.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
  await expect(getComputedStyle(region).overflowY).toBe("visible");
  await expect(getComputedStyle(region).flexShrink).toBe("0");
  await expect(popup.scrollHeight).toBeGreaterThan(popup.clientHeight);
  popup.scrollTop = popup.scrollHeight;
  await waitFor(() =>
    expect(Math.round(footer.getBoundingClientRect().bottom)).toBeLessThanOrEqual(
      Math.round(popup.getBoundingClientRect().bottom),
    ),
  );
  await expect(
    popup.querySelector('[data-slot="dialog-header"]')!.getBoundingClientRect().bottom,
  ).toBeLessThan(popup.getBoundingClientRect().top + 1);
  popup.scrollTop = 0;
  await waitFor(() =>
    expect(within(popup).getByRole("heading", { name: "Create booking" })).toBeVisible(),
  );
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
};

/**
 * The long form on a landscape phone, 844 by 390 CSS px, or a laptop at 200% zoom. Every field and
 * the primary can be reached and seen; scrolling back up brings the title and Close back.
 */
export const ShortWindow: Story = { ...LongForm, ...shortWindow(844, 390), play: shortWindowPlay };

/** The long form at 400% zoom, 320 by 256 CSS px: still operable, with the footer in view. */
export const ZoomedWindow: Story = { ...LongForm, ...shortWindow(320, 256), play: shortWindowPlay };

/** A field that takes focus as it mounts, as `autoFocus` does; the kit still returns focus to the opener. */
function NameField() {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => ref.current?.focus(), []);
  return (
    <Field>
      <FieldLabel>Name</FieldLabel>
      <Input ref={ref} defaultValue="Quarterly review" />
    </Field>
  );
}

function RenameFromState() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Rename record</Button>
      {open ? (
        <Dialog open onOpenChange={(next) => setOpen(next)}>
          <DialogContent width="small">
            <DialogHeader>
              <DialogTitle>Rename record</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <NameField />
            </DialogBody>
            <DialogFooter>
              <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
              <DialogClose render={<Button variant="primary" />}>Rename record</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

/**
 * A dialog mounted from state, with `open` true from its first render, whose field takes focus as
 * it mounts. The Dialog records the opener as it opens, so Escape, Cancel and the primary all
 * return focus to it rather than to the page. Prefer `initialFocus` on DialogContent for the first
 * field; `finalFocus` still wins when the opener goes away with the task.
 */
export const FocusReturnFromState: Story = {
  render: () => <RenameFromState />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "Rename record" });
    for (const close of ["{Escape}", "Cancel", "Rename record"]) {
      await userEvent.click(opener);
      const popup = await body.findByRole("dialog", { name: "Rename record" });
      await waitFor(() =>
        expect(within(popup).getByRole("textbox", { name: "Name" })).toHaveFocus(),
      );
      if (close === "{Escape}") await userEvent.keyboard(close);
      else await userEvent.click(within(popup).getByRole("button", { name: close }));
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(opener).toHaveFocus());
    }
  },
};

const longValue = "WS-X90_Expanded_Control_Set_2026-09-24_rev-0b9a3f4e5c1d4e7a9f2b8c6d1e0a7b3f";

/**
 * A title and a description that hold an unbroken value, such as a record's code or a server's
 * error, wrap inside the popup instead of running past its edge.
 */
export const LongValues: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Import control set</DialogTrigger>
      <DialogContent width="small">
        <DialogHeader>
          <DialogTitle>Import {longValue}</DialogTitle>
          <DialogDescription>
            The import stopped at constraint
            requirement_allocations_requirement_id_system_id_revision_key.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="font-body">Nothing was imported. Check the file and try again.</p>
        </DialogBody>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Import control set" }));
    const popup = await body.findByRole("dialog", { name: `Import ${longValue}` });
    await waitFor(() => expect(popup).toBeVisible());
    const edge = popup.getBoundingClientRect();
    for (const slot of ["dialog-title", "dialog-description"]) {
      const text = popup.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth + 1);
      await expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(edge.right);
    }
    await expect(popup.scrollWidth).toBeLessThanOrEqual(popup.clientWidth + 1);
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

/** Every prop on DialogContent, in a form of a few fields. */
export const Playground: StoryObj<typeof DialogContent> = {
  args: { width: "medium", showCloseButton: true },
  argTypes: {
    width: { control: "inline-radio", options: widths },
    showCloseButton: { control: "boolean" },
  },
  render: (args) => (
    <Dialog>
      <DialogTrigger render={<Button />}>Edit member</DialogTrigger>
      <DialogContent {...args}>
        <DialogHeader>
          <DialogTitle>Edit member</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Field>
            <FieldLabel>Display name</FieldLabel>
            <Input defaultValue="Dana Whitfield" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <DialogClose render={<Button variant="primary" />}>Save member</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Edit member" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("dialog", { name: "Edit member" });
    await waitFor(() =>
      expect(within(popup).getByRole("textbox", { name: "Display name" })).toBeVisible(),
    );
    await userEvent.click(within(popup).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
