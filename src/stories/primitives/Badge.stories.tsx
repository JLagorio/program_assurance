import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, CircleDashed, Clock, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";

import { Badge, Dot, Meter, Table, Id } from "@/ds/primitives";
import type { Tone } from "@/ds/primitives";
import { Card } from "@/ds/patterns";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Satisfied", tone: "success", size: "sm" },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["neutral", "success", "warning", "danger", "info"],
    },
    size: { control: "inline-radio", options: ["xs", "sm"] },
    children: { control: "text" },
    icon: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const tones: Tone[] = ["neutral", "success", "warning", "danger", "info"];
const sizes = ["xs", "sm"] as const;

/** One RMF assessment label per tone — see docs/guides/status-vocabulary.md. */
const labels: Record<Tone, string> = {
  neutral: "Not assessed",
  success: "Satisfied",
  warning: "Partially satisfied",
  danger: "Other than satisfied",
  info: "In assessment",
};

const icons: Record<Tone, ReactNode> = {
  neutral: <CircleDashed className="size-3" />,
  success: <Check className="size-3" />,
  warning: <TriangleAlert className="size-3" />,
  danger: <X className="size-3" />,
  info: <Clock className="size-3" />,
};

/** Coverage split the ControlMatrix draws: 340 controls in scope. */
const coverage: { key: string; value: number; tone: Tone; title: string }[] = [
  { key: "satisfied", value: 212, tone: "success", title: "Satisfied" },
  { key: "partial", value: 64, tone: "warning", title: "Partially satisfied" },
  { key: "other", value: 23, tone: "danger", title: "Other than satisfied" },
  { key: "not-assessed", value: 41, tone: "neutral", title: "Not assessed" },
];

const meterRows = [
  { label: "SOC 2", value: 94 },
  { label: "ISO 27001", value: 62 },
  { label: "HIPAA", value: 18 },
];

const th = "h-8 pr-6 text-[12px] font-medium text-muted-foreground";
const rowLabel = "py-3 pr-6 text-[11px] text-muted-foreground";

/** Every tone by both sizes, plus a with-icon column. Labels are the RMF vocabulary. */
export const Matrix: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="overflow-x-auto">
      <table className="text-left text-[13px]">
        <thead>
          <tr>
            <th className={th}>tone</th>
            {sizes.map((s) => (
              <th key={s} className="h-8 pr-6 text-[11px] font-medium text-muted-foreground">
                {s}
              </th>
            ))}
            <th className={th}>with icon</th>
          </tr>
        </thead>
        <tbody>
          {tones.map((t) => (
            <tr key={t} className="border-t border-border-subtle">
              <td className={rowLabel}>{t}</td>
              {sizes.map((s) => (
                <td key={s} className="py-3 pr-6">
                  <Badge tone={t} size={s}>
                    {labels[t]}
                  </Badge>
                </td>
              ))}
              <td className="py-3 pr-6">
                <Badge tone={t} icon={icons[t]}>
                  {labels[t]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

/** Dot beside 13px text, the way WorkPaneRow and the Colors sheet use it. */
export const Dots: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6">
        {tones.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground"
          >
            <Dot tone={t} /> {labels[t]}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-6">
        {tones.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-[13px] font-medium">
            <Dot tone={t} /> {labels[t]}
          </span>
        ))}
      </div>
      <Spec>
        size-1.5 (6px) · gap-1.5 · muted row as in the Colors sheet, medium row as in a table cell
      </Spec>
    </div>
  ),
};

/** Meter per tone at three values, laid out like the in-app components route, then StackedBar at the heights the app uses. */
export const Meters: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[880px] space-y-8">
      <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        {tones.map((t) => (
          <div key={t} className="space-y-3">
            <Spec>{t}</Spec>
            {meterRows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-24 text-[13px] text-muted-foreground">{row.label}</span>
                <Meter value={row.value} tone={t} />
                <span className="tnum w-10 text-right text-[13px] font-medium">{row.value}%</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Spec>
          StackedBar · height 8 (default) · satisfied / partial / other than / not assessed
        </Spec>
        <Meter.Stacked segments={coverage} />
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
              <Meter.Stacked height={4} segments={coverage} />
            </span>
            <span className="tnum text-12 text-muted-foreground">62%</span>
          </span>
        </div>
        <div className="space-y-1.5">
          <Spec>height 4 · toolbar, w-[220px]</Spec>
          <span className="flex w-[220px] items-center gap-2">
            <Meter.Stacked height={4} segments={coverage} />
            <span className="tnum shrink-0 text-12 text-muted-foreground">62%</span>
          </span>
        </div>
        <div className="w-[320px] space-y-1.5">
          <Spec>height 10 · risk scoring</Spec>
          <Meter.Stacked height={10} segments={coverage} />
        </div>
      </div>
    </div>
  ),
};

const rows: {
  id: string;
  control: string;
  method: string;
  age: string;
  stale: boolean;
  tone: Tone;
}[] = [
  {
    id: "AC-2",
    control: "Account management",
    method: "Examine",
    age: "3d",
    stale: false,
    tone: "success",
  },
  {
    id: "AC-6(1)",
    control: "Authorize access to security functions",
    method: "Test",
    age: "34d",
    stale: true,
    tone: "warning",
  },
  {
    id: "AU-6",
    control: "Audit record review, analysis, and reporting",
    method: "Interview",
    age: "51d",
    stale: true,
    tone: "danger",
  },
  {
    id: "CM-6",
    control: "Configuration settings",
    method: "Test",
    age: "1d",
    stale: false,
    tone: "info",
  },
  { id: "IR-4", control: "Incident handling", method: "", age: "—", stale: false, tone: "neutral" },
];

/** Dense table rows: Dot beside the Mono ID, neutral xs chips for method, warning xs for stale evidence, Badge in the status column. */
export const InContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Card className="max-w-[820px]">
      <Table>
        <thead>
          <tr>
            <Table.Header className="w-[104px]">Control</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header className="w-[104px]">Method</Table.Header>
            <Table.Header className="w-[88px] text-right">Evidence</Table.Header>
            <Table.Header className="w-[172px]">Status</Table.Header>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Cell>
                <span className="flex items-center gap-1.5">
                  <Dot tone={r.tone} />
                  <Id>{r.id}</Id>
                </span>
              </Table.Cell>
              <Table.Cell>{r.control}</Table.Cell>
              <Table.Cell>{r.method ? <Badge size="xs">{r.method}</Badge> : null}</Table.Cell>
              <Table.Cell className="text-right">
                {r.stale ? (
                  <Badge tone="warning" size="xs">
                    {r.age}
                  </Badge>
                ) : (
                  <span className="tnum text-muted-foreground">{r.age}</span>
                )}
              </Table.Cell>
              <Table.Cell>
                <Badge tone={r.tone}>{labels[r.tone]}</Badge>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </Card>
  ),
};
