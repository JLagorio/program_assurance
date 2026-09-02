import type { Meta, StoryObj } from "@storybook/react-vite";

import { Dot, Progress, type Tone } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Progress",
  component: Progress,
  tags: ["autodocs"],
  args: { value: 62, tone: "info" },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100 } },
    tone: {
      control: "inline-radio",
      options: ["neutral", "success", "warning", "danger", "info"],
    },
    className: { control: false },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[320px]">
      <Progress {...args} />
    </div>
  ),
};

const tones: Tone[] = ["neutral", "success", "warning", "danger", "info"];

const rows = [
  { label: "SOC 2", value: 94 },
  { label: "ISO 27001", value: 62 },
  { label: "HIPAA", value: 18 },
];

/** Coverage split the control matrix draws: 340 controls in scope. */
const coverage: { key: string; value: number; tone: Tone; title: string }[] = [
  { key: "satisfied", value: 212, tone: "success", title: "Satisfied" },
  { key: "partial", value: 64, tone: "warning", title: "Partially satisfied" },
  { key: "other", value: 23, tone: "danger", title: "Other than satisfied" },
  { key: "not-assessed", value: 41, tone: "neutral", title: "Not assessed" },
];

/** Every tone at three values, laid out like the in-app components route, then Progress.Stacked at the heights the app uses. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[880px] space-y-8">
      <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        {tones.map((t) => (
          <div key={t} className="space-y-3">
            <Spec>{t}</Spec>
            {rows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-24 text-[13px] text-muted-foreground">{row.label}</span>
                <Progress value={row.value} tone={t} />
                <span className="tnum w-10 text-right text-[13px] font-medium">{row.value}%</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Spec>
          Progress.Stacked · height 8 (default) · satisfied / partial / other than / not assessed
        </Spec>
        <Progress.Stacked segments={coverage} />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-muted-foreground">
          {coverage.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <Dot tone={s.tone} /> {s.title}
              <span className="tnum text-foreground">{s.value}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-10">
        <div className="space-y-1.5">
          <Spec>height 4 · table cell, w-20 + pct</Spec>
          <span className="flex items-center gap-2">
            <span className="w-20">
              <Progress.Stacked height={4} segments={coverage} />
            </span>
            <span className="tnum text-12 text-muted-foreground">62%</span>
          </span>
        </div>
        <div className="space-y-1.5">
          <Spec>height 4 · toolbar, w-[220px]</Spec>
          <span className="flex w-[220px] items-center gap-2">
            <Progress.Stacked height={4} segments={coverage} />
            <span className="tnum shrink-0 text-12 text-muted-foreground">62%</span>
          </span>
        </div>
        <div className="w-[320px] space-y-1.5">
          <Spec>height 10 · risk scoring</Spec>
          <Progress.Stacked height={10} segments={coverage} />
        </div>
      </div>
    </div>
  ),
};
