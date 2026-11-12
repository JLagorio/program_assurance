import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Dot,
  KeyValue,
  Scroller,
  ScrollerArrow,
  ScrollerViewport,
  ToggleGroup,
  ToggleGroupItem,
} from "../../components";
import { Ladder, TileMapKey, type LadderLevel, type LadderLink } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";
import { arrows } from "../_lib/direction";
import {
  ladderAt,
  ladderControls,
  ladderCounts,
  ladderDrawn,
  ladderFlagLabel,
  ladderLinks,
  ladderProgram,
  ladderStandings,
  ladderSteps,
} from "../_lib/ladder-data";

const meta = {
  title: "Patterns/Ladder",
  component: Ladder,
  parameters: { layout: "padded" },
  args: {
    label: "What the baseline holds behind each goal, objective, technique and approach",
    flagLabel: (count: number) =>
      count === 1
        ? "1 approach with nothing behind it"
        : `${count} approaches with nothing behind them`,
    levels: [
      {
        id: "goals",
        label: "Goals",
        nodes: [
          {
            id: "withstand",
            title: "Withstand",
            value: 21,
            total: 34,
            valueLabel: "21 of 34 controls held",
            segments: [
              { key: "in", value: 12, label: "12 in baseline" },
              { key: "added", value: 9, tone: "brand", label: "9 added" },
              { key: "removed", value: 2, tone: "warning", fill: "outline", label: "2 removed" },
            ],
          },
          {
            id: "recover",
            title: "Recover",
            value: 14,
            total: 26,
            valueLabel: "14 of 26 controls held",
            segments: [
              { key: "in", value: 9, label: "9 in baseline" },
              { key: "added", value: 5, tone: "brand", label: "5 added" },
            ],
          },
        ],
      },
      {
        id: "objectives",
        label: "Objectives",
        nodes: [
          {
            id: "continue",
            title: "Continue",
            value: 14,
            total: 20,
            valueLabel: "14 of 20 controls held",
            segments: [
              { key: "in", value: 8, label: "8 in baseline" },
              { key: "added", value: 6, tone: "brand", label: "6 added" },
            ],
          },
          {
            id: "constrain",
            title: "Constrain",
            value: 9,
            total: 16,
            valueLabel: "9 of 16 controls held",
            segments: [
              { key: "in", value: 6, label: "6 in baseline" },
              { key: "added", value: 3, tone: "brand", label: "3 added" },
              { key: "removed", value: 2, tone: "warning", fill: "outline", label: "2 removed" },
            ],
          },
          {
            id: "reconstitute",
            title: "Reconstitute",
            value: 7,
            total: 12,
            valueLabel: "7 of 12 controls held",
            segments: [
              { key: "in", value: 5, label: "5 in baseline" },
              { key: "added", value: 2, tone: "brand", label: "2 added" },
            ],
          },
        ],
      },
      {
        id: "techniques",
        label: "Techniques",
        nodes: [
          {
            id: "redundancy",
            title: "Redundancy",
            value: 8,
            total: 11,
            valueLabel: "8 of 11 controls held",
            segments: [
              { key: "in", value: 5, label: "5 in baseline" },
              { key: "added", value: 3, tone: "brand", label: "3 added" },
            ],
          },
          {
            id: "segmentation",
            title: "Segmentation",
            value: 6,
            total: 10,
            valueLabel: "6 of 10 controls held",
            segments: [
              { key: "in", value: 4, label: "4 in baseline" },
              { key: "added", value: 2, tone: "brand", label: "2 added" },
              { key: "removed", value: 1, tone: "warning", fill: "outline", label: "1 removed" },
            ],
          },
        ],
      },
      {
        id: "approaches",
        label: "Approaches",
        layout: "rows",
        nodes: [
          {
            id: "backup",
            title: "Protected Backup and Restore",
            value: 4,
            total: 4,
            valueLabel: "4 of 4 controls held",
            marks: [
              { key: "cp-9", label: "CP-9 System Backup", description: "In baseline" },
              {
                key: "cp-9.1",
                label: "CP-9(1) Testing for Reliability",
                description: "In baseline",
              },
              {
                key: "cp-9.8",
                label: "CP-9(8) Cryptographic Protection",
                description: "Added",
                tone: "brand",
              },
              {
                key: "sc-28",
                label: "SC-28 Protection at Rest",
                description: "Added",
                tone: "brand",
              },
            ],
          },
          {
            id: "surplus",
            title: "Surplus Capacity",
            value: 4,
            total: 5,
            valueLabel: "4 of 5 controls held",
            marks: [
              { key: "cp-2.2", label: "CP-2(2) Capacity Planning", description: "In baseline" },
              { key: "au-4", label: "AU-4 Audit Log Storage Capacity", description: "In baseline" },
              {
                key: "sc-5.2",
                label: "SC-5(2) Capacity and Redundancy",
                description: "In baseline",
              },
              {
                key: "pe-11.1",
                label: "PE-11(1) Alternate Power",
                description: "Added",
                tone: "brand",
              },
              {
                key: "sc-6",
                label: "SC-6 Resource Availability",
                description: "Not selected",
                fill: "empty",
              },
            ],
          },
          {
            id: "replication",
            title: "Replication",
            value: 0,
            total: 2,
            valueLabel: "0 of 2 controls held",
            flagged: true,
            marks: [
              {
                key: "cp-6",
                label: "CP-6 Alternate Storage Site",
                description: "Not selected",
                fill: "empty",
              },
              {
                key: "cp-7",
                label: "CP-7 Alternate Processing Site",
                description: "Not selected",
                fill: "empty",
              },
            ],
          },
          {
            id: "predefined",
            title: "Predefined Segmentation",
            value: 5,
            total: 7,
            valueLabel: "5 of 7 controls held",
            marks: [
              {
                key: "ac-4",
                label: "AC-4 Information Flow Enforcement",
                description: "In baseline",
              },
              { key: "sc-7", label: "SC-7 Boundary Protection", description: "In baseline" },
              {
                key: "sc-3",
                label: "SC-3 Security Function Isolation",
                description: "In baseline",
              },
              {
                key: "sc-7.21",
                label: "SC-7(21) Isolation of System Components",
                description: "Added",
                tone: "brand",
              },
              {
                key: "sc-32",
                label: "SC-32 System Partitioning",
                description: "Added",
                tone: "brand",
              },
              {
                key: "sc-7.13",
                label: "SC-7(13) Isolation of Security Tools",
                description: "Removed",
                tone: "warning",
                fill: "outline",
              },
              {
                key: "sc-49",
                label: "SC-49 Hardware-enforced Separation",
                description: "Not selected",
                fill: "empty",
              },
            ],
          },
          {
            id: "dynamic",
            title: "Dynamic Segmentation and Isolation",
            value: 1,
            total: 3,
            valueLabel: "1 of 3 controls held",
            marks: [
              {
                key: "ir-4.2",
                label: "IR-4(2) Dynamic Reconfiguration",
                description: "In baseline",
              },
              {
                key: "sc-7.20",
                label: "SC-7(20) Dynamic Isolation",
                description: "Not selected",
                fill: "empty",
              },
              {
                key: "ac-4.3",
                label: "AC-4(3) Dynamic Flow Control",
                description: "Not selected",
                fill: "empty",
              },
            ],
          },
        ],
      },
    ],
    links: [
      { from: "backup", to: "redundancy" },
      { from: "surplus", to: "redundancy" },
      { from: "replication", to: "redundancy" },
      { from: "predefined", to: "segmentation" },
      { from: "dynamic", to: "segmentation" },
      { from: "redundancy", to: "continue" },
      { from: "redundancy", to: "reconstitute" },
      { from: "segmentation", to: "constrain" },
      { from: "segmentation", to: "continue" },
      { from: "continue", to: "withstand" },
      { from: "constrain", to: "withstand" },
      { from: "reconstitute", to: "recover" },
      { from: "backup", to: "reconstitute" },
      { from: "surplus", to: "continue" },
      { from: "replication", to: "continue" },
      { from: "replication", to: "reconstitute" },
      { from: "predefined", to: "constrain" },
      { from: "dynamic", to: "constrain" },
      { from: "dynamic", to: "continue" },
    ],
  },
} satisfies Meta<typeof Ladder>;
export default meta;
type Story = StoryObj<typeof meta>;

