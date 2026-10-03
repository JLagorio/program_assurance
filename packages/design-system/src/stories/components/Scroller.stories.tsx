import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import { Badge, Button, Scroller, ScrollerArrow, ScrollerViewport } from "../../components";
import { menuItem, menuSurface } from "../../components/menu";
import { LedgerProvider } from "../../lib/locale";
import { Inline, Stack, Text } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

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
/** Arrows are a hover affordance: a touch phone swipes and sees none. */
const hoverable = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
/** The focused element's ring is drawn inside its box, and the box inside the viewport's clip. */
const ringInside = async (item: HTMLElement, viewport: HTMLElement) => {
  const style = getComputedStyle(item);
  await expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
  await expect(parseFloat(style.outlineOffset)).toBe(-parseFloat(style.outlineWidth));
  const clip = viewport.getBoundingClientRect();
  const box = item.getBoundingClientRect();
  await expect(box.top).toBeGreaterThanOrEqual(clip.top + viewport.clientTop - 0.5);
  await expect(box.bottom).toBeLessThanOrEqual(
    clip.top + viewport.clientTop + viewport.clientHeight + 0.5,
  );
  await expect(box.left).toBeGreaterThanOrEqual(clip.left + viewport.clientLeft - 0.5);
  await expect(box.right).toBeLessThanOrEqual(
    clip.left + viewport.clientLeft + viewport.clientWidth + 0.5,
  );
};

