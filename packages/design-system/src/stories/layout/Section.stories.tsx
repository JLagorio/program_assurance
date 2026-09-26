import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Badge,
  Button,
  Heading,
  HeadingLevelProvider,
  KeyValue,
  PageHeader,
  Section,
  Shell,
  Stack,
  Text,
  TextLink,
} from "../..";
const meta = {
  title: "Layout/Section",
  component: Section,
  parameters: { layout: "padded" },
  args: { title: "Evidence", children: "No files attached." },
} satisfies Meta<typeof Section>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Presentation: Story = {
  render: () => (
    <Stack space="space.400">
      <Section title="Evidence" count={0} action={<Button size="small">Attach file</Button>}>
        No files attached.
      </Section>
      <Section title="Activity" divided description="Recent changes to this record.">
        Review requested by Alex Morgan.
      </Section>
    </Stack>
  ),
};

/** The parts by hand, with a Badge beside the title and two actions. */
function RecordedRuns({ title = "Recorded runs" }: { title?: string | undefined }) {
  return (
    <Section>
      <Section.Header divided>
        <Section.Heading>
          <span className="flex min-w-0 items-baseline gap-100">
            <Section.Title render={<h3 />}>{title}</Section.Title>
            <Badge tone="success" size="xsmall">
              Passing
            </Badge>
          </span>
          <Section.Description>The last three campaigns, newest first.</Section.Description>
        </Section.Heading>
        <Section.Actions>
          <Button size="small">Export</Button>
          <Button size="small" variant="primary">
            Add test run
          </Button>
        </Section.Actions>
      </Section.Header>
      Three runs.
    </Section>
  );
}

/** Words in the element's text that are drawn across two lines: a word broken mid-word has two rects. */
function brokenWords(element: Element) {
  const broken: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (const match of (node.textContent ?? "").matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(node, match.index ?? 0);
      range.setEnd(node, (match.index ?? 0) + match[0].length);
      if (range.getClientRects().length > 1) broken.push(match[0]);
    }
  }
  return broken;
}

/** The width an element takes on one line (its max-content), read without disturbing the page. */
function ownWidth(element: Element) {
  const probe = element.cloneNode(true) as HTMLElement;
  for (const node of probe.querySelectorAll("[id]")) node.removeAttribute("id");
  probe.setAttribute("aria-hidden", "true");
  Object.assign(probe.style, {
    position: "absolute",
    visibility: "hidden",
    flex: "none",
    inlineSize: "max-content",
    maxInlineSize: "none",
  });
  element.after(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

/**
 * Where a region's header put its actions (beside the heading, or on the next row), whether its
 * row has room beside them for the heading's measure (12rem, or the heading's own width when
 * shorter), whether they end at the header's end, and any title word drawn across two lines.
 */
function headerLayout(region: HTMLElement) {
  const part = (slot: string) => {
    const element = region.querySelector(`[data-slot="${slot}"]`);
    if (!element) throw new Error(`No ${slot} in the region`);
    return element;
  };
  const headerElement = part("section-header");
  const headingElement = part("section-heading");
  const header = headerElement.getBoundingClientRect();
  const heading = headingElement.getBoundingClientRect();
  const actions = part("section-actions").getBoundingClientRect();
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const gap = parseFloat(getComputedStyle(headerElement).columnGap) || 0;
  const measure = Math.min(header.width, 12 * rem, ownWidth(headingElement));
  return {
    wrapped: actions.top >= heading.bottom,
    roomBeside: measure + gap + actions.width <= header.width + 0.5,
    atEnd: Math.abs(actions.right - header.right) < 1,
    brokenWords: brokenWords(part("section-title")),
  };
}

/** The parts by hand: a Badge beside the title, two actions, and the heading at the level the outline needs. With room, the actions sit at the end of the heading's row; without it, on the next row at the end. */
export const Composed: Story = {
  render: () => <RecordedRuns />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region", { name: "Recorded runs" });
    await expect(within(region).getByRole("heading", { level: 3 })).toBeVisible();
    await expect(within(region).getAllByRole("button")).toHaveLength(2);
    // The rule, at whatever width the story renders: the actions wrap exactly when the row
    // cannot hold the heading's measure beside them.
    const layout = headerLayout(region);
    await expect(layout).toEqual({
      wrapped: !layout.roomBeside,
      roomBeside: layout.roomBeside,
      atEnd: true,
      brokenWords: [],
    });
  },
};

/** On a small phone the row cannot give the heading its measure beside two actions, so the actions take the next row, at the end, and "Recorded runs" keeps its words whole. */
export const ComposedOnASmallPhone: Story = {
  name: "Composed on a small phone",
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  tags: ["narrow"],
  render: () => <RecordedRuns />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(340));
    const region = within(canvasElement).getByRole("region", { name: "Recorded runs" });
    await expect(headerLayout(region)).toEqual({
      wrapped: true,
      roomBeside: false,
      atEnd: true,
      brokenWords: [],
    });
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

/** In a 320px panel on a wide screen the header reads its own width, not the window's: a long title with two actions puts them on the next row, while a short title keeps its action beside it, because the heading's measure is never wider than the heading itself. */
export const InANarrowPanel: Story = {
  name: "In a narrow panel",
  tags: ["narrow"],
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Stack space="space.400">
        <RecordedRuns title="Recorded test runs across every assessment campaign" />
        <Section title="Evidence" count={3} action={<Button size="small">Attach file</Button>}>
          Three files attached.
        </Section>
        <Section title="Comments" action={<Button size="small">Create comment</Button>}>
          No comments yet.
        </Section>
      </Stack>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const runs = canvas.getByRole("region", {
      name: "Recorded test runs across every assessment campaign",
    });
    await expect(headerLayout(runs)).toEqual({
      wrapped: true,
      roomBeside: false,
      atEnd: true,
      brokenWords: [],
    });
    const evidence = canvas.getByRole("region", { name: "Evidence" });
    await expect(headerLayout(evidence)).toEqual({
      wrapped: false,
      roomBeside: true,
      atEnd: true,
      brokenWords: [],
    });
    // A short title beside a mid-size action: 12rem beside the action would not fit in 320px,
    // but the title's own width does, so the header stays one row.
    const comments = canvas.getByRole("region", { name: "Comments" });
    await expect(headerLayout(comments)).toEqual({
      wrapped: false,
      roomBeside: true,
      atEnd: true,
      brokenWords: [],
    });
  },
};