const root = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="ladder"]')!;
/** Whether the ladder has room for its levels side by side: a phone and a narrow frame stack it, with no wires. */
const inColumns = (ladder: HTMLElement) => ladder.dataset["layout"] === "columns";
/** The room the ladder's levels need side by side, as the stylesheet works it out from the tokens. */
const roomNeeded = (ladder: HTMLElement) =>
  ladder.querySelector<HTMLElement>('[data-slot="ladder-room"] > span')!.offsetWidth;
/** A level's heading as it reads: its name and its counts. */
const headings = (ladder: HTMLElement) =>
  Array.from(ladder.querySelectorAll('[data-slot="ladder-level-header"]'), (heading) =>
    [
      heading.querySelector('[data-slot="ladder-level-label"]')?.textContent,
      heading.querySelector('[data-slot="ladder-level-count"]')?.textContent,
    ].join(" "),
  );
const lit = (ladder: HTMLElement) =>
  Array.from(ladder.querySelectorAll("[data-ladder-id][data-lit]"), (node) =>
    node.getAttribute("data-ladder-id"),
  );
/** Wait for the layout the wires are measured in, so a count of wires is not read before it. */
const settled = async (ladder: HTMLElement, wires: number) =>
  waitFor(() =>
    expect(ladder.querySelectorAll('[data-slot="ladder-wire"]')).toHaveLength(
      inColumns(ladder) ? wires : 0,
    ),
  );
/** Two frames: a resize is answered in the next one, so after two the ladder has answered. */
const twoFrames = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
/** The ladder at rest: its type has arrived and its observer's first report has been answered, so what is measured from here on is measured for a reason. */
const atRest = async (ladder: HTMLElement) => {
  await ladder.ownerDocument.fonts.ready;
  await twoFrames();
};

