import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../../components";
import { spaceTokens } from "../../generated/space";
import { Box, Heading, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Primitives/Box",
  component: Box,
  parameters: { layout: "padded" },
  args: {
    padding: "space.200",
    backgroundColor: "color.background.neutral",
    className: "rounded-medium",
    children: "Padding and a fill. Nothing else.",
  },
} satisfies Meta<typeof Box>;
export default meta;
type Story = StoryObj<typeof meta>;

function Label({ children }: { children: string }) {
  return (
    <Text size="xsmall" color="color.text.subtlest">
      {children}
    </Text>
  );
}

const surfaces = [
  "elevation.surface",
  "elevation.surface.sunken",
  "elevation.surface.raised",
  "elevation.surface.overlay",
] as const;
const surfaceFrame = {
  "elevation.surface": "rounded-large border border-default",
  "elevation.surface.sunken": "rounded-large border border-default",
  "elevation.surface.raised": "rounded-large shadow-raised",
  "elevation.surface.overlay": "rounded-large shadow-overlay",
} as const;

/** Padding on one side, two or all; the four surfaces, each publishing itself as the current surface; fills, the bold ones painting their text inverse; the element `as` names. */
export const BoxMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Label>padding · paddingInline + paddingBlock · paddingInlineStart</Label>
        <Inline space="space.200" alignBlock="start">
          <Box padding="space.200" backgroundColor="color.background.brand.subtlest" className="rounded-medium">
            <Box backgroundColor="color.background.brand.bold" className="size-icon-medium rounded-small" />
          </Box>
          <Box paddingInline="space.300" paddingBlock="space.100" backgroundColor="color.background.brand.subtlest" className="rounded-medium">
            <Box backgroundColor="color.background.brand.bold" className="size-icon-medium rounded-small" />
          </Box>
          <Box paddingInlineStart="space.300" backgroundColor="color.background.brand.subtlest" className="rounded-medium">
            <Box backgroundColor="color.background.brand.bold" className="size-icon-medium rounded-small" />
          </Box>
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>surfaces: each publishes itself, so the child painted with surface.current matches</Label>
        <Inline space="space.200" alignBlock="stretch" shouldWrap>
          {surfaces.map((s) => (
            <Box key={s} backgroundColor={s} padding="space.200" className={surfaceFrame[s]}>
              <Stack space="space.100">
                <Text size="small" weight="medium">
                  {s.replace("elevation.surface", "surface") || "surface"}
                </Text>
                <Box backgroundColor="utility.elevation.surface.current" padding="space.100" className="rounded-small border border-default">
                  <Text size="xsmall" color="color.text.subtle">
                    surface.current
                  </Text>
                </Box>
              </Stack>
            </Box>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>fills: a bold fill paints its text inverse, the warning bold its own inverse</Label>
        <Inline space="space.100" shouldWrap>
          {(
            [
              "color.background.neutral",
              "color.background.brand.subtlest",
              "color.background.selected",
              "color.background.danger",
              "color.background.success.subtler",
              "color.background.information.subtle",
              "color.background.disabled",
              "color.background.brand.bold",
              "color.background.neutral.bold",
              "color.background.danger.bold",
              "color.background.warning.bold",
              "color.background.accent.blue.bolder",
            ] as const
          ).map((b) => (
            <Box key={b} backgroundColor={b} paddingBlock="space.075" paddingInline="space.150" className="rounded-medium">
              <Text size="small">{b.replace("color.background.", "")}</Text>
            </Box>
          ))}
        </Inline>
      </Stack>
      <Stack space="space.100">
        <Label>as: a section named by its heading; a Box around a Stack that is a list</Label>
        <Inline space="space.200" alignBlock="start">
          <Box as="section" aria-labelledby="box-section" padding="space.200" backgroundColor="elevation.surface.sunken" className="rounded-medium">
            <Stack space="space.050">
              <Heading size="xsmall" id="box-section">
                Schedule
              </Heading>
              <Text size="small" color="color.text.subtle">
                A landmark, because the Box is a section.
              </Text>
            </Stack>
          </Box>
          <Box padding="space.100" backgroundColor="elevation.surface.sunken" className="rounded-medium">
            <Stack as="ul" space="space.050">
              <Text as="li" size="small">
                AC-2 Account management
              </Text>
              <Text as="li" size="small">
                AC-3 Access enforcement
              </Text>
            </Stack>
          </Box>
        </Inline>
      </Stack>
    </Stack>
  ),
};

/** Every step of the space scale as padding. */
export const Padding: Story = {
  render: () => (
    <Inline space="space.200" shouldWrap>
      {spaceTokens
        .filter((t) => t !== "space.0")
        .map((t) => (
          <Stack key={t} space="space.050" alignInline="center">
            <Box padding={t} backgroundColor="color.background.brand.subtlest" className="rounded-medium">
              <Box backgroundColor="color.background.brand.bold" className="size-icon-medium rounded-small" />
            </Box>
            <Label>{t}</Label>
          </Stack>
        ))}
    </Inline>
  ),
};

/** The four surfaces. A sticky child inside any of them paints `utility.elevation.surface.current` and matches. */
export const Surfaces: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="stretch">
      {surfaces.map((s) => (
        <Box key={s} backgroundColor={s} padding="space.200" className={surfaceFrame[s]}>
          <Stack space="space.100">
            <Text size="small" weight="medium">
              {s.split(".").pop()}
            </Text>
            <Box backgroundColor="utility.elevation.surface.current" padding="space.100" className="rounded-small border border-default">
              <Text size="xsmall" color="color.text.subtle">
                a sticky child painted with surface.current
              </Text>
            </Box>
          </Stack>
        </Box>
      ))}
    </Inline>
  ),
};

