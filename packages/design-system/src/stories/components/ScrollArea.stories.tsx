import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button, ScrollArea, ScrollBar } from "../../components";
import { LedgerProvider } from "../../lib/locale";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;
const meta = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ScrollArea>;
export default meta;
type Story = StoryObj<typeof meta>;
/** A region that scrolls with a bar the reader can drag; its focus ring is drawn inside it. */
export const Vertical: Story = {
  render: () => (
    <ScrollArea
      className="h-[240px] w-full max-w-[320px] rounded-medium border border-default"
      viewportProps={{ role: "region", "aria-label": "Evidence list" }}
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

const viewportRef = createRef<HTMLDivElement>();

/** `viewportProps` reach the viewport, its ref included. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: () => (
    <ScrollArea
      className="h-[180px] w-full max-w-[320px] rounded-medium border border-default"
      viewportProps={{ ref: viewportRef, role: "region", "aria-label": "Program timeline" }}
    >
      <div className="p-150">Twelve milestones, Atlas payments platform.</div>
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const viewport = within(canvasElement).getByRole("region", { name: "Program timeline" });
    await expect(viewportRef.current).toBe(viewport);
    await expect(viewport).toHaveAttribute("data-slot", "scroll-area-viewport");
  },
};

/**
 * A region that holds the reader's content is named through `viewportProps`, since a keyboard reader
 * tabs into it to scroll. Unnamed, the stop is announced as nothing at all.
 */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <ScrollArea
          className="h-[120px] rounded-medium border border-default"
          viewportProps={{ role: "region", "aria-label": "Activity" }}
        >
          <div className="p-150">
            {Array.from({ length: 12 }, (_, i) => (
              <p className="py-050" key={i}>
                Evidence version {i + 1} published
              </p>
            ))}
          </div>
        </ScrollArea>
      }
      doText="A region named Activity: the reader hears what scrolls when they reach it."
      dont={
        <ScrollArea className="h-[120px] rounded-medium border border-default">
          <div className="p-150">
            {Array.from({ length: 12 }, (_, i) => (
              <p className="py-050" key={i}>
                Evidence version {i + 1} published
              </p>
            ))}
          </div>
        </ScrollArea>
      }
      dontText="The same list, unnamed: a tab stop with no name and no role."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const named = canvas.getByRole("region", { name: "Activity" });
    await waitFor(() => expect(named).toHaveAttribute("tabindex", "0"));
    const viewports = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    await expect(viewports).toHaveLength(2);
    // The other viewport is a tab stop too, with nothing to say what it holds.
    await waitFor(() => expect(viewports[1]).toHaveAttribute("tabindex", "0"));
    await expect(canvas.getAllByRole("region")).toHaveLength(1);
    await expect(viewports[1]).toHaveAccessibleName("");
  },
};
