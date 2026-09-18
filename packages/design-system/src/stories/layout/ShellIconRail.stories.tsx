import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bug, ClipboardList, Library, ShieldCheck } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  Avatar,
  AvatarFallback,
  Input,
  LedgerProvider,
  PageHeader,
  Shell,
  shellScriptFor,
} from "../..";

const meta = {
  title: "Layout/Shell/Icon rail",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

function IconRailDemo({
  collapsed = true,
  direction = "ltr",
}: {
  collapsed?: boolean;
  direction?: "ltr" | "rtl";
}) {
  return (
    <LedgerProvider direction={direction}>
      <Shell collapsedSideNav="icons" defaultSideNavCollapsed={collapsed} sideNavShortcut>
        <Shell.TopNav>
          <Shell.TopNav.Start>
            <Shell.SideNav.ToggleButton />
            <Shell.AppLogo name="Equinox" render={<a href="#home" />} />
          </Shell.TopNav.Start>
        </Shell.TopNav>
        <Shell.SideNav defaultWidth={320}>
          <Shell.SideNav.Header>
            <Input aria-label="Search navigation" placeholder="Search navigation" />
          </Shell.SideNav.Header>
          <Shell.SideNav.Body>
            <Shell.SideNav.Section heading="Work">
              <Shell.SideNav.Item icon={ShieldCheck} render={<a href="#queue" />}>
                My queue
              </Shell.SideNav.Item>
              <Shell.SideNav.Item icon={ClipboardList} isActive render={<a href="#programs" />}>
                Programs
              </Shell.SideNav.Item>
              <Shell.SideNav.Expandable icon={Bug} label="Findings and assets" defaultOpen>
                <Shell.SideNav.Item render={<a href="#findings" />}>Findings</Shell.SideNav.Item>
                <Shell.SideNav.Item render={<a href="#assets" />}>Assets</Shell.SideNav.Item>
              </Shell.SideNav.Expandable>
            </Shell.SideNav.Section>
            <Shell.SideNav.Section heading="Libraries">
              <Shell.SideNav.Item icon={Library} render={<a href="#controls" />}>
                Control catalog
              </Shell.SideNav.Item>
            </Shell.SideNav.Section>
          </Shell.SideNav.Body>
          <Shell.SideNav.Footer>
            <Shell.Profile
              avatar={
                <Avatar size="small" aria-hidden>
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
              }
              name="Sarah Chen"
              description="Compliance lead"
              onClick={() => undefined}
            />
          </Shell.SideNav.Footer>
          <Shell.SideNav.Splitter />
        </Shell.SideNav>
        <Shell.Main>
          <PageHeader>
            <PageHeader.Title>Programs</PageHeader.Title>
            <PageHeader.Description>
              Active programs and their next assurance milestones.
            </PageHeader.Description>
          </PageHeader>
        </Shell.Main>
      </Shell>
    </LedgerProvider>
  );
}

async function checkTooltip(doc: Document, label: string) {
  await waitFor(() => {
    const popup = doc.querySelector('[data-slot="tooltip-content"][data-open]');
    expect(popup).toBeVisible();
    expect(popup).toHaveTextContent(label);
  });
}

async function nativeHover(target: HTMLElement) {
  // CSS :hover needs a real pointer in browser tests; normal Storybook still runs its events.
  if (import.meta.env.MODE === "test" && "__vitest_browser__" in globalThis) {
    const browser = await import("vitest/browser");
    await browser.page.elementLocator(target).hover();
    return true;
  }
  await userEvent.hover(target);
  return false;
}

function identityParts(canvasElement: HTMLElement) {
  const logo = within(canvasElement).getByRole("link", { name: "Equinox" });
  return {
    mark: logo.querySelector<HTMLElement>('[data-slot="shell-mark"]')!,
    title: within(logo).getByText("Equinox"),
    start: logo.closest<HTMLElement>('[data-slot="shell-topnav-start"]')!,
  };
}

async function checkMarkOverlay(toggle: HTMLElement, mark: HTMLElement) {
  await expect(getComputedStyle(toggle).position).toBe("absolute");
  const buttonBox = toggle.getBoundingClientRect();
  const markBox = mark.getBoundingClientRect();
  await expect(buttonBox.width).toBe(24);
  await expect(buttonBox.height).toBe(24);
  await expect(Math.abs(buttonBox.x - markBox.x)).toBeLessThanOrEqual(0.5);
  await expect(Math.abs(buttonBox.y - markBox.y)).toBeLessThanOrEqual(0.5);
}

async function checkMarkVisibility(
  toggle: HTMLElement,
  mark: HTMLElement,
  expandedControl: boolean,
) {
  await waitFor(() => {
    expect(getComputedStyle(toggle).opacity).toBe(expandedControl ? "1" : "0");
    expect(getComputedStyle(mark).opacity).toBe(expandedControl ? "0" : "1");
  });
}

async function checkDesktop(canvasElement: HTMLElement, direction: "ltr" | "rtl") {
  const canvas = within(canvasElement);
  const nav = canvas.getByRole("navigation", { name: "Side navigation" });
  const main = canvas.getByRole("main");
  const toggle = canvas.getByRole("button", { name: "Expand side navigation" });
  const programs = within(nav).getByRole("link", { name: "Programs" });
  const { mark, title, start } = identityParts(canvasElement);
  await nativeHover(main);
  await expect(start).toHaveAttribute("data-collapsed", "icons");
  await checkMarkOverlay(toggle, mark);
  await checkMarkVisibility(toggle, mark, false);
  const collapsedMarkBox = mark.getBoundingClientRect();
  const collapsedTitleBox = title.getBoundingClientRect();
  await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(56));
  await expect(nav).toHaveAttribute("data-collapsed", "icons");
  await expect(programs).toHaveAttribute("aria-current", "page");
  await expect(programs.querySelector("svg")).toBeVisible();
  await expect(within(nav).getByText("Programs").getBoundingClientRect().width).toBeLessThanOrEqual(
    1,
  );
  await expect(within(nav).getByText("Work").getBoundingClientRect().width).toBeLessThanOrEqual(1);
  await expect(within(nav).queryByRole("link", { name: /^Findings$/ })).toBeNull();
  await expect(canvas.queryByRole("separator", { name: "Resize side navigation" })).toBeNull();
  await expect(canvas.queryByRole("textbox", { name: "Search navigation" })).toBeNull();
  if (direction === "ltr") {
    await expect(main.getBoundingClientRect().left).toBe(nav.getBoundingClientRect().right);
  } else {
    await expect(main.getBoundingClientRect().right).toBe(nav.getBoundingClientRect().left);
  }

  programs.focus();
  await expect(programs).toHaveFocus();
  await checkTooltip(canvasElement.ownerDocument, "Programs");
  const profile = within(nav).getByRole("button", { name: /Sarah Chen/ });
  profile.focus();
  await expect(profile).toHaveFocus();
  await expect(within(profile).getByText("SC")).toBeVisible();
  await checkTooltip(canvasElement.ownerDocument, "Sarah Chen");

  // Hovering the toggle retains the rail and never creates the legacy desktop flyout.
  const movedPointer = await nativeHover(toggle);
  if (movedPointer) await checkMarkVisibility(toggle, mark, true);
  await checkTooltip(canvasElement.ownerDocument, "Expand side navigation");
  await expect(nav.getBoundingClientRect().width).toBe(56);
  await expect(getComputedStyle(nav).position).toBe("sticky");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await nativeHover(main);
  await userEvent.unhover(toggle);
  await checkMarkVisibility(toggle, mark, false);

  // The overlapping expand control remains reachable by keyboard and replaces the mark on focus.
  await userEvent.keyboard("{Tab}");
  toggle.focus();
  await expect(toggle).toHaveFocus();
  await checkMarkVisibility(toggle, mark, true);
  await checkMarkOverlay(toggle, mark);

  // Activating an already-open group from the rail expands the shell and exposes its children.
  const group = within(nav).getByRole("button", { name: "Findings and assets" });
  group.focus();
  await userEvent.keyboard("{Enter}");
  await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(320));
  await expect(mark.getBoundingClientRect().x).toBe(collapsedMarkBox.x);
  await expect(mark.getBoundingClientRect().y).toBe(collapsedMarkBox.y);
  await expect(title.getBoundingClientRect().x).toBe(collapsedTitleBox.x);
  await expect(title.getBoundingClientRect().y).toBe(collapsedTitleBox.y);
  await expect(getComputedStyle(toggle).position).not.toBe("absolute");
  await expect(mark).toBeVisible();
  await expect(group).toHaveAttribute("aria-expanded", "true");
  await expect(within(nav).getByRole("link", { name: /^Findings$/ })).toBeVisible();
  await expect(within(nav).getByText("Work")).toBeVisible();
  await expect(canvas.getByRole("textbox", { name: "Search navigation" })).toBeVisible();

  // A resized width belongs to the expanded state; collapse and expand preserve it.
  const splitter = canvas.getByRole("separator", { name: "Resize side navigation" });
  splitter.focus();
  await userEvent.keyboard("{Home}");
  await waitFor(() => expect(splitter).toHaveAttribute("aria-valuenow", "200"));
  await userEvent.keyboard(direction === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
  await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(216));
  const edge = splitter.getBoundingClientRect();
  const pointerStart = { clientX: edge.x + edge.width / 2, clientY: edge.y + 100 };
  const pointerEnd = {
    ...pointerStart,
    clientX: pointerStart.clientX + (direction === "rtl" ? -32 : 32),
  };
  await userEvent.pointer([
    { target: splitter, keys: "[MouseLeft>]", coords: pointerStart },
    { target: splitter, coords: pointerEnd },
    { target: splitter, keys: "[/MouseLeft]", coords: pointerEnd },
  ]);
  await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(248));
  splitter.focus();
  await userEvent.keyboard(direction === "rtl" ? "{ArrowRight}" : "{ArrowLeft}");
  await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(232));
  await userEvent.keyboard("{Home}");
  await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(200));
  const collapse = canvas.getByRole("button", { name: "Collapse side navigation" });
  collapse.focus();
  await userEvent.keyboard("{Enter}");
  await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(56));
  await expect(canvas.queryByRole("separator", { name: "Resize side navigation" })).toBeNull();
  await userEvent.keyboard("{Enter}");
  await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(200));

  // Collapsing from a nested destination must leave keyboard focus on an available control.
  within(nav)
    .getByRole("link", { name: /^Findings$/ })
    .focus();
  await userEvent.keyboard("{Control>}[[{/Control}");
  await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(56));
  await expect(canvas.getByRole("button", { name: "Expand side navigation" })).toHaveFocus();
}

