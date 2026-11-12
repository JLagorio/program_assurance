import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { ToggleGroup, ToggleGroupItem } from "../../components";
import {
  TileMap,
  TileMapKey,
  type TileMapFill,
  type TileMapGroup,
  type TileMapMark,
  type TileMapTone,
} from "../../patterns";
import { Stack, Text } from "../../primitives";

type Standing = "in" | "added" | "removed" | "out";

const drawn: Record<Standing, { tone: TileMapTone; fill: TileMapFill; words: string }> = {
  in: { tone: "neutral", fill: "solid", words: "In baseline" },
  added: { tone: "brand", fill: "solid", words: "Added" },
  removed: { tone: "warning", fill: "outline", words: "Removed" },
  out: { tone: "neutral", fill: "empty", words: "Not selected" },
};

const familyNames: [string, string, number][] = [
  ["AC", "Access control", 14],
  ["AU", "Audit and accountability", 9],
  ["CM", "Configuration management", 8],
  ["IA", "Identification and authentication", 7],
  ["SC", "System and communications protection", 16],
  ["SI", "System and information integrity", 10],
];

/** A catalog in small: a fixed pattern, so every run draws the same map. */
const standingAt = (family: number, control: number, part: number, step: number): Standing => {
  const n = family * 31 + control * 7 + part * 3;
  if (n % 5 === 0) return step >= 1 && n % 2 === 0 ? "added" : "out";
  if (n % 11 === 3) return step >= 2 ? "removed" : "in";
  return part > 0 && n % 4 === 1 ? "out" : "in";
};

const catalog = (step: number): TileMapGroup[] =>
  familyNames.map(([code, title, size], family) => {
    let selected = 0;
    const mark = (control: number, part: number): TileMapMark => {
      const standing = standingAt(family, control, part, step);
      if (standing === "in" || standing === "added") selected += 1;
      const name = part ? `${code}-${control}(${part})` : `${code}-${control}`;
      return {
        id: name.toLowerCase(),
        label: part ? `${name} Enhancement ${part}` : `${name} Control ${control}`,
        description: drawn[standing].words,
        tone: drawn[standing].tone,
        fill: drawn[standing].fill,
      };
    };
    const marks = Array.from({ length: size }, (_, index) => ({
      ...mark(index + 1, 0),
      parts: Array.from({ length: (index * 5 + family) % 9 }, (_, part) =>
        mark(index + 1, part + 1),
      ),
    }));
    return { id: code.toLowerCase(), label: code, title, value: selected, marks };
  });

const count = (groups: readonly TileMapGroup[], words: string) =>
  groups
    .flatMap((group) => group.marks.flatMap((mark) => [mark, ...(mark.parts ?? [])]))
    .filter((mark) => mark.description === words).length;

const keyOf = (groups: readonly TileMapGroup[]) =>
  (Object.keys(drawn) as Standing[]).map((standing) => ({
    label: drawn[standing].words,
    tone: drawn[standing].tone,
    fill: drawn[standing].fill,
    value: count(groups, drawn[standing].words),
  }));

const result = catalog(2);

const meta = {
  title: "Patterns/TileMap",
  component: TileMap,
  parameters: { layout: "padded" },
  args: {
    label: "Catalog controls by family, coloured by where each stands in the baseline",
    groups: result,
    layout: "grid",
  },
  argTypes: { layout: { control: "inline-radio", options: ["grid", "skyline", "strip"] } },
} satisfies Meta<typeof TileMap>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Grid: a row a group. An item is a square and the items that belong to it are the bars after it. */
export const Playground: Story = {
  render: (args) => (
    <Stack space="space.200">
      <TileMapKey
        items={[
          { label: "In baseline", tone: "neutral" },
          { label: "Added", tone: "brand" },
          { label: "Removed", tone: "warning", fill: "outline" },
          { label: "Not selected", fill: "empty" },
        ]}
      />
      <TileMap {...args} />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const map = canvasElement.querySelector<HTMLElement>('[data-slot="tile-map"]')!;
    // Without onSelect the map is one image: nothing in it takes focus.
    await expect(map).toHaveAttribute("role", "img");
    await expect(map.querySelectorAll("button, [tabindex]")).toHaveLength(0);
    await expect(map.querySelectorAll('[data-slot="tile-map-group"]')).toHaveLength(6);
    await expect(within(canvasElement).getByText("In baseline")).toBeVisible();
  },
};