/** No title and no heading: a plain container, not a named region. */
export const Untitled: Story = {
  render: () => <Section>Nothing attached yet.</Section>,
  play: async ({ canvasElement }) => {
    const section = canvasElement.querySelector('[data-slot="section"]');
    await expect(section).toBeInTheDocument();
    await expect(section).not.toHaveAttribute("aria-labelledby");
    await expect(within(canvasElement).queryByRole("region")).toBeNull();
  },
};

/** Levels follow the outline. A Section's title takes the contextual level, an h2 outside every provider, and its content one level below, so a Section inside a Section is an h3 and a Heading inside it without `as` is an h4. Inside a HeadingLevelProvider (here at 3, as under a preview's record title) the whole tree starts one lower. An untitled Section changes nothing. */
export const Nested: Story = {
  render: () => (
    <Stack space="space.400">
      <Section title="Requirement details">
        <Section title="Statement">
          <Heading size="xsmall">Rationale</Heading>
          <Text>The system enforces approved authorizations for logical access.</Text>
        </Section>
      </Section>
      <HeadingLevelProvider level={3}>
        <Section>
          <Section title="Acceptance criteria">Two criteria recorded.</Section>
        </Section>
      </HeadingLevelProvider>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const level = (name: string) => canvas.getByRole("heading", { name }).tagName;
    await expect(level("Requirement details")).toBe("H2");
    await expect(level("Statement")).toBe("H3");
    await expect(level("Rationale")).toBe("H4");
    await expect(level("Acceptance criteria")).toBe("H3");
    const outer = canvas.getByRole("region", { name: "Requirement details" });
    await expect(within(outer).getByRole("region", { name: "Statement" })).toBeVisible();
  },
};

const changeBaseline = fn();
const toggled = fn();