export const Desktop: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <IconRailDemo />,
  play: ({ canvasElement }) => checkDesktop(canvasElement, "ltr"),
};

export const RightToLeft: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <IconRailDemo direction="rtl" />,
  play: ({ canvasElement }) => checkDesktop(canvasElement, "rtl"),
};

/** Sample the rendered sidebar through each transition, including reduced-motion endpoints. */
export const WidthMotion: Story = {
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <IconRailDemo collapsed={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Side navigation" });
    const { mark } = identityParts(canvasElement);
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(320));
    const markStart = mark.getBoundingClientRect().x;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const [label, target] of [
      ["Collapse side navigation", 56],
      ["Expand side navigation", 320],
    ] as const) {
      await userEvent.click(canvas.getByRole("button", { name: label }));
      const widths: number[] = [];
      const start = performance.now();
      while (performance.now() - start < 350) {
        await new Promise(requestAnimationFrame);
        widths.push(nav.getBoundingClientRect().width);
        await expect(Math.abs(mark.getBoundingClientRect().x - markStart)).toBeLessThan(0.5);
      }
      await expect(nav.getBoundingClientRect().width).toBe(target);
      const intermediate = widths.some((width) => width > 56.5 && width < 319.5);
      await expect(intermediate).toBe(!reduced);
    }
  },
};

