import type { Meta, StoryObj } from "@storybook/react-vite";

import { cn } from "@/lib/utils";

import { Group, Sheet, Spec } from "../_lib/tokens";

const meta = {
  title: "Tokens/Typography",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* Every role below uses the exact class string the app uses, so this sheet is
   the current state of the type system, not a description of it. */
const roles: { role: string; where: string; cls: string; spec: string; sample: string }[] = [
  {
    role: "Page title",
    where: "PageHeader",
    cls: "text-[22px] font-semibold tracking-[-0.02em]",
    spec: "22 · 600 · −0.02em",
    sample: "Findings & assets",
  },
  {
    role: "Record title",
    where: "RecordHeader",
    cls: "text-[18px] font-semibold leading-tight tracking-[-0.015em]",
    spec: "18 · 600 · −0.015em",
    sample: "Router management plane accepts unencrypted telnet",
  },
  {
    role: "Action bar title",
    where: "ActionBar",
    cls: "text-[17px] font-semibold leading-tight tracking-[-0.015em]",
    spec: "17 · 600 · −0.015em",
    sample: "Account Management",
  },
  {
    role: "Modal title",
    where: "Modal",
    cls: "text-[15px] font-medium tracking-[-0.01em]",
    spec: "15 · 500 · −0.01em",
    sample: "Submit for authorization",
  },
  {
    role: "Card title",
    where: "CardHeader, Drawer",
    cls: "text-[14px] font-medium tracking-[-0.01em]",
    spec: "14 · 500 · −0.01em",
    sample: "Control status",
  },
  {
    role: "Section title",
    where: "Section, Block, Disclosure",
    cls: "text-[13px] font-medium tracking-[-0.005em]",
    spec: "13 · 500 · −0.005em",
    sample: "Implementation narrative",
  },
  {
    role: "Body",
    where: "cells, buttons, tabs",
    cls: "text-[13px]",
    spec: "13 · 400",
    sample: "The IOS-XE management VTY lines still allow telnet alongside SSH.",
  },
  {
    role: "Label",
    where: "Field, Th, Badge",
    cls: "text-[12px] font-medium",
    spec: "12 · 500",
    sample: "Authorizing official",
  },
  {
    role: "Secondary",
    where: "KeyValue, descriptions",
    cls: "text-[12.5px] text-muted-foreground",
    spec: "12.5 · 400 · muted",
    sample: "Compensating control documented in the SSP.",
  },
  {
    role: "Caption",
    where: "meta, timestamps",
    cls: "text-[11.5px] text-muted-foreground",
    spec: "11.5 · 400 · muted",
    sample: "Last scanned 4 hours ago by ACAS",
  },
  {
    role: "Eyebrow",
    where: "Inspector, sidebar groups",
    cls: "text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/80",
    spec: "11 · 500 · caps · +0.06em",
    sample: "Ownership",
  },
  {
    role: "Count chip",
    where: "Tabs, Block, RelatedCard",
    cls: "tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground",
    spec: "11 · 500 · tnum",
    sample: "37",
  },
  {
    role: "Identifier",
    where: "Mono, IdCell",
    cls: "tnum text-[13px]",
    spec: "13 · 400 · tnum · inherits",
    sample: "FND-2231 · AC-2(3) · PKG-2026-114",
  },
];

export const Roles: Story = {
  render: () => (
    <Sheet
      title="Typography"
      lede="Inter for everything, identifiers included. Body is 13px; UI text runs smaller than web defaults. Each row is rendered with the app's own classes. Weight 500 for every UI heading; 600 only for page and record titles."
    >
      <div className="divide-y divide-border-subtle">
        {roles.map((r) => (
          <div
            key={r.role}
            className="grid grid-cols-[minmax(0,1fr)_170px_190px] items-baseline gap-6 py-3"
          >
            <div className="min-w-0 truncate">
              <span className={cn(r.cls)}>{r.sample}</span>
            </div>
            <div className="text-[12px] text-foreground">
              {r.role}
              <div className="text-[11.5px] text-muted-foreground">{r.where}</div>
            </div>
            <Spec>{r.spec}</Spec>
          </div>
        ))}
      </div>
    </Sheet>
  ),
};

const ladder = [
  { cls: "text-11", spec: "11 / 14" },
  { cls: "text-12", spec: "12 / 16" },
  { cls: "text-13", spec: "13 / 18" },
  { cls: "text-15", spec: "15 / 22" },
  { cls: "text-20", spec: "20 / 26" },
];

export const Families: Story = {
  render: () => (
    <Sheet title="Family & ladder">
      <Group title="Inter" note="font-sans · cv11 ss01" cols={1}>
        <div className="space-y-1">
          <div className="text-[22px] font-semibold tracking-[-0.02em]">
            Continuous authorization for the ground segment
          </div>
          <div className="text-[13px]">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
          </div>
          <div className="text-[13px] text-muted-foreground">
            Regular 400 · <span className="font-medium text-foreground">Medium 500</span> ·{" "}
            <span className="font-semibold text-foreground">Semibold 600</span>
          </div>
        </div>
      </Group>

      <Group title="Identifiers & values" note="same face · tnum only" cols={1}>
        <div className="tnum space-y-1 text-[13px]">
          <div>AC-2(3) · SC-8(1) · IA-2(1) · AU-11 · SR-4</div>
          <div>FND-2231 · POAM-0042 · PKG-2026-114 · CCI-002418</div>
          <div className="text-muted-foreground">0123456789 · 99.982% · 2026-08-27T14:02Z</div>
        </div>
      </Group>

      <Group title="Frozen ladder" note="--text-11 … --text-20 in styles.css" cols={5}>
        {ladder.map((l) => (
          <div key={l.cls} className="space-y-1">
            <div className={cn(l.cls, "truncate")}>Satisfied controls</div>
            <Spec>
              {l.cls} · {l.spec}
            </Spec>
          </div>
        ))}
      </Group>

      <Group title="Tabular numerals" note="tnum · columns align on scan" cols={2}>
        <div>
          <div className="mb-1 text-[11.5px] text-muted-foreground">proportional</div>
          <div className="w-[120px] text-right text-[13px]">
            <div>1,204</div>
            <div>37</div>
            <div>91.4%</div>
            <div>11,118</div>
          </div>
        </div>
        <div>
          <div className="mb-1 text-[11.5px] text-muted-foreground">tabular (tnum)</div>
          <div className="tnum w-[120px] text-right text-[13px]">
            <div>1,204</div>
            <div>37</div>
            <div>91.4%</div>
            <div>11,118</div>
          </div>
        </div>
      </Group>
    </Sheet>
  ),
};
