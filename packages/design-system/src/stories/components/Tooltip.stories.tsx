import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, Download, Pencil, Pin } from "lucide-react";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  IconButton,
  Kbd,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components";

import { LedgerProvider } from "../../lib/locale";
import { Grid, Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

const triggerRef = createRef<HTMLButtonElement>();
const renderedRef = createRef<HTMLAnchorElement>();
const popupRef = createRef<HTMLDivElement>();
const renderedPopupRef = createRef<HTMLDivElement>();
const pressed = fn();
const renderedPressed = fn();
const copy = fn();
const popupIn = (doc: Document) =>
  doc.querySelector<HTMLElement>('[data-slot="tooltip-content"][data-open]');

/** A native link with a shortcut, and a button whose logical placement follows RTL. */
export const TooltipMatrix: Story = {
  name: "Composition",
  render: () => (
    <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.800" className="p-800">
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              ref={renderedRef}
              href="#review-guide"
              className="underline"
              onClick={renderedPressed}
            />
          }
          onClick={pressed}
        >
          Review guide
        </TooltipTrigger>
        <TooltipContent
          ref={popupRef}
          render={<div ref={renderedPopupRef} className="tabular-nums" style={{ minHeight: 30 }} />}
          className={(state) => (state.open ? "font-medium" : "font-regular")}
          style={(state) => ({ outlineOffset: state.open ? 4 : 2 })}
        >
          Review guide <Kbd>G</Kbd>
        </TooltipContent>
      </Tooltip>
      <LedgerProvider direction="rtl">
        <Tooltip>
          <TooltipTrigger
            ref={triggerRef}
            aria-label="Pin record"
            render={<Button variant="secondary" iconBefore={<Pin />} />}
          >
            Pin
          </TooltipTrigger>
          <TooltipContent side="inline-end">Pin record</TooltipContent>
        </Tooltip>
      </LedgerProvider>
    </Grid>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: doc });
    pressed.mockClear();
    renderedPressed.mockClear();
    const link = canvas.getByRole("link", { name: "Review guide" });
    await expect(renderedRef.current).toBe(link);
    await expect(link).toHaveAttribute("href", "#review-guide");
    await expect(link).not.toHaveAttribute("role", "button");
    link.focus();
    await waitFor(() => expect(popupIn(doc)).toBeVisible());
    const popup = popupIn(doc)!;
    await expect(popupRef.current).toBe(popup);
    await expect(renderedPopupRef.current).toBe(popup);
    await expect(popup).toHaveClass("font-medium", "tabular-nums");
    await expect(popup).toHaveStyle({ minHeight: "30px", outlineOffset: "4px" });
    await expect(popup).toHaveAttribute("data-side", "top");
    await expect(popup.querySelector('[data-slot="tooltip-arrow"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(canvasElement).not.toContainElement(popup);
    await expect(link).toHaveFocus();
    await expect(link).not.toHaveAttribute("aria-describedby");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(popupIn(doc)).toBeNull());
    await expect(link).toHaveFocus();
    await user.keyboard(" ");
    await expect(pressed).not.toHaveBeenCalled();
    let nativeActionAllowed = false;
    const stopNavigation = (event: MouseEvent) => {
      if (event.target === link) {
        nativeActionAllowed = !event.defaultPrevented;
        event.preventDefault();
      }
    };
    doc.addEventListener("click", stopNavigation);
    try {
      await user.keyboard("{Enter}");
      await expect(nativeActionAllowed).toBe(true);
      await expect(pressed).toHaveBeenCalledTimes(1);
      await expect(renderedPressed).toHaveBeenCalledTimes(1);
    } finally {
      doc.removeEventListener("click", stopNavigation);
    }
    await user.tab();
    const pin = canvas.getByRole("button", { name: "Pin record" });
    await expect(triggerRef.current).toBe(pin);
    await expect(pin).toHaveFocus();
    await waitFor(() => expect(popupIn(doc)).toHaveTextContent("Pin record"));
    await waitFor(() =>
      expect(popupIn(doc)!.getBoundingClientRect().right).toBeLessThanOrEqual(
        pin.getBoundingClientRect().left,
      ),
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(popupIn(doc)).toBeNull());
  },
};