export const Mobile390: Story = {
  name: "Mobile at 390px",
  parameters: {
    viewport: {
      options: {
        iconRailPhone: { name: "Phone (390px)", styles: { width: "390px", height: "844px" } },
      },
    },
  },
  globals: { viewport: { value: "iconRailPhone", isRotated: false } },
  render: () => <IconRailDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const main = canvas.getByRole("main");
    const toggle = canvas.getByRole("button", { name: "Expand side navigation" });
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const { mark } = identityParts(canvasElement);
    await expect(toggle).toBeVisible();
    await expect(mark).toBeVisible();
    await expect(getComputedStyle(toggle).position).not.toBe("absolute");
    await expect(toggle.getBoundingClientRect().right).toBeLessThanOrEqual(
      mark.getBoundingClientRect().left,
    );
    await expect(canvas.queryByRole("navigation", { name: "Side navigation" })).toBeNull();
    const width = main.getBoundingClientRect().width;
    await expect(width).toBe(390);
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    const nav = await canvas.findByRole("navigation", { name: "Side navigation" });
    await waitFor(() => expect(getComputedStyle(nav).position).toBe("fixed"));
    await waitFor(() => expect(nav.getBoundingClientRect().left).toBe(0));
    await expect(nav.getBoundingClientRect().width).toBe(320);
    await expect(nav).not.toHaveAttribute("data-collapsed", "icons");
    await expect(within(nav).getByText("Work")).toBeVisible();
    await expect(within(nav).getByRole("link", { name: /^Findings$/ })).toBeVisible();
    await expect(main.getBoundingClientRect().width).toBe(width);
    await expect(canvas.queryByRole("separator", { name: "Resize side navigation" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(canvas.queryByRole("navigation", { name: "Side navigation" })).toBeNull(),
    );
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(canvas.getByRole("button", { name: "Close side navigation" }));
    await waitFor(() =>
      expect(canvas.queryByRole("navigation", { name: "Side navigation" })).toBeNull(),
    );
    await expect(toggle).toHaveFocus();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  },
};

/** The head script must reserve the icon rail even while server markup is still expanded. */
export const BeforeHydration: Story = {
  name: "Persisted first paint",
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <IconRailDemo collapsed={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Side navigation" });
    const doc = canvasElement.ownerDocument;
    const root = doc.documentElement;
    const key = "ledger.shell.icon-rail-first-paint";
    const previousAttribute = root.getAttribute("data-shell-sidenav");
    const previousWidth = root.style.getPropertyValue("--shell-sidenav-stored");
    const previousValue = localStorage.getItem(key);
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(320));
    const { mark, title } = identityParts(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Collapse side navigation" });
    const expandedMarkBox = mark.getBoundingClientRect();
    const expandedTitleBox = title.getBoundingClientRect();
    try {
      localStorage.setItem(key, JSON.stringify({ collapsed: true, sideNavWidth: 320 }));
      const script = doc.createElement("script");
      script.textContent = shellScriptFor(key);
      doc.head.appendChild(script);
      script.remove();
      await expect(root).toHaveAttribute("data-shell-sidenav", "collapsed");
      await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(56));
      await nativeHover(canvas.getByRole("main"));
      await checkMarkOverlay(toggle, mark);
      await checkMarkVisibility(toggle, mark, false);
      await expect(mark.getBoundingClientRect().x).toBe(expandedMarkBox.x);
      await expect(mark.getBoundingClientRect().y).toBe(expandedMarkBox.y);
      await expect(title.getBoundingClientRect().x).toBe(expandedTitleBox.x);
      await expect(title.getBoundingClientRect().y).toBe(expandedTitleBox.y);
      if (await nativeHover(toggle)) await checkMarkVisibility(toggle, mark, true);
      await nativeHover(canvas.getByRole("main"));
      await expect(nav).toBeVisible();
      await expect(within(nav).getByRole("link", { name: "Programs" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(
        within(nav).getByText("Programs").getBoundingClientRect().width,
      ).toBeLessThanOrEqual(1);
      await expect(within(nav).getByText("Work").getBoundingClientRect().width).toBeLessThanOrEqual(
        1,
      );
      await expect(within(nav).queryByRole("link", { name: /^Findings$/ })).toBeNull();
      await expect(canvas.queryByRole("separator", { name: "Resize side navigation" })).toBeNull();
      await expect(canvas.queryByRole("textbox", { name: "Search navigation" })).toBeNull();
    } finally {
      if (previousAttribute === null) root.removeAttribute("data-shell-sidenav");
      else root.setAttribute("data-shell-sidenav", previousAttribute);
      if (previousWidth) root.style.setProperty("--shell-sidenav-stored", previousWidth);
      else root.style.removeProperty("--shell-sidenav-stored");
      if (previousValue === null) localStorage.removeItem(key);
      else localStorage.setItem(key, previousValue);
    }
    await waitFor(() => expect(nav.getBoundingClientRect().width).toBe(320));
  },
};
