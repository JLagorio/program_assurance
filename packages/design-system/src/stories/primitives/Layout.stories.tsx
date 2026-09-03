import type { Meta, StoryObj } from "@storybook/react-vite";

import { Bleed, Box, Flex, Grid, Stack, Text } from "../../primitives";

const meta = { title: "Primitives/Flex · Grid · Bleed", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Cell({ label }: { label: string }) {
  return (
    <Box backgroundColor="color.background.information.subtler" padding="space.100" className="rounded-small">
      <Text size="xsmall" color="color.text.information">{label}</Text>
    </Box>
  );
}

export const FlexRow: Story = {
  render: () => (
    <Flex direction="row" gap="space.100" alignItems="center" justifyContent="space-between" wrap="wrap">
      <Cell label="start" /><Cell label="middle" /><Cell label="end" />
    </Flex>
  ),
};

export const GridTemplate: Story = {
  render: () => (
    <Grid templateColumns="minmax(0, 1fr) 272px" gap="space.200">
      <Box backgroundColor="elevation.surface.sunken" padding="space.200" className="rounded-medium"><Text>main column</Text></Box>
      <Box backgroundColor="elevation.surface.sunken" padding="space.200" className="rounded-medium"><Text>rail</Text></Box>
      <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="space.100" className="col-span-2">
        <Cell label="1" /><Cell label="2" /><Cell label="3" /><Cell label="4" />
      </Grid>
    </Grid>
  ),
};

/** One template per breakpoint. Each travels as a CSS variable a static class reads, so the page stays free of arbitrary values. */
export const ResponsiveGrid: Story = {
  render: () => (
    <Grid templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))", lg: "minmax(0, 1fr) 272px" }} gap="space.200">
      <Box backgroundColor="elevation.surface.sunken" padding="space.200" className="rounded-medium"><Text>main column · one column narrow, two from md, main and rail from lg</Text></Box>
      <Box backgroundColor="elevation.surface.sunken" padding="space.200" className="rounded-medium"><Text>rail</Text></Box>
    </Grid>
  ),
};

export const BleedInsideCard: Story = {
  render: () => (
    <Box backgroundColor="elevation.surface.raised" padding="space.200" className="max-w-[420px] rounded-large shadow-raised">
      <Stack space="space.150">
        <Text weight="medium">Card with a full-bleed strip</Text>
        <Bleed inline="space.200">
          <Box backgroundColor="color.background.warning" paddingBlock="space.100" paddingInline="space.200">
            <Text size="small" color="color.text.warning">This strip escapes the card's padding on both sides.</Text>
          </Box>
        </Bleed>
        <Text size="small" color="color.text.subtle">Bleed is the only sanctioned negative spacing.</Text>
      </Stack>
    </Box>
  ),
};
