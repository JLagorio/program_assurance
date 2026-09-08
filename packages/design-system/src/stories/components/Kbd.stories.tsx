import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";
import { createRef } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  IconButton,
  Kbd,
  KbdGroup,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Kbd",
  component: Kbd,
  parameters: { layout: "padded" },
  args: { children: "K" },
} satisfies Meta<typeof Kbd>;
export default meta;
type Story = StoryObj<typeof meta>;

const keyRef = createRef<HTMLElement>();
const groupRef = createRef<HTMLElement>();
const editAction = fn();

/** Letters, named glyphs, grouped shortcuts, and key hints in a sentence, tooltip and menu. */
export const KbdMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Keys: letters say themselves; glyphs take a label">
        <Kbd
          ref={keyRef}
          id="search-key"
          title="Search key"
          lang="en"
          dir="ltr"
          data-key="search"
          className="align-middle"
          style={{ verticalAlign: "middle" }}
        >
          K
        </Kbd>
        <Kbd>esc</Kbd>
        <Kbd label="Command" aria-label="Meta" title="Meta key">
          ⌘
        </Kbd>
        <Kbd label="Shift">⇧</Kbd>
        <Kbd label="Option">⌥</Kbd>
        <Kbd label="Enter">↵</Kbd>
        <Kbd label="Up">↑</Kbd>
        <Kbd>Ctrl</Kbd>
      </Specimens>
      <Specimens title="Chords: KbdGroup and the Kbd.Group alias">
        <KbdGroup
          ref={groupRef}
          id="search-shortcut"
          title="Search shortcut"
          aria-label="Command K"
          lang="en"
          dir="ltr"
          data-shortcut="search"
          className="align-middle"
          style={{ verticalAlign: "middle" }}
        >
          <Kbd label="Command">⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <KbdGroup>
          <Kbd label="Command">⌘</Kbd>
          <Kbd label="Shift">⇧</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
        <Kbd.Group title="Control bracket shortcut" aria-label="Control left bracket">
          <Kbd>Ctrl</Kbd>
          <Kbd>[</Kbd>
        </Kbd.Group>
      </Specimens>
      <Specimens title="In a sentence, a tooltip, a menu">
        <Text size="small" color="color.text.subtle">
          Press{" "}
          <KbdGroup>
            <Kbd label="Command">⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>{" "}
          to search.
        </Text>
        <Tooltip defaultOpen>
          <TooltipTrigger
            render={
              <IconButton label="Search" variant="subtle" icon={<Search />} isTooltipDisabled />
            }
          />
          <TooltipContent>
            Search
            <KbdGroup>
              <Kbd label="Command">⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="small">Actions</Button>} />
          <DropdownMenuContent style={{ width: 200 }}>
            <DropdownMenuItem onClick={editAction}>
              Edit
              <DropdownMenuShortcut>
                <KbdGroup>
                  <Kbd label="Command">⌘</Kbd>
                  <Kbd>E</Kbd>
                </KbdGroup>
              </DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              Duplicate
              <DropdownMenuShortcut>
                <KbdGroup>
                  <Kbd label="Command">⌘</Kbd>
                  <Kbd label="Shift">⇧</Kbd>
                  <Kbd>D</Kbd>
                </KbdGroup>
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const key = canvas.getByTitle("Search key");
    const group = canvas.getByTitle("Search shortcut");
    const aliasGroup = canvas.getByTitle("Control bracket shortcut");
    await expect(aliasGroup.tagName).toBe("KBD");
    await expect(aliasGroup).toHaveAttribute("data-slot", "kbd-group");
    await expect(aliasGroup).toHaveAttribute("aria-label", "Control left bracket");
    await expect(aliasGroup.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
    await expect(aliasGroup).toHaveTextContent("Ctrl[");
    await expect(keyRef.current).toBe(key);
    await expect(groupRef.current).toBe(group);
    for (const [element, id, slot] of [
      [key, "search-key", "kbd"],
      [group, "search-shortcut", "kbd-group"],
    ] as const) {
      await expect(element.tagName).toBe("KBD");
      await expect(element).toHaveAttribute("id", id);
      await expect(element).toHaveAttribute("data-slot", slot);
      await expect(element).toHaveAttribute("lang", "en");
      await expect(element).toHaveAttribute("dir", "ltr");
      await expect(element).toHaveClass("align-middle");
      await expect(element).toHaveStyle({ verticalAlign: "middle" });
    }
    await expect(key).toHaveAttribute("data-key", "search");
    await expect(key).toHaveTextContent("K");
    await expect(key).not.toHaveAttribute("aria-label");
    await expect(group).toHaveAttribute("data-shortcut", "search");
    await expect(group).toHaveAttribute("aria-label", "Command K");
    await expect(group.children).toHaveLength(2);
    await expect(within(group).getByLabelText("Command")).toHaveTextContent("⌘");
    await expect(canvas.getByTitle("Meta key")).toHaveAttribute("aria-label", "Meta");
    await expect(canvas.getByLabelText("Enter")).toHaveTextContent("↵");

    for (const cap of canvasElement.querySelectorAll<HTMLElement>('[data-slot="kbd"]')) {
      await expect(cap.getBoundingClientRect().height).toBe(16);
      await expect(cap.getBoundingClientRect().width).toBeGreaterThanOrEqual(16);
      await expect(cap.tabIndex).toBe(-1);
    }
    for (const chord of canvasElement.querySelectorAll<HTMLElement>('[data-slot="kbd-group"]')) {
      await expect(getComputedStyle(chord).columnGap).toBe("4px");
      await expect(chord.tabIndex).toBe(-1);
    }

    const search = canvas.getByRole("button", { name: "Search" });
    const actions = canvas.getByRole("button", { name: "Actions" });
    search.focus();
    await userEvent.tab();
    await expect(actions).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect(search).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    const menu = await page.findByRole("menu");
    const edit = within(menu).getByRole("menuitem", { name: /^Edit/ });
    await waitFor(() => expect(edit).toHaveFocus());
    await expect(edit.querySelector('[data-slot="kbd-group"]')).toBeVisible();
    await expect(edit.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
    editAction.mockClear();
    await userEvent.keyboard("{Enter}");
    await expect(editAction).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(actions).toHaveFocus());
  },
};

export const Playground: Story = {};
