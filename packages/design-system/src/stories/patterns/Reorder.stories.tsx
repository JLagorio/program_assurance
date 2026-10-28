import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Reorder, ReorderHandle, ReorderItem, ReorderMove } from "../../patterns/reorder";
import { Button } from "../../components/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "../../components/dialog";
import { Inline, Stack, Text } from "../../primitives";
import { arrows } from "../_lib/direction";
const meta = {
  title: "Patterns/Reorder",
  component: Reorder,
  subcomponents: { ReorderItem, ReorderHandle, ReorderMove },
  parameters: { layout: "padded" },
  args: {
    items: ["Alpha", "Beta", "Gamma"],
    getItemLabel: (id: string) => id,
    onReorder: () => undefined,
  },
} satisfies Meta<typeof Reorder>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Basic: Story = {
  render: (args) => (
    <Reorder {...args} aria-label="Reading order">
      <ReorderItem itemId="Alpha">
        <Inline space="space.100" shouldWrap>
          <ReorderHandle />
          <Text>Alpha</Text>
          <ReorderMove direction="previous" label="Move Alpha up" />
          <ReorderMove direction="next" label="Move Alpha down" />
        </Inline>
      </ReorderItem>
      <ReorderItem itemId="Beta">
        <Inline space="space.100" shouldWrap>
          <ReorderHandle />
          <Text>Beta</Text>
          <ReorderMove direction="previous" label="Move Beta up" />
          <ReorderMove direction="next" label="Move Beta down" />
        </Inline>
      </ReorderItem>
      <ReorderItem itemId="Gamma">
        <Inline space="space.100" shouldWrap>
          <ReorderHandle />
          <Text>Gamma</Text>
          <ReorderMove direction="previous" label="Move Gamma up" />
          <ReorderMove direction="next" label="Move Gamma down" />
        </Inline>
      </ReorderItem>
    </Reorder>
  ),
};
function Collection({
  horizontal = false,
  locked = false,
}: {
  horizontal?: boolean;
  locked?: boolean;
}) {
  const [items, setItems] = useState(["Alpha", "Beta", "Gamma"]);
  const [disabled, setDisabled] = useState(locked);
  return (
    <Stack space="space.150">
      <Button onClick={() => setDisabled((value) => !value)}>
        {disabled ? "Enable ordering" : "Pause ordering"}
      </Button>
      <Reorder
        items={items}
        getItemLabel={(id) => id}
        onReorder={setItems}
        disabled={disabled}
        orientation={horizontal ? "horizontal" : "vertical"}
        aria-label="Reading order"
      >
        <div
          className={
            horizontal ? "flex gap-100 overflow-x-auto p-050" : "flex flex-col gap-100 p-050"
          }
        >
          {items.map((id) => (
            <ReorderItem itemId={id} key={id}>
              <div className="flex flex-wrap items-center gap-100 rounded-medium border border-default p-100">
                <ReorderHandle />
                <Button variant="subtle">Open {id}</Button>
                <ReorderMove direction="previous" label={`Move ${id} earlier`} />
                <ReorderMove direction="next" label={`Move ${id} later`} />
              </div>
            </ReorderItem>
          ))}
        </div>
      </Reorder>
      <Text role="status" aria-label="Current order">
        {items.join(", ")}
      </Text>
    </Stack>
  );
}
export const SinglePress: Story = {
  tags: ["!manifest"],
  render: () => <Collection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await user.click(canvas.getByRole("button", { name: "Move Alpha later" }));
    await expect(canvas.getByRole("status", { name: "Current order" })).toHaveTextContent(
      "Beta, Alpha, Gamma",
    );
    await expect(canvas.getByRole("button", { name: "Move Beta earlier" })).toBeDisabled();
    await user.click(canvas.getByRole("button", { name: "Pause ordering" }));
    await expect(canvas.getByRole("button", { name: "Reorder Alpha" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Open Alpha" })).toBeEnabled();
    await user.click(canvas.getByRole("button", { name: "Enable ordering" }));
  },
};
export const Keyboard: Story = {
  tags: ["!manifest"],
  render: () => <Collection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const handle = canvas.getByRole("button", { name: "Reorder Alpha" });
    handle.focus();
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="reorder-insertion"]')).toBeInTheDocument(),
    );
    await user.keyboard(" ");
    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Current order" })).toHaveTextContent(
        "Beta, Alpha, Gamma",
      ),
    );
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Escape}");
    await expect(canvas.getByRole("status", { name: "Current order" })).toHaveTextContent(
      "Beta, Alpha, Gamma",
    );
    await waitFor(() => expect(handle).toHaveFocus());
  },
};
export const Horizontal: Story = {
  tags: ["!manifest"],
  render: () => <Collection horizontal />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    canvas.getByRole("button", { name: "Reorder Alpha" }).focus();
    await user.keyboard(" ");
    await user.keyboard(arrows(canvasElement).next);
    await user.keyboard(" ");
    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Current order" })).toHaveTextContent(
        "Beta, Alpha, Gamma",
      ),
    );
  },
};
export const Pending: Story = {
  tags: ["!manifest"],
  render: () => <Collection locked />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Reorder Alpha" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Move Beta earlier" })).toBeDisabled();
  },
};

