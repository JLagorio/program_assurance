import type { Meta, StoryObj } from "@storybook/react-vite";

import { Group, Page, Spec, under } from "../_lib/sheet";

const meta = { title: "Tokens/Typography", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const sample = "Control SC-7(5) · Boundary protection · Deny by default, allow by exception";

const composites = [
  "font.heading.medium",
  "font.heading.small",
  "font.heading.xsmall",
  "font.body.large",
  "font.body",
  "font.body.small",
  "font.body.xsmall",
  "font.code",
];

export const Specimen: Story = {
  render: () => (
    <Page
      title="Typography"
      lede="Tier 2. A type token is one font shorthand: family, weight, size, leading, and its letter-spacing. Labels are font.body.small plus font.weight.medium, not a size of their own. No half pixels exist."
    >
      <Group title="composites">
        <div className="flex flex-col divide-y divide-[var(--ds-color-border)]">
          {composites.map((name) => {
            const d = under(name).find((x) => x.name === name);
            if (!d) return null;
            return (
              <div key={name} className="grid grid-cols-[220px_minmax(0,1fr)] items-baseline gap-300 py-150">
                <div className="flex flex-col gap-025">
                  <span className="font-body text-default">{name}</span>
                  <Spec>{d.utility}</Spec>
                  <Spec>{d.light}</Spec>
                </div>
                <div className={d.utility ?? ""}>{sample}</div>
              </div>
            );
          })}
        </div>
      </Group>
      <Group title="weights, on font.body">
        <div className="flex gap-400">
          {["font-regular", "font-medium", "font-semibold"].map((w) => (
            <div key={w} className="flex flex-col gap-050">
              <span className={`font-body ${w}`}>{sample.split(" · ")[1]}</span>
              <Spec>{w}</Spec>
            </div>
          ))}
        </div>
      </Group>
      <Group title="families">
        <div className="flex flex-col gap-050">
          {under("font.family").map((d) => (
            <div key={d.name} className="grid grid-cols-[220px_minmax(0,1fr)] gap-300">
              <span>{d.name}</span>
              <Spec>{d.light}</Spec>
            </div>
          ))}
        </div>
      </Group>
    </Page>
  ),
};
