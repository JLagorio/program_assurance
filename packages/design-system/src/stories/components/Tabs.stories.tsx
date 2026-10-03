import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useEffect, useState } from "react";
import { expect, fireEvent, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Badge,
  Button,
  Count,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Stack, Text } from "../../primitives";
import * as direction from "../_lib/direction";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Specimens } = storyLayout;
const { Pair } = pairLayout;
const { along, arrows, isRtl, scrolledFromStart, startSlack } = direction;

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  subcomponents: { TabsList, TabsTrigger, TabsContent },
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

const views = ["Overview", "Controls", "Evidence", "History"];
const scrollViewport = (list: HTMLElement) =>
  list.closest<HTMLElement>('[data-slot="scroll-area-viewport"]')!;
/** The Scroller's arrows are a hover affordance: a touch phone swipes the strip instead. */
const hoverable = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
/** A focused tab draws its ring inside itself, and the tab sits inside the strip's clip. */
const ringInside = async (tab: HTMLElement, viewport: HTMLElement) => {
  const style = getComputedStyle(tab);
  await expect(tab).toHaveFocus();
  await expect(parseFloat(style.outlineWidth)).toBeGreaterThan(0);
  await expect(parseFloat(style.outlineOffset)).toBe(-parseFloat(style.outlineWidth));
  const clip = viewport.getBoundingClientRect();
  const box = tab.getBoundingClientRect();
  // Sideways, a right-to-left strip may stop a pixel short of its end (startSlack).
  const slack = 0.5 + startSlack(viewport);
  await expect(box.top).toBeGreaterThanOrEqual(clip.top - 0.5);
  await expect(box.bottom).toBeLessThanOrEqual(clip.top + viewport.clientHeight + 0.5);
  await expect(box.left).toBeGreaterThanOrEqual(clip.left - slack);
  await expect(box.right).toBeLessThanOrEqual(clip.left + viewport.clientWidth + slack);
};
/** The space from the strip's bottom edge to where the panel's content starts. */
const spaceUnder = (list: HTMLElement, panel: HTMLElement) =>
  panel.getBoundingClientRect().top +
  parseFloat(getComputedStyle(panel).paddingTop) -
  list.closest<HTMLElement>('[data-slot="scroller"]')!.getBoundingClientRect().bottom;
const inStrip = (viewport: HTMLElement, tab: HTMLElement) => {
  const bounds = viewport.getBoundingClientRect();
  const box = tab.getBoundingClientRect();
  return box.left >= bounds.left - 1 && box.right <= bounds.right + 1;
};

/**
 * The same line strip fills a page, phone, or preview and keeps every tab on one row. A filled
 * strip in a narrow container scrolls the same way instead of spilling past both edges. Each tab
 * draws its focus ring inside itself, and a click in the gap between two labels chooses the nearer.
 */
