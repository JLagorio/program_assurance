import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import {
  Box,
  Grid,
  Heading,
  HeadingLevelProvider,
  Inline,
  Stack,
  Text,
  useHeadingLevel,
} from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Primitives/Heading",
  component: Heading,
  parameters: { layout: "padded" },
  args: { size: "medium", children: "Program CFC-2026 · Boundary protection" },
} satisfies Meta<typeof Heading>;
export default meta;
type Story = StoryObj<typeof meta>;

function Label({ children }: { children: string }) {
  return (
    <Text size="xsmall" color="color.text.subtlest">
      {children}
    </Text>
  );
}

/** The four sizes with the element each renders by default; the element overridden by `as`; inverse on a bold fill, set by the Box. */
export const HeadingMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Label>size, and the default element</Label>
        <Grid
          templateColumns="88px minmax(0, 1fr)"
          rowGap="space.150"
          columnGap="space.200"
          alignItems="baseline"
        >
          <Label>large · div</Label>
          <Heading size="large">298 / 372</Heading>
          <Label>medium · h1</Label>
          <Heading size="medium">Program CFC-2026 · Boundary protection</Heading>
          <Label>small · h2</Label>
          <Heading size="small">Assessment results</Heading>
          <Label>xsmall · h3</Label>
          <Heading size="xsmall">Schedule assessment</Heading>
        </Grid>
      </Stack>
      <Stack space="space.100">
        <Label>as: the level from the page, the size from the design</Label>
        <Stack space="space.050">
          <Heading size="xsmall" as="h2">
            An h2 at the card size, in a rail
          </Heading>
          <Heading size="small" as="h3">
            An h3 at the section size, a subsection under a card-sized h2
          </Heading>
          <Heading size="medium" as="div">
            A div at the title size, where the outline already has its h1
          </Heading>
        </Stack>
      </Stack>
      <Stack space="space.100">
        <Label>on a bold fill: inverse from the Box, no colour on the Heading</Label>
        <Inline space="space.100" shouldWrap>
          <Box
            backgroundColor="color.background.brand.bold"
            padding="space.200"
            className="rounded-large"
          >
            <Heading size="small" as="div">
              12 systems in scope
            </Heading>
          </Box>
          <Box
            backgroundColor="color.background.warning.bold"
            padding="space.200"
            className="rounded-large"
          >
            <Heading size="small" as="div">
              3 past due
            </Heading>
          </Box>
        </Inline>
      </Stack>
    </Stack>
  ),
};

export const Headings: Story = {
  render: () => (
    <Stack space="space.200">
      <Heading size="large" as="div">
        298 / 372
      </Heading>
      <Heading size="medium">Program CFC-2026 · Boundary protection</Heading>
      <Heading size="small">Assessment results</Heading>
      <Heading size="xsmall" as="h3">
        Schedule assessment
      </Heading>
      <Text size="small" color="color.text.subtlest">
        Level is chosen by the page (as); size by the design. Large is a displayed number, never a
        title.
      </Text>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  // The negative example intentionally demonstrates a broken heading outline.
  parameters: { a11y: { config: { rules: [{ id: "heading-order", enabled: false }] } } },
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stack space="space.150">
            <Heading size="medium">Boundary protection</Heading>
            <Heading size="small" as="h2">
              Assessment results
            </Heading>
            <Heading size="xsmall" as="h3">
              Schedule
            </Heading>
          </Stack>
        }
        doText="One h1, then the outline in order, each at the size its place on the page wants."
        dont={
          <Stack space="space.150">
            <Heading size="medium">Boundary protection</Heading>
            <Heading size="medium">Assessment results</Heading>
            <Heading size="xsmall" as="h3">
              Schedule
            </Heading>
          </Stack>
        }
        dontText="Two h1s: the section took the title's size and got its level with it. A screen reader's outline has two pages."
      />
      <Pair
        do={
          <Stack space="space.050">
            <Heading size="medium">Boundary protection</Heading>
            <Text size="small" color="color.text.subtle">
              SC-7 · Moderate baseline
            </Text>
          </Stack>
        }
        doText="A page title is `medium`, 22px. It is the biggest text on a page."
        dont={
          <Stack space="space.050">
            <Heading size="large" as="h1">
              Boundary protection
            </Heading>
            <Text size="small" color="color.text.subtle">
              SC-7 · Moderate baseline
            </Text>
          </Stack>
        }
        dontText="`large` as a title. The 28px size is the displayed number's, a stat or a dashboard figure, and a title in it shouts over the page."
      />
      <Pair
        do={
          <Stack space="space.050">
            <Heading size="xsmall">Findings</Heading>
            <Text size="small" color="color.text.danger">
              2 past due
            </Text>
          </Stack>
        }
        doText="A heading is `color.text`. The tone goes on the fact beside it."
        dont={
          <Stack space="space.050">
            <Heading size="xsmall" className="text-danger">
              Findings
            </Heading>
            <Text size="small" color="color.text.subtle">
              2 past due
            </Text>
          </Stack>
        }
        dontText="A red heading. The word is not the problem, the count is; and `color` will not take a tone, so it took a class."
      />
    </Stack>
  ),
};

/** The level a heading placed here takes, read from the context: what a part that renders a heading of its own sees. */
function CurrentLevel() {
  const level = useHeadingLevel();
  return (
    <Text size="small" color="color.text.subtlest">
      {level === undefined ? "No provider: each part keeps its default" : `Level ${level} here`}
    </Text>
  );
}

/** The level from the context, the size from the design. A HeadingLevelProvider without `level` goes one below the surrounding level (2 under the page's title); with `level` it starts an outline. A Heading without `as` takes the contextual level, `as` still overrides it, and `large`, a displayed number, stays a div. */
export const LevelFromContext: Story = {
  name: "Level from context",
  render: () => (
    <Stack space="space.200">
      <CurrentLevel />
      <Heading size="medium">Boundary protection</Heading>
      <HeadingLevelProvider>
        <CurrentLevel />
        <Heading size="small">Assessment results</Heading>
        <HeadingLevelProvider>
          <CurrentLevel />
          <Heading size="xsmall">Schedule</Heading>
          <Heading size="xsmall" as="div">
            A title-styled line that is not in the outline
          </Heading>
          <Heading size="large">298 / 372</Heading>
        </HeadingLevelProvider>
      </HeadingLevelProvider>
      <HeadingLevelProvider level={2}>
        <CurrentLevel />
        <Heading size="xsmall">A rail group, restarted at 2 by its region</Heading>
      </HeadingLevelProvider>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Boundary protection" }).tagName).toBe("H1");
    await expect(canvas.getByRole("heading", { name: "Assessment results" }).tagName).toBe("H2");
    await expect(canvas.getByRole("heading", { name: "Schedule" }).tagName).toBe("H3");
    await expect(
      canvas.queryByRole("heading", { name: "A title-styled line that is not in the outline" }),
    ).toBeNull();
    await expect(canvas.queryByRole("heading", { name: "298 / 372" })).toBeNull();
    await expect(canvas.getByText("298 / 372").tagName).toBe("DIV");
    await expect(
      canvas.getByRole("heading", { name: "A rail group, restarted at 2 by its region" }).tagName,
    ).toBe("H2");
    await expect(canvas.getByText("No provider: each part keeps its default")).toBeVisible();
    await expect(canvas.getByText("Level 3 here")).toBeVisible();
  },
};

export const Playground: Story = {};
