import type { Meta, StoryObj } from "@storybook/react-vite";

import { Table, CardHeader, CardTitle, CardContent, Card } from "../../components";

import { Bleed, Box, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Primitives/Bleed",
  component: Bleed,
  parameters: { layout: "padded" },
  args: { inline: "space.200" },
} satisfies Meta<typeof Bleed>;
export default meta;
type Story = StoryObj<typeof meta>;

function Strip({ label }: { label: string }) {
  return (
    <Box
      backgroundColor="color.background.warning"
      paddingBlock="space.100"
      paddingInline="space.200"
    >
      <Text size="small" color="color.text.warning">
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

function Rows() {
  return (
    <Table label="Findings">
      <thead>
        <Table.Row>
          <Table.Header>Id</Table.Header>
          <Table.Header>Severity</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        <Table.Row>
          <Table.Cell>F-104</Table.Cell>
          <Table.Cell>High</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>F-112</Table.Cell>
          <Table.Cell>Low</Table.Cell>
        </Table.Row>
      </tbody>
    </Table>
  );
}

/** A strip to a card's edges (`inline`); a table to a card body's edges; rows to a panel's top and bottom (`block`); `all`; the rail's `space.100`. */
export const BleedMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Inline space="space.300" alignBlock="start" shouldWrap>
        <Stack space="space.050">
          <Label>inline space.200, in a card padded space.200</Label>
          <Box
            backgroundColor="elevation.surface.raised"
            padding="space.200"
            className="rounded-large shadow-raised"
            style={{ width: 360 }}
          >
            <Stack space="space.150">
              <Text weight="medium">Boundary protection</Text>
              <Bleed inline="space.200">
                <Strip label="Two findings are past their due date." />
              </Bleed>
              <Text size="small" color="color.text.subtle">
                The strip runs to both edges; the text stays inset.
              </Text>
            </Stack>
          </Box>
        </Stack>
        <Stack space="space.050">
          <Label>inline space.200 on a table in a CardContent</Label>
          <Box style={{ width: 360 }}>
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>{"Findings"}</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bleed inline="space.200">
                  <Rows />
                </Bleed>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Inline>
      <Inline space="space.300" alignBlock="start" shouldWrap>
        <Stack space="space.050">
          <Label>block space.200: rows to a panel's top and bottom</Label>
          <Box
            backgroundColor="elevation.surface.sunken"
            padding="space.200"
            className="rounded-large"
            style={{ width: 280 }}
          >
            <Bleed block="space.200">
              <Stack>
                {["AC-2", "AC-3", "AC-6"].map((id) => (
                  <Box key={id} paddingBlock="space.100" className="border-b border-default">
                    <Text size="small">{id}</Text>
                  </Box>
                ))}
              </Stack>
            </Bleed>
          </Box>
        </Stack>
        <Stack space="space.050">
          <Label>all space.200: a fill to every edge, a hero</Label>
          <Box
            backgroundColor="elevation.surface.raised"
            padding="space.200"
            className="rounded-large shadow-raised"
            style={{ width: 280 }}
          >
            <Bleed all="space.200">
              <Box
                backgroundColor="color.background.brand.bold"
                padding="space.200"
                className="rounded-large"
              >
                <Text size="small">A cover on the card, under its radius.</Text>
              </Box>
            </Bleed>
          </Box>
        </Stack>
        <Stack space="space.050">
          <Label>inline space.100: a rail row's hover fill to the rail's edges</Label>
          <Box
            backgroundColor="elevation.surface"
            padding="space.100"
            className="rounded-medium border border-default"
            style={{ width: 272 }}
          >
            <Stack space="space.050">
              <Text size="small" weight="medium">
                Linked risks
              </Text>
              <Bleed inline="space.100">
                <Box
                  backgroundColor="color.background.neutral.subtle.hovered"
                  paddingBlock="space.075"
                  paddingInline="space.100"
                >
                  <Text size="small">R-17 Unpatched edge devices</Text>
                </Box>
              </Bleed>
            </Stack>
          </Box>
        </Stack>
      </Inline>
    </Stack>
  ),
};

export const BleedInsideCard: Story = {
  render: () => (
    <Box
      backgroundColor="elevation.surface.raised"
      padding="space.200"
      className="rounded-large shadow-raised"
      style={{ maxWidth: 420 }}
    >
      <Stack space="space.150">
        <Text weight="medium">Card with a full-bleed strip</Text>
        <Bleed inline="space.200">
          <Strip label="This strip escapes the card's padding on both sides." />
        </Bleed>
        <Text size="small" color="color.text.subtle">
          Bleed is the only sanctioned negative spacing.
        </Text>
      </Stack>
    </Box>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box
            backgroundColor="elevation.surface.raised"
            padding="space.200"
            className="rounded-large shadow-raised"
            style={{ width: 320 }}
          >
            <Stack space="space.150">
              <Text weight="medium">Boundary protection</Text>
              <Bleed inline="space.200">
                <Strip label="Two findings are past due." />
              </Bleed>
            </Stack>
          </Box>
        }
        doText="The strip escapes by the token the card is padded with: Bleed inline space.200 inside padding space.200."
        dont={
          <Box
            backgroundColor="elevation.surface.raised"
            padding="space.200"
            className="rounded-large shadow-raised"
            style={{ width: 320 }}
          >
            <Stack space="space.150">
              <Text weight="medium">Boundary protection</Text>
              <div style={{ marginInline: -16 }}>
                <Strip label="Two findings are past due." />
              </div>
            </Stack>
          </Box>
        }
        dontText="A negative margin in a style. The number is the card's padding written twice, and the day the card's inset changes this one stays."
      />
      <Pair
        do={
          <Box
            backgroundColor="elevation.surface.raised"
            padding="space.200"
            className="rounded-large shadow-raised"
            style={{ width: 320 }}
          >
            <Bleed inline="space.200">
              <Strip label="To the edge, not past it." />
            </Bleed>
          </Box>
        }
        doText="The bleed equals the padding: the strip meets the card's edge."
        dont={
          <Box
            backgroundColor="elevation.surface.raised"
            padding="space.200"
            className="rounded-large shadow-raised"
            style={{ width: 320 }}
          >
            <Bleed inline="space.300">
              <Strip label="Past the edge." />
            </Bleed>
          </Box>
        }
        dontText="A bleed larger than the padding it escapes. The strip hangs 8px outside the card, over whatever is beside it."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Box
      backgroundColor="elevation.surface.raised"
      padding="space.200"
      className="rounded-large shadow-raised"
      style={{ width: 360 }}
    >
      <Stack space="space.150">
        <Text weight="medium">Card</Text>
        <Bleed {...args}>
          <Strip label="The child that escapes." />
        </Bleed>
        <Text size="small" color="color.text.subtle">
          The card's padding is space.200.
        </Text>
      </Stack>
    </Box>
  ),
};