/** Four levels, the last one line a node. A node is a button named by its title and its figure in words; a wire joins two nodes of neighbouring levels; the ladder is one Tab stop. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ladder = root(canvasElement);
    await expect(canvas.getByRole("group", { name: /^What the baseline holds/ })).toBe(ladder);
    // A level is a named list of buttons; the rows are lists under the node they stand beside.
    await expect(headings(ladder)).toEqual([
      "Goals 2",
      "Objectives 3",
      "Techniques 2",
      "Approaches 5",
    ]);
    await expect(canvas.getByRole("list", { name: /^Objectives/ })).toBeVisible();
    await expect(
      within(canvas.getByRole("list", { name: "Approaches, Redundancy" })).getAllByRole("button"),
    ).toHaveLength(3);
    // A node that leads to a flagged one counts it, in its name too.
    const withstand = canvas.getByRole("button", {
      name: "Withstand: 21 of 34 controls held, 1 approach with nothing behind it",
    });
    await expect(withstand).toHaveAttribute("aria-pressed", "false");
    await expect(withstand).toHaveAccessibleDescription("Objectives: Continue and Constrain");
    await expect(
      canvas.getByRole("button", {
        name: "Redundancy: 8 of 11 controls held, 1 approach with nothing behind it",
      }),
    ).toBeVisible();
    // The level of many says how many of its nodes are flagged.
    await expect(
      within(ladder.querySelector("[data-rows]")!).getByText("1 approach with nothing behind it"),
    ).toHaveClass("sr-only");
    // A wire a link between neighbours; a link that passes over a level draws none.
    await settled(ladder, 12);
    // One Tab stop: the first node, until another is focused or chosen.
    await expect(ladder.querySelectorAll('[data-ladder-id][tabindex="0"]')).toHaveLength(1);
    await expect(withstand).toHaveAttribute("tabindex", "0");
  },
};

/** Choosing a node keeps the paths through it and dims the rest, and each heading counts what is kept. A path is finer than the wires: Continue keeps the approaches linked to it, not every approach of its techniques. Pressing the node again lets go. */
export const Chosen: Story = {
  args: { defaultSelected: "continue" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ladder = root(canvasElement);
    const node = canvas.getByRole("button", { name: /^Continue:/ });
    await expect(node).toHaveAttribute("aria-pressed", "true");
    await expect(ladder).toHaveAttribute("data-active");
    await expect(headings(ladder)).toEqual([
      "Goals 1 of 2",
      "Objectives 1 of 3",
      "Techniques 2 of 2",
      "Approaches 3 of 5",
    ]);
    // Redundancy has three approaches; the two linked to Continue are on its path.
    await expect(lit(ladder).sort()).toEqual(
      [
        "continue",
        "dynamic",
        "redundancy",
        "replication",
        "segmentation",
        "surplus",
        "withstand",
      ].sort(),
    );
    await expect(
      canvas.getByRole("button", { name: /^Surplus Capacity:/ }),
    ).toHaveAccessibleDescription(/^On the path\. /);
    // What is off the path steps back and stays readable: its words keep their contrast.
    const off = canvas.getByRole("button", { name: /^Recover:/ });
    await expect(getComputedStyle(off).opacity).toBe("1");
    await expect(getComputedStyle(off.querySelector('[data-slot="tally"]')!).opacity).not.toBe("1");
    await settled(ladder, 12);
    if (inColumns(ladder))
      await expect(ladder.querySelectorAll('[data-slot="ladder-wire"][data-lit]')).toHaveLength(6);
    await userEvent.click(node);
    await expect(node).toHaveAttribute("aria-pressed", "false");
    await expect(ladder).not.toHaveAttribute("data-active");
    await expect(headings(ladder)[3]).toBe("Approaches 5");
  },
};

/** `highlighted` keeps the paths an outside control points at, here the flagged approach, and presses no node: what the hole reaches, up to the goals. */
export const Highlighted: Story = {
  args: { highlighted: ["replication"] },
  play: async ({ canvasElement }) => {
    const ladder = root(canvasElement);
    await expect(ladder).toHaveAttribute("data-active");
    await expect(ladder.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    await expect(headings(ladder)).toEqual([
      "Goals 2 of 2",
      "Objectives 2 of 3",
      "Techniques 1 of 2",
      "Approaches 1 of 5",
    ]);
    // The flagged row's wire is in the danger tone, and its empty marks are outlines.
    const row = ladder.querySelector<HTMLElement>('[data-ladder-id="replication"]')!;
    await expect(row).toHaveAttribute("data-flagged");
    const mark = row.querySelector<HTMLElement>('[data-slot="ladder-mark"]')!;
    await expect(getComputedStyle(mark).boxShadow).not.toBe("none");
  },
};

/** `marked` on a node draws the kit's round Dot before its name and says why, in the node's name and a line of its tooltip: here the techniques a program chose. A card and a row take it alike. The dot means one thing a ladder, said beside it with the same Dot. */
export const Marked: Story = {
  render: (args) => (
    <Stack space="space.150">
      <Inline space="space.075" alignBlock="center">
        <Dot shape="round" />
        <Text size="small">Chosen by the program</Text>
      </Inline>
      <Ladder
        {...args}
        levels={args.levels.map((level) => ({
          ...level,
          nodes: level.nodes.map((node) =>
            node.id === "redundancy" || node.id === "surplus"
              ? { ...node, marked: "Chosen by the program" }
              : node,
          ),
        }))}
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ladder = root(canvasElement);
    const card = canvas.getByRole("button", {
      name: "Redundancy: 8 of 11 controls held, Chosen by the program, 1 approach with nothing behind it",
    });
    const row = canvas.getByRole("button", {
      name: /^Surplus Capacity: .*, Chosen by the program$/,
    });
    for (const node of [card, row]) {
      const dot = node.querySelector('[data-slot="ladder-node-title"] > [data-slot="dot"]');
      await expect(dot).toHaveAttribute("data-shape", "round");
      await expect(dot).toHaveAttribute("aria-hidden", "true");
    }
    await expect(ladder.querySelectorAll('[data-ladder-id] [data-slot="dot"]')).toHaveLength(2);
    // The words are a line of the tooltip too.
    const tip = () =>
      canvasElement.ownerDocument.body.querySelector('[data-slot="ladder-tooltip"]');
    card.focus();
    await waitFor(() => expect(tip()).toHaveTextContent("Chosen by the program"));
    card.blur();
    await waitFor(() => expect(tip()).not.toBeInTheDocument());
  },
};

function Key({ step }: { step: number }) {
  const counts = ladderCounts(step);
  return (
    <TileMapKey
      items={ladderStandings.map((standing) => ({
        label: ladderDrawn[standing].words,
        tone: ladderDrawn[standing].tone,
        fill: ladderDrawn[standing].fill,
        value: counts[standing],
      }))}
    />
  );
}

const last = ladderSteps.length - 1;
const program = ladderAt(last);
const flaggedIds = program.flatMap((level) =>
  level.nodes.filter((node) => node.flagged).map((node) => node.id),
);
const programLabel = `${ladderProgram}: the controls its baseline holds behind each cyber resiliency goal, objective, technique and approach`;

function ProgramLadder({ size }: { size?: "small" | "medium" }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <Stack space="space.200">
      <Key step={last} />
      <Ladder
        label={programLabel}
        levels={program}
        links={ladderLinks}
        selected={selected}
        onSelect={(node) => setSelected(node?.id ?? null)}
        flagLabel={ladderFlagLabel}
        {...(size ? { size } : {})}
      />
    </Stack>
  );
}

