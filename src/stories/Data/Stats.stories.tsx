import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stat } from "@/components/app/ui";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Data/Stats",
  component: Stat.Tile,
  tags: ["autodocs"],
  args: { label: "Re-tests owed", value: 400, note: "distinct requirement and component" },
  argTypes: {
    tone: {
      control: "inline-radio",
      options: ["neutral", "success", "warning", "danger", "info"],
    },
    label: { control: "text" },
    note: { control: "text" },
    value: { control: "number" },
  },
} satisfies Meta<typeof Stat.Tile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Stat.Grid cols={4}>
      <Stat.Tile {...args} />
    </Stat.Grid>
  ),
};

/** The ingestion and baseline summaries: six framed tiles, zero muted, tone only where it means something. */
export const CardTiles: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[1000px] space-y-2">
      <Spec>Tiles · frame card · cols 6</Spec>
      <Stat.Grid cols={6}>
        <Stat.Tile label="Native records" value={1284} note="read from scan-2026-08-30.ckl" />
        <Stat.Tile label="Normalized" value={1284} note="mapped to the common record" />
        <Stat.Tile label="Clean" value={1102} note="passing checks kept as coverage evidence" />
        <Stat.Tile label="Folded in" value={97} note="results another source already reported" />
        <Stat.Tile
          label="Held for analyst"
          value={14}
          note="rows an analyst must decide"
          tone="warning"
        />
        <Stat.Tile
          label="Contested"
          value={0}
          note="closures the assessor disputes"
          tone="danger"
        />
      </Stat.Grid>
    </div>
  ),
};

/** Phase readiness: five tiles run edge to edge between two rules. */
export const BandTiles: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[1000px] space-y-2">
      <Spec>Tiles · frame band · cols 5</Spec>
      <Stat.Grid cols={5} frame="band">
        <Stat.Tile label="Entry" value="6/6" note="criteria met" tone="success" />
        <Stat.Tile label="Exit" value="3/7" note="criteria met" tone="warning" />
        <Stat.Tile label="Derived" value="12" note="scenarios from the attack surface" />
        <Stat.Tile label="Attested" value="9" note="with a signed result" />
        <Stat.Tile
          label="Unsigned"
          value="3"
          note="attestations awaiting signature"
          tone="danger"
        />
      </Stat.Grid>
    </div>
  ),
};

/** SCTM and campaign summaries: bare numbers in a plain grid, no frame. */
export const Stats: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[720px] space-y-2">
      <Spec>Stat · grid-cols-2 gap-x-8 md:grid-cols-4</Spec>
      <div className="grid grid-cols-2 gap-x-8 md:grid-cols-4">
        <Stat label="Requirement rows" value={412} />
        <Stat label="Satisfied" value={286} tone="success" />
        <Stat label="Gaps" value={23} tone="danger" />
        <Stat label="Unevidenced" value={41} tone="warning" />
      </div>
    </div>
  ),
};
