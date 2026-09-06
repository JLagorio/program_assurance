import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Flex, Grid, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Primitives/Flex",
  component: Flex,
  parameters: { layout: "padded" },
  args: { direction: "row", gap: "space.100", alignItems: "center", justifyContent: "space-between" },
} satisfies Meta<typeof Flex>;
export default meta;
type Story = StoryObj<typeof meta>;

function Cell({ label, tall }: { label: string; tall?: boolean }) {
  return (
    <Box backgroundColor="color.background.information.subtler" padding="space.100" className="rounded-small" style={tall ? { paddingBlock: 20 } : undefined}>
      <Text size="xsmall" color="color.text.information">
        {label}
      </Text>
    </Box>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text size="xsmall" color="color.text.subtlest">
      {children}
    </Text>
  );
}

function Frame({ children, width = 300, height }: { children: React.ReactNode; width?: number; height?: number }) {
  return (
    <Box backgroundColor="elevation.surface.sunken" padding="space.100" className="rounded-medium" style={{ width, height }}>
      {children}
    </Box>
  );
}

/** The two directions; the six distributions along the main axis; the five alignments on the cross axis against a taller child; wrapping. */
export const FlexMatrix: Story = {
  tags: ["contract"],
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Label>direction row · column</Label>
        <Inline space="space.200" alignBlock="start">
          <Frame>
            <Flex direction="row" gap="space.100">
              <Cell label="one" />
              <Cell label="two" />
              <Cell label="three" />
            </Flex>
          </Frame>
          <Frame width={160}>
            <Flex direction="column" gap="space.100">
              <Cell label="one" />
              <Cell label="two" />
              <Cell label="three" />
            </Flex>
          </Frame>
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>justifyContent</Label>
        <Inline space="space.200" alignBlock="start" shouldWrap>
          {(["start", "center", "end", "space-between", "space-around", "space-evenly"] as const).map((j) => (
            <Stack key={j} space="space.050">
              <Label>{j}</Label>
              <Frame>
                <Flex justifyContent={j} gap="space.050">
                  <Cell label="a" />
                  <Cell label="b" />
                  <Cell label="c" />
                </Flex>
              </Frame>
            </Stack>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>alignItems, beside a taller child</Label>
        <Inline space="space.200" alignBlock="start" shouldWrap>
          {(["start", "center", "end", "baseline", "stretch"] as const).map((a) => (
            <Stack key={a} space="space.050">
              <Label>{a}</Label>
              <Frame width={200}>
                <Flex alignItems={a} gap="space.050">
                  <Cell label="a" />
                  <Cell label="tall" tall />
                  <Cell label="c" />
                </Flex>
              </Frame>
            </Stack>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>wrap, with rowGap under columnGap</Label>
        <Frame width={260}>
          <Flex wrap="wrap" columnGap="space.100" rowGap="space.050">
            {Array.from({ length: 7 }, (_, i) => (
              <Cell key={i} label={`cell ${i + 1}`} />
            ))}
          </Flex>
        </Frame>
      </Stack>
    </Stack>
  ),
};

export const FlexRow: Story = {
  render: () => (
    <Flex direction="row" gap="space.100" alignItems="center" justifyContent="space-between" wrap="wrap">
      <Cell label="start" />
      <Cell label="middle" />
      <Cell label="end" />
    </Flex>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Inline space="space.100" alignBlock="center">
            <Cell label="AC-2" />
            <Cell label="Satisfied" />
            <Cell label="12 May" />
          </Inline>
        }
        doText="A row with one gap is an Inline. It says what it is, and it has `separator`, `shouldWrap` and `rowSpace`."
        dont={
          <Flex direction="row" gap="space.100" alignItems="center">
            <Cell label="AC-2" />
            <Cell label="Satisfied" />
            <Cell label="12 May" />
          </Flex>
        }
        dontText="A Flex where an Inline would do. Same pixels, three props to say the default, and the reader has to work out that it is a row."
      />
      <Pair
        do={
          <Stack space="space.100">
            <Cell label="Scope" />
            <Cell label="Schedule" />
          </Stack>
        }
        doText="A column with one gap is a Stack."
        dont={
          <Flex direction="column" gap="space.100">
            <Cell label="Scope" />
            <Cell label="Schedule" />
          </Flex>
        }
        dontText="A Flex column. Flex is for the layouts Stack and Inline cannot say: a taller child's baseline, space-around, an unusual wrap."
      />
      <Pair
        do={
          <Grid templateColumns="minmax(0, 1fr) 96px" gap="space.100">
            <Cell label="main" />
            <Cell label="rail" />
          </Grid>
        }
        doText="Two columns with a fixed rail is a Grid: the template says the widths, and the main column cannot push the rail out."
        dont={
          <Flex gap="space.100">
            <Box style={{ flex: 1 }}>
              <Cell label="main" />
            </Box>
            <Box style={{ width: 96 }}>
              <Cell label="rail" />
            </Box>
          </Flex>
        }
        dontText="A Flex with widths in styles. The template lives in three places, and a long word in the main column shrinks the rail."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Frame>
      <Flex {...args}>
        <Cell label="start" />
        <Cell label="middle" />
        <Cell label="end" />
      </Flex>
    </Frame>
  ),
};