/** One program's cyber resiliency: 4 goals, 8 objectives, 14 techniques and 50 approaches, with the 265 controls behind them as 421 marks and 128 wires. The key above is a TileMap.Key, since a mark and a tally's segment wear a TileMap's tones and fills. */
export const WholeProgram: Story = {
  render: () => <ProgramLadder />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ladder = root(canvasElement);
    await expect(ladder.querySelectorAll("[data-ladder-id]")).toHaveLength(76);
    await expect(ladder.querySelectorAll('[data-slot="ladder-mark"]')).toHaveLength(421);
    await settled(ladder, 128);
    await expect(headings(ladder)).toEqual([
      "Goals 4",
      "Objectives 8",
      "Techniques 14",
      "Approaches 50",
    ]);
    await expect(
      canvas.getByRole("button", { name: /^Anticipate: 128 of 255 controls held, 10 / }),
    ).toBeVisible();
    await expect(
      within(ladder.querySelector("[data-rows]")!).getByText(
        "11 approaches with nothing behind them",
      ),
    ).toBeInTheDocument();
    // An objective keeps the approaches that support it, not every approach of its techniques.
    // Choosing moves no node, so the nodes are not measured again and no wire is redrawn: the
    // one node measured is the pressed one, by the tooltip that opens on it.
    await atRest(ladder);
    const paths = Array.from(ladder.querySelectorAll('[data-slot="ladder-wire"]'), (wire) =>
      wire.getAttribute("d"),
    );
    const measured = Element.prototype.getBoundingClientRect;
    const measures = new Set<Element>();
    Element.prototype.getBoundingClientRect = function counted(this: Element) {
      if (this.hasAttribute("data-ladder-id")) measures.add(this);
      return measured.call(this);
    };
    try {
      await userEvent.click(canvas.getByRole("button", { name: /^Transform:/ }));
      await expect(headings(ladder)).toEqual([
        "Goals 2 of 4",
        "Objectives 1 of 8",
        "Techniques 4 of 14",
        "Approaches 11 of 50",
      ]);
      // A resize would be answered in the next frame: two pass, and none was.
      await twoFrames();
    } finally {
      Element.prototype.getBoundingClientRect = measured;
    }
    await expect(measures.size).toBeLessThanOrEqual(1);
    await expect(
      Array.from(ladder.querySelectorAll('[data-slot="ladder-wire"]'), (wire) =>
        wire.getAttribute("d"),
      ),
    ).toEqual(paths);
    // An approach keeps its technique, the objectives it supports and their goals.
    await userEvent.click(canvas.getByRole("button", { name: /^Dynamic Reconfiguration:/ }));
    await expect(headings(ladder)).toEqual([
      "Goals 4 of 4",
      "Objectives 5 of 8",
      "Techniques 1 of 14",
      "Approaches 1 of 50",
    ]);
    // Escape lets go of the choice, and focus stays on the node.
    const row = canvas.getByRole("button", { name: /^Dynamic Reconfiguration:/ });
    await expect(row).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await expect(row).toHaveAttribute("aria-pressed", "false");
    await expect(row).toHaveFocus();
    await expect(headings(ladder)[0]).toBe("Goals 4");
  },
};

/** The arrow keys move between nodes: up and down a level, sideways to the level before or after, landing on the first node there that the one left is linked to. Home and End go to the ends of a level. */
export const Keyboard: Story = {
  render: () => <ProgramLadder />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ladder = root(canvasElement);
    const node = (name: RegExp) => canvas.getByRole("button", { name });
    const { next, previous } = arrows(ladder);
    node(/^Anticipate:/).focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(node(/^Withstand:/)).toHaveFocus();
    // The stop follows the focus: Tab leaves the ladder from here and comes back here.
    await expect(ladder.querySelectorAll('[data-ladder-id][tabindex="0"]')).toHaveLength(1);
    await expect(node(/^Withstand:/)).toHaveAttribute("tabindex", "0");
    await userEvent.keyboard(next);
    await expect(node(/^Prevent or Avoid:/)).toHaveFocus();
    await userEvent.keyboard(next);
    await expect(node(/^Adaptive Response:/)).toHaveFocus();
    await userEvent.keyboard(next);
    await expect(node(/^Dynamic Reconfiguration:/)).toHaveFocus();
    // Down a level of rows runs on through the groups.
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    await expect(node(/^Monitoring and Damage Assessment:/)).toHaveFocus();
    await userEvent.keyboard(previous);
    await expect(node(/^Analytic Monitoring:/)).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(node(/^Unpredictability:/)).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(node(/^Adaptive Response:/)).toHaveFocus();
    // Enter chooses, as on any button.
    await userEvent.keyboard("{Enter}");
    await expect(node(/^Adaptive Response:/)).toHaveAttribute("aria-pressed", "true");
    await expect(headings(ladder)[3]).toBe("Approaches 3 of 50");
  },
};

