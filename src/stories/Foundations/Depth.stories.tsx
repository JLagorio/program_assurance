import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";

import { cn } from "@/lib/utils";

import { Group, Sheet, Spec, useComputed, useCssVar } from "../_lib/tokens";

const meta = {
  title: "Foundations/Depth",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const radii = [
  { cls: "rounded-sm", where: "count chips, kbd" },
  { cls: "rounded-[5px]", where: "Badge" },
  { cls: "rounded-md", where: "controls, menu items" },
  { cls: "rounded-lg", where: "cards, menus" },
  { cls: "rounded-xl", where: "modals" },
  { cls: "rounded-full", where: "dots, meters, avatars" },
];

function RadiusBox({ cls, where }: { cls: string; where: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const value = useComputed(ref, "border-top-left-radius");
  return (
    <div className="space-y-1.5">
      <div ref={ref} className={cn("h-14 w-full border border-border-strong bg-card", cls)} />
      <Spec>
        {cls} · {value || "…"}
      </Spec>
      <div className="text-[11.5px] text-muted-foreground">{where}</div>
    </div>
  );
}

export const Radius: Story = {
  render: () => (
    <Sheet
      title="Radius"
      lede="One base radius drives the scale. Measured values are read from the rendered box, so the Theme toolbar shows each sheet's real corners."
    >
      <Group title="Scale" note={<BaseRadius />} cols={6}>
        {radii.map((r) => (
          <RadiusBox key={r.cls} {...r} />
        ))}
      </Group>
    </Sheet>
  ),
};

function BaseRadius() {
  const v = useCssVar("--radius");
  return <span className="font-mono">--radius: {v || "…"}</span>;
}

const shadows = [
  { cls: "shadow-hairline", token: "--shadow-hairline", where: "flat separation without a border" },
  { cls: "shadow-button", token: "--shadow-button", where: "secondary and icon buttons" },
  { cls: "shadow-raised", token: "--shadow-raised", where: "raised cards, popovers" },
  { cls: "shadow-pop", token: "--shadow-pop", where: "modals, dropdown menus" },
];

function ShadowBox({ cls, token, where }: { cls: string; token: string; where: string }) {
  const value = useCssVar(token);
  return (
    <div className="space-y-2">
      <div className={cn("flex h-20 items-center justify-center rounded-lg bg-card", cls)}>
        <span className="text-[12px] text-muted-foreground">{cls}</span>
      </div>
      <div
        className="truncate font-mono text-[11px] tracking-tight text-muted-foreground"
        title={value}
      >
        {value || "—"}
      </div>
      <div className="text-[11.5px] text-muted-foreground">{where}</div>
    </div>
  );
}

export const Elevation: Story = {
  render: () => (
    <Sheet
      title="Elevation"
      lede="Hairline plus soft lift, never heavy. Shown on the page's second surface so the lift reads."
    >
      <div className="rounded-lg bg-surface-2 p-6">
        <Group title="Tiers" cols={4}>
          {shadows.map((s) => (
            <ShadowBox key={s.cls} {...s} />
          ))}
        </Group>
      </div>

      <Group
        title="Filled buttons"
        note="shadow-button-primary · flat fill, soft drop, no ring"
        cols={3}
      >
        <div className="space-y-2">
          <div className="flex h-20 items-center justify-center rounded-lg bg-surface-2">
            <span className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[13px] font-medium text-primary-foreground shadow-button-primary">
              Submit package
            </span>
          </div>
          <LitValue />
        </div>
        <div className="space-y-2">
          <div className="flex h-20 items-center justify-center rounded-lg bg-surface-2">
            <span className="inline-flex h-8 items-center rounded-md bg-danger px-3 text-[13px] font-medium text-primary-foreground shadow-button-primary">
              Delete finding
            </span>
          </div>
          <div className="text-[11.5px] text-muted-foreground">danger · same token</div>
        </div>
        <div className="space-y-2">
          <div className="flex h-20 items-center justify-center rounded-lg bg-surface-2">
            <span className="inline-flex h-8 items-center rounded-md bg-card px-3 text-[13px] font-medium text-foreground shadow-button">
              Export
            </span>
          </div>
          <div className="text-[11.5px] text-muted-foreground">secondary · shadow-button</div>
        </div>
      </Group>
    </Sheet>
  ),
};

function LitValue() {
  const v = useCssVar("--shadow-button-primary");
  return (
    <div className="truncate font-mono text-[11px] tracking-tight text-muted-foreground" title={v}>
      {v || "—"}
    </div>
  );
}
