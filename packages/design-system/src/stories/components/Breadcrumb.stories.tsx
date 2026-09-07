import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  createRef,
  forwardRef,
  useId,
  useState,
  type ComponentProps,
  type MouseEvent,
  type Ref,
} from "react";
import { fn } from "storybook/test";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "../../components";
import { Heading, Stack } from "../../primitives";
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
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "breadcrumb" });
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
    const { expect, within } = await import("storybook/test");
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
      <BreadcrumbList id={listId}>
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
    const { expect, userEvent, within } = await import("storybook/test");
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
    const { expect, userEvent, within } = await import("storybook/test");
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

function LongTrail({ label }: { label: string }) {
  return (
    <div style={{ width: 320, maxWidth: "100%" }}>
      <Breadcrumb aria-label={label}>
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

/** The list wraps and long labels remain readable at a 320px width. */
export const LongWrappingTrail: Story = {
  render: () => <LongTrail label="Narrow account hierarchy" />,
  play: async ({ canvasElement }) => {
    const { expect, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", { name: "Narrow account hierarchy" });
    const first = canvas.getByRole("link", { name: "Programs" });
    const page = canvas.getByRole("link", { current: "page" });
    await expect(page).toHaveTextContent("AC-2(3) Disable accounts after a period of inactivity");
    await expect(page.getBoundingClientRect().bottom).toBeGreaterThan(
      first.getBoundingClientRect().bottom,
    );
    await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth);
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
    <Stack space="space.200">
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
      <output aria-label="Selected level">Selected level: {levels[level]}</output>
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
    const { expect, userEvent, within } = await import("storybook/test");
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
      <Specimens title="Narrow header: the trail and its labels wrap">
        <LongTrail label="Wrapping example" />
      </Specimens>
    </Stack>
  ),
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
    </Stack>
  ),
};

export const Playground: Story = {};