export const ResponsiveWidths: Story = {
  render: () => (
    <Stack space="space.400">
      <Tabs defaultValue="Overview" style={{ width: 200, maxWidth: "100%" }}>
        <TabsList aria-label="200px filled views">
          {["Overview", "Requirements", "Controls", "Evidence"].map((view) => (
            <TabsTrigger key={view} value={view}>
              {view}
            </TabsTrigger>
          ))}
        </TabsList>
        {["Overview", "Requirements", "Controls", "Evidence"].map((view) => (
          <TabsContent key={view} value={view}>
            {view} content
          </TabsContent>
        ))}
      </Tabs>
      {[720, 390, 280].map((width) => (
        <Tabs key={width} defaultValue="Overview" style={{ width, maxWidth: "100%" }}>
          <TabsList variant="line" aria-label={`${width}px record views`} activateOnFocus>
            {["Overview", "Requirements", "Controls", "Evidence", "Activity"].map((view) => (
              <TabsTrigger key={view} value={view}>
                {view}
              </TabsTrigger>
            ))}
          </TabsList>
          {["Overview", "Requirements", "Controls", "Evidence", "Activity"].map((view) => (
            <TabsContent key={view} value={view}>
              {view} content
            </TabsContent>
          ))}
        </Tabs>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The filled strip scrolls: its first tab starts inside the container, and End and Home
    // reveal the last and first tabs.
    const filled = canvas.getByRole("tablist", { name: "200px filled views" });
    const filledViewport = scrollViewport(filled);
    const filledTabs = within(filled).getAllByRole("tab");
    await expect(filledViewport.scrollWidth).toBeGreaterThan(filledViewport.clientWidth);
    await expect(along(filledTabs[0]!).start).toBeGreaterThanOrEqual(along(filledViewport).start);
    await expect(filledViewport).toHaveAttribute("tabindex", "-1");
    await userEvent.keyboard("{Shift}");
    filledTabs[0]!.focus();
    await ringInside(filledTabs[0]!, filledViewport);
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(filledTabs.at(-1)).toHaveFocus());
    await waitFor(() => expect(inStrip(filledViewport, filledTabs.at(-1)!)).toBe(true));
    await ringInside(filledTabs.at(-1)!, filledViewport);
    await userEvent.keyboard("{Home}");
    await waitFor(() =>
      expect(scrolledFromStart(filledViewport)).toBeLessThanOrEqual(startSlack(filledViewport)),
    );

    for (const width of [720, 390, 280]) {
      const list = canvas.getByRole("tablist", { name: `${width}px record views` });
      const viewport = scrollViewport(list);
      const root = list.closest<HTMLElement>('[data-slot="tabs"]')!;
      await expect(viewport.clientWidth).toBe(root.clientWidth);
      await expect(getComputedStyle(list).borderBottomWidth).toBe("1px");
      await expect(list.getBoundingClientRect().width).toBeGreaterThanOrEqual(viewport.clientWidth);
      const tabs = within(list).getAllByRole("tab");
      const top = tabs[0]!.getBoundingClientRect().top;
      for (const tab of tabs) {
        await expect(tab.getBoundingClientRect().top).toBe(top);
        await expect(tab.getBoundingClientRect().height).toBe(32);
      }
      // The strip scrolls when its tabs need more room than its container gives it, whatever the
      // window: the 720px frame fits on the canvas and scrolls on a phone or in a 320px panel.
      const needed = along(tabs.at(-1)!).end - along(tabs[0]!).start;
      const fits = needed <= viewport.clientWidth + 1;
      if (root.clientWidth >= 720) await expect(fits).toBe(true);
      if (width === 280) await expect(fits).toBe(false);
      if (fits) {
        await expect(viewport.scrollWidth).toBe(viewport.clientWidth);
        await expect(within(root).queryByRole("button", { name: /^Scroll/ })).toBeNull();
      } else if (!hoverable()) {
        // A touch reader swipes: no arrows, and the strip's scrollbar stays under it.
        await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
        await expect(within(root).queryByRole("button", { name: /^Scroll/ })).toBeNull();
      } else {
        await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
        // The Scroller's arrows: the strip's height, its hairline, one per overflowed edge.
        // While they show, the scrollbar and its gutter are gone.
        const forward = await within(root).findByRole("button", { name: "Scroll forward" });
        const scrollbar = root.querySelector<HTMLElement>(
          '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]',
        );
        await waitFor(() => expect(scrollbar).not.toBeVisible());
        await expect(viewport.parentElement!.getBoundingClientRect().height).toBe(
          list.getBoundingClientRect().height,
        );
        await expect(within(root).queryByRole("button", { name: "Scroll back" })).toBeNull();
        await expect(forward.getBoundingClientRect().height).toBe(
          list.getBoundingClientRect().height,
        );
        // Forward sits at the strip's end: the right, or the left in right to left.
        await expect(along(forward).end).toBe(along(viewport).end);
        await userEvent.click(forward);
        await waitFor(() => expect(scrolledFromStart(viewport)).toBeGreaterThan(0));
        const back = await within(root).findByRole("button", { name: "Scroll back" });
        await userEvent.click(back);
        // Back at the start: 0, or within the pixel a right-to-left strip may stop short by.
        await waitFor(() =>
          expect(scrolledFromStart(viewport)).toBeLessThanOrEqual(startSlack(viewport)),
        );
      }
      // A click between two labels lands on the nearer tab: each tab's hit area reaches half way
      // across the gap, and the strip scrolls no further for it.
      const [one, two] = [along(tabs[0]!), along(tabs[1]!)];
      const box = tabs[0]!.getBoundingClientRect();
      const middle = (box.top + box.bottom) / 2;
      // Just past the first tab's end, and just before the second's start, either way it reads:
      // `along` negates a right-to-left line, so its points are negated back to the screen's.
      const x = (at: number) => (isRtl(tabs[0]!) ? -at : at);
      await expect(document.elementFromPoint(x(one.end + 2), middle)).toBe(tabs[0]);
      await expect(document.elementFromPoint(x(two.start - 2), middle)).toBe(tabs[1]);
      await userEvent.keyboard("{Shift}");
      tabs[0]!.focus();
      await ringInside(tabs[0]!, viewport);
      await userEvent.keyboard("{End}");
      const last = tabs.at(-1)!;
      await waitFor(() => expect(last).toHaveFocus());
      await expect(last).toHaveAttribute("aria-selected", "true");
      await waitFor(() => expect(along(last).end).toBeLessThanOrEqual(along(viewport).end + 1));
      await ringInside(last, viewport);
      await userEvent.keyboard("{Home}");
      await waitFor(() =>
        expect(scrolledFromStart(viewport)).toBeLessThanOrEqual(startSlack(viewport)),
      );
    }
  },
};

const phoneViews = [
  "Overview",
  "System",
  "Requirements",
  "Controls",
  "Schedule",
  "Findings",
  "Evidence",
  "Risk",
  "Activity",
];
function LateCounts() {
  const [value, setValue] = useState("Evidence");
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    // Each tab's count comes from its own query, after the strip's first layout.
    const timer = window.setTimeout(
      () => setCounts({ System: 28, Requirements: 546, Controls: 412, Schedule: 12, Findings: 17 }),
      300,
    );
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div style={{ maxWidth: 390 }}>
      <Stack space="space.200">
        <div>
          <Button size="small" onClick={() => setValue("Activity")}>
            Open the activity
          </Button>
        </div>
        <Tabs value={value} onValueChange={setValue}>
          <TabsList variant="line" aria-label="Program views">
            {phoneViews.map((view) => (
              <TabsTrigger key={view} value={view}>
                {view}
                {counts?.[view] !== undefined ? <Count value={counts[view]!} max={999} /> : null}
              </TabsTrigger>
            ))}
          </TabsList>
          {phoneViews.map((view) => (
            <TabsContent key={view} value={view}>
              {view} content
            </TabsContent>
          ))}
        </Tabs>
      </Stack>
    </div>
  );
}

/**
 * A deep link to a tab on a phone: the counts arrive after the strip's first layout and widen the
 * tabs before the selected one, and the selected tab stays in view. A tab chosen from outside the
 * strip, as a record's Overview does, scrolls into view too.
 */
export const LateCountsOnAPhone: Story = {
  render: () => <LateCounts />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("tablist", { name: "Program views" });
    const viewport = scrollViewport(list);
    const evidence = within(list).getByRole("tab", { name: "Evidence" });
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    await waitFor(() => expect(inStrip(viewport, evidence)).toBe(true));
    const before = scrolledFromStart(viewport);
    await expect(before).toBeGreaterThan(0);
    await waitFor(() =>
      expect(within(list).getByRole("tab", { name: /^Controls/ })).toHaveAccessibleName(
        "Controls 412",
      ),
    );
    // The counts widened the tabs before it; the strip followed the selected tab.
    await waitFor(() => expect(scrolledFromStart(viewport)).toBeGreaterThan(before));
    await waitFor(() => expect(inStrip(viewport, evidence)).toBe(true));
    await userEvent.click(canvas.getByRole("button", { name: "Open the activity" }));
    const activity = within(list).getByRole("tab", { name: "Activity" });
    await expect(activity).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(inStrip(viewport, activity)).toBe(true));
    await expect(canvas.getByRole("button", { name: "Open the activity" })).toHaveFocus();
  },
};

