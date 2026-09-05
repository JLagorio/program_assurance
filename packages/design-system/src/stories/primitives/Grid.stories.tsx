import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Grid, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Primitives/Grid",
  component: Grid,
  parameters: { layout: "padded" },
  args: { templateColumns: "repeat(3, minmax(0, 1fr))", gap: "space.100" },
} satisfies Meta<typeof Grid>;
export default meta;
type Story = StoryObj<typeof meta>;

function Cell({ label, truncate }: { label: string; truncate?: boolean }) {
  return (
    <Box backgroundColor="color.background.information.subtler" padding="space.100" className="rounded-small">
      <Text as={truncate ? "p" : "span"} size="xsmall" color="color.text.information" maxLines={truncate ? 1 : undefined} title={truncate ? label : undefined}>
        {label}
      </Text>
    </Box>
  );
}

function Region({ label }: { label: string }) {
  return (
    <Box backgroundColor="elevation.surface.sunken" padding="space.200" className="rounded-medium">
      <Text size="small">{label}</Text>
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

function Frame({ children, width }: { children: React.ReactNode; width?: number }) {
  return (
    <Box backgroundColor="elevation.surface.sunken" padding="space.100" className="rounded-medium" style={{ width }}>
      {children}
    </Box>
  );
}

/** Equal columns; a label column and a value column as a description list; the main column and the rail; named areas; one template per breakpoint; the gap steps. */
export const GridMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Label>repeat(n, minmax(0, 1fr)): two, three, four</Label>
        {[2, 3, 4].map((n) => (
          <Grid key={n} templateColumns={`repeat(${n}, minmax(0, 1fr))`} gap="space.100">
            {Array.from({ length: n }, (_, i) => (
              <Cell key={i} label={`${i + 1} of ${n}`} />
            ))}
          </Grid>
        ))}
      </Stack>
      <Stack space="space.100">
        <Label>as="dl", 104px 1fr: a label column and a value column</Label>
        <Frame width={360}>
          <Grid as="dl" templateColumns="104px 1fr" rowGap="space.050" columnGap="space.100">
            <Text as="dt" size="small" color="color.text.subtle">
              Owner
            </Text>
            <Text as="dd" size="small">
              R. Okafor
            </Text>
            <Text as="dt" size="small" color="color.text.subtle">
              Assessed
            </Text>
            <Text as="dd" size="small">
              12 May 2026
            </Text>
            <Text as="dt" size="small" color="color.text.subtle">
              Baseline
            </Text>
            <Text as="dd" size="small">
              Moderate
            </Text>
          </Grid>
        </Frame>
      </Stack>
      <Stack space="space.100">
        <Label>minmax(0, 1fr) 272px: the main column and the rail</Label>
        <Grid templateColumns="minmax(0, 1fr) 272px" gap="space.200">
          <Region label="main column" />
          <Region label="rail, dimension.layout.rail" />
        </Grid>
      </Stack>
      <Stack space="space.100">
        <Label>templateAreas and templateRows: a head over two columns</Label>
        <Grid templateColumns="minmax(0, 1fr) 160px" templateRows="auto auto" templateAreas={'"head head" "body side"'} gap="space.100">
          <Box style={{ gridArea: "head" }}>
            <Cell label="head" />
          </Box>
          <Box style={{ gridArea: "body" }}>
            <Cell label="body" />
          </Box>
          <Box style={{ gridArea: "side" }}>
            <Cell label="side" />
          </Box>
        </Grid>
      </Stack>
      <Stack space="space.100">
        <Label>one template per breakpoint: one column, two from md, main and rail from lg. Resize the canvas.</Label>
        <Grid templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))", lg: "minmax(0, 1fr) 272px" }} gap="space.200">
          <Region label="main" />
          <Region label="rail" />
        </Grid>
      </Stack>
      <Stack space="space.100">
        <Label>gap: space.050 · space.100 · space.200</Label>
        <Inline space="space.200" alignBlock="start" shouldWrap>
          {(["space.050", "space.100", "space.200"] as const).map((g) => (
            <Frame key={g} width={200}>
              <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={g}>
                <Cell label="a" />
                <Cell label="b" />
                <Cell label="c" />
                <Cell label="d" />
              </Grid>
            </Frame>
          ))}
        </Inline>
      </Stack>
    </Stack>
  ),
};

export const GridTemplate: Story = {
  render: () => (
    <Grid templateColumns="minmax(0, 1fr) 272px" gap="space.200">
      <Region label="main column" />
      <Region label="rail" />
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
      <Region label="main column · one column narrow, two from md, main and rail from lg" />
      <Region label="rail" />
    </Grid>
  ),
};

const longToken = "evidence_2026_05_12_boundary_protection_firewall_ruleset_export_final.csv";

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Frame width={300}>
            <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="space.100">
              <Cell label={longToken} truncate />
              <Cell label="short" />
            </Grid>
          </Frame>
        }
        doText="minmax(0, 1fr): the column can shrink below its content, so a long file name truncates inside it."
        dont={
          <Frame width={300}>
            <Grid templateColumns="1fr 1fr" gap="space.100">
              <Cell label={longToken} truncate />
              <Cell label="short" />
            </Grid>
          </Frame>
        }
        dontText="1fr 1fr. A fraction's minimum is its content, so the long name widens its column past the frame and the second column is pushed out."
      />
      <Pair
        do={
          <Frame width={300}>
            <Grid templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }} gap="space.100">
              <Cell label="Scope" />
              <Cell label="Schedule" />
              <Cell label="Owners" />
            </Grid>
          </Frame>
        }
        doText="One template per breakpoint: one column under md, three from md. Narrow the canvas and these stack while the cells beside them do not."
        dont={
          <Frame width={300}>
            <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="space.100">
              <Cell label="Scope" />
              <Cell label="Schedule" />
              <Cell label="Owners" />
            </Grid>
          </Frame>
        }
        dontText="Three columns at every width. On a phone, or in a 300px rail, each is 90px and every label breaks."
      />
      <Pair
        do={
          <Frame width={300}>
            <Inline space="space.100" rowSpace="space.050" shouldWrap>
              {["Atlas", "Vault", "Relay", "Beacon", "Harbor"].map((t) => (
                <Cell key={t} label={t} />
              ))}
            </Inline>
          </Frame>
        }
        doText="Chips of their own width, wrapping, are an Inline."
        dont={
          <Frame width={300}>
            <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="space.100">
              {["Atlas", "Vault", "Relay", "Beacon", "Harbor"].map((t) => (
                <Cell key={t} label={t} />
              ))}
            </Grid>
          </Frame>
        }
        dontText="A Grid of chips. Every chip is stretched to a third, and the last row has a hole."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Grid {...args}>
      {Array.from({ length: 6 }, (_, i) => (
        <Cell key={i} label={`cell ${i + 1}`} />
      ))}
    </Grid>
  ),
};