function Gaps() {
  const [selected, setSelected] = useState<string | null>(null);
  const [gaps, setGaps] = useState(true);
  return (
    <Stack space="space.200">
      <Button
        variant="secondary"
        size="small"
        aria-pressed={gaps}
        onClick={() => {
          setGaps(!gaps);
          setSelected(null);
        }}
      >
        {ladderFlagLabel(flaggedIds.length)}
      </Button>
      <Ladder
        label={programLabel}
        levels={program}
        links={ladderLinks}
        selected={selected}
        onSelect={(node) => {
          setSelected(node?.id ?? null);
          if (node) setGaps(false);
        }}
        {...(gaps ? { highlighted: flaggedIds } : {})}
        flagLabel={ladderFlagLabel}
      />
    </Stack>
  );
}

/** A control outside the ladder points at the flagged approaches: the eleven with nothing behind them, and what they would have supported. The caller owns the control and which of the two choices stands; here choosing a node lets go of the gaps. */
export const FlaggedPaths: Story = {
  render: () => <Gaps />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ladder = root(canvasElement);
    await expect(headings(ladder)).toEqual([
      "Goals 4 of 4",
      "Objectives 8 of 8",
      "Techniques 5 of 14",
      "Approaches 11 of 50",
    ]);
    await expect(ladder.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    await settled(ladder, 128);
    if (inColumns(ladder))
      await expect(ladder.querySelectorAll('[data-slot="ladder-wire"][data-flagged]')).toHaveLength(
        11,
      );
    await userEvent.click(canvas.getByRole("button", { name: /^Deception:/ }));
    await expect(canvas.getByRole("button", { name: ladderFlagLabel(11) })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(headings(ladder)[3]).toBe("Approaches 4 of 50");
  },
};

function WithDetails() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <Ladder
      label={programLabel}
      levels={program}
      links={ladderLinks}
      selected={selected}
      onSelect={(node) => setSelected(node?.id ?? null)}
      flagLabel={ladderFlagLabel}
      details={(node) => (
        <Stack space="space.100">
          <Stack space="space.025">
            {ladderControls(node.id, last)
              .slice(0, 6)
              .map((control) => (
                <KeyValue key={control.code} label={control.code} labelWidth="narrow">
                  {control.title} · {ladderDrawn[control.standing].words}
                </KeyValue>
              ))}
          </Stack>
          <Button size="small" variant="secondary">
            Open the approach
          </Button>
        </Stack>
      )}
    />
  );
}

/** With `details` a chosen row opens a card anchored to it, as a Heatmap's cell does: the row says it opens one and whether it is open, Escape closes it and returns focus to the row, and pressing the row again closes it too. A card has no details. */
export const Details: Story = {
  render: () => <WithDetails />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const row = canvas.getByRole("button", { name: /^Dynamic Reconfiguration:/ });
    await expect(row).toHaveAttribute("aria-haspopup", "dialog");
    await expect(row).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.getByRole("button", { name: /^Adaptive Response:/ })).not.toHaveAttribute(
      "aria-haspopup",
    );
    await userEvent.click(row);
    const card = await page.findByRole("dialog", { name: /details$/ });
    await expect(row).toHaveAttribute("aria-expanded", "true");
    await expect(row).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(within(card).getByText("Dynamic Reconfiguration")).toBeVisible());
    await expect(within(card).getByText("2 of 9 controls held")).toBeVisible();
    await waitFor(() =>
      expect(within(card).getByRole("button", { name: "Open the approach" })).toHaveFocus(),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(row).toHaveAttribute("aria-pressed", "false");
    await waitFor(() => expect(row).toHaveFocus());
    // Open again, then the same row pressed again closes it: the press does not open it anew.
    await userEvent.click(row);
    await page.findByRole("dialog", { name: /details$/ });
    await userEvent.click(row);
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(row).toHaveAttribute("aria-pressed", "false");
  },
};