/** `isCollapsible` folds the content under the title, closed until the reader opens it: the contract's collapsed Details section. The title and its Count are a button inside the heading, the chevron after them turns while the content is open, and the action stays outside the heading. Closed content stays mounted and hidden until found, so find-in-page opens it and a draft inside survives. */
export const Collapsible: Story = {
  render: () => (
    <Stack space="space.400">
      <Section
        title="Baseline details"
        count={12}
        isCollapsible
        onOpenChange={toggled}
        action={
          <Button size="small" onClick={changeBaseline}>
            Change baseline
          </Button>
        }
      >
        <Stack space="space.100">
          <KeyValue label="Profile">Moderate baseline, tailored</KeyValue>
          <KeyValue label="Source">NIST SP 800-53 Rev 5</KeyValue>
          <KeyValue label="Selected controls">287</KeyValue>
        </Stack>
      </Section>
      <Section title="Reference notes" isCollapsible defaultOpen divided>
        <Stack space="space.050">
          <Text>Two controls cite a withdrawn enhancement.</Text>
          <TextLink href="#withdrawn-enhancements">Withdrawn enhancements</TextLink>
        </Stack>
      </Section>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Baseline details 12" });
    const heading = canvas.getByRole("heading", { name: "Baseline details 12" });
    await expect(heading.tagName).toBe("H2");
    await expect(heading).toContainElement(trigger);
    await expect(canvas.getByRole("region", { name: "Baseline details 12" })).toBeVisible();
    // The action sits outside the heading and works on its own.
    await expect(
      within(heading).queryByRole("button", { name: "Change baseline" }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Change baseline" }));
    await expect(changeBaseline).toHaveBeenCalledTimes(1);
    // Closed by default: the content is mounted and hidden until found.
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    const profile = canvas.getByText("Moderate baseline, tailored");
    await expect(profile).not.toBeVisible();
    const chevron = trigger.querySelector("[data-slot=collapsible-header-icon]");
    await expect(getComputedStyle(chevron!).rotate).toBe("none");
    // Pointer and keyboard both open it; the chevron turns, focus stays on the trigger.
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("data-panel-open");
    await expect(
      document.getElementById(trigger.getAttribute("aria-controls") ?? ""),
    ).toContainElement(profile);
    await expect(toggled).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(profile).toBeVisible());
    await waitFor(() => expect(getComputedStyle(chevron!).rotate).toBe("180deg"));
    // Settled open, the content stops clipping, so a focus ring at its edge shows whole.
    const content = profile.closest<HTMLElement>("[data-slot=section-content]")!;
    await waitFor(() => expect(getComputedStyle(content).overflow).toBe("visible"));
    await userEvent.keyboard("{Enter}");
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(profile).not.toBeVisible());
    // No movement under reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      await expect(getComputedStyle(chevron!).transitionProperty).toBe("none");
    // Opened by default.
    await expect(canvas.getByRole("button", { name: "Reference notes" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(canvas.getByText("Two controls cite a withdrawn enhancement.")).toBeVisible();
    // Open from the start, a link at the content's edge keeps its whole focus ring.
    const link = canvas.getByRole("link", { name: "Withdrawn enhancements" });
    const notes = link.closest<HTMLElement>("[data-slot=section-content]")!;
    await expect(getComputedStyle(notes).overflow).toBe("visible");
    link.focus();
    await expect(link).toHaveFocus();
  },
};

/** A page with a panel open beside it. The panel is rendered from inside the page's "Open findings" Section, yet its outline starts at 2, because the panel is a landmark of its own beside Main: its title is an h2 and a Section in its body an h3. With no title, as in a preview, the body starts at 2, so the inner record title is an h2 and the content after it goes one below through a HeadingLevelProvider. */
function PanelOutline({ titled }: { titled: boolean }) {
  return (
    <Shell>
      <Shell.Main>
        <Stack space="space.300">
          <PageHeader>
            <PageHeader.Title>Findings</PageHeader.Title>
          </PageHeader>
          <Section title="Open findings">
            <Text>Twelve open, three need review.</Text>
            {titled ? (
              <Shell.Panel title="Incomplete account review" onClose={() => undefined}>
                <Section title="Evidence">Two files attached.</Section>
              </Shell.Panel>
            ) : (
              <Shell.Panel label="Finding preview" onClose={() => undefined}>
                <Shell.Panel.Header>
                  <Shell.Panel.Close label="Close preview" />
                </Shell.Panel.Header>
                <Shell.Panel.Body>
                  <Stack space="space.200">
                    <PageHeader>
                      <PageHeader.Title>Incomplete account review</PageHeader.Title>
                      <PageHeader.Actions>
                        <Button size="small" variant="primary">
                          Edit finding
                        </Button>
                      </PageHeader.Actions>
                    </PageHeader>
                    <HeadingLevelProvider>
                      <Section title="Evidence">Two files attached.</Section>
                    </HeadingLevelProvider>
                  </Stack>
                </Shell.Panel.Body>
              </Shell.Panel>
            )}
          </Section>
        </Stack>
      </Shell.Main>
    </Shell>
  );
}

/** A titled panel: the h2 names it and a Section in its body is an h3, wherever in the route the panel is rendered from. */
export const InATitledPanel: Story = {
  name: "In a titled panel",
  // A page with its shell: the page-level layout the contained check does not frame.
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <PanelOutline titled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByRole("complementary", { name: "Incomplete account review" });
    const level = (name: string) => within(panel).getByRole("heading", { name }).tagName;
    await expect(level("Incomplete account review")).toBe("H2");
    await expect(level("Evidence")).toBe("H3");
    await expect(canvas.getByRole("heading", { name: "Open findings" }).tagName).toBe("H2");
  },
};

/** A preview: the panel has no title, so its body starts at 2. The inner record title is an h2 in the Title's own style, and the Section after it an h3. */
export const InAPreviewPanel: Story = {
  name: "In a preview panel",
  // A page with its shell: the page-level layout the contained check does not frame.
  parameters: { layout: "fullscreen" },
  globals: { viewport: { value: "ledgerWide", isRotated: false } },
  render: () => <PanelOutline titled={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByRole("complementary", { name: "Finding preview" });
    const title = within(panel).getByRole("heading", { name: "Incomplete account review" });
    await expect(title.tagName).toBe("H2");
    await expect(title).toHaveAttribute("data-slot", "page-header-title");
    await expect(within(panel).getByRole("heading", { name: "Evidence" }).tagName).toBe("H3");
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  },
};
