import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createRef,
  forwardRef,
  Fragment,
  useId,
  useState,
  type ComponentProps,
  type MouseEvent,
  type Ref,
} from "react";
import { Folder } from "lucide-react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Badge,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "../../components";
import { Heading, Inline, Stack } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Breadcrumb",
  component: Breadcrumb,
  parameters: { layout: "padded" },
  args: {
    children: (
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Atlas payments platform</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    ),
  },
} satisfies Meta<typeof Breadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;

const basicRefs = {
  nav: createRef<HTMLElement>(),
  list: createRef<HTMLOListElement>(),
  item: createRef<HTMLLIElement>(),
  link: createRef<HTMLAnchorElement>(),
  separator: createRef<HTMLLIElement>(),
  page: createRef<HTMLSpanElement>(),
};

/** Native elements, named parts, and an explicit current page. */
export const Basic: Story = {
  render: () => (
    <Breadcrumb ref={basicRefs.nav} id="program-breadcrumb" data-example="basic">
      <BreadcrumbList ref={basicRefs.list} aria-label="Record hierarchy">
        <BreadcrumbItem ref={basicRefs.item} data-level="programs">
          <BreadcrumbLink ref={basicRefs.link} href="#programs" title="Browse programs">
            Programs
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator ref={basicRefs.separator} data-separator="parent" />
        <BreadcrumbItem>
          <BreadcrumbLink href="#atlas">Atlas payments platform</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage ref={basicRefs.page} title="Current record">
            Controls
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Breadcrumb" });
    const list = canvas.getByRole("list", { name: "Record hierarchy" });
    const programs = canvas.getByRole("link", { name: "Programs" });
    const atlas = canvas.getByRole("link", { name: "Atlas payments platform" });
    const page = canvas.getByRole("link", { name: "Controls", current: "page" });
    await expect(basicRefs.nav.current).toBe(nav);
    await expect(basicRefs.list.current).toBe(list);
    await expect(basicRefs.item.current).toBe(programs.parentElement);
    await expect(basicRefs.link.current).toBe(programs);
    await expect(basicRefs.page.current).toBe(page);
    await expect(basicRefs.separator.current).toBe(list.children[1]);
    await expect(nav).toHaveAttribute("id", "program-breadcrumb");
    await expect(nav).toHaveAttribute("data-example", "basic");
    await expect(programs.parentElement).toHaveAttribute("data-level", "programs");
    await expect(programs).toHaveAttribute("href", "#programs");
    await expect(programs).toHaveAttribute("title", "Browse programs");
    await expect(page).toHaveAttribute("title", "Current record");
    await expect(page.tagName).toBe("SPAN");
    await expect(page).toHaveAttribute("aria-disabled", "true");
    await expect(page).not.toHaveAttribute("href");
    await expect(page.tabIndex).toBe(-1);
    await expect(basicRefs.separator.current).toHaveAttribute("aria-hidden", "true");
    await expect(basicRefs.separator.current).toHaveAttribute("data-separator", "parent");
    await expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    programs.focus();
    await userEvent.tab();
    await expect(atlas).toHaveFocus();
    await userEvent.tab();
    await expect(page).not.toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(atlas).toHaveFocus();
  },
};

function StandardTrail({ label }: { label: string }) {
  return (
    <Breadcrumb aria-label={label}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Atlas payments platform</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function SlashTrail({ label }: { label: string }) {
  return (
    <Breadcrumb aria-label={label}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="#atlas">Atlas payments platform</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Controls</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export const CustomSeparator: Story = {
  render: () => <SlashTrail label="Control hierarchy" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separators = canvas.getAllByText("/");
    await expect(separators).toHaveLength(2);
    for (const separator of separators) {
      await expect(separator).toHaveAttribute("role", "presentation");
      await expect(separator).toHaveAttribute("aria-hidden", "true");
      await expect(separator.querySelector("svg")).toBeNull();
    }
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
  },
};

const ellipsisRef = createRef<HTMLSpanElement>();

function CollapsedTrail({
  label,
  ellipsisRef,
}: {
  label: string;
  ellipsisRef?: Ref<HTMLSpanElement>;
}) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  return (
    <Breadcrumb aria-label={label}>
      {/* A composed disclosure owns which levels show, so the list wraps instead of folding. */}
      <BreadcrumbList id={listId} overflow="wrap">
        <BreadcrumbItem>
          <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <button
            type="button"
            aria-label={expanded ? "Hide parent levels" : "Show parent levels"}
            aria-expanded={expanded}
            aria-controls={listId}
            className="rounded-xsmall focus-visible:outline-focused"
            onClick={() => setExpanded((value) => !value)}
          >
            <BreadcrumbEllipsis ref={ellipsisRef} data-example="parent-levels" />
          </button>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {expanded && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="#atlas">Atlas payments platform</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#controls">Controls</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>AC-2 Account management</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** Ellipsis is decoration; the named button owns disclosure behavior. */
export const Collapsed: Story = {
  render: () => <CollapsedTrail label="Account management hierarchy" ellipsisRef={ellipsisRef} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("button", { name: "Show parent levels" });
    await expect(ellipsisRef.current).toBe(toggle.firstElementChild);
    await expect(ellipsisRef.current).toHaveAttribute("aria-hidden", "true");
    await expect(ellipsisRef.current).toHaveAttribute("data-example", "parent-levels");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByRole("link", { name: "Controls" })).not.toBeInTheDocument();
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAccessibleName("Hide parent levels");
    await expect(toggle).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Atlas payments platform" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Controls" })).toHaveFocus();
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  },
};

