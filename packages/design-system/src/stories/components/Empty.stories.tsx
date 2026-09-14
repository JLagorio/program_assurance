import { useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { FolderOpen, Link2, Paperclip, Plus, SlidersHorizontal, Upload } from "lucide-react";

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
  TextLink,
  type EmptyIllustrationKind,
} from "../../components";
import { Stack, Text } from "../../primitives";
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
  { kind: "records", title: "No programs yet", description: "Nothing exists. The first action creates it." },
  { kind: "search", title: "Nothing matches", description: "Something exists, but not under this search or filter." },
  { kind: "done", title: "Nothing open", description: "The list is empty because the work is finished." },
  { kind: "inbox", title: "Nothing assigned to you", description: "Work handed to you waits here." },
  { kind: "locked", title: "No access", description: "This register is for the program's owners." },
  { kind: "shield", title: "No controls allocated", description: "Requirements and controls, once mapped." },
  { kind: "document", title: "No evidence yet", description: "Files, records and their versions." },
  { kind: "tasks", title: "No tasks yet", description: "The work to do, and who does it." },
  { kind: "people", title: "No owners yet", description: "The people accountable for this record." },
  { kind: "tree", title: "No systems yet", description: "Systems, their subsystems and components." },
  { kind: "chart", title: "Nothing to chart", description: "Metrics appear once records exist." },
  { kind: "calendar", title: "Nothing scheduled", description: "Assessments, milestones and reviews." },
];

export const Illustrations: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-200 md:grid-cols-2 lg:grid-cols-3">
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
    </div>
  ),
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
    </Stack>
  ),
};
