import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Sheet,
  SheetBody,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  Stat,
} from "../../components";
import { PageHeader, Section } from "../../layout";
import {
  Box,
  Grid,
  Heading,
  HeadingLevelProvider,
  Inline,
  Stack,
  Text,
  useHeadingLevel,
  type HeadingSize,
} from "../../primitives";
import * as pairLayout from "../_lib/pair";
import * as typeStyle from "../_lib/type-style";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;
const { typeOf, ramp } = typeStyle;

const meta = {
  title: "Primitives/Heading",
  component: Heading,
  parameters: { layout: "padded" },
  args: { size: "page", children: "Program CFC-2026 · Boundary protection" },
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

/** A page's title, a section's, a group's inside an overlay, and a figure: each size with the element it renders outside every HeadingLevelProvider. */
export const Sizes: Story = {
  render: () => (
    <Stack space="space.200">
      <Heading size="page">Boundary protection</Heading>
      <Heading size="section">Assessment results</Heading>
      <Heading size="overlay">Schedule assessment</Heading>
      <Heading size="display">298 / 372</Heading>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(typeOf(canvas.getByRole("heading", { name: "Boundary protection" }))).toEqual({
      tag: "H1",
      ...ramp.page,
    });
    await expect(typeOf(canvas.getByRole("heading", { name: "Assessment results" }))).toEqual({
      tag: "H2",
      ...ramp.section,
    });
    await expect(typeOf(canvas.getByRole("heading", { name: "Schedule assessment" }))).toEqual({
      tag: "H3",
      ...ramp.overlay,
    });
    // A displayed number is a div, never a heading.
    await expect(canvas.queryByRole("heading", { name: "298 / 372" })).toBeNull();
    await expect(typeOf(canvas.getByText("298 / 372"))).toEqual({ tag: "DIV", ...ramp.display });
  },
};

/** The four sizes with the element each renders by default; the element overridden by `as`; inverse on a bold fill, set by the Box. */
export const HeadingMatrix: Story = {
  tags: ["!manifest"],
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
          <Label>page · h1</Label>
          <Heading size="page">Program CFC-2026 · Boundary protection</Heading>
          <Label>section · h2</Label>
          <Heading size="section">Assessment results</Heading>
          <Label>overlay · h3</Label>
          <Heading size="overlay">Schedule assessment</Heading>
          <Label>display · div</Label>
          <Heading size="display">298 / 372</Heading>
        </Grid>
      </Stack>
      <Stack space="space.100">
        <Label>as: the level from the page, the size from the design</Label>
        <Stack space="space.050">
          <Heading size="section" as="h2">
            An h2 at the section size, a rail's group
          </Heading>
          <Heading size="overlay" as="h3">
            An h3 at the overlay size, a group inside a dialog
          </Heading>
          <Heading size="page" as="div">
            A div at the page size, where the outline already has its h1
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
            <Heading size="page" as="div">
              12 systems in scope
            </Heading>
          </Box>
          <Box
            backgroundColor="color.background.warning.bold"
            padding="space.200"
            className="rounded-large"
          >
            <Heading size="page" as="div">
              3 past due
            </Heading>
          </Box>
        </Inline>
      </Stack>
    </Stack>
  ),
};