/** A bounded list on an overlay surface: hovering an arrow scrolls until that edge is reached. */
export const Vertical: Story = {
  render: () => (
    <div className={menuSurface} style={{ width: 240, maxWidth: "100%" }} data-testid="menu">
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
    // The caller's own tab stop keeps its role and name.
    await expect(viewport).toHaveAttribute("role", "list");
    await expect(viewport).toHaveAccessibleName("Assessors");
    await user.keyboard("{Shift}");
    viewport.focus();
    await ringInside(viewport, viewport);
    viewport.blur();
    if (!hoverable()) {
      // A touch reader swipes: no arrows, and the native scrollbar stays.
      await expect(arrow(root, "end")).toBeNull();
      await expect(viewport).not.toHaveAttribute("data-scroller-arrows");
      return;
    }
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

const controls = Array.from({ length: 120 }, (_, i) => `AC-${i + 1}`);

/**
 * A list more than five viewports tall keeps its native scrollbar and shows no arrows: hovering
 * would take too long to reach its end, and the reader can drag the bar.
 */
export const LongList: Story = {
  render: () => (
    <div className={menuSurface} style={{ width: 240, maxWidth: "100%" }} data-testid="long">
      <Scroller orientation="vertical" surface="overlay" style={{ maxHeight: 200 }}>
        <ScrollerViewport aria-label="Controls" role="list" tabIndex={0}>
          {controls.map((name) => (
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
    const root = within(canvasElement).getByTestId("long");
    const viewport = viewportOf(root);
    await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight * 5);
    // Give the Scroller a frame to measure, then check it left the native bar in place.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await expect(arrow(root, "end")).toBeNull();
    await expect(viewport).not.toHaveAttribute("data-scroller-arrows");
    await expect(root.querySelector('[data-slot="scroller"]')).not.toHaveAttribute("data-arrows");
    await expect(getComputedStyle(viewport).scrollbarWidth).not.toBe("none");
    await expect(getComputedStyle(viewport).scrollPaddingTop).not.toBe("24px");
  },
};

function Strip({ label }: { label: string }) {
  return (
    <Scroller orientation="horizontal" style={{ width: 320, maxWidth: "100%" }} data-testid={label}>
      <ScrollerViewport aria-label={label} role="list" className="flex gap-100">
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

/**
 * A strip on the page surface: clicking an arrow steps a page; the arrows follow the locale. A
 * strip of buttons is not a tab stop of its own, and each button's focus ring is drawn inside it,
 * since the strip clips.
 */
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
      // Buttons inside reach the keyboard, so the strip itself is no stop.
      await expect(viewport).not.toHaveAttribute("tabindex");
      // A resting button's ring and shadow stay inside the strip's padding.
      const first = scope.getByRole("button", { name: "Overview" });
      await expect(first.getBoundingClientRect().top).toBeGreaterThan(
        viewport.getBoundingClientRect().top,
      );
      if (hoverable()) {
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
        await waitFor(() =>
          expect(scope.queryByRole("button", { name: "Scroll back" })).toBeNull(),
        );
      } else {
        await expect(scope.queryByRole("button", { name: "Scroll forward" })).toBeNull();
      }
      await user.keyboard("{Shift}");
      first.focus();
      for (const [i, view] of views.entries()) {
        if (i > 0) await user.tab();
        const item = scope.getByRole("button", { name: view });
        await expect(item).toHaveFocus();
        await waitFor(() => {
          const bounds = viewport.getBoundingClientRect();
          const focused = item.getBoundingClientRect();
          expect(focused.left).toBeGreaterThanOrEqual(bounds.left - 1);
          expect(focused.right).toBeLessThanOrEqual(bounds.right + 1);
        });
        await ringInside(item, viewport);
      }
    }
  },
};

function Chips({ label, count }: { label: string; count: number }) {
  return (
    <Scroller orientation="horizontal" style={{ width: 280, maxWidth: "100%" }} data-testid={label}>
      <ScrollerViewport
        className="flex gap-100"
        aria-label={label === "Unnamed" ? undefined : label}
      >
        {views.slice(0, count).map((view) => (
          <Badge key={view} variant="secondary">
            {view}
          </Badge>
        ))}
      </ScrollerViewport>
      <ScrollerArrow edge="start" />
      <ScrollerArrow edge="end" />
    </Scroller>
  );
}

/**
 * A strip whose content the keyboard cannot reach is a tab stop while it overflows, so the arrow
 * keys can scroll it, with the focus ring inside it. It is a group named by its `aria-label`, or
 * "Content, scrolls" when it has none. A strip that fits, or that holds a button, is no stop.
 */
export const KeyboardStop: Story = {
  render: () => (
    <Stack space="space.300">
      <Chips label="Control families" count={7} />
      <Chips label="Unnamed" count={7} />
      <Chips label="Two families" count={2} />
      <Strip label="Views strip" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const named = viewportOf(canvas.getByTestId("Control families"));
    await waitFor(() => expect(named).toHaveAttribute("tabindex", "0"));
    await expect(named).toHaveAttribute("role", "group");
    await expect(named).toHaveAccessibleName("Control families");
    const unnamed = viewportOf(canvas.getByTestId("Unnamed"));
    await waitFor(() => expect(unnamed).toHaveAttribute("tabindex", "0"));
    await expect(unnamed).toHaveAccessibleName("Content, scrolls");
    // Content that fits, and a strip of buttons, add no stop.
    const fits = viewportOf(canvas.getByTestId("Two families"));
    await expect(fits.scrollWidth).toBeLessThanOrEqual(fits.clientWidth);
    await expect(fits).not.toHaveAttribute("tabindex");
    await expect(fits).not.toHaveAttribute("role");
    await expect(viewportOf(canvas.getByTestId("Views strip"))).not.toHaveAttribute("tabindex");
    // The strip is in the tab order, and its ring shows inside it.
    await user.keyboard("{Shift}");
    unnamed.focus();
    await user.tab({ shift: true });
    await expect(named).toHaveFocus();
    await expect(named).toHaveAttribute("data-scroller-viewport", "horizontal");
    await ringInside(named, named);
  },
};

function CurrentStrip({ label, current }: { label: string; current: string }) {
  return (
    <Scroller orientation="horizontal" data-testid={label}>
      <ScrollerViewport aria-label={label} role="list" className="flex gap-100">
        {views.map((view) => (
          <div key={view} role="listitem" className="shrink-0">
            <Button isSelected={view === current}>{view}</Button>
          </div>
        ))}
      </ScrollerViewport>
      <ScrollerArrow edge="start" />
      <ScrollerArrow edge="end" />
    </Scroller>
  );
}

/**
 * Counts that arrive after the first layout, a pressed view chosen from outside the strip, and
 * labels that lengthen after the reader has scrolled.
 */
function GrowingStrip() {
  const [counted, setCounted] = useState(false);
  const [current, setCurrent] = useState("Activity");
  const [longer, setLonger] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setCounted(true), 300);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <Stack space="space.100">
      <Inline space="space.100">
        <Button size="small" onClick={() => setCurrent("Overview")}>
          Show the overview
        </Button>
        <Button size="small" onClick={() => setLonger(true)}>
          Lengthen the labels
        </Button>
      </Inline>
      <div style={{ maxWidth: 240 }}>
        <Scroller orientation="horizontal" data-testid="Growing views">
          <ScrollerViewport aria-label="Growing views" role="list" className="flex gap-100">
            {views.map((view) => (
              <div key={view} role="listitem" className="shrink-0">
                <Button isSelected={view === current}>
                  {view}
                  {counted ? ` · ${view.length * 7}` : ""}
                  {longer ? " open" : ""}
                </Button>
              </div>
            ))}
          </ScrollerViewport>
          <ScrollerArrow edge="start" />
          <ScrollerArrow edge="end" />
        </Scroller>
      </div>
    </Stack>
  );
}

function NarrowingStrips() {
  const [wide, setWide] = useState(true);
  return (
    <Stack space="space.300">
      <Stack space="space.100">
        <Text size="xsmall" color="color.text.subtlest">
          Narrowed while open: the pressed view scrolls back into the strip
        </Text>
        <div>
          <Button size="small" onClick={() => setWide((value) => !value)}>
            {wide ? "Narrow the strip" : "Widen the strip"}
          </Button>
        </div>
        <div style={{ maxWidth: wide ? 800 : 240 }}>
          <CurrentStrip label="Resizing views" current="Operational issues" />
        </div>
      </Stack>
      <Stack space="space.100">
        <Text size="xsmall" color="color.text.subtlest">
          Narrow from the start: the pressed view is in the strip on its first layout
        </Text>
        <div style={{ maxWidth: 240 }}>
          <CurrentStrip label="Narrow views" current="Activity" />
        </div>
      </Stack>
      <Stack space="space.100">
        <Text size="xsmall" color="color.text.subtlest">
          Counts arrive after the first layout, a view is chosen from outside the strip, and labels
          lengthen after the reader scrolls
        </Text>
        <GrowingStrip />
      </Stack>
    </Stack>
  );
}

const inView = (viewport: HTMLElement, item: HTMLElement) => {
  const bounds = viewport.getBoundingClientRect();
  const box = item.getBoundingClientRect();
  return box.left >= bounds.left - 1 && box.right <= bounds.right + 1;
};

/**
 * A strip keeps its current item in view: the selected tab, the current step or the pressed view
 * scrolls back in if it ended outside, and focus stays where it was. Until the reader scrolls,
 * swipes, clicks or moves focus in the strip, that holds whenever its size changes, so counts
 * that arrive late cannot push the current item out; after that only narrowing brings it back. A
 * current item chosen from outside the strip always scrolls in.
 */
export const KeepsCurrentInView: Story = {
  render: () => <NarrowingStrips />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const narrow = canvas.getByTestId("Narrow views");
    const narrowViewport = viewportOf(narrow);
    await expect(narrowViewport.scrollWidth).toBeGreaterThan(narrowViewport.clientWidth);
    await waitFor(() =>
      expect(inView(narrowViewport, within(narrow).getByRole("button", { name: "Activity" }))).toBe(
        true,
      ),
    );

    // Counts widen every view after the first layout; the pressed one stays in the strip.
    const growing = canvas.getByTestId("Growing views");
    const growingViewport = viewportOf(growing);
    const activity = within(growing).getByRole("button", { name: /^Activity/ });
    await waitFor(() => expect(activity).toHaveTextContent("Activity · 56"));
    await waitFor(() => expect(inView(growingViewport, activity)).toBe(true));
    await expect(growingViewport.scrollLeft).toBeGreaterThan(0);
    // A view chosen from outside the strip scrolls in.
    await userEvent.click(canvas.getByRole("button", { name: "Show the overview" }));
    const overview = within(growing).getByRole("button", { name: /^Overview/ });
    await expect(overview).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(inView(growingViewport, overview)).toBe(true));
    await expect(canvas.getByRole("button", { name: "Show the overview" })).toHaveFocus();
    // Once the reader has scrolled the strip, content that grows leaves it where they put it.
    fireEvent.wheel(growingViewport, { deltaX: 400 });
    growingViewport.scrollLeft = growingViewport.scrollWidth;
    await waitFor(() => expect(inView(growingViewport, overview)).toBe(false));
    const readerLeft = growingViewport.scrollLeft;
    const widthBefore = growingViewport.scrollWidth;
    await userEvent.click(canvas.getByRole("button", { name: "Lengthen the labels" }));
    await waitFor(() => expect(growingViewport.scrollWidth).toBeGreaterThan(widthBefore));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await expect(Math.abs(growingViewport.scrollLeft - readerLeft)).toBeLessThanOrEqual(1);
    await expect(inView(growingViewport, overview)).toBe(false);

    const resizing = canvas.getByTestId("Resizing views");
    const viewport = viewportOf(resizing);
    const current = within(resizing).getByRole("button", { name: "Operational issues" });
    await expect(current).toHaveAttribute("aria-pressed", "true");
    const toggle = canvas.getByRole("button", { name: "Narrow the strip" });
    await userEvent.click(toggle);
    await waitFor(() => expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth));
    await waitFor(() => expect(inView(viewport, current)).toBe(true));
    await expect(viewport.scrollLeft).toBeGreaterThan(0);
    // The strip moved; focus did not.
    await expect(canvas.getByRole("button", { name: "Widen the strip" })).toHaveFocus();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

/** A strip that becomes a tab stop is named after what it holds, so a keyboard reader hears more than that it scrolls. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={<Chips label="Control families" count={7} />}
      doText="aria-label on the viewport: the stop is heard as Control families."
      dont={<Chips label="Unnamed" count={7} />}
      dontText="No name. The stop is heard as Content, scrolls, which says it scrolls and nothing of what is in it."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const named = viewportOf(canvas.getByTestId("Control families"));
    const unnamed = viewportOf(canvas.getByTestId("Unnamed"));
    await waitFor(() => expect(named).toHaveAttribute("tabindex", "0"));
    await waitFor(() => expect(unnamed).toHaveAttribute("tabindex", "0"));
    await expect(named).toHaveAccessibleName("Control families");
    await expect(unnamed).toHaveAccessibleName("Content, scrolls");
  },
};
