import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Peek } from "../../patterns/peek";
import { Glance } from "../../patterns/glance";
import { Badge, Button, KeyValue, LinkButton, TextLink } from "../../components";
import { Stack, Text } from "../../primitives";
const meta = {
  title: "Patterns/Peek",
  component: Peek,
  parameters: { layout: "padded" },
  args: {
    label: "Preview service policy",
    trigger: <TextLink href="#policy">POL-0042</TextLink>,
    children: null,
  },
} satisfies Meta<typeof Peek>;
export default meta;
type Story = StoryObj<typeof meta>;
const ref = createRef<HTMLSpanElement>();
function Example() {
  const [requested, setRequested] = useState(false);
  const [compared, setCompared] = useState(false);
  return (
    <div style={{ minHeight: 360 }}>
      <Stack space="space.200">
        <Text>Read the linked policy without leaving this draft.</Text>
        <Peek
          ref={ref}
          data-testid="peek"
          trigger={<TextLink href="#policy">POL-0042</TextLink>}
          label="Preview service policy"
          onOpenChange={(open) => {
            if (open) setRequested(true);
          }}
          actions={
            <>
              <LinkButton size="small" render={<a href="#policy" />}>
                Open policy
              </LinkButton>
              <Button size="small" onClick={() => setCompared(true)}>
                Compare
              </Button>
            </>
          }
        >
          {requested && (
            <Glance
              id="POL-0042"
              title="Policy for preserving event history across service migrations"
              status={<Badge tone="success">Published</Badge>}
              facts={[{ label: "Owner", value: "Platform team" }]}
            />
          )}
        </Peek>
        <Text role="status">{compared ? "Reference pinned" : "No reference pinned"}</Text>
      </Stack>
    </div>
  );
}
export const Basic: Story = {
  render: (args) => (
    <Peek
      {...args}
      actions={
        <LinkButton size="small" render={<a href="#policy" />}>
          Open policy
        </LinkButton>
      }
    >
      <Glance
        id="POL-0042"
        title="Service policy"
        status={<Badge tone="success">Published</Badge>}
      />
    </Peek>
  ),
};
export const Playground: Story = {
  tags: ["!manifest"],
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await expect(ref.current).toBe(canvas.getByTestId("peek"));
    await expect(canvas.getByRole("link", { name: "POL-0042" })).toHaveAttribute("href", "#policy");
    await user.click(canvas.getByRole("button", { name: "Preview service policy" }));
    const popup = await body.findByRole("dialog", { name: "Preview service policy" });
    await waitFor(() => expect(within(popup).getByText("Published")).toBeVisible());
    await user.click(within(popup).getByRole("button", { name: "Compare" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Reference pinned");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(popup).not.toBeInTheDocument());
    await expect(canvas.getByRole("button", { name: "Preview service policy" })).toHaveFocus();
  },
};
export const KeyboardSummary: Story = {
  name: "Keyboard summary and actions",
  render: () => <Example />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await user.tab();
    await expect(canvas.getByRole("link", { name: "POL-0042" })).toHaveFocus();
    await waitFor(() =>
      expect(
        body.getByText("Policy for preserving event history across service migrations"),
      ).toBeVisible(),
    );
    await user.keyboard("{Escape}");
    await user.tab();
    await expect(canvas.getByRole("button", { name: "Preview service policy" })).toHaveFocus();
    await user.keyboard("{Enter}");
    const popup = await body.findByRole("dialog", { name: "Preview service policy" });
    await expect(within(popup).getByRole("link", { name: "Open policy" })).toHaveAttribute(
      "href",
      "#policy",
    );
    await user.keyboard("{Escape}");
  },
};

export const ConstrainedFact: Story = {
  name: "Preview stays reachable beside a long linked fact",
  render: () => (
    <div style={{ width: 240, minHeight: 240 }}>
      <KeyValue label="Sponsor">
        <Peek
          trigger={<TextLink href="#sponsor">Comparison sponsor with a long name</TextLink>}
          label="Preview comparison sponsor"
        >
          <Glance id="ORG-0042" title="Comparison sponsor with a long name" />
        </Peek>
      </KeyValue>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Preview comparison sponsor" });
    const bounds = button.getBoundingClientRect();
    const hit = canvasElement.ownerDocument.elementFromPoint(
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
    await expect(button.contains(hit)).toBe(true);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await user.click(button);
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).getByRole("dialog", {
          name: "Preview comparison sponsor",
        }),
      ).toBeVisible(),
    );
    await user.keyboard("{Escape}");
  },
};
