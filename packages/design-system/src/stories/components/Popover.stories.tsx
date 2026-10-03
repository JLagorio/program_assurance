import type { Meta, StoryObj } from "@storybook/react-vite";
import { SlidersHorizontal } from "lucide-react";
import { useId, createRef, useState, type ReactNode } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  FieldLabel,
  Button,
  buttonVariants,
  Calendar,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Field,
  IconButton,
  Input,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Textarea,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Grid, Inline, Stack, Text } from "../../primitives";

import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const meta = {
  title: "Components/Popover",
  component: Popover,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

const triggerRef = createRef<HTMLButtonElement>();
const renderedTriggerRef = createRef<HTMLButtonElement>();
const contentRef = createRef<HTMLDivElement>();
const renderedContentRef = createRef<HTMLDivElement>();
const closeRef = createRef<HTMLButtonElement>();
const triggerClick = fn();
const renderedClick = fn();
const submit = fn();

/**
 * The usage to copy: a trigger rendered as the kit's Button, and content with a title, a
 * description and a close.
 */
export const Usage: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger render={<Button />}>Review schedule</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Review schedule</PopoverTitle>
          <PopoverDescription>Reviews occur every quarter.</PopoverDescription>
        </PopoverHeader>
        <PopoverClose render={<Button size="small" />}>Done</PopoverClose>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Review schedule" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("dialog", { name: "Review schedule" });
    await expect(popup).toHaveAccessibleDescription("Reviews occur every quarter.");
    await userEvent.click(within(popup).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Native composition with a title and description, plus a logical placement under RTL. */
export const PopoverMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Grid
        templateColumns="repeat(2, minmax(0, 1fr))"
        gap="space.400"
        style={{ padding: 64, minHeight: 240 }}
      >
        <Popover>
          <PopoverTrigger
            ref={triggerRef}
            render={
              <button
                ref={renderedTriggerRef}
                title="Review schedule settings"
                onClick={renderedClick}
              />
            }
            onClick={triggerClick}
            className={buttonVariants({ variant: "secondary" })}
          >
            Review schedule
          </PopoverTrigger>
          <PopoverContent
            ref={contentRef}
            render={
              <div ref={renderedContentRef} className="tabular-nums" style={{ minHeight: 96 }} />
            }
            className={(state) => (state.open ? "font-medium" : "font-regular")}
            style={(state) => ({ outlineOffset: state.open ? 4 : 2 })}
          >
            <PopoverHeader>
              <PopoverTitle>Review schedule</PopoverTitle>
              <PopoverDescription>Reviews occur every quarter.</PopoverDescription>
            </PopoverHeader>
            <PopoverClose ref={closeRef} render={<Button size="small" />}>
              Done
            </PopoverClose>
          </PopoverContent>
        </Popover>
        <LedgerProvider direction="rtl">
          <Popover modal="trap-focus">
            <PopoverTrigger
              nativeButton={false}
              render={<span />}
              className={buttonVariants({ variant: "secondary" })}
            >
              Sharing settings
            </PopoverTrigger>
            <PopoverContent side="inline-end" align="start" alignOffset={0} style={{ width: 220 }}>
              <PopoverHeader>
                <PopoverTitle>Sharing settings</PopoverTitle>
                <PopoverDescription>
                  Only program members can access this package.
                </PopoverDescription>
              </PopoverHeader>
              <PopoverClose render={<Button size="small" />}>Done</PopoverClose>
            </PopoverContent>
          </Popover>
        </LedgerProvider>
      </Grid>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    triggerClick.mockClear();
    renderedClick.mockClear();
    submit.mockClear();
    const trigger = canvas.getByRole("button", { name: "Review schedule" });
    await expect(triggerRef.current).toBe(trigger);
    await expect(renderedTriggerRef.current).toBe(trigger);
    await expect(trigger).toHaveAttribute("type", "button");
    await expect(trigger).toHaveAttribute("title", "Review schedule settings");
    await user.click(trigger);
    const popup = await body.findByRole("dialog", { name: "Review schedule" });
    await waitFor(() => expect(popup).toBeVisible());
    await expect(popup).toHaveAccessibleDescription("Reviews occur every quarter.");
    await expect(contentRef.current).toBe(popup);
    await expect(renderedContentRef.current).toBe(popup);
    await expect(popup).toHaveClass("font-medium", "tabular-nums");
    await expect(popup).toHaveStyle({ minHeight: "96px", outlineOffset: "4px" });
    await expect(popup).toHaveAttribute("data-side", "bottom");
    await expect(popup).toHaveAttribute("data-align", "center");
    await waitFor(() => expect(popup.getBoundingClientRect().width).toBe(288));
    await expect(canvasElement).not.toContainElement(popup);
    const done = within(popup).getByRole("button", { name: "Done" });
    await expect(closeRef.current).toBe(done);
    await waitFor(() => expect(done).toHaveFocus());
    await expect(trigger).toHaveAttribute("aria-controls", popup.id);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.click(done);
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await expect(triggerClick).toHaveBeenCalledTimes(1);
    await expect(renderedClick).toHaveBeenCalledTimes(1);
    await expect(submit).not.toHaveBeenCalled();
    const custom = canvas.getByRole("button", { name: "Sharing settings" });
    await expect(custom.tagName).toBe("SPAN");
    await user.tab();
    await expect(custom).toHaveFocus();
    await user.keyboard("{Enter}");
    const rtl = await body.findByRole("dialog", { name: "Sharing settings" });
    await waitFor(() => expect(rtl).toBeVisible());
    // Inline-end is the left in RTL. Where the window leaves no room there (a phone, a narrow
    // frame), the popup flips to stay on screen instead.
    if (custom.getBoundingClientRect().left >= rtl.getBoundingClientRect().width + 32) {
      await waitFor(() =>
        expect(rtl.getBoundingClientRect().right).toBeLessThanOrEqual(
          custom.getBoundingClientRect().left,
        ),
      );
    } else {
      await waitFor(() => expect(rtl.getBoundingClientRect().left).toBeGreaterThanOrEqual(0));
      await expect(rtl.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
    }
    const rtlDone = within(rtl).getByRole("button", { name: "Done" });
    await waitFor(() => expect(rtlDone).toHaveFocus());
    // Tab from the only control passes through Base UI's focus guard, which hands focus back.
    await user.tab();
    await waitFor(() => expect(rtlDone).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(custom).toHaveFocus();
    await user.keyboard(" ");
    await body.findByRole("dialog", { name: "Sharing settings" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(submit).not.toHaveBeenCalled();
  },
};

function DeferDemo() {
  const fieldId = useId();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [deferred, setDeferred] = useState<string | null>(null);
  return (
    <Stack space="space.200">
      <Inline space="space.200" alignBlock="center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={<Button variant="secondary" />}>Defer</PopoverTrigger>
          <PopoverContent style={{ width: 300 }}>
            <PopoverHeader>
              <PopoverTitle>Defer control</PopoverTitle>
              <PopoverDescription>Record why the review should wait.</PopoverDescription>
            </PopoverHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!reason.trim()) return;
                setDeferred(reason.trim());
                setReason("");
                setOpen(false);
              }}
            >
              <Stack space="space.200">
                <Field>
                  <FieldLabel id={`${fieldId}-reason-1-label`} htmlFor={`${fieldId}-reason-1`}>
                    {"Reason"}
                    <span aria-hidden="true" className="text-danger">
                      {" "}
                      *
                    </span>
                  </FieldLabel>
                  <Textarea
                    id={`${fieldId}-reason-1`}
                    aria-labelledby={`${fieldId}-reason-1-label`}
                    aria-required={true}
                    rows={2}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Why this control waits"
                  />
                </Field>
                <Inline space="space.100" alignInline="end">
                  <PopoverClose render={<Button variant="subtle" size="small" />}>
                    Cancel
                  </PopoverClose>
                  <Button type="submit" variant="primary" size="small" disabled={!reason.trim()}>
                    Defer
                  </Button>
                </Inline>
              </Stack>
            </form>
          </PopoverContent>
        </Popover>
        <Button variant="subtle">Open control</Button>
      </Inline>
      <Text role="status">{deferred ? `Deferred: ${deferred}` : "No deferral recorded."}</Text>
    </Stack>
  );
}

/** A controlled form owns its draft and closes after save; dismissal leaves ordinary page controls reachable. */
export const Task: Story = {
  render: () => <DeferDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const trigger = canvas.getByRole("button", { name: "Defer" });
    const outside = canvas.getByRole("button", { name: "Open control" });
    await user.click(trigger);
    let popup = await body.findByRole("dialog", { name: "Defer control" });
    // The popup records the overlay surface as the current one for what sits on it.
    await expect(popup.style.getPropertyValue("--ds-utility-elevation-surface-current")).toBe(
      "var(--ds-elevation-surface-overlay)",
    );
    let reason = within(popup).getByRole("textbox", { name: "Reason" });
    await waitFor(() => expect(reason).toHaveFocus());
    await expect(popup).toHaveAccessibleDescription("Record why the review should wait.");
    await expect(within(popup).getByRole("button", { name: "Defer" })).toBeDisabled();
    await user.tab();
    await expect(within(popup).getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole("status")).toHaveTextContent("No deferral recorded.");
    await user.keyboard("{Enter}");
    popup = await body.findByRole("dialog", { name: "Defer control" });
    reason = within(popup).getByRole("textbox", { name: "Reason" });
    await waitFor(() => expect(reason).toHaveFocus());
    await user.type(reason, "Waiting for the supplier evidence.");
    await user.click(within(popup).getByRole("button", { name: "Defer" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "Deferred: Waiting for the supplier evidence.",
    );
    await user.click(trigger);
    await body.findByRole("dialog", { name: "Defer control" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await user.click(trigger);
    await body.findByRole("dialog", { name: "Defer control" });
    await user.click(outside);
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(outside).toHaveFocus();
  },
};

const columns = ["Owner", "Status", "Severity", "Due", "Family"];
function OptionsDemo() {
  const [shown, setShown] = useState<string[]>(["Owner", "Status", "Due"]);
  return (
    <Inline space="space.200">
      <Popover>
        <PopoverTrigger
          render={<IconButton label="Columns" variant="subtle" icon={<SlidersHorizontal />} />}
        />
        <PopoverContent style={{ width: 220 }}>
          <PopoverTitle>Columns</PopoverTitle>
          <PopoverDescription>Choose the columns shown in this register.</PopoverDescription>
          <Stack space="space.075">
            {columns.map((column) => (
              <label key={column} className="inline-flex items-center gap-100">
                <Checkbox
                  checked={shown.includes(column)}
                  onCheckedChange={(checked) =>
                    setShown((current) =>
                      checked ? [...current, column] : current.filter((value) => value !== column),
                    )
                  }
                />
                {column}
              </label>
            ))}
          </Stack>
          <PopoverClose render={<Button size="small" />}>Done</PopoverClose>
        </PopoverContent>
      </Popover>
      <Button variant="subtle">Export register</Button>
    </Inline>
  );
}

/** Options update independently, remain selected after reopening, and allow Tab to leave the non-modal popup. */
export const Options: Story = {
  render: () => <OptionsDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const trigger = canvas.getByRole("button", { name: "Columns" });
    await user.click(trigger);
    let popup = await body.findByRole("dialog", { name: "Columns" });
    await waitFor(() => expect(popup).toBeVisible());
    const severity = within(popup).getByRole("checkbox", { name: "Severity" });
    await user.click(severity);
    await expect(severity).toBeChecked();
    await expect(popup).toBeVisible();
    await user.click(within(popup).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
    await user.keyboard(" ");
    popup = await body.findByRole("dialog", { name: "Columns" });
    await waitFor(() => expect(popup).toBeVisible());
    await expect(within(popup).getByRole("checkbox", { name: "Severity" })).toBeChecked();
    within(popup).getByRole("button", { name: "Done" }).focus();
    await user.tab();
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Export register" })).toHaveFocus();
  },
};

/** A window of its own for a story, so it renders at that size in the Storybook and every project. */
const windowOf = (width: number, height: number) => ({
  parameters: {
    viewport: {
      options: {
        ledgerWindow: {
          name: `Window (${width} by ${height} CSS px)`,
          styles: { width: `${width}px`, height: `${height}px` },
        },
      },
    },
  },
  globals: { viewport: { value: "ledgerWindow", isRotated: false } },
});

function ShortWindowDemo() {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule review</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Popover>
            <PopoverTrigger render={<Button />}>Choose a date</PopoverTrigger>
            <PopoverContent
              aria-label="Review date"
              className="gap-0 p-0"
              style={{ width: "auto" }}
            >
              <Calendar mode="single" defaultMonth={new Date(2026, 8, 1)} />
            </PopoverContent>
          </Popover>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A calendar in a Dialog on a landscape phone, 640 by 360 CSS px. The popover is capped at the
 * height the window leaves on its side and scrolls within it, so the month caption and the
 * previous and next buttons stay on screen.
 */
export const ShortWindow: Story = {
  ...windowOf(640, 360),
  render: () => <ShortWindowDemo />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await expect(window.innerHeight).toBeLessThanOrEqual(360);
    const dialog = await body.findByRole("dialog", { name: "Schedule review" });
    await user.click(within(dialog).getByRole("button", { name: "Choose a date" }));
    const popup = await body.findByRole("dialog", { name: "Review date" });
    await waitFor(() => expect(popup).toBeVisible());
    await waitFor(() => {
      const box = popup.getBoundingClientRect();
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    });
    await expect(getComputedStyle(popup).overflowY).toBe("auto");
    // The month can still be changed: its buttons are in the popup's view, or scroll into it.
    const previous = within(popup).getByRole("button", { name: /previous/i });
    previous.scrollIntoView({ block: "nearest" });
    const box = previous.getBoundingClientRect();
    await expect(
      previous.contains(
        canvasElement.ownerDocument.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        ),
      ),
    ).toBe(true);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Review date" })).toBeNull());
  },
};

const quarters = [
  { id: "q1", label: "Q1", findings: 12 },
  { id: "q2", label: "Q2", findings: 18 },
  { id: "q3", label: "Q3", findings: 9 },
];

function AnchoredDemo() {
  const [chosen, setChosen] = useState<{ id: string; element: HTMLElement } | null>(null);
  const quarter = quarters.find((entry) => entry.id === chosen?.id);
  return (
    <Stack space="space.150" className="pt-1000">
      <Text weight="medium">Findings by quarter</Text>
      <Inline space="space.200" alignBlock="end">
        {quarters.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-label={`${entry.label}, ${entry.findings} findings`}
            className="w-600 rounded-small bg-chart-categorical-1 focus-visible:outline-focused"
            style={{ height: entry.findings * 6 }}
            onClick={(event) => setChosen({ id: entry.id, element: event.currentTarget })}
          />
        ))}
      </Inline>
      <Popover
        open={chosen !== null}
        onOpenChange={(open) => {
          if (!open) setChosen(null);
        }}
      >
        <PopoverContent
          anchor={chosen?.element ?? null}
          side="top"
          collisionPadding={8}
          style={{ width: 200 }}
        >
          <PopoverTitle>{quarter?.label} findings</PopoverTitle>
          <PopoverDescription>{quarter?.findings} findings were recorded.</PopoverDescription>
          <PopoverClose render={<Button size="small" />}>Done</PopoverClose>
        </PopoverContent>
      </Popover>
    </Stack>
  );
}

/**
 * A popover anchored to what the reader chose rather than to a trigger: `anchor` takes a chart
 * mark, a cell or a virtual point, and `collisionPadding` keeps it off the window's edge. Focus
 * returns to the mark on close.
 */
export const Anchored: Story = {
  render: () => <AnchoredDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const mark = canvas.getByRole("button", { name: "Q2, 18 findings" });
    await user.click(mark);
    const popup = await body.findByRole("dialog", { name: "Q2 findings" });
    await waitFor(() => expect(popup).toBeVisible());
    // Above the mark where there is room, below it where there is not.
    await waitFor(() => {
      const box = popup.getBoundingClientRect();
      const anchor = mark.getBoundingClientRect();
      if (popup.getAttribute("data-side") === "top")
        expect(box.bottom).toBeLessThanOrEqual(anchor.top);
      else expect(box.top).toBeGreaterThanOrEqual(anchor.bottom);
      // Over the mark, and kept `collisionPadding` off the window's edge.
      const middle = anchor.left + anchor.width / 2;
      expect(box.left).toBeLessThanOrEqual(middle);
      expect(box.right).toBeGreaterThanOrEqual(middle);
      expect(box.left).toBeGreaterThanOrEqual(8);
    });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(mark).toHaveFocus());
  },
};

