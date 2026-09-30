import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
  ScrollArea,
  useResizableLayout,
  type ResizablePanelGroupHandle,
  type ResizablePanelHandle,
} from "../..";

const meta = {
  title: "Components/Resizable",
  component: ResizablePanelGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ResizablePanelGroup>;
export default meta;
type Story = StoryObj<typeof meta>;
const groupRef = createRef<ResizablePanelGroupHandle>();
const panelRef = createRef<ResizablePanelHandle>();
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
  const { defaultLayout, onLayoutChanged } = useResizableLayout({
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

const rtlPanelRef = createRef<ResizablePanelHandle>();

/** In a right-to-left page the list sits on the right. The arrow keys move the handle the way they point, as the Shell's splitters do: ArrowLeft moves it left, which widens the list on the right. */
export const RightToLeft: Story = {
  name: "Right to left",
  render: () => (
    <div
      dir="rtl"
      style={{ height: 320 }}
      className="max-w-layout-measure overflow-hidden rounded-large border border-default"
    >
      <ResizablePanelGroup>
        <ResizablePanel
          id="rtl-list"
          defaultSize="30%"
          minSize="20%"
          maxSize="60%"
          panelRef={rtlPanelRef}
        >
          <List />
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize the list" />
        <ResizablePanel id="rtl-detail">
          <div className="p-200">The list is on the right; the arrows move the handle.</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const handle = within(canvasElement).getByRole("separator", { name: "Resize the list" });
    await waitFor(() => expect(rtlPanelRef.current?.getSize().asPercentage).toBeCloseTo(30, 0));
    const x = () => handle.getBoundingClientRect().left;
    const start = x();
    handle.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() => expect(x()).toBeLessThan(start));
    // The list on the right grew as the handle moved left.
    await expect(rtlPanelRef.current?.getSize().asPercentage).toBeGreaterThan(30);
    const moved = x();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await waitFor(() => expect(x()).toBeGreaterThan(moved));
    await expect(rtlPanelRef.current?.getSize().asPercentage).toBeLessThan(30);
  },
};

const foldRef = createRef<ResizablePanelHandle>();

function FoldableTree() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex flex-col gap-150">
      <Button onClick={() => (collapsed ? foldRef.current?.expand() : foldRef.current?.collapse())}>
        {collapsed ? "Show the tree" : "Hide the tree"}
      </Button>
      <div
        style={{ height: 320 }}
        className="max-w-layout-measure overflow-hidden rounded-large border border-default"
      >
        <ResizablePanelGroup>
          <ResizablePanel
            id="fold-tree"
            defaultSize="30%"
            minSize="20%"
            collapsible
            panelRef={foldRef}
            onResize={(size) => setCollapsed(size.asPercentage === 0)}
          >
            <List />
          </ResizablePanel>
          <ResizableHandle aria-label="Resize the tree" />
          <ResizablePanel id="fold-detail">
            <div className="p-200">The button folds the tree without a drag.</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

/** A split that only a drag resizes fails a reader who cannot drag (WCAG 2.5.7). The keyboard has the arrows, Home, End and Enter; a pointer without dragging gets a button that folds and unfolds the pane through the panel's `collapse()` and `expand()`. */
export const WithoutDragging: Story = {
  name: "Without dragging",
  render: () => <FoldableTree />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole("separator", { name: "Resize the tree" });
    await waitFor(() => expect(Number(handle.getAttribute("aria-valuenow"))).toBeGreaterThan(0));
    await userEvent.click(canvas.getByRole("button", { name: "Hide the tree" }));
    await waitFor(() => expect(handle).toHaveAttribute("aria-valuenow", "0"));
    // The button says what it will do next, and does it from a click alone.
    await userEvent.click(await canvas.findByRole("button", { name: "Show the tree" }));
    await waitFor(() => expect(Number(handle.getAttribute("aria-valuenow"))).toBeGreaterThan(0));
    await expect(await canvas.findByRole("button", { name: "Hide the tree" })).toBeVisible();
  },
};
