import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Primitives/Stack",
  component: Stack,
  parameters: { layout: "padded" },
  args: { space: "space.100" },
} satisfies Meta<typeof Stack>;
export default meta;
type Story = StoryObj<typeof meta>;

function Block({ label, w = "w-800" }: { label: string; w?: string }) {
  return (
    <Box backgroundColor="color.background.brand.subtlest" paddingBlock="space.050" paddingInline="space.100" className={`rounded-small ${w}`}>
      <Text size="xsmall" color="color.text.brand">
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

function Frame({ children, height }: { children: React.ReactNode; height?: number }) {
  return (
    <Box backgroundColor="elevation.surface.sunken" padding="space.100" className="rounded-medium" style={{ width: 200, height }}>
      {children}
    </Box>
  );
}

/** The space steps; the four inline alignments; `spread` and `grow` when the Stack is taller than its children; `as="ol"` for steps that are a list. */
export const StackMatrix: Story = {
  tags: ["contract"],
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Label>space</Label>
        <Inline space="space.200" alignBlock="start" shouldWrap>
          {(["space.050", "space.100", "space.200", "space.300"] as const).map((s) => (
            <Stack key={s} space="space.050">
              <Label>{s}</Label>
              <Frame>
                <Stack space={s}>
                  <Block label="one" />
                  <Block label="two" />
                  <Block label="three" />
                </Stack>
              </Frame>
            </Stack>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>alignInline</Label>
        <Inline space="space.200" alignBlock="start" shouldWrap>
          {(["start", "center", "end", "stretch"] as const).map((a) => (
            <Stack key={a} space="space.050">
              <Label>{a}</Label>
              <Frame>
                <Stack space="space.050" alignInline={a}>
                  <Block label="short" w="" />
                  <Block label="a longer child" w="" />
                </Stack>
              </Frame>
            </Stack>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>alignBlock and spread, in a Stack taller than its children · grow fill beside hug</Label>
        <Inline space="space.200" alignBlock="start" shouldWrap>
          {(["start", "center", "end"] as const).map((a) => (
            <Stack key={a} space="space.050">
              <Label>{`alignBlock ${a}`}</Label>
              <Frame height={120}>
                <Stack space="space.050" alignBlock={a} className="h-full">
                  <Block label="one" />
                  <Block label="two" />
                </Stack>
              </Frame>
            </Stack>
          ))}
          <Stack space="space.050">
            <Label>spread</Label>
            <Frame height={120}>
              <Stack spread="space-between" className="h-full">
                <Block label="top" />
                <Block label="bottom" />
              </Stack>
            </Frame>
          </Stack>
          <Stack space="space.050">
            <Label>grow fill</Label>
            <Frame height={120}>
              <Stack space="space.050" className="h-full">
                <Block label="hug" />
                <Stack grow="fill" alignBlock="end">
                  <Block label="fill, aligned end" w="" />
                </Stack>
              </Stack>
            </Frame>
          </Stack>
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>as="ol": steps a screen reader counts</Label>
        <Frame>
          <Stack as="ol" space="space.050">
            <Text as="li" size="small">
              1. Scope the systems
            </Text>
            <Text as="li" size="small">
              2. Tailor the controls
            </Text>
            <Text as="li" size="small">
              3. Approve the set
            </Text>
          </Stack>
        </Frame>
      </Stack>
    </Stack>
  ),
};

export const Space: Story = {
  render: () => (
    <Inline space="space.400" alignBlock="start">
      {(["space.050", "space.100", "space.200", "space.300"] as const).map((s) => (
        <Stack key={s} space="space.100">
          <Label>{s}</Label>
          <Box backgroundColor="elevation.surface.sunken" padding="space.100" className="rounded-medium">
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
          <Label>{`alignInline=${a}`}</Label>
          <Frame>
            <Stack space="space.050" alignInline={a}>
              <Block label="short" w="" />
              <Block label="a longer child" w="" />
            </Stack>
          </Frame>
        </Stack>
      ))}
    </Inline>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stack space="space.100">
            <Block label="Scope" />
            <Block label="Schedule" />
            <Block label="Owners" />
          </Stack>
        }
        doText="One token between every child, on the Stack. Change the rhythm in one place."
        dont={
          <div>
            <div style={{ marginBottom: 8 }}>
              <Block label="Scope" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Block label="Schedule" />
            </div>
            <Block label="Owners" />
          </div>
        }
        dontText="A margin under each child, each its own number. The third has none, so the block below it lands on it."
      />
      <Pair
        do={
          <Frame>
            <Stack as="ol" space="space.050">
              <Text as="li" size="small">
                Scope the systems
              </Text>
              <Text as="li" size="small">
                Tailor the controls
              </Text>
            </Stack>
          </Frame>
        }
        doText={"Steps are a list: `as=\"ol\"` with `li` children, so a screen reader says how many and where it is."}
        dont={
          <Frame>
            <Stack space="space.050">
              <Text as="p" size="small">
                Scope the systems
              </Text>
              <Text as="p" size="small">
                Tailor the controls
              </Text>
            </Stack>
          </Frame>
        }
        dontText="Two paragraphs that look like steps. Nothing says they belong together or how many there are."
      />
      <Pair
        do={<Block label="Scope" />}
        doText="One child needs no Stack. The primitive is for the distance between children."
        dont={
          <Stack space="space.100">
            <Block label="Scope" />
          </Stack>
        }
        dontText="A Stack around one child. It spaces nothing and adds a div to every reader's tree."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Frame>
      <Stack {...args}>
        <Block label="one" />
        <Block label="two" />
        <Block label="three" />
      </Stack>
    </Frame>
  ),
};
