import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Grid, Text } from "../../primitives";

const meta = {
  title: "Primitives/Grid",
  component: Grid,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Grid>;
export default meta;
type Story = StoryObj<typeof meta>;

function Cell({ label }: { label: string }) {
  return (
    <Box
      backgroundColor="color.background.information.subtler"
      padding="space.100"
      className="rounded-small"
    >
      <Text size="xsmall" color="color.text.information">
        {label}
      </Text>
    </Box>
  );
}

export const GridTemplate: Story = {
  render: () => (
    <Grid templateColumns="minmax(0, 1fr) 272px" gap="space.200">
      <Box
        backgroundColor="elevation.surface.sunken"
        padding="space.200"
        className="rounded-medium"
      >
        <Text>main column</Text>
      </Box>
      <Box
        backgroundColor="elevation.surface.sunken"
        padding="space.200"
        className="rounded-medium"
      >
        <Text>rail</Text>
      </Box>
      <Grid templateColumns="repeat(4, minmax(0, 1fr))" gap="space.100" className="col-span-2">
        <Cell label="1" />
        <Cell label="2" />
        <Cell label="3" />
        <Cell label="4" />
      </Grid>
    </Grid>
  ),
};

/** One template per breakpoint. Each travels as a CSS variable a static class reads, so the page stays free of arbitrary values. */
export const ResponsiveGrid: Story = {
  render: () => (
    <Grid
      templateColumns={{
        base: "minmax(0, 1fr)",
        md: "repeat(2, minmax(0, 1fr))",
        lg: "minmax(0, 1fr) 272px",
      }}
      gap="space.200"
    >
      <Box
        backgroundColor="elevation.surface.sunken"
        padding="space.200"
        className="rounded-medium"
      >
        <Text>main column · one column narrow, two from md, main and rail from lg</Text>
      </Box>
      <Box
        backgroundColor="elevation.surface.sunken"
        padding="space.200"
        className="rounded-medium"
      >
        <Text>rail</Text>
      </Box>
    </Grid>
  ),
};