export const Pointer: Story = {
  tags: ["!manifest"],
  render: () => <Collection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const source = canvas.getByRole("button", { name: "Reorder Alpha" });
    const target = canvas.getByRole("button", { name: "Reorder Gamma" });
    const start = source.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    await user.pointer({
      target: source,
      keys: "[MouseLeft>]",
      coords: { clientX: start.x + start.width / 2, clientY: start.y + start.height / 2 },
    });
    await user.pointer({
      target: source,
      coords: { clientX: start.x + start.width / 2, clientY: start.y + start.height / 2 + 12 },
    });
    await user.pointer({
      target,
      coords: { clientX: end.x + end.width / 2, clientY: end.y + end.height / 2 },
    });
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="reorder-insertion"]')).toBeInTheDocument(),
    );
    await user.pointer({ keys: "[/MouseLeft]" });
    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Current order" })).toHaveTextContent(
        "Beta, Gamma, Alpha",
      ),
    );
  },
};

function SavingCollection() {
  const [items, setItems] = useState(["Alpha", "Beta"]);
  const [pending, setPending] = useState(false);
  return (
    <Reorder
      items={items}
      getItemLabel={(id) => id}
      disabled={pending}
      onReorder={(next) => {
        setPending(true);
        setTimeout(() => {
          setItems(next);
          setPending(false);
        }, 150);
      }}
    >
      {items.map((id) => (
        <ReorderItem itemId={id} key={id}>
          <Inline space="space.100" shouldWrap>
            <ReorderHandle />
            <Text>{id}</Text>
            <ReorderMove direction="previous" label={`Move ${id} earlier`} />
            <ReorderMove direction="next" label={`Move ${id} later`} />
          </Inline>
        </ReorderItem>
      ))}
    </Reorder>
  );
}
export const SavingPreservesFocus: Story = {
  tags: ["!manifest"],
  render: () => <SavingCollection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await user.click(canvas.getByRole("button", { name: "Move Alpha later" }));
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Reorder Alpha" })).toHaveFocus(),
    );
    await expect(canvasElement.querySelector('[data-slot="reorder-item"]')).toHaveAttribute(
      "data-reorder-id",
      "Beta",
    );
  },
};

function ScrollingCollection() {
  const [items, setItems] = useState(Array.from({ length: 18 }, (_, index) => `Item ${index + 1}`));
  return (
    <Reorder items={items} getItemLabel={(id) => id} onReorder={setItems}>
      <div
        data-testid="scrolling-collection"
        className="overflow-y-auto p-050"
        style={{ height: 180 }}
      >
        {items.map((id) => (
          <ReorderItem key={id} itemId={id}>
            <Inline space="space.100" shouldWrap>
              <ReorderHandle />
              <Text>{id}</Text>
              <ReorderMove direction="previous" label={`Move ${id} earlier`} />
              <ReorderMove direction="next" label={`Move ${id} later`} />
            </Inline>
          </ReorderItem>
        ))}
      </div>
    </Reorder>
  );
}
export const EdgeScrolling: Story = {
  tags: ["!manifest"],
  render: () => <ScrollingCollection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const source = canvas.getByRole("button", { name: "Reorder Item 1" });
    const scroller = canvas.getByTestId("scrolling-collection");
    const start = source.getBoundingClientRect();
    const bounds = scroller.getBoundingClientRect();
    await user.pointer({
      target: source,
      keys: "[MouseLeft>]",
      coords: { clientX: start.x + start.width / 2, clientY: start.y + start.height / 2 },
    });
    await user.pointer({
      target: source,
      coords: { clientX: start.x + start.width / 2, clientY: start.y + start.height / 2 + 12 },
    });
    await user.pointer({
      target: scroller,
      coords: { clientX: start.x + start.width / 2, clientY: bounds.bottom - 3 },
    });
    await waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(0));
    await user.keyboard("{Escape}");
    await user.pointer({ keys: "[/MouseLeft]" });
    await waitFor(() =>
      expect(canvasElement.querySelector("[data-dragging]")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(scroller.scrollTop).toBeLessThanOrEqual(4));
  },
};

