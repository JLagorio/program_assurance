import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, Download, Pencil, Pin, Search } from "lucide-react";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
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
import { Grid, Inline, Text } from "../../primitives";

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

/**
 * One shared delay group with TooltipProvider's defaults: the first hover waits 300ms; an adjacent
 * tooltip opens at once. Keyboard focus opens one without the wait.
 */
export const IconButtons: Story = {
  render: () => (
    <TooltipProvider>
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
    // The tooltip's layer is layer.tooltip, above a toast (layer.toast), so a toast action's label shows.
    const root = doc.defaultView!.getComputedStyle(doc.documentElement);
    await expect(doc.defaultView!.getComputedStyle(popup.parentElement!).zIndex).toBe(
      root.getPropertyValue("--ds-layer-tooltip").trim(),
    );
    await expect(Number(root.getPropertyValue("--ds-layer-tooltip"))).toBeGreaterThan(
      Number(root.getPropertyValue("--ds-layer-toast")),
    );
    // In forced colours the dark fill and the shadow are gone; a CanvasText outline keeps the edge.
    if (doc.defaultView!.matchMedia("(forced-colors: active)").matches)
      await expect(doc.defaultView!.getComputedStyle(popup).outlineStyle).toBe("solid");
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

/**
 * A shortcut the trigger's name leaves out. `describe` on TooltipContent makes its words the
 * trigger's accessible description, from a hidden copy that is on the page while the tooltip is
 * closed; `aria-keyshortcuts` names the chord for assistive technology.
 */
export const Shortcut: Story = {
  render: () => (
    <div className="p-800">
      <Tooltip>
        <TooltipTrigger
          aria-keyshortcuts="Meta+K Control+K"
          render={<IconButton label="Search" icon={<Search />} isTooltipDisabled />}
        />
        <TooltipContent describe>
          Search <Kbd>K</Kbd>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: doc });
    const search = canvas.getByRole("button", { name: "Search" });
    await expect(search).toHaveAttribute("aria-keyshortcuts", "Meta+K Control+K");
    // Described while the tooltip is closed: the copy is on the page, not in the popup.
    await expect(popupIn(doc)).toBeNull();
    await waitFor(() => expect(search).toHaveAccessibleDescription("Search K"));
    await user.tab();
    await expect(search).toHaveFocus();
    await waitFor(() => expect(popupIn(doc)).toHaveTextContent("Search K"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(popupIn(doc)).toBeNull());
    await expect(search).toHaveAccessibleDescription("Search K");
  },
};

function UnavailableDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Export options</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export options</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Inline space="space.150" alignBlock="center" shouldWrap>
              <Text>Download everything this program holds as one package.</Text>
              <Button iconBefore={<Download />} disabledReason="Connect an export service first">
                Export package
              </Button>
            </Inline>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * An action that truly cannot run, in a dialog: `disabledReason` on the Button keeps it in the Tab
 * order with `aria-disabled` and says why in a tooltip on hover, focus or a tap, and in its
 * accessible description. No wrapper and no `title`. Escape closes the tooltip first, then the
 * dialog.
 */
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
    const exportButton = within(dialog).getByRole("button", { name: "Export package" });
    await expect(exportButton).toHaveAttribute("aria-disabled", "true");
    await expect(exportButton).not.toHaveAttribute("title");
    await expect(exportButton).toHaveAccessibleDescription("Connect an export service first");
    // The first control past the close button takes focus, and focus opens the reason.
    await waitFor(() => expect(exportButton).toHaveFocus());
    await waitFor(() => expect(popupIn(doc)).toHaveTextContent("Connect an export service first"));
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
    await expect(exportButton).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
