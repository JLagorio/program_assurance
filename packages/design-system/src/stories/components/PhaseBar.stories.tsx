import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { PhaseBar } from "../../components";

const meta = {
  title: "Components/PhaseBar",
  component: PhaseBar,
  parameters: { layout: "padded" },
  args: { label: "Audit phases", children: null },
} satisfies Meta<typeof PhaseBar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Where the work stands along its phases: done in the success colour, the current one in information, what is ahead on the track. */
export const Playground: Story = {
  render: (args) => (
    <PhaseBar {...args}>
      <PhaseBar.Item state="done" label="Preparation" meta="Apr 30" />
      <PhaseBar.Item state="done" label="Observation period" meta="May 1 to Aug 1" />
      <PhaseBar.Item state="current" label="Internal audit" meta="Due Aug 20" />
      <PhaseBar.Item state="upcoming" label="Audit" />
      <PhaseBar.Item state="upcoming" label="Report" />
    </PhaseBar>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Audit phases" });
    const phases = within(list).getAllByRole("listitem");
    await expect(phases).toHaveLength(5);
    // The state is spoken before the name, and the current phase says so.
    await expect(phases[0]).toHaveTextContent("Completed: Preparation");
    await expect(phases[2]).toHaveAttribute("aria-current", "step");
    await expect(phases[2]).toHaveTextContent("Current: Internal audit");
    // What is ahead draws the track alone.
    await expect(phases[3]!.querySelector('[data-slot="phase-bar-fill"]')).toBeNull();
    await expect(phases[0]!.querySelector('[data-slot="phase-bar-fill"]')).not.toBeNull();
  },
};

/** `weight` gives a phase its share of the bar, and `progress` fills the current one part of the way. */
export const WeightedWithProgress: Story = {
  render: () => (
    <PhaseBar label="SOC 2 Type 2 audit">
      <PhaseBar.Item state="done" label="Preparation" weight={2} />
      <PhaseBar.Item
        state="current"
        label="Observation period"
        meta="May 1 to Aug 1"
        weight={6}
        progress={0.4}
      />
      <PhaseBar.Item state="upcoming" label="Internal audit" weight={2} />
      <PhaseBar.Item state="upcoming" label="Audit" />
      <PhaseBar.Item state="upcoming" label="Report" />
    </PhaseBar>
  ),
  play: async ({ canvasElement }) => {
    const phases = within(canvasElement).getAllByRole("listitem");
    const width = (item: HTMLElement) => item.getBoundingClientRect().width;
    // The six-share phase is the widest. Where the bar wraps (a phone, a narrow frame) the short
    // phases stand at their floor, so the shares are compared only on one line.
    await expect(width(phases[1]!)).toBeGreaterThanOrEqual(width(phases[0]!));
    const lines = new Set(phases.map((phase) => Math.round(phase.getBoundingClientRect().top)));
    if (lines.size === 1) {
      await expect(width(phases[1]!)).toBeGreaterThan(width(phases[0]!));
      await expect(width(phases[0]!)).toBeGreaterThan(width(phases[3]!));
    }
    // Its fill stops part of the way along its segment.
    const fill = phases[1]!.querySelector<HTMLElement>('[data-slot="phase-bar-fill"]')!;
    const segment = phases[1]!.querySelector<HTMLElement>('[data-slot="phase-bar-segment"]')!;
    await expect(width(fill)).toBeLessThan(width(segment) * 0.5);
    await expect(width(fill)).toBeGreaterThan(width(segment) * 0.3);
  },
};

/** A phase that failed is `blocked`: the danger fill, and its name in the danger text colour. */
export const Blocked: Story = {
  render: () => (
    <PhaseBar label="Lifecycle gates">
      <PhaseBar.Item state="done" label="SRR" meta="Mar 3, 2026" />
      <PhaseBar.Item state="blocked" label="PDR" meta="2 criteria not met" />
      <PhaseBar.Item state="upcoming" label="CDR" meta="Due Oct 1, 2026" />
    </PhaseBar>
  ),
  play: async ({ canvasElement }) => {
    const phases = within(canvasElement).getAllByRole("listitem");
    await expect(phases[1]).toHaveAttribute("data-state", "blocked");
    await expect(phases[1]).toHaveTextContent("Blocked: PDR");
  },
};

/** In a narrow frame the phases keep a readable floor and take another line, each with its own segment, and a long name wraps. */
export const InANarrowFrame: Story = {
  render: () => (
    <div style={{ width: 280, maxWidth: "100%" }}>
      <PhaseBar label="Program lifecycle">
        <PhaseBar.Item state="done" label="Materiel solution analysis" />
        <PhaseBar.Item state="done" label="Technology maturation" />
        <PhaseBar.Item state="current" label="Engineering and manufacturing development" />
        <PhaseBar.Item state="upcoming" label="Production and deployment" />
        <PhaseBar.Item state="upcoming" label="Operations and support" />
      </PhaseBar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Program lifecycle" });
    const phases = within(list).getAllByRole("listitem");
    const tops = new Set(phases.map((phase) => Math.round(phase.getBoundingClientRect().top)));
    await expect(tops.size).toBeGreaterThan(1);
    const edge = list.getBoundingClientRect().right;
    for (const phase of phases)
      await expect(phase.getBoundingClientRect().right).toBeLessThanOrEqual(edge + 1);
  },
};

const opened = fn();

/** With `onSelect`, a phase's name is a button that opens what the phase is: a gate's record. The bar still reports; it is not a path to move along. */
export const OpeningAPhase: Story = {
  render: () => (
    <PhaseBar label="Lifecycle gates">
      <PhaseBar.Item state="done" label="SRR" meta="Mar 3, 2026" onSelect={() => opened("SRR")} />
      <PhaseBar.Item
        state="current"
        label="PDR"
        meta="In review · Due Oct 10, 2026"
        onSelect={() => opened("PDR")}
      />
      <PhaseBar.Item state="upcoming" label="CDR" meta="Due Dec 1, 2026" />
    </PhaseBar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The button is named by the state and the name; a phase without `onSelect` is no tab stop.
    const pdr = canvas.getByRole("button", { name: "Current: PDR" });
    await expect(canvas.getAllByRole("button")).toHaveLength(2);
    await userEvent.click(pdr);
    await expect(opened).toHaveBeenCalledWith("PDR");
    // The button keeps focus after the click, and Enter opens the phase again.
    await expect(pdr).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(opened).toHaveBeenCalledTimes(2);
  },
};
