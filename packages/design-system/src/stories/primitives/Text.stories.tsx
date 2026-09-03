import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Heading, Inline, Stack, Text } from "../../primitives";

const meta = { title: "Primitives/Text · Heading", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const sample = "Deny network communications traffic by default and allow by exception.";

export const Sizes: Story = {
  render: () => (
    <Stack space="space.200">
      {(["large", "medium", "small", "xsmall"] as const).map((s) => (
        <Inline key={s} space="space.300" alignBlock="baseline">
          <Text size="xsmall" color="color.text.subtlest" className="w-[72px]">{s}</Text>
          <Text size={s}>{sample}</Text>
        </Inline>
      ))}
    </Stack>
  ),
};

export const WeightsAndColors: Story = {
  render: () => (
    <Stack space="space.300">
      <Inline space="space.300">
        {(["regular", "medium", "semibold"] as const).map((w) => <Text key={w} weight={w}>{w}</Text>)}
      </Inline>
      <Inline space="space.300" shouldWrap>
        {(["color.text", "color.text.subtle", "color.text.subtlest", "color.text.disabled", "color.text.brand", "color.text.selected", "color.text.danger", "color.text.warning", "color.text.success", "color.text.information"] as const).map((c) => (
          <Text key={c} color={c} size="small">{c.replace("color.text.", "") || "default"}</Text>
        ))}
      </Inline>
      <Box backgroundColor="color.background.neutral.bold" padding="space.150" className="rounded-medium">
        <Text color="color.text.inverse">inverse, on neutral.bold</Text>
      </Box>
      <Box className="w-[240px]">
        <Text maxLines={2} color="color.text.subtle" size="small">{sample} {sample} {sample}</Text>
      </Box>
    </Stack>
  ),
};

export const Headings: Story = {
  render: () => (
    <Stack space="space.200">
      <Heading size="large" as="div">298 / 372</Heading>
      <Heading size="medium">Program CFC-2026 · Boundary protection</Heading>
      <Heading size="small">Assessment results</Heading>
      <Heading size="xsmall" as="h4">Schedule assessment</Heading>
      <Text size="small" color="color.text.subtlest">Level is chosen by the page (as); size by the design. Large is a displayed number, never a title.</Text>
    </Stack>
  ),
};
