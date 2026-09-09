import { useId, useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button, Spinner, Toaster, toast } from "../../components";

const meta = {
  title: "Components/Toaster",
  component: Toaster,
  parameters: { layout: "padded" },
  args: { position: "bottom-right" },
} satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Example(args) {
    const id = useId();
    return (
      <>
        <Toaster {...args} id={id} />
        <div className="flex flex-wrap gap-100">
          <Button variant="secondary" onClick={() => toast("Saved", { toasterId: id })}>
            Plain
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.success("Evidence linked", {
                toasterId: id,
                description: "Bank reconciliation, July",
              })
            }
          >
            Success
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.info("Three artifacts expire this month", { toasterId: id })}
          >
            Info
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.warning("Due in two days", { toasterId: id })}
          >
            Warning
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.error("Could not save", { toasterId: id })}
          >
            Error
          </Button>
        </div>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Error" }));
    await waitFor(() => expect(canvas.getByText("Could not save")).toBeVisible());
    await userEvent.click(canvas.getByRole("button", { name: "Close" }));
  },
};

export const WithAction: Story = {
  render: function Example() {
    const id = useId();
    const [archived, setArchived] = useState(false);
    return (
      <>
        <Toaster id={id} />
        <div className="flex items-center gap-150">
          <Button
            disabled={archived}
            onClick={() => {
              setArchived(true);
              toast.success("Archived PRG-1041", {
                toasterId: id,
                action: { label: "Undo", onClick: () => setArchived(false) },
              });
            }}
          >
            Archive example
          </Button>
          <span role="status">{archived ? "Archived" : "Active"}</span>
        </div>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Archive example" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Archived");
    await userEvent.click(await canvas.findByRole("button", { name: "Undo" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Active");
  },
};

export const Working: Story = {
  render: function Example() {
    const id = useId();
    const resolve = useRef<((file: string) => void) | null>(null);
    const [working, setWorking] = useState(false);
    return (
      <>
        <Toaster id={id} />
        <div className="flex items-center gap-150">
          <Button
            disabled={working}
            onClick={() => {
              setWorking(true);
              toast.promise(
                new Promise<string>((done) => {
                  resolve.current = done;
                }),
                {
                  toasterId: id,
                  loading: "Building the package…",
                  success: (file) => file + " ready",
                  error: "Could not build the package",
                },
              );
            }}
          >
            Build package
          </Button>
          <Button
            disabled={!working}
            onClick={() => {
              resolve.current?.("PRG-1041.zip");
              setWorking(false);
            }}
          >
            Complete example
          </Button>
        </div>
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Build package" }));
    await waitFor(() => expect(canvas.getByText("Building the package…")).toBeVisible());
    await userEvent.click(canvas.getByRole("button", { name: "Complete example" }));
    await waitFor(() => expect(canvas.getByText("PRG-1041.zip ready")).toBeVisible());
  },
};

export const NativeOptions: Story = {
  globals: { viewport: { value: "ledgerNarrow", isRotated: false } },
  args: {
    ref: fn(),
    position: "top-left",
    dir: "rtl",
    theme: "dark",
    closeButton: true,
    duration: Infinity,
    visibleToasts: 2,
    gap: 12,
    offset: 24,
    mobileOffset: 12,
    containerAriaLabel: "Export notifications",
    className: "font-body",
    style: { zIndex: 1100 },
    icons: { success: <span aria-hidden>✓</span>, loading: <Spinner isDecorative /> },
    toastOptions: {
      closeButtonAriaLabel: "Dismiss notification",
      style: { maxWidth: 280 },
      classNames: { title: "font-semibold" },
    },
  },
  render: function Example(args) {
    const id = useId();
    return (
      <>
        <Toaster {...args} id={id} />
        <div className="flex justify-center py-1000">
          <Button
            onClick={() =>
              toast.success("Export ready", {
                toasterId: id,
                description: "Download the assessment package.",
              })
            }
          >
            Show export
          </Button>
        </div>
      </>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region", { name: /Export notifications/ });
    await expect(args.ref).toHaveBeenCalledWith(region);
    await userEvent.click(canvas.getByRole("button", { name: "Show export" }));
    await waitFor(() => expect(canvas.getByText("Export ready")).toBeVisible());
    const title = canvas.getByText("Export ready");
    await expect(title).toHaveClass("font-semibold");
    await expect(title.closest("[data-sonner-toast]")).toHaveClass("bg-surface-overlay");
    await expect(title.closest("[data-sonner-toast]")).toHaveStyle({ maxWidth: "280px" });
    const list = canvas.getByRole("list");
    await expect(list).toHaveAttribute("dir", args.dir);
    const [vertical, horizontal] = args.position!.split("-");
    await expect(list).toHaveAttribute("data-y-position", vertical);
    await expect(list).toHaveAttribute("data-x-position", horizontal);
    const bounds = title.closest("[data-sonner-toast]")!.getBoundingClientRect();
    await expect(bounds.left).toBeGreaterThanOrEqual(0);
    await expect(bounds.right).toBeLessThanOrEqual(
      canvasElement.ownerDocument.defaultView!.innerWidth,
    );
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss notification" }));
  },
};
