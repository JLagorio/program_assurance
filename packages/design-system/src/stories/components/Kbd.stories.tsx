import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";
import { createRef, useEffect } from "react";
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
  KbdShortcut,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  formatShortcut,
  getModifierKey,
  shortcutKeys,
  useFormatShortcut,
  useModifierKey,
} from "../../components";
import { LedgerProvider } from "../../mode";
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

const caps = (el: HTMLElement) =>
  Array.from(el.querySelectorAll<HTMLElement>('[data-slot="kbd"]'), (cap) => cap.textContent);

/** A shortcut written once, `Mod+K`, drawn in each platform's keys: ⌘ K on Apple platforms, Ctrl K elsewhere, modifiers in the platform's order. The caps are hidden from a screen reader, which hears the keys' names once ("Command K"). The same keys come as strings from formatShortcut, and every word from the locale. */
export const Shortcuts: Story = {
  render: () => (
    <Stack space="space.400">
      <Specimens title="Apple platforms: modifier meta">
        <KbdShortcut keys="Mod+K" modifier="meta" data-testid="Apple search" />
        <KbdShortcut keys="Mod+Shift+P" modifier="meta" data-testid="Apple palette" />
        <KbdShortcut keys="Ctrl+[" modifier="meta" data-testid="Apple side nav" />
        <KbdShortcut keys="Alt+Enter" modifier="meta" data-testid="Apple option enter" />
      </Specimens>
      <Specimens title="Elsewhere: modifier ctrl">
        <KbdShortcut keys="Mod+K" modifier="ctrl" data-testid="Other search" />
        <KbdShortcut keys="Mod+Shift+P" modifier="ctrl" data-testid="Other palette" />
        <KbdShortcut keys="Ctrl+[" modifier="ctrl" data-testid="Other side nav" />
        <KbdShortcut keys="Alt+Enter" modifier="ctrl" data-testid="Other alt enter" />
      </Specimens>
      <Specimens title="Named keys: one cap each, one spoken name">
        {["ArrowUp", "ArrowDown", "Enter", "Escape", "Tab", "Backspace", "F2"].map((key) => (
          <KbdShortcut key={key} keys={key} modifier="ctrl" data-testid={key} />
        ))}
      </Specimens>
      <Specimens title="As strings: formatShortcut, for a hint, a title or aria-keyshortcuts">
        <Text size="small" data-testid="apple-strings">
          {["text", "label", "aria"]
            .map((as) =>
              formatShortcut("Mod+Shift+P", {
                modifier: "meta",
                as: as as "text" | "label" | "aria",
              }),
            )
            .join(" · ")}
        </Text>
        <Text size="small" data-testid="other-strings">
          {["text", "label", "aria"]
            .map((as) =>
              formatShortcut("Mod+Shift+P", {
                modifier: "ctrl",
                as: as as "text" | "label" | "aria",
              }),
            )
            .join(" · ")}
        </Text>
      </Specimens>
      <Specimens title="Localized: the words from a LedgerProvider">
        <LedgerProvider
          locale="de-DE"
          messages={{
            keyCapControl: "Strg",
            keyControl: "Steuerung",
            keyCapShift: "Umschalt",
            keyShift: "Umschalt",
          }}
        >
          <KbdShortcut keys="Mod+Shift+P" modifier="ctrl" data-testid="German palette" />
        </LedgerProvider>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cases = [
      ["Apple search", "meta", ["⌘", "K"], "Command K"],
      ["Apple palette", "meta", ["⇧", "⌘", "P"], "Shift Command P"],
      ["Apple side nav", "meta", ["⌃", "["], "Control ["],
      ["Apple option enter", "meta", ["⌥", "↵"], "Option Enter"],
      ["Other search", "ctrl", ["Ctrl", "K"], "Control K"],
      ["Other palette", "ctrl", ["Ctrl", "Shift", "P"], "Control Shift P"],
      ["Other side nav", "ctrl", ["Ctrl", "["], "Control ["],
      ["Other alt enter", "ctrl", ["Alt", "↵"], "Alt Enter"],
      ["ArrowUp", "ctrl", ["↑"], "Up arrow"],
      ["Escape", "ctrl", ["Esc"], "Escape"],
      ["F2", "ctrl", ["F2"], "F2"],
      ["German palette", "ctrl", ["Strg", "Umschalt", "P"], "Steuerung Umschalt P"],
    ] as const;
    for (const [title, modifier, keys, name] of cases) {
      const shortcut = canvas.getByTestId(title);
      await expect(shortcut.tagName).toBe("KBD");
      await expect(shortcut).toHaveAttribute("data-slot", "kbd-shortcut");
      await expect(shortcut).toHaveAttribute("data-modifier", modifier);
      await expect(caps(shortcut)).toEqual(keys);
      // The glyphs are hidden; one visually hidden line names the keys.
      for (const cap of shortcut.querySelectorAll('[data-slot="kbd"]')) {
        await expect(cap).toHaveAttribute("aria-hidden", "true");
        await expect(cap.getBoundingClientRect().height).toBe(16);
      }
      await expect(shortcut.querySelector(".sr-only")).toHaveTextContent(name);
      await expect(getComputedStyle(shortcut).columnGap).toBe("4px");
    }
    await expect(canvas.getByTestId("apple-strings")).toHaveTextContent(
      "⇧⌘P · Shift Command P · Shift+Meta+P",
    );
    await expect(canvas.getByTestId("other-strings")).toHaveTextContent(
      "Ctrl+Shift+P · Control Shift P · Control+Shift+P",
    );
    await expect(shortcutKeys("Mod+K", { modifier: "meta" })).toEqual([
      { cap: "⌘", name: "Command", aria: "Meta" },
      { cap: "K", name: "K", aria: "K" },
    ]);
  },
};