function KitTitlesDemo() {
  return (
    <Stack space="space.300">
      <Stack space="space.100">
        <Label>PageHeader.Title, then a Heading at page</Label>
        <PageHeader>
          <PageHeader.Heading>
            <PageHeader.Title>Boundary protection</PageHeader.Title>
          </PageHeader.Heading>
        </PageHeader>
        <Heading size="page" as="div" data-testid="page">
          Boundary protection
        </Heading>
      </Stack>
      <Stack space="space.100">
        <Label>Section.Title, then a Heading at section</Label>
        <Section title="Assessment results">
          <Text>Twelve controls assessed, two with findings.</Text>
        </Section>
        <Heading size="section" as="div" data-testid="section">
          Assessment results
        </Heading>
      </Stack>
      <Stack space="space.100">
        <Label>A Stat&apos;s figure, then a Heading at page</Label>
        <Stat label="Open findings" value={12} />
        <Heading size="page" as="div" data-testid="figure">
          12
        </Heading>
      </Stack>
      <Stack space="space.100">
        <Label>An overlay&apos;s title, and a preview&apos;s record name</Label>
        <Inline space="space.100" shouldWrap>
          <Dialog>
            <DialogTrigger render={<Button />}>Schedule assessment</DialogTrigger>
            <DialogContent width="medium">
              <DialogHeader>
                <DialogTitle>Schedule assessment</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <Heading size="overlay" as="div" data-testid="overlay">
                  Schedule assessment
                </Heading>
              </DialogBody>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger render={<Button />}>Preview record</SheetTrigger>
            <SheetContent>
              <SheetBody>
                <PageHeader>
                  <PageHeader.Heading>
                    <PageHeader.Title render={<SheetTitle />}>Boundary protection</PageHeader.Title>
                  </PageHeader.Heading>
                </PageHeader>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </Inline>
      </Stack>
    </Stack>
  );
}