export const KeyboardEdgeScrolling: Story = {
  tags: ["!manifest"],
  render: () => <ScrollingCollection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const handle = canvas.getByRole("button", { name: "Reorder Item 1" });
    const scroller = canvas.getByTestId("scrolling-collection");
    handle.focus();
    await user.keyboard(" ");
    for (let index = 0; index < 7; index++) {
      await user.keyboard("{ArrowDown}");
      await waitFor(() =>
        expect(canvasElement.querySelector('[data-slot="reorder-insertion"]')).toBeInTheDocument(),
      );
    }
    await waitFor(() => {
      expect(scroller.scrollTop).toBeGreaterThan(100);
      const marker = canvasElement.querySelector('[data-slot="reorder-insertion"]')!;
      const target = marker.getBoundingClientRect();
      const viewport = scroller.getBoundingClientRect();
      expect(target.top).toBeGreaterThanOrEqual(viewport.top);
      expect(target.bottom).toBeLessThanOrEqual(viewport.bottom);
    });
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvasElement.querySelector("[data-dragging]")).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(scroller.scrollTop).toBeLessThanOrEqual(4));
    await expect(handle).toHaveFocus();
  },
};

export const InsideDialog: Story = {
  tags: ["!manifest"],
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button>Arrange items</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reading order</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Collection />
        </DialogBody>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await user.click(canvas.getByRole("button", { name: "Arrange items" }));
    const dialog = await body.findByRole("dialog", { name: "Reading order" });
    const inside = within(dialog);
    const handle = inside.getByRole("button", { name: "Reorder Alpha" });
    handle.focus();
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(dialog.querySelector('[data-slot="reorder-insertion"]')).toBeInTheDocument(),
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog.querySelector("[data-dragging]")).not.toBeInTheDocument());
    await expect(dialog).toBeVisible();
    await expect(inside.getByRole("status", { name: "Current order" })).toHaveTextContent(
      "Alpha, Beta, Gamma",
    );
    await user.keyboard(" ");
    await user.keyboard("{ArrowDown}");
    await user.keyboard(" ");
    await waitFor(() =>
      expect(inside.getByRole("status", { name: "Current order" })).toHaveTextContent(
        "Beta, Alpha, Gamma",
      ),
    );
    // Leave the handle's tooltip before asserting the parent dialog owns Escape.
    // The tooltip legitimately owns the first Escape while its trigger stays focused.
    await user.click(inside.getByRole("button", { name: "Open Alpha" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  },
};

export const CompositionAndFocusOwnership: Story = {
  tags: ["!manifest"],
  render: () => <Collection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const handle = canvas.getByRole("button", { name: "Reorder Alpha" });
    handle.focus();
    handle.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: " ",
        code: "Space",
        repeat: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    await expect(canvasElement.querySelector("[data-dragging]")).not.toBeInTheDocument();
    handle.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: " ",
        code: "Space",
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    await expect(canvasElement.querySelector("[data-dragging]")).not.toBeInTheDocument();
    await user.keyboard(" ");
    handle.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowDown",
        code: "ArrowDown",
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    await expect(
      canvasElement.querySelector('[data-slot="reorder-insertion"]'),
    ).not.toBeInTheDocument();
    await user.click(canvas.getByRole("button", { name: "Open Beta" }));
    await waitFor(() =>
      expect(canvasElement.querySelector("[data-dragging]")).not.toBeInTheDocument(),
    );
    await expect(canvas.getByRole("button", { name: "Open Beta" })).toHaveFocus();
    await expect(canvas.getByRole("status", { name: "Current order" })).toHaveTextContent(
      "Alpha, Beta, Gamma",
    );
  },
};

function DisabledDuringDrag() {
  const [items, setItems] = useState(["Alpha", "Beta"]);
  const [disabled, setDisabled] = useState(false);
  return (
    <Reorder
      items={items}
      getItemLabel={(id) => id}
      onReorder={setItems}
      disabled={disabled}
      onKeyDown={(event) => {
        if (event.code === "Space") setTimeout(() => setDisabled(true), 100);
      }}
    >
      {items.map((id) => (
        <ReorderItem key={id} itemId={id}>
          <Inline space="space.100">
            <ReorderHandle />
            <Text>{id}</Text>
          </Inline>
        </ReorderItem>
      ))}
    </Reorder>
  );
}
export const DisableCancelsDrag: Story = {
  tags: ["!manifest"],
  render: () => <DisabledDuringDrag />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const handle = canvas.getByRole("button", { name: "Reorder Alpha" });
    handle.focus();
    await user.keyboard(" ");
    await waitFor(() => expect(handle).toBeDisabled());
    await waitFor(() =>
      expect(canvasElement.querySelector("[data-dragging]")).not.toBeInTheDocument(),
    );
  },
};