function Replayed() {
  const [step, setStep] = useState(last);
  const levels = useMemo(() => ladderAt(step), [step]);
  return (
    <Stack space="space.200">
      {/* Five names are wider than a phone: the group scrolls in its own strip. */}
      <Scroller orientation="horizontal">
        <ScrollerViewport>
          <ToggleGroup
            size="small"
            variant="outline"
            aria-label="Layer"
            value={[String(step)]}
            onValueChange={(next) => {
              if (next[0] !== undefined) setStep(Number(next[0]));
            }}
          >
            {ladderSteps.map((name, index) => (
              <ToggleGroupItem key={name} value={String(index)}>
                {name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </ScrollerViewport>
        <ScrollerArrow edge="start" />
        <ScrollerArrow edge="end" />
      </Scroller>
      <Key step={step} />
      <Ladder
        label={programLabel}
        levels={levels}
        links={ladderLinks}
        defaultSelected="technique.adaptive-response"
        flagLabel={ladderFlagLabel}
      />
    </Stack>
  );
}

/** The values change while the structure stays: stepping through the layers of a baseline changes the figures, the tallies and the marks in place, and measures nothing again while no card gains or loses a line. The wires are the same elements with the same paths, the choice holds, and a tally eases to its new share unless motion is reduced. */
export const Replay: Story = {
  render: () => <Replayed />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ladder = root(canvasElement);
    await settled(ladder, 128);
    await atRest(ladder);
    const wires = Array.from(ladder.querySelectorAll('[data-slot="ladder-wire"]'));
    const paths = wires.map((wire) => wire.getAttribute("d"));
    const node = canvas.getByRole("button", { name: /^Adaptive Response: 8 of 23/ });
    const segment = node.querySelector<HTMLElement>(
      '[data-slot="tally-segment"][data-tone="brand"]',
    )!;
    await expect(segment.style.inlineSize).not.toBe("0%");
    // With every layer applied, each of its three approaches has a control behind it.
    const rows = within(ladder.querySelector<HTMLElement>("[data-rows]")!);
    await expect(rows.queryByText(/nothing behind/)).toBeNull();
    // Back to the reference baseline: no layer has added anything yet.
    const measured = Element.prototype.getBoundingClientRect;
    let measures = 0;
    Element.prototype.getBoundingClientRect = function counted(this: Element) {
      if (ladder.contains(this)) measures += 1;
      return measured.call(this);
    };
    try {
      await userEvent.click(canvas.getByRole("button", { name: ladderSteps[0] ?? "" }));
      await expect(await canvas.findByRole("button", { name: /^Adaptive Response: 4 of 23/ })).toBe(
        node,
      );
      // A resize would be answered in the next frame: two pass, and none was.
      await twoFrames();
    } finally {
      Element.prototype.getBoundingClientRect = measured;
    }
    // Nothing in the ladder was measured for the change, and no wire was redrawn.
    await expect(measures).toBe(0);
    await expect(Array.from(ladder.querySelectorAll('[data-slot="ladder-wire"]'))).toEqual(wires);
    await expect(wires.map((wire) => wire.getAttribute("d"))).toEqual(paths);
    await expect(segment.style.inlineSize).toBe("0%");
    // The choice holds across the change, and the headings still count its path.
    await expect(node).toHaveAttribute("aria-pressed", "true");
    await expect(headings(ladder)[3]).toBe("Approaches 3 of 50");
    // A tally eases to its new share; reduced motion switches it.
    const eases = getComputedStyle(segment).transitionProperty;
    await expect(eases).toBe(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : "inline-size",
    );
    // Before the layers one of the three had none: the heading counts the flags on the path kept.
    await expect(rows.getByText("1 approach with nothing behind it")).toHaveClass("sr-only");
  },
};

const emptyLevels: LadderLevel[] = [
  {
    id: "outcomes",
    label: "Outcomes",
    nodes: [
      { id: "safe", title: "Safe to fly", value: 3, total: 4 },
      { id: "ready", title: "Ready to field", value: 1, total: 2 },
    ],
  },
  { id: "claims", label: "Claims", nodes: [], empty: "No claim written yet" },
  {
    id: "evidence",
    label: "Evidence",
    nodes: [{ id: "report", title: "Flight test report", value: 2, total: 2 }],
  },
];
const emptyLinks: LadderLink[] = [{ from: "report", to: "safe" }];

/** A level with no node says so in the caller's words and keeps its place, and a link across it still makes a path though no wire is drawn. A node needs no tally and no marks: a name and a figure are a node. */
export const EmptyLevel: Story = {
  args: { label: "What stands behind each outcome", levels: emptyLevels, links: emptyLinks },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ladder = root(canvasElement);
    await expect(canvas.getByText("No claim written yet")).toBeVisible();
    await expect(headings(ladder)).toEqual(["Outcomes 2", "Claims 0", "Evidence 1"]);
    await expect(ladder.querySelectorAll('[data-slot="ladder-wire"]')).toHaveLength(0);
    await expect(ladder.querySelector('[data-slot="tally"]')).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Flight test report: 2 of 2" }));
    await expect(lit(ladder).sort()).toEqual(["report", "safe"]);
    await expect(headings(ladder)).toEqual(["Outcomes 1 of 2", "Claims 0 of 0", "Evidence 1 of 1"]);
  },
};

const long = "Maintain a state of informed preparedness for adversity across every mission thread";
const longLevels: LadderLevel[] = [
  {
    id: "goals",
    label: "Goals of the mission assurance program",
    nodes: [
      { id: "g1", title: long, value: 1280, total: 2550 },
      { id: "g2", title: "Withstand", value: 12, total: 25 },
    ],
  },
  {
    id: "approaches",
    label: "Approaches",
    layout: "rows",
    nodes: [
      {
        id: "a1",
        title: "Functional Relocation of Cyber Resources between enclaves, sites and providers",
        value: 2,
        total: 40,
        marks: Array.from({ length: 40 }, (_, index) => ({
          key: `m${index}`,
          label: `Control ${index + 1}`,
          ...(index < 2 ? {} : { fill: "empty" as const }),
        })),
      },
      {
        id: "a2",
        title: "Asset Mobility",
        value: 1,
        total: 1,
        marks: [{ key: "m", label: "Control" }],
      },
    ],
  },
];
const longLinks: LadderLink[] = [
  { from: "a1", to: "g1" },
  { from: "a2", to: "g2" },
];

/** A card shows two lines of a long name and a row one, cut with an ellipsis; the whole name is the node's name and its tooltip under the pointer and the keyboard. A row with many marks gives each less room rather than a second line. */
export const LongNames: Story = {
  args: { label: "Long names", levels: longLevels, links: longLinks },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = canvasElement.ownerDocument.body;
    const ladder = root(canvasElement);
    const card = canvas.getByRole("button", { name: `${long}: 1,280 of 2,550` });
    const title = card.querySelector<HTMLElement>('[data-slot="ladder-node-title"]')!;
    await expect(getComputedStyle(title).webkitLineClamp).toBe("2");
    // Nothing runs past the ladder, and the row keeps one line.
    await expect(ladder.scrollWidth).toBeLessThanOrEqual(ladder.clientWidth + 1);
    const row = canvas.getByRole("button", { name: /^Functional Relocation of Cyber Resources/ });
    const marks = row.querySelector<HTMLElement>('[data-slot="ladder-marks"]')!;
    await expect(marks.children).toHaveLength(40);
    await expect(marks.scrollWidth).toBeLessThanOrEqual(marks.clientWidth + 1);
    // The keyboard gets the whole name too, in the ladder's tooltip.
    const tip = () => page.querySelector('[data-slot="ladder-tooltip"]');
    row.focus();
    await waitFor(() =>
      expect(tip()).toHaveTextContent(
        "Functional Relocation of Cyber Resources between enclaves, sites and providers",
      ),
    );
    row.blur();
    await waitFor(() => expect(tip()).not.toBeInTheDocument());
  },
};

/** The ladder stacks by what it holds, not at one width: its levels stand side by side while each has the room it needs to read (a card's level a word of sixteen letters whole, the rows twenty letters of a name, a figure and their marks), so these four keep their wires in the room a 480px panel leaves beside them in a 1440px window. The names are the first to give way, cut with an ellipsis; a card's numbers take the line under its name; a row with more marks than it has room for joins them into a bar and never cuts one off. No word is broken. */
export const BesideAPanel: Story = {
  render: () => (
    <div style={{ maxWidth: 684 }}>
      <ProgramLadder />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const ladder = root(canvasElement);
    // Side by side exactly while the ladder has the room its levels need.
    await waitFor(() => expect(inColumns(ladder)).toBe(ladder.clientWidth >= roomNeeded(ladder)));
    const page = canvasElement.ownerDocument.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
    await expect(ladder.scrollWidth).toBeLessThanOrEqual(ladder.clientWidth + 1);
    if (!inColumns(ladder)) return;
    await settled(ladder, 128);
    // Every card holds its name's words whole, on two lines at most.
    for (const title of ladder.querySelectorAll<HTMLElement>(
      '[data-slot="ladder-node"] [data-slot="ladder-node-title"]',
    )) {
      await expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth + 1);
      await expect(title.scrollHeight).toBeLessThanOrEqual(title.clientHeight + 1);
    }
    // No row cuts a mark off: the 38 behind Integrity Checks are all drawn in its room.
    const crowded = within(canvasElement)
      .getByRole("button", { name: /^Integrity Checks:/ })
      .querySelector<HTMLElement>('[data-slot="ladder-marks"]')!;
    await expect(crowded.children).toHaveLength(38);
    const end = crowded.getBoundingClientRect();
    const lastMark = crowded.lastElementChild!.getBoundingClientRect();
    await expect(lastMark.width).toBeGreaterThan(0);
    await expect(Math.max(lastMark.right, lastMark.left)).toBeLessThanOrEqual(
      Math.max(end.right, end.left) + 1,
    );
    await expect(Math.min(lastMark.right, lastMark.left)).toBeGreaterThanOrEqual(
      Math.min(end.right, end.left) - 1,
    );
  },
};

