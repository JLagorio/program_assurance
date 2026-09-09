import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
  createToastManager,
  useToastManager,
} from "../../components";

const meta = {
  title: "Components/Toaster",
  component: Toaster,
  parameters: { layout: "padded" },
  args: { timeout: 4000, limit: 4 },
} satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Example(args) {
    const [manager] = useState(createToastManager);
    return (
      <Toaster {...args} toastManager={manager}>
        <div className="flex flex-wrap gap-100">
          {(["success", "info", "warning", "error"] as const).map((type) => (
            <Button
              key={type}
              onClick={() =>
                manager.add({
                  title: {
                    success: "Evidence linked",
                    info: "Export ready",
                    warning: "Due in two days",
                    error: "Could not save",
                  }[type],
                  description: "Bank reconciliation, July",
                  type,
                  timeout: type === "error" ? 8000 : args.timeout,
                })
              }
            >
              {type}
            </Button>
          ))}
          <Button onClick={() => manager.add({ title: "Saved", timeout: 350 })}>
            Brief feedback
          </Button>
        </div>
      </Toaster>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Brief feedback" }));
    await expect(await page.findByText("Saved")).toBeVisible();
    await waitFor(() => expect(page.queryByText("Saved")).not.toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "error" }));
    await expect(await page.findByText("Could not save")).toBeVisible();
    await userEvent.keyboard("{F6}");
    await userEvent.click(await page.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(page.queryByText("Could not save")).not.toBeInTheDocument());
  },
};

