import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Inline, Stack, Text } from "../../primitives";
import { spaceTokens } from "../../generated/space";

const meta = { title: "Primitives/Box", component: Box, parameters: { layout: "padded" } } satisfies Meta<typeof Box>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padding: Story = {
  render: () => (
    <Inline space="space.200" shouldWrap>
      {spaceTokens.filter((t) => t !== "space.0").map((t) => (
        <Stack key={t} space="space.050" alignInline="center">
          <Box padding={t} backgroundColor="color.background.brand.subtlest" className="rounded-medium">
            <Box backgroundColor="color.background.brand.bold" className="size-icon-medium rounded-small" />
          </Box>
          <Text size="xsmall" color="color.text.subtlest">{t}</Text>
        </Stack>
      ))}
    </Inline>
  ),
};

export const Surfaces: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="stretch">
      {(["elevation.surface", "elevation.surface.sunken", "elevation.surface.raised", "elevation.surface.overlay"] as const).map((s) => (
        <Box key={s} backgroundColor={s} padding="space.200" className={s === "elevation.surface.raised" ? "rounded-large shadow-raised" : s === "elevation.surface.overlay" ? "rounded-large shadow-overlay" : "rounded-large border border-default"}>
          <Stack space="space.100">
            <Text size="small" weight="medium">{s.split(".").pop()}</Text>
            <Box backgroundColor="utility.elevation.surface.current" padding="space.100" className="rounded-small border border-default">
              <Text size="xsmall" color="color.text.subtle">a sticky child painted with surface.current</Text>
            </Box>
          </Stack>
        </Box>
      ))}
    </Inline>
  ),
};

export const Backgrounds: Story = {
  render: () => (
    <Inline space="space.100" shouldWrap>
      {(["color.background.neutral", "color.background.brand.bold", "color.background.selected", "color.background.danger", "color.background.warning.bold", "color.background.success.subtler", "color.background.information.subtle", "color.background.disabled", "color.background.input"] as const).map((b) => (
        <Box key={b} backgroundColor={b} paddingBlock="space.075" paddingInline="space.150" className="rounded-medium">
          <Text size="small" color={b.includes("bold") && !b.includes("warning") ? "color.text.inverse" : "color.text"}>{b.replace("color.background.", "")}</Text>
        </Box>
      ))}
    </Inline>
  ),
};
