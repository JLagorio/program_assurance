import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Primitives/Stack",
  component: Stack,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Stack>;
export default meta;
type Story = StoryObj<typeof meta>;

function Block({ label, w = "w-800" }: { label: string; w?: string }) {
  return (
    <Box
      backgroundColor="color.background.brand.subtlest"
      paddingBlock="space.050"
      paddingInline="space.100"
      className={`rounded-small ${w}`}
    >
      <Text size="xsmall" color="color.text.brand">
        {label}
      </Text>
    </Box>
  );
}

export const Space: Story = {
  render: () => (
    <Inline space="space.400" alignBlock="start">
      {(["space.050", "space.100", "space.200", "space.300"] as const).map((s) => (
        <Stack key={s} space="space.100">
          <Text size="xsmall" color="color.text.subtlest">
            {s}
          </Text>
          <Box
            backgroundColor="elevation.surface.sunken"
            padding="space.100"
            className="rounded-medium"
          >
            <Stack space={s}>
              <Block label="one" />
              <Block label="two" />
              <Block label="three" />
            </Stack>
          </Box>
        </Stack>
      ))}
    </Inline>
  ),
};

export const Alignment: Story = {
  render: () => (
    <Inline space="space.400" alignBlock="start">
      {(["start", "center", "end", "stretch"] as const).map((a) => (
        <Stack key={a} space="space.100">
          <Text size="xsmall" color="color.text.subtlest">
            alignInline={a}
          </Text>
          <Box
            backgroundColor="elevation.surface.sunken"
            padding="space.100"
            className="w-[200px] rounded-medium"
          >
            <Stack space="space.050" alignInline={a}>
              <Block label="short" w="" />
              <Block label="a longer child" w="" />
            </Stack>
          </Box>
        </Stack>
      ))}
    </Inline>
  ),
};
