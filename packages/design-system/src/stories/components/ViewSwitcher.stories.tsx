import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { LinkButton, ViewSwitcher, ViewSwitcherItem } from "../../components";
import { Inline } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair, halves } = pairLayout;

const meta = {
  title: "Components/ViewSwitcher",
  component: ViewSwitcher,
  subcomponents: { ViewSwitcherItem },
  parameters: { layout: "padded" },
  args: { label: "Controls views", children: null },
} satisfies Meta<typeof ViewSwitcher>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The links of a view switcher, in the order they render. */
const linksIn = (root: HTMLElement) =>
  [
    ...root.querySelectorAll<HTMLAnchorElement>('[data-slot="view-switcher-link"]'),
  ] as HTMLAnchorElement[];

/**
 * A tab's views as one named row of links, under the tab strip: each view is a page of its own.
 * The tab shows none of them, so none is current.
 */
export const Playground: Story = {
  render: (args) => (
    <ViewSwitcher {...args}>
      <ViewSwitcher.Item href="#control-status">Control status</ViewSwitcher.Item>
      <ViewSwitcher.Item href="#control-baseline">Control baseline</ViewSwitcher.Item>
      <ViewSwitcher.Item href="#cyber-resiliency">Cyber resiliency</ViewSwitcher.Item>
      <ViewSwitcher.Item href="#inheritance">Inheritance resolution</ViewSwitcher.Item>
    </ViewSwitcher>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A navigation landmark named by its label, holding a list of the views' links.
    const nav = canvas.getByRole("navigation", { name: "Controls views" });
    await expect(nav).toHaveAttribute("data-slot", "view-switcher");
    const links = within(nav).getAllByRole("link");
    await expect(links.map((link) => link.textContent)).toEqual([
      "Control status",
      "Control baseline",
      "Cyber resiliency",
      "Inheritance resolution",
    ]);
    await expect(within(nav).getAllByRole("listitem")).toHaveLength(4);
    // Links, never buttons: a button here is the strip's scroll arrow, where the row overflows,
    // outside the tab order. On the tab none of the views is the current page.
    for (const button of within(nav).queryAllByRole("button"))
      await expect(button).toHaveAttribute("tabindex", "-1");
    for (const link of links) await expect(link).not.toHaveAttribute("aria-current");
    // Tab reaches each view in the order it is read, and leaves the row after the last.
    for (const link of links) {
      await userEvent.tab();
      await expect(link).toHaveFocus();
    }
    await userEvent.tab();
    await expect(nav.contains(document.activeElement)).toBe(false);
  },
};

/**
 * On a view's own page the row marks that view current: `isActive` sets `aria-current="page"`, so
 * a screen reader says which view is open, and draws the current place's fill with an ink edge.
 * The current view stays a link in the row's order.
 */
export const OnAViewsPage: Story = {
  name: "On a view's page",
  render: (args) => (
    <ViewSwitcher {...args}>
      <ViewSwitcher.Item href="#control-status">Control status</ViewSwitcher.Item>
      <ViewSwitcher.Item href="#control-baseline" isActive>
        Control baseline
      </ViewSwitcher.Item>
      <ViewSwitcher.Item href="#cyber-resiliency">Cyber resiliency</ViewSwitcher.Item>
    </ViewSwitcher>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Controls views" });
    const current = within(nav).getByRole("link", { name: "Control baseline" });
    await expect(current).toHaveAttribute("aria-current", "page");
    // Exactly one view is current.
    await expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    const other = within(nav).getByRole("link", { name: "Control status" });
    // The current view is told by its fill and by an edge that is not a fill.
    await expect(getComputedStyle(current).backgroundColor).not.toBe(
      getComputedStyle(other).backgroundColor,
    );
    const edge = (link: HTMLElement) => getComputedStyle(link, "::after");
    await expect(edge(current).borderTopStyle).toBe("solid");
    await expect(parseFloat(edge(current).borderTopWidth)).toBeGreaterThan(0);
    await expect(parseFloat(edge(other).borderTopWidth) || 0).toBe(0);
    // It keeps the size of the others: the edge is drawn over it, not around it.
    await expect(current.getBoundingClientRect().height).toBe(other.getBoundingClientRect().height);
    // Still a link, reached by Tab in its place.
    await userEvent.tab();
    await expect(other).toHaveFocus();
    await userEvent.tab();
    await expect(current).toHaveFocus();
  },
};

/**
 * On a phone a row wider than the frame scrolls in its own strip: it never wraps and never widens
 * the page, and the current view, last here, is scrolled into view as the page opens. The keyboard
 * reveals each link it reaches.
 */
