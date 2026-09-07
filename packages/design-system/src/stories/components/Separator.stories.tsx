import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, Link2 } from "lucide-react";

import { Button, IconButton, Item, Separator, Toggle } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: { layout: "padded" },
  args: {},
} satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Horizontal between blocks, vertical between groups in a toolbar, and decorative under a heading. */
export const SeparatorMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Horizontal, between two blocks in a Stack">
        <Box style={{ width: 360 }}>
          <Stack space="space.200">
            <Text>What the control requires.</Text>
            <Separator />
            <Text>How the system meets it.</Text>
          </Stack>
        </Box>
      </Specimens>
      <Specimens title="Vertical, between groups in a toolbar row">
        <Inline space="space.050" alignBlock="center">
          <Toggle aria-label="Bold" icon={<Bold />} />
          <Toggle aria-label="Italic" icon={<Italic />} />
          <Separator orientation="vertical" />
          <IconButton variant="subtle" label="Link" icon={<Link2 />} />
          <Separator orientation="vertical" />
          <Button size="small" variant="subtle">
            Clear
          </Button>
        </Inline>
      </Specimens>
      <Specimens title="Decorative, a rule under a heading: hidden from a screen reader">
        <Box style={{ width: 360 }}>
          <Stack space="space.100">
            <Text weight="semibold">Evidence</Text>
            <Separator isDecorative />
            <Text color="color.text.subtle">Three items, all current.</Text>
          </Stack>
        </Box>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Item.Group>
            <Item title="Bank reconciliation, July" meta="PDF" trailing="12 Aug" />
            <Item title="Approval matrix" meta="XLSX" trailing="9 Aug" />
            <Item title="Access review" meta="CSV" trailing="2 Aug" />
          </Item.Group>
        }
        doText="Rows draw their own hairlines: an Item.Group, a Table."
        dont={
          <Stack space="space.100">
            <Text>Bank reconciliation, July</Text>
            <Separator />
            <Text>Approval matrix</Text>
            <Separator />
            <Text>Access review</Text>
          </Stack>
        }
        dontText="A separator between every row of a hand-made list. The list should be a list."
      />
      <Pair
        do={
          <Stack space="space.200">
            <Text>Above</Text>
            <Separator />
            <Text>Below</Text>
          </Stack>
        }
        doText="The space around the rule is the parent's gap."
        dont={
          <Stack space="space.200">
            <Separator />
            <Text>Above</Text>
            <Separator />
            <Text>Below</Text>
            <Separator />
          </Stack>
        }
        dontText="A rule at the top and the bottom too. A separator sits between two things; with nothing on one side it is a border, and the container draws that."
      />
      <Pair
        do={
          <Inline space="space.100" alignBlock="center">
            <Text>Left</Text>
            <Separator orientation="vertical" />
            <Text>Right</Text>
          </Inline>
        }
        doText="A vertical rule inside a flex row, stretching to the row."
        dont={
          <Stack space="space.100">
            <Text>Left</Text>
            <Separator orientation="vertical" />
            <Text>Right</Text>
          </Stack>
        }
        dontText="A vertical rule in a column. It has nothing to stretch to and draws nothing."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