/** Every title the kit draws is a Heading at one size, so a title set with Heading matches the screen around it: PageHeader.Title at `page`, Section.Title at `section`, a Stat's figure at `page` as a div, and an overlay's title at `overlay`. A PageHeader.Title rendered as a sheet's title, a preview's record name, keeps `page`. */
export const KitTitles: Story = {
  name: "Titles the kit draws",
  tags: ["!manifest"],
  render: () => <KitTitlesDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    await expect(typeOf(canvas.getByRole("heading", { name: "Boundary protection" }))).toEqual({
      tag: "H1",
      ...ramp.page,
    });
    await expect(typeOf(canvas.getByTestId("page"))).toEqual({ tag: "DIV", ...ramp.page });
    await expect(typeOf(canvas.getByRole("heading", { name: "Assessment results" }))).toEqual({
      tag: "H2",
      ...ramp.section,
    });
    await expect(typeOf(canvas.getByTestId("section"))).toEqual({ tag: "DIV", ...ramp.section });
    const figure = canvasElement.querySelector('[data-slot="stat"]')!.firstElementChild!;
    await expect(typeOf(figure)).toEqual({ tag: "DIV", ...ramp.page });
    await expect(typeOf(canvas.getByTestId("figure"))).toEqual({ tag: "DIV", ...ramp.page });

    const dialogTrigger = canvas.getByRole("button", { name: "Schedule assessment" });
    await userEvent.click(dialogTrigger);
    const dialog = within(await body.findByRole("dialog", { name: "Schedule assessment" }));
    await expect(typeOf(dialog.getByRole("heading", { name: "Schedule assessment" }))).toEqual({
      tag: "H2",
      ...ramp.overlay,
    });
    await expect(typeOf(dialog.getByTestId("overlay"))).toEqual({ tag: "DIV", ...ramp.overlay });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(dialogTrigger).toHaveFocus());

    const sheetTrigger = canvas.getByRole("button", { name: "Preview record" });
    await userEvent.click(sheetTrigger);
    const sheet = within(await body.findByRole("dialog", { name: "Boundary protection" }));
    await expect(typeOf(sheet.getByRole("heading", { name: "Boundary protection" }))).toEqual({
      tag: "H2",
      ...ramp.page,
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(sheetTrigger).toHaveFocus());
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  // The negative example intentionally demonstrates a broken heading outline.
  parameters: { a11y: { config: { rules: [{ id: "heading-order", enabled: false }] } } },
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stack space="space.150">
            <Heading size="page">Boundary protection</Heading>
            <Heading size="section" as="h2">
              Assessment results
            </Heading>
            <Heading size="overlay" as="h3">
              Schedule
            </Heading>
          </Stack>
        }
        doText="One h1, then the outline in order, each at the size of the title it is."
        dont={
          <Stack space="space.150">
            <Heading size="page">Boundary protection</Heading>
            <Heading size="page">Assessment results</Heading>
            <Heading size="overlay" as="h3">
              Schedule
            </Heading>
          </Stack>
        }
        dontText="Two h1s: the section took the page title's size and got its level with it. A screen reader's outline has two pages."
      />
      <Pair
        do={
          <Stack space="space.050">
            <Heading size="page">Boundary protection</Heading>
            <Text size="small" color="color.text.subtle">
              SC-7 · Moderate baseline
            </Text>
          </Stack>
        }
        doText="A page title is `page`, 20px, what PageHeader.Title draws. It is the biggest text on a page."
        dont={
          <Stack space="space.050">
            <Heading size="display" as="h1">
              Boundary protection
            </Heading>
            <Text size="small" color="color.text.subtle">
              SC-7 · Moderate baseline
            </Text>
          </Stack>
        }
        dontText="`display` as a page title. The 28px size is a figure's, bigger than a Stat's, and a title in it shouts over the page."
      />
      <Pair
        do={
          <Stack space="space.050">
            <Heading size="section">Findings</Heading>
            <Text size="small" color="color.text.danger">
              2 past due
            </Text>
          </Stack>
        }
        doText="A heading is `color.text`. The tone goes on the fact beside it."
        dont={
          <Stack space="space.050">
            <Heading size="section" className="text-danger">
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

/** The level from the context, the size from the design. A HeadingLevelProvider without `level` goes one below the surrounding level (2 under the page's title); with `level` it starts an outline. A Heading without `as` takes the contextual level, `as` still overrides it, and `display`, a displayed number, stays a div. */
export const LevelFromContext: Story = {
  name: "Level from context",
  render: () => (
    <Stack space="space.200">
      <CurrentLevel />
      <Heading size="page">Boundary protection</Heading>
      <HeadingLevelProvider>
        <CurrentLevel />
        <Heading size="section">Assessment results</Heading>
        <HeadingLevelProvider>
          <CurrentLevel />
          <Heading size="section">Schedule</Heading>
          <Heading size="section" as="div">
            A title-styled line that is not in the outline
          </Heading>
          <Heading size="display">298 / 372</Heading>
        </HeadingLevelProvider>
      </HeadingLevelProvider>
      <HeadingLevelProvider level={2}>
        <CurrentLevel />
        <Heading size="section">A rail group, restarted at 2 by its region</Heading>
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

// Read from a list, so the story shows the deprecated sizes without spelling them as literals.
const deprecatedSizes: { size: HeadingSize; text: string }[] = [
  { size: "large", text: "large, deprecated" },
  { size: "medium", text: "medium, deprecated" },
  { size: "small", text: "small, deprecated" },
  { size: "xsmall", text: "xsmall, deprecated" },
];
/** The deprecated sizes, for one version, each drawn with the step that replaced it: `large` is `display`, `medium` is `page`, `small` is `page` at medium weight (20/26 medium) and `xsmall` is `overlay`. Each keeps its element. */
export const DeprecatedSizes: Story = {
  name: "Deprecated sizes",
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.150">
      {deprecatedSizes.map(({ size, text }) => (
        <Heading key={size} size={size}>
          {text}
        </Heading>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(typeOf(canvas.getByText("large, deprecated"))).toEqual({
      tag: "DIV",
      ...ramp.display,
    });
    await expect(typeOf(canvas.getByText("medium, deprecated"))).toEqual({
      tag: "H1",
      ...ramp.page,
    });
    await expect(typeOf(canvas.getByText("small, deprecated"))).toEqual({
      tag: "H2",
      size: "20px",
      lineHeight: "26px",
      weight: "500",
      tracking: -0.3,
    });
    await expect(typeOf(canvas.getByText("xsmall, deprecated"))).toEqual({
      tag: "H3",
      ...ramp.overlay,
    });
  },
};

export const Playground: Story = {};
