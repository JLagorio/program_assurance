import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Comparison } from "../../patterns/comparison";
import { Button, Input, KeyValue } from "../../components";
import { Heading, Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/Comparison",
  component: Comparison,
  parameters: { layout: "padded" },
  args: {
    primaryLabel: "Working draft",
    secondaryLabel: "Pinned reference",
    resizeLabel: "Resize comparison",
    primary: null,
    secondary: null,
  },
} satisfies Meta<typeof Comparison>;
export default meta;
type Story = StoryObj<typeof meta>;
const rootRef = createRef<HTMLDivElement>();
function Example({ narrow = false }: { narrow?: boolean }) {
  const [pinned, setPinned] = useState(true);
  const [active, setActive] = useState<"primary" | "secondary">("primary");
  return (
    <div style={{ maxWidth: narrow ? 360 : 1000 }}>
      <Stack space="space.150">
        <Button size="small" onClick={() => setPinned((value) => !value)}>
          {pinned ? "Unpin" : "Pin reference"}
        </Button>
        <Comparison
          ref={rootRef}
          data-testid="comparison"
          primaryLabel="Working draft"
          secondaryLabel="Pinned reference"
          resizeLabel="Resize comparison"
          activePane={active}
          onActivePaneChange={setActive}
          style={{ height: 420 }}
          primary={
            <Stack space="space.150">
              <Heading size="section">Draft service policy</Heading>
              <Input aria-label="Draft name" defaultValue="Policy under review" />
              {Array.from({ length: 12 }, (_, i) => (
                <Text key={i}>
                  Working paragraph {i + 1}. Draft state stays here while a reference is read.
                </Text>
              ))}
            </Stack>
          }
          secondary={
            pinned ? (
              <Stack space="space.150">
                <Heading size="section">
                  Published service policy with a long name that wraps inside its own pane
                </Heading>
                <KeyValue label="Status">Published</KeyValue>
                {Array.from({ length: 16 }, (_, i) => (
                  <Text key={i}>
                    Reference paragraph {i + 1}. This pane retains its independent reading position.
                  </Text>
                ))}
              </Stack>
            ) : undefined
          }
        />
      </Stack>
    </div>
  );
}
export const Basic: Story = {
  render: (args) => (
    <Comparison
      {...args}
      style={{ height: 320 }}
      primary={
        <Stack space="space.150">
          <Heading size="section">Working draft</Heading>
          <Input aria-label="Draft title" defaultValue="Service policy" />
        </Stack>
      }
      secondary={
        <Stack space="space.150">
          <Heading size="section">Published reference</Heading>
          <Text>Read the source while keeping the working draft in place.</Text>
        </Stack>
      }
    />
  ),
};
export const Playground: Story = {
  tags: ["!manifest"],
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const root = canvas.getByTestId("comparison");
    await expect(rootRef.current).toBe(root);
    const input = canvas.getByRole("textbox", { name: "Draft name" });
    await user.clear(input);
    await user.type(input, "Preserve this draft");
    const separator = canvas.queryByRole("separator", { name: "Resize comparison" });
    if (separator) {
      separator.focus();
      await user.keyboard("{End}");
      await expect(separator).toHaveAttribute("aria-valuenow", "75");
      await user.keyboard("{Enter}");
      await expect(separator).toHaveAttribute("aria-valuenow", "50");
    } else {
      await user.click(canvas.getByRole("button", { name: "Pinned reference" }));
      await expect(input).not.toBeVisible();
      await expect(input).toBeInTheDocument();
      await user.click(canvas.getByRole("button", { name: "Working draft" }));
      await expect(input).toHaveValue("Preserve this draft");
    }
    const working = root.querySelector<HTMLElement>('[data-slot="comparison-primary"]')!;
    working.scrollTop = 180;
    const position = working.scrollTop;
    working.dispatchEvent(new Event("scroll"));
    await user.click(canvas.getByRole("button", { name: "Unpin" }));
    await expect(input).toHaveValue("Preserve this draft");
    await waitFor(() =>
      expect(working.scrollTop).toBe(
        Math.min(position, working.scrollHeight - working.clientHeight),
      ),
    );
    await user.click(canvas.getByRole("button", { name: "Pin reference" }));
    await expect(input).toHaveValue("Preserve this draft");
  },
};
export const NarrowRetainsBoth: Story = {
  name: "Narrow retains both panes",
  render: () => <Example narrow />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Pinned reference" })).toBeVisible(),
    );
    const input = canvas.getByRole("textbox", { name: "Draft name" });
    await user.clear(input);
    await user.type(input, "Unsubmitted draft");
    await user.click(canvas.getByRole("button", { name: "Pinned reference" }));
    await expect(input).not.toBeVisible();
    await expect(input).toBeInTheDocument();
    const reference = canvas.getByRole("region", { name: "Pinned reference" });
    reference.scrollTop = 150;
    await user.click(canvas.getByRole("button", { name: "Working draft" }));
    await expect(input).toHaveValue("Unsubmitted draft");
    await user.click(canvas.getByRole("button", { name: "Pinned reference" }));
    await expect(reference.scrollTop).toBe(150);
  },
};

export const ResizeRetainsPosition: Story = {
  name: "Resize retains reading position",
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const root = canvas.getByTestId("comparison");
    const reference = root.querySelector<HTMLElement>('[data-slot="comparison-secondary"]')!;
    if (root.clientWidth < 640)
      await user.click(canvas.getByRole("button", { name: "Pinned reference" }));
    reference.scrollTop = 140;
    const position = reference.scrollTop;
    await expect(position).toBeGreaterThan(0);
    reference.dispatchEvent(new Event("scroll"));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const wasWide = root.clientWidth >= 640;
    if (wasWide) {
      root.style.width = "340px";
      await waitFor(() => expect(root).toHaveAttribute("data-layout", "single"));
      await user.click(canvas.getByRole("button", { name: "Pinned reference" }));
      await waitFor(() => expect(reference.scrollTop).toBe(position));
      root.style.width = "";
      await waitFor(() => expect(root).toHaveAttribute("data-layout", "split"));
      await waitFor(() => expect(reference.scrollTop).toBe(position));
    } else {
      await user.click(canvas.getByRole("button", { name: "Working draft" }));
      await user.click(canvas.getByRole("button", { name: "Pinned reference" }));
      await waitFor(() => expect(reference.scrollTop).toBe(position));
    }
  },
};