/** Skyline: one street. Items stand on the ground line, and what belongs to each rises above it. */
export const Skyline: Story = {
  args: { layout: "skyline" },
  render: Playground.render!,
  play: async ({ canvasElement }) => {
    const map = canvasElement.querySelector<HTMLElement>('[data-slot="tile-map"]')!;
    await expect(map).toHaveAttribute("data-layout", "skyline");
    // A district never runs wider than the map: its street wraps.
    for (const group of map.querySelectorAll('[data-slot="tile-map-group"]'))
      await expect(group.getBoundingClientRect().width).toBeLessThanOrEqual(
        map.getBoundingClientRect().width + 1,
      );
  },
};

function ChoosingMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const [chosen, setChosen] = useState("Nothing chosen");
  return (
    <Stack space="space.200">
      <Text aria-live="polite">{chosen}</Text>
      <TileMap
        label="Catalog controls by family"
        groups={result}
        selected={selected}
        onSelect={(mark, group) => {
          setSelected(mark.id);
          setChosen(`${mark.label} in ${group.title}`);
        }}
      />
    </Stack>
  );
}

/** With `onSelect` the marks are buttons: one Tab stop, arrow keys between marks, a tooltip on each. */
export const Choosing: Story = {
  render: () => <ChoosingMap />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const first = canvas.getByRole("button", { name: /^AC-1 Control 1,/ });
    await userEvent.tab();
    await expect(first).toHaveFocus();
    await waitFor(() => expect(body.getByText("AC-1 Control 1")).toBeVisible());
    // Right goes to the next mark, Down to the next group's first, Home to the map's first.
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("button", { name: /^AC-2 Control 2,/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("button", { name: /^AU-1 Control 1,/ })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("AU-1 Control 1 in Audit and accountability")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /^AU-1 Control 1,/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await userEvent.keyboard("{Home}");
    await expect(first).toHaveFocus();
    // The map stays one Tab stop wherever focus has been.
    await expect(
      canvasElement.querySelectorAll('[data-slot="tile-map-mark"][tabindex="0"]'),
    ).toHaveLength(1);
  },
};

function SteppingMap() {
  const [step, setStep] = useState("2");
  const groups = catalog(Number(step));
  return (
    <Stack space="space.200">
      <ToggleGroup
        size="small"
        spacing={0}
        variant="outline"
        aria-label="Show the baseline after"
        value={[step]}
        onValueChange={(value) => {
          if (value[0]) setStep(value[0]);
        }}
      >
        <ToggleGroupItem value="0">Start</ToggleGroupItem>
        <ToggleGroupItem value="1" aria-label="Step 1">
          1
        </ToggleGroupItem>
        <ToggleGroupItem value="2" aria-label="Step 2">
          2
        </ToggleGroupItem>
      </ToggleGroup>
      <TileMapKey items={keyOf(groups)} />
      <TileMap label="Catalog controls by family" groups={groups} layout="skyline" />
    </Stack>
  );
}

/** The same marks under another state: a mark keeps its place and changes its colour, so a step reads as what moved. */
export const Stepping: Story = {
  render: () => <SteppingMap />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const added = () =>
      canvasElement.querySelectorAll('[data-slot="tile-map"] [data-tone="brand"]');
    const total = canvasElement.querySelectorAll(
      '[data-slot="tile-map"] [data-slot="tile-map-mark"]',
    ).length;
    await expect(added().length).toBeGreaterThan(0);
    await userEvent.click(canvas.getByRole("button", { name: "Start" }));
    await waitFor(() => expect(added()).toHaveLength(0));
    await expect(
      canvasElement.querySelectorAll('[data-slot="tile-map"] [data-slot="tile-map-mark"]'),
    ).toHaveLength(total);
  },
};

/** `strip` is the whole set in one wrapped run with no words drawn: the map small enough for a card, where the card's title and a count say what it is. Each group still names itself to assistive technology when the marks choose. */
export const Strip: Story = {
  args: { layout: "strip" },
  render: (args) => (
    <div style={{ maxWidth: 420 }}>
      <TileMap {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const map = within(canvasElement).getByRole("img", { name: /controls/i });
    await expect(map).toHaveAttribute("data-layout", "strip");
    // The marks wrap inside the map's width: more than one line, and nothing past its edge.
    const marks = [...map.querySelectorAll<HTMLElement>('[data-slot="tile-map-mark"]')];
    const tops = new Set(marks.map((mark) => Math.round(mark.getBoundingClientRect().top)));
    await expect(tops.size).toBeGreaterThan(1);
    const edge = map.getBoundingClientRect().right;
    for (const mark of marks)
      await expect(mark.getBoundingClientRect().right).toBeLessThanOrEqual(edge + 1);
    // A group's words are not drawn.
    const header = map.querySelector<HTMLElement>('[data-slot="tile-map-group-header"]')!;
    await expect(header.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  },
};
