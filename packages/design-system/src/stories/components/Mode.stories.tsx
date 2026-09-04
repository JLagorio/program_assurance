import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  DENSITY_STORAGE_KEY,
  DensityProvider,
  DensitySwitch,
  MODE_STORAGE_KEY,
  ModeProvider,
  ModeSwitch,
  useDensity,
  useMode,
  type ColorMode,
  type Density,
} from "../../mode";
import { Table } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Mode switch",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

function Resolved() {
  const { mode, resolved } = useMode();
  return (
    <Text size="small" color="color.text.subtle">
      Choice: {mode} · on screen: {resolved} · stored under {MODE_STORAGE_KEY}
    </Text>
  );
}

/** The provider and the control together. The choice is stored in this browser and applied to the root, so it outlives the toolbar's setting until you change either. */
export const Live: Story = {
  render: () => (
    <ModeProvider>
      <Stack space="space.150">
        <ModeSwitch />
        <Resolved />
      </Stack>
    </ModeProvider>
  ),
};

function Controlled() {
  const [mode, setMode] = useState<ColorMode>("dark");
  return (
    <Stack space="space.150">
      <ModeSwitch value={mode} onChange={setMode} showLabels />
      <Text size="small" color="color.text.subtle">
        Held by the story, not stored: {mode}
      </Text>
    </Stack>
  );
}
/** `value` and `onChange` override the provider, for a settings form that commits later. */
export const ControlledStory: Story = { name: "Controlled", render: () => <Controlled /> };

/** Each state, icons only and with labels. Nothing here touches the root. */
export const ModeMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["icons", "labels"] as const}
        cols={["light", "dark", "system"] as const}
        rowLabel="form"
        render={(form, mode) => (
          <ModeSwitch value={mode} onChange={() => {}} showLabels={form === "labels"} />
        )}
      />
      <Specimens title="In a row of chrome">
        <Inline space="space.100" alignBlock="center">
          <Text size="small" color="color.text.subtle">
            Appearance
          </Text>
          <ModeSwitch value="system" onChange={() => {}} />
        </Inline>
      </Specimens>
    </Stack>
  ),
};

function DensityReadout() {
  const { density } = useDensity();
  return (
    <Text size="small" color="color.text.subtle">
      Choice: {density} · stored under {DENSITY_STORAGE_KEY} · every table follows
    </Text>
  );
}

const specimenRows = [
  ["CTRL-0412", "Segregation of duties, payables", "Verified"],
  ["CTRL-0418", "Privileged access review", "Overdue"],
  ["CTRL-0421", "Firewall rule recertification", "In review"],
] as const;

function SpecimenTable() {
  return (
    <Table>
      <thead>
        <tr>
          <Table.Header width={110}>ID</Table.Header>
          <Table.Header>Control</Table.Header>
          <Table.Header width={100}>Status</Table.Header>
        </tr>
      </thead>
      <tbody>
        {specimenRows.map(([id, name, status]) => (
          <Table.Row key={id}>
            <Table.Id id={id} />
            <Table.Cell>{name}</Table.Cell>
            <Table.Cell>{status}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** Density is a setting, not a prop: the provider sets `data-density` on the root and every table follows. The choice is stored in this browser. */
export const DensityLive: Story = {
  name: "Density, live",
  render: () => (
    <DensityProvider>
      <Stack space="space.150">
        <DensitySwitch />
        <DensityReadout />
        <SpecimenTable />
      </Stack>
    </DensityProvider>
  ),
};

function DensityControlled() {
  const [density, setDensity] = useState<Density>("compact");
  return (
    <Stack space="space.150">
      <DensitySwitch value={density} onChange={setDensity} showLabels />
      <div data-density={density === "compact" ? "compact" : undefined}>
        <SpecimenTable />
      </div>
    </Stack>
  );
}
/** `value` and `onChange` override the provider; here the attribute sits on one frame, which is how a table that is compact by design (a picker's) opts in alone. */
export const DensityControlledStory: Story = {
  name: "Density, one frame",
  render: () => <DensityControlled />,
};

/** Each state, icons only and with labels; then the two row heights side by side. */
export const DensityMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["icons", "labels"] as const}
        cols={["default", "compact"] as const}
        rowLabel="form"
        render={(form, density) => (
          <DensitySwitch value={density} onChange={() => {}} showLabels={form === "labels"} />
        )}
      />
      <Specimens title="Default, 40px rows">
        <SpecimenTable />
      </Specimens>
      <Specimens title="Compact, 36px rows">
        <div data-density="compact">
          <SpecimenTable />
        </div>
      </Specimens>
    </Stack>
  ),
};
