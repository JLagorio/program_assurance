import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerSwipeHandle,
  DrawerTitle,
  DrawerTrigger,
  DatePicker,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components";

const meta = {
  title: "Components/Drawer",
  component: Drawer,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;
const actionRef = createRef<HTMLButtonElement>();
const popupRef = createRef<HTMLDivElement>();
export const Actions: Story = {
  render: () => (
    <Drawer showSwipeHandle>
      <DrawerTrigger render={<Button />}>Quick actions</DrawerTrigger>
      <DrawerContent ref={popupRef} initialFocus={actionRef}>
        <DrawerHeader>
          <DrawerTitle>Control actions</DrawerTitle>
          <DrawerDescription>For CTRL-0412.</DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-100 overflow-y-auto p-250">
          <Button ref={actionRef} variant="subtle">
            Mark verified
          </Button>
          <Button variant="subtle">Request evidence</Button>
        </div>
        <DrawerFooter>
          <DrawerClose render={<Button />}>Done</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Quick actions" });
    await userEvent.click(trigger);
    const popup = await body.findByRole("dialog", { name: "Control actions" });
    await expect(popupRef.current).toBe(popup);
    await expect(popup).toHaveAccessibleDescription("For CTRL-0412.");
    await waitFor(() =>
      expect(within(popup).getByRole("button", { name: "Mark verified" })).toHaveFocus(),
    );
    await userEvent.tab({ shift: true });
    await expect(popup.contains(canvasElement.ownerDocument.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
export const Positions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-100">
      {(["down", "up", "left", "right"] as const).map((direction) => (
        <Drawer key={direction} swipeDirection={direction} showSwipeHandle>
          <DrawerTrigger render={<Button />}>Swipe {direction}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{direction} drawer</DrawerTitle>
              <DrawerDescription>Swipe toward the edge to dismiss.</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-250">
              {Array.from({ length: 30 }, (_, i) => (
                <p key={i} className="py-100">
                  Evidence item {i + 1}
                </p>
              ))}
            </div>
            <DrawerFooter>
              <DrawerClose render={<Button />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    for (const direction of ["down", "up", "left", "right"]) {
      await userEvent.click(canvas.getByRole("button", { name: `Swipe ${direction}` }));
      const popup = await body.findByRole("dialog", { name: `${direction} drawer` });
      await waitFor(() =>
        expect(popup.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight),
      );
      await userEvent.click(within(popup).getByRole("button", { name: "Close" }));
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    }
  },
};
function SnapDemo() {
  const [snapPoint, setSnapPoint] = useState<number | string | null>(0.5);
  return (
    <Drawer
      snapPoints={[0.5, 1]}
      snapPoint={snapPoint}
      onSnapPointChange={setSnapPoint}
      showSwipeHandle
    >
      <DrawerTrigger render={<Button />}>Open snap points</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Evidence</DrawerTitle>
          <DrawerDescription>Drag between half height and full height.</DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-250">
          <Button onClick={() => setSnapPoint(snapPoint === 1 ? 0.5 : 1)}>
            {snapPoint === 1 ? "Collapse" : "Expand"}
          </Button>
          {Array.from({ length: 40 }, (_, i) => (
            <p key={i} className="py-100">
              Evidence item {i + 1}
            </p>
          ))}
        </div>
        <DrawerFooter>
          <DrawerClose render={<Button />}>Done</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
export const SnapPoints: Story = { render: () => <SnapDemo /> };
function Filters() {
  const [pending, setPending] = useState(false);
  return (
    <Drawer
      showSwipeHandle
      onOpenChange={(open, details) => {
        if (!open && pending) details.cancel();
      }}
    >
      <DrawerTrigger render={<Button />}>Filter controls</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-200 overflow-y-auto p-250">
          <Select defaultValue="draft" items={{ draft: "Draft", ready: "Ready" }}>
            <SelectTrigger aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
            </SelectContent>
          </Select>
          <DatePicker aria-label="Due date" defaultValue="2026-09-14" />
        </div>
        <DrawerFooter>
          <DrawerClose render={<Button />}>Close</DrawerClose>
          <Button onClick={() => setPending(!pending)}>{pending ? "Finish saving" : "Save"}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
export const NestedPopups: Story = {
  render: () => <Filters />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const opener = canvas.getByRole("button", { name: "Filter controls" });
    await userEvent.click(opener);
    const dialog = await body.findByRole("dialog", { name: "Filters" });
    await expect(dialog).not.toHaveAttribute("aria-describedby");
    const trigger = within(dialog).getByRole("combobox", { name: "Status" });
    await userEvent.click(trigger);
    await body.findByRole("listbox");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("listbox")).toBeNull());
    await expect(dialog).toBeVisible();
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.click(trigger);
    await userEvent.click(await body.findByRole("option", { name: "Ready" }));
    await expect(trigger).toHaveTextContent("Ready");
    const date = within(dialog).getByRole("button", { name: "Due date" });
    await userEvent.click(date);
    const calendar = await body.findByRole("dialog", { name: "Choose a date" });
    await userEvent.click(within(calendar).getByRole("button", { name: /September 18, 2026/ }));
    await expect(date).toHaveTextContent("Sep 18, 2026");
    await waitFor(() => expect(date).toHaveFocus());
    await userEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await userEvent.keyboard("{Escape}");
    await expect(dialog).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    await expect(dialog).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: "Finish saving" }));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
export const NestedDrawers: Story = {
  render: () => (
    <Drawer showSwipeHandle>
      <DrawerTrigger render={<Button />}>Open parent</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Parent drawer</DrawerTitle>
        </DrawerHeader>
        <div className="p-250">
          <Drawer showSwipeHandle>
            <DrawerTrigger render={<Button />}>Open child</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Child drawer</DrawerTitle>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose render={<Button />}>Close child</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
        <DrawerFooter>
          <DrawerClose render={<Button />}>Close parent</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open parent" }));
    const parent = await body.findByRole("dialog", { name: "Parent drawer" });
    const trigger = within(parent).getByRole("button", { name: "Open child" });
    await userEvent.click(trigger);
    await body.findByRole("dialog", { name: "Child drawer" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Child drawer" })).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};
/** Portal/Overlay remain available when a product needs to compose the native viewport and popup directly. */
export const CustomComposition: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger render={<Button />}>Custom drawer</DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay />
        <BaseDrawer.Viewport className="fixed inset-0 z-50 flex items-end">
          <BaseDrawer.Popup
            className="drawer-popup group/drawer-popup flex w-full flex-col rounded-t-xxlarge bg-surface-overlay"
            data-swipe-axis="y"
          >
            <DrawerSwipeHandle />
            <BaseDrawer.Content className="drawer-content">
              <DrawerHeader>
                <DrawerTitle>Quick review</DrawerTitle>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose render={<Button />}>Done</DrawerClose>
              </DrawerFooter>
            </BaseDrawer.Content>
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </DrawerPortal>
    </Drawer>
  ),
};
