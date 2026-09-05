import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Grid, Heading, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Primitives/Text",
  component: Text,
  parameters: { layout: "padded" },
  args: { children: "Deny network communications traffic by default and allow by exception.", size: "medium" },
} satisfies Meta<typeof Text>;
export default meta;
type Story = StoryObj<typeof meta>;

const sample = "Deny network communications traffic by default and allow by exception.";
const long = `${sample} ${sample} ${sample}`;

function Label({ children }: { children: string }) {
  return (
    <Text size="xsmall" color="color.text.subtlest">
      {children}
    </Text>
  );
}

const sizes = ["large", "medium", "small", "xsmall"] as const;
const weights = ["regular", "medium", "semibold"] as const;
const colors = [
  "color.text",
  "color.text.subtle",
  "color.text.subtlest",
  "color.text.disabled",
  "color.text.brand",
  "color.text.selected",
  "color.text.danger",
  "color.text.warning",
  "color.text.success",
  "color.text.information",
] as const;

/** The four sizes by the three weights; the text colours; alignment; one, two and three lines clamped; a paragraph at the reading measure; inverse on a bold fill without a colour. */
export const TextMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Label>size by weight</Label>
        <Grid templateColumns="72px repeat(3, minmax(0, 1fr))" gap="space.100" alignItems="baseline">
          <span />
          {weights.map((w) => (
            <Label key={w}>{w}</Label>
          ))}
          {sizes.map((s) => (
            <Stack key={s} space="space.0" className="contents">
              <Label>{s}</Label>
              {weights.map((w) => (
                <Text key={w} size={s} weight={w}>
                  Boundary protection
                </Text>
              ))}
            </Stack>
          ))}
        </Grid>
      </Stack>
      <Stack space="space.100">
        <Label>color; disabled is left out here, it comes from a disabled control</Label>
        <Inline space="space.200" shouldWrap>
          {colors.filter((c) => c !== "color.text.disabled").map((c) => (
            <Text key={c} color={c} size="small">
              {c.replace("color.text.", "") === c ? "text" : c.replace("color.text.", "")}
            </Text>
          ))}
        </Inline>
        <Inline space="space.100">
          <Box backgroundColor="color.background.neutral.bold" paddingBlock="space.075" paddingInline="space.150" className="rounded-medium">
            <Text size="small">inverse, from the bold fill</Text>
          </Box>
          <Box backgroundColor="color.background.warning.bold" paddingBlock="space.075" paddingInline="space.150" className="rounded-medium">
            <Text size="small">warning.inverse, from the warning bold</Text>
          </Box>
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>align, in a 240px block</Label>
        <Inline space="space.200" alignBlock="start">
          {(["start", "center", "end"] as const).map((a) => (
            <Box key={a} backgroundColor="elevation.surface.sunken" padding="space.100" className="rounded-medium" style={{ width: 240 }}>
              <Text as="p" size="small" align={a}>
                {a}: two findings carried
              </Text>
            </Box>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>maxLines 1 · 2 · 3, in a 240px block</Label>
        <Inline space="space.200" alignBlock="start">
          {([1, 2, 3] as const).map((m) => (
            <Box key={m} backgroundColor="elevation.surface.sunken" padding="space.100" className="rounded-medium" style={{ width: 240 }}>
              <Text as="p" size="small" maxLines={m} title={long}>
                {long}
              </Text>
            </Box>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>as="p" at the reading measure, body large</Label>
        <Text as="p" size="large" className="max-w-layout-measure">
          {long}
        </Text>
      </Stack>
    </Stack>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Stack space="space.200">
      {sizes.map((s) => (
        <Inline key={s} space="space.300" alignBlock="baseline">
          <Box style={{ width: 72 }}>
            <Text size="xsmall" color="color.text.subtlest">
            {s}
          </Text>
          </Box>
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
        {weights.map((w) => (
          <Text key={w} weight={w}>
            {w}
          </Text>
        ))}
      </Inline>
      <Inline space="space.300" shouldWrap>
        {colors.map((c) => (
          <Text key={c} color={c} size="small">
            {c.replace("color.text.", "") === c ? "default" : c.replace("color.text.", "")}
          </Text>
        ))}
      </Inline>
      <Box backgroundColor="color.background.neutral.bold" padding="space.150" className="rounded-medium">
        <Text>inverse, on neutral.bold, from the fill</Text>
      </Box>
      <Box style={{ width: 240 }}>
        <Text maxLines={2} color="color.text.subtle" size="small">
          {long}
        </Text>
      </Box>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stack space="space.050">
            <Text as="p">{sample}</Text>
            <Text as="p" size="small" color="color.text.danger">
              Two findings are past their due date.
            </Text>
          </Stack>
        }
        doText="Running text is neutral. Colour says something: the danger line is a fact with a tone. Carbon's rule."
        dont={
          <Stack space="space.050">
            <Text as="p" color="color.text.brand">
              {sample}
            </Text>
            <Text as="p" size="small" color="color.text.success">
              Two findings are past their due date.
            </Text>
          </Stack>
        }
        dontText="Colour as decoration. Brand on a sentence reads as a link; success under an overdue count says the opposite of the words."
      />
      <Pair
        do={
          <Box style={{ width: 320 }}>
            <Text as="p">{sample}</Text>
          </Box>
        }
        doText="Body copy is `medium`, the UI size, or `large` for a statement read at length."
        dont={
          <Box style={{ width: 320 }}>
            <Text as="p" size="xsmall">
              {sample}
            </Text>
          </Box>
        }
        dontText="A paragraph in `xsmall`. Eleven pixels is for a count or a date beside something; a sentence in it is not read."
      />
      <Pair
        do={
          <Stack space="space.050">
            <Heading size="xsmall">Assessment results</Heading>
            <Text as="p" size="small" color="color.text.subtle">
              Two findings carried from the last cycle.
            </Text>
          </Stack>
        }
        doText="A title is a Heading: the level is in the outline and the size is the heading ramp."
        dont={
          <Stack space="space.050">
            <Text as="p" size="large" weight="semibold">
              Assessment results
            </Text>
            <Text as="p" size="small" color="color.text.subtle">
              Two findings carried from the last cycle.
            </Text>
          </Stack>
        }
        dontText="A Text made to look like a title. It is not in the outline, and its size is a body size with a weight, not the heading ramp."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
