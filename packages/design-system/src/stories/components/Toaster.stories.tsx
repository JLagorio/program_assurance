import { useRef, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertIcon,
  AlertTitle,
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
  type ToastOptions,
} from "../../components";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Toaster",
  component: Toaster,
  parameters: { layout: "padded" },
  args: { timeout: 5000, limit: 4 },
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
    const title = { selector: '[data-slot="toast-title"]' };
    await expect(await page.findByText("Could not save", title)).toBeVisible();
    await userEvent.keyboard("{F6}");
    await userEvent.click(await page.findByRole("button", { name: "Close" }));
    await waitFor(() => expect(page.queryByText("Could not save", title)).not.toBeInTheDocument());
  },
};

/** Undo is explicit; the native action does not automatically close its toast. A toast with an action never times out, so its action stays reachable: here the Toaster times toasts out after 300ms, and the Undo toast stays until it is used or closed. */
export const WithAction: Story = {
  render: function Example() {
    const [manager] = useState(createToastManager);
    const [archived, setArchived] = useState(false);
    return (
      <Toaster toastManager={manager} timeout={300}>
        <div className="flex items-center gap-150">
          <Button
            disabled={archived}
            onClick={() => {
              setArchived(true);
              const id = manager.add({
                title: "Archived PRG-1041",
                type: "success",
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
    await expect(await page.findByText("Archived PRG-1041")).toBeVisible();
    // Twice the Toaster's 300ms timeout later, the toast with an action is still there.
    await new Promise((resolve) => setTimeout(resolve, 600));
    await expect(page.getByText("Archived PRG-1041")).toBeVisible();
    await userEvent.click(await page.findByRole("button", { name: "Undo" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Active");
    await waitFor(() => expect(page.queryByText("Archived PRG-1041")).not.toBeInTheDocument());
  },
};

function Readout() {
  const { toasts, add } = useToastManager();
  // The methods keep their identity while toasts come and go, as Base UI's do.
  const firstAdd = useRef(add);
  return (
    <ul
      aria-label="Stored toasts"
      data-stable-add={String(firstAdd.current === add)}
      className="font-body-small text-subtle"
    >
      {toasts.map((item) => (
        <li key={item.id} data-toast-title={String(item.title)}>
          {`${String(item.title)}: type ${item.type ?? "none"}, timeout ${item.timeout ?? "default"}, priority ${item.priority ?? "low"}`}
        </li>
      ))}
    </ul>
  );
}

/** The kit's words for a type are accepted (`information`, `danger`) and stored as Base UI's (`info`, `error`), so they draw their icons. An error stays eight seconds; a toast with an action stays until it is closed; the title and the description can be selected and copied. */
export const Defaults: Story = {
  render: function Example() {
    const [manager] = useState(createToastManager);
    // One at a time, so each is read on its own.
    const show = (options: ToastOptions) => {
      manager.close();
      manager.add(options);
    };
    return (
      <Toaster toastManager={manager}>
        <div className="flex flex-col items-start gap-150">
          <div className="flex flex-wrap gap-100">
            <Button
              onClick={() =>
                show({
                  title: "Catalogue updated",
                  description: "Revision 5.2",
                  type: "information",
                })
              }
            >
              Information
            </Button>
            <Button
              onClick={() =>
                show({
                  title: "Could not publish",
                  description:
                    "sha256:4f1c9a2b7e0d3c6f8a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6071",
                  type: "danger",
                })
              }
            >
              Danger
            </Button>
            <Button
              onClick={() =>
                show({
                  title: "Linked",
                  actionProps: { children: "View", onClick: () => undefined },
                })
              }
            >
              With an action
            </Button>
          </div>
          <Readout />
        </div>
      </Toaster>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    const stored = (title: string) =>
      canvasElement.querySelector(`[data-toast-title="${title}"]`)?.textContent;
    await userEvent.click(canvas.getByRole("button", { name: "Information" }));
    await expect(await page.findByText("Catalogue updated")).toBeVisible();
    await expect(stored("Catalogue updated")).toBe(
      "Catalogue updated: type info, timeout default, priority low",
    );
    const info = page.getByText("Catalogue updated").closest('[data-slot="toast"]')!;
    await expect(info.querySelector(".lucide-info")).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Danger" }));
    const title = { selector: '[data-slot="toast-title"]' };
    await expect(await page.findByText("Could not publish", title)).toBeVisible();
    await expect(stored("Could not publish")).toBe(
      "Could not publish: type error, timeout 8000, priority low",
    );
    const danger = page.getByText("Could not publish", title).closest('[data-slot="toast"]')!;
    await expect(danger.querySelector(".lucide-circle-alert")).not.toBeNull();
    // A hash wraps inside the toast instead of running past its edge.
    const hash = danger.querySelector<HTMLElement>('[data-slot="toast-description"]')!;
    await expect(hash.getBoundingClientRect().right).toBeLessThanOrEqual(
      danger.getBoundingClientRect().right,
    );
    await expect(hash.scrollWidth).toBeLessThanOrEqual(hash.clientWidth + 1);
    // The words can be copied out: the title and description select, and a swipe that starts on them does not dismiss.
    for (const slot of ["toast-title", "toast-description"]) {
      const part = danger.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      await expect(getComputedStyle(part).userSelect).toBe("text");
      await expect(part).toHaveAttribute("data-base-ui-swipe-ignore");
    }
    await userEvent.click(canvas.getByRole("button", { name: "With an action" }));
    await expect(await page.findByText("Linked")).toBeVisible();
    await expect(stored("Linked")).toBe("Linked: type none, timeout 0, priority low");
    // Three toasts came and went, and `add` is the same function it was before the first.
    await expect(canvas.getByRole("list", { name: "Stored toasts" })).toHaveAttribute(
      "data-stable-add",
      "true",
    );
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
    await expect(
      await page.findByText("Could not build the package", {
        selector: '[data-slot="toast-title"]',
      }),
    ).toBeVisible();
    await expect(canvas.getByRole("status")).toHaveTextContent("Build failed");
  },
};

/** Four toasts at once, the stack open. Every toast stays inside the window; under 30rem of height the Toaster keeps two, so the open stack still fits (320 by 256 in the short-window check). */
export const Stack: Story = {
  render: function Example() {
    const [manager] = useState(createToastManager);
    return (
      <Toaster toastManager={manager} timeout={0}>
        <Button
          onClick={() => {
            for (const n of [1, 2, 3, 4])
              manager.add({ title: `Evidence ${n} linked`, description: "Bank reconciliation" });
          }}
        >
          Link four
        </Button>
      </Toaster>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Link four" }));
    await expect(await page.findByText("Evidence 4 linked")).toBeVisible();
    const viewport = page.getByLabelText("Notifications");
    await userEvent.hover(viewport.querySelector<HTMLElement>('[data-slot="toast"]')!);
    const short = matchMedia("(max-height: 30rem)").matches;
    await waitFor(() => {
      const shown = [...viewport.querySelectorAll<HTMLElement>('[data-slot="toast"]')].filter(
        (el) => !el.hasAttribute("data-limited"),
      );
      expect(shown).toHaveLength(short ? 2 : 4);
      for (const el of shown) {
        const box = el.getBoundingClientRect();
        expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
      }
    });
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

function Raise({ label, options }: { label: string; options: ToastOptions }) {
  const { add } = useToastManager();
  return <Button onClick={() => add(options)}>{label}</Button>;
}

/** The mistakes the page is written to prevent, each beside the right way. Each button raises its toast in the one stack. */
export const Dont: Story = {
  render: () => <DontExamples />,
};

function DontExamples() {
  const [manager] = useState(createToastManager);
  return (
    <Toaster toastManager={manager}>
      <div className="flex flex-col gap-400">
        <Pair
          do={
            <Alert variant="danger">
              <AlertIcon />
              <AlertTitle>The requirement was not saved</AlertTitle>
              <AlertDescription>Your changes are kept. Try again.</AlertDescription>
              <AlertAction>
                <Button size="small">Try again</Button>
              </AlertAction>
            </Alert>
          }
          doText="A failure the reader must act on stays on the page, beside what failed, until it is fixed."
          dont={
            <Raise
              label="Save requirement"
              options={{ title: "Something went wrong", type: "danger" }}
            />
          }
          dontText="A failure in a toast. It leaves after eight seconds, before a reader who looked away has read it, and takes the way out with it."
        />
        <Pair
          do={
            <Raise
              label="Link evidence"
              options={{ title: "Evidence linked", description: "Bank reconciliation, July" }}
            />
          }
          doText="A title that says what happened and at most one short line."
          dont={
            <Raise
              label="Link evidence, wordy"
              options={{
                title: "The evidence was linked successfully",
                description:
                  "Bank reconciliation, July is now linked to CTRL-0412 and to the three requirements that cite it, and its reviewers have been told.",
              }}
            />
          }
          dontText="A paragraph in a toast. It leaves before it is read; the detail belongs in the record."
        />
      </div>
    </Toaster>
  );
}
