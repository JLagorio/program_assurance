import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";

import { PageSkeleton } from "../..";
import { Skeleton, Spinner } from "../../components";
import { Box, Inline, Stack, Text, VisuallyHidden } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Layout/PageSkeleton",
  component: PageSkeleton,
  parameters: { layout: "padded" },
  args: {},
} satisfies Meta<typeof PageSkeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every drawn shape, so a forced-colours run can check that none is blank. */
const shapesOf = (root: Element) => Array.from(root.querySelectorAll<HTMLElement>(".bg-skeleton"));

/** The polite region's lines: what a screen reader has been told. */
const said = () =>
  Array.from(
    document.querySelectorAll('[data-slot="announcer-region"][data-politeness="polite"]'),
  ).map((region) => region.textContent ?? "");

/** Both shapes: a register (three rows, then the default eight) and a record. */
export const PageSkeletonMatrix: Story = {
  render: () => (
    <Stack space="space.600">
      <PageSkeleton rows={3} />
      <PageSkeleton />
      <PageSkeleton variant="record" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const skeletons = within(canvasElement).getAllByRole("status");
    await expect(skeletons).toHaveLength(3);
    // In forced colours every shape is drawn in GrayText, so a loading page is never blank.
    if (window.matchMedia("(forced-colors: active)").matches)
      for (const shape of shapesOf(canvasElement))
        await expect(getComputedStyle(shape).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  },
};

/** A register, the default and the router's shape for a route it knows nothing about: the title with nothing under it, the toolbar's row (the search, filters, the primary at the end), then the table's header and rows, the lines DataTable keeps while its first rows load. */
export const Register: Story = {
  render: () => <PageSkeleton rows={5} label="Loading risks" />,
  play: async ({ canvasElement }) => {
    const skeleton = within(canvasElement).getByRole("status");
    await expect(skeleton).toHaveAttribute("data-variant", "register");
    await expect(skeleton.querySelector('[data-slot="page-skeleton-toolbar"]')).toBeVisible();
    // No tab strip: a register has none.
    await expect(skeleton.querySelectorAll(".border-b")).toHaveLength(6);
    // The wait is said once, through the persistent live region, and found by browsing.
    await expect(skeleton).toHaveTextContent("Loading risks");
    await waitFor(() => expect(said().join(" ")).toContain("Loading risks"));
  },
};

/** A record route's pending shape: the trail, the title with its actions, a tab strip and the first sections at the reading measure. The Details rail is the shell's Aside, which arrives with the page. */
export const Record: Story = {
  render: () => <PageSkeleton variant="record" label="Loading requirement" />,
  play: async ({ canvasElement }) => {
    const skeleton = within(canvasElement).getByRole("status");
    await expect(skeleton).toHaveAttribute("data-variant", "record");
    await expect(skeleton.querySelector('[data-slot="page-skeleton-toolbar"]')).toBeNull();
    await expect(skeleton).toHaveTextContent("Loading requirement");
    await waitFor(() => expect(said().join(" ")).toContain("Loading requirement"));
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<PageSkeleton rows={3} label="Loading findings" />}
        doText="The page's shape before its data: the title, the toolbar, the rows land where they will be."
        dont={
          <Box style={{ height: 200 }} className="flex items-center justify-center">
            <Spinner size="large" />
          </Box>
        }
        dontText="A spinner for a page. Nothing says what is coming, and everything arrives at once."
      />
      <Pair
        do={
          <Stack space="space.150" aria-busy>
            <VisuallyHidden>Loading control coverage</VisuallyHidden>
            <Skeleton shape="heading" width={240} />
            <Skeleton lines={2} />
          </Stack>
        }
        doText="A section that loads on its own draws its own Skeleton, in its own shape, and says what it is waiting for."
        dont={
          <Stack space="space.300">
            <Inline space="space.100" alignBlock="center">
              <Text weight="semibold">Control coverage</Text>
              <Text size="small" color="color.text.subtle">
                loaded
              </Text>
            </Inline>
            <PageSkeleton rows={2} label="Loading control coverage" />
          </Stack>
        }
        dontText="The page skeleton under a section that has loaded. It draws a second title and a toolbar that the section does not have."
      />
    </Stack>
  ),
};

export const Playground: Story = {};

/** The page's shape on a small phone: the head's lines follow the width and nothing runs past the window. */
export const Narrow: Story = {
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  tags: ["narrow"],
  render: () => (
    <Stack space="space.600">
      <PageSkeleton rows={4} />
      <PageSkeleton variant="record" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    for (const skeleton of within(canvasElement).getAllByRole("status"))
      for (const line of Array.from(skeleton.querySelectorAll<HTMLElement>("[data-slot=skeleton]")))
        await expect(line.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
  },
};
