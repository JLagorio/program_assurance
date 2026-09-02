import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlignLeft, Bold, Italic, List, Pin } from "lucide-react";
import { useState } from "react";

import { Button, ButtonGroup, IconButton, Kbd, Separator, Skeleton, Spinner, Toggle, ToggleGroup } from "../../components";
import { Inline, Stack, Text } from "../../primitives";

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
        <Toggle aria-label="Bold" defaultPressed><Bold className="size-icon-small" /></Toggle>
        <Toggle aria-label="Italic"><Italic className="size-icon-small" /></Toggle>
        <Toggle aria-label="Pin" size="small"><Pin className="size-150" />Pinned</Toggle>
        <Toggle aria-label="Disabled" disabled><List className="size-icon-small" /></Toggle>
        <Separator orientation="vertical" />
        <ToggleGroup aria-label="View" value={view} onChange={setView} items={[{ value: "table", label: "Table" }, { value: "board", label: "Board" }, { value: "timeline", label: "Timeline", disabled: true }]} />
      </Inline>
      <Inline space="space.200" alignBlock="center">
        <ButtonGroup>
          <Button size="small">Day</Button>
          <Button size="small" isSelected>Week</Button>
          <Button size="small">Month</Button>
        </ButtonGroup>
        <ButtonGroup>
          <IconButton label="Align left"><AlignLeft className="size-icon-small" /></IconButton>
          <IconButton label="Bold"><Bold className="size-icon-small" /></IconButton>
          <IconButton label="Italic"><Italic className="size-icon-small" /></IconButton>
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
