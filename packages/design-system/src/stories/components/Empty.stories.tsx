import { useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  CloudOff,
  FolderOpen,
  Link2,
  MessageSquare,
  Paperclip,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Upload,
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
  LinkButton,
  TextLink,
  type EmptyIllustrationKind,
} from "../../components";
import { Section } from "../../layout";
import { Grid, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Empty",
  component: Empty,
  parameters: { layout: "padded" },
  args: { size: "default", frame: "dashed", ref: fn() },
} satisfies Meta<typeof Empty>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The register with nothing in it yet: the picture, the message, the first action and a quieter one beside it. */
export const Playground: Story = {
  render: function Example(args) {
    const id = useId();
    const [created, setCreated] = useState(false);
    return (
      <Empty {...args} role="region" aria-labelledby={id}>
        <EmptyMedia aria-hidden>
          <EmptyIllustration kind="records" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle id={id}>{created ? "First program created" : "No programs yet"}</EmptyTitle>
          <EmptyDescription>
            A program holds the systems it assures, their requirements and the work that proves
            them. Create one to start.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="primary" iconBefore={<Plus />} onClick={() => setCreated(true)}>
            New program
          </Button>
          <Button variant="secondary" iconBefore={<Upload />}>
            Import
          </Button>
        </EmptyContent>
        <EmptyContent>
          <TextLink href="#programs-help" size="small">
            What goes in a program
          </TextLink>
        </EmptyContent>
      </Empty>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(args.ref).toHaveBeenCalledWith(
      canvas.getByRole("region", { name: "No programs yet" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "New program" }));
    await expect(canvas.getByRole("region", { name: "First program created" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "What goes in a program" })).toHaveAttribute(
      "href",
      "#programs-help",
    );
  },
};

/** A search or a filter that left nothing. The way out is the action: clear it. Suggestions under it are a second EmptyContent. */
export const NoMatches: Story = {
  name: "No matches",
  render: () => (
    <Empty>
      <EmptyMedia aria-hidden>
        <EmptyIllustration kind="search" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>Nothing matches</EmptyTitle>
        <EmptyDescription>
          Clear the search or a filter to see every control, or try one of these.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Clear filters</Button>
        <Button variant="subtle" iconBefore={<SlidersHorizontal />}>
          Edit filters
        </Button>
      </EmptyContent>
      <EmptyContent>
        <Text size="small" color="color.text.subtlest">
          Try
        </Text>
        <Button size="small" variant="secondary">
          AC-2
        </Button>
        <Button size="small" variant="secondary">
          Access control
        </Button>
        <Button size="small" variant="secondary">
          Owner: Dana
        </Button>
      </EmptyContent>
    </Empty>
  ),
};

/** Every picture the kit draws, each with the region it is for. */
const kinds: { kind: EmptyIllustrationKind; title: string; description: string }[] = [
  {
    kind: "records",
    title: "No programs yet",
    description: "Nothing exists. The first action creates it.",
  },
  {
    kind: "search",
    title: "Nothing matches",
    description: "Something exists, but not under this search or filter.",
  },
  {
    kind: "done",
    title: "Nothing open",
    description: "The list is empty because the work is finished.",
  },
  {
    kind: "inbox",
    title: "Nothing assigned to you",
    description: "Work handed to you waits here.",
  },
  { kind: "locked", title: "No access", description: "This register is for the program's owners." },
  {
    kind: "shield",
    title: "No controls allocated",
    description: "Requirements and controls, once mapped.",
  },
  { kind: "document", title: "No evidence yet", description: "Files, records and their versions." },
  { kind: "tasks", title: "No tasks yet", description: "The work to do, and who does it." },
  {
    kind: "people",
    title: "No owners yet",
    description: "The people accountable for this record.",
  },
  {
    kind: "tree",
    title: "No systems yet",
    description: "Systems, their subsystems and components.",
  },
  { kind: "chart", title: "Nothing to chart", description: "Metrics appear once records exist." },
  {
    kind: "calendar",
    title: "Nothing scheduled",
    description: "Assessments, milestones and reviews.",
  },
];

export const Illustrations: Story = {
  render: () => (
    <Grid templateColumns="repeat(auto-fit, minmax(min(100%, 280px), 1fr))" gap="space.200">
      {kinds.map(({ kind, title, description }) => (
        <Empty key={kind}>
          <EmptyMedia aria-hidden>
            <EmptyIllustration kind={kind} />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Text size="xsmall" color="color.text.subtlest">
              kind="{kind}"
            </Text>
          </EmptyContent>
        </Empty>
      ))}
    </Grid>
  ),
  play: async ({ canvasElement }) => {
    const scenes = canvasElement.querySelectorAll<HTMLElement>('[data-slot="empty-illustration"]');
    await expect(scenes).toHaveLength(kinds.length);
    const forced = matchMedia("(forced-colors: active)").matches;
    for (const scene of scenes) {
      const kind = scene.getAttribute("data-kind");
      // Decorative: hidden from assistive technology, 128 by 84 whatever the kind.
      await expect(scene).toHaveAttribute("aria-hidden", "true");
      await expect(scene.getBoundingClientRect().width).toBe(128);
      await expect(scene.getBoundingClientRect().height).toBe(84);
      // The front surface paints over the surfaces behind it: what the point at its centre hits
      // is the front surface or something drawn on it, never the page behind.
      const front = scene.querySelector<HTMLElement>('[data-part="front"]');
      await expect(front, `${kind} marks its front surface`).not.toBeNull();
      front!.scrollIntoView({ block: "center" });
      const box = front!.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      await expect(front!.contains(hit), `${kind}'s front surface is topmost`).toBe(true);
      // In forced colours the scene keeps its drawing: an edge on the front surface.
      if (forced) {
        await expect(getComputedStyle(scene).forcedColorAdjust).toBe("none");
        const style = getComputedStyle(front!);
        if (style.borderTopStyle === "solid")
          await expect(style.borderTopColor).not.toBe(style.backgroundColor);
      }
    }
  },
};

/** An icon in the neutral circle instead of a picture, for a smaller region: a tab, a card body. */
export const Icon: Story = {
  render: () => (
    <Empty className="max-w-layout-measure">
      <EmptyMedia variant="icon" aria-hidden>
        <Paperclip />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No attachments</EmptyTitle>
        <EmptyDescription>Files attached to this finding appear here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="small" iconBefore={<Upload />}>
          Attach a file
        </Button>
      </EmptyContent>
    </Empty>
  ),
};

/** `frame="none"` on a surface that already bounds it. Here the page: the region is tall and the message sits at its centre. */
export const OnAPage: Story = {
  name: "On a page",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="flex min-h-work flex-col">
      <Empty frame="none" className="grow">
        <EmptyMedia aria-hidden>
          <EmptyIllustration kind="tree" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Choose a program</EmptyTitle>
          <EmptyDescription>
            Its systems, requirements and assurance work open here. Pick one from the list, or
            create the first.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="primary" iconBefore={<Plus />}>
            New program
          </Button>
          <Button variant="secondary" iconBefore={<FolderOpen />}>
            Browse programs
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  ),
};

