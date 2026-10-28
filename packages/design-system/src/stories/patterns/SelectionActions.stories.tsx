import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { SelectionActions, Button, Stack, Text } from "../..";
const meta = {
  title: "Patterns/SelectionActions",
  component: SelectionActions,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SelectionActions>;
export default meta;
type Story = StoryObj;
export const Inline: Story = {
  render: () => (
    <SelectionActions label="Selected cells">
      <Button>Copy selection</Button>
      <Button>Discuss selection</Button>
    </SelectionActions>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole("group", { name: "Selected cells" }),
    ).toBeVisible();
  },
};
export const CapturedRange: Story = {
  render: function CapturedRange() {
    const source = useRef<HTMLParagraphElement>(null);
    const [range, setRange] = useState<Range | null>(null);
    const [message, setMessage] = useState("No action");
    return (
      <Stack>
        <Text ref={source}>Select this passage to review its supporting material.</Text>
        <Button
          onClick={() => {
            const next = document.createRange();
            next.selectNodeContents(source.current!);
            const native = window.getSelection();
            native?.removeAllRanges();
            native?.addRange(next);
            setRange(next);
          }}
        >
          Capture passage
        </Button>
        {range && (
          <SelectionActions
            label="Passage actions"
            selectionKey={range.toString()}
            anchor={{
              getBoundingClientRect: () => range.getBoundingClientRect(),
              contextElement: source.current!,
            }}
          >
            <Button onClick={() => setMessage(range.toString())}>Use passage</Button>
            <Button onClick={() => setRange(null)}>Clear selection</Button>
          </SelectionActions>
        )}
        <Text role="status">{message}</Text>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Capture passage" }));
    const action = await page.findByRole("button", { name: "Use passage" });
    await userEvent.click(action);
    await expect(canvas.getByRole("status")).toHaveTextContent("Select this passage");
    if (matchMedia("(pointer: fine)").matches) {
      await userEvent.click(canvas.getByRole("button", { name: "Passage actions" }));
      await waitFor(() => expect(page.getByRole("button", { name: "Use passage" })).toHaveFocus());
      await userEvent.keyboard("{Escape}");
      await expect(canvas.getByRole("button", { name: "Use passage" })).toBeVisible();
    }
    await userEvent.click(page.getByRole("button", { name: "Clear selection" }));
    await expect(page.queryByRole("button", { name: "Use passage" })).toBeNull();
  },
};

/** The floating surface flips and constrains itself at the viewport edge; touch keeps it inline. */
export const AtViewportEdge: Story = {
  render: () => (
    <SelectionActions
      label="Selection actions"
      anchor={{
        getBoundingClientRect: () => new DOMRect(innerWidth - 20, innerHeight - 20, 12, 12),
      }}
    >
      <Button>Discuss selected passage</Button>
      <Button>Copy passage link</Button>
    </SelectionActions>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const action = await page.findByRole("button", { name: "Discuss selected passage" });
    await waitFor(() => {
      const box = action.getBoundingClientRect();
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(innerWidth);
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(innerHeight);
    });
  },
};