// A router adapter must forward the received props and ref to its anchor.
const DemoRouterLink = forwardRef<
  HTMLAnchorElement,
  Omit<ComponentProps<"a">, "href"> & { to: string }
>(function DemoRouterLink({ to, ...props }, ref) {
  return <a ref={ref} href={to} {...props} />;
});

const renderRefs = {
  link: createRef<HTMLAnchorElement>(),
  adapter: createRef<HTMLAnchorElement>(),
};

const renderCalls = {
  link: fn(),
  adapter: fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault()),
};

function RenderLinkExample() {
  return (
    <Breadcrumb aria-label="Custom router hierarchy">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            ref={renderRefs.link}
            title="Browse programs"
            data-example="router-link"
            onClick={renderCalls.link}
            render={
              <DemoRouterLink
                ref={renderRefs.adapter}
                to="#programs"
                data-router="demo"
                onClick={renderCalls.adapter}
              />
            }
          >
            Programs
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Atlas payments platform</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** Base UI render merges attributes, handlers, and refs onto the adapter's anchor. */
export const RenderLink: Story = {
  render: () => <RenderLinkExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Programs" });
    renderCalls.link.mockClear();
    renderCalls.adapter.mockClear();
    await expect(renderRefs.link.current).toBe(link);
    await expect(renderRefs.adapter.current).toBe(link);
    await expect(link).toHaveAttribute("href", "#programs");
    await expect(link).toHaveAttribute("title", "Browse programs");
    await expect(link).toHaveAttribute("data-example", "router-link");
    await expect(link).toHaveAttribute("data-router", "demo");
    await expect(link).toHaveAttribute("data-slot", "breadcrumb-link");
    await userEvent.click(link);
    await expect(renderCalls.link).toHaveBeenCalledTimes(1);
    await expect(renderCalls.adapter).toHaveBeenCalledTimes(1);
    link.focus();
    await userEvent.keyboard("{Enter}");
    await expect(renderCalls.link).toHaveBeenCalledTimes(2);
    await expect(renderCalls.adapter).toHaveBeenCalledTimes(2);
  },
};

// The reader is here. A router marks a link active when this path starts with the link's own.
const currentPath = "/programs/atlas/controls";
const matches = (to: string, exact: boolean) =>
  currentPath === to || (!exact && currentPath.startsWith(`${to}/`));

/**
 * A stand-in for a router's `createLink(BreadcrumbLink)`, as TanStack Router has: the router works
 * out the link's props, including `aria-current="page"` on a prefix match, and renders
 * BreadcrumbLink with them. BreadcrumbLink drops the attribute, because it is always an ancestor.
 */
function CreatedTrailLink({
  to,
  onClick,
  ...props
}: Omit<ComponentProps<typeof BreadcrumbLink>, "href"> & { to: string }) {
  const active = matches(to, false);
  return (
    <BreadcrumbLink
      {...props}
      href={`#${to}`}
      {...(active ? { "aria-current": "page" as const, "data-status": "active" } : {})}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    />
  );
}

/**
 * A stand-in for a router Link given as a `render` element: it sets `aria-current` inside itself,
 * after BreadcrumbLink's props, on a prefix match unless it is told to match exactly.
 */
const MatchingRouterLink = forwardRef<
  HTMLAnchorElement,
  Omit<ComponentProps<"a">, "href"> & { to: string; exact?: boolean | undefined }
>(function MatchingRouterLink({ to, exact = false, onClick, ...props }, ref) {
  return (
    <a
      ref={ref}
      href={`#${to}`}
      {...props}
      aria-current={matches(to, exact) ? "page" : undefined}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    />
  );
});

const routerTrailCalls = { navigate: fn() };

function RouterTrail({ label, mode }: { label: string; mode: "created" | "exact" | "prefix" }) {
  const levels = [
    { to: "/programs", name: "Programs" },
    { to: "/programs/atlas", name: "Atlas payments platform" },
  ];
  return (
    <Breadcrumb aria-label={label}>
      <BreadcrumbList>
        {levels.map((level) => (
          <Fragment key={level.to}>
            <BreadcrumbItem>
              {mode === "created" ? (
                <CreatedTrailLink to={level.to} onClick={() => routerTrailCalls.navigate(level.to)}>
                  {level.name}
                </CreatedTrailLink>
              ) : (
                <BreadcrumbLink
                  render={
                    <MatchingRouterLink
                      to={level.to}
                      exact={mode === "exact"}
                      onClick={() => routerTrailCalls.navigate(level.to)}
                    />
                  }
                >
                  {level.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>Controls</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * A router link marks every ancestor of the current path as the current page. BreadcrumbLink drops
 * the `aria-current` it is handed when the router renders through it (`createLink`), and a router
 * link given through `render` matches exactly, so only BreadcrumbPage is announced as the current
 * page.
 */
export const RouterLinks: Story = {
  name: "Router links",
  render: () => (
    <Stack space="space.300">
      <Specimens title="The router renders BreadcrumbLink (createLink)">
        <RouterTrail label="Trail through createLink" mode="created" />
      </Specimens>
      <Specimens title="A router link through render, with exact matching">
        <RouterTrail label="Trail with exact matching" mode="exact" />
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    routerTrailCalls.navigate.mockClear();
    for (const name of ["Trail through createLink", "Trail with exact matching"]) {
      const nav = canvas.getByRole("navigation", { name });
      const trail = within(nav);
      const current = nav.querySelectorAll('[aria-current="page"]');
      await expect(current).toHaveLength(1);
      await expect(current[0]).toHaveAttribute("data-slot", "breadcrumb-page");
      await expect(current[0]).toHaveTextContent("Controls");
      for (const level of ["Programs", "Atlas payments platform"]) {
        const link = trail.getByRole("link", { name: level });
        await expect(link).not.toHaveAttribute("aria-current");
        await expect(link).toHaveAttribute("href");
      }
    }
    await userEvent.click(
      within(canvas.getByRole("navigation", { name: "Trail through createLink" })).getByRole(
        "link",
        { name: "Programs" },
      ),
    );
    await expect(routerTrailCalls.navigate).toHaveBeenLastCalledWith("/programs");
    await userEvent.click(
      within(canvas.getByRole("navigation", { name: "Trail with exact matching" })).getByRole(
        "link",
        { name: "Atlas payments platform" },
      ),
    );
    await expect(routerTrailCalls.navigate).toHaveBeenLastCalledWith("/programs/atlas");
  },
};

function LongTrail({ label }: { label: string }) {
  return (
    <div style={{ maxWidth: 320 }}>
      <Breadcrumb aria-label={label}>
        <BreadcrumbList overflow="wrap">
          <BreadcrumbItem>
            <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#atlas">Atlas payments platform</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#controls">Access control</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>AC-2(3) Disable accounts after a period of inactivity</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

/** The line a separator's glyph sits on and the line the next level starts on, as centres. */
function separatorLines(list: HTMLElement) {
  const centre = (rect: DOMRect | undefined) => (rect ? rect.top + rect.height / 2 : Number.NaN);
  const firstRect = (el: Element) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Array.from(range.getClientRects()).find((rect) => rect.width > 0.5);
  };
  const lastRect = (el: Element) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return Array.from(range.getClientRects())
      .filter((rect) => rect.width > 0.5)
      .at(-1);
  };
  return Array.from(list.querySelectorAll(':scope > [data-slot="breadcrumb-separator"]'))
    .filter((separator) => separator.getClientRects().length > 0)
    .map((separator) => ({
      glyph: centre(lastRect(separator)),
      next: centre(
        separator.nextElementSibling ? firstRect(separator.nextElementSibling) : undefined,
      ),
    }));
}

/** `overflow="wrap"` shows every level at 320px; each separator starts its line with the level it leads to. */
export const LongWrappingTrail: Story = {
  render: () => <LongTrail label="Narrow account hierarchy" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Narrow account hierarchy" });
    const list = within(nav).getByRole("list");
    const first = canvas.getByRole("link", { name: "Programs" });
    const page = canvas.getByRole("link", { current: "page" });
    await expect(page).toHaveTextContent("AC-2(3) Disable accounts after a period of inactivity");
    await expect(page).not.toHaveAttribute("title");
    await expect(page.getBoundingClientRect().bottom).toBeGreaterThan(
      first.getBoundingClientRect().bottom,
    );
    await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth);
    // No separator ends a line: each sits on the line of the level after it.
    const lines = separatorLines(list);
    await expect(lines).toHaveLength(3);
    for (const line of lines) await expect(Math.abs(line.glyph - line.next)).toBeLessThan(4);
    // A link that wraps takes the band, which stays on its own words, not the centred square.
    for (const link of within(nav).getAllByRole("link").slice(0, -1)) {
      await expect(link).toHaveClass("touch-target-block");
      await expect(link).not.toHaveClass("touch-target");
    }
  },
};

const deepLevels = [
  { label: "Programs", href: "#programs" },
  { label: "Atlas payments platform", href: "#atlas" },
  { label: "Systems", href: "#systems" },
  { label: "Payment gateway", href: "#gateway" },
  { label: "Requirements", href: "#requirements" },
];
const deepPage = "AC-2(3) Disable accounts after a period of inactivity";

function DeepTrail({
  label,
  onNavigate,
}: {
  label: string;
  onNavigate?: ((level: string) => void) | undefined;
}) {
  return (
    <Breadcrumb aria-label={label}>
      <BreadcrumbList>
        {deepLevels.map((level) => (
          <Fragment key={level.href}>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={level.href}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate?.(level.label);
                }}
              >
                {level.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{deepPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** The levels a trail shows and folds, read from the accessibility tree. */
function trailState(nav: HTMLElement) {
  const shown = deepLevels
    .map((level) => level.label)
    .filter((name) => within(nav).queryByRole("link", { name }) !== null);
  const folded = deepLevels.map((level) => level.label).filter((name) => !shown.includes(name));
  return { shown, folded };
}

/** The visible list items in the order they appear on the line. */
function lineOrder(list: HTMLElement) {
  return Array.from(list.children)
    .filter((el) => el.getClientRects().length > 0)
    .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
}

/**
 * The visible list items share one line, read in the order they appear, and none wraps inside
 * itself. Separators and levels alternate: none starts or ends the line, and no two levels meet
 * without one. A link is never narrower than its name (its text label, or all of a composed link)
 * or 80px, whichever is less, and nothing runs past the list. Waits for the web font, which
 * changes every width once it loads.
 */
async function expectOneLine(list: HTMLElement) {
  await document.fonts.ready;
  await waitFor(async () => {
    const shown = lineOrder(list);
    const centres = shown.map((el) => {
      const rect = el.getBoundingClientRect();
      return Math.round(rect.top + rect.height / 2);
    });
    await expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(1);
    const line = Number.parseFloat(getComputedStyle(list).lineHeight) || 16;
    for (const el of shown)
      await expect(el.getBoundingClientRect().height).toBeLessThan(line * 1.5);
    const separators = shown.map((el) => el.getAttribute("data-slot") === "breadcrumb-separator");
    await expect(separators).toEqual(shown.map((_, i) => i % 2 === 1));
    await expect(separators.at(-1)).toBe(false);
    for (const link of Array.from(
      list.querySelectorAll<HTMLElement>("[data-slot=breadcrumb-link]"),
    ))
      if (link.getClientRects().length > 0) {
        const name = link.querySelector("[data-slot=breadcrumb-label]") ?? link;
        await expect(link.getBoundingClientRect().width).toBeGreaterThanOrEqual(
          Math.min(80, name.scrollWidth) - 1,
        );
      }
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  });
}

const foldCalls = { navigate: fn() };

/**
 * Six levels in a 320px frame keep one line. The middle levels fold first, nearest the root first,
 * behind the ellipsis; then the current page gives up the end of its name, keeping it as its title.
 * The menu lists the folded levels as links, in order, and choosing one runs the folded link
 * itself, so a router link keeps its client-side navigation. Given the room back, every level
 * returns; a little short of it, one middle level folds and the page keeps its whole name.
 */
export const CollapsesToFit: Story = {
  render: () => (
    <div data-testid="trail-frame" style={{ maxWidth: 320 }}>
      <DeepTrail label="Requirement hierarchy" onNavigate={foldCalls.navigate} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    foldCalls.navigate.mockClear();
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Requirement hierarchy" });
    const list = within(nav).getByRole("list");
    const more = await within(nav).findByRole("button", { name: "Show hidden levels" });
    await expectOneLine(list);

    // The root, the parent and the current page stay; the middle folds from the root side.
    const { shown, folded } = trailState(nav);
    await expect(shown[0]).toBe("Programs");
    await expect(shown.at(-1)).toBe("Requirements");
    await expect(folded[0]).toBe("Atlas payments platform");
    await expect(folded.length).toBeGreaterThanOrEqual(2);
    const page = within(nav).getByRole("link", { current: "page" });
    await expect(page).toBeVisible();
    await expect(page).toHaveAttribute("title", deepPage);

    // The ellipsis menu lists exactly the folded levels, as links, in order.
    await userEvent.click(more);
    const menu = await within(document.body).findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    await expect(items.map((item) => item.textContent)).toEqual(folded);
    for (const item of items) {
      const level = deepLevels.find((entry) => entry.label === item.textContent);
      await expect(item.tagName).toBe("A");
      await expect(item).toHaveAttribute("href", level?.href);
    }
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Atlas payments platform" }));
    await expect(foldCalls.navigate).toHaveBeenCalledWith("Atlas payments platform");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());

    // Settled: nothing folds or unfolds again while the width holds.
    const changes: MutationRecord[] = [];
    const watch = new MutationObserver((records) => changes.push(...records));
    watch.observe(list, {
      subtree: true,
      attributeFilter: ["data-collapsed", "data-shown", "data-shortened", "data-leading", "style"],
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
    watch.disconnect();
    await expect(changes).toHaveLength(0);

    // Given the room back (on a wide canvas), every level returns; narrowed again, they fold.
    const frame = canvas.getByTestId("trail-frame");
    if ((frame.parentElement?.getBoundingClientRect().width ?? 0) >= 900) {
      frame.style.maxWidth = "none";
      await waitFor(() => expect(trailState(nav).folded).toEqual([]));
      await expect(more).not.toBeVisible();
      await expect(page).not.toHaveAttribute("title");
      // A little short of the whole trail, a middle level folds before the page shortens.
      const shown = lineOrder(list);
      const natural =
        (shown.at(-1)?.getBoundingClientRect().right ?? 0) -
        (shown[0]?.getBoundingClientRect().left ?? 0);
      frame.style.maxWidth = `${Math.floor(natural - 24)}px`;
      await waitFor(() => expect(trailState(nav).folded).toEqual(["Atlas payments platform"]));
      await expect(page).not.toHaveAttribute("title");
      await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
      await expectOneLine(list);
      frame.style.maxWidth = "320px";
      await waitFor(() => expect(trailState(nav).folded).toEqual(folded));
      await expect(more).toBeVisible();
      // A level that folds while it holds focus hands focus to the ellipsis, which now lists it,
      // without scrolling the page: the reader's place stays in the trail.
      frame.style.maxWidth = "none";
      await waitFor(() => expect(trailState(nav).folded).toEqual([]));
      const middle = within(nav).getByRole("link", { name: "Atlas payments platform" });
      middle.focus();
      await expect(middle).toHaveFocus();
      const scrolled = window.scrollY;
      frame.style.maxWidth = "320px";
      await waitFor(() => expect(trailState(nav).folded).toEqual(folded));
      await waitFor(() => expect(more).toHaveFocus());
      await expect(window.scrollY).toBe(scrolled);
    }
  },
};

/**
 * In a 240px frame the parent and the page cannot both keep 80px beside the root, so the root
 * folds after the middle: the ellipsis leads the line, the menu lists the root first, and it opens
 * and closes from the keyboard. At 180px the parent folds too, and the line keeps the ellipsis and
 * the page. A link never shrinks below its floor.
 */
export const RootFoldsLast: Story = {
  render: () => (
    <div data-testid="tight-frame" style={{ maxWidth: 240 }}>
      <DeepTrail label="Tight requirement hierarchy" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", {
      name: "Tight requirement hierarchy",
    });
    const list = within(nav).getByRole("list");
    const more = await within(nav).findByRole("button", { name: "Show hidden levels" });
    await expectOneLine(list);
    const { shown, folded } = trailState(nav);
    await expect(shown).toEqual(["Requirements"]);
    await expect(folded[0]).toBe("Programs");
    await expect(lineOrder(list)[0]).toContainElement(more);
    await expect(within(nav).getByRole("link", { current: "page" })).toBeVisible();

    more.focus();
    await userEvent.keyboard("{Enter}");
    const menu = await within(document.body).findByRole("menu");
    await expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(folded);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());

    // Narrower, the parent folds rather than shrink below its floor.
    within(canvasElement).getByTestId("tight-frame").style.maxWidth = "180px";
    await waitFor(() => expect(trailState(nav).shown).toEqual([]));
    await expectOneLine(list);
    await expect(lineOrder(list)[0]).toContainElement(more);
    await expect(within(nav).getByRole("link", { current: "page" })).toBeVisible();
  },
};

/**
 * On a 340px phone the record's trail keeps one line under the top of the page: the root, the
 * ellipsis, the parent and as much of the page's name as fits. On a touch screen each link and
 * the ellipsis take a 24px hit area without moving the line.
 */
export const CollapsesOnPhone: Story = {
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  render: () => (
    <Stack space="space.100">
      <DeepTrail label="Phone requirement hierarchy" />
      <Heading size="large">{deepPage}</Heading>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    const nav = within(canvasElement).getByRole("navigation", {
      name: "Phone requirement hierarchy",
    });
    const more = await within(nav).findByRole("button", { name: "Show hidden levels" });
    await expectOneLine(within(nav).getByRole("list"));
    await expect(more).toBeVisible();
    await expect(trailState(nav).shown.at(-1)).toBe("Requirements");
    await expect(within(nav).getByRole("link", { current: "page" })).toBeVisible();
    for (const link of within(nav).getAllByRole("link").slice(0, -1)) {
      await expect(link).toHaveClass("touch-target");
      await expect(link).not.toHaveClass("touch-target-block");
    }
    await expect(more).toHaveClass("touch-target");
  },
};

function ThreeLevels({ label, parent, page }: { label: string; parent: string; page: string }) {
  return (
    <Breadcrumb aria-label={label}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#atlas">{parent}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * A three-level trail in a 220px frame has no middle to fold, so its root folds: the ellipsis leads
 * the line and the root's separator follows it, before the parent. The menu lists the root.
 */
export const ShortTrailFoldsTheRoot: Story = {
  render: () => (
    <div style={{ maxWidth: 220 }}>
      <ThreeLevels
        label="Short control hierarchy"
        parent="Atlas payments platform"
        page="Controls"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Short control hierarchy" });
    const list = within(nav).getByRole("list");
    const more = await within(nav).findByRole("button", { name: "Show hidden levels" });
    await expectOneLine(list);
    const [first, second, third] = lineOrder(list);
    await expect(first).toContainElement(more);
    await expect(second).toHaveAttribute("data-slot", "breadcrumb-separator");
    const parent = within(nav).getByRole("link", { name: "Atlas payments platform" });
    await expect(third).toContainElement(parent);
    await expect(parent).toHaveAttribute("title", "Atlas payments platform");
    await expect(within(nav).queryByRole("link", { name: "Programs" })).toBeNull();
    await userEvent.click(more);
    const menu = await within(document.body).findByRole("menu");
    await expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["Programs"]);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());
  },
};

/**
 * With nothing left to fold, the parent and the current page share the line: the longer name
 * shortens first, down to 80px, so the shorter keeps its whole name. On a 340px phone the focused
 * view's name stays whole while the program's name, which the heading repeats, gives way. On a
 * record page the record's name is usually the longer one, and the heading repeats it.
 */
export const LongerNameGivesWay: Story = {
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  render: () => (
    <Stack space="space.100">
      <ThreeLevels
        label="Focused view hierarchy"
        parent="PRG-1042 · Atlas payments platform"
        page="Traceability matrix"
      />
      <Heading size="large">Atlas payments platform</Heading>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    const nav = within(canvasElement).getByRole("navigation", { name: "Focused view hierarchy" });
    await expectOneLine(within(nav).getByRole("list"));
    const parent = within(nav).getByRole("link", { name: "PRG-1042 · Atlas payments platform" });
    const page = within(nav).getByRole("link", { current: "page" });
    await expect(within(nav).getByRole("link", { name: "Programs" })).toBeVisible();
    await expect(parent).toHaveAttribute("title", "PRG-1042 · Atlas payments platform");
    await expect(page).not.toHaveAttribute("title");
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
  },
};

/**
 * A level composed from other content, such as a plain span for a level the reader cannot go back
 * to, never wraps: it keeps its whole name, and when that does not fit, it folds. Only the kit's
 * link and current page shorten. In a 400px frame the root folds and the parent keeps its whole
 * name; at 240px the parent folds too, and the menu lists it as a disabled item.
 */
export const UnlinkedParentFolds: Story = {
  render: () => (
    <div data-testid="unlinked-frame" style={{ maxWidth: 400 }}>
      <Breadcrumb aria-label="Drill-down path">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#families">All families</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span>Access control and identity management</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>AC-2 Account management</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Drill-down path" });
    const list = within(nav).getByRole("list");
    const parent = within(nav).getByText("Access control and identity management");
    const parentItem = parent.closest("li");
    await expectOneLine(list);
    // Whole or folded, never shortened.
    await expect(parentItem).not.toHaveAttribute("data-shortened");
    await expect(parentItem?.style.maxWidth).toBe("");
    const frame = canvas.getByTestId("unlinked-frame");
    if (frame.getBoundingClientRect().width >= 400) {
      await expect(parent).toBeVisible();
      await expect(parent.scrollWidth).toBeLessThanOrEqual(parent.clientWidth);
      await expect(within(nav).queryByRole("link", { name: "All families" })).toBeNull();
    }

    frame.style.maxWidth = "240px";
    await waitFor(() => expect(parent).not.toBeVisible());
    await expectOneLine(list);
    await expect(within(nav).getByRole("link", { current: "page" })).toBeVisible();
    await userEvent.click(within(nav).getByRole("button", { name: "Show hidden levels" }));
    const menu = await within(document.body).findByRole("menu");
    const items = within(menu).getAllByRole("menuitem");
    await expect(items.map((item) => item.textContent)).toEqual([
      "All families",
      "Access control and identity management",
    ]);
    await expect(items[0]).toHaveAttribute("href", "#families");
    await expect(items[1]).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());
  },
};

/**
 * The trail folds to the width it is given. Beside an action in a 360px row it is a flex item with
 * `min-width: 0`, as the Breadcrumb is by itself; a wrapper around it in the row needs `min-w-0`
 * too, or the row grows to the whole trail. The action keeps its full label. Sized to its content,
 * the trail still follows the row both ways: widened from a width that leaves it short of the row,
 * every level comes back, and narrowed again, the same levels fold, with no resize loop.
 */
export const BesideAnAction: Story = {
  render: () => (
    <Stack space="space.200">
      {[false, true].map((wrapped) => (
        <div key={String(wrapped)} data-testid="action-row" style={{ maxWidth: 360 }}>
          <Inline space="space.100" alignBlock="center" spread="space-between">
            {wrapped ? (
              <div className="min-w-0">
                <DeepTrail label="Wrapped trail beside an action" />
              </div>
            ) : (
              <DeepTrail label="Trail beside an action" />
            )}
            <Button size="small">Edit requirement</Button>
          </Inline>
        </div>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = canvas.getAllByTestId("action-row");
    for (const [i, name] of [
      "Trail beside an action",
      "Wrapped trail beside an action",
    ].entries()) {
      const row = rows[i];
      if (!row) throw new Error("missing row");
      const nav = canvas.getByRole("navigation", { name });
      await expectOneLine(within(nav).getByRole("list"));
      await expect(within(nav).getByRole("button", { name: "Show hidden levels" })).toBeVisible();
      const action = within(row).getByRole("button", { name: "Edit requirement" });
      await expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(
        row.getBoundingClientRect().right + 0.5,
      );
      await expect(nav.getBoundingClientRect().right).toBeLessThanOrEqual(
        action.getBoundingClientRect().left,
      );
      await expect(action.scrollWidth).toBeLessThanOrEqual(action.clientWidth);
    }

    // The rows narrow and widen; the trails follow without a resize loop.
    const navs = rows.map((row) => within(row).getByRole("navigation"));
    const folded = trailState(navs[0] ?? canvasElement).folded;
    const loops: string[] = [];
    const onError = (event: ErrorEvent) => {
      if (event.message.includes("ResizeObserver")) loops.push(event.message);
    };
    const setRows = (maxWidth: string) => {
      for (const row of rows) row.style.maxWidth = maxWidth;
    };
    window.addEventListener("error", onError);
    try {
      if ((rows[0]?.parentElement?.getBoundingClientRect().width ?? 0) >= 1000) {
        // At 700px the trail sizes to fewer levels than the row holds: widened from there, every
        // level comes back.
        setRows("700px");
        for (const nav of navs) await waitFor(() => expect(trailState(nav).folded).not.toEqual([]));
        setRows("1000px");
        for (const nav of navs) {
          await waitFor(() => expect(trailState(nav).folded).toEqual([]));
          await expectOneLine(within(nav).getByRole("list"));
        }
      } else setRows("none");
      setRows("360px");
      for (const nav of navs) {
        await waitFor(() => expect(trailState(nav).folded).toEqual(folded));
        await expectOneLine(within(nav).getByRole("list"));
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(loops).toEqual([]);
    } finally {
      window.removeEventListener("error", onError);
    }
  },
};

/**
 * A level may hold more than its name: an icon inside the root's link, a badge beside a middle
 * level. A link given composed children renders them as they are, so the icon stays on the line
 * beside its name, and the level keeps its whole width or folds. The menu lists a folded level by
 * its link's name. The badge is taller than the text, and the line keeps its height whether the
 * badge's level shows or folds, so the page below does not move; narrowed and widened, the trail
 * follows with no resize loop.
 */
export const ComposedLevels: Story = {
  render: () => (
    <div data-testid="composed-frame" style={{ maxWidth: 360 }}>
      <Breadcrumb aria-label="Composed requirement hierarchy">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#programs" className="inline-flex items-center gap-050">
              <Folder aria-hidden="true" className="size-icon-small" />
              Programs
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#atlas">Atlas payments platform</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#gateway">Payment gateway</BreadcrumbLink>
            <Badge variant="secondary">Draft</Badge>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#requirements">Requirements</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{deepPage}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Composed requirement hierarchy" });
    const list = within(nav).getByRole("list");
    const frame = canvas.getByTestId("composed-frame");
    // The pill, not the label span inside it.
    const badge = within(nav).getByText("Draft").closest<HTMLElement>('[data-slot="badge"]')!;
    const loops: string[] = [];
    const onError = (event: ErrorEvent) => {
      if (event.message.includes("ResizeObserver")) loops.push(event.message);
    };
    window.addEventListener("error", onError);
    try {
      await expectOneLine(list);
      const line = list.getBoundingClientRect().height;
      const root = within(nav).queryByRole("link", { name: "Programs" });
      if (root) {
        // The icon and the name share one line inside the link; no label wraps them.
        await expect(root.querySelector("[data-slot=breadcrumb-label]")).toBeNull();
        const icon = root.querySelector("svg")?.getBoundingClientRect();
        const box = root.getBoundingClientRect();
        await expect(box.height).toBeLessThan(line + 1);
        await expect(
          Math.abs((icon?.top ?? 0) + (icon?.height ?? 0) / 2 - (box.top + box.height / 2)),
        ).toBeLessThanOrEqual(1);
      }

      // The menu names a folded level by its link, without the badge beside it.
      const more = within(nav).getByRole("button", { name: "Show hidden levels" });
      await userEvent.click(more);
      const menu = await within(document.body).findByRole("menu");
      const names = within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent);
      await expect(names).toContain("Payment gateway");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(within(document.body).queryByRole("menu")).toBeNull());

      // Narrowed and widened, levels fold and return; the line keeps its height throughout.
      const wide = (frame.parentElement?.getBoundingClientRect().width ?? 0) >= 900;
      for (const [maxWidth, shows] of wide
        ? ([
            ["none", true],
            ["360px", false],
            ["none", true],
            ["300px", false],
          ] as const)
        : ([
            ["200px", false],
            ["360px", false],
          ] as const)) {
        frame.style.maxWidth = maxWidth;
        if (wide) await waitFor(() => expect(badge.checkVisibility()).toBe(shows));
        await expectOneLine(list);
        await expect(list.getBoundingClientRect().height).toBe(line);
        // The line is as tall as the badge, shown or folded.
        if (wide && shows) await expect(badge.getBoundingClientRect().height).toBe(line);
      }
      frame.style.maxWidth = "360px";
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(loops).toEqual([]);
    } finally {
      window.removeEventListener("error", onError);
    }
  },
};

export const SinglePage: Story = {
  render: () => (
    <Breadcrumb aria-label="Programs hierarchy">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>Programs</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

function InPlaceTrail({ label }: { label: string }) {
  const [level, setLevel] = useState(2);
  const levels = ["Programs", "Atlas payments platform", "Controls"];
  return (
    <Stack space="space.200" className="min-w-0">
      <Breadcrumb aria-label={label}>
        <BreadcrumbList>
          {level > 0 && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink render={<button type="button" onClick={() => setLevel(0)} />}>
                  Programs
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          {level > 1 && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink render={<button type="button" onClick={() => setLevel(1)} />}>
                  Atlas payments platform
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{levels[level]}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <output aria-label="Selected level" className="min-w-0 break-words">
        Selected level: {levels[level]}
      </output>
      <div>
        <Button size="small" onClick={() => setLevel(2)}>
          Open Controls
        </Button>
      </div>
    </Stack>
  );
}

/** Explicit buttons for local hierarchy state, with native Enter and Space activation. */
export const InPlaceButtons: Story = {
  render: () => <InPlaceTrail label="Local record hierarchy" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const programs = canvas.getByRole("button", { name: "Programs" });
    await expect(programs).toHaveAttribute("type", "button");
    programs.focus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByLabelText("Selected level")).toHaveTextContent(
      "Selected level: Programs",
    );
    await expect(canvas.getByRole("link", { current: "page" })).toHaveTextContent("Programs");
    await userEvent.click(canvas.getByRole("button", { name: "Open Controls" }));
    canvas.getByRole("button", { name: "Atlas payments platform" }).focus();
    await userEvent.keyboard(" ");
    await expect(canvas.getByLabelText("Selected level")).toHaveTextContent(
      "Atlas payments platform",
    );
    await expect(canvas.getByRole("link", { current: "page" })).toHaveTextContent(
      "Atlas payments platform",
    );
  },
};

/** Compare composition options without disabling the unique-landmark accessibility check. */
export const BreadcrumbMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Two levels">
        <StandardTrail label="Two-level example" />
      </Specimens>
      <Specimens title="Custom separator">
        <SlashTrail label="Slash separator example" />
      </Specimens>
      <Specimens title="Collapsed parents: activate the named control">
        <CollapsedTrail label="Collapsed parents example" />
      </Specimens>
      <Specimens title="The page alone">
        <Breadcrumb aria-label="Single-page example">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Programs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Specimens>
      <Specimens title="In place: explicit buttons change the selected level">
        <InPlaceTrail label="In-place example" />
      </Specimens>
      <Specimens title="Narrow header: the middle levels fold behind the ellipsis">
        <div style={{ maxWidth: 320, minWidth: 0 }}>
          <DeepTrail label="Folding example" />
        </div>
      </Specimens>
      <Specimens title='overflow="wrap": every level, each separator starting its line'>
        <LongTrail label="Wrapping example" />
      </Specimens>
      <Specimens title="Right to left: the chevrons point along the reading direction">
        <div dir="rtl" className="min-w-0">
          <StandardTrail label="Right-to-left example" />
        </div>
      </Specimens>
    </Stack>
  ),
};

/**
 * In a right-to-left page the trail reads from the right: the root at the start, the page at the
 * end, and the default chevrons turn to point along the reading direction. It folds to its width
 * the same way, the ellipsis after the root.
 */
export const RightToLeft: Story = {
  name: "Right to left",
  render: () => (
    <div dir="rtl">
      <Stack space="space.300">
        <StandardTrail label="Right-to-left trail" />
        <div style={{ maxWidth: 320 }}>
          <DeepTrail label="Right-to-left folding trail" />
        </div>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Right-to-left trail" });
    const root = within(nav).getByRole("link", { name: "Programs" }).getBoundingClientRect();
    const page = within(nav).getByRole("link", { current: "page" }).getBoundingClientRect();
    await expect(root.left).toBeGreaterThan(page.right);
    for (const chevron of Array.from(
      canvasElement.querySelectorAll('[data-slot="breadcrumb-separator"] > svg'),
    ))
      await expect(getComputedStyle(chevron).rotate).toBe("180deg");
    const folding = canvas.getByRole("navigation", { name: "Right-to-left folding trail" });
    const list = within(folding).getByRole("list");
    await within(folding).findByRole("button", { name: "Show hidden levels" });
    await expectOneLine(list);
    await expect(trailState(folding).shown[0]).toBe("Programs");
  },
};

export const AboveTitle: Story = {
  render: () => (
    <Stack space="space.100">
      <Breadcrumb aria-label="SCTM hierarchy">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#atlas">Atlas payments platform</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>SCTM</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Heading size="large">SCTM</Heading>
    </Stack>
  ),
};

/** The console spy the Don't story watches for the one-current-page warning. */
const dontWarnings: { said: string[] } = { said: [] };

export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<StandardTrail label="Current page example" />}
        doText="Mark the final level with BreadcrumbPage: it identifies the current page and has no navigation action."
        dont={
          <Breadcrumb aria-label="Self-link mistake">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#atlas">Atlas payments platform</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        dontText="A link to the page itself leaves the current level unmarked."
      />
      <Pair
        do={<StandardTrail label="Record tree example" />}
        doText="Use the actual levels of the record tree and their names."
        dont={
          <Breadcrumb aria-label="Browsing-history mistake">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#home">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#overview">Overview tab</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Current page</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        dontText="A history of clicks, tabs, and generic labels does not describe the record hierarchy."
      />
      <Pair
        do={<StandardTrail label="Anchor navigation example" />}
        doText="Use BreadcrumbLink with href or a router link through render for navigation."
        dont={
          <Breadcrumb aria-label="Button-navigation mistake">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<button type="button" onClick={() => undefined} />}>
                  Programs
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Atlas payments platform</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        dontText="A button standing in for page navigation cannot be opened in a new tab. Reserve buttons for state changes in place."
      />
      <Pair
        do={<RouterTrail label="Exact matching example" mode="exact" />}
        doText="A router link through render matches exactly, or the router renders BreadcrumbLink itself: only the page is the current page."
        dont={<RouterTrail label="Prefix matching mistake" mode="prefix" />}
        dontText="A router link through render that matches by prefix marks Programs and the program as the current page too, and a screen reader says so on every level. The trail says so once in the console."
      />
    </Stack>
  ),
  beforeEach: () => {
    const original = console.warn;
    dontWarnings.said = [];
    console.warn = (...args: unknown[]) => {
      dontWarnings.said.push(String(args[0] ?? ""));
      original.apply(console, args);
    };
    return () => {
      console.warn = original;
    };
  },
  play: async () => {
    // The prefix-matching trail marks three levels as the current page; the kit says so once.
    const said = dontWarnings.said;
    await expect(
      said.filter((text) => /marks 3 levels as the current page/.test(text)),
    ).toHaveLength(1);
  },
};

export const Playground: Story = {};