/** The rail's row: media beside the message, left-aligned, no frame. Inside a Card, or bare. */
export const Compact: Story = {
  render: () => (
    <div className="flex flex-col gap-200" style={{ maxWidth: 320 }}>
      <Card>
        <CardContent>
          <Empty size="compact">
            <EmptyMedia variant="icon" aria-hidden>
              <Link2 />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Nothing linked yet</EmptyTitle>
              <EmptyDescription>Link the findings this control answers.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="small" variant="link">
                Link a finding
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
      <Empty size="compact">
        <EmptyHeader>
          <EmptyTitle>No evidence yet</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [row] = canvasElement.querySelectorAll<HTMLElement>('[data-slot="empty"]');
    const part = (slot: string) =>
      row!.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!.getBoundingClientRect();
    // The icon takes the first column; the message and the action share the second, left-aligned.
    await expect(part("empty-icon").right).toBeLessThanOrEqual(part("empty-header").left);
    await expect(Math.abs(part("empty-content").left - part("empty-header").left)).toBeLessThan(1);
    await expect(part("empty-content").top).toBeGreaterThanOrEqual(part("empty-header").bottom);
    await expect(row!.querySelector('[data-slot="empty-icon"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    // A compact title is body text, not a heading.
    await expect(within(row!).queryByRole("heading")).toBeNull();
  },
};

/** An unbroken code, hash or address in the title or the description wraps inside the message's measure, so the centred block never widens past its frame or the page. */
export const LongContent: Story = {
  name: "Long content",
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Empty>
        <EmptyMedia aria-hidden>
          <EmptyIllustration kind="document" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No evidence for WS-X90_Expanded_Control_Set_Revision_Seven</EmptyTitle>
          <EmptyDescription>
            Nothing is filed under
            sha256:4f1c9a2b7e0d3c6f8a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6071 yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-slot="empty"]')!;
    const edges = frame.getBoundingClientRect();
    for (const slot of ["empty-title", "empty-description"]) {
      const node = frame.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
      const box = node.getBoundingClientRect();
      await expect(box.left).toBeGreaterThanOrEqual(edges.left - 1);
      await expect(box.right).toBeLessThanOrEqual(edges.right + 1);
      await expect(node.scrollWidth).toBeLessThanOrEqual(node.clientWidth + 1);
    }
    const page = document.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
  },
};

/** A record that does not exist, where its page would be: the search picture, a title that names what is missing, why, and the route back. On a record page the title is the page's h1. */
export const NotFound: Story = {
  name: "Not found",
  render: () => (
    <Empty frame="none">
      <EmptyMedia aria-hidden>
        <EmptyIllustration kind="search" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle render={<h1 />}>Task not found</EmptyTitle>
        <EmptyDescription>
          It was deleted, or the link is wrong. Your tasks are still in My work.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <LinkButton href="#my-work">Go to My work</LinkButton>
      </EmptyContent>
    </Empty>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "Task not found" })).toBeVisible();
    // The way back is a link, not a button that navigates.
    await expect(canvas.getByRole("link", { name: "Go to My work" })).toHaveAttribute(
      "href",
      "#my-work",
    );
  },
};