/** One shared delay group: the first hover waits; an adjacent tooltip opens immediately. */
export const IconButtons: Story = {
  render: () => (
    <TooltipProvider delay={300} timeout={300}>
      <Inline space="space.100" className="p-800">
        <IconButton label="Edit" variant="subtle" icon={<Pencil />} />
        <IconButton label="Copy link" variant="subtle" icon={<Copy />} onClick={copy} />
        <IconButton label="Pin to rail" variant="subtle" icon={<Pin />} />
      </Inline>
    </TooltipProvider>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: doc });
    copy.mockClear();
    const edit = canvas.getByRole("button", { name: "Edit" });
    // The built canvas starts play before passive native hover listeners have attached.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await user.hover(edit);
    await expect(popupIn(doc)).toBeNull();
    await waitFor(() => expect(popupIn(doc)).toHaveTextContent("Edit"));
    await waitFor(() => expect(popupIn(doc)).toBeVisible());
    const copyButton = canvas.getByRole("button", { name: "Copy link" });
    await user.hover(copyButton);
    await waitFor(() => expect(popupIn(doc)).toHaveTextContent("Copy link"));
    await expect(popupIn(doc)).toHaveAttribute("data-instant", "delay");
    await expect(doc.querySelectorAll('[data-slot="tooltip-content"][data-open]')).toHaveLength(1);
    const popup = popupIn(doc)!;
    await waitFor(() => expect(popup).toBeVisible());
    await waitFor(() =>
      expect(doc.defaultView!.getComputedStyle(popup).pointerEvents).not.toBe("none"),
    );
    const box = popup.getBoundingClientRect();
    const anchor = copyButton.getBoundingClientRect();
    // user-event omits mouseleave.relatedTarget; cross the trigger edge before the popup center.
    await user.pointer({
      target: popup,
      coords: { clientX: anchor.x + anchor.width / 2, clientY: anchor.top - 1 },
    });
    await user.pointer({
      target: popup,
      coords: { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 },
    });
    await expect(popup).toHaveAttribute("data-open");
    await user.click(copyButton);
    await expect(copy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(popupIn(doc)).toBeNull());
    await user.tab();
    const pin = canvas.getByRole("button", { name: "Pin to rail" });
    await expect(pin).toHaveFocus();
    await waitFor(() => expect(popupIn(doc)).toHaveTextContent("Pin to rail"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(popupIn(doc)).toBeNull());
    await expect(pin).toHaveFocus();
  },
};

function UnavailableDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Export options</Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>Export options</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <Stack space="space.200">
              <Text>Connect an export service to download a package.</Text>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      tabIndex={0}
                      role="group"
                      aria-label="Export unavailable: connect an export service"
                      className="inline-flex self-start focus-visible:outline-focused"
                    />
                  }
                >
                  <Button disabled iconBefore={<Download />} title="Connect an export service">
                    Export package
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Connect an export service</TooltipContent>
              </Tooltip>
              <Button variant="subtle" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </Stack>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** A disabled action keeps its explanation available on a focusable wrapper inside a dialog. */
export const Unavailable: Story = {
  render: () => <UnavailableDemo />,
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const canvas = within(canvasElement);
    const page = within(doc.body);
    const user = userEvent.setup({ document: doc });
    const opener = canvas.getByRole("button", { name: "Export options" });
    await user.click(opener);
    const dialog = await page.findByRole("dialog", { name: "Export options" });
    const wrapper = within(dialog).getByRole("group", {
      name: "Export unavailable: connect an export service",
    });
    await waitFor(() => expect(wrapper).toHaveFocus());
    await expect(within(dialog).getByRole("button", { name: "Export package" })).toBeDisabled();
    await waitFor(() => expect(popupIn(doc)).toBeVisible());
    await expect(doc.body).toContainElement(popupIn(doc));
    await waitFor(() => {
      const popup = popupIn(doc)!;
      const r = popup.getBoundingClientRect();
      expect(popup.contains(doc.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2))).toBe(
        true,
      );
    });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(popupIn(doc)).toBeNull());
    await expect(dialog).toBeVisible();
    await expect(wrapper).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
