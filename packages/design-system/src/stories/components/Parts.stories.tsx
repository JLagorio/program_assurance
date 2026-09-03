import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlignLeft, Bold, Italic, List, Pin, ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  Button,
  ButtonGroup,
  IconButton,
  Kbd,
  Separator,
  Skeleton,
  Spinner,
  Toggle,
  ToggleGroup,
} from "../../components";
import { Inline, Stack, Text, Box } from "../../primitives";
import { Matrix, Specimens, bothModes } from "../_lib/matrix";

const meta = {
  title: "Components/Parts",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

function Toggles() {
  const [view, setView] = useState<"table" | "board" | "timeline">("table");
  return (
    <Stack space="space.300">
      <Inline space="space.200" alignBlock="center">
        <Toggle aria-label="Bold" defaultPressed>
          <Bold className="size-icon-small" />
        </Toggle>
        <Toggle aria-label="Italic">
          <Italic className="size-icon-small" />
        </Toggle>
        <Toggle aria-label="Pin" size="small">
          <Pin className="size-150" />
          Pinned
        </Toggle>
        <Toggle aria-label="Disabled" disabled>
          <List className="size-icon-small" />
        </Toggle>
        <Separator orientation="vertical" />
        <ToggleGroup
          aria-label="View"
          value={view}
          onChange={setView}
          items={[
            { value: "table", label: "Table" },
            { value: "board", label: "Board" },
            { value: "timeline", label: "Timeline", disabled: true },
          ]}
        />
      </Inline>
      <Inline space="space.200" alignBlock="center">
        <ButtonGroup>
          <Button size="small">Day</Button>
          <Button size="small" isSelected>
            Week
          </Button>
          <Button size="small">Month</Button>
        </ButtonGroup>
        <ButtonGroup>
          <IconButton label="Align left">
            <AlignLeft className="size-icon-small" />
          </IconButton>
          <IconButton label="Bold">
            <Bold className="size-icon-small" />
          </IconButton>
          <IconButton label="Italic">
            <Italic className="size-icon-small" />
          </IconButton>
        </ButtonGroup>
      </Inline>
    </Stack>
  );
}

export const TogglesStory: Story = { name: "Toggles", render: () => <Toggles /> };

export const Small: Story = {
  render: () => (
    <Stack space="space.300">
      <Inline space="space.200" alignBlock="center">
        <Text color="color.text.subtle">Search</Text>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        <Separator orientation="vertical" />
        <Spinner />
        <Spinner size="medium" />
        <Text color="color.text.subtle">Saving…</Text>
      </Inline>
      <Separator />
      <Stack space="space.200" className="max-w-[360px]">
        <Skeleton className="h-250 w-1/2" />
        <Skeleton lines={3} />
      </Stack>
    </Stack>
  ),
};

/** Groups by size and variant, a split group, and a disabled member. */
export const ButtonGroupMatrix: Story = {
  decorators: [bothModes],
  render: () => (
    <Matrix
      rows={["secondary", "subtle"] as const}
      cols={["small", "medium"] as const}
      render={(variant, size) => (
        <ButtonGroup>
          <Button variant={variant} size={size}>
            Approve
          </Button>
          <Button variant={variant} size={size} disabled={size === "medium"}>
            Reject
          </Button>
          <IconButton label="More" variant={variant} size={size}>
            <ChevronDown className="size-icon-small" />
          </IconButton>
        </ButtonGroup>
      )}
    />
  ),
};

/** Single keys, a chord, and inline in a sentence. */
export const KbdMatrix: Story = {
  decorators: [bothModes],
  render: () => (
    <Stack space="space.200">
      <Specimens title="Keys">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        <Kbd>esc</Kbd>
        <Kbd>↵</Kbd>
        <Kbd>⌘ ⇧ P</Kbd>
      </Specimens>
      <Text size="small" color="color.text.subtle">
        Press <Kbd>⌘ K</Kbd> to search.
      </Text>
    </Stack>
  ),
};

/** Horizontal and vertical. */
export const SeparatorMatrix: Story = {
  decorators: [bothModes],
  render: () => (
    <Stack space="space.300">
      <Separator />
      <Inline space="space.200" alignBlock="center" className="h-control-medium">
        <Text>Left</Text>
        <Separator orientation="vertical" />
        <Text>Right</Text>
      </Inline>
    </Stack>
  ),
};

/** Line counts and a shaped one. */
export const SkeletonMatrix: Story = {
  decorators: [bothModes],
  render: () => (
    <Stack space="space.300" className="w-layout-list">
      <Skeleton lines={1} />
      <Skeleton lines={3} />
      <Inline space="space.150" alignBlock="center">
        <Skeleton className="size-control-medium rounded-full" />
        <Skeleton lines={2} className="flex-1" />
      </Inline>
    </Stack>
  ),
};

/** Both sizes, and on a bold surface. */
export const SpinnerMatrix: Story = {
  decorators: [bothModes],
  render: () => (
    <Inline space="space.300" alignBlock="center">
      <Spinner size="small" />
      <Spinner size="medium" />
      <Box
        backgroundColor="color.background.brand.bold"
        padding="space.150"
        className="rounded-medium"
      >
        <Spinner size="medium" className="icon-inverse" label="Loading on brand" />
      </Box>
    </Inline>
  ),
};

/** Toggle by size, off, on and disabled; a group in each size. */
export const ToggleMatrix: Story = {
  decorators: [bothModes],
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["small", "medium"] as const}
        cols={["off", "on", "off · disabled", "on · disabled", "with a label"] as const}
        rowLabel="size"
        render={(size, s) => (
          <Toggle
            aria-label="Bold"
            size={size}
            pressed={s.startsWith("on")}
            disabled={s.includes("disabled")}
            onPressedChange={() => {}}
          >
            {s === "with a label" ? (
              <>
                <Pin className="size-150" />
                Pinned
              </>
            ) : (
              <Bold className="size-icon-small" />
            )}
          </Toggle>
        )}
      />
      <Specimens title="ToggleGroup">
        <ToggleGroup
          aria-label="Scope"
          items={[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "settled", label: "Settled", disabled: true },
          ]}
          value="open"
          onChange={() => {}}
        />
        <ToggleGroup
          aria-label="Format"
          items={[
            { value: "b", label: <Bold className="size-icon-small" /> },
            { value: "i", label: <Italic className="size-icon-small" /> },
          ]}
          value="b"
          onChange={() => {}}
        />
      </Specimens>
    </Stack>
  ),
};
