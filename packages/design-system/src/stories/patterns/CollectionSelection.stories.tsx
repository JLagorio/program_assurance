import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useCollectionSelection } from "../../patterns/use-collection-selection";
import { Button, Checkbox } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
function Collection({ locked = false }: { locked?: boolean }) {
  const [items, setItems] = useState(["Alpha", "Beta", "Gamma", "Delta"]);
  const selection = useCollectionSelection({ items, disabledIds: ["Beta"], disabled: locked });
  return (
    <Stack space="space.150">
      <Inline shouldWrap>
        <Button disabled={locked} onClick={selection.selectAll}>
          Select all visible
        </Button>
        <Button disabled={locked} onClick={selection.clear}>
          Clear selection
        </Button>
      </Inline>
      <Text role="status">Selected: {selection.selectedIds.join(", ") || "none"}</Text>
      {items.map((id) => (
        <Inline key={id} shouldWrap>
          <Checkbox
            {...selection.getItemProps(id)}
            aria-label={`Select ${id}`}
            checked={selection.isSelected(id)}
            disabled={selection.isDisabled(id)}
            onClick={(event) =>
              selection.toggle(id, {
                range: event.shiftKey,
                additive: event.ctrlKey || event.metaKey,
              })
            }
            onKeyDown={(event) => {
              selection.getItemProps(id).onKeyDown(event);
              if (event.key === "Delete" && !locked)
                setItems((current) => current.filter((item) => item !== id));
            }}
          />
          <Text>{id}</Text>
          <Button variant="subtle">Open {id}</Button>
        </Inline>
      ))}
      <Button onClick={() => setItems((current) => current.filter((id) => id !== "Gamma"))}>
        Hide Gamma
      </Button>
    </Stack>
  );
}
const meta = {
  title: "Patterns/Collection selection",
  parameters: { layout: "padded" },
  tags: ["!manifest"],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const VisibleRange: Story = {
  render: () => <Collection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await user.click(canvas.getByRole("checkbox", { name: "Select Alpha" }));
    await user.keyboard("{Shift>}");
    await user.click(canvas.getByRole("checkbox", { name: "Select Delta" }));
    await user.keyboard("{/Shift}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: Alpha, Gamma, Delta");
    await expect(canvas.getByRole("checkbox", { name: "Select Beta" })).not.toBeChecked();
    await user.click(canvas.getByRole("button", { name: "Hide Gamma" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: Alpha, Delta");
    await user.click(canvas.getByRole("button", { name: "Clear selection" }));
    await user.click(canvas.getByRole("button", { name: "Select all visible" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: Alpha, Delta");
  },
};
export const KeyboardAndFocus: Story = {
  render: () => <Collection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    canvas.getByRole("checkbox", { name: "Select Alpha" }).focus();
    await user.keyboard("{Shift>}{ArrowDown}{/Shift}");
    await expect(canvas.getByRole("checkbox", { name: "Select Gamma" })).toHaveFocus();
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: Alpha, Gamma");
    await user.keyboard("{Delete}");
    await waitFor(() =>
      expect(canvas.getByRole("checkbox", { name: "Select Delta" })).toHaveFocus(),
    );
    await user.keyboard("{Control>}a{/Control}");
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: Alpha, Delta");
    await user.click(canvas.getByRole("button", { name: "Open Delta" }));
    await expect(canvas.getByRole("button", { name: "Open Delta" })).toHaveFocus();
  },
};
export const Disabled: Story = {
  render: () => <Collection locked />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("checkbox", { name: "Select Alpha" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(canvas.getByRole("button", { name: "Open Alpha" })).toBeEnabled();
  },
};

export const ComposingAndOwnedKeys: Story = {
  render: () => <Collection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole("checkbox", { name: "Select Alpha" });
    first.focus();
    const composing = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      code: "ArrowDown",
      shiftKey: true,
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    first.dispatchEvent(composing);
    await expect(first).toHaveFocus();
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: none");
    const owned = new KeyboardEvent("keydown", {
      key: "a",
      code: "KeyA",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    owned.preventDefault();
    first.dispatchEvent(owned);
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: none");
  },
};
