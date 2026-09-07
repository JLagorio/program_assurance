import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Download, Filter, MoreHorizontal, Pencil, Search, Settings, Trash2, X } from "lucide-react";

import { Button, ButtonGroup, IconButton } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: { layout: "padded" },
  args: { label: "Search", icon: <Search /> },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Both variants down the side; the two sizes, then selected, loading and disabled across. */
export const IconButtonMatrix: Story = {
  render: () => (
    <Grid
      rows={["secondary", "subtle"] as const}
      cols={["small", "medium", "selected", "loading", "disabled"] as const}
      render={(variant, col) => (
        <IconButton
          label="Search"
          icon={<Search />}
          variant={variant}
          size={col === "medium" ? "medium" : "small"}
          isSelected={col === "selected"}
          isLoading={col === "loading"}
          disabled={col === "disabled"}
        />
      )}
    />
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

/** Where an IconButton belongs: a toolbar, a row's actions, a header's close, the chevron of a joined pair. */
export const InPlace: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="A toolbar: subtle, small, the label visible on hover">
        <IconButton label="Filters" variant="subtle" icon={<Filter />} />
        <IconButton label="Settings" variant="subtle" icon={<Settings />} />
        <IconButton label="More" variant="subtle" icon={<MoreHorizontal />} />
      </Specimens>
      <Specimens title="A row's actions, beside the text they act on">
        <Text>Legacy billing gateway</Text>
        <IconButton label="Edit" variant="subtle" icon={<Pencil />} />
        <IconButton label="More actions" variant="subtle" icon={<MoreHorizontal />} />
      </Specimens>
      <Specimens title="A joined pair: the action and its options">
        <ButtonGroup>
          <Button size="small">Export</Button>
          <IconButton size="small" label="Export options" icon={<ChevronDown />} />
        </ButtonGroup>
      </Specimens>
      <Specimens title="A header's close, medium beside medium controls">
        <IconButton label="Close" variant="subtle" size="medium" icon={<X />} />
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
            <Button variant="danger" iconBefore={<Trash2 />}>
              Delete program
            </Button>
          </Inline>
        }
        doText="A destructive action carries its word."
        dont={<IconButton label="Delete program" icon={<Trash2 />} />}
        dontText="An icon alone for Delete. The reader finds out what it did after it did it."
      />
      <Pair
        do={<IconButton label="Search" icon={<Search />} />}
        doText="The label names the action: Search."
        dont={<IconButton label="Magnifier" icon={<Search />} />}
        dontText="The label names the picture. A screen reader hears 'Magnifier' and learns nothing."
      />
    </Stack>
  ),
};

export const Playground: Story = { args: { variant: "secondary", size: "small" } };
