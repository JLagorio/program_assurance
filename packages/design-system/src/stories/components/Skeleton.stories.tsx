import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Skeleton, Spinner } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
  args: {},
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The four shapes, lines by count, and three things waiting: a record head, a row of a list, a card with a chart. */
export const SkeletonMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Shapes: line, heading, circle, block">
        <Box style={{ width: 200 }}>
          <Skeleton data-testid="skeleton-line" />
        </Box>
        <Box style={{ width: 200 }}>
          <Skeleton shape="heading" data-testid="skeleton-heading" />
        </Box>
        <Skeleton shape="circle" data-testid="skeleton-circle" />
        <Skeleton shape="circle" width={24} data-testid="skeleton-small-circle" />
        <Skeleton shape="block" width={200} height={64} data-testid="skeleton-block" />
      </Specimens>
      <Specimens title="Lines: 1, 2, 3">
        <Box style={{ width: 200 }}>
          <Skeleton lines={1} data-testid="skeleton-one-line" />
        </Box>
        <Box style={{ width: 200 }}>
          <Skeleton lines={2} data-testid="skeleton-two-lines" />
        </Box>
        <Box style={{ width: 200 }}>
          <Skeleton lines={3} data-testid="skeleton-three-lines" />
        </Box>
      </Specimens>
      <Specimens title="What is coming: a record head, a list row, a card with a chart">
        <Box style={{ width: 320 }} aria-busy>
          <Stack space="space.150">
            <Skeleton width={72} />
            <Skeleton shape="heading" width={240} />
            <Skeleton lines={2} />
          </Stack>
        </Box>
        <Box style={{ width: 320 }} aria-busy>
          <Inline space="space.150" alignBlock="center">
            <Skeleton shape="circle" width={24} />
            <Box className="flex-1">
              <Stack space="space.100">
                <Skeleton width={180} />
                <Skeleton width={120} />
              </Stack>
            </Box>
            <Skeleton width={48} />
          </Inline>
        </Box>
        <Box
          style={{ width: 320 }}
          padding="space.200"
          className="rounded-medium border border-default"
          aria-busy
        >
          <Stack space="space.200">
            <Skeleton shape="heading" width={160} />
            <Skeleton shape="block" height={120} />
            <Inline space="space.150">
              <Skeleton width={64} />
              <Skeleton width={64} />
              <Skeleton width={64} />
            </Inline>
          </Stack>
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sizes = [
      ["skeleton-line", 200, 12],
      ["skeleton-heading", 200, 20],
      ["skeleton-circle", 32, 32],
      ["skeleton-small-circle", 24, 24],
      ["skeleton-block", 200, 64],
      ["skeleton-one-line", 200, 12],
    ] as const;
    for (const [id, width, height] of sizes) {
      const skeleton = canvas.getByTestId(id);
      await expect(skeleton).toHaveAttribute("data-slot", "skeleton");
      const bounds = skeleton.getBoundingClientRect();
      await expect(bounds.width).toBe(width);
      await expect(bounds.height).toBe(height);
    }
    for (const [id, count] of [
      ["skeleton-two-lines", 2],
      ["skeleton-three-lines", 3],
    ] as const) {
      const group = canvas.getByTestId(id);
      await expect(group).toHaveAttribute("data-slot", "skeleton");
      const lines = Array.from(group.children);
      await expect(lines).toHaveLength(count);
      await expect(getComputedStyle(group).rowGap).toBe("8px");
      for (const [index, line] of lines.entries()) {
        const bounds = line.getBoundingClientRect();
        await expect(bounds.height).toBe(12);
        await expect(bounds.width).toBeCloseTo(index === count - 1 ? (200 * 2) / 3 : 200, 1);
      }
    }
    for (const root of canvasElement.querySelectorAll<HTMLElement>('[data-slot="skeleton"]')) {
      await expect(root).toHaveAttribute("aria-hidden", "true");
      await expect(root.tabIndex).toBe(-1);
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animatedShapes = canvasElement.querySelectorAll(".animate-pulse");
    await expect(animatedShapes.length).toBeGreaterThan(0);
    for (const shape of animatedShapes) {
      await expect(getComputedStyle(shape).animationName).toBe(reducedMotion ? "none" : "pulse");
    }
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ width: 320 }} aria-busy>
            <Stack space="space.150">
              <Skeleton shape="heading" width={200} />
              <Skeleton lines={3} />
            </Stack>
          </Box>
        }
        doText="A page or a section that is loading holds its shape: the reader knows what is coming and nothing jumps."
        dont={
          <Box style={{ width: 320, height: 84 }} className="flex items-center justify-center">
            <Spinner size="large" />
          </Box>
        }
        dontText="A spinner where content will be. The layout arrives all at once and shifts. Skeletons for progressive loads, a spinner for an action."
      />
      <Pair
        do={
          <Box style={{ width: 320 }} aria-busy>
            <Inline space="space.150" alignBlock="center">
              <Skeleton shape="circle" width={24} />
              <Box className="flex-1">
                <Skeleton lines={2} />
              </Box>
            </Inline>
          </Box>
        }
        doText="The shape of what is coming: a circle where the avatar will be, lines where the text will."
        dont={
          <Box style={{ width: 320 }}>
            <Skeleton shape="block" height={44} />
          </Box>
        }
        dontText="One grey block for a row. It says something is loading and nothing about what."
      />
      <Pair
        do={
          <Box style={{ width: 320 }} aria-busy>
            <Stack space="space.100">
              <Skeleton width={240} />
              <Skeleton width={180} />
            </Stack>
          </Box>
        }
        doText="Lines about as long as the text will be."
        dont={
          <Box style={{ width: 320 }}>
            <Stack space="space.100">
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </Stack>
          </Box>
        }
        dontText="Six full lines for a two-line note. The skeleton promises more than arrives, and the page shrinks when it does."
      />
    </Stack>
  ),
};