/** Undo is explicit; the native action does not automatically close its toast. */
export const WithAction: Story = {
  render: function Example() {
    const [manager] = useState(createToastManager);
    const [archived, setArchived] = useState(false);
    return (
      <Toaster toastManager={manager}>
        <div className="flex items-center gap-150">
          <Button
            disabled={archived}
            onClick={() => {
              setArchived(true);
              const id = manager.add({
                title: "Archived PRG-1041",
                type: "success",
                timeout: 0,
                actionProps: {
                  children: "Undo",
                  onClick: () => {
                    setArchived(false);
                    manager.close(id);
                  },
                },
              });
            }}
          >
            Archive example
          </Button>
          <span role="status">{archived ? "Archived" : "Active"}</span>
        </div>
      </Toaster>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Archive example" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Archived");
    await userEvent.click(await page.findByRole("button", { name: "Undo" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Active");
    await waitFor(() => expect(page.queryByText("Archived PRG-1041")).not.toBeInTheDocument());
  },
};

/** The native promise resolves with the original value and rethrows a rejection. */
export const Working: Story = {
  render: function Example() {
    const [manager] = useState(createToastManager);
    const settle = useRef<{
      resolve: (file: string) => void;
      reject: (error: Error) => void;
    } | null>(null);
    const [working, setWorking] = useState(false);
    const [result, setResult] = useState("Ready");
    return (
      <Toaster toastManager={manager}>
        <div className="flex flex-wrap items-center gap-150">
          <Button
            disabled={working}
            onClick={() => {
              setWorking(true);
              void manager
                .promise(
                  new Promise<string>((resolve, reject) => {
                    settle.current = { resolve, reject };
                  }),
                  {
                    loading: "Building the package…",
                    success: (file) => ({
                      title: file + " ready",
                      description: "Download is available",
                    }),
                    error: { title: "Could not build the package", timeout: 8000 },
                  },
                )
                .then(
                  (file) => setResult(file),
                  () => setResult("Build failed"),
                )
                .finally(() => setWorking(false));
            }}
          >
            Build package
          </Button>
          <Button disabled={!working} onClick={() => settle.current?.resolve("PRG-1041.zip")}>
            Complete example
          </Button>
          <Button
            disabled={!working}
            onClick={() => settle.current?.reject(new Error("Build failed"))}
          >
            Fail example
          </Button>
          <span role="status">{result}</span>
        </div>
      </Toaster>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Build package" }));
    await expect(await page.findByText("Building the package…")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Complete example" }));
    await expect(await page.findByText("PRG-1041.zip ready")).toBeVisible();
    await expect(canvas.getByRole("status")).toHaveTextContent("PRG-1041.zip");
    await userEvent.keyboard("{F6}");
    await userEvent.click(await page.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(page.queryByText("PRG-1041.zip ready")).not.toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: "Build package" }));
    await userEvent.click(canvas.getByRole("button", { name: "Fail example" }));
    await expect(await page.findByText("Could not build the package")).toBeVisible();
    await expect(canvas.getByRole("status")).toHaveTextContent("Build failed");
  },
};

function CustomStack() {
  const { toasts, add, update, close } = useToastManager();
  const viewport = useRef<HTMLDivElement>(null);
  return (
    <>
      <Button
        onClick={() => {
          const id = add({ title: "Preparing export", timeout: 0 });
          update(id, {
            title: "Export ready",
            description: "PRG-1041.zip",
            actionProps: {
              children: "Acknowledge",
              onClick: () => close(id),
            },
          });
        }}
      >
        Prepare export
      </Button>
      <Button onClick={() => viewport.current?.focus()}>Focus notifications</Button>
      <ToastPortal>
        <ToastViewport
          ref={viewport}
          dir="rtl"
          aria-label="Export notifications"
          style={{ maxWidth: 280 }}
        >
          {toasts.map((item) => (
            <Toast key={item.id} toast={item} swipeDirection={["left", "right"]}>
              <ToastContent>
                <div className="min-w-0 flex-1">
                  <ToastTitle
                    className={(state) =>
                      state.type === "error" ? "text-danger" : "font-semibold"
                    }
                  />
                  <ToastDescription />
                </div>
                <ToastAction />
                <ToastClose aria-label="Dismiss notification" />
              </ToastContent>
            </Toast>
          ))}
        </ToastViewport>
      </ToastPortal>
    </>
  );
}

/** Compose the native parts for custom placement, direction and actions. */
export const NativeOptions: Story = {
  globals: { viewport: { value: "ledgerNarrow", isRotated: false } },
  render: () => (
    <ToastProvider timeout={0} limit={2}>
      <CustomStack />
    </ToastProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Prepare export" }));
    await expect(await page.findByText("Export ready")).toBeVisible();
    const viewport = page.getByLabelText("Export notifications");
    await expect(viewport).toHaveAttribute("dir", "rtl");
    await userEvent.keyboard("{F6}");
    await expect(viewport).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole("button", { name: "Prepare export" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Focus notifications" }));
    await expect(viewport).toHaveFocus();
    await userEvent.click(page.getByRole("button", { name: "Acknowledge" }));
    await waitFor(() => expect(page.queryByText("Export ready")).not.toBeInTheDocument());
  },
};

export const InDialog: Story = {
  render: function Example() {
    const [manager] = useState(createToastManager);
    return (
      <Toaster toastManager={manager}>
        <Dialog>
          <DialogTrigger render={<Button />}>Edit record</DialogTrigger>
          <DialogContent>
            <DialogTitle>Edit record</DialogTitle>
            <DialogDescription>Save without leaving this dialog.</DialogDescription>
            <Button
              onClick={() => manager.add({ title: "Changes saved", type: "success", timeout: 0 })}
            >
              Save changes
            </Button>
          </DialogContent>
        </Dialog>
      </Toaster>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole("button", { name: "Edit record" });
    await userEvent.click(trigger);
    const dialog = within(await page.findByRole("dialog"));
    await userEvent.click(dialog.getByRole("button", { name: "Save changes" }));
    await expect(await page.findByText("Changes saved")).toBeVisible();
    await userEvent.keyboard("{F6}");
    await expect(page.getByLabelText("Notifications")).toHaveFocus();
    const viewport = within(page.getByLabelText("Notifications"));
    await userEvent.click(viewport.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(page.queryByText("Changes saved")).not.toBeInTheDocument());
    await expect(page.getByRole("dialog")).toBeVisible();
    await userEvent.click(dialog.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
