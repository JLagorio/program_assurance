import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import {
  useDefaultLayout,
  type GroupImperativeHandle,
  type PanelImperativeHandle,
} from "react-resizable-panels";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  ScrollArea,
} from "../../components";

const meta = {
  title: "Components/Resizable",
  component: ResizablePanelGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ResizablePanelGroup>;
export default meta;
type Story = StoryObj<typeof meta>;
const groupRef = createRef<GroupImperativeHandle>();
const panelRef = createRef<PanelImperativeHandle>();
const elementRef = createRef<HTMLDivElement>();
function List() {
  return (
    <ScrollArea className="h-full" viewportProps={{ role: "region", "aria-label": "Controls" }}>
      <div className="p-150">
        {Array.from({ length: 24 }, (_, i) => (
          <p key={i} className="py-075">
            CTRL-{400 + i}
          </p>
        ))}
      </div>
    </ScrollArea>
  );
}
export const Panes: Story = {
  render: () => (
    <div
      style={{ height: 320 }}
      className="max-w-layout-measure overflow-hidden rounded-large border border-default"
    >
      <ResizablePanelGroup groupRef={groupRef} elementRef={elementRef}>
        <ResizablePanel id="list" defaultSize="30%" minSize="20%" maxSize="60%" panelRef={panelRef}>
          <List />
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize the list" />
        <ResizablePanel id="detail">
          <div className="p-200">Drag the handle or focus it and use the arrow keys.</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole("separator", { name: "Resize the list" });
    await expect(handle).toHaveAttribute("aria-orientation", "vertical");
    await waitFor(() => expect(groupRef.current?.getLayout()["list"]).toBeCloseTo(30, 0));
    await expect(elementRef.current).toHaveAttribute("data-slot", "resizable-panel-group");
    handle.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(panelRef.current?.getSize().asPercentage).toBeGreaterThan(30));
    await userEvent.keyboard("{Home}");
    await waitFor(() => expect(panelRef.current?.getSize().asPercentage).toBeCloseTo(20, 0));
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(panelRef.current?.getSize().asPercentage).toBeCloseTo(60, 0));
  },
};
export const Vertical: Story = {
  render: () => (
    <div
      style={{ height: 320 }}
      className="max-w-layout-measure overflow-hidden rounded-large border border-default"
    >
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel defaultSize="55%" minSize="30%">
          <div className="p-200">Work above, log below.</div>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize the log" />
        <ResizablePanel minSize="20%">
          <List />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole("separator");
    await expect(handle).toHaveAttribute("aria-orientation", "horizontal");
    await waitFor(() => expect(Number(handle.getAttribute("aria-valuenow"))).toBeGreaterThan(0));
    const before = Number(handle.getAttribute("aria-valuenow"));
    handle.focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(Number(handle.getAttribute("aria-valuenow"))).toBeGreaterThan(before),
    );
  },
};
export const Collapsible: Story = {
  render: () => (
    <div
      style={{ height: 320 }}
      className="max-w-layout-measure overflow-hidden rounded-large border border-default"
    >
      <ResizablePanelGroup>
        <ResizablePanel defaultSize="30%" minSize="20%" collapsible>
          <List />
        </ResizablePanel>
        <ResizableHandle aria-label="Resize the tree" />
        <ResizablePanel>
          <div className="p-200">Press Enter on the handle to fold and unfold the tree.</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole("separator");
    handle.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(handle).toHaveAttribute("aria-valuenow", "0"));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(Number(handle.getAttribute("aria-valuenow"))).toBeGreaterThan(0));
  },
};
const serverStorage = { getItem: () => null, setItem: () => {} };
function PersistedGroup() {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: "storybook.resizable.persisted",
    onlySaveAfterUserInteractions: true,
    storage: typeof window === "undefined" ? serverStorage : window.localStorage,
  });
  return (
    <ResizablePanelGroup
      id="storybook.resizable.persisted"
      {...(defaultLayout ? { defaultLayout } : {})}
      onLayoutChanged={onLayoutChanged}
    >
      <ResizablePanel id="list" defaultSize="35%" minSize="20%" maxSize="75%">
        <List />
      </ResizablePanel>
      <ResizableHandle aria-label="Resize saved list" />
      <ResizablePanel id="detail">
        <div className="p-200">Your layout survives remounting and reloading.</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
function PersistedDemo() {
  const [mounted, setMounted] = useState(true);
  return (
    <div className="flex flex-col gap-150">
      <Button onClick={() => setMounted(!mounted)}>
        {mounted ? "Hide split" : "Restore split"}
      </Button>
      <div
        style={{ height: 320 }}
        className="max-w-layout-measure overflow-hidden rounded-large border border-default"
      >
        {mounted && <PersistedGroup />}
      </div>
    </div>
  );
}
export const Persisted: Story = {
  render: () => <PersistedDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole("separator");
    handle.focus();
    await userEvent.keyboard("{Home}{ArrowRight}{ArrowRight}");
    await waitFor(() => expect(Number(handle.getAttribute("aria-valuenow"))).toBeGreaterThan(20));
    const saved = handle.getAttribute("aria-valuenow");
    await userEvent.click(canvas.getByRole("button", { name: "Hide split" }));
    await expect(canvas.queryByRole("separator")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Restore split" }));
    await waitFor(() =>
      expect(canvas.getByRole("separator")).toHaveAttribute("aria-valuenow", saved),
    );
  },
};
