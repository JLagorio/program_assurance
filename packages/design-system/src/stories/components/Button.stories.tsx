import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ArrowRight,
  ChevronDown,
  Download,
  Filter,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Button, ButtonGroup, IconButton, TextLink } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "padded" },
  args: { children: "Schedule assessment" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

const variants = ["primary", "secondary", "subtle", "danger", "link"] as const;
const sizes = ["medium", "small", "xsmall"] as const;

/** Every variant down the side; the three sizes, then disabled, selected, loading and with an icon across. */
export const Matrix: Story = {
  tags: ["matrix"],
  render: () => (
    <Stack space="space.300">
      {variants.map((v) => (
        <Inline key={v} space="space.300" alignBlock="center">
          <Text size="xsmall" color="color.text.subtlest" className="w-800">
            {v}
          </Text>
          {sizes.map((s) => (
            <Button key={s} variant={v} size={s}>
              Schedule assessment
            </Button>
          ))}
          <Button variant={v} disabled>
            Disabled
          </Button>
          <Button variant={v} isSelected>
            Selected
          </Button>
          <Button variant={v} isLoading>
            Saving
          </Button>
          <Button variant={v} iconBefore={<Plus />}>
            With icon
          </Button>
        </Inline>
      ))}
    </Stack>
  ),
};

/** `icon` is the element, passed bare; `label` is the accessible name and the tooltip. */
export const IconButtons: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <IconButton label="Search" icon={<Search />} />
      <IconButton label="Settings" variant="subtle" icon={<Settings />} />
      <IconButton label="Download" size="medium" icon={<Download />} />
      <IconButton label="Filters" isSelected icon={<Filter />} />
      <IconButton label="Refreshing" isLoading icon={<Search />} />
      <IconButton label="Disabled" disabled icon={<Search />} />
    </Inline>
  ),
};

/** The button sizes the icon and sets the gap; the element is passed bare. */
export const Icons: Story = {
  render: () => (
    <Inline space="space.200" alignBlock="center">
      <Button iconBefore={<Plus />}>Add control</Button>
      <Button iconAfter={<ChevronDown />}>Views</Button>
      <Button variant="link" iconAfter={<ArrowRight />}>
        Risk register
      </Button>
      <Button variant="primary" iconBefore={<Download />}>
        Export
      </Button>
      <IconButton label="Edit" variant="subtle" icon={<Pencil />} />
    </Inline>
  ),
};

function LoadingDemo() {
  const [saving, setSaving] = useState(false);
  return (
    <Inline space="space.200" alignBlock="center">
      <Button
        variant="primary"
        isLoading={saving}
        onClick={() => {
          setSaving(true);
          setTimeout(() => setSaving(false), 1800);
        }}
      >
        Save changes
      </Button>
      <Button isLoading>Syncing</Button>
      <Button variant="subtle" isLoading iconBefore={<Plus />}>
        Adding
      </Button>
      <Button variant="danger" isLoading>
        Deleting
      </Button>
    </Inline>
  );
}

/** Press Save: the spinner takes the icon's place, the label stays, clicks are ignored and focus is kept. */
export const Loading: Story = { render: () => <LoadingDemo /> };

/** `isFullWidth` fills the container: a sheet's footer, a narrow form. */
export const FullWidth: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <Stack space="space.100">
        <Button variant="primary" isFullWidth>
          Submit package
        </Button>
        <Button isFullWidth iconBefore={<Download />}>
          Download the report
        </Button>
      </Stack>
    </div>
  ),
};