/** On a phone, and wherever the ladder has less room than its levels need side by side, the levels stack in order, each node one line at full width and the rows under their node. The wires leave; choosing a node still keeps its path, and the headings still count it. */
export const Phone: Story = {
  render: () => <ProgramLadder />,
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ladder = root(canvasElement);
    await waitFor(() => expect(ladder).toHaveAttribute("data-layout", "stack"));
    await expect(ladder.querySelectorAll('[data-slot="ladder-wire"]')).toHaveLength(0);
    const page = canvasElement.ownerDocument.documentElement;
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);
    // A level under a level, and a technique's rows under it.
    const top = (name: RegExp) => canvas.getByRole("button", { name }).getBoundingClientRect().top;
    await expect(top(/^Adapt:/)).toBeLessThan(top(/^Prevent or Avoid:/));
    await expect(top(/^Adaptive Response:/)).toBeLessThan(top(/^Dynamic Reconfiguration:/));
    await expect(top(/^Adaptive Management:/)).toBeLessThan(top(/^Analytic Monitoring:/));
    // A finger's worth of row.
    const row = canvas.getByRole("button", { name: /^Dynamic Reconfiguration:/ });
    await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    await userEvent.click(canvas.getByRole("button", { name: /^Transform:/ }));
    await expect(headings(ladder)).toEqual([
      "Goals 2 of 4",
      "Objectives 1 of 8",
      "Techniques 4 of 14",
      "Approaches 11 of 50",
    ]);
  },
};