/** Semantic fills. The bold ones paint their text inverse without a colour on the Text. */
export const Backgrounds: Story = {
  render: () => (
    <Inline space="space.100" shouldWrap>
      {(
        [
          "color.background.neutral",
          "color.background.brand.bold",
          "color.background.selected",
          "color.background.danger",
          "color.background.warning.bold",
          "color.background.success.subtler",
          "color.background.information.subtle",
          "color.background.disabled",
          "color.background.input",
        ] as const
      ).map((b) => (
        <Box key={b} backgroundColor={b} paddingBlock="space.075" paddingInline="space.150" className="rounded-medium">
          <Text size="small">{b.replace("color.background.", "")}</Text>
        </Box>
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
            <Box padding="space.150" backgroundColor="elevation.surface.raised" className="rounded-medium shadow-raised">
              <Text size="small">Scope</Text>
            </Box>
            <Box padding="space.150" backgroundColor="elevation.surface.raised" className="rounded-medium shadow-raised">
              <Text size="small">Schedule</Text>
            </Box>
          </Stack>
        }
        doText="The parent owns the distance: a Stack with one space token between two Boxes."
        dont={
          <div>
            <Box padding="space.150" backgroundColor="elevation.surface.raised" className="rounded-medium shadow-raised" style={{ marginBottom: 8 }}>
              <Text size="small">Scope</Text>
            </Box>
            <Box padding="space.150" backgroundColor="elevation.surface.raised" className="rounded-medium shadow-raised">
              <Text size="small">Schedule</Text>
            </Box>
          </div>
        }
        dontText="A margin on the child. The card decides the space around it, and the next place it is used inherits a gap it did not ask for."
      />
      <Pair
        do={<Button size="small">Edit scope</Button>}
        doText="A thing that is pressed is a Button: the ring, the pressed face and the name come with it."
        dont={
          <Box role="button" tabIndex={0} paddingBlock="space.075" paddingInline="space.150" backgroundColor="color.background.neutral" className="rounded-medium">
            <Text size="small" weight="medium">
              Edit scope
            </Text>
          </Box>
        }
        dontText="A Box with a role. It has no focus ring, no pressed state, no Enter or Space, and `as` will not let it be a button."
      />
      <Pair
        do={
          <Box backgroundColor="color.background.brand.bold" padding="space.150" className="rounded-medium">
            <Text size="small">12 controls selected</Text>
          </Box>
        }
        doText="The fill as a token on the Box: the bold fill paints the text inverse by itself, and a surface publishes itself to its children."
        dont={
          <Box className="rounded-medium bg-brand-bold p-150">
            <Text size="small" color="color.text.inverse">
              12 controls selected
            </Text>
          </Box>
        }
        dontText="The fill as a class. It paints and nothing else: the text colour is chosen by hand, and a sticky child cannot find its surface."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