export const OnAPhone: Story = {
  name: "On a phone",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: (args) => (
    <ViewSwitcher {...args}>
      <ViewSwitcher.Item href="#control-status">Control status</ViewSwitcher.Item>
      <ViewSwitcher.Item href="#control-baseline">Control baseline</ViewSwitcher.Item>
      <ViewSwitcher.Item href="#cyber-resiliency">Cyber resiliency</ViewSwitcher.Item>
      <ViewSwitcher.Item href="#product-delta">Product delta</ViewSwitcher.Item>
      <ViewSwitcher.Item href="#inheritance" isActive>
        Inheritance resolution
      </ViewSwitcher.Item>
    </ViewSwitcher>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const page = document.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
    const links = linksIn(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="scroller-viewport"]')!;
    // One row: every link on the first link's line, the strip scrolling instead.
    const top = Math.round(links[0]!.getBoundingClientRect().top);
    for (const link of links) await expect(Math.round(link.getBoundingClientRect().top)).toBe(top);
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    // The current view is in view.
    const inView = (element: HTMLElement) => {
      const frame = viewport.getBoundingClientRect();
      const box = element.getBoundingClientRect();
      return box.left >= frame.left - 1 && box.right <= frame.right + 1;
    };
    await waitFor(() => expect(inView(links.at(-1)!)).toBe(true));
    // Tab from the start reaches the first view and brings it back into view.
    await userEvent.tab();
    await expect(links[0]).toHaveFocus();
    await waitFor(() => expect(inView(links[0]!)).toBe(true));
  },
};

/**
 * A router's link renders each view through `render`, keeping the router's navigation and the
 * row's look. A router link that marks itself current when its address matches is drawn current
 * too, without `isActive`: here the stand-in sets `aria-current` for the address it is told is
 * shown.
 */
export const RouterLinks: Story = {
  name: "Router links",
  render: (args) => {
    const shown = "/programs/ws-x90/posture";
    // A stand-in for a router's Link: an anchor that sets aria-current where it matches.
    const Link = ({ to, ...props }: ComponentProps<"a"> & { to: string }) => (
      <a {...props} href={to} {...(to === shown ? { "aria-current": "page" as const } : {})} />
    );
    return (
      <ViewSwitcher {...args}>
        <ViewSwitcher.Item render={<Link to="/programs/ws-x90/posture" />}>
          Posture
        </ViewSwitcher.Item>
        <ViewSwitcher.Item render={<Link to="/programs/ws-x90/workbook" />}>
          Workbook
        </ViewSwitcher.Item>
        <ViewSwitcher.Item render={<Link to="/programs/ws-x90/sctm" />}>
          Traceability matrix
        </ViewSwitcher.Item>
      </ViewSwitcher>
    );
  },
  args: { label: "Requirements views" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Requirements views" });
    const posture = within(nav).getByRole("link", { name: "Posture" });
    await expect(posture).toHaveAttribute("href", "/programs/ws-x90/posture");
    await expect(posture).toHaveAttribute("aria-current", "page");
    await expect(posture).toHaveAttribute("data-slot", "view-switcher-link");
    const workbook = within(nav).getByRole("link", { name: "Workbook" });
    await expect(workbook).not.toHaveAttribute("aria-current");
    await expect(getComputedStyle(posture).backgroundColor).not.toBe(
      getComputedStyle(workbook).backgroundColor,
    );
  },
};

/** Views are pages, so the row is links in a named navigation with the current one marked, never a row of buttons that look like actions. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <ViewSwitcher label="Controls views">
          <ViewSwitcher.Item href="#control-status" isActive>
            Control status
          </ViewSwitcher.Item>
          <ViewSwitcher.Item href="#control-baseline">Control baseline</ViewSwitcher.Item>
        </ViewSwitcher>
      }
      doText="A named row of links, the open view marked current. It reads as where you are, not as something to do."
      dont={
        <Inline space="space.100">
          <LinkButton size="small" href="#control-status">
            Control status
          </LinkButton>
          <LinkButton size="small" href="#control-baseline">
            Control baseline
          </LinkButton>
        </Inline>
      }
      dontText="Secondary buttons for the views. They read as actions, the row has no name, and nothing says which view is open."
    />
  ),
  play: async ({ canvasElement }) => {
    const { do: good, dont: bad } = halves(canvasElement);
    // The Do is a named navigation with its open view marked; the Don't is neither.
    await expect(within(good).getByRole("navigation", { name: "Controls views" })).toBeVisible();
    await expect(within(good).getByRole("link", { name: "Control status" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(within(bad).queryByRole("navigation")).toBeNull();
    await expect(bad.querySelector("[aria-current]")).toBeNull();
  },
};