/** A page or a region that could not load and has nothing else to show: an icon, what failed, and Retry. Where other content stays on the page, the failure is an Alert beside it instead. */
export const FailedToLoad: Story = {
  name: "Failed to load",
  render: function Example() {
    const [tries, setTries] = useState(0);
    return (
      <Empty>
        <EmptyMedia variant="icon" aria-hidden>
          <CloudOff />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>The evidence could not be loaded</EmptyTitle>
          <EmptyDescription>
            {tries ? "It still could not be loaded. " : ""}Check the connection, then try again.
            Nothing you entered is lost.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button iconBefore={<RotateCcw />} onClick={() => setTries((n) => n + 1)}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "The evidence could not be loaded" }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
    await expect(canvas.getByText(/It still could not be loaded/)).toBeVisible();
  },
};

/** The title is a heading in the default size, at the contextual level: an h2 where nothing sets one (a register under the page's h1), one below a titled Section (an h3 here). `render` sets the element outright, an h1 where the Empty is a missing record's page. In compact, a rail's row, it is body text. */
export const TitleLevel: Story = {
  name: "Title level",
  render: () => (
    <Stack space="space.300">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No programs yet</EmptyTitle>
          <EmptyDescription>Create one to define its systems and their work.</EmptyDescription>
        </EmptyHeader>
      </Empty>
      <Section title="Evidence">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No evidence yet</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </Section>
      <Empty frame="none">
        <EmptyMedia aria-hidden>
          <EmptyIllustration kind="search" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle render={<h1 />}>Task not found</EmptyTitle>
          <EmptyDescription>It was deleted or never existed.</EmptyDescription>
        </EmptyHeader>
      </Empty>
      <Empty size="compact">
        <EmptyHeader>
          <EmptyTitle>Nothing linked yet</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "No programs yet" }).tagName).toBe("H2");
    await expect(canvas.getByRole("heading", { name: "No evidence yet" }).tagName).toBe("H3");
    await expect(canvas.getByRole("heading", { name: "Task not found" }).tagName).toBe("H1");
    await expect(canvas.queryByRole("heading", { name: "Nothing linked yet" })).toBeNull();
    // One style whatever the element: the rendered h1 keeps the default title's classes.
    await expect(canvas.getByRole("heading", { name: "Task not found" }).className).toBe(
      canvas.getByRole("heading", { name: "No programs yet" }).className,
    );
  },
};

/** Every shape at once, for the mode toggle: the hero on its frame, the twelve pictures, the icon, the compact row. */
export const EmptyMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      {Playground.render?.({ size: "default", frame: "dashed", ref: fn() }, {} as never)}
      {NoMatches.render?.({}, {} as never)}
      {Illustrations.render?.({}, {} as never)}
      {Icon.render?.({}, {} as never)}
      {Compact.render?.({}, {} as never)}
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Empty>
            <EmptyMedia aria-hidden>
              <EmptyIllustration kind="search" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Nothing matches</EmptyTitle>
              <EmptyDescription>Clear the search or a filter to see every row.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button>Clear filters</Button>
            </EmptyContent>
          </Empty>
        }
        doText="A filtered table says what emptied it and offers the way out: the reader is one click from the rows."
        dont={
          <div className="flex min-h-control-large items-center px-200 py-300">
            <Text size="small" color="color.text.subtlest">
              No results.
            </Text>
          </div>
        }
        dontText="A grey line where the rows were. It reads as a failed row, says nothing about why, and leaves the filter in place."
      />
      <Pair
        do={
          <Empty>
            <EmptyMedia aria-hidden>
              <EmptyIllustration kind="records" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No programs yet</EmptyTitle>
              <EmptyDescription>Create one to define its systems and their work.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="primary" iconBefore={<Plus />}>
                New program
              </Button>
            </EmptyContent>
          </Empty>
        }
        doText="One primary action, the same verb as the page's. The reader knows what happens next."
        dont={
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No programs yet</EmptyTitle>
              <EmptyDescription>Choose another status tab.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        dontText="Advice without an action, pointing at a control the reader has to find. A tab is not a way out of an empty table."
      />
      <Pair
        do={
          <Section title="Comments" action={<Button size="small">Create comment</Button>}>
            <Empty size="compact">
              <EmptyMedia variant="icon" aria-hidden>
                <MessageSquare />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No comments yet</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </Section>
        }
        doText="Where the Section's header already carries the create action, the compact Empty under it says what is missing and stops. One icon, one action on the page."
        dont={
          <Section title="Notes" action={<Button size="small">Create note</Button>}>
            <Empty>
              <EmptyMedia aria-hidden>
                <EmptyIllustration kind="inbox" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No notes yet</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button size="small">Create note</Button>
              </EmptyContent>
            </Empty>
          </Section>
        }
        dontText="The same action twice, a tab stop apart, and a full scene in a section's row. The inbox picture is for work assigned to the reader, not for notes on a record."
      />
    </Stack>
  ),
};
