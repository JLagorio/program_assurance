import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Funnel, StageStrip } from "@/components/app/control-board";
import { stageKeys, stageLabels, type Stage, type StageKey } from "@/lib/control-board";

function strip(states: Stage["state"][], fills?: number[]): Stage[] {
  return stageKeys.map((key, i) => ({
    key,
    label: stageLabels[key],
    state: states[i] ?? "empty",
    fill: fills?.[i] ?? (states[i] === "full" ? 1 : 0),
    note: `${stageLabels[key]} · example`,
    inferred: false,
  }));
}

const examples: { label: string; stages: Stage[] }[] = [
  { label: "Through", stages: strip(["full", "full", "full", "full", "full", "full"]) },
  {
    label: "Needs evidence",
    stages: strip(["full", "full", "full", "partial", "empty", "empty"], [1, 1, 1, 0.4, 0, 0]),
  },
  {
    label: "Other than satisfied",
    stages: strip(["full", "full", "full", "full", "broken", "empty"], [1, 1, 1, 1, 0.6, 0]),
  },
  {
    label: "Invalidated by a baseline change",
    stages: strip(["full", "full", "full", "full", "partial", "broken"], [1, 1, 1, 1, 0.5, 0.5]),
  },
  { label: "Suspect", stages: strip(["full", "full", "full", "full", "full", "suspect"]) },
  {
    label: "Unassigned",
    stages: strip(["full", "partial", "empty", "empty", "empty", "empty"], [1, 0.3, 0, 0, 0, 0]),
  },
  {
    label: "Tailored out",
    stages: strip(["hollow", "hollow", "hollow", "hollow", "hollow", "hollow"]),
  },
];

const meta = {
  title: "Shapes/Control board",
  component: StageStrip,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="max-w-[1100px] p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StageStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Strips: Story = {
  args: { stages: examples[0]!.stages },
  render: () => (
    <div className="space-y-2">
      {examples.map((e) => (
        <div
          key={e.label}
          className="flex h-10 items-center gap-4 border-b border-border-subtle text-13"
        >
          <span className="w-[260px]">{e.label}</span>
          <StageStrip stages={e.stages} />
        </div>
      ))}
    </div>
  ),
};

function LargeDemo() {
  const [active, setActive] = useState<StageKey>("current");
  return (
    <div className="w-[440px]">
      <StageStrip stages={examples[3]!.stages} size="lg" active={active} onSelect={setActive} />
    </div>
  );
}

export const Large: Story = {
  args: { stages: examples[3]!.stages, size: "lg" },
  render: () => <LargeDemo />,
};

function FunnelDemo() {
  const [active, setActive] = useState<StageKey | null>(null);
  return (
    <Funnel
      funnel={[
        { key: "selected", label: "Selected", reached: 341, stuck: 0, broken: 0, suspect: 0 },
        { key: "allocated", label: "Allocated", reached: 296, stuck: 45, broken: 0, suspect: 0 },
        {
          key: "implemented",
          label: "Implemented",
          reached: 210,
          stuck: 86,
          broken: 0,
          suspect: 0,
        },
        { key: "evidenced", label: "Evidenced", reached: 154, stuck: 56, broken: 0, suspect: 0 },
        { key: "assessed", label: "Assessed", reached: 98, stuck: 39, broken: 17, suspect: 0 },
        { key: "current", label: "Current", reached: 91, stuck: 3, broken: 4, suspect: 12 },
      ]}
      total={341}
      hollow={32}
      through={91}
      active={active}
      onSelect={setActive}
    />
  );
}

export const FunnelBand: Story = {
  args: { stages: examples[0]!.stages },
  render: () => <FunnelDemo />,
};
