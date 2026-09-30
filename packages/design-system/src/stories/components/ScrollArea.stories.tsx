import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button, ScrollArea, ScrollBar } from "../../components";
import { LedgerProvider } from "../../lib/locale";
const meta = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ScrollArea>;
export default meta;
type Story = StoryObj<typeof meta>;
const viewportRef = createRef<HTMLDivElement>();
/** A region that scrolls with a bar the reader can drag; its focus ring is drawn inside it. */
export const Vertical: Story = {
  render: () => (
    <ScrollArea
      className="h-[240px] w-full max-w-[320px] rounded-medium border border-default"
      viewportProps={{ ref: viewportRef, role: "region", "aria-label": "Evidence list" }}
    >
      <div className="p-150">
        {Array.from({ length: 30 }, (_, i) => (
          <p className="py-100" key={i}>
            Evidence record {i + 1}
          </p>
        ))}
        <Button>Last record</Button>
      </div>
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      viewport = canvas.getByRole("region", { name: "Evidence list" });
    await expect(viewportRef.current).toBe(viewport);
    await waitFor(() => expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight));
    await userEvent.keyboard("{Shift}");
    viewport.focus();
    await expect(viewport).toHaveFocus();
    // The root clips, so the ring is inside the viewport, on the root's rounded corners.
    const ring = getComputedStyle(viewport);
    await expect(parseFloat(ring.outlineWidth)).toBeGreaterThan(0);
    await expect(parseFloat(ring.outlineOffset)).toBe(-parseFloat(ring.outlineWidth));
    await expect(ring.borderTopLeftRadius).toBe(
      getComputedStyle(viewport.closest('[data-slot="scroll-area"]')!).borderTopLeftRadius,
    );
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Last record" })).toHaveFocus();
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    const thumb = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area-thumb"]')!;
    await expect(thumb).toBeVisible();
    // In forced colours the thumb is drawn in CanvasText, the colour of the page's text, where
    // the tokens' tint would be replaced by the page's Canvas.
    if (matchMedia("(forced-colors: active)").matches)
      await expect(getComputedStyle(thumb).backgroundColor).toBe(
        getComputedStyle(document.body).color,
      );
  },
};
/** A wide region scrolls sideways with a horizontal bar, and follows the locale's direction. */
export const HorizontalAndRTL: Story = {
  render: () => (
    <LedgerProvider direction="rtl">
      <ScrollArea
        className="h-[180px] w-full max-w-[320px] rounded-medium border border-default"
        viewportProps={{ role: "region", "aria-label": "Program timeline" }}
      >
        <div className="flex w-[1000px] gap-200 p-200">
          {Array.from({ length: 12 }, (_, i) => (
            <Button key={i}>Milestone {i + 1}</Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      viewport = canvas.getByRole("region", { name: "Program timeline" });
    await waitFor(() => expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth));
    await expect(getComputedStyle(viewport).direction).toBe("rtl");
    canvas.getByRole("button", { name: "Milestone 12" }).focus();
    await waitFor(() => expect(viewport.scrollLeft).toBeLessThan(0));
    await expect(
      canvasElement.querySelector(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]',
      ),
    ).toBeVisible();
  },
};
