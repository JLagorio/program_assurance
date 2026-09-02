import type { Meta, StoryObj } from "@storybook/react-vite";

import { Group, Page, Spec, under } from "../_lib/sheet";

const meta = { title: "Tokens/Metrics", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Bars({ prefix }: { prefix: string }) {
  return (
    <div className="flex items-end gap-300">
      {under(prefix).map((d) => (
        <div key={d.name} className="flex flex-col items-start gap-050">
          <div
            className="flex w-[96px] items-center justify-center rounded-medium bg-brand-subtlest font-body-small text-brand"
            style={{ height: `var(${d.cssVar})` }}
          >
            {d.light}
          </div>
          <span className="font-body text-default">{d.name.split(".").slice(-1)[0]}</span>
          <Spec>{d.utility}</Spec>
        </div>
      ))}
    </div>
  );
}

export const Dimension: Story = {
  render: () => (
    <Page
      title="Metrics"
      lede="Tier 5, our extension: Atlassian leaves control heights to components, this system needs them as a themed axis. Motion is one duration pair and one curve."
    >
      <Group title="dimension.control">
        <Bars prefix="dimension.control" />
      </Group>
      <Group title="dimension.row">
        <Bars prefix="dimension.row" />
      </Group>
      <Group title="dimension.icon">
        <div className="flex items-end gap-300">
          {under("dimension.icon").map((d) => (
            <div key={d.name} className="flex flex-col items-start gap-050">
              <div className="rounded-small bg-neutral-bold" style={{ width: `var(${d.cssVar})`, height: `var(${d.cssVar})` }} />
              <span className="font-body text-default">{d.name.split(".").slice(-1)[0]}</span>
              <Spec>{d.utility}</Spec>
              <Spec>{d.light}</Spec>
            </div>
          ))}
        </div>
      </Group>
      <Group title="motion">
        <div className="flex flex-col gap-050">
          {under("motion").map((d) => (
            <div key={d.name} className="grid grid-cols-[220px_160px_minmax(0,1fr)] gap-300">
              <span>{d.name}</span>
              <Spec>{d.utility}</Spec>
              <Spec>{d.light}</Spec>
            </div>
          ))}
        </div>
      </Group>
    </Page>
  ),
};
