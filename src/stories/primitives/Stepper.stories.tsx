import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stepper, type StepState } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  args: { orientation: "horizontal", children: null },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    children: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const rmf: { label: string; meta: string; state: StepState }[] = [
  { label: "Categorize", meta: "2026-03-02", state: "done" },
  { label: "Select", meta: "2026-04-11", state: "done" },
  { label: "Implement", meta: "2026-06-30", state: "done" },
  { label: "Assess", meta: "due 2026-09-30", state: "current" },
  { label: "Authorize", meta: "2026-11-15", state: "upcoming" },
  { label: "Monitor", meta: "", state: "upcoming" },
];

const pipeline: { label: string; state: StepState }[] = [
  { label: "Selected", state: "done" },
  { label: "Allocated", state: "done" },
  { label: "Implemented", state: "blocked" },
  { label: "Evidenced", state: "upcoming" },
  { label: "Assessed", state: "upcoming" },
  { label: "Current", state: "upcoming" },
];

/** The RMF path: done, current and upcoming, with a date under each step. Steps are buttons. */
export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[760px] overflow-x-auto">
      <Stepper {...args}>
        {rmf.map((s, i) => (
          <Stepper.Item
            key={s.label}
            state={s.state}
            label={s.label}
            meta={s.meta}
            first={i === 0}
            last={i === rmf.length - 1}
            onSelect={() => {}}
          />
        ))}
      </Stepper>
    </div>
  ),
};

/** A step that failed: `blocked` in danger, the rest upcoming. Static. */
export const Blocked: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[760px] space-y-2 overflow-x-auto">
      <Spec>six-stage pipeline · Implemented broke</Spec>
      <Stepper>
        {pipeline.map((s, i) => (
          <Stepper.Item
            key={s.label}
            state={s.state}
            label={s.label}
            first={i === 0}
            last={i === pipeline.length - 1}
          />
        ))}
      </Stepper>
    </div>
  ),
};

/** Vertical, in a rail: marker column, label and meta to the right. */
export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[272px]">
      <Stepper orientation="vertical">
        {rmf.map((s, i) => (
          <Stepper.Item
            key={s.label}
            state={s.state}
            label={s.label}
            meta={s.meta}
            tone="warning"
            first={i === 0}
            last={i === rmf.length - 1}
          />
        ))}
      </Stepper>
    </div>
  ),
};
