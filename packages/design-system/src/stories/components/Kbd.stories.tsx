import type { Meta, StoryObj } from "@storybook/react-vite";

import { Kbd, Separator, Skeleton, Spinner } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Kbd",
  component: Kbd,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Kbd>;
export default meta;
type Story = StoryObj;

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

/** Single keys, a chord, and inline in a sentence. */
export const KbdMatrix: Story = {
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