/** A popover's words, drawn in place so a Do and a Don't sit side by side. */
function PopoverWords({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Stack space="space.150">
      <Text weight="semibold">{title}</Text>
      {children}
      <Inline space="space.100" alignInline="end" shouldWrap>
        {footer}
      </Inline>
    </Stack>
  );
}

/**
 * A popover holds one small task at its button. A create or edit form with several fields is a
 * Dialog, whose `pending` holds it open while the save runs; a popover closes when the reader
 * presses outside it.
 */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <PopoverWords title="Owner" footer={<Button variant="primary">Done</Button>}>
          <Stack space="space.100">
            <Field orientation="horizontal">
              <Checkbox defaultChecked />
              <FieldLabel>Dana Whitfield</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox />
              <FieldLabel>Marcus Oyelaran</FieldLabel>
            </Field>
          </Stack>
        </PopoverWords>
      }
      doText="One choice at the filter's button, applied as it changes, and Done."
      dont={
        <PopoverWords
          title="Create risk"
          footer={
            <>
              <Button variant="subtle">Cancel</Button>
              <Button variant="primary">Create risk</Button>
            </>
          }
        >
          <Stack space="space.100">
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input />
            </Field>
            <Field>
              <FieldLabel>Risk owner</FieldLabel>
              <Input />
            </Field>
            <Field>
              <FieldLabel>Treatment</FieldLabel>
              <Input />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea />
            </Field>
          </Stack>
        </PopoverWords>
      }
      dontText="A create form of four fields in a popover, which a press outside closes. A form is a Dialog."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The task: one set of choices and Done.
    await expect(canvas.getAllByRole("checkbox")).toHaveLength(2);
    await expect(canvas.getByRole("button", { name: "Done" })).toBeVisible();
    // The form: four fields to fill, which belong in a Dialog.
    await expect(canvas.getAllByRole("textbox")).toHaveLength(4);
    await expect(canvas.getByRole("button", { name: "Create risk" })).toBeVisible();
  },
};