const onSearch = fn();

/** The platform's modifier, chosen once for the page. `useModifierKey` gives a render the same answer as `getModifierKey` gives a key handler, so the hint on the button, its `aria-keyshortcuts` and the handler agree. The server renders Ctrl; the browser's answer follows hydration. */
function SearchWithShortcut() {
  const modifier = useModifierKey();
  const format = useFormatShortcut();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const held = getModifierKey() === "meta" ? event.metaKey : event.ctrlKey;
      if (held && !event.repeat && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onSearch(modifier);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modifier]);
  return (
    <Inline space="space.200" alignBlock="center">
      <Button
        iconBefore={<Search />}
        aria-keyshortcuts={format("Mod+K", "aria")}
        onClick={() => onSearch(modifier)}
      >
        Search <KbdShortcut keys="Mod+K" />
      </Button>
      <Text size="small" color="color.text.subtle" data-testid="modifier">
        {`This platform: ${modifier}, ${format("Mod+K")}`}
      </Text>
    </Inline>
  );
}

export const PlatformModifier: Story = {
  render: () => <SearchWithShortcut />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const platform = getModifierKey();
    const apple = platform === "meta";
    const button = canvas.getByRole("button", { name: /^Search/ });
    await expect(button).toHaveAttribute("aria-keyshortcuts", apple ? "Meta+K" : "Control+K");
    await expect(button).toHaveAccessibleName(apple ? "Search Command K" : "Search Control K");
    await expect(button.querySelector('[data-slot="kbd-shortcut"]')).toHaveAttribute(
      "data-modifier",
      platform,
    );
    await expect(canvas.getByTestId("modifier")).toHaveTextContent(
      `This platform: ${platform}, ${apple ? "⌘K" : "Ctrl+K"}`,
    );
    onSearch.mockClear();
    await userEvent.keyboard(apple ? "{Meta>}k{/Meta}" : "{Control>}k{/Control}");
    await expect(onSearch).toHaveBeenCalledTimes(1);
    await expect(onSearch).toHaveBeenCalledWith(platform);
    // The other platform's modifier does nothing here.
    await userEvent.keyboard(apple ? "{Control>}k{/Control}" : "{Meta>}k{/Meta}");
    await expect(onSearch).toHaveBeenCalledTimes(1);
    await userEvent.click(button);
    await expect(onSearch).toHaveBeenCalledTimes(2);
  },
};

export const Playground: Story = {};
