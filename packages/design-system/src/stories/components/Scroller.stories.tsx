import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button, Scroller, ScrollerArrow, ScrollerViewport } from "../../components";
import { menuItem, menuSurface } from "../../components/menu";
import { LedgerProvider } from "../../lib/locale";
import { Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Scroller",
  component: Scroller,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Scroller>;
export default meta;
type Story = StoryObj<typeof meta>;

const assessors = Array.from({ length: 24 }, (_, i) => `Assessor ${i + 1}`);
const views = [
  "Overview",
  "Requirements",
  "Controls",
  "Evidence",
  "Assessment findings",
  "Operational issues",
  "Activity",
];

const arrow = (root: HTMLElement, edge: "start" | "end") =>
  root.querySelector<HTMLElement>(`[data-slot="scroller-arrow"][data-edge="${edge}"]`);
const viewportOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>('[data-slot="scroller-viewport"]')!;

/** A bounded list on an overlay surface: hovering an arrow scrolls until that edge is reached. */
export const Vertical: Story = {
  render: () => (
    <div className={menuSurface} style={{ width: 240 }} data-testid="menu">
      <Scroller orientation="vertical" surface="overlay" style={{ maxHeight: 200 }}>
        <ScrollerViewport aria-label="Assessors" role="list" tabIndex={0}>
          {assessors.map((name) => (
            <div key={name} role="listitem" className={menuItem}>
              {name}
            </div>
          ))}
        </ScrollerViewport>
        <ScrollerArrow edge="start" />
        <ScrollerArrow edge="end" />
      </Scroller>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const root = canvas.getByTestId("menu");
    const viewport = viewportOf(root);
    await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);
    await waitFor(() => expect(arrow(root, "end")).toBeVisible());
    await expect(arrow(root, "start")).toBeNull();
    await expect(arrow(root, "end")).toHaveAttribute("aria-hidden", "true");
    await expect(getComputedStyle(viewport).scrollPaddingTop).toBe("24px");
    await expect(viewport).toHaveAttribute("data-scroller-arrows");
    await expect(getComputedStyle(viewport).scrollbarWidth).toBe("none");
    await user.hover(arrow(root, "end")!);
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    await user.unhover(arrow(root, "end")!);
    await waitFor(() => expect(arrow(root, "start")).toBeVisible());
    viewport.scrollTop = viewport.scrollHeight;
    await waitFor(() => expect(arrow(root, "end")).toBeNull());
    await expect(arrow(root, "start")).toBeVisible();
    viewport.scrollTop = 0;
    await waitFor(() => expect(arrow(root, "start")).toBeNull());
    await expect(arrow(root, "end")).toBeVisible();
  },
};

function Strip({ label }: { label: string }) {
  return (
    <Scroller orientation="horizontal" style={{ width: 320 }} data-testid={label}>
      <ScrollerViewport aria-label={label} role="list" tabIndex={0} className="flex gap-100 py-050">
        {views.map((view) => (
          <div key={view} role="listitem" className="shrink-0">
            <Button>{view}</Button>
          </div>
        ))}
      </ScrollerViewport>
      <ScrollerArrow edge="start" />
      <ScrollerArrow edge="end" />
    </Scroller>
  );
}

/** A strip on the page surface: clicking an arrow steps a page; the arrows follow the locale. */
export const Horizontal: Story = {
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Text size="xsmall" color="color.text.subtlest">
          Left to right
        </Text>
        <Strip label="Views" />
      </Stack>
      <LedgerProvider direction="rtl">
        <div dir="rtl">
          <Stack space="space.100">
            <Text size="xsmall" color="color.text.subtlest">
              Right to left
            </Text>
            <Strip label="Views (RTL)" />
          </Stack>
        </div>
      </LedgerProvider>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    for (const label of ["Views", "Views (RTL)"]) {
      const root = canvas.getByTestId(label);
      const scope = within(root);
      const viewport = viewportOf(root);
      await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
      const forward = await scope.findByRole("button", { name: "Scroll forward" });
      await expect(forward).toHaveAttribute("tabindex", "-1");
      await expect(getComputedStyle(forward).cursor).toBe("pointer");
      // The hairline sits on the arrow's inner edge, whichever side the locale puts it on.
      const inner = label.includes("RTL") ? "borderRightWidth" : "borderLeftWidth";
      await expect(getComputedStyle(forward)[inner]).toBe("1px");
      await expect(scope.queryByRole("button", { name: "Scroll back" })).toBeNull();
      await expect(getComputedStyle(viewport).scrollPaddingLeft).toBe("24px");
      await user.click(forward);
      await waitFor(() => expect(Math.abs(viewport.scrollLeft)).toBeGreaterThan(0));
      const back = await scope.findByRole("button", { name: "Scroll back" });
      await user.click(back);
      // Chrome clamps a fractional RTL strip at 1, not 0.
      await waitFor(() => expect(Math.abs(viewport.scrollLeft)).toBeLessThanOrEqual(1));
      await waitFor(() => expect(scope.queryByRole("button", { name: "Scroll back" })).toBeNull());
      viewport.focus();
      for (const view of views) {
        await user.tab();
        const item = scope.getByRole("button", { name: view });
        await expect(item).toHaveFocus();
        await waitFor(() => {
          const bounds = viewport.getBoundingClientRect();
          const focused = item.getBoundingClientRect();
          expect(focused.left).toBeGreaterThanOrEqual(bounds.left - 1);
          expect(focused.right).toBeLessThanOrEqual(bounds.right + 1);
        });
      }
    }
  },
};
