import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Checkbox,
  Input,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from "../../components";
import { MODE_STORAGE_KEY, ModeProvider, ModeSwitch, useMode, type ColorMode } from "../../mode";
import { Box, Inline, Stack, Text } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";
import { measure, settled, type Paint } from "../tokens/_contrast";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix, Specimens } = storyLayout;
const { Pair } = pairLayout;

const meta = {
  title: "Components/Mode",
  component: ModeSwitch,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ModeSwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

function Resolved() {
  const { mode, resolved } = useMode();
  return (
    <Text size="small" color="color.text.subtle">
      Choice: {mode} · on screen: {resolved} · stored under {MODE_STORAGE_KEY}
    </Text>
  );
}

export const Playground: Story = {
  args: { value: "system", showLabels: true },
  render: (args) => <ModeSwitch {...args} onChange={() => {}} />,
};

/** The provider and the control together. The choice is stored in this browser and applied to the root, so it outlives the toolbar's setting until you change either. */
export const Live: Story = {
  render: () => (
    <ModeProvider>
      <Stack space="space.150">
        <ModeSwitch />
        <Resolved />
      </Stack>
    </ModeProvider>
  ),
};

function Controlled() {
  const [mode, setMode] = useState<ColorMode>("dark");
  return (
    <Stack space="space.150">
      <ModeSwitch value={mode} onChange={setMode} showLabels />
      <Text size="small" color="color.text.subtle">
        Held by the story, not stored: {mode}
      </Text>
    </Stack>
  );
}
/** `value` and `onChange` override the provider, for a settings form that commits later. */
export const ControlledStory: Story = { name: "Controlled", render: () => <Controlled /> };

/** Each state, icons only and with labels; then the control in a row of chrome. Nothing here touches the root. */
export const ModeMatrix: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["icons", "labels"] as const}
        cols={["light", "dark", "system"] as const}
        rowLabel="form"
        render={(form, mode) => (
          <ModeSwitch value={mode} onChange={() => {}} showLabels={form === "labels"} />
        )}
      />
      <Specimens title="In a row of chrome">
        <Inline space="space.100" alignBlock="center">
          <Text size="small" color="color.text.subtle">
            Appearance
          </Text>
          <ModeSwitch value="system" onChange={() => {}} />
        </Inline>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. Flip the toolbar to dark for the second pair. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<ModeSwitch value="system" onChange={() => {}} showLabels />}
        doText="Three states. System is the default, so a reader who never touches it gets what their machine says."
        dont={
          <Inline space="space.100" alignBlock="center">
            <Text size="small">Dark mode</Text>
            <Button variant="secondary" size="small">
              Off
            </Button>
          </Inline>
        }
        dontText="A two-state toggle. It has no answer for a machine that flips at dusk, and it pins a choice the reader never made."
      />
      <Pair
        do={
          <Box
            padding="space.200"
            backgroundColor="elevation.surface.raised"
            className="rounded-large border border-default"
          >
            <Text>On the surface token: the card follows the mode.</Text>
          </Box>
        }
        doText="Every colour is a token, so the mode flips everything at once and nothing is written twice."
        dont={
          <div
            className="rounded-large border border-default p-200"
            style={{ background: "#ffffff", color: "#172b4d" }}
          >
            <Text as="span">A hex colour: the card glares in dark.</Text>
          </div>
        }
        dontText="A colour by hand. In light it passes; in dark it is a white card on a dark page, and no switch can fix it."
      />
    </Stack>
  ),
};