/** Shadcn's default and line variants, manual and automatic activation, and overflow. */
export const Variants: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Specimens title="Default · manual activation">
        <Tabs defaultValue={0}>
          <TabsList aria-label="Manual views">
            {views.map((view, i) => (
              <TabsTrigger key={view} value={i} disabled={i === 2}>
                {view}
              </TabsTrigger>
            ))}
          </TabsList>
          {views.map((view, i) => (
            <TabsContent key={view} value={i}>
              {view} content
            </TabsContent>
          ))}
        </Tabs>
      </Specimens>
      <Specimens title="Line · automatic activation · scrolls when narrow">
        <Tabs defaultValue="Controls" className="w-full max-w-[320px]">
          <TabsList variant="line" activateOnFocus aria-label="Record views">
            {views.map((view) => (
              <TabsTrigger key={view} value={view}>
                {view}
                {view === "Controls" ? <Count value={340} max={9999} /> : null}
                {view === "Evidence" ? (
                  <Badge variant="secondary" tone="warning" size="xsmall">
                    Draft
                  </Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
          {views.map((view) => (
            <TabsContent key={view} value={view}>
              {view} content
            </TabsContent>
          ))}
        </Tabs>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const manual = within(canvas.getByRole("tablist", { name: "Manual views" }));
    if (matchMedia("(forced-colors: active)").matches) {
      for (const list of canvas.getAllByRole("tablist")) {
        const indicator = list.querySelector<HTMLElement>('[data-slot="tabs-indicator"]')!;
        const style = getComputedStyle(indicator);
        if (list.dataset["variant"] === "line") {
          await expect(style.backgroundColor).not.toBe(
            getComputedStyle(document.body).backgroundColor,
          );
        } else {
          await expect(style.outlineStyle).toBe("solid");
          await expect(style.outlineColor).not.toBe(style.backgroundColor);
        }
      }
    }
    const overview = manual.getByRole("tab", { name: "Overview" });
    const controls = manual.getByRole("tab", { name: "Controls" });
    overview.focus();
    // The next tab, towards the strip's end: ArrowRight, or ArrowLeft in right to left.
    await userEvent.keyboard(arrows(overview).next);
    await waitFor(() => expect(controls).toHaveFocus());
    await expect(overview).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{Enter}");
    await expect(controls).toHaveAttribute("aria-selected", "true");
    const panel = canvas.getByRole("tabpanel", { name: "Controls" });
    // The panel carries the space under the strip, space.150, as its own top padding; it is
    // measured once the panel's entrance has settled.
    await expect(getComputedStyle(panel).paddingTop).toBe("12px");
    const manualList = canvas.getByRole("tablist", { name: "Manual views" });
    await waitFor(() => expect(spaceUnder(manualList, panel)).toBeCloseTo(12, 0));
    await expect(controls).toHaveAttribute("aria-controls", panel.id);
    await expect(panel).toHaveAttribute("aria-labelledby", controls.id);
    await userEvent.keyboard(arrows(controls).next);
    const disabled = manual.getByRole("tab", { name: "Evidence" });
    await waitFor(() => expect(disabled).toHaveFocus());
    await userEvent.keyboard("{Enter} ");
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    await expect(controls).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{End}");
    await waitFor(() => expect(manual.getByRole("tab", { name: "History" })).toHaveFocus());
    await userEvent.keyboard(arrows(controls).next);
    await waitFor(() => expect(overview).toHaveFocus());
    await userEvent.keyboard(" ");
    await expect(overview).toHaveAttribute("aria-selected", "true");
    const line = canvas.getByRole("tablist", { name: "Record views" });
    // A line strip spaces its panel the same way: space.150 from the strip's edge, including its
    // scrollbar where a touch reader keeps one.
    const linePanel = canvas.getByRole("tabpanel", { name: "Controls 340" });
    await expect(getComputedStyle(linePanel).paddingTop).toBe("12px");
    await waitFor(() => expect(spaceUnder(line, linePanel)).toBeCloseTo(12, 0));
    const viewport = scrollViewport(line);
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    await expect(viewport).toHaveAttribute("tabindex", "-1");
    const lineTabs = within(line);
    const selected = lineTabs.getByRole("tab", { name: "Controls 340" });
    await expect(selected.tagName).toBe("BUTTON");
    await expect(selected.getBoundingClientRect().height).toBe(32);
    const indicator = line.querySelector<HTMLElement>('[data-slot="tabs-indicator"]')!;
    await waitFor(() =>
      expect(indicator.getBoundingClientRect().width).toBeCloseTo(
        selected.getBoundingClientRect().width,
        2,
      ),
    );
    await expect(indicator.getBoundingClientRect().height).toBe(2);
    selected.focus();
    await userEvent.keyboard(arrows(selected).next);
    await waitFor(() =>
      expect(lineTabs.getByRole("tab", { name: "Evidence Draft" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    await userEvent.keyboard("{Home}");
    await waitFor(() =>
      expect(lineTabs.getByRole("tab", { name: "Overview" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    await waitFor(() =>
      expect(along(lineTabs.getByRole("tab", { name: "Overview" })).start).toBeGreaterThanOrEqual(
        along(viewport).start,
      ),
    );
    await userEvent.keyboard("{End}");
    const history = lineTabs.getByRole("tab", { name: "History" });
    await waitFor(() => expect(history).toHaveAttribute("aria-selected", "true"));
    await waitFor(() => expect(along(history).end).toBeLessThanOrEqual(along(viewport).end + 1));
    await userEvent.keyboard("{Home}");
    await waitFor(() =>
      expect(scrolledFromStart(viewport)).toBeLessThanOrEqual(startSlack(viewport)),
    );
  },
};

const rootRef = createRef<HTMLDivElement>();
const listRef = createRef<HTMLDivElement>();
const tabRef = createRef<HTMLButtonElement>();
const panelRef = createRef<HTMLDivElement>();
const rejectedChange = fn();
function Editing() {
  const [value, setValue] = useState<string | null>("Draft");
  return (
    <Stack space="space.200">
      <Tabs
        ref={rootRef}
        value={value}
        onValueChange={(next, details) => {
          if (next === "Locked") {
            rejectedChange(details.reason);
            details.cancel();
          } else setValue(next);
        }}
        render={<section aria-label="Review editor" />}
        className={(state) => (state.orientation === "horizontal" ? "max-w-layout-measure" : "")}
      >
        <TabsList ref={listRef} aria-label="Review views">
          <TabsTrigger
            ref={tabRef}
            value="Draft"
            style={(state) => ({ fontStyle: state.active ? "normal" : "italic" })}
          >
            Draft
          </TabsTrigger>
          <TabsTrigger value="Preview">Preview</TabsTrigger>
          <TabsTrigger value="Locked">Locked</TabsTrigger>
        </TabsList>
        <TabsContent ref={panelRef} value="Draft" keepMounted className="flex" render={<section />}>
          <Input aria-label="Draft title" defaultValue="Assessment" />
        </TabsContent>
        <TabsContent value="Preview">
          <Input aria-label="Preview note" defaultValue="" />
        </TabsContent>
        <TabsContent value="Locked">Restricted review</TabsContent>
      </Tabs>
      <Button onClick={() => setValue(null)}>Clear selection</Button>
      <Text role="status">Selected: {value ?? "none"}</Text>
    </Stack>
  );
}

/** Controlled values, cancellable changes, refs/render, and retained versus unmounted views. */
export const EditingAndMounting: Story = {
  render: () => <Editing />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    rejectedChange.mockClear();
    await expect(rootRef.current).toBe(canvas.getByRole("region", { name: "Review editor" }));
    await expect(listRef.current).toBe(canvas.getByRole("tablist", { name: "Review views" }));
    await expect(tabRef.current).toBe(canvas.getByRole("tab", { name: "Draft" }));
    await expect(panelRef.current?.tagName).toBe("SECTION");
    const draft = canvas.getByRole("textbox", { name: "Draft title" });
    await userEvent.type(draft, " updated");
    await userEvent.click(canvas.getByRole("tab", { name: "Preview" }));
    await waitFor(() => expect(panelRef.current).not.toBeVisible());
    await expect(panelRef.current).toHaveAttribute("hidden");
    await expect(panelRef.current).toHaveAttribute("inert");
    await expect(draft).toBeInTheDocument();
    await userEvent.type(canvas.getByRole("textbox", { name: "Preview note" }), "Temporary");
    await userEvent.click(canvas.getByRole("tab", { name: "Locked" }));
    await expect(rejectedChange).toHaveBeenCalledWith("none");
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: Preview");
    await userEvent.click(canvas.getByRole("tab", { name: "Draft" }));
    await expect(draft).toHaveValue("Assessment updated");
    await expect(canvas.queryByRole("textbox", { name: "Preview note", hidden: true })).toBeNull();
    await userEvent.click(canvas.getByRole("tab", { name: "Preview" }));
    await expect(canvas.getByRole("textbox", { name: "Preview note" })).toHaveValue("");
    await userEvent.click(canvas.getByRole("button", { name: "Clear selection" }));
    await expect(canvas.queryByRole("tabpanel")).toBeNull();
    await expect(canvas.getByRole("status")).toHaveTextContent("Selected: none");
    await userEvent.click(canvas.getByRole("tab", { name: "Draft" }));
  },
};

/** Locale direction and vertical keyboard navigation are supplied to Base UI itself. */
export const Orientation: Story = {
  tags: ["!manifest"],
  render: () => (
    <LedgerProvider direction="rtl">
      <Stack space="space.400">
        <Specimens title="Horizontal · inherited RTL">
          <Tabs defaultValue="Overview" className="w-full max-w-[280px]">
            <TabsList variant="line" activateOnFocus aria-label="RTL views">
              {views.map((view) => (
                <TabsTrigger key={view} value={view}>
                  {view}
                </TabsTrigger>
              ))}
            </TabsList>
            {views.map((view) => (
              <TabsContent key={view} value={view}>
                {view} content
              </TabsContent>
            ))}
          </Tabs>
        </Specimens>
        <Specimens title="Vertical · explicit LTR · no wrapping">
          <Tabs orientation="vertical" dir="ltr" defaultValue="Overview">
            <TabsList variant="line" activateOnFocus loopFocus={false} aria-label="Vertical views">
              {views.map((view) => (
                <TabsTrigger key={view} value={view}>
                  {view}
                </TabsTrigger>
              ))}
            </TabsList>
            {views.map((view) => (
              <TabsContent key={view} value={view}>
                {view} content
              </TabsContent>
            ))}
          </Tabs>
        </Specimens>
      </Stack>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const rtl = within(canvas.getByRole("tablist", { name: "RTL views" }));
    rtl.getByRole("tab", { name: "Overview" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    await waitFor(() =>
      expect(rtl.getByRole("tab", { name: "Controls" })).toHaveAttribute("aria-selected", "true"),
    );
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(rtl.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true"),
    );
    await userEvent.keyboard("{End}");
    const rtlLast = rtl.getByRole("tab", { name: "History" });
    await waitFor(() => expect(rtlLast).toHaveAttribute("aria-selected", "true"));
    const rtlList = canvas.getByRole("tablist", { name: "RTL views" });
    const rtlViewport = scrollViewport(rtlList);
    await waitFor(() =>
      expect(rtlLast.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        rtlViewport.getBoundingClientRect().left - 1,
      ),
    );
    await userEvent.keyboard("{Home}");
    // Chrome clamps this fractional RTL strip at 1, not 0: "at the start" is the first tab in view.
    await waitFor(() => expect(Math.abs(rtlViewport.scrollLeft)).toBeLessThanOrEqual(1));
    await expect(
      rtl.getByRole("tab", { name: "Overview" }).getBoundingClientRect().right,
    ).toBeLessThanOrEqual(rtlViewport.getBoundingClientRect().right + 1);
    const verticalList = canvas.getByRole("tablist", { name: "Vertical views" });
    await expect(verticalList).toHaveAttribute("aria-orientation", "vertical");
    await expect(getComputedStyle(verticalList).flexDirection).toBe("column");
    const vertical = within(verticalList);
    vertical.getByRole("tab", { name: "Overview" }).focus();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(vertical.getByRole("tab", { name: "Controls" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    await userEvent.keyboard("{End}");
    const last = vertical.getByRole("tab", { name: "History" });
    await waitFor(() => expect(last).toHaveFocus());
    await userEvent.keyboard("{ArrowDown}");
    await expect(last).toHaveFocus();
    const indicator = verticalList.querySelector<HTMLElement>('[data-slot="tabs-indicator"]')!;
    await waitFor(() =>
      expect(indicator.getBoundingClientRect().top).toBe(last.getBoundingClientRect().top),
    );
    await expect(indicator.getBoundingClientRect().width).toBe(2);
    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(vertical.getByRole("tab", { name: "Evidence" })).toHaveFocus());
  },
};

function Linked() {
  const [value, setValue] = useState("Overview");
  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabsList variant="line" aria-label="Linked views">
        {views.map((view) => (
          <TabsTrigger
            key={view}
            value={view}
            nativeButton={false}
            render={<a href={`#${view.toLowerCase()}`} />}
          >
            {view}
          </TabsTrigger>
        ))}
      </TabsList>
      {views.map((view) => (
        <TabsContent key={view} value={view}>
          {view} content
        </TabsContent>
      ))}
    </Tabs>
  );
}

/** A router Link or anchor keeps its href while participating in the tab pattern. */
export const Links: Story = {
  render: () => <Linked />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const controls = canvas.getByRole("tab", { name: "Controls" });
    await expect(controls.tagName).toBe("A");
    await expect(controls).toHaveAttribute("href", "#controls");
    await expect(controls).not.toHaveAttribute("type");
    // Observe whether Base UI allows native navigation; suppress only the test's browser action.
    const prevented: boolean[] = [];
    const intercept = (event: MouseEvent) => {
      prevented.push(event.defaultPrevented);
      event.preventDefault();
    };
    canvasElement.ownerDocument.addEventListener("click", intercept);
    try {
      await userEvent.click(controls);
      await expect(controls).toHaveAttribute("aria-selected", "true");
      await fireEvent.click(controls, { ctrlKey: true });
      await fireEvent.click(controls, { metaKey: true });
      await userEvent.keyboard(arrows(controls).next);
      const evidence = canvas.getByRole("tab", { name: "Evidence" });
      await waitFor(() => expect(evidence).toHaveFocus());
      await expect(controls).toHaveAttribute("aria-selected", "true");
      await userEvent.keyboard("{Enter}");
      await expect(evidence).toHaveAttribute("aria-selected", "true");
      await expect(prevented).toEqual([false, false, false, false]);
    } finally {
      canvasElement.ownerDocument.removeEventListener("click", intercept);
    }
  },
};

const motionViews = ["Summary", "Control implementations", "Evidence"];
function MotionExample({
  label,
  variant,
  orientation = "horizontal",
  dir = "ltr",
  reused = false,
}: {
  label: string;
  variant: "default" | "line";
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  reused?: boolean;
}) {
  const [value, setValue] = useState("Summary");
  return (
    <Tabs value={value} onValueChange={setValue} orientation={orientation} dir={dir}>
      <TabsList variant={variant} aria-label={label}>
        {motionViews.map((view) => (
          <TabsTrigger key={view} value={view}>
            {view}
          </TabsTrigger>
        ))}
      </TabsList>
      {reused ? (
        <TabsContent value={value}>
          <Input aria-label={`${label} note`} defaultValue="Retained note" />
          <Text>{value} content</Text>
        </TabsContent>
      ) : (
        motionViews.map((view) => (
          <TabsContent key={view} value={view} keepMounted>
            <Text>{view} content</Text>
          </TabsContent>
        ))
      )}
    </Tabs>
  );
}

/** Sample rendered frames: a measured indicator moves between tabs and the arriving view rises. */
export const Motion: Story = {
  render: () => (
    <Stack space="space.300">
      <MotionExample label="Filled motion" variant="default" />
      <MotionExample label="RTL line motion" variant="line" dir="rtl" />
      <MotionExample label="Vertical motion" variant="line" orientation="vertical" />
      <MotionExample label="Reused panel motion" variant="line" reused />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const label of [
      "Filled motion",
      "RTL line motion",
      "Vertical motion",
      "Reused panel motion",
    ]) {
      const list = canvas.getByRole("tablist", { name: label });
      const root = list.closest<HTMLElement>('[data-slot="tabs"]')!;
      const tabs = within(list);
      const from = tabs.getByRole("tab", { name: "Summary" });
      const target = tabs.getByRole("tab", { name: "Control implementations" });
      const indicator = list.querySelector<HTMLElement>('[data-slot="tabs-indicator"]')!;
      const vertical = label === "Vertical motion";
      const coordinate = (element: Element) =>
        element.getBoundingClientRect()[vertical ? "y" : "x"];
      await waitFor(() =>
        expect(Math.abs(coordinate(indicator) - coordinate(from))).toBeLessThan(1),
      );
      const start = coordinate(indicator);
      const end = coordinate(target);
      const retained =
        label === "Reused panel motion"
          ? canvas.getByRole("textbox", { name: `${label} note` })
          : null;
      if (retained) await userEvent.type(retained, " edited");
      const samples: { position: number; opacity: number; rise: number }[] = [];
      const frames = new Promise<void>((resolve) => {
        const began = performance.now();
        const sample = () => {
          if (target.getAttribute("aria-selected") === "true") {
            const panel = root.querySelector<HTMLElement>(
              '[data-slot="tabs-content"]:not([hidden]):not([data-ending-style])',
            )!;
            const style = getComputedStyle(panel);
            samples.push({
              position: coordinate(indicator),
              opacity: Number(style.opacity),
              rise: new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform)
                .m42,
            });
          }
          if (performance.now() - began < 400) requestAnimationFrame(sample);
          else resolve();
        };
        requestAnimationFrame(sample);
      });
      await fireEvent.click(target);
      await frames;
      const between = samples.some(
        ({ position }) =>
          position > Math.min(start, end) + 1 && position < Math.max(start, end) - 1,
      );
      const entering = samples.some(
        ({ opacity, rise }) => opacity > 0.65 && opacity < 0.99 && rise > 0 && rise < 4,
      );
      await expect(samples.length).toBeGreaterThan(1);
      await expect(between).toBe(!reduced);
      await expect(entering).toBe(!reduced);
      await expect(Math.abs(coordinate(indicator) - end)).toBeLessThan(1);
      if (reduced) {
        await expect(samples.every(({ opacity, rise }) => opacity === 1 && rise === 0)).toBe(true);
      }
      if (retained) {
        await expect(canvas.getByRole("textbox", { name: `${label} note` })).toBe(retained);
        await expect(retained).toHaveValue("Retained note edited");
      }
      await expect(within(root).getAllByRole("tabpanel")).toHaveLength(1);
    }
  },
};

/**
 * A line strip whose container widens while the selected tab changes, as a record's Details rail
 * leaves with its Overview. The indicator slides once and arrives in its motion duration: its
 * position and width round to the layout unit, so a resize that leaves the tabs where they were
 * does not restart the slide. Under reduced motion it moves at once.
 */
export const ResizeDuringChange: Story = {
  name: "Resize during a change",
  render: () => (
    <Tabs defaultValue="Overview" style={{ width: "70%" }}>
      <TabsList variant="line" aria-label="Resizing views">
        {views.map((view) => (
          <TabsTrigger key={view} value={view}>
            {view}
          </TabsTrigger>
        ))}
      </TabsList>
      {views.map((view) => (
        <TabsContent key={view} value={view}>
          <Text>{view} content</Text>
        </TabsContent>
      ))}
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const list = canvas.getByRole("tablist", { name: "Resizing views" });
    const root = list.closest<HTMLElement>('[data-slot="tabs"]')!;
    const indicator = list.querySelector<HTMLElement>('[data-slot="tabs-indicator"]')!;
    const target = within(list).getByRole("tab", { name: "History" });
    /** How far the indicator is from covering a tab: the larger of its offset and its width's. */
    const away = (tab: HTMLElement) => {
      const line = indicator.getBoundingClientRect();
      const box = tab.getBoundingClientRect();
      return Math.max(Math.abs(line.left - box.left), Math.abs(line.width - box.width));
    };
    // Measured in the face the reader sees: a label that reflows when the font arrives moves the
    // tab, and the indicator with it, which is a second slide the resize did not cause. Laying the
    // labels out first starts the loads that `ready` waits for.
    void list.offsetWidth;
    await document.fonts.ready;
    await waitFor(() =>
      expect(away(within(list).getByRole("tab", { name: "Overview" }))).toBeLessThan(0.5),
    );
    // The slide's duration is motion.duration.moderate, and nothing under reduced motion.
    const moderate = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--ds-motion-duration-moderate"),
    );
    const duration = parseFloat(getComputedStyle(indicator).transitionDuration) * 1000;
    await expect(duration).toBe(reduced ? 0 : moderate);
    // Every slide that starts, a restarted one included.
    let slides = 0;
    const counted = (event: TransitionEvent) => {
      if (event.propertyName === "transform") slides += 1;
    };
    indicator.addEventListener("transitionrun", counted);
    try {
      const run = await new Promise<{ began: number; arrived: number | null; frame: number }>(
        (resolve) => {
          let began: number | null = null;
          let arrived: number | null = null;
          let last = 0;
          let frame = 0;
          let step = 0;
          const tick = (now: number) => {
            began ??= now;
            if (now > began) frame = Math.max(frame, now - last);
            last = now;
            if (arrived === null && away(target) < 0.5) arrived = now;
            // An uneven step every frame for as long as the slide lasts, so each frame lands the
            // strip's measurements on a new fraction of a pixel.
            const resizing = now - began < Math.max(moderate, 200);
            root.style.width = resizing ? `${Math.min(99.9, 70 + ++step * 0.37)}%` : "100%";
            if (now - began < 3 * moderate) requestAnimationFrame(tick);
            else resolve({ began, arrived, frame });
          };
          fireEvent.click(target);
          requestAnimationFrame(tick);
        },
      );
      await expect(target).toHaveAttribute("aria-selected", "true");
      await expect(run.arrived).not.toBeNull();
      if (reduced) {
        await expect(slides).toBe(0);
        await expect(run.arrived).toBe(run.began);
      } else {
        await expect(slides).toBe(1);
        // The slide may start on the frame after the click, when the new position is written, and
        // is seen on the first frame after it ends: within its duration and two frames, where a
        // slide restarted by the resize takes about twice its duration.
        await expect(run.arrived! - run.began).toBeLessThanOrEqual(duration + 2 * run.frame);
      }
      await expect(away(target)).toBeLessThan(0.5);
    } finally {
      indicator.removeEventListener("transitionrun", counted);
      root.style.width = "70%";
    }
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stack space="space.150">
            <ToggleGroup aria-label="Show findings" defaultValue={["open"]} variant="outline">
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="open">Open</ToggleGroupItem>
              <ToggleGroupItem value="closed">Closed</ToggleGroupItem>
            </ToggleGroup>
            <Text size="small">The open findings.</Text>
          </Stack>
        }
        doText="A ToggleGroup, or a filter in the toolbar, narrows the rows the reader is already in."
        dont={
          <Tabs defaultValue="open">
            <TabsList variant="line" aria-label="Findings by status">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
            {["all", "open", "closed"].map((value) => (
              <TabsContent key={value} value={value}>
                <Text size="small">The same findings list.</Text>
              </TabsContent>
            ))}
          </Tabs>
        }
        dontText="Tabs that only narrow one list: each reads as a view of its own, and the filter sits apart from the list's other filters."
      />
      <Pair
        do={
          <Tabs defaultValue="controls">
            <TabsList variant="line" aria-label="Record views">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="controls">
                Controls <Count value={340} max={9999} />
              </TabsTrigger>
              <TabsTrigger value="evidence">
                Evidence <Count value={0} max={9999} />
              </TabsTrigger>
            </TabsList>
            {["overview", "controls", "evidence"].map((value) => (
              <TabsContent key={value} value={value}>
                <Text size="small">The {value} view.</Text>
              </TabsContent>
            ))}
          </Tabs>
        }
        doText="Nouns that name each view, Overview first, and a Count with the product's one cap, 0 included once the rows load."
        dont={
          <Tabs defaultValue="controls">
            <TabsList variant="line" aria-label="Record views, worded as actions">
              <TabsTrigger value="overview">Summary tab</TabsTrigger>
              <TabsTrigger value="controls">View controls (340)</TabsTrigger>
              <TabsTrigger value="evidence">See evidence</TabsTrigger>
            </TabsList>
            {["overview", "controls", "evidence"].map((value) => (
              <TabsContent key={value} value={value}>
                <Text size="small">The {value} view.</Text>
              </TabsContent>
            ))}
          </Tabs>
        }
        dontText="Verbs and the word tab read as buttons, and a count typed into the words has no cap and reads differently on every strip."
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Show findings" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "Controls 340" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(canvas.getByRole("tab", { name: "Evidence 0" })).toBeVisible();
  },
};
