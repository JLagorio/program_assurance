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
export const Vertical: Story = {
  render: () => (
    <ScrollArea
      className="h-[240px] w-[320px] rounded-medium border border-default"
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
    viewport.focus();
    await expect(viewport).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Last record" })).toHaveFocus();
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    await expect(canvasElement.querySelector('[data-slot="scroll-area-thumb"]')).toBeVisible();
  },
};
export const HorizontalAndRTL: Story = {
  render: () => (
    <LedgerProvider direction="rtl">
      <ScrollArea
        className="h-[180px] w-[320px] rounded-medium border border-default"
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