/** A controlled read-only field must not silently write the surrounding provider. */
export const ControlledOwnership: Story = {
  render: () => (
    <ModeProvider storageKey="ledger.story.mode-ownership">
      <Stack>
        <ModeSwitch value="light" showLabels aria-label="Read-only draft" />
        <Resolved />
      </Stack>
    </ModeProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = canvas.getByText(/^Choice:/).textContent;
    const draft = within(canvas.getByRole("group", { name: "Read-only draft" }));
    await userEvent.click(draft.getByRole("button", { name: "Dark" }));
    await expect(draft.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(canvas.getByText(/^Choice:/)).toHaveTextContent(before ?? "");
  },
};

const storedKey = "ledger.story.mode-stored";

function StoredChoice() {
  return (
    <Stack space="space.300">
      <ModeProvider storageKey={storedKey}>
        <Stack space="space.150">
          <Inline space="space.100" alignBlock="center">
            <Button size="small">Before the switch</Button>
            <ModeSwitch />
          </Inline>
          <Resolved />
        </Stack>
      </ModeProvider>
      {/* A second provider with the same key, as a settings page beside the top nav would be. */}
      <ModeProvider storageKey={storedKey}>
        <ModeSwitch aria-label="Appearance, second provider" showLabels />
      </ModeProvider>
    </Stack>
  );
}

/**
 * The switch reads the stored choice as an external store: a reader who chose Dark sees Dark
 * pressed from the first client render, not System until the page settles, a choice made in
 * another tab reaches this one through the storage event, and a second provider on the page with
 * the same key follows a choice made through the first. The group is named Appearance and its
 * items Light, Dark and System; Tab lands on the pressed one, and each icon's name shows in a
 * tooltip.
 */
export const StoredAndShared: Story = {
  name: "Stored, and shared across tabs",
  beforeEach: () => {
    localStorage.setItem(storedKey, "dark");
    return () => localStorage.removeItem(storedKey);
  },
  render: () => <StoredChoice />,
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement);
    const root = document.documentElement;
    try {
      const group = canvas.getByRole("group", { name: "Appearance" });
      const item = (name: string) => within(group).getByRole("button", { name });
      await expect(item("Dark")).toHaveAttribute("aria-pressed", "true");
      await expect(item("Light")).toHaveAttribute("aria-pressed", "false");
      await expect(item("System")).toHaveAttribute("aria-pressed", "false");
      // Tab lands on the pressed mode, and the icon's name shows.
      canvas.getByRole("button", { name: "Before the switch" }).focus();
      await userEvent.tab();
      await expect(item("Dark")).toHaveFocus();
      await waitFor(() =>
        expect(
          document.querySelector('[data-slot="tooltip-content"][data-open]'),
        ).toHaveTextContent("Dark"),
      );
      await userEvent.keyboard("{ArrowRight}");
      await expect(item("System")).toHaveFocus();
      await waitFor(() =>
        expect(
          document.querySelector('[data-slot="tooltip-content"][data-open]'),
        ).toHaveTextContent("System"),
      );
      await userEvent.keyboard("{Escape}");
      // Another tab chooses Light: this one follows, pressed item and root alike.
      localStorage.setItem(storedKey, "light");
      window.dispatchEvent(new StorageEvent("storage", { key: storedKey, newValue: "light" }));
      await waitFor(() => expect(item("Light")).toHaveAttribute("aria-pressed", "true"));
      await expect(root).toHaveAttribute("data-color-mode", "light");
      await expect(canvas.getByText(/^Choice:/)).toHaveTextContent("Choice: light");
      // And back to System, which clears the stored key.
      localStorage.removeItem(storedKey);
      window.dispatchEvent(new StorageEvent("storage", { key: storedKey, newValue: null }));
      await waitFor(() => expect(item("System")).toHaveAttribute("aria-pressed", "true"));
      // A choice made through one provider reaches the other on the page with the same key.
      const second = canvas.getByRole("group", { name: "Appearance, second provider" });
      await expect(within(second).getByRole("button", { name: "System" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await userEvent.click(item("Dark"));
      await expect(localStorage.getItem(storedKey)).toBe("dark");
      await waitFor(() =>
        expect(within(second).getByRole("button", { name: "Dark" })).toHaveAttribute(
          "aria-pressed",
          "true",
        ),
      );
    } finally {
      // The toolbar owns the root's mode; the provider applied the stored one, so give it back.
      const toolbar = String(globals["mode"] ?? "light");
      if (toolbar === "system") delete root.dataset["colorMode"];
      else root.dataset["colorMode"] = toolbar;
    }
  },
};

/**
 * Increased contrast is the document's second setting beside the mode: `prefers-contrast: more`
 * turns it on, and `data-contrast-mode="more"` or `"no-preference"` on the root pins it. This story
 * pins it on through the toolbar's Contrast; flip Contrast to Standard to compare, and Mode for dark.
 * Field and choice boundaries, the hairline, and the pressed, selected and highlighted fills read
 * 3:1 against the surface, and a focus ring on a selected fill 3:1 against the fill, measured in
 * the browser.
 */
export const IncreasedContrast: Story = {
  globals: { contrast: "more" },
  render: () => (
    <Stack space="space.300">
      <Stack space="space.100">
        <Text as="label" size="small" weight="medium" htmlFor="contrast-name">
          Name
        </Text>
        <Input id="contrast-name" defaultValue="Quarterly review" />
      </Stack>
      <Inline space="space.300" alignBlock="center" shouldWrap>
        <label className="inline-flex items-center gap-100">
          <Checkbox />
          Include archived
        </label>
        <label className="inline-flex items-center gap-100">
          <Switch />
          Notify me
        </label>
      </Inline>
      <RadioGroup aria-label="Frequency" defaultValue="monthly" className="flex-row gap-300">
        <label className="inline-flex items-center gap-100">
          <RadioGroupItem value="monthly" />
          Monthly
        </label>
        <label className="inline-flex items-center gap-100">
          <RadioGroupItem value="quarterly" />
          Quarterly
        </label>
      </RadioGroup>
      <ToggleGroup aria-label="View" defaultValue={["table"]}>
        <ToggleGroupItem value="table">Table</ToggleGroupItem>
        <ToggleGroupItem value="board">Board</ToggleGroupItem>
      </ToggleGroup>
      <Separator />
      <Stack space="space.050">
        <Box
          data-state-fill="selected"
          padding="space.100"
          backgroundColor="color.background.selected"
          className="flex items-center gap-100 rounded-medium"
        >
          <Checkbox aria-label="Select row" defaultChecked />
          <Text color="color.text.selected">Selected: the row the reader chose</Text>
        </Box>
        <Box
          data-state-fill="highlighted"
          padding="space.100"
          backgroundColor="color.background.neutral.subtle.hovered"
          className="rounded-medium"
        >
          <Text>Highlighted: the row the pointer or the keyboard is on</Text>
        </Box>
      </Stack>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(document.documentElement).toHaveAttribute("data-contrast-mode", "more");
    // The root took the contrast as the story mounted; let the colour transitions finish first.
    await settled(canvasElement);
    const atLeast = async (el: Element, paint: Paint, min: number) =>
      expect(
        measure(el, paint),
        `${el.getAttribute("data-slot") ?? el.tagName} ${paint}`,
      ).toBeGreaterThanOrEqual(min);

    await atLeast(canvas.getByRole("textbox", { name: "Name" }), "border", 3);
    await atLeast(canvas.getByRole("checkbox", { name: "Include archived" }), "border", 3);
    await atLeast(canvas.getByRole("radio", { name: "Quarterly" }), "border", 3);
    await atLeast(canvas.getByRole("switch", { name: "Notify me" }), "background", 3);
    const separator = canvasElement.querySelector('[data-slot="separator"]');
    if (!separator) throw new Error("no separator");
    await atLeast(separator, "border", 3);

    // A pressed toggle is a fill at 3:1; pressing the other moves the fill with the state.
    const table = canvas.getByRole("button", { name: "Table" });
    const board = canvas.getByRole("button", { name: "Board" });
    await expect(table).toHaveAttribute("aria-pressed", "true");
    await atLeast(table, "background", 3);
    await userEvent.click(board);
    await settled(canvasElement);
    await expect(board).toHaveAttribute("aria-pressed", "true");
    await atLeast(board, "background", 3);

    for (const state of ["Selected", "Highlighted"]) {
      const text = canvas.getByText(new RegExp(`^${state}:`));
      const fill = text.closest("[data-state-fill]");
      if (!fill) throw new Error(`no ${state} fill`);
      await atLeast(fill, "background", 3);
      await atLeast(text, "text", 4.5);
    }

    // A control focused on a selected fill draws its ring on the fill, and the ring keeps 3:1
    // against it as well as against the surface.
    const rowCheckbox = canvas.getByRole("checkbox", { name: "Select row" });
    for (let step = 0; step < 12 && document.activeElement !== rowCheckbox; step++)
      await userEvent.tab();
    await expect(rowCheckbox).toHaveFocus();
    await expect(rowCheckbox).toHaveAttribute("aria-checked", "true");
    await settled(canvasElement);
    await atLeast(rowCheckbox, "outline", 3);
  },
};
