import type { Meta, StoryObj } from "@storybook/react-vite";

import { Group, Page, Spec, under } from "../_lib/sheet";

const meta = { title: "Tokens/Space", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = {
  render: () => (
    <Page
      title="Space"
      lede={
        "Tier 3. Consumed through primitive props (space='space.100') and, inside the package, through the regenerated spacing utilities (gap-100, p-150). Tailwind's numeric scale is reset: p-4 does not exist. Negative steps exist for Bleed only."
      }
    >
      <Group title="scale">
        <div className="flex flex-col gap-100">
          {under("space")
            .filter((d) => !d.name.includes("negative"))
            .map((d) => (
              <div
                key={d.name}
                className="grid grid-cols-[120px_80px_minmax(0,1fr)_minmax(0,2fr)] items-center gap-300"
              >
                <span className="font-body text-default">{d.name}</span>
                <Spec>{d.light}</Spec>
                <div
                  className="h-150 rounded-xsmall bg-brand-bold"
                  style={{ width: `var(${d.cssVar})` }}
                />
                <span className="font-body-small text-subtle">{d.description}</span>
              </div>
            ))}
        </div>
      </Group>
    </Page>
  ),
};
