import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Inline, Stack, Text } from "../../primitives";

const meta = { title: "Primitives/Inline", component: Inline, parameters: { layout: "padded" } } satisfies Meta<typeof Inline>;
export default meta;
type Story = StoryObj<typeof meta>;

function Chip({ label }: { label: string }) {
  return (
    <Box backgroundColor="color.background.neutral" paddingBlock="space.025" paddingInline="space.100" className="rounded-small">
      <Text size="small">{label}</Text>
    </Box>
  );
}

export const Space: Story = {
  render: () => (
    <Stack space="space.300">
      {(["space.050", "space.100", "space.200"] as const).map((s) => (
        <Stack key={s} space="space.050">
          <Text size="xsmall" color="color.text.subtlest">{s}</Text>
          <Inline space={s}><Chip label="Satisfied" /><Chip label="Partially satisfied" /><Chip label="Not assessed" /></Inline>
        </Stack>
      ))}
    </Stack>
  ),
};

export const SeparatorAndSpread: Story = {
  render: () => (
    <Stack space="space.300">
      <Inline space="space.100" separator="·" alignBlock="center">
        <Text size="small" color="color.text.subtlest">SC-7(5)</Text>
        <Text size="small" color="color.text.subtlest">Boundary protection</Text>
        <Text size="small" color="color.text.subtlest">Assessed 12 days ago</Text>
      </Inline>
      <Box backgroundColor="elevation.surface.sunken" padding="space.100" className="rounded-medium">
        <Inline spread="space-between" alignBlock="center">
          <Text weight="medium">Findings</Text>
          <Chip label="24" />
        </Inline>
      </Box>
      <Inline space="space.100" rowSpace="space.100" shouldWrap className="max-w-[360px]">
        {Array.from({ length: 9 }, (_, i) => <Chip key={i} label={`Tag ${i + 1}`} />)}
      </Inline>
    </Stack>
  ),
};