/** One primary per view. What sits beside it steps down; a toolbar has no primary at all. */
export const Emphasis: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="A dialog's footer: the primary on the right, cancel subtle">
        <Button variant="subtle">Cancel</Button>
        <Button variant="primary">Save changes</Button>
      </Specimens>
      <Specimens title="A page header: one primary, the rest secondary">
        <Button variant="primary" iconBefore={<Plus />}>
          New program
        </Button>
        <Button iconBefore={<Download />}>Export</Button>
        <Button iconAfter={<ChevronDown />}>Views</Button>
      </Specimens>
      <Specimens title="A toolbar: subtle, small; a ButtonGroup where two controls act as one">
        <Button variant="subtle" size="small" iconBefore={<Filter />}>
          Filters
        </Button>
        <ButtonGroup>
          <Button size="small">Export</Button>
          <IconButton size="small" label="Export options" icon={<ChevronDown />} />
        </ButtonGroup>
      </Specimens>
      <Specimens title="A destructive decision: danger, after the AlertDialog asks">
        <Button variant="subtle">Cancel</Button>
        <Button variant="danger" iconBefore={<Trash2 />}>
          Delete program
        </Button>
      </Specimens>
    </Stack>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Inline space="space.200" alignBlock="center">
      <Button asChild variant="primary">
        <a href="#top">A link that looks like a button</a>
      </Button>
      <TextLink>
        <a href="#top">A link that reads as text</a>
      </TextLink>
      <Button variant="secondary" iconAfter={<ChevronDown />}>
        Open
      </Button>
    </Inline>
  ),
};

/** Navigation that reads as text. The child (a router's Link; an anchor here) takes the classes; `asChild={false}` renders an anchor from `href`. */
export const TextLinks: Story = {
  render: () => (
    <Stack space="space.200">
      <Text>
        The finding was raised against{" "}
        <TextLink>
          <a href="#ctrl">AC-2(4)</a>
        </TextLink>{" "}
        and traces to{" "}
        <TextLink>
          <a href="#req">REQ-0118</a>
        </TextLink>
        .
      </Text>
      <Inline space="space.300" alignBlock="baseline">
        <TextLink size="small">
          <a href="#a">Small</a>
        </TextLink>
        <TextLink size="medium">
          <a href="#b">Medium</a>
        </TextLink>
        <TextLink weight="medium">
          <a href="#c">Medium weight</a>
        </TextLink>
        <TextLink asChild={false} href="#d">
          An anchor from href
        </TextLink>
      </Inline>
    </Stack>
  ),
};

/** Inherited, small and medium sizes by weight; a TextLink beside a Button link, which is an action and not navigation. */
export const TextLinkMatrix: Story = {
  tags: ["matrix"],
  render: () => (
    <Stack space="space.300">
      <Grid
        rows={["inherit", "small", "medium"] as const}
        cols={["regular", "medium"] as const}
        rowLabel="size"
        render={(size, weight) => (
          <TextLink
            asChild={false}
            href="#x"
            size={size === "inherit" ? undefined : size}
            weight={weight}
          >
            Open the full record
          </TextLink>
        )}
      />
      <Specimens title="TextLink beside Button link">
        <TextLink asChild={false} href="#x">
          Navigation: TextLink
        </TextLink>
        <Button variant="link">Action: Button link</Button>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.100">
            <Button variant="subtle">Cancel</Button>
            <Button variant="primary">Submit package</Button>
          </Inline>
        }
        doText="One primary. The other actions step down."
        dont={
          <Inline space="space.100">
            <Button variant="primary">Cancel</Button>
            <Button variant="primary">Submit package</Button>
          </Inline>
        }
        dontText="Two primaries. Nothing is the one thing to do."
      />
      <Pair
        do={
          <Text>
            Traces to{" "}
            <TextLink asChild={false} href="#req">
              REQ-0118
            </TextLink>
            .
          </Text>
        }
        doText="Navigation reads as text: TextLink."
        dont={
          <Text>
            Traces to <Button variant="link">REQ-0118</Button>.
          </Text>
        }
        dontText="A Button that looks like a link is for an action in place, not a destination."
      />
      <Pair
        do={<Button iconBefore={<Download />}>Export report</Button>}
        doText="A verb and its object, sentence case, no punctuation."
        dont={<Button iconBefore={<Download />}>Click here to export!</Button>}
        dontText="Filler and a shout, and the reader still has to guess what is exported."
      />
      <Pair
        do={
          <Inline space="space.100">
            <Button variant="subtle">Cancel</Button>
            <Button variant="danger">Delete program</Button>
          </Inline>
        }
        doText="Danger for what destroys, after the AlertDialog asks."
        dont={
          <Inline space="space.100">
            <Button variant="subtle">Cancel</Button>
            <Button variant="danger">Archive program</Button>
          </Inline>
        }
        dontText="Archiving can be undone. A recoverable action is secondary or primary, never danger."
      />
    </Stack>
  ),
};

export const Playground: Story = { args: { variant: "primary", size: "medium" } };
