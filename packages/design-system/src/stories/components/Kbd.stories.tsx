import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";

import { Button, DropdownMenu, IconButton, Kbd, Tooltip } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Kbd",
  component: Kbd,
  parameters: { layout: "padded" },
  args: { children: "K" },
} satisfies Meta<typeof Kbd>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Letters, glyphs with their spoken names, chords in a Kbd.Group, and the cap in a sentence, a tooltip and a menu. */
export const KbdMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Keys: letters say themselves; glyphs take a label">
        <Kbd>K</Kbd>
        <Kbd>esc</Kbd>
        <Kbd label="Command">⌘</Kbd>
        <Kbd label="Shift">⇧</Kbd>
        <Kbd label="Option">⌥</Kbd>
        <Kbd label="Enter">↵</Kbd>
        <Kbd label="Up">↑</Kbd>
        <Kbd>Ctrl</Kbd>
      </Specimens>
      <Specimens title="Chords: Kbd.Group">
        <Kbd.Group>
          <Kbd label="Command">⌘</Kbd>
          <Kbd>K</Kbd>
        </Kbd.Group>
        <Kbd.Group>
          <Kbd label="Command">⌘</Kbd>
          <Kbd label="Shift">⇧</Kbd>
          <Kbd>P</Kbd>
        </Kbd.Group>
        <Kbd.Group>
          <Kbd>Ctrl</Kbd>
          <Kbd>[</Kbd>
        </Kbd.Group>
      </Specimens>
      <Specimens title="In a sentence, a tooltip, a menu">
        <Text size="small" color="color.text.subtle">
          Press{" "}
          <Kbd.Group>
            <Kbd label="Command">⌘</Kbd>
            <Kbd>K</Kbd>
          </Kbd.Group>{" "}
          to search.
        </Text>
        <Tooltip
          defaultOpen
          content={
            <Inline space="space.075" alignBlock="center">
              Search
              <Kbd.Group>
                <Kbd label="Command">⌘</Kbd>
                <Kbd>K</Kbd>
              </Kbd.Group>
            </Inline>
          }
        >
          <IconButton label="Search" variant="subtle" icon={<Search />} isTooltipDisabled />
        </Tooltip>
        <DropdownMenu trigger={<Button size="small">Actions</Button>}>
          <DropdownMenu.Item
            onSelect={() => {}}
            trailing={
              <Kbd.Group>
                <Kbd label="Command">⌘</Kbd>
                <Kbd>E</Kbd>
              </Kbd.Group>
            }
          >
            Edit
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => {}}
            trailing={
              <Kbd.Group>
                <Kbd label="Command">⌘</Kbd>
                <Kbd label="Shift">⇧</Kbd>
                <Kbd>D</Kbd>
              </Kbd.Group>
            }
          >
            Duplicate
          </DropdownMenu.Item>
        </DropdownMenu>
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
          <Kbd.Group>
            <Kbd label="Command">⌘</Kbd>
            <Kbd label="Shift">⇧</Kbd>
            <Kbd>P</Kbd>
          </Kbd.Group>
        }
        doText="One cap per key, in a group: the reader sees three keys pressed together."
        dont={<Kbd>⌘ ⇧ P</Kbd>}
        dontText="A chord on one cap. It reads as one key, and no keyboard has it."
      />
      <Pair
        do={
          <Text size="small" color="color.text.subtle">
            Press{" "}
            <Kbd.Group>
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </Kbd.Group>{" "}
            to search.
          </Text>
        }
        doText="Keys as caps, in the sentence that says what they do."
        dont={
          <Text size="small" color="color.text.subtle">
            Press Ctrl+K to search.
          </Text>
        }
        dontText="A shortcut as text. The plus is not a key, and the eye cannot find the keys in the sentence."
      />
      <Pair
        do={
          <Inline space="space.075" alignBlock="center">
            <Kbd label="Command">⌘</Kbd>
            <Text size="small" color="color.text.subtle">
              read as “Command”
            </Text>
          </Inline>
        }
        doText="A glyph is given its name, so the screen reader says the key."
        dont={
          <Inline space="space.075" alignBlock="center">
            <Kbd>⌘</Kbd>
            <Text size="small" color="color.text.subtle">
              read as “place of interest sign”
            </Text>
          </Inline>
        }
        dontText="A glyph left to Unicode's name for it."
      />
      <Pair
        do={<Button size="small">Search</Button>}
        doText="A thing to click is a Button, which may show the shortcut in its tooltip."
        dont={
          <Kbd className="cursor-pointer" label="Search">
            ⌘ K
          </Kbd>
        }
        dontText="A cap as a control. A key cap is what to press, never what to click."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
