import type { Meta, StoryObj } from "@storybook/react-vite";

import { Group, Page, TokenTable, under } from "../_lib/sheet";

const meta = { title: "Tokens/Color", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const lede =
  "Tier 1. Every value is a ramp step per mode. A state (hovered, pressed) is its own token, never alpha on a base token. Utilities are generated per property: a text token is only reachable as text-*, a background token only as bg-*.";

export const Background: Story = {
  render: () => (
    <Page title="Color · background" lede={lede}>
      {[
        "neutral",
        "brand",
        "selected",
        "danger",
        "warning",
        "success",
        "information",
        "disabled",
        "input",
        "inverse",
      ].map((role) => (
        <Group key={role} title={role}>
          <TokenTable rows={under(`color.background.${role}`)} />
        </Group>
      ))}
      <Group title="blanket · skeleton">
        <TokenTable rows={[...under("color.blanket"), ...under("color.skeleton")]} />
      </Group>
    </Page>
  ),
};

export const Text: Story = {
  render: () => (
    <Page title="Color · text" lede={lede}>
      <TokenTable rows={under("color.text")} />
    </Page>
  ),
};

export const Icon: Story = {
  render: () => (
    <Page
      title="Color · icon"
      lede="Icons mirror text, one step bolder where a thin glyph needs it. Reached as icon-*."
    >
      <TokenTable rows={under("color.icon")} />
    </Page>
  ),
};

export const Border: Story = {
  render: () => (
    <Page title="Color · border" lede={lede}>
      <TokenTable rows={under("color.border")} />
    </Page>
  ),
};

export const Elevation: Story = {
  render: () => (
    <Page
      title="Elevation"
      lede="Surfaces pair with shadows: raised with shadow.raised, overlay with shadow.overlay. In dark, surfaces climb in lightness instead of casting more shadow. utility.elevation.surface.current is set by surface-owning components and read by sticky and masking children."
    >
      <Group title="surface">
        <TokenTable
          rows={[...under("elevation.surface"), ...under("utility.elevation.surface.current")]}
        />
      </Group>
      <Group title="shadow">
        <TokenTable rows={under("elevation.shadow")} />
      </Group>
      <Group title="opacity">
        <TokenTable rows={under("opacity")} />
      </Group>
    </Page>
  ),
};

export const Chart: Story = {
  render: () => (
    <Page
      title="Color · chart"
      lede="Tier 1 for data. Every series on a chart is one of these, and nothing else reaches the teal and purple ramps. The same step in both modes, so a chart weighs the same on either surface. The categorical order is validated for deutan and protan vision in both modes: assign in order, never by rank, and fold a seventh category into Other."
    >
      <Group title="series · a status, brand, context, the track">
        <TokenTable
          rows={under("color.chart").filter((d) => !/categorical|sequential|diverging/.test(d.name))}
        />
      </Group>
      <Group title="categorical · six hues in order, then Other">
        <TokenTable rows={under("color.chart.categorical")} />
      </Group>
      <Group title="sequential · one hue, near zero to the most">
        <TokenTable rows={under("color.chart.sequential")} />
      </Group>
      <Group title="diverging · negative, midpoint, positive">
        <TokenTable rows={under("color.chart.diverging")} />
      </Group>
    </Page>
  ),
};
