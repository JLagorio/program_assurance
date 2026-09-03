import type { Meta, StoryObj } from "@storybook/react-vite";

import { Group, Mode, Page, Spec, under } from "../_lib/sheet";

const meta = { title: "Tokens/Palette", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const ramps: { key: string; title: string; on: "light" | "dark" }[] = [
  { key: "color.neutral", title: "Neutral", on: "light" },
  { key: "color.darkNeutral", title: "Dark neutral", on: "dark" },
  { key: "color.blue", title: "Blue — brand, selected, information, focus", on: "light" },
  { key: "color.green", title: "Green — success", on: "light" },
  { key: "color.orange", title: "Orange — warning", on: "light" },
  { key: "color.red", title: "Red — danger", on: "light" },
];

function Ramp({ prefix, on }: { prefix: string; on: "light" | "dark" }) {
  const steps = under(prefix).filter((d) => d.name !== prefix);
  return (
    <Mode mode={on} className="flex flex-wrap gap-100 rounded-large p-150">
      {steps.map((d) => (
        <div key={d.name} className="flex w-[84px] flex-col gap-050">
          <div
            className="h-600 rounded-medium"
            style={{
              backgroundColor: `var(${d.cssVar})`,
              boxShadow: "inset 0 0 0 1px var(--ds-color-border)",
            }}
          />
          <span className="font-body-small text-default">{d.name.split(".").pop()}</span>
          <Spec>{d.light.replace("oklch", "").replace(/[()]/g, "")}</Spec>
        </div>
      ))}
    </Mode>
  );
}

export const Ramps: Story = {
  render: () => (
    <Page
      title="Palette"
      lede="Tier 0. Six ramps with Atlassian's step names, so their semantic-to-step mapping applies line for line. Alpha steps (100A–500A) are the hover, pressed and hairline fills. Every value is a draft seeded from Linear-refined light and Nightwatch dark; tune here, never in a semantic token."
    >
      {ramps.map((r) => (
        <Group key={r.key} title={r.title}>
          <Ramp prefix={r.key} on={r.on} />
        </Group>
      ))}
    </Page>
  ),
};
