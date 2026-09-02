import type { Meta, StoryObj } from "@storybook/react-vite";

import { Group, Page, Spec } from "../_lib/tokens";

const meta = {
  title: "Tokens/Density",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/* "today" is what the components render now. "linear" is the height measured
   from Linear's design file (see the kit's repo-handoff.md). Where they differ,
   that is a decision waiting for the matching primitive step. */
const heights: { name: string; where: string; today: number; linear: number | null }[] = [
  { name: "Button xs", where: "h-6", today: 24, linear: 24 },
  { name: "Button sm", where: "h-7 · chips · menu item · sidebar item", today: 28, linear: 28 },
  { name: "Button md", where: "h-8", today: 32, linear: 32 },
  { name: "Icon button", where: "size-7", today: 28, linear: 28 },
  { name: "Input", where: "h-8", today: 32, linear: 30 },
  { name: "DropdownMenu item", where: "h-7", today: 28, linear: 32 },
  { name: "Table header", where: "h-8", today: 32, linear: 36 },
  { name: "Table row", where: "h-10", today: 40, linear: 44 },
  { name: "Top bar", where: "h-14", today: 56, linear: null },
];

function Bar({ px, tone }: { px: number; tone: "today" | "linear" }) {
  return (
    <div
      className={
        tone === "today"
          ? "flex w-[72px] items-center justify-center rounded-md bg-primary-soft text-[11px] text-primary"
          : "flex w-[72px] items-center justify-center rounded-md bg-muted text-[11px] text-muted-foreground"
      }
      style={{ height: px }}
    >
      {px}
    </div>
  );
}

export const ControlHeights: Story = {
  render: () => (
    <Page
      title="Density"
      lede="Compact and data-dense, never cramped. Left bar is today; right bar is the height Linear's file measures. Equal bars need no decision."
    >
      <div className="divide-y divide-border-subtle">
        {heights.map((h) => (
          <div
            key={h.name}
            className="grid grid-cols-[200px_minmax(0,1fr)_160px] items-center gap-6 py-3"
          >
            <div>
              <div className="text-[13px] font-medium">{h.name}</div>
              <div className="text-[11.5px] text-muted-foreground">{h.where}</div>
            </div>
            <div className="flex items-end gap-2">
              <Bar px={h.today} tone="today" />
              {h.linear !== null ? (
                <Bar px={h.linear} tone="linear" />
              ) : (
                <div className="flex h-6 w-[72px] items-center justify-center text-[11px] text-muted-foreground">
                  —
                </div>
              )}
            </div>
            <Spec>
              {h.linear === null
                ? "no Linear counterpart"
                : h.linear === h.today
                  ? "aligned"
                  : `${h.today} → ${h.linear} (${h.linear - h.today > 0 ? "+" : ""}${h.linear - h.today})`}
            </Spec>
          </div>
        ))}
      </div>
    </Page>
  ),
};

const steps = [
  { cls: "gap-1", px: 4, use: "icon to label" },
  { cls: "gap-1.5", px: 6, use: "inside chips, badges" },
  { cls: "gap-2", px: 8, use: "control clusters" },
  { cls: "gap-3", px: 12, use: "cell padding, form grids" },
  { cls: "gap-4", px: 16, use: "card padding, header to actions" },
  { cls: "gap-6", px: 24, use: "page regions" },
  { cls: "gap-8", px: 32, use: "shell gutters" },
];

export const Spacing: Story = {
  render: () => (
    <Page title="Spacing" lede="A 4px grid with a 2px half-step at the smallest sizes.">
      <Group title="Steps" cols={7}>
        {steps.map((s) => (
          <div key={s.cls} className="space-y-1.5">
            <div className="flex h-10 items-end">
              <div className="rounded-sm bg-primary" style={{ width: s.px, height: s.px }} />
            </div>
            <Spec>
              {s.cls} · {s.px}
            </Spec>
            <div className="text-[11.5px] text-muted-foreground">{s.use}</div>
          </div>
        ))}
      </Group>

      <Group
        title="Padding in practice"
        note="cell px-3 · card header px-4 py-3 · modal px-5 py-4"
        cols={3}
      >
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-3 py-2 text-[12px] font-medium text-muted-foreground">
            Table cell · px-3
          </div>
          <div className="h-10 px-3 text-[13px] leading-10">AC-2 Account Management</div>
        </div>
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3 text-[14px] font-semibold tracking-[-0.01em]">
            Card header · px-4 py-3
          </div>
          <div className="px-4 py-3 text-[13px] text-muted-foreground">Body</div>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-pop">
          <div className="border-b border-border px-5 py-3.5 text-[15px] font-semibold tracking-[-0.01em]">
            Dialog · px-5 py-3.5
          </div>
          <div className="px-5 py-4 text-[13px] text-muted-foreground">Body · px-5 py-4</div>
        </div>
      </Group>
    </Page>
  ),
};
