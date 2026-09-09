import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
const meta = {
  title: "Components/Sheet",
  component: Sheet,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Sheet>;
export default meta;
type Story = StoryObj<typeof meta>;
function Edges() {
  const [side, setSide] = useState<"top" | "right" | "bottom" | "left">("right");
  return (
    <>
      <div className="flex gap-100">
        {(["top", "right", "bottom", "left"] as const).map((edge) => (
          <Button key={edge} onClick={() => setSide(edge)}>
            {edge}
          </Button>
        ))}
      </div>
      <Sheet>
        <SheetTrigger render={<Button />}>Preview record</SheetTrigger>
        <SheetContent side={side}>
          <SheetHeader>
            <SheetTitle>Assessment record</SheetTitle>
            <SheetDescription>Current review details.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-200">
            {Array.from({ length: 25 }, (_, i) => (
              <p className="py-100" key={i}>
                Evidence {i + 1}
              </p>
            ))}
          </div>
          <SheetFooter>
            <SheetClose render={<Button />}>Done</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
export const EdgesAndScrolling: Story = {
  render: () => <Edges />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    for (const side of ["right", "left", "top", "bottom"]) {
      await userEvent.click(canvas.getByRole("button", { name: side }));
      await userEvent.click(canvas.getByRole("button", { name: "Preview record" }));
      const popup = await body.findByRole("dialog", { name: "Assessment record" });
      await expect(popup).toHaveAttribute("data-side", side);
      await expect(getComputedStyle(popup).animationName).toBe(
        `ds-slide-in-${side === "right" ? "end" : side === "left" ? "start" : side}`,
      );
      await userEvent.click(within(popup).getByRole("button", { name: "Done" }));
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    }
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Preview record" })).toHaveFocus(),
    );
  },
};
export const NestedAndRTL: Story = {
  render: () => (
    <LedgerProvider direction="rtl">
      <Sheet>
        <SheetTrigger render={<Button />}>Open details</SheetTrigger>
        <SheetContent side="end">
          <SheetHeader>
            <SheetTitle>Record details</SheetTitle>
          </SheetHeader>
          <div className="p-200">
            <Dialog>
              <DialogTrigger render={<Button />}>Edit record</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit record</DialogTitle>
                </DialogHeader>
                <p className="p-200">Changes apply to this record.</p>
              </DialogContent>
            </Dialog>
          </div>
        </SheetContent>
      </Sheet>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open details" }));
    const sheet = await body.findByRole("dialog", { name: "Record details" });
    await expect(sheet).toHaveAttribute("data-side", "left");
    await expect(getComputedStyle(sheet).animationName).toBe("ds-slide-in-start");
    await userEvent.click(within(sheet).getByRole("button", { name: "Edit record" }));
    await body.findByRole("dialog", { name: "Edit record" });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Edit record" })).toBeNull());
    await waitFor(() =>
      expect(within(sheet).getByRole("button", { name: "Edit record" })).toHaveFocus(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};
