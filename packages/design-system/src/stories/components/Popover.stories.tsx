import type { Meta, StoryObj } from "@storybook/react-vite";
import { SlidersHorizontal } from "lucide-react";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  buttonVariants,
  Checkbox,
  Field,
  IconButton,
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

/** Native composition with a title and description, plus a logical placement under RTL. */
export const PopoverMatrix: Story = {
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
    await waitFor(() =>
      expect(rtl.getBoundingClientRect().right).toBeLessThanOrEqual(
        custom.getBoundingClientRect().left,
      ),
    );
    const rtlDone = within(rtl).getByRole("button", { name: "Done" });
    await waitFor(() => expect(rtlDone).toHaveFocus());
    await user.tab();
    await expect(rtlDone).toHaveFocus();
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
                <Field label="Reason" isRequired>
                  <Textarea
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