const nativeRefs = {
  block: createRef<HTMLDivElement>(),
  lines: createRef<HTMLDivElement>(),
  content: createRef<HTMLDivElement>(),
};
const nativeEvents = { block: fn(), lines: fn() };

/** Native attributes target the outer placeholder; supplied children replace generated lines. */
export const NativeAttributes: Story = {
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Text>Attachment preview</Text>
        <Skeleton
          ref={nativeRefs.block}
          id="attachment-placeholder"
          shape="block"
          width={240}
          height={64}
          role="status"
          aria-label="Loading attachment preview"
          aria-hidden={false}
          data-example="native-block"
          className="max-w-full"
          style={{ width: 200, height: 80 }}
          onPointerEnter={nativeEvents.block}
        >
          <span className="sr-only">Loading attachment preview</span>
        </Skeleton>
      </Stack>
      <Stack space="space.100">
        <Text>Record summary</Text>
        <Skeleton
          ref={nativeRefs.lines}
          id="summary-placeholder"
          title="Loading record summary"
          lang="en"
          dir="ltr"
          lines={3}
          width={160}
          height={10}
          data-example="native-lines"
          className="self-stretch"
          style={{ width: 240, gap: 12 }}
          onPointerEnter={nativeEvents.lines}
        />
      </Stack>
      <Stack space="space.100">
        <Text>Notes</Text>
        <Skeleton
          ref={nativeRefs.content}
          lines={3}
          role="status"
          aria-label="Loading notes"
          aria-hidden={false}
        >
          <Text>Loading notes…</Text>
        </Skeleton>
      </Stack>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const block = canvas.getByRole("status", { name: "Loading attachment preview" });
    const lines = canvas.getByTitle("Loading record summary");
    const content = canvas.getByRole("status", { name: "Loading notes" });
    for (const [name, root] of [
      ["block", block],
      ["lines", lines],
      ["content", content],
    ] as const) {
      await expect(nativeRefs[name].current).toBe(root);
      await expect(root.tagName).toBe("DIV");
      await expect(root).toHaveAttribute("data-slot", "skeleton");
      await expect(root.tabIndex).toBe(-1);
    }
    await expect(block).toHaveAttribute("id", "attachment-placeholder");
    await expect(block).toHaveAttribute("data-example", "native-block");
    await expect(block).toHaveAttribute("aria-hidden", "false");
    await expect(block).toHaveClass("max-w-full");
    await expect(block).toHaveStyle({ width: "200px", height: "80px" });
    await expect(block.children).toHaveLength(1);
    await expect(within(block).getByText("Loading attachment preview").parentElement).toBe(block);

    await expect(lines).toHaveAttribute("id", "summary-placeholder");
    await expect(lines).toHaveAttribute("lang", "en");
    await expect(lines).toHaveAttribute("dir", "ltr");
    await expect(lines).toHaveAttribute("data-example", "native-lines");
    await expect(lines).toHaveAttribute("aria-hidden", "true");
    await expect(lines).toHaveClass("self-stretch");
    await expect(lines).toHaveStyle({ width: "240px", gap: "12px" });
    await expect(lines.children).toHaveLength(3);
    for (const line of lines.children) {
      await expect(line).not.toHaveAttribute("id");
      await expect(line).not.toHaveAttribute("data-example");
      await expect(line.getBoundingClientRect().width).toBe(160);
      await expect(line.getBoundingClientRect().height).toBe(10);
    }

    await expect(content).toHaveAttribute("aria-hidden", "false");
    await expect(content.children).toHaveLength(1);
    await expect(within(content).getByText("Loading notes…").parentElement).toBe(content);
    await expect(content.querySelectorAll(".animate-pulse")).toHaveLength(0);

    nativeEvents.block.mockClear();
    nativeEvents.lines.mockClear();
    await userEvent.hover(block);
    await userEvent.hover(lines);
    await expect(nativeEvents.block).toHaveBeenCalledTimes(1);
    await expect(nativeEvents.lines).toHaveBeenCalledTimes(1);
  },
};

export const Playground: Story = {};