/** A ladder that leaves the page without leaving the document (a tab's hidden panel, a page a phone's panel covers) has no box and no room to read. It keeps the form it had, wires and all, and comes back as the reader left it: never side by side for a frame where it stacks, never a frame without its wires. */
export const HiddenAndShown: Story = {
  tags: ["!manifest"],
  render: () => <ProgramLadder />,
  play: async ({ canvasElement }) => {
    const ladder = root(canvasElement);
    await settled(ladder, 128);
    await atRest(ladder);
    const drawn = () => ({
      layout: ladder.dataset["layout"],
      wires: Array.from(ladder.querySelectorAll('[data-slot="ladder-wire"]'), (wire) =>
        wire.getAttribute("d"),
      ),
    });
    const before = drawn();
    const holder = ladder.parentElement!;
    // Every frame from here on, as it is about to be painted.
    const frames: ReturnType<typeof drawn>[] = [];
    let sampling = requestAnimationFrame(function sample() {
      frames.push(drawn());
      sampling = requestAnimationFrame(sample);
    });
    try {
      holder.style.display = "none";
      await twoFrames();
      await twoFrames();
      await expect(ladder.getClientRects()).toHaveLength(0);
      holder.style.removeProperty("display");
      await twoFrames();
      await twoFrames();
    } finally {
      cancelAnimationFrame(sampling);
      holder.style.removeProperty("display");
    }
    await expect(frames.length).toBeGreaterThanOrEqual(6);
    for (const frame of frames) await expect(frame).toEqual(before);
    await expect(drawn()).toEqual(before);
  },
};

/** `size="small"` is the dense ladder: 16px rows in the smallest type, for a ladder that must stand in one window. A coarse pointer still gets 24px rows. */
export const Small: Story = {
  render: () => <ProgramLadder size="small" />,
  play: async ({ canvasElement }) => {
    const ladder = root(canvasElement);
    await expect(ladder).toHaveAttribute("data-size", "small");
    const row = within(canvasElement).getByRole("button", { name: /^Dynamic Reconfiguration:/ });
    const coarse = window.matchMedia("(any-pointer: coarse)").matches;
    if (inColumns(ladder))
      await expect(Math.round(row.getBoundingClientRect().height)).toBe(coarse ? 24 : 16);
  },
};

/** Five levels and 320 wires: the part draws every wire once for a structure and a width. */
const denseLevels: LadderLevel[] = Array.from({ length: 5 }, (_, level) => ({
  id: `level-${level}`,
  label: `Level ${level + 1}`,
  nodes: Array.from({ length: [6, 12, 16, 20, 24][level] ?? 6 }, (_, index) => ({
    id: `n${level}-${index}`,
    title: `Node ${level + 1}.${index + 1}`,
    value: (index * 7 + level * 3) % 23,
    total: 23 + ((index * 5) % 17),
    segments: [
      { key: "a", value: (index * 7 + level * 3) % 23 },
      { key: "b", value: (index * 3) % 5, tone: "brand" as const },
    ],
  })),
}));
const denseLinks: LadderLink[] = denseLevels.slice(1).flatMap((level, at) =>
  level.nodes.flatMap((node, index) => {
    const before = denseLevels[at]?.nodes ?? [];
    return Array.from({ length: Math.min(before.length, 4 + (index % 3)) }, (_, k) => ({
      from: node.id,
      to: before[(index + k * 3) % before.length]?.id ?? "",
    }));
  }),
);

/** A ladder of cards alone, five levels deep with a few hundred wires. Every level spreads over the height the tallest gives. */
export const ManyWires: Story = {
  tags: ["!manifest"],
  args: { label: "Five levels", levels: denseLevels, links: denseLinks },
  play: async ({ canvasElement }) => {
    const ladder = root(canvasElement);
    const drawn = new Set(denseLinks.map((link) => `${link.from}>${link.to}`)).size;
    await expect(drawn).toBeGreaterThanOrEqual(300);
    await settled(ladder, drawn);
  },
};

/** The ladder's box takes native props and a ref: an `id`, `data-*` for a test, a handler. `onSelect` hears the node chosen, and null when the reader lets go. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  args: { onSelect: fn() },
  render: (args) => (
    <Ladder
      {...args}
      id="resiliency"
      data-testid="ladder"
      className="min-w-0"
      ref={(node) => node?.setAttribute("data-ref", "")}
    />
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId("ladder");
    await expect(box).toHaveAttribute("data-slot", "ladder");
    await expect(box).toHaveAttribute("id", "resiliency");
    await expect(box).toHaveAttribute("data-ref");
    await expect(box).toHaveClass("min-w-0");
    const node = canvas.getByRole("button", { name: /^Segmentation:/ });
    await userEvent.click(node);
    await expect(args.onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "segmentation", title: "Segmentation" }),
    );
    await expect(node).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(node);
    await expect(args.onSelect).toHaveBeenLastCalledWith(null);
  },
};

/** What the page is written to prevent: a ladder where a table is the reading. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.150">
      <Text size="small" color="color.text.subtle">
        One level and no links is a list of rows: a DataTable sorts it, searches it and pages it.
      </Text>
      <Ladder
        label="Approaches"
        levels={[{ ...program[3]!, nodes: program[3]!.nodes.slice(0, 6) }]}
        links={[]}
      />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const ladder = root(canvasElement);
    await expect(ladder.querySelectorAll('[data-slot="ladder-wire"]')).toHaveLength(0);
    await expect(headings(ladder)).toEqual(["Approaches 6"]);
  },
};
