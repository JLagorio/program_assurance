import type { Meta, StoryObj } from "@storybook/react-vite";

import { Group, Page, Spec, under } from "../_lib/sheet";

const meta = { title: "Tokens/Shape", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Radius: Story = {
  render: () => (
    <Page
      title="Shape"
      lede="Tier 4. Named absolute steps, seeded from Linear-refined's 5px base. Badges small, controls medium, cards large, dialogs xlarge. Bare `rounded` is banned: it is a static 4px no reset can remove."
    >
      <Group title="radius">
        <div className="flex flex-wrap gap-300">
          {under("radius").map((d) => (
            <div key={d.name} className="flex w-[132px] flex-col gap-050">
              <div
                className="h-800 border border-bold bg-surface-raised"
                style={{ borderRadius: `var(${d.cssVar})` }}
              />
              <span className="font-body text-default">{d.name}</span>
              <Spec>{d.utility}</Spec>
              <Spec>{d.light}</Spec>
              <span className="font-body-small text-subtle">{d.description}</span>
            </div>
          ))}
        </div>
      </Group>
      <Group title="border width">
        <div className="flex flex-wrap gap-300">
          {under("border.width").map((d) => (
            <div key={d.name} className="flex w-[180px] flex-col gap-050">
              <div
                className="h-600 rounded-medium bg-surface"
                style={{
                  border: `var(${d.cssVar}) solid ${d.name.endsWith("focused") ? "var(--ds-color-border-focused)" : d.name.endsWith("selected") ? "var(--ds-color-border-selected)" : "var(--ds-color-border-bold)"}`,
                }}
              />
              <span className="font-body text-default">{d.name}</span>
              <Spec>{d.utility}</Spec>
              <Spec>{d.light}</Spec>
            </div>
          ))}
        </div>
      </Group>
    </Page>
  ),
};
